"""
Tests for main FastAPI application
"""

import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

def test_root_endpoint():
    """Test root endpoint returns service info"""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["service"] == "VIPContentAI AI Service"
    assert data["status"] == "running"
    assert "version" in data

def test_health_check():
    """Test health check endpoint"""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "ollama_url" in data

def test_list_models():
    """Test models listing endpoint"""
    response = client.get("/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert isinstance(data["models"], list)
