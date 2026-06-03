# [05] Phase 2 - Spring MVC: Exception Handling & Validation trong Spring Boot

## 1. Nguồn gốc và lý do ra đời của cơ chế kiểm thực và xử lý lỗi tập trung

### Cách làm cũ trong Java Web truyền thống
Trước khi có `@RestControllerAdvice` và **Jakarta Bean Validation** (JSR 380), việc kiểm tra tính hợp lệ của dữ liệu đầu vào và xử lý lỗi vô cùng phân tán:
- **Kiểm thực thủ công (Boilerplate Validation)**: Lập trình viên phải viết hàng tá câu lệnh `if-else` trong Controller để kiểm tra dữ liệu:
  ```java
  if (user.getUsername() == null || user.getUsername().isEmpty()) {
      return ResponseEntity.badRequest().body("Username cannot be empty");
  }
  ```
- **Xử lý lỗi phân mảnh (Local Exception Handling)**: Sử dụng các khối `try-catch` bọc quanh mọi lời gọi hàm. Nếu xảy ra lỗi ngoài ý muốn (như lỗi Database), API trả về trang lỗi HTML 500 mặc định của Server (White Label Error Page), để lộ toàn bộ StackTrace nhạy cảm cho kẻ tấn công xem.

### Giải pháp: Xử lý lỗi tập trung và Khai báo kiểm thực
- **Jakarta Bean Validation**: Sử dụng các Annotation (như `@NotNull`, `@Size`, `@Email`) đặt trực tiếp trên các thuộc tính của DTO. Spring Boot sẽ tự động thực hiện kiểm thực trước khi đưa dữ liệu vào Controller.
- **`@RestControllerAdvice`**: Cho phép gom toàn bộ logic xử lý ngoại lệ (Exception Handling) của tất cả các Controller về một lớp duy nhất, trả về cấu hình JSON lỗi thống nhất cho Client.

---

## 2. So sánh Kiểm thực Thủ công vs Khai báo bằng Annotation

| Tiêu chí | Kiểm thực Thủ công (if-else) | Khai báo bằng Annotation |
| :--- | :--- | :--- |
| **Vị trí viết code** | Bên trong thân của phương thức Controller | Trực tiếp trên thuộc tính của DTO |
| **Tính tái sử dụng** | Rất thấp (phải viết lại cho mỗi endpoint) | Cao (áp dụng cho mọi API nhận DTO đó) |
| **Tính rõ ràng** | Làm loãng logic nghiệp vụ chính của Controller | Sạch sẽ, mang tính khai báo (Declarative) |
| **Tự động hóa** | Phải tự viết mã kiểm tra | Spring tự kích hoạt qua `@Valid` hoặc `@Validated` |

---

## 3. Rủi ro khi thiết kế và vận hành sai

1. **Lộ thông tin cấu trúc hệ thống (Information Leakage)**: Không bắt các lỗi chung (`Exception.class`), để mặc định JVM ném lỗi 500 trả về StackTrace chứa tên lớp, câu lệnh SQL, cấu trúc thư mục Server. Kẻ tấn công có thể khai thác thông tin này để tấn công hệ thống.
2. **Bỏ qua `@Valid` ở Controller**: Khai báo các Annotation kiểm thực trong DTO nhưng quên viết `@Valid` trước `@RequestBody` trong Controller. Kết quả là dữ liệu rác vẫn được nạp vào hệ thống mà không hề có cảnh báo hay chặn lại.
3. **Trả về mã lỗi HTTP không nhất quán**: Trả về HTTP 200 kèm body `{"status": "fail", "message": "error"}` thay vì trả về đúng HTTP 400 hoặc 422. Việc này vi phạm các tiêu chuẩn thiết kế REST API và gây khó khăn cho Frontend khi xử lý lỗi.

---

## 4. Code ví dụ minh họa chi tiết

### a) Định nghĩa DTO với Jakarta Validation Constraints
```java
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class UserRegisterRequestDTO {

    @NotBlank(message = "Tên tài khoản không được để trống")
    @Size(min = 4, max = 20, message = "Tên tài khoản phải từ 4 đến 20 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải chứa ít nhất 8 ký tự")
    private String password;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Định dạng email không hợp lệ")
    private String email;

    // Getters and Setters
}
```

### b) Viết Controller nhận dữ liệu và thực hiện kiểm thực
```java
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    @PostMapping("/register")
    public ResponseEntity<String> register(@Valid @RequestBody UserRegisterRequestDTO request) {
        // Nếu validate thất bại, Spring tự động ném MethodArgumentNotValidException 
        // và không chạy vào trong phương thức này.
        return ResponseEntity.ok("Đăng ký thành công!");
    }
}
```

### c) Cấu hình `@RestControllerAdvice` xử lý lỗi tập trung toàn hệ thống
```java
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xử lý lỗi validate đầu vào (Trả về HTTP 400)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, String>> handleValidationExceptions(MethodArgumentNotValidException ex) {
        Map<String, String> errors = new HashMap<>();
        ex.getBindingResult().getAllErrors().forEach((error) -> {
            String fieldName = ((FieldError) error).getField();
            String errorMessage = error.getDefaultMessage();
            errors.put(fieldName, errorMessage);
        });
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(errors);
    }

    // 2. Xử lý lỗi Runtime chung để tránh lộ StackTrace (Trả về HTTP 500)
    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeExceptions(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        response.put("error", "Hệ thống gặp sự cố ngoài ý muốn.");
        response.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
```
