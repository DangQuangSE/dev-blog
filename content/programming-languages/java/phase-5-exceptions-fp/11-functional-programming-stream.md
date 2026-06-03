# [11] Phase 5 - Exceptions & FP: Lập trình hàm: Lambda, Functional Interfaces & Stream API

## 1. Nguồn gốc và lý do ra đời của Lập trình Hàm trong Java

### Sự rườm rà của Lập trình Mệnh lệnh (Imperative Programming)
Trước Java 8, để thực hiện các thao tác xử lý dữ liệu đơn giản như lọc danh sách và chuyển đổi kiểu, lập trình viên bắt buộc phải viết mã theo phong cách mệnh lệnh (Imperative):
- Sử dụng các vòng lặp `for`/`while` thủ công lồng nhau để duyệt qua từng phần tử.
- Tạo các lớp nặc danh (Anonymous Inner Classes) vô cùng cồng kềnh chỉ để truyền tải một đoạn logic hành vi ngắn (như so sánh trong bộ sắp xếp `Comparator`).
- **Hạn chế**: Code cực kỳ dài dòng, khó đọc, dễ phát sinh lỗi chỉ số (Index Out Of Bounds) và khó tận dụng sức mạnh xử lý đa lõi (Multi-core CPUs) song song.

### Giải pháp: Lập trình Khai báo (Declarative) & Functional Programming (Java 8)
Java 8 giới thiệu bước nhảy vọt lịch sử bằng cách đưa lập trình hàm vào ngôn ngữ hướng đối tượng:
- **Lambda Expressions**: Cú pháp ngắn gọn để biểu diễn một hàm nặc danh.
- **Functional Interfaces**: Các interface chỉ chứa đúng một phương thức trừu tượng (như `Predicate`, `Function`, `Consumer`), đánh dấu bằng `@FunctionalInterface`.
- **Stream API**: Cung cấp công cụ mạnh mẽ để xử lý các tập hợp dữ liệu theo phong cách đường ống dẫn (pipelines), hỗ trợ lọc, biến đổi và song song hóa cực kỳ tối ưu.

---

## 2. So sánh và Cơ chế Hoạt động bên dưới

### a) Phong cách Mệnh lệnh vs Khai báo
- **Mệnh lệnh (Imperative)**: Chỉ ra **LÀM THẾ NÀO** (how to do it). Phải tự khởi tạo biến lưu trữ tạm, tự duyệt mảng, tự chèn dữ liệu.
- **Khai báo (Declarative/Functional)**: Chỉ ra **LÀM CÁI GÌ** (what to do). Bạn chỉ việc định nghĩa các bước biến đổi dữ liệu thông qua Stream API, JVM tự tối ưu luồng chạy.

### b) Cơ chế thực thi của Stream API (Lazy Evaluation)
Stream API hoạt động theo cơ chế **đánh giá lười (Lazy Evaluation)**:
- **Intermediate Operations (Phép toán trung gian - filter, map, sorted)**: Không thực thi ngay lập tức mà chỉ thiết lập cấu trúc đường ống dẫn dữ liệu (pipeline). Chúng trả về một Stream mới.
- **Terminal Operations (Phép toán kết thúc - collect, forEach, reduce)**: Kích hoạt toàn bộ đường ống dẫn chạy để sinh ra kết quả cuối cùng. Khi phép toán kết thúc chạy xong, Stream bị đóng lại và không thể tái sử dụng.

---

## 3. Rủi ro khi lạm dụng Stream API và Lambda

1. **Hiệu năng giảm sút (Stream Overhead)**: Đối với các tập hợp dữ liệu nhỏ (ít hơn vài trăm phần tử) hoặc các phép toán cực kỳ đơn giản, việc tạo Stream, bọc các hàm lambda và cấp phát bộ nhớ trung gian sẽ chậm hơn và tốn bộ nhớ hơn so với vòng lặp `for` truyền thống.
2. **Sử dụng Side Effects trong Lambda**: Thay đổi giá trị của các biến nằm ngoài lambda (biến local ngoài lambda phải là `final` hoặc `effectively final`). Việc cố tình thay đổi trạng thái bên ngoài (ví dụ: cộng dồn vào một list mutable bên ngoài) khi chạy với `parallelStream()` sẽ gây ra xung đột dữ liệu (Thread Safety Issues).
3. **Mã nguồn khó Debug**: Do Stream xử lý theo chuỗi liên tục, việc đặt breakpoint gỡ lỗi từng bước trở nên khó khăn hơn.
   - *Khắc phục*: Sử dụng phương thức `.peek()` để in ra trạng thái dữ liệu trung gian khi gỡ lỗi.

---

## 4. Code ví dụ minh họa chi tiết

```java
import java.util.Arrays;
import java.util.List;
import java.util.function.Consumer;
import java.util.function.Function;
import java.util.function.Predicate;
import java.util.stream.Collectors;

public class FunctionalProgrammingDemo {

    public static void main(String[] args) {
        List<Integer> numbers = Arrays.asList(1, 2, 3, 4, 5, 6, 7, 8, 9, 10);

        // 1. Sử dụng các Functional Interfaces tiêu chuẩn
        Predicate<Integer> isEven = num -> num % 2 == 0; // Lọc số chẵn
        Function<Integer, Integer> square = num -> num * num; // Bình phương
        Consumer<Integer> printer = val -> System.out.print(val + " "); // In ra

        System.out.print("Các số chẵn bình phương: ");
        // 2. Stream API pipeline
        List<Integer> processedNumbers = numbers.stream()
                .filter(isEven)             // Intermediate operation (Lazy)
                .map(square)                // Intermediate operation (Lazy)
                .peek(printer)              // Xem dữ liệu trung gian
                .collect(Collectors.toList()); // Terminal operation (Eager)

        System.out.println("\nDanh sách kết quả: " + processedNumbers);

        // 3. Sử dụng Parallel Stream để chạy đa luồng tối ưu
        long sumOfSquares = numbers.parallelStream()
                .filter(isEven)
                .mapToLong(val -> (long) val * val)
                .sum(); // Tự động chia việc cho ForkJoinPool dùng chung
        System.out.println("Tổng bình phương các số chẵn (chạy song song): " + sumOfSquares);
    }
}
```
