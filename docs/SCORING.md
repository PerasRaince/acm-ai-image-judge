# AI Image Judge — Scoring Engine Specification

## 1. Primary Concept: Reference Similarity Score

The engine produces an explainable, deterministic **Reference Similarity Score (0–100)** measuring how faithfully a participant's AI-generated recreation corresponds to an official reference benchmark. It is not an aesthetic classifier or prompt generator.

## 2. Metric Breakdown & Weights (Version: v1.0.0)

| Metric | Subsystem | Raw Output Direction | Calibrated Formula ($S_i \in [0, 100]$) | Weight |
| :--- | :--- | :--- | :--- | :--- |
| **DreamSim** | Human Perceptual Similarity | Distance: $d \in [0, 1+]$ (lower is better) | $\max(0, \min(100, (1.0 - d) \times 100))$ | **35%** |
| **DINOv2** | Structural / Layout Correspondence | Cosine similarity: $c \in [-1, 1]$ (higher is better) | $\max(0, \min(100, c \times 100))$ | **30%** |
| **OpenCLIP** | Semantic / Subject Similarity | Cosine similarity: $c \in [-1, 1]$ (higher is better) | $\max(0, \min(100, c \times 100))$ | **15%** |
| **LPIPS** | Detail & Micro-Texture Distance | Distance: $d \in [0, 1+]$ (lower is better) | $\max(0, \min(100, (1.0 - d) \times 100))$ | **10%** |
| **Color** | CIE L\*a\*b\* & HSV Histogram | Correlation & centroid proximity: $s \in [0, 1]$ | $\max(0, \min(100, s \times 100))$ | **5%** |
| **Quality** | Sharpness, Dynamic Range & Focus | Laplacian variance & contrast: $q \in [0, 1]$ | $\max(0, \min(100, q \times 100))$ | **5%** |

## 3. Final Composite Formula

$$\text{Final Score} = \sum_{i=1}^6 w_i \cdot S_i$$

Specifically:
$$\text{Final Score} = 0.35 \cdot S_{\text{dreamsim}} + 0.30 \cdot S_{\text{dino}} + 0.15 \cdot S_{\text{clip}} + 0.10 \cdot S_{\text{lpips}} + 0.05 \cdot S_{\text{color}} + 0.05 \cdot S_{\text{quality}}$$

Results are rounded to two decimal places and clamped to $[0.00, 100.00]$.

## 4. Deterministic Tie-Breaking Policy

When two participants or submissions have identical scores on the leaderboard, rank order is resolved deterministically:
1. **Primary**: Final Composite Reference Similarity Score (Descending)
2. **Secondary**: DreamSim Perceptual Similarity Score (Descending)
3. **Tertiary**: DINOv2 Structural Correspondence Score (Descending)
4. **Quaternary**: Earliest Valid Submission Timestamp (Ascending)

## 5. Anti-Cheating & Integrity Protections

1. **Exact Reference Re-Upload**: The backend and AI service inspect SHA-256 digests. If a candidate recreation has an identical hash to the competition reference image, the attempt is immediately flagged as an exact match and rejected.
2. **Re-submission Prevention**: A contestant cannot submit the identical file multiple times to exhaust attempts or test non-deterministic jitter.
3. **Attempt Caps**: Database transactions enforce that a user cannot submit beyond the competition's attempt ceiling.
4. **Frozen Versions**: When a competition starts, its `scoring_version_id` is locked. No selective rescoring occurs with newer models.

## 6. Known Limitations

- **Model Invariance to Artistic Style Nuances**: Pretrained vision models may penalize non-photorealistic styles (e.g. watercolor vs oil painting) differently. Future versions can incorporate style-invariant calibration weights.
- **Aspect Ratio Padding**: Minor aspect ratio differences are handled with standard interpolation rather than non-uniform stretching.
