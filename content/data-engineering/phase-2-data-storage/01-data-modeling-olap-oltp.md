# [05] Phase 2 - Data Storage: Thiết kế mô hình dữ liệu OLAP (Star/Snowflake)

## Giới thiệu

Data Modeling trong Data Engineering khác hoàn toàn với Database Design trong Backend Engineering. Khi làm BE, bạn normalize database để tránh redundancy và đảm bảo data integrity. Khi làm DE, bạn **intentionally denormalize** để làm query analytics nhanh hơn. Đây là sự thay đổi tư duy quan trọng nhất.

---

## 1. Tại sao Data Modeling quan trọng?

### Vấn đề với Database Schema của BE trong Analytics

Giả sử bạn có schema BE điển hình (3NF - Third Normal Form):

```sql
-- Schema BE: Normalized, tốt cho OLTP
users (id, name, email, country_id, ...)
countries (id, name, region)
orders (id, user_id, product_id, created_at, status)
products (id, name, category_id, price)
categories (id, name, parent_category_id)
order_items (order_id, product_id, quantity, unit_price)
```

Để tạo báo cáo "Doanh thu theo tháng, theo quốc gia, theo danh mục sản phẩm":

```sql
-- Query phức tạp với nhiều JOIN
SELECT 
    DATE_TRUNC('month', o.created_at) AS month,
    c.name AS country,
    cat.name AS category,
    SUM(oi.quantity * oi.unit_price) AS revenue
FROM orders o
JOIN users u ON o.user_id = u.id
JOIN countries c ON u.country_id = c.id
JOIN order_items oi ON o.id = oi.order_id
JOIN products p ON oi.product_id = p.id
JOIN categories cat ON p.category_id = cat.id
WHERE o.status = 'completed'
GROUP BY 1, 2, 3;
```

**Vấn đề**:
- 5 JOIN = slow (đặc biệt khi data lớn)
- Khó understand cho Analyst không phải kỹ sư
- Không tối ưu cho columnar storage

**Giải pháp**: Data Modeling với Star Schema.

---

## 2. Star Schema - Thiết kế Data Warehouse cơ bản nhất

### Nguồn gốc

Ralph Kimball (1996, cuốn "The Data Warehouse Toolkit") định nghĩa **Dimensional Modeling** với Star Schema. Ý tưởng: Thiết kế data theo cách tư duy của business user, không phải theo normalized form.

### Thành phần

**Star Schema = 1 Fact Table + nhiều Dimension Tables**

```
                    dim_date
                       │
                       │
dim_product ──── fact_orders ──── dim_customer
                       │
                       │
                    dim_location
```

Trông như ngôi sao → "Star Schema"

### Fact Table

> **Fact Table** chứa các **số đo** (measures) có thể aggregate được, và **foreign keys** đến các dimension.

```sql
-- Fact table: Chứa events/transactions
CREATE TABLE fact_orders (
    order_id          BIGINT,          -- Natural key (để debug)
    date_key          INT,             -- FK đến dim_date
    customer_key      INT,             -- FK đến dim_customer
    product_key       INT,             -- FK đến dim_product
    location_key      INT,             -- FK đến dim_location
    
    -- Measures (chỉ số có thể SUM, AVG, COUNT)
    quantity          INT,
    unit_price        DECIMAL(10,2),
    total_amount      DECIMAL(10,2),   -- quantity * unit_price
    discount_amount   DECIMAL(10,2),
    net_amount        DECIMAL(10,2)    -- total - discount
)
-- Partitioned by date_key để query nhanh
```

**Đặc điểm Fact Table:**
- Rất nhiều hàng (hàng triệu, tỷ rows)
- Ít cột, chủ yếu là numbers và foreign keys
- Không thay đổi sau khi insert (immutable)
- Thường partition theo time

### Dimension Table

> **Dimension Table** chứa **context** (mô tả) của các fact. Trả lời câu hỏi WHO, WHAT, WHEN, WHERE, HOW.

```sql
-- dim_customer: WHO bought
CREATE TABLE dim_customer (
    customer_key      INT PRIMARY KEY,    -- Surrogate key
    customer_id       VARCHAR(50),        -- Natural key từ source
    customer_name     VARCHAR(200),
    email             VARCHAR(200),
    country           VARCHAR(100),
    city              VARCHAR(100),
    age_group         VARCHAR(50),        -- Derived attribute
    customer_segment  VARCHAR(50),        -- VIP, Regular, New
    is_active         BOOLEAN
);

-- dim_product: WHAT was bought
CREATE TABLE dim_product (
    product_key       INT PRIMARY KEY,
    product_id        VARCHAR(50),
    product_name      VARCHAR(200),
    category          VARCHAR(100),
    subcategory       VARCHAR(100),
    brand             VARCHAR(100),
    price_tier        VARCHAR(50)         -- Premium, Standard, Budget
);

-- dim_date: WHEN it happened (Quan trọng nhất!)
CREATE TABLE dim_date (
    date_key          INT PRIMARY KEY,    -- Format: YYYYMMDD (20240115)
    date              DATE,
    year              INT,
    quarter           INT,               -- 1-4
    month             INT,               -- 1-12
    month_name        VARCHAR(20),       -- January, February...
    week_of_year      INT,
    day_of_week       INT,              -- 1-7
    day_name          VARCHAR(20),       -- Monday, Tuesday...
    is_weekend        BOOLEAN,
    is_holiday        BOOLEAN,
    fiscal_year       INT,              -- Fiscal year (có thể khác calendar year)
    fiscal_quarter    INT
);
```

**Lợi ích của dim_date riêng biệt:**
- Pre-compute tất cả date attributes một lần → query không cần tính lại
- Business có thể add custom attributes (holiday, fiscal year)
- Join performance tốt hơn (dim_date chỉ ~3650 rows cho 10 năm)

### Query với Star Schema

```sql
-- Cùng câu hỏi như trên, nhưng với Star Schema
SELECT 
    d.year,
    d.month_name,
    c.country,
    p.category,
    SUM(f.net_amount) AS revenue,
    COUNT(DISTINCT f.order_id) AS order_count,
    AVG(f.net_amount) AS avg_order_value
FROM fact_orders f
JOIN dim_date d ON f.date_key = d.date_key
JOIN dim_customer c ON f.customer_key = c.customer_key
JOIN dim_product p ON f.product_key = p.product_key
WHERE d.year = 2024
GROUP BY 1, 2, 3, 4;
```

**Cải thiện**: Chỉ 3 JOIN (thay vì 5), dimension tables nhỏ (< 1M rows), query dễ hiểu.

---

## 3. Snowflake Schema - Khi nào nên dùng?

### Snowflake Schema là gì?

Snowflake Schema = Star Schema nhưng **normalize thêm** các Dimension Table lớn.

```
                    dim_date
                       │
dim_subcategory        │
      │                │
dim_category ── dim_product ──── fact_orders ──── dim_customer ── dim_country
                                                                        │
                                                                    dim_region
```

### Star vs Snowflake: Khi nào dùng?

| Tiêu chí | Star Schema | Snowflake Schema |
|----------|-------------|-----------------|
| **Query complexity** | Đơn giản hơn | Nhiều JOIN hơn |
| **Query performance** | Nhanh hơn | Chậm hơn |
| **Storage** | Nhiều hơn (redundancy) | Ít hơn |
| **Maintenance** | Khó update attribute | Dễ update |
| **Dùng khi** | BI Tools, end user query | Dimension rất lớn (>1M rows) |

**Thực tế**: 90% trường hợp dùng **Star Schema**. Snowflake dùng khi dimension table quá lớn (VD: dim_product có 10 triệu products).

---

## 4. Slowly Changing Dimensions (SCD) - Quan trọng nhất trong phỏng vấn

### Vấn đề: Dữ liệu thay đổi theo thời gian

Khách hàng thay đổi địa chỉ, nhân viên thay đổi bộ phận, sản phẩm thay đổi giá. Câu hỏi: **Bạn muốn lưu lịch sử thay đổi không?**

```
John Doe, ban đầu ở Hà Nội → 2024/06/01 chuyển sang TP.HCM

Đơn hàng tháng 3/2024 của John: Phân tích theo Hà Nội hay TP.HCM?
```

Đây chính xác là bài toán SCD.

### SCD Type 1: Overwrite (Không giữ lịch sử)

```sql
-- UPDATE trực tiếp
UPDATE dim_customer
SET city = 'Ho Chi Minh City'
WHERE customer_id = 'C001';

-- Kết quả: Đơn hàng tháng 3 sẽ "tưởng" là ở HCM
-- Dùng khi: Lịch sử không quan trọng (VD: fix typo trong tên)
```

**Ưu điểm**: Đơn giản  
**Nhược điểm**: Mất lịch sử hoàn toàn, không audit được  
**Dùng khi**: Fix lỗi dữ liệu, hoặc attribute không ảnh hưởng đến analysis

### SCD Type 2: Add New Row (Giữ đầy đủ lịch sử) ⭐ Phổ biến nhất

```sql
-- Thay vì update, thêm row mới với validity period
CREATE TABLE dim_customer (
    customer_key      INT PRIMARY KEY,    -- Surrogate key (auto-increment)
    customer_id       VARCHAR(50),        -- Natural key (cố định)
    customer_name     VARCHAR(200),
    city              VARCHAR(100),
    
    -- SCD Type 2 columns
    effective_date    DATE NOT NULL,      -- Row bắt đầu có hiệu lực
    expiry_date       DATE,              -- NULL = row hiện tại (current)
    is_current        BOOLEAN DEFAULT TRUE
);

-- State ban đầu
INSERT INTO dim_customer VALUES
(1, 'C001', 'John Doe', 'Hanoi', '2023-01-01', NULL, TRUE);

-- Khi John chuyển sang HCM (2024-06-01):
-- Bước 1: Close row cũ
UPDATE dim_customer
SET expiry_date = '2024-05-31', is_current = FALSE
WHERE customer_id = 'C001' AND is_current = TRUE;

-- Bước 2: Insert row mới
INSERT INTO dim_customer VALUES
(2, 'C001', 'John Doe', 'Ho Chi Minh City', '2024-06-01', NULL, TRUE);
```

**Query lấy thông tin tại thời điểm order:**
```sql
SELECT 
    f.order_id,
    f.net_amount,
    c.city AS customer_city_at_purchase_time
FROM fact_orders f
JOIN dim_customer c 
    ON f.customer_key = c.customer_key
    -- Hoặc join theo date nếu fact table lưu date thay vì customer_key
WHERE c.is_current = TRUE;  -- Hoặc filter theo effective/expiry date
```

**Ưu điểm**: Lưu đầy đủ lịch sử, có thể query data tại bất kỳ thời điểm  
**Nhược điểm**: Bảng to hơn, query phức tạp hơn (phải filter is_current)  
**Dùng khi**: Cần biết trạng thái tại thời điểm event xảy ra (standard practice)

### SCD Type 3: Add New Column (Chỉ giữ lịch sử một bước)

```sql
CREATE TABLE dim_customer (
    customer_key      INT PRIMARY KEY,
    customer_id       VARCHAR(50),
    customer_name     VARCHAR(200),
    current_city      VARCHAR(100),   -- Trạng thái hiện tại
    previous_city     VARCHAR(100)    -- Chỉ lưu được 1 lịch sử!
);
```

**Dùng khi**: Chỉ cần so sánh "hiện tại vs trước" (hiếm dùng)  
**Hạn chế**: Không lưu được nhiều hơn 1 lần thay đổi

---

## 5. Surrogate Key vs Natural Key

### Natural Key: Key từ source system

```sql
customer_id = 'C001'   -- ID trong CRM
product_sku = 'SKU-123' -- SKU trong ERP
user_email = 'john@example.com'
```

**Vấn đề**:
- Có thể bị thay đổi (email change, SKU reformat)
- Từ nhiều source system có thể conflict
- String keys chậm hơn integer khi JOIN

### Surrogate Key: Key tổng hợp, không có business meaning

```sql
customer_key = 1        -- Auto-increment integer
customer_key = 10001    -- Với prefix cho mỗi source
```

**Quy tắc**: **Luôn dùng Surrogate Key** trong Fact và Dimension table, lưu Natural Key để reference.

---

## 6. Data Vault - Alternative Architecture

**Data Vault** (Dan Linstedt, 2000) là kiến trúc thay thế cho Kimball, phổ biến trong enterprise:

```
Hub (unique business keys) ← Link (relationships) → Hub
         ↑                                              ↑
     Satellite (attributes)                        Satellite
```

| Tiêu chí | Kimball (Star) | Data Vault |
|----------|---------------|------------|
| **Tính linh hoạt** | Khó thêm source mới | Dễ mở rộng |
| **Auditability** | Trung bình | Cao (track everything) |
| **Query complexity** | Đơn giản | Phức tạp hơn |
| **Development speed** | Nhanh hơn | Chậm hơn |
| **Phù hợp** | Midsize company | Enterprise, nhiều source |

---

## 7. Rủi ro khi Data Modeling sai

- **Dùng 3NF trong DWH**: Query chậm do quá nhiều JOIN, Analyst không tự query được
- **Không có dim_date**: Phải tính date attributes trong mỗi query, tốn CPU, khó add fiscal year
- **Không xử lý SCD**: Data analyst không biết state tại thời điểm event → báo cáo sai
- **Fact table không granular đúng**: Aggregate quá sớm → mất khả năng drill-down

---

## 8. Interview Q&A

**Q1: "Star Schema và 3NF khác nhau như thế nào?"**
> 3NF (Third Normal Form): Eliminate redundancy, optimize for writes, nhiều table nhỏ. Star Schema: Intentionally denormalized, optimize for reads, ít table hơn nhưng có redundant data. Trong DWH, reads >> writes nên Star Schema phù hợp hơn.

**Q2: "Fact Table là gì? Cho ví dụ."**
> Fact Table lưu các sự kiện có thể đo lường (measurable events) trong business. Ví dụ: fact_sales (mỗi row là 1 transaction bán hàng, chứa amount, quantity, foreign keys đến dimensions). fact_pageviews (mỗi row là 1 page view của user). Fact Table thường rất nhiều rows và immutable.

**Q3: "SCD Type 2 là gì? Tại sao quan trọng?"**
> Kỹ thuật lưu lịch sử thay đổi của Dimension: mỗi khi attribute thay đổi, thêm row mới với validity period (effective_date, expiry_date) thay vì update. Quan trọng vì: cho phép query "trạng thái của customer tại thời điểm purchase" — critical cho accurate historical reporting.

**Q4: "Surrogate Key là gì? Tại sao dùng?"**
> Integer key tổng hợp không có business meaning, được tạo ra trong DWH. Lý do dùng: 1) Natural key có thể thay đổi (email, SKU), 2) Merge nhiều source system (tránh collision), 3) Integer join nhanh hơn string, 4) SCD Type 2 cần surrogate key để phân biệt các version.

**Q5: "Granularity của Fact Table là gì?"**
> Granularity = mức độ chi tiết của mỗi row trong fact table. Ví dụ: "fact_orders" có granularity là 1 row = 1 order. "fact_order_items" có granularity là 1 row = 1 item trong order. Nguyên tắc: Chọn granularity thấp nhất có thể (chi tiết nhất) — bạn luôn có thể aggregate lên, không thể drill-down xuống.

**Q6: "Additive, Semi-additive và Non-additive Facts là gì?"**
> **Additive**: Có thể SUM theo mọi dimension. Ví dụ: revenue, quantity. **Semi-additive**: SUM được theo một số dimension. Ví dụ: account_balance (SUM theo time không có nghĩa, nhưng SUM theo customer có nghĩa). **Non-additive**: Không thể SUM. Ví dụ: ratio, percentage. → Khi thiết kế fact table, lưu raw metrics (numerator và denominator) thay vì ratio.

---

## Tài liệu tham khảo

- "The Data Warehouse Toolkit" - Ralph Kimball (kinh điển phải đọc)
- "Building a Scalable Data Warehouse with Data Vault 2.0" - Daniel Linstedt
- dbt docs: https://docs.getdbt.com/terms/dimensional-modeling
