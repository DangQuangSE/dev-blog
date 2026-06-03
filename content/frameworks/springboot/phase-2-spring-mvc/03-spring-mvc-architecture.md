# [03] Phase 2 - Spring MVC: Kiến trúc Spring MVC: Servlet, JSP & Components

## 1. Nguồn gốc và lý do ra đời của Kiến trúc Front Controller (Spring MVC)

### a) Cách phát triển Web truyền thống với Java Servlet & JSP
Trước khi Spring MVC xuất hiện, các ứng dụng Web Java được xây dựng trực tiếp bằng **Servlet API** và **JSP (JavaServer Pages)**:
- **Servlet**: Là một class Java chạy trên máy chủ Web (như Tomcat) dùng để nhận request HTTP và sinh ra response (thường bằng cách viết mã HTML trực tiếp trong code Java qua `PrintWriter`).
- **JSP**: Cho phép viết mã HTML thông thường và nhúng mã Java vào bên trong qua các thẻ Scriptlet (`<% ... %>`).
- **Hạn chế**:
  1. **Cấu hình cồng kềnh**: Mỗi một đường dẫn URL (ví dụ `/register`, `/login`) yêu cầu bạn phải tạo một class Servlet riêng biệt và khai báo nó trong tệp `web.xml` (hoặc dùng `@WebServlet` sau này). Với hàng trăm URL, việc quản lý class Servlet trở thành ác mộng.
  2. **Trộn lẫn logic (Spaghetti Code)**: Việc viết mã Java trực tiếp trong file JSP (Scriptlet) làm phá vỡ sự phân tách giữa giao diện (View) và logic nghiệp vụ (Controller). Code trở nên vô cùng khó đọc, khó debug và không thể Unit Test.

### b) Giải pháp: Mẫu thiết kế Front Controller và Spring MVC
Spring MVC giải quyết triệt để vấn đề này bằng cách đưa vào mẫu thiết kế **Front Controller (Bộ điều phối trung tâm)**:
- Chỉ sử dụng một Servlet duy nhất là **`DispatcherServlet`** làm cửa ngõ tiếp nhận toàn bộ các request gửi tới ứng dụng.
- `DispatcherServlet` sẽ phân tích URL, tìm kiếm Controller tương ứng thông qua bản đồ định tuyến (**`HandlerMapping`**), gọi Controller xử lý và điều phối kết quả View trả về cho client.

---

## 2. Luồng hoạt động của Spring MVC (Architecture & Components)

Quy trình xử lý một yêu cầu trong Spring MVC diễn ra như sau:

```
[Client Request]
       │
       ▼
 1. DispatcherServlet (Front Controller) <───┐
       │                                     │
       ├─► 2. HandlerMapping                 │
       │     (Tìm Controller phù hợp)        │
       │                                     │
       ├─► 3. Controller (Xử lý nghiệp vụ) ──┘ (Trả về ModelAndView)
       │
       ├─► 4. ViewResolver (Tìm template HTML)
       │
       ▼
 5. View (Render HTML/Thymeleaf/JSP) ──► [HTTP Response to Client]
```

### Chi tiết các thành phần cốt lõi:
1. **`DispatcherServlet`**: Tiếp nhận request từ client và điều phối luồng xử lý.
2. **`HandlerMapping`**: Ánh xạ URL với Controller tương ứng (ví dụ: quét các class có `@GetMapping`).
3. **`Controller`**: Nhận input từ request, gọi tầng Service xử lý logic và trả về một đối tượng `ModelAndView` (chứa dữ liệu Model và tên View cần hiển thị).
4. **`ViewResolver`**: Dựa vào tên View (ví dụ: `"home"`) để định vị tệp template thực tế trên ổ đĩa (ví dụ: `/WEB-INF/jsp/home.jsp` hoặc `templates/home.html`).
5. **`View`**: Kết xuất dữ liệu Model vào template HTML và trả về mã HTML hoàn chỉnh cho Client.

---

## 3. Rủi ro khi thiết kế và sử dụng Spring MVC sai cách

1. **Hiểu sai luồng chặn luồng (Thread Blocking)**: DispatcherServlet của Spring MVC hoạt động dựa trên mô hình luồng đồng bộ, chặn (blocking). Mỗi request chiếm dụng một luồng từ Thread Pool (mặc định Tomcat có 200 luồng). Nếu bạn thực hiện các tác vụ tốn thời gian (như gọi API bên ngoài mất 10 giây) trực tiếp trong Controller, Thread Pool sẽ nhanh chóng bị cạn kiệt, khiến máy chủ từ chối mọi kết nối mới.
   - *Khắc phục*: Sử dụng lập trình bất đồng bộ (`@Async`, `DeferredResult`) hoặc chuyển sang WebFlux cho các bài toán chịu tải cao.
2. **Trộn lẫn Logic vào View**: Đưa logic nghiệp vụ (như tính toán thuế, truy vấn DB trực tiếp) vào các tệp JSP/Thymeleaf thông qua các thẻ biểu thức động. Điều này làm cho View trở nên cồng kềnh và không thể viết Unit Test để kiểm chứng logic.

---

## 4. Code ví dụ minh họa chi tiết

### Cấu hình Controller truyền thống trả về JSP/Thymeleaf View

```java
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller // Dùng @Controller truyền thống thay vì @RestController
public class HomeController {

    /**
     * Định tuyến URL '/welcome' trả về giao diện View.
     * Dữ liệu Model được truyền sang để hiển thị trên JSP/Thymeleaf.
     */
    @GetMapping("/welcome")
    public String welcomePage(@RequestParam(name = "name", required = false, defaultValue = "Developer") String name, 
                              Model model) {
        // Đưa dữ liệu vào Model
        model.addAttribute("username", name);
        model.addAttribute("message", "Chào mừng bạn đến với khóa học Spring MVC!");
        
        // Trả về tên View. ViewResolver sẽ tự tìm file tương ứng (ví dụ: welcome.html)
        return "welcome"; 
    }
}
```

### Cấu hình ViewResolver trong file `application.properties` (cho JSP cổ điển)
```properties
# Chỉ định tiền tố thư mục chứa tệp JSP
spring.mvc.view.prefix=/WEB-INF/jsp/
# Chỉ định hậu tố định dạng tệp
spring.mvc.view.suffix=.jsp
```
