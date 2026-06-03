# [07] Phase 3 - Data Access: Spring Data: Spring Data JPA, MongoDB & JDBC

## 1. Nguồn gốc và lý do ra đời của Dự án Spring Data

### a) Sự rời rạc của các API truy cập cơ sở dữ liệu
Trước khi có Spring Data, lập trình viên Java phải viết các đoạn mã hoàn toàn khác nhau để tương tác với các loại database khác nhau:
- Với SQL (RDBMS), bạn dùng **JDBC** hoặc **Hibernate/JPA** (`EntityManager`).
- Với NoSQL (MongoDB), bạn phải dùng **MongoDB Java Driver** (`MongoClient`, `MongoCollection`) thủ công.
- Sự rời rạc này khiến cho việc chuyển đổi công nghệ, viết code boilerplate, hoặc cấu hình transaction trở nên phức tạp và thiếu tính nhất quán.

### b) Giải pháp: Tầng trừu tượng thống nhất (Spring Data Repositories)
**Spring Data** ra đời nhằm cung cấp một mô hình lập trình nhất quán và quen thuộc cho việc truy cập dữ liệu, bất kể công nghệ lưu trữ bên dưới là gì.
- Nó giới thiệu interface gốc **`Repository`** và các con của nó (`CrudRepository`, `PagingAndSortingRepository`).
- Tự động sinh mã truy vấn (query methods) dựa trên tên phương thức khai báo trong Interface (ví dụ: `findByEmail`).

---

## 2. So sánh và Đối chiếu 3 công nghệ Spring Data phổ biến

| Tiêu chí | Spring Data JPA | Spring Data MongoDB | Spring Data JDBC |
| :--- | :--- | :--- | :--- |
| **Loại Database** | Quan hệ (SQL: MySQL, Postgres) | Tài liệu phi quan hệ (NoSQL Document) | Quan hệ (SQL: MySQL, Postgres) |
| **Cơ chế hoạt động** | Dựa trên Hibernate (L1 Cache, Lazy loading, Dirty checking) | Dựa trên MongoTemplate & Document Mapper | Truy vấn trực tiếp, ánh xạ dòng đơn giản (Không Cache, Không Lazy) |
| **Độ phức tạp ngầm** | Cao (Rất nhiều ma thuật ma trận như Hibernate Session) | Trung bình (Ánh xạ Document JSON) | Thấp (Tường minh, gần với JDBC thô nhưng sạch hơn) |
| **Hiệu năng & Tốc độ** | Phụ thuộc cấu hình (Dễ bị N+1 query nếu lười tối ưu) | Rất nhanh cho các dữ liệu phi cấu trúc | Rất nhanh, dễ đoán hiệu năng (Không có dirty check ẩn) |

---

## 3. Rủi ro khi lựa chọn sai công nghệ truy xuất

1. **Lạm dụng JPA cho các ứng dụng đơn giản**: Sử dụng Hibernate/JPA cho một ứng dụng chỉ thực hiện các lệnh đọc/ghi bảng đơn lẻ, không có quan hệ phức tạp. Điều này làm tăng độ trễ khởi động, tốn bộ nhớ cho Persistence Context và dễ gây ra các câu truy vấn SQL dư thừa ngầm định.
   - *Khắc phục*: Thay thế bằng **Spring Data JDBC** để có hiệu năng tối đa và code dễ kiểm soát hơn.
2. **Thiết kế NoSQL sai mô hình (Relational-like NoSQL)**: Sử dụng MongoDB nhưng thiết kế các bảng có quan hệ chặt chẽ (JOIN nhiều bảng) bằng cách lạm dụng liên kết `@DocumentReference`. MongoDB không tối ưu cho các phép JOIN phức tạp, việc này sẽ làm sụt giảm nghiêm trọng hiệu năng truy xuất của NoSQL.
   - *Khắc phục*: Tận dụng cấu trúc nhúng (Embedded documents) của NoSQL.

---

## 4. Code ví dụ minh họa chi tiết

### a) Spring Data JPA Entity & Repository (SQL - Có quan hệ phức tạp)
```java
import jakarta.persistence.*;
import org.springframework.data.jpa.repository.JpaRepository;

@Entity
@Table(name = "customers")
class Customer {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;

    // Getters & Setters
}

// Kế thừa JpaRepository cung cấp đầy đủ CRUD, Phân trang và flush cache
interface CustomerJpaRepository extends JpaRepository<Customer, Long> {
    Customer findByEmail(String email);
}
```

### b) Spring Data MongoDB Document & Repository (NoSQL Document)
```java
// Cần dependency: spring-boot-starter-data-mongodb
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.mapping.Document;
import org.springframework.data.mongodb.repository.MongoRepository;

@Document(collection = "products")
class ProductMongo {
    @Id
    private String id; // MongoDB mặc định dùng String UUID / ObjectId
    private String name;
    private double price;

    // Getters & Setters
}

interface ProductMongoRepository extends MongoRepository<ProductMongo, String> {
    ProductMongo findByName(String name);
}
```

### c) Spring Data JDBC Entity & Repository (SQL - Đơn giản, Không ma thuật ORM)
```java
// Cần dependency: spring-boot-starter-data-jdbc
import org.springframework.data.annotation.Id;
import org.springframework.data.relational.core.mapping.Table;
import org.springframework.data.repository.CrudRepository;

@Table("logs") // Spring Data JDBC mapping trực tiếp vào bảng logs
class SystemLog {
    @Id
    private Long id;
    private String message;

    // Spring Data JDBC bắt buộc các Entity phải là bất biến (Immutable - khuyên dùng constructor)
    public SystemLog(Long id, String message) {
        this.id = id;
        this.message = message;
    }

    public Long getId() { return id; }
    public String getMessage() { return message; }
}

// Kế thừa CrudRepository đơn giản. Không có EntityManager, không L1 cache, không Lazy Loading ngầm.
interface SystemLogRepository extends CrudRepository<SystemLog, Long> {
}
```
