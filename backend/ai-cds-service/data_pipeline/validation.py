import os
from pyspark.sql import SparkSession, DataFrame
from pyspark.sql.functions import col, current_timestamp
import great_expectations as gx
from great_expectations.dataset.sparkdf_dataset import SparkDFDataset

class BronzeIngestionPipeline:
    def __init__(self, spark: SparkSession, bronze_table_path: str, quarantine_table_path: str):
        self.spark = spark
        self.bronze_table_path = bronze_table_path
        self.quarantine_table_path = quarantine_table_path
        
    def ingest_from_source(self, source_path: str, format: str = "json") -> DataFrame:
        """
        Ingests bulk payloads from object storage (or streaming if format="kafka").
        """
        return self.spark.read.format(format).load(source_path)
        
    def validate_and_route(self, df: DataFrame, batch_id: str) -> None:
        """
        Integrates Great Expectations to validate inbound data schemas, checking for structural integrity, 
        strict data type constraints, and clinical invariants.
        """
        # Convert PySpark DataFrame to Great Expectations dataset
        ge_df = SparkDFDataset(df)
        
        # 1. Structural Integrity & Types
        ge_df.expect_column_to_exist("patient_id")
        ge_df.expect_column_to_exist("timestamp")
        ge_df.expect_column_values_to_not_be_null("patient_id")
        ge_df.expect_column_values_to_be_of_type("sys_bp", "DoubleType")
        ge_df.expect_column_values_to_be_of_type("dia_bp", "DoubleType")
        
        # 2. Clinical Invariants
        # Systolic BP must be greater than Diastolic BP
        # (Custom PySpark condition wrapped in Great Expectations if needed, or simple column map)
        
        validation_result = ge_df.validate()
        
        # Adding audit columns
        processed_df = df.withColumn("ingest_timestamp", current_timestamp()) \
                         .withColumn("batch_id", col("patient_id").alias("b_id") * 0 + int(batch_id) if batch_id.isdigit() else current_timestamp())
                         
        # Real-world GE will return exactly which rows failed. 
        # For this demonstration, we use a PySpark filter based on the invariant rules 
        # to physically separate the rows.
        
        # Valid: Sys > Dia OR Sys/Dia are null
        valid_condition = col("patient_id").isNotNull() & \
                          ((col("sys_bp").isNull() | col("dia_bp").isNull()) | (col("sys_bp") > col("dia_bp")))
                          
        valid_df = processed_df.filter(valid_condition)
        corrupt_df = processed_df.filter(~valid_condition)
        
        # Write valid records to Bronze Delta Table
        valid_df.write \
            .format("delta") \
            .mode("append") \
            .save(self.bronze_table_path)
            
        # Route corrupt records to Quarantine Delta Table
        if corrupt_df.count() > 0:
            corrupt_df.withColumn("quarantine_reason", col("patient_id").alias("qr") * 0 + "Validation Failed") \
                .write \
                .format("delta") \
                .mode("append") \
                .save(self.quarantine_table_path)
            print(f"[{batch_id}] Routed {corrupt_df.count()} corrupt records to Quarantine.")

if __name__ == "__main__":
    # Example execution
    spark = SparkSession.builder \
        .appName("HelpPlus_Bronze_Ingestion") \
        .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
        .config("spark.sql.catalog.spark_catalog", "org.apache.spark.sql.delta.catalog.DeltaCatalog") \
        .getOrCreate()
        
    pipeline = BronzeIngestionPipeline(
        spark=spark, 
        bronze_table_path="/tmp/delta/bronze_clinical",
        quarantine_table_path="/tmp/delta/quarantine_clinical"
    )
    # df = pipeline.ingest_from_source("/data/landing_zone/clinical_payloads/")
    # pipeline.validate_and_route(df, batch_id="1001")
