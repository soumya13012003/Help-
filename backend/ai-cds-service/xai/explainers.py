import shap
from lime.lime_text import LimeTextExplainer
from typing import Any, Dict, List, Tuple
import pandas as pd
import numpy as np

class FeatureAttribution:
    def __init__(self, feature_id: str, raw_weight: float, percentage_impact: float, description: str = ""):
        self.feature_id = feature_id
        self.raw_weight = raw_weight
        self.percentage_impact = percentage_impact
        self.description = description

class DualEngineExplainer:
    def __init__(self, structured_model: Any, unstructured_model: Any, background_data: pd.DataFrame):
        """
        Initializes both SHAP for structured tabular features and LIME for unstructured clinical text.
        """
        self.structured_model = structured_model
        self.unstructured_model = unstructured_model
        
        # 1. SHAP Tree/Kernel Setup
        # Use k-means summarization to reduce background dataset size and meet <150ms latency budget
        self.background_summary = shap.kmeans(background_data, 50)
        
        from typing import Any as TypeAny
        self.shap_explainer: TypeAny
        try:
            # TreeExplainer is exact and fast for gradient boosted trees
            self.shap_explainer = shap.TreeExplainer(structured_model, data=self.background_summary)
        except Exception:
            # Fallback for black-box/neural network models
            self.shap_explainer = shap.KernelExplainer(structured_model.predict_proba, self.background_summary) # type: ignore
            
        # 2. LIME Text Surrogate Setup
        # Optimized for clinical text: word-level perturbations
        self.lime_explainer = LimeTextExplainer(
            class_names=["Low_Risk", "High_Risk"],
            split_expression=r'\W+', # Tokenize by non-word characters (spaces, punctuation)
            random_state=42
        )

    def _normalize_to_percentage(self, weights: List[Tuple[str, float]]) -> List[FeatureAttribution]:
        """
        Standardizes raw SHAP/LIME weights into percentage-impact metrics for the UI.
        """
        total_absolute_impact = sum(abs(w[1]) for w in weights)
        if total_absolute_impact == 0:
            return [FeatureAttribution(w[0], w[1], 0.0) for w in weights]
            
        attributions = []
        for feature_id, weight in weights:
            pct = (abs(weight) / total_absolute_impact) * 100
            attributions.append(FeatureAttribution(feature_id, float(weight), float(pct)))
            
        # Sort by highest impact first
        attributions.sort(key=lambda x: x.percentage_impact, reverse=True)
        return attributions

    def explain_structured(self, patient_features: pd.DataFrame) -> List[FeatureAttribution]:
        """
        Computes local feature attributions using SHAP.
        Note: The dataframe columns must be standardized LOINC/SNOMED keys, not PHI.
        """
        shap_values = self.shap_explainer.shap_values(patient_features)
        
        # Depending on binary classification, shap_values might be a list of arrays
        if isinstance(shap_values, list):
            # Take the positive class
            patient_shap = shap_values[1][0]
        else:
            patient_shap = shap_values[0]
            
        feature_names = patient_features.columns.tolist()
        raw_weights = list(zip(feature_names, patient_shap))
        
        return self._normalize_to_percentage(raw_weights)

    def explain_unstructured(self, clinical_note: str) -> List[FeatureAttribution]:
        """
        Computes local surrogate attributions using LIME for raw clinical text.
        """
        if not clinical_note or len(clinical_note.strip()) == 0:
            return []
            
        # Generates neighborhood perturbations and fits a local ridge regression
        explanation = self.lime_explainer.explain_instance(
            clinical_note,
            self.unstructured_model.predict_proba, # Must return probabilities [[p0, p1], ...]
            num_features=5, # Limit to top 5 tokens for UI clarity
            num_samples=500 # Kept relatively low to respect <150ms latency budget
        )
        
        # explanation.as_list() returns [('hypertension', 0.15), ('normal', -0.05), ...]
        raw_weights = explanation.as_list() 
        return self._normalize_to_percentage(raw_weights)
        
    def generate_unified_explanation(self, structured_features: pd.DataFrame, clinical_note: str) -> Dict[str, List[FeatureAttribution]]:
        """
        Orchestrator that executes both explainers and returns a combined map.
        """
        structured_attributions = self.explain_structured(structured_features)
        text_attributions = self.explain_unstructured(clinical_note)
        
        return {
            "structured_tabular": structured_attributions,
            "unstructured_text": text_attributions
        }
