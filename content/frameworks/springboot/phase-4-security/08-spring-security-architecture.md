# [08] Phase 4 - Security: Spring Security Architecture & Authentication Flow

## 1. Nguồn gốc và lý do ra đời của Spring Security Architecture

### a) Khó khăn của việc bảo mật thủ công trong ứng dụng Java Web
Trong các ứng dụng Web dựa trên Servlet truyền thống, lập trình viên phải bảo vệ các tài nguyên bằng cách tự viết các lớp **Servlet Filter** hoặc **Interceptor**:
- **Hạn chế**:
  - Code kiểm tra đăng nhập (`session != null`) bị lặp lại ở đầu mọi Servlet hoặc Filter.
  - Khó khăn trong việc tích hợp nhiều cơ chế bảo mật đồng thời (như vừa đăng nhập bằng Form, vừa dùng Token, vừa tích hợp đăng nhập mạng xã hội).
  - Khó kiểm soát luồng chạy của các Filter do cấu hình thứ tự chạy trong `web.xml` rất dễ bị sai lệch.

### b) Giải pháp: Bộ lọc Security chuyên dụng và DelegatingFilterProxy
Spring Security ra đời để trừu tượng hóa toàn bộ quá trình bảo mật thành một chuỗi các bộ lọc (**`SecurityFilterChain`**):
- **`DelegatingFilterProxy`**: Là một Filter của Servlet Container (như Tomcat) nhưng nó không làm nhiệm vụ bảo mật trực tiếp. Nhiệm vụ duy nhất của nó là chuyển tiếp (delegate) toàn bộ request sang cho một Bean được quản lý bởi Spring IoC (đó chính là **`FilterChainProxy`**).
- Việc này giúp Spring Security tận dụng được toàn bộ sức mạnh Dependency Injection để tiêm các Service, Configuration vào trong các Filter bảo mật một cách dễ dàng.

---

## 2. Phân tích Luồng Xác thực (Authentication Flow)

Khi người dùng gửi thông tin đăng nhập (Username/Password), luồng xử lý diễn ra như sau:

```
[HTTP Request]
       │
       ▼
 1. SecurityFilterChain (Chuỗi các bộ lọc)
       │
       ▼ (Quét qua UsernamePasswordAuthenticationFilter)
 2. AuthenticationManager (Trình quản lý xác thực)
       │
       ▼ (Uỷ thác cho các Provider phù hợp)
 3. AuthenticationProvider (Thực hiện kiểm tra mật khẩu)
       │
       ├─► 4. UserDetailsService (Truy vấn User từ DB)
       │
       ▼ (Xác thực thành công)
 5. SecurityContextHolder (Lưu thông tin đăng nhập vào RAM/ThreadLocal)
```

### Chi tiết các thành phần cốt lõi:
1. **`SecurityFilterChain`**: Một danh sách các Filter chạy tuần tự (ví dụ: `CorsFilter` -> `CsrfFilter` -> `BasicAuthenticationFilter` -> `AuthorizationFilter`).
2. **`AuthenticationManager`**: Định nghĩa giao diện xác thực. Triển khai phổ biến nhất là `ProviderManager`.
3. **`AuthenticationProvider`**: Thực hiện logic xác thực cụ thể. Ví dụ: `DaoAuthenticationProvider` (so khớp username/password từ database).
4. **`UserDetailsService`**: Interface chịu trách nhiệm tải thông tin người dùng từ cơ sở dữ liệu lên dưới dạng đối tượng `UserDetails`.
5. **`SecurityContextHolder`**: Nơi lưu trữ thông tin của người dùng đã được xác thực (`SecurityContext`). Dữ liệu này được lưu trong **`ThreadLocal`**, nghĩa là thông tin đăng nhập sẽ tự động khả dụng trong suốt luồng xử lý của request đó.

---

## 3. Rủ ro khi thiết kế kiến trúc bảo mật sai cách

1. **Lộ lỗ hổng Bypass Filter (Bỏ qua bảo mật)**: Sử dụng phương thức `web.ignoring()` cho các đường dẫn nhạy cảm thay vì khai báo `permitAll()` trong `SecurityFilterChain`. 
   - *Rủi ro*: Khi dùng `ignoring()`, Spring Security sẽ bỏ hoàn toàn request đó ra khỏi Security Filter Chain. Request đó sẽ không nhận được các header bảo mật quan trọng (như bảo vệ chống XSS, clickjacking) và không thể lấy thông tin người dùng hiện tại từ SecurityContext.
   - *Khắc phục*: Luôn sử dụng `http.authorizeHttpRequests().requestMatchers(...).permitAll()`.
2. **Không làm sạch SecurityContext khi sử dụng Thread Pool**: Khi tự tạo các luồng chạy ngầm hoặc sử dụng luồng của Thread Pool mà không dọn dẹp `SecurityContextHolder.clearContext()`. Do ThreadLocal gắn liền với Thread, nếu Thread đó được trả về pool và tái sử dụng cho người dùng khác, người dùng sau có thể vô tình chiếm đoạt phiên đăng nhập của người dùng trước.

---

## 4. Code ví dụ minh họa chi tiết

### Cấu hình SecurityFilterChain hiện đại (Spring Security 6.x)

```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    // 1. Cấu hình chuỗi bộ lọc bảo mật SecurityFilterChain
    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .csrf(csrf -> csrf.disable()) // Tắt CSRF nếu xây dựng REST API không trạng thái
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/public/**").permitAll() // Cho phép truy cập công khai
                .requestMatchers("/api/v1/admin/**").hasRole("ADMIN") // Chỉ cho phép ADMIN
                .anyRequest().authenticated() // Các request khác bắt buộc đăng nhập
            )
            .httpBasic(httpBasic -> {}); // Sử dụng HTTP Basic Authentication đơn giản
        
        return http.build();
    }

    // 2. Tạo nhanh UserDetailsService giả lập trong bộ nhớ RAM phục vụ test
    @Bean
    public UserDetailsService userDetailsService() {
        UserDetails user = User.withDefaultPasswordEncoder()
            .username("hoang")
            .password("password123")
            .roles("USER")
            .build();

        UserDetails admin = User.withDefaultPasswordEncoder()
            .username("admin")
            .password("admin123")
            .roles("ADMIN")
            .build();

        return new InMemoryUserDetailsManager(user, admin);
    }
}
```
