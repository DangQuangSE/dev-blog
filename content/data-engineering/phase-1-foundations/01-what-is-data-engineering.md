# [01] Phase 1 - Foundations: Data Engineering là gì & Vòng đời dữ liệu

## Giới thiệu

Bài này đi sâu hơn vào **Data Engineering Lifecycle** — framework giúp bạn hiểu toàn bộ vòng đời dữ liệu trong một tổ chức. Đây là mental model quan trọng nhất mà mọi DE cần có để định hướng công việc và thiết kế hệ thống.

---

## 1. Data Engineering Lifecycle

Theo Joe Reis và Matt Housley (cuốn "Fundamentals of Data Engineering" - O'Reilly 2022):

```
                    THE DATA ENGINEERING LIFECYCLE
                    
[Source Systems] → Generation → Ingestion → Transformation → Serving
                                                                ↓
                                                    Analytics | ML | Reverse ETL
                                                    
──────────────────────────────────────────────────────────────────────────
         Undercurrents: Security, Data Management, DataOps, 
                       Data Architecture, Orchestration, Software Engineering
```

### Giải thích từng giai đoạn:

**1. Generation (Tạo ra dữ liệu)**
Nơi dữ liệu được tạo ra — không phải việc của DE để design, nhưng DE cần hiểu:
- RDBMS của các team BE (PostgreSQL, MySQL)
- Event streams (Kafka events từ app)
- IoT devices
- Third-party APIs (Stripe, Salesforce, Google Analytics)
- Files (CSV exports, Excel)

**2. Ingestion (Thu thập)**
Lấy data từ source vào hệ thống data. Hai loại:
- **Batch ingestion**: Pull data định kỳ (mỗi giờ, mỗi ngày)
- **Stream ingestion**: Real-time events via Kafka/Kinesis

**3. Transformation (Biến đổi)**
Clean, enrich, aggregate data để có ý nghĩa business:
- **dbt** (SQL-based, phổ biến nhất)
- **PySpark** (khi scale lớn)
- **Pandas** (khi data nhỏ)

**4. Serving (Phục vụ)**
Data cuối cùng được dùng cho:
- **Analytics**: BI tools (Tableau, Looker, Power BI)
- **ML**: Feature store, training data
- **Reverse ETL**: Sync data ngược lại vào operational tools (Salesforce, HubSpot)

---

## 2. Source Systems - Nguồn dữ liệu

### Các loại source phổ biến

```python
# 1. DATABASES (JDBC/ODBC connection)
# Phổ biến nhất, bạn đã biết
# Ingestion strategy: Full load (nhỏ) hoặc Incremental (lớn)

# 2. REST APIs
import requests

def ingest_stripe_data(start_date, end_date):
    all_transactions = []
    cursor = None
    
    while True:
        params = {
            'created[gte]': int(start_date.timestamp()),
            'created[lte]': int(end_date.timestamp()),
            'limit': 100
        }
        if cursor:
            params['starting_after'] = cursor
            
        response = requests.get(
            'https://api.stripe.com/v1/charges',
            params=params,
            auth=(STRIPE_SECRET_KEY, '')
        )
        data = response.json()
        all_transactions.extend(data['data'])
        
        if not data['has_more']:
            break
        cursor = data['data'][-1]['id']
    
    return all_transactions

# 3. FILES (CSV, Excel, Parquet, JSON)
import pandas as pd

# Từ FTP/SFTP
import paramiko

def download_from_sftp(host, user, key_path, remote_path, local_path):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(host, username=user, key_filename=key_path)
    
    sftp = ssh.open_sftp()
    sftp.get(remote_path, local_path)
    sftp.close()
    ssh.close()

# 4. MESSAGE QUEUES (Kafka, RabbitMQ)
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'order-events',
    bootstrap_servers=['kafka:9092'],
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

for message in consumer:
    process_order_event(message.value)
    
# 5. WEBHOOKS (Inverse API - source pushes to you)
# Flask endpoint nhận webhook từ payment gateway
from flask import Flask, request

app = Flask(__name__)

@app.route('/webhook/payment', methods=['POST'])
def payment_webhook():
    event = request.json
    # Validate webhook signature
    # Process event
    # Return 200 OK (quan trọng - nếu không, source sẽ retry)
    return {'status': 'ok'}, 200
```

---

## 3. Data Storage Systems - Nơi lưu trữ

```
Data trong DE cần được lưu ở NHIỀU chỗ cho NHIỀU mục đích khác nhau:

Raw Zone (Data Lake)
└── Lưu data thô từ source, không transform
└── S3, GCS, ADLS Gen2
└── Format: JSON, CSV, Parquet

Processed Zone (Data Lake/Warehouse)
└── Data đã được cleaned và validated
└── Parquet format (columnar)
└── Partitioned theo date

Analytics Zone (Data Warehouse)
└── Aggregated, business-ready
└── Star schema
└── Snowflake, BigQuery, Redshift

Serving Layer
└── Low-latency serving cho ML
└── Redis (cache), Cassandra (time series)
└── Feature Store (Feast, Tecton)
```

---

## 4. Query Engines - Cách query data

```
Dữ liệu ở đâu → Query engine nào:

Data Warehouse → Native SQL (BigQuery SQL, Snowflake SQL)
Data Lake      → Presto/Trino, Spark SQL, Athena
Files (Parquet)→ DuckDB (local, cực nhanh)
Operational DB → JDBC query trong Spark
```

### DuckDB - Hidden gem cho DE

```python
import duckdb
import pandas as pd

# DuckDB: SQL engine chạy trên local, cực nhanh cho analytics
con = duckdb.connect()

# Query Parquet file trực tiếp!
result = con.execute("""
    SELECT 
        year(created_at) as year,
        month(created_at) as month,
        SUM(amount) as revenue,
        COUNT(*) as orders
    FROM read_parquet('data/orders/*.parquet')
    WHERE status = 'completed'
    GROUP BY 1, 2
    ORDER BY 1, 2
""").df()

# Query CSV file
df = con.execute("SELECT * FROM read_csv_auto('data.csv') WHERE amount > 100").df()

# Query S3 trực tiếp (không cần download!)
result = con.execute("""
    SELECT * FROM 's3://my-bucket/data/orders/*.parquet'
    LIMIT 1000
""").df()
```

---

## 5. Ingestion Patterns chi tiết

### Full Load

```python
def full_load(source_table: str, target_table: str):
    """
    Load toàn bộ bảng.
    - Đơn giản
    - Phù hợp: bảng nhỏ, static reference data (countries, categories)
    - Không phù hợp: bảng lớn, thay đổi thường xuyên
    """
    df = read_from_source(f"SELECT * FROM {source_table}")
    write_to_target(df, target_table, mode='overwrite')
```

### Incremental Load với Watermark

```python
def incremental_load(source_table: str, target_table: str, 
                     watermark_key: str = 'updated_at'):
    """
    Chỉ load data mới/changed kể từ lần trước.
    Yêu cầu: source table có `updated_at` column
    """
    # Lấy watermark (thời điểm lần trước)
    last_watermark = get_watermark(f"{source_table}_watermark")
    
    # Load chỉ data mới
    query = f"""
        SELECT * FROM {source_table}
        WHERE {watermark_key} > '{last_watermark}'
        ORDER BY {watermark_key}
    """
    df = read_from_source(query)
    
    if len(df) == 0:
        logger.info("No new data")
        return
    
    # UPSERT vào target
    upsert_to_target(df, target_table, merge_key='id')
    
    # Update watermark
    new_watermark = df[watermark_key].max()
    set_watermark(f"{source_table}_watermark", new_watermark)
    
    logger.info(f"Loaded {len(df)} rows, new watermark: {new_watermark}")
```

### Change Data Capture (CDC)

```
Source DB (PostgreSQL)
     │
     │ Database transaction log (WAL - Write Ahead Log)
     │
Debezium CDC Tool
     │
     │ Events: INSERT/UPDATE/DELETE
     ↓
Kafka Topic: cdc.public.orders

Event format:
{
    "op": "u",     # u=update, c=create, d=delete, r=read (snapshot)
    "ts_ms": 1704067200000,
    "before": {"id": 1, "status": "pending", "amount": 99.99},
    "after":  {"id": 1, "status": "completed", "amount": 99.99},
    "source": {
        "db": "production",
        "table": "orders",
        "lsn": 87654321  # Log Sequence Number
    }
}
```

---

## 6. Data Transformation Patterns

### Staging → Intermediate → Marts (dbt convention)

```sql
-- models/staging/stg_orders.sql (1:1 với source)
SELECT
    id AS order_id,
    LOWER(TRIM(status)) AS order_status,
    CAST(amount AS DECIMAL(10,2)) AS amount,
    created_at AS order_created_at
FROM {{ source('raw', 'orders') }}
WHERE id IS NOT NULL;

-- models/intermediate/int_orders_completed.sql
SELECT * FROM {{ ref('stg_orders') }}
WHERE order_status = 'completed';

-- models/marts/fct_orders.sql (business-ready)
SELECT
    o.order_id,
    o.amount,
    o.order_created_at::DATE AS order_date,
    u.country,
    u.customer_segment
FROM {{ ref('int_orders_completed') }} o
JOIN {{ ref('dim_customers') }} u ON o.user_id = u.user_id;
```

---

## 7. Serving Patterns

### BI và Analytics

```python
# DE tạo "marts" cho từng team sử dụng

# Finance mart: chỉ financial data, finance team có quyền truy cập
CREATE SCHEMA IF NOT EXISTS finance_mart;
GRANT SELECT ON ALL TABLES IN SCHEMA finance_mart TO finance_role;

# Marketing mart: campaign và customer acquisition data
CREATE SCHEMA IF NOT EXISTS marketing_mart;
GRANT SELECT ON ALL TABLES IN SCHEMA marketing_mart TO marketing_role;
```

### Reverse ETL - Sync ngược lại operational tools

```python
# Ví dụ: Sync customer segment từ DWH ngược lại vào Salesforce
# để sales team có thể thấy trong CRM

def sync_customer_segments_to_salesforce():
    # Lấy segments từ DWH
    segments = bigquery.query("""
        SELECT customer_id, crm_id, segment, lifetime_value
        FROM marts.dim_customers
        WHERE updated_at > TIMESTAMP_SUB(CURRENT_TIMESTAMP(), INTERVAL 1 HOUR)
    """)
    
    # Upsert vào Salesforce
    sf = Salesforce(username=..., password=..., security_token=...)
    for _, row in segments.iterrows():
        sf.Contact.upsert(
            'CRM_ID__c/' + row['crm_id'],
            {'Customer_Segment__c': row['segment'],
             'Lifetime_Value__c': row['lifetime_value']}
        )
```

---

## 8. Interview Q&A

**Q1: "Giải thích Data Engineering Lifecycle."**
> 5 giai đoạn: Generation (data được tạo ở source), Ingestion (collect data vào hệ thống), Transformation (clean và enrich), Serving (phục vụ cho analytics/ML). Undercurrents xuyên suốt: Security, Data Management, DataOps, Orchestration. DE sở hữu chủ yếu Ingestion → Transformation → Serving.

**Q2: "Batch ingestion vs Streaming ingestion - khi nào dùng gì?"**
> Batch: Pull data định kỳ, phù hợp khi latency chấp nhận được (hourly/daily reports). Đơn giản hơn. Streaming: Real-time events, latency < phút. Phức tạp hơn nhiều. Most pipelines là batch; streaming chỉ khi thực sự cần real-time (fraud detection, live dashboards, notifications).

**Q3: "Staging layer trong data warehouse là gì?"**
> Staging = vùng lưu raw data đã được ingested nhưng chưa transform. Lý do có staging: 1) Preserve raw data để có thể re-transform nếu bug, 2) Tách ingestion và transform (independent failure), 3) Audit trail, 4) Schema validation trước khi đưa vào marts.

**Q4: "Reverse ETL là gì?"**
> Data thường flow từ operational systems → data warehouse. Reverse ETL ngược lại: sync insights từ DWH về operational tools (CRM, marketing tools). Ví dụ: customer_segment từ BigQuery → Salesforce (để sales team thấy ngay trong CRM mà không cần query DWH).

**Q5: "DE vs Data Analyst vs Data Scientist - ai làm gì?"**
> DE: Build và maintain data infrastructure (pipelines, warehouses, quality). Không làm analysis. Data Analyst: Dùng data để answer business questions, create reports/dashboards. SQL heavy. Data Scientist: Build ML models, statistical analysis, experiments. Code + math heavy. Metaphor: DE xây nhà máy nước, Analyst phân tích nước, Scientist nghiên cứu công thức lọc nước mới.

---

## Tài liệu tham khảo

- "Fundamentals of Data Engineering" - Joe Reis & Matt Housley (O'Reilly, 2022) — Cuốn sách DE tốt nhất
- [The Data Engineering Podcast](https://www.dataengineeringpodcast.com/)
- [dbt Community](https://www.getdbt.com/community/)
