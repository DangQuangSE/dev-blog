# [02] Phase 1 - Foundations: Spring Core: IoC, DI, AOP & Bean Lifecycle

Trong thế giới của Spring Framework, việc hiểu rõ các khái niệm cốt lõi như IoC, DI và AOP không chỉ giúp bạn viết code chạy được, mà còn giúp hệ thống của bạn linh hoạt, dễ bảo trì và mở rộng. Bài viết này sẽ hệ thống lại những kiến thức quan trọng nhất về Spring Core.

---

## 1. Dependency Inversion (DI) & Inversion of Control (IoC)

### Nguyên lý Dependency Inversion (D trong SOLID)
Nguyên lý này phát biểu rằng:
1. Các module cấp cao không nên phụ thuộc vào các module cấp thấp. Cả hai nên phụ thuộc vào sự trừu tượng (Abstraction).
2. Sự trừu tượng không nên phụ thuộc vào chi tiết. Chi tiết nên phụ thuộc vào sự trừu tượng.

### Dependency Injection (DI) là gì?
DI là một mẫu thiết kế (Design Pattern) dùng để hiện thực hóa nguyên lý Dependency Inversion. Thay vì một class tự khởi tạo các phụ thuộc của nó (tight coupling), các phụ thuộc này sẽ được "tiêm" vào từ bên ngoài (loose coupling).

**Ví dụ thực tế:**
Trước đây (Tight Coupling):
```java
public class Car {
    private ChinaEngine engine; // Phụ thuộc trực tiếp vào class cụ thể
    public Car() {
        this.engine = new ChinaEngine(); 
    }
}
```
Khi muốn thay đổi sang `VNEngine`, bạn phải sửa lại code của class `Car`.

Sau khi áp dụng DI (Loose Coupling):
```java
interface Engine {} // Sự trừu tượng

public class ChinaEngine implements Engine {}
public class VNEngine implements Engine {}

public class Car {
    private final Engine engine; // Phụ thuộc vào interface

    // Constructor Injection (Khuyên dùng)
    public Car(Engine engine) {
        this.engine = engine;
    }
}
```
Bây giờ, `Car` có thể hoạt động với bất kỳ loại động cơ nào mà không cần thay đổi code bên trong.

### IoC Container & Bean
- **IoC Container**: Là bộ phận trung tâm của Spring, có nhiệm vụ khởi tạo, cấu hình và quản lý vòng đời của các đối tượng.
- **Bean**: Là các đối tượng được quản lý bởi IoC Container.
- **ApplicationContext**: Là đại diện cho IoC Container ở mức cao, cung cấp nhiều tính năng như i18n, xử lý sự kiện, và tích hợp với AOP. So với **BeanFactory**, `ApplicationContext` thường khởi tạo các Bean ở chế độ "Eager" (ngay khi khởi động ứng dụng).

---

## 2. Bean Lifecycle (Vòng đời của Bean)

Hiểu vòng đời của Bean giúp bạn can thiệp đúng lúc vào quá trình khởi tạo hoặc hủy bỏ đối tượng.

1.  **Instantiation**: Spring khởi tạo Bean bằng constructor.
2.  **Populate Properties**: Inject các phụ thuộc (DI).
3.  **Aware Interfaces**: Gọi các phương thức của interface Aware (như `BeanNameAware`, `ApplicationContextAware`) để cung cấp thông tin môi trường.
4.  **BeanPostProcessor (Before Initialization)**: Thực hiện logic trước khi khởi tạo.
5.  **Initialization**: 
    - Gọi phương thức được đánh dấu `@PostConstruct`.
    - Gọi `afterPropertiesSet()` của interface `InitializingBean`.
    - Gọi phương thức `init-method` cấu hình trong `@Bean`.
6.  **BeanPostProcessor (After Initialization)**: Thực hiện logic sau khi khởi tạo (thường dùng để tạo Proxy cho AOP).
7.  **Bean Ready to Use**: Bean sẵn sàng hoạt động.
8.  **Destruction**: Khi ứng dụng tắt:
    - Gọi phương thức được đánh dấu `@PreDestroy`.
    - Gọi `destroy()` của interface `DisposableBean`.

---

## 3. Aspect Oriented Programming (AOP)

AOP dùng để tách các **Cross-cutting Concerns** (các tính năng lặp đi lặp lại ở nhiều nơi như Logging, Transaction, Security) ra khỏi logic nghiệp vụ chính.

### Các khái niệm cốt lõi:
- **Aspect**: Một module tập trung các xử lý lặp lại (ví dụ: `LoggingAspect`).
- **JoinPoint**: Các điểm trong chương trình có thể chèn Aspect vào (trong Spring AOP, đây luôn là việc thực thi phương thức).
- **Pointcut**: Một biểu thức (Expression) xác định JoinPoint nào sẽ được áp dụng Advice.
- **Advice**: Hành động thực tế sẽ được thực hiện:
    - `@Before`: Chạy trước khi phương thức thực thi.
    - `@After`: Chạy sau khi phương thức kết thúc (kể cả khi lỗi).
    - `@Around`: Chạy bao quanh phương thức, có thể kiểm soát việc cho phép phương thức chạy hay không.

---

## 4. Các Annotation quan trọng

- **@Configuration**: Đánh dấu một class chứa các định nghĩa Bean.
- **@Bean**: Đánh dấu một phương thức trong class `@Configuration` dùng để tạo ra một Bean.
- **@Component**: Đánh dấu một class là Bean để Spring tự động quét và khởi tạo (Component Scanning).

**Lời kết**: Việc nắm vững các nền tảng này sẽ giúp bạn tiếp cận các module nâng cao của Spring như Spring Security hay Spring Data một cách dễ dàng hơn.
