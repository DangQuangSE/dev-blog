# [14] Phase 7 - Microservices: Kiến trúc Microservices với Spring Cloud

## 1. Nguồn gốc của sự chuyển dịch từ Monolithic sang Microservices

### Giới hạn của Kiến trúc Monolithic (Đơn khối)
Trong giai đoạn đầu phát triển ứng dụng, kiến trúc Monolithic là lựa chọn mặc định: toàn bộ các thành phần được đóng gói chung vào một file `.war` hoặc `.jar` duy nhất và kết nối chung tới một Database.
- **Hạn chế khi hệ thống lớn lên**:
  1. **Khó scale độc lập**: Nếu dịch vụ Giỏ hàng cần nhiều RAM để xử lý, bạn bắt buộc phải nhân bản (scale) toàn bộ ứng dụng Monolithic, gây lãng phí tài nguyên cho các phần khác không cần thiết.
  2. **Thời gian build và deploy lâu**: Một thay đổi nhỏ ở dòng code của phần Thanh toán yêu cầu compile, build và khởi động lại toàn bộ hệ thống lớn.
  3. **Rủi ro Single Point of Failure**: Lỗi Out-Of-Memory ở module Báo cáo có thể làm sập toàn bộ máy chủ, kéo theo tất cả các dịch vụ cốt lõi khác cũng chết theo.

### Sự xuất hiện của Microservices (Kiến trúc vi dịch vụ)
Kiến trúc Microservices chia nhỏ ứng dụng lớn thành các dịch vụ độc lập, gọn nhẹ:
- Mỗi dịch vụ chạy trong một tiến trình riêng, tự quản lý cơ sở dữ liệu của riêng nó (Database per Service).
- Để giải quyết các thách thức của hệ thống phân tán, **Spring Cloud** cung cấp trọn bộ công cụ giúp đơn giản hóa việc thiết lập hạ tầng.

---

## 2. Các thành phần hạ tầng cốt lõi của Spring Cloud

Một hệ thống Microservices xây dựng bằng Spring Cloud thường bao gồm các thành phần sau:

### a) Service Discovery (Eureka)
- IP và cổng của các instance thay đổi liên tục. **Eureka Server** đóng vai trò là "danh bạ" trung tâm. Mọi service (Eureka Client) khi khởi động sẽ tự đăng ký địa chỉ của nó với Eureka.

### b) API Gateway (Spring Cloud Gateway)
- Cửa ngõ duy nhất đón nhận request từ các Client bên ngoài, thực hiện định tuyến (routing), xác thực tập trung (JWT Validation) và giới hạn tần suất request (Rate Limiting).

### c) Centralized Configuration (Spring Cloud Config)
- Quản lý cấu hình tập trung từ Git Repository, cho phép cập nhật cấu hình cho toàn hệ thống mà không cần build hay khởi động lại dịch vụ.

### d) Declarative HTTP Client (Spring Cloud Open Feign)
- Giúp gọi API giữa các Microservices đơn giản bằng cách định nghĩa các interface với annotation thay vì viết các đoạn mã `RestTemplate` cồng kềnh.

### e) Circuit Breaker & Fault Tolerance (Resilience4j)
- Ngăn chặn lỗi lan truyền dây chuyền (Cascading Failure). Nếu `Product Service` bị sập, Circuit Breaker của `Order Service` sẽ tự động kích hoạt chế độ ngắt mạch (Open), lập tức trả về một kết quả thay thế (**Fallback**) mà không đứng chờ đợi làm cạn kiệt luồng xử lý.

---

## 3. Rủi ro của kiến trúc Microservices

1. **Vấn đề toàn vẹn dữ liệu (Data Consistency)**: Không thể áp dụng Transaction truyền thống trên nhiều database khác nhau. Yêu cầu phải triển khai các pattern phức tạp như **Saga Pattern** hoặc **Outbox Pattern** để đảm bảo tính nhất quán cuối cùng (Eventual Consistency).
2. **Khó khăn khi gỡ lỗi (Distributed Tracing)**: Một lỗi xảy ra có thể do chuỗi gọi API qua 5 service khác nhau. Rất khó phát hiện nguyên nhân nếu không tích hợp **Zipkin** hoặc **Micrometer Tracing** để gắn mã định danh chung (`Trace ID`) cho toàn bộ chuỗi request.

---

## 4. Code ví dụ minh họa chi tiết

### Sử dụng Open Feign kết hợp Resilience4j Circuit Breaker để gọi API nội bộ an toàn

```java
// Cần dependency: spring-cloud-starter-openfeign và spring-cloud-starter-circuitbreaker-resilience4j
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.stereotype.Component;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

// 1. Định nghĩa Feign Client kết nối tới 'product-service' đăng ký trên Eureka
@FeignClient(name = "product-service", fallback = ProductFeignClientFallback.class)
public interface ProductFeignClient {

    @GetMapping("/api/v1/products/{id}")
    ProductDTO getProductById(@PathVariable("id") Long id);
}

// 2. Định nghĩa class Fallback: Được gọi tự động khi 'product-service' bị sập hoặc timeout
@Component
class ProductFeignClientFallback implements ProductFeignClient {

    @Override
    public ProductDTO getProductById(Long id) {
        // Trả về dữ liệu mặc định an toàn cho client thay vì ném lỗi 500
        return new ProductDTO(id, "Sản phẩm tạm thời không có thông tin", 0.0);
    }
}

// Lớp DTO nhận dữ liệu
class ProductDTO {
    private Long id;
    private String name;
    private double price;

    public ProductDTO(Long id, String name, double price) {
        this.id = id;
        this.name = name;
        this.price = price;
    }
    // Getters
    public Long getId() { return id; }
    public String getName() { return name; }
    public double getPrice() { return price; }
}
```
