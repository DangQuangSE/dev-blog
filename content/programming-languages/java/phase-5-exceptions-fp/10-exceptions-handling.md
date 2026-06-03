# [10] Phase 5 - Exceptions & FP: Xử lý ngoại lệ, try-with-resources, Annotations & Modules

## 1. Nguồn gốc và lý do ra đời của Cơ chế Xử lý Lỗi tập trung

### Cách xử lý lỗi cổ điển trong lập trình thủ tục (C/C++)
Trong C, các hàm thường báo cáo lỗi bằng cách trả về một mã số nguyên (error code, ví dụ: `-1` nếu thất bại).
- **Hạn chế**: Lập trình viên phải viết mã kiểm tra giá trị trả về của mọi hàm ngay sau khi gọi. Điều này làm code bị phân mảnh, logic xử lý lỗi lồng chéo vào logic nghiệp vụ chính. Hơn nữa, nếu lập trình viên lờ đi mã lỗi, chương trình sẽ tiếp tục chạy trong trạng thái dữ liệu sai lệch dẫn đến crash hệ thống bất ngờ.

### Giải pháp của Java: Cơ chế Exception tập trung
Java đưa ra cơ chế quản lý ngoại lệ (Exception) độc lập giúp phân tách hoàn toàn mã xử lý lỗi ra khỏi mã nghiệp vụ chính:
- **Checked Exception**: Các lỗi bắt buộc phải bắt (catch) hoặc khai báo ném ra (throws) tại thời điểm compile (như `IOException`, `SQLException`), giúp tăng tính an toàn tối đa cho các tương tác ngoại vi.
- **Unchecked Exception (Runtime Exception)**: Các lỗi do logic lập trình sai (như `NullPointerException`, `ArrayIndexOutOfBoundsException`), không bắt buộc phải khai báo.
- **Try-with-resources (Java 7)**: Cơ chế đóng tự động các tài nguyên (file, connection) khi kết thúc khối try, loại bỏ sự phức tạp và lỗi quên đóng tệp của khối `finally` truyền thống.

---

## 2. So sánh và Giải thích các khái niệm mới

### a) AutoCloseable và try-with-resources
- **Cách làm cũ (Java 6 về trước)**:
  ```java
  InputStream in = null;
  try {
      in = new FileInputStream("file.txt");
      // xử lý
  } finally {
      if (in != null) in.close(); // Dễ quên và cồng kềnh
  }
  ```
- **Cách làm mới (Java 7+)**:
  ```java
  try (InputStream in = new FileInputStream("file.txt")) {
      // xử lý, tự động đóng nhờ interface AutoCloseable
  }
  ```

### b) Java Platform Module System (JPMS - Java 9+)
Dự án **Project Jigsaw** giới thiệu khái niệm **Module** (định nghĩa qua tệp `module-info.java`).
- Tránh vấn nạn "Classpath Hell" (trùng lặp thư viện hoặc thiếu thư viện lúc chạy).
- Kiểm soát quyền truy cập chặt chẽ hơn: Bạn có thể ẩn các gói (packages) nội bộ bên trong JAR không cho các dự án bên ngoài import sử dụng, tăng cường tính bảo mật của hệ thống.

---

## 3. Rủi ro khi xử lý Ngoại lệ và Annotation sai cách

1. **Nuốt ngoại lệ (Empty Catch Block)**: Bắt exception nhưng bỏ trống khối catch `{}` hoặc chỉ ghi log đơn giản mà không ném lại hoặc dừng luồng xử lý. Điều này làm lỗi bị che giấu hoàn toàn, hệ thống chạy sai logic nhưng lập trình viên không hề hay biết.
2. **Bắt ngoại lệ quá chung chung (Catching Exception/Throwable)**: Viết `catch (Exception e)` cho tất cả. Việc này vô tình bắt luôn cả các lỗi runtime nghiêm trọng (như lỗi hết bộ nhớ OutOfMemoryError) mà đáng ra chương trình nên dừng ngay lập tức thay vì tiếp tục chạy.
3. **Hiểu sai về Retention Policy của Annotation**: Tạo custom annotation nhưng đặt sai `@Retention(RetentionPolicy.SOURCE)`. Khi đó, thư viện quét annotation qua cơ chế Java Reflection tại thời điểm Runtime sẽ không thể tìm thấy annotation này.
   - *Khắc phục*: Dùng `@Retention(RetentionPolicy.RUNTIME)` cho các annotation xử lý lúc chạy ứng dụng.

---

## 4. Code ví dụ minh họa chi tiết

```java
import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

// 1. Tạo Custom Annotation chạy tại Runtime
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@interface SafeExecution {
    String description() default "Thực thi an toàn";
}

// 2. Tạo Custom Checked Exception
class DatabaseConnectionException extends Exception {
    public DatabaseConnectionException(String message, Throwable cause) {
        super(message, cause);
    }
}

public class ExceptionAnnotationDemo {

    // Sử dụng Custom Annotation
    @SafeExecution(description = "Hàm đọc file có try-with-resources")
    public static void readFileDemo(String path) {
        // try-with-resources: Tự động đóng BufferedReader nhờ AutoCloseable
        try (BufferedReader br = new BufferedReader(new FileReader(path))) {
            System.out.println("Dòng đầu tiên của tệp: " + br.readLine());
        } catch (IOException e) {
            System.err.println("Xử lý lỗi đọc file: " + e.getMessage());
        }
    }

    public static void connectDatabase(String url) throws DatabaseConnectionException {
        if (url == null || !url.startsWith("jdbc:")) {
            // Ném exception có bọc nguyên nhân gốc (Exception Chaining)
            throw new DatabaseConnectionException(
                "Đường dẫn DB không hợp lệ!", 
                new IllegalArgumentException("URL must start with jdbc:")
            );
        }
        System.out.println("Kết nối DB thành công tới: " + url);
    }

    public static void main(String[] args) {
        // Kiểm tra đọc file
        readFileDemo("non_existent_file.txt");

        // Gọi hàm ném checked exception
        try {
            connectDatabase("invalid_url");
        } catch (DatabaseConnectionException e) {
            System.err.println("Bắt ngoại lệ DB: " + e.getMessage());
            System.err.println("Nguyên nhân gốc (Root Cause): " + e.getCause().getMessage());
        }
    }
}
```
