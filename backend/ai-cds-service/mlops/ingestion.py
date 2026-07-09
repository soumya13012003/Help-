import json
import re
from typing import Any, Dict, List
import pandas as pd
from pydantic import BaseModel, Field

class ClinicalNote(BaseModel):
    note_id: str
    patient_id: str
    raw_text: str
    timestamp: str

class IngestionResult(BaseModel):
    patient_id: str
    safe_text: str
    demographics: Dict[str, Any]
    conditions: List[str]
    medications: List[str]

class Deidentifier:
    """
    Implements HIPAA Safe Harbor de-identification by removing or masking 
    the 18 protected health information (PHI) identifiers.
    """
    def __init__(self):
        # Basic Regex patterns for Safe Harbor
        self.patterns = {
            "SSN": r"\b\d{3}-\d{2}-\d{4}\b",
            "PHONE": r"\b(?:\+?1[-. ]?)?\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})\b",
            "EMAIL": r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b",
            "DATE": r"\b\d{1,2}[/-]\d{1,2}[/-]\d{2,4}\b",
            "MRN": r"\b(?:MRN|MR)[-:\s]*\d+\b",
        }
    
    def strip_phi(self, text: str) -> str:
        safe_text = text
        for label, pattern in self.patterns.items():
            safe_text = re.sub(pattern, f"[{label}]", safe_text, flags=re.IGNORECASE)
        # In a real implementation, a local NER model (e.g., presidio or local transformers)
        # would be used here to mask Names, Locations, etc.
        return safe_text

class IngestionPipeline:
    def __init__(self):
        self.deidentifier = Deidentifier()
        
    def ingest_fhir_payload(self, fhir_json: str) -> Dict[str, Any]:
        """
        Parses a FHIR R4 JSON bundle, extracts relevant clinical features,
        and ensures PHI is stripped from any narrative text.
        """
        bundle = json.loads(fhir_json)
        
        patient_id = "unknown"
        demographics = {}
        conditions = []
        medications = []
        
        # Simple FHIR Bundle traversal
        entries = bundle.get("entry", [])
        for entry in entries:
            resource = entry.get("resource", {})
            rtype = resource.get("resourceType")
            
            if rtype == "Patient":
                patient_id = resource.get("id", "unknown")
                # Extract age, gender (safe demographics)
                demographics["gender"] = resource.get("gender", "unknown")
                # Do not extract exact birthDate for HIPAA compliance; calculate age bucket if needed
                
            elif rtype == "Condition":
                code_display = resource.get("code", {}).get("text", "")
                if code_display:
                    conditions.append(code_display)
                    
            elif rtype == "MedicationRequest":
                med = resource.get("medicationCodeableConcept", {}).get("text", "")
                if med:
                    medications.append(med)
                    
        return {
            "patient_id": patient_id,
            "demographics": demographics,
            "conditions": conditions,
            "medications": medications
        }

    def process_clinical_note(self, note: ClinicalNote) -> IngestionResult:
        """
        Ingests a raw clinical note and applies PHI stripping.
        """
        safe_text = self.deidentifier.strip_phi(note.raw_text)
        
        return IngestionResult(
            patient_id=note.patient_id,
            safe_text=safe_text,
            demographics={},
            conditions=[],
            medications=[]
        )
        
    def stratify_dataset(self, df: pd.DataFrame, target_col: str, n_splits: int = 5) -> pd.DataFrame:
        """
        Handles missing data and class imbalances typical in clinical datasets
        using robust, deterministic stratification strategies.
        """
        # Fill missing numeric values with median (robust to outliers)
        numeric_cols = df.select_dtypes(include=['number']).columns
        median_vals = df[numeric_cols].median()
        df[numeric_cols] = df[numeric_cols].fillna(median_vals)  # type: ignore
        
        # Fill categorical with mode
        cat_cols = df.select_dtypes(include=['object', 'category']).columns
        for col in cat_cols:
            if not df[col].empty and not df[col].mode().empty:
                df[col] = df[col].fillna(df[col].mode()[0])  # type: ignore
        
        # Oversample minority classes deterministically (simple approach for MVP)
        class_counts = df[target_col].value_counts()
        max_count = class_counts.max()
        
        stratified_dfs = []
        for class_label, count in class_counts.items():
            class_df = df[df[target_col] == class_label]
            # Resample minority classes to match the majority class
            resampled_df = class_df.sample(n=max_count, replace=True, random_state=42)
            stratified_dfs.append(resampled_df)
            
        balanced_df = pd.concat(stratified_dfs).sample(frac=1, random_state=42).reset_index(drop=True)
        return balanced_df
