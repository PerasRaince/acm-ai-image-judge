"""
Unified Scoring Engine.
Orchestrates multi-metric image evaluation, anti-cheat checks, reference caching,
and weighted aggregation into the Reference Similarity Score (0 - 100).
"""

import time
import logging
from typing import Dict, Any, Optional
from PIL import Image

from app.core.config import get_settings
from app.models.registry import ModelRegistry
from app.preprocessing.pipeline import PreprocessedImage
from app.scoring.color_scorer import compute_color_score
from app.scoring.quality_scorer import compute_quality_score
from app.scoring.low_memory_scorer import compute_low_memory_scores

logger = logging.getLogger("ai_judge.engine")

DEFAULT_METRIC_WEIGHTS = {
    "dreamsim": 0.35,
    "dino": 0.30,
    "clip": 0.15,
    "lpips": 0.10,
    "color": 0.05,
    "quality": 0.05
}


class ScoringResult:
    def __init__(
        self,
        final_score: float,
        dreamsim_score: float,
        dino_score: float,
        clip_score: float,
        lpips_score: float,
        color_score: float,
        quality_score: float,
        raw_metrics: Dict[str, Any],
        inference_duration_ms: int,
        device: str,
        scoring_version: str,
        is_exact_reference_match: bool = False
    ):
        self.final_score = final_score
        self.dreamsim_score = dreamsim_score
        self.dino_score = dino_score
        self.clip_score = clip_score
        self.lpips_score = lpips_score
        self.color_score = color_score
        self.quality_score = quality_score
        self.raw_metrics = raw_metrics
        self.inference_duration_ms = inference_duration_ms
        self.device = device
        self.scoring_version = scoring_version
        self.is_exact_reference_match = is_exact_reference_match

    def to_dict(self) -> Dict[str, Any]:
        return {
            "final_score": self.final_score,
            "component_scores": {
                "dreamsim": self.dreamsim_score,
                "dino": self.dino_score,
                "clip": self.clip_score,
                "lpips": self.lpips_score,
                "color": self.color_score,
                "quality": self.quality_score
            },
            "raw_metrics": self.raw_metrics,
            "inference_duration_ms": self.inference_duration_ms,
            "device": self.device,
            "scoring_version": self.scoring_version,
            "is_exact_reference_match": self.is_exact_reference_match
        }


def score_images(
    reference: PreprocessedImage,
    candidate: PreprocessedImage,
    weights: Optional[Dict[str, float]] = None,
    scoring_version: Optional[str] = None
) -> ScoringResult:
    """
    Executes the full evaluation pipeline:
    1. Checks for exact reference byte-level duplicate (anti-cheat)
    2. Retrieves / updates cached reference embeddings (DINO, CLIP)
    3. Computes 6 component similarity metrics
    4. Computes calibrated weighted sum
    5. Returns transparent ScoringResult
    """
    settings = get_settings()
    registry = ModelRegistry.get_instance()
    active_weights = weights or DEFAULT_METRIC_WEIGHTS
    active_version = scoring_version or settings.DEFAULT_SCORING_VERSION

    start_time = time.perf_counter()

    # 1. Anti-Cheat: Detect exact reference re-upload
    is_exact_reference_match = (reference.sha256 == candidate.sha256)
    if is_exact_reference_match:
        logger.warning(f"Anti-Cheat Flag: Candidate SHA-256 matches reference SHA-256 ({reference.sha256})")

    # 2. Check reference embedding cache
    cached_ref = registry.get_cached_reference(reference.sha256)
    if cached_ref is None:
        cached_ref = {}

    raw_metrics_dict: Dict[str, Any] = {}

    if settings.LOW_MEMORY_MODE:
        # High-efficiency low-memory pipeline (<180MB RAM for Render Free Tier)
        comp_scores, raw_metrics_dict = compute_low_memory_scores(
            reference.pil_image,
            candidate.pil_image,
            registry,
            cached_ref
        )
        ds_score = comp_scores["dreamsim"]
        dino_score = comp_scores["dino"]
        clip_score = comp_scores["clip"]
        lpips_score = comp_scores["lpips"]
        color_score = comp_scores["color"]
        quality_score = comp_scores["quality"]
    else:
        # Full heavy PyTorch model suite (requires >= 2GB RAM / GPU)
        from app.scoring.dreamsim_scorer import compute_dreamsim_score
        from app.scoring.dino_scorer import compute_dino_score
        from app.scoring.clip_scorer import compute_clip_score
        from app.scoring.lpips_scorer import compute_lpips_score

        # 3. DreamSim Perceptual Similarity
        try:
            ds_score, ds_raw, ds_meta = compute_dreamsim_score(
                reference.pil_image,
                candidate.pil_image,
                registry,
                cached_ref
            )
            raw_metrics_dict["dreamsim"] = ds_meta
        except Exception as e:
            logger.error(f"DreamSim evaluation error: {e}")
            ds_score = 0.0
            raw_metrics_dict["dreamsim"] = {"error": str(e)}

        # 4. DINOv2 Structural Correspondence
        try:
            dino_score, dino_raw, dino_meta = compute_dino_score(
                reference.pil_image,
                candidate.pil_image,
                registry,
                cached_ref
            )
            if "ref_embed" in dino_meta:
                cached_ref["dino_embedding"] = dino_meta["ref_embed"]
                del dino_meta["ref_embed"]
            raw_metrics_dict["dino"] = dino_meta
        except Exception as e:
            logger.error(f"DINO evaluation error: {e}")
            dino_score = 0.0
            raw_metrics_dict["dino"] = {"error": str(e)}

        # 5. OpenCLIP Semantic Similarity
        try:
            clip_score, clip_raw, clip_meta = compute_clip_score(
                reference.pil_image,
                candidate.pil_image,
                registry,
                cached_ref
            )
            if "ref_embed" in clip_meta:
                cached_ref["clip_embedding"] = clip_meta["ref_embed"]
                del clip_meta["ref_embed"]
            raw_metrics_dict["clip"] = clip_meta
        except Exception as e:
            logger.error(f"CLIP evaluation error: {e}")
            clip_score = 0.0
            raw_metrics_dict["clip"] = {"error": str(e)}

        # 6. LPIPS Perceptual Detail Distance
        try:
            lpips_score, lpips_raw, lpips_meta = compute_lpips_score(
                reference.pil_image,
                candidate.pil_image,
                registry
            )
            raw_metrics_dict["lpips"] = lpips_meta
        except Exception as e:
            logger.error(f"LPIPS evaluation error: {e}")
            lpips_score = 0.0
            raw_metrics_dict["lpips"] = {"error": str(e)}

        # 7. Color Distribution Similarity
        try:
            color_score, color_raw, color_meta = compute_color_score(
                reference.pil_image,
                candidate.pil_image
            )
            raw_metrics_dict["color"] = color_meta
        except Exception as e:
            logger.error(f"Color evaluation error: {e}")
            color_score = 0.0
            raw_metrics_dict["color"] = {"error": str(e)}

        # 8. Technical Quality Score
        try:
            quality_score, quality_raw, quality_meta = compute_quality_score(
                candidate.pil_image
            )
            raw_metrics_dict["quality"] = quality_meta
        except Exception as e:
            logger.error(f"Quality evaluation error: {e}")
            quality_score = 0.0
            raw_metrics_dict["quality"] = {"error": str(e)}

    # Cache precomputed reference embeddings for future submissions
    if settings.ENABLE_REFERENCE_CACHE and cached_ref:
        registry.cache_reference(reference.sha256, cached_ref)

    # 9. Compute Weighted Final Reference Similarity Score
    w_ds = active_weights.get("dreamsim", 0.35)
    w_dino = active_weights.get("dino", 0.30)
    w_clip = active_weights.get("clip", 0.15)
    w_lpips = active_weights.get("lpips", 0.10)
    w_color = active_weights.get("color", 0.05)
    w_qual = active_weights.get("quality", 0.05)

    final_calc = (
        ds_score * w_ds +
        dino_score * w_dino +
        clip_score * w_clip +
        lpips_score * w_lpips +
        color_score * w_color +
        quality_score * w_qual
    )

    final_score = max(0.0, min(100.0, round(final_calc, 2)))
    duration_ms = int((time.perf_counter() - start_time) * 1000)

    device_name = str(registry.device)

    return ScoringResult(
        final_score=final_score,
        dreamsim_score=ds_score,
        dino_score=dino_score,
        clip_score=clip_score,
        lpips_score=lpips_score,
        color_score=color_score,
        quality_score=quality_score,
        raw_metrics=raw_metrics_dict,
        inference_duration_ms=duration_ms,
        device=device_name,
        scoring_version=active_version,
        is_exact_reference_match=is_exact_reference_match
    )

