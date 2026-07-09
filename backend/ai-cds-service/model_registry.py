import mlflow
from mlflow.tracking import MlflowClient

# Configure MLflow tracking server URI
mlflow.set_tracking_uri("http://mlflow-server.help-plus-ai.svc.cluster.local:5000")
client = MlflowClient()

MODEL_NAME = "HelpPlus_CDS_Llama3_FineTuned"

def promote_model_to_staging(version: int):
    """
    Promote a specific model version to Staging for shadow evaluation.
    In Staging, the model runs on historical/shadow traffic but its outputs are not surfaced to clinicians.
    """
    print(f"Promoting {MODEL_NAME} v{version} to Staging for Shadow Evaluation...")
    client.transition_model_version_stage(
        name=MODEL_NAME,
        version=str(version),
        stage="Staging",
        archive_existing_versions=False
    )
    print("Promotion to Staging successful.")

def promote_model_to_production(version: int):
    """
    Promote a validated model from Staging to Production.
    Automatically archives the current Production model to ensure safe rollback capability.
    """
    # 1. Verification step: Ensure the model passed staging metrics
    model_version_details = client.get_model_version(name=MODEL_NAME, version=str(version))
    if model_version_details.current_stage != "Staging":
        raise ValueError(f"Model version {version} must be in Staging before promotion to Production.")

    # 2. Promote to production and archive the old one
    print(f"Promoting {MODEL_NAME} v{version} to Production...")
    client.transition_model_version_stage(
        name=MODEL_NAME,
        version=str(version),
        stage="Production",
        archive_existing_versions=True # This safely archives the old prod model
    )
    print("Promotion to Production successful. Model is now active in clinical workflows.")

def get_active_model_uri() -> str:
    """Returns the URI for the current production model to be loaded by the inference server."""
    return f"models:/{MODEL_NAME}/Production"
