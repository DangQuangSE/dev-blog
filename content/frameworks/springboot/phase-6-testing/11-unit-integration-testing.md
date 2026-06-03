# [11] Phase 6 - Testing: Unit Testing & Integration Testing với MockMvc

## 1. Nguồn gốc của sự cần thiết phải kiểm thử tự động

### Cách làm cũ: Kiểm thử thủ công (Manual Testing)
Trước đây, sau khi viết xong code, lập trình viên thường kiểm tra ứng dụng bằng cách:
- Khởi chạy toàn bộ ứng dụng Spring Boot.
- Mở Postman hoặc Swagger, điền thông số đầu vào và gửi request thủ công.
- Vào Database kiểm tra xem dữ liệu đã được thêm hoặc sửa đúng chưa.
- **Hạn chế**: Cực kỳ mất thời gian. Khi hệ thống lớn lên với hàng trăm API, việc kiểm thử thủ công tất cả các trường hợp (regression testing) sau mỗi lần sửa code là bất khả thi. Lập trình viên luôn trong trạng thái lo sợ code mới làm hỏng code cũ mà không phát hiện ra.

### Vai trò của Kiểm thử tự động (Automated Testing)
Kiểm thử tự động giúp kiểm tra hành vi của ứng dụng một cách lập trình, chạy nhanh trong vài giây mỗi khi build dự án, đảm bảo mã nguồn hoạt động chính xác trước khi deploy lên Production.

---

## 2. Phân biệt Unit Test và Integration Test trong Spring Boot

| Tiêu chí | Unit Testing (Kiểm thử đơn vị) | Integration Testing (Kiểm thử tích hợp) |
| :--- | :--- | :--- |
| **Phạm vi** | Kiểm tra độc lập một Class duy nhất (thường là Service). | Kiểm tra sự phối hợp giữa nhiều thành phần (Controller - Service - Repository). |
| **Tốc độ** | Rất nhanh (vài mili-giây) vì không tải Spring Context. | Chậm hơn (vài giây) vì phải khởi động IoC Container của Spring. |
| **Cách cô lập** | Sử dụng **Mockito** để mock toàn bộ các phụ thuộc bên ngoài. | Có thể load toàn bộ Context thực tế hoặc Mock một phần. |
| **Công cụ chính** | JUnit 5, Mockito | `@SpringBootTest`, `MockMvc` |

---

## 3. Thực hành viết Unit Test với JUnit 5 & Mockito

Unit Test tập trung kiểm thử logic nghiệp vụ bên trong tầng Service mà không cần kết nối Database thật hay khởi động Web Server.

```java
import org.junit.jupiter.api.BeforeEach;
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
    private UserRepository userRepository; // Mock đối tượng phụ thuộc

    @InjectMocks
    private UserService userService; // Tiêm đối tượng mock vào Service cần test

    @Test
    public void testGetUserById_Success() {
        // 1. Arrange (Thiết lập giả lập)
        UserEntity mockUser = new UserEntity(1L, "Dang Quang", "quang@example.com");
        when(userRepository.findById(1L)).thenReturn(Optional.of(mockUser));

        // 2. Act (Thực thi logic)
        UserResponseDTO result = userService.getById(1L);

        // 3. Assert (Kiểm chứng kết quả)
        assertNotNull(result);
        assertEquals("Dang Quang", result.getFullName());
        verify(userRepository, times(1)).findById(1L); // Đảm bảo hàm findById được gọi đúng 1 lần
    }

    @Test
    public void testGetUserById_UserNotFound_ThrowsException() {
        // Arrange
        when(userRepository.findById(1L)).thenReturn(Optional.empty());

        // Act & Assert
        assertThrows(ResourceNotFoundException.class, () -> {
            userService.getById(1L);
        });
    }
}
```

---

## 4. Thực hành viết Integration Test với MockMvc

Integration Test giúp kiểm tra toàn bộ luồng xử lý từ lúc HTTP Request đi qua bộ lọc Security, vào Controller, thực hiện Validate, gọi Service và trả về Response JSON. 

Để tránh việc phải khởi động Server thật chiếm cổng mạng (port), Spring cung cấp **`MockMvc`** để giả lập môi trường Servlet.

```java
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest // Khởi động Spring Context đầy đủ để test tích hợp
@AutoConfigureMockMvc // Cấu hình tự động đối tượng MockMvc
public class UserControllerIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private UserService userService; // MockBean thay thế bean thực tế trong Spring Context

    @Test
    public void testRegisterUser_ValidationFailed_Returns400() throws Exception {
        // Gửi request thiếu email và mật khẩu quá ngắn -> Vi phạm validate đầu vào
        String invalidUserJson = "{\"username\": \"quang\", \"password\": \"123\", \"email\": \"invalid-email\"}";

        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidUserJson))
                .andExpect(status().isBadRequest()) // Mong đợi HTTP 400
                .andExpect(jsonPath("$.error").value("Validation Failed")); // Kiểm tra cấu trúc JSON lỗi trả về
    }

    @Test
    public void testRegisterUser_Success_Returns200() throws Exception {
        String validUserJson = "{\"username\": \"quang\", \"password\": \"secure_pass_123\", \"email\": \"quang@example.com\"}";
        
        mockMvc.perform(post("/api/v1/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(validUserJson))
                .andExpect(status().isOk());
    }
}
```

---

## 5. Rủi ro khi không viết Test hoặc viết Test sai cách

1. **Hiệu năng CI/CD suy giảm do lạm dụng `@SpringBootTest`**: Mỗi khi bạn viết một class kiểm thử tích hợp sử dụng `@SpringBootTest`, Spring Boot phải khởi chạy IoC Container. Nếu dự án có 500 test class và class nào cũng load lại context mới, quá trình chạy CI/CD Pipeline có thể mất hàng tiếng đồng hồ. Hãy tận dụng cơ chế gom nhóm context (Context Caching) hoặc dùng `@WebMvcTest` (chỉ load tầng Web) để tối ưu.
2. **Mock bừa bãi trong Integration Test**: Nếu bạn viết kiểm thử tích hợp nhưng lại mock đi hầu hết mọi service quan trọng, bạn sẽ không phát hiện ra lỗi tích hợp thực tế khi chạy thật (ví dụ lỗi kết nối Database).
3. **Mã nguồn biến thành "di sản không thể đụng vào" (Legacy Code Fear)**: Không có bộ test tự động che chắn, dự án sẽ nhanh chóng rơi vào trạng thái không ai dám tái cấu trúc (refactor) mã nguồn cũ vì sợ làm hỏng toàn bộ hệ thống.
