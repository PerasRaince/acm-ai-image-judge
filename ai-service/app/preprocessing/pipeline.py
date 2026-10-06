"""
Image Preprocessing and Validation Pipeline.
Ensures image integrity, canonical RGB conversion, decompression bomb prevention,
EXIF orientation correction, dimension verification, and SHA-256 calculation.
"""

import hashlib
import io
from typing import Optional, Tuple, Dict, Any
from PIL import Image, ImageOps
import torch
import torchvision.transforms as T

# Guard against decompression bomb attacks
Image.MAX_IMAGE_PIXELS = 40_000_000

# Canonical model image transformations
STANDARD_TENSOR_TRANSFORM = T.Compose([
    T.Resize((224, 224), interpolation=T.InterpolationMode.BICUBIC, antialias=True),
    T.ToTensor(),
    T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

LPIPS_TENSOR_TRANSFORM = T.Compose([
    T.Resize((256, 256), interpolation=T.InterpolationMode.BICUBIC, antialias=True),
    T.ToTensor(),
    # LPIPS expects input in range [-1, 1]
    T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])


class ImageValidationError(Exception):
    """Raised when an uploaded image fails integrity or validation checks."""
    def __init__(self, message: str, code: str = "INVALID_IMAGE"):
        super().__init__(message)
        self.code = code


class PreprocessedImage:
    def __init__(
        self,
        pil_image: Image.Image,
        sha256: str,
        width: int,
        height: int,
        aspect_ratio: float,
        format_name: str,
        raw_bytes_len: int
    ):
        self.pil_image = pil_image
        self.sha256 = sha256
        self.width = width
        self.height = height
        self.aspect_ratio = aspect_ratio
        self.format_name = format_name
        self.raw_bytes_len = raw_bytes_len

    def to_standard_tensor(self, device: str = "cpu") -> torch.Tensor:
        """Standard ImageNet-normalized 224x224 tensor [1, 3, 224, 224]."""
        tensor = STANDARD_TENSOR_TRANSFORM(self.pil_image).unsqueeze(0)
        return tensor.to(device)

    def to_lpips_tensor(self, device: str = "cpu") -> torch.Tensor:
        """LPIPS normalized 256x256 tensor [-1, 1] [1, 3, 256, 256]."""
        tensor = LPIPS_TENSOR_TRANSFORM(self.pil_image).unsqueeze(0)
        return tensor.to(device)


def compute_sha256(data: bytes) -> str:
    """Computes SHA-256 hexadecimal digest of raw image bytes."""
    hasher = hashlib.sha256()
    hasher.update(data)
    return hasher.hexdigest()


def verify_magic_bytes(data: bytes) -> str:
    """
    Validates file signature magic numbers.
    Returns detected format ('JPEG', 'PNG', 'WEBP') or raises ImageValidationError.
    """
    if len(data) < 12:
        raise ImageValidationError("File is too small to be a valid image.", "FILE_TOO_SMALL")

    # JPEG: starts with FF D8 FF
    if data[:3] == b"\xff\xd8\xff":
        return "JPEG"

    # PNG: starts with 89 50 4E 47 0D 0A 1A 0A
    if data[:8] == b"\x89PNG\r\n\x1a\n":
        return "PNG"

    # WEBP: starts with RIFF .... WEBP
    if data[:4] == b"RIFF" and data[8:12] == b"WEBP":
        return "WEBP"

    raise ImageValidationError(
        "Invalid image signature. Supported formats: JPEG, PNG, WEBP.",
        "UNSUPPORTED_FORMAT"
    )


def validate_aspect_ratio(
    aspect_ratio: float,
    required_ratio_str: str,
    tolerance: float = 0.06
) -> bool:
    """
    Validates whether the actual aspect ratio matches the competition requirement
    within acceptable tolerance (e.g. 6% margin to accommodate minor rounding).
    """
    if not required_ratio_str or required_ratio_str.lower() in ("any", "none"):
        return True

    target_ratios = {
        "1:1": 1.0,
        "16:9": 16.0 / 9.0,
        "9:16": 9.0 / 16.0,
        "4:3": 4.0 / 3.0,
        "3:4": 3.0 / 4.0,
        "21:9": 21.0 / 9.0
    }

    target = target_ratios.get(required_ratio_str)
    if target is None:
        # If unknown ratio string, accept by default
        return True

    return abs(aspect_ratio - target) / target <= tolerance


def preprocess_image_bytes(
    data: bytes,
    required_aspect_ratio: Optional[str] = "any",
    min_dimension: int = 64,
    max_dimension: int = 4096
) -> PreprocessedImage:
    """
    Canonical preprocessing pipeline:
    1. Validates magic bytes signature
    2. Computes exact SHA-256 hash
    3. Safely decodes image with decompression bomb guard
    4. Corrects EXIF orientation
    5. Converts to canonical 3-channel RGB (blending alpha onto solid white background)
    6. Validates dimension bounds and aspect ratio
    """
    # 1. Magic bytes check
    format_name = verify_magic_bytes(data)

    # 2. SHA-256
    sha256 = compute_sha256(data)

    # 3. Decode image safely
    try:
        raw_img = Image.open(io.BytesIO(data))
        raw_img.verify()
    except Exception as e:
        raise ImageValidationError(f"Corrupted or invalid image payload: {str(e)}", "CORRUPT_IMAGE")

    # Reopen because verify() closes or invalidates the stream
    raw_img = Image.open(io.BytesIO(data))

    # 4. EXIF orientation correction
    try:
        raw_img = ImageOps.exif_transpose(raw_img)
    except Exception:
        pass  # If EXIF reading fails, continue with original orientation

    # 5. Canonical RGB conversion with alpha channel handling
    if raw_img.mode in ("RGBA", "LA") or (raw_img.mode == "P" and "transparency" in raw_img.info):
        rgba_img = raw_img.convert("RGBA")
        background = Image.new("RGBA", rgba_img.size, (255, 255, 255, 255))
        blended = Image.alpha_composite(background, rgba_img)
        rgb_img = blended.convert("RGB")
    elif raw_img.mode != "RGB":
        rgb_img = raw_img.convert("RGB")
    else:
        rgb_img = raw_img

    width, height = rgb_img.size

    # 6. Dimensions bounds handling and aspect ratio validation
    if width < min_dimension or height < min_dimension:
        raise ImageValidationError(
            f"Image dimensions ({width}x{height}) are below minimum required ({min_dimension}px).",
            "DIMENSIONS_TOO_SMALL"
        )

    # Gracefully downscale oversized images to fit within safe bounds (1024px) to protect 512MB RAM cap
    max_bound = min(max_dimension, 1024)
    if width > max_bound or height > max_bound:
        rgb_img.thumbnail((max_bound, max_bound), Image.Resampling.BICUBIC)
        width, height = rgb_img.size


    aspect_ratio = float(width) / float(height)

    if required_aspect_ratio and required_aspect_ratio.lower() != "any":
        if not validate_aspect_ratio(aspect_ratio, required_aspect_ratio):
            raise ImageValidationError(
                f"Image aspect ratio ({aspect_ratio:.2f}) does not match required {required_aspect_ratio}.",
                "INVALID_ASPECT_RATIO"
            )

    return PreprocessedImage(
        pil_image=rgb_img,
        sha256=sha256,
        width=width,
        height=height,
        aspect_ratio=aspect_ratio,
        format_name=format_name,
        raw_bytes_len=len(data)
    )

