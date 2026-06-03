# [11] Phase 3 - Pipelines: Biến đổi dữ liệu thông minh với dbt

## Giới thiệu

dbt là công cụ thay đổi cách DE làm việc. Nếu trước đây bạn phải viết Python script để transform data, dbt cho phép bạn làm điều đó bằng **SQL thuần túy** với đầy đủ tính năng như version control, testing, documentation, và lineage. Đây là tool có tốc độ phổ biến nhanh nhất trong DE ecosystem.

---

## 1. Nguồn gốc: Tại sao dbt ra đời?

### Vấn đề trước khi có dbt

Trước 2016, khi team muốn transform data trong DWH, họ thường dùng một trong các cách này:

**Cách 1: SQL scripts trong folder (phổ biến nhất)**
```
/transforms/
├── 01_create_staging.sql
├── 02_create_dim_customer.sql
├── 03_create_fact_orders.sql
└── 04_create_monthly_report.sql
```

**Vấn đề**:
- Không có dependency management (phải chạy đúng thứ tự thủ công)
- Không có testing (data sai không ai biết)
- Không có documentation (ai cũng hỏi "bảng này từ đâu ra?")
- Không có version control (ai thay đổi query, không biết)
- Duplicate code (cùng logic CTE được copy-paste nhiều file)

**Cách 2: Python + SQLAlchemy**

Quá phức tạp cho việc chỉ viết SQL transform. Data Analyst không biết Python.

### dbt ra đời (2016, Fishtown Analytics)

> **dbt** = "Software engineering best practices applied to SQL transformations"

Ý tưởng: Đưa **Git workflow, testing, và documentation** vào SQL transform.

---

## 2. dbt Fundamentals

### Cấu trúc project dbt

```
my_dbt_project/
├── dbt_project.yml          ← Config chính của project
├── profiles.yml             ← Kết nối đến DWH (không commit lên Git!)
│
├── models/                  ← Nơi chứa SQL models
│   ├── staging/             ← 1:1 mapping với source tables
│   │   ├── _sources.yml     ← Declare sources
│   │   ├── stg_orders.sql
│   │   └── stg_users.sql
│   │
│   ├── intermediate/        ← Transform trung gian
│   │   └── int_orders_enriched.sql
│   │
│   └── marts/               ← Business-ready tables
│       ├── finance/
│       │   ├── _models.yml  ← Documentation + tests
│       │   ├── fct_orders.sql
│       │   └── dim_customers.sql
│       └── marketing/
│           └── fct_campaigns.sql
│
├── tests/                   ← Custom data tests
├── macros/                  ← Reusable Jinja templates
├── seeds/                   ← Static CSV data
└── snapshots/               ← SCD Type 2 automation
```

### dbt_project.yml

```yaml
name: 'my_project'
version: '1.0.0'
config-version: 2

profile: 'my_bigquery'  # Tên profile trong profiles.yml

models:
  my_project:
    staging:
      +materialized: view         # Staging = views (không tốn storage)
    intermediate:
      +materialized: view
    marts:
      +materialized: table        # Marts = tables (materialized)
      finance:
        +schema: finance          # Schema riêng cho finance team
```

---

## 3. Models: SQL files trở thành Tables/Views

### Staging Model - 1:1 với source

```sql
-- models/staging/stg_orders.sql
-- Chỉ clean cơ bản, không logic business

WITH source AS (
    -- Refer to source table (defined trong _sources.yml)
    SELECT * FROM {{ source('raw', 'orders') }}
),

renamed AS (
    SELECT
        id                    AS order_id,
        user_id,
        created_at            AS order_created_at,
        updated_at            AS order_updated_at,
        status                AS order_status,
        
        -- Clean và standardize
        LOWER(TRIM(status))   AS status_clean,
        CAST(amount AS FLOAT) AS amount,
        
        -- Remove clearly invalid rows
        _loaded_at            -- Metadata column từ ingestion tool
    FROM source
    WHERE id IS NOT NULL
      AND user_id IS NOT NULL
)

SELECT * FROM renamed
```

### Intermediate Model - Logic phức tạp hơn

```sql
-- models/intermediate/int_orders_enriched.sql

WITH orders AS (
    SELECT * FROM {{ ref('stg_orders') }}    -- ref() = dependency!
),

users AS (
    SELECT * FROM {{ ref('stg_users') }}
),

enriched AS (
    SELECT
        o.order_id,
        o.order_created_at,
        o.amount,
        o.order_status,
        u.user_id,
        u.country,
        u.customer_segment,
        
        -- Derived attributes
        CASE 
            WHEN o.amount < 50 THEN 'small'
            WHEN o.amount < 500 THEN 'medium'
            ELSE 'large'
        END AS order_size,
        
        -- Date attributes
        DATE(o.order_created_at) AS order_date,
        EXTRACT(YEAR FROM o.order_created_at) AS order_year,
        EXTRACT(MONTH FROM o.order_created_at) AS order_month
    FROM orders o
    LEFT JOIN users u ON o.user_id = u.user_id
)

SELECT * FROM enriched
```

### Mart Model - Business-ready

```sql
-- models/marts/finance/fct_orders.sql

WITH orders AS (
    SELECT * FROM {{ ref('int_orders_enriched') }}
),

-- Chỉ completed orders
completed_orders AS (
    SELECT * FROM orders WHERE order_status = 'completed'
),

final AS (
    SELECT
        order_id,
        order_date,
        order_year,
        order_month,
        user_id,
        country,
        customer_segment,
        order_size,
        amount,
        amount * 0.1 AS tax_amount,
        amount * 0.9 AS net_amount
    FROM completed_orders
)

SELECT * FROM final
```

### ref() - Tại sao ref() là "magic"?

```python
# Khi bạn viết {{ ref('stg_orders') }}
# dbt tự động:
# 1. Biết model fct_orders phụ thuộc vào stg_orders
# 2. Build stg_orders TRƯỚC fct_orders (dependency resolution)
# 3. Trong dev: resolve thành dev_schema.stg_orders
# 4. Trong prod: resolve thành prod_schema.stg_orders
# → Không cần hardcode schema name!
```

---

## 4. Testing - Data Quality tự động

```yaml
# models/marts/finance/_models.yml

version: 2

models:
  - name: fct_orders
    description: "Fact table chứa tất cả completed orders"
    columns:
      - name: order_id
        description: "Primary key của orders table"
        tests:
          - unique               # Test: không có duplicate order_id
          - not_null             # Test: không có null order_id
      
      - name: user_id
        tests:
          - not_null
          - relationships:       # Test: user_id phải tồn tại trong dim_customers
              to: ref('dim_customers')
              field: user_id
      
      - name: order_status
        tests:
          - accepted_values:     # Test: chỉ được có những giá trị này
              values: ['completed', 'cancelled', 'refunded']
      
      - name: amount
        tests:
          - not_null
          - dbt_expectations.expect_column_values_to_be_between:
              min_value: 0
              max_value: 1000000
```

```bash
# Chạy tests
dbt test                                  # Chạy tất cả tests
dbt test --select fct_orders              # Test chỉ model này
dbt test --select tag:critical            # Test theo tag
```

### Custom Tests (Singular Tests)

```sql
-- tests/assert_no_negative_amounts.sql
-- Nếu query này trả về row nào → TEST FAIL

SELECT order_id, amount
FROM {{ ref('fct_orders') }}
WHERE amount < 0
```

---

## 5. Documentation - Auto-generated Data Catalog

```yaml
# models/staging/_sources.yml - Khai báo source tables
version: 2

sources:
  - name: raw
    description: "Raw data được load từ production DB bởi Fivetran"
    database: my_bigquery_project
    schema: raw_data
    tables:
      - name: orders
        description: "Orders từ e-commerce app"
        columns:
          - name: id
            description: "Primary key"
          - name: status
            description: "Possible values: pending, completed, cancelled"
        freshness:          # Monitor data freshness tự động
          warn_after: {count: 12, period: hour}
          error_after: {count: 24, period: hour}
        loaded_at_field: _loaded_at
```

```bash
# Generate và serve documentation
dbt docs generate   # Build doc site
dbt docs serve      # Serve locally tại localhost:8080

# → Tạo ra interactive website với:
# - Lineage graph (xem model nào phụ thuộc vào model nào)
# - Column descriptions
# - Source freshness status
```

---

## 6. Snapshots - SCD Type 2 tự động

```sql
-- snapshots/snap_customer_segments.sql
-- dbt tự động quản lý SCD Type 2!

{% snapshot snap_customers %}

{{
    config(
        target_schema='snapshots',
        unique_key='customer_id',
        strategy='timestamp',
        updated_at='updated_at',
        invalidate_hard_deletes=True
    )
}}

SELECT 
    customer_id,
    name,
    email,
    country,
    segment,
    updated_at
FROM {{ source('raw', 'customers') }}

{% endsnapshot %}
```

dbt tự động thêm:
- `dbt_scd_id` (surrogate key)
- `dbt_updated_at`
- `dbt_valid_from`
- `dbt_valid_to` (NULL = current row)

---

## 7. Macros - Jinja Templates

```sql
-- macros/cents_to_dollars.sql
{% macro cents_to_dollars(column_name) %}
    ({{ column_name }} / 100.0)
{% endmacro %}

-- Dùng trong model
SELECT 
    order_id,
    {{ cents_to_dollars('amount_cents') }} AS amount_dollars
FROM orders

-- Macro phức tạp hơn: Generate pivot columns
{% macro generate_month_columns(months) %}
    {% for month in months %}
        SUM(CASE WHEN order_month = {{ month }} THEN amount ELSE 0 END) AS month_{{ month }}_revenue
        {% if not loop.last %},{% endif %}
    {% endfor %}
{% endmacro %}

-- Dùng
SELECT 
    product_id,
    {{ generate_month_columns([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]) }}
FROM orders
GROUP BY 1
```

---

## 8. dbt Materializations

```yaml
# 4 loại materialization trong dbt:

# 1. View (mặc định):
#    - Không lưu data vào disk
#    - Query fresh data mỗi lần
#    - Phù hợp: Staging models, ít query
{{ config(materialized='view') }}

# 2. Table:
#    - Lưu vào table thật
#    - Rebuild hoàn toàn mỗi dbt run
#    - Phù hợp: Mart tables, medium data
{{ config(materialized='table') }}

# 3. Incremental:
#    - Lần đầu: Build toàn bộ
#    - Lần sau: Chỉ process data mới
#    - Phù hợp: Fact tables lớn, event data
{{ config(
    materialized='incremental',
    unique_key='order_id'
) }}

{% if is_incremental() %}
    -- Chỉ chạy khi incremental mode
    WHERE created_at > (SELECT MAX(created_at) FROM {{ this }})
{% endif %}

# 4. Ephemeral:
#    - Không tạo object nào trong DWH
#    - Inject như CTE vào model tham chiếu
#    - Phù hợp: Intermediate logic không cần materialize
{{ config(materialized='ephemeral') }}
```

---

## 9. dbt Commands cần biết

```bash
# Build
dbt run                         # Chạy tất cả models
dbt run --select stg_orders     # Chạy 1 model cụ thể
dbt run --select +fct_orders    # Chạy model + TẤT CẢ ancestors
dbt run --select fct_orders+    # Chạy model + TẤT CẢ descendants
dbt run --select tag:daily      # Chạy models có tag 'daily'

# Testing
dbt test                        # Chạy tất cả tests
dbt test --select fct_orders    # Test 1 model

# Documentation
dbt docs generate && dbt docs serve

# Debug
dbt debug                       # Kiểm tra connection và config
dbt compile                     # Compile SQL (không execute)

# Freshness
dbt source freshness            # Kiểm tra data freshness của sources

# Snapshots
dbt snapshot                    # Chạy SCD snapshots
```

---

## 10. Rủi ro khi dùng dbt sai

- **Quá nhiều ephemeral models**: Tạo ra CTE chain siêu dài → query timeout
- **Không có schema tests**: Data sai lọc qua mà không ai biết
- **Hardcode schema name**: `SELECT * FROM raw_data.orders` thay vì `{{ source() }}`  → không portable
- **Không version control profiles.yml**: Vô tình commit credentials
- **Incremental model không có unique_key**: Duplicate data sau mỗi run

---

## 11. Interview Q&A

**Q1: "dbt là gì? Nó giải quyết vấn đề gì?"**
> dbt (data build tool) cho phép transform data trong DWH bằng SQL với đầy đủ software engineering practices: version control (Git), testing, documentation, và dependency management. Giải quyết: SQL scripts hỗn loạn không có order, không test, không docs.

**Q2: "ref() trong dbt hoạt động như thế nào?"**
> `{{ ref('model_name') }}` làm 3 việc: 1) Tạo dependency graph — dbt biết build model này trước, 2) Resolve đúng schema theo environment (dev vs prod), 3) Cho phép dbt compile lineage graph. Không dùng ref() = hardcode schema → mất toàn bộ dependency management.

**Q3: "Incremental materialization là gì? Khi nào dùng?"**
> Incremental: Lần đầu build toàn bộ, lần sau chỉ process data mới (dùng `{% if is_incremental() %}`). Dùng khi: Fact table lớn (GB/TB), không muốn rebuild toàn bộ mỗi run. Cần `unique_key` để MERGE/UPSERT (không INSERT duplicate). Trade-off: Có thể drift nếu logic thay đổi → cần `dbt run --full-refresh` định kỳ.

**Q4: "dbt tests là gì? Viết test thế nào?"**
> Hai loại: 1) Schema tests: khai báo trong YAML (`unique`, `not_null`, `accepted_values`, `relationships`) — dbt tự generate SQL. 2) Singular tests: Custom SQL file, nếu query trả về row → test fail. Nên có tests cho tất cả primary keys và foreign keys.

**Q5: "dbt Snapshots là gì?"**
> Tự động implement SCD Type 2. dbt theo dõi thay đổi theo thời gian của source data và thêm `dbt_valid_from`, `dbt_valid_to` columns. Mỗi lần run snapshot: so sánh source với snapshot, nếu có thay đổi → close row cũ (set `dbt_valid_to`), add row mới.

**Q6: "Giải thích dbt lineage graph."**
> Lineage graph = visual representation của data dependencies. Mỗi `{{ ref() }}` tạo một edge trong graph. dbt build từ source → staging → intermediate → marts theo topological order. Rất useful để: biết impact của một model thay đổi, debug data quality issues (trace ngược từ mart về source).

---

## Tài liệu tham khảo

- [dbt Documentation](https://docs.getdbt.com/)
- [dbt Learn](https://courses.getdbt.com/)
- [dbt Best Practices](https://docs.getdbt.com/guides/best-practices)
- "Analytics Engineering with dbt" - (FREE trên dbt Learn)
