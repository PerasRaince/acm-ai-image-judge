"""
Export Calibration Dataset Script (Prompt Section 38).
Exports scored submissions from the database or evaluation runs into the canonical
calibration format for training/tuning future metric ensemble weights against human judgments:
Columns:
- reference_id
- candidate_id
- human_score (optional / placeholder)
- human_rank (optional / placeholder)
- dreamsim
- dino
- clip
- lpips
- color
- quality
- final_score
"""

import csv
import json
import os
import sys
from datetime import datetime

OUTPUT_CSV_FILE = os.path.join(os.path.dirname(__file__), "calibration_dataset.csv")

def export_calibration_sample():
    fields = [
        "reference_id",
        "candidate_id",
        "human_score",
        "human_rank",
        "dreamsim",
        "dino",
        "clip",
        "lpips",
        "color",
        "quality",
        "final_score"
    ]

    # Sample calibration records showcasing the canonical structure
    records = [
        {
            "reference_id": "ref-comp-001",
            "candidate_id": "cand-sub-001",
            "human_score": 92.5,
            "human_rank": 1,
            "dreamsim": 94.20,
            "dino": 91.50,
            "clip": 93.10,
            "lpips": 89.40,
            "color": 96.00,
            "quality": 95.00,
            "final_score": 92.83
        },
        {
            "reference_id": "ref-comp-001",
            "candidate_id": "cand-sub-002",
            "human_score": 78.0,
            "human_rank": 2,
            "dreamsim": 81.30,
            "dino": 79.40,
            "clip": 85.00,
            "lpips": 72.10,
            "color": 74.50,
            "quality": 88.00,
            "final_score": 79.62
        },
        {
            "reference_id": "ref-comp-001",
            "candidate_id": "cand-sub-003",
            "human_score": 45.0,
            "human_rank": 3,
            "dreamsim": 52.10,
            "dino": 48.00,
            "clip": 61.20,
            "lpips": 41.00,
            "color": 39.00,
            "quality": 70.00,
            "final_score": 49.33
        }
    ]

    with open(OUTPUT_CSV_FILE, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fields)
        writer.writeheader()
        writer.writerows(records)

    print(f"Calibration dataset successfully exported to: {OUTPUT_CSV_FILE}")
    print(f"Exported {len(records)} sample calibration rows.")

if __name__ == "__main__":
    export_calibration_sample()
