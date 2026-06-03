# ETL vs ELT: Hiểu đúng về Data Pipeline

## Giới thiệu

ETL và ELT là hai kiến trúc cơ bản nhất của data pipeline. Với BE background, bạn sẽ thấy ETL giống với việc "xử lý data trên server trước khi lưu database" — nhưng trong DE, sự khác biệt ETL vs ELT mang ý nghĩa kiến trúc lớn hơn nhiều.

---

## 1. ETL - Extract, Transform, Load

### Nguồn gốc

ETL ra đời vào thập niên 1970-1990 khi Data Warehouse đầu tiên được xây dựng. Thời đó:
- Computing power **đắt tiền và giới hạn**
- Storage trong Data Warehouse **rất tốn kém**
- → Cần xử lý và clean data **trước khi** đưa vào DWH (tránh "garbage in, garbage out")

### Cách hoạt động

```
[Source DB] → Extract → [Staging Area/Memory] → Transform → Load → [Data Warehouse]
                                                 (Python/Spark)
```

**Bước Extract:**
```python
# Kéo data từ source
raw_orders = pd.read_sql("SELECT * FROM orders WHERE date = '2024-01-15'", 
                          source_engine)
```

**Bước Transform (trên server/memory):**
```python
# Transform trước khi load
clean_orders = (raw_orders
    .dropna(subset=['user_id', 'amount'])
    .assign(
        amount_usd=lambda df: df['amount_vnd'] / 25000,
        order_date=lambda df: pd.to_datetime(df['created_at']).dt.date
    )
    .drop_duplicates('order_id')
)
```

**Bước Load:**
```python
# Load data đã clean vào DWH
clean_orders.to_sql('fact_orders', warehouse_engine, if_exists='append')
```

### Đặc điểm ETL

| Tính chất | Giá trị |
|-----------|---------|
| **Transform xảy ra** | Trước khi vào DWH (trên processing server) |
| **Raw data trong DWH** | Không có (chỉ clean data) |
| **Tool phổ biến** | Informatica, Talend, SSIS, Apache Spark |
| **Phù hợp** | On-premise DWH, storage đắt tiền, compliance cần |
| **Nhược điểm** | Khó debug (data đã transform), khó thay đổi logic sau |

---

## 2. ELT - Extract, Load, Transform

### Tại sao ELT ra đời?

Khoảng 2010-2015, Cloud Data Warehouse (BigQuery, Snowflake, Redshift) xuất hiện với:
- **Compute power gần như vô hạn** và rẻ hơn nhiều
- **Storage rẻ** ($25/TB/tháng trong Snowflake)
- **SQL engine cực mạnh** có thể transform data tốc độ cao

→ Câu hỏi: "Tại sao phải transform trước? Load raw vào DWH rồi transform ở đó, bằng SQL, nhanh hơn và linh hoạt hơn!"

### Cách hoạt động

```
[Source DB] → Extract → Load → [Data Warehouse (Raw)] → Transform (SQL/dbt) → [Marts]
                         Fast!   Staging Tables                                 
```

**Bước Extract + Load (nhanh, không transform):**
```python
# Fivetran, Airbyte, hoặc custom script
raw_orders = extract_from_source()
# Load NGAY, không transform
raw_orders.to_sql('raw_orders', warehouse_engine, if_exists='replace')
```

**Bước Transform (trong DWH, dùng SQL/dbt):**
```sql
-- Transform bằng SQL trực tiếp trong DWH
CREATE OR REPLACE TABLE fact_orders AS
SELECT 
    order_id,
    user_id,
    amount / 25000 AS amount_usd,
    DATE(created_at) AS order_date,
    -- Tất cả logic transform ở đây, trong DWH
FROM raw_orders
WHERE user_id IS NOT NULL
QUALIFY ROW_NUMBER() OVER (PARTITION BY order_id ORDER BY updated_at DESC) = 1;
```

### Đặc điểm ELT

| Tính chất | Giá trị |
|-----------|---------|
| **Transform xảy ra** | Trong DWH, sau khi load |
| **Raw data trong DWH** | Có (staging layer) |
| **Tool phổ biến** | dbt, Fivetran, Airbyte + BigQuery/Snowflake |
| **Phù hợp** | Cloud DWH, cần linh hoạt thay đổi logic |
| **Ưu điểm** | Có thể re-transform anytime, dễ debug với raw data |

---

## 3. So sánh ETL vs ELT

| Tiêu chí | ETL | ELT |
|----------|-----|-----|
| **Thứ tự** | Transform trước Load | Load trước Transform |
| **Vị trí transform** | External (server/Spark) | In-DWH (SQL) |
| **Raw data preserved?** | ❌ Không | ✅ Có |
| **Tốc độ ingest** | Chậm (phải transform) | Nhanh (dump raw) |
| **Linh hoạt thay đổi** | Khó (phải re-run pipeline) | Dễ (re-run SQL) |
| **Debug khi lỗi** | Khó (mất raw data) | Dễ (raw vẫn còn) |
| **Cost mô hình** | Compute cost khi transform | Storage cost (lưu raw) |
| **Phù hợp** | Sensitive data, on-prem | Modern cloud DWH |
| **Trend 2024** | ⬇️ Giảm | ⬆️ Tăng mạnh |

### Ví dụ thực tế: Khi raw data quan trọng

```python
# Tình huống: Bug trong transform logic của ETL
# - Đã transform và load 6 tháng data
# - Phát hiện bug: currency conversion sai (dùng 25000 thay vì tỷ giá thực)
# - Với ETL: Raw data đã mất → phải kéo lại từ source (có thể không còn)
# - Với ELT: Raw data vẫn trong staging → chỉ cần fix SQL và re-transform!

-- ELT: Fix bug cực dễ
UPDATE staging.raw_orders SET currency_data = fetch_from_api();

-- Re-transform với logic đúng
dbt run --select fact_orders --full-refresh
```

---

## 4. Batch Processing vs Stream Processing

### Batch Processing

> Xử lý data **theo lô (batch)**, chạy theo lịch định sẵn.

```python
# Batch job chạy lúc 2 giờ sáng mỗi ngày
# Xử lý toàn bộ data của ngày hôm qua

def daily_batch_job():
    # Extract: tất cả orders của hôm qua
    yesterday = date.today() - timedelta(days=1)
    orders = extract_orders(date=yesterday)
    
    # Transform
    clean_orders = transform(orders)
    
    # Load
    load_to_warehouse(clean_orders, partition_date=yesterday)

# Schedule với Airflow/cron
```

**Characteristics:**
- Latency: minutes đến hours (data trễ 1 ngày là bình thường)
- Throughput: Cao (xử lý lượng lớn cùng lúc)
- Complexity: Thấp hơn
- Tools: Spark, SQL, dbt

**Dùng khi:**
- Báo cáo daily/weekly/monthly
- ML model training
- Historical data processing
- Khi data delay chấp nhận được

### Stream Processing

> Xử lý data **real-time**, ngay khi event xảy ra.

```python
# Stream processing với Kafka + Python
from kafka import KafkaConsumer
import json

consumer = KafkaConsumer(
    'order-events',
    bootstrap_servers=['kafka:9092'],
    value_deserializer=lambda x: json.loads(x.decode('utf-8'))
)

for message in consumer:
    order = message.value
    
    # Process ngay lập tức (ms latency)
    enriched_order = enrich_order(order)
    update_realtime_dashboard(enriched_order)
    check_fraud_rules(order)
    
    # Optional: Write vào DWH
    write_to_sink(enriched_order)
```

**Characteristics:**
- Latency: ms đến seconds
- Throughput: Thấp hơn (per event)
- Complexity: Cao hơn (state management, exactly-once)
- Tools: Kafka Streams, Flink, Spark Streaming

**Dùng khi:**
- Fraud detection (phải quyết định trong < 1 giây)
- Real-time dashboard
- IoT sensor data
- Notification system

### Micro-batch: Giải pháp trung gian

```
Batch:  |---10s---|---10s---|---10s---|   (mỗi 10 giây xử lý 1 batch nhỏ)
Stream: event→process→event→process→...  (liên tục)
```

Spark Structured Streaming có thể chạy ở micro-batch mode — đơn giản hơn stream nhưng latency thấp hơn batch.

---

## 5. Data Pipeline Patterns quan trọng

### Pattern 1: Full Load (Simple nhưng kém hiệu quả)

```python
# Mỗi lần chạy: Load toàn bộ bảng
def full_load():
    all_data = extract_all()              # Kéo HẾT data từ source
    target_table.truncate()               # Xóa toàn bộ trong DWH
    target_table.insert(all_data)         # Insert lại hết

# Vấn đề: Source có 100M rows → mỗi ngày đều kéo 100M rows!
```

**Dùng khi**: Bảng nhỏ (<1M rows), data thay đổi toàn bộ, logic đơn giản

### Pattern 2: Incremental Load (Phổ biến nhất)

```python
# Chỉ kéo data MỚI hoặc đã THAY ĐỔI
def incremental_load(last_run_time: datetime):
    # Chỉ extract data từ lần chạy trước đến giờ
    new_data = extract_where(
        f"updated_at > '{last_run_time}'"
    )
    
    # UPSERT: Insert mới hoặc Update nếu đã tồn tại
    upsert_to_target(new_data, merge_key='order_id')
    
    # Lưu lại thời gian chạy
    save_watermark(current_time)
```

**Yêu cầu**: Source table cần có `updated_at` column (không phải lúc nào cũng có!)

### Pattern 3: Change Data Capture (CDC)

**Vấn đề với Incremental**: Không bắt được DELETE trong source. Nếu user xóa account, incremental load không biết.

```
                  ┌─────────────────────────┐
Source DB ─────→ │ CDC Tool (Debezium)      │ ────→ Kafka ────→ DWH
(MySQL)          │ Đọc binlog của MySQL     │       (events)
                 └─────────────────────────┘
                   INSERT/UPDATE/DELETE events
```

Debezium đọc **database transaction log** (binlog cho MySQL, WAL cho PostgreSQL) và phát event cho từng thay đổi:

```json
// Event từ Debezium khi có UPDATE
{
  "op": "u",          // u=update, c=create, d=delete
  "before": {"id": 1, "status": "pending"},
  "after": {"id": 1, "status": "completed"},
  "ts_ms": 1704067200000
}
```

---

## 6. Orchestration: Điều phối Pipeline

### Vấn đề khi không có Orchestration

```
Job A (kéo orders) → Job B (kéo users) → Job C (join và create fact table)

Điều gì xảy ra nếu:
- Job A fail? → Job C chạy với data thiếu → báo cáo sai
- Job B chạy chậm, Job C bắt đầu trước? → lỗi hoặc data inconsistent
- Cần retry Job A 3 lần trước khi report lỗi?
- Cần alert khi pipeline fail sau 2 giờ?
```

### Orchestration Tool giải quyết vấn đề này

**Apache Airflow** (phổ biến nhất):

```python
from airflow import DAG
from airflow.operators.python import PythonOperator
from datetime import datetime, timedelta

# Định nghĩa DAG (Directed Acyclic Graph)
dag = DAG(
    'daily_data_pipeline',
    schedule_interval='0 2 * * *',  # Chạy 2 giờ sáng mỗi ngày
    start_date=datetime(2024, 1, 1),
    default_args={
        'retries': 3,
        'retry_delay': timedelta(minutes=5),
        'email_on_failure': True
    }
)

# Tasks
extract_orders = PythonOperator(
    task_id='extract_orders',
    python_callable=extract_orders_function,
    dag=dag
)

extract_users = PythonOperator(
    task_id='extract_users',
    python_callable=extract_users_function,
    dag=dag
)

create_fact_orders = PythonOperator(
    task_id='create_fact_orders',
    python_callable=create_fact_orders_function,
    dag=dag
)

# Định nghĩa dependencies
# extract_orders và extract_users chạy SONG SONG
# create_fact_orders chạy SAU KHI cả hai xong
[extract_orders, extract_users] >> create_fact_orders
```

---

## 7. Rủi ro khi không có Pipeline Design đúng

- **Không idempotent**: Pipeline fail giữa chừng, re-run → data bị duplicate
- **Không có watermark**: Không biết "đã load đến đâu" → miss data hoặc duplicate
- **Coupling chặt**: Job A fail → toàn bộ pipeline block, không independent recovery
- **Không monitor**: Pipeline fail lúc 3 giờ sáng, 9 giờ sáng Analyst mới phát hiện báo cáo trống

---

## 8. Interview Q&A

**Q1: "ETL và ELT khác nhau như thế nào? Khi nào dùng cái nào?"**
> ETL transform data trước khi load vào DWH (transform xảy ra external). ELT load raw data vào DWH trước, rồi transform bằng SQL trong DWH. Dùng ETL khi: on-premise DWH, data sensitive (không muốn raw vào DWH), compute outside DWH rẻ hơn. Dùng ELT khi: Cloud DWH, cần flexibility re-transform, muốn giữ raw data.

**Q2: "Batch và Stream processing - khi nào dùng streaming?"**
> Streaming khi: latency requirement < 1 phút (fraud detection, real-time dashboard, notifications). Batch khi: latency chấp nhận được (daily reports, ML training, historical backfill). Streaming phức tạp hơn nhiều (state management, exactly-once semantics) → chỉ dùng khi thực sự cần.

**Q3: "Idempotency trong pipeline là gì? Tại sao quan trọng?"**
> Pipeline idempotent = chạy lại với cùng input cho cùng output, không side effects (không duplicate). Quan trọng vì pipeline SẼ fail — cần retry an toàn. Cách implement: Delete-then-insert theo partition, MERGE/UPSERT thay vì INSERT, track processed records.

**Q4: "Change Data Capture là gì? So với incremental load?"**
> Incremental load: pull data từ source dựa trên `updated_at`. Vấn đề: không bắt được DELETE, cần column `updated_at`. CDC: Đọc transaction log của database (binlog/WAL) để bắt TẤT CẢ changes (INSERT/UPDATE/DELETE) real-time. CDC chính xác hơn nhưng phức tạp hơn.

**Q5: "Watermark trong streaming là gì?"**
> Watermark là cơ chế handle late-arriving data. Ví dụ: Event lúc 10:00 có thể arrive lúc 10:05 do network delay. Watermark = "trễ tối đa 5 phút" — mọi data đến sau window + 5 phút sẽ bị drop. Trade-off: watermark lớn → ít data loss nhưng latency cao.

**Q6: "DAG trong Airflow là gì?"**
> DAG = Directed Acyclic Graph — đồ thị có hướng không có vòng lặp. Trong Airflow, mỗi node là một Task, mỗi edge là dependency. "Acyclic" đảm bảo không có circular dependency (Task A → B → A là không hợp lệ). Airflow execute tasks theo topological sort của DAG.

---

## Tài liệu tham khảo

- [Apache Airflow Documentation](https://airflow.apache.org/docs/)
- [Fivetran vs Custom ETL](https://www.fivetran.com/blog/why-fivetran)
- "Fundamentals of Data Engineering" - Joe Reis (Chapter 7-8)
