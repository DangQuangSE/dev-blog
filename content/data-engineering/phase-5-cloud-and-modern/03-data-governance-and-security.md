# Data Governance và Security trong Data Engineering

## Giới thiệu

Là một Backend Engineer (BE), bạn đã quen thuộc với việc bảo mật ứng dụng: mã hóa mật khẩu, JWT token, phân quyền API (RBAC) và ngăn chặn SQL Injection. Tuy nhiên, khi bước sang thế giới Data Engineering (DE), khái niệm bảo mật và quản trị dữ liệu (Data Governance) mở rộng ra một quy mô hoàn toàn khác.

Trong hệ thống Backend, chỉ có ứng dụng (Application) truy cập trực tiếp vào cơ sở dữ liệu. Nhưng trong Data Platform, dữ liệu được truy cập bởi hàng trăm con người (Data Analysts, Data Scientists, Product Managers, C-level) và hàng chục hệ thống tự động (BI Tools, ML Models, SaaS Integrations). Làm sao để đảm bảo dữ liệu nhạy cảm của khách hàng không bị rò rỉ, hệ thống tuân thủ các điều luật quốc tế (GDPR, CCPA), và mọi người trong công ty đều tìm được đúng dữ liệu họ cần?

Bài viết này sẽ đi sâu vào **Data Governance** và **Security** từ góc nhìn của một kỹ sư Backend chuyển sang làm Data.

---

## 1. Tại sao cần Data Governance & Security?

### Vấn đề khi thiếu quản trị (The Data Swamp)

Khi một Data Platform phát triển không có sự kiểm soát, nó rất dễ biến từ **Data Lake** (Hồ dữ liệu) thành **Data Swamp** (Đầm lầy dữ liệu):

```
Thiếu Governance:
├── Data Analyst: "Bảng này có cột 'email' của user, tôi cần dùng để gửi campaign." (Rò rỉ PII)
├── Data Scientist: "Tôi tìm thấy 5 bảng tên là 'users_clean', không biết bảng nào là bản chuẩn mới nhất?"
├── Analytics Engineer: "Tôi vừa sửa kiểu dữ liệu của cột 'user_id' ở staging, không ngờ làm hỏng luôn dashboard doanh thu của CEO."
└── Legal Team: "Khách hàng yêu cầu xóa toàn bộ dữ liệu của họ (Right to be Forgotten - GDPR), làm sao để xóa sạch trong 10TB dữ liệu phân tán?"
```

### Rủi ro và Hậu quả
- **Pháp lý & Tài chính**: Vi phạm GDPR/CCPA có thể dẫn tới mức phạt lên tới 4% doanh thu toàn cầu năm của doanh nghiệp.
- **Mất niềm tin vào dữ liệu**: Khi các phòng ban tính toán ra các con số doanh thu khác nhau từ các bảng khác nhau, dữ liệu không còn giá trị để ra quyết định.
- **Rò rỉ dữ liệu (Data Breach)**: Cấp quyền quá rộng (Over-privileged) cho nhân viên hoặc service accounts dẫn tới việc lộ thông tin thẻ tín dụng, mật khẩu hoặc thông tin cá nhân (PII).

---

## 2. Bảo mật dữ liệu (Data Security) trong DE

Bảo mật dữ liệu trong DE tập trung vào ba trụ cột: **Phát hiện PII**, **Mã hóa/Ẩn danh dữ liệu**, và **Kiểm soát truy cập (Access Control)**.

### A. Quản lý thông tin định danh cá nhân (PII - Personally Identifiable Information)

PII bao gồm: Email, Số điện thoại, Địa chỉ, Số CCCD/SSN, Tên thật. Nhiệm vụ của DE là phải ẩn danh (Anonymize) hoặc mã hóa dữ liệu này ngay tại cửa ngõ khi nạp vào Data Platform (Ingestion Phase).

#### Các kỹ thuật xử lý PII phổ biến:
1. **Masking (Che giấu)**: Thay thế một phần dữ liệu bằng các ký tự đặc biệt (ví dụ: `john.doe@gmail.com` -> `j***e@gmail.com`).
2. **Hashing (Băm có muối - Salted Hashing)**: Băm dữ liệu bằng SHA-256 kèm theo một khóa bí mật (salt). Giúp giữ nguyên tính chất duy nhất của trường để JOIN dữ liệu nhưng không lộ giá trị thật.
3. **Encryption (Mã hóa)**: Dùng thuật toán mã hóa đối xứng (AES-256). Chỉ những người có khóa giải mã mới xem được dữ liệu gốc.

##### Code ví dụ: Python Pipeline thực hiện Hashing & Masking PII trước khi lưu vào Data Lake

```python
import hashlib
import os
import pandas as pd

# Secret Salt lấy từ Environment Variable bí mật
SALT = os.environ.get("PII_SALT", "super-secret-salt-string").encode('utf-8')

def mask_email(email: str) -> str:
    """Mask email giữ lại ký tự đầu, cuối của username và domain."""
    if not isinstance(email, str) or "@" not in email:
        return "invalid-email"
    username, domain = email.split("@", 1)
    if len(username) <= 2:
        return f"*@{domain}"
    return f"{username[0]}***{username[-1]}@{domain}"

def hash_phone(phone: str) -> str:
    """Hash số điện thoại dùng SHA-256 kèm Salt để có thể JOIN nhưng không lộ số gốc."""
    if not phone:
        return ""
    # Clean phone number (bỏ khoảng trắng, dấu cộng)
    cleaned_phone = "".join(filter(str.isdigit, str(phone)))
    hasher = hashlib.sha256()
    hasher.update(cleaned_phone.encode('utf-8') + SALT)
    return hasher.hexdigest()

# Simulate raw data ingestion
raw_data = pd.DataFrame({
    "user_id": [101, 102, 103],
    "name": ["Nguyen Van A", "Tran Thi B", "John Doe"],
    "email": ["nva@gmail.com", "tran.b@company.com", "jd@yahoo.com"],
    "phone": ["+84901234567", "0912345678", "1-555-0199"]
})

# Process data
processed_data = raw_data.copy()
processed_data["email"] = processed_data["email"].apply(mask_email)
processed_data["phone_hash"] = processed_data["phone"].apply(hash_phone)
# Drop hoàn toàn cột nhạy cảm gốc
processed_data.drop(columns=["name", "phone"], inplace=True)

print("--- RAW DATA ---")
print(raw_data)
print("\n--- PROCESSED DATA (SAFE FOR DATA LAKE) ---")
print(processed_data)
```

---

### B. Access Control ở mức độ hạt mịn (Fine-grained Access Control)

Không giống như ứng dụng Backend thường kết nối database bằng một user duy nhất có quyền đọc ghi, Data Warehouse yêu cầu phân quyền chi tiết đến từng cột (Column-level) và từng dòng (Row-level).

| Loại Security | Ý nghĩa | Ví dụ thực tế |
| :--- | :--- | :--- |
| **RBAC (Role-based)** | Gán quyền truy cập bảng dựa trên vai trò của user. | Chỉ vai trò `Finance_Analyst` mới được xem bảng `transactions`. |
| **Column-level Security** | Ẩn hoặc mã hóa một số cột nhạy cảm đối với các role không đủ quyền. | Role `Marketing` xem được bảng `users` nhưng cột `card_number` bị hiển thị thành chuỗi `XXXX-XXXX-XXXX-XXXX` (Dynamic Data Masking). |
| **Row-level Security (RLS)** | Giới hạn các dòng dữ liệu mà một user được xem dựa trên thuộc tính của họ. | Nhân viên sales ở khu vực `APAC` chỉ xem được các dòng đơn hàng có `region = 'APAC'`. |

#### Demo: Cấu hình Column-level & Row-level Security bằng SQL trên Cloud Data Warehouse (ví dụ Snowflake/BigQuery syntax)

##### 1. Column-level Security (Dynamic Data Masking trong Snowflake)
```sql
-- Tạo chính sách ẩn danh dữ liệu (Masking Policy)
CREATE OR REPLACE MASKING POLICY email_mask AS (val string) RETURNS string ->
  CASE
    -- Nếu user thuộc role ACCOUNTADMIN hoặc SECURITYADMIN thì xem được email gốc
    WHEN CURRENT_ROLE() IN ('ACCOUNTADMIN', 'HR_MANAGER') THEN val
    -- Các role khác chỉ thấy email bị che
    ELSE REGEXP_REPLACE(val, '^([^@]{1,2})[^@]*(@.*)$', '\\1***\\2')
  END;

-- Áp dụng Masking Policy vào cột email của bảng users
ALTER TABLE production.analytics.users 
  MODIFY COLUMN email SET MASKING POLICY email_mask;
```

##### 2. Row-level Security (Row Access Policy trong BigQuery/Snowflake)
```sql
-- Tạo bảng phân quyền theo vùng miền (Mapping Table)
CREATE OR REPLACE TABLE security.region_entitlements (
  user_email STRING,
  allowed_region STRING
);

INSERT INTO security.region_entitlements VALUES
('vietnam_lead@company.com', 'VN'),
('us_lead@company.com', 'US');

-- Tạo Row Access Policy trên bảng sales_data
CREATE OR REPLACE ROW ACCESS POLICY regional_sales_policy
ON sales.orders
FILTER USING (
  -- Cho phép Admin xem toàn bộ, hoặc user chỉ được xem dữ liệu vùng được cấp phép
  CURRENT_USER() IN (SELECT user_email FROM security.region_entitlements WHERE allowed_region = region)
  OR CURRENT_ROLE() = 'GLOBAL_ADMIN'
);
```

---

## 3. Data Catalog & Metadata Management

### Vấn đề "Tìm kiếm dữ liệu"
Trong Backend, khi bạn muốn biết cấu trúc bảng `orders`, bạn chỉ cần mở file `schema.prisma` hoặc `models.py`. Nhưng trong một công ty lớn có:
- 10+ MySQL/Postgres databases cho Microservices.
- 5,000+ Parquet files trên AWS S3.
- 2,000+ Bảng trong BigQuery.
- 500+ Báo cáo trên Tableau/Looker.

Làm sao một Data Analyst mới vào biết được bảng nào chứa thông tin "Doanh thu thực tế sau thuế" để làm báo cáo? Nếu họ lấy nhầm bảng nháp, báo cáo sẽ sai lệch.

### Giải pháp: Data Catalog
**Data Catalog** là một danh bạ tìm kiếm (Search Engine) dành riêng cho dữ liệu của doanh nghiệp. Nó tự động thu thập metadata từ Data Sources và cung cấp giao diện trực quan.

```
Data Source (Postgres, S3, BigQuery)
       │
       ▼ (Metadata Extractor)
┌────────────────────────────────────────────────────────┐
│                     DATA CATALOG                       │
│  - Search: "revenue" -> Trả về bảng `fact_sales`       │
│  - Owner: ai chịu trách nhiệm về bảng này?             │
│  - Schema: ý nghĩa của cột `net_amount` là gì?          │
│  - Freshness: Dữ liệu được cập nhật lúc nào?           │
│  - Data Quality Score: 98% qua test                    │
└────────────────────────────────────────────────────────┘
```

### Các công cụ Data Catalog phổ biến:
- **DataHub** (Open-source phát triển bởi LinkedIn, rất mạnh mẽ với Push-based metadata).
- **Amundsen** (Open-source phát triển bởi Lyft, tập trung vào trải nghiệm người dùng tối giản).
- **Apache Atlas** (Tích hợp sâu trong hệ sinh thái Hadoop).

---

## 4. Data Lineage (Nguồn gốc Dữ liệu)

### Data Lineage là gì?
Data Lineage là bản đồ chỉ ra luồng đi của dữ liệu từ nguồn gốc (Source) qua các bước biến đổi (Transformations) đến đích cuối (BI Dashboard, ML Model).

```
[Postgres Users] ──(Fivetran)──> [stg_users] ──(dbt run)──> [dim_users] ──(Looker)──> [Active Users Dashboard]
```

### Tại sao Data Lineage cực kỳ quan trọng cho DE?

#### 1. Tracing Lỗi (Root Cause Analysis)
Khi Analyst báo: "Số liệu doanh thu trên Dashboard hôm nay bị tụt 50%, có gì đó sai sai!".
- **Nếu không có Lineage**: Bạn phải ngồi mò từng dòng code SQL, dò lại Airflow DAGs để xem bước nào bị lỗi. Mất nửa ngày.
- **Nếu có Lineage**: Bạn nhìn vào sơ đồ, thấy ngay bảng trung gian `fct_orders` có một test của dbt bị fail ở cột `price`. Dễ dàng trace ngược lại hệ thống Backend vừa thay đổi cấu trúc API truyền về.

#### 2. Phân tích tác động (Impact Analysis)
Bạn chuẩn bị xóa cột `middle_name` trong bảng database Backend của microservice.
- **Nếu không có Lineage**: Bạn xóa bừa và cầu nguyện không có gì sập trên DWH.
- **Nếu có Lineage**: Bạn search tên cột trên công cụ Lineage, hệ thống cảnh báo: *"Cột này đang được dùng bởi Pipeline X để tạo bảng Y, bảng Y dùng cho Dashboard Z của bộ phận HR"*. Bạn biết mình cần liên hệ với ai để cập nhật code trước khi xóa.

### Cách triển khai Data Lineage
- **dbt Lineage**: Tự động sinh ra đồ thị DAG của các models SQL trong dbt (rất mạnh ở tầng biến đổi DWH).
- **OpenLineage**: Một chuẩn chung (Open Standard) để thu thập metadata runtime từ Spark, Airflow, Flink, v.v. giúp vẽ bức tranh toàn cảnh xuyên suốt các hệ thống khác nhau.

---

## 5. Data Retention & Lifecycle Policies

Trong Backend, chúng ta thường lưu dữ liệu mãi mãi trong DB chính, hoặc thỉnh thoảng backup rồi cất vào đâu đó. Trong DE, dung lượng dữ liệu tăng lên theo hàm số mũ. Việc lưu trữ dữ liệu không dùng tới (Cold Data) trên các ổ cứng tốc độ cao (SSD) của Data Warehouse là cực kỳ lãng phí.

### Chiến lược phân tầng dữ liệu (Data Tiering)

```
                       Dữ liệu mới (0 - 30 ngày)
                       [ HOT STORAGE ]
                       - Ví dụ: BigQuery Active Table, Amazon EBS
                       - Tốc độ cực nhanh, giá đắt.
                               │
                               ▼ (Sau 30 ngày)
                       Dữ liệu lịch sử (1 - 12 tháng)
                       [ WARM STORAGE ]
                       - Ví dụ: Standard S3, GCS Standard class, Iceberg
                       - Dùng cho báo cáo tháng/quý.
                               │
                               ▼ (Sau 1 năm)
                       Dữ liệu lưu trữ bắt buộc (1 - 7 năm)
                       [ COLD / ARCHIVE STORAGE ]
                       - Ví dụ: Amazon S3 Glacier, GCS Archive
                       - Rất rẻ, mất vài giờ để khôi phục khi cần đọc.
```

### Cấu hình Lifecycle Policy tự động trên Cloud (ví dụ AWS S3 Lifecycle Configuration)

Sử dụng Terraform để định nghĩa quy tắc: Tự động chuyển dữ liệu log từ Standard Storage sang Glacier sau 90 ngày, và xóa hoàn toàn sau 365 ngày để tuân thủ luật bảo vệ dữ liệu.

```hcl
# main.tf
resource "aws_s3_bucket" "data_lake" {
  bucket = "company-data-lake-prod"
}

resource "aws_s3_bucket_lifecycle_configuration" "lake_lifecycle" {
  bucket = aws_s3_bucket.data_lake.id

  rule {
    id     = "archive-and-cleanup-logs"
    status = "Enabled"

    filter {
      prefix = "logs/" # Áp dụng cho các folder chứa log hệ thống
    }

    # Chuyển sang S3 Glacier (Cold Storage) sau 90 ngày để giảm 70% chi phí
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Xóa vĩnh viễn sau 365 ngày (Luật an toàn thông tin quy định)
    expiration {
      days = 365
    }
  }
}
```

---

## 6. Rủi ro khi thiết lập Governance & Security sai cách

- **Quản lý khóa mã hóa yếu kém**: Mã hóa toàn bộ dữ liệu bằng một khóa duy nhất được hardcode trong code. Nếu lộ khóa này, toàn bộ dữ liệu coi như mất trắng. Hãy dùng các dịch vụ quản lý khóa như AWS KMS hoặc GCP KMS kèm theo cơ chế xoay vòng khóa tự động (Key Rotation).
- **Mã hóa bất đối xứng không đồng bộ (Consistency Issue)**: Bảng khách hàng ở hệ thống A băm email bằng `MD5`, hệ thống B băm bằng `SHA-256`. Khi đưa lên Data Lake, hai bảng này không thể JOIN với nhau qua trường email được nữa. Cần phải thống nhất tiêu chuẩn mã hóa/băm trên toàn công ty.
- **Governance quá chặt chẽ gây nghẽn cổ chai (Governance Bottleneck)**: Bắt buộc Data Analyst phải xin phê duyệt qua 3 cấp để đọc một bảng nháp. Điều này làm giảm tốc độ phát triển của doanh nghiệp. Cần cân bằng giữa tính bảo mật và tính tự phục vụ (Self-service analytics).

---

## 7. Interview Q&A

**Q1: "Sự khác biệt giữa Data Anonymization (Ẩn danh hóa) và Data Pseudo-anonymization (Giả ẩn danh hóa) là gì?"**
> - **Data Anonymization**: Là quá trình loại bỏ hoàn toàn khả năng định danh cá nhân khỏi dữ liệu và **không thể đảo ngược** (irreversible). Ví dụ: Xóa hẳn cột tên và chỉ giữ lại độ tuổi trung bình theo vùng. Dữ liệu này không còn chịu sự ràng buộc nghiêm ngặt của GDPR.
> - **Data Pseudo-anonymization**: Thay thế các trường nhận dạng bằng bí danh (pseudonyms) như Hash Code hoặc ID ngẫu nhiên. Quá trình này **có thể đảo ngược** (reversible) nếu truy cập được vào bảng mapping hoặc khóa giải mã. Dữ liệu này vẫn được coi là thông tin cá nhân và phải tuân thủ các quy định bảo mật.

**Q2: "Làm thế nào để bạn xử lý yêu cầu 'Right to be Forgotten' (Quyền được xóa dữ liệu) của GDPR trong một hệ thống lưu trữ phân tán lớn như Apache Spark + S3?"**
> Đây là một thử thách lớn vì dữ liệu trên S3 thường lưu dưới dạng Parquet/ORC immutable files. Việc cập nhật/xóa 1 dòng yêu cầu phải đọc file cũ lên, lọc bỏ dòng đó, ghi lại file mới. Cách xử lý hiệu quả:
> 1. **Sử dụng Lakehouse formats (Delta Lake, Apache Iceberg)**: Hỗ trợ lệnh `DELETE FROM table WHERE user_id = X` nguyên tử (ACID). Nó sẽ tự động xử lý việc viết lại các data files ở background.
> 2. **Kiến trúc Crypto-shredding (Mã hóa hủy khóa)**: Mỗi khách hàng có một khóa mã hóa riêng cho thông tin PII của họ. Khi khách hàng yêu cầu xóa dữ liệu, ta chỉ cần xóa khóa giải mã của khách hàng đó trong Key Store. Dữ liệu mã hóa trên S3 vẫn tồn tại nhưng đã trở thành rác vô nghĩa vĩnh viễn (không thể giải mã). Đây là giải pháp nhanh nhất ở quy mô lớn.

**Q3: "Hãy phân biệt Column-level Security và Dynamic Data Masking."**
> - **Column-level Security**: Chặn đứng quyền truy cập vào cột đó. Nếu user không có quyền chạy lệnh `SELECT ssn FROM employees`, hệ thống sẽ trả về lỗi phân quyền ngay lập tức.
> - **Dynamic Data Masking (DDM)**: Vẫn cho phép user chạy truy vấn, nhưng dữ liệu trả về của cột đó đã bị biến đổi lúc runtime. Ví dụ: Cột `phone` trả về giá trị `XXXX-XX-1234` thay vì số gốc. DDM bảo vệ dữ liệu hiển thị mà không làm gãy các truy vấn SQL hiện tại của ứng dụng.

**Q4: "Khi thiết kế một Data Pipeline, bạn sẽ triển khai cơ chế kiểm tra chất lượng dữ liệu (Data Quality) như thế nào để phục vụ Data Governance?"**
> Tôi sẽ chia Data Quality làm 3 tầng bảo vệ:
> 1. **Ingestion Level (Schema Validation)**: Dùng schema registry (ví dụ Confluent Schema Registry cho Kafka) để từ chối các message không đúng định dạng.
> 2. **Transformation Level (Assertion/Testing)**: Sử dụng các công cụ như `dbt test` hoặc `Great Expectations` để kiểm tra các ràng buộc nghiệp vụ (ví dụ: cột `amount` không được âm, cột `user_id` không được null) trước khi merge dữ liệu vào production tables.
> 3. **Observability Level**: Sử dụng công cụ giám sát (như Monte Carlo hoặc Datadog) để phát hiện bất thường về mặt thống kê (ví dụ: bình thường mỗi ngày có 1 triệu dòng, hôm nay đột ngột chỉ có 10,000 dòng).

**Q5: "Data Lineage giúp ích gì khi hệ thống gặp lỗi dữ liệu (Data Downtime)?"**
> Data Lineage đóng vai trò như bản đồ cứu hộ. Khi một chỉ số trên Dashboard bị sai lệch (Data Downtime), Lineage giúp:
> 1. **Trace ngược dòng (Upstream Trace)**: Đi ngược từ Dashboard -> BI dataset -> Data Warehouse gold/silver tables -> Raw data lake -> Source system. Giúp xác định chính xác tại node nào dữ liệu bắt đầu bị sai.
> 2. **Đo lường mức độ ảnh hưởng (Blast Radius)**: Tìm tất cả các bảng, mô hình ML hoặc báo cáo ở hạ nguồn (Downstream) đang sử dụng bảng bị lỗi để cảnh báo cho người dùng dừng sử dụng cho tới khi sự cố được khắc phục.

**Q6: "Làm thế nào để đảm bảo an toàn cho các Service Accounts chạy các công cụ ETL/ELT tự động?"**
> 1. **Nguyên tắc đặc quyền tối thiểu (Least Privilege)**: Service account của công cụ ETL chỉ được cấp quyền đọc ở source và quyền ghi ở staging. Nó không được phép xóa (DROP) bảng hay xem dữ liệu của phòng ban khác.
> 2. **Short-lived Credentials**: Sử dụng cơ chế IAM Roles hoặc Service Account Impersonation thay vì tải file key JSON vật lý về lưu trữ cục bộ.
> 3. **Audit Logging**: Bật tính năng log truy cập (ví dụ Cloud Trail trên AWS hoặc Cloud Logging trên GCP) để ghi lại tất cả các hành động query/xóa dữ liệu do service account thực thi phục vụ việc hậu kiểm.

---

## Tài liệu tham khảo

- [GDPR Compliance Guidelines for Data Platforms](https://gdpr.eu/)
- [DataHub Metadata Platform Documentation](https://datahubproject.io/docs/)
- [Snowflake Data Masking & Security Guide](https://docs.snowflake.com/en/user-guide/security-column-ddm)
- [OpenLineage Specification](https://openlineage.io/)
