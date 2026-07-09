from pyspark.sql import SparkSession, DataFrame, Window
from pyspark.sql.functions import col, last, expr, sha2, concat, lit, approx_percentile

class SilverPreprocessingPipeline:
    def __init__(self, spark: SparkSession, bronze_path: str, silver_path: str):
        self.spark = spark
        self.bronze_path = bronze_path
        self.silver_path = silver_path
        
    def _pseudonymize_phi(self, df: DataFrame) -> DataFrame:
        """
        Implements tokenization/pseudonymization of patient keys (Zero plaintext PHI).
        Replaces 'patient_id' with a SHA-256 hash using a secure salt.
        """
        salt = "HIPAA_SECURE_SALT_V1" # In production, fetched from Azure KeyVault / AWS Secrets
        return df.withColumn("patient_sk", sha2(concat(col("patient_id"), lit(salt)), 256)) \
                 .drop("patient_id")

    def _impute_missing_values(self, df: DataFrame) -> DataFrame:
        """
        Forward-fills vitals within a temporal window using Spark window functions.
        """
        # Define a window partitioned by the pseudonymized patient key and ordered by time
        window_spec = Window.partitionBy("patient_sk").orderBy("timestamp")
        
        # Forward fill missing 'sys_bp' and 'dia_bp'
        # ignorenulls=True ensures it grabs the last known good value
        df_imputed = df.withColumn("sys_bp", last(col("sys_bp"), ignorenulls=True).over(window_spec)) \
                       .withColumn("dia_bp", last(col("dia_bp"), ignorenulls=True).over(window_spec))
        
        return df_imputed

    def _detect_and_cap_outliers(self, df: DataFrame, numeric_columns: list) -> DataFrame:
        """
        Statistically rigorous outlier detection using Interquartile Range (IQR).
        Flags and caps unphysical medical data without dropping the record.
        """
        for c in numeric_columns:
            # Calculate Q1 and Q3 using approx_percentile (scalable on distributed datasets)
            quantiles = df.approxQuantile(c, [0.25, 0.75], 0.01)
            if not quantiles:
                continue
                
            q1, q3 = quantiles[0], quantiles[1]
            iqr = q3 - q1
            lower_bound = q1 - 1.5 * iqr
            upper_bound = q3 + 1.5 * iqr
            
            # Additional absolute medical invariant capping (e.g., Temperature cannot be > 45 C)
            # We flag it by creating an '{col}_is_outlier' column and capping the value to the bound.
            df = df.withColumn(f"{c}_is_outlier", (col(c) < lower_bound) | (col(c) > upper_bound)) \
                   .withColumn(c, 
                       expr(f"CASE WHEN {c} > {upper_bound} THEN {upper_bound} " +
                            f"WHEN {c} < {lower_bound} THEN {lower_bound} " +
                            f"ELSE {c} END")
                   )
                   
        return df

    def run_bronze_to_silver(self):
        """
        Executes the Medallion transition from Bronze (raw, validated) to Silver (clean, pseudonymous).
        """
        print("Reading Bronze data...")
        df_bronze = self.spark.read.format("delta").load(self.bronze_path)
        
        print("Pseudonymizing PHI...")
        df_pseudo = self._pseudonymize_phi(df_bronze)
        
        print("Imputing missing values...")
        df_imputed = self._impute_missing_values(df_pseudo)
        
        print("Handling outliers...")
        numeric_cols = [f.name for f in df_imputed.schema.fields if f.dataType.simpleString() == 'double']
        df_silver = self._detect_and_cap_outliers(df_imputed, numeric_cols)
        
        print("Writing to Silver Delta Table...")
        df_silver.write \
            .format("delta") \
            .mode("append") \
            .save(self.silver_path)
            
if __name__ == "__main__":
    spark = SparkSession.builder \
        .appName("HelpPlus_Silver_Preprocessing") \
        .getOrCreate()
        
    pipeline = SilverPreprocessingPipeline(
        spark=spark,
        bronze_path="/tmp/delta/bronze_clinical",
        silver_path="/tmp/delta/silver_clinical"
    )
    # pipeline.run_bronze_to_silver()
