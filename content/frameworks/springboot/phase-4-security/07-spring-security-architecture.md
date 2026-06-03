# [07] Phase 4 - Security: Spring Security Architecture & Authentication Flow

## 1. Nguồn gốc và lý do ra đời của Spring Security

### Cách làm bảo mật kiểu cũ (J2EE Filter & Interceptor thủ công)
Trước khi Spring Security trở thành tiêu chuẩn, việc bảo mật một ứng dụng Java Web thường phụ thuộc vào các `Servlet Filter` cấu hình riêng lẻ trong tệp `web.xml` hoặc các `HandlerInterceptor` tự viết:
- Lập trình viên phải viết các Filter thủ công để kiểm tra Session của User trong mọi request: `if (session.getAttribute("user") == null) { response.sendRedirect("/login"); }`.
- Việc quản lý phân quyền (ví dụ: chỉ Admin mới được truy cập `/admin/**`) dẫn đến code rẽ nhánh phức tạp và khó khăn khi cấu hình tích hợp thêm các tiêu chuẩn như OAuth2, JWT.
- Hệ thống dễ bị tổn thương trước các cuộc tấn công web phổ biến như **CSRF (Cross-Site Request Forgery)**, **Session Fixation**, **Clickjacking** vì lập trình viên phải tự viết code phòng thủ từ đầu.

### Sự xuất hiện của Spring Security (Acegi Security)
Để cung cấp một giải pháp bảo mật toàn diện, Acegi Security ra đời năm 2003 và sau đó được sát nhập vào Spring và đổi tên thành **Spring Security**. Nó cung cấp một hệ thống bảo mật linh hoạt dựa trên AOP (Aspect-Oriented Programming) và các Servlet Filter.

---

## 2. Kiến trúc cốt lõi của Spring Security: Filter Chain

Bản chất của Spring Security là một chuỗi các bộ lọc (**Filter Chain**) nằm trước Servlet chính (`DispatcherServlet`). Mọi request gửi tới ứng dụng đều phải đi qua chuỗi này.

### DelegatingFilterProxy & FilterChainProxy
- **DelegatingFilterProxy**: Servlet Container (Tomcat) không biết về các Bean của Spring. Do đó, Spring Security sử dụng một Filter chuẩn của Servlet là `DelegatingFilterProxy` làm cầu nối để chuyển quyền xử lý request cho một Spring Bean.
- **FilterChainProxy**: Là Bean thực tế nhận request từ proxy, quản lý danh sách các `SecurityFilterChain`.

```
[Request] 
   ↓
[Servlet Container (Tomcat)]
   ↓
[DelegatingFilterProxy]
   ↓
[FilterChainProxy] ──> [SecurityFilterChain (Filter 1 -> Filter 2 -> Filter N)]
   ↓
[DispatcherServlet (Spring MVC Controller)]
```

### Các Filter quan trọng trong chuỗi mặc định:
1.  **`SecurityContextPersistenceFilter`**: Nạp thông tin Authentication từ `HttpSession` vào `SecurityContext` lúc bắt đầu request và dọn dẹp khi kết thúc request.
2.  **`UsernamePasswordAuthenticationFilter`**: Xử lý request đăng nhập bằng form login (mặc định là POST `/login`).
3.  **`ExceptionTranslationFilter`**: Bắt các lỗi bảo mật (`AccessDeniedException`, `AuthenticationException`) xảy ra trong chuỗi lọc và chuyển đổi thành HTTP Response (ví dụ: trả về 401 hoặc redirect sang trang đăng nhập).
4.  **`AuthorizationFilter`** (hoặc `FilterSecurityInterceptor` trong phiên bản cũ): Bộ lọc cuối cùng trong chuỗi, chịu trách nhiệm kiểm tra xem User hiện tại có quyền truy cập endpoint yêu cầu hay không.

---

## 3. Luồng xác thực (Authentication Flow) chi tiết

Hãy xem luồng xử lý diễn ra thế nào khi một User gửi username/password để đăng nhập:

```
[User Form Login] 
       ↓
[UsernamePasswordAuthenticationFilter] (Trích xuất credentials thành UsernamePasswordAuthenticationToken)
       ↓
[AuthenticationManager (ProviderManager)] (Điều phối các Provider xác thực)
       ↓
[AuthenticationProvider (DaoAuthenticationProvider)] (Thực hiện logic kiểm tra mật khẩu)
       ↓
[UserDetailsService] (Truy vấn DB lấy UserDetails) ──> [Database]
       ↓
[PasswordEncoder (BCrypt)] (So sánh mật khẩu hash)
       ↓
[Authentication (Thành công)] ──> Lưu vào ──> [SecurityContextHolder]
```

### Cấu hình SecurityFilterChain tiêu biểu (Spring Security 6.x):
Từ Spring Security 5.7+, cấu hình bằng cách kế thừa `WebSecurityConfigurerAdapter` đã bị loại bỏ (deprecated). Thay vào đó, chúng ta cấu hình dạng khai báo (component-based) bằng cách định nghĩa một Bean `SecurityFilterChain`.

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            // 1. Tắt CSRF nếu xây dựng Stateless API (sử dụng JWT)
            .csrf(csrf -> csrf.disable())
            
            // 2. Cấu hình phân quyền endpoint
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/auth/**").permitAll() // Cho phép truy cập không cần login
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN") // Chỉ Admin được vào
                .anyRequest().authenticated() // Các request khác phải đăng nhập
            )
            
            // 3. Sử dụng cấu hình HTTP Basic hoặc Form Login mặc định
            .httpBasic(basic -> {});

        return http.build();
    }
}
```

---

## 4. Rủi ro khi không hiểu sâu về cấu hình Spring Security

1. **Lỗ hổng bảo mật nghiêm trọng do tắt CSRF sai cách**: Nếu ứng dụng của bạn sử dụng Session cookie để duy trì trạng thái mà bạn cấu hình tắt CSRF (`.csrf(csrf -> csrf.disable())`), kẻ tấn công có thể thực hiện tấn công CSRF để thực hiện hành động trái phép thay thế nạn nhân.
2. **Quên bảo mật Endpoint (PermitAll vô tình)**: Khi sử dụng regex hoặc wildcard trong `requestMatchers` (ví dụ: `/api/**`), nếu cấu hình sai thứ tự, một endpoint nhạy cảm (như `/api/users/delete`) có thể bị vô tình phơi bày công cộng mà không yêu cầu token bảo mật.
3. **Lưu trữ mật khẩu dạng thô hoặc giải thuật cũ (MD5/SHA1)**: Việc không sử dụng `BCryptPasswordEncoder` hoặc `Argon2` mà dùng các hàm băm cũ (MD5/SHA1) dễ khiến cơ sở dữ liệu bị bẻ khóa mật khẩu hàng loạt qua các bảng Rainbow Table nếu DB bị rò rỉ.
