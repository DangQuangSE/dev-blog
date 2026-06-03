# [14] Phase 7 - Ecosystem: Công cụ Build (Maven, Gradle, Bazel) & Web Frameworks

## 1. Nguồn gốc và lý do ra đời của các Công cụ Build tự động

### Cách quản lý thư viện kiểu cũ đầy thảm họa
Trong thời kỳ đầu của Java, khi cần sử dụng một thư viện bên thứ ba (như log4j hay Jackson), lập trình viên phải thực hiện thủ công:
- Lên mạng tìm và tải tệp `.jar` tương ứng.
- Tạo thư mục `lib/` trong dự án, copy tệp vào.
- Cấu hình classpath thủ công trong IDE hoặc lệnh javac/java.
- **Hạn chế**: Khi thư viện A cần thư viện B (transitive dependency), lập trình viên phải tự mò mẫm tải tiếp thư viện B. Quá trình này vô cùng tốn thời gian, dễ sai sót phiên bản, làm nặng git repository và dẫn đến lỗi không tìm thấy class lúc chạy (`NoClassDefFoundError`).

### Giải pháp: Công cụ Build tự động (Maven, Gradle, Bazel)
Các công cụ build tự động ra đời giúp chuẩn hóa vòng đời phát triển phần mềm (Build Lifecycle) và tự động hóa việc quản lý thư viện từ các kho chứa trung tâm (như Maven Central):
- **Maven**: Quản lý qua cấu trúc khai báo XML (`pom.xml`), thiết lập các vòng đời build nghiêm ngặt (Lifecycle).
- **Gradle**: Sử dụng ngôn ngữ lập trình Groovy hoặc Kotlin DSL, cho phép viết các script build linh hoạt, cơ chế cache tác vụ (task caching) giúp tốc độ build nhanh hơn Maven từ 2 đến 10 lần.
- **Bazel**: Công cụ build của Google, tối ưu cho các dự án Monorepo khổng lồ nhờ cơ chế biên dịch song song cực mạnh và cache phân tán.

---

## 2. So sánh và Đối chiếu các Web Frameworks trong Hệ sinh thái Java

Hệ sinh thái web Java vô cùng phong phú, phục vụ các bài toán kiến trúc khác nhau:

| Framework | Triết lý thiết kế | Điểm mạnh cốt lõi | Trường hợp sử dụng lý tưởng |
| :--- | :--- | :--- | :--- |
| **Spring Boot** | Khai báo cấu hình tự động (Convention over Configuration) | Hệ sinh thái khổng lồ, cộng đồng lớn, phát triển cực nhanh | Ứng dụng doanh nghiệp lớn, Microservices chuẩn |
| **Quarkus** | Biên dịch tĩnh trước (Pre-compilation), tối ưu Cloud Native | Khởi động mili-giây, tốn cực ít RAM nhờ GraalVM Native | Kubernetes, Serverless, Containerized Apps |
| **Javalin** | Siêu nhẹ (Lightweight), không dùng ma thuật Reflection | Tốc độ cực nhanh, đơn giản, dễ học, cấu hình tường minh | Web APIs đơn giản, Micro-services tối giản |
| **Play Framework** | Lập trình phản ứng (Reactive), bất đồng bộ hoàn toàn | Xử lý song song cực tốt nhờ Akka/Pekko toolkit | Ứng dụng thời gian thực, stream dữ liệu lớn |

---

## 3. Rủi ro khi quản lý Dependency và chọn sai Framework

1. **Xung đột phiên bản (Dependency Hell)**: Dự án import thư viện X (cần thư viện Z bản 1.0) và đồng thời import thư viện Y (cần thư viện Z bản 2.0). Maven/Gradle sẽ tự chọn một phiên bản, dẫn đến lỗi runtime `NoSuchMethodError` khi code gọi một phương thức chỉ có ở phiên bản bị loại bỏ.
   - *Khắc phục*: Sử dụng dependency exclusion hoặc quản lý phiên bản tập trung qua thẻ `<dependencyManagement>` (Maven) hoặc BOM (Bill of Materials).
2. **Khởi động chậm trong Docker (Cold Start)**: Spring Boot sử dụng cơ chế Reflection rất nhiều lúc khởi động để quét Beans. Khi chạy trên Serverless hoặc Kubernetes cần scale-up tức thời, thời gian khởi động 10-20 giây của Spring Boot sẽ làm nghẽn yêu cầu.
   - *Khắc phục*: Chuyển sang Quarkus hoặc biên dịch Spring Boot sang mã máy gốc (Spring Native) bằng GraalVM.

---

## 4. Code ví dụ minh họa cấu trúc cấu hình

### a) File `pom.xml` của Maven (Cấu trúc khai báo quản lý Dependency)
```xml
<project xmlns="http://maven.apache.org/POM/4.0.0" 
         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">
    <modelVersion>4.0.0</modelVersion>
    <groupId>com.devblog</groupId>
    <artifactId>demo-app</artifactId>
    <version>1.0.0</version>

    <dependencies>
        <!-- Thư viện JSON parser -->
        <dependency>
            <groupId>com.fasterxml.jackson.core</groupId>
            <artifactId>jackson-databind</artifactId>
            <version>2.15.2</version>
        </dependency>
    </dependencies>
</project>
```

### b) Code ứng dụng Web API siêu tối giản với Javalin (Không Reflection, khởi động trong 100ms)
```java
// Cần import dependency: io.javalin:javalin:5.6.0
import io.javalin.Javalin;

public class JavalinApp {
    public static void main(String[] args) {
        // Khởi tạo ứng dụng Javalin chạy trên cổng 8080
        Javalin app = Javalin.create()
            .start(8080);

        // Định nghĩa Router trực quan, tường minh bằng lambda
        app.get("/api/hello", ctx -> ctx.result("Hello from Javalin!"));
        
        app.get("/api/user/{id}", ctx -> {
            String userId = ctx.pathParam("id");
            ctx.json(new UserResponse(userId, "Active"));
        });
    }

    // Record class làm DTO chuyển sang JSON tự động
    record UserResponse(String userId, String status) {}
}
```
