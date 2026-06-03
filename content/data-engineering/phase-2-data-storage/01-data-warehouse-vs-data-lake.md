# Data Warehouse, Data Lake và Data Lakehouse

## Giới thiệu

Đây là một trong những câu hỏi phỏng vấn phổ biến nhất cho DE. Nhiều người nhầm lẫn giữa 3 khái niệm này. Bài này sẽ giải thích chi tiết từ lịch sử đến thực tế áp dụng.

---

## 1. Nguồn gốc: Tại sao cần lưu trữ dữ liệu riêng biệt?

### Vấn đề với Production Database (OLTP)

Là BE, bạn đã quen với production database (MySQL, PostgreSQL). Vậy tại sao không query thẳng nó để lấy báo cáo?

Hãy tưởng tượng: Data Analyst cần báo cáo doanh thu tháng trước, chạy query:

```sql
-- Query này cần scan 50 triệu rows trong orders table
SELECT 
    DATE(created_at) as date,
    SUM(amount) as revenue,
    COUNT(*) as order_count
FROM orders
WHERE created_at >= '2024-01-01' AND created_at < '2024-02-01'
GROUP BY DATE(created_at);
```

**Điều gì xảy ra?**
- Query lock table, làm chậm production app
- User không thể checkout vì database bận
- Analyst không thể chạy query phức tạp thoải mái
- "Analytics killing production" — đây là vấn đề thực tế mà tất cả company đều gặp

**Giải pháp**: Tách hệ thống lưu trữ dành riêng cho analytics.

---

## 2. Data Warehouse - "Kho dữ liệu có tổ chức"

### Ra đời như thế nào?

Bill Inmon được gọi là "Father of Data Warehouse" khi ông định nghĩa khái niệm này vào thập niên 1990. Ý tưởng: **Copy data từ các production database vào một hệ thống tập trung, được tổ chức tốt để phân tích**.

### Định nghĩa

> **Data Warehouse** là hệ thống lưu trữ dữ liệu **có cấu trúc** (structured), được tối ưu cho **analytical query** (OLAP), dữ liệu được **làm sạch và transform** trước khi lưu.

### Đặc điểm kỹ thuật

| Tính chất | Chi tiết |
|-----------|----------|
| **Lưu trữ** | Columnar (theo cột, không theo hàng) |
| **Format** | Structured (tables với schema cố định) |
| **Data quality** | Cao — đã được validate và clean |
| **Query type** | SQL — analytical, aggregation |
| **Tốc độ ingest** | Chậm hơn (phải transform trước) |
| **Chi phí** | Cao hơn (compute + storage) |
| **Dữ liệu** | Chỉ structured (không chứa ảnh, video, logs raw) |

### Các Data Warehouse phổ biến hiện nay

```
Snowflake     → Cloud-native, multi-cloud, SQL-first, cực phổ biến 2020+
BigQuery      → GCP, serverless, giá theo query (pay-per-query)
Amazon Redshift → AWS, columnar PostgreSQL variant
Azure Synapse → Microsoft Azure
```

### Ví dụ cấu trúc Data Warehouse

```
Data Warehouse
│
├── staging/          ← Raw data vừa được ingest (chưa transform)
│   ├── stg_orders
│   ├── stg_users  
│   └── stg_products
│
├── intermediate/     ← Transform trung gian
│   ├── int_orders_enriched
│   └── int_user_segments
│
└── marts/            ← Business-ready tables cho từng team
    ├── finance/
    │   ├── fct_revenue          ← Fact table
    │   └── dim_date             ← Dimension table
    ├── marketing/
    │   ├── fct_campaigns
    │   └── dim_customers
    └── product/
        └── fct_user_events
```

---

## 3. Data Lake - "Hồ dữ liệu thô"

### Vấn đề của Data Warehouse

Data Warehouse hoạt động tốt cho structured data. Nhưng modern business tạo ra rất nhiều **unstructured và semi-structured data**:
- Log files từ web server (TB/ngày)
- Images, videos của users
- Audio recordings
- Clickstream events (JSON)
- IoT sensor data
- Social media posts

**Data Warehouse không thể chứa những thứ này** vì:
- Cost: Lưu 1TB data raw trong Snowflake đắt hơn S3 ~10 lần
- Schema-on-write: Warehouse yêu cầu define schema trước → không linh hoạt
- Chưa biết sẽ dùng data này như thế nào trong tương lai

### Giải pháp: Data Lake (ra đời ~2010)

> **Data Lake** là nơi lưu trữ **tất cả loại dữ liệu** (structured, semi-structured, unstructured) ở **dạng raw** (gốc), không cần transform trước. Schema được define khi đọc (schema-on-read).

### Đặc điểm kỹ thuật

| Tính chất | Chi tiết |
|-----------|----------|
| **Lưu trữ** | Object storage (S3, GCS, ADLS) |
| **Format** | Bất kỳ (CSV, JSON, Parquet, Avro, ảnh, video...) |
| **Data quality** | Thấp — raw data, "as is" |
| **Query** | Cần thêm engine (Spark, Athena, BigQuery External) |
| **Chi phí storage** | Rất rẻ ($0.023/GB/tháng với S3) |
| **Tốc độ ingest** | Nhanh — dump trực tiếp |
| **Dữ liệu** | Tất cả mọi thứ |

### Cấu trúc Data Lake (Zone Architecture)

```
Data Lake (S3/GCS)
│
├── raw/              ← Dữ liệu thô, không động vào
│   ├── 2024/01/01/
│   │   ├── orders.json.gz
│   │   ├── clickstream.jsonl
│   │   └── server.log
│   └── 2024/01/02/
│       └── ...
│
├── processed/        ← Đã qua bước clean cơ bản (Parquet format)
│   ├── orders/
│   │   └── year=2024/month=01/day=01/
│   │       └── part-00001.parquet
│   └── clickstream/
│
└── curated/          ← Đã aggregated, ready to serve
    ├── daily_revenue/
    └── user_segments/
```

### Vấn đề với Data Lake thuần túy

Data Lake nghe hay, nhưng thực tế có vấn đề nghiêm trọng:

1. **Data Swamp**: Dump data vào nhưng không ai biết cái gì ở đâu → "Data Swamp" (đầm lầy)
2. **No ACID transactions**: Không đảm bảo consistency khi write
3. **Không thể update/delete**: Object storage không hỗ trợ UPDATE
4. **No schema enforcement**: Data sai format lọt vào, query lỗi
5. **Slow query**: Raw JSON/CSV chậm hơn Parquet 10-100x

---

## 4. Data Lakehouse - "Tốt nhất của cả hai"

### Ra đời như thế nào?

Năm 2020, **Databricks** giới thiệu khái niệm **Delta Lake** và **Data Lakehouse** — giải pháp kết hợp ưu điểm của cả hai:

> **Data Lakehouse** = Lưu trữ rẻ của Data Lake + Tính năng ACID/SQL của Data Warehouse

Điều này được thực hiện bằng cách thêm một **metadata/transaction layer** lên trên object storage.

### Các Table Format phổ biến

| Format | Tạo bởi | Đặc điểm |
|--------|---------|-----------|
| **Delta Lake** | Databricks | ACID, time travel, Z-ordering |
| **Apache Iceberg** | Netflix | Open standard, hidden partitioning |
| **Apache Hudi** | Uber | Upsert-friendly, streaming |

### Tính năng Delta Lake (ví dụ thực tế)

```python
from delta.tables import DeltaTable
from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .config("spark.sql.extensions", "io.delta.sql.DeltaSparkSessionExtension") \
    .getOrCreate()

# ACID WRITE
df.write.format("delta").mode("overwrite").save("s3://my-lake/orders/")

# UPDATE (không thể làm với raw Parquet!)
deltaTable = DeltaTable.forPath(spark, "s3://my-lake/orders/")
deltaTable.update(
    condition="status = 'pending' AND created_days_ago > 30",
    set={"status": "'cancelled'"}
)

# DELETE
deltaTable.delete("status = 'test'")

# MERGE (UPSERT) - cực kỳ phổ biến trong incremental loading
deltaTable.alias("target").merge(
    source=new_orders.alias("source"),
    condition="target.order_id = source.order_id"
).whenMatchedUpdateAll() \
 .whenNotMatchedInsertAll() \
 .execute()

# TIME TRAVEL - Xem data 7 ngày trước
spark.read.format("delta") \
    .option("versionAsOf", 5) \
    .load("s3://my-lake/orders/")

# Hoặc theo timestamp
spark.read.format("delta") \
    .option("timestampAsOf", "2024-01-01") \
    .load("s3://my-lake/orders/")
```

---

## 5. So sánh Tổng hợp

| Tiêu chí | Data Warehouse | Data Lake | Data Lakehouse |
|----------|---------------|-----------|----------------|
| **Loại data** | Structured only | Any | Any |
| **Schema** | Schema-on-write | Schema-on-read | Both |
| **ACID** | ✅ | ❌ | ✅ |
| **UPDATE/DELETE** | ✅ | ❌ | ✅ |
| **Cost/TB** | Cao ($$$) | Thấp ($) | Thấp-trung bình |
| **Query SQL** | Native | Cần engine | Native |
| **Streaming** | Batch mostly | ✅ | ✅ |
| **ML support** | ⚠️ | ✅ | ✅ |
| **Ví dụ tool** | Snowflake, BigQuery | S3 + Spark | Databricks, BigQuery |

---

## 6. Khi nào dùng cái nào?

### Dùng Data Warehouse khi:
- ✅ Data chủ yếu là structured (orders, users, products)
- ✅ Team chủ yếu là SQL users (Analyst, BI)
- ✅ Cần query nhanh và đơn giản
- ✅ Data volume: GB → vài TB
- ✅ Công ty nhỏ-vừa, không cần data science phức tạp

### Dùng Data Lake khi:
- ✅ Cần lưu raw data để compliance/audit
- ✅ Có nhiều unstructured data (logs, images, text)
- ✅ Data volume: PB+
- ✅ Team Data Science cần data raw để train ML model
- ✅ Chưa biết cần dùng data như thế nào

### Dùng Data Lakehouse khi:
- ✅ Cần cả structured query VÀ ML workload
- ✅ Cần streaming + batch trong cùng platform
- ✅ Muốn cost-effective storage nhưng vẫn có SQL capability
- ✅ Team lớn với cả DE, DS, và Analyst

---

## 7. Modern Architecture: Lambda vs Kappa

### Lambda Architecture (phổ biến hơn)

```
Data Source
     │
     ├──→ Batch Layer (Spark) ──→ Batch View (DWH)
     │                                               ↘
     └──→ Speed Layer (Kafka + Spark Streaming) ──→ Serving Layer → Query
                                                    ↗
                                         Real-time View
```

**Vấn đề**: Phải maintain 2 code path (batch + streaming) → complexity cao.

### Kappa Architecture (đơn giản hơn)

```
Data Source → Streaming Layer (Kafka) → Replayable Log → Serving Layer
```

**Ý tưởng**: Dùng streaming cho tất cả. Khi cần reprocess, replay từ Kafka log.
**Phù hợp**: Khi latency requirement thấp (<1 phút) cho mọi use case.

---

## 8. Rủi ro khi thiết kế sai

- **Dùng DWH cho raw data**: Tốn tiền gấp 10x so với object storage
- **Dùng Data Lake không governance**: "Data Swamp" — không ai biết data ở đâu, quality như thế nào
- **Không design partition**: Query scan toàn bộ lake → chậm và tốn tiền
- **Không có data catalog**: Onboard nhân viên mới cực khó vì không biết data có gì

---

## 9. Interview Q&A

**Q1: "Data Warehouse và Database khác nhau như thế nào?"**
> Database (OLTP): Tối ưu cho write nhanh, nhiều transaction nhỏ, row-based storage, schema normalized. Data Warehouse (OLAP): Tối ưu cho read/aggregate, ít write, columnar storage, schema denormalized (Star/Snowflake). Analogy: Database = sổ ghi chép bán hàng từng ngày. Data Warehouse = báo cáo cuối năm tổng hợp.

**Q2: "Data Lake và Data Warehouse nên dùng song song không?"**
> Có — đây là pattern phổ biến nhất. Data Lake là "landing zone" cho raw data (cheap, flexible). Data Warehouse nhận data đã được processed từ Lake (fast, structured). Ngày nay, nhiều công ty dùng Data Lakehouse để gộp cả hai.

**Q3: "ACID trong Delta Lake là gì?"**
> Atomicity (toàn bộ write thành công hoặc fail), Consistency (data luôn valid), Isolation (nhiều writer không conflict), Durability (đã write thì không mất). Quan trọng: Raw Parquet trong S3 không có ACID — nếu job fail giữa chừng, bạn có thể bị partial data corruption.

**Q4: "Time Travel trong Delta Lake dùng để làm gì?"**
> 1) Rollback nếu có bug trong transform, 2) Audit — xem data trông như thế nào vào thời điểm cụ thể, 3) Reproduce ML experiment với data tại thời điểm training, 4) Debug data quality issues.

**Q5: "Giải thích schema-on-write vs schema-on-read"**
> Schema-on-write (DWH): Phải define schema trước khi write. Data không match schema → rejected. Strict, nhưng query nhanh. Schema-on-read (Lake): Dump data bất kỳ format. Schema được infer/apply khi đọc. Flexible nhưng lỗi chỉ phát hiện khi query.

**Q6: "Data Mesh là gì? Khác Data Lake như thế nào?"**
> Data Mesh là organizational/architecture pattern, không phải technology. Thay vì một team DE trung tâm quản lý tất cả data, mỗi domain team (e.g., Finance, Marketing) tự own và serve data của mình như "data products". Data Lake là một kho chung. Data Mesh là nhiều kho nhỏ do từng team quản lý.

---

## Tài liệu tham khảo

- [What is a Data Lakehouse? - Databricks](https://www.databricks.com/blog/2020/01/30/what-is-a-data-lakehouse.html)
- [Delta Lake Documentation](https://docs.delta.io)
- "Fundamentals of Data Engineering" - Joe Reis (Chapter 6)
