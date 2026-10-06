"""
Color Similarity Scorer.
Deterministic color distribution comparison using CIE L*a*b* and HSV histogram statistics.
Direction: Raw similarity is 0.0 - 1.0 (1.0 = identical palette distribution).
Normalized metric: 0 - 100 color fidelity.
"""

from typing import Tuple, Dict, Any
from PIL import Image
import numpy as np
import cv2


def compute_color_score(
    ref_image: Image.Image,
    cand_image: Image.Image
) -> Tuple[float, float, Dict[str, Any]]:
    """
    Computes deterministic color similarity:
    1. HSV 3D histogram correlation (hue, saturation, value distribution match)
    2. CIE L*a*b* mean color centroid and variance distance
    Returns: (normalized_score, raw_metric, metadata)
    """
    # Resize both to standard 256x256 for fast, stable color comparison
    ref_resized = ref_image.resize((256, 256), Image.Resampling.BICUBIC)
    cand_resized = cand_image.resize((256, 256), Image.Resampling.BICUBIC)

    ref_np = np.array(ref_resized)
    cand_np = np.array(cand_resized)

    # 1. HSV Histogram Analysis
    ref_hsv = cv2.cvtColor(ref_np, cv2.COLOR_RGB2HSV)
    cand_hsv = cv2.cvtColor(cand_np, cv2.COLOR_RGB2HSV)

    # 16 bins for Hue, 8 for Saturation, 8 for Value
    hist_bins = [16, 8, 8]
    ranges = [0, 180, 0, 256, 0, 256]

    hist_ref = cv2.calcHist([ref_hsv], [0, 1, 2], None, hist_bins, ranges)
    hist_cand = cv2.calcHist([cand_hsv], [0, 1, 2], None, hist_bins, ranges)

    cv2.normalize(hist_ref, hist_ref, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)
    cv2.normalize(hist_cand, hist_cand, alpha=0, beta=1, norm_type=cv2.NORM_MINMAX)

    # Correlation comparison produces value between -1.0 and 1.0
    hsv_correlation = cv2.compareHist(hist_ref, hist_cand, cv2.HISTCMP_CORREL)
    hsv_sim = max(0.0, float(hsv_correlation))

    # 2. CIE L*a*b* Space Mean & Deviation Comparison
    ref_lab = cv2.cvtColor(ref_np, cv2.COLOR_RGB2LAB)
    cand_lab = cv2.cvtColor(cand_np, cv2.COLOR_RGB2LAB)

    ref_mean, ref_std = cv2.meanStdDev(ref_lab)
    cand_mean, cand_std = cv2.meanStdDev(cand_lab)

    # Euclidean distance between mean color centroids in Lab space
    delta_e = np.linalg.norm(ref_mean.flatten() - cand_mean.flatten())
    # Max reasonable delta_e in Lab is ~100
    lab_sim = max(0.0, 1.0 - (delta_e / 100.0))

    # Standard deviation similarity
    std_diff = np.linalg.norm(ref_std.flatten() - cand_std.flatten())
    std_sim = max(0.0, 1.0 - (std_diff / 50.0))

    # Composite color similarity
    composite_raw = 0.50 * hsv_sim + 0.35 * lab_sim + 0.15 * std_sim
    normalized_score = max(0.0, min(100.0, composite_raw * 100.0))

    return round(normalized_score, 2), round(composite_raw, 4), {
        "hsv_correlation": round(hsv_sim, 4),
        "lab_centroid_similarity": round(lab_sim, 4),
        "lab_variance_similarity": round(std_sim, 4),
        "delta_e": round(float(delta_e), 2)
    }

