import io
import base64
import matplotlib
import matplotlib.pyplot as plt
import seaborn as sns
from typing import List, Dict
from xai.storage import FeatureAttributionModel

# Ensure matplotlib runs headlessly on the backend
matplotlib.use('Agg')

class ClinicalUXPalette:
    """
    Enforces a color-blind-friendly, non-alarmist palette specifically designed for clinical workflows.
    Avoids pure red/green combinations.
    """
    # Muted Amber (Risk Up / Positive Impact on risk)
    RISK_INCREASE = "#D48842" 
    
    # Muted Blue (Risk Down / Negative Impact on risk)
    RISK_DECREASE = "#4B7693"
    
    # Neutral Base
    BASE = "#E5E5E5"
    TEXT = "#2C3E50"

class VisualizationEngine:
    @staticmethod
    def _generate_bar_chart(attributions: List[FeatureAttributionModel], title: str) -> str:
        """
        Generates a high-resolution, static base64-encoded PNG visualization for PDF embedding.
        """
        if not attributions:
            return ""
            
        # Reverse to have the highest impact at the top of a horizontal bar chart
        attributions = sorted(attributions, key=lambda x: x.percentage_impact)
        
        features = [a.feature_id for a in attributions]
        impacts = [a.percentage_impact if a.raw_weight > 0 else -a.percentage_impact for a in attributions]
        
        # Apply strict Clinical UX Palette
        colors = [ClinicalUXPalette.RISK_INCREASE if val > 0 else ClinicalUXPalette.RISK_DECREASE for val in impacts]
        
        fig, ax = plt.subplots(figsize=(8, 4), dpi=300) # High-res for PDF
        
        # Remove spines for clean look
        ax.spines['top'].set_visible(False)
        ax.spines['right'].set_visible(False)
        ax.spines['bottom'].set_color(ClinicalUXPalette.BASE)
        ax.spines['left'].set_color(ClinicalUXPalette.BASE)
        ax.tick_params(colors=ClinicalUXPalette.TEXT)
        
        ax.barh(features, impacts, color=colors, height=0.6)
        
        # Draw a neutral zero-line
        ax.axvline(x=0, color=ClinicalUXPalette.BASE, linestyle='-', linewidth=2)
        
        plt.title(title, color=ClinicalUXPalette.TEXT, pad=20, fontsize=12, fontweight='bold')
        plt.xlabel("Percentage Impact on Prediction (%)", color=ClinicalUXPalette.TEXT, fontsize=10)
        plt.tight_layout()
        
        # Save to memory buffer as PNG
        buf = io.BytesIO()
        plt.savefig(buf, format='png', bbox_inches='tight', transparent=True)
        plt.close(fig)
        
        # Encode as base64 string
        buf.seek(0)
        img_str = base64.b64encode(buf.read()).decode('utf-8')
        return f"data:image/png;base64,{img_str}"

    @staticmethod
    def render_explanation_assets(structured: List[FeatureAttributionModel], unstructured: List[FeatureAttributionModel]) -> Dict[str, str]:
        """
        Generates base64 encoded static assets for both structured tabular data (SHAP)
        and unstructured clinical text (LIME).
        """
        assets = {}
        if structured:
            assets["structured_shap_chart_base64"] = VisualizationEngine._generate_bar_chart(
                structured, 
                "Key Clinical Factors Influencing Risk (Tabular)"
            )
            
        if unstructured:
            assets["unstructured_lime_chart_base64"] = VisualizationEngine._generate_bar_chart(
                unstructured, 
                "Key Narrative Factors Influencing Risk (Text)"
            )
            
        return assets
