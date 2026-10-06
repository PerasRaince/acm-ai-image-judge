"""
DINOv2 Structural Correspondence Scorer.
Evaluates visual layout and object structure correspondence using self-supervised ViT features.
Direction: Raw metric is cosine similarity (-1.0 to 1.0, typically 0.0 to 1.0 for image features).
Normalized metric: 0 - 100 similarity where 100 is identical structural representation.
"""

from typing import Tuple, Dict, Any, Optional
from PIL import Image
import torch
import torch.nn.functional as F
from app.models.registry import ModelRegistry


def extract_dino_features(
    image: Image.Image,
    registry: ModelRegistry
) -> torch.Tensor:
    """Extracts L2-normalized DINOv2 CLS feature embedding."""
    model, processor = registry.get_dino()
    device = registry.device

    with torch.inference_mode():
        if processor is not None:
            inputs = processor(images=image, return_tensors="pt").to(device)
            outputs = model(**inputs)
            # Use pooler_output or CLS token [last_hidden_state[:, 0]]
            if hasattr(outputs, "pooler_output") and outputs.pooler_output is not None:
                features = outputs.pooler_output
            else:
                features = outputs.last_hidden_state[:, 0]
        else:
            # Torch Hub dinov2 model accepts standard normalized tensor
            # (1, 3, 224, 224)
            import torchvision.transforms as T
            tf = T.Compose([
                T.Resize((224, 224), antialias=True),
                T.ToTensor(),
                T.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
            ])
            t = tf(image).unsqueeze(0).to(device)
            features = model(t)

        normalized_features = F.normalize(features, p=2, dim=-1)
    return normalized_features


def compute_dino_score(
    ref_image: Image.Image,
    cand_image: Image.Image,
    registry: ModelRegistry,
    cached_ref_features: Optional[Dict[str, Any]] = None
) -> Tuple[float, float, Dict[str, Any]]:
    """
    Computes DINOv2 cosine similarity.
    Returns: (normalized_score, raw_cosine, metadata)
    """
    # Use cached reference embedding if available
    if cached_ref_features and "dino_embedding" in cached_ref_features:
        ref_embed = cached_ref_features["dino_embedding"]
    else:
        ref_embed = extract_dino_features(ref_image, registry)

    cand_embed = extract_dino_features(cand_image, registry)

    with torch.inference_mode():
        cosine_sim = F.cosine_similarity(ref_embed, cand_embed, dim=-1).item()

    # Raw cosine is in [-1.0, 1.0]. For image embeddings it is in [0.0, 1.0].
    # Clamp to [0, 1] then scale to [0, 100]
    raw_cosine = max(-1.0, min(1.0, float(cosine_sim)))
    normalized_similarity = max(0.0, min(100.0, raw_cosine * 100.0))

    return round(normalized_similarity, 2), round(raw_cosine, 4), {
        "model": "dinov2_vits14",
        "raw_cosine": round(raw_cosine, 4),
        "ref_embed": ref_embed
    }

