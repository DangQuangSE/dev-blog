# [01] Phase 1 - Foundations: Spring Framework & Spring Boot là gì?

## 1. Nguồn gốc của sự phát triển từ J2EE đến Spring

### Sự phức tạp của J2EE (Java 2 Enterprise Edition) cổ điển
Vào cuối những năm 1990 và đầu 2000, J2EE là nền tảng thống trị để viết ứng dụng Java doanh nghiệp. Cốt lõi của nó là **Enterprise JavaBeans (EJB)**. EJB hứa hẹn giải quyết các vấn đề như quản lý transaction, bảo mật phân tán. Tuy nhiên, nó mang lại một ác mộng cho lập trình viên:
- Một EJB đơn giản yêu cầu viết nhiều interface phức tạp (Home interface, Local interface) và các tệp cấu hình XML khổng lồ.
- Rất khó unit test vì code phụ thuộc chặt chẽ vào Container (như WebSphere, WebLogic). Phải deploy lên server mất vài phút mới test được một thay đổi nhỏ.
- Hiệu năng chậm chạp do cơ chế RMI (Remote Method Invocation) mặc định.

### Sự ra đời của Spring Framework (2003)
Rod Johnson đã viết cuốn sách *"Expert One-on-One J2EE Design and Development"* giới thiệu một cách tiếp cận thay thế nhẹ nhàng hơn dựa trên các POJO (Plain Old Java Objects) thông thường. Đó chính là nền tảng của **Spring Framework**.
- Spring giới thiệu cơ chế **Dependency Injection (DI)** giúp giảm thiểu sự phụ thuộc chặt chẽ giữa các thành phần.
- Nó cho phép lập trình viên viết code Java thuần túy và để Spring quản lý các khía cạnh khác (Transactions, Security) qua **AOP (Aspect-Oriented Programming)**.

### Vấn đề mới: Cấu hình địa ngục (Configuration Hell)
Dù Spring rất tuyệt vời, nhưng theo thời gian khi hệ sinh thái lớn lên, lập trình viên bắt đầu cảm thấy mệt mỏi với việc cấu hình. Để khởi tạo một web project kết nối Database, người ta phải cấu hình hàng loạt XML bean hoặc hàng chục class cấu hình `@Configuration`, cấu hình `DispatcherServlet`, cấu hình Hibernate SessionFactory, v.v.

→ **Spring Boot ra đời vào năm 2014** để loại bỏ hoàn toàn rào cản cấu hình phức tạp này.

---

## 2. Các tính năng cốt lõi của Spring Boot

Spring Boot hoạt động dựa trên 3 trụ cột chính:

### a) Spring Boot Starters (Bộ khởi tạo)
Starters là các tập hợp dependency được gom nhóm sẵn, giúp bạn dễ dàng import các tính năng cần thiết vào project. Thay vì tự khai báo thủ công hàng chục thư viện và tự căn chỉnh phiên bản của chúng, bạn chỉ cần khai báo một Starter duy nhất.
Ví dụ: Để xây dựng REST API, bạn chỉ cần import:
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-web</artifactId>
</dependency>
```
Nó sẽ tự động mang về: Tomcat, Spring MVC, Jackson (để parse JSON), Hibernate Validator, Logback... với các phiên bản tương thích hoàn hảo.

### b) Auto-Configuration (Cấu hình tự động)
Spring Boot liên tục quét Classpath của ứng dụng. Nếu nó phát hiện một thư viện nào đó xuất hiện, nó sẽ tự động cấu hình các Bean mặc định cho thư viện đó.
- Ví dụ: Nếu `h2` hoặc `mysql-connector-java` có trong classpath và bạn chưa cấu hình Database, Spring Boot sẽ tự động tạo một Bean `DataSource` kết nối tới In-memory database hoặc đọc cấu hình từ file `application.properties`.
- Cơ chế này hoạt động nhờ các annotation điều kiện như `@ConditionalOnClass`, `@ConditionalOnMissingBean`.

### c) Embedded Web Server (Máy chủ nhúng)
Trước đây, bạn cần đóng gói ứng dụng thành file `.war`, tải Tomcat về máy chủ, cấu hình server rồi deploy file `.war` vào thư mục `webapps`.
Với Spring Boot:
- Server Tomcat được nhúng thẳng vào trong file `.jar` đầu ra.
- Ứng dụng khởi chạy trực tiếp bằng hàm `main` tiêu chuẩn:
```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```
Việc này làm đơn giản hóa hoàn toàn quy trình đóng gói và triển khai (chỉ cần chạy lệnh `java -jar app.jar`).

---

## 3. So sánh cấu hình cũ và mới

Hãy xem sự khác biệt khi cấu hình một Web MVC đơn giản:

### Cách làm cũ (Spring MVC thuần túy):
Phải tạo file `web.xml` để cấu hình DispatcherServlet:
```xml
<servlet>
    <servlet-name>dispatcher</servlet-name>
    <servlet-class>org.springframework.web.servlet.DispatcherServlet</servlet-class>
    <load-on-startup>1</load-on-startup>
</servlet>
<servlet-mapping>
    <servlet-name>dispatcher</servlet-name>
    <url-pattern>/</url-pattern>
</servlet-mapping>
```
Và tạo file `spring-mvc-servlet.xml` để cấu hình ViewResolver, ComponentScan...

### Cách làm mới với Spring Boot:
Không cần bất kỳ dòng XML nào. Chỉ cần cài đặt dependency `spring-boot-starter-web` và viết một Class có annotation `@SpringBootApplication`. Spring Boot tự cấu hình `DispatcherServlet` ngầm định ánh xạ vào đường dẫn `/`.

---

## 4. Rủi ro khi không hiểu bản chất của Spring Boot

Mặc dù cấu hình tự động rất tiện lợi, nhưng nếu lập trình viên không hiểu rõ bản chất (Magic under the hood), họ có thể gặp các rủi ro sau:
1. **Lỗi xung đột Bean**: Khi tự khai báo một Bean trùng tên hoặc trùng loại với Bean tự động cấu hình mà không dùng `@Primary` hoặc `@Qualifier`, ứng dụng sẽ crash khi khởi động.
2. **Khó debug lỗi cấu hình**: Nếu thiếu một dependency cần thiết làm class biến mất khỏi classpath, một tính năng tự động cấu hình sẽ âm thầm không kích hoạt, dẫn đến lỗi NullPointerException lúc chạy ứng dụng mà không rõ lý do.
3. **Phình to kích thước ứng dụng (Heavy Jar)**: Import các Starter quá đà mà không loại bỏ các dependency không dùng đến sẽ làm file `.jar` nặng lên và ứng dụng tốn nhiều RAM vô ích khi khởi động.
