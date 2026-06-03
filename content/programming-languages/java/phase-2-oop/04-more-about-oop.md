# [04] Phase 2 - OOP: Kế thừa, Trừu tượng, Đóng gói, Đa hình, Records & Enums

## 1. Nguồn gốc và lý do nâng cấp tính năng hướng đối tượng trong Java

### Sự phức tạp của Java OOP cổ điển
Trong các phiên bản Java ban đầu (từ 1.0 đến 7), việc định nghĩa các lớp mang dữ liệu thuần túy (Data Carriers / DTOs) đòi hỏi rất nhiều mã boilerplate vô nghĩa như viết thủ công constructor, getter, setter, `equals()`, `hashCode()`, và `toString()`. Điều này làm giảm hiệu suất phát triển và dễ gây ra sai sót khi cập nhật thuộc tính mà quên sửa lại các hàm trên.

### Sự ra đời của Records, Sealed Classes và Enums hiện đại
Để đơn giản hóa và tăng tính an toàn, Java hiện đại đã đưa vào:
- **Records (Java 14+)**: Lớp dữ liệu bất biến (immutable data carrier) được tạo ra nhanh gọn chỉ bằng một dòng định nghĩa. Trình biên dịch tự tạo constructor, getters, `equals`, `hashCode`, và `toString`.
- **Enums**: Không chỉ đơn thuần là hằng số chuỗi/số như C++, Enum trong Java là một lớp đặc biệt kế thừa `java.lang.Enum`, cho phép khai báo thuộc tính, constructor và các phương thức riêng.

---

## 2. So sánh và Giải thích các khái niệm cốt lõi

### a) Kế thừa (Inheritance) & Đa hình (Polymorphism)
- **Kế thừa**: Java chỉ hỗ trợ đơn kế thừa lớp (Single Inheritance) để tránh lỗi đa kế thừa kim cương (Diamond Problem). Tuy nhiên, Java cho phép đa thực thi giao diện (Multiple Interface Implementation).
- **Đa hình (Polymorphism)**:
  - **Overloading (Nạp chồng - Static Binding / Early Binding)**: Các phương thức trùng tên nhưng khác chữ ký (tham số). Trình biên dịch quyết định hàm nào sẽ chạy ngay khi dịch mã nguồn dựa vào kiểu khai báo.
  - **Overriding (Ghi đè - Dynamic Binding / Late Binding)**: Phương thức ở lớp con thay thế logic ở lớp cha. JVM quyết định hàm nào sẽ chạy tại thời điểm runtime dựa vào đối tượng thực tế trên Heap.

### b) Bản chất Pass-by-Value trong Java
Một hiểu lầm rất phổ biến là Java truyền tham chiếu cho đối tượng. **Thực tế, Java luôn truyền bằng giá trị (Pass-by-Value)**.
- Khi truyền biến nguyên thủy, giá trị thực sự được copy vào ô nhớ cục bộ của hàm mới.
- Khi truyền đối tượng, giá trị của biến tham chiếu (chính là địa chỉ bộ nhớ trỏ đến Heap) được sao chép. Cả hai biến tham chiếu đều trỏ đến cùng một đối tượng trên Heap. Tuy nhiên, nếu bạn gán lại biến tham chiếu đó cho một đối tượng mới bằng `new`, tham chiếu gốc bên ngoài hàm không hề thay đổi.

```
Trước khi gán lại (Cả ref ngoài và param trong đều trỏ cùng đối tượng A):
[main] userRef ───┐
                  ├─► [Heap] User Object A (name: "John")
[change] user ────┘

Sau khi gán user = new User("Alice") trong hàm:
[main] userRef ─────► [Heap] User Object A (name: "John")
[change] user ──────► [Heap] User Object B (name: "Alice")
```

---

## 3. Rủi ro khi thiết kế và vận hành sai

1. **Lỗi sửa đổi dữ liệu bất ngờ (Side Effects due to Aliasing)**: Do truyền tham trị của con trỏ (Pass-by-value of reference), khi bạn truyền một đối tượng Mutable (ví dụ: `ArrayList`) vào một hàm, hàm đó có thể thay đổi dữ liệu bên trong list, ảnh hưởng đến nghiệp vụ bên ngoài mà không hề có cảnh báo.
   - *Khắc phục*: Dùng các đối tượng bất biến (Immutable Objects) hoặc `Record` để ngăn chặn thay đổi trạng thái bừa bãi.
2. **Vi phạm quy tắc equals và hashCode**: Khi override `equals()` để so sánh nội dung mà không override `hashCode()`. Khi đó, hai đối tượng giống hệt nhau về giá trị có thể có hashCode khác nhau. Nếu đưa chúng vào `HashMap` hay `HashSet`, hệ thống sẽ không nhận diện được trùng lặp và gây lỗi trùng lặp dữ liệu.

---

## 4. Code ví dụ minh họa chi tiết

```java
import java.util.Objects;

// 1. Minh họa Enum nâng cao có thuộc tính và hàm
enum UserRole {
    ADMIN("Toàn quyền hệ thống"),
    USER("Người dùng thông thường");

    private final String description;

    UserRole(String description) {
        this.description = description;
    }

    public String getDescription() {
        return description;
    }
}

// 2. Minh họa Record (Java 14+): Bất biến, ngắn gọn
record UserInfo(String username, UserRole role) {}

// Lớp cha trừu tượng
abstract class Employee {
    protected String name;

    public Employee(String name) {
        this.name = name;
    }

    public abstract double calculateSalary();
}

// Lớp con kế thừa
class Developer extends Employee {
    private double baseSalary;

    public Developer(String name, double baseSalary) {
        super(name);
        this.baseSalary = baseSalary;
    }

    // Overriding (Dynamic Binding)
    @Override
    public double calculateSalary() {
        return this.baseSalary * 1.2;
    }
}

public class OOPAdvancedDemo {
    
    // Hàm chứng minh Pass-by-value
    public static void testPassByValue(Developer dev, int bonus) {
        bonus = 500; // Thay đổi trị nguyên thủy: không ảnh hưởng bên ngoài
        dev.calculateSalary(); // Gọi phương thức của đối tượng thực tế
        
        // Gán lại biến tham chiếu cục bộ
        dev = new Developer("New Dev", 5000.0);
        // dev cục bộ trỏ tới đối tượng mới, nhưng dev ngoài main không đổi
    }

    public static void main(String[] args) {
        // Khởi tạo các đối tượng
        Developer mainDev = new Developer("Hoang", 2000.0);
        int bonusAmount = 100;

        // Chạy hàm test truyền tham trị
        testPassByValue(mainDev, bonusAmount);
        
        System.out.println("Tên dev ngoài main vẫn là: " + mainDev.name); // Hoang
        System.out.println("Bonus ngoài main vẫn là: " + bonusAmount); // 100

        // Sử dụng Record và Enum
        UserInfo user = new UserInfo("hoang_dev", UserRole.ADMIN);
        System.out.println("User record: " + user);
        System.out.println("Role description: " + user.role().getDescription());
    }
}
```
