"""
Unit tests for Image Preprocessing Pipeline.
"""

import io
import pytest
from PIL import Image
from app.preprocessing.pipeline import (
    preprocess_image_bytes,
    verify_magic_bytes,
    compute_sha256,
    validate_aspect_ratio,
    ImageValidationError
)


def create_test_image(width=200, height=200, color=(255, 0, 0), format="JPEG"):
    img = Image.new("RGB", (width, height), color)
    buf = io.BytesIO()
    img.save(buf, format=format)
    return buf.getvalue()


def test_magic_bytes_detection():
    jpeg_bytes = create_test_image(format="JPEG")
    png_bytes = create_test_image(format="PNG")

    assert verify_magic_bytes(jpeg_bytes) == "JPEG"
    assert verify_magic_bytes(png_bytes) == "PNG"

    with pytest.raises(ImageValidationError):
        verify_magic_bytes(b"NOT_AN_IMAGE_PAYLOAD_AT_ALL")


def test_sha256_computation():
    data = b"test_image_bytes_12345"
    digest = compute_sha256(data)
    assert len(digest) == 64
    assert digest == "1a01376bbebf7880653c19a0313be4ecaa333a54c29b4e57d191675bb7b6595d"


def test_aspect_ratio_validation():
    # 1:1 ratio
    assert validate_aspect_ratio(1.0, "1:1")
    assert validate_aspect_ratio(1.03, "1:1")  # within 6% tolerance
    assert not validate_aspect_ratio(1.5, "1:1")

    # 16:9 ratio
    assert validate_aspect_ratio(16 / 9, "16:9")
    assert not validate_aspect_ratio(1.0, "16:9")

    # 'any' ratio
    assert validate_aspect_ratio(2.5, "any")
    assert validate_aspect_ratio(0.5, "")


def test_preprocess_valid_image():
    jpeg_bytes = create_test_image(width=256, height=256, color=(100, 150, 200))
    preprocessed = preprocess_image_bytes(jpeg_bytes, required_aspect_ratio="1:1")

    assert preprocessed.width == 256
    assert preprocessed.height == 256
    assert preprocessed.aspect_ratio == 1.0
    assert preprocessed.format_name == "JPEG"
    assert preprocessed.pil_image.mode == "RGB"
    assert len(preprocessed.sha256) == 64


def test_preprocess_alpha_channel_conversion():
    # RGBA image with 50% transparency
    rgba_img = Image.new("RGBA", (128, 128), (255, 0, 0, 128))
    buf = io.BytesIO()
    rgba_img.save(buf, format="PNG")
    png_bytes = buf.getvalue()

    preprocessed = preprocess_image_bytes(png_bytes)
    assert preprocessed.pil_image.mode == "RGB"
    assert preprocessed.width == 128
    assert preprocessed.height == 128


def test_corrupt_image_rejection():
    # Invalid PNG header followed by garbage
    fake_png = b"\x89PNG\r\n\x1a\n" + b"GARBAGE_PAYLOAD_NOT_IMAGE"
    with pytest.raises(ImageValidationError):
        preprocess_image_bytes(fake_png)

