# [11] Phase 5 - Advanced: Monitoring & Observability với Actuator & Micrometer

## 1. Nguồn gốc của sự cần thiết phải giám sát hệ thống (Observability)

### a) Vận hành ứng dụng trong "bóng tối" (Silent Failures)
Khi triển khai ứng dụng Spring Boot lên môi trường Production (như Cloud, Docker, Kubernetes), một vấn đề lớn phát sinh:
- **Tình trạng**: Ứng dụng chạy chậm dần, thỉnh thoảng bị đứng hình hoặc đột ngột sập mà không có bất kỳ dòng log lỗi nào chỉ ra nguyên nhân.
- Lập trình viên và đội ngũ vận hành (Ops) hoàn toàn rơi vào trạng thái "mù thông tin" (Operational Blindness). Họ không biết máy chủ đang tốn bao nhiêu RAM, tốc độ dọn rác của Garbage Collector (GC) thế nào, số lượng kết nối DB Pool còn bao nhiêu, hay luồng CPU đang bị nghẽn ở đâu.

### b) Giải pháp: Spring Boot Actuator & Micrometer
Để giải quyết bài toán giám sát, Spring Boot tích hợp sẵn:
- **Spring Boot Actuator**: Cung cấp các Endpoint HTTP (ví dụ `/actuator/health`, `/actuator/metrics`) để kiểm tra trạng thái sức khỏe, thông tin cấu hình, và hoạt động bên trong JVM thời gian thực.
- **Micrometer**: Đóng vai trò là một facade đo lường (Metrics Facade) độc lập với nhà cung cấp (giống như SLF4J đối với logging). Nó thu thập các chỉ số hiệu năng (JVM memory, HTTP request count, latency) và định dạng lại để đẩy về các hệ thống thu thập dữ liệu lớn như **Prometheus**, **Datadog**, hay **New Relic**.

---

## 2. So sánh và Cấu trúc Hệ thống giám sát hiện đại

Kiến trúc giám sát chuẩn công nghiệp thường kết hợp 3 thành phần:

```
┌────────────────────────┐      (Pull Metrics)      ┌────────────────┐
│   Spring Boot App      │ ───────────────────────> │   Prometheus   │
│ - Actuator             │   /actuator/prometheus   │ (TSDB - Lưu    │
│ - Micrometer Facade    │                          │  trữ dữ liệu)  │
└────────────────────────┘                          └───────┬────────┘
                                                            │ (Query)
                                                            ▼
                                                    ┌────────────────┐
                                                    │    Grafana     │
                                                    │ (Hiển thị biểu │
                                                    │   đồ Dashboard)│
                                                    └────────────────┘
```

1. **Spring Boot App**: Thu thập số liệu qua Micrometer, phơi ra endpoint `/actuator/prometheus`.
2. **Prometheus**: Định kỳ kéo (Pull) các metrics này về lưu trữ trong cơ sở dữ liệu chuỗi thời gian (Time-Series Database).
3. **Grafana**: Kết nối vào Prometheus để vẽ các biểu đồ trực quan (Dashboard) giám sát RAM, CPU, và Traffic mạng.

---

## 3. Rủi ro bảo mật nghiêm trọng khi cấu hình sai Actuator

Mặc dù Actuator rất hữu ích, việc cấu hình sai sẽ mở ra các lỗ hổng bảo mật chết người:
- **Lộ thông tin nhạy cảm qua `/actuator/env`**: Trả về toàn bộ biến môi trường của hệ thống, bao gồm cả mật khẩu Database, khóa API, khóa JWT dạng Plain Text nếu không được mã hóa.
- **Rò rỉ dữ liệu qua `/actuator/heapdump`**: Kẻ tấn công có thể tải tệp dump bộ nhớ RAM của JVM. Tập tin này chứa toàn bộ dữ liệu đang chạy trong RAM của ứng dụng, bao gồm cả thông tin tài khoản, token đăng nhập của người dùng.
- *Khắc phục*: Luôn sử dụng Spring Security để khóa chặt các endpoint Actuator nhạy cảm và chỉ mở công khai `/actuator/health`.

---

## 4. Code ví dụ minh họa chi tiết

### a) Bảo vệ Endpoint Actuator bằng Spring Security
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class ActuatorSecurityConfig {

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                // Endpoint /health được truy cập công khai để Load Balancer kiểm tra sống/chết
                .requestMatchers("/actuator/health").permitAll()
                // Tất cả các endpoint Actuator nhạy cảm khác chỉ cho phép vai trò ADMIN
                .requestMatchers("/actuator/**").hasRole("ADMIN")
                .anyRequest().authenticated()
            );
        return http.build();
    }
}
```

### b) Đăng ký một Custom Metric (Counter) bằng Micrometer
```java
import io.micrometer.core.instrument.Counter;
import io.micrometer.core.instrument.MeterRegistry;
import org.springframework.stereotype.Service;

@Service
public class OrderService {

    private final Counter orderCounter;

    // Micrometer MeterRegistry tự động được tiêm qua Constructor Injection
    public OrderService(MeterRegistry meterRegistry) {
        // Tạo một bộ đếm số đơn hàng thành công
        this.orderCounter = Counter.builder("shop.orders.placed")
                .description("Tổng số đơn hàng đã tạo thành công")
                .tag("status", "success")
                .register(meterRegistry);
    }

    public void placeOrder() {
        // Logic xử lý đơn hàng...
        
        // Tăng chỉ số đếm lên 1 đơn vị. Metrics này sẽ tự động xuất hiện trên Prometheus
        orderCounter.increment();
    }
}
```
