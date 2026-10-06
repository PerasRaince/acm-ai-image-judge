"""
Critical Scoring Sanity Invariant Tests (Prompt Section 37).
Validates:
1. Identical image similarity invariant
2. Minor compression invariance
3. Strongly different image disparity
4. Exact reference re-upload detection
"""

import io
from PIL import Image, ImageDraw
from app.preprocessing.pipeline import preprocess_image_bytes
from app.scoring.engine import score_images


def make_scene_image(seed=1):
    img = Image.new("RGB", (256, 256), (30 * seed, 60 * seed, 90 * seed))
    draw = ImageDraw.Draw(img)
    draw.rectangle([50, 50, 200, 200], fill=(200, 100 * seed % 255, 50))
    draw.ellipse([80, 80, 160, 160], fill=(255, 255, 0))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def test_invariant_identical_images():
    img_bytes = make_scene_image(seed=1)
    ref = preprocess_image_bytes(img_bytes)
    cand = preprocess_image_bytes(img_bytes)

    result = score_images(ref, cand)

    # Identical image checks
    assert result.is_exact_reference_match is True
    assert result.final_score >= 85.0
    assert result.color_score >= 95.0
    assert 0.0 <= result.final_score <= 100.0


def test_invariant_minor_compression():
    img_bytes = make_scene_image(seed=2)
    ref = preprocess_image_bytes(img_bytes)

    # Recompress via JPEG quality 80
    pil_img = ref.pil_image
    buf = io.BytesIO()
    pil_img.save(buf, format="JPEG", quality=80)
    cand_bytes = buf.getvalue()
    cand = preprocess_image_bytes(cand_bytes)

    result = score_images(ref, cand)

    # Minor JPEG recompression should remain highly similar
    assert result.is_exact_reference_match is False
    assert result.final_score >= 80.0


def test_invariant_different_images():
    img1_bytes = make_scene_image(seed=1)
    # Different image: inverted colors and different pattern
    img2 = Image.new("RGB", (256, 256), (240, 240, 240))
    draw = ImageDraw.Draw(img2)
    draw.polygon([(20, 20), (200, 50), (100, 220)], fill=(0, 200, 100))
    buf = io.BytesIO()
    img2.save(buf, format="PNG")
    img2_bytes = buf.getvalue()

    ref = preprocess_image_bytes(img1_bytes)
    cand = preprocess_image_bytes(img2_bytes)

    result = score_images(ref, cand)

    # Completely different image should score significantly lower
    assert result.is_exact_reference_match is False
    assert result.final_score < 70.0

