# [04] Phase 2 - REST APIs: Exception Handling & Validation trong Spring Boot

## 1. Nguồn gốc và lý do ra đời của cơ chế kiểm thực và xử lý lỗi tập trung

### Cách làm cũ trong Java Web truyền thống
Trước khi có các framework hiện đại, lập trình viên thường xử lý kiểm tra dữ liệu và lỗi bằng cách:
- Viết hàng loạt các câu lệnh `if-else` trong Controller hoặc Service để kiểm tra dữ liệu đầu vào (Ví dụ: `if (username == null || username.length() < 6)`). Điều này làm phình to code nghiệp vụ (Spaghetti code).
- Bao quanh mọi dòng code bằng khối `try-catch`. Khi xảy ra lỗi, lập trình viên trả về một mã lỗi tự chế (ví dụ: `code: -1`) hoặc tệ hơn là trả về nguyên bản stack trace của Exception cho client.

### Rủi ro nghiêm trọng khi không xử lý lỗi và kiểm thực đúng cách
1. **Lộ thông tin nhạy cảm (Information Disclosure)**: Trả về trực tiếp dấu vết ngăn xếp (Stack Trace) sẽ làm lộ tên cơ sở dữ liệu, các lớp Java bên trong, phiên bản thư viện. Kẻ tấn công có thể khai thác các thông tin này để tìm kiếm lỗ hổng đã biết.
2. **Không nhất quán định dạng lỗi**: Khi Service A trả về lỗi dạng text, Service B trả về lỗi dạng JSON khác, Client sẽ rất khó khăn để viết mã xử lý lỗi chung.
3. **Lọt dữ liệu rác**: Không có tầng kiểm thực mạnh mẽ ở đầu vào (REST Layer) sẽ làm lọt các trường dữ liệu rỗng, sai định dạng (ví dụ email thiếu `@`), gây lỗi ở tầng sâu hơn như Database.

---

## 2. Kiểm thực dữ liệu đầu vào với Jakarta Bean Validation

Spring Boot tích hợp sẵn **Jakarta Bean Validation** (sử dụng thư viện triển khai mặc định là **Hibernate Validator**). Nó giúp kiểm tra dữ liệu khai báo bằng các Annotation trực tiếp trên DTO class.

### Định nghĩa DTO kiểm thực:
```java
import jakarta.validation.constraints.*;

public class UserRegisterRequest {

    @NotBlank(message = "Tên đăng nhập không được để trống")
    @Size(min = 4, max = 20, message = "Tên đăng nhập phải từ 4 đến 20 ký tự")
    private String username;

    @NotBlank(message = "Mật khẩu không được để trống")
    @Size(min = 8, message = "Mật khẩu phải chứa ít nhất 8 ký tự")
    private String password;

    @NotBlank(message = "Email không được để trống")
    @Email(message = "Email không đúng định dạng")
    private String email;

    // Getters, Setters, Constructors
}
```

### Sử dụng trong Controller bằng `@Valid`:
```java
@PostMapping("/register")
public ResponseEntity<String> registerUser(@Valid @RequestBody UserRegisterRequest request) {
    // Nếu request không hợp lệ, Spring sẽ ném ra MethodArgumentNotValidException 
    // và chặn không cho method này thực thi.
    userService.register(request);
    return ResponseEntity.ok("Đăng ký thành công!");
}
```

---

## 3. Xử lý Exception tập trung với `@RestControllerAdvice`

Để không phải viết `try-catch` lặp đi lặp lại, Spring cung cấp cơ chế chặn lỗi tập trung bằng hai Annotation:
- **`@RestControllerAdvice`**: Đánh dấu một Class chuyên bắt lỗi của toàn bộ các REST Controller.
- **`@ExceptionHandler`**: Đánh dấu phương thức nào sẽ chịu trách nhiệm xử lý loại Exception cụ thể nào.

### Xây dựng cấu trúc Error Response chuẩn hóa:
```java
import java.time.LocalDateTime;

public class ErrorDetails {
    private LocalDateTime timestamp;
    private int status;
    private String error;
    private String message;
    private String path;

    public ErrorDetails(int status, String error, String message, String path) {
        this.timestamp = LocalDateTime.now();
        this.status = status;
        this.error = error;
        this.message = message;
        this.path = path;
    }
    // Getters
}
```

### Triển khai GlobalExceptionHandler:
```java
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.WebRequest;

import java.util.stream.Collectors;

@RestControllerAdvice
public class GlobalExceptionHandler {

    // 1. Xử lý lỗi vi phạm Validate đầu vào (@Valid)
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorDetails> handleValidationException(
            MethodArgumentNotValidException ex, WebRequest request) {
        
        // Gộp tất cả các thông điệp lỗi validate lại thành một chuỗi
        String errors = ex.getBindingResult().getFieldErrors().stream()
                .map(error -> error.getField() + ": " + error.getDefaultMessage())
                .collect(Collectors.joining("; "));

        ErrorDetails details = new ErrorDetails(
                HttpStatus.BAD_REQUEST.value(),
                "Validation Failed",
                errors,
                request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(details, HttpStatus.BAD_REQUEST);
    }

    // 2. Xử lý lỗi không tìm thấy tài nguyên (ResourceNotFoundException - Custom Exception)
    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<ErrorDetails> handleResourceNotFound(
            ResourceNotFoundException ex, WebRequest request) {
        
        ErrorDetails details = new ErrorDetails(
                HttpStatus.NOT_FOUND.value(),
                "Not Found",
                ex.getMessage(),
                request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(details, HttpStatus.NOT_FOUND);
    }

    // 3. Xử lý tất cả các Exception không mong đợi khác (Internal Server Error)
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorDetails> handleGlobalException(
            Exception ex, WebRequest request) {
        
        // Ghi log lỗi chi tiết trên Server để debug (Không trả log về cho user)
        // log.error("Unexpected error occurred: ", ex);

        ErrorDetails details = new ErrorDetails(
                HttpStatus.INTERNAL_SERVER_ERROR.value(),
                "Internal Server Error",
                "Đã xảy ra lỗi hệ thống, vui lòng thử lại sau.", // Thông báo thân thiện, an toàn
                request.getDescription(false).replace("uri=", "")
        );
        return new ResponseEntity<>(details, HttpStatus.INTERNAL_SERVER_ERROR);
    }
}
```

---

## 4. Best Practices khi xử lý lỗi và kiểm thực
1. **Tuyệt đối không trả Stack Trace ra ngoài**: Luôn che giấu chi tiết kỹ thuật hệ thống bằng một Global Handler.
2. **Sử dụng Custom Exceptions**: Hãy tự tạo các Business Exception mang tính định danh rõ ràng như `UserAlreadyExistsException`, `PaymentDeclinedException` thay vì dùng các Exception chung chung như `RuntimeException`.
3. **Đặt tên message rõ ràng**: Viết các câu thông điệp lỗi Validate rõ ràng để Client (Frontend) có thể parse và hiển thị trực tiếp lên giao diện cho người dùng đầu cuối.
