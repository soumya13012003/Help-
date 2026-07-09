from datetime import timedelta
from feast import Entity, FeatureView, Field, PushSource
from feast.infra.offline_stores.file_source import FileSource
from feast.types import Float32, String

# 1. Define the Entity (the primary key for the feature store)
# In HIPAA environments, this must be the pseudonymized SK, NEVER the raw patient_id
patient = Entity(
    name="patient_sk",
    join_keys=["patient_sk"],
    value_type=String,
    description="Pseudonymized SHA-256 patient surrogate key",
)

# 2. Define the Batch Source (Offline Store)
# We map this directly to our Medallion Gold Delta Lake table (Feast reads Parquet/Delta)
clinical_gold_batch_source = FileSource(
    name="clinical_gold_features",
    path="/tmp/delta/gold_features", # In production, this would be an S3/ADLS path
    timestamp_field="timestamp",
    created_timestamp_column="created_at",
)

# 3. Define the Push Source (Online Store Streaming Updates)
# Used to push real-time vitals streams into Redis immediately, bypassing the batch delay
clinical_online_push_source = PushSource(
    name="clinical_realtime_push",
    batch_source=clinical_gold_batch_source,
)

# 4. Define the Feature View
# Groups related features and configures the TTL (Time-To-Live).
# The TTL ensures strict point-in-time correctness: if an inference happens at T=10,
# Feast will NOT join features older than (T=10 minus TTL). This completely eliminates data leakage.
patient_clinical_features_view = FeatureView(
    name="patient_clinical_features",
    entities=[patient],
    ttl=timedelta(days=7), # If a patient hasn't been seen in 7 days, features expire (prevents stale inferences)
    schema=[
        Field(name="sys_bp", dtype=Float32),
        Field(name="dia_bp", dtype=Float32),
        Field(name="rolling_24h_hr_variance", dtype=Float32),
        Field(name="rolling_24h_hr_mean", dtype=Float32),
        Field(name="creatinine_delta_48h", dtype=Float32),
    ],
    online=True,
    source=clinical_online_push_source,
    tags={"domain": "clinical", "compliance": "hipaa_safe_harbor"},
)

# Usage Example for Point-in-Time correct Training Data:
# 
# from feast import FeatureStore
# store = FeatureStore(repo_path=".")
# training_df = store.get_historical_features(
#     entity_df=patient_labels_df, # Contains patient_sk and exact timestamp of diagnosis
#     features=[
#         "patient_clinical_features:sys_bp",
#         "patient_clinical_features:rolling_24h_hr_variance"
#     ]
# ).to_df()
