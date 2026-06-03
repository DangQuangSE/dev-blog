# [13] Phase 6 - Concurrency: Nguyên lý Dependency Injection & Design Patterns

## 1. Nguồn gốc và lý do ra đời của Dependency Injection (DI)

### Sự phụ thuộc chặt chẽ (Tight Coupling) trong thiết kế truyền thống
Trong phát triển phần mềm, một lớp thường cần gọi đến các lớp khác để hoàn thành nhiệm vụ của nó.
- **Cách làm cũ**: Lớp `Car` tự tạo đối tượng `V8Engine` trực tiếp bên trong constructor của nó bằng từ khóa `new`:
  ```java
  class Car {
      private V8Engine engine;
      public Car() {
          this.engine = new V8Engine(); // Tight coupling!
      }
  }
  ```
- **Hạn chế**: 
  - Nếu muốn đổi sang `ElectricEngine`, ta phải vào tận trong code của `Car` để sửa đổi.
  - Không thể thực hiện kiểm thử đơn vị (Unit Test) cho lớp `Car` một cách độc lập vì nó bị dính chặt với database hoặc hệ thống thật của `V8Engine` (không thể mock engine).

### Giải pháp: Inversion of Control (IoC) & Dependency Injection (DI)
- **IoC (Đảo ngược điều khiển)**: Nguyên lý chuyển giao quyền khởi tạo và quản lý vòng đời đối tượng từ mã nguồn ứng dụng sang cho một framework hoặc container bên ngoài.
- **DI (Tiêm phụ thuộc)**: Cơ chế cụ thể để thực hiện IoC, trong đó các đối tượng phụ thuộc được truyền (inject) từ bên ngoài vào lớp cần dùng (thông qua Constructor hoặc Setter).

---

## 2. So sánh các phương pháp Tiêm phụ thuộc (DI Styles)

1. **Constructor Injection (Khuyên dùng)**: 
   - Tiêm dependencies qua hàm khởi tạo.
   - **Ưu điểm**: Đảm bảo các đối tượng phụ thuộc luôn có giá trị (không bị null), tạo ra các đối tượng bất biến (immutable dependencies bằng từ khóa `final`), cực kỳ dễ kiểm thử đơn vị.
2. **Setter Injection**:
   - Tiêm dependencies qua các hàm setter.
   - **Ưu điểm**: Linh hoạt, có thể thay đổi dependency tại thời điểm runtime hoặc tiêm các phụ thuộc tùy chọn (optional).
   - **Nhược điểm**: Đối tượng có thể rơi vào trạng thái lỗi nếu chưa được tiêm đầy đủ phụ thuộc trước khi gọi phương thức.

---

## 3. Rủi ro khi thiết kế Dependency và Pattern sai cách

1. **Vòng lặp phụ thuộc (Circular Dependency)**: Lớp A cần Lớp B qua Constructor, và Lớp B cũng cần Lớp A qua Constructor. Khi chạy ứng dụng, JVM sẽ không thể khởi tạo cả hai lớp và ném ra lỗi.
   - *Khắc phục*: Tái cấu trúc tách biệt module, hoặc dùng Setter Injection như giải pháp tình thế.
2. **Lạm dụng Singleton Pattern (Anti-Pattern)**: Sử dụng Singleton cho mọi lớp tiện ích. Singleton giữ trạng thái toàn cục (global state), làm cho việc chạy các ca kiểm thử song song (parallel testing) bị xung đột chéo dữ liệu và rất khó gỡ lỗi.
3. **Mã hóa cứng Factory (Hardcoded Factory)**: Tạo class Factory nhưng lại kiểm tra kiểu bằng các khối `if-else` chuỗi cứng nhắc. Khi thêm đối tượng mới, ta lại phải sửa code Factory, vi phạm nguyên tắc Open/Closed (OCP).

---

## 4. Code ví dụ minh họa chi tiết: DI & Design Patterns

### Minh họa Constructor Injection (DI) kết hợp Strategy & Factory Pattern

```java
// 1. Định nghĩa Interface (Strategy Pattern)
interface Engine {
    void start();
}

// Các triển khai cụ thể
class V8Engine implements Engine {
    public void start() { System.out.println("V8 Engine roaring!"); }
}

class ElectricEngine implements Engine {
    public void start() { System.out.println("Electric Engine humming silently..."); }
}

// 2. Factory Pattern để khởi tạo đối tượng tách biệt
class EngineFactory {
    public static Engine getEngine(String type) {
        if ("V8".equalsIgnoreCase(type)) {
            return new V8Engine();
        } else if ("ELECTRIC".equalsIgnoreCase(type)) {
            return new ElectricEngine();
        }
        throw new IllegalArgumentException("Loại động cơ không hỗ trợ!");
    }
}

// 3. Constructor Injection (Loose Coupling)
class Car {
    private final Engine engine; // final đảm bảo tính an toàn đa luồng

    // Dependency được tiêm từ bên ngoài vào qua Constructor
    public Car(Engine engine) {
        if (engine == null) {
            throw new IllegalArgumentException("Engine không được null!");
        }
        this.engine = engine;
    }

    public void drive() {
        engine.start();
        System.out.println("Car is moving.");
    }
}

public class DIDemo {
    public static void main(String[] args) {
        // Tạo dependency qua Factory
        Engine myEngine = EngineFactory.getEngine("ELECTRIC");

        // Tiêm dependency vào đối tượng Car (Constructor Injection)
        Car myCar = new Car(myEngine);
        myCar.drive();
    }
}
```
