# [00] Lộ trình học: Tổng Quan về Spring Boot

## Giới thiệu về Spring Boot

Trong thế giới phát triển ứng dụng Java doanh nghiệp (Enterprise Java), **Spring Boot** đã trở thành tiêu chuẩn công nghiệp (de-facto standard). Nó giúp đơn giản hóa quá trình khởi tạo, cấu hình và chạy các ứng dụng dựa trên Spring. 

Lộ trình này được thiết kế dựa trên tiêu chuẩn tại [roadmap.sh/spring-boot](https://roadmap.sh/spring-boot), giúp bạn đi từ các khái niệm nền tảng, kiến trúc Spring MVC, cách tương tác cơ sở dữ liệu quan hệ/phi quan hệ, tích hợp bảo mật, lập trình bất đồng bộ, observability cho đến kiến trúc vi dịch vụ (Microservices).

---

## 1. Spring Boot là gì và giải quyết vấn đề gì?

### Nguồn gốc của vai trò Spring Boot
Trước khi có Spring Boot, chúng ta có **Spring Framework** (ra đời năm 2003). Spring Framework cung cấp cơ chế Dependency Injection (DI) tuyệt vời để giải quyết sự cồng kềnh của EJB (Enterprise JavaBeans). Tuy nhiên, chính bản thân Spring Framework sau một thời gian phát triển lại gặp phải vấn đề **"Cấu hình địa ngục" (Configuration Hell)**. 
- Nhà phát triển phải viết hàng trăm dòng cấu hình XML (sau này là các Java Config `@Configuration`) chỉ để tích hợp Spring với Hibernate, Spring Security, hoặc cấu hình một máy chủ Web (Tomcat).
- Việc quản lý các thư viện phụ thuộc (dependencies) tương thích với nhau vô cùng phức tạp.

Để giải quyết vấn đề này, Pivotal đã giới thiệu **Spring Boot** vào năm 2014 với triết lý **"Convention over Configuration"** (Ưu tiên quy ước hơn cấu hình).

---

## 2. So sánh Spring Boot và Spring Framework

| Tiêu chí | Spring Framework | Spring Boot |
| :--- | :--- | :--- |
| **Mục tiêu chính** | Cung cấp các tính năng cốt lõi (DI, IoC, AOP) | Đơn giản hóa việc phát triển và chạy ứng dụng Spring |
| **Cấu hình** | Phải cấu hình thủ công rất nhiều (XML hoặc Java Config) | Cấu hình tự động (**Auto-configuration**) dựa trên classpath |
| **Máy chủ Web** | Phải cấu hình Server ngoài (Tomcat, Wildfly) độc lập | Tích hợp sẵn Server nhúng (**Embedded Tomcat/Jetty**) |
| **Quản lý thư viện** | Tự quản lý phiên bản từng thư viện trong `pom.xml` | Cung cấp các gói khởi tạo **Spring Boot Starters** đóng gói sẵn |
| **Hỗ trợ vận hành** | Hạn chế | Tích hợp sẵn **Actuator** để giám sát và quản lý ứng dụng |

---

## 3. Rủi ro khi không sử dụng Spring Boot

1. **Tốn thời gian Boilerplate**: Bạn sẽ mất từ vài ngày đến hàng tuần chỉ để setup một dự án mới hoạt động trơn tru với các kết nối DB, bảo mật.
2. **Lỗi không tương thích thư viện**: Việc kết hợp các phiên bản không khớp của Hibernate, Spring MVC, Spring Core dễ dẫn đến lỗi lúc Runtime cực kỳ khó debug.
3. **Quản lý máy chủ phức tạp**: Phải cài đặt Tomcat trên server, tạo file `.war` rồi deploy thủ công, khó khăn trong việc container hóa (Docker) và tích hợp CI/CD.

---

## 4. Lộ trình học (Roadmap) Spring Boot chi tiết

Dưới đây là danh sách các bài viết chi tiết được lập chỉ mục và sắp xếp theo đúng lộ trình học chuẩn tại [roadmap.sh/spring-boot](https://roadmap.sh/spring-boot):

### Phase 1: Foundations (Nền tảng cốt lõi)
1. **Giới thiệu nền tảng**: [\[01\] Phase 1: Spring Framework & Spring Boot là gì?](reader.html?post=content/frameworks/springboot/phase-1-foundations/01-introduction-to-spring.md) - Khám phá lịch sử, Convention over Configuration, Starters, Auto-Configuration và Embedded Servers.
2. **Spring Core**: [\[02\] Phase 1: Spring Core: IoC, DI, AOP & Bean Lifecycle](reader.html?post=content/frameworks/springboot/phase-1-foundations/02-spring-core-fundamentals.md) - Nắm vững ba cột trụ IoC, Dependency Injection, Bean Lifecycle/Scopes và Spring AOP.

### Phase 2: Spring MVC (Phát triển ứng dụng Web)
1. **Kiến trúc Spring MVC**: [\[03\] Phase 2: Kiến trúc Spring MVC: Servlet, JSP & Components](reader.html?post=content/frameworks/springboot/phase-2-spring-mvc/03-spring-mvc-architecture.md) - Hiểu sâu về Servlet, JSP Files, DispatcherServlet và các thành phần trong Spring MVC.
2. **Xây dựng REST API**: [\[04\] Phase 2: Xây dựng RESTful API với Spring MVC](reader.html?post=content/frameworks/springboot/phase-2-spring-mvc/04-restful-api-spring-mvc.md) - Cách tạo các REST Controller, làm việc với DTO và Response Entity.
3. **Kiểm thực & Xử lý lỗi**: [\[05\] Phase 2: Exception Handling & Validation trong Spring Boot](reader.html?post=content/frameworks/springboot/phase-2-spring-mvc/05-exception-handling-validation.md) - Ràng buộc dữ liệu đầu vào bằng `@Valid` và bắt lỗi tập trung với `@RestControllerAdvice`.

### Phase 3: Data Access (Tương tác Cơ sở dữ liệu)
1. **Hibernate Core**: [\[06\] Phase 3: Hibernate Core: Transactions, Relationships & Entity Lifecycle](reader.html?post=content/frameworks/springboot/phase-3-data-access/06-hibernate-core-lifecycle.md) - Đi sâu vào cơ chế Transaction, mối quan hệ và vòng đời Entity của Hibernate.
2. **Spring Data**: [\[07\] Phase 3: Spring Data: Spring Data JPA, MongoDB & JDBC](reader.html?post=content/frameworks/springboot/phase-3-data-access/07-spring-data-jpa-nosql.md) - Sự khác biệt và trường hợp sử dụng Spring Data JPA, MongoDB và Spring Data JDBC.

### Phase 4: Spring Security (Bảo mật hệ thống)
1. **Kiến trúc bảo mật**: [\[08\] Phase 4: Spring Security Architecture & Authentication Flow](reader.html?post=content/frameworks/springboot/phase-4-security/08-spring-security-architecture.md) - Hiểu sâu về Filter Chain, UserDetailsService và luồng xác thực.
2. **Bảo mật nâng cao**: [\[09\] Phase 4: Bảo mật nâng cao: JWT & OAuth2](reader.html?post=content/frameworks/springboot/phase-4-security/09-jwt-oauth2-security.md) - Phân biệt cơ chế xác thực JWT và giao thức OAuth2 trong thiết kế API an toàn.

### Phase 5: Advanced & Monitoring (Nâng cao & Vận hành)
1. **Xử lý bất đồng bộ**: [\[10\] Phase 5: Lập trình bất đồng bộ & Thread Pool](reader.html?post=content/frameworks/springboot/phase-5-advanced/10-async-thread-pool.md) - Tối ưu hóa hiệu năng ứng dụng với `@Async` và quản lý Thread Pool.
2. **Observability**: [\[11\] Phase 5: Monitoring & Observability với Actuator & Micrometer](reader.html?post=content/frameworks/springboot/phase-5-advanced/11-monitoring-observability-actuator.md) - Giám sát sức khỏe ứng dụng thời gian thực bằng Actuator, Micrometer và Grafana.

### Phase 6: Testing (Kiểm thử phần mềm)
1. **Kiểm thử cơ bản**: [\[12\] Phase 6: Kiểm thử: JUnit 5, Mockito, MockMvc, @SpringBootTest & @MockBean](reader.html?post=content/frameworks/springboot/phase-6-testing/12-unit-integration-testing.md) - JUnit 5, Mockito và MockMvc, sử dụng `@SpringBootTest` và `@MockBean`.
2. **Kiểm thử Container**: [\[13\] Phase 6: Containerized Testing với Testcontainers](reader.html?post=content/frameworks/springboot/phase-6-testing/13-testcontainers.md) - Chạy tích hợp database thực tế trong môi trường Docker lúc test.

### Phase 7: Microservices & Cloud
1. **Kiến trúc hệ thống lớn**: [\[14\] Phase 7: Kiến trúc Microservices với Spring Cloud](reader.html?post=content/frameworks/springboot/phase-7-microservices/14-spring-cloud-microservices.md) - Thành phần Eureka, Gateway, Config Server, Circuit Breaker (Resilience4j) và Feign Client.

---

## 5. Tài liệu tham khảo quan trọng
- [Tài liệu chính thức của Spring Boot](https://spring.io/projects/spring-boot)
- [Spring Boot in Action](https://www.manning.com/books/spring-boot-in-action) - Craig Walls
- [Spring Start Here](https://www.manning.com/books/spring-start-here) - Laurentiu Spilca
