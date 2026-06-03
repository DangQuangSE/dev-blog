# [05] Phase 3 - Data Access: Spring Data JPA & Hibernate Core

## 1. Nguồn gốc của sự phát triển từ JDBC sang ORM (Hibernate)

### Cách làm cũ: JDBC (Java Database Connectivity) truyền thống
Trong những ngày đầu, để truy xuất cơ sở dữ liệu từ ứng dụng Java, chúng ta sử dụng JDBC thuần túy.
- Nhà phát triển phải mở kết nối (`Connection`), chuẩn bị câu lệnh SQL dưới dạng chuỗi (`PreparedStatement`), thực thi, duyệt qua tập kết quả (`ResultSet`) để ánh xạ (map) từng cột thành thuộc tính đối tượng Java bằng cách thủ công (`user.setName(rs.getString("name"))`).
- **Hạn chế**: Code cực kỳ dài dòng, lặp đi lặp lại. Việc chuyển đổi kiểu dữ liệu thủ công rất dễ gặp lỗi. Nếu đổi tên cột trong Database, bạn phải sửa hàng loạt chuỗi SQL rải rác khắp ứng dụng.

### Sự xuất hiện của ORM (Object-Relational Mapping) và Hibernate
Để xóa bỏ khoảng cách giữa lập trình hướng đối tượng (Java) và mô hình quan hệ (SQL Database), khái niệm **ORM** ra đời.
- **Hibernate** (phát hành năm 2001) là thư viện ORM phổ biến nhất trong Java. Nó tự động sinh câu lệnh SQL và ánh xạ trực tiếp các bảng trong database thành các lớp Java (`Entity`).
- **JPA (Jakarta Persistence API)** là bộ tiêu chuẩn (Specification) đặc tả cách triển khai ORM trong Java. Hibernate chính là một bộ triển khai (Provider) phổ biến nhất của đặc tả JPA này.

---

## 2. Spring Data JPA là gì?

Spring Data JPA không phải là một ORM framework độc lập, nó là một **lớp trừu tượng (Abstraction Layer)** nằm trên JPA/Hibernate.
- Thay vì phải tự viết các class DAO (Data Access Object), tự gọi `EntityManager` để quản lý giao dịch và query, Spring Data JPA cho phép bạn chỉ cần định nghĩa một `Interface` kế thừa từ `JpaRepository`.
- Spring sẽ tự động sinh mã thực thi (Proxy) cho các phương thức truy vấn dựa trên tên phương thức (Query Creation from Method Names).

### Ví dụ Repository tối giản:
```java
public interface UserRepository extends JpaRepository<UserEntity, Long> {
    // Spring tự sinh câu SQL: SELECT * FROM users WHERE email = ?
    Optional<UserEntity> findByEmail(String email);

    // Spring tự sinh câu SQL: SELECT * FROM users WHERE status = ? AND age >= ?
    List<UserEntity> findByStatusAndAgeGreaterThanEqual(String status, int age);
}
```

---

## 3. Quản lý Giao dịch với `@Transactional`

Trong cơ sở dữ liệu quan hệ, **Transaction** đảm bảo tính toàn vẹn dữ liệu (ACID). `@Transactional` của Spring giúp quản lý giao dịch một cách khai báo (Declarative Transaction Management).

- Khi một phương thức được đánh dấu `@Transactional`, Spring sẽ mở một transaction trước khi phương thức chạy. 
- Nếu phương thức kết thúc thành công, Spring sẽ thực hiện lệnh `commit`.
- Nếu có bất kỳ ngoại lệ Runtime nào xảy ra (`RuntimeException`), Spring sẽ tự động gọi lệnh `rollback`.

```java
@Service
public class OrderService {

    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;

    @Transactional
    public void placeOrder(Long productId, int quantity, Long userId) {
        // 1. Trừ kho
        Product product = productRepository.findById(productId)
            .orElseThrow(() -> new ResourceNotFoundException("Sản phẩm không tồn tại"));
        product.setStock(product.getStock() - quantity);
        productRepository.save(product); // Tự động đồng bộ

        // Nếu sản phẩm không đủ hàng, ném lỗi -> Tự động Rollback toàn bộ
        if (product.getStock() < 0) {
            throw new InsufficientStockException("Sản phẩm đã hết hàng trong kho");
        }

        // 2. Tạo đơn hàng
        Order order = new Order(userId, productId, quantity);
        orderRepository.save(order);
    }
}
```

---

## 4. Vấn nạn nghiêm trọng: N+1 Query Problem

### N+1 Query là gì?
Đây là vấn đề nghiêm trọng nhất liên quan đến hiệu năng ứng dụng khi sử dụng ORM. Nó xảy ra khi bạn tải một thực thể chính có mối quan hệ một-nhiều (`@OneToMany`) hoặc nhiều-một (`@ManyToOne`) với thực thể khác, và ORM thực thi thêm N câu truy vấn phụ để lấy dữ liệu liên quan.

**Ví dụ:** Bạn có Entity `Author` có nhiều `Book`. Bạn muốn lấy danh sách 10 tác giả và in ra tên các cuốn sách của họ.
1. Câu truy vấn thứ **1** (Lấy danh sách Author): 
   ```sql
   SELECT * FROM author; -- Trả về 10 tác giả
   ```
2. Với mỗi tác giả trong 10 tác giả đó, Hibernate lại chạy thêm 1 câu truy vấn để lấy sách của tác giả đó (tổng cộng **N** câu truy vấn tiếp theo):
   ```sql
   SELECT * FROM book WHERE author_id = 1;
   SELECT * FROM book WHERE author_id = 2;
   ...
   SELECT * FROM book WHERE author_id = 10;
   ```
Tổng số câu truy vấn là **10 + 1 = 11** câu truy vấn. Nếu có 1000 tác giả, hệ thống sẽ thực thi 1001 câu truy vấn tới Database, làm quá tải kết nối và làm chậm ứng dụng nghiêm trọng.

### Cách giải quyết N+1 Query hiệu quả

#### Giải pháp 1: Sử dụng `JOIN FETCH` trong JPQL
Sử dụng từ khóa `FETCH` để buộc Hibernate thực hiện phép JOIN và lấy toàn bộ dữ liệu liên quan trong một câu truy vấn duy nhất.
```java
public interface AuthorRepository extends JpaRepository<Author, Long> {
    
    @Query("SELECT a FROM Author a LEFT JOIN FETCH a.books")
    List<Author> findAllWithBooks();
}
```
*Kết quả câu SQL được sinh ra:*
```sql
SELECT a.*, b.* FROM author a LEFT OUTER JOIN book b ON a.id = b.author_id;
```
*(Chỉ 1 câu truy vấn duy nhất được gửi tới Database!)*

#### Giải pháp 2: Sử dụng `@EntityGraph` của JPA
Là một cơ chế khai báo (declarative) để nạp các thuộc tính mong muốn một cách háo hức (Eagerly).
```java
public interface AuthorRepository extends JpaRepository<Author, Long> {

    @EntityGraph(attributePaths = {"books"})
    List<Author> findAll();
}
```

---

## 5. Rủi ro khi sử dụng Hibernate không đúng cách

1. **`LazyInitializationException`**: Xảy ra khi bạn cố gắng truy cập dữ liệu quan hệ (được đánh dấu `FetchType.LAZY`) sau khi Session của Hibernate đã bị đóng (thường là ngoài phạm vi của `@Transactional` như ở tầng Controller hoặc DTO Mapping).
2. **Quá tải bộ nhớ (Persistence Context Bloat)**: Khi truy vấn hàng triệu bản ghi và lưu trữ chúng trong Persistence Context (L1 Cache) của Hibernate mà không dọn dẹp hoặc dùng phân trang (`Pageable`), ứng dụng sẽ hết bộ nhớ (OOM).
