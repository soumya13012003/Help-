import json
import uuid
import hashlib
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Dict, Any

from mlops.rag_pipeline import HybridRagPipeline
from mlops.ingestion import IngestionPipeline, ClinicalNote
from mlops.monitoring import ModelMonitor
from xai.report_generator import ReportGenerator
from xai.visualization import VisualizationEngine
from xai.storage import FeatureAttributionModel

# Global singletons
rag_pipeline: HybridRagPipeline
ingestion_pipeline: IngestionPipeline
model_monitor: ModelMonitor
report_generator: ReportGenerator

@asynccontextmanager
async def lifespan(app: FastAPI):
    global rag_pipeline, ingestion_pipeline, model_monitor, report_generator
    print("Initializing RAG Pipeline...")
    rag_pipeline = HybridRagPipeline(db_path="./data/chromadb")
    print("Initializing Ingestion Pipeline...")
    ingestion_pipeline = IngestionPipeline()
    print("Initializing Model Monitor...")
    model_monitor = ModelMonitor()
    print("Initializing XAI Report Generator...")
    report_generator = ReportGenerator()
    yield
    print("Shutting down AI CDS Service...")

app = FastAPI(
    title="AI Clinical Decision Support Service",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CdsConsultRequest(BaseModel):
    fhir_patient_payload: str = Field(..., description="Raw FHIR JSON payload of the patient")
    clinical_query: str = Field(..., description="The query to search the guidelines for")
    condition_filter: str | None = Field(None, description="Optional medical condition to filter guidelines")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

ACTIVE_QUEUE = [
  { "id": "PT-1290", "name": "Eleanor Vance", "age": 42, "waitTime": "12m", "aiScore": 92, "status": "critical", "complaint": "Chest pain, shortness of breath", "location": "Telehealth Waiting Room", "query": "chest pain acute myocardial infarction" },
  { "id": "PT-8841", "name": "Marcus Chen", "age": 28, "waitTime": "24m", "aiScore": 45, "status": "warning", "complaint": "Severe migraine, nausea", "location": "In-Person (Room 3)", "query": "severe migraine nausea" },
  { "id": "PT-4322", "name": "Sarah Jenkins", "age": 65, "waitTime": "5m", "aiScore": 12, "status": "default", "complaint": "Routine follow-up (Hypertension)", "location": "Telehealth Waiting Room", "query": "routine hypertension follow up" },
]

@app.get("/queue")
async def get_queue():
    # Sort queue by aiScore descending before returning
    sorted_queue = sorted(ACTIVE_QUEUE, key=lambda x: x.get("aiScore", 0), reverse=True)
    return {"queue": sorted_queue}

class QueuePatientRequest(BaseModel):
    name: str
    age: int
    waitTime: str
    aiScore: int
    status: str
    complaint: str
    location: str
    query: str

@app.post("/queue/add")
async def add_to_queue(patient: QueuePatientRequest):
    new_id = f"PT-{len(ACTIVE_QUEUE) + 9000}"
    new_patient = patient.dict()
    new_patient["id"] = new_id
    ACTIVE_QUEUE.append(new_patient)
    return {"success": True, "patient": new_patient}

class RemovePatientRequest(BaseModel):
    patient_id: str

@app.post("/queue/remove")
async def remove_from_queue(req: RemovePatientRequest):
    global ACTIVE_QUEUE
    ACTIVE_QUEUE = [p for p in ACTIVE_QUEUE if p.get("id") != req.patient_id]
    return {"success": True}

class LoginRequest(BaseModel):
    login_id: str = Field(..., description="The user's login ID or email")
    password: str = Field(..., description="The user's password in plain text")

class SignupRequest(BaseModel):
    name: str = Field(..., description="Full name of the user")
    email: str = Field(..., description="Email address for login")
    password: str = Field(..., description="Plain text password")
    role: str = Field(..., description="Role or specialty (e.g. Cardiologist)")

# Persistent user database
USERS_FILE = "./data/users.json"

def load_users():
    if os.path.exists(USERS_FILE):
        try:
            with open(USERS_FILE, "r") as f:
                return json.load(f)
        except Exception:
            pass
    return {
        "dr.mehta@helpplus.health": {
            "password_hash": "240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9",
            "name": "Dr. Rajan Mehta",
            "role": "Cardiologist",
        }
    }

def save_users(db):
    os.makedirs(os.path.dirname(USERS_FILE), exist_ok=True)
    with open(USERS_FILE, "w") as f:
        json.dump(db, f, indent=4)

USERS_DB = load_users()

@app.post("/signup")
async def signup(request: SignupRequest):
    if request.email in USERS_DB:
        raise HTTPException(status_code=400, detail="User with this email already exists")
    
    password_hash = hashlib.sha256(request.password.encode('utf-8')).hexdigest()
    USERS_DB[request.email] = {
        "password_hash": password_hash,
        "name": request.name,
        "role": request.role
    }
    save_users(USERS_DB)
    
    return {
        "success": True,
        "message": "User registered successfully",
        "user": {"name": request.name, "email": request.email, "role": request.role}
    }

@app.post("/login")
async def login(request: LoginRequest):
    user = USERS_DB.get(request.login_id)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    password_hash = hashlib.sha256(request.password.encode('utf-8')).hexdigest()
    
    if password_hash == user["password_hash"]:
        return {
            "authenticated": True,
            "user": {"name": user["name"], "role": user["role"], "email": request.login_id},
            "token": "jwt-" + str(uuid.uuid4())
        }
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")

@app.post("/predict")
async def predict_clinical_outcome(request: CdsConsultRequest):
    """
    Returns the comprehensive XAI Payload including RAG guidelines and visual charts.
    """
    try:
        # 1. Parse FHIR
        patient_data = ingestion_pipeline.ingest_fhir_payload(request.fhir_patient_payload)
        patient_sk = "hash-" + str(uuid.uuid4())[:8] # Mock hashed patient_sk
        inference_id = str(uuid.uuid4())
        
        # 2. Retrieve Guidelines (RAG)
        rag_response = rag_pipeline.hybrid_search(
            clinical_query=request.clinical_query,
            condition_filter=request.condition_filter,
            n_results=1
        )
        rag_references = [{"text_chunk": doc, "source_uri": "Internal Guidelines", "condition_tag": request.condition_filter or "General"} for doc in rag_response.documents]
        
        # 3. Mock Model Inference & Explainability Weights
        risk_score = 0.82 if "pain" in request.clinical_query.lower() else 0.15
        
        structured_attributions = [
            FeatureAttributionModel(feature_id="systolic_bp", raw_weight=0.15, percentage_impact=45.0),
            FeatureAttributionModel(feature_id="serum_creatinine", raw_weight=0.08, percentage_impact=22.4),
            FeatureAttributionModel(feature_id="age", raw_weight=0.05, percentage_impact=10.0),
        ] if risk_score > 0.5 else [
            FeatureAttributionModel(feature_id="heart_rate", raw_weight=-0.12, percentage_impact=30.0),
            FeatureAttributionModel(feature_id="cholesterol", raw_weight=-0.08, percentage_impact=20.0),
        ]
        
        unstructured_attributions = [
            FeatureAttributionModel(feature_id="hypertension", raw_weight=0.20, percentage_impact=60.0),
            FeatureAttributionModel(feature_id="smoker", raw_weight=0.10, percentage_impact=25.0)
        ] if risk_score > 0.5 else []

        # 4. Generate Base64 Visual Assets (SHAP/LIME charts)
        visual_assets = VisualizationEngine.render_explanation_assets(
            structured=structured_attributions,
            unstructured=unstructured_attributions
        )

        # 5. Build Final XAI Payload
        final_payload = report_generator.build_clinician_payload(
            inference_id=inference_id,
            patient_sk=patient_sk,
            model_version="v2.1.0-xgb",
            risk_score=risk_score,
            confidence_interval=[risk_score - 0.05, risk_score + 0.05],
            recommended_action="STAT Cardiology Consult" if risk_score > 0.5 else "Routine Follow-up",
            structured_attributions=structured_attributions,
            unstructured_attributions=unstructured_attributions,
            rag_references=rag_references,
            visual_assets=visual_assets,
            audit_hash="mock-sha256-seal"
        )
        
        return final_payload
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
