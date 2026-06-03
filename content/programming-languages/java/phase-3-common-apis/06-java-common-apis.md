# [06] Phase 3 - Common APIs: Làm việc với Date-Time, RegEx, Cryptography & Networking

## 1. Nguồn gốc và lý do cải cách các API thông dụng trong Java

### b) Sự lỗi thời của các thư viện Date-Time và HTTP cũ
Trong các phiên bản Java đời đầu, các lớp như `java.util.Date` và `java.util.Calendar` gặp rất nhiều chỉ trích:
- Chúng không an toàn với đa luồng (mutable và non-thread-safe), khiến các phép toán cộng trừ ngày tháng dễ bị lệch dữ liệu khi chạy song song.
- Thiết kế khó hiểu (ví dụ: tháng bắt đầu từ 0 thay vì 1).
- Về mặt mạng, lớp `HttpURLConnection` được thiết kế từ năm 1997 vô cùng cồng kềnh, không hỗ trợ bất đồng bộ, HTTP/2 hay WebSocket.

### b) Sự cải tiến hiện đại trong Java 8 và Java 11
- **Java Time API (Java 8)**: Thay thế hoàn toàn hệ thống Date-Time cũ bằng các lớp bất biến (immutable), an toàn luồng (thread-safe) như `LocalDate`, `LocalDateTime`, `Instant`, và `ZonedDateTime`.
- **HttpClient (Java 11+)**: API HttpClient hiện đại thay thế cho `HttpURLConnection` cũ, hỗ trợ cả đồng bộ, bất đồng bộ (qua `CompletableFuture`), HTTP/1.1, HTTP/2, và luồng phản ứng (Reactive streams).
- **Cryptography & Security**: Cung cấp các công cụ chuẩn bảo mật công nghiệp (`MessageDigest`, `Cipher`) tích hợp sẵn trong JDK để hashing dữ liệu hoặc mã hóa đối xứng AES.

---

## 2. So sánh Cách làm cũ vs Cách làm mới

### a) Date & Time
- **Cách làm cũ**: Sử dụng `java.util.Date`. Việc cộng thêm 1 ngày yêu cầu phải tạo `Calendar`, gán thời gian, gọi hàm `add()`, rồi lấy ngược lại đối tượng `Date`.
- **Cách làm mới**: Sử dụng `LocalDate.now().plusDays(1)`. Hàm trả về một đối tượng mới hoàn toàn (Immutable), an toàn tuyệt đối khi chia sẻ giữa các luồng.

### b) Kết nối HTTP (Networking)
- **Cách làm cũ**: Dùng `HttpURLConnection`, phải tự mở connection, đọc InputStream bằng BufferedReader, tự đóng tài nguyên trong khối try-finally thủ công.
- **Cách làm mới**: Sử dụng `HttpClient` kết hợp `HttpRequest` và `HttpResponse.BodyHandlers.ofString()`, code sạch sẽ, dễ tích hợp xử lý bất đồng bộ.

---

## 3. Rủi ro khi lập trình API không đúng chuẩn

1. **Trôi lệch múi giờ (Timezone Drift)**: Lưu trữ thời gian trên Database dưới dạng chuỗi local không múi giờ (LocalDateTime) dẫn đến việc khi máy chủ thay đổi timezone, toàn bộ lịch sử giao dịch bị hiển thị sai giờ.
   - *Khắc phục*: Luôn sử dụng `Instant` (lưu giờ UTC chuẩn) hoặc `ZonedDateTime` để lưu trữ dữ liệu thời gian có chứa múi giờ cụ thể.
2. **Nghẽn luồng HTTP (Thread Blocking)**: Sử dụng các yêu cầu HTTP đồng bộ (Synchronous HTTP call) trong một vòng lặp lớn mà không cấu hình Timeout. Nếu dịch vụ bên thứ ba bị chậm hoặc treo, ứng dụng Java của bạn sẽ bị cạn kiệt luồng (Thread Exhaustion) dẫn đến tê liệt hệ thống.
3. **Mã hóa kém an toàn (Weak Cryptography)**: Sử dụng thuật toán MD5 hoặc SHA-1 để hash mật khẩu. Các thuật toán này hiện nay rất dễ bị tấn công brute-force hoặc đụng độ mã hash (collision).
   - *Khắc phục*: Dùng thuật toán SHA-256 kèm muối (salt), hoặc tích hợp BCrypt/PBKDF2.

---

## 4. Code ví dụ minh họa chi tiết

```java
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.MessageDigest;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.Base64;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;

public class CommonAPIsDemo {

    public static void main(String[] args) throws Exception {
        // 1. Sử dụng Date-Time API mới
        Instant nowUTC = Instant.now(); // Lấy giờ UTC chuẩn
        LocalDateTime vnDateTime = LocalDateTime.ofInstant(nowUTC, ZoneId.of("Asia/Ho_Chi_Minh"));
        
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("dd-MM-yyyy HH:mm:ss");
        System.out.println("Thời gian hiện tại tại Việt Nam: " + vnDateTime.format(formatter));

        // 2. Sử dụng RegEx kiểm tra Email
        String emailPattern = "^[A-Za-z0-9+_.-]+@(.+)$";
        Pattern pattern = Pattern.compile(emailPattern);
        Matcher matcher = pattern.matcher("test@devblog.com");
        System.out.println("Email hợp lệ? " + matcher.matches());

        // 3. Cryptography: Mã hóa AES đối xứng
        String originalText = "SuperSecretPassword";
        String secretKey = "MySecretKeyAES123"; // Khóa 16 byte
        
        SecretKeySpec keySpec = new SecretKeySpec(secretKey.getBytes(), "AES");
        Cipher cipher = Cipher.getInstance("AES");
        
        // Mã hóa
        cipher.init(Cipher.ENCRYPT_MODE, keySpec);
        byte[] encryptedBytes = cipher.doFinal(originalText.getBytes());
        String encryptedText = Base64.getEncoder().encodeToString(encryptedBytes);
        System.out.println("Chuỗi đã mã hóa AES: " + encryptedText);

        // Giải mã
        cipher.init(Cipher.DECRYPT_MODE, keySpec);
        byte[] decryptedBytes = cipher.doFinal(Base64.getDecoder().decode(encryptedText));
        System.out.println("Chuỗi đã giải mã AES: " + new String(decryptedBytes));

        // Hashing với SHA-256
        MessageDigest digest = MessageDigest.getInstance("SHA-256");
        byte[] hash = digest.digest(originalText.getBytes());
        System.out.println("Hash SHA-256 (Hex): " + Base64.getEncoder().encodeToString(hash));

        // 4. HttpClient (Java 11+) gọi API JSON giả lập
        HttpClient client = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(5))
                .build();

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create("https://jsonplaceholder.typicode.com/posts/1"))
                .GET()
                .build();

        // Gửi đồng bộ
        HttpResponse<String> response = client.send(request, HttpResponse.BodyHandlers.ofString());
        System.out.println("HTTP Status: " + response.statusCode());
        System.out.println("Response Body: " + response.body());
    }
}
```
