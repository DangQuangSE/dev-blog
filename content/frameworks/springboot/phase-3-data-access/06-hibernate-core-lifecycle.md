# [06] Phase 3 - Data Access: Hibernate Core: Transactions, Relationships & Entity Lifecycle

## 1. Nguồn gốc và lý do phân mảnh vòng đời thực thể trong ORM (Hibernate)

### a) Tại sao Hibernate chia nhỏ vòng đời của thực thể (Entity Lifecycle)?
Trong lập trình Java thuần túy, một đối tượng được tạo bằng `new` và tự giải phóng khỏi bộ nhớ RAM bởi Garbage Collector khi không còn tham chiếu. Tuy nhiên, trong cơ sở dữ liệu quan hệ (RDBMS), dữ liệu tồn tại vĩnh viễn dưới dạng các dòng (rows) trong bảng.
- Để làm cầu nối giữa hai thế giới này, Hibernate giới thiệu **Persistence Context (Lớp quản lý ngữ cảnh)**. Nó hoạt động như một bộ đệm (L1 Cache) theo dõi mọi thay đổi của thực thể Java và đồng bộ chúng xuống database.
- Việc chia nhỏ vòng đời thực thể (Transient, Managed, Detached, Removed) giúp Hibernate biết được đối tượng nào cần chèn (`INSERT`), đối tượng nào cần cập nhật (`UPDATE`), và đối tượng nào cần xóa (`DELETE`) một cách tự động và tối ưu nhất.

### b) Sự lỗi thời của quản lý Transaction thủ công
Trước đây, để thực hiện transaction, ta phải viết:
```java
try {
    session.beginTransaction();
    // execute SQL
    session.getTransaction().commit();
} catch (Exception e) {
    session.getTransaction().rollback();
}
```
Mã nguồn này lặp đi lặp lại và dễ gây rò rỉ kết nối nếu quên rollback hoặc close session. Spring giới thiệu `@Transactional` (AOP bọc ngoài) để tự động hóa hoàn toàn việc này ở mức khai báo.

---

## 2. Bản chất các trạng thái Vòng đời thực thể (Entity Lifecycle States)

Hibernate quản lý 4 trạng thái của thực thể:

```
[ new User() ] ────► (Transient)
                          │
                          ▼ (persist / save / @Transactional)
                     (Managed / Persistent) ◄───┐
                          │                     │
      (close / evict)     ▼                     │ (merge)
                     (Detached) ────────────────┘
                          │
                          ▼ (remove / delete)
                     (Removed)
```

1. **Transient (Tạm thời)**:
   - Thực thể vừa được tạo bằng `new`, chưa có định danh ID (`@Id`) và chưa liên kết với bất kỳ Session hay Persistence Context nào. Không có dòng dữ liệu nào trong database.
2. **Managed / Persistent (Được quản lý)**:
   - Thực thể có ID và đang được quản lý bởi Persistence Context của Session hiện tại.
   - **Tính năng Dirty Checking**: Mọi thay đổi trên thuộc tính của đối tượng Managed sẽ tự động được Hibernate phát hiện và ghi xuống Database (qua câu lệnh `UPDATE`) khi kết thúc transaction mà không cần gọi hàm `save()`.
3. **Detached (Bị tách rời)**:
   - Thực thể có ID tương ứng trong database nhưng Session quản lý nó đã bị đóng (close) hoặc giải phóng (`evict`/`clear`). Mọi thay đổi trên đối tượng này sẽ không được đồng bộ xuống database nữa.
4. **Removed (Đã xóa)**:
   - Thực thể được đánh dấu để xóa khỏi database (thông qua phương thức `remove()`). Câu lệnh `DELETE` sẽ được thực thi khi commit transaction.

---

## 3. Quản lý Mối quan hệ và Cascade Types

### Cascade Types (Lan truyền hành vi)
Khi bạn thực hiện thao tác (như lưu hoặc xóa) trên thực thể cha, bạn muốn hành vi đó tự động lan truyền xuống các thực thể con liên quan:
- **`PERSIST`**: Lưu cha sẽ tự động lưu con.
- **`REMOVE`**: Xóa cha sẽ tự động xóa sạch các con liên quan (chống lỗi mồ côi).
- **`ALL`**: Áp dụng tất cả các hành vi lan truyền.

### Fetch Types (Cách nạp dữ liệu)
- **`LAZY` (Khuyên dùng)**: Chỉ tải dữ liệu liên quan khi được gọi đến (gọi getter). Tránh quá tải RAM.
- **`EAGER`**: Tải toàn bộ dữ liệu liên quan ngay lập tức bằng phép JOIN. Có thể gây quá tải hiệu năng nếu không kiểm soát.

---

## 4. Rủi ro khi lập trình Hibernate sai cách

1. **`LazyInitializationException`**: Xảy ra khi bạn truy cập một thuộc tính được cấu hình `LAZY` trên một thực thể đang ở trạng thái **Detached** (ngoài phạm vi Transaction).
2. **Cập nhật dữ liệu ngoài ý muốn (Dirty Checking Side-effect)**: Thay đổi thuộc tính của một thực thể Managed để tính toán tạm thời mà không muốn lưu vào DB. Khi kết thúc transaction, Hibernate vẫn tự động chạy câu lệnh `UPDATE` ghi đè dữ liệu rác đó xuống database.
   - *Khắc phục*: Tách thực thể thành trạng thái Detached (`entityManager.detach(entity)`) hoặc map sang DTO trước khi xử lý.

---

## 5. Code ví dụ minh họa chi tiết

```java
import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "authors")
class Author {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String name;

    // 1. Cấu hình mối quan hệ 1-N, tải lười (LAZY), lan truyền xóa (REMOVE)
    @OneToMany(mappedBy = "author", cascade = CascadeType.ALL, fetch = FetchType.LAZY, orphanRemoval = true)
    private List<Book> books = new ArrayList<>();

    // Constructor, Getters, Setters
    public Author() {}
    public Author(String name) { this.name = name; }

    public void addBook(Book book) {
        books.add(book);
        book.setAuthor(this);
    }
}

@Entity
@Table(name = "books")
class Book {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private Author author;

    public Book() {}
    public Book(String title) { this.title = title; }
    public void setAuthor(Author author) { this.author = author; }
}
```

### Minh họa code chạy xử lý Vòng đời Entity trong Service
```java
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

@Service
public class LibraryService {

    @PersistenceContext
    private EntityManager entityManager;

    @Transactional
    public void demonstrateLifecycle() {
        // 1. Trạng thái Transient
        Author author = new Author("Nguyen Nhat Anh");
        Book book = new Book("Mat Biec");
        author.addBook(book);

        // 2. Chuyển sang Managed
        entityManager.persist(author); // Lưu cả author và book nhờ CascadeType.ALL

        // 3. Minh họa Dirty Checking: Thay đổi thuộc tính tự động UPDATE xuống DB
        author.setName("Nguyen Nhat Anh (Updated)"); 
        // Không cần gọi save() hay update(), Hibernate tự phát hiện khi commit.
    }
}
```
