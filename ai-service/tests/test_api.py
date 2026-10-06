"""
API integration tests for AI Scoring Service endpoints.
"""

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_api_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "device" in data
    assert "version" in data


def test_api_models_status_endpoint():
    response = client.get("/v1/models/status")
    assert response.status_code == 200
    data = response.json()
    assert "cached_reference_images_count" in data
    assert "models" in data

