# [17] Phase 7 - Ecosystem: Kiểm thử toàn diện: Unit, Integration, Mocking & Behavior Testing

## 1. Nguồn gốc và lý do ra đời của Kiểm thử tự động

### Sự rủi ro của việc kiểm thử thủ công (Manual Testing)
Trong quy trình phát triển phần mềm truyền thống, sau khi viết code xong, lập trình viên thường kiểm thử bằng cách khởi chạy ứng dụng lên, truy cập giao diện hoặc gọi API từ Postman thủ công để xem kết quả.
- **Hạn chế**: 
  - Tốc độ vô cùng chậm và không thể lặp lại tự động mỗi khi có thay đổi nhỏ trong mã nguồn.
  - Khi hệ thống mở rộng với hàng nghìn chức năng, việc kiểm thử thủ công toàn bộ hệ thống (Regression Testing) trở nên bất khả thi, dẫn đến rủi ro cao lọt lỗi nghiêm trọng lên môi trường Production.

### Giải pháp: Trọn bộ kiểm thử tự động (Testing Ecosystem)
Cộng đồng Java đã xây dựng một hệ sinh thái kiểm thử cực kỳ hoàn chỉnh để tự động hóa hoàn toàn quy trình này:
- **JUnit 5**: Tiêu chuẩn công nghiệp để viết và chạy các ca kiểm thử đơn vị (Unit Tests) trong Java.
- **Mockito**: Thư viện giả lập (Mocking Framework) giúp cô lập lớp cần test bằng cách tạo ra các đối tượng giả (Mocks) thay thế cho các dependency thật (như Database hay Web Services).
- **REST Assured**: Thư viện viết API integration test, gửi request HTTP thực và kiểm định response trả về một cách trực quan.
- **Cucumber-JVM**: Thư viện hỗ trợ lập trình hướng hành vi (Behavior-Driven Development - BDD), cho phép viết kịch bản test bằng ngôn ngữ tự nhiên (Gherkin syntax: Given-When-Then) để cả khách hàng và lập trình viên cùng hiểu.

---

## 2. So sánh và Phân biệt các cấp độ Kiểm thử

| Cấp độ | Mục tiêu | Thư viện sử dụng | Tốc độ thực thi |
| :--- | :--- | :--- | :--- |
| **Unit Test (Kiểm thử đơn vị)** | Kiểm tra một hàm/lớp đơn lẻ trong trạng thái cô lập hoàn toàn | JUnit 5 + Mockito | Siêu nhanh (Mili-giây) |
| **Integration Test (Kiểm thử tích hợp)** | Kiểm tra sự phối hợp giữa nhiều module thực tế (như kiểm tra với Database thực) | Spring Boot Test + Testcontainers | Trung bình |
| **API Test** | Gửi request HTTP thật kiểm tra toàn bộ luồng xử lý web | REST Assured | Chậm hơn |
| **BDD Test** | Kiểm định tính đúng đắn của tính năng dựa trên mô tả hành vi người dùng | Cucumber-JVM | Chậm |

---

## 3. Rủi ro khi viết Test sai phương pháp

1. **Kiểm thử không cô lập (Không Mock dependencies)**: Viết unit test cho tầng Service nhưng lại kết nối trực tiếp vào database thật. Nếu database bị lỗi kết nối hoặc dữ liệu trong database thay đổi, ca kiểm thử sẽ bị thất bại (flaky test) dù code Service hoàn toàn chạy đúng.
   - *Khắc phục*: Dùng Mockito `@Mock` để giả lập toàn bộ hành vi của tầng Database.
2. **Kiểm thử quá phụ thuộc vào cấu trúc nội bộ (Over-specifying Tests)**: Lạm dụng `verify` của Mockito để kiểm tra xem một hàm nội bộ có được gọi bao nhiêu lần, gọi theo thứ tự nào. Việc này làm test case bị "dính cứng" vào cách triển khai code cụ thể bên trong. Khi refactor code (thay đổi cách viết nhưng giữ nguyên kết quả), test case sẽ bị hỏng dù tính năng vẫn chạy đúng.
   - *Khắc phục*: Tập trung kiểm định đầu ra (Output / State) thay vì kiểm tra luồng gọi hàm nội bộ (Behavior/Implementation details).

---

## 4. Code ví dụ minh họa chi tiết: JUnit 5 & Mockito

### Ví dụ Unit Test cho OrderService sử dụng JUnit 5 và Mockito

```java
// Lớp Repository phụ thuộc (cần được Mock)
interface PaymentRepository {
    boolean processPayment(double amount);
}

// Lớp Service cần được kiểm thử đơn vị
class OrderService {
    private final PaymentRepository paymentRepository;

    public OrderService(PaymentRepository paymentRepository) {
        this.paymentRepository = paymentRepository;
    }

    public boolean checkout(double totalAmount) {
        if (totalAmount <= 0) {
            throw new IllegalArgumentException("Số tiền thanh toán phải lớn hơn 0!");
        }
        // Gọi sang dependency
        return paymentRepository.processPayment(totalAmount);
    }
}
```

### Viết Test Case bằng JUnit 5 và Mockito
```java
// Cần import các thư viện JUnit 5 và Mockito
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

public class OrderServiceTest {

    private PaymentRepository paymentRepositoryMock;
    private OrderService orderService;

    @BeforeEach
    public void setUp() {
        // 1. Tạo đối tượng giả (Mock) bằng Mockito
        paymentRepositoryMock = mock(PaymentRepositoryMock.class);
        
        // 2. Tiêm mock dependency vào Service thực tế
        orderService = new OrderService(paymentRepositoryMock);
    }

    @Test
    public void testCheckout_Success() {
        // Định nghĩa hành vi của Mock (Stubbing)
        when(paymentRepositoryMock.processPayment(100.0)).thenReturn(true);

        // Chạy hàm thực tế cần test
        boolean result = orderService.checkout(100.0);

        // Kiểm định kết quả
        assertTrue(result, "Thanh toán đơn hàng phải thành công");
        
        // Xác minh xem phương thức của mock có được gọi đúng tham số hay không
        verify(paymentRepositoryMock, times(1)).processPayment(100.0);
    }

    @Test
    public void testCheckout_InvalidAmount_ThrowsException() {
        // Kiểm tra xem exception có được ném ra đúng loại và thông điệp hay không
        Exception exception = assertThrows(IllegalArgumentException.class, () -> {
            orderService.checkout(-10.0);
        });

        assertEquals("Số tiền thanh toán phải lớn hơn 0!", exception.getMessage());
    }

    // 3. Parameterized Test: Chạy cùng một test case với nhiều tham số khác nhau
    @ParameterizedTest
    @ValueSource(doubles = {10.0, 50.0, 99.9})
    public void testCheckout_VariousAmounts(double amount) {
        when(paymentRepositoryMock.processPayment(amount)).thenReturn(true);
        assertTrue(orderService.checkout(amount));
    }
    
    // Interface giả để làm mock target trong phạm vi ví dụ
    interface PaymentRepositoryMock extends PaymentRepository {}
}
```
