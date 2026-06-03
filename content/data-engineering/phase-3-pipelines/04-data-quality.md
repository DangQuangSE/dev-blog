# [12] Phase 3 - Pipelines: Data Quality & Monitoring

## Giới thiệu

Một trong những vấn đề lớn nhất mà Data Engineer gặp phải là **bad data**. Khi data sai, không ai hay biết cho đến khi CEO hỏi "tại sao báo cáo doanh thu tháng này lại giảm 30%?" và câu trả lời là "xin lỗi, data bị lỗi từ 2 tuần trước." Bài này dạy bạn cách build hệ thống phòng ngừa thay vì chữa cháy.

---

## 1. Tại sao Data Quality quan trọng?

### Chi phí của Bad Data

Theo Gartner (2021): **Bad data costs businesses an average of $12.9 million per year**.

Ví dụ thực tế:
- Amazon: Sản phẩm bị recommend sai → mất revenue
- Healthcare: Data bệnh nhân sai → treatment sai → hậu quả nghiêm trọng
- Bank: Fraud detection model train trên bad data → miss fraud cases

### Data Quality Dimensions

| Dimension | Định nghĩa | Ví dụ vấn đề |
|-----------|------------|--------------|
| **Completeness** | Không có null quan trọng | user_id = NULL trong orders |
| **Accuracy** | Data đúng với thực tế | Email sai format, age = -5 |
| **Consistency** | Cùng data ở nhiều nơi giống nhau | Revenue trong DWH ≠ App |
| **Timeliness** | Data đến đúng lúc | Daily report trễ 2 ngày |
| **Uniqueness** | Không có duplicate | 1 order_id xuất hiện 2 lần |
| **Validity** | Data theo đúng business rules | Status không phải ["pending", "completed", "cancelled"] |

---

## 2. Data Contracts

### Khái niệm Data Contracts

> **Data Contract** là thỏa thuận chính thức giữa **data producer** và **data consumer** về schema, quality, và behavior của data.

Ví dụ: Khi team BE (producer) cung cấp data cho team DE (consumer), họ cần đồng ý:
- Schema chính xác (field names, types)
- Giá trị nào được chấp nhận
- SLA về freshness (data delay tối đa bao nhiêu)
- Khi nào và ai phải notify nếu có breaking change

### YAML Data Contract (Emerging standard)

```yaml
# data-contracts/orders.yaml
apiVersion: 2.2.2
kind: DataContract
id: urn:datacontract:orders-v1

info:
  title: Orders Data Contract
  version: 1.2.0
  description: "Dữ liệu đơn hàng từ production e-commerce app"
  owner: backend-team
  contact:
    name: John Doe
    email: john@company.com

servers:
  production:
    type: bigquery
    project: my-project
    dataset: raw_data
    table: orders

terms:
  usage: "Chỉ dùng cho analytics, không expose cho third party"
  limitations: "Dữ liệu delay tối đa 1 giờ"
  billing: "Costs shared theo usage"
  noticePeriod: P1M  # 1 month notice cho breaking changes

schema:
  type: table
  fields:
    - name: order_id
      type: string
      description: "Unique identifier của order"
      required: true
      unique: true
      pattern: "^ORD-[0-9]{10}$"
    
    - name: user_id
      type: string
      required: true
      description: "ID của user đặt hàng"
    
    - name: amount
      type: number
      required: true
      minimum: 0
      maximum: 10000
      description: "Tổng tiền đơn hàng (USD)"
    
    - name: status
      type: string
      required: true
      enum: ["pending", "processing", "completed", "cancelled", "refunded"]
    
    - name: created_at
      type: timestamp
      required: true

quality:
  type: SodaCL
  specification:
    checks for orders:
      - row_count > 1000          # Phải có ít nhất 1000 orders/day
      - missing_count(user_id) = 0
      - duplicate_count(order_id) = 0
      - invalid_count(status) = 0
      - freshness(created_at) < 2h  # Data không quá 2 giờ

servicelevels:
  availability:
    description: "99.9% uptime"
  retention:
    description: "Data lưu 7 năm"
  freshness:
    description: "Data mới nhất không quá 2 giờ"
  latency:
    description: "Query response < 30 giây"
```

---

## 3. Great Expectations - Data Validation Framework

### Tại sao Great Expectations?

```python
# Trước Great Expectations: Custom validation code (repetitive, hard to maintain)
def validate_orders(df):
    assert df['order_id'].notna().all(), "Null order_id found"
    assert df['order_id'].is_unique, "Duplicate order_id found"
    assert df['amount'].ge(0).all(), "Negative amount found"
    assert df['status'].isin(['pending', 'completed', 'cancelled']).all()
    # ... 50 more assertions
    # Không có reporting, không có history tracking
```

### Great Expectations cơ bản

```python
import great_expectations as gx

context = gx.get_context()

# Tạo data source
datasource = context.sources.add_pandas("my_datasource")
asset = datasource.add_dataframe_asset("orders")

# Define expectations (có thể generate từ data profile!)
suite = context.add_expectation_suite("orders_suite")

# Các expectation phổ biến
expectations = [
    gx.expectations.ExpectColumnToExist("order_id"),
    gx.expectations.ExpectColumnValuesToNotBeNull("order_id"),
    gx.expectations.ExpectColumnValuesToBeUnique("order_id"),
    
    gx.expectations.ExpectColumnValuesToNotBeNull("user_id"),
    
    gx.expectations.ExpectColumnValuesToBeBetween("amount", min_value=0, max_value=10000),
    gx.expectations.ExpectColumnValuesToNotBeNull("amount"),
    
    gx.expectations.ExpectColumnValuesToBeInSet(
        "status", 
        value_set=["pending", "processing", "completed", "cancelled", "refunded"]
    ),
    
    gx.expectations.ExpectTableRowCountToBeBetween(min_value=100, max_value=1000000),
    
    # Statistical expectations
    gx.expectations.ExpectColumnMeanToBeBetween("amount", min_value=50, max_value=500),
]

# Chạy validation
batch_request = asset.build_batch_request(dataframe=df)
validator = context.get_validator(batch_request=batch_request, expectation_suite=suite)

results = validator.validate()

# Kiểm tra kết quả
if not results["success"]:
    failed = [r for r in results["results"] if not r["success"]]
    raise ValueError(f"Data validation failed: {failed}")
    
print(f"Validation passed! Success rate: {results['statistics']['success_percent']}%")
```

### Tích hợp vào Airflow Pipeline

```python
from great_expectations_provider.operators.great_expectations import GreatExpectationsOperator

validate_orders = GreatExpectationsOperator(
    task_id='validate_orders',
    data_context_root_dir='/path/to/great_expectations/',
    checkpoint_name='orders_checkpoint',
    fail_task_on_validation_failure=True,  # Fail Airflow task nếu validation fail
    dag=dag
)

extract_task >> validate_orders >> transform_task
```

---

## 4. dbt Tests - Data Quality trong Transform Layer

```yaml
# models/marts/_models.yml - tests trong dbt

models:
  - name: fct_orders
    columns:
      - name: order_id
        tests:
          - unique
          - not_null
      - name: amount
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 10000
          - dbt_expectations.expect_column_to_have_no_outliers:
              group_by: ['country']
              sigma_threshold: 3
              
  - name: dim_customers
    columns:
      - name: customer_id
        tests:
          - unique
          - not_null
          - relationships:
              to: ref('stg_customers')
              field: customer_id
```

---

## 5. Data Monitoring và Alerting

### Anomaly Detection - Tự động phát hiện vấn đề

```python
# Monitor row count thay đổi đột ngột
def check_row_count_anomaly(table: str, date: str, threshold: float = 0.3):
    """
    Alert nếu row count ngày này chênh lệch quá 30% so với trung bình 7 ngày
    """
    query = f"""
        WITH daily_counts AS (
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as row_count
            FROM {table}
            WHERE DATE(created_at) >= DATE_SUB('{date}', INTERVAL 8 DAY)
            GROUP BY 1
        ),
        stats AS (
            SELECT 
                AVG(row_count) as avg_count,
                STDDEV(row_count) as std_count
            FROM daily_counts
            WHERE date < '{date}'
        )
        SELECT 
            dc.row_count as today_count,
            s.avg_count as historical_avg,
            ABS(dc.row_count - s.avg_count) / s.avg_count as pct_change
        FROM daily_counts dc, stats s
        WHERE dc.date = '{date}'
    """
    
    result = run_query(query)
    pct_change = result['pct_change']
    
    if pct_change > threshold:
        send_alert(
            title=f"Data anomaly detected in {table}",
            message=f"Row count changed by {pct_change:.1%} vs 7-day average"
        )
        return False
    return True
```

### Monte Carlo / Elementary / Anomalo - Commercial Solutions

Các công cụ monitoring data quality phổ biến trong industry:

```
Monte Carlo:       "Data Observability" platform - detect anomalies tự động
Anomalo:           ML-based anomaly detection
Great Expectations: Open source validation framework
dbt tests:          Built-in testing trong transform layer
Soda:              SQL-based data testing
```

---

## 6. Data Governance

### Các trụ cột của Data Governance

```
Data Governance
├── Data Catalog    ← Ai có data gì? Ở đâu? Nghĩa là gì?
├── Data Lineage    ← Data đến từ đâu? Qua những bước nào?
├── Access Control  ← Ai được phép xem data nào?
├── Data Retention  ← Data giữ bao lâu? Khi nào xóa?
└── Compliance      ← GDPR, HIPAA, CCPA...
```

### Data Catalog - "Google cho Data"

```python
# Ví dụ: Apache Atlas (open source data catalog)
# Hoặc: Datahub, Amundsen, Collibra (commercial)

# Trong dbt: Tự động generate data catalog từ code
dbt docs generate && dbt docs serve

# Tất cả models được documented:
# - Mô tả
# - Columns và types
# - Lineage graph
# - Test results
```

### Data Lineage - "Từ đâu data này đến?"

```
raw_orders (BigQuery)
    ↓
stg_orders (dbt model)
    ↓
int_orders_enriched (dbt model)
    ↓
fct_orders (dbt model)
    ↓
revenue_dashboard (Tableau)

Nếu raw_orders schema thay đổi (breaking change):
→ Lineage graph cho biết NGAY những gì bị ảnh hưởng
→ stg_orders, int_orders_enriched, fct_orders, revenue_dashboard
```

### PII (Personally Identifiable Information) và GDPR

```python
# Trong DE, cần biết đây là PII và xử lý đặc biệt
PII_COLUMNS = {
    'users': ['email', 'phone', 'full_name', 'address', 'birth_date', 'ssn'],
    'payments': ['card_number', 'card_holder_name'],
}

# Masking/Anonymization trong staging layer
def mask_pii(df, table_name):
    if table_name in PII_COLUMNS:
        for col in PII_COLUMNS[table_name]:
            if col in df.columns:
                # Hash email (dùng để join, không thể reverse)
                if col == 'email':
                    df[col] = df[col].apply(
                        lambda x: hashlib.sha256(x.encode()).hexdigest() if x else None
                    )
                # Mask các field khác
                else:
                    df[col] = '***MASKED***'
    return df
```

---

## 7. Data Quality SLA

```yaml
# data-sla.yaml
tables:
  fct_orders:
    freshness:
      max_age_hours: 2          # Không được trễ hơn 2 giờ
      alert_hours: 1.5          # Alert khi gần đến limit
    completeness:
      critical_columns:         # Không được có NULL
        - order_id
        - user_id
        - amount
    volume:
      min_daily_rows: 1000      # Phải có ít nhất 1000 rows/ngày
      max_daily_rows: 10000000
    accuracy:
      amount_range: [0, 10000]  # amount phải trong khoảng này
```

---

## 8. Rủi ro khi không có Data Quality

- **Wrong business decisions**: CEO ra quyết định chiến lược dựa trên data sai
- **ML model degradation**: Training data kém → model kém → production issues
- **Regulatory fines**: GDPR violations có thể bị phạt đến 4% doanh thu toàn cầu
- **Loss of trust**: Khi Analyst phát hiện data sai nhiều lần → không tin tưởng data nữa

---

## 9. Interview Q&A

**Q1: "Data Quality là gì? Có bao nhiêu dimensions?"**
> 6 dimensions chính: Completeness (không có null quan trọng), Accuracy (đúng với thực tế), Consistency (nhất quán cross-system), Timeliness (data tươi), Uniqueness (không duplicate), Validity (theo business rules). Trong phỏng vấn, nên nêu cả ví dụ cụ thể.

**Q2: "Làm thế nào để implement data validation trong pipeline?"**
> Multi-layer approach: 1) Source level: Data contracts với producers, 2) Ingestion level: Schema validation khi load (Avro schema, Great Expectations), 3) Transform level: dbt tests (unique, not_null, relationships), 4) Serving level: Monitor anomalies, alert khi row count đột ngột thay đổi.

**Q3: "Data Contract là gì? Tại sao quan trọng?"**
> Thỏa thuận formal giữa producer và consumer về schema, quality, SLA của data. Quan trọng vì: 1) Prevent breaking changes bất ngờ (producer thêm/xóa column mà không thông báo), 2) Clear ownership và accountability, 3) Enable automated validation.

**Q4: "Giải thích Data Lineage và tại sao nó quan trọng."**
> Lineage track đường đi của data từ source → transform → output. Quan trọng để: 1) Impact analysis (nếu source thay đổi, biết gì bị ảnh hưởng), 2) Debug data issues (data sai từ bước nào?), 3) Compliance (biết PII data flow qua đâu), 4) Onboarding (team member mới hiểu data origin).

**Q5: "PII là gì? DE cần xử lý như thế nào?"**
> Personally Identifiable Information: email, phone, name, address, SSN, card number... DE cần: 1) Identify và document tất cả PII, 2) Mask/hash trong non-production environments, 3) Implement data retention (xóa sau X năm), 4) Access control (không phải ai cũng xem được), 5) Audit log (ai xem PII khi nào).

**Q6: "Data Observability là gì?"**
> Khả năng hiểu health của data system từ external signals (metrics, logs, traces) — tương tự application observability. 5 pillars: Freshness (data bao giờ updated?), Volume (row count bình thường không?), Distribution (data distribution có thay đổi?), Schema (có column nào thay đổi?), Lineage (upstream/downstream dependencies).

---

## Tài liệu tham khảo

- [Great Expectations Documentation](https://docs.greatexpectations.io/)
- [dbt Tests](https://docs.getdbt.com/docs/build/tests)
- [DAMA DMBOK - Data Management Body of Knowledge](https://www.dama.org/cpages/body-of-knowledge)
- [GDPR for Data Engineers](https://gdpr.eu/)
