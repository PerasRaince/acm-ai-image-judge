"""
CLIP / OpenCLIP Semantic Similarity Scorer.
Evaluates high-level conceptual, semantic, and subject-matter similarity.
Direction: Raw metric is image-to-image cosine similarity (0.0 - 1.0).
Normalized metric: 0 - 100 similarity where 100 is identical semantic embedding.
"""

from typing import Tuple, Dict, Any, Optional
from PIL import Image
import torch
import torch.nn.functional as F
from app.models.registry import ModelRegistry


def extract_clip_features(
    image: Image.Image,
    registry: ModelRegistry
) -> torch.Tensor:
    """Extracts L2-normalized OpenCLIP image embedding."""
    model, preprocess = registry.get_clip()
    device = registry.device

    image_tensor = preprocess(image).unsqueeze(0).to(device)
    with torch.inference_mode():
        features = model.encode_image(image_tensor)
        normalized_features = F.normalize(features, p=2, dim=-1)
    return normalized_features


def compute_clip_score(
    ref_image: Image.Image,
    cand_image: Image.Image,
    registry: ModelRegistry,
    cached_ref_features: Optional[Dict[str, Any]] = None
) -> Tuple[float, float, Dict[str, Any]]:
    """
    Computes OpenCLIP cosine similarity between reference and candidate recreation.
    Returns: (normalized_score, raw_cosine, metadata)
    """
    # Use cached reference embedding if available
    if cached_ref_features and "clip_embedding" in cached_ref_features:
        ref_embed = cached_ref_features["clip_embedding"]
    else:
        ref_embed = extract_clip_features(ref_image, registry)

    cand_embed = extract_clip_features(cand_image, registry)

    with torch.inference_mode():
        cosine_sim = F.cosine_similarity(ref_embed, cand_embed, dim=-1).item()

    raw_cosine = max(-1.0, min(1.0, float(cosine_sim)))
    normalized_similarity = max(0.0, min(100.0, raw_cosine * 100.0))

    return round(normalized_similarity, 2), round(raw_cosine, 4), {
        "model": "open_clip_vit_b_32",
        "raw_cosine": round(raw_cosine, 4),
        "ref_embed": ref_embed
    }

