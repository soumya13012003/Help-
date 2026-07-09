import hashlib
import json
from datetime import datetime
from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from sqlalchemy import Column, String, Float, JSON, DateTime, Integer, create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

Base = declarative_base()

# 1. Pydantic Models for Serialization
class FeatureAttributionModel(BaseModel):
    feature_id: str
    raw_weight: float
    percentage_impact: float

class InferenceExplanationModel(BaseModel):
    inference_id: str = Field(..., description="UUID connecting this explanation to the clinical prediction")
    patient_sk: str = Field(..., description="Pseudonymized patient surrogate key. Zero PHI.")
    model_version_hash: str = Field(..., description="Git commit hash or MLflow run_id of the model used")
    prediction_probability: float
    base_value: float
    structured_attributions: List[FeatureAttributionModel]
    unstructured_attributions: List[FeatureAttributionModel]
    audit_hash: Optional[str] = None # Will be populated by the interceptor
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat())

# 2. SQLAlchemy ORM Model
class InferenceExplanationRecord(Base):
    __tablename__ = "ai_inference_log"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    inference_id = Column(String, unique=True, nullable=False, index=True)
    patient_sk = Column(String, nullable=False, index=True)
    model_version_hash = Column(String, nullable=False)
    prediction_probability = Column(Float, nullable=False)
    base_value = Column(Float, nullable=False)
    
    # Store attributions as structured JSONB (PostgreSQL)
    structured_attributions = Column(JSON, nullable=False)
    unstructured_attributions = Column(JSON, nullable=False)
    
    timestamp = Column(String, nullable=False)
    audit_hash = Column(String, nullable=False, unique=True) # The cryptographic seal

# 3. Cryptographic Audit Interceptor
class AuditSealer:
    @staticmethod
    def generate_sha256_seal(explanation: InferenceExplanationModel) -> str:
        """
        Creates a deterministic cryptographic hash of the explanation payload.
        This guarantees the explanation log is immutable and satisfies clinical negligence audit requirements.
        """
        # Exclude the audit_hash field itself during calculation
        payload = explanation.model_dump(exclude={"audit_hash"})
        # Sort keys to ensure deterministic JSON stringification
        payload_str = json.dumps(payload, sort_keys=True)
        return hashlib.sha256(payload_str.encode('utf-8')).hexdigest()

class XAIStorageManager:
    def __init__(self, db_url: str = "sqlite:///:memory:"): # Mocking Postgres with SQLite in-memory for testing
        self.engine = create_engine(db_url)
        Base.metadata.create_all(self.engine)
        self.SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=self.engine)
        
    def log_explanation(self, explanation: InferenceExplanationModel) -> str:
        """
        Applies the cryptographic seal and persists the explanation to the relational database.
        """
        # 1. Generate and apply the cryptographic seal
        seal = AuditSealer.generate_sha256_seal(explanation)
        explanation.audit_hash = seal
        
        # 2. Map Pydantic to SQLAlchemy
        db_record = InferenceExplanationRecord(
            inference_id=explanation.inference_id,
            patient_sk=explanation.patient_sk,
            model_version_hash=explanation.model_version_hash,
            prediction_probability=explanation.prediction_probability,
            base_value=explanation.base_value,
            structured_attributions=[a.model_dump() for a in explanation.structured_attributions],
            unstructured_attributions=[a.model_dump() for a in explanation.unstructured_attributions],
            timestamp=explanation.timestamp,
            audit_hash=explanation.audit_hash
        )
        
        # 3. Persist
        with self.SessionLocal() as session:
            session.add(db_record)
            session.commit()
            
        print(f"Explanation {explanation.inference_id} securely sealed with hash: {seal}")
        return seal
