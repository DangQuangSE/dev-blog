# [13] Phase 6 - Testing: Containerized Testing với Testcontainers

## 1. Nguồn gốc của sự cần thiết phải kiểm thử với Cơ sở dữ liệu thật

### a) Hạn chế của việc sử dụng In-Memory Database (H2 Database) để test
Để viết kiểm thử tích hợp (Integration Test), cách làm truyền thống là sử dụng database chạy trong bộ nhớ RAM như **H2 Database**:
- **Hạn chế**: H2 có tập lệnh SQL, hàm và tính năng rất khác so với các hệ quản trị cơ sở dữ liệu thật chạy trên Production (như PostgreSQL, MySQL):
  1. H2 không hỗ trợ các kiểu dữ liệu đặc biệt như `JSONB` của PostgreSQL hoặc các hàm hình học (Spatial data types).
  2. Một số câu lệnh truy vấn phức tạp hoặc cú pháp phân trang chạy thành công trên H2 nhưng khi triển khai thật lên PostgreSQL sẽ bị ném lỗi cú pháp.
  3. Bạn không thể kiểm tra được hiệu năng thực tế của các câu lệnh SQL Index khi chạy trên H2.

### b) Giải pháp: Thư viện Testcontainers
**Testcontainers** là thư viện Java mạnh mẽ cho phép tự động khởi chạy các container Docker thật (như PostgreSQL, Redis, Kafka, Elasticsearch) ngay trong quá trình chạy kiểm thử tích hợp:
- Đảm bảo tính **đồng nhất môi trường (Environment Parity)** tuyệt đối: Bạn chạy database gì ở Production, bạn sẽ dùng đúng phiên bản database đó để chạy test.
- Khi kết thúc quá trình chạy test, Testcontainers sẽ tự động xóa sạch các container này để giải phóng tài nguyên.

---

## 2. So sánh Kiểm thử bằng H2 vs Testcontainers (Real Database in Docker)

| Tiêu chí | In-Memory Database (H2) | Testcontainers (Real Docker DB) |
| :--- | :--- | :--- |
| **Độ chính xác** | Thấp (Dễ lọt lỗi cú pháp SQL khác biệt lên production) | Tuyệt đối (Chạy trên chính database engine thật) |
| **Tốc độ chạy** | Siêu nhanh (Không mất thời gian khởi động container) | Chậm hơn (Mất từ 5 - 15 giây để kéo và khởi chạy container) |
| **Yêu cầu hệ thống** | Chỉ cần JVM | Yêu cầu phải cài đặt **Docker Daemon** trên máy test và CI/CD |
| **Hỗ trợ NoSQL / Broker** | Hạn chế | Hỗ trợ mọi dịch vụ có image Docker (Redis, Kafka, v.v.) |

---

## 3. Rủi ro hiệu năng khi sử dụng Testcontainers

1. **Khởi động lại Container cho mỗi Test Class**: Nếu cấu hình sai, mỗi khi chạy sang một Class test mới, Testcontainers lại tải và chạy lại một container Docker mới. Việc này kéo dài thời gian chạy test lên tới hàng chục phút, làm nghẽn toàn bộ CI/CD Pipeline.
   - *Khắc phục*: Áp dụng mẫu thiết kế **Singleton Containers Pattern** để dùng chung một container duy nhất cho toàn bộ các lớp test trong dự án.
2. **Yêu cầu phần cứng cao**: Chạy nhiều container (Postgres, Redis, RabbitMQ) đồng thời khi test đòi hỏi máy tính của lập trình viên và máy chủ CI/CD phải có dung lượng RAM lớn (tối thiểu 16GB RAM) để tránh bị đơ máy.

---

## 4. Code ví dụ minh họa chi tiết

### Viết class Integration Test kết nối PostgreSQL chạy trong Docker Container bằng Testcontainers

```java
// Cần các dependency: org.testcontainers:postgresql:1.19.0 và spring-boot-testcontainers
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers // Kích hoạt cơ chế quản lý container tự động
public class CustomerIntegrationTest {

    // 1. Khai báo Container PostgreSQL thật (Chạy image postgres:15-alpine)
    @Container
    private static final PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:15-alpine")
            .withDatabaseName("testdb")
            .withUsername("testuser")
            .withPassword("testpass");

    // 2. Ghi đè cấu hình kết nối của Spring Boot động dựa trên cổng ngẫu nhiên do Docker cấp phát
    @DynamicPropertySource
    public static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    public void testCreateCustomer_ParityEnvironment() {
        Customer customer = new Customer("test_parity@devblog.com");
        customerRepository.save(customer);

        Customer savedCustomer = customerRepository.findByEmail("test_parity@devblog.com");
        assertNotNull(savedCustomer);
        // Kiểm chứng dữ liệu chạy thành công trên Database PostgreSQL thực tế
        assertEquals("test_parity@devblog.com", savedCustomer.getEmail());
    }
}
```
