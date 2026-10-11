# JAVA CORE 21 — PHẦN 13: CLEAN CODE, DEBUGGING & TESTING

Giáo trình chuyên sâu · Java 21 · Junior/Junior+ Java Backend Developer

Đến Phần 12, bạn đã học gần như toàn bộ những thành phần cốt lõi của Java: từ OOP, Generics, Collections, Concurrency đến JVM, Reflection và Networking.

Tuy nhiên, biết viết Java và biết xây dựng phần mềm có chất lượng là hai kỹ năng khác nhau.

Trong một dự án Backend thực tế, code không chỉ cần chạy đúng. Nó còn phải:

- Dễ đọc đối với người chưa viết ra nó.
- Dễ kiểm thử mà không phụ thuộc quá nhiều vào môi trường bên ngoài.
- Dễ debug khi production phát sinh lỗi.
- Dễ thay đổi khi nghiệp vụ mở rộng.
- Có khả năng phát hiện regression trước khi release.
- Không làm lộ dữ liệu nhạy cảm trong log hoặc test fixtures.

Phần này tập trung vào hai năng lực:

1. Viết code Java rõ ràng, có trách nhiệm và có khả năng bảo trì.
2. Xây dựng chiến lược kiểm thử, debug và build đáng tin cậy.

JUnit 5, Mockito, Spring Boot Test, Testcontainers, Maven và Gradle không phải là tính năng của Java language core. Tuy nhiên, chúng là những công cụ gần như không thể thiếu trong công việc Java Backend, nên được trình bày ở đây như phần hệ sinh thái hỗ trợ Java.

## Mục tiêu học tập

Sau khi hoàn thành Phần 13, bạn cần có khả năng:

- Đặt tên class, method, biến và package theo ngữ nghĩa nghiệp vụ.
- Nhận diện và xử lý những code smells phổ biến.
- Áp dụng SRP, SOLID, DRY, KISS và YAGNI mà không biến chúng thành quy tắc máy móc.
- Thiết kế object immutable, defensive copy và dependency injection.
- Phân biệt lỗi trong production code với lỗi do test hoặc môi trường.
- Viết unit test bằng JUnit Jupiter.
- Dùng parameterized tests để kiểm tra nhiều dữ liệu đầu vào.
- Dùng Mockito để cô lập dependency ở đúng ranh giới.
- Chọn unit, integration, contract hay end-to-end test dựa trên rủi ro.
- Debug bằng breakpoint, stack trace, thread dump và JVM tools.
- Hiểu coverage, mutation testing và giới hạn của các con số coverage.
- Tổ chức test trong Maven/Gradle và CI.
- Sử dụng Testcontainers khi cần kiểm thử với dịch vụ gần production.

## Nội dung Phần 13

| Chương | Chủ đề | Nội dung |
| --- | --- | --- |
| 39 | Java Clean Code & Best Practices | Naming, readability, SRP, SOLID, immutability, refactoring, code smells, resource và logging practices |
| 40 | Testing & Debugging | JUnit 5, Mockito, unit/integration/E2E testing, Spring Boot testing, Testcontainers, debugger, coverage và build lifecycle |

> Các ví dụ Spring Boot, Mockito, Testcontainers, Maven và Gradle là ví dụ hệ sinh thái. Khi áp dụng vào dự án thật, cần dùng version và dependency management của chính dự án.

# CHƯƠNG 39. JAVA CLEAN CODE & BEST PRACTICES

## 39.1. Clean Code là gì?

Clean Code là cách viết code giúp người khác — bao gồm cả chính bạn trong tương lai — dễ hiểu mục đích, kiểm tra tính đúng đắn và thay đổi chương trình.

Clean Code không đơn giản là code ngắn.

Ví dụ:

```java
public boolean c(int a, int b) {
    return a > b;
}
```

Code trên ngắn nhưng không thể hiện rõ:

- c là điều kiện gì?
- a và b đại diện cho giá trị nào?
- Điều kiện là lớn hơn hay lớn hơn hoặc bằng?
- Method phục vụ domain nào?

Một cách viết rõ hơn:

```java
public boolean isEligibleForPurchase(
        int customerAge,
        int minimumAge) {

    return customerAge >= minimumAge;
}
```

Version thứ hai dài hơn nhưng thể hiện được tên miền và quy tắc nghiệp vụ.

### Mục tiêu của Clean Code

- Readability: dễ đọc.
- Maintainability: dễ bảo trì.
- Testability: dễ kiểm thử.
- Extensibility: dễ mở rộng đúng cách.
- Reliability: giảm lỗi do hiểu sai logic.
- Consistency: nhất quán với convention chung.
- Observability: dễ quan sát khi chạy thật.

Clean Code không bảo đảm phần mềm luôn đúng. Nó làm giảm chi phí để con người xác minh và sửa phần mềm.

### Nguồn gốc của nhu cầu Clean Code

Ở chương trình nhỏ, một developer có thể nhớ gần như toàn bộ code. Khi hệ thống lớn lên:

- Nhiều người cùng sửa một module.
- Business rule thay đổi thường xuyên.
- Một method có thể được gọi từ nhiều use case.
- Code chạy trong background job, HTTP request và message consumer.
- Bug chỉ xảy ra với một tổ hợp dữ liệu hiếm.

Khi đó, phần lớn chi phí không còn nằm ở việc viết dòng code đầu tiên mà nằm ở việc đọc, sửa và xác minh code cũ. Clean Code tập trung giảm chi phí này.

### Clean Code không phải style cá nhân

Formatter có thể tự động xử lý vị trí dấu ngoặc, khoảng trắng, độ dài dòng và import ordering. Nhưng formatter không thể quyết định:

- Tên có phản ánh đúng domain không?
- Class có quá nhiều trách nhiệm không?
- Test có kiểm tra behavior hay implementation detail?
- Abstraction có thật sự cần thiết không?

Formatter giúp code có hình thức nhất quán. Nó không thay thế thiết kế tốt.

## 39.2. Naming Conventions

Java có những convention phổ biến:

| Thành phần | Convention | Ví dụ |
| --- | --- | --- |
| Class | PascalCase | `OrderService` |
| Interface | PascalCase | `PaymentGateway` |
| Method | camelCase | `calculateTotal()` |
| Variable | camelCase | `customerId` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Package | chữ thường | `com.example.order` |
| Enum constant | UPPER_SNAKE_CASE | `PAYMENT_PENDING` |

Convention không thay thế ý nghĩa. Một tên đúng convention nhưng sai ngữ nghĩa vẫn tạo ra code khó đọc.

### Đặt tên theo ý nghĩa nghiệp vụ

Không tốt:

```java
int x = 10;
int y = 20;
int z = x + y;
```

Tốt hơn:

```java
int baseScore = 10;
int bonusScore = 20;
int totalScore = baseScore + bonusScore;
```

Tên `totalScore` giúp người đọc hiểu ngay phép cộng đang đại diện cho điều gì.

### Method nên thể hiện hành động

```java
createOrder()
cancelPayment()
findUserByEmail()
calculateFinalPrice()
publishExamResult()
```

Với kiểu boolean, các tiền tố thường giúp câu lệnh dễ đọc:

```java
isActive()
hasPermission()
canSubmitExam()
isExpired()
containsStudent()
```

### Tránh tên gây hiểu nhầm

Không tốt:

```java
List<User> userMap;
```

Biến có kiểu List nhưng tên lại nói rằng nó là Map.

Nên viết:

```java
List<User> users;
Map<Long, User> usersById;
```

Tên `usersById` còn mô tả được key dùng để tra cứu.

### Tránh viết tắt khó hiểu

Không tốt:

```java
usrSvc
ordProc
calcAmt
```

Thường tốt hơn:

```java
userService
orderProcessor
calculateAmount
```

Những từ viết tắt phổ biến như DTO, HTTP, URL, ID có thể phù hợp nếu team thống nhất convention.

### Tên boolean và phủ định kép

Tên phủ định kép làm điều kiện khó đọc:

```java
if (!isNotEligible) {
    submit();
}
```

Nên diễn đạt trực tiếp:

```java
if (isEligible) {
    submit();
}
```

## 39.3. Readability, Formatting và Comments

Readability là khả năng người đọc nhanh chóng xây dựng mô hình trong đầu về code.

### Giữ một mức abstraction trong cùng method

Không tốt:

```java
public void checkout(Order order) {
    validateOrder(order);
    String sql = "INSERT INTO orders ...";
    connection.prepareStatement(sql).executeUpdate();
    smtpClient.send("...");
}
```

Method vừa điều phối use case, vừa biết SQL, vừa biết chi tiết email. Đây là nhiều mức abstraction trộn lẫn.

Có thể viết:

```java
public void checkout(Order order) {
    validateOrder(order);
    orderRepository.save(order);
    notificationService.sendOrderConfirmation(order);
}
```

`checkout()` vẫn có thể là một application workflow, nhưng chi tiết persistence và notification nằm ở component phù hợp.

### Format để thể hiện cấu trúc

Đoạn code sau khó đọc:

```java
if (user != null && user.isActive() && user.hasRole("ADMIN")
        && !user.isLocked()) {
    process(user);
}
```

Có thể đặt tên cho domain rule:

```java
if (user.canManageOrders()) {
    process(user);
}
```

### Comments nên giải thích why

Comment không tốt chỉ lặp lại code:

```java
// Increment retry count by one
retryCount++;
```

Comment có giá trị thường giải thích lý do không hiển nhiên:

```java
// The payment provider may deliver the same webhook more than once.
// The repository operation is idempotent by provider event ID.
processWebhookIdempotently(event);
```

Nếu comment trở nên sai khi code thay đổi, nó nguy hiểm hơn việc không có comment.

### Khi nào dùng JavaDoc?

JavaDoc phù hợp với public API, library, method có contract rõ, exception có thể ném và behavior về thread-safety hoặc nullability.

```java
/**
 * Reserves stock for an order.
 *
 * @param orderId identifier of the order
 * @param items items and requested quantities
 * @return reservation identifier
 * @throws IllegalArgumentException if a quantity is not positive
 * @throws OutOfStockException if requested quantity is unavailable
 */
public ReservationId reserve(
        OrderId orderId,
        List<OrderItem> items) {
    // ...
}
```

JavaDoc không nên dùng để bù cho tên method và thiết kế khó hiểu.

## 39.4. Functions Should Do One Thing

Một method nên có trách nhiệm rõ ràng và mức abstraction tương đối nhất quán.

Ví dụ không tốt:

```java
public void registerUser(
        String email,
        String password) {

    if (email == null || !email.contains("@")) {
        throw new IllegalArgumentException();
    }

    String hashedPassword = hashPassword(password);
    database.save(email, hashedPassword);
    emailClient.sendWelcomeEmail(email);
    auditService.log("USER_REGISTERED");
}
```

Method trên kết hợp validation, hashing, persistence, email và audit. Một application service có thể điều phối workflow, nhưng không nên chứa implementation detail của từng dependency.

Một thiết kế rõ hơn:

```java
public void registerUser(RegisterUserCommand command) {
    validateRegistration(command);

    String passwordHash =
            passwordHasher.hash(command.password());

    User user = userRepository.save(
            new User(command.email(), passwordHash)
    );

    eventPublisher.publish(
            new UserRegisteredEvent(user.id())
    );
}
```

### Có nên tách mọi dòng thành một method?

Không. Một method chỉ nên được tách khi tên mới tạo ra domain meaning, giảm complexity hoặc tạo boundary có thể kiểm thử.

### Một method dài chưa chắc luôn sai

Một parser, state machine hoặc bảng ánh xạ tĩnh có thể dài nhưng cohesion cao. Ngược lại, method ngắn vẫn khó bảo trì nếu nó điều phối nhiều trách nhiệm không liên quan.

Hãy đánh giá số lý do thay đổi, số nhánh, số dependency và khả năng test từng behavior thay vì chỉ đếm dòng.

## 39.5. Complexity và Cognitive Load

Hai method có cùng số dòng có thể có độ khó rất khác nhau.

### Cyclomatic complexity

Mỗi nhánh như `if`, `while`, `for`, `catch` hoặc điều kiện logic có thể làm tăng số đường đi cần kiểm tra.

```java
if (active && verified && (admin || owner)) {
    allow();
}
```

Người đọc phải nhớ ý nghĩa và quan hệ của nhiều boolean. Có thể chuyển thành domain method:

```java
if (canEditDocument(user, document)) {
    allow();
}
```

### Tránh điều kiện quá thông minh

Không nên nén quá nhiều logic chỉ để giảm số dòng:

```java
return user != null && user.isActive() && !user.isLocked()
        && (user.isAdmin() || ownerId.equals(user.id()));
```

Guard clause hoặc policy object thường giúp flow rõ hơn.

### Parameter object

Nếu method nhận quá nhiều nullable arguments:

```java
createReport(
        User user,
        String locale,
        ZoneId zone,
        List<Filter> filters)
```

Có thể dùng:

```java
record ReportRequest(
        User user,
        Locale locale,
        ZoneId zone,
        List<Filter> filters) {
}
```

Parameter object có giá trị khi các tham số tạo thành một concept có tên.

## 39.6. Single Responsibility Principle

`Single Responsibility Principle` nói rằng một module nên có một lý do chính để thay đổi, thường gắn với một nhóm yêu cầu hoặc một actor liên quan.

Ví dụ không tốt:

```java
class UserService {

    void saveUser(User user) {}
    void sendEmail(User user) {}
    void generatePdfReport() {}
    void calculatePayroll() {}
}
```

Các trách nhiệm này có thể thay đổi vì những lý do khác nhau. Thiết kế hợp lý hơn:

```text
UserService
EmailService
ReportService
PayrollService
```

### SRP không có nghĩa mỗi class chỉ có một method

Một `OrderService` có thể có `createOrder()`, `cancelOrder()` và `confirmOrder()` nếu các method cùng quản lý lifecycle của Order.

Hãy hỏi:

- Class này thay đổi khi business rule nào thay đổi?
- Những method có cùng actor sử dụng không?
- Một yêu cầu mới có buộc sửa nhiều phần không liên quan không?

SRP không phải công thức đếm số method.

## 39.7. Cohesion và Coupling

### Cohesion

`Cohesion` đo mức độ những thành phần trong module liên quan đến cùng trách nhiệm. High cohesion thường là mục tiêu tốt.

### Coupling

`Coupling` đo mức độ phụ thuộc giữa các module. Low coupling giúp thay đổi implementation và kiểm thử dễ hơn.

Ví dụ high coupling:

```java
class OrderService {

    private final StripePaymentClient client =
            new StripePaymentClient();

    void pay(Order order) {
        client.charge(order);
    }
}
```

Service tự tạo dependency cụ thể, khiến việc thay provider hoặc test thất bại khó hơn.

Giảm coupling bằng abstraction:

```java
interface PaymentGateway {
    PaymentReceipt charge(Order order);
}

class OrderService {

    private final PaymentGateway paymentGateway;

    OrderService(PaymentGateway paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    PaymentReceipt pay(Order order) {
        return paymentGateway.charge(order);
    }
}
```

Constructor injection giúp dependency trở thành một phần rõ ràng của object contract.

## 39.8. SOLID trong Backend

| Nguyên tắc | Nội dung | Ví dụ |
| --- | --- | --- |
| S — SRP | Một lý do chính để thay đổi | Tách order workflow khỏi email details |
| O — OCP | Mở rộng behavior mà không liên tục sửa code ổn định | Thêm implementation của gateway |
| L — LSP | Subtype giữ đúng contract của supertype | Không làm subtype phá giả định caller |
| I — ISP | Client không bị ép phụ thuộc method không cần | Chia interface theo capability |
| D — DIP | Policy cấp cao phụ thuộc abstraction phù hợp | Application service nhận gateway interface |

### Open/Closed Principle

OCP không có nghĩa không bao giờ sửa code. Nó nhắc rằng behavior biến động nên được thiết kế để mở rộng ở boundary phù hợp.

```java
interface DiscountPolicy {
    BigDecimal discountFor(Order order);
}

final class SeasonalDiscount implements DiscountPolicy {

    @Override
    public BigDecimal discountFor(Order order) {
        return order.subtotal().multiply(
                new BigDecimal("0.10"));
    }
}
```

Không nên tạo interface chỉ vì “có thể sau này cần”. Hãy tạo abstraction khi có variation thực tế hoặc boundary rõ.

### Liskov Substitution Principle

Nếu `Bird` có method `fly()`, việc để `Penguin` kế thừa `Bird` rồi ném `UnsupportedOperationException` khi gọi `fly()` là dấu hiệu hierarchy sai.

LSP kiểm tra contract, không chỉ kiểm tra compiler có cho phép `extends` hay không.

### Interface Segregation Principle

Không tốt:

```java
interface Worker {
    void code();
    void design();
    void deploy();
}
```

Một client chỉ cần `code()` bị ép phụ thuộc các method còn lại. Có thể tách interface theo capability.

### Dependency Inversion và Dependency Injection

`Dependency Inversion Principle` là nguyên tắc thiết kế: high-level policy không phụ thuộc trực tiếp vào low-level detail.

`Dependency Injection` là kỹ thuật cung cấp dependency từ bên ngoài. Có thể áp dụng DIP bằng constructor injection thuần Java, không cần Spring.

## 39.9. DRY, KISS và YAGNI

### DRY — Don't Repeat Yourself

DRY hướng tới tránh lặp lại knowledge hoặc business rule, không phải xóa mọi đoạn code giống nhau.

Nếu quy tắc discount được copy ở nhiều service:

```java
double discount = price * 0.10;
```

Khi chính sách thay đổi, một nơi có thể bị bỏ quên.

Có thể gom domain rule:

```java
final class DiscountPolicy {

    BigDecimal calculate(
            BigDecimal amount,
            BigDecimal rate) {

        return amount.multiply(rate);
    }
}
```

### Không DRY quá sớm

Hai đoạn code giống nhau về hình thức nhưng thuộc hai nghiệp vụ độc lập có thể thay đổi theo các hướng khác nhau. Ép chúng vào một abstraction quá sớm có thể làm coupling tăng.

Duplication nhỏ đôi khi tốt hơn abstraction sai.

### KISS — Keep It Simple

KISS khuyến khích giải pháp đơn giản, đủ đáp ứng yêu cầu:

```java
interface PaymentGateway {
    PaymentReceipt pay(PaymentRequest request);
}
```

Một hệ thống chỉ có một provider chưa chắc cần AbstractPaymentStrategyFactory, GatewayRegistry và plugin framework. Sự đơn giản không được đánh đổi tính đúng đắn hoặc security.

### YAGNI — You Aren't Gonna Need It

Không xây dựng feature chỉ vì “có thể tương lai sẽ cần”.

YAGNI không có nghĩa bỏ qua extensibility. Nó khuyến khích đầu tư vào abstraction có nhu cầu thực tế và bằng chứng rõ ràng.

## 39.10. Immutability và Defensive Programming

`Immutability` giúp hạn chế thay đổi state sau khi object được tạo.

```java
public record Money(
        BigDecimal amount,
        Currency currency) {

    public Money {
        Objects.requireNonNull(amount, "amount");
        Objects.requireNonNull(currency, "currency");

        if (amount.signum() < 0) {
            throw new IllegalArgumentException(
                    "amount must not be negative");
        }
    }
}
```

### Lợi ích của immutable objects

- Dễ suy luận và debug.
- Giảm shared mutable state.
- An toàn hơn khi chia sẻ giữa threads.
- Có thể dùng làm key nếu equals và hashCode ổn định.
- Dễ cache và test.

### final không đồng nghĩa immutable

```java
final List<String> names = new ArrayList<>();
names.add("Alice"); // Vẫn hợp lệ
```

final chỉ ngăn reference bị gán sang object khác. Nó không khóa state của object được tham chiếu.

### Defensive copy

```java
public record ExamResult(
        Long studentId,
        List<Integer> scores) {

    public ExamResult {
        scores = List.copyOf(scores);
    }
}
```

List.copyOf() ngăn caller thay đổi cấu trúc list thông qua reference đó. Nó không deep-copy các element mutable.

### Defensive copy với mutable elements

Nếu element cũng mutable, việc copy list chỉ copy container. Muốn deep immutability, từng element phải immutable hoặc được copy riêng theo domain rule.

### Defensive input và output

Một class nhận List từ bên ngoài nên quyết định rõ:

- Có giữ reference gốc không?
- Có cần snapshot không?
- Có cho phép null không?
- Có yêu cầu thứ tự không?
- Có cần preserve duplicate không?

Đừng trả trực tiếp mutable internal collection:

```java
public List<String> roles() {
    return roles; // Có thể làm lộ state nội bộ
}
```

Thay vào đó:

```java
public List<String> roles() {
    return List.copyOf(roles);
}
```

## 39.11. Null Handling và API Contract

Null không phải lúc nào cũng là lỗi. Nó có thể có nghĩa:

- Chưa biết.
- Không áp dụng.
- Không tồn tại.
- Không được cung cấp.
- Lỗi của caller.

Vấn đề là contract không rõ ràng.

### Fail fast ở boundary

```java
public User findById(Long id) {
    Objects.requireNonNull(id, "id");
    // ...
}
```

Nếu null là invalid input, phát hiện ngay tại boundary giúp stack trace gần nguyên nhân hơn.

### Optional không phải thay thế mọi null

Optional phù hợp với return type biểu diễn “có thể không có giá trị”:

```java
Optional<User> findByEmail(String email);
```

Không nên lạm dụng Optional cho field của entity, mọi parameter, collection có thể trả collection rỗng hoặc logic nội bộ khiến code dài hơn nhưng không rõ hơn.

### Collection rỗng tốt hơn null

Nếu contract là “danh sách kết quả”, thường nên trả:

```java
return List.of();
```

thay vì return null. Caller có thể lặp qua list mà không cần null check.

### Null Object Pattern

Trong một số domain, implementation no-op có thể tốt hơn nhiều nhánh null:

```java
interface AuditSink {
    void record(AuditEvent event);
}

final class NoOpAuditSink implements AuditSink {

    @Override
    public void record(AuditEvent event) {
        // Intentionally do nothing
    }
}
```

Chỉ dùng khi “không làm gì” là behavior hợp lệ, không phải để che lỗi cấu hình.

## 39.12. Value Objects, equals và hashCode

Primitive obsession xuất hiện khi domain concept quan trọng bị biểu diễn bằng String, int hoặc long ở quá nhiều nơi.

Không tốt:

```java
void pay(String currency, double amount);
```

Một value object có thể làm invariant rõ hơn:

```java
public record Money(
        BigDecimal amount,
        Currency currency) {

    public Money {
        Objects.requireNonNull(amount);
        Objects.requireNonNull(currency);
    }
}
```

### BigDecimal trong test và equality

BigDecimal("10.0").equals(BigDecimal("10.00")) là false vì scale được tính vào equals(), trong khi compareTo() trả 0.

Khi business rule chỉ quan tâm giá trị số:

```java
assertEquals(
        0,
        actual.compareTo(new BigDecimal("10.00"))
);
```

Hoặc chuẩn hóa scale theo contract của money type. Đừng sửa test để che giấu một contract chưa rõ.

### Mutable key là rủi ro

Nếu object dùng làm key của HashMap thay đổi field ảnh hưởng hashCode() sau khi thêm vào map, map có thể không tìm lại được key.

Value object làm key nên immutable.

## 39.13. Magic Numbers và Object Creation

Không tốt:

```java
if (attempts > 5) {
    lockAccount();
}
```

Nên đặt tên:

```java
private static final int MAX_LOGIN_ATTEMPTS = 5;

if (attempts > MAX_LOGIN_ATTEMPTS) {
    lockAccount();
}
```

Tên constant không sửa được lỗi greater-than và greater-than-or-equal; cần xác minh business rule.

### Tránh object creation không cần thiết

Trong loop lớn:

```java
for (Order order : orders) {
    DateTimeFormatter formatter =
            DateTimeFormatter.ofPattern("yyyy-MM-dd");
    output.add(order.createdAt().format(formatter));
}
```

Formatter có thể được tạo một lần nếu immutable và dùng chung an toàn:

```java
private static final DateTimeFormatter DATE_FORMATTER =
        DateTimeFormatter.ofPattern("yyyy-MM-dd");
```

Không nên tối ưu mù quáng. Hãy đo khi allocation thực sự là bottleneck; ưu tiên code đúng và rõ.

### Boxing trong hot path

List<Integer> có thể tạo wrapper objects và chi phí boxing. Nếu đang xử lý dữ liệu số rất lớn, primitive collections hoặc IntStream có thể đáng cân nhắc, nhưng không nên thay đổi cấu trúc dữ liệu chỉ vì tối ưu giả định.

## 39.14. Exception Handling Best Practices

### Không nuốt exception

Không tốt:

```java
try {
    paymentService.charge(order);
} catch (Exception e) {
}
```

Đoạn code làm mất thông tin payment failure.

### Bắt exception cụ thể

```java
try {
    int age = Integer.parseInt(input);
} catch (NumberFormatException e) {
    throw new InvalidRequestException(
            "age must be an integer", e);
}
```

### Giữ cause khi wrap

```java
catch (IOException e) {
    throw new ReportGenerationException(
            "Cannot read report template", e);
}
```

Nếu bỏ e khỏi constructor, stack trace mất nguyên nhân gốc.

### Không dùng exception cho flow bình thường

Nếu một user không tồn tại là trạng thái được dự kiến, contract có thể dùng Optional.empty() hoặc domain result. Nếu thiếu số dư là business rejection có thể dùng domain exception khi boundary cần mapping thành response.

### Log đúng boundary

Nếu mọi layer đều log rồi rethrow, một lỗi có thể xuất hiện nhiều lần. Thường nên thêm context ở nơi có ownership xử lý lỗi, rồi giữ cause để phân tích.

## 39.15. Resource Management

Tài nguyên ngoài heap phải có lifecycle rõ:

- File descriptor.
- Socket.
- Database connection.
- HTTP response body.
- Executor.
- Native buffer.

Dùng try-with-resources cho resource implement AutoCloseable:

```java
try (InputStream input =
             Files.newInputStream(path)) {
    return input.readAllBytes();
}
```

Nếu file rất lớn, không nên đọc toàn bộ chỉ vì code ngắn. Cần streaming, giới hạn kích thước và xử lý backpressure phù hợp.

### Resource do framework quản lý

Trong Spring hoặc application server, không tự đóng resource mà framework sở hữu nếu contract không yêu cầu. Hãy phân biệt resource do method mở với resource được inject và quản lý bởi container.

## 39.16. Logging Best Practices

Java Backend thường dùng facade như SLF4J với logging implementation tương ứng.

```java
private static final Logger log =
        LoggerFactory.getLogger(OrderService.class);

log.info("Order created: orderId={}", orderId);
```

### Parameterized logging

Ưu tiên:

```java
log.debug("Processing orderId={}", orderId);
```

hơn:

```java
log.debug("Processing orderId=" + orderId);
```

Parameterized logging có thể tránh format String khi level bị tắt. Tuy nhiên, argument expression phức tạp vẫn được Java đánh giá trước khi gọi method.

### Không log dữ liệu nhạy cảm

Không log trực tiếp password, access token, refresh token, private key, full credit card number hoặc session cookie.

Email, phone number, dữ liệu sức khỏe và định danh cá nhân cũng cần tuân theo chính sách bảo vệ dữ liệu.

### Structured logging

Các field hữu ích:

```text
timestamp
level
service
traceId
requestId
userId
orderId
message
```

Không nên đưa toàn bộ request body vào log nếu body có dữ liệu nhạy cảm hoặc kích thước lớn.

## 39.17. Refactoring là gì?

Refactoring là thay đổi cấu trúc nội bộ của code mà vẫn giữ observable behavior theo contract được bảo vệ.

Một số kỹ thuật:

- Extract Method.
- Extract Class.
- Rename Variable/Method.
- Replace Conditional with Polymorphism.
- Introduce Parameter Object.
- Encapsulate Field.
- Remove Dead Code.
- Simplify Conditional Logic.
- Replace Magic Number with Symbolic Constant.

### Quy trình refactor an toàn

1. Hiểu behavior hiện tại.
2. Xác định contract và edge cases.
3. Viết hoặc xác nhận test bảo vệ behavior.
4. Thực hiện một thay đổi nhỏ.
5. Chạy test liên quan.
6. Review diff.
7. Lặp lại.

Nếu vừa đổi cấu trúc vừa đổi business rule, hãy tách thành hai thay đổi khi có thể. Khi test fail, bạn sẽ biết failure do refactor hay do rule mới.

## 39.18. Code Smells

Code smell là dấu hiệu cho thấy code có thể cần cải thiện, không phải bằng chứng chắc chắn code sai.

| Code smell | Dấu hiệu | Hướng xử lý |
| --- | --- | --- |
| Long Method | Quá nhiều logic hoặc mức abstraction | Extract Method |
| Large Class | Quá nhiều trách nhiệm | Extract Class |
| Long Parameter List | Nhiều argument khó nhớ | Parameter Object |
| Primitive Obsession | Domain chỉ là String hoặc int | Value Object |
| Feature Envy | Method dùng quá nhiều data class khác | Chuyển behavior hoặc thiết kế lại |
| Duplicate Code | Rule được copy nhiều nơi | Gom knowledge đúng boundary |
| Shotgun Surgery | Một thay đổi sửa nhiều module | Tăng cohesion |
| God Object | Một class quản lý gần như mọi thứ | Tách responsibility |
| Deep Nesting | Điều kiện lồng khó đọc | Guard clauses hoặc policy |
| Boolean Blindness | Nhiều boolean argument | Enum, command object hoặc domain method |
| Inappropriate Intimacy | Class truy cập quá sâu vào nhau | Giới hạn boundary |
| Speculative Generality | Abstraction chưa có nhu cầu | Xem xét YAGNI |

### Boolean blindness

Không rõ:

```java
createUser("Alice", true, false, true);
```

Tốt hơn:

```java
CreateUserCommand command = new CreateUserCommand(
        "Alice",
        AccountStatus.ACTIVE,
        VerificationStatus.VERIFIED,
        NotificationPreference.EMAIL
);
```

Không phải mọi boolean đều cần enum. Vấn đề là caller có hiểu ý nghĩa từng vị trí hay không.

## 39.19. Package Design và Clean Architecture

Một cách tổ chức Backend phổ biến:

```text
Presentation / API
    Controllers · Request/Response DTOs

Application
    Use cases · Orchestration · Ports

Domain
    Entities · Value objects · Business rules

Infrastructure
    Database · Messaging · External APIs
```

Trong Clean Architecture, dependency direction thường hướng vào core policy; domain không phụ thuộc trực tiếp concrete database adapter.

### Package by Layer

```text
controller/
service/
repository/
dto/
entity/
```

Dễ bắt đầu nhưng một feature có thể bị rải ở nhiều thư mục.

### Package by Feature

```text
user/
  UserController.java
  UserService.java
  UserRepository.java

order/
  OrderController.java
  OrderService.java
  OrderRepository.java
```

Thường tăng locality của feature khi codebase lớn. Không có một cấu trúc duy nhất đúng cho mọi dự án.

## 39.20. Code Review Checklist

### Correctness

- Điều kiện biên có đúng không?
- Có off-by-one không?
- Có phân biệt equals() và == đúng không?
- Có xử lý null, empty và duplicate không?
- Có transaction hoặc concurrency assumption nào bị bỏ quên không?

### Design

- Class có một responsibility chính không?
- Dependency có được inject qua boundary phù hợp không?
- Có abstraction thừa hoặc coupling trực tiếp không?
- Mutable state có bị lộ ra ngoài không?

### Error handling

- Exception có đủ cụ thể không?
- Cause có được giữ lại không?
- Có log nhạy cảm không?
- Resource có được đóng không?

### Testing

- Test có bảo vệ behavior quan trọng không?
- Có test happy path, invalid input và boundary không?
- Test có phụ thuộc thời gian, random, network hoặc thứ tự chạy không?
- Có mock quá nhiều implementation detail không?

# CHƯƠNG 40. TESTING, JUNIT 5, MOCKITO & DEBUGGING

## 40.1. Software Testing là gì?

Software Testing là quá trình đánh giá behavior của phần mềm để phát hiện defect và cung cấp bằng chứng rằng hệ thống đáp ứng requirements.

Một test thường có:

1. Điều kiện đầu vào.
2. Hành vi được thực thi.
3. Kết quả quan sát được.

```java
int result = calculator.add(2, 3);

assertEquals(5, result);
```

### Test không chứng minh phần mềm không có bug

Test chỉ kiểm tra những behavior và dữ liệu mà bạn đã xác định. Một test suite tốt tăng confidence, nhưng không chứng minh mọi input đều đúng.

Test case nên được thiết kế từ requirements, business invariants, failure modes, security risks và boundary values.

### Regression

Regression là việc behavior đã đúng trước đó bị hỏng sau thay đổi. Automated tests giúp phát hiện regression sớm, nhưng chỉ khi test thực sự bao phủ contract bị ảnh hưởng.

## 40.2. Các cấp độ Testing

### Unit Testing

Kiểm thử một đơn vị logic trong môi trường được kiểm soát. Unit test thường không cần Spring Context, database hay network.

### Integration Testing

Kiểm tra sự tương tác giữa các component thật, ví dụ repository với database, serialization với JSON mapper hoặc HTTP client với server test.

### End-to-End Testing

Kiểm tra workflow hoàn chỉnh từ góc nhìn hệ thống bên ngoài:

```text
Register -> Login -> Create Order -> Pay -> View Order
```

### Contract Testing

Kiểm tra contract giữa provider và consumer, chẳng hạn HTTP status, JSON field, data type và error shape.

### Testing Pyramid

```text
             E2E
       Integration / Contract
             Unit
```

Mô hình thường có nhiều unit test nhanh, ít integration test hơn và ít E2E test hơn. Tỷ lệ cụ thể tùy hệ thống.

| Loại test | Tốc độ thường thấy | Dependency |
| --- | --- | --- |
| Unit | Nhanh | Ít hoặc giả lập |
| Integration | Trung bình hoặc chậm hơn | Component thật |
| E2E | Chậm và phức tạp | Nhiều component thật |

## 40.3. Test Design: Behavior, Boundary và Determinism

### Test behavior, không test implementation detail

Không tốt:

```java
assertEquals(3, service.internalCache.size());
```

Nếu cache là implementation detail, test này ngăn refactor dù behavior bên ngoài vẫn đúng.

Tốt hơn:

```java
assertEquals(expectedUser, service.findUser(userId));
```

### Boundary values

Nếu rule là “tuổi từ 18 trở lên được đăng ký”, cần test:

```text
17 -> reject
18 -> accept
19 -> accept
null -> reject hoặc contract được xác định
```

### Equivalence classes

Chia input thành những nhóm có behavior tương đương:

- Số dương hợp lệ.
- Zero.
- Số âm không hợp lệ.
- Null.
- Giá trị vượt giới hạn.

### Deterministic tests

Test không nên phụ thuộc vào thời gian hiện tại, random không có seed, thread scheduling, network thật không ổn định, thứ tự test hoặc file path của máy developer.

Inject Clock thay vì gọi Instant.now() trực tiếp:

```java
final class TokenService {

    private final Clock clock;

    TokenService(Clock clock) {
        this.clock = clock;
    }

    Instant issuedAt() {
        return Instant.now(clock);
    }
}
```

Test có thể dùng fixed Clock:

```java
Clock fixedClock = Clock.fixed(
        Instant.parse("2026-01-01T00:00:00Z"),
        ZoneOffset.UTC
);
```

## 40.4. JUnit 5 là gì?

JUnit 5 là thế hệ testing framework hiện đại của JUnit. Kiến trúc của nó gồm:

- JUnit Platform: hạ tầng discovery và execution.
- JUnit Jupiter: programming model và engine cho JUnit 5.
- JUnit Vintage: engine tương thích với một số test kiểu JUnit 3/4.

Các ví dụ trong chương dùng JUnit Jupiter APIs.

### Dependency Maven tối thiểu

```xml
<dependency>
    <groupId>org.junit.jupiter</groupId>
    <artifactId>junit-jupiter</artifactId>
    <version>YOUR_MANAGED_VERSION</version>
    <scope>test</scope>
</dependency>
```

Trong dự án Spring Boot, thường dùng test starter và để BOM quản lý version thay vì tự trộn nhiều version.

### Một test đơn giản

Production code:

```java
public final class Calculator {

    public int add(int a, int b) {
        return a + b;
    }
}
```

Test:

```java
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CalculatorTest {

    @Test
    void shouldReturnSumOfTwoNumbers() {
        Calculator calculator = new Calculator();

        int actual = calculator.add(2, 3);

        assertEquals(5, actual);
    }
}
```

Tên test nên mô tả behavior, chẳng hạn shouldRejectNegativeAmount hoặc shouldReturnEmptyWhenUserDoesNotExist, thay vì test1().

## 40.5. AAA Pattern và Test Fixture

Một unit test thường dùng Arrange -> Act -> Assert:

```java
@Test
void shouldApplyTenPercentDiscount() {
    // Arrange
    DiscountCalculator calculator =
            new DiscountCalculator();
    BigDecimal original =
            new BigDecimal("100.00");

    // Act
    BigDecimal actual =
            calculator.apply(original, 10);

    // Assert
    assertEquals(
            0,
            actual.compareTo(new BigDecimal("90.00"))
    );
}
```

Test fixture là dữ liệu và object được chuẩn bị để test chạy. Fixture nên nhỏ vừa đủ, nêu rõ dữ liệu quan trọng, không phụ thuộc trạng thái test khác và không dùng dữ liệu ngẫu nhiên nếu không seed.

## 40.6. JUnit 5 Assertions

Các assertions thường dùng:

```java
assertEquals()
assertNotEquals()
assertTrue()
assertFalse()
assertNull()
assertNotNull()
assertSame()
assertNotSame()
assertInstanceOf()
assertThrows()
assertDoesNotThrow()
assertAll()
assertTimeout()
assertTimeoutPreemptively()
```

### Message lazy

```java
assertEquals(
        expected,
        actual,
        () -> "Unexpected value: " + actual
);
```

Supplier message chỉ được gọi khi assertion fail.

### assertThrows

```java
@Test
void shouldRejectNegativeAmount() {
    IllegalArgumentException exception =
            assertThrows(
                    IllegalArgumentException.class,
                    () -> calculator.apply(
                            new BigDecimal("-10"),
                            10
                    )
            );

    assertEquals(
            "Amount cannot be negative",
            exception.getMessage()
    );
}
```

Nên kiểm tra type exception và message quan trọng. Không nên kiểm tra toàn bộ stack trace nếu message không phải contract.

### assertAll

```java
assertAll(
        () -> assertEquals(1L, user.id()),
        () -> assertEquals("Alice", user.name()),
        () -> assertTrue(user.active())
);
```

### assertTimeout

```java
assertTimeout(
        Duration.ofSeconds(2),
        () -> performOperation()
);
```

assertTimeout không nhất thiết cưỡng chế dừng execution ngay khi hết thời gian. assertTimeoutPreemptively chạy executable trong thread khác và cần cẩn thận với ThreadLocal, transaction context và resource gắn với thread.

## 40.7. JUnit Lifecycle

JUnit Jupiter cung cấp các lifecycle annotations:

```java
@BeforeAll
@AfterAll
@BeforeEach
@AfterEach
```

Ví dụ:

```java
class UserServiceTest {

    private UserService service;

    @BeforeEach
    void setUp() {
        service = new UserService(
                new InMemoryUserRepository()
        );
    }

    @AfterEach
    void tearDown() {
        // Cleanup nếu fixture mở resource
    }

    @Test
    void shouldFindUser() {
        // ...
    }
}
```

Mặc định, BeforeAll và AfterAll cần static method nếu test instance lifecycle mặc định. Có thể chọn per-class lifecycle, nhưng cần tránh shared mutable state giữa các tests.

## 40.8. Parameterized Tests

Parameterized test chạy cùng một behavior với nhiều bộ dữ liệu.

### ValueSource

```java
@ParameterizedTest
@ValueSource(strings = {"", " ", "   "})
void shouldRejectBlankNames(String name) {
    assertThrows(
            IllegalArgumentException.class,
            () -> new User(name)
    );
}
```

### NullSource, EmptySource và NullAndEmptySource

```java
@ParameterizedTest
@NullAndEmptySource
@ValueSource(strings = {" ", "\t"})
void shouldRejectBlankInput(String input) {
    assertTrue(input == null || input.isBlank());
}
```

### CsvSource

```java
@ParameterizedTest
@CsvSource({
        "0, 0, 0",
        "2, 3, 5",
        "-2, 3, 1"
})
void shouldAddNumbers(
        int left,
        int right,
        int expected) {

    assertEquals(
            expected,
            new Calculator().add(left, right)
    );
}
```

### MethodSource

```java
static Stream<Arguments> invalidAges() {
    return Stream.of(
            Arguments.of(-1),
            Arguments.of(150)
    );
}

@ParameterizedTest
@MethodSource("invalidAges")
void shouldRejectInvalidAge(int age) {
    assertThrows(
            IllegalArgumentException.class,
            () -> new User("Alice", age)
    );
}
```

MethodSource phù hợp khi fixture cần object phức tạp hoặc logic tạo dữ liệu.

### Hiển thị case bị lỗi

Nếu parameterized test có nhiều case nhưng failure message không cho biết input, test khó debug. Hãy dùng tên display có argument hoặc tạo một record argument có field mô tả.

## 40.9. Nested Tests, Tags và Disabled Tests

### Nested

Nested nhóm test theo context:

```java
class OrderServiceTest {

    @Nested
    class WhenOrderIsValid {

        @Test
        void shouldCreateOrder() {
            // ...
        }
    }

    @Nested
    class WhenStockIsInsufficient {

        @Test
        void shouldRejectOrder() {
            // ...
        }
    }
}
```

### Tag

```java
@Tag("integration")
class UserRepositoryIntegrationTest {
    // ...
}
```

Build tool có thể chạy riêng tag nhanh hoặc chậm.

### Disabled

Disabled có thể hữu ích tạm thời khi đang điều tra, nhưng test bị disable là khoản nợ kỹ thuật. Cần ghi lý do và issue theo dõi; không dùng để làm pipeline xanh giả tạo.

## 40.10. Mockito: Mock, Stub, Spy và Fake

Mockito là thư viện tạo test doubles.

| Loại | Ý nghĩa |
| --- | --- |
| Dummy | Object chỉ để truyền vào, không dùng |
| Stub | Trả dữ liệu định trước |
| Mock | Có thể verify interaction |
| Spy | Bọc object thật, một phần behavior thật |
| Fake | Implementation đơn giản nhưng chạy được, ví dụ in-memory repository |

Mock giúp cô lập dependency, nhưng test nhiều mock có thể tạo cảm giác code đúng trong khi integration thật sai.

### Unit test với Mockito

```java
@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository repository;

    @Mock
    private UserMapper mapper;

    @InjectMocks
    private UserService service;

    @Test
    void shouldReturnUserWhenFound() {
        User user = new User(1L, "Alice");
        UserDto dto = new UserDto(1L, "Alice");

        when(repository.findById(1L))
                .thenReturn(Optional.of(user));
        when(mapper.toDto(user))
                .thenReturn(dto);

        UserDto actual = service.findById(1L);

        assertEquals(dto, actual);
        verify(repository).findById(1L);
        verify(mapper).toDto(user);
    }
}
```

InjectMocks không phải dependency injection production. Mockito cố gắng tạo test subject và inject mocks theo constructor, setter hoặc field. Constructor injection trong production vẫn là lựa chọn rõ ràng hơn.

### Stub behavior

```java
when(repository.findById(99L))
        .thenReturn(Optional.empty());
```

### Throw exception

```java
when(gateway.charge(any()))
        .thenThrow(new PaymentTimeoutException());
```

### Verify interaction

```java
verify(repository).save(any(Order.class));
verifyNoMoreInteractions(repository);
```

verifyNoMoreInteractions có thể làm test quá phụ thuộc implementation. Chỉ dùng khi interaction boundary thật sự là contract.

### ArgumentCaptor

```java
ArgumentCaptor<Order> captor =
        ArgumentCaptor.forClass(Order.class);

verify(repository).save(captor.capture());

Order saved = captor.getValue();
assertEquals(customerId, saved.customerId());
```

Nếu object cần kiểm tra có thể trả về hoặc dùng value object rõ hơn, đừng lạm dụng captor.

### ArgumentMatcher

```java
when(repository.findByEmail(
        argThat(email -> email.endsWith("@example.com"))
)).thenReturn(Optional.of(user));
```

Matcher phức tạp có thể làm test khó đọc. Dữ liệu cụ thể thường tốt hơn matcher chung chung.

### Spy

Spy gọi behavior thật nếu không stub. Vì vậy spy có thể vô tình gọi database, network hoặc code side effect. Ưu tiên fake hoặc mock boundary rõ ràng.

## 40.11. Mockito Pitfalls

### Mock quá nhiều

Nếu một service cần 12 mocks để test một method, đó là tín hiệu:

- Class có quá nhiều responsibility.
- Dependency graph quá phức tạp.
- Test đang kiểm tra orchestration quá chi tiết.

Không phải lúc nào số mock lớn cũng sai, nhưng cần xem lại thiết kế.

### Mock value object hoặc DTO

Thường không cần mock object dữ liệu đơn giản:

```java
User user = new User(1L, "Alice");
```

Mock value object có thể tạo trạng thái không hợp lệ và làm test xa thực tế.

### Stubbing không được dùng

Nếu test khai báo when nhưng production code không gọi, test có thể đang chuẩn bị sai scenario. Strict stubbing giúp phát hiện một số trường hợp này.

### Verify thứ tự không cần thiết

Không nên verify a() phải chạy trước b() nếu business contract không yêu cầu thứ tự. Test chỉ cần kiểm tra observable result hoặc interaction thực sự quan trọng.

## 40.12. Integration Testing

Integration test dùng một hoặc nhiều component thật để kiểm tra boundary.

Ví dụ repository:

```java
@DataJpaTest
class UserRepositoryTest {

    @Autowired
    private UserRepository repository;

    @Test
    void shouldFindUserByEmail() {
        // Seed fixture, persist, query và assert
    }
}
```

### Khi integration test đáng giá?

- Query phụ thuộc dialect cụ thể.
- Mapping ORM phức tạp.
- Transaction và constraint quan trọng.
- Serialization contract cần xác minh.
- HTTP client cần kiểm tra timeout, header hoặc retry.

### Integration test không phải unit test chậm

Nó kiểm tra wiring, serialization, transaction, database hoặc network behavior. Vì vậy cần dữ liệu, lifecycle và cleanup rõ hơn unit test.

## 40.13. Spring Boot Testing Strategy

### SpringBootTest

Load Spring ApplicationContext lớn, phù hợp khi cần kiểm tra nhiều bean phối hợp:

```java
@SpringBootTest
class ApplicationContextTest {

    @Test
    void contextLoads() {
    }
}
```

Không dùng cho mọi test service vì context startup làm test chậm và lỗi khó định vị.

Mặc định, `@SpringBootTest` không nhất thiết mở server thật. Nếu cần HTTP server thật, dùng web environment random port; nếu chỉ cần MVC layer, MockMvc thường nhanh hơn. Khi client và server chạy ở các thread khác nhau, transaction của test không tự động bao phủ transaction phía server.

### WebMvcTest

Thường chỉ load web slice để kiểm tra controller, mapping, validation và serialization:

```java
@WebMvcTest(UserController.class)
class UserControllerTest {

    @Autowired
    MockMvc mockMvc;

    @MockBean
    UserService userService;
}
```

Trong các version Spring Boot mới, một số annotation mock bean có thể có API thay đổi hoặc bị thay thế. Hãy theo dependency version của dự án.

Với Spring Framework hoặc Spring Boot hiện đại, có thể gặp `@MockitoBean` và `@MockitoSpyBean`; `@MockBean` thường xuất hiện trong các codebase hoặc tài liệu Spring Boot cũ hơn. Ý tưởng không đổi: đăng ký test double vào ApplicationContext. Hãy kiểm tra version thực tế trước khi copy annotation.

### DataJpaTest

Phù hợp với repository/JPA slice. Transaction test thường được rollback theo cấu hình test của Spring, nhưng cần hiểu khi nào test gọi external transaction hoặc commit thực sự.

### MockMvc

MockMvc mô phỏng request MVC trong JVM, không nhất thiết mở server socket:

```java
mockMvc.perform(
        get("/api/users/{id}", 1L)
                .accept(MediaType.APPLICATION_JSON)
    )
    .andExpect(status().isOk())
    .andExpect(jsonPath("$.name").value("Alice"));
```

Nó phù hợp kiểm tra routing, validation và response shape, nhưng không chứng minh network stack production hoặc reverse proxy behavior.

### HTTP stack thật

Khi cần kiểm tra server socket, filter, serialization và HTTP client thật, có thể chạy application với random port. Cách này gần production hơn nhưng chậm hơn MockMvc.

## 40.14. Database Test và Test Isolation

Một test database tốt cần:

- Schema đúng với production engine hoặc đủ gần.
- Fixture độc lập.
- Cleanup deterministic.
- Không phụ thuộc thứ tự test.
- Không chia sẻ dữ liệu mutable giữa test.

### H2 và database thật

H2 có thể khác PostgreSQL hoặc MySQL ở:

- SQL dialect.
- JSON hoặc array type.
- Constraint.
- Transaction isolation.
- Index và query planner.
- Date/time behavior.

Nếu production dùng PostgreSQL, một số integration test quan trọng nên chạy PostgreSQL thật hoặc cùng engine qua container.

### Transaction rollback không phải thuốc chữa mọi thứ

Rollback có thể không bao phủ external service, message đã publish, file đã ghi, transaction propagation khác hoặc dữ liệu commit ở thread khác.

Test cần xác định side effects ngoài database và cleanup riêng.

## 40.15. Testcontainers

Testcontainers cho phép test khởi chạy dependency thật trong container Docker, chẳng hạn PostgreSQL, MySQL, Redis, Kafka hoặc Elasticsearch.

### Khi nên dùng?

- H2 không mô phỏng đúng production database.
- Cần test migration, constraint hoặc dialect.
- Cần kiểm tra integration với broker/cache.
- Muốn environment reproducible trong CI.

### Ví dụ PostgreSQL

```java
@Testcontainers
class UserRepositoryPostgresTest {

    @Container
    static final PostgreSQLContainer<?> postgres =
            new PostgreSQLContainer<>("postgres:16-alpine")
                    .withDatabaseName("testdb")
                    .withUsername("testuser")
                    .withPassword("testpass");

    @DynamicPropertySource
    static void configureProperties(
            DynamicPropertyRegistry registry) {

        registry.add(
                "spring.datasource.url",
                postgres::getJdbcUrl
        );
        registry.add(
                "spring.datasource.username",
                postgres::getUsername
        );
        registry.add(
                "spring.datasource.password",
                postgres::getPassword
        );
    }
}
```

Version image phải được pin và cập nhật có chủ đích. Không nên dùng latest trong test quan trọng vì kết quả có thể thay đổi theo thời gian.

### Chi phí và isolation

Testcontainers cần Docker daemon, startup chậm hơn in-memory database và có thể cần quản lý CPU, memory, image pull và parallel execution.

Dùng container chung có thể nhanh hơn nhưng dễ chia sẻ state giữa tests. Container static thường được dùng chung cho các method trong một test class; container instance thường được khởi động lại theo test method. Cần reset database hoặc tạo schema riêng. Tốc độ không được đánh đổi isolation.

JUnit extension của Testcontainers cần được cân nhắc khi bật parallel test execution; hãy kiểm tra giới hạn version và tránh cho các tests cùng mutate một container state nếu chưa thiết kế isolation.

## 40.16. Testing Exception, Time và Randomness

### Test exception

```java
@Test
void shouldRejectExpiredToken() {
    TokenExpiredException exception =
            assertThrows(
                    TokenExpiredException.class,
                    () -> tokenService.validate(expiredToken)
            );

    assertEquals("Token expired", exception.getMessage());
}
```

### Inject Clock

```java
class SubscriptionService {

    private final Clock clock;

    SubscriptionService(Clock clock) {
        this.clock = clock;
    }

    boolean isExpired(Instant expiresAt) {
        return !expiresAt.isAfter(Instant.now(clock));
    }
}
```

### Inject random source

Nếu code tạo token hoặc sampling, inject một source có thể kiểm soát trong test. Với cryptographic random, không thay thế production SecureRandom bằng Random chỉ để test; hãy thiết kế boundary để test behavior an toàn.

## 40.17. Testing Concurrency

Concurrency test khó vì scheduling không deterministic.

### Không dùng Thread.sleep làm synchronization

Không tốt:

```java
thread.start();
Thread.sleep(100);
assertTrue(result.isDone());
```

100 ms có thể quá ngắn trên CI hoặc quá dài khiến test chậm. Dùng CountDownLatch, Future, barrier hoặc thư viện wait có điều kiện phù hợp với contract.

### Ví dụ với CountDownLatch

```java
CountDownLatch started = new CountDownLatch(1);
CountDownLatch release = new CountDownLatch(1);

Thread worker = Thread.startVirtualThread(() -> {
    started.countDown();
    try {
        release.await();
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
});

assertTrue(started.await(1, TimeUnit.SECONDS));
release.countDown();
worker.join();
```

Một test chạy xanh một lần không chứng minh code thread-safe. Cần kiểm soát start gate, assert invariant cuối cùng, lặp với giới hạn hợp lý và tránh phụ thuộc timing tùy ý.

## 40.18. Debugging là gì?

Debugging là quá trình xác định nguyên nhân của behavior không mong đợi bằng evidence.

Quy trình cơ bản:

1. Mô tả symptom.
2. Tạo reproduction nhỏ nhất.
3. Thu thập input, state và stack trace.
4. Đặt hypothesis.
5. Dùng breakpoint, log hoặc test để kiểm tra.
6. Sửa nguyên nhân.
7. Thêm regression test.
8. Xác minh cả fix và tác động phụ.

Debugging không nên bắt đầu bằng việc thay đổi ngẫu nhiên nhiều dòng code.

### Symptom và root cause

HTTP 500 chỉ là symptom. Root cause có thể là:

- Null reference từ request mapping.
- Database timeout.
- Dữ liệu không hợp lệ.
- Circuit breaker đang open.
- Race condition.
- Memory pressure.

Đừng sửa status code hoặc thêm catch tổng quát chỉ để che symptom khi chưa biết nguyên nhân.

## 40.19. Breakpoints và Debugger

Các khái niệm cần biết:

- Breakpoint: dừng tại dòng hoặc method.
- Conditional breakpoint: chỉ dừng khi condition đúng.
- Logpoint: ghi state mà không dừng.
- Exception breakpoint: dừng khi exception được throw hoặc catch.
- Step Into: đi vào method.
- Step Over: chạy qua method hiện tại.
- Step Out: chạy đến khi thoát method.
- Evaluate expression: tính thử expression trong context hiện tại.
- Watch: theo dõi biến hoặc expression.

### Breakpoint tốt

Đặt breakpoint tại:

- Boundary nhận input.
- Nơi state sai bắt đầu.
- Dòng map dữ liệu từ external source.
- Nơi exception được wrap.
- Điểm trước và sau side effect.

Đặt breakpoint ở mọi dòng thường làm mất mô hình nguyên nhân và tốn thời gian.

### Conditional breakpoint

Nếu bug chỉ xảy ra với orderId = 42, condition giúp bỏ qua hàng trăm request hợp lệ.

Không nên đặt condition có side effect hoặc gọi method làm thay đổi state.

### Debug nhiều thread

Khi dừng một thread trong ứng dụng concurrent:

- Thread khác có thể tiếp tục chạy.
- Lock state có thể thay đổi.
- Timing bug có thể biến mất.
- Breakpoint có thể làm thay đổi scheduling.

Vì vậy debugger rất hữu ích để quan sát nhưng không phải bằng chứng duy nhất cho race condition.

## 40.20. Đọc Stack Trace

Stack trace thường gồm:

- Tên exception.
- Message.
- Cause chain.
- Stack frames.
- Suppressed exceptions.

Ví dụ:

```text
java.lang.IllegalStateException: Cannot publish order
    at com.example.OrderService.publish(OrderService.java:42)
    at com.example.OrderController.create(OrderController.java:27)
Caused by: java.net.SocketTimeoutException: Read timed out
    at ...
```

### Đọc từ đâu?

1. Đọc exception type và message.
2. Tìm caused-by gần nguyên nhân gốc.
3. Tìm frame đầu tiên thuộc application code.
4. Kiểm tra input và state tại dòng đó.
5. Xem suppressed exceptions nếu là resource cleanup.

Frame đầu tiên luôn là root cause không? Không. Framework và wrapper có thể nằm giữa. Cần lần theo cause và code của ứng dụng.

### Helpful NullPointerException

Java hiện đại có thể cung cấp thông tin chi tiết hơn về expression gây null. Đây là trợ giúp debug, không thay thế việc thiết kế null contract và validation.

## 40.21. Logging để Debug

Log debug nên có context:

```java
log.debug(
        "Loading order: orderId={}, customerId={}",
        orderId,
        customerId
);
```

Tránh:

- Log password hoặc token.
- Log toàn bộ object có secret.
- Log PII không cần thiết.
- Dùng log thay cho metric hoặc trace.

### Log level

| Level | Dùng cho |
| --- | --- |
| ERROR | Failure cần xử lý hoặc alert |
| WARN | Tình huống bất thường nhưng hệ thống còn hoạt động |
| INFO | Business lifecycle quan trọng |
| DEBUG | Chi tiết phục vụ điều tra |
| TRACE | Chi tiết rất nhỏ, thường chỉ bật tạm |

Không nên log cùng một lỗi ở mọi layer với cùng message.

### Correlation ID

Trong distributed system, requestId hoặc traceId giúp nối log qua nhiều service. ID này không thay thế authorization hoặc không được chứa secret.

## 40.22. JVM Diagnostic Tools

Một số JDK tools hữu ích:

### jcmd

Gửi diagnostic command tới process JVM:

```bash
jcmd
jcmd <pid> VM.version
jcmd <pid> Thread.print
jcmd <pid> GC.heap_info
```

### jstack

In thread dump:

```bash
jstack <pid>
```

Hữu ích khi điều tra deadlock, thread blocked hoặc thread pool không giải phóng.

### jmap

Có thể dùng để xem heap hoặc tạo heap dump tùy option/JDK:

```bash
jmap -histo:live <pid>
```

Các lệnh này có thể tạo pause hoặc tốn tài nguyên; không chạy tùy tiện trên production nhạy latency.

### Java Flight Recorder

JFR thu thập event về CPU, allocation, locks, GC và nhiều runtime signal:

```bash
jcmd <pid> JFR.start name=debug settings=profile duration=60s filename=recording.jfr
```

Cần tuân theo quyền truy cập và chính sách dữ liệu khi thu thập recording.

## 40.23. Debugging Memory và GC

Khi gặp memory issue:

1. Xác định heap hay native memory.
2. Kiểm tra OutOfMemoryError message cụ thể.
3. Theo dõi heap after GC, allocation rate và live set.
4. Lấy heap dump nếu an toàn.
5. Tìm retaining path tới object lớn.
6. Kiểm tra cache, static collection, ThreadLocal và listener.

Heap usage cao không tự động là memory leak. Một cache bounded có thể chủ động giữ memory.

### Heap dump

Heap dump giúp trả lời:

- Object type nào chiếm nhiều memory?
- Ai đang giữ reference tới chúng?
- Collection nào tăng không giới hạn?

Heap dump có thể chứa dữ liệu người dùng. Hãy lưu trữ, truyền và xóa nó theo chính sách bảo mật.

## 40.24. Debugging Deadlock

Deadlock xảy ra khi threads chờ tài nguyên theo vòng:

```text
Thread A holds Lock 1 -> waits for Lock 2
Thread B holds Lock 2 -> waits for Lock 1
```

Dấu hiệu:

- Request không hoàn thành.
- CPU có thể thấp.
- Thread dump hiển thị BLOCKED.
- JVM có thể báo deadlock trong một số diagnostic output.

Biện pháp:

- Giữ thứ tự lock nhất quán.
- Giảm số lock đồng thời.
- Dùng timeout lock khi phù hợp.
- Tránh gọi external code trong critical section.
- Dùng immutable data hoặc message passing khi có thể.

## 40.25. Code Coverage

Coverage đo phần code được chạy bởi test, thường gồm:

- Line coverage.
- Branch coverage.
- Method coverage.
- Instruction coverage.

### Coverage không đồng nghĩa quality

Một test có thể chạy qua dòng code nhưng không assert kết quả có ý nghĩa:

```java
service.process(input);
assertTrue(true);
```

Coverage cao vẫn có thể bỏ sót giá trị biên, race condition, contract giữa service, SQL dialect và security issue.

### Dùng coverage như signal

Coverage hữu ích để tìm vùng code chưa có test. Không nên đặt một con số duy nhất làm mục tiêu và khuyến khích test vô nghĩa để đạt phần trăm.

### Branch coverage quan trọng hơn line coverage trong rule

Một dòng if có thể được chạy nhưng nhánh false chưa từng được kiểm tra. Với domain policy, cần thiết kế test cho từng nhánh và boundary quan trọng.

## 40.26. Mutation Testing

Mutation testing tạo thay đổi nhỏ có chủ ý trong production code, chẳng hạn:

- Đổi greater-than thành greater-than-or-equal.
- Xóa một condition.
- Đổi return value.

Nếu test vẫn xanh, test suite có thể chưa đủ nhạy.

Mutation score thường đắt hơn coverage vì phải chạy nhiều biến thể. Phù hợp với domain logic quan trọng, không nhất thiết chạy mọi commit.

## 40.27. Maven Fundamentals

Maven dùng pom.xml để mô tả project, dependencies và build lifecycle.

### Cấu trúc phổ biến

```text
src/
  main/
    java/
    resources/
  test/
    java/
    resources/
pom.xml
```

### Dependency scope

Một số scope:

- compile: cần cho compile và runtime thông thường.
- test: chỉ dùng trong test compile/runtime.
- provided: môi trường cung cấp khi deploy.
- runtime: cần runtime nhưng không nhất thiết compile trực tiếp.

### Lifecycle

Các phase thường gặp:

```bash
mvn test
mvn package
mvn verify
mvn install
```

package tạo artifact sau các phase trước đó. verify phù hợp làm quality checks sau integration test nếu plugin được cấu hình.

### Surefire và Failsafe

Thông thường:

- Surefire chạy unit tests trong phase test.
- Failsafe dùng cho integration tests với lifecycle phù hợp.

Tên test và plugin configuration quyết định test nào được discovery.

### Dependency tree

```bash
mvn dependency:tree
```

Hữu ích khi có version conflict hoặc dependency transitively xuất hiện ngoài ý muốn.

## 40.28. Gradle Fundamentals

Gradle dùng build.gradle hoặc build.gradle.kts.

### Cấu trúc cơ bản

```groovy
plugins {
    id 'java'
}

repositories {
    mavenCentral()
}

dependencies {
    testImplementation 'org.junit.jupiter:junit-jupiter:VERSION'
}

tasks.named('test') {
    useJUnitPlatform()
}
```

### Tasks thường gặp

```bash
./gradlew test
./gradlew build
./gradlew dependencies
```

Trên Windows thường dùng:

```powershell
.\gradlew.bat test
```

Gradle Wrapper pin version để developer và CI dùng cùng build tool.

## 40.29. JAR Packaging và Build Reproducibility

JAR là archive chứa class files, resources và metadata.

Kiểm tra nội dung:

```bash
jar tf build/libs/app.jar
```

Một build tốt nên:

- Pin hoặc quản lý version dependency có chủ đích.
- Dùng wrapper.
- Không phụ thuộc file local ngoài source/config test.
- Có test chạy trong môi trường sạch.
- Không đóng secret vào JAR.

Artifact build thành công chỉ chứng minh compile/package thành công. Cần thêm test, security scan, configuration validation và deployment verification tùy pipeline.

## 40.30. CI Test Pipeline

Một pipeline Java Backend thường có thể gồm:

```text
Compile
  -> Unit Tests
  -> Static Analysis
  -> Integration Tests
  -> Package
  -> Security/Dependency Checks
  -> Publish Artifact
```

### Tối ưu pipeline

- Chạy unit test nhanh ở mọi pull request.
- Cache dependency an toàn.
- Chạy integration test song song khi isolation cho phép.
- Tách test cần Docker.
- Thu thập test report và log khi fail.
- Không bỏ qua test fail bằng cách disable tạm thời không có issue.

### Flaky test

Flaky test lúc xanh lúc đỏ với cùng code làm mất niềm tin pipeline.

Nguyên nhân:

- Timing race.
- Shared state.
- Timezone hoặc locale của máy CI.
- Network không ổn định.
- Test order dependency.
- Random seed không cố định.

Không nên retry vô hạn để che flaky test. Hãy điều tra và sửa nguyên nhân.

## 40.31. Test Organization trong Backend

Một cấu trúc:

```text
src/main/java/com/example/order/OrderService.java
src/test/java/com/example/order/OrderServiceTest.java
src/test/java/com/example/order/OrderServiceIntegrationTest.java
src/test/resources/
```

Tên test nên giúp phân biệt unit, integration, contract và E2E. Có thể dùng package, suffix hoặc tags; điều quan trọng là build có thể chọn nhóm test rõ ràng.

## 40.32. Những Anti-pattern Testing phổ biến

### Test phụ thuộc thứ tự

Test B chỉ chạy sau test A vì dùng database state của A. Đây là lỗi isolation.

### Test quá lớn

Một test có 50 bước và failure ở bước cuối khó debug. Tách theo behavior, không nhất thiết mỗi dòng một test.

### Test implementation detail

Verify mọi method call private khiến refactor khó. Ưu tiên public behavior.

### Mock external system ở integration test

Nếu mục tiêu là kiểm tra integration với database, mock repository sẽ biến test thành unit test giả danh.

### Snapshot hoặc assertion quá rộng

Assert toàn bộ object hoặc JSON khổng lồ có thể khiến thay đổi không liên quan làm nhiều test fail. Assert contract cần thiết, nhưng đừng bỏ sót field quan trọng.

### Test không có assertion

Method chạy mà không fail không chứng minh behavior đúng.

### Catch exception trong test rồi bỏ qua

Không tốt:

```java
try {
    service.process();
} catch (Exception ignored) {
}
```

Dùng assertThrows hoặc để test fail tự nhiên.

## 40.33. Testing Security và Failure Cases

Backend test không chỉ kiểm tra happy path:

- User không có quyền.
- Input quá dài.
- SQL, HTML hoặc JSON injection payload.
- Token hết hạn.
- Replay request.
- Duplicate webhook.
- Rate limit.
- File vượt kích thước.
- Timeout external provider.
- Database constraint violation.

Test không thay thế security review, nhưng giúp bảo vệ security contract khỏi regression.

### Không đưa secret vào test

Không commit password thật, access token thật, private key production hoặc database credential thật.

Dùng test secret giả và secret injection của CI khi cần.

## 40.34. Bài tập thực hành

### Bài 1 — Money value object

Xây dựng Money:

- Không cho amount null.
- Không cho currency null.
- Không cho amount âm.
- Có add cùng currency.
- Ném exception nếu cộng khác currency.
- Viết unit test cho zero, scale và currency mismatch.

### Bài 2 — Order service

Thiết kế service với:

- OrderRepository.
- PaymentGateway.
- EventPublisher.

Viết test:

- Tạo order thành công.
- Payment bị timeout.
- Payment bị decline.
- Repository không được gọi nếu input invalid.
- Event chỉ publish sau khi payment thành công.

### Bài 3 — Boundary testing

Với rule điểm hợp lệ từ 0 đến 100, viết parameterized test cho:

```text
-1, 0, 1, 99, 100, 101
```

### Bài 4 — Debugging

Tạo một lỗi:

- NullPointerException.
- NumberFormatException.
- Deadlock giữa hai thread.
- Memory retention qua static list.

Dùng debugger, stack trace và JVM diagnostic tool để xác định nguyên nhân. Sau đó thêm regression test hoặc tài liệu giải thích.

### Bài 5 — Integration

Viết repository integration test với database engine thật bằng Testcontainers. Kiểm tra migration, unique constraint, query theo filter và transaction rollback.

## 40.35. Câu hỏi phỏng vấn

### Clean Code

1. Clean Code khác code ngắn như thế nào?
2. SRP có nghĩa mỗi class chỉ được có một method không?
3. DRY có nên áp dụng cho mọi đoạn code giống nhau không?
4. DIP khác DI thế nào?
5. final có làm object immutable không?
6. Tại sao defensive copy cần thiết với List?
7. Khi nào dùng Optional, khi nào trả collection rỗng?
8. Vì sao không nên log rồi throw lại ở mọi layer?
9. Code smell là gì? Nó có đồng nghĩa bug không?
10. Constructor injection giúp ích gì cho test?

### Testing

11. Unit test và integration test khác nhau ở boundary nào?
12. Vì sao test coverage cao chưa chắc code quality cao?
13. assertThrows dùng để kiểm tra gì?
14. assertTimeout khác assertTimeoutPreemptively thế nào?
15. Parameterized test phù hợp với trường hợp nào?
16. Mock, stub, spy và fake khác nhau ra sao?
17. Vì sao mock quá nhiều là dấu hiệu cần xem lại thiết kế?
18. SpringBootTest khác WebMvcTest thế nào?
19. Khi nào H2 có thể tạo confidence giả so với PostgreSQL?
20. Testcontainers giải quyết vấn đề gì và đánh đổi gì?
21. Làm sao test code phụ thuộc thời gian hiện tại?
22. Vì sao Thread.sleep không phải synchronization tốt trong test?
23. Flaky test là gì? Cách điều tra?
24. Surefire và Failsafe thường dùng ở phase nào?
25. JUnit Platform, Jupiter và Vintage khác nhau thế nào?

### Debugging

26. Đọc stack trace từ đâu?
27. Caused-by và suppressed exception khác nhau thế nào?
28. Khi nào dùng conditional breakpoint?
29. Làm sao điều tra deadlock?
30. Heap dump và thread dump phục vụ hai loại vấn đề nào?
31. OutOfMemoryError có luôn có nghĩa heap đầy không?
32. Vì sao log production không nên chứa token?
33. Làm thế nào tạo reproduction nhỏ nhất cho một bug?

## 40.36. Testing Code hiện đại trong Java 21

### Records

Record thường có equality dựa trên components. Test nên kiểm tra behavior mà application sử dụng:

```java
@Test
void shouldCreateEquivalentUserResponses() {
    UserResponse first = new UserResponse(1L, "Alice");
    UserResponse second = new UserResponse(1L, "Alice");

    assertEquals(first, second);
    assertEquals(first.hashCode(), second.hashCode());
}
```

Nếu record nhận collection, cần test defensive copy:

```java
@Test
void shouldNotExposeMutableInputList() {
    List<String> input = new ArrayList<>();
    input.add("Alice");

    Group group = new Group(input);
    input.add("Bob");

    assertEquals(List.of("Alice"), group.members());
}
```

### Sealed hierarchy và switch

Sealed hierarchy cho phép compiler kiểm tra exhaustive switch. Test runtime nên tập trung vào mapping behavior của từng subtype:

```java
@ParameterizedTest
@MethodSource("paymentResults")
void shouldDescribePaymentResult(
        PaymentResult result,
        String expectedMessage) {

    assertEquals(
            expectedMessage,
            presenter.describe(result)
    );
}
```

Nếu thêm permitted subtype, compile failure ở switch chưa exhaustive là một tín hiệu hữu ích. Không nên thêm default chỉ để im lặng compiler nếu domain thực sự muốn biết khi hierarchy thay đổi.

### Pattern matching và null

Nếu switch hoặc instanceof có xử lý null, test explicit null case. Đừng giả định pattern type case tự bắt null.

### Virtual threads

Test virtual-thread code không nên phụ thuộc vào:

- Tên thread cụ thể.
- Số platform threads nội bộ.
- Timing chính xác theo millisecond.
- Thứ tự scheduling không nằm trong contract.

Nên kiểm tra:

- Task hoàn thành.
- Cancellation hoặc interruption được truyền đúng.
- Resource được đóng.
- Invariant dữ liệu không bị phá vỡ.

### Text blocks và JSON

Khi test text block hoặc JSON, nên assert semantic structure nếu có parser thay vì so sánh whitespace tuyệt đối. So sánh nguyên văn chỉ phù hợp khi formatting là một phần của contract.

### Date/time và BigDecimal

Inject Clock, dùng zone rõ ràng và so sánh BigDecimal theo contract nghiệp vụ. Không để timezone của máy chạy test quyết định kết quả.

## 40.37. Pre-merge Quality Checklist

Trước khi merge một thay đổi Java Backend, có thể kiểm tra theo thứ tự:

1. Code có compile bằng JDK/version mà project công bố không?
2. Unit tests có chạy nhanh và deterministic không?
3. Boundary và invalid input quan trọng đã có test chưa?
4. Integration tests có dùng dependency đúng mức fidelity cần thiết không?
5. Test có để lại database, file, container, thread hoặc executor không?
6. Có flaky test hoặc test order dependency không?
7. Exception có giữ cause và trả lỗi đúng boundary không?
8. Log có chứa secret hoặc PII không?
9. Dependency mới có scope và version phù hợp không?
10. JAR/artifact có chứa file local hoặc secret không?
11. Thay đổi có ảnh hưởng memory, thread, latency hoặc transaction không?
12. Diff có một responsibility rõ ràng và dễ review không?

Một pipeline xanh chỉ là một phần bằng chứng. Cần kết hợp test result, code review, static analysis, security checks và kiểm tra runtime phù hợp với mức rủi ro.

# TỔNG KẾT PHẦN 13

Clean Code không phải là một bộ luật để làm code “đẹp” theo cảm tính. Nó là cách giảm chi phí đọc, thay đổi, kiểm thử và vận hành phần mềm.

Testing không chỉ là viết nhiều assertion. Một test tốt phải bảo vệ behavior quan trọng, deterministic, cô lập đúng boundary và phản ánh rủi ro thực tế.

Debugging không phải phỏng đoán. Nó là quá trình thu thập evidence từ input, state, stack trace, logs, metrics, debugger và JVM tools.

Với Java Backend Junior/Junior+, cần ghi nhớ:

- Đặt tên theo domain.
- Giữ responsibility và dependency rõ.
- Ưu tiên immutable value khi phù hợp.
- Không nuốt exception hoặc log secret.
- Viết unit test nhanh cho domain logic.
- Dùng integration test cho boundary có rủi ro thực.
- Không nhầm coverage với quality.
- Không dùng sleep để đồng bộ test concurrency.
- Dùng Clock, fake và test fixture deterministic.
- Dùng database thật hoặc container khi dialect và integration là phần cần kiểm chứng.
- Mỗi bug quan trọng nên dẫn tới một regression test hoặc ít nhất một kiểm tra tự động phù hợp.

# TÀI LIỆU THAM KHẢO

- JUnit 5 User Guide: https://docs.junit.org/5.14.4/user-guide/
- JUnit Jupiter API: https://docs.junit.org/5.14.4/api/org.junit.jupiter.api/
- Mockito Documentation: https://javadoc.io/doc/org.mockito/mockito-core/latest/org/mockito/Mockito.html
- Spring Boot Testing Documentation: https://docs.spring.io/spring-boot/reference/testing/index.html
- Spring Framework Mockito Test Annotations: https://docs.spring.io/spring-framework/reference/testing/annotations/integration-spring/annotation-mockitobean.html
- Testcontainers Documentation: https://java.testcontainers.org/
- Apache Maven Introduction: https://maven.apache.org/guides/getting-started/
- Gradle Java Testing Documentation: https://docs.gradle.org/current/userguide/java_testing.html
- Oracle Java SE 21 Documentation: https://docs.oracle.com/en/java/javase/21/
