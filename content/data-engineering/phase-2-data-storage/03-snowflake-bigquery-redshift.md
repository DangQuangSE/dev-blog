# Snowflake, BigQuery và Amazon Redshift: So sánh Cloud Data Warehouses

## Giới thiệu

Ba cái tên này sẽ xuất hiện trong hầu hết mọi DE job description. Chúng đều là cloud Data Warehouses, nhưng có triết lý thiết kế và điểm mạnh rất khác nhau. Bài này giúp bạn hiểu rõ từng sản phẩm để trả lời câu hỏi phỏng vấn "Bạn đã làm việc với DWH nào? Chúng khác nhau thế nào?"

---

## 1. Tại sao Cloud DWH thay thế on-premises?

### Vấn đề với Teradata/Oracle DWH cũ

```
Trước 2012, DWH on-premises phổ biến (Teradata, IBM Netezza, Oracle):
- Chi phí: $100k - $10M+ cho hardware + license
- Setup: 6-12 tháng
- Scaling: Mua thêm hardware (tháng, không phải phút)
- Maintenance: Cần DBA team riêng
- Fixed capacity: Mùa peak (Black Friday) → hoặc over-provision quanh năm
                  hoặc system chậm khi cần nhất
```

### Cloud DWH giải quyết như thế nào?

- **Pay-as-you-go**: Chỉ trả tiền khi dùng
- **Infinite scale**: Scale compute up trong phút
- **Managed service**: Không cần DBA maintain database
- **Separation of storage and compute**: Scale riêng biệt, tiết kiệm hơn nhiều

---

## 2. Amazon Redshift - Veteran của Cloud DWH

### Nguồn gốc (2012)

Amazon ra mắt Redshift năm 2012 — cloud DWH thực sự đầu tiên. Được build trên ParAccel (fork của PostgreSQL) với columnar storage.

### Kiến trúc

```
Redshift Cluster
├── Leader Node: Query planning, coordination
├── Compute Node 1: xử lý slice 1
├── Compute Node 2: xử lý slice 2
└── Compute Node N: xử lý slice N

Data được distribute across compute nodes theo distribution key.
```

### Đặc điểm chính

| Tính chất | Chi tiết |
|-----------|----------|
| **Architecture** | Cluster-based (phải chọn node type và size) |
| **Storage** | Attached to compute nodes (cũ) hoặc Redshift Serverless (mới) |
| **Pricing** | Per hour per node ($0.25-$6.00/hour depending on node type) |
| **SQL Dialect** | PostgreSQL-like (quen thuộc với BE) |
| **Strengths** | Deep AWS integration, mature, steady-workload efficient |
| **Limitations** | Must size cluster, scaling takes time |

### Redshift-specific SQL

```sql
-- Distribution styles (quan trọng khi design Redshift tables)
CREATE TABLE fact_orders (
    order_id    BIGINT,
    user_id     BIGINT,
    amount      DECIMAL(10,2),
    order_date  DATE
)
DISTSTYLE KEY DISTKEY (user_id)     -- Distribute by user_id (tốt cho join với user table)
SORTKEY (order_date);                -- Sort data cho range queries nhanh hơn

-- Alternative: DISTSTYLE ALL (replicate small table across all nodes)
CREATE TABLE dim_country (
    country_id  INT,
    name        VARCHAR(100),
    region      VARCHAR(50)
)
DISTSTYLE ALL;  -- Table nhỏ → copy tất cả nodes → join không cần network

-- COPY command: Fast bulk load từ S3
COPY fact_orders
FROM 's3://my-bucket/orders/2024/'
IAM_ROLE 'arn:aws:iam::123:role/redshift-s3-role'
FORMAT AS PARQUET;

-- Vacuum: Reclaim space và resort (cần chạy định kỳ trong Redshift!)
VACUUM fact_orders;
ANALYZE fact_orders;  -- Update statistics for query planner
```

---

## 3. Google BigQuery - Game Changer

### Nguồn gốc (2010)

BigQuery xuất phát từ Dremel — Google's internal system được dùng để query petabytes of data trong giây. Public release năm 2010 (từ Paper năm 2010).

### Kiến trúc: True Serverless

```
BigQuery Architecture (Unique!)

Storage Layer: Colossus (Google's distributed file system)
│              Fully separated from compute
│              Data lưu ở Capacitor format (Google's Parquet variant)
│              
Compute Layer: Borg (Google's cluster management)
               Auto-provisioned per query
               Elastic: 1 query có thể dùng thousands of CPUs
               
→ Bạn KHÔNG quản lý bất kỳ cluster nào!
→ Query lớn → BigQuery tự allocate nhiều compute hơn
```

### BigQuery đặc biệt như thế nào?

```sql
-- 1. PARTITION BY DATE (cực quan trọng để tiết kiệm tiền)
CREATE TABLE orders (
    order_id    STRING,
    amount      FLOAT64,
    status      STRING,
    created_at  TIMESTAMP
)
PARTITION BY DATE(created_at)   -- Partition tự động theo ngày!
CLUSTER BY status, order_id;    -- Cluster within partition

-- Query chỉ quét partition cần thiết
SELECT SUM(amount) FROM orders
WHERE DATE(created_at) = '2024-01-15';  -- Chỉ scan 1 ngày!

-- 2. Giá theo bytes scanned (không phải theo giờ)
-- $5/TB scanned → cần optimize query!

-- 3. ARRAY và STRUCT (semi-structured trong SQL)
SELECT 
    order_id,
    ARRAY_AGG(STRUCT(product_id, quantity, unit_price)) as items
FROM order_items
GROUP BY order_id;

-- Query vào nested structure
SELECT 
    order_id,
    item.product_id,
    item.quantity
FROM orders, UNNEST(items) AS item
WHERE item.quantity > 5;

-- 4. BigQuery ML
CREATE OR REPLACE MODEL `project.dataset.churn_model`
OPTIONS (model_type='LOGISTIC_REG') AS
SELECT 
    days_since_last_order,
    total_orders,
    avg_order_value,
    is_churned AS label
FROM customer_features;

-- 5. External Tables (query data trong GCS mà không import)
CREATE EXTERNAL TABLE orders_external
OPTIONS (
    format = 'PARQUET',
    uris = ['gs://my-bucket/orders/*.parquet']
);

-- 6. Scheduled Queries (thay cho Airflow cho simple cases)
-- Tự động chạy query theo schedule và lưu kết quả vào table
```

### BigQuery Pricing Model

```
On-Demand: $5/TB scanned
  → Trả theo query, phù hợp workload không đều

Flat Rate (Capacity slots):
  → Trả theo slot-hours (compute units)
  → Phù hợp workload lớn, predictable
  → 100 slots = ~$2000/month = ~$0.06/slot-hour

Storage: $0.02/GB/month (active), $0.01/GB/month (long-term)
```

---

## 4. Snowflake - The "Best of Both Worlds"

### Nguồn gốc (2012, public 2014)

Benoit Dageville và Thierry Cruanes (từ Oracle) co-founded Snowflake với một câu hỏi: "Tại sao cloud DWH phải bị tied vào 1 cloud provider?"

### Kiến trúc: Multi-Cloud, True Separation

```
Snowflake Architecture

Cloud Storage Layer (S3/GCS/Azure)
│    Raw data stored in Snowflake's micro-partitions
│
Compute Layer (Virtual Warehouses)
│    X-Small → X-Large → 2X-Large (2x cost/size)
│    Multiple warehouses → different teams, workloads
│    Suspend when idle → only pay when running!
│
Services Layer
     Global metadata, query optimization, auth, ACID
     
KEY: Bạn chọn cloud (AWS, GCP, Azure) khi tạo account!
     → Không bị lock vào 1 cloud
```

### Snowflake đặc biệt như thế nào?

```sql
-- 1. Virtual Warehouses: Separate compute cho từng workload
-- Tạo warehouse riêng cho ETL (cần large) và BI (cần fast, small)
CREATE WAREHOUSE etl_warehouse
    WAREHOUSE_SIZE = 'LARGE'
    AUTO_SUSPEND = 300  -- Suspend sau 5 phút idle (tiết kiệm tiền!)
    AUTO_RESUME = TRUE;  -- Tự start khi có query

CREATE WAREHOUSE bi_warehouse  
    WAREHOUSE_SIZE = 'SMALL'
    AUTO_SUSPEND = 60;  -- BI queries thường ngắn

-- 2. Multi-Cluster Warehouse: Scale concurrent users
CREATE WAREHOUSE analytics_warehouse
    WAREHOUSE_SIZE = 'MEDIUM'
    MIN_CLUSTER_COUNT = 1
    MAX_CLUSTER_COUNT = 5   -- Tự scale up khi nhiều concurrent queries
    SCALING_POLICY = 'ECONOMY';

-- 3. Time Travel: Query data ở thời điểm bất kỳ (90 ngày)
SELECT * FROM orders AT (TIMESTAMP => '2024-01-15 10:00:00');
SELECT * FROM orders AT (OFFSET => -3600);  -- 1 giờ trước

-- Undrop: Restore table đã bị xóa
DROP TABLE orders;
UNDROP TABLE orders;  -- Restore!

-- 4. Zero-Copy Cloning: Clone table không tốn storage
CREATE TABLE orders_dev CLONE orders;  -- Development copy, instant!
-- Cloned table share storage với original, chỉ tốn thêm khi có changes

-- 5. Data Sharing: Share data với external accounts (không copy!)
CREATE SHARE revenue_share;
GRANT SELECT ON TABLE fact_orders TO SHARE revenue_share;
ALTER SHARE revenue_share ADD ACCOUNT = 'partner_account';
-- Partner đọc data LIVE, bạn không cần copy hay transfer!

-- 6. Streams và Tasks: ELT trong Snowflake
CREATE STREAM orders_stream ON TABLE raw_orders;
-- Stream track changes (INSERT/UPDATE/DELETE)

CREATE TASK process_new_orders
    WAREHOUSE = etl_warehouse
    SCHEDULE = '5 MINUTE'
AS
INSERT INTO fact_orders
SELECT ... FROM orders_stream WHERE METADATA$ACTION = 'INSERT';

-- 7. Variant: Semi-structured data
CREATE TABLE events (
    event_id   STRING,
    event_data VARIANT  -- Store JSON, XML, Avro!
);

INSERT INTO events VALUES ('E001', PARSE_JSON('{"type": "click", "element": "btn-buy"}'));

-- Query JSON fields
SELECT event_data:type::STRING, event_data:element::STRING
FROM events;
```

---

## 5. So sánh Tổng hợp

| Tiêu chí | Redshift | BigQuery | Snowflake |
|----------|----------|----------|-----------|
| **Cloud** | AWS only | GCP only | AWS/GCP/Azure |
| **Architecture** | Cluster | Serverless | Separated (VW) |
| **Pricing unit** | Per node/hour | Per TB scanned | Per credit (compute-hour) |
| **Cold start** | Cluster always on | Instant | Auto-resume (few seconds) |
| **Time Travel** | 7 days (trash) | 7 days | 0-90 days |
| **Zero-copy clone** | ❌ | ❌ | ✅ |
| **Data Sharing** | ❌ (basic) | ✅ Analytics Hub | ✅ (native) |
| **Semi-structured** | SUPER (limited) | ARRAY/STRUCT/JSON | VARIANT (best) |
| **Multi-cluster** | ❌ | Auto (built-in) | ✅ (enterprise) |
| **ML in SQL** | ❌ | ✅ BigQuery ML | ✅ Snowpark ML |
| **Best for** | AWS-heavy companies | GCP ecosystem, startups | Multi-cloud, sharing |

---

## 6. Khi nào chọn cái nào?

### Chọn Redshift nếu:
- ✅ Công ty đã dùng AWS nhiều (EC2, S3, Glue)
- ✅ Workload predictable, steady (không cần scale up/down nhiều)
- ✅ Team quen PostgreSQL
- ✅ Đang migrate từ Teradata/Netezza (Redshift gần giống nhất)

### Chọn BigQuery nếu:
- ✅ Công ty dùng GCP (Firebase, Google Analytics, etc.)
- ✅ Startup, không muốn manage anything (true serverless)
- ✅ Workload rất variable (pay per query)
- ✅ Cần BigQuery ML hoặc Vertex AI integration
- ✅ Team nhỏ, không có DBA

### Chọn Snowflake nếu:
- ✅ Multi-cloud strategy
- ✅ Cần chia sẻ data với external partners (Data Sharing)
- ✅ Development cần clone environment nhanh (Zero-copy Clone)
- ✅ Muốn isolate workloads (ETL vs BI vs Data Science)
- ✅ Semi-structured data (JSON) là priority

---

## 7. Interview Q&A

**Q1: "Snowflake khác BigQuery như thế nào?"**
> Snowflake: Cluster-based Virtual Warehouses (bạn chọn size, scale khi cần), multi-cloud, strengths ở Data Sharing và Zero-copy Clone. BigQuery: True serverless (Google manages everything), pay-per-query, chỉ GCP, strengths ở instant scaling và deep GCP integration. Cả hai đều excellent, chọn dựa trên cloud strategy và pricing model preference.

**Q2: "Columnar storage là gì? Tại sao DWH dùng nó?"**
> Row-based (MySQL): Lưu dữ liệu theo hàng. Đọc 1 row = đọc tất cả columns của row đó. Tốt cho OLTP (update, single row reads). Columnar (BigQuery, Snowflake): Lưu theo cột. `SELECT SUM(amount) FROM orders` chỉ đọc column `amount`, skip tất cả columns khác. Tốt cho OLAP (aggregate nhiều rows của 1-2 columns). Kết hợp với compression: Same values được stored together → compress tốt hơn.

**Q3: "Distribution Key trong Redshift là gì?"**
> Xác định data được distribute như thế nào across compute nodes. `DISTSTYLE KEY DISTKEY (user_id)`: Tất cả rows có cùng user_id → cùng node → JOIN với user table không cần network shuffle. `DISTSTYLE EVEN`: Distribute đều (tốt cho full table scans). `DISTSTYLE ALL`: Copy toàn bộ table tới tất cả nodes (nhỏ, join nhiều).

**Q4: "Time Travel trong Snowflake là gì? Khi nào dùng?"**
> Khả năng query data ở bất kỳ thời điểm nào trong quá khứ (0-90 ngày). Dùng khi: 1) Rollback sau khi accidentally xóa/corrupt data, 2) Audit - xem data trông như thế nào tại thời điểm cụ thể, 3) Compare current vs historical data, 4) Reproduce ML experiment với data tại lúc training.

**Q5: "Giải thích Snowflake Virtual Warehouse."**
> Virtual Warehouse = compute cluster (T-shirt sizes: X-Small đến X-Large và hơn). Bạn có thể: 1) Tạo nhiều warehouses riêng (ETL vs BI vs DS), 2) Auto-suspend khi idle (tiết kiệm), 3) Auto-resume khi có query, 4) Scale up/down bằng cách đổi size. Billing: Theo credit-hours khi warehouse đang chạy.

**Q6: "BigQuery partitioning và clustering khác nhau thế nào?"**
> Partitioning: Chia table thành nhiều physical parts theo giá trị cột (thường date). Query với partition filter → skip entire partitions → giảm bytes scanned → giảm cost đáng kể. Clustering: Sort data trong partition theo 1-4 columns. Block pruning trong query → skip blocks không match. Dùng cả hai: Partition by date + Cluster by country, status.

---

## Tài liệu tham khảo

- [Snowflake Documentation](https://docs.snowflake.com/)
- [BigQuery Documentation](https://cloud.google.com/bigquery/docs)
- [Amazon Redshift Documentation](https://docs.aws.amazon.com/redshift/)
- [Snowflake vs BigQuery Comparison - Fivetran Blog](https://www.fivetran.com/learn/snowflake-vs-bigquery)
