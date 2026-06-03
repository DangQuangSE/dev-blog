# [03] Phase 2 - OOP: Lớp, Đối tượng, Access Specifiers, Static & Final

## 1. Nguồn gốc và lý do ra đời của Lập trình Hướng đối tượng (OOP)

### Sự hạn chế của Lập trình Thủ tục (Procedural Programming)
Trong kỷ nguyên lập trình thủ tục (như C, Pascal), hệ thống được cấu trúc xung quanh các hàm và thuật toán xử lý dữ liệu. Dữ liệu được truyền qua lại giữa các hàm dưới dạng cấu trúc dữ liệu rời rạc.
- **Hạn chế**: Khi hệ thống phình to, dữ liệu toàn cục (global state) bị chia sẻ vô tội vạ, dẫn đến việc bất kỳ hàm nào cũng có thể thay đổi dữ liệu đó ngoài ý muốn. Khó kiểm soát luồng thay đổi trạng thái, code trở nên cực kỳ khó debug và mở rộng.

### Giải pháp của Java và OOP
OOP ra đời để mang lại cách tiếp cận mới: gom nhóm cả **dữ liệu (Attributes/Fields)** và **hành vi (Methods)** liên quan chặt chẽ vào trong một thực thể duy nhất gọi là **Đối tượng (Object)**.
- **Lớp (Class)**: Là bản thiết kế hoặc khuôn mẫu định nghĩa các thuộc tính và phương thức chung.
- **Đối tượng (Object)**: Là một thực thể cụ thể được sinh ra từ Lớp, chiếm không gian thực tế trong bộ nhớ Heap.

---

## 2. So sánh Cách làm cũ vs Cách làm mới

### a) Access Specifiers (Phạm vi truy cập)
Java cung cấp 4 cấp độ truy cập để bảo vệ tính toàn vẹn của dữ liệu:
1. **private**: Chỉ truy cập được từ bên trong cùng một lớp. Dùng để che giấu dữ liệu nhạy cảm.
2. **default (no modifier)**: Chỉ truy cập được từ các lớp trong cùng thư mục (package).
3. **protected**: Chỉ truy cập được trong cùng package hoặc bởi các lớp con kế thừa ở package khác.
4. **public**: Truy cập được từ bất kỳ đâu.

### b) Static vs Instance members
- **Instance Member**: Thuộc về đối tượng. Mỗi khi tạo đối tượng bằng `new`, JVM sẽ tạo một bản sao riêng của các thuộc tính này trên Heap.
- **Static Member**: Thuộc về lớp. Chỉ tồn tại duy nhất một bản sao trong vùng nhớ Metaspace (Class Area). Có thể gọi trực tiếp thông qua tên lớp mà không cần khởi tạo đối tượng.

### c) Từ khóa `final`
- **final field**: Biến hằng số, chỉ có thể gán giá trị một lần duy nhất (hoặc trực tiếp khi khai báo, hoặc trong constructor).
- **final method**: Phương thức không thể bị ghi đè (override) ở lớp con.
- **final class**: Lớp không thể bị kế thừa (ví dụ: lớp `String` trong Java là final).

---

## 3. Rủi ro khi thiết kế sai cấu trúc Class

1. **Phá vỡ tính Đóng gói (Encapsulation)**: Để lộ các thuộc tính nhạy cảm ra ngoài bằng cách khai báo `public` thay vì `private` kết hợp Getter/Setter. Điều này cho phép bên ngoài gán các giá trị không hợp lệ (ví dụ: gán tuổi bằng số âm `-5`).
2. **Lỗi chia sẻ bộ nhớ tĩnh (Static Resource Collision)**: Đặt biến trạng thái của đối tượng thành `static`. Vì biến static được dùng chung, nếu một luồng thay đổi giá trị của nó, nó sẽ ảnh hưởng trực tiếp đến trạng thái của tất cả các đối tượng khác.
3. **Inner Class gây Memory Leak**: Non-static Inner Class luôn giữ một tham chiếu ngầm định đến đối tượng của Outer Class chứa nó. Nếu Inner Class được giữ lại trong bộ nhớ lâu hơn Outer Class (ví dụ: chạy ngầm Task), Outer Class sẽ không bao giờ được Garbage Collector thu hồi, gây rò rỉ bộ nhớ.
   - *Khắc phục*: Dùng `static nested class` thay vì non-static inner class khi không cần truy cập trực tiếp các instance member của Outer Class.

---

## 4. Code ví dụ minh họa chi tiết

```java
// Outer Class
public class BankAccount {
    // 1. Encapsulation: Dùng private để ẩn thông tin
    private final String accountNumber; // final: Không thể đổi số tài khoản
    private double balance;
    
    // Static Variable: Dùng chung cho cả Class
    private static int totalAccountsCreated = 0;

    // Constructor
    public BankAccount(String accountNumber, double initialBalance) {
        if (initialBalance < 0) {
            throw new IllegalArgumentException("Số dư khởi tạo không được âm!");
        }
        this.accountNumber = accountNumber;
        this.balance = initialBalance;
        totalAccountsCreated++; // Tăng biến static dùng chung
    }

    // public methods để kiểm soát quyền truy cập dữ liệu
    public double getBalance() {
        return this.balance;
    }

    public void deposit(double amount) {
        if (amount > 0) {
            this.balance += amount;
        }
    }

    // Static Method: Gọi không cần đối tượng
    public static int getTotalAccountsCreated() {
        return totalAccountsCreated;
    }

    // 2. Static Nested Class: Không giữ tham chiếu đến Outer Class (Tránh Memory Leak)
    public static class AccountConfig {
        public static final double INTEREST_RATE = 0.05; // 5%
        
        public static double calculateInterest(double amount) {
            return amount * INTEREST_RATE;
        }
    }

    public static void main(String[] args) {
        BankAccount acc1 = new BankAccount("VCB123", 1000.0);
        BankAccount acc2 = new BankAccount("VCB456", 2000.0);

        acc1.deposit(500.0);

        System.out.println("Số dư tài khoản 1: " + acc1.getBalance());
        System.out.println("Số dư tài khoản 2: " + acc2.getBalance());
        System.out.println("Tổng số tài khoản đã tạo (Static): " + BankAccount.getTotalAccountsCreated());

        // Sử dụng Static Nested Class
        double interest = BankAccount.AccountConfig.calculateInterest(1000.0);
        System.out.println("Tiền lãi tính toán: " + interest);
    }
}
```
