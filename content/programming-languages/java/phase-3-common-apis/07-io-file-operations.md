# [07] Phase 3 - Common APIs: Quản lý Optionals, I/O Stream & Thao tác File

## 1. Nguồn gốc và lý do nâng cấp lên Java NIO.2 và Optional

### a) Vấn nạn NullPointerException (NPE) và I/O nghẽn (Blocking I/O)
- **Null (NPE)**: Sir Tony Hoare gọi phát minh ra tham chiếu Null là "sai lầm tỷ đô" của ông. Trong Java, việc gọi phương thức trên một tham chiếu Null dẫn đến lỗi Runtime `NullPointerException` làm sập ứng dụng. Lập trình viên phải viết hàng tá khối kiểm tra `if (obj != null)` lồng nhau rất mất thẩm mỹ.
- **I/O cổ điển (java.io)**: Được thiết kế dựa trên mô hình luồng đồng bộ, chặn (blocking). Khi một luồng đọc tệp từ ổ cứng hoặc luồng mạng, luồng đó sẽ bị đóng băng (block) hoàn toàn cho đến khi dữ liệu được nạp xong, gây lãng phí tài nguyên CPU nghiêm trọng.

### b) Giải pháp hiện đại: Optional và Java NIO.2 (java.nio)
- **Optional (Java 8)**: Một container object đại diện cho một giá trị có hoặc không tồn tại. Ép buộc lập trình viên phải chủ động xử lý trường hợp dữ liệu rỗng một cách tường minh, tránh lỗi NPE ngầm.
- **NIO.2 (Non-blocking I/O - Java 7+)**: Cung cấp lớp trợ giúp `java.nio.file.Files` và các interface `Path`, `Paths`. NIO.2 sử dụng bộ đệm (Buffers) và kênh dẫn (Channels), hỗ trợ đọc/ghi bất đồng bộ, thao tác siêu nhanh với metadata của tệp, xử lý mượt mà các tệp dung lượng lớn.

---

## 2. So sánh Cách làm cũ vs Cách làm mới

### a) Xử lý giá trị có khả năng Null
- **Cách làm cũ**: `if (user != null) { return user.getName(); } else { return "Unknown"; }`
- **Cách làm mới**: `Optional.ofNullable(user).map(User::getName).orElse("Unknown")`

### b) Đọc tệp văn bản
- **Cách làm cũ (java.io)**: Tạo `BufferedReader` bọc ngoài `FileReader`, đọc từng dòng trong vòng lặp `while`, tự đóng luồng trong khối `finally`.
- **Cách làm mới (java.nio.file)**: Dùng `Files.readAllLines(path)` hoặc `Files.lines(path)` sử dụng Stream API để đọc lười (lazy read), tự động giải phóng tài nguyên.

---

## 3. Rủi ro khi thiết kế và thao tác I/O sai cách

1. **Lạm dụng Optional bừa bãi**: Dùng `Optional` làm kiểu dữ liệu cho thuộc tính của lớp (Field) hoặc tham số truyền vào phương thức. Điều này làm tăng chi phí cấp phát bộ nhớ (vì phải tạo thêm đối tượng bọc ngoài) và làm chậm hiệu năng không cần thiết.
   - *Khắc phục*: Chỉ dùng `Optional` cho kiểu trả về (Return Type) của phương thức.
2. **Rò rỉ tài nguyên (Resource Leak)**: Không đóng luồng dẫn (Stream/Reader/Writer) sau khi mở tệp. Hệ điều hành giới hạn số lượng File Descriptor được mở đồng thời. Nếu mở quá nhiều mà không đóng, hệ thống sẽ báo lỗi "Too many open files" và từ chối mở tệp mới.
   - *Khắc phục*: Luôn sử dụng cú pháp **try-with-resources** (từ Java 7+) để tự động giải phóng tài nguyên.

---

## 4. Code ví dụ minh họa chi tiết

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.util.List;
import java.util.Optional;

public class FileIODemo {

    // Lớp giả lập phục vụ ví dụ Optional
    static class User {
        private String email;

        public User(String email) {
            this.email = email;
        }

        public String getEmail() {
            return email;
        }
    }

    // Hàm trả về Optional
    public static Optional<User> findUserByUsername(String username) {
        if ("admin".equalsIgnoreCase(username)) {
            return Optional.of(new User("admin@devblog.com"));
        }
        return Optional.empty(); // Trả về rỗng an toàn, không trả về null
    }

    public static void main(String[] args) {
        // 1. Thực hành Optional an toàn
        Optional<User> userOpt = findUserByUsername("guest");
        
        // Trích xuất an toàn dùng orElseGet
        String email = userOpt.map(User::getEmail)
                              .orElse("no-email@devblog.com");
        System.out.println("Email tìm thấy: " + email);

        // 2. Thao tác File hiện đại với java.nio.file (NIO.2)
        Path dirPath = Paths.get("scratch");
        Path filePath = dirPath.resolve("sample.txt");

        try {
            // Tạo thư mục nếu chưa có
            if (Files.notExists(dirPath)) {
                Files.createDirectories(dirPath);
                System.out.println("Đã tạo thư mục scratch/");
            }

            // Ghi nội dung vào File (try-with-resources tự động đóng)
            String content = "Hello Java NIO.2!\nDòng thứ hai ghi đè.\n";
            Files.writeString(filePath, content, StandardOpenOption.CREATE, StandardOpenOption.WRITE);
            System.out.println("Đã ghi file thành công.");

            // Đọc toàn bộ nội dung File dưới dạng danh sách các dòng
            List<String> lines = Files.readAllLines(filePath);
            System.out.println("Nội dung tệp đọc được:");
            lines.forEach(line -> System.out.println("-> " + line));

            // Đọc tệp hiệu quả dưới dạng Stream (thích hợp cho tệp cực lớn)
            try (var fileStream = Files.lines(filePath)) {
                long lineCount = fileStream.filter(line -> line.contains("Java")).count();
                System.out.println("Số dòng chứa từ 'Java': " + lineCount);
            }

        } catch (IOException e) {
            System.err.println("Lỗi thao tác I/O: " + e.getMessage());
        }
    }
}
```
