from typing import List, Dict, Any
from xai.storage import FeatureAttributionModel

class NaturalLanguageGenerator:
    @staticmethod
    def generate_clinical_summary(
        risk_category: str, 
        prediction_prob: float, 
        top_structured: List[FeatureAttributionModel],
        top_unstructured: List[FeatureAttributionModel]
    ) -> str:
        """
        Translates raw attribution vectors into declarative, natural language sentences.
        """
        if prediction_prob < 0.5:
            base_sentence = f"The patient is currently assessed at {risk_category} risk ({prediction_prob:.1%} probability)."
        else:
            base_sentence = f"The patient is assessed at {risk_category} risk ({prediction_prob:.1%} probability)."

        drivers = []
        
        # Analyze structured tabular features
        if top_structured:
            primary_factor = top_structured[0]
            direction = "increase" if primary_factor.raw_weight > 0 else "decrease"
            # Format feature name for readability (e.g., "serum_creatinine" -> "serum creatinine")
            clean_name = primary_factor.feature_id.replace("_", " ")
            drivers.append(f"primarily driven by a {primary_factor.percentage_impact:.1f}% {direction} impact from {clean_name}")
            
            # If there's a strong secondary factor
            if len(top_structured) > 1 and top_structured[1].percentage_impact > 10.0:
                sec_factor = top_structured[1]
                sec_dir = "increase" if sec_factor.raw_weight > 0 else "decrease"
                sec_name = sec_factor.feature_id.replace("_", " ")
                drivers.append(f"and a {sec_factor.percentage_impact:.1f}% {sec_dir} impact from {sec_name}")

        # Analyze unstructured text features
        if top_unstructured:
            # We assume these are clinical terms like "hypertension" or "smoker"
            text_factors = [f.feature_id for f in top_unstructured if f.raw_weight > 0][:2]
            if text_factors:
                drivers.append(f"with compounding historical clinical notes mentioning '{', '.join(text_factors)}'")

        if not drivers:
            return base_sentence + " No specific primary drivers could be isolated with high confidence."
            
        # Construct the final sentence
        return f"{base_sentence} This assessment was " + ", ".join(drivers) + "."

class ReportGenerator:
    def __init__(self):
        self.nlg = NaturalLanguageGenerator()

    def build_clinician_payload(
        self,
        inference_id: str,
        patient_sk: str,
        model_version: str,
        risk_score: float,
        confidence_interval: List[float],
        recommended_action: str,
        structured_attributions: List[FeatureAttributionModel],
        unstructured_attributions: List[FeatureAttributionModel],
        rag_references: List[Dict[str, Any]],
        visual_assets: Dict[str, str],
        audit_hash: str
    ) -> Dict[str, Any]:
        """
        Aggregates the core prediction, driving features, visualizations, and RAG references
        into a clean structural payload for the Clinician BFF.
        """
        risk_category = "High" if risk_score >= 0.5 else "Low"
        
        # Generate the Natural Language Summary
        nlg_summary = self.nlg.generate_clinical_summary(
            risk_category=risk_category,
            prediction_prob=risk_score,
            top_structured=structured_attributions,
            top_unstructured=unstructured_attributions
        )
        
        return {
            "metadata": {
                "inference_id": inference_id,
                "patient_sk": patient_sk,
                "model_version_hash": model_version,
                "audit_seal": audit_hash
            },
            "prediction": {
                "risk_category": risk_category,
                "risk_score": risk_score,
                "confidence_interval": confidence_interval,
                "recommended_action": recommended_action,
                "declarative_summary": nlg_summary
            },
            "explainability": {
                "top_structured_factors": [a.model_dump() for a in structured_attributions[:5]],
                "top_unstructured_factors": [a.model_dump() for a in unstructured_attributions[:5]],
                "visual_assets": visual_assets
            },
            "clinical_context": {
                "rag_guidelines": rag_references
            }
        }
