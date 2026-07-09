import pytest
from fastapi.testclient import TestClient
from main import app
import json

client = TestClient(app)

def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_predict_endpoint_xai_payload():
    fhir_payload = {
        "resourceType": "Bundle",
        "entry": [
            {"resource": {"resourceType": "Patient", "id": "pat123", "birthDate": "1960-01-01"}}
        ]
    }
    payload = {
        "fhir_patient_payload": json.dumps(fhir_payload),
        "clinical_query": "Patient experiencing severe chest pain, radiating to left arm.",
        "condition_filter": "Cardiology"
    }
    
    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # 1. Check Metadata block
        assert "metadata" in data
        assert "inference_id" in data["metadata"]
        assert "audit_seal" in data["metadata"]
        
        # 2. Check Prediction block
        assert "prediction" in data
        assert "risk_score" in data["prediction"]
        # Because we passed "pain", our mock logic should return high risk (0.82)
        assert data["prediction"]["risk_score"] > 0.8
        
        # 3. Check Explainability block (SHAP/LIME assets)
        assert "explainability" in data
        assert "top_structured_factors" in data["explainability"]
        assert len(data["explainability"]["top_structured_factors"]) > 0
        assert "visual_assets" in data["explainability"]
        assert "structured_shap_chart_base64" in data["explainability"]["visual_assets"]
        
        # 4. Check Clinical Context (RAG)
        assert "clinical_context" in data
        assert "rag_guidelines" in data["clinical_context"]

def test_predict_endpoint_low_risk():
    fhir_payload = {
        "resourceType": "Bundle",
        "entry": [
            {"resource": {"resourceType": "Patient", "id": "pat456", "birthDate": "1990-01-01"}}
        ]
    }
    payload = {
        "fhir_patient_payload": json.dumps(fhir_payload),
        "clinical_query": "Routine checkup for asymptomatic hypertension.",
        "condition_filter": "Cardiology"
    }
    
    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        assert response.status_code == 200
        data = response.json()
        
        # Because there's no "pain", mock logic returns low risk (0.15)
        assert data["prediction"]["risk_score"] < 0.2
        assert data["prediction"]["risk_category"] == "Low"
        assert len(data["explainability"]["top_unstructured_factors"]) == 0

if __name__ == "__main__":
    print("Run `pytest test_main.py -v` to run these tests.")
