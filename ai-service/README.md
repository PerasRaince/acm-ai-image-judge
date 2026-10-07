---
title: ACM AI Image Judge Scoring Service
emoji: 🎯
colorFrom: blue
colorTo: indigo
sdk: docker
app_port: 7860
pinned: false
---

# ACM AI Image Judge — Scoring Service

Production vision evaluation engine for AI Image Recreation competitions.
Deployed on Hugging Face Spaces with 16 GB RAM and 2 vCPUs.

## Architecture & Vision Ensemble
This service executes a multi-metric vision evaluation ensemble:
- **DreamSim** (35% weight): Human perceptual similarity metric.
- **DINOv2** (30% weight): Self-supervised structural correspondence and spatial layout.
- **OpenCLIP** (15% weight): High-level semantic concept alignment.
- **LPIPS** (10% weight): Deep patch texture fidelity.
- **Color Histograms** (5% weight): HSV & CIE L*a*b* distribution earth mover similarity.
- **Technical Quality** (5% weight): Sharpness, blur, dynamic range, and integrity verification.

## Endpoints
- `GET /health` - System health, device status, and model pre-warm report.
- `POST /v1/score` - Multipart form comparison (`reference_file` and `candidate_file`).
- `GET /docs` - Interactive OpenAPI / Swagger UI.
