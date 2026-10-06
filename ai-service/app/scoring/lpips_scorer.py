"""
LPIPS Perceptual Detail Distance Scorer.
Evaluates local structural texture, edge, and patch-level fidelity.
Direction: Raw metric is a distance (0.0 = identical patch structure, ~0.6+ = dissimilar).
Normalized metric: 0 - 100 similarity where 100 is identical match.
"""

from typing import Tuple, Dict, Any
from PIL import Image
import torch
import torchvision.transforms as T
from app.models.registry import ModelRegistry

# Preprocessor for LPIPS: 256x256, normalized to [-1, 1]
LPIPS_TRANSFORM = T.Compose([
    T.Resize((256, 256), interpolation=T.InterpolationMode.BICUBIC, antialias=True),
    T.ToTensor(),
    T.Normalize(mean=[0.5, 0.5, 0.5], std=[0.5, 0.5, 0.5])
])


def compute_lpips_score(
    ref_image: Image.Image,
    cand_image: Image.Image,
    registry: ModelRegistry
) -> Tuple[float, float, Dict[str, Any]]:
    """
    Computes LPIPS distance and calibrates into 0 - 100 similarity.
    Returns: (normalized_score, raw_distance, metadata)
    """
    model = registry.get_lpips()
    device = registry.device

    ref_tensor = LPIPS_TRANSFORM(ref_image).unsqueeze(0).to(device)
    cand_tensor = LPIPS_TRANSFORM(cand_image).unsqueeze(0).to(device)

    with torch.inference_mode():
        raw_dist = model(ref_tensor, cand_tensor)
        if isinstance(raw_dist, torch.Tensor):
            raw_dist = raw_dist.item()

    raw_dist = float(raw_dist)
    # Distance of 0.0 -> 100.0 similarity
    # Distance of >= 1.0 -> 0.0 similarity
    normalized_similarity = max(0.0, min(100.0, (1.0 - raw_dist) * 100.0))

    return round(normalized_similarity, 2), round(raw_dist, 4), {
        "model": f"lpips_{registry.settings.LPIPS_NET}",
        "raw_distance": round(raw_dist, 4)
    }

