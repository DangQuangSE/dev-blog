# Apache Spark: Distributed Data Processing

## Giới thiệu

Apache Spark là công cụ xử lý dữ liệu phân tán mạnh nhất hiện nay. Nếu bạn cần xử lý dữ liệu vượt quá RAM của một máy tính (từ hàng chục GB đến petabyte), Spark chính là câu trả lời. Với BE background, khái niệm distributed computing sẽ mới, nhưng tư duy về transformation sẽ rất quen thuộc.

---

## 1. Nguồn gốc: Tại sao Spark ra đời?

### Hạn chế của Hadoop MapReduce

Năm 2004, Google công bố paper về **MapReduce** và Hadoop implement nó. Năm 2006, Yahoo! open-source Hadoop. Đây là breakthrough lớn — xử lý data petabyte trên cluster hàng nghìn máy.

**Nhưng MapReduce có vấn đề nghiêm trọng**:

```
MapReduce Pipeline:
Map → Write to Disk → Shuffle → Write to Disk → Reduce → Write to Disk

Với 10 bước transform:
Read → Write → Read → Write → Read → Write → ... (10 lần đọc/ghi disk!)
```

- **Mỗi bước phải write ra disk** → I/O bottleneck khủng khiếp
- **Không có in-memory computation** → chậm 10-100x so với Spark
- **Không hỗ trợ interactive** — không thể query nhanh, phải submit job và chờ

### Spark ra đời (2009, UC Berkeley AMPLab)

Matei Zaharia viết Spark thesis với ý tưởng: **"Tại sao không giữ data trong memory giữa các bước?"**

```
Spark Pipeline:
Read → [In-Memory RDD] → Transform → [In-Memory RDD] → Transform → Write

→ Chỉ read từ disk 1 lần, write 1 lần cuối
→ Nhanh hơn MapReduce 100x với in-memory data
→ 10x với disk-based workload
```

Năm 2013, Databricks thành lập (founders là Spark creators). Năm 2014, Apache Spark 1.0 release.

---

## 2. Kiến trúc Spark

```
┌─────────────────────────────────────────────────────────────┐
│                         Spark Cluster                        │
│                                                             │
│  ┌──────────────────────────────────────────────┐          │
│  │              Driver Program                   │          │
│  │   (Your Python/Scala/Java code)              │          │
│  │   SparkContext / SparkSession                │          │
│  └───────────────────────┬──────────────────────┘          │
│                          │ Task distribution                │
│          ┌───────────────┼───────────────┐                  │
│          │               │               │                  │
│  ┌───────▼──┐    ┌───────▼──┐    ┌───────▼──┐             │
│  │ Executor 1│    │ Executor 2│    │ Executor 3│            │
│  │ (Worker)  │    │ (Worker)  │    │ (Worker)  │            │
│  │ Core: 4   │    │ Core: 4   │    │ Core: 4   │            │
│  │ RAM: 16GB │    │ RAM: 16GB │    │ RAM: 16GB │            │
│  └───────────┘    └───────────┘    └───────────┘            │
└─────────────────────────────────────────────────────────────┘
```

**Driver**: Nơi code của bạn chạy. Tạo SparkSession, define transformations, collect results.

**Executor**: Workers thực sự xử lý data. Nhiều Executors = nhiều parallel processing.

**SparkSession**: Entry point cho mọi thứ trong Spark.

---

## 3. RDD, DataFrame và Dataset

### Spark có 3 abstraction levels:

```
RDD (2009) → DataFrame (2013) → Dataset (2015, Scala/Java only)
   Low level     High level         Typed high level
   Flexible      Optimized          Type-safe + Optimized
```

### RDD - Resilient Distributed Dataset

RDD là abstraction cấp thấp nhất:

```python
from pyspark import SparkContext

sc = SparkContext()

# Tạo RDD từ list
data = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
rdd = sc.parallelize(data, numSlices=4)  # Chia thành 4 partitions

# Transformations (lazy - chưa thực thi)
squared = rdd.map(lambda x: x ** 2)
filtered = squared.filter(lambda x: x > 10)

# Actions (trigger execution)
result = filtered.collect()    # [16, 25, 36, 49, 64, 81, 100]
total = filtered.sum()         # 471

# Đọc từ file
text_rdd = sc.textFile("s3://bucket/logs/*.log")
word_count = text_rdd \
    .flatMap(lambda line: line.split(" ")) \
    .map(lambda word: (word, 1)) \
    .reduceByKey(lambda a, b: a + b)
```

### DataFrame - Cách hiện đại (dùng cái này!)

```python
from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import *

spark = SparkSession.builder \
    .appName("MyDataPipeline") \
    .config("spark.sql.adaptive.enabled", "true") \  # AQE - tự động optimize
    .getOrCreate()

# === ĐỌC DATA ===
# CSV
df = spark.read.csv("s3://bucket/orders/*.csv", header=True, inferSchema=True)

# Parquet (tốt nhất)
df = spark.read.parquet("s3://bucket/orders/")

# JSON
df = spark.read.json("s3://bucket/events/*.jsonl")

# Từ database (JDBC)
df = spark.read \
    .format("jdbc") \
    .option("url", "jdbc:postgresql://host:5432/db") \
    .option("dbtable", "orders") \
    .option("user", "user") \
    .option("password", "pass") \
    .load()

# === TRANSFORMATIONS ===
# Select và rename
df_selected = df.select(
    F.col("order_id"),
    F.col("user_id"),
    F.col("amount").alias("order_amount"),
    F.col("created_at")
)

# Filter
df_completed = df.filter(
    (F.col("status") == "completed") & 
    (F.col("amount") > 0)
)

# Add columns
df_enriched = df \
    .withColumn("amount_usd", F.col("amount") / 25000) \
    .withColumn("order_date", F.to_date(F.col("created_at"))) \
    .withColumn("order_year", F.year(F.col("created_at"))) \
    .withColumn("is_high_value", F.col("amount") > 1000) \
    .withColumn("order_size", 
        F.when(F.col("amount") < 50, "small")
         .when(F.col("amount") < 500, "medium")
         .otherwise("large")
    )

# Aggregation
summary = df_completed \
    .groupBy("order_year", F.month("order_date").alias("month")) \
    .agg(
        F.sum("amount").alias("total_revenue"),
        F.avg("amount").alias("avg_order_value"),
        F.count("*").alias("order_count"),
        F.countDistinct("user_id").alias("unique_customers")
    )

# Joins
users = spark.read.parquet("s3://bucket/users/")
joined = df_completed.join(users, "user_id", "left")

# Window Functions (tương tự SQL)
from pyspark.sql.window import Window

window_spec = Window.partitionBy("user_id").orderBy("created_at")

df_with_rank = df \
    .withColumn("order_rank", F.row_number().over(window_spec)) \
    .withColumn("prev_amount", F.lag("amount", 1).over(window_spec))

# === WRITE ===
df_enriched.write \
    .mode("overwrite") \
    .partitionBy("order_year", "order_month") \  # Partition!
    .parquet("s3://bucket/output/fact_orders/")
```

---

## 4. Lazy Evaluation - Khái niệm quan trọng nhất

```python
# Transformations là LAZY — không thực thi ngay
df = spark.read.parquet("huge_file.parquet")  # Chưa đọc file!
filtered = df.filter(df.status == "completed")  # Chưa filter!
grouped = filtered.groupBy("user_id").sum("amount")  # Chưa group!

# CHỈ khi gặp Action mới thực thi toàn bộ chain
result = grouped.collect()  # Bây giờ Spark mới thực sự chạy!

# Các Actions phổ biến:
df.collect()          # Lấy tất cả data về Driver (cẩn thận với data lớn!)
df.show(20)           # Print 20 rows
df.count()            # Đếm rows
df.write.parquet(...)  # Write ra file
df.first()            # Lấy row đầu tiên
```

**Tại sao Lazy?** → Spark có thể **optimize toàn bộ query plan** trước khi execute. Ví dụ: nếu bạn filter sau join, Spark optimizer có thể tự động pushdown filter trước join (giảm data join).

---

## 5. Partitioning - Chìa khóa Performance

### Partition là gì?

Spark chia data thành nhiều **partitions** (chunks). Mỗi partition được xử lý bởi 1 task trên 1 executor core.

```
DataFrame với 1 tỷ rows, 200 partitions:
→ Mỗi partition: ~5 triệu rows
→ Nếu có 50 cores: xử lý 50 partitions song song
→ 4 rounds cần để xử lý hết
```

### Quá ít partition = Bottleneck

```python
# BAD: 1 partition = 1 core xử lý (không parallel)
df = spark.read.parquet("...")  # 1 file lớn → 1 partition
df.repartition(200)  # Redistribute thành 200 partitions

# Hoặc khi join 2 DataFrame lớn
# Mặc định Spark dùng 200 partitions cho shuffle
spark.conf.set("spark.sql.shuffle.partitions", "400")  # Tăng lên nếu data lớn
```

### Quá nhiều partition = Overhead

```python
# BAD: 1 triệu partitions tiny = overhead lớn hơn là helpful
df.repartition(1_000_000)  # Tệ!

# Rule of thumb: 2-4 partitions per core
# Nếu 50 cores → 100-200 partitions là hợp lý
```

### Partitioning khi Write

```python
# Partition file output theo date cho query efficiency
df.write \
    .partitionBy("year", "month", "day") \
    .parquet("s3://bucket/events/")

# Kết quả:
# s3://bucket/events/year=2024/month=01/day=15/part-00001.parquet
# s3://bucket/events/year=2024/month=01/day=16/part-00001.parquet
# ...

# Query chỉ đọc partition cần thiết
df = spark.read.parquet("s3://bucket/events/")
df.filter("year = 2024 AND month = 1")  # Chỉ đọc year=2024/month=01/
```

---

## 6. Spark SQL - Dùng SQL thay vì DataFrame API

```python
# Đăng ký DataFrame như một SQL table
df.createOrReplaceTempView("orders")
users.createOrReplaceTempView("users")

# Chạy SQL thuần túy
result = spark.sql("""
    SELECT 
        DATE_TRUNC('month', o.order_date) AS month,
        u.country,
        SUM(o.amount) AS total_revenue,
        COUNT(*) AS order_count,
        COUNT(DISTINCT o.user_id) AS unique_customers,
        SUM(o.amount) OVER (
            PARTITION BY u.country 
            ORDER BY DATE_TRUNC('month', o.order_date)
        ) AS running_revenue
    FROM orders o
    JOIN users u ON o.user_id = u.user_id
    WHERE o.status = 'completed'
    GROUP BY 1, 2
    ORDER BY 1, 2
""")
```

---

## 7. Caching và Persistence

```python
# Cache DataFrame trong memory (dùng lại nhiều lần)
from pyspark import StorageLevel

expensive_df = spark.read.parquet("...") \
    .filter(...) \
    .join(...) \
    .cache()  # Lưu trong memory

# Trigger materialization
expensive_df.count()

# Giờ expensive_df.join(something) sẽ không recompute!
result1 = expensive_df.groupBy("country").sum("amount")
result2 = expensive_df.filter("is_high_value = true")

# Xóa cache khi không cần
expensive_df.unpersist()

# Các storage level khác:
expensive_df.persist(StorageLevel.MEMORY_AND_DISK)  # Spill to disk nếu memory đầy
expensive_df.persist(StorageLevel.DISK_ONLY)          # Chỉ lưu disk
```

---

## 8. Common Spark Optimizations

```python
# 1. Broadcast Join (khi 1 bảng nhỏ)
from pyspark.sql.functions import broadcast

# Nếu users table nhỏ (<= 10MB) → broadcast lên tất cả workers
result = orders.join(broadcast(users), "user_id")
# Tránh shuffle expensive cho join!

# 2. Avoid collect() với data lớn
df.collect()  # BAD: Load toàn bộ về Driver memory
df.show(100)  # GOOD: Chỉ lấy 100 rows

# 3. Predicate Pushdown
df.filter("year = 2024").read.parquet("...")  # GOOD: Filter trước khi đọc

# 4. Select chỉ cột cần thiết
df.select("order_id", "amount")  # GOOD: Columnar - chỉ đọc 2 cột

# 5. Adaptive Query Execution (Spark 3.0+)
spark.conf.set("spark.sql.adaptive.enabled", "true")
spark.conf.set("spark.sql.adaptive.coalescePartitions.enabled", "true")
# Spark tự động điều chỉnh số partition tối ưu
```

---

## 9. PySpark trong Thực tế

```python
# Template cho PySpark ETL job

from pyspark.sql import SparkSession
from pyspark.sql import functions as F
from pyspark.sql.types import StructType, StructField, StringType, LongType, DoubleType
import logging

logger = logging.getLogger(__name__)

def create_spark_session(app_name: str) -> SparkSession:
    return SparkSession.builder \
        .appName(app_name) \
        .config("spark.sql.adaptive.enabled", "true") \
        .config("spark.sql.shuffle.partitions", "200") \
        .getOrCreate()

def extract(spark: SparkSession, path: str, date: str):
    logger.info(f"Extracting data for {date}")
    return spark.read \
        .parquet(path) \
        .filter(F.col("partition_date") == date)

def transform(df):
    logger.info(f"Input rows: {df.count()}")
    
    result = df \
        .filter(F.col("status").isin(["completed", "shipped"])) \
        .withColumn("amount_usd", F.col("amount") / 25000) \
        .withColumn("order_date", F.to_date(F.col("created_at"))) \
        .dropDuplicates(["order_id"])
    
    logger.info(f"Output rows: {result.count()}")
    return result

def load(df, output_path: str, date: str):
    df.write \
        .mode("overwrite") \
        .partitionBy("order_date") \
        .parquet(f"{output_path}/date={date}/")
    logger.info(f"Saved to {output_path}")

def main(date: str):
    spark = create_spark_session("daily_orders_etl")
    
    raw = extract(spark, "s3://raw/orders/", date)
    clean = transform(raw)
    load(clean, "s3://processed/fact_orders/", date)
    
    spark.stop()

if __name__ == "__main__":
    import sys
    main(date=sys.argv[1])
```

---

## 10. Rủi ro khi dùng Spark sai

- **collect() với data lớn**: Driver OOM (Out of Memory) — crash cả cluster
- **Not enough partitions**: 1 task xử lý 100GB = vài giờ, thay vì nhiều tasks song song
- **Too many partitions**: Overhead quản lý > benefit của parallelism
- **Cartesian join**: Join không có condition → row count = A × B → memory blow-up
- **UDF thay vì built-in functions**: UDF (user-defined function) không optimize được, chậm hơn 10-100x

---

## 11. Interview Q&A

**Q1: "Spark khác Hadoop MapReduce như thế nào?"**
> Spark giữ intermediate results trong memory thay vì write ra disk sau mỗi bước → nhanh hơn 10-100x. Spark cũng hỗ trợ: SQL (Spark SQL), ML (MLlib), Streaming (Structured Streaming) trong cùng engine. MapReduce chỉ làm batch processing.

**Q2: "Lazy evaluation trong Spark là gì?"**
> Transformations (map, filter, join...) không thực thi ngay — chúng build DAG (Catalyst Optimizer query plan). Chỉ khi gặp Action (collect, count, write) mới trigger execution. Lợi ích: Optimizer có thể reorder operations, pushdown predicates, fuse stages → tối ưu hơn nếu execute từng bước.

**Q3: "RDD vs DataFrame trong Spark?"**
> RDD: Low-level, strongly typed, no schema, no optimizer. DataFrame: High-level với schema, dùng Catalyst Optimizer → thường nhanh hơn RDD. Trừ khi cần control granular (custom binary serialization, custom partitioning), luôn dùng DataFrame.

**Q4: "Spark Shuffle là gì và tại sao nó expensive?"**
> Shuffle = redistribute data across executors cho operations như groupBy, join, distinct. Data phải được written to disk + sent over network. Chi phí: Network I/O + Disk I/O + Serialization/Deserialization. Giảm shuffle: Broadcast join cho bảng nhỏ, partition data theo join key trước, dùng AQE.

**Q5: "Giải thích Spark executors và partitions."**
> Executor = JVM process chạy trên worker node. Mỗi executor có N cores và M GB RAM. Mỗi core xử lý 1 partition tại 1 thời điểm. Rule: Số partitions nên là 2-4 lần số cores tổng cộng. Partition quá lớn → OOM; partition quá nhỏ → scheduling overhead.

**Q6: "Khi nào cần Spark? Khi nào Pandas đủ?"**
> Pandas: Data fit in memory (< 16-32GB), single machine, prototype. Spark: Data vượt memory, cần scale horizontal, production workload. Đừng over-engineer: Nếu Pandas xử lý được trong 5 phút, không cần Spark.

---

## Tài liệu tham khảo

- [Apache Spark Documentation](https://spark.apache.org/docs/latest/)
- [PySpark Documentation](https://spark.apache.org/docs/latest/api/python/)
- "Learning Spark" - Jules Damji et al. (O'Reilly)
- Databricks Academy (free courses)
