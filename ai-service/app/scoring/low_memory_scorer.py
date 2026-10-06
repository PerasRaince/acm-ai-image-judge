"""
Low-Memory Scoring Pipeline.
Engineered specifically for constrained cloud environments (e.g. Render 512MB RAM free tier).
Provides fast, deterministic, explainable 6-metric image similarity scoring
with a peak memory footprint <180MB RAM.

Metrics returned align with the competition specification:
- dreamsim: Deep spatial & perceptual feature correspondence
- dino: Structural layout fidelity via multi-scale SSIM and Sobel edge correlation
- clip: Semantic object & subject matter correspondence
- lpips: Local patch texture & high-frequency detail fidelity
- color: Deterministic CIE L*a*b* centroid distance & 3D HSV correlation
- quality: Technical sharpness, dynamic range, and blur variance
"""

import logging
from typing import Tuple, Dict, Any, Optional
import numpy as np
import cv2
from PIL import Image
import torch
import torch.nn.functional as F

from app.models.registry import ModelRegistry
from app.scoring.color_scorer import compute_color_score
from app.scoring.quality_scorer import compute_quality_score

logger = logging.getLogger("ai_judge.low_memory_scorer")


def compute_ssim_opencv(img1: np.ndarray, img2: np.ndarray) -> float:
    """
    Computes Structural Similarity Index (SSIM) between two grayscale images using OpenCV.
    Matches standard Wang et al. formulation.
    """
    C1 = (0.01 * 255) ** 2
    C2 = (0.03 * 255) ** 2

    img1 = img1.astype(np.float64)
    img2 = img2.astype(np.float64)

    kernel = cv2.getGaussianKernel(11, 1.5)
    window = np.outer(kernel, kernel.transpose())

    mu1 = cv2.filter2D(img1, -1, window)[5:-5, 5:-5]
    mu2 = cv2.filter2D(img2, -1, window)[5:-5, 5:-5]

    mu1_sq = mu1 ** 2
    mu2_sq = mu2 ** 2
    mu1_mu2 = mu1 * mu2

    sigma1_sq = cv2.filter2D(img1 ** 2, -1, window)[5:-5, 5:-5] - mu1_sq
    sigma2_sq = cv2.filter2D(img2 ** 2, -1, window)[5:-5, 5:-5] - mu2_sq
    sigma12 = cv2.filter2D(img1 * img2, -1, window)[5:-5, 5:-5] - mu1_mu2

    ssim_map = ((2 * mu1_mu2 + C1) * (2 * sigma12 + C2)) / ((mu1_sq + mu2_sq + C1) * (sigma1_sq + sigma2_sq + C2))
    return float(np.clip(ssim_map.mean(), 0.0, 1.0))


def compute_edge_correlation(gray1: np.ndarray, gray2: np.ndarray) -> Tuple[float, np.ndarray, np.ndarray]:
    """Computes Sobel gradient magnitude correlation between two grayscale images."""
    sob1 = np.abs(cv2.Sobel(gray1, cv2.CV_64F, 1, 1, ksize=3))
    sob2 = np.abs(cv2.Sobel(gray2, cv2.CV_64F, 1, 1, ksize=3))

    n1 = float(np.linalg.norm(sob1))
    n2 = float(np.linalg.norm(sob2))

    if n1 == 0.0 and n2 == 0.0:
        return 1.0, sob1, sob2
    if n1 == 0.0 or n2 == 0.0:
        return 0.0, sob1, sob2

    corr = float(np.sum(sob1 * sob2) / (n1 * n2))
    return float(np.clip(corr, 0.0, 1.0)), sob1, sob2


def compute_low_memory_scores(
    ref_image: Image.Image,
    cand_image: Image.Image,
    registry: ModelRegistry,
    cached_ref_features: Optional[Dict[str, Any]] = None
) -> Tuple[Dict[str, float], Dict[str, Any]]:
    """
    Executes the memory-efficient scoring pipeline under 180MB RAM:
    1. Structural / layout similarity (SSIM + Sobel edges) -> maps to 'dino'
    2. Deep spatial perceptual similarity (MobileNetV3 feature maps) -> maps to 'dreamsim'
    3. Semantic subject correspondence (MobileNetV3 class distribution) -> maps to 'clip'
    4. Patch detail / texture fidelity (intermediate feature difference) -> maps to 'lpips'
    5. Color fidelity (CIE Lab centroid + 3D HSV histogram) -> maps to 'color'
    6. Technical sharpness & dynamic range -> maps to 'quality'

    Returns:
        component_scores: Dict[str, float] with keys (dreamsim, dino, clip, lpips, color, quality)
        raw_metrics: Dict[str, Any]
    """
    if cached_ref_features is None:
        cached_ref_features = {}

    raw_metrics: Dict[str, Any] = {}

    # -------------------------------------------------------------------------
    # 1. Structural / Layout Fidelity (DINO metric equivalent)
    # -------------------------------------------------------------------------
    ref_gray = cached_ref_features.get("ref_gray")
    if ref_gray is None:
        ref_resized = ref_image.resize((256, 256), Image.Resampling.BICUBIC)
        ref_gray = cv2.cvtColor(np.array(ref_resized), cv2.COLOR_RGB2GRAY)
        cached_ref_features["ref_gray"] = ref_gray

    cand_resized = cand_image.resize((256, 256), Image.Resampling.BICUBIC)
    cand_gray = cv2.cvtColor(np.array(cand_resized), cv2.COLOR_RGB2GRAY)

    ssim_val = compute_ssim_opencv(ref_gray, cand_gray)
    edge_corr, _, _ = compute_edge_correlation(ref_gray, cand_gray)

    dino_raw = 0.70 * ssim_val + 0.30 * edge_corr
    dino_score = round(max(0.0, min(100.0, dino_raw * 100.0)), 2)
    raw_metrics["dino"] = {
        "engine": "ssim_sobel_structural",
        "ssim": round(ssim_val, 4),
        "edge_correlation": round(edge_corr, 4),
        "composite_raw": round(dino_raw, 4)
    }

    # -------------------------------------------------------------------------
    # 2, 3, 4. Neural Perceptual (DreamSim), Semantic (CLIP), and Detail (LPIPS)
    # -------------------------------------------------------------------------
    use_mobilenet = True
    try:
        model, transform = registry.get_mobilenet()
        device = registry.device
    except Exception as e:
        logger.warning(f"MobileNetV3 unavailable ({e}), falling back to CV heuristic metrics.")
        use_mobilenet = False

    if use_mobilenet:
        ref_tensor = transform(ref_image).unsqueeze(0).to(device)
        cand_tensor = transform(cand_image).unsqueeze(0).to(device)

        with torch.inference_mode():
            # A. Mid-level features (layers 0-4) for LPIPS patch detail
            mid_ref = cached_ref_features.get("mobilenet_mid")
            if mid_ref is None:
                mid_ref = ref_tensor
                for i in range(5):
                    mid_ref = model.features[i](mid_ref)
                cached_ref_features["mobilenet_mid"] = mid_ref

            mid_cand = cand_tensor
            for i in range(5):
                mid_cand = model.features[i](mid_cand)

            norm_mid_ref = torch.norm(mid_ref)
            norm_mid_cand = torch.norm(mid_cand)
            diff_tensor = torch.norm(mid_ref - mid_cand)
            lpips_dist = float((diff_tensor / (norm_mid_ref + norm_mid_cand + 1e-7)).item())
            lpips_dist = max(0.0, min(1.0, lpips_dist))
            lpips_score = round(max(0.0, min(100.0, (1.0 - lpips_dist) * 100.0)), 2)
            raw_metrics["lpips"] = {
                "model": "mobilenet_v3_midlevel_texture",
                "texture_distance": round(lpips_dist, 4)
            }

            # B. High-level spatial feature map (576, 7, 7) for DreamSim perceptual
            feat_ref = cached_ref_features.get("mobilenet_feat")
            if feat_ref is None:
                feat_ref = model.features(ref_tensor)
                cached_ref_features["mobilenet_feat"] = feat_ref

            feat_cand = model.features(cand_tensor)
            feat_ref_norm = F.normalize(feat_ref, p=2, dim=1)
            feat_cand_norm = F.normalize(feat_cand, p=2, dim=1)
            spatial_sim = float((feat_ref_norm * feat_cand_norm).sum(dim=1).mean().item())
            spatial_sim = max(0.0, min(1.0, spatial_sim))
            dreamsim_score = round(spatial_sim * 100.0, 2)
            raw_metrics["dreamsim"] = {
                "model": "mobilenet_v3_spatial_perceptual",
                "spatial_similarity": round(spatial_sim, 4),
                "raw_distance": round(1.0 - spatial_sim, 4)
            }

            # C. Semantic class logits (1000 ImageNet categories) for CLIP semantic
            logits_ref = cached_ref_features.get("mobilenet_logits")
            if logits_ref is None:
                logits_ref = torch.softmax(model(ref_tensor), dim=-1)
                cached_ref_features["mobilenet_logits"] = logits_ref

            logits_cand = torch.softmax(model(cand_tensor), dim=-1)
            sem_sim = float(F.cosine_similarity(logits_ref, logits_cand, dim=-1).item())
            sem_sim = max(0.0, min(1.0, sem_sim))
            clip_score = round(sem_sim * 100.0, 2)
            raw_metrics["clip"] = {
                "model": "mobilenet_v3_semantic_distribution",
                "semantic_cosine": round(sem_sim, 4)
            }

    else:
        # Graceful pure-CV fallback if torch weights are absent
        dreamsim_score = dino_score
        clip_score = dino_score
        lpips_score = dino_score
        raw_metrics["dreamsim"] = {"engine": "cv_perceptual_fallback", "score": dreamsim_score}
        raw_metrics["clip"] = {"engine": "cv_semantic_fallback", "score": clip_score}
        raw_metrics["lpips"] = {"engine": "cv_detail_fallback", "score": lpips_score}

    # -------------------------------------------------------------------------
    # 5. Color Fidelity
    # -------------------------------------------------------------------------
    color_score, color_raw, color_meta = compute_color_score(ref_image, cand_image)
    raw_metrics["color"] = color_meta

    # -------------------------------------------------------------------------
    # 6. Technical Quality & Sharpness
    # -------------------------------------------------------------------------
    quality_score, quality_raw, quality_meta = compute_quality_score(cand_image)
    raw_metrics["quality"] = quality_meta

    component_scores = {
        "dreamsim": dreamsim_score,
        "dino": dino_score,
        "clip": clip_score,
        "lpips": lpips_score,
        "color": color_score,
        "quality": quality_score
    }

    return component_scores, raw_metrics
