# [12] Phase 6 - Testing: Kiểm thử: JUnit 5, Mockito, MockMvc, @SpringBootTest & @MockBean

## 1. Nguồn gốc của sự cần thiết phải kiểm thử tự động

### a) Cách làm cũ: Kiểm thử thủ công (Manual Testing)
Trước đây, sau khi viết xong code, lập trình viên thường kiểm tra ứng dụng bằng cách:
- Khởi chạy toàn bộ ứng dụng Spring Boot.
- Mở Postman hoặc Swagger, điền thông số đầu vào và gửi request thủ công.
- Vào Database kiểm tra xem dữ liệu đã được thêm hoặc sửa đúng chưa.
- **Hạn chế**: Cực kỳ mất thời gian. Khi hệ thống lớn lên với hàng trăm API, việc kiểm thử thủ công tất cả các trường hợp (regression testing) sau mỗi lần sửa code là bất khả thi. Lập trình viên luôn trong trạng thái lo sợ code mới làm hỏng code cũ mà không phát hiện ra.

### b) Sự ra đời của Automated Testing và Spring Slicing Test
Để tăng tốc độ kiểm thử, Spring Boot cung cấp các công cụ kiểm thử phân tầng (Slicing Tests) cho phép lập trình viên chỉ tải lên một phần nhỏ của Spring Context thay vì khởi động toàn bộ ứng dụng lớn:
- **`@WebMvcTest`**: Chỉ khởi chạy tầng Web (Controller, Filters, Spring Security) để kiểm tra định tuyến API và validation.
- **`@DataJpaTest`**: Chỉ khởi chạy cấu hình kết nối DB, quét các Entity và Repository, tự động rollback sau mỗi test case để tránh làm bẩn dữ liệu database.

---

## 2. Phân biệt các Annotation và Công cụ Kiểm thử

| Annotation / Công cụ | Bản chất hoạt động | Tốc độ | Phạm vi sử dụng lý tưởng |
| :--- | :--- | :--- | :--- |
| **JUnit 5 + Mockito** | Chạy Java thuần, không khởi động bất kỳ Spring Context nào | Siêu nhanh (ms) | Unit test logic nghiệp vụ của Service |
| **`MockMvc`** | Giả lập servlet request trực tiếp trong JVM, không mở cổng mạng | Nhanh | Test kiểm thực đầu vào, định tuyến URL của Controller |
| **`@SpringBootTest`** | Khởi động toàn bộ IoC Container và Spring Context đầy đủ | Chậm | Kiểm thử tích hợp tích hợp nhiều dịch vụ (End-to-End) |
| **`@MockBean`** | Tạo một đối tượng mock và tiêm đè vào Spring Context hiện tại | Chậm (gây reload context) | Thay thế các service bên thứ ba (như cổng thanh toán) lúc tích hợp |
| **`@DataJpaTest`** | Chỉ load các Repository và cấu hình database in-memory | Nhanh | Kiểm thử các câu lệnh SQL phức tạp trong Custom Repository |

---

## 3. Rủi ro nghẽn pipeline do lạm dụng test sai cách

1. **Hiệu năng CI/CD sụt giảm nghiêm trọng (Context Dirtying)**: Mỗi lần bạn sử dụng `@MockBean` trong một test class sử dụng `@SpringBootTest`, Spring bắt buộc phải phá hủy cache của ApplicationContext và khởi động lại một Context mới hoàn toàn ở lớp tiếp theo. Nếu có hàng trăm class như vậy, quá trình chạy test trên pipeline có thể mất hàng tiếng đồng hồ.
   - *Khắc phục*: Tách biệt hoàn toàn các bài test unit thuần túy bằng MockitoExtension (không load Context) và gom các integration test dùng chung một cấu hình context.
2. **Lỗi "Trôi lệch trạng thái Database"**: Chạy các bài test tích hợp ghi dữ liệu vào database thật nhưng quên dọn dẹp sau khi chạy. Kết quả là bài test thứ hai bị lỗi do dữ liệu của bài test thứ nhất để lại.
   - *Khắc phục*: Luôn sử dụng `@Transactional` trên các Test Class để Spring tự động rollback dữ liệu về trạng thái ban đầu sau khi chạy xong mỗi ca kiểm thử.

---

## 4. Code ví dụ minh họa chi tiết

### a) Unit Test cho Service (Dùng JUnit 5 & Mockito thuần - Không load Context)
```java
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private UserService userService;

    @Test
    public void testGetUserById_Success() {
        UserEntity mockUser = new UserEntity(1L, "Dang Quang", "quang@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        UserResponseDTO result = userService.getById(1L);

        assertNotNull(result);
        assertEquals("Dang Quang", result.getFullName());
    }
}
```

### b) Integration Test cho Web (Dùng @WebMvcTest và @MockBean)
```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class) // Chỉ load UserController và cấu hình Web
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService; // Tiêm mock vào context WebMvc

    @Test
    public void testGetProfile_Success() throws Exception {
        UserResponseDTO response = new UserResponseDTO(1L, "Dang Quang", "quang@example.com");
        when(userService.getById(1L)).thenReturn(response);

        mockMvc.perform(get("/api/v1/users/1")
                .accept(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Dang Quang"));
    }
}
```

### c) Slice Test cho Database (Dùng @DataJpaTest)
```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.orm.jpa.DataJpaTest;
import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest // Chỉ load JPA/Hibernate và dùng database in-memory (ví dụ H2)
public class CustomerRepositoryTest {

    @Autowired
    private CustomerRepository customerRepository;

    @Test
    public void testSaveAndFindByEmail() {
        Customer customer = new Customer("test@devblog.com");
        customerRepository.save(customer);

        Customer found = customerRepository.findByEmail("test@devblog.com");
        assertNotNull(found);
        assertEquals("test@devblog.com", found.getEmail());
    } // Spring tự động Rollback giao dịch tại đây, trả database về trạng thái sạch
}
```
