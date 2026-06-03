# [00] Lộ trình học: Tổng Quan về Data Engineering

## Giới thiệu

Nếu bạn là một Backend Engineer (BE) đang muốn chuyển sang Data Engineer (DE), bạn đang đứng ở một vị trí **cực kỳ thuận lợi**. Nhiều kỹ năng bạn đã có (SQL, API design, hệ thống phân tán, database) là nền tảng vững chắc cho DE. Bài viết này sẽ giúp bạn hiểu rõ DE là gì, khác gì BE, và lộ trình học từng bước.

---

## 1. Data Engineer là gì? (Nguồn gốc của vai trò)

### Vì sao vai trò DE xuất hiện?

Trước năm 2010, dữ liệu của các công ty vừa và nhỏ còn tương đối ít. Một database MySQL/PostgreSQL đơn lẻ là đủ. Các báo cáo được tạo thủ công bằng Excel. **Không ai cần một "Data Engineer" chuyên biệt**.

Nhưng sau đó, cuộc cách mạng dữ liệu xảy ra:
- **Big Data bùng nổ** (2008-2012): Facebook, Google, Amazon tạo ra hàng petabyte dữ liệu mỗi ngày.
- **Business Intelligence (BI) trở thành chiến lược**: Các công ty nhận ra rằng quyết định dựa trên dữ liệu = cạnh tranh tốt hơn.
- **Machine Learning xuất hiện**: Data Scientist cần dữ liệu sạch, có cấu trúc để train model.

**Vấn đề**: Ai sẽ thu thập, làm sạch, và chuẩn bị dữ liệu đó?
- **Data Scientist**: Họ giỏi toán và ML, nhưng không muốn ngồi viết pipeline 8 tiếng/ngày.
- **Backend Engineer**: Họ biết code, nhưng không quen với data warehouse và analytical query.

→ **Data Engineer ra đời** để lấp đầy khoảng trống này.

### Định nghĩa đơn giản

> **Data Engineer** là người xây dựng và vận hành **"cơ sở hạ tầng dữ liệu"** — giống như BE xây dựng API và database, nhưng DE xây dựng **pipeline** để di chuyển dữ liệu từ nguồn → lưu trữ → phân tích.

---

## 2. DE khác gì BE? (So sánh trực tiếp)

Đây là bảng so sánh giúp bạn định vị lại bản thân:

| Tiêu chí | Backend Engineer | Data Engineer |
|----------|-----------------|---------------|
| **Mục tiêu chính** | Phục vụ request của user (API) | Phục vụ nhu cầu phân tích dữ liệu |
| **Tư duy database** | Tối ưu cho WRITE nhanh (OLTP) | Tối ưu cho READ/AGGREGATE nhanh (OLAP) |
| **Loại query** | `SELECT * FROM users WHERE id = 1` | `SELECT AVG(revenue) FROM sales GROUP BY month` |
| **Khối lượng dữ liệu** | MB → GB (per request thường nhỏ) | GB → TB → PB (batch processing lớn) |
| **Công cụ chính** | Spring Boot, Node.js, REST API | Apache Spark, Airflow, dbt, Kafka |
| **Database quan tâm** | MySQL, PostgreSQL, MongoDB | Snowflake, BigQuery, Redshift, Delta Lake |
| **"Khách hàng"** | End users (app) | Data Analyst, Data Scientist, Business |
| **Tính realtime** | Quan trọng (ms) | Thường chấp nhận delay (minutes/hours) |

### Điểm mạnh của BE khi chuyển sang DE

✅ **SQL proficiency**: Bạn đã biết SQL, chỉ cần học thêm analytical SQL (window functions, CTEs)  
✅ **API integration**: Bạn hiểu cách call API — cực kỳ hữu ích khi viết data ingestion  
✅ **System design**: Tư duy về scalability, fault tolerance áp dụng được hoàn toàn  
✅ **Git/CI-CD**: Bạn đã quen — DE cũng cần điều này  
✅ **Python**: Nếu bạn biết Python, bạn đã có 60% tool của DE  

### Điểm cần bổ sung

❗ **Distributed computing**: Spark, MapReduce — mới hoàn toàn  
❗ **Data Warehouse thinking**: OLAP, columnar storage, query optimization khác OLTP  
❗ **Data modeling**: Star schema, Snowflake schema, SCD — không giống ER diagram của BE  
❗ **Orchestration**: Airflow, Dagster — khái niệm DAG (Directed Acyclic Graph)  
❗ **Streaming**: Kafka — real-time data pipeline  

---

## 3. Data Engineering Lifecycle

Đây là vòng đời mà một DE phải nắm vững:

```
[Nguồn dữ liệu] → [Ingestion] → [Storage] → [Transformation] → [Serving]
     ↑                                                              ↓
  (DB, API,                                                   (BI Tool,
  IoT, Logs,                                                  ML Model,
  Events...)                                                  Dashboard)
```

### Chi tiết từng bước:

**1. Ingestion (Thu thập dữ liệu)**
- Kéo dữ liệu từ database của các team BE khác
- Call API từ third-party (Stripe, Salesforce, etc.)
- Đọc event từ message queue (Kafka, RabbitMQ)
- *Tương tự*: Như viết một service gọi API ngoài, nhưng scale lớn hơn nhiều

**2. Storage (Lưu trữ)**
- Chọn nơi lưu: Data Lake (raw) hay Data Warehouse (structured)?
- Format lưu trữ: Parquet? CSV? JSON? Avro?
- *Khác với BE*: Bạn không chỉ nghĩ đến một DB, mà nghĩ đến một hệ sinh thái lưu trữ

**3. Transformation (Biến đổi)**
- Làm sạch dữ liệu (remove null, fix encoding)
- Aggregate và join từ nhiều nguồn
- Tạo ra "business metrics" có ý nghĩa
- *Công cụ*: dbt (SQL-based), PySpark (large scale)

**4. Serving (Phục vụ)**
- Tạo data mart cho từng bộ phận
- Expose API cho BI tools (Tableau, Looker, Power BI)
- Cung cấp feature store cho ML team

---

## 4. Công việc hàng ngày của một DE

**Buổi sáng:**
- Kiểm tra dashboard monitoring — pipeline nào bị fail đêm qua?
- Debug và re-run các job bị lỗi
- Review alert từ hệ thống data quality

**Buổi chiều:**
- Code pipeline mới theo yêu cầu của Data Analyst
- Review PR của teammate
- Meet với business team để hiểu yêu cầu dữ liệu mới

**Thường xuyên:**
- Tối ưu query đang chạy chậm (cost optimization)
- Refactor pipeline cũ
- Documentation và data catalog

---

## 5. Lộ trình học (Roadmap)

Dưới đây là danh sách các bài viết chi tiết được lập chỉ mục và sắp xếp theo đúng lộ trình học chuẩn tại [roadmap.sh/data-engineer](https://roadmap.sh/data-engineer):

### Phase 1: Foundations (Nền tảng)
1. **Tổng quan & Định nghĩa**: [\[01\] Phase 1: Data Engineering là gì & Vòng đời dữ liệu](reader.html?post=content/data-engineering/phase-1-foundations/01-what-is-data-engineering.md) - Khám phá vòng đời dữ liệu và vai trò DE.
2. **Kỹ năng lập trình**: [\[02\] Phase 1: Python cho Data Engineering](reader.html?post=content/data-engineering/phase-1-foundations/02-python-for-de.md) - Ingest data từ API, Pandas cơ bản, định dạng Parquet.
3. **Môi trường & Hệ thống**: [\[03\] Phase 1: Linux, Shell Scripting & Git nâng cao](reader.html?post=content/data-engineering/phase-1-foundations/03-linux-and-shell.md) - Scripting, cron job và Git nâng cao.
4. **Cơ sở dữ liệu**: [\[04\] Phase 1: Lập trình SQL nâng cao cho DE](reader.html?post=content/data-engineering/phase-1-foundations/04-sql-advanced.md) - Window functions, CTEs và tối ưu hóa truy vấn.

### Phase 2: Data Storage (Lưu trữ dữ liệu)
1. **Mô hình hóa dữ liệu**: [\[05\] Phase 2: Thiết kế mô hình dữ liệu OLAP (Star/Snowflake)](reader.html?post=content/data-engineering/phase-2-data-storage/01-data-modeling-olap-oltp.md) - OLTP vs OLAP, Star/Snowflake Schema, SCD.
2. **Cơ sở dữ liệu phi quan hệ**: [\[06\] Phase 2: NoSQL Databases cho Data Engineer](reader.html?post=content/data-engineering/phase-2-data-storage/02-nosql-databases.md) - Trường hợp sử dụng MongoDB, Redis, Cassandra.
3. **Kiến trúc lưu trữ lớn**: [\[07\] Phase 2: Data Warehouse vs Data Lake vs Lakehouse](reader.html?post=content/data-engineering/phase-2-data-storage/03-data-warehouse-vs-data-lake.md) - Tiến hóa các mô hình lưu trữ lớn.
4. **Hệ quản trị Cloud DWH**: [\[08\] Phase 2: So sánh Snowflake vs BigQuery vs Redshift](reader.html?post=content/data-engineering/phase-2-data-storage/04-snowflake-bigquery-redshift.md) - Phân tích kiến trúc, chi phí và hiệu năng.

### Phase 3: Pipelines & Orchestration (Xây dựng đường ống dữ liệu)
1. **Tư duy thiết kế**: [\[09\] Phase 3: Tư duy thiết kế Pipeline (ETL vs ELT & CDC)](reader.html?post=content/data-engineering/phase-3-pipelines/01-etl-vs-elt.md) - So sánh Batch vs Streaming, Change Data Capture (CDC).
2. **Điều phối quy trình**: [\[10\] Phase 3: Điều phối Pipeline với Apache Airflow](reader.html?post=content/data-engineering/phase-3-pipelines/02-apache-airflow.md) - Xây dựng DAGs, XComs và cơ chế điều phối.
3. **Biến đổi dữ liệu**: [\[11\] Phase 3: Biến đổi dữ liệu thông minh với dbt](reader.html?post=content/data-engineering/phase-3-pipelines/03-dbt-data-build-tool.md) - SQL models, snapshots và testing tự động.
4. **Kiểm soát chất lượng**: [\[12\] Phase 3: Data Quality & Monitoring](reader.html?post=content/data-engineering/phase-3-pipelines/04-data-quality.md) - Data Contracts và framework Great Expectations.

### Phase 4: Big Data (Xử lý dữ liệu lớn)
1. **Khái niệm cốt lõi**: [\[13\] Phase 4: Hệ thống phân tán cho Data Engineer](reader.html?post=content/data-engineering/phase-4-big-data/01-distributed-computing-concepts.md) - MapReduce, CAP theorem, Serialization (Avro, Parquet).
2. **Tính toán phân tán**: [\[14\] Phase 4: Xử lý dữ liệu lớn với Apache Spark](reader.html?post=content/data-engineering/phase-4-big-data/02-apache-spark.md) - RDD, DataFrame, Spark Catalyst và PySpark jobs.
3. **Luồng dữ liệu thời gian thực**: [\[15\] Phase 4: Streaming Data với Apache Kafka](reader.html?post=content/data-engineering/phase-4-big-data/03-apache-kafka-streaming.md) - Topics, Partitions, Consumer Groups.

### Phase 5: Cloud, Containers & Governance (Công nghệ hiện đại)
1. **Hạ tầng đám mây**: [\[16\] Phase 5: Dịch vụ Cloud (AWS/GCP) & Terraform IaC](reader.html?post=content/data-engineering/phase-5-cloud-and-modern/01-cloud-platforms-aws-gcp-azure.md) - Bản đồ dịch vụ Cloud và IaC.
2. **Đóng gói & Điều phối**: [\[17\] Phase 5: Docker & Kubernetes cho Data Pipelines](reader.html?post=content/data-engineering/phase-5-cloud-and-modern/02-docker-kubernetes-for-de.md) - Triển khai compose local và Airflow/Spark trên K8s.
3. **Quản trị dữ liệu**: [\[18\] Phase 5: Data Governance và Security](reader.html?post=content/data-engineering/phase-5-cloud-and-modern/03-data-governance-and-security.md) - Masking PII, phân quyền Row/Column, Data Lineage.

---

## 6. Mức lương và cơ hội nghề nghiệp

### Tại Việt Nam (2025)
| Level | Mức lương |
|-------|-----------|
| Junior DE (0-1 năm) | 15-25 triệu/tháng |
| Mid DE (1-3 năm) | 25-45 triệu/tháng |
| Senior DE (3+ năm) | 45-80+ triệu/tháng |

### Toàn cầu (remote)
- Junior: $60k-$90k/năm
- Mid: $90k-$130k/năm  
- Senior: $130k-$200k+/năm

---

## 7. Interview Q&A - Câu hỏi thường gặp

**Q1: "DE khác gì Data Scientist?"**
> DE xây dựng cơ sở hạ tầng và pipeline để di chuyển/transform dữ liệu. Data Scientist dùng dữ liệu đó để phân tích và xây dựng model. Ngắn gọn: DE = "xây đường ống nước", DS = "người dùng nước".

**Q2: "Tại sao bạn muốn chuyển từ BE sang DE?"**
> Gợi ý: Đề cập đến tính impactful của data, muốn làm việc với large-scale data, kiến thức BE là nền tảng tốt. Tránh nói "vì lương cao hơn".

**Q3: "OLTP và OLAP khác nhau như thế nào?"**
> OLTP (Online Transaction Processing): Tối ưu cho write nhanh, row-based storage, nhiều transaction nhỏ — đây là database của BE (MySQL, PostgreSQL). OLAP (Online Analytical Processing): Tối ưu cho read/aggregate, columnar storage, ít transaction nhưng query phức tạp trên nhiều dữ liệu — đây là data warehouse.

**Q4: "Data Pipeline là gì?"**
> Là một chuỗi các bước xử lý tự động để di chuyển và transform dữ liệu từ nguồn đến đích. Giống như một dây chuyền sản xuất: nguyên liệu vào → qua nhiều bước xử lý → thành phẩm ra.

**Q5: "Batch processing vs Stream processing?"**
> Batch: Xử lý dữ liệu theo lô, theo lịch định sẵn (VD: chạy lúc 2 giờ sáng mỗi ngày). Stream: Xử lý dữ liệu real-time ngay khi có event xảy ra. Giống như: Batch = giặt quần áo vào cuối tuần, Stream = rửa bát ngay sau khi ăn.

**Q6: "Bạn xử lý data pipeline bị fail như thế nào?"**
> 1. Kiểm tra logs để xác định nguyên nhân, 2. Xác định dữ liệu nào bị ảnh hưởng, 3. Fix bug và re-run từ checkpoint (idempotent), 4. Thêm alert và monitoring để phòng tránh lần sau.

---

## Tài liệu tham khảo

- [roadmap.sh/data-engineer](https://roadmap.sh/data-engineer)
- "Fundamentals of Data Engineering" - Joe Reis & Matt Housley (O'Reilly)
- "Designing Data-Intensive Applications" - Martin Kleppmann (bắt buộc đọc)
