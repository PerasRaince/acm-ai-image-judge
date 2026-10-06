"""
Unit tests for deterministic Color, Quality scorers and metric bounds.
"""

import math
from PIL import Image, ImageDraw, ImageFilter
from app.scoring.color_scorer import compute_color_score
from app.scoring.quality_scorer import compute_quality_score


def test_color_scorer_identical_images():
    img = Image.new("RGB", (200, 200), (45, 120, 210))
    score, raw, meta = compute_color_score(img, img)

    assert not math.isnan(score)
    assert not math.isinf(score)
    assert 98.0 <= score <= 100.0
    assert 0.0 <= raw <= 1.0


def test_color_scorer_different_colors():
    red_img = Image.new("RGB", (200, 200), (255, 0, 0))
    blue_img = Image.new("RGB", (200, 200), (0, 0, 255))
    score, raw, meta = compute_color_score(red_img, blue_img)

    assert not math.isnan(score)
    assert not math.isinf(score)
    assert score < 50.0  # Drastically different color palettes must yield low score


def test_quality_scorer_sharp_vs_blurred():
    # Sharp image with high contrast patterns
    sharp_img = Image.new("RGB", (256, 256), (255, 255, 255))
    draw = ImageDraw.Draw(sharp_img)
    for i in range(0, 256, 16):
        draw.line([(i, 0), (i, 256)], fill=(0, 0, 0), width=2)
        draw.line([(0, i), (256, i)], fill=(0, 0, 0), width=2)

    # Heavily blurred image
    blurred_img = sharp_img.filter(ImageFilter.GaussianBlur(radius=10))

    sharp_score, sharp_raw, sharp_meta = compute_quality_score(sharp_img)
    blurred_score, blurred_raw, blurred_meta = compute_quality_score(blurred_img)

    assert not math.isnan(sharp_score)
    assert not math.isnan(blurred_score)
    assert sharp_score > blurred_score
    assert 0.0 <= sharp_score <= 100.0
    assert 0.0 <= blurred_score <= 100.0

