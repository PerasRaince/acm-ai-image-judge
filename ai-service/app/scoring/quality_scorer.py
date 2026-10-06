"""
Technical Image Quality Scorer.
Evaluates physical image integrity, sharpness, dynamic range, and absence of extreme artifacts.
Direction: Raw quality metric (0.0 - 1.0).
Normalized metric: 0 - 100 technical quality score.
Note: Kept at low weight (5%) so artistic fidelity to reference always dominates.
"""

from typing import Tuple, Dict, Any
from PIL import Image
import numpy as np
import cv2


def compute_quality_score(
    image: Image.Image
) -> Tuple[float, float, Dict[str, Any]]:
    """
    Computes technical quality score:
    1. Laplacian blur variance (detects severe smearing/blur)
    2. Dynamic range & contrast (detects washed out/overexposed pixels)
    3. Resolution adequacy
    Returns: (normalized_score, raw_metric, metadata)
    """
    width, height = image.size
    # Resize to standard 512px for stable, lightweight sharpness evaluation (prevents RAM spikes)
    if width > 512 or height > 512:
        eval_img = image.resize((512, 512), Image.Resampling.BILINEAR)
    else:
        eval_img = image

    img_np = np.array(eval_img)
    gray = cv2.cvtColor(img_np, cv2.COLOR_RGB2GRAY)

    # 1. Sharpness via Laplacian variance (using float32 to save RAM)
    laplacian_var = float(cv2.Laplacian(gray, cv2.CV_32F).var())
    # Scores: variance > 250 is crisp, < 30 is severely blurred
    sharpness_score = min(1.0, max(0.1, np.log1p(laplacian_var) / np.log1p(500.0)))

    # 2. Dynamic range / contrast (std dev of grayscale intensities)
    gray_std = float(np.std(gray))
    # Full dynamic range standard deviation is typically 40-75
    contrast_score = min(1.0, max(0.1, gray_std / 50.0))

    # 3. Resolution factor
    # 512x512 or higher scores 1.0, smaller images are gently scaled
    pixels = width * height
    resolution_factor = min(1.0, max(0.5, pixels / (512 * 512)))

    # Composite technical quality score
    raw_quality = 0.50 * sharpness_score + 0.35 * contrast_score + 0.15 * resolution_factor
    normalized_score = max(0.0, min(100.0, raw_quality * 100.0))

    return round(normalized_score, 2), round(raw_quality, 4), {
        "laplacian_variance": round(float(laplacian_var), 2),
        "sharpness_score": round(sharpness_score, 4),
        "contrast_std": round(gray_std, 2),
        "contrast_score": round(contrast_score, 4),
        "resolution_factor": round(resolution_factor, 4)
    }

