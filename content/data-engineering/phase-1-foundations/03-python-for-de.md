# Python cho Data Engineer

## Giới thiệu

Python là ngôn ngữ số 1 trong Data Engineering. Nếu bạn đến từ Java/Spring Boot, Python sẽ cảm thấy "tự do" hơn rất nhiều — nhưng tự do đó cũng đồng nghĩa với việc cần biết **dùng đúng thư viện đúng lúc**. Bài này tập trung vào những gì DE thực sự dùng hàng ngày.

---

## 1. Tại sao Python thay vì Java/Scala trong DE?

### Lịch sử

Hadoop (2006) và Spark (2009) ban đầu được viết bằng **Java và Scala**. Các DE đời đầu phải viết MapReduce job bằng Java — verbose và phức tạp.

Khi **PySpark** ra đời (2010), Python wrapper trên Spark, nó thay đổi mọi thứ:
- Code ngắn gọn hơn 5-10 lần
- Data Scientist đã quen Python có thể dùng Spark
- Thư viện ecosystem Python (pandas, numpy, scikit-learn) tích hợp tốt

Ngày nay, **95% DE job** yêu cầu Python. Java/Scala vẫn được dùng khi cần performance tối đa.

### So sánh: Java MapReduce vs Python PySpark

```java
// Java MapReduce - Word Count (70+ dòng boilerplate)
public class WordCount {
    public static class TokenizerMapper extends Mapper<Object, Text, Text, IntWritable> {
        private final static IntWritable one = new IntWritable(1);
        private Text word = new Text();
        
        public void map(Object key, Text value, Context context) 
                throws IOException, InterruptedException {
            StringTokenizer itr = new StringTokenizer(value.toString());
            while (itr.hasMoreTokens()) {
                word.set(itr.nextToken());
                context.write(word, one);
            }
        }
    }
    // ... thêm 50 dòng nữa
}
```

```python
# PySpark - Word Count (5 dòng!)
from pyspark.sql import SparkSession

spark = SparkSession.builder.appName("WordCount").getOrCreate()
word_counts = spark.read.text("input.txt") \
    .selectExpr("explode(split(value, ' ')) as word") \
    .groupBy("word").count()
word_counts.show()
```

---

## 2. Python Fundamentals DE cần thành thạo

### File I/O và Data Formats

DE làm việc với nhiều định dạng file. Đây là những format phổ biến nhất:

```python
import pandas as pd
import json

# CSV (phổ biến nhất, nhưng không hiệu quả)
df = pd.read_csv('data.csv')
df.to_csv('output.csv', index=False)

# JSON (API responses, event logs)
with open('events.json', 'r') as f:
    data = json.load(f)
    
# JSON Lines (JSONL) - Từng dòng là 1 JSON object (phổ biến trong streaming)
with open('events.jsonl', 'r') as f:
    events = [json.loads(line) for line in f]

# Parquet (FORMAT QUAN TRỌNG NHẤT trong DE!)
df = pd.read_parquet('data.parquet')
df.to_parquet('output.parquet', compression='snappy')
```

### Tại sao Parquet quan trọng?

**Parquet** là columnar format được thiết kế cho analytical workload:

| Tính chất | CSV | JSON | **Parquet** |
|-----------|-----|------|-------------|
| Storage | 1x (lớn) | 1.5x (lớn hơn) | **0.1-0.3x (nhỏ hơn 10x!)** |
| Schema | Không có | Không có | **Có (kiểu dữ liệu rõ ràng)** |
| Columnar | ❌ | ❌ | **✅** |
| Tốc độ đọc (analytical) | Chậm | Rất chậm | **Nhanh nhất** |
| Human readable | ✅ | ✅ | ❌ (binary) |

```python
# Demo: So sánh kích thước file
import pandas as pd
import numpy as np

# Tạo dataset 1 triệu dòng
df = pd.DataFrame({
    'id': range(1_000_000),
    'name': ['User_' + str(i) for i in range(1_000_000)],
    'amount': np.random.random(1_000_000) * 1000,
    'date': pd.date_range('2024-01-01', periods=1_000_000, freq='1s')
})

# Lưu theo các format
df.to_csv('data.csv', index=False)                          # ~85 MB
df.to_json('data.json', orient='records', lines=True)       # ~120 MB
df.to_parquet('data.parquet', compression='snappy')         # ~8 MB (!)
```

### Environment Variables và Config

```python
import os
from dotenv import load_dotenv

load_dotenv()  # Load từ .env file

# Không bao giờ hardcode credentials!
DB_HOST = os.getenv('DB_HOST')
DB_PASSWORD = os.getenv('DB_PASSWORD')
API_KEY = os.getenv('STRIPE_API_KEY')

# Kết nối database an toàn
import psycopg2

conn = psycopg2.connect(
    host=DB_HOST,
    database=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=DB_PASSWORD
)
```

---

## 3. Pandas - Công cụ xử lý dữ liệu hàng đầu

### Pandas là gì?

Nếu SQL là ngôn ngữ query, thì **Pandas là SQL trong Python** — nhưng mạnh hơn về mặt lập trình (loops, conditions, custom functions).

Giới hạn: Pandas **chỉ chạy trên 1 máy** và load data **vào RAM**. Khi data vượt quá RAM → cần Spark.

### Operations quan trọng nhất

```python
import pandas as pd
import numpy as np

df = pd.read_parquet('orders.parquet')

# === SELECTION ===
# Chọn cột
df[['order_id', 'amount', 'status']]

# Filter hàng
df[df['amount'] > 100]
df[(df['status'] == 'completed') & (df['amount'] > 100)]
df[df['status'].isin(['completed', 'shipped'])]

# === TRANSFORMATION ===
# Tạo cột mới
df['amount_usd'] = df['amount_vnd'] / 25000
df['is_high_value'] = df['amount'] > 1000

# Apply function cho từng dòng
def categorize_order(amount):
    if amount < 100: return 'small'
    elif amount < 1000: return 'medium'
    else: return 'large'

df['order_size'] = df['amount'].apply(categorize_order)

# Xử lý datetime
df['order_date'] = pd.to_datetime(df['created_at'])
df['year'] = df['order_date'].dt.year
df['month'] = df['order_date'].dt.month
df['day_of_week'] = df['order_date'].dt.day_name()

# === AGGREGATION ===
# Group by
summary = df.groupby(['year', 'month']).agg(
    total_revenue=('amount', 'sum'),
    avg_order_value=('amount', 'mean'),
    order_count=('order_id', 'count'),
    unique_customers=('user_id', 'nunique')
).reset_index()

# Pivot table
pivot = df.pivot_table(
    values='amount',
    index='user_id',
    columns='status',
    aggfunc='sum',
    fill_value=0
)

# === JOINING ===
users = pd.read_parquet('users.parquet')
result = df.merge(users, on='user_id', how='left')

# === NULL HANDLING ===
df.isnull().sum()  # Đếm null mỗi cột
df['amount'].fillna(0)  # Fill null với 0
df.dropna(subset=['user_id'])  # Drop hàng có null ở user_id
df['amount'].fillna(df['amount'].mean())  # Fill với mean

# === DEDUPLICATION ===
df.drop_duplicates(subset=['order_id'])  # Loại bỏ duplicate theo order_id
df.drop_duplicates(subset=['order_id'], keep='last')  # Giữ dòng cuối cùng
```

### Memory Optimization - Kỹ năng DE quan trọng

```python
# Vấn đề: Pandas mặc định dùng int64, float64 — rất tốn RAM
df.dtypes  # Kiểm tra types
df.memory_usage(deep=True).sum() / 1024**2  # MB

# Tối ưu: Downcast kiểu dữ liệu
df['amount'] = pd.to_numeric(df['amount'], downcast='float')  # float64 → float32
df['status'] = df['status'].astype('category')  # string → category (tiết kiệm 80%)
df['year'] = df['year'].astype('int16')  # int64 → int16

# Đọc file lớn theo chunks (khi file quá lớn)
chunk_size = 100_000
results = []
for chunk in pd.read_csv('big_file.csv', chunksize=chunk_size):
    # Xử lý từng chunk
    processed = chunk[chunk['amount'] > 100]
    results.append(processed)

final_df = pd.concat(results, ignore_index=True)
```

---

## 4. Data Pipeline Patterns trong Python

### Pattern 1: Extract-Transform-Load (ETL)

```python
import pandas as pd
import psycopg2
from sqlalchemy import create_engine
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_from_source(connection_string: str, query: str) -> pd.DataFrame:
    """Bước 1: Kéo data từ source database"""
    logger.info("Extracting data...")
    engine = create_engine(connection_string)
    df = pd.read_sql(query, engine)
    logger.info(f"Extracted {len(df):,} rows")
    return df

def transform(df: pd.DataFrame) -> pd.DataFrame:
    """Bước 2: Transform và clean data"""
    logger.info("Transforming data...")
    
    # Remove duplicates
    df = df.drop_duplicates(subset=['order_id'])
    
    # Handle nulls
    df['amount'] = df['amount'].fillna(0)
    df = df.dropna(subset=['user_id', 'order_date'])
    
    # Create derived columns
    df['order_date'] = pd.to_datetime(df['order_date'])
    df['year_month'] = df['order_date'].dt.to_period('M').astype(str)
    df['is_high_value'] = df['amount'] > 1000
    
    logger.info(f"After transform: {len(df):,} rows")
    return df

def load_to_warehouse(df: pd.DataFrame, target_table: str, connection_string: str):
    """Bước 3: Load vào Data Warehouse"""
    logger.info(f"Loading {len(df):,} rows to {target_table}...")
    engine = create_engine(connection_string)
    df.to_sql(
        target_table, 
        engine, 
        if_exists='replace',  # hoặc 'append' cho incremental load
        index=False,
        chunksize=10_000  # Tránh memory issue khi insert nhiều
    )
    logger.info("Load complete!")

# Chạy pipeline
if __name__ == "__main__":
    SOURCE_QUERY = """
        SELECT order_id, user_id, amount, status, created_at
        FROM orders
        WHERE created_at >= CURRENT_DATE - INTERVAL '1 day'
    """
    
    raw_data = extract_from_source(SOURCE_DB_URL, SOURCE_QUERY)
    clean_data = transform(raw_data)
    load_to_warehouse(clean_data, 'fact_orders', TARGET_DB_URL)
```

### Pattern 2: Idempotent Pipeline (Quan trọng trong DE!)

**Idempotent** = chạy nhiều lần cũng cho kết quả giống nhau. Đây là yêu cầu bắt buộc cho production pipeline.

```python
def load_idempotent(df: pd.DataFrame, target_table: str, 
                    date_column: str, run_date: str):
    """
    Idempotent load: Nếu chạy lại cùng ngày, không bị duplicate.
    Strategy: Delete data của ngày đó trước, rồi insert lại.
    """
    engine = create_engine(TARGET_DB_URL)
    
    with engine.begin() as conn:
        # Delete dữ liệu ngày này (nếu đã có)
        conn.execute(f"""
            DELETE FROM {target_table}
            WHERE DATE({date_column}) = '{run_date}'
        """)
        
        # Insert mới
        df.to_sql(target_table, conn, if_exists='append', index=False)
        
    logger.info(f"Idempotent load complete for {run_date}")
```

### Pattern 3: API Ingestion (Phổ biến với BE background)

```python
import requests
import time
from datetime import datetime, timedelta

def fetch_stripe_transactions(start_date: str, end_date: str) -> list:
    """Kéo transactions từ Stripe API với pagination"""
    
    all_transactions = []
    starting_after = None
    
    while True:
        params = {
            'created[gte]': int(datetime.fromisoformat(start_date).timestamp()),
            'created[lte]': int(datetime.fromisoformat(end_date).timestamp()),
            'limit': 100  # Max per page
        }
        
        if starting_after:
            params['starting_after'] = starting_after
        
        response = requests.get(
            'https://api.stripe.com/v1/charges',
            params=params,
            headers={'Authorization': f'Bearer {STRIPE_API_KEY}'}
        )
        
        response.raise_for_status()
        data = response.json()
        
        all_transactions.extend(data['data'])
        
        # Check if more pages
        if not data['has_more']:
            break
            
        starting_after = data['data'][-1]['id']
        
        # Rate limiting: Stripe cho phép 100 req/giây
        time.sleep(0.1)
    
    logger.info(f"Fetched {len(all_transactions)} transactions")
    return all_transactions

# Convert sang DataFrame
def transactions_to_df(transactions: list) -> pd.DataFrame:
    rows = []
    for t in transactions:
        rows.append({
            'charge_id': t['id'],
            'amount': t['amount'] / 100,  # Stripe lưu cents
            'currency': t['currency'],
            'status': t['status'],
            'customer_id': t.get('customer'),
            'created_at': datetime.fromtimestamp(t['created'])
        })
    return pd.DataFrame(rows)
```

---

## 5. Các thư viện Python quan trọng cho DE

| Thư viện | Mục đích | Khi nào dùng |
|----------|----------|--------------|
| **pandas** | Data manipulation | Data nhỏ-vừa, fit in RAM |
| **PySpark** | Distributed processing | Data TB+, cần scale |
| **SQLAlchemy** | Database connection | Connect mọi loại database |
| **boto3** | AWS SDK | Tương tác S3, Glue, etc. |
| **google-cloud-bigquery** | BigQuery client | Chạy query, load data |
| **requests / httpx** | HTTP client | Call API |
| **great_expectations** | Data validation | Kiểm tra chất lượng data |
| **pendulum** | Datetime handling | Xử lý timezone, date arithmetic |
| **pydantic** | Data validation | Schema validation cho data |
| **loguru** | Logging | Logging production-ready |

---

## 6. Rủi ro khi dùng Python không đúng trong DE

- **Memory error**: Load toàn bộ file 50GB vào pandas → crash. Giải pháp: Dùng Spark hoặc chunked reading.
- **String concatenation trong loop**: Tạo DataFrame bằng cách append trong loop = O(n²). Giải pháp: Dùng list, rồi `pd.DataFrame(list)`.
- **No error handling**: Pipeline fail giữa chừng không biết dữ liệu nào đã load, dữ liệu nào chưa.
- **Timezone naive**: `datetime.now()` không có timezone → sort sai khi data từ nhiều timezone.
- **Mutable default arguments**: Bug kinh điển Python trong production code.

```python
# BUG: default mutable argument
def process(data, results=[]):  # Nguy hiểm!
    results.append(len(data))
    return results

# FIX:
def process(data, results=None):
    if results is None:
        results = []
    results.append(len(data))
    return results
```

---

## 7. Interview Q&A

**Q1: "Parquet là gì và tại sao DE dùng nó thay CSV?"**
> Parquet là columnar binary file format. Lợi ích: 1) Nhỏ hơn 5-10x so với CSV (do columnar compression), 2) Nhanh hơn khi query vì chỉ đọc cột cần thiết, 3) Có schema type (không bị "all strings" như CSV), 4) Supported bởi tất cả Big Data tools (Spark, BigQuery, Hive).

**Q2: "Pandas vs PySpark: khi nào dùng cái nào?"**
> **Pandas**: Khi data < RAM của máy (thường < 16-32GB), cần interactive exploration, prototype nhanh. **PySpark**: Khi data > RAM, cần chạy trên cluster, hoặc cần production scale. Rule of thumb: "Nếu bạn cần chia data cho nhiều máy, dùng Spark."

**Q3: "Idempotency trong data pipeline là gì?"**
> Pipeline idempotent = chạy nhiều lần với cùng input cho cùng output, không có side effect (không duplicate data). Quan trọng vì pipeline sẽ fail và cần re-run. Cách implement: Dùng MERGE/UPSERT, hoặc delete-then-insert theo partition.

**Q4: "Bạn xử lý rate limiting khi call API như thế nào?"**
> 1) Implement exponential backoff với retry, 2) Track requests/second và sleep nếu gần limit, 3) Dùng thư viện như `tenacity` cho retry logic, 4) Cache responses nếu có thể, 5) Dùng pagination thay vì gọi 1 request lớn.

**Q5: "Null handling trong Python/Pandas như thế nào?"**
> Pandas có NaN (float), None (Python object), và pd.NA (mới). Các method: `isnull()`, `fillna()`, `dropna()`. Quan trọng: `NaN != NaN` trong Python, nên không dùng `== np.nan` mà dùng `pd.isna()`. Khi load vào database, NaN thường thành NULL.

**Q6: "Tại sao phải dùng type hints và dataclasses trong DE code?"**
> DE code thường được nhiều người maintain và chạy tự động. Type hints giúp: 1) IDE catch lỗi sớm, 2) Code self-documenting (biết function nhận gì, trả gì), 3) dễ refactor. Trong production pipeline, một bug nhỏ có thể corrupt data của cả ngày.

---

## Tài liệu tham khảo

- [Pandas Documentation](https://pandas.pydata.org/docs/)
- [Apache Parquet Documentation](https://parquet.apache.org/)
- "Python for Data Analysis" - Wes McKinney (tác giả pandas)
