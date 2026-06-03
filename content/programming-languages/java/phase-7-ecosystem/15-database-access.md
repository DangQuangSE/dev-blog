# [15] Phase 7 - Ecosystem: Truy xuất Cơ sở dữ liệu: JDBC, EBean, Hibernate & JPA

## 1. Nguồn gốc và lý do ra đời của các công nghệ truy xuất Database

### Sự cực khổ khi viết SQL thô với JDBC cổ điển
Trong thời kỳ đầu, để tương tác với cơ sở dữ liệu quan hệ (RDBMS), Java sử dụng **JDBC (Java Database Connectivity)**.
- **Hạn chế**: 
  - Lập trình viên phải viết hàng tá code boilerplate chỉ để mở kết nối, tạo câu lệnh `PreparedStatement`, duyệt qua `ResultSet` để ánh xạ từng cột vào thuộc tính đối tượng Java thủ công.
  - Phải tự quản lý đóng mở kết nối trong các khối `try-catch-finally` cồng kềnh.
  - Mã SQL viết trực tiếp dưới dạng chuỗi cứng trong code Java, rất khó debug, dễ bị lỗ hổng bảo mật **SQL Injection**.

### Giải pháp: Các thư viện ORM (Object-Relational Mapping)
ORM ra đời để ánh xạ trực tiếp các bảng trong database thành các lớp Java (Entities), giúp lập trình viên thao tác với database hoàn toàn thông qua đối tượng Java mà không cần viết SQL thô:
- **JPA (Java Persistence API)**: Tập hợp các đặc tả (Specification) và chuẩn hóa API của Java cho ORM. JPA chỉ là giao diện định nghĩa, không tự thực thi code.
- **Hibernate**: Bộ triển khai (Implementation) phổ biến nhất của JPA, tự động sinh SQL tối ưu cho từng loại database cụ thể (MySQL, PostgreSQL, Oracle).
- **EBean**: ORM đi theo triết lý *Active Record* đơn giản, nhẹ nhàng hơn Hibernate, tránh được nhiều vấn đề về quản lý phiên làm việc (Session Management).
- **Spring Data JPA**: Tầng trừu tượng hóa tối đa, tự động sinh các câu truy vấn thông qua các phương thức của Interface (ví dụ: `findByEmail(String email)`).

---

## 2. So sánh và Đối chiếu các công nghệ Database Access

| Công nghệ | Phong cách lập trình | Kiểm soát hiệu năng | Boilerplate Code |
| :--- | :--- | :--- | :--- |
| **JDBC** | Viết SQL thủ công trực tiếp | Rất cao (Tối ưu được từng câu lệnh thô) | Rất nhiều và cồng kềnh |
| **EBean** | Active Record / ORM | Cao (Truy vấn tường minh, dễ dự đoán) | Ít |
| **Hibernate / JPA** | Data Mapper / ORM | Trung bình (Tự động sinh SQL, dễ gây dư thừa) | Rất ít |
| **Spring Data JPA** | Repositories trừu tượng | Trung bình (Cần hiểu rõ cơ chế ngầm định) | Hầu như không có |

---

## 3. Rủi ro hiệu năng nghiêm trọng khi sử dụng ORM

1. **Lỗi N+1 Query (Thảm họa hiệu năng)**: Xảy ra khi bạn có mối quan hệ `@OneToMany` (ví dụ: 1 tác giả có nhiều bài viết). Khi bạn truy vấn danh sách 100 tác giả, Hibernate sẽ chạy 1 câu lệnh để lấy 100 tác giả, sau đó chạy thêm **100 câu lệnh con** để lấy bài viết của từng tác giả. Tổng cộng chạy 101 câu lệnh SQL về database, làm nghẽn hoàn toàn hệ thống.
   - *Khắc phục*: Sử dụng `JOIN FETCH` trong HQL/JPQL, hoặc cấu hình `EntityGraph`.
2. **Cạn kiệt Connection Pool**: Mở kết nối database mà quên đóng, hoặc thực hiện các xử lý tính toán quá lâu ngay khi đang giữ kết nối mở. Điều này làm cho bể chứa kết nối (Connection Pool như **HikariCP**) bị cạn kiệt, khiến các yêu cầu sau bị block và hệ thống bị timeout.
3. **Lỗi LazyInitializationException**: Xảy ra khi truy cập vào một thuộc tính được cấu hình tải lười (Lazy Loading) sau khi phiên làm việc (Hibernate Session / Transaction) đã đóng.

---

## 4. Code ví dụ minh họa chi tiết

### a) Kết nối thô bằng JDBC với PreparedStatement chống SQL Injection
```java
import java.sql.Connection;
import java.sql.DriverManager;
import java.sql.PreparedStatement;
import java.sql.ResultSet;
import java.sql.SQLException;

public class JdbcDemo {
    public static void main(String[] args) {
        String dbUrl = "jdbc:mysql://localhost:3306/dev_blog";
        String user = "root";
        String password = "password";

        String query = "SELECT username, email FROM users WHERE role = ?";

        // Sử dụng try-with-resources tự động đóng Connection, Statement, ResultSet
        try (Connection conn = DriverManager.getConnection(dbUrl, user, password);
             PreparedStatement stmt = conn.prepareStatement(query)) {
            
            stmt.setString(1, "ADMIN"); // Chống SQL Injection an toàn
            
            try (ResultSet rs = stmt.executeQuery()) {
                while (rs.next()) {
                    System.out.println("User: " + rs.getString("username") 
                                       + " | Email: " + rs.getString("email"));
                }
            }
        } catch (SQLException e) {
            e.printStackTrace();
        }
    }
}
```

### b) Định nghĩa Entity và Repository bằng Spring Data JPA (Hiện đại)
```java
// Cần import các annotation từ jakarta.persistence
import jakarta.persistence.*;
import java.util.List;

@Entity
@Table(name = "posts")
class Post {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne(fetch = FetchType.LAZY) // Lazy loading để tránh tự động tải tác giả
    @JoinColumn(name = "author_id")
    private Author author;

    // Getters and Setters
}

// Spring Data JPA Repository Interface tự động sinh câu truy vấn
interface PostRepository {
    // Tự sinh SQL: SELECT * FROM posts WHERE title LIKE ?
    List<Post> findByTitleContaining(String keyword);

    // Giải quyết N+1 query bằng JOIN FETCH
    // @Query("SELECT p FROM Post p JOIN FETCH p.author")
    // List<Post> findAllPostsWithAuthor();
}
```
