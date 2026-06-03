# [09] Phase 4 - Security: Bảo mật nâng cao: JWT & OAuth2

## 1. Nguồn gốc của sự chuyển dịch từ Session sang Token-Based Authentication

### a) Hạn chế của xác thực dựa trên Session truyền thống
Trong mô hình Web truyền thống, máy chủ Web quản lý trạng thái đăng nhập của người dùng qua **HttpSession**:
- Máy chủ lưu thông tin đăng nhập của người dùng vào bộ nhớ RAM và trả về cho Client một mã định danh Cookie tên là `JSESSIONID`. Trình duyệt sẽ tự động gửi kèm cookie này ở mỗi request tiếp theo.
- **Hạn chế trong kiến trúc hiện đại (Microservices / Distributed System)**:
  1. **Khó scale ngang**: Nếu bạn có 5 instance của server chạy sau Load Balancer, người dùng đăng nhập ở Server 1 sẽ bị coi là chưa đăng nhập khi request tiếp theo bị chuyển sang Server 2 (do RAM Server 2 không chứa Session đó).
  2. **Bộ nhớ máy chủ**: Lưu trữ hàng triệu Session hoạt động trong RAM làm đầy bộ nhớ máy chủ.

### b) Giải pháp: Token-Based Authentication (JWT) & OAuth2
- **JWT (JSON Web Token)**: Là một cơ chế xác thực **không trạng thái (stateless)**. Toàn bộ thông tin định danh và quyền hạn của người dùng được mã hóa thành một chuỗi Base64 ký số bảo mật, lưu trữ trực tiếp ở phía Client. Máy chủ chỉ cần giải mã ký số để xác thực mà không cần lưu trữ bất kỳ trạng thái nào trong RAM.
- **OAuth2**: Là một đặc tả tiêu chuẩn công nghiệp về ủy quyền bảo mật (Authorization Framework). Nó cho phép ứng dụng bên thứ ba truy cập một phần tài nguyên của người dùng mà không cần biết mật khẩu của họ (ví dụ: tính năng "Đăng nhập bằng Google/Facebook").

---

## 2. So sánh JWT vs OAuth2

| Tiêu chí | JSON Web Token (JWT) | OAuth2 Specification |
| :--- | :--- | :--- |
| **Bản chất** | Định dạng cấu trúc Token (Format) | Giao thức/Đặc tả luồng ủy quyền (Protocol/Framework) |
| **Mục đích** | Xác thực danh tính người dùng (Authentication) | Ủy quyền truy cập tài nguyên (Authorization) |
| **Lưu trữ trạng thái** | Hoàn toàn không trạng thái (Stateless) | Có thể có trạng thái tại Authorization Server |
| **Trường hợp sử dụng** | Bảo mật API nội bộ, Single Sign-On (SSO) | Đăng nhập bên thứ ba, chia sẻ API bên ngoài |

---

## 3. Rủi ro bảo mật nghiêm trọng khi sử dụng Token

1. **Rò rỉ Khóa bí mật (Weak Secret Key)**: Sử dụng các chuỗi ký bí mật ngắn, dễ đoán để ký JWT. Kẻ tấn công có thể dễ dàng dùng các công cụ brute-force để dò ra khóa bí mật, tự tạo ra một JWT giả lập quyền `ADMIN` để hack toàn bộ hệ thống.
   - *Khắc phục*: Sử dụng khóa bí mật tối thiểu **256-bit** ngẫu nhiên.
2. **Không thể thu hồi Token tức thời (Token Revocation Problem)**: Vì JWT là stateless, một khi đã được sinh ra và gửi cho client, nó sẽ có hiệu lực cho đến khi hết hạn (Expires). Nếu tài khoản của người dùng bị hack hoặc admin muốn khóa tài khoản đó ngay lập tức, JWT cũ vẫn có thể truy cập API bình thường.
   - *Khắc phục*: Sử dụng cơ chế lưu trữ **Blacklist Token** trên Redis hoặc thiết kế thời gian sống của Access Token cực ngắn (ví dụ: 15 phút) kết hợp với **Refresh Token** để gia hạn.

---

## 4. Code ví dụ minh họa chi tiết

### a) Viết Utility Class tạo và giải mã JWT (Dùng thư viện io.jsonwebtoken)
```java
// Cần dependency: io.jsonwebtoken:jjwt-api:0.11.5
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import java.security.Key;
import java.util.Date;

public class JwtTokenProvider {

    // Khởi tạo khóa bí mật an toàn tối thiểu 256-bit
    private static final Key SECRET_KEY = Keys.secretKeyFor(SignatureAlgorithm.HS256);
    private static final long EXPIRATION_TIME = 900000; // 15 phút (ms)

    // 1. Tạo JWT Token từ thông tin Username
    public static String generateToken(String username) {
        Date now = new Date();
        Date expiryDate = new Date(now.getTime() + EXPIRATION_TIME);

        return Jwts.builder()
                .setSubject(username)
                .setIssuedAt(now)
                .setExpiration(expiryDate)
                .signWith(SECRET_KEY)
                .compact();
    }

    // 2. Validate và giải mã Token lấy thông tin Username
    public static String getUsernameFromJwt(String token) {
        Claims claims = Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody();

        return claims.getSubject();
    }

    public static boolean validateToken(String token) {
        try {
            Jwts.parserBuilder().setSigningKey(SECRET_KEY).build().parseClaimsJws(token);
            return true;
        } catch (Exception ex) {
            // Token hết hạn, sai chữ ký, format lỗi...
            return false;
        }
    }
}
```

### b) Cấu hình OAuth2 Login trong SecurityFilterChain (Đăng nhập Google)
```java
// Cần dependency: spring-boot-starter-oauth2-client
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class OAuth2SecurityConfig {

    @Bean
    public SecurityFilterChain oauth2SecurityFilterChain(HttpSecurity http) throws Exception {
        http
            .authorizeHttpRequests(auth -> auth
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                // Kích hoạt tính năng đăng nhập OAuth2 Client
                // Spring Boot tự động cấu hình các endpoint redirect/callback dựa trên application.yml
                .defaultSuccessUrl("/home", true)
            );
        return http.build();
    }
}
```
