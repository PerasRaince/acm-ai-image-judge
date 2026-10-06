"""
DreamSim Perceptual Similarity Scorer.
Evaluates human perceptual similarity using learned DreamSim representations.
Direction: Raw metric is a distance (0 = identical, ~0.8+ = strongly dissimilar).
Normalized metric: 0 - 100 similarity where 100 is identical match.
"""

from typing import Tuple, Dict, Any
from PIL import Image
import torch
from app.models.registry import ModelRegistry


def compute_dreamsim_score(
    ref_image: Image.Image,
    cand_image: Image.Image,
    registry: ModelRegistry,
    cached_ref_features: Dict[str, Any] = None
) -> Tuple[float, float, Dict[str, Any]]:
    """
    Computes DreamSim perceptual distance and converts to a normalized 0-100 similarity score.
    Returns: (normalized_score, raw_distance, metadata)
    """
    model, preprocess = registry.get_dreamsim()
    device = registry.device

    # Preprocess images for DreamSim (preprocess already returns [1, 3, H, W] or [3, H, W])
    ref_tensor = preprocess(ref_image).to(device)
    cand_tensor = preprocess(cand_image).to(device)

    if ref_tensor.ndim == 3:
        ref_tensor = ref_tensor.unsqueeze(0)
    if cand_tensor.ndim == 3:
        cand_tensor = cand_tensor.unsqueeze(0)

    with torch.inference_mode():
        raw_dist = model(ref_tensor, cand_tensor)
        if isinstance(raw_dist, torch.Tensor):
            raw_dist = raw_dist.item()

    # Raw distance: 0.0 = identical, 1.0+ = completely dissimilar
    # Calibration to 0 - 100 similarity:
    # d = 0.0 -> score = 100.0
    # d >= 1.0 -> score = 0.0
    normalized_similarity = max(0.0, min(100.0, (1.0 - float(raw_dist)) * 100.0))

    return round(normalized_similarity, 2), round(float(raw_dist), 4), {
        "model": "dreamsim_dino_vitb16",
        "raw_distance": round(float(raw_dist), 4)
    }

