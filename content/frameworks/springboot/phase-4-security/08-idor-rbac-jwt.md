# [08] Phase 4 - Security: Bảo mật nâng cao: IDOR, RBAC & JWT

Bảo mật là một trong những phần quan trọng nhất nhưng cũng dễ bị bỏ qua trong quá trình phát triển ứng dụng. Bài viết này sẽ tập trung vào hai khái niệm bảo mật quan trọng: lỗ hổng IDOR và cơ chế phân quyền RBAC.

---

## 1. IDOR (Insecure Direct Object Reference)

### IDOR là gì?
IDOR xảy ra khi ứng dụng cho phép người dùng truy cập trực tiếp vào các đối tượng dữ liệu dựa trên đầu vào từ phía người dùng (thường là ID trong URL) mà không kiểm tra quyền sở hữu hoặc quyền truy cập.

**Ví dụ độc hại:**
Giả sử bạn có URL để xem hồ sơ cá nhân: `https://example.com/api/users/1001/profile`.
Một kẻ tấn công có thể thay đổi ID thành `1002`, `1003`... và nếu hệ thống không kiểm tra, họ có thể xem thông tin nhạy cảm của người dùng khác.

### Cách phòng chống IDOR hiệu quả
1.  **Sử dụng UUID thay vì ID tự tăng**: Các ID dạng số (`1, 2, 3...`) rất dễ bị đoán. Hãy sử dụng UUID (`550e8400-e29b-41d4-a716-446655440000`) để làm cho reference trở nên không thể đoán trước.
2.  **Kiểm tra quyền sở hữu ở tầng Service**: Luôn thực hiện logic kiểm tra xem dữ liệu đang được yêu cầu có thuộc về người dùng hiện tại hay không.
    ```java
    // Không nên:
    repository.findById(id);

    // Nên:
    repository.findByIdAndOwnerId(id, currentUser.getId());
    ```
3.  **Sử dụng @PreAuthorize trong Spring Security**: Kiểm tra quyền truy cập ở mức phương thức.
    ```java
    @PreAuthorize("#id == authentication.principal.id")
    public UserProfile getProfile(Long id) { ... }
    ```

---

## 2. Quản lý quyền với RBAC và ABAC

### RBAC (Role-Based Access Control)
RBAC là phương pháp phân quyền dựa trên **Vai trò** (Role) của người dùng trong hệ thống (ví dụ: `ADMIN`, `USER`, `MANAGER`).

- **Đặc điểm**: Đơn giản, dễ quản lý, phù hợp với các hệ thống có cấu trúc quyền cố định.
- **Triển khai trong Spring Security**:
    ```java
    @PreAuthorize("hasRole('ADMIN')")
    public void deleteUser(Long id) { ... }
    ```

### ABAC (Attribute-Based Access Control)
ABAC là phương pháp phân quyền nâng cao dựa trên các **Thuộc tính** (Attributes) như: người dùng là ai, họ đang truy cập tài nguyên nào, ở đâu, vào thời gian nào.

- **Đặc điểm**: Rất chi tiết (Fine-grained), linh hoạt nhưng phức tạp hơn.
- **Ví dụ**: "Chỉ bác sĩ ở khoa A mới được xem hồ sơ bệnh nhân ở khoa A trong giờ hành chính."

### RBAC vs. ABAC: Khi nào nên dùng?
| Đặc điểm | RBAC | ABAC |
| :--- | :--- | :--- |
| **Logic quyết định** | Dựa trên Role cố định. | Dựa trên thuộc tính động. |
| **Độ chi tiết** | Thấp (Coarse-grained). | Cao (Fine-grained). |
| **Độ phức tạp** | Thấp, dễ audit. | Cao, cần thiết kế kỹ lưỡng. |

**Lời khuyên**: Đa số các ứng dụng bắt đầu với RBAC cho các quyền cơ bản và kết hợp thêm logic ABAC (ví dụ: kiểm tra quyền sở hữu tài nguyên) khi cần xử lý các trường hợp phức tạp.

---

## 3. Thực hành tốt nhất trong Spring Security

1.  **Nguyên tắc đặc quyền tối thiểu (Least Privilege)**: Chỉ cấp đúng những quyền cần thiết cho người dùng để thực hiện công việc của họ.
2.  **Sử dụng Method Security**: Thay vì cấu hình tập trung trong `SecurityFilterChain`, hãy sử dụng các annotation như `@PreAuthorize`, `@PostAuthorize` để kiểm soát quyền ngay tại nơi thực thi logic.
3.  **Mã hóa mật khẩu**: Luôn sử dụng các thuật toán mạnh như `BCryptPasswordEncoder` để lưu trữ mật khẩu.

Việc hiểu và áp dụng đúng các nguyên lý bảo mật này sẽ giúp ứng dụng của bạn an toàn hơn trước các cuộc tấn công phổ biến.
