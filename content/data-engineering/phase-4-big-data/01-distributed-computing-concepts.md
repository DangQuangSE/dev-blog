# Distributed Computing Concepts cho Data Engineer

## Giới thiệu

Trước khi đi sâu vào Spark hay Kafka, bạn cần hiểu các khái niệm nền tảng của distributed computing. Với BE background, bạn có thể đã quen với horizontal scaling của web servers — distributed computing trong DE mang những khái niệm tương tự nhưng áp dụng cho data processing.

---

## 1. Tại sao cần Distributed Computing?

### Giới hạn của Single Machine

```
Dataset: 10TB logs cần xử lý
Máy tốt nhất: 256GB RAM, 64 cores

Vấn đề:
- 10TB không fit vào 256GB RAM → không thể load toàn bộ
- Với 64 cores: xử lý 1GB/giây → cần ~10,000 giây (~3 giờ)
- Disk I/O: giới hạn bởi bandwidth của 1 disk
```

**Giải pháp Distributed Computing**:
```
10 máy × 32 cores × 100GB RAM:
- 1TB data per máy → fit vào memory
- 320 cores song song → 10x nhanh hơn
- Distributed I/O → 10x bandwidth
→ Từ 3 giờ → ~18 phút
```

---

## 2. Các mô hình xử lý phân tán

### MapReduce - Mô hình gốc

```
Input Data → [MAP Phase] → [Shuffle & Sort] → [REDUCE Phase] → Output
```

**Map**: Mỗi worker xử lý 1 chunk của data, output key-value pairs
**Shuffle**: Group tất cả values của cùng key về cùng 1 reducer
**Reduce**: Aggregate values của mỗi key

```python
# Conceptual MapReduce - Word Count

# INPUT: "hello world hello data"

# MAP (parallel trên nhiều máy):
# "hello" → ("hello", 1)
# "world" → ("world", 1)
# "hello" → ("hello", 1)
# "data" → ("data", 1)

# SHUFFLE: Group by key:
# "hello" → [1, 1]
# "world" → [1]
# "data" → [1]

# REDUCE:
# "hello" → sum([1, 1]) = 2
# "world" → sum([1]) = 1
# "data" → sum([1]) = 1

# OUTPUT: {hello: 2, world: 1, data: 1}
```

---

## 3. Partitioning và Sharding

### Data Partitioning

> **Partitioning** = chia data thành nhiều phần để xử lý song song

Trong Spark:
```python
# Hash partitioning (mặc định): key % num_partitions
df.repartition(100, "user_id")  # user_id xác định partition

# Range partitioning: theo range của giá trị
df.repartitionByRange(100, "created_at")  # Chronological distribution

# Custom partitioning
df.write.partitionBy("year", "month", "day").parquet(path)
# → Tạo directory structure: /year=2024/month=01/day=15/
```

### Database Sharding

> **Sharding** = horizontal partitioning của database

```
Bảng orders (1 tỷ rows)

Shard 1: orders với user_id 0-9,999,999
Shard 2: orders với user_id 10,000,000-19,999,999
...
Shard 10: orders với user_id 90,000,000-99,999,999
```

**Sharding strategies**:
- **Hash sharding**: `shard = hash(key) % num_shards` — đều hơn
- **Range sharding**: Theo range của key — dễ scan range
- **Directory sharding**: Lookup table quyết định shard

---

## 4. Replication và Fault Tolerance

### Tại sao cần Replication?

```
Cluster 100 máy:
- Xác suất 1 máy fail trong 1 ngày: 0.1%
- Xác suất ÍT NHẤT 1 máy fail: 1 - (0.999)^100 ≈ 9.5%

→ Trong cluster lớn, failure là BÌNH THƯỜNG, không phải exception!
```

### Replication trong Kafka

```
Topic: order-events, Partitions: 3, Replication Factor: 3

Broker 1 (Leader P0): [Partition 0] ← Writes go here
Broker 2 (Leader P1): [Partition 1]
Broker 3 (Leader P2): [Partition 2]

Broker 1 (Follower P1, P2): [Replica of P1] [Replica of P2]
Broker 2 (Follower P0, P2): [Replica of P0] [Replica of P2]
Broker 3 (Follower P0, P1): [Replica of P0] [Replica of P1]

Nếu Broker 2 fail:
→ P1 Leader election: Broker 1 hoặc 3 trở thành Leader P1
→ Không mất data (replication đã có replica)
→ Không downtime (automatic failover)
```

### Replication trong HDFS / Distributed File System

```
File: big_data.parquet (1GB)
Split thành blocks: 128MB/block → 8 blocks
Replication factor: 3

Block 1: Node 1 (primary), Node 3 (replica), Node 7 (replica)
Block 2: Node 2 (primary), Node 5 (replica), Node 8 (replica)
...

Nếu Node 1 fail:
→ Block 1 đọc từ Node 3 (transparent với user)
→ HDFS tự rebalance: tạo replica mới trên Node 9
```

---

## 5. CAP Theorem - Hiểu để design đúng

> **CAP Theorem**: Trong distributed system, bạn chỉ có thể đảm bảo đồng thời **2 trong 3** tính chất:
> - **C**onsistency: Mọi node đều thấy cùng data tại cùng thời điểm
> - **A**vailability: Mọi request đều nhận được response (không lỗi)
> - **P**artition tolerance: System hoạt động dù có network partition

```
Network Partition xảy ra (bắt buộc phải chọn C hoặc A):

Node A ─ x ─ Node B     (x = network cut)

Nếu chọn Consistency: 
→ Node A từ chối serve request (để tránh stale data)
→ System unavailable → CP system (e.g., HBase, Zookeeper)

Nếu chọn Availability:
→ Node A và B đều serve request, có thể return stale data
→ Eventually consistent → AP system (e.g., Cassandra, DynamoDB)
```

**Trong DE thực tế:**
- **Kafka**: CP — partition tolerance + consistency (replica sync)
- **Cassandra**: AP — tunable consistency
- **BigQuery**: CA (không thực sự distributed trong traditional sense)

---

## 6. Data Serialization

### Tại sao Serialization quan trọng?

Trong distributed system, data phải được gửi qua network. Format serialization ảnh hưởng lớn đến:
- Size: Ít bytes = network faster
- Speed: Nhanh serialize/deserialize
- Schema evolution: Có thể thêm field mà không break

```python
import json
import pickle
import struct

sample_data = {"user_id": 12345, "amount": 99.99, "status": "completed"}

# JSON - Human readable, nhưng to và chậm
json_bytes = json.dumps(sample_data).encode()  # 50 bytes

# Pickle (Python) - Nhỏ hơn nhưng chỉ Python, không safe
pickle_bytes = pickle.dumps(sample_data)  # 84 bytes

# Avro/Protobuf/Thrift - Compact binary, schema-based, cross-language
# avro_bytes ≈ 15-20 bytes với schema reuse
```

### Các format phổ biến trong DE

| Format | Size | Speed | Schema | Human-readable | Cross-language |
|--------|------|-------|--------|----------------|----------------|
| **JSON** | Lớn | Chậm | Không | ✅ | ✅ |
| **CSV** | Lớn | Chậm | Không | ✅ | ✅ |
| **Parquet** | Rất nhỏ | Nhanh (columnar) | Có | ❌ | ✅ |
| **Avro** | Nhỏ | Nhanh | Có | ❌ | ✅ |
| **Protobuf** | Rất nhỏ | Rất nhanh | Có | ❌ | ✅ |

### Schema Registry - Quản lý schemas

Trong Kafka ecosystem, **Confluent Schema Registry** quản lý Avro/Protobuf schemas:

```
Producer → [Schema Registry] → Kafka Topic → Consumer
             Validate schema    (schema ID embedded)   Look up schema
             
Lợi ích:
- Producer và Consumer đồng ý về schema
- Schema evolution được validate (backward/forward compatible)
- Không embed full schema trong mỗi message (chỉ schema ID)
```

---

## 7. Consistency Models

### Eventual Consistency

```
Timeline: User updates profile picture

t=0: User uploads photo → Write to Node 1
t=1: Node 1 → Replicating to Node 2, 3
t=2: Another user reads → Hits Node 2 → Thấy ảnh cũ (stale!)
t=5: Replication complete → Node 2 cũng có ảnh mới
t=6+: Everyone sees new photo

→ Eventually consistent: Data đúng CUỐI CÙNG, nhưng có period stale
→ Chấp nhận được cho: social media, product catalog
→ KHÔNG chấp nhận được cho: bank transaction
```

### Strong Consistency

```
Timeline: Bank transfer

t=0: Transfer $100 từ A → B
t=1: A's balance: -$100, B's balance: +$100 (ATOMIC)
t=2: Any read from ANY node → Thấy đúng balance mới

→ Strong consistency: Tất cả đều thấy update ngay lập tức
→ Cần cho: financial systems, inventory
→ Cost: Higher latency (must sync all replicas before ack)
```

---

## 8. Checkpointing và Fault Recovery

### Vấn đề khi không có Checkpoint

```
Job xử lý 1TB data, chạy 3 giờ
Ở giờ thứ 2.5: 1 node fail
→ Không có checkpoint → phải chạy lại từ đầu (3 giờ nữa)!
```

### Checkpoint trong Spark Streaming

```python
from pyspark.sql import SparkSession

spark = SparkSession.builder.getOrCreate()

# Spark Structured Streaming với checkpoint
query = df \
    .writeStream \
    .option("checkpointLocation", "s3://checkpoint/my-stream/") \
    .outputMode("append") \
    .format("parquet") \
    .trigger(processingTime="1 minute") \
    .start("s3://output/")

# Nếu job fail và restart:
# → Đọc checkpoint để biết đã xử lý đến đâu
# → Resume từ đó (không reprocess data đã xong)
```

---

## 9. Rủi ro khi không hiểu Distributed Concepts

- **Data skew**: Nhiều data trên 1 partition → 1 node bị overload trong khi các node khác idle
- **Naively assuming order**: "Messages trong Kafka có order" — chỉ đúng TRONG 1 partition, không across partitions
- **Network overhead**: Shuffle quá nhiều data across network → bottleneck không phải compute
- **Single point of failure**: Quên replication → 1 node fail = toàn bộ hệ thống down

---

## 10. Interview Q&A

**Q1: "Giải thích CAP Theorem và ảnh hưởng đến DE."**
> CAP: Chỉ có thể đảm bảo 2 trong 3: Consistency, Availability, Partition Tolerance. Vì network partition không thể tránh trong distributed system, thực tế là chọn CP hoặc AP. DE implication: Khi thiết kế pipeline, biết khi nào chấp nhận eventual consistency (analytics thường OK) vs cần strong consistency (financial data).

**Q2: "Sharding và Partitioning khác nhau thế nào?"**
> Partitioning: Chia data thành chunks để xử lý song song (trong Spark, files). Sharding: Horizontal partitioning của database để scale writes. Overlapping concept nhưng context khác: Partitioning thường dùng trong batch processing context; Sharding trong database scaling context.

**Q3: "MapReduce hoạt động như thế nào?"**
> 3 phases: Map (mỗi worker xử lý chunk của data, output key-value pairs), Shuffle (group tất cả values của cùng key về 1 reducer — đây là expensive step), Reduce (aggregate values per key). Spark cải thiện bằng cách giảm write-to-disk giữa các stages.

**Q4: "Fault tolerance trong Spark hoạt động thế nào?"**
> Spark track lineage của mỗi RDD/DataFrame — biết cách recompute nó từ input. Nếu 1 node fail và mất partition, Spark recompute partition đó từ lineage (thay vì checkpoint toàn bộ). Với streaming: checkpoint state + replay từ Kafka offset.

**Q5: "Data skew là gì? Cách xử lý?"**
> Skew = 1 số partitions có nhiều data hơn các partition khác. Symptom: 99% tasks finish trong 2 phút, 1% task chạy 30 phút (straggler). Cause: Skewed join key (nhiều NULLs, popular keys). Fix: 1) Broadcast join nếu 1 bảng nhỏ, 2) Salting (add random prefix để chia nhỏ hot key), 3) Adaptive Query Execution (Spark 3.0+).

**Q6: "Giải thích serialization và tại sao Parquet tốt hơn CSV."**
> Parquet: Binary columnar format. Lợi ích: 1) Columnar → chỉ đọc cột cần thiết (analytics access pattern), 2) Dictionary encoding + RLE compression → nhỏ hơn CSV 5-10x, 3) Schema embedded → không bị "all strings" như CSV, 4) Predicate pushdown → skip blocks không match filter mà không đọc.

---

## Tài liệu tham khảo

- "Designing Data-Intensive Applications" - Martin Kleppmann (bắt buộc phải đọc!)
- [The Log: What every software engineer should know about real-time data's unifying abstraction - Jay Kreps](https://engineering.linkedin.com/distributed-systems/log-what-every-software-engineer-should-know-about-real-time-datas-unifying)
- [Google MapReduce Paper (2004)](https://static.googleusercontent.com/media/research.google.com/en//archive/mapreduce-osdi04.pdf)
