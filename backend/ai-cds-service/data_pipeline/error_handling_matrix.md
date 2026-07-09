# Help+ Data Pipeline: Error Handling Matrix

The following matrix outlines the deterministic workflows applied when the PySpark Medallion Pipeline encounters data anomalies, ensuring that failures are isolated and do not break downstream analytics or ML training.

| Error Category | Specific Trigger Condition | Pipeline Layer | Action Taken | Target Destination / Action | Notification Level |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Schema Mismatch** | Missing required columns (e.g., `patient_id` or `timestamp`) | Bronze (Great Expectations) | **Rejection & Isolation** | Route entire record to `quarantine_clinical` Delta table. Excluded from Silver pipeline. | 🔴 **High** - Slack/PagerDuty alert to Data Eng oncall if >1% of batch fails. |
| **Type Violation** | E.g., `sys_bp` arrives as string `"120/80"` instead of Float `120.0` | Bronze (Great Expectations) | **Rejection & Isolation** | Route to `quarantine_clinical` table with reason `"TypeValidationFailed"`. | 🟡 **Medium** - Daily Airflow digest email. |
| **Clinical Invariant** | `diastolic_bp` > `systolic_bp` | Bronze (PySpark Filter) | **Rejection & Isolation** | Route to `quarantine_clinical` table with reason `"InvariantFailed"`. | 🟡 **Medium** - Daily Airflow digest email. |
| **Missing Values** | Missing non-critical vital (e.g., Temperature missing in a 1-hour window) | Silver (Preprocessing) | **Deterministic Imputation** | Forward-fill via PySpark Window function (Partition by patient, order by time). | ⚪ **Info** - Logged in MLflow dataset metrics, no active alert. |
| **Missing Critical Label** | Target variable (e.g., Diagnosis) missing during training set generation | Gold (Feature Store) | **Row Drop** | The specific feature row is dropped from the offline Feast batch source. | ⚪ **Info** - Logged as dropped row in Feast metrics. |
| **Extreme Outlier** | Unphysical value (e.g., Body Temp = 45°C or Heart Rate = 0 on living patient) | Silver (Preprocessing) | **Flag & Cap (Winsorization)**| Create boolean column `{col}_is_outlier`. Value is capped to `Q3 + 1.5*IQR`. Record remains in Silver. | ⚪ **Info** - Logged for downstream ML models to see the flag. |
| **PHI Leakage** | Explicit Patient Name or SSN detected in raw text payload | Bronze (Ingestion) | **Masking & Hashing** | SHA-256 Hashing of IDs (`patient_sk`), Regex masking of 18 PHI identifiers. | 🔴 **High** - Security audit log entry created in Splunk. |

## Workflow Summary
By utilizing **Great Expectations** at the Bronze boundary, we guarantee that the Silver and Gold Delta tables *never* contain corrupt schemas or broken clinical invariants. By utilizing **PySpark Window functions and IQR capping** at the Silver boundary, we guarantee that ML models receive complete, dense matrices without choking on unphysical anomalies.
