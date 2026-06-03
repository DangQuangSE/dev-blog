# [13] Phase 7 - Microservices: Kiến trúc Microservices với Spring Cloud

## 1. Nguồn gốc của sự chuyển dịch từ Monolithic sang Microservices

### Giới hạn của Kiến trúc Monolithic (Đơn khối)
Trong giai đoạn đầu phát triển ứng dụng, kiến trúc Monolithic là lựa chọn mặc định: toàn bộ các thành phần như Quản lý người dùng, Giỏ hàng, Thanh toán, Vận chuyển được đóng gói chung vào một file `.war` hoặc `.jar` duy nhất và kết nối chung tới một Database.
- **Hạn chế khi hệ thống lớn lên**:
  1. **Khó scale độc lập**: Nếu dịch vụ Giỏ hàng cần nhiều RAM để xử lý, bạn bắt buộc phải nhân bản (scale) toàn bộ ứng dụng Monolithic, gây lãng phí tài nguyên cho các phần khác không cần thiết.
  2. **Thời gian build và deploy lâu**: Một thay đổi nhỏ ở dòng code của phần Thanh toán yêu cầu compile, build và khởi động lại toàn bộ hệ thống lớn, làm chậm tốc độ phát triển (Development Velocity).
  3. **Rủi ro Single Point of Failure**: Lỗi Out-Of-Memory ở module Báo cáo có thể làm sập toàn bộ máy chủ, kéo theo các dịch vụ cốt lõi khác như Đăng nhập, Thanh toán cũng chết theo.

### Sự xuất hiện của Microservices (Kiến trúc vi dịch vụ)
Kiến trúc Microservices chia nhỏ ứng dụng lớn thành các dịch vụ độc lập, gọn nhẹ:
- Mỗi dịch vụ chạy trong một tiến trình riêng, tự quản lý cơ sở dữ liệu của riêng nó (Database per Service) và giao tiếp với nhau qua mạng (REST API, gRPC hoặc Message Queue).
- Để giải quyết các thách thức của hệ thống phân tán, **Spring Cloud** ra đời để đóng gói các mẫu thiết kế (Design Patterns) phổ biến thành thư viện dễ sử dụng.

---

## 2. Các thành phần cốt lõi của Spring Cloud

Một hệ thống Microservices xây dựng bằng Spring Cloud thường có sự tham gia của các thành phần sau:

```
                  [Client Request]
                         │
                         ▼
               [API Gateway (Spring Cloud Gateway)] 
               (Định tuyến, Xác thực tập trung)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
[Auth Service]   [Order Service]  [Product Service]
   (Register)       (Register)       (Register)
        │                │                │
        └──────────┬─────┴────────────────┘
                   ▼
     [Service Discovery (Eureka Server)] 
     (Bản đồ quản lý IP của các service)
```

### a) Service Discovery (Eureka Server & Client)
Trong môi trường microservices (đặc biệt khi chạy trên Kubernetes hoặc Cloud), các instance của service có thể tự động tăng/giảm và IP thay đổi liên tục.
- **Eureka Server**: Đóng vai trò như một danh bạ điện thoại. Khi khởi động, mọi Service Instance (Eureka Client) sẽ gửi IP và cổng của nó để đăng ký danh tính.
- **Load Balancing (Spring Cloud LoadBalancer)**: Khi `Order Service` cần gọi `Product Service`, nó sẽ hỏi Eureka Server để lấy danh sách IP khả dụng của `Product Service` và tự động thực hiện chia tải.

### b) API Gateway (Spring Cloud Gateway)
Là cửa ngõ duy nhất đón nhận request từ các Client bên ngoài (Web/Mobile) và định tuyến tới các service bên trong.
- **Tính năng**: Kiểm tra bảo mật (JWT Authentication) tập trung tại Gateway trước khi forward request vào trong, giới hạn tần suất request (Rate Limiting) để chống DDOS, và ghi log tập trung.

### c) Centralized Configuration (Spring Cloud Config)
Thay vì lưu tệp `application.properties` bên trong từng Service jar riêng biệt (rất khó thay đổi cấu hình lúc runtime).
- **Spring Cloud Config Server**: Nạp cấu hình từ một kho lưu trữ tập trung (như Git repository) và phân phối tới các microservices. Khi thay đổi cấu hình trên Git, ta có thể cập nhật cấu hình cho toàn hệ thống mà không cần build hay restart service.

---

## 3. Ví dụ cấu hình Eureka Server tối giản

Chỉ cần tạo một dự án Spring Boot thông thường, thêm starter `spring-cloud-starter-netflix-eureka-server` và bật tính năng:

```java
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.netflix.eureka.server.EnableEurekaServer;

@SpringBootApplication
@EnableEurekaServer // Kích hoạt Service Registry Server
public class EurekaServerApplication {
    public static void main(String[] args) {
        SpringApplication.run(EurekaServerApplication.class, args);
    }
}
```

Cấu hình file `application.yml` cho Eureka Server:
```yaml
server:
  port: 8761

eureka:
  client:
    register-with-eureka: false # Server không cần tự đăng ký với chính nó
    fetch-registry: false
```

---

## 4. Rủi ro của kiến trúc Microservices

Mặc dù kiến trúc Microservices rất mạnh mẽ, việc chuyển đổi từ Monolith sang Microservices khi chưa sẵn sàng là nguyên nhân hàng đầu dẫn đến thất bại của nhiều dự án:

1. **Độ phức tạp vận hành tăng vọt (Operational Complexity)**: Bạn không còn quản lý 1 ứng dụng nữa, bạn đang quản lý 10, 20 ứng dụng chạy độc lập. Việc giám sát, triển khai và quản lý log (Distributed Logging) trở thành thách thức lớn.
2. **Vấn đề toàn vẹn dữ liệu (Data Consistency)**: Mỗi service có DB riêng. Khi có một transaction liên quan đến nhiều service (ví dụ: Trừ tiền ở ví -> Tạo đơn hàng ở Order -> Trừ kho ở Product), việc rollback khi có lỗi cực kỳ phức tạp, yêu cầu áp dụng các pattern như **Saga Pattern** hoặc **Outbox Pattern**.
3. **Độ trễ mạng (Network Latency)**: Gọi API nội bộ qua mạng chậm hơn nhiều so với việc gọi hàm Java thuần túy. Nếu thiết kế chuỗi gọi API quá sâu (A gọi B, B gọi C, C gọi D), ứng dụng sẽ bị trễ rất nhiều.
