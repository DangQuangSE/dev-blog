# [12] Phase 6 - Testing: Containerized Testing với Testcontainers

## 1. Nguồn gốc của sự cần thiết phải kiểm thử với cơ sở dữ liệu thật

### Cách làm cũ: Kiểm thử tích hợp bằng H2 (In-Memory Database)
Khi viết Integration Test cho tầng cơ sở dữ liệu (Database Layer), các lập trình viên thường dùng cơ sở dữ liệu trong bộ nhớ như **H2 Database**:
- Khi bắt đầu test, Spring Boot sẽ tự tạo schema trên H2 trong RAM, thực thi test và tự giải phóng khi chạy xong.
- **Hạn chế lớn**: H2 không hoàn toàn giống với hệ quản trị cơ sở dữ liệu thật chạy trên Production (ví dụ: PostgreSQL, MySQL, MS SQL).
  - H2 không hỗ trợ các tính năng đặc thù của PostgreSQL như kiểu dữ liệu `JSONB`, các hàm toán tử tìm kiếm nâng cao (Full-text search), các kiểu dữ liệu địa lý (PostGIS).
  - Có những câu query SQL chạy qua thành công trên H2 nhưng khi deploy lên Production với PostgreSQL lại bị lỗi cú pháp hoặc hành vi không nhất quán.

### Sự xuất hiện của Testcontainers
Để giải quyết sự khác biệt môi trường này, **Testcontainers** ra đời.
> **Testcontainers** là một thư viện Java cho phép bạn tự động khởi chạy các Container Docker (ví dụ: một DB Postgres thực, một broker Kafka, một cụm Redis) trong suốt quá trình chạy kiểm thử.

---

## 2. Ưu và nhược điểm của Testcontainers

### So sánh môi trường kiểm thử Database:

| Tiêu chí | In-Memory DB (H2) | Testcontainers (PostgreSQL/MySQL thật) |
| :--- | :--- | :--- |
| **Độ chính xác** | Thấp (Dễ bỏ lọt lỗi cú pháp SQL đặc thù) | Tuyệt đối (Chạy chính xác phiên bản DB của Production) |
| **Tốc độ khởi chạy** | Cực kỳ nhanh | Chậm hơn (Mất vài giây để tải image và khởi chạy Container) |
| **Yêu cầu môi trường** | Chỉ cần Java | Yêu cầu máy chạy test phải cài đặt **Docker** |
| **Độ phức tạp cấu hình** | Thấp | Trung bình |

---

## 3. Thực hành tích hợp Testcontainers trong Spring Boot 3.x

Từ Spring Boot 3.1+, việc tích hợp Testcontainers đã trở nên vô cùng đơn giản nhờ tính năng `@ServiceConnection`. Tính năng này tự động phát hiện và kết nối cấu hình `DataSource` của Spring tới container Docker mà không cần bạn phải viết các đoạn code cấu hình thủ công như trước.

### Cấu hình dependency trong `pom.xml`:
```xml
<dependency>
    <groupId>org.testcontainers</groupId>
    <artifactId>postgresql</artifactId>
    <scope>test</scope>
</dependency>
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-testcontainers</artifactId>
    <scope>test</scope>
</dependency>
```

### Viết class Base Integration Test sử dụng Testcontainers:
```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.testcontainers.service.connection.ServiceConnection;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers // Kích hoạt cơ chế quản lý lifecycle của Testcontainers
public abstract class BaseIntegrationTest {

    // Khởi tạo PostgreSQL Container chạy đúng version trên production
    @Container
    @ServiceConnection // Tự động cấu hình spring.datasource.url, username, password
    protected static final PostgreSQLContainer<?> postgresContainer = 
            new PostgreSQLContainer<>("postgres:15-alpine");
            
    // Container sẽ tự động start trước khi bất kỳ test class nào chạy 
    // và tự động stop/destroy sau khi tất cả test kết thúc.
}
```

### Viết Test thực tế kết thừa Base class:
```java
public class UserRepositoryTest extends BaseIntegrationTest {

    @Autowired
    private UserRepository userRepository;

    @Test
    public void testSaveAndRetrieveUser() {
        // Thực hiện lưu dữ liệu vào PostgreSQL thật đang chạy trong Docker
        UserEntity user = new UserEntity(null, "Dang Quang", "quang@example.com");
        UserEntity savedUser = userRepository.save(user);

        // Kiểm tra dữ liệu được lưu
        UserEntity retrievedUser = userRepository.findById(savedUser.getId()).orElseThrow();
        assertEquals("quang@example.com", retrievedUser.getEmail());
    }
}
```

---

## 4. Rủi ro và Best Practices khi sử dụng Testcontainers

1. **Yêu cầu phần cứng và môi trường Docker**: Nếu máy tính của nhà phát triển hoặc máy chủ CI/CD (như GitHub Actions, GitLab Runner) không cài đặt sẵn Docker daemon, toàn bộ Test Suite sẽ bị lỗi crash ngay từ bước đầu tiên.
2. **Tốc độ chạy test bị giảm (Container Overhead)**: Khởi động container cho mỗi Class kiểm thử đơn lẻ sẽ làm chậm dự án.
   - *Best Practice*: Sử dụng **Singleton Container Pattern** (như lớp `BaseIntegrationTest` trừu tượng ở trên để các class test kế thừa chạy chung một container duy nhất xuyên suốt quá trình test thay vì tạo mới liên tục).
3. **Quản lý dọn dẹp tài nguyên (Ryuk Container)**: Đôi khi việc tắt tiến trình test đột ngột trên IDE khiến container không kịp dọn dẹp. Đảm bảo container điều phối đặc biệt của Testcontainers (mặc định là `testcontainers/ryuk`) được phép chạy để tự động quét dọn tài nguyên rác.
