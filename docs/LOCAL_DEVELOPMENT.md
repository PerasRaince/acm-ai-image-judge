# AI Image Judge — Local Development Guide

## 1. Prerequisites

- **Node.js**: v20+ (v22.19.0 verified)
- **Python**: 3.10+ with PyTorch
- **CUDA**: Optional (automatic fallback to CPU supported)

## 2. Port Allocation

| Component | Default Port | Description |
| :--- | :--- | :--- |
| **Frontend** | `3000` | Next.js App Router Web UI (`http://localhost:3000`) |
| **Backend** | `4000` | Express REST API (`http://localhost:4000/api/v1`) |
| **AI Service** | `8000` | FastAPI PyTorch Scoring Engine (`http://localhost:8000`) |

## 3. Starting the Services

### Start AI Scoring Service (Python/FastAPI)
```powershell
cd ai-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start Backend API (Node.js/Express)
```powershell
cd backend
npm run dev
```

### Start Frontend Web App (Next.js)
```powershell
cd frontend
npm run dev
```

## 4. Running Verification & Tests

### Backend Unit Tests (Jest)
```powershell
cd backend
npm test
```

### AI Service Unit & Invariant Tests (pytest)
```powershell
cd ai-service
python -m pytest tests/ -v
```

### Full System End-to-End Test
```powershell
python scripts/verify_e2e.py
```

### Export Calibration Dataset
```powershell
python scripts/export_calibration.py
```
