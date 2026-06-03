# [10] Phase 5 - Advanced: Monitoring & Observability với Spring Boot Actuator

## 1. Nguồn gốc của sự cần thiết phải giám sát hệ thống (Observability)

### Cách làm cũ: Vận hành ứng dụng trong "bóng tối" (Silent Failures)
Trước khi các công cụ giám sát hiện đại ra đời, khi deploy một ứng dụng Java Web lên Production, đội ngũ phát triển và vận hành (DevOps) thường rơi vào trạng thái "mù thông tin":
- Không biết ứng dụng có đang sống hay chết cho tới khi khách hàng gọi điện phàn nàn.
- Không nắm được dung lượng bộ nhớ JVM (Heap memory) còn bao nhiêu, có bị rò rỉ bộ nhớ (memory leak) hay không.
- Gặp khó khăn lớn trong việc debug các lỗi kết nối Database Pool cạn kiệt (Database Connection Pool exhaustion).
- Cách kiểm tra duy nhất là SSH vào máy chủ và đọc thủ công tệp log dài hàng triệu dòng bằng lệnh `tail -f`.

### Sự xuất hiện của Observability và Spring Boot Actuator
Để giải quyết bài toán này, Spring Boot cung cấp module **Actuator**. 
> **Spring Boot Actuator** mang các tính năng sẵn sàng cho Production (production-ready features) vào ứng dụng của bạn, giúp bạn giám sát và quản lý ứng dụng qua các HTTP Endpoints hoặc JMX (Java Management Extensions) mà gần như không cần viết dòng code nào.

---

## 2. Các Endpoints quan trọng của Spring Boot Actuator

Chỉ cần thêm thư viện starter vào dự án:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-actuator</artifactId>
</dependency>
```

Mặc định, Spring Boot chỉ phơi bày (expose) hai endpoint là `/actuator/health` và `/actuator/info` qua giao thức HTTP vì lý do bảo mật. Bạn có thể cấu hình mở rộng thêm các endpoint khác qua file `application.properties`:
```properties
# Phơi bày tất cả các endpoints qua HTTP (Chỉ dùng trong môi trường Local/Dev!)
management.endpoints.web.exposure.include=*
```

### Các Endpoint phổ biến:
1.  **`/actuator/health`**: Kiểm tra trạng thái hoạt động của ứng dụng. Trả về `{"status": "UP"}`. Khi cấu hình chi tiết, nó có thể hiển thị sức khỏe của Database kết nối, đĩa cứng, Mail Server, v.v.
2.  **`/actuator/metrics`**: Hiển thị các thông số đo lường hiệu năng của JVM (memory, thread, garbage collection) và các request HTTP.
3.  **`/actuator/env`**: Phơi bày các biến môi trường và thuộc tính cấu hình đang được nạp vào ứng dụng.
4.  **`/actuator/threaddump`**: Trả về danh sách tất cả các Thread đang chạy và trạng thái của chúng, cực kỳ hữu ích để debug lỗi **Deadlock**.
5.  **`/actuator/loggers`**: Cho phép xem và **thay đổi trực tiếp Log Level** (ví dụ: chuyển từ INFO sang DEBUG) ngay lúc ứng dụng đang chạy mà không cần khởi động lại.

---

## 3. Tích hợp Hệ thống giám sát: Micrometer, Prometheus và Grafana

Để xây dựng một hệ thống giám sát tự động cho doanh nghiệp lớn, chúng ta không thể gọi thủ công các REST endpoint của Actuator. Chúng ta kết hợp bộ công cụ:

```
[Spring Boot (Actuator + Micrometer)] 
              ↓
      (Expose /actuator/prometheus)
              ↓ (Pull metrics định kỳ)
        [Prometheus] (Time-series database)
              ↓
         [Grafana] (Vẽ Dashboard trực quan, thiết lập cảnh báo Slack/Email)
```

1.  **Micrometer**: Là một thư viện đóng vai trò như một lớp trừu tượng đo lường (như SLF4J cho logging nhưng dành cho metrics). Nó định dạng lại dữ liệu của Actuator thành định dạng mà Prometheus có thể hiểu được.
2.  **Prometheus**: Định kỳ (ví dụ mỗi 15 giây) gửi request kéo dữ liệu từ `/actuator/prometheus` về lưu trữ.
3.  **Grafana**: Kết nối tới Prometheus để vẽ các biểu đồ trực quan như tỉ lệ CPU, RAM, số lượng request/giây, tỉ lệ lỗi HTTP 5xx.

---

## 4. Rủi ro bảo mật nghiêm trọng khi phơi bày Actuator bừa bãi

Việc cấu hình Actuator cẩu thả là một trong những nguyên nhân hàng đầu dẫn đến các vụ rò rỉ dữ liệu lớn trong thế giới Spring Boot:

> [!CAUTION]
> **Rủi ro rò rỉ thông tin nhạy cảm qua `/env`**: Endpoint `/actuator/env` chứa các thông tin cấu hình như mật khẩu database, khóa bí mật JWT, API key của bên thứ ba. Nếu không bảo mật endpoint này, kẻ tấn công có thể dễ dàng đọc được các thông tin này và chiếm quyền kiểm soát toàn bộ hệ thống của bạn.

### Giải pháp bảo vệ Actuator:
1.  **Chỉ expose những endpoint thực sự cần thiết**:
    ```properties
    management.endpoints.web.exposure.include=health,prometheus
    ```
2.  **Bảo mật Actuator bằng Spring Security**: Yêu cầu quyền ADMIN hoặc IP whitelist nội bộ để truy cập các đường dẫn `/actuator/**`.
    ```java
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http.authorizeHttpRequests(auth -> auth
            .requestMatchers("/actuator/health").permitAll() // Cho phép kiểm tra health public
            .requestMatchers("/actuator/**").hasRole("OPS_ADMIN") // Các endpoint khác phải là admin vận hành
            .anyRequest().authenticated()
        );
        return http.build();
    }
    ```
3.  **Ẩn các giá trị nhạy cảm (Sanitization)**: Cấu hình Spring Boot để tự động che giấu các trường nhạy cảm bằng dấu `******`:
    ```properties
    # Che giấu các trường cấu hình chứa từ khóa nhạy cảm
    management.endpoint.env.show-values=when-authorized
    ```
