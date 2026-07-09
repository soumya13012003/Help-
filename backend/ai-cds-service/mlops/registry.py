import mlflow
from mlflow.tracking import MlflowClient
from typing import Dict, Any

class ModelRegistry:
    def __init__(self, tracking_uri: str = "http://mlflow-server.help-plus-ai.svc.cluster.local:5000", model_name: str = "HelpPlus_CDS_Llama3_FineTuned"):
        self.tracking_uri = tracking_uri
        self.model_name = model_name
        mlflow.set_tracking_uri(self.tracking_uri)
        self.client = MlflowClient()
        
    def log_experiment(self, run_name: str, metrics: Dict[str, float], params: Dict[str, Any], model_artifact_path: str = "model") -> str:
        """Logs training metrics, hyperparameters, and artifacts to MLflow."""
        mlflow.set_experiment(self.model_name)
        with mlflow.start_run(run_name=run_name) as run:
            mlflow.log_params(params)
            mlflow.log_metrics(metrics)
            # In production, we'd log the actual model using mlflow.sklearn.log_model or mlflow.pyfunc
            print(f"Logged experiment {run_name} with metrics {metrics}")
            return run.info.run_id

    def promote_to_staging(self, version: int):
        """Promote model to staging for shadow evaluation."""
        self.client.transition_model_version_stage(
            name=self.model_name,
            version=str(version),
            stage="Staging",
            archive_existing_versions=False
        )
        print(f"Model v{version} promoted to Staging.")

    def _validate_model_metrics(self, version: int) -> bool:
        """
        Validates that the model meets strict statistical thresholds before production.
        e.g., AUC-ROC > 0.85, Precision > 0.80.
        """
        try:
            run_id = self.client.get_model_version(self.model_name, str(version)).run_id
            if not run_id:
                return False
            run = self.client.get_run(run_id)
            metrics = run.data.metrics
            
            auc = metrics.get("auc_roc", 0.0)
            precision = metrics.get("precision", 0.0)
            
            if auc < 0.85 or precision < 0.80:
                print(f"Validation failed for v{version}: AUC={auc}, Precision={precision}")
                return False
            return True
        except Exception as e:
            print(f"Failed to validate metrics: {e}")
            return False
        
    def _run_bias_mitigation_checks(self, version: int) -> bool:
        """
        Ensures the model doesn't exhibit demographic bias.
        (Stub: Assumes a disparate impact ratio between 0.8 and 1.25 is acceptable).
        """
        try:
            run_id = self.client.get_model_version(self.model_name, str(version)).run_id
            if not run_id:
                return False
            run = self.client.get_run(run_id)
            di_ratio = run.data.metrics.get("disparate_impact_ratio", 1.0)
            
            if di_ratio < 0.8 or di_ratio > 1.25:
                print(f"Bias check failed for v{version}: Disparate Impact Ratio = {di_ratio}")
                return False
            return True
        except Exception as e:
            print(f"Failed to check bias metrics: {e}")
            return False

    def promote_to_production(self, version: int):
        """
        Gated promotion to production. Only proceeds if validation and bias checks pass.
        """
        model_version = self.client.get_model_version(self.model_name, str(version))
        if model_version.current_stage != "Staging":
            raise ValueError(f"Model v{version} must be in Staging before promotion.")
            
        if not self._validate_model_metrics(version):
            raise ValueError(f"Model v{version} failed statistical validation thresholds.")
            
        if not self._run_bias_mitigation_checks(version):
            raise ValueError(f"Model v{version} failed bias mitigation checks.")
            
        self.client.transition_model_version_stage(
            name=self.model_name,
            version=str(version),
            stage="Production",
            archive_existing_versions=True
        )
        print(f"Model v{version} safely promoted to Production.")
