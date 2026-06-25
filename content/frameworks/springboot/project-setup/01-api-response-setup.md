# Setup chuẩn ApiResponse và Pagination cho Spring Boot (aptis-api)

Tài liệu này ghi lại phần setup response format chuẩn mà team đã thực hiện trong dự án `aptis-api`. Mục tiêu là mọi API JSON đều trả về cùng một envelope để backend, frontend và tester dễ debug và tích hợp.

## 1. Nguồn gốc, So sánh và Rủi ro hệ thống

### a) Nguồn gốc và lý do ra đời
Khi xây dựng hệ thống REST API, nếu mỗi API trả về một cấu trúc dữ liệu khác nhau (khi thì trả về DTO trực tiếp, khi thì trả về String, lúc lỗi thì trả về chuỗi text hoặc cấu trúc HTML lỗi mặc định của Spring), Frontend và Mobile App sẽ gặp cực kỳ nhiều khó khăn trong việc phân tích cú pháp (parsing) và xử lý lỗi đồng bộ. Do đó, cần có một "Envelope" (vỏ bọc) `ApiResponse` chuẩn cho mọi request.

### b) So sánh với cách làm cũ
*   **Cách làm cũ**: Lập trình viên thường viết code thủ công gom kết quả hoặc tự wrap ở từng Controller:
    ```java
    return ResponseEntity.ok(new MyResponse(data));
    ```
    Cách này gây lặp code (boilerplate code) lớn, dễ sai sót, và khó đồng nhất định dạng trên toàn bộ hệ thống.
*   **Cách làm mới**: Sử dụng `ResponseBodyAdvice` để tự động can thiệp vào luồng HTTP Response và wrap dữ liệu thành `ApiResponse` ở mức toàn cục (global), đồng thời tự động chuyển đổi định dạng phân trang `Page` của Spring Data thành metadata sạch sẽ mà không làm phiền đến code nghiệp vụ ở Controller.

### c) Rủi ro khi không áp dụng
*   **Tích hợp Frontend khó khăn**: API không đồng nhất khiến FE phải viết nhiều logic bắt dữ liệu và xử lý lỗi khác nhau cho từng endpoint.
*   **Lộ thông tin nhạy cảm**: Lỗi hệ thống thô có thể bị lộ trực tiếp ra ngoài nếu không được wrap và chuẩn hóa.
*   **Thiếu khả năng tracing**: Khó theo dõi lỗi giữa các microservices hoặc log hệ thống do thiếu mã lỗi nghiệp vụ (`code`) và ID định danh request (`requestId`).

---

## 2. Các file liên quan

Hiện tại phần response chuẩn nằm trong:

```text
aptis-api/src/main/java/com/aptis/common/response
├── ApiResponse.java
├── ApiResponseAdvice.java
└── PageMeta.java
```

Phần response lỗi còn liên quan tới:

```text
aptis-api/src/main/java/com/aptis/common/exception
├── ErrorCode.java
├── GlobalExceptionHandler.java
└── MessageConstant.java
```

---

## 3. Format response chuẩn

Format chung:

```json
{
  "timestamp": "2026-06-25T00:00:00Z",
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Request completed successfully",
  "data": {},
  "meta": {},
  "errors": {},
  "path": "/api/v1/example",
  "requestId": "..."
}
```

Ý nghĩa từng field:

| Field | Ý nghĩa |
|---|---|
| `timestamp` | Thời điểm server tạo response |
| `success` | `true` nếu thành công, `false` nếu lỗi |
| `status` | HTTP status code |
| `code` | Mã kết quả, ví dụ `SUCCESS`, `VALIDATION_ERROR`, `IAM_INVALID_CREDENTIAL` |
| `message` | Message ngắn cho FE/debug |
| `data` | Dữ liệu chính của API |
| `meta` | Metadata, dùng cho pagination hoặc thông tin phụ |
| `errors` | Chi tiết lỗi theo field, thường dùng cho validation |
| `path` | Endpoint đang được gọi |
| `requestId` | ID theo dõi request, lấy từ `RequestIdFilter`/MDC |

Các field `null` sẽ không được serialize nhờ:

```java
@JsonInclude(JsonInclude.Include.NON_NULL)
```

---

## 4. ApiResponse dùng để làm gì?

`ApiResponse<T>` là record đại diện cho response envelope chung.

Các factory method chính:

```java
ApiResponse.success(...)
ApiResponse.paged(...)
ApiResponse.error(...)
```

Trong đó:

- `success(...)`: dùng cho response thành công bình thường.
- `paged(...)`: dùng cho response có phân trang.
- `error(...)`: dùng cho response lỗi, thường được gọi trong `GlobalExceptionHandler`.

---

## 5. Response thành công bình thường

Ví dụ controller/service trả về object:

```json
{
  "id": 1,
  "name": "Admin"
}
```

Sau khi đi qua `ApiResponseAdvice`, response thực tế sẽ là:

```json
{
  "timestamp": "2026-06-25T00:00:00Z",
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Request completed successfully",
  "data": {
    "id": 1,
    "name": "Admin"
  },
  "path": "/api/v1/admins/1",
  "requestId": "..."
}
```

---

## 6. Request có phân trang thì để ở đâu?

Bạn từng hỏi:

> Đối với request có phân trang thì nên bỏ trong metadata phải không?

Đúng. Dữ liệu danh sách chính nên nằm trong `data`, còn thông tin phân trang nên nằm trong `meta`.

Ví dụ:

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Request completed successfully",
  "data": [
    {
      "id": 1,
      "name": "Admin"
    }
  ],
  "meta": {
    "page": 0,
    "size": 10,
    "totalElements": 35,
    "totalPages": 4,
    "first": true,
    "last": false,
    "hasNext": true,
    "hasPrevious": false
  },
  "path": "/api/v1/admins",
  "requestId": "..."
}
```

Lý do:

- `data` luôn là dữ liệu nghiệp vụ chính.
- `meta` là thông tin phụ để FE render pagination.
- FE không phải đoán `totalPages`, `page`, `size` nằm lẫn trong payload nghiệp vụ.

---

## 7. PageMeta dùng để làm gì?

`PageMeta` nhận `Page<?>` của Spring Data và convert thành metadata gọn hơn.

Các field hiện tại:

```java
public record PageMeta(
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        boolean hasNext,
        boolean hasPrevious)
```

Mapping:

| PageMeta | Lấy từ Spring Page |
|---|---|
| `page` | `page.getNumber()` |
| `size` | `page.getSize()` |
| `totalElements` | `page.getTotalElements()` |
| `totalPages` | `page.getTotalPages()` |
| `first` | `page.isFirst()` |
| `last` | `page.isLast()` |
| `hasNext` | `page.hasNext()` |
| `hasPrevious` | `page.hasPrevious()` |

---

## 8. ApiResponseAdvice dùng để làm gì?

`ApiResponseAdvice` là lớp tự động wrap response JSON thành `ApiResponse`.

Nó implement:

```java
ResponseBodyAdvice<Object>
```

Vì vậy controller không cần tự viết:

```java
return ApiResponse.success(data, path);
```

Controller có thể chỉ trả DTO/list/page như bình thường, còn `ApiResponseAdvice` sẽ wrap lại.

---

## 9. Khi nào ApiResponseAdvice không wrap?

Hiện tại `ApiResponseAdvice` bỏ qua các trường hợp:

- Body là `null`.
- Body đã là `ApiResponse`.
- Body là `Resource`.
- Body là `byte[]`.
- Body là `StreamingResponseBody`.
- Body là `String`.
- Response không phải JSON.

Lý do cần bỏ qua:

- Tránh double wrap response đã chuẩn.
- Không làm hỏng file download/resource/stream.
- Không gây lỗi converter với `String`.
- Không can thiệp vào response không phải JSON.

---

## 10. Workflow response thành công

Luồng response thành công:

```text
Client gọi API
  ↓
RequestIdFilter tạo/nhận requestId
  ↓
RequestLoggingFilter bắt đầu đo thời gian
  ↓
Spring Security
  ↓
DispatcherServlet
  ↓
Controller trả DTO/List/Page
  ↓
ApiResponseAdvice.beforeBodyWrite(...)
  ↓
Nếu body là Page:
    data = page.getContent()
    meta = PageMeta.from(page)
Nếu body thường:
    data = body
  ↓
Trả response JSON chuẩn cho client
  ↓
RequestLoggingFilter ghi log
  ↓
RequestIdFilter clear MDC
```

---

## 11. Workflow response lỗi

Luồng response lỗi:

```text
Client gọi API
  ↓
RequestIdFilter tạo/nhận requestId
  ↓
Controller/Service phát sinh lỗi
  ↓
GlobalExceptionHandler bắt lỗi
  ↓
GlobalExceptionHandler gọi ApiResponse.error(...)
  ↓
Response đã là ApiResponse
  ↓
ApiResponseAdvice nhìn thấy body instanceof ApiResponse
  ↓
Không wrap thêm lần nữa
  ↓
Client nhận response lỗi chuẩn
```

Điểm quan trọng: lỗi không bị double wrap vì `ApiResponseAdvice` có check:

```java
body instanceof ApiResponse<?>
```

---

## 12. Workflow response phân trang

Khi controller trả về `Page<T>`:

```text
Controller trả Page<T>
  ↓
ApiResponseAdvice phát hiện body instanceof Page<?>
  ↓
ApiResponse.paged(...)
  ↓
data = page.getContent()
meta = PageMeta.from(page)
  ↓
Client nhận response có data + meta
```

Response mẫu:

```json
{
  "success": true,
  "status": 200,
  "code": "SUCCESS",
  "message": "Request completed successfully",
  "data": [
    {
      "id": 1
    }
  ],
  "meta": {
    "page": 0,
    "size": 10,
    "totalElements": 1,
    "totalPages": 1,
    "first": true,
    "last": true,
    "hasNext": false,
    "hasPrevious": false
  },
  "path": "/api/v1/example",
  "requestId": "..."
}
```

---

## 13. Vì sao chỉ config mà chưa cần apply vào controller?

Bạn từng yêu cầu:

> Chỉ cần config chưa cần apply vào controller.

Cách hiện tại đúng với yêu cầu đó:

- Không sửa controller.
- Không bắt từng controller phải return `ApiResponse`.
- Dùng `ApiResponseAdvice` để wrap global cho JSON response.
- Dùng `GlobalExceptionHandler` để trả lỗi theo chuẩn.

Nghĩa là khi controller sau này trả DTO bình thường, response vẫn được chuẩn hóa tự động.

---

## 14. Lưu ý với Spring Security

Các lỗi phát sinh trong controller/service sẽ đi qua `GlobalExceptionHandler`.

But lỗi security như:

- Chưa đăng nhập.
- Token sai/hết hạn.
- Không đủ quyền.

có thể xảy ra trước controller. Vì vậy khi làm auth admin, nên thêm:

- Custom `AuthenticationEntryPoint` cho `401`.
- Custom `AccessDeniedHandler` cho `403`.

Hai class đó nên trả cùng format `ApiResponse.error(...)`.

Nếu không làm phần này, lỗi security có thể trả format mặc định của Spring Security, không giống chuẩn response chung.

---

## 15. Checklist khi setup lại từ đầu

1. Tạo package:

   ```text
   com.aptis.common.response
   com.aptis.common.exception
   com.aptis.common.filter
   ```

2. Tạo response classes:

   ```text
   ApiResponse.java
   PageMeta.java
   ApiResponseAdvice.java
   ```

3. Tạo exception classes:

   ```text
   MessageConstant.java
   ErrorCode.java
   ApiException.java
   GlobalExceptionHandler.java
   ```

4. Tạo filter classes:

   ```text
   RequestIdFilter.java
   RequestLoggingFilter.java
   ```

5. Đảm bảo app scan được package `com.aptis`.

   Main app hiện tại đã dùng:

   ```java
   @SpringBootApplication(scanBasePackages = "com.aptis")
   ```

6. Chạy test/build:

   ```powershell
   .\mvnw.cmd clean test
   ```

7. Nếu build Docker:

   ```powershell
   docker compose build api
   docker compose up -d api
   ```

---

## 16. Code cụ thể cho từng file

Phần này là code mẫu đầy đủ theo setup hiện tại. Khi setup lại từ đầu, tạo đúng package/path rồi copy từng file tương ứng.

### 16.1. `ApiResponse.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/response/ApiResponse.java
```

Code:

```java
package com.aptis.common.response;

import java.time.Instant;
import java.util.List;
import java.util.Map;

import org.slf4j.MDC;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;

import com.aptis.common.exception.ErrorCode;
import com.aptis.common.filter.RequestIdFilter;
import com.fasterxml.jackson.annotation.JsonInclude;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record ApiResponse<T>(
        Instant timestamp,
        boolean success,
        int status,
        String code,
        String message,
        T data,
        Object meta,
        Map<String, String> errors,
        String path,
        String requestId) {

    public static <T> ApiResponse<T> success(
            HttpStatus status,
            String code,
            String message,
            T data,
            String path) {
        return new ApiResponse<>(
                Instant.now(),
                true,
                status.value(),
                code,
                message,
                data,
                null,
                null,
                path,
                currentRequestId());
    }

    public static <T> ApiResponse<T> success(T data, String path) {
        return success(
                HttpStatus.OK,
                "SUCCESS",
                "Request completed successfully",
                data,
                path);
    }

    public static <T> ApiResponse<List<T>> paged(
            HttpStatus status,
            String code,
            String message,
            Page<T> page,
            String path) {
        return new ApiResponse<>(
                Instant.now(),
                true,
                status.value(),
                code,
                message,
                page.getContent(),
                PageMeta.from(page),
                null,
                path,
                currentRequestId());
    }

    public static <T> ApiResponse<List<T>> paged(Page<T> page, String path) {
        return paged(
                HttpStatus.OK,
                "SUCCESS",
                "Request completed successfully",
                page,
                path);
    }

    public static ApiResponse<Void> error(
            ErrorCode errorCode,
            Map<String, String> errors,
            String path) {
        return new ApiResponse<>(
                Instant.now(),
                false,
                errorCode.getStatus().value(),
                errorCode.name(),
                errorCode.getDefaultMessage(),
                null,
                null,
                errors,
                path,
                currentRequestId());
    }

    private static String currentRequestId() {
        return MDC.get(RequestIdFilter.MDC_KEY);
    }
}
```

### 16.2. `PageMeta.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/response/PageMeta.java
```

Code:

```java
package com.aptis.common.response;

import org.springframework.data.domain.Page;

public record PageMeta(
        int page,
        int size,
        long totalElements,
        int totalPages,
        boolean first,
        boolean last,
        boolean hasNext,
        boolean hasPrevious) {

    public static PageMeta from(Page<?> page) {
        return new PageMeta(
                page.getNumber(),
                page.getSize(),
                page.getTotalElements(),
                page.getTotalPages(),
                page.isFirst(),
                page.isLast(),
                page.hasNext(),
                page.hasPrevious());
    }
}
```

### 16.3. `ApiResponseAdvice.java`

Path:

```text
aptis-api/src/main/java/com/aptis/common/response/ApiResponseAdvice.java
```

Code:

```java
package com.aptis.common.response;

import org.springframework.core.MethodParameter;
import org.springframework.core.io.Resource;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.converter.HttpMessageConverter;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpResponse;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.mvc.method.annotation.ResponseBodyAdvice;
import org.springframework.web.servlet.mvc.method.annotation.StreamingResponseBody;

@RestControllerAdvice
public class ApiResponseAdvice implements ResponseBodyAdvice<Object> {

    @Override
    public boolean supports(
            MethodParameter returnType,
            Class<? extends HttpMessageConverter<?>> converterType) {
        return true;
    }

    @Override
    public Object beforeBodyWrite(
            Object body,
            MethodParameter returnType,
            MediaType selectedContentType,
            Class<? extends HttpMessageConverter<?>> selectedConverterType,
            ServerHttpRequest request,
            ServerHttpResponse response) {
        if (body == null
                || body instanceof ApiResponse<?>
                || body instanceof Resource
                || body instanceof byte[]
                || body instanceof StreamingResponseBody
                || body instanceof String
                || !MediaType.APPLICATION_JSON.isCompatibleWith(selectedContentType)) {
            return body;
        }

        HttpStatus status = resolveStatus(response);
        String path = request.getURI().getPath();

        if (body instanceof Page<?> page) {
            return ApiResponse.paged(
                    status,
                    "SUCCESS",
                    "Request completed successfully",
                    page,
                    path);
        }

        return ApiResponse.success(
                status,
                "SUCCESS",
                "Request completed successfully",
                body,
                path);
    }

    private HttpStatus resolveStatus(ServerHttpResponse response) {
        if (response instanceof ServletServerHttpResponse servletResponse) {
            return HttpStatus.valueOf(servletResponse.getServletResponse().getStatus());
        }
        return HttpStatus.OK;
    }
}
```

### 16.4. Code liên quan bên exception

Để `ApiResponse.error(...)` hoạt động, cần có thêm các file exception:

```text
aptis-api/src/main/java/com/aptis/common/exception/ApiException.java
aptis-api/src/main/java/com/aptis/common/exception/ErrorCode.java
aptis-api/src/main/java/com/aptis/common/exception/MessageConstant.java
aptis-api/src/main/java/com/aptis/common/exception/GlobalExceptionHandler.java
```

Full code của các file này nằm trong bài viết [02-common-exception-setup.md](./02-common-exception-setup.md).

### 16.5. Code liên quan bên filter

Để `requestId` có trong response, cần có:

```text
aptis-api/src/main/java/com/aptis/common/filter/RequestIdFilter.java
aptis-api/src/main/java/com/aptis/common/filter/RequestLoggingFilter.java
```

Full code của các file này nằm trong bài viết [02-common-exception-setup.md](./02-common-exception-setup.md).
