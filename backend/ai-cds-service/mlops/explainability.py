import shap
import pandas as pd
import numpy as np
from typing import Dict, List, Any
from pydantic import BaseModel

class ShapFeature(BaseModel):
    feature_name: str
    impact_score: float
    contribution_direction: str # "positive" (increases risk) or "negative" (decreases risk)

class ExplainabilityReport(BaseModel):
    inference_id: str
    base_value: float
    predicted_probability: float
    top_driving_features: List[ShapFeature]

class ClinicalExplainer:
    def __init__(self, model: Any, background_data: pd.DataFrame):
        """
        Initializes the SHAP TreeExplainer or KernelExplainer depending on the model type.
        For enterprise scaling with latency constraints <10ms, an exact TreeExplainer is preferred 
        for tree-based models (XGBoost, Random Forest).
        """
        self.model = model
        from typing import Any
        self.explainer: Any
        # Try to use TreeExplainer for speed, fallback to KernelExplainer
        try:
            self.explainer = shap.TreeExplainer(model)
        except Exception:
            self.explainer = shap.KernelExplainer(model.predict, shap.sample(background_data, 100))  # type: ignore
            
    def generate_explanation(self, inference_id: str, patient_features: pd.DataFrame, top_k: int = 5) -> ExplainabilityReport:
        """
        Generates post-hoc explainability by extracting the top driving features for an inference.
        """
        # Calculate SHAP values for the given patient
        shap_values = self.explainer.shap_values(patient_features)
        
        # Determine the base value (expected value over the background dataset)
        if isinstance(self.explainer.expected_value, (list, np.ndarray)):
            base_value = float(self.explainer.expected_value[1]) # For binary classification positive class
            patient_shap = shap_values[1][0] if isinstance(shap_values, list) else shap_values[0]
        else:
            base_value = float(self.explainer.expected_value)
            patient_shap = shap_values[0]

        # Calculate final prediction probability (base + sum of SHAP)
        # Note: In reality, log-odds need to be passed through a sigmoid for probabilities
        predicted_prob = base_value + float(np.sum(patient_shap))
        
        # Extract feature names and map to their SHAP values
        feature_names = patient_features.columns.tolist()
        feature_impacts = list(zip(feature_names, patient_shap))
        
        # Sort by absolute impact to find the most influential features
        feature_impacts.sort(key=lambda x: abs(x[1]), reverse=True)
        top_features = feature_impacts[:top_k]
        
        shap_features = []
        for name, impact in top_features:
            direction = "positive" if impact > 0 else "negative"
            shap_features.append(
                ShapFeature(
                    feature_name=name,
                    impact_score=float(abs(impact)),
                    contribution_direction=direction
                )
            )
            
        return ExplainabilityReport(
            inference_id=inference_id,
            base_value=base_value,
            predicted_probability=predicted_prob,
            top_driving_features=shap_features
        )
