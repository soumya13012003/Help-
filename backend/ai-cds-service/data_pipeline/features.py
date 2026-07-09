from pyspark.sql import SparkSession, DataFrame, Window
from pyspark.sql.functions import col, mean, variance, first, last, unix_timestamp, monotonically_increasing_id
from pyspark.ml.feature import StringIndexer
from delta.tables import DeltaTable

class GoldFeatureEngineeringPipeline:
    def __init__(self, spark: SparkSession, silver_path: str, gold_path: str):
        self.spark = spark
        self.silver_path = silver_path
        self.gold_path = gold_path

    def _encode_medical_codes(self, df: DataFrame, columns_to_encode: list) -> DataFrame:
        """
        Implements token-based string encodings for medical codes (ICD-10, SNOMED-CT).
        Using PySpark StringIndexer for deterministic transformation.
        """
        result_df = df
        for c in columns_to_encode:
            indexer = StringIndexer(inputCol=c, outputCol=f"{c}_encoded", handleInvalid="keep")
            model = indexer.fit(result_df)
            result_df = model.transform(result_df)
        return result_df

    def _extract_rolling_features(self, df: DataFrame) -> DataFrame:
        """
        Dynamic temporal windowing functions for rolling clinical features.
        Calculates 24h rolling variance and 48h delta change.
        """
        # Convert timestamp to unix seconds for range-based windowing
        df = df.withColumn("unix_time", unix_timestamp("timestamp"))
        
        # 24-hour window (24 * 60 * 60 seconds)
        window_24h = Window.partitionBy("patient_sk").orderBy("unix_time").rangeBetween(-86400, 0)
        
        # 48-hour window (48 * 60 * 60 seconds)
        window_48h = Window.partitionBy("patient_sk").orderBy("unix_time").rangeBetween(-172800, 0)

        # 1. "rolling 24-hour mean heart rate variance"
        # Assuming 'heart_rate' column exists
        if "heart_rate" in df.columns:
            df = df.withColumn("rolling_24h_hr_variance", variance("heart_rate").over(window_24h)) \
                   .withColumn("rolling_24h_hr_mean", mean("heart_rate").over(window_24h))
        
        # 2. "delta change in serum creatinine over 48 hours"
        if "serum_creatinine" in df.columns:
            df = df.withColumn("first_48h_creatinine", first("serum_creatinine", ignorenulls=True).over(window_48h)) \
                   .withColumn("last_48h_creatinine", last("serum_creatinine", ignorenulls=True).over(window_48h)) \
                   .withColumn("creatinine_delta_48h", col("last_48h_creatinine") - col("first_48h_creatinine"))
                   
        return df.drop("unix_time", "first_48h_creatinine", "last_48h_creatinine")

    def run_silver_to_gold(self):
        """
        Executes the Medallion transition from Silver (clean) to Gold (ML-ready feature matrix).
        """
        print("Reading Silver data...")
        df_silver = self.spark.read.format("delta").load(self.silver_path)
        
        # Medical Code Encoding
        categorical_cols = [c for c in df_silver.columns if "icd10" in c.lower() or "snomed" in c.lower()]
        if categorical_cols:
            print("Encoding medical codes...")
            df_silver = self._encode_medical_codes(df_silver, categorical_cols)
            
        print("Extracting rolling temporal features...")
        df_gold = self._extract_rolling_features(df_silver)
        
        # Create a unique event_id required for Feast point-in-time joins
        df_gold = df_gold.withColumn("event_id", monotonically_increasing_id())
        
        print("Writing to Gold Delta Table...")
        df_gold.write \
            .format("delta") \
            .mode("append") \
            .save(self.gold_path)
            
        # Z-Ordering Optimization for fast Feast lookup
        print("Optimizing Gold table via Z-Ordering (patient_sk, timestamp)...")
        delta_table = DeltaTable.forPath(self.spark, self.gold_path)
        delta_table.optimize().executeZOrderBy("patient_sk", "timestamp")
        print("Optimization complete.")

    def time_travel_query(self, timestamp: str) -> DataFrame:
        """
        Demonstrates data versioning "Time-Travel" logic.
        Fetches the Gold ML matrix exactly as it existed at the provided UTC timestamp.
        """
        print(f"Time-traveling to state at {timestamp}...")
        snapshot_df = self.spark.read.format("delta") \
            .option("timestampAsOf", timestamp) \
            .load(self.gold_path)
        return snapshot_df

if __name__ == "__main__":
    spark = SparkSession.builder \
        .appName("HelpPlus_Gold_Features") \
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
        .getOrCreate()
        
    pipeline = GoldFeatureEngineeringPipeline(
        spark=spark,
        silver_path="/tmp/delta/silver_clinical",
        gold_path="/tmp/delta/gold_features"
    )
    # pipeline.run_silver_to_gold()
    # snapshot = pipeline.time_travel_query("2026-07-09T00:00:00.000Z")
