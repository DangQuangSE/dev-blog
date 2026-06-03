# [15] Phase 4 - Big Data: Streaming Data với Apache Kafka

## Giới thiệu

Apache Kafka là hệ thống message streaming phân tán phổ biến nhất trong Data Engineering. Nếu bạn đến từ BE, bạn có thể đã biết RabbitMQ hay Redis Pub/Sub — Kafka là "anh em họ" nhưng được thiết kế đặc biệt cho **high-throughput, durability, và replay** trong môi trường data engineering.

---

## 1. Nguồn gốc: Tại sao Kafka ra đời?

### Vấn đề tại LinkedIn (2010)

LinkedIn có data từ hàng trăm nguồn: user activity, job recommendations, search queries, messages... Họ muốn:
1. **Real-time analytics**: Dashboard update ngay khi user click
2. **Audit log**: Lưu mọi action của user
3. **Event sourcing**: Nhiều service nhận cùng 1 event

**Giải pháp ban đầu**: Point-to-point integration — mỗi service gọi trực tiếp service khác.

```
Activity Service  ──→  Analytics DB
Activity Service  ──→  Recommendation Engine
Activity Service  ──→  Notification Service
Activity Service  ──→  Search Index
```

**Vấn đề**: 
- N × M connections (N producers × M consumers) = complexity explosion
- Nếu Consumer chậm → Producer block
- Không thể replay data nếu Consumer crash

### Kafka ra đời (2011)

Jay Kreps, Neha Narkhede, Jun Rao tạo Kafka tại LinkedIn. Ý tưởng: **Centralized log** làm trung gian.

```
Activity Service  ──→  KAFKA  ──→  Analytics Consumer
Other Services    ──→  KAFKA  ──→  Recommendation Consumer
...               ──→  KAFKA  ──→  Notification Consumer
```

Năm 2011: Open source. 2014: Confluent thành lập. Ngày nay Kafka xử lý **hàng nghìn tỷ messages/ngày** tại các công ty lớn.

---

## 2. Kafka Concepts

### Topic - "Channel" của messages

```
Topic: order-events
├── Partition 0: [msg1, msg2, msg5, msg8, ...]
├── Partition 1: [msg3, msg6, msg9, ...]
└── Partition 2: [msg4, msg7, msg10, ...]
```

**Topic** = category/stream của messages. Giống như một queue, nhưng durable và replayable.

### Partition - Đơn vị parallelism

Mỗi topic được chia thành nhiều **partitions**:
- Mỗi partition là ordered, immutable sequence of messages
- Messages trong 1 partition có order guarantee
- Nhiều partitions = nhiều consumer song song = throughput cao hơn

```python
# Partition key quyết định message vào partition nào
# Cùng key → cùng partition → order guarantee cho key đó

producer.send('order-events', 
    key=b'user_123',       # key
    value=b'{"order_id": "O001", "status": "placed"}'
)

# user_123 luôn vào cùng partition → order events của user_123 được ordered
```

### Producer - Người gửi messages

```python
from kafka import KafkaProducer
import json

producer = KafkaProducer(
    bootstrap_servers=['kafka:9092'],
    value_serializer=lambda v: json.dumps(v).encode('utf-8'),
    key_serializer=lambda k: k.encode('utf-8') if k else None,
    
    # Delivery guarantees
    acks='all',              # Tất cả replicas phải ack → strongest guarantee
    retries=3,
    max_in_flight_requests_per_connection=1  # Đảm bảo order khi retry
)

# Send message (async)
future = producer.send(
    topic='order-events',
    key='user_123',
    value={
        'order_id': 'O001',
        'user_id': 'user_123',
        'amount': 99.99,
        'status': 'placed',
        'timestamp': '2024-01-15T10:30:00Z'
    }
)

# Optional: Wait for ack
try:
    record_metadata = future.get(timeout=10)
    print(f"Sent to partition {record_metadata.partition}, offset {record_metadata.offset}")
except Exception as e:
    print(f"Failed to send: {e}")

producer.flush()  # Flush remaining messages
producer.close()
```

### Consumer và Consumer Group

```python
from kafka import KafkaConsumer

# Consumer Group = nhiều consumer chia nhau các partitions
consumer = KafkaConsumer(
    'order-events',
    bootstrap_servers=['kafka:9092'],
    group_id='analytics-service',     # Consumer Group ID
    value_deserializer=lambda x: json.loads(x.decode('utf-8')),
    key_deserializer=lambda x: x.decode('utf-8') if x else None,
    
    # Offset management
    auto_offset_reset='earliest',    # Nếu no previous offset, đọc từ đầu
    enable_auto_commit=True,          # Auto commit offset
    auto_commit_interval_ms=5000      # Commit mỗi 5 giây
)

# Poll loop
for message in consumer:
    try:
        process_order(message.value)
        # Nếu auto_commit=False: consumer.commit() sau khi process thành công
    except Exception as e:
        logger.error(f"Failed to process message: {e}")
        # Handle error: dead letter queue, retry, skip...

consumer.close()
```

### Consumer Group hoạt động như thế nào?

```
Topic: order-events
├── Partition 0
├── Partition 1
└── Partition 2

Consumer Group A (analytics-service, 3 consumers):
├── Consumer A1 ← Partition 0
├── Consumer A2 ← Partition 1
└── Consumer A3 ← Partition 2

Consumer Group B (notification-service, 2 consumers):
├── Consumer B1 ← Partition 0 + Partition 1
└── Consumer B2 ← Partition 2
```

**Key insight**: 
- Mỗi partition chỉ được đọc bởi **1 consumer trong 1 group** (không bị duplicate trong group)
- Nhiều groups có thể đọc cùng partition độc lập (multicast!)
- Analytics và Notification nhận cùng event — không cần producer gửi 2 lần

---

## 3. Offset - Trái tim của Kafka

```
Partition 0: [msg0] [msg1] [msg2] [msg3] [msg4] [msg5] → new messages...
              ↑                                    ↑
           offset=0                          offset=5 (current)

Consumer committed offset: 3
→ Consumer đã xử lý msg0, msg1, msg2, msg3
→ Nếu Consumer restart, nó tiếp tục từ offset=4 (không mất, không duplicate)
```

### Manual Commit - Exactly-once processing

```python
consumer = KafkaConsumer(
    'order-events',
    enable_auto_commit=False  # Tự manage offset
)

for message in consumer:
    try:
        # Process trước
        result = process_order(message.value)
        save_to_database(result)
        
        # Chỉ commit khi đã xử lý THÀNH CÔNG
        consumer.commit({
            TopicPartition(message.topic, message.partition): 
            OffsetAndMetadata(message.offset + 1)
        })
    except Exception as e:
        # Không commit → lần sau sẽ retry message này
        logger.error(f"Failed, will retry: {e}")
```

---

## 4. Kafka Connect - Ingestion không cần code

**Kafka Connect** là framework để kết nối Kafka với external systems mà không cần viết code:

```json
// Source Connector: Kéo data từ PostgreSQL vào Kafka (CDC)
{
    "name": "postgres-source",
    "config": {
        "connector.class": "io.debezium.connector.postgresql.PostgresConnector",
        "database.hostname": "postgres-host",
        "database.port": "5432",
        "database.user": "debezium",
        "database.password": "password",
        "database.dbname": "production",
        "table.include.list": "public.orders,public.users",
        "topic.prefix": "cdc"
        // → Tạo topics: cdc.public.orders, cdc.public.users
    }
}
```

```json
// Sink Connector: Ghi từ Kafka vào Data Warehouse
{
    "name": "bigquery-sink",
    "config": {
        "connector.class": "com.wepay.kafka.connect.bigquery.BigQuerySinkConnector",
        "topics": "order-events",
        "project": "my-gcp-project",
        "defaultDataset": "kafka_data",
        "keyfile": "/path/to/service-account.json",
        "autoCreateTables": "true"
    }
}
```

---

## 5. Kafka Streams - Stream Processing

```java
// Kafka Streams (Java/Scala) - process data trong Kafka topology
StreamsBuilder builder = new StreamsBuilder();

KStream<String, OrderEvent> orders = builder.stream("order-events");

// Real-time revenue aggregation per minute
KTable<Windowed<String>, Double> revenuePerMinute = orders
    .filter((key, order) -> "completed".equals(order.status))
    .groupBy((key, order) -> order.country)
    .windowedBy(TimeWindows.of(Duration.ofMinutes(1)))
    .aggregate(
        () -> 0.0,
        (country, order, total) -> total + order.amount,
        Materialized.with(Serdes.String(), Serdes.Double())
    );

revenuePerMinute.toStream()
    .to("revenue-per-minute", Produced.with(/* serializers */));
```

---

## 6. Kafka trong DE Architecture

### Pattern 1: Event Sourcing

```
User Action → [Kafka: user-events] → Multiple Consumers:
                                    ├── Analytics Consumer → BigQuery
                                    ├── ML Feature Store Consumer → Redis
                                    ├── Notification Consumer → Push Service
                                    └── Audit Consumer → Cold Storage (S3)
```

### Pattern 2: CDC với Debezium

```
PostgreSQL                     Kafka                    Data Warehouse
(Production DB)  →  Debezium → [cdc.orders topic] → Spark Streaming → BigQuery
                    (CDC)       [cdc.users topic]
```

### Pattern 3: Lambda Architecture với Kafka

```
Web Events → Kafka → Spark Streaming → Redis (real-time view)
           ↓
           S3 (raw) → Spark Batch → BigQuery (historical view)
```

---

## 7. Kafka vs Alternatives

| Tool | Throughput | Retention | Ordering | Use Case |
|------|-----------|-----------|----------|----------|
| **Kafka** | Rất cao (triệu msg/s) | Có (days/weeks) | Per partition | DE pipelines, event sourcing |
| **RabbitMQ** | Cao | Ngắn (sau consume) | Per queue | Task queue, microservices |
| **Redis Pub/Sub** | Rất cao | Không có (fire-and-forget) | Không | Real-time notification |
| **AWS Kinesis** | Cao | 7 ngày (24 hours default) | Per shard | AWS ecosystem |
| **Google Pub/Sub** | Cao | 7 ngày | Không (best effort) | GCP ecosystem |

---

## 8. Kafka Configuration quan trọng

```python
# Producer configs
producer = KafkaProducer(
    acks='all',                         # all replicas ack (strongest)
    # acks=0: fire and forget, acks=1: leader ack only
    
    compression_type='snappy',          # Compress messages (save network)
    batch_size=16384,                   # Batch messages (improve throughput)
    linger_ms=10,                       # Wait 10ms để batch messages
    
    max_request_size=1048576,           # Max message size: 1MB
    buffer_memory=33554432              # 32MB buffer
)

# Consumer configs
consumer = KafkaConsumer(
    max_poll_records=500,               # Max records per poll
    max_poll_interval_ms=300000,        # 5 phút timeout giữa polls
    session_timeout_ms=30000,           # Heartbeat timeout
    heartbeat_interval_ms=10000,        # Heartbeat interval
    
    # Isolation level
    isolation_level='read_committed'    # Chỉ đọc committed messages
)
```

---

## 9. Rủi ro khi dùng Kafka sai

- **Không đủ partitions**: Throughput bị giới hạn — 1 partition = 1 consumer max
- **Quá nhiều partitions**: Metadata overhead, file descriptor limit, leader election cost
- **Auto commit enabled + heavy processing**: Process fail giữa chừng → message lost (đã commit nhưng chưa xong)
- **Message quá lớn**: Default max 1MB — video, image cần lưu S3, chỉ send URL qua Kafka
- **Không có Dead Letter Queue**: Poison pill message → consumer bị block mãi mãi

---

## 10. Interview Q&A

**Q1: "Kafka là gì và tại sao DE dùng nó?"**
> Kafka là distributed event streaming platform — log phân tán, durable, high-throughput. DE dùng Kafka để: 1) Real-time data ingestion (thay vì batch), 2) Decouple producers/consumers, 3) Replay data (không mất data khi consumer down), 4) Multiple consumers đọc cùng event độc lập.

**Q2: "Kafka Topic và Partition khác nhau thế nào?"**
> Topic = category của messages (VD: order-events). Partition = chia topic thành nhiều ordered segments. Nhiều partitions = nhiều consumer song song = throughput cao hơn. Messages trong cùng partition có order guarantee. Cùng key → cùng partition → order per key.

**Q3: "Kafka offset là gì? Consumer Group quản lý offset như thế nào?"**
> Offset = position của message trong partition. Consumer commit offset để track "đã đọc đến đâu". Nếu consumer restart, tiếp tục từ committed offset. Với manual commit: chỉ commit sau khi process thành công → at-least-once delivery. Với auto commit: có thể bị loss nếu process fail sau commit.

**Q4: "Kafka khác RabbitMQ như thế nào?"**
> Kafka: Durable log (data vẫn còn sau consume), replay được, high throughput, multiple consumer groups. RabbitMQ: Message bị xóa sau consume, traditional message queue, rich routing, lower latency. Dùng Kafka cho: event sourcing, data pipelines. Dùng RabbitMQ cho: task queue, RPC.

**Q5: "Exactly-once trong Kafka là gì? Có khó không?"**
> Exactly-once = mỗi message được xử lý đúng 1 lần (không mất, không duplicate). Thực tế: Rất khó achieve true exactly-once. Giải pháp: 1) At-least-once + idempotent consumer (safe vì duplicate processing không ảnh hưởng), 2) Kafka transactions (Kafka 0.11+) cho producer-side exactly-once.

**Q6: "Giải thích consumer lag là gì và tại sao quan trọng?"**
> Consumer lag = offset difference giữa latest message và committed consumer offset. Lag cao = consumer không kịp xử lý messages → data pipeline trễ. Monitor consumer lag để biết khi nào cần scale consumers. Tool: Kafka Consumer Groups CLI, Confluent Control Center, Burrow.

---

## Tài liệu tham khảo

- [Apache Kafka Documentation](https://kafka.apache.org/documentation/)
- [Confluent Platform Docs](https://docs.confluent.io/)
- "Kafka: The Definitive Guide" - Neha Narkhede et al. (O'Reilly)
- [Debezium Documentation](https://debezium.io/documentation/)
