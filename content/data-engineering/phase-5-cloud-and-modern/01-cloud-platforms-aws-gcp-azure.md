# Cloud Platforms cho Data Engineer: AWS, GCP và Azure

## Giới thiệu

Gần như 100% công ty trong 2025 đang chạy data infrastructure trên cloud. Biết ít nhất 1 cloud platform là yêu cầu gần như bắt buộc trong DE job description. Bài này sẽ giúp bạn hiểu ecosystem của 3 cloud lớn và định hướng học cái nào trước.

---

## 1. Tại sao Cloud thay thế On-Premises?

### Chi phí On-Premises vs Cloud

**On-Premises (tự quản lý)**:
```
- Mua server: $50,000 - $500,000 (CapEx)
- Thuê Data Center rack space: $1,000-5,000/tháng
- Nhân sự vận hành 24/7: 2-3 người × $100k/năm
- Thời gian setup: 3-6 tháng
- Scale up: Mua server mới (tháng), không linh hoạt
```

**Cloud (AWS/GCP/Azure)**:
```
- Không CapEx, chỉ OpEx (pay per use)
- Scale in minutes (không phải months)
- Managed services (không cần team vận hành)
- Global availability (chạy ở Singapore, US, EU cùng lúc)
- High availability built-in (multi-AZ, multi-region)
```

**Real-world example**: Startup cần xử lý data lớn trong 1 ngày (Black Friday). On-prem: phải có infrastructure cho peak load quanh năm. Cloud: Scale up trong 2 giờ, scale down sau khi done.

---

## 2. AWS Data Services (Amazon Web Services)

AWS là cloud lớn nhất (~33% market share 2024). Nếu bạn không biết chọn cloud nào → AWS là safe bet vì nhiều job nhất.

### Core Data Services

```
AWS Data Engineering Stack
│
├── Storage
│   ├── S3 (Simple Storage Service)     ← Data Lake, File storage
│   ├── EBS (Elastic Block Storage)     ← Database volumes
│   └── Glacier                         ← Cold storage, archival
│
├── Databases
│   ├── RDS (Relational DB Service)     ← PostgreSQL, MySQL, etc.
│   ├── DynamoDB                        ← NoSQL, serverless
│   ├── ElastiCache (Redis/Memcached)   ← Caching
│   └── DocumentDB (MongoDB compat.)    ← Document DB
│
├── Data Warehouse
│   └── Redshift                        ← Columnar DWH, PB scale
│
├── Big Data / Analytics
│   ├── EMR (Elastic MapReduce)         ← Managed Hadoop/Spark cluster
│   ├── Glue                            ← ETL service (Spark under hood)
│   ├── Athena                          ← Serverless SQL on S3
│   ├── Kinesis                         ← Real-time streaming
│   └── MSK (Managed Kafka)             ← Managed Kafka
│
├── Orchestration
│   └── MWAA (Managed Airflow)          ← Managed Apache Airflow
│
└── BI
    └── QuickSight                      ← BI dashboarding
```

### S3 - Foundation của mọi thứ

```python
import boto3

s3 = boto3.client('s3', region_name='ap-southeast-1')

# Upload file
s3.upload_file(
    Filename='local_data.parquet',
    Bucket='my-data-lake',
    Key='raw/orders/2024/01/15/orders.parquet'
)

# Download file  
s3.download_file('my-data-lake', 'raw/orders/2024/01/15/orders.parquet', 'local.parquet')

# List objects
response = s3.list_objects_v2(
    Bucket='my-data-lake',
    Prefix='raw/orders/2024/01/'
)

for obj in response['Contents']:
    print(f"{obj['Key']}: {obj['Size'] / 1024:.2f} KB")

# Pandas read/write S3 trực tiếp
import pandas as pd

df = pd.read_parquet('s3://my-data-lake/raw/orders/2024/01/15/orders.parquet')
df.to_parquet('s3://my-data-lake/processed/orders/', partition_cols=['year', 'month'])
```

### AWS Glue - ETL Service

```python
# AWS Glue job (viết bằng PySpark, chạy trên managed Spark)
import sys
from awsglue.transforms import *
from awsglue.utils import getResolvedOptions
from pyspark.context import SparkContext
from awsglue.context import GlueContext
from awsglue.job import Job

args = getResolvedOptions(sys.argv, ['JOB_NAME'])
sc = SparkContext()
glueContext = GlueContext(sc)
spark = glueContext.spark_session
job = Job(glueContext)

# Read từ Glue Data Catalog
orders_df = glueContext.create_dynamic_frame.from_catalog(
    database="raw_data",
    table_name="orders"
)

# Transform
from awsglue.dynamicframe import DynamicFrame

orders_pd = orders_df.toDF()  # Convert sang Spark DataFrame
# ... transform logic ...
result_df = ...

# Write to S3
result_dynamic = DynamicFrame.fromDF(result_df, glueContext, "result")
glueContext.write_dynamic_frame.from_options(
    frame=result_dynamic,
    connection_type="s3",
    connection_options={"path": "s3://processed/fact_orders/"},
    format="parquet"
)

job.commit()
```

### Athena - SQL trực tiếp trên S3

```sql
-- Athena: Query Parquet files trong S3 như SQL table
-- Không cần ETL, không cần DWH!

-- Tạo external table
CREATE EXTERNAL TABLE orders (
    order_id STRING,
    user_id STRING,
    amount DOUBLE,
    status STRING,
    created_at TIMESTAMP
)
PARTITIONED BY (year INT, month INT, day INT)
STORED AS PARQUET
LOCATION 's3://my-data-lake/processed/orders/';

-- Load partitions
MSCK REPAIR TABLE orders;

-- Query (trả tiền theo bytes scanned)
SELECT 
    year,
    month,
    SUM(amount) as revenue,
    COUNT(*) as order_count
FROM orders
WHERE year = 2024 AND month = 1  -- Chỉ scan partition này!
GROUP BY 1, 2;
```

---

## 3. GCP Data Services (Google Cloud Platform)

GCP (~12% market share) nổi tiếng về **AI/ML và Analytics**. BigQuery là DWH mạnh nhất, cực kỳ phổ biến ở startup và tech companies.

### Core Data Services

```
GCP Data Engineering Stack
│
├── Storage
│   └── GCS (Google Cloud Storage)      ← Tương đương S3
│
├── Databases
│   ├── Cloud SQL                        ← Managed PostgreSQL/MySQL
│   ├── Firestore                        ← NoSQL document DB
│   ├── Bigtable                         ← Column-family, HBase compat.
│   └── Memorystore (Redis)              ← Caching
│
├── Data Warehouse
│   └── BigQuery                         ← King của cloud DWH!
│
├── Big Data / Analytics
│   ├── Dataproc                         ← Managed Hadoop/Spark
│   ├── Dataflow                         ← Managed Apache Beam (batch + stream)
│   ├── Pub/Sub                          ← Messaging, như Kafka
│   └── Datastream                       ← CDC service
│
├── Orchestration
│   └── Cloud Composer                   ← Managed Airflow
│
└── ML Platform
    └── Vertex AI                        ← End-to-end ML platform
```

### BigQuery - Phổ biến nhất trong GCP DE

```python
from google.cloud import bigquery

client = bigquery.Client(project='my-gcp-project')

# Simple query
query = """
    SELECT 
        DATE_TRUNC(created_at, MONTH) as month,
        SUM(amount) as revenue
    FROM `my-project.raw_data.orders`
    WHERE DATE(created_at) >= '2024-01-01'
    GROUP BY 1
    ORDER BY 1
"""

df = client.query(query).to_dataframe()

# Load từ DataFrame
job_config = bigquery.LoadJobConfig(
    schema=[
        bigquery.SchemaField("order_id", "STRING"),
        bigquery.SchemaField("amount", "FLOAT"),
    ],
    write_disposition="WRITE_TRUNCATE",  # Overwrite table
)

job = client.load_table_from_dataframe(df, "my-project.dataset.table", job_config=job_config)
job.result()  # Wait for job to complete

# Load từ GCS (better for large data)
job = client.load_table_from_uri(
    "gs://my-bucket/data/*.parquet",
    "my-project.dataset.orders",
    job_config=bigquery.LoadJobConfig(
        source_format=bigquery.SourceFormat.PARQUET,
        write_disposition="WRITE_APPEND"
    )
)
```

### BigQuery đặc biệt ở điểm nào?

```
1. Serverless: Không cần manage cluster, auto-scale
2. Separation of compute and storage: Scale compute riêng biệt với storage
3. Pay-per-query: $5/TB data scanned (chỉ trả khi query)
4. Built-in ML: BigQuery ML - train model bằng SQL!
5. GeoSpatial: Built-in geospatial functions
6. Streaming insert: Real-time insert với BigQuery Storage API
```

```sql
-- BigQuery ML: Train ML model bằng SQL!
CREATE OR REPLACE MODEL `my_project.dataset.revenue_forecast`
OPTIONS(
    model_type='ARIMA_PLUS',
    time_series_timestamp_col='date',
    time_series_data_col='revenue',
    auto_arima=TRUE,
    data_frequency='DAILY'
) AS
SELECT date, SUM(amount) as revenue
FROM `my-project.dataset.orders`
GROUP BY date;

-- Predict
SELECT * FROM ML.FORECAST(
    MODEL `my_project.dataset.revenue_forecast`,
    STRUCT(30 AS horizon, 0.8 AS confidence_level)
);
```

---

## 4. Azure Data Services (Microsoft Azure)

Azure (~22% market share) nổi tiếng về **enterprise integration** và **Microsoft ecosystem** (SQL Server, Power BI, Office 365).

### Core Data Services

```
Azure Data Engineering Stack
│
├── Storage
│   └── ADLS Gen2 (Azure Data Lake Storage)  ← Data Lake
│
├── Databases
│   ├── Azure SQL Database                    ← Managed SQL Server
│   ├── Cosmos DB                             ← Multi-model NoSQL
│   └── Azure Cache for Redis                 ← Caching
│
├── Data Warehouse
│   └── Azure Synapse Analytics               ← DWH + Spark + SQL
│
├── Big Data / Streaming
│   ├── HDInsight                             ← Managed Hadoop/Spark
│   ├── Azure Databricks                      ← Managed Databricks (Spark)
│   ├── Event Hubs                            ← Kafka compatible
│   └── Stream Analytics                      ← Real-time analytics
│
├── ETL / Orchestration
│   └── Azure Data Factory (ADF)             ← ETL + Orchestration
│
└── BI
    └── Power BI                              ← Most popular BI in enterprise
```

---

## 5. Cloud-agnostic Tools (Dùng được trên cả 3 clouds)

```
Compute:        Databricks (Spark)     → AWS, GCP, Azure
DWH:            Snowflake              → AWS, GCP, Azure
Transform:      dbt                    → AWS, GCP, Azure
Orchestration:  Airflow                → AWS, GCP, Azure
Kafka:          Confluent Cloud        → AWS, GCP, Azure
Monitoring:     Monte Carlo            → AWS, GCP, Azure
```

---

## 6. So sánh Tổng hợp

| Service | AWS | GCP | Azure |
|---------|-----|-----|-------|
| **Object Storage** | S3 | GCS | ADLS Gen2 |
| **Data Warehouse** | Redshift | **BigQuery** ⭐ | Synapse |
| **Managed Spark** | EMR / Glue | Dataproc | Databricks |
| **Streaming** | Kinesis / MSK | Pub/Sub | Event Hubs |
| **ETL Service** | Glue | Dataflow | Data Factory |
| **Managed Airflow** | MWAA | Cloud Composer | Apache Airflow on AKS |
| **Managed Kafka** | MSK | - | Event Hubs |
| **ML Platform** | SageMaker | Vertex AI | Azure ML |
| **BI Tool** | QuickSight | Looker | **Power BI** ⭐ |
| **Mature enterprise** | ⭐ | ✅ | ⭐⭐ |
| **AI/ML native** | ✅ | ⭐⭐ | ✅ |
| **Startup friendly** | ⭐ | ⭐⭐ | ✅ |

---

## 7. Bạn nên học cloud nào?

### Dựa trên mục tiêu

**Muốn job nhiều nhất** → AWS (nhiều job nhất toàn cầu)

**Ở Việt Nam** → GCP đang tăng trưởng mạnh (nhiều startup dùng BigQuery + Firebase)

**Enterprise/Banking** → Azure (Microsoft ecosystem phổ biến)

**AI/ML focus** → GCP (Vertex AI, BigQuery ML mạnh nhất)

### Lộ trình học GCP cho DE (Đề xuất)

```
Week 1-2: GCP Fundamentals
└── GCS (Cloud Storage)
└── Cloud IAM (Identity & Access Management)
└── BigQuery basics

Week 3-4: BigQuery Deep Dive
└── SQL advanced trên BigQuery
└── Partitioning & Clustering
└── Cost optimization
└── BigQuery to GCS pipeline

Week 5-6: Orchestration + Pipeline
└── Cloud Composer (Airflow)
└── Dataflow (Apache Beam)
└── Pub/Sub basics

Week 7-8: Real project
└── Build end-to-end pipeline:
    Raw data (GCS) → Ingest → BigQuery → dbt transform → Dashboard
```

---

## 8. Infrastructure as Code (IaC) cho DE

```python
# Terraform - Provision cloud resources bằng code
# Đừng click-click trên UI, dùng code!

# main.tf
provider "google" {
  project = var.project_id
  region  = "asia-southeast1"
}

resource "google_bigquery_dataset" "data_warehouse" {
  dataset_id = "data_warehouse"
  location   = "US"
  
  labels = {
    env  = "production"
    team = "data-engineering"
  }
}

resource "google_bigquery_table" "fact_orders" {
  dataset_id = google_bigquery_dataset.data_warehouse.dataset_id
  table_id   = "fact_orders"
  
  schema = file("schemas/fact_orders.json")
  
  time_partitioning {
    type  = "DAY"
    field = "order_date"
  }
  
  clustering = ["country", "customer_segment"]
}

resource "google_storage_bucket" "data_lake" {
  name     = "${var.project_id}-data-lake"
  location = "ASIA-SOUTHEAST1"
  
  lifecycle_rule {
    action {
      type          = "SetStorageClass"
      storage_class = "NEARLINE"
    }
    condition {
      age = 90  # Move to cheaper storage after 90 days
    }
  }
}
```

---

## 9. Rủi ro khi dùng Cloud sai

- **Cloud lock-in**: Dùng quá nhiều proprietary services → khó migrate cloud khác
- **Cost explosion**: Không monitor spending → nhận bill $10,000 cuối tháng (thực sự xảy ra!)
- **Security misconfig**: S3 bucket public accidentally → data breach
- **No IAM principles**: Everyone has admin access → "blast radius" khi có breach

---

## 10. Interview Q&A

**Q1: "Bạn quen với cloud platform nào? Giải thích một service bạn đã dùng."**
> (Nên nói được ít nhất 1 cloud với ví dụ cụ thể) Ví dụ: "Tôi đã dùng GCP, đặc biệt là BigQuery để build DWH cho e-commerce. Tôi partition bảng fact_orders theo order_date, clustering theo country. Query cost giảm 90% so với không partition. Tôi cũng dùng dbt để transform data và Cloud Composer (Airflow) để orchestrate."

**Q2: "Sự khác biệt giữa BigQuery và Redshift?"**
> BigQuery: Serverless (không manage cluster), pay-per-query, separated storage-compute, native integration với GCP. Redshift: Cluster-based (phải size cluster), pay-per-node-hour, tight AWS integration, tốt cho steady workload. BigQuery tốt hơn cho variable workload và khi cần minimal ops overhead.

**Q3: "S3 và ADLS Gen2 khác nhau như thế nào?"**
> Cả hai là object storage. S3: Simpler, flat namespace (key = path), widely integrated. ADLS Gen2: Hierarchical namespace (thực sự directories), POSIX-compatible ACL (fine-grained access control per file/folder), tốt hơn cho data lake với nhiều users cần different access levels.

**Q4: "Terraform là gì? DE cần biết không?"**
> Terraform là IaC tool — define cloud infrastructure bằng code (HCL), version control, reproducible. DE cần biết cơ bản vì: 1) Tạo BigQuery datasets, tables, IAM roles bằng code thay vì click UI, 2) Reproducible environment (dev/staging/prod), 3) Code review cho infrastructure changes. Không cần expert level, biết cơ bản là đủ.

**Q5: "Giải thích Cloud IAM trong context DE."**
> Identity & Access Management: Ai có quyền làm gì với resource nào. DE cần biết để: 1) Tạo service account cho Airflow/Spark với least-privilege (chỉ quyền cần thiết), 2) Grant BigQuery access cho Analyst team theo dataset level, 3) Audit log để trace ai query data gì (compliance). Sai IAM → security issues hoặc data breach.

**Q6: "Multi-cloud vs Single-cloud cho data architecture?"**
> Single cloud: Đơn giản hơn, deeper integration, tốt hơn cho most companies. Multi-cloud: Tránh lock-in, dùng best service từ mỗi cloud (BigQuery + AWS S3), disaster recovery. Nhưng: Phức tạp hơn nhiều, data transfer costs, skill requirements cao hơn. Khuyến nghị: Bắt đầu với single cloud, multi-cloud chỉ khi có specific business need.

---

## Tài liệu tham khảo

- [Google Cloud Skills Boost (Free)](https://cloudskillsboost.google/)
- [AWS Skill Builder (Free)](https://skillbuilder.aws/)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [Terraform GCP Provider](https://registry.terraform.io/providers/hashicorp/google/latest/docs)
