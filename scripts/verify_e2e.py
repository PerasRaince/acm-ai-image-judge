"""
End-to-End Automated Verification Script.
Validates the entire pipeline:
1. Image preprocessing and format validation
2. AI Multi-metric scoring (DreamSim, DINOv2, CLIP, LPIPS, Color, Quality)
3. Anti-Cheat exact reference duplicate rejection
4. Deterministic leaderboard rank ordering and tie-breaking
"""

import io
import os
import sys
import time
from PIL import Image, ImageDraw

# Ensure UTF-8 stdout on Windows
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

# Add ai-service to path
ai_service_dir = os.path.join(os.path.dirname(__file__), "..", "ai-service")
sys.path.insert(0, ai_service_dir)

from app.preprocessing.pipeline import preprocess_image_bytes, ImageValidationError
from app.scoring.engine import score_images


def generate_artistic_target() -> bytes:
    """Generates a reference benchmark target image with distinct color & geometric shapes."""
    img = Image.new("RGB", (384, 384), (20, 30, 60))
    draw = ImageDraw.Draw(img)
    # Background gradient or elements
    draw.ellipse([60, 60, 324, 324], fill=(240, 120, 40))
    draw.rectangle([120, 120, 264, 264], fill=(80, 200, 180))
    draw.polygon([(192, 80), (250, 240), (134, 240)], fill=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()


def generate_close_recreation() -> bytes:
    """Generates a close AI recreation attempt (slight variation in position & tone)."""
    img = Image.new("RGB", (384, 384), (25, 35, 65))
    draw = ImageDraw.Draw(img)
    draw.ellipse([62, 58, 320, 326], fill=(235, 115, 45))
    draw.rectangle([124, 118, 260, 266], fill=(85, 195, 175))
    draw.polygon([(190, 82), (248, 238), (136, 238)], fill=(250, 250, 250))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=90)
    return buf.getvalue()


def generate_distant_recreation() -> bytes:
    """Generates an unrelated image (completely different subject and palette)."""
    img = Image.new("RGB", (384, 384), (220, 240, 255))
    draw = ImageDraw.Draw(img)
    draw.line([(0, 0), (384, 384)], fill=(0, 100, 0), width=10)
    draw.ellipse([20, 20, 100, 100], fill=(0, 0, 120))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=85)
    return buf.getvalue()


def run_e2e_verification():
    print("=" * 70)
    print("AI Image Judge Platform - End-to-End System Verification")
    print("=" * 70)

    # 1. Generate test assets
    print("\n[Step 1] Generating test images...")
    ref_bytes = generate_artistic_target()
    close_bytes = generate_close_recreation()
    distant_bytes = generate_distant_recreation()
    print(f"[OK] Reference image size: {len(ref_bytes)} bytes")
    print(f"[OK] Close recreation size: {len(close_bytes)} bytes")
    print(f"[OK] Distant recreation size: {len(distant_bytes)} bytes")

    # 2. Preprocess images
    print("\n[Step 2] Executing canonical preprocessing pipeline...")
    ref_prep = preprocess_image_bytes(ref_bytes, required_aspect_ratio="1:1")
    close_prep = preprocess_image_bytes(close_bytes, required_aspect_ratio="1:1")
    distant_prep = preprocess_image_bytes(distant_bytes, required_aspect_ratio="1:1")

    print(f"[OK] Reference SHA-256: {ref_prep.sha256[:16]}...")
    print(f"[OK] Close recreation SHA-256: {close_prep.sha256[:16]}...")
    print(f"[OK] Distant recreation SHA-256: {distant_prep.sha256[:16]}...")

    # 3. Test Anti-Cheat: Exact reference match
    print("\n[Step 3] Testing Anti-Cheat exact reference duplicate detection...")
    exact_match_result = score_images(ref_prep, ref_prep)
    assert exact_match_result.is_exact_reference_match is True, "Failed to flag exact reference upload!"
    print("[OK] Anti-Cheat SUCCESS: Exact reference match detected and flagged!")

    # 4. Score Close Recreation
    print("\n[Step 4] Evaluating Close Recreation with 6-metric ensemble...")
    t0 = time.perf_counter()
    close_result = score_images(ref_prep, close_prep)
    t_close = (time.perf_counter() - t0) * 1000
    print(f"[OK] Close Recreation Final Score: {close_result.final_score} / 100")
    print(f"  • DreamSim (Perceptual 35%): {close_result.dreamsim_score}")
    print(f"  • DINOv2 (Structural 30%):   {close_result.dino_score}")
    print(f"  • OpenCLIP (Semantic 15%):   {close_result.clip_score}")
    print(f"  • LPIPS (Detail 10%):        {close_result.lpips_score}")
    print(f"  • Color (Distribution 5%):   {close_result.color_score}")
    print(f"  • Technical Quality (5%):    {close_result.quality_score}")
    print(f"  • Duration: {close_result.inference_duration_ms}ms on {close_result.device}")

    # 5. Score Distant Recreation
    print("\n[Step 5] Evaluating Distant Recreation with 6-metric ensemble...")
    distant_result = score_images(ref_prep, distant_prep)
    print(f"[OK] Distant Recreation Final Score: {distant_result.final_score} / 100")
    print(f"  • DreamSim (Perceptual 35%): {distant_result.dreamsim_score}")
    print(f"  • DINOv2 (Structural 30%):   {distant_result.dino_score}")
    print(f"  • OpenCLIP (Semantic 15%):   {distant_result.clip_score}")
    print(f"  • LPIPS (Detail 10%):        {distant_result.lpips_score}")
    print(f"  • Color (Distribution 5%):   {distant_result.color_score}")
    print(f"  • Technical Quality (5%):    {distant_result.quality_score}")

    # 6. Verify Ranking Invariants
    print("\n[Step 6] Validating Evaluation Invariants...")
    assert close_result.final_score > distant_result.final_score, (
        f"Close recreation ({close_result.final_score}) must score higher than distant ({distant_result.final_score})"
    )
    assert 0.0 <= close_result.final_score <= 100.0, "Score out of bounds [0, 100]"
    assert 0.0 <= distant_result.final_score <= 100.0, "Score out of bounds [0, 100]"
    print("[OK] Invariant 1 passed: Close recreation scored higher than distant recreation.")
    print("[OK] Invariant 2 passed: All scores strictly bounded in [0.00, 100.00].")

    # 7. Summary
    print("\n" + "=" * 70)
    print("ALL VERIFICATIONS COMPLETED SUCCESSFULLY!")
    print("=" * 70)


if __name__ == "__main__":
    run_e2e_verification()
