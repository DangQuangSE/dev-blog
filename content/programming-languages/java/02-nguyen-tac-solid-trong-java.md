# Nguyên tắc SOLID trong lập trình hướng đối tượng (Java)

**SOLID** không chỉ là một bộ quy tắc, nó là "triết lý thiết kế" giúp chuyển đổi code từ trạng thái "chạy được" sang trạng thái "chuyên nghiệp, linh hoạt và trường tồn".

---

## Bối cảnh ra đời: Tại sao cần SOLID?

Khi hệ thống phát triển, việc áp dụng 4 đặc tính OOP (Đóng gói, Kế thừa, Đa hình, Trừu tượng) đôi khi là chưa đủ. Nếu áp dụng sai cách (như lạm dụng kế thừa), code sẽ trở nên cứng nhắc, dễ vỡ và cực kỳ khó thay đổi.

- **Vấn đề (Code Smell):** Code bị phụ thuộc lẫn nhau quá chặt chẽ (High Coupling), một thay đổi nhỏ dẫn đến hàng loạt lỗi ở nơi khác (Fragility), hoặc code không thể tái sử dụng (Immobility).
- **Giải pháp:** Robert C. Martin (Uncle Bob) đã đúc kết 5 nguyên tắc vàng để giải quyết triệt để các vấn đề trên.

---

## 1. S - Single Responsibility Principle (SRP)

> **Mỗi lớp chỉ nên đảm nhận một trách nhiệm duy nhất.**

### Lý do & Rủi ro
Nếu một lớp vừa quản lý logic nghiệp vụ, vừa ghi log, vừa gửi email, thì khi bạn thay đổi cách ghi log, bạn có nguy cơ làm hỏng logic nghiệp vụ.

### Ví dụ triển khai
```java
// VI PHẠM: Lớp này làm quá nhiều việc
class OrderManager {
    void createOrder() { /* logic tạo đơn */ }
    void saveToDb() { /* logic lưu DB */ }
    void sendEmailNotification() { /* logic gửi email */ }
}

// TUÂN THỦ: Chia nhỏ trách nhiệm
class OrderService { void createOrder() { } }
class OrderRepository { void save() { } }
class NotificationService { void sendEmail() { } }
```

---

## 2. O - Open/Closed Principle (OCP)

> **Mở rộng để phát triển, nhưng đóng để thay đổi.**

### Lý do & Rủi ro
Mỗi khi cần thêm tính năng mới, nếu bạn phải mở file cũ ra để sửa code, bạn có thể vô tình làm hỏng các tính năng đang chạy ổn định.

### Ví dụ triển khai
Sử dụng **Interface** hoặc **Abstract Class** để "đóng" code cũ.

```java
interface Shape { double calculateArea(); }

class Rectangle implements Shape {
    public double calculateArea() { return width * height; }
}

// Khi thêm hình tròn, ta tạo lớp mới, KHÔNG sửa code cũ
class Circle implements Shape {
    public double calculateArea() { return Math.PI * radius * radius; }
}
```

---

## 3. L - Liskov Substitution Principle (LSP)

> **Lớp con phải có thể thay thế lớp cha mà không làm thay đổi tính đúng đắn của chương trình.**

### Lý do & Rủi ro
Vi phạm nguyên tắc này thường do lạm dụng kế thừa (quan hệ "is-a" giả tạo), dẫn đến các lỗi logic rất khó tìm.

### Ví dụ vi phạm
Lớp `Bird` có phương thức `fly()`. Lớp `Ostrich` (đà điểu) kế thừa `Bird` nhưng không biết bay. Nếu bạn truyền `Ostrich` vào một hàm yêu cầu `Bird` và gọi `fly()`, chương trình sẽ gặp lỗi.

---

## 4. I - Interface Segregation Principle (ISP)

> **Thay vì một Interface lớn, hãy chia thành nhiều Interface nhỏ với các mục đích cụ thể.**

### Lý do & Rủi ro
Ép buộc một lớp phải triển khai những phương thức mà nó không cần sẽ làm code dư thừa và gây hiểu lầm cho người sử dụng interface đó.

### Ví dụ triển khai
```java
interface Workable { void work(); }
interface Eatable { void eat(); }

class Robot implements Workable {
    public void work() { /* làm việc */ }
    // Robot không cần triển khai eat()
}
```

---

## 5. D - Dependency Inversion Principle (DIP)

> **Module cấp cao không nên phụ thuộc vào module cấp thấp. Cả hai nên phụ thuộc vào abstraction.**

### Lý do & Rủi ro
Nếu `Service` phụ thuộc trực tiếp vào `MySQLRepository`, khi bạn muốn đổi sang `MongoDB`, bạn phải sửa lại toàn bộ `Service`.

### Ví dụ triển khai
Sử dụng **Dependency Injection**.

```java
interface MessageService { void sendMessage(String msg); }

class EmailService implements MessageService {
    public void sendMessage(String msg) { /* Gửi Email */ }
}

class App {
    private MessageService service;
    // App phụ thuộc vào interface, không phụ thuộc vào EmailService cụ thể
    public App(MessageService svc) { this.service = svc; }
}
```

---

## Tổng kết

SOLID không phải là một công thức cứng nhắc, mà là một hướng dẫn để bạn viết code linh hoạt hơn. Áp dụng SOLID giúp hệ thống của bạn sẵn sàng cho những thay đổi trong tương lai mà không tốn quá nhiều công sức bảo trì.
