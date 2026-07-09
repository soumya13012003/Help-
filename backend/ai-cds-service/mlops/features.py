import json
import redis
import pandas as pd
from typing import Dict, Any, List
from pydantic import BaseModel
import os

class TemporalFeatures(BaseModel):
    patient_id: str
    avg_heart_rate_30d: float
    max_sys_bp_90d: float
    recent_lab_abnormalities: int
    days_since_last_visit: int

class FeatureStore:
    def __init__(self, offline_path: str = "./data/feature_store", redis_url: str = "redis://redis-cluster.help-plus-infra.svc.cluster.local:6379/0"):
        self.offline_path = offline_path
        self.redis_url = redis_url
        
        # Ensure offline directory exists
        os.makedirs(self.offline_path, exist_ok=True)
        
        # Connect to online store
        try:
            self.online_store = redis.from_url(self.redis_url, decode_responses=True)
        except Exception:
            # Fallback for local testing if redis is unavailable
            self.online_store = None
            
    def _extract_temporal_features(self, longitudinal_data: List[Dict[str, Any]]) -> TemporalFeatures:
        """
        Converts longitudinal patient history (vitals, lab trends, historical diagnosis codes)
        into aggregated temporal feature vectors.
        """
        # Stub logic: In reality, we would parse dates and calculate windows (30d, 90d)
        avg_hr = 0.0
        max_sys_bp = 0.0
        abnormalities = 0
        days_since = 0
        
        hr_readings = []
        bp_readings = []
        
        for encounter in longitudinal_data:
            if "heart_rate" in encounter:
                hr_readings.append(encounter["heart_rate"])
            if "sys_bp" in encounter:
                bp_readings.append(encounter["sys_bp"])
            if encounter.get("lab_abnormal", False):
                abnormalities += 1
                
        if hr_readings:
            avg_hr = sum(hr_readings) / len(hr_readings)
        if bp_readings:
            max_sys_bp = max(bp_readings)
            
        return TemporalFeatures(
            patient_id=longitudinal_data[0].get("patient_id", "unknown") if longitudinal_data else "unknown",
            avg_heart_rate_30d=avg_hr,
            max_sys_bp_90d=max_sys_bp,
            recent_lab_abnormalities=abnormalities,
            days_since_last_visit=days_since
        )

    def write_offline_features(self, patient_data: List[Dict[str, Any]], batch_id: str):
        """
        Writes extracted features to the offline store (Parquet format) for batch training.
        """
        features_list = []
        # Group by patient_id
        df_raw = pd.DataFrame(patient_data)
        if "patient_id" not in df_raw.columns:
            return
            
        for patient_id, group in df_raw.groupby("patient_id"):
            records = group.to_dict(orient="records")
            tf = self._extract_temporal_features(records)
            features_list.append(tf.model_dump())
            
        if features_list:
            df_features = pd.DataFrame(features_list)
            file_path = os.path.join(self.offline_path, f"batch_{batch_id}.parquet")
            df_features.to_parquet(file_path, index=False)
            print(f"Wrote {len(df_features)} feature vectors to {file_path}")

    def update_online_features(self, patient_id: str, longitudinal_data: List[Dict[str, Any]]):
        """
        Updates the Redis online feature store for low-latency retrieval during real-time inference.
        """
        tf = self._extract_temporal_features(longitudinal_data)
        
        if self.online_store:
            # Set with expiration (e.g., 24 hours) to avoid stale features
            self.online_store.setex(
                f"features:patient:{patient_id}", 
                86400, 
                json.dumps(tf.model_dump())
            )
        else:
            print(f"[Fallback] Online feature update for {patient_id}: {tf.model_dump()}")

    def get_online_features(self, patient_id: str) -> Dict[str, Any]:
        """
        Retrieves feature vector from Redis with <10ms latency.
        """
        if self.online_store:
            data = self.online_store.get(f"features:patient:{patient_id}")
            if data:
                return json.loads(data)
        return {}
