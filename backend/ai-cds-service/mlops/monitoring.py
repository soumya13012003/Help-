import json
import pika
import pandas as pd
from scipy.stats import ks_2samp
import requests

class ModelMonitor:
    def __init__(self):
        self.airflow_webhook_url = "http://airflow-webserver.help-plus-infra.svc.cluster.local:8080/api/v1/dags/retrain_cds_model/dagRuns"
        self.airflow_auth = ("airflow_service_account", "secure_token_here") # Replaced by Vault in Prod

    def detect_data_drift(self, training_baseline_df: pd.DataFrame, production_inference_df: pd.DataFrame, p_value_threshold: float = 0.05) -> list[str]:
        """
        Uses the Kolmogorov-Smirnov (KS) statistic to detect if the distribution 
        of incoming clinical features has drifted significantly from the training baseline.
        """
        drifting_features = []
        for column in training_baseline_df.columns:
            # Only test numerical clinical features (e.g., age, heart rate, lab values)
            if pd.api.types.is_numeric_dtype(training_baseline_df[column]):
                stat, p_value = ks_2samp(training_baseline_df[column], production_inference_df[column])
                from typing import cast
                if cast(float, p_value) < p_value_threshold:
                    drifting_features.append(column)
                    print(f"⚠️ Data Drift Detected in feature '{column}' (p-value: {p_value:.4f})")
                    
        return drifting_features

    def evaluate_concept_drift(self, clinician_overrides: list[dict], total_inferences: int) -> float:
        """
        Monitors the ground-truth overriding rate from RabbitMQ feedback events.
        If doctors override the AI more than 15% of the time, the concept has drifted.
        """
        if total_inferences == 0:
            return 0.0
            
        override_rate = len(clinician_overrides) / total_inferences
        print(f"Current Clinician Override Rate: {override_rate*100:.1f}%")
        return override_rate

    def trigger_retraining_dag(self, reason: str, metrics: dict):
        """
        Fires an asynchronous webhook to Apache Airflow to spin up a retraining cluster 
        when drift thresholds are breached.
        """
        print(f"Triggering Airflow Retraining DAG. Reason: {reason}")
        
        payload = {
            "conf": {
                "trigger_reason": reason,
                "drift_metrics": metrics
            }
        }
        
        try:
            response = requests.post(
                self.airflow_webhook_url,
                auth=self.airflow_auth,
                json=payload
            )
            response.raise_for_status()
            print("Successfully triggered Airflow DAG: retrain_cds_model")
        except Exception as e:
            print(f"Failed to trigger retraining DAG: {e}")

# Example background worker loop
def run_continuous_evaluation(monitor: ModelMonitor, baseline_data: pd.DataFrame, recent_data: pd.DataFrame, recent_overrides: list):
    
    # 1. Check Data Drift
    drifted = monitor.detect_data_drift(baseline_data, recent_data)
    if len(drifted) > 3: # Arbitrary threshold: if >3 clinical features drift, retrain
        monitor.trigger_retraining_dag(
            reason="MULTIPLE_FEATURE_DATA_DRIFT", 
            metrics={"drifted_features": drifted}
        )
        return

    # 2. Check Concept Drift (Human-in-the-loop overrides)
    total = len(recent_data)
    override_rate = monitor.evaluate_concept_drift(recent_overrides, total)
    
    if override_rate > 0.15: # 15% override threshold
        monitor.trigger_retraining_dag(
            reason="CONCEPT_DRIFT_CLINICIAN_OVERRIDES",
            metrics={"override_rate": override_rate}
        )
