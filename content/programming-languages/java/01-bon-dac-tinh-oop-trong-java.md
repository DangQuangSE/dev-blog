# Bốn đặc tính cơ bản của Lập trình hướng đối tượng (OOP) trong Java

Lập trình hướng đối tượng (Object-Oriented Programming - OOP) không chỉ là một kỹ thuật viết code, mà là một tư duy tổ chức mã nguồn mạnh mẽ đã thay đổi toàn bộ ngành phần mềm. Để thực sự làm chủ Java, chúng ta cần hiểu không chỉ "cách dùng" mà còn là "tại sao" các đặc tính này lại ra đời.

---

## 1. Bối cảnh ra đời: Từ Lập trình Thủ tục đến Đối tượng

Trước khi OOP trở nên phổ biến, thế giới lập trình chủ yếu dựa trên **Lập trình thủ tục (Procedural Programming)**.

- **Cách làm cũ:** Tập trung vào các hàm (functions) và danh sách các bước thực hiện. Dữ liệu được để ở dạng biến toàn cục hoặc truyền qua lại giữa các hàm.
- **Vấn đề:** Khi phần mềm lớn dần, việc quản lý hàng ngàn hàm và biến toàn cục trở thành ác mộng. Dữ liệu có thể bị thay đổi từ bất kỳ đâu, dẫn đến lỗi "hiệu ứng cánh bướm" (sửa chỗ này hỏng chỗ kia). Code trở nên "rối như mì Spagetti".
- **Giải pháp:** OOP ra đời để gom nhóm dữ liệu (attributes) và hành động (methods) vào một thực thể duy nhất gọi là **Đối tượng (Object)**.

---

## 2. Tính Đóng gói (Encapsulation)

### Nguồn gốc & Lý do
Trong lập trình cũ, dữ liệu thường được phơi bày công khai. Nếu bạn có một biến `soDuTaiKhoan`, bất kỳ ai cũng có thể gán nó bằng `-1000` mà không qua kiểm tra nào.

### Rủi ro khi không áp dụng
- **Dữ liệu không hợp lệ:** Trạng thái đối tượng bị thay đổi sai logic (ví dụ: tuổi âm, lương âm).
- **Phụ thuộc quá sâu:** Các module bên ngoài can thiệp sâu vào chi tiết nội bộ, khiến việc thay đổi cấu trúc bên trong lớp đó làm sụp đổ toàn bộ hệ thống.

### Ví dụ triển khai
Sử dụng các access modifier (`private`) và các phương thức truy cập (`getter/setter`).

```java
public class BankAccount {
    private double balance; // Dữ liệu được bảo vệ

    public void deposit(double amount) {
        if (amount > 0) {
            this.balance += amount;
            System.out.println("Nạp thành công: " + amount);
        } else {
            System.out.println("Số tiền nạp không hợp lệ!");
        }
    }

    public double getBalance() {
        return this.balance;
    }
}
```

---

## 3. Tính Kế thừa (Inheritance)

### Nguồn gốc & Lý do
Tránh việc phải viết lại cùng một đoạn code cho các đối tượng có chung đặc điểm (ví dụ: `NhanVienFullTime` và `NhanVienPartTime` đều có tên, mã nhân viên).

### Rủi ro khi không áp dụng
- **Dư thừa mã nguồn (Code Duplication):** Phải copy-paste logic tính toán cơ bản ở khắp nơi.
- **Khó bảo trì:** Khi cần thêm một thuộc tính chung (ví dụ: số điện thoại), bạn phải sửa ở mọi lớp nhân viên.

### Ví dụ triển khai
Sử dụng từ khóa `extends`.

```java
// Lớp cha (Superclass)
class Employee {
    protected String name;
    protected double baseSalary;

    public Employee(String name, double baseSalary) {
        this.name = name;
        this.baseSalary = baseSalary;
    }

    public void showInfo() {
        System.out.println("Nhân viên: " + name);
    }
}

// Lớp con (Subclass)
class FullTimeEmployee extends Employee {
    public FullTimeEmployee(String name, double baseSalary) {
        super(name, baseSalary);
    }

    public double calculateSalary() {
        return baseSalary * 1.5; // Thêm logic thưởng
    }
}
```

---

## 4. Tính Đa hình (Polymorphism)

### Nguồn gốc & Lý do
Làm thế nào để viết một hệ thống có thể xử lý các loại đối tượng khác nhau thông qua một giao diện chung mà không cần dùng quá nhiều câu lệnh `if-else`.

### Rủi ro khi không áp dụng
- **Code cứng nhắc:** Mỗi khi thêm một loại đối tượng mới, bạn phải sửa đổi code xử lý cũ để thêm nhánh rẽ nhánh.

### Ví dụ triển khai (Runtime Polymorphism)
Sử dụng **Ghi đè (Overriding)**.

```java
class Animal {
    public void makeSound() {
        System.out.println("Tiếng kêu động vật...");
    }
}

class Dog extends Animal {
    @Override
    public void makeSound() {
        System.out.println("Gâu Gâu!");
    }
}

class Cat extends Animal {
    @Override
    public void makeSound() {
        System.out.println("Meo Meo!");
    }
}

// Sử dụng tính đa hình
public class Main {
    public static void main(String[] args) {
        Animal myAnimal;

        myAnimal = new Dog();
        myAnimal.makeSound(); // Kết quả: Gâu Gâu!

        myAnimal = new Cat();
        myAnimal.makeSound(); // Kết quả: Meo Meo!
    }
}
```

---

## 5. Tính Trừu tượng (Abstraction)

### Nguồn gốc & Lý do
Ẩn đi các chi tiết triển khai phức tạp và chỉ đưa ra những gì người dùng cần biết.

### Rủi ro khi không áp dụng
- **Người dùng "biết quá nhiều":** Dễ dàng can thiệp sai vào quy trình vận hành phức tạp bên trong.
- **Khó thay đổi công nghệ:** Nếu bạn thay đổi cách lưu dữ liệu từ SQL sang NoSQL, người dùng cũng phải sửa code nếu không có lớp trừu tượng ở giữa.

### Ví dụ triển khai
Sử dụng `interface`.

```java
interface DatabaseConnector {
    void connect();
    void executeQuery(String query);
}

class MySqlConnector implements DatabaseConnector {
    public void connect() {
        System.out.println("Đang kết nối MySQL qua cổng 3306...");
    }
    public void executeQuery(String query) {
        System.out.println("Thực thi MySQL: " + query);
    }
}

class OracleConnector implements DatabaseConnector {
    public void connect() {
        System.out.println("Đang kết nối Oracle qua cổng 1521...");
    }
    public void executeQuery(String query) {
        System.out.println("Thực thi Oracle: " + query);
    }
}
```

---

## Tổng kết

OOP không chỉ giúp code gọn hơn, mà mục tiêu cao nhất của nó là **quản lý sự phức tạp**. 4 đặc tính này bổ trợ lẫn nhau để tạo ra một hệ thống bền vững, dễ mở rộng và ít lỗi. 

**Lưu ý:** Sau khi nắm vững 4 đặc tính này, bạn cần tiến tới **Nguyên tắc SOLID** để biết cách áp dụng chúng một cách chuẩn mực nhất.
