# [06] Phase 3 - Data Access: Kết nối Database NoSQL với Spring Data MongoDB

## 1. Nguồn gốc của sự phát triển từ SQL sang NoSQL Document Database

### Giới hạn của Cơ sở dữ liệu quan hệ (SQL/RDBMS)
Cơ sở dữ liệu quan hệ (MySQL, PostgreSQL, Oracle) rất tuyệt vời cho các dữ liệu có cấu trúc chặt chẽ và đòi hỏi tính toàn vẹn cao. Tuy nhiên, chúng gặp khó khăn trong các trường hợp:
- **Thay đổi Schema thường xuyên**: Việc thêm/bớt cột trên các bảng chứa hàng triệu dòng yêu cầu câu lệnh `ALTER TABLE` gây khóa bảng (table locking) và có thể làm gián đoạn hệ thống.
- **Dữ liệu phi cấu trúc hoặc bán cấu trúc**: Các dữ liệu như log hệ thống, lịch sử giỏ hàng, thông tin thuộc tính sản phẩm biến động (e-commerce catalog) rất khó để biểu diễn bằng các bảng phẳng cố định.
- **Khả năng mở rộng ngang (Horizontal Scaling)**: RDBMS được thiết kế tối ưu để scale dọc (tăng CPU, RAM). Việc scale ngang (sharding) sang nhiều node rất phức tạp và ảnh hưởng tới các truy vấn JOIN.

### Sự xuất hiện của MongoDB (Document Database)
MongoDB lưu trữ dữ liệu dưới dạng các tài liệu JSON nhị phân (**BSON - Binary JSON**).
- Mỗi tài liệu (Document) là một cấu trúc dữ liệu tự mô tả, có thể chứa các mảng hoặc tài liệu lồng nhau (Embedded Documents).
- Schema của MongoDB là linh hoạt (Dynamic Schema), các document trong cùng một bộ sưu tập (Collection) không cần có chung tập hợp các trường.

---

## 2. Spring Data MongoDB: Khái niệm cốt lõi

Spring Data cung cấp một lớp trừu tượng nhất quán cho MongoDB tương tự như JPA:
- `@Document`: Đánh dấu class là một document tương đương với một bảng trong SQL.
- `@Id`: Đánh dấu thuộc tính định danh chính (mặc định MongoDB tự sinh ra một ObjectId kiểu String).
- `MongoRepository`: Cung cấp các thao tác CRUD và Query Method cơ bản.
- `MongoTemplate`: Cung cấp khả năng truy vấn phức tạp hoặc thao tác nâng cao (như Aggregation, bulk operations) mà Query Method không thể đáp ứng.

---

## 3. Thực hành thiết kế Document với Spring Data MongoDB

### Định nghĩa Model lớp học & học sinh (Embedded vs Reference):
Trong NoSQL, việc mô hình hóa dữ liệu rất khác biệt. Bạn phải chọn giữa việc **Nhúng trực tiếp (Embedding)** hay **Tham chiếu (Referencing - `$dbRef`)**.

```java
import org.springframework.data.annotation.Id;
import org.springframework.data.mongodb.core.index.Indexed;
import org.springframework.data.mongodb.core.mapping.Document;

import java.util.List;

@Document(collection = "users")
public class UserDocument {

    @Id
    private String id;

    @Indexed(unique = true)
    private String email;

    private String fullName;

    // Nhúng trực tiếp (Embedded Document) - Tốt cho các mối quan hệ 1-N giới hạn, 
    // truy cập dữ liệu cùng lúc, không chia sẻ với document khác.
    private List<Address> addresses;

    // Getters, Setters, Constructors
}

class Address {
    private String street;
    private String city;
    private String zipCode;
    // Getters, Setters
}
```

### Sử dụng `MongoRepository`:
```java
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.List;

public interface UserRepository extends MongoRepository<UserDocument, String> {
    
    // Tìm kiếm bằng Query Method
    UserDocument findByEmail(String email);

    // Tìm kiếm các user sống ở một thành phố cụ thể (truy cập trường lồng nhau)
    List<UserDocument> findByAddressesCity(String city);
}
```

### Sử dụng `MongoTemplate` cho các câu query phức tạp:
Khi cần thực hiện các phép cập nhật một phần (Partial Update) hoặc truy vấn nâng cao, `MongoTemplate` là lựa chọn tốt nhất.
```java
@Service
public class UserService {

    private final MongoTemplate mongoTemplate;

    public UserService(MongoTemplate mongoTemplate) {
        this.mongoTemplate = mongoTemplate;
    }

    public void updateAddressZipCode(String email, String street, String newZipCode) {
        Query query = new Query(Criteria.where("email").is(email)
                .and("addresses.street").is(street));
        
        Update update = new Update().set("addresses.$.zipCode", newZipCode);
        
        // Chỉ cập nhật đúng địa chỉ khớp trong mảng, không cần load toàn bộ User về RAM
        mongoTemplate.updateFirst(query, update, UserDocument.class);
    }
}
```

---

## 4. Rủi ro khi lựa chọn NoSQL/MongoDB sai cách

1. **Thiếu hỗ trợ ACID Transaction hoàn hảo**: Mặc dù MongoDB đã hỗ trợ Multi-Document Transactions từ phiên bản 4.0, hiệu năng của nó vẫn bị ảnh hưởng nặng nề nếu sử dụng các transaction phức tạp liên tục.
2. **Dữ liệu bị trùng lặp và không đồng nhất (Data Inconsistency)**: Triết lý của NoSQL là "Trùng lặp dữ liệu để tối ưu tốc độ đọc". Nếu bạn nhúng trực tiếp thông tin sản phẩm vào giỏ hàng, khi sản phẩm đổi tên, bạn phải chạy tác vụ cập nhật diện rộng (background job) để đồng bộ hóa, dẫn đến nguy cơ dữ liệu lệch nhau giữa các bộ sưu tập.
3. **Phình to kích thước Document (Document Limit)**: MongoDB giới hạn kích thước tối đa của một document là **16MB**. Nếu bạn thiết kế mối quan hệ One-to-Many bằng cách nhúng (ví dụ: Một bài viết chứa hàng triệu bình luận lồng nhau), document của bạn sẽ nhanh chóng vượt giới hạn 16MB và ứng dụng sẽ crash.
