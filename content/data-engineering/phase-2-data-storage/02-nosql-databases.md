# [06] Phase 2 - Data Storage: NoSQL Databases cho Data Engineer

## Giới thiệu

Là Backend Engineer, bạn đã biết SQL databases (MySQL, PostgreSQL). NoSQL không phải để "thay thế" SQL, mà để giải quyết những use cases mà SQL không tối ưu. Với DE, việc biết **khi nào** và **tại sao** dùng từng loại NoSQL quan trọng hơn là biết syntax.

---

## 1. Tại sao NoSQL ra đời?

### Giới hạn của RDBMS ở scale lớn

```
Facebook năm 2008: 100 triệu users
Instagram năm 2012: 10 triệu photos/ngày

Vấn đề với MySQL ở scale này:
1. Schema changes: ALTER TABLE với 100M rows = downtime nhiều giờ
2. Horizontal scaling: MySQL khó shard, phải manual sharding phức tạp
3. Flexible data model: User profile có thousands of custom fields → không thể design schema trước
4. High write throughput: Millions of writes/second vượt quá RDBMS capacity
```

### NoSQL = Not Only SQL

Năm 2009-2010, nhiều tech companies release NoSQL solutions:
- Amazon: **DynamoDB** (2007 internal, 2012 public)
- Google: **BigTable** (2004 internal) → **Cloud Datastore** (public)
- Facebook: **Cassandra** (2008)
- MongoDB: **MongoDB** (2009)

---

## 2. Bốn loại NoSQL chính

```
NoSQL Databases
│
├── Document DB (MongoDB, Couchbase, Firestore)
│   └── Store: JSON documents
│   └── Use case: Content management, user profiles, catalogs
│
├── Key-Value (Redis, DynamoDB, Memcached)
│   └── Store: Key → Value (any type)
│   └── Use case: Caching, session, leaderboards, counters
│
├── Column-Family (Cassandra, HBase, BigTable)
│   └── Store: Rows với dynamic columns, sorted
│   └── Use case: Time series, IoT, write-heavy workloads
│
└── Graph (Neo4j, Amazon Neptune, TigerGraph)
    └── Store: Nodes và Edges
    └── Use case: Social networks, fraud detection, recommendation
```

---

## 3. MongoDB - Document Database

### Khi nào dùng MongoDB?

```
✅ Data có structure flexible, thay đổi thường xuyên
✅ Nested/hierarchical data (documents)
✅ Cần query bằng nhiều fields khác nhau (không phải key-value lookup)
✅ Prototype nhanh khi chưa biết schema
✅ Content management, product catalog

❌ Cần ACID transactions phức tạp (multi-document)
❌ Heavy relational data với nhiều JOINs
❌ Data analytics/aggregation phức tạp (→ dùng DWH)
```

### MongoDB trong DE Context

```python
from pymongo import MongoClient
import pandas as pd
from datetime import datetime

client = MongoClient('mongodb://localhost:27017/')
db = client['ecommerce']
collection = db['products']

# === INGESTION: Read từ MongoDB vào Data Pipeline ===
def extract_products_since(last_run_time: datetime) -> list:
    """
    Kéo products mới/updated kể từ lần chạy trước.
    Đây là incremental load cho MongoDB source.
    """
    cursor = collection.find({
        'updated_at': {'$gte': last_run_time}
    }).sort('updated_at', 1)
    
    return list(cursor)

# Convert MongoDB documents sang DataFrame
def documents_to_df(docs: list) -> pd.DataFrame:
    rows = []
    for doc in docs:
        # Flatten nested structure
        row = {
            'product_id': str(doc['_id']),
            'name': doc['name'],
            'price': doc['price'],
            'category': doc.get('category', {}).get('name'),
            'brand': doc.get('brand'),
            
            # Flatten nested attributes (variant không cố định)
            'color': doc.get('attributes', {}).get('color'),
            'size': doc.get('attributes', {}).get('size'),
            'weight_kg': doc.get('attributes', {}).get('weight_kg'),
            
            # Arrays → store as string (denormalize cho analytics)
            'tags': ','.join(doc.get('tags', [])),
            
            'updated_at': doc.get('updated_at'),
            'created_at': doc.get('created_at'),
        }
        rows.append(row)
    
    return pd.DataFrame(rows)

# === AGGREGATION PIPELINE (MongoDB native analytics) ===
pipeline = [
    # Filter
    {'$match': {'status': 'active', 'price': {'$gte': 10}}},
    
    # Group by category
    {'$group': {
        '_id': '$category.name',
        'total_products': {'$sum': 1},
        'avg_price': {'$avg': '$price'},
        'min_price': {'$min': '$price'},
        'max_price': {'$max': '$price'},
    }},
    
    # Sort
    {'$sort': {'total_products': -1}},
    
    # Limit
    {'$limit': 20}
]

results = list(collection.aggregate(pipeline))
```

---

## 4. Redis - Key-Value và In-Memory Cache

### Redis trong DE

Redis không phải data store chính trong DE, nhưng có vai trò quan trọng:

```
1. Pipeline coordination: Lưu watermark, last_run_time
2. Deduplication: Track processed message IDs
3. Rate limiting: Throttle API calls trong ingestion
4. Feature Store: Real-time ML features (sub-millisecond lookup)
5. Pub/Sub: Real-time notifications giữa pipeline stages
```

```python
import redis
from datetime import datetime
import json

r = redis.Redis(host='localhost', port=6379, db=0)

# === PIPELINE STATE MANAGEMENT ===
def get_last_run_time(pipeline_name: str) -> datetime:
    """Lấy thời điểm pipeline chạy lần trước"""
    value = r.get(f"pipeline:{pipeline_name}:last_run")
    if value:
        return datetime.fromisoformat(value.decode())
    return datetime(2020, 1, 1)  # Default: start from 2020

def set_last_run_time(pipeline_name: str, run_time: datetime):
    """Lưu thời điểm pipeline vừa chạy xong"""
    r.set(
        f"pipeline:{pipeline_name}:last_run",
        run_time.isoformat(),
        ex=86400 * 30  # Expire sau 30 ngày
    )

# === DEDUPLICATION ===
def is_already_processed(message_id: str, pipeline: str) -> bool:
    """Kiểm tra xem message đã được xử lý chưa (tránh duplicate)"""
    key = f"processed:{pipeline}:{message_id}"
    return r.exists(key) > 0

def mark_as_processed(message_id: str, pipeline: str, ttl_hours: int = 24):
    """Đánh dấu message đã xử lý"""
    key = f"processed:{pipeline}:{message_id}"
    r.set(key, "1", ex=ttl_hours * 3600)

# === FEATURE STORE (Real-time ML) ===
def update_user_features(user_id: str, features: dict):
    """Update user features cho ML model"""
    r.hset(
        f"user_features:{user_id}",
        mapping={
            'avg_order_value': features['avg_order_value'],
            'days_since_last_order': features['days_since_last_order'],
            'total_orders': features['total_orders'],
            'preferred_category': features['preferred_category'],
            'updated_at': datetime.now().isoformat()
        }
    )
    r.expire(f"user_features:{user_id}", 86400)  # TTL 24h

def get_user_features(user_id: str) -> dict:
    """Lấy features nhanh (< 1ms)"""
    data = r.hgetall(f"user_features:{user_id}")
    return {k.decode(): v.decode() for k, v in data.items()}

# === SORTED SET: Leaderboard / Ranking ===
def update_product_ranking(product_id: str, score: float):
    """Update product ranking theo revenue score"""
    r.zadd('product_rankings', {product_id: score})

def get_top_products(limit: int = 10) -> list:
    """Lấy top N products"""
    return r.zrevrange('product_rankings', 0, limit - 1, withscores=True)
```

---

## 5. Cassandra - Column-Family cho Time Series

### Tại sao Cassandra cho Time Series?

```
Use case: 1 tỷ IoT sensors, mỗi sensor gửi data mỗi giây

Với PostgreSQL:
- 1 tỷ × 86400 seconds/day = 86.4 trillion rows/day
- INSERT rate: ~1M rows/second (single node limit)
- Query: SELECT avg(temp) WHERE sensor_id = 'S001' AND time BETWEEN ...
         → Full table scan hoặc index không scale

Với Cassandra:
- Write: 1M writes/second per node, linear scale (add more nodes!)
- Data model theo query pattern → O(1) reads
- Tunable consistency
- No single point of failure (masterless)
```

### Cassandra Data Modeling

```python
from cassandra.cluster import Cluster
from cassandra.query import SimpleStatement
from datetime import datetime

cluster = Cluster(['cassandra-host'])
session = cluster.connect('iot_data')

# Cassandra schema design - QUERY FIRST approach!
# Không normalize như RDBMS, design theo query pattern

# Query: "Lấy readings của sensor X trong khoảng thời gian Y-Z"
CREATE_TABLE = """
CREATE TABLE IF NOT EXISTS sensor_readings (
    sensor_id    TEXT,
    bucket       TEXT,        -- Partition theo bucket (2024-01-15) để tránh partition quá lớn
    reading_time TIMESTAMP,
    temperature  FLOAT,
    humidity     FLOAT,
    pressure     FLOAT,
    
    PRIMARY KEY ((sensor_id, bucket), reading_time)  -- Composite partition key!
) WITH CLUSTERING ORDER BY (reading_time DESC)       -- Mới nhất đầu tiên
  AND compaction = {'class': 'TimeWindowCompactionStrategy', 
                    'compaction_window_unit': 'DAYS',
                    'compaction_window_size': 1};
"""

# Write (extremely fast!)
def write_sensor_reading(sensor_id: str, timestamp: datetime, 
                          temperature: float, humidity: float):
    bucket = timestamp.strftime('%Y-%m-%d')  # Daily bucket
    session.execute("""
        INSERT INTO sensor_readings 
        (sensor_id, bucket, reading_time, temperature, humidity)
        VALUES (%s, %s, %s, %s, %s)
        USING TTL 7776000   -- 90 days TTL
    """, (sensor_id, bucket, timestamp, temperature, humidity))

# Read (fast because of partition key)
def get_sensor_readings(sensor_id: str, date: str, limit: int = 1000):
    return list(session.execute("""
        SELECT * FROM sensor_readings
        WHERE sensor_id = %s AND bucket = %s
        LIMIT %s
    """, (sensor_id, date, limit)))
```

### DE dùng Cassandra như thế nào?

```python
# Cassandra thường là SOURCE, không phải destination trong DE
# Pipeline: Cassandra → Spark → Data Warehouse

from pyspark.sql import SparkSession

spark = SparkSession.builder \
    .config("spark.cassandra.connection.host", "cassandra-host") \
    .getOrCreate()

# Read từ Cassandra vào Spark
df = spark.read \
    .format("org.apache.spark.sql.cassandra") \
    .options(table="sensor_readings", keyspace="iot_data") \
    .load() \
    .filter("bucket = '2024-01-15'")  # Pushdown filter!

# Aggregate và write sang DWH
summary = df.groupBy("sensor_id").agg(
    F.avg("temperature").alias("avg_temp"),
    F.max("temperature").alias("max_temp"),
    F.count("*").alias("reading_count")
)

summary.write.parquet("s3://bucket/iot-summary/date=2024-01-15/")
```

---

## 6. Khi nào dùng NoSQL gì?

### Decision Tree

```
Data của bạn là gì?

Relationship data (social graph, fraud network)?
→ Graph DB (Neo4j, Amazon Neptune)

Time series (metrics, IoT, events)?
→ Cassandra, InfluxDB, TimescaleDB

Cần cache nhanh (sub-millisecond, ephemeral)?
→ Redis, Memcached

Document data (products, blogs, flexible schema)?
→ MongoDB, Firestore, Couchbase

Large scale, key-value lookups?
→ DynamoDB, Cassandra

Analytics, reporting, aggregations?
→ Đừng dùng NoSQL! → Data Warehouse (BigQuery, Snowflake)
```

---

## 7. NoSQL trong DE Architecture

```
Source systems (NoSQL) → Data Pipeline → Analytics
│
├── MongoDB (product catalog)  → Spark → BigQuery
├── Cassandra (IoT events)    → Spark → BigQuery
├── DynamoDB (user sessions)  → Lambda → Kinesis → S3 → BigQuery
└── Redis (real-time features)← Spark Streaming ← Kafka
```

---

## 8. Rủi ro khi dùng NoSQL sai

- **MongoDB cho financial transactions**: MongoDB mặc định eventual consistency → không dùng cho banking
- **Cassandra full table scan**: Cassandra không có secondary index hiệu quả → query không có partition key = full scan = extremely slow
- **Redis persistence**: Redis mặc định in-memory, data mất khi restart nếu không configure persistence
- **Dùng NoSQL cho analytics**: NoSQL không tối ưu cho aggregation → dùng DWH thay vì query MongoDB cho reports

---

## 9. Interview Q&A

**Q1: "NoSQL là gì? Tại sao cần NoSQL khi đã có SQL?"**
> NoSQL = Not Only SQL, không phải thay thế SQL mà bổ sung. SQL tốt cho ACID transactions, complex joins, normalized data. NoSQL tốt cho: scale horizontal (MongoDB, Cassandra), flexible schema (MongoDB), high write throughput (Cassandra), low-latency lookup (Redis), graph traversal (Neo4j). Chọn dựa trên use case, không phải trend.

**Q2: "Sự khác biệt giữa Document DB và Key-Value DB?"**
> Key-Value (Redis, DynamoDB): Chỉ lookup theo key, value là opaque blob. Cực nhanh, simple. Document DB (MongoDB): Value là structured document (JSON). Có thể query bất kỳ field nào, hỗ trợ nested structures, secondary indexes, aggregation. Document DB = Key-Value với query power.

**Q3: "Tại sao Cassandra tốt cho time series?"**
> Cassandra data model: Partition key xác định node chứa data. Clustering key xác định order trong partition. Thiết kế cho time series: Partition by (sensor_id, date) → tất cả data của 1 sensor trong 1 ngày ở cùng node → reads cực nhanh. Write: append-only log structure → cực nhanh. Linear scale: thêm node → tăng capacity + throughput.

**Q4: "Khi nào không nên dùng Redis?"**
> 1) Data lớn hơn RAM (Redis là in-memory), 2) Cần ACID transactions phức tạp, 3) Cần data persistence mạnh (Redis có thể mất data khi crash nếu không configure), 4) Complex queries (Redis chỉ tốt cho simple key lookups và data structures). Đừng dùng Redis như relational database.

**Q5: "MongoDB Atlas và self-hosted MongoDB khác nhau gì? DE quan tâm không?"**
> Atlas = managed MongoDB trên cloud (AWS/GCP/Azure). Self-hosted = bạn manage. DE quan tâm vì: Atlas có Change Streams (CDC) tốt hơn, có Atlas Search, Atlas Data Lake (query trực tiếp S3 data). Với source system dùng MongoDB, biết nó là Atlas hay self-hosted ảnh hưởng đến ingestion strategy.

---

## Tài liệu tham khảo

- [MongoDB Documentation](https://docs.mongodb.com/)
- [Redis Documentation](https://redis.io/docs/)
- [Apache Cassandra Documentation](https://cassandra.apache.org/doc/)
- "NoSQL Distilled" - Martin Fowler & Pramod Sadalage
