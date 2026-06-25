# Setup Common Exception và Request Filter cho Spring Boot (aptis-api)

Tài liệu này ghi lại phần setup `common exception` và `middleware/filter` mà team đã thực hiện trong dự án `aptis-api`. Mục tiêu là gom lỗi về một chuẩn chung, giúp backend dễ kiểm soát response lỗi, frontend dễ debug, và log luôn có `requestId` để lần theo từng request.

## 1. Nguồn gốc, So sánh và Rủi ro hệ thống

### a) Nguồn gốc và lý do ra đời
Lỗi xảy ra trong hệ thống là điều không tránh khỏi (lỗi validate dữ liệu, lỗi database, lỗi logic nghiệp vụ...). Nếu không có cơ chế xử lý lỗi tập trung, lập trình viên phải đặt các khối `try-catch` lặp đi lặp lại ở mọi tầng nghiệp vụ, khiến code trở nên rối rắm và khó bảo trì. Đồng thời, khi xảy ra lỗi đột xuất, hệ thống có thể trả về cấu trúc HTML hoặc StackTrace thô lộ sơ đồ cơ sở dữ liệu và cấu trúc server. Do đó, cần có một bộ lọc exception global và cơ chế gán ID cho request.

### b) So sánh với cách làm cũ
*   **Cách làm cũ**: Việc quản lý exception diễn ra cục bộ trong từng Controller bằng `try-catch`, hoặc dùng các Servlet Filter phức tạp. Mỗi endpoint trả về một định dạng lỗi khác nhau. Việc truy vết log trong môi trường đa luồng (multi-threading) cực kỳ khó khăn do các dòng log của nhiều request bị trộn lẫn vào nhau.
*   **Cách làm mới**: 
    - Sử dụng `@RestControllerAdvice` để bắt toàn bộ exception trên toàn bộ hệ thống và tự động map thành mã lỗi `ErrorCode` với HTTP status và message tương ứng.
    - Sử dụng **MDC (Mapped Diagnostic Context)** của SLF4J thông qua `RequestIdFilter` để gán một `requestId` duy nhất đi suốt vòng đời request, in ra ở mọi dòng log của request đó.

### c) Rủi ro khi không áp dụng
*   **Code phình to & khó bảo trì**: Code chứa quá nhiều khối `try-catch` thừa thãi làm lu mờ logic nghiệp vụ chính.
*   **Rò rỉ thông tin hệ thống (Information Leakage)**: Lộ thông tin cấu trúc hệ thống (tên bảng, tên cột DB, tên class Java) thông qua White Label Error Page khi có lỗi runtime, tạo cơ hội cho hacker tấn công.
*   **Mất dấu vết request**: Không thể tìm kiếm và gom nhóm các dòng log thuộc về một request cụ thể trong file log khổng lồ, gây khó khăn cực kỳ khi hệ thống gặp lỗi trên production.

---

## 2. Các file liên quan

Hiện tại phần common exception/filter nằm trong:

```text
aptis-api/src/main/java/com/aptis/common
├── exception
│   ├── ApiException.java
│   ├── ErrorCode.java
│   ├── GlobalExceptionHandler.java
│   └── MessageConstant.java
└── filter
    ├── RequestIdFilter.java
    └── RequestLoggingFilter.java
```

---

## 3. Ý tưởng thiết kế

Thay vì mỗi controller tự `try/catch` rồi tự trả lỗi, toàn bộ lỗi nên đi qua một lớp xử lý chung là `GlobalExceptionHandler`.

Luồng tư duy là:

```text
Code nghiệp vụ phát hiện lỗi
        ↓
throw new ApiException(ErrorCode.X)
        ↓
GlobalExceptionHandler bắt lỗi
        ↓
Map ErrorCode thành HTTP status + message
        ↓
Trả về ApiResponse lỗi thống nhất
```

Ví dụ login sai email/password không nên tự build response trong controller. Chỉ cần:

```java
throw new ApiException(ErrorCode.IAM_INVALID_CREDENTIAL);
```

Sau đó handler sẽ trả response lỗi chuẩn với message:

```text
Invalid email or password
```

---

## 4. MessageConstant dùng để làm gì?

`MessageConstant` là nơi gom các message mặc định.

Ví dụ:

```java
public class MessageConstant {
    public static final String BAD_REQUEST_DATA = "Request data is invalid";
    public static final String INVALID_AUTHORIZED = "Invalid email or password";
    public static final String UNAUTHORIZED = "Authentication is required";
}
```

Lý do nên tách message ra khỏi exception:

- Dễ quản lý text trả về cho FE.
- Dễ sửa message mà không phải lục nhiều file.
- Sau này nếu cần i18n (đa ngôn ngữ) hoặc chuẩn hóa wording thì dễ nâng cấp hơn.

---

## 5. ErrorCode dùng để làm gì?

`ErrorCode` là enum mô tả từng loại lỗi của hệ thống. Mỗi `ErrorCode` gồm HTTP status và default message.

Các mã lỗi có ý nghĩa nghiệp vụ rõ ràng:

```text
VALIDATION_ERROR        -> dữ liệu request không hợp lệ
MALFORMED_REQUEST       -> body JSON sai format
IAM_INVALID_CREDENTIAL  -> email hoặc password sai
UNAUTHENTICATED         -> chưa đăng nhập / token thiếu hoặc sai
ACCESS_DENIED           -> đã đăng nhập nhưng không đủ quyền
RESOURCE_NOT_FOUND      -> không tìm thấy tài nguyên
RESOURCE_CONFLICT       -> dữ liệu bị conflict
INTERNAL_ERROR          -> lỗi server không mong muốn
```

Không nên định nghĩa các mã lỗi quá chung chung kiểu `BadRequest` rồi truyền message tự do. `ErrorCode` nên cụ thể theo ngữ cảnh. Ví dụ sai password là `IAM_INVALID_CREDENTIAL`, status là `401`, message là `Invalid email or password`. Như vậy FE/debug/log nhìn vào `code` sẽ rõ ràng hơn.

---

## 6. ApiException dùng để làm gì?

`ApiException` là custom exception dùng trong code nghiệp vụ.

```java
public class ApiException extends RuntimeException {
    private final ErrorCode errorCode;

    public ApiException(ErrorCode errCode) {
        super(errCode.getDefaultMessage());
        this.errorCode = errCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
```

Khi service/controller gặp lỗi đã biết trước, chỉ cần throw:

```java
throw new ApiException(ErrorCode.RESOURCE_NOT_FOUND);
```

---

## 7. GlobalExceptionHandler hoạt động như thế nào?

`GlobalExceptionHandler` dùng annotation `@RestControllerAdvice`. Nó lắng nghe exception phát sinh từ controller layer và convert exception thành response chuẩn.

Hiện tại handler xử lý các nhóm lỗi:

| Exception | Ý nghĩa | ErrorCode trả về |
|---|---|---|
| `ApiException` | Lỗi nghiệp vụ chủ động throw | Theo errorCode được truyền vào |
| `MethodArgumentNotValidException` | DTO validate fail, ví dụ `@NotBlank`, `@Email` | `VALIDATION_ERROR` |
| `HttpMessageNotReadableException` | Body JSON sai format hoặc không parse được | `MALFORMED_REQUEST` |
| `Exception` | Lỗi không lường trước | `INTERNAL_ERROR` |

Ví dụ validation fail, response sẽ có thêm `errors`:

```json
{
  "success": false,
  "status": 400,
  "code": "VALIDATION_ERROR",
  "message": "Request data is invalid",
  "errors": {
    "email": "must be a well-formed email address",
    "password": "must not be blank"
  },
  "path": "/api/v1/auth/login",
  "requestId": "..."
}
```

---

## 8. RequestIdFilter dùng để làm gì?

`RequestIdFilter` là filter chạy rất sớm trong mỗi request.

Nhiệm vụ:
- Đọc header `X-Request-ID` nếu client gửi lên.
- Nếu không có hoặc không hợp lệ thì tự sinh UUID.
- Gắn `X-Request-ID` vào response header.
- Đưa `requestId` vào MDC để log và response có thể dùng lại.
- Xóa MDC ở cuối request để tránh leak dữ liệu giữa các request.

Luồng xử lý:

```text
Client gửi request
        ↓
RequestIdFilter kiểm tra X-Request-ID
        ↓
Nếu hợp lệ: dùng requestId từ client
Nếu không: sinh UUID mới
        ↓
MDC.put("requestId", requestId)
        ↓
response.setHeader("X-Request-ID", requestId)
        ↓
Cho request đi tiếp
        ↓
finally MDC.remove("requestId")
```

---

## 9. RequestLoggingFilter dùng để làm gì?

`RequestLoggingFilter` ghi log ngắn gọn cho mỗi request gồm: `requestId`, HTTP method, path, response status, và durationMs.

Ví dụ log:

```text
requestId=abc-123 method=POST path=/api/v1/auth/login status=401 durationMs=42
```

Filter này chạy sau `RequestIdFilter`, vì nó cần lấy `requestId` từ MDC.

---

## 10. MDC là gì?

MDC là viết tắt của `Mapped Diagnostic Context`. Nó là một vùng context nhỏ gắn với thread hiện tại (ThreadLocal), dùng để lưu trữ dữ liệu bổ trợ cho logging (trong project này là `requestId`).

Nhờ vậy ở bất kỳ đoạn code nào trong cùng request, log có thể lấy:

```java
MDC.get(RequestIdFilter.MDC_KEY)
```

**Lưu ý cực kỳ quan trọng**: servlet container tái sử dụng thread. Vì vậy `RequestIdFilter` phải gọi `MDC.remove(RequestIdFilter.MDC_KEY)` trong khối `finally`. Nếu không remove, request sau chạy cùng thread có thể dính nhầm `requestId` của request trước.

---

## 11. Workflow đầy đủ của exception/filter

Luồng request thành công:

```text
Client
  ↓
RequestIdFilter
  - tạo/nhận requestId
  - put vào MDC
  - set response header X-Request-ID
  ↓
RequestLoggingFilter
  - bắt đầu đo thời gian
  ↓
Spring Security
  ↓
DispatcherServlet
  ↓
Controller / Service chạy thành công
  ↓
ApiResponseAdvice wrap response
  ↓
RequestLoggingFilter ghi log status/duration
  ↓
RequestIdFilter clear MDC
  ↓
Client nhận response
```

Luồng request lỗi nghiệp vụ:

```text
Client
  ↓
RequestIdFilter tạo requestId
  ↓
RequestLoggingFilter bắt đầu đo thời gian
  ↓
Controller / Service
  ↓
throw new ApiException(ErrorCode.X)
  ↓
GlobalExceptionHandler bắt ApiException
  ↓
ApiResponse.error(...)
  ↓
RequestLoggingFilter ghi log lỗi/status
  ↓
RequestIdFilter clear MDC
  ↓
Client nhận response lỗi chuẩn
```

---

## 12. Note cho phần auth admin sau này

Hiện tại `GlobalExceptionHandler` xử lý tốt lỗi đi qua controller. Nhưng lỗi authentication/authorization của Spring Security có thể xảy ra trước controller (ở tầng filter chain). Khi làm auth admin, nên bổ sung thêm:

- Custom `AuthenticationEntryPoint` cho lỗi `401`.
- Custom `AccessDeniedHandler` cho lỗi `403`.

Hai handler này cũng nên trả cùng format `ApiResponse.error(...)`, để lỗi security không bị lệch format với lỗi nghiệp vụ.

---

## 13. Code cụ thể cho từng file

Phần này là code mẫu đầy đủ theo setup hiện tại. Khi setup lại từ đầu, chỉ cần tạo đúng package/path rồi copy tương ứng.

### 13.1. `ApiException.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/exception/ApiException.java
```

Code:

```java
package com.aptis.common.exception;

public class ApiException extends RuntimeException {
    private final ErrorCode errorCode;

    public ApiException(ErrorCode errCode) {
        super(errCode.getDefaultMessage());
        this.errorCode = errCode;
    }

    public ErrorCode getErrorCode() {
        return errorCode;
    }
}
```

### 13.2. `MessageConstant.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/exception/MessageConstant.java
```

Code:

```java
package com.aptis.common.exception;

public class MessageConstant {
    public static final String BAD_REQUEST_DATA = "Request data is invalid";
    public static final String BAD_REQUEST_BODY = "Request body is invalid";
    public static final String INVALID_AUTHORIZED = "Invalid email or password";
    public static final String UNAUTHORIZED = "Authentication is required";
    public static final String FORBIDDEN = "You do not have permission";
    public static final String NOT_FOUND = "Resource not found";
    public static final String CONFLICT = "Resource conflict";
    public static final String INTERNAL_SERVER_ERROR = "An unexpected error occurred";
}
```

### 13.3. `ErrorCode.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/exception/ErrorCode.java
```

Code:

```java
package com.aptis.common.exception;

import org.springframework.http.HttpStatus;

public enum ErrorCode {

    VALIDATION_ERROR(
            HttpStatus.BAD_REQUEST,
            MessageConstant.BAD_REQUEST_DATA),

    MALFORMED_REQUEST(
            HttpStatus.BAD_REQUEST,
            MessageConstant.BAD_REQUEST_BODY),

    IAM_INVALID_CREDENTIAL(
            HttpStatus.UNAUTHORIZED,
            MessageConstant.INVALID_AUTHORIZED),

    UNAUTHENTICATED(
            HttpStatus.UNAUTHORIZED,
            MessageConstant.UNAUTHORIZED),

    ACCESS_DENIED(
            HttpStatus.FORBIDDEN,
            MessageConstant.FORBIDDEN),

    RESOURCE_NOT_FOUND(
            HttpStatus.NOT_FOUND,
            MessageConstant.NOT_FOUND),

    RESOURCE_CONFLICT(
            HttpStatus.CONFLICT,
            MessageConstant.CONFLICT),

    INTERNAL_ERROR(
            HttpStatus.INTERNAL_SERVER_ERROR,
            MessageConstant.INTERNAL_SERVER_ERROR);

    private final HttpStatus status;
    private final String defaultMessage;

    ErrorCode(HttpStatus status, String defaultMessage) {
        this.status = status;
        this.defaultMessage = defaultMessage;
    }

    public HttpStatus getStatus() {
        return status;
    }

    public String getDefaultMessage() {
        return defaultMessage;
    }
}
```

### 13.4. `GlobalExceptionHandler.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/exception/GlobalExceptionHandler.java
```

Code:

```java
package com.aptis.common.exception;

import java.util.LinkedHashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.aptis.common.filter.RequestIdFilter;
import com.aptis.common.response.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;

@RestControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger LOGGER = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(ApiException.class)
    public ResponseEntity<ApiResponse<Void>> handleApiException(
            ApiException exception,
            HttpServletRequest request) {
        ErrorCode errorCode = exception.getErrorCode();

        ApiResponse<Void> response = ApiResponse.error(
                errorCode,
                null,
                request.getRequestURI());

        return ResponseEntity
                .status(errorCode.getStatus())
                .body(response);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ApiResponse<Void>> handleValidationException(
            MethodArgumentNotValidException exception,
            HttpServletRequest request) {
        Map<String, String> fieldErrors = new LinkedHashMap<>();

        for (FieldError error : exception.getBindingResult().getFieldErrors()) {
            fieldErrors.putIfAbsent(
                    error.getField(),
                    error.getDefaultMessage());
        }

        ApiResponse<Void> response = ApiResponse.error(
                ErrorCode.VALIDATION_ERROR,
                fieldErrors,
                request.getRequestURI());

        return ResponseEntity
                .badRequest()
                .body(response);
    }

    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ApiResponse<Void>> handleMalformedRequest(
            HttpMessageNotReadableException exception,
            HttpServletRequest request) {
        ApiResponse<Void> response = ApiResponse.error(
                ErrorCode.MALFORMED_REQUEST,
                null,
                request.getRequestURI());

        return ResponseEntity
                .badRequest()
                .body(response);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ApiResponse<Void>> handleUnexpectedException(
            Exception exception,
            HttpServletRequest request) {
        String requestId = MDC.get(RequestIdFilter.MDC_KEY);

        LOGGER.error(
                "Unhandled exception, requestId={}",
                requestId,
                exception);

        ApiResponse<Void> response = ApiResponse.error(
                ErrorCode.INTERNAL_ERROR,
                null,
                request.getRequestURI());

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(response);
    }
}
```

### 13.5. `RequestIdFilter.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/filter/RequestIdFilter.java
```

Code:

```java
package com.aptis.common.filter;

import java.io.IOException;
import java.util.UUID;
import java.util.regex.Pattern;

import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
public class RequestIdFilter extends OncePerRequestFilter {

    public static final String HEADER_NAME = "X-Request-ID";
    public static final String MDC_KEY = "requestId";

    private static final Pattern VALID_REQUEST_ID = Pattern.compile("[A-Za-z0-9._-]{1,100}");

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String requestId = resolveRequestId(request);

        MDC.put(MDC_KEY, requestId);
        response.setHeader(HEADER_NAME, requestId);

        try {
            filterChain.doFilter(request, response);
        } finally {
            MDC.remove(MDC_KEY);
        }
    }

    private String resolveRequestId(HttpServletRequest request) {
        String suppliedRequestId = request.getHeader(HEADER_NAME);

        if (suppliedRequestId != null
                && VALID_REQUEST_ID.matcher(suppliedRequestId).matches()) {
            return suppliedRequestId;
        }

        return UUID.randomUUID().toString();
    }
}
```

### 13.6. `RequestLoggingFilter.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/filter/RequestLoggingFilter.java
```

Code:

```java
package com.aptis.common.filter;

import java.io.IOException;
import java.util.concurrent.TimeUnit;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.slf4j.MDC;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 1)
public class RequestLoggingFilter extends OncePerRequestFilter {

    private static final Logger LOGGER = LoggerFactory.getLogger(RequestLoggingFilter.class);

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        long startedAt = System.nanoTime();

        try {
            filterChain.doFilter(request, response);
        } finally {
            long durationMs = TimeUnit.NANOSECONDS.toMillis(
                    System.nanoTime() - startedAt);

            LOGGER.info(
                    "requestId={} method={} path={} status={} durationMs={}",
                    MDC.get(RequestIdFilter.MDC_KEY),
                    request.getMethod(),
                    request.getRequestURI(),
                    response.getStatus(),
                    durationMs);
        }
    }
}
```
