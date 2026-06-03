# [04] Phase 1 - Foundations: Lập trình SQL nâng cao cho DE

## Giới thiệu

Là một Backend Engineer, bạn đã biết SQL cơ bản: `SELECT`, `JOIN`, `WHERE`, `GROUP BY`. Nhưng SQL của Data Engineer hoạt động ở một tầm khác — bạn sẽ viết query trên **hàng triệu, thậm chí hàng tỷ dòng**, và một query viết tệ có thể tốn của công ty **hàng trăm đô la tiền cloud**.

---

## 1. Nguồn gốc và lý do SQL quan trọng với DE

### Tại sao SQL không "chết" trong kỷ nguyên Big Data?

Khi Hadoop/MapReduce xuất hiện (2006), nhiều người nghĩ SQL sẽ bị thay thế bởi Java/Python MapReduce code. **Thực tế ngược lại** đã xảy ra:

- 2008: **Hive** ra đời (Facebook) — SQL on top of Hadoop
- 2012: **Spark SQL** ra đời — SQL trên distributed engine mạnh hơn
- 2014: **Presto/Trino** ra đời (Facebook) — Distributed SQL query engine
- 2016+: **BigQuery, Snowflake, Redshift** — Data Warehouse hoàn toàn dùng SQL

**Lý do SQL "sống sót"**: Nó là ngôn ngữ chung mà cả kỹ sư lẫn business analyst có thể dùng. Thay vì bắt mọi người học Python, dễ hơn là dạy họ SQL.

> **Với DE**: SQL không chỉ là công cụ query, mà là **ngôn ngữ transformation chính** (đặc biệt khi dùng dbt).

---

## 2. Những gì BE thường biết vs DE cần biết

| Loại SQL | BE thường dùng | DE cần thành thạo |
|----------|---------------|-------------------|
| Basic SELECT | ✅ | ✅ |
| JOIN (INNER, LEFT) | ✅ | ✅ |
| GROUP BY | ✅ | ✅ |
| Subquery | ⚠️ (ít dùng) | ✅✅ |
| **Window Functions** | ❌ (hiếm gặp) | ✅✅✅ |
| **CTE (WITH clause)** | ❌ | ✅✅✅ |
| **EXPLAIN / Query Plan** | ⚠️ | ✅✅✅ |
| **Partitioning & Clustering** | ❌ | ✅✅✅ |
| **UNNEST / LATERAL JOIN** | ❌ | ✅✅ |

---

## 3. Window Functions - "Vũ khí bí mật" của DE

### Vấn đề trước khi có Window Functions

Giả sử bạn muốn tính **doanh thu tích lũy (running total)** theo ngày, VÀ đồng thời giữ lại doanh thu từng ngày:

```sql
-- Cách cũ (trước Window Functions): Cần subquery phức tạp
SELECT 
    t1.date,
    t1.revenue,
    (SELECT SUM(t2.revenue) 
     FROM sales t2 
     WHERE t2.date <= t1.date) AS running_total
FROM sales t1
ORDER BY t1.date;
```

**Vấn đề**: Query này là O(n²) — với 1 triệu dòng, nó thực hiện 1 triệu lần subquery!

### Giải pháp: Window Functions

```sql
-- Cách mới (Window Functions): Tính trong 1 lần scan
SELECT 
    date,
    revenue,
    SUM(revenue) OVER (ORDER BY date) AS running_total,
    AVG(revenue) OVER (ORDER BY date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) AS moving_avg_7day
FROM sales
ORDER BY date;
```

**Window Functions không group rows lại** — chúng tính toán trên một "cửa sổ" (window) trong khi vẫn giữ nguyên từng dòng.

### Cú pháp tổng quát

```sql
function_name(column) OVER (
    PARTITION BY column1, column2    -- Chia thành nhóm (như GROUP BY nhưng không collapse)
    ORDER BY column3                  -- Thứ tự trong cửa sổ
    ROWS/RANGE BETWEEN ... AND ...   -- Kích thước cửa sổ
)
```

### Các Window Functions quan trọng nhất

```sql
-- 1. ROW_NUMBER(): Đánh số thứ tự trong mỗi partition
SELECT 
    user_id,
    order_date,
    amount,
    ROW_NUMBER() OVER (PARTITION BY user_id ORDER BY order_date) AS order_sequence
FROM orders;
-- Dùng để: Lấy đơn hàng đầu tiên của mỗi user

-- 2. RANK() vs DENSE_RANK()
-- RANK: 1, 2, 2, 4 (bỏ qua số 3)
-- DENSE_RANK: 1, 2, 2, 3 (không bỏ qua)
SELECT 
    product_name,
    revenue,
    RANK() OVER (ORDER BY revenue DESC) AS rank,
    DENSE_RANK() OVER (ORDER BY revenue DESC) AS dense_rank
FROM products;

-- 3. LAG() và LEAD(): Truy cập dòng trước/sau
SELECT 
    date,
    revenue,
    LAG(revenue, 1) OVER (ORDER BY date) AS prev_day_revenue,
    revenue - LAG(revenue, 1) OVER (ORDER BY date) AS day_over_day_change,
    LEAD(revenue, 1) OVER (ORDER BY date) AS next_day_revenue
FROM daily_sales;
-- Dùng để: Tính % thay đổi so với ngày trước

-- 4. FIRST_VALUE() và LAST_VALUE()
SELECT 
    user_id,
    session_date,
    FIRST_VALUE(session_date) OVER (
        PARTITION BY user_id ORDER BY session_date
    ) AS first_session_date
FROM user_sessions;
-- Dùng để: Tìm ngày đầu tiên user dùng app (acquisition date)

-- 5. NTILE(): Chia thành n phần bằng nhau
SELECT 
    customer_id,
    total_spend,
    NTILE(4) OVER (ORDER BY total_spend DESC) AS spend_quartile
FROM customer_summary;
-- Quartile 1 = top 25% customers (VIP)
-- Dùng để: Phân khúc khách hàng
```

### Ví dụ thực tế: Deduplicate (Loại bỏ dữ liệu trùng lặp)

```sql
-- Tình huống: Bảng events có duplicate rows, giữ lại dòng mới nhất
WITH ranked_events AS (
    SELECT 
        *,
        ROW_NUMBER() OVER (
            PARTITION BY user_id, event_type 
            ORDER BY event_timestamp DESC
        ) AS rn
    FROM raw_events
)
SELECT * FROM ranked_events WHERE rn = 1;
```

---

## 4. CTEs (Common Table Expressions) - Code có thể đọc được

### Vấn đề của Subquery lồng nhau

```sql
-- Khó đọc, khó debug, khó maintain
SELECT * FROM (
    SELECT user_id, SUM(amount) as total FROM (
        SELECT * FROM orders WHERE status = 'completed'
    ) completed_orders
    GROUP BY user_id
) user_totals
WHERE total > 1000;
```

### Giải pháp: CTEs

```sql
-- Dễ đọc, logic rõ ràng, có thể reuse
WITH completed_orders AS (
    SELECT * FROM orders WHERE status = 'completed'
),
user_totals AS (
    SELECT user_id, SUM(amount) AS total
    FROM completed_orders
    GROUP BY user_id
),
high_value_users AS (
    SELECT * FROM user_totals WHERE total > 1000
)
SELECT 
    u.user_id,
    u.name,
    hvt.total
FROM high_value_users hvt
JOIN users u ON u.id = hvt.user_id;
```

**Lợi ích của CTE:**
- ✅ Đọc như "story" từ trên xuống dưới
- ✅ Mỗi CTE có thể test độc lập
- ✅ Có thể reference một CTE nhiều lần
- ✅ dbt hoạt động dựa hoàn toàn trên CTE

### Recursive CTE: Duyệt cây phân cấp

```sql
-- Tìm tất cả nhân viên trong một department (kể cả sub-department)
WITH RECURSIVE org_hierarchy AS (
    -- Base case: bắt đầu từ root
    SELECT employee_id, manager_id, name, 1 AS level
    FROM employees
    WHERE manager_id IS NULL
    
    UNION ALL
    
    -- Recursive case: tìm employee con
    SELECT e.employee_id, e.manager_id, e.name, oh.level + 1
    FROM employees e
    JOIN org_hierarchy oh ON e.manager_id = oh.employee_id
)
SELECT * FROM org_hierarchy ORDER BY level, name;
```

---

## 5. Query Optimization - Tiết kiệm tiền cloud

Trong Data Warehouse như BigQuery hay Snowflake, bạn **trả tiền theo lượng data được scan**. Query tệ = tốn tiền thật sự.

### Nguyên tắc 1: Chỉ SELECT cột cần thiết

```sql
-- BAD: Scan toàn bộ bảng (100 cột)
SELECT * FROM orders;

-- GOOD: Chỉ scan 3 cột
SELECT order_id, amount, status FROM orders;

-- Lý do: Data Warehouse dùng Columnar Storage (lưu theo cột, không theo hàng)
-- SELECT * buộc scan tất cả cột = tốn gấp 30x tiền
```

### Nguyên tắc 2: Filter sớm (Predicate Pushdown)

```sql
-- BAD: Join trước, filter sau
SELECT o.*, u.email
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status = 'completed' AND o.created_at >= '2024-01-01';

-- GOOD: Filter trước khi join (giảm lượng data cần join)
WITH recent_completed_orders AS (
    SELECT * FROM orders
    WHERE status = 'completed' 
    AND created_at >= '2024-01-01'  -- Filter trước!
)
SELECT o.*, u.email
FROM recent_completed_orders o
JOIN users u ON o.user_id = u.id;
```

### Nguyên tắc 3: Tận dụng Partitioning

```sql
-- BigQuery: Bảng được partition theo date
-- BAD: Scan toàn bộ lịch sử
SELECT SUM(revenue) FROM sales;

-- GOOD: Chỉ scan partition của tháng này
SELECT SUM(revenue) FROM sales
WHERE DATE(created_at) >= DATE_TRUNC(CURRENT_DATE(), MONTH);
-- Chi phí giảm từ 100x → 1x
```

### Cách đọc EXPLAIN (Query Plan)

```sql
-- PostgreSQL
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123;

-- Kết quả sẽ cho thấy:
-- "Seq Scan" = quét toàn bộ bảng (BAD nếu data lớn)
-- "Index Scan" = dùng index (GOOD)
-- "Hash Join" vs "Nested Loop" = join strategy
-- Actual Time = thời gian thực tế chạy

-- BigQuery: Xem Query Execution Details trong UI
-- Snowflake: EXPLAIN và Query Profile
```

---

## 6. Analytical Patterns thường gặp trong DE

### Pattern 1: Cohort Analysis (Phân tích nhóm người dùng)

```sql
-- Phân tích retention: Người dùng đăng ký tháng nào vẫn còn dùng app?
WITH user_cohorts AS (
    SELECT 
        user_id,
        DATE_TRUNC('month', first_session_date) AS cohort_month
    FROM user_first_sessions
),
monthly_activity AS (
    SELECT 
        user_id,
        DATE_TRUNC('month', session_date) AS activity_month
    FROM user_sessions
)
SELECT 
    uc.cohort_month,
    DATEDIFF('month', uc.cohort_month, ma.activity_month) AS months_since_signup,
    COUNT(DISTINCT ma.user_id) AS active_users
FROM user_cohorts uc
JOIN monthly_activity ma ON uc.user_id = ma.user_id
GROUP BY 1, 2
ORDER BY 1, 2;
```

### Pattern 2: Sessionization (Chia phiên truy cập)

```sql
-- Chia các events thành sessions (nếu gap > 30 phút = session mới)
WITH events_with_gap AS (
    SELECT 
        user_id,
        event_timestamp,
        LAG(event_timestamp) OVER (PARTITION BY user_id ORDER BY event_timestamp) AS prev_event_time,
        DATEDIFF('minute', prev_event_time, event_timestamp) AS minutes_since_last_event
    FROM user_events
),
session_starts AS (
    SELECT 
        *,
        CASE WHEN minutes_since_last_event IS NULL OR minutes_since_last_event > 30 
             THEN 1 ELSE 0 END AS is_session_start
    FROM events_with_gap
)
SELECT 
    user_id,
    event_timestamp,
    SUM(is_session_start) OVER (PARTITION BY user_id ORDER BY event_timestamp) AS session_id
FROM session_starts;
```

### Pattern 3: Funnel Analysis (Phân tích phễu chuyển đổi)

```sql
-- Tỷ lệ chuyển đổi: View → Add to Cart → Purchase
WITH funnel AS (
    SELECT 
        user_id,
        MAX(CASE WHEN event = 'product_view' THEN 1 ELSE 0 END) AS did_view,
        MAX(CASE WHEN event = 'add_to_cart' THEN 1 ELSE 0 END) AS did_add_cart,
        MAX(CASE WHEN event = 'purchase' THEN 1 ELSE 0 END) AS did_purchase
    FROM events
    WHERE event_date >= CURRENT_DATE - 30
    GROUP BY user_id
)
SELECT 
    SUM(did_view) AS viewers,
    SUM(did_add_cart) AS cart_adders,
    SUM(did_purchase) AS purchasers,
    ROUND(100.0 * SUM(did_add_cart) / NULLIF(SUM(did_view), 0), 2) AS view_to_cart_pct,
    ROUND(100.0 * SUM(did_purchase) / NULLIF(SUM(did_add_cart), 0), 2) AS cart_to_purchase_pct
FROM funnel;
```

---

## 7. Rủi ro khi không thành thạo SQL trong DE

- **Pipeline chậm**: Query không optimize = job chạy 2 giờ thay vì 5 phút, ảnh hưởng SLA
- **Tốn tiền cloud**: BigQuery/Snowflake tính tiền theo data scanned — query tệ có thể tốn $1000/ngày
- **Data sai**: Không hiểu NULL handling → kết quả aggregate sai → business ra quyết định sai
- **Không debug được**: Không đọc được EXPLAIN → không biết tại sao query chậm

---

## 8. Interview Q&A

**Q1: "Sự khác biệt giữa WHERE và HAVING?"**
> WHERE filter **trước** khi GROUP BY (filter trên raw data). HAVING filter **sau** khi GROUP BY (filter trên aggregated result). Ví dụ: `WHERE amount > 100` vs `HAVING SUM(amount) > 1000`.

**Q2: "Window Function khác GROUP BY như thế nào?"**
> GROUP BY **collapse** nhiều dòng thành 1 dòng (mất detail). Window Function **giữ nguyên** số dòng nhưng thêm cột tính toán. Ví dụ: `GROUP BY user_id` cho 1 dòng/user. `PARTITION BY user_id` trong window function cho nhiều dòng/user nhưng mỗi dòng có thêm aggregate value.

**Q3: "Khi nào dùng CTE vs Subquery vs Temporary Table?"**
> CTE: Khi cần readable code, logic nhiều bước, hoặc recursive query. Subquery: Query đơn giản, 1-2 cấp lồng nhau. Temp Table: Khi cần dùng result nhiều lần trong session (CTE có thể bị recalculate mỗi lần reference).

**Q4: "Giải thích Columnar Storage là gì và tại sao nó quan trọng với DE?"**
> Columnar Storage lưu dữ liệu theo cột thay vì theo hàng. Ví dụ: Bảng 1 triệu hàng, 100 cột. Row-based: đọc cả hàng kể cả chỉ cần 1 cột. Columnar: Chỉ đọc đúng cột cần thiết. Điều này giúp analytical query (SELECT AVG(amount)) nhanh gấp 10-100x và nén dữ liệu tốt hơn.

**Q5: "NULLIF() dùng để làm gì?"**
> Tránh lỗi division by zero. `NULLIF(a, b)` trả về NULL nếu a = b, ngược lại trả về a. Trong DE thường dùng: `100.0 * numerator / NULLIF(denominator, 0)` — khi denominator = 0, kết quả là NULL thay vì error.

**Q6: "Bạn sẽ làm gì nếu query chạy rất chậm trên BigQuery?"**
> 1. Check Query Execution Details để xem bytes scanned, 2. Đảm bảo có filter trên partition column (date), 3. Tránh SELECT *, chỉ select cột cần, 4. Check JOIN size — join 2 bảng lớn tốn nhiều, 5. Xem xét materialize intermediate results, 6. Check nếu có thể thêm clustering.

**Q7: "Partitioning và Clustering khác nhau thế nào?"**
> **Partitioning**: Chia bảng thành nhiều file vật lý theo giá trị (VD: partition by date). Query có filter partition sẽ skip các partition không liên quan → giảm data scanned. **Clustering**: Sắp xếp data trong partition theo thứ tự (VD: cluster by user_id). Giúp BigQuery skip blocks không liên quan trong 1 partition.

---

## Tài liệu tham khảo

- [Use the window functions - BigQuery docs](https://cloud.google.com/bigquery/docs/reference/standard-sql/window-function-calls)
- [SQL for Data Analysis - O'Reilly](https://www.oreilly.com/library/view/sql-for-data/9781492088776/)
- Mode SQL Tutorial: https://mode.com/sql-tutorial/
