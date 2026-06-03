# [04] Phase 2 - Spring MVC: Xây dựng RESTful API với Spring MVC

## 1. Nguồn gốc của sự chuyển dịch từ MVC truyền thống sang REST API

### Cách làm cũ (Traditional Server-Side Rendering)
Trước đây, các ứng dụng Java Web sử dụng JSP (JavaServer Pages) hoặc Thymeleaf để kết xuất (render) giao diện trực tiếp trên máy chủ.
- Khi người dùng gửi request, server sẽ truy vấn cơ sở dữ liệu, điền dữ liệu vào template HTML và trả về trang HTML hoàn chỉnh cho trình duyệt.
- **Hạn chế**: Mỗi lần chuyển trang hoặc thay đổi dữ liệu nhỏ, trình duyệt phải tải lại toàn bộ trang (Full Page Reload), gây lãng phí băng thông và trải nghiệm người dùng gián đoạn.

### Sự bùng nổ của SPA (Single Page Application) và REST API
Với sự ra đời của các Javascript Framework hiện đại như React, Angular, Vue, vai trò kết xuất giao diện được chuyển giao hoàn toàn sang Client (trình duyệt).
- Máy chủ backend giờ đây đóng vai trò như một **Data Provider** không trạng thái (stateless), chỉ cung cấp dữ liệu thô (thường dưới dạng JSON/XML) qua giao thức HTTP.
- Kiến trúc thiết kế các endpoint dữ liệu này tuân theo tiêu chuẩn **REST (Representational State Transfer)**.

---

## 2. Spring MVC: `@Controller` vs `@RestController`

Trong Spring MVC, có hai Annotation chính được sử dụng để xây dựng API/Web endpoint:

### `@Controller` (Dùng cho SSR)
Được sử dụng khi bạn muốn trả về một View (trang HTML/Thymeleaf).
```java
@Controller
public class WebController {
    @GetMapping("/home")
    public String getHomepage() {
        return "home"; // Trả về file home.html trong thư mục templates
    }
}
```

### `@RestController` (Dùng cho REST API)
Là sự kết hợp của `@Controller` và `@ResponseBody`. Thay vì trả về một tên View, Spring MVC sẽ tự động chuyển đổi đối tượng trả về từ Java Object sang JSON/XML bằng thư viện **Jackson** và ghi trực tiếp vào HTTP Response.
```java
@RestController
@RequestMapping("/api/v1/users")
public class UserRestController {
    
    @GetMapping("/{id}")
    public User getUserById(@PathVariable Long id) {
        return new User(id, "Dang Quang"); // Trả về JSON: {"id": 1, "name": "Dang Quang"}
    }
}
```

---

## 3. Pattern thiết yếu: DTO (Data Transfer Object)

### Tại sao không nên trả về trực tiếp Database Entity?
Một sai lầm phổ biến của người mới bắt đầu là phơi bày trực tiếp thực thể cơ sở dữ liệu (`Entity`) ra ngoài API:
```java
// RẤT NGUY HIỂM: Trả về trực tiếp Entity
@GetMapping("/{id}")
public UserEntity getUser(@PathVariable Long id) {
    return userRepository.findById(id);
}
```
### Rủi ro nghiêm trọng:
1. **Lộ thông tin nhạy cảm**: Thực thể `UserEntity` chứa các trường như `passwordHash`, `role`, `status`. Nếu trả về trực tiếp, kẻ tấn công có thể xem được hash mật khẩu.
2. **Khó bảo trì**: Nếu bạn thay đổi cấu trúc bảng cơ sở dữ liệu (ví dụ: đổi tên trường `first_name` thành `given_name`), API Response sẽ tự động bị thay đổi theo, làm hỏng các ứng dụng Frontend đang gọi API này (Breaking Changes).
3. **Lỗi tuần hoàn (Circular Reference)**: Nếu Entity có mối quan hệ `@OneToMany` hoặc `@ManyToMany` hai chiều, Jackson sẽ bị lặp vô hạn khi parse JSON dẫn đến lỗi `StackOverflowError`.

### Giải pháp: Sử dụng DTO
DTO là một class Java đơn giản chỉ chứa các trường cần thiết để truyền tải dữ liệu qua mạng.
```java
public class UserResponseDTO {
    private Long id;
    private String fullName;
    private String email;
    // Không bao gồm mật khẩu hay các trường hệ thống khác
}
```

---

## 4. Kiểm soát HTTP Response với `ResponseEntity`

Để viết một REST API chuyên nghiệp, bạn không chỉ trả về dữ liệu thuần mà phải kiểm soát được mã trạng thái HTTP (HTTP Status Code) và Header.

### Ví dụ xây dựng API CRUD chuẩn chỉ:
```java
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;
import java.net.URI;

@RestController
@RequestMapping("/api/v1/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    // 1. Tạo mới tài nguyên - Trả về 201 Created kèm URI của tài nguyên mới
    @PostMapping
    public ResponseEntity<ProductResponseDTO> createProduct(@RequestBody ProductRequestDTO request) {
        ProductResponseDTO response = productService.create(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.getId())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    // 2. Lấy tài nguyên - Trả về 200 OK
    @GetMapping("/{id}")
    public ResponseEntity<ProductResponseDTO> getProduct(@PathVariable Long id) {
        ProductResponseDTO response = productService.getById(id);
        return ResponseEntity.ok(response);
    }

    // 3. Xóa tài nguyên - Trả về 204 No Content
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProduct(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
```

### Giải mã các mã trạng thái HTTP tốt nhất cho REST:
- **`200 OK`**: Truy vấn hoặc cập nhật dữ liệu thành công.
- **`201 Created`**: Tạo mới tài nguyên thành công. Nên trả về header `Location` chỉ tới tài nguyên mới.
- **`204 No Content`**: Thực hiện thành công nhưng không cần trả lại dữ liệu (ví dụ: lệnh xóa).
- **`400 Bad Request`**: Dữ liệu gửi lên không đúng định dạng hoặc vi phạm kiểm thực.
- **`401 Unauthorized`**: Người dùng chưa xác thực thông tin.
- **`403 Forbidden`**: Người dùng đã xác thực nhưng không có quyền hạn truy cập tài nguyên.
- **`404 Not Found`**: Không tìm thấy tài nguyên được yêu cầu.
