# JAVA CORE 21 — PHẦN 12: REFLECTION, ANNOTATIONS, NETWORKING & ADVANCED CONCEPTS

Giáo trình Java SE 21 · Từ cơ bản đến Junior/Junior+ Backend Developer

Đây là phần giúp bạn hiểu sâu hơn về cách các framework Java hoạt động.

Khi viết Spring Boot:

```java
@RestController
@RequestMapping("/api/users")
public class UserController {

    @GetMapping("/{id}")
    public UserDto getUser(@PathVariable Long id) {
        return new UserDto(id, "Alice");
    }
}
```

Bạn không trực tiếp tạo instance của Controller, không tự viết logic đọc annotation và cũng không cần lập trình HTTP server từ đầu.

Framework phải tìm class, đọc metadata, tạo object, phân giải dependency, invoke method, tạo proxy và xử lý network. Reflection, Annotations, Networking và những Core APIs trong phần này là nền tảng để hiểu các cơ chế đó.

## Mục tiêu học tập

Sau phần này, bạn cần có khả năng:

- Đọc và phân tích class metadata bằng Reflection.
- Phân biệt class literal, runtime class và dynamic class loading.
- Tìm field, method, constructor đúng phạm vi.
- Hiểu access control của Reflection trong Java Module System.
- Tạo object và invoke method động có kiểm soát.
- Thiết kế custom annotation với retention và target phù hợp.
- Phân biệt runtime annotation processing và compile-time annotation processing.
- Dùng TCP, UDP, Socket và Java HttpClient ở mức nền tảng.
- Xây dựng HTTP request có timeout, header và status handling đúng.
- Hiểu ServiceLoader, MethodHandle, class identity và module boundaries.
- Dùng logging, Locale, ResourceBundle, ProcessBuilder, MessageDigest và SecureRandom an toàn hơn.

## Nội dung Phần 12

| Chương | Chủ đề | Trọng tâm |
| --- | --- | --- |
| 35 | Java Reflection API | Class metadata, fields, methods, constructors, dynamic invocation |
| 36 | Java Annotations | Built-in annotations, meta-annotations, runtime processing, annotation processing |
| 37 | Java Networking & HTTP Client | TCP, UDP, sockets, HTTP, HttpClient, timeouts và security |
| 38 | Advanced Java Core Concepts | Enum, nested classes, class identity, ServiceLoader, MethodHandle, modules và utilities |

# CHƯƠNG 35. JAVA REFLECTION API

## 35.1. Reflection là gì?

Reflection là cơ chế cho phép chương trình Java kiểm tra thông tin về classes, interfaces, constructors, fields, methods và annotations tại runtime. Trong một số giới hạn, chương trình cũng có thể tạo object, đọc hoặc ghi field và invoke method động.

Thông thường, compiler biết kiểu và lời gọi method ngay từ source code:

```java
User user = new User("Alice");
System.out.println(user.getName());
```

Nhưng framework thường chỉ biết tên class ở runtime:

```text
com.example.service.UserService
```

Framework có thể cần:

1. Tìm class theo tên.
2. Kiểm tra annotation.
3. Chọn constructor hoặc factory.
4. Tạo instance.
5. Tìm method có annotation.
6. Invoke method khi có request hoặc event.

### Vì sao Reflection ra đời?

Code tĩnh có ưu điểm là compiler kiểm tra type và invocation rõ ràng. Tuy nhiên, framework tổng quát phải hoạt động với những class mà tác giả framework chưa biết trước.

Ví dụ:

- Dependency Injection container không thể hard-code mọi service.
- Test framework cần tìm method có annotation.
- Serialization library cần đọc fields hoặc accessor.
- Plugin system cần load implementation bên ngoài.
- ORM cần đọc entity metadata và tạo object.

Reflection đổi một phần thông tin compile-time thành metadata có thể kiểm tra ở runtime.

### Đánh đổi

Reflection có giá trị ở infrastructure layer nhưng có chi phí:

- Một số lỗi chỉ phát hiện khi chạy.
- Code khó refactor bằng compiler.
- Invocation có thêm overhead.
- Module boundary và access control phức tạp.
- Native image hoặc AOT cần cấu hình metadata.
- Input class hoặc method name không tin cậy có thể tạo rủi ro bảo mật.

Business code thông thường nên ưu tiên interface và direct call. Reflection nên được cô lập trong framework, adapter hoặc infrastructure layer.

## 35.2. Class là gì?

`java.lang.Class<T>` biểu diễn runtime class hoặc interface metadata.

Mỗi class được định nghĩa bởi một defining class loader có một Class object tương ứng trong runtime. Tên class giống nhau nhưng defining class loader khác nhau có thể tạo ra hai runtime types khác nhau.

Ví dụ:

```java
public class User {

    private String name;

    public User(String name) {
        this.name = name;
    }

    public String getName() {
        return name;
    }
}
```

Lấy metadata:

```java
Class<?> clazz = User.class;

System.out.println(clazz.getName());
System.out.println(clazz.getSimpleName());
```

Nếu User thuộc package com.example, kết quả tương ứng là:

```text
com.example.User
User
```

### Ba cách lấy Class object

#### Class literal

```java
Class<User> userClass = User.class;
```

Dùng khi biết type tại compile time và không cần tạo instance User.

#### getClass()

```java
Object value = new String("Java");
Class<?> runtimeClass = value.getClass();

System.out.println(runtimeClass.getName());
```

Kết quả là java.lang.String, không phải java.lang.Object, vì getClass trả runtime type của object thật.

#### Class.forName()

```java
Class<?> clazz =
        Class.forName("com.example.User");
```

Dùng khi class name chỉ có tại runtime. Overload một tham số có initialization behavior theo contract của Class.forName. Overload đầy đủ cho phép kiểm soát initialization và class loader:

```java
Class<?> clazz = Class.forName(
        "com.example.User",
        false,
        Thread.currentThread().getContextClassLoader()
);
```

Nếu không tìm thấy class, có thể ném ClassNotFoundException.

### Class<?> và Class<T>

```java
Class<User> userClass = User.class;
Class<?> unknownClass = User.class;
```

Class<User> giữ type information cụ thể. Class<?> dùng khi framework xử lý nhiều loại class mà chưa biết type argument cụ thể.

### Methods thường dùng

```java
Class<?> clazz = User.class;

clazz.getName();
clazz.getSimpleName();
clazz.getCanonicalName();
clazz.getPackageName();
clazz.getSuperclass();
clazz.getInterfaces();
clazz.getModifiers();
clazz.isInterface();
clazz.isEnum();
clazz.isRecord();
clazz.isAnnotation();
clazz.isArray();
clazz.getComponentType();
```

getCanonicalName có thể trả null với một số anonymous hoặc local classes. Không nên dùng nó như định danh duy nhất trong mọi trường hợp.

## 35.3. Class metadata và Java 21 types

Reflection API cung cấp metadata cho class, enum, record, annotation, array và sealed type.

### Kiểm tra modifiers

```java
import java.lang.reflect.Modifier;

Class<?> clazz = User.class;
int modifiers = clazz.getModifiers();

System.out.println(Modifier.isPublic(modifiers));
System.out.println(Modifier.isFinal(modifiers));
System.out.println(Modifier.isAbstract(modifiers));
```

### Record metadata

```java
record UserDto(Long id, String name) {}

Class<UserDto> type = UserDto.class;

System.out.println(type.isRecord());

for (var component : type.getRecordComponents()) {
    System.out.println(component.getName());
    System.out.println(component.getType().getName());
}
```

Record components cung cấp tên, kiểu và accessor tương ứng. Reflection chỉ đọc metadata; nó không biến record thành mutable class.

### Sealed metadata

```java
sealed interface Payment
        permits CashPayment, CardPayment {
}

final class CashPayment implements Payment {
}

final class CardPayment implements Payment {
}
```

```java
for (Class<?> permitted :
        Payment.class.getPermittedSubclasses()) {

    System.out.println(permitted.getName());
}
```

Nếu class không phải sealed type, getPermittedSubclasses có thể trả null theo API contract.

## 35.4. getFields và getDeclaredFields

Đây là câu hỏi phỏng vấn phổ biến.

```java
class Person {
    public String name;
    private int age;
}
```

getFields trả về các public fields được hỗ trợ bởi class, bao gồm public fields kế thừa phù hợp:

```java
Field[] fields = Person.class.getFields();
```

getDeclaredFields trả về fields được khai báo trực tiếp trong class, gồm public, protected, package-private và private nhưng không gồm inherited fields:

```java
Field[] fields = Person.class.getDeclaredFields();
```

| Method | Private fields | Inherited fields |
| --- | --- | --- |
| getFields | Không | Có, nếu public và phù hợp |
| getDeclaredFields | Có | Không |

Tương tự, bạn sẽ gặp getMethods, getDeclaredMethods, getConstructors và getDeclaredConstructors.

### Thứ tự kết quả

Không nên giả định thứ tự fields hoặc methods trả về giống thứ tự khai báo trong source. Nếu framework cần thứ tự, phải tự định nghĩa sorting rule hoặc dùng annotation order rõ ràng.

### Synthetic và bridge members

Reflection có thể thấy những members compiler sinh ra:

- Synthetic field cho outer instance của inner class.
- Bridge method do type erasure và overriding generic method.
- Members liên quan tới enum hoặc record.

Framework tổng quát nên cân nhắc isSynthetic và isBridge để không coi mọi member là business member.

## 35.5. Đọc và sửa Field bằng Reflection

```java
class MutableUser {
    private String name = "Alice";
}

MutableUser user = new MutableUser();
Field field =
        MutableUser.class.getDeclaredField("name");

if (field.trySetAccessible()) {
    Object value = field.get(user);
    System.out.println(value);

    field.set(user, "Bob");
    System.out.println(field.get(user));
}
```

Kết quả:

```text
Alice
Bob
```

Reflection boxing primitive khi Field.get trả Object. Khi phù hợp, có thể dùng getInt, setInt, getLong và các methods chuyên biệt khác.

### setAccessible và trySetAccessible

setAccessible(true) yêu cầu runtime cho phép bypass access check. Nó có thể ném InaccessibleObjectException nếu module hoặc package không mở phù hợp.

trySetAccessible trả boolean, giúp code kiểm tra khả năng truy cập thay vì giả định việc mở access luôn thành công.

Java Module System có thể giới hạn deep reflection. exports chủ yếu phục vụ ordinary access; opens cho phép deep reflection runtime ở mức package phù hợp.

Không nên hiểu Reflection cho phép tùy ý sửa mọi final field. Final fields, static final fields, record components và hidden classes có những giới hạn riêng.

### Best practice

Không sử dụng Reflection để truy cập private fields chỉ vì không muốn thiết kế public API. Reflection phù hợp với framework infrastructure, serialization, dependency injection, test tooling, plugin loading và compatibility adapter.

## 35.6. Gọi Method bằng Reflection

```java
class Calculator {

    public int add(int a, int b) {
        return a + b;
    }
}

Calculator calculator = new Calculator();

Method method = Calculator.class.getMethod(
        "add",
        int.class,
        int.class
);

Object result = method.invoke(
        calculator,
        10,
        20
);

System.out.println(result);
```

getMethod tìm public method theo tên và parameter types, có thể thấy inherited public method. getDeclaredMethod chỉ tìm method được khai báo trực tiếp và có thể trả về non-public method.

### Invocation exceptions

```text
NoSuchMethodException
IllegalAccessException
IllegalArgumentException
InvocationTargetException
```

InvocationTargetException là wrapper cho exception mà method thật sự được invoke ném ra:

```java
try {
    method.invoke(calculator, 10, 20);
} catch (InvocationTargetException exception) {
    Throwable actualCause = exception.getCause();
    actualCause.printStackTrace();
}
```

Khi debug framework stack trace, cần tìm cause bên trong wrapper thay vì chỉ đọc InvocationTargetException.

### Overload và exact parameter types

Reflection không tự thực hiện overload resolution giống source code theo cách developer thường mong đợi:

```java
void print(Integer value) {}
void print(String value) {}
```

Phải tìm đúng method với Integer.class hoặc String.class. int.class và Integer.class là hai Class objects khác nhau.

## 35.7. Constructor Reflection và dynamic object creation

```java
class Config {

    private final String name;

    public Config(String name) {
        this.name = name;
    }
}

Constructor<Config> constructor =
        Config.class.getConstructor(String.class);

Config config = constructor.newInstance("production");
```

getConstructor tìm public constructor của class đó. Constructor không được kế thừa như method. getDeclaredConstructor tìm constructor được khai báo trực tiếp, kể cả non-public.

Tìm thấy private constructor không đồng nghĩa caller tự động có quyền invoke nó. Access control và module boundaries vẫn áp dụng.

### Exceptions

```text
NoSuchMethodException
InstantiationException
IllegalAccessException
InvocationTargetException
ExceptionInInitializerError
```

Nếu constructor ném exception, newInstance thường bọc exception đó trong InvocationTargetException.

### Framework dependency injection

Một DI container có thể:

1. Đọc class name hoặc class object.
2. Chọn constructor theo policy.
3. Đọc parameter types và annotations.
4. Tìm dependencies trong container.
5. Invoke constructor.
6. Lưu instance và quản lý lifecycle.

Framework không nhất thiết dùng Constructor.newInstance cho mọi trường hợp. Nó có thể dùng Reflection, MethodHandle, generated bytecode, proxy hoặc factory.

## 35.8. Reflection và Generics

Type erasure không loại bỏ toàn bộ metadata của declaration.

```java
class UserRepository {
    private List<String> usernames;
}

Field field = UserRepository.class
        .getDeclaredField("usernames");

Type type = field.getGenericType();
System.out.println(type.getTypeName());
```

Kết quả:

```text
java.util.List<java.lang.String>
```

Type là abstraction tổng quát hơn Class. Một số implementations:

```text
Class<?>
ParameterizedType
TypeVariable<?>
WildcardType
GenericArrayType
```

```java
if (type instanceof ParameterizedType parameterized) {

    for (Type argument :
            parameterized.getActualTypeArguments()) {

        System.out.println(argument.getTypeName());
    }
}
```

Đây là nền tảng của nhiều thư viện JSON, dependency injection container và repository framework.

### Runtime object không giữ mọi generic argument

```java
List<String> names = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();

System.out.println(names.getClass() == numbers.getClass());
```

Kết quả là true trong mô hình type erasure thông thường. Generic argument String hoặc Integer không trở thành runtime class parameter của ArrayList object.

## 35.9. Reflection và Spring Framework

Trong Spring, những annotation thường gặp gồm:

```java
@Component
@Service
@Repository
@Controller
@Autowired
```

Khi xây dựng ApplicationContext, framework cần kết hợp:

- Classpath scanning.
- Đọc annotation metadata.
- Bean definition registration.
- Constructor resolution.
- Dependency injection.
- Runtime proxy creation.
- Method interception.
- Lifecycle callback.

Ví dụ, annotation Service chỉ là metadata. Để class trở thành bean, framework phải scan được class, đăng ký definition và tạo instance trong context.

### Constructor injection

```java
public class UserService {

    private final UserRepository repository;

    public UserService(UserRepository repository) {
        this.repository = repository;
    }
}
```

Spring có thể tạo UserService thông qua constructor injection khi bean definitions và dependency resolution phù hợp.

### Spring có đọc mọi class bằng Reflection không?

Không. Spring có những cơ chế đọc metadata trực tiếp từ class files, chẳng hạn ASM-based metadata readers, để tránh load mọi class không cần thiết.

Reflection là một phần quan trọng của hệ sinh thái Spring, nhưng không phải cơ chế duy nhất.

## 35.10. Reflection vs MethodHandle

Java có hai hướng dynamic invocation đáng chú ý:

```java
Method.invoke()
MethodHandle.invoke()
MethodHandle.invokeExact()
```

MethodHandle thuộc package java.lang.invoke.

| Reflection | MethodHandle |
| --- | --- |
| Tập trung vào metadata và dynamic access | Tập trung vào typed, composable invocation |
| Dùng Method, Constructor, Field | Dùng MethodHandle và MethodType |
| Invocation qua invoke | Invocation qua invoke hoặc invokeExact |
| Dễ tiếp cận cho inspection | Yêu cầu hiểu signature sâu hơn |
| Compatibility rộng | Có thể tối ưu tốt trong một số use cases |

Không nên mặc định MethodHandle luôn nhanh hơn Reflection. Performance phụ thuộc JDK, call site, warmup và cách cache handle.

## 35.11. Reflection performance

Reflection có thể tốn chi phí do lookup metadata, access check, argument validation, boxing/unboxing và wrapper exception.

Framework thường cache:

- Class object.
- Constructor.
- Field.
- Method.
- Access check result.
- Generated accessor hoặc MethodHandle.

Không tạo cache vô hạn theo class loader hoặc user input, vì có thể giữ class loader và gây memory leak.

## 35.12. Use cases và rủi ro

Use cases phù hợp:

- Dependency injection.
- Test discovery.
- Serialization.
- ORM metadata.
- Plugin architecture.
- Annotation-driven routing.
- Generic object mapping.
- Compatibility layer.

Rủi ro phổ biến:

- Sai tên field hoặc method chỉ phát hiện khi chạy.
- Bypass encapsulation.
- Lỗi khi rename member.
- Class loader leak.
- Invoke nhầm overload.
- Security issue khi user chọn class hoặc method.
- Không hoạt động trong native image nếu thiếu reflection configuration.
- Module access failure sau khi nâng JDK.

Nguyên tắc thiết kế:

1. Validate class/member name trước khi invoke.
2. Whitelist class và method được phép.
3. Cache metadata có giới hạn.
4. Bọc Reflection trong abstraction nhỏ.
5. Giữ cause gốc khi wrap exception.
6. Dùng direct call hoặc interface khi type đã biết.

## 35.13. Câu hỏi phỏng vấn Reflection

### getFields và getDeclaredFields khác nhau thế nào?

getFields lấy public fields có thể truy cập, gồm inherited public fields phù hợp. getDeclaredFields lấy fields được khai báo trực tiếp trong class, gồm cả private nhưng không lấy inherited fields.

### Class.forName có luôn tạo object không?

Không. Nó lấy hoặc load Class object, không tạo instance. Class initialization có thể xảy ra tùy overload và initialization flag.

### Vì sao InvocationTargetException xuất hiện?

Đó là wrapper cho exception do method hoặc constructor được invoke thật sự ném ra. Cần gọi getCause để lấy lỗi gốc.

### Reflection có phá private tuyệt đối không?

Không. Access checks, module boundaries, runtime policy và giới hạn JVM vẫn áp dụng. Một số members như final fields có hạn chế riêng.

# CHƯƠNG 36. JAVA ANNOTATIONS

## 36.1. Annotation là gì?

Annotation là cơ chế gắn metadata vào source code hoặc class file. Annotation có thể được đặt trên class, interface, record, method, field, constructor, parameter, package, module hoặc type use tùy Target được khai báo.

Ví dụ:

```java
@Override
public String toString() {
    return "User";
}
```

Hoặc:

```java
@Deprecated(since = "2.0", forRemoval = false)
public void oldMethod() {
}
```

Annotation không tự động tạo behavior chỉ vì nó xuất hiện trong source. Phải có thành phần hiểu và xử lý nó:

- Java compiler.
- Annotation processor.
- Runtime framework.
- Reflection-based processor.
- Bytecode tool.
- IDE hoặc static analyzer.

### Ví dụ Spring

```java
@Service
public class OrderService {
}
```

Service chỉ là metadata cho đến khi Spring component scanner và bean factory xử lý nó. JVM không tự hiểu Service có nghĩa là tạo Spring bean.

### Vì sao Annotation ra đời?

Trước annotation, framework thường phải dựa vào:

- XML configuration.
- Naming convention.
- Marker interface.
- External registry.
- Code generation riêng.

Annotation đưa một phần configuration đến gần declaration mà nó mô tả:

```java
@GetMapping("/users/{id}")
public UserDto getUser(long id) {
    return service.find(id);
}
```

Đánh đổi là configuration có thể bị phân tán trong source, khó thấy nếu annotation processor không rõ ràng và có thể tạo magic behavior.

## 36.2. Built-in annotations

### Override

```java
@Override
public String toString() {
    return "Example";
}
```

Compiler xác minh method thực sự override hoặc implement method phù hợp. Nếu đổi tên method hoặc sai parameter list, compiler báo lỗi thay vì âm thầm tạo một method mới.

Đây là lý do nên dùng Override cho mọi method override, kể cả khi code hiện tại vẫn compile mà không có annotation.

### Deprecated

```java
@Deprecated(since = "2.0", forRemoval = false)
public void oldMethod() {
}
```

Deprecated cho biết API không còn được khuyến nghị.

- since ghi version bắt đầu deprecated.
- forRemoval = true biểu thị API được đánh dấu có kế hoạch loại bỏ.
- forRemoval không có nghĩa chắc chắn bị xóa ở phiên bản ngay sau.

Khi deprecate API public, nên cung cấp replacement, migration note và test compatibility.

### SuppressWarnings

```java
@SuppressWarnings("unchecked")
List<String> values = (List<String>) rawValue;
```

SuppressWarnings chỉ ẩn warning được chỉ định; nó không sửa lỗi logic hoặc làm unsafe cast trở nên type-safe.

Best practice:

1. Suppress ở scope nhỏ nhất.
2. Ghi comment giải thích vì sao cast an toàn.
3. Không dùng suppress warning trên cả class nếu chỉ một dòng cần xử lý.
4. Không suppress warning chỉ để build xanh.

### FunctionalInterface

```java
@FunctionalInterface
interface Operation {
    int execute(int a, int b);
}
```

Compiler xác minh interface có đúng một abstract method theo quy tắc functional interface. Default methods, static methods và những method tương ứng với Object có quy tắc riêng và không nhất thiết phá vỡ contract.

### SafeVarargs

SafeVarargs có thể dùng cho constructor hoặc method phù hợp với varargs, thường liên quan generic varargs:

```java
@SafeVarargs
static <T> List<T> listOf(T... values) {
    return List.of(values);
}
```

Annotation này là lời cam kết của developer rằng implementation không thực hiện unsafe operation với varargs array. Nó không tự kiểm tra method có an toàn.

## 36.3. Định nghĩa custom annotation

Annotation type được khai báo bằng keyword interface với ký hiệu @:

```java
public @interface Auditable {
}
```

Sử dụng:

```java
@Auditable
public void createOrder() {
}
```

Một annotation có elements:

```java
public @interface Audit {

    String action();

    String actor() default "system";

    boolean includeArguments() default false;
}
```

Sử dụng:

```java
@Audit(
        action = "CREATE_ORDER",
        actor = "order-service",
        includeArguments = true
)
public void createOrder() {
}
```

Element không có default là bắt buộc khi sử dụng annotation. Element có default có thể bỏ qua.

### Loại giá trị được phép

Annotation element chỉ nhận được những loại giá trị giới hạn:

- Primitive.
- String.
- Class hoặc class literal.
- Enum constant.
- Annotation type.
- Array của những loại trên.

Không thể dùng object tùy ý hoặc biểu thức runtime bất kỳ làm annotation value.

Ví dụ:

```java
public @interface Endpoint {

    String path();

    HttpMethod method() default HttpMethod.GET;

    Class<?> responseType() default Void.class;

    String[] roles() default {};
}
```

Enum:

```java
enum HttpMethod {
    GET, POST, PUT, DELETE
}
```

### Marker annotation

Annotation không có element gọi là marker annotation:

```java
public @interface InternalOnly {
}
```

Marker annotation chỉ thể hiện presence/absence. Nếu cần truyền metadata, nên khai báo elements có tên rõ ràng thay vì tạo nhiều marker annotation gần giống nhau.

## 36.4. Meta-annotations

Meta-annotation là annotation được đặt trên chính annotation type. Chúng mô tả annotation có thể dùng ở đâu, tồn tại bao lâu và có được thấy ở runtime hay không.

Các meta-annotations quan trọng:

- Retention.
- Target.
- Documented.
- Inherited.
- Repeatable.
- Native.

## 36.5. RetentionPolicy

Retention quyết định annotation được giữ đến giai đoạn nào.

### SOURCE

Chỉ tồn tại trong source code và thường bị loại khỏi class file.

Phù hợp với:

- Compiler hint.
- Static analysis.
- Code generation chỉ chạy lúc compile.
- Lombok-style tooling.

```java
@Retention(RetentionPolicy.SOURCE)
public @interface GenerateBuilder {
}
```

### CLASS

Được ghi vào class file nhưng có thể không available qua runtime reflection. Đây là retention mặc định nếu không khai báo.

Phù hợp với một số bytecode tool hoặc post-compile analyzer.

### RUNTIME

Được giữ trong class file và có thể đọc bằng Reflection khi runtime:

```java
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();
}
```

Framework như Spring, JUnit và nhiều serializer thường cần RUNTIME nếu processor đọc annotation qua reflection.

### Bảng so sánh

| Retention | Source | Class file | Runtime Reflection |
| --- | --- | --- | --- |
| SOURCE | Có | Thường không | Không |
| CLASS | Có | Có | Không đảm bảo |
| RUNTIME | Có | Có | Có |

Nếu quên RUNTIME, getAnnotation có thể trả null dù annotation vẫn nhìn thấy trong source code.

## 36.6. Target

Target giới hạn declaration contexts mà annotation được phép dùng.

```java
@Target({
        ElementType.TYPE,
        ElementType.METHOD,
        ElementType.FIELD,
        ElementType.PARAMETER
})
@Retention(RetentionPolicy.RUNTIME)
public @interface Auditable {
    String action();
}
```

Một số ElementType:

| ElementType | Vị trí |
| --- | --- |
| TYPE | Class, interface, enum, record |
| FIELD | Field |
| METHOD | Method |
| CONSTRUCTOR | Constructor |
| PARAMETER | Method/constructor parameter |
| LOCAL_VARIABLE | Local variable |
| PACKAGE | Package |
| MODULE | Module |
| TYPE_USE | Nơi dùng type |
| TYPE_PARAMETER | Khai báo type parameter |
| RECORD_COMPONENT | Record component |
| ANNOTATION_TYPE | Annotation type khác |

### TYPE_USE

TYPE_USE cho phép annotation gắn vào cách một type được sử dụng:

```java
List<@NonNull String> names;
@Nullable String value;
```

TYPE_USE thường được static analyzer hoặc type checker xử lý; Java compiler mặc định không tự biến NonNull thành runtime validation.

### RECORD_COMPONENT trong Java 16+

```java
@Target(ElementType.RECORD_COMPONENT)
@Retention(RetentionPolicy.RUNTIME)
public @interface Sensitive {
}

record User(
        @Sensitive String password
) {
}
```

Đọc annotation từ record component cần dùng RecordComponent API; annotation có thể được truyền hoặc propagate tới những declaration khác tùy target và quy tắc compiler.

## 36.7. Documented

Documented yêu cầu công cụ JavaDoc đưa annotation lên tài liệu được tạo:

```java
@Documented
@Retention(RetentionPolicy.RUNTIME)
public @interface PublicApi {
}
```

Documented không làm annotation chạy ở runtime và không thay đổi access control.

## 36.8. Inherited

Inherited áp dụng cho annotation đặt trên class. Khi subclass không tự khai báo annotation đó, getAnnotation trên subclass có thể nhìn thấy annotation từ superclass.

```java
@Inherited
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface FrameworkComponent {
}

@FrameworkComponent
class BaseComponent {
}

class ChildComponent extends BaseComponent {
}
```

```java
System.out.println(
        ChildComponent.class.isAnnotationPresent(
                FrameworkComponent.class
        )
);
```

Cần nhớ:

- Inherited không áp dụng cho interface implementation.
- Inherited không tự áp dụng cho method override.
- Inherited không làm annotation copy vật lý vào subclass.
- getDeclaredAnnotation trên ChildComponent không lấy annotation inherited.

Nếu cần behavior inheritance cho method hoặc interface, framework phải tự xây dựng logic.

## 36.9. Repeatable annotations

Repeatable cho phép đặt cùng một annotation nhiều lần trên một declaration.

```java
@Repeatable(Roles.class)
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Role {
    String value();
}

@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
public @interface Roles {
    Role[] value();
}
```

Sử dụng:

```java
@Role("ADMIN")
@Role("AUDITOR")
class ReportService {
}
```

Đọc:

```java
Role[] roles =
        ReportService.class.getAnnotationsByType(Role.class);
```

getAnnotationsByType xử lý container annotation theo cách thuận tiện hơn việc đọc Roles trực tiếp.

### Khi nào dùng repeatable?

Phù hợp với:

- Nhiều route mapping.
- Nhiều security role.
- Nhiều event subscription.
- Nhiều alias hoặc format.

Không nên dùng repeatable để nhồi quá nhiều configuration vào một class. Nếu cấu hình phức tạp, nên dùng một annotation có nested values hoặc external configuration.

## 36.10. Runtime annotation processing

Annotation có Retention RUNTIME có thể đọc qua Reflection.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.METHOD)
@interface Timed {
    String value();
}

class PaymentService {

    @Timed("payment.create")
    public void create() {
    }
}
```

Đọc annotation:

```java
Method method =
        PaymentService.class.getDeclaredMethod("create");

Timed timed = method.getAnnotation(Timed.class);

if (timed != null) {
    System.out.println(timed.value());
}
```

Các API thường dùng:

```java
isAnnotationPresent(...)
getAnnotation(...)
getDeclaredAnnotation(...)
getAnnotations(...)
getDeclaredAnnotations(...)
getAnnotationsByType(...)
getDeclaredAnnotationsByType(...)
```

### getAnnotation và getDeclaredAnnotation

- getAnnotation có thể xem annotation được kế thừa trong những trường hợp contract hỗ trợ.
- getDeclaredAnnotation chỉ kiểm tra declaration hiện tại.

Với method override và interface, không nên suy luận rằng annotation tự động được kế thừa. Framework phải tự tìm method trong superclass hoặc interface nếu muốn behavior đó.

### Annotation proxy

Runtime thường trả về object proxy implement annotation interface. Annotation có equals, hashCode và toString theo quy tắc annotation contract; không nên cast annotation object sang implementation nội bộ.

## 36.11. Compile-time Annotation Processing

Runtime processing xảy ra khi chương trình chạy. Compile-time annotation processing xảy ra trong quá trình javac, trước khi class được chạy.

Use cases:

- Generate source code.
- Kiểm tra rule tại compile time.
- Sinh metadata.
- Sinh adapter, mapper hoặc builder.
- Báo lỗi sớm khi declaration sai.

### Các API chính

Package quan trọng:

```text
javax.annotation.processing
javax.lang.model
javax.lang.model.element
javax.lang.model.type
javax.lang.model.util
```

Một processor thường extends AbstractProcessor:

```java
@SupportedAnnotationTypes(
        "com.example.GenerateMapper"
)
@SupportedSourceVersion(SourceVersion.RELEASE_21)
public class MapperProcessor
        extends AbstractProcessor {

    @Override
    public boolean process(
            Set<? extends TypeElement> annotations,
            RoundEnvironment roundEnv
    ) {
        for (Element element :
                roundEnv.getElementsAnnotatedWith(
                        GenerateMapper.class
                )) {

            processingEnv.getMessager().printMessage(
                    Diagnostic.Kind.NOTE,
                    "Processing " + element
            );
        }

        return true;
    }
}
```

Processor thực tế cần:

- Đọc element/model thay vì load class tùy tiện.
- Dùng Filer để tạo source hoặc resource.
- Dùng Messager để báo warning/error.
- Xử lý nhiều rounds.
- Không ghi đè generated file ngoài contract.
- Kiểm tra source version.

### Annotation processing không phải Reflection

| Compile-time processor | Runtime Reflection |
| --- | --- |
| Chạy khi compile | Chạy khi application chạy |
| Có thể báo lỗi trước khi deploy | Một số lỗi chỉ thấy khi runtime |
| Dùng language model | Dùng Class, Method, Field |
| Có thể generate source | Có thể invoke object |
| Không cần tạo instance business class | Thường tương tác với runtime class |

### Đăng ký processor

Processor có thể được phát hiện qua:

```text
META-INF/services/javax.annotation.processing.Processor
```

Hoặc được cấu hình qua build tool/module path. Khi dùng JPMS, module processor có thể khai báo provides với processor implementation.

### Các vòng processing

Processor có thể tạo source mới. Javac có thể chạy thêm round để xử lý source được tạo. Khi không còn source hoặc annotation mới, processing kết thúc.

Processor không nên tạo output vô hạn hoặc sinh file trùng tên giữa các round.

## 36.12. Annotation và Spring

Spring thường dùng annotation theo nhiều lớp:

- Component stereotype: Service, Repository, Controller.
- Injection: Autowired, Qualifier, Value.
- Web mapping: RequestMapping, GetMapping, PathVariable.
- Transaction: Transactional.
- Configuration: Configuration, Bean, Profile.

Một annotation như Transactional không tự mở transaction. Spring cần:

1. Đọc annotation metadata.
2. Tạo proxy hoặc method interception.
3. Bắt invocation.
4. Mở transaction.
5. Gọi method thật.
6. Commit hoặc rollback theo exception policy.

### Proxy limitation

Nếu framework dùng proxy, self-invocation có thể không đi qua proxy:

```java
public void outer() {
    inner();
}

@Transactional
public void inner() {
}
```

Gọi inner từ cùng object có thể bypass proxy tùy proxy model. Đây là behavior của framework architecture, không phải Annotation tự động intercept method.

## 36.13. Annotation best practices

1. Đặt tên annotation mô tả intent, không mô tả implementation.
2. Chọn Retention nhỏ nhất đủ dùng.
3. Giới hạn Target để compiler hỗ trợ phát hiện sai vị trí.
4. Dùng default hợp lý, tránh default che giấu configuration bắt buộc.
5. Không nhồi business logic vào annotation.
6. Document semantics và precedence khi có nhiều annotation.
7. Validate annotation values ở compile time nếu có thể.
8. Nếu xử lý runtime, cache metadata nhưng quản lý class loader lifecycle.
9. Không coi SuppressWarnings là cách sửa lỗi.
10. Với security annotation, phải có enforcement code; annotation một mình không tạo security.

## 36.14. Câu hỏi phỏng vấn Annotations

### Annotation có tự tạo behavior không?

Không. Compiler, annotation processor, runtime framework hoặc reflection processor phải đọc và thực hiện behavior.

### Retention mặc định là gì?

CLASS. Nếu cần đọc qua runtime Reflection, phải khai báo RUNTIME.

### Inherited có áp dụng cho method không?

Không. Inherited chủ yếu áp dụng cho annotation trên class và không tự truyền qua method override hoặc interface implementation.

### Runtime annotation và annotation processor khác nhau thế nào?

Runtime annotation đọc khi application chạy bằng Reflection hoặc framework. Annotation processor chạy trong compile phase và có thể báo lỗi hoặc generate source.

### Vì sao Target quan trọng?

Target giúp compiler giới hạn annotation vào đúng declaration context, giảm lỗi dùng annotation sai vị trí.

# CHƯƠNG 37. JAVA NETWORKING & HTTP CLIENT

## 37.1. Networking là gì?

Networking là quá trình các chương trình trao đổi dữ liệu qua network. Java cung cấp nhiều abstraction từ thấp đến cao:

| Tầng | Java API tiêu biểu | Mục đích |
| --- | --- | --- |
| Address/DNS | InetAddress | Phân giải host và IP |
| URI/URL | URI, URL | Mô tả resource hoặc endpoint |
| TCP | Socket, ServerSocket | Kết nối reliable, ordered, stream-based |
| UDP | DatagramSocket, DatagramPacket | Datagram không connection-oriented |
| HTTP | HttpClient, HttpRequest, HttpResponse | Giao tiếp web/service |

Backend developer thường dùng HTTP client nhiều hơn Socket trực tiếp, nhưng hiểu các tầng thấp giúp debug timeout, DNS, connection pool và protocol behavior.

### Network I/O khác computation

Network call có thể:

- Chờ DNS.
- Chờ TCP connect.
- Chờ TLS handshake.
- Chờ server xử lý.
- Chờ bytes truyền đủ.
- Bị timeout hoặc connection reset.
- Nhận HTTP response có status lỗi dù transport thành công.

Do đó, không nên viết network code mà không có timeout, cancellation và error policy.

## 37.2. URI và URL

### URI

URI là định danh tài nguyên theo cú pháp:

```java
URI uri = URI.create(
        "https://api.example.com/users/42?active=true"
);

System.out.println(uri.getScheme());
System.out.println(uri.getHost());
System.out.println(uri.getPath());
System.out.println(uri.getQuery());
```

URI chủ yếu là data structure mô tả địa chỉ. Tạo URI không tự thực hiện network request.

### URL

URL là abstraction gắn với cách định vị và truy cập resource. API URL tồn tại lâu trong Java nhưng nhiều HTTP application hiện đại nên dùng URI kết hợp HttpClient.

| URI | URL |
| --- | --- |
| Resource identifier | Locator có thể mở resource |
| Không tự kết nối network | Có các API mở connection |
| Phù hợp parse và validate endpoint | API legacy/convenience |

### URI parsing

URI.create ném unchecked exception nếu chuỗi không hợp lệ. Constructor URI khai báo checked URISyntaxException, phù hợp khi muốn xử lý lỗi parse rõ:

```java
try {
    URI uri = new URI(
            "https",
            "example.com",
            "/users",
            null
    );
    System.out.println(uri);
} catch (URISyntaxException exception) {
    throw new IllegalArgumentException(
            "Invalid endpoint", exception
    );
}
```

Không nối chuỗi endpoint từ input mà không validate scheme, host, port và path.

## 37.3. InetAddress và DNS

InetAddress đại diện cho địa chỉ IP hoặc hostname đã được phân giải.

```java
InetAddress address =
        InetAddress.getByName("example.com");

System.out.println(address.getHostName());
System.out.println(address.getHostAddress());
```

Lấy nhiều địa chỉ:

```java
InetAddress[] addresses =
        InetAddress.getAllByName("example.com");
```

DNS result có thể thay đổi và JVM có DNS cache policy. Không nên lưu IP vô thời hạn nếu hệ thống cần failover hoặc service discovery động.

DNS lookup có thể block. Không gọi tùy ý trong critical path mà không tính đến timeout và thread model.

Hostname do user cung cấp cần được kiểm tra. DNS rebinding có thể khiến host hợp lệ tại thời điểm validation trỏ sang địa chỉ nội bộ ở thời điểm request.

## 37.4. TCP và UDP

TCP là connection-oriented byte stream:

- Có handshake.
- Dữ liệu ordered.
- Có retransmission và flow control.
- Không bảo đảm message boundary.

Nếu ứng dụng gửi hai message, receiver có thể đọc một phần message hoặc nhiều message trong một lần read. Application protocol phải tự định nghĩa framing, chẳng hạn length prefix hoặc delimiter.

UDP gửi datagram:

- Không cần kết nối dài.
- Có message boundary theo packet.
- Không bảo đảm delivery, order hoặc duplicate-free.
- Có thể phù hợp với discovery, telemetry hoặc realtime protocol tùy thiết kế.

| TCP | UDP |
| --- | --- |
| Reliable stream | Datagram best-effort |
| Ordered bytes | Không bảo đảm order |
| Connection-oriented | Connectionless ở tầng protocol |
| HTTP, database, command | Discovery, telemetry, realtime tùy contract |

Không dùng UDP cho business operation cần đảm bảo giao dịch nếu application chưa có reliability layer.

## 37.5. Socket và ServerSocket

### TCP server tối giản

```java
try (ServerSocket server = new ServerSocket(8080);
     Socket socket = server.accept();
     BufferedReader reader = new BufferedReader(
             new InputStreamReader(
                     socket.getInputStream(),
                     StandardCharsets.UTF_8
             )
     );
     BufferedWriter writer = new BufferedWriter(
             new OutputStreamWriter(
                     socket.getOutputStream(),
                     StandardCharsets.UTF_8
             )
     )) {

    String line = reader.readLine();
    writer.write("Received: " + line);
    writer.newLine();
    writer.flush();
}
```

Ví dụ chỉ xử lý một connection và một line. Server thật cần accept loop, connection handler, protocol framing, read timeout, maximum request size, backpressure, graceful shutdown, logging và metrics.

### TCP client

```java
try (Socket socket = new Socket("localhost", 8080);
     BufferedWriter writer = new BufferedWriter(
             new OutputStreamWriter(
                     socket.getOutputStream(),
                     StandardCharsets.UTF_8
             )
     );
     BufferedReader reader = new BufferedReader(
             new InputStreamReader(
                     socket.getInputStream(),
                     StandardCharsets.UTF_8
             )
     )) {

    writer.write("hello");
    writer.newLine();
    writer.flush();

    System.out.println(reader.readLine());
}
```

### Read timeout

```java
socket.setSoTimeout(3_000);
```

Timeout này áp dụng cho thao tác read. Nó không thay thế connect timeout và không tự dừng mọi công việc ở server.

### Concurrency của server

Một thread xử lý toàn bộ connections sẽ bị block bởi client chậm. Có thể dùng platform thread pool, virtual thread per connection/task hoặc non-blocking NIO tùy mô hình.

Không tạo thread vô hạn mà không tính tới connection limit, memory và downstream capacity.

## 37.6. UDP với DatagramSocket

Gửi datagram:

```java
byte[] data = "ping".getBytes(StandardCharsets.UTF_8);
InetAddress host = InetAddress.getByName("localhost");

DatagramPacket packet = new DatagramPacket(
        data,
        data.length,
        host,
        9999
);

try (DatagramSocket socket = new DatagramSocket()) {
    socket.send(packet);
}
```

Nhận datagram:

```java
byte[] buffer = new byte[1024];
DatagramPacket packet =
        new DatagramPacket(buffer, buffer.length);

try (DatagramSocket socket = new DatagramSocket(9999)) {
    socket.setSoTimeout(3_000);
    socket.receive(packet);

    String message = new String(
            packet.getData(),
            packet.getOffset(),
            packet.getLength(),
            StandardCharsets.UTF_8
    );

    System.out.println(message);
}
```

Không dùng toàn bộ buffer khi decode; phải dùng packet length, nếu không output có thể chứa bytes cũ hoặc ký tự rác.

## 37.7. HTTP fundamentals

HTTP request thường gồm:

```text
Method + target + HTTP version
Headers
Blank line
Optional body
```

Response gồm:

```text
HTTP version + status code + reason
Headers
Blank line
Optional body
```

### HTTP methods

| Method | Ý nghĩa phổ biến | Idempotent theo semantics chuẩn |
| --- | --- | --- |
| GET | Đọc resource | Có |
| POST | Tạo hoặc trigger operation | Không mặc định |
| PUT | Replace resource theo URI | Có |
| PATCH | Partial update | Tùy contract |
| DELETE | Xóa resource | Có theo semantics, dù response có thể khác |
| HEAD | Lấy headers không body | Có |

Idempotent không có nghĩa request chỉ chạy một lần. Nó mô tả effect mong đợi khi lặp request; application vẫn phải thiết kế retry cẩn thận.

### Status code

| Nhóm | Ý nghĩa |
| --- | --- |
| 1xx | Informational |
| 2xx | Thành công |
| 3xx | Redirect |
| 4xx | Client/request issue |
| 5xx | Server/upstream issue |

HttpClient không tự ném exception chỉ vì response là 404 hoặc 500. Application phải tự kiểm tra status code và mapping error.

## 37.8. Java HttpClient

HttpClient là HTTP client hiện đại thuộc java.net.http, được giới thiệu từ Java 11 và có trong Java SE 21.

### Tạo client

```java
HttpClient client = HttpClient.newBuilder()
        .connectTimeout(Duration.ofSeconds(3))
        .followRedirects(
                HttpClient.Redirect.NORMAL
        )
        .version(HttpClient.Version.HTTP_2)
        .build();
```

Client có thể được tái sử dụng. Không tạo client mới cho mọi request nếu muốn tận dụng connection reuse và connection pooling theo implementation.

### Tạo request

```java
HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(
                "https://api.example.com/users/42"
        ))
        .timeout(Duration.ofSeconds(5))
        .header("Accept", "application/json")
        .GET()
        .build();
```

Khác nhau:

- connectTimeout giới hạn thời gian thiết lập connection.
- request timeout giới hạn thời gian hoàn thành request theo API request.
- Cả hai không thay thế timeout ở proxy, DNS, server hoặc downstream pool.

### Gửi synchronous request

```java
HttpResponse<String> response = client.send(
        request,
        HttpResponse.BodyHandlers.ofString(
                StandardCharsets.UTF_8
        )
);

int status = response.statusCode();
String body = response.body();

if (status >= 200 && status < 300) {
    System.out.println(body);
} else {
    throw new IllegalStateException(
            "HTTP status: " + status
    );
}
```

send có thể ném IOException và InterruptedException. Nếu catch InterruptedException mà không thể truyền tiếp, cần restore interrupt flag:

```java
try {
    client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
    );
} catch (InterruptedException exception) {
    Thread.currentThread().interrupt();
    throw new IllegalStateException(
            "Request interrupted", exception
    );
}
```

### BodyHandlers

Các handler thường gặp:

```java
BodyHandlers.ofString()
BodyHandlers.ofByteArray()
BodyHandlers.ofFile(path)
BodyHandlers.ofInputStream()
BodyHandlers.discarding()
```

Chọn handler theo kích thước và loại payload. Không đọc file hoặc response lớn vào String hoặc byte array nếu không cần.

### POST JSON

```java
String json = """
        {"username":"alice","active":true}
        """;

HttpRequest request = HttpRequest.newBuilder()
        .uri(URI.create(
                "https://api.example.com/users"
        ))
        .header("Content-Type", "application/json")
        .header("Accept", "application/json")
        .POST(HttpRequest.BodyPublishers.ofString(json))
        .build();
```

Java SE không có JSON mapper đầy đủ. Backend thường dùng Jackson, Gson hoặc thư viện tương ứng. JSON input vẫn phải validate schema và không được tin cậy mặc định.

### BodyPublishers

```java
BodyPublishers.ofString(json)
BodyPublishers.ofByteArray(bytes)
BodyPublishers.ofFile(path)
BodyPublishers.ofInputStream(
        () -> inputStream
)
BodyPublishers.noBody()
```

Khi dùng InputStream publisher, phải quản lý lifetime và lỗi I/O đúng contract.

## 37.9. Asynchronous HTTP request

```java
CompletableFuture<HttpResponse<String>> future =
        client.sendAsync(
                request,
                HttpResponse.BodyHandlers.ofString()
        );

future.thenApply(response -> {
    if (response.statusCode() >= 300) {
        throw new IllegalStateException(
                "HTTP status: " + response.statusCode()
        );
    }
    return response.body();
}).thenAccept(System.out::println)
  .exceptionally(exception -> {
      exception.printStackTrace();
      return null;
  });
```

sendAsync trả về CompletableFuture; exception có thể nằm trong future thay vì được ném ngay tại lệnh gọi.

### Async không đồng nghĩa luôn nhanh hơn

Async có thể giúp không block caller thread trong lúc chờ I/O, nhưng:

- Callback vẫn cần CPU.
- Downstream vẫn có latency.
- Quá nhiều future có thể tạo memory pressure.
- Error và cancellation phức tạp hơn.
- Connection pool và rate limit vẫn tồn tại.

Trong Java 21, virtual thread với blocking client có thể là mô hình dễ đọc hơn cho nhiều workload. Chọn theo framework, observability và workload thực tế.

## 37.10. HTTP headers, cookies và redirect

Headers truyền metadata:

```java
request.headers().map().forEach(
        (name, values) ->
                System.out.println(name + ": " + values)
);
```

Không log access token, cookie session hoặc Authorization header ở production.

Redirect có thể làm request đi sang host khác. Cần kiểm tra:

- Redirect policy.
- HTTPS downgrade.
- Cookie forwarding.
- Authorization header forwarding.
- Internal network exposure.

## 37.11. TLS và certificate

HTTPS sử dụng TLS để cung cấp encryption, server authentication và integrity.

Không tắt certificate validation trong production bằng TrustManager chấp nhận mọi certificate. Đó là cách biến HTTPS thành kết nối dễ bị tấn công.

Nếu cần custom trust store:

1. Xác định certificate ownership.
2. Cấu hình SSLContext rõ ràng.
3. Giới hạn trust anchors.
4. Test expiry và rotation.
5. Không commit private key hoặc password vào source.

## 37.12. Networking exceptions và timeout

Các lỗi thường gặp:

| Exception | Tình huống điển hình |
| --- | --- |
| IOException | Lỗi I/O hoặc transport |
| ConnectException | Không thể kết nối |
| HttpTimeoutException | Request vượt timeout |
| SocketTimeoutException | Socket read timeout |
| UnknownHostException | DNS không phân giải được |
| SSLException | TLS, certificate hoặc handshake issue |
| InterruptedException | Thread bị interrupt khi chờ |
| URISyntaxException | URI syntax không hợp lệ |

Timeout nên có ở nhiều tầng:

- DNS/connect.
- TLS handshake.
- HTTP request.
- Read hoặc response.
- Queue wait.
- Database/downstream call.

Timeout phải đi cùng cancellation. Chỉ ngừng chờ ở caller không nhất thiết dừng operation ở server.

## 37.13. Retry, idempotency và circuit breaker

Không retry mù mọi exception:

- GET có thể retry theo policy.
- POST cần idempotency key hoặc contract rõ.
- 4xx thường không retry như 5xx.
- Timeout có thể request đã được server xử lý nhưng response bị mất.
- Retry nhiều có thể tạo retry storm.

Backend production thường kết hợp exponential backoff, jitter, maximum attempts, deadline, circuit breaker, bulkhead, rate limit và idempotency key.

Java HttpClient cung cấp transport primitive; business retry policy thuộc application hoặc resilience library.

## 37.14. SSRF và input validation

Nếu server nhận URL từ user rồi fetch, có nguy cơ SSRF:

- Truy cập localhost.
- Truy cập private IP hoặc cloud metadata endpoint.
- Bypass bằng redirect.
- DNS rebinding.
- Dùng scheme nguy hiểm.
- Đọc response lớn gây DoS.

Biện pháp:

1. Allowlist scheme, thường chỉ https.
2. Allowlist host/domain nếu use case cho phép.
3. Resolve và kiểm tra IP public/private.
4. Kiểm tra sau redirect.
5. Giới hạn port.
6. Đặt connect, read và overall timeout.
7. Giới hạn response size.
8. Không gửi credential nội bộ tới URL user chọn.
9. Log an toàn nhưng không lộ secret.

## 37.15. Câu hỏi phỏng vấn Networking

### URI và URL khác nhau thế nào?

URI là identifier có thể parse mà không kết nối. URL là abstraction gắn với việc locate hoặc access resource và là API legacy hơn trong nhiều HTTP use case.

### TCP có giữ message boundary không?

Không. TCP là ordered byte stream. Application phải tự thiết kế framing.

### HttpClient có ném exception khi nhận 404 không?

Thông thường không. 404 là HTTP response hợp lệ ở tầng transport; code phải kiểm tra status code.

### connect timeout và request timeout khác gì?

Connect timeout giới hạn thiết lập connection. Request timeout giới hạn completion của request. Cả hai không thay thế timeout của toàn bộ dependency chain.

### Vì sao phải xử lý InterruptedException?

Interruption là tín hiệu cancellation hoặc shutdown. Nuốt nó có thể khiến task không dừng đúng và làm hỏng lifecycle của executor hoặc request.

### Async request có giải quyết mọi concurrency problem không?

Không. Nó chỉ thay đổi cách chờ và composition. Resource pool, CPU, memory, downstream capacity và cancellation vẫn phải quản lý.

# CHƯƠNG 38. ADVANCED JAVA CORE CONCEPTS

## 38.1. Enum trong Java

Enum là một type đặc biệt biểu diễn một tập constant hữu hạn. Enum không chỉ là số nguyên có tên; mỗi constant là một object instance của enum type.

```java
public enum OrderStatus {
    CREATED,
    PAID,
    SHIPPED,
    CANCELLED
}
```

Enum có type safety:

```java
OrderStatus status = OrderStatus.PAID;
```

Không thể gán một String hoặc int tùy ý vào OrderStatus.

### Enum fields, constructor và methods

```java
public enum PaymentStatus {

    PENDING("P"),
    APPROVED("A"),
    REJECTED("R");

    private final String code;

    PaymentStatus(String code) {
        this.code = code;
    }

    public String code() {
        return code;
    }
}
```

Enum constructor được gọi khi JVM khởi tạo enum constants. Không thể gọi new PaymentStatus.

### valueOf và values

```java
OrderStatus status =
        OrderStatus.valueOf("PAID");

for (OrderStatus value : OrderStatus.values()) {
    System.out.println(value);
}
```

valueOf phân biệt hoa thường và ném IllegalArgumentException nếu tên không tồn tại. Không dùng valueOf trực tiếp với input user nếu chưa normalize và validate.

### name, ordinal và toString

- name trả tên khai báo.
- ordinal trả vị trí bắt đầu từ zero.
- toString có thể override.

Không nên lưu ordinal vào database hoặc dùng ordinal làm API contract. Chỉ cần đổi thứ tự constant là dữ liệu cũ có thể bị diễn giải sai. Nên lưu code ổn định:

```java
PaymentStatus status = PaymentStatus.APPROVED;
String databaseValue = status.code();
```

### Enum trong switch

```java
static boolean canShip(OrderStatus status) {
    return switch (status) {
        case PAID, SHIPPED -> true;
        case CREATED, CANCELLED -> false;
    };
}
```

Compiler có thể kiểm tra exhaustive switch trên enum. Nếu thêm constant mới, những switch expression phù hợp có thể báo lỗi khi compile lại.

### EnumSet và EnumMap

```java
EnumSet<OrderStatus> active =
        EnumSet.of(
                OrderStatus.CREATED,
                OrderStatus.PAID
        );

EnumMap<OrderStatus, String> labels =
        new EnumMap<>(OrderStatus.class);

labels.put(OrderStatus.PAID, "Payment completed");
```

EnumSet và EnumMap thường hiệu quả hơn collection tổng quát khi key/element là enum, vì chúng có thể dùng cấu trúc nội bộ chuyên biệt.

## 38.2. Nested Classes

Nested class là class được khai báo bên trong một class hoặc interface khác. Có bốn dạng thường gặp:

1. Static nested class.
2. Inner member class.
3. Local class.
4. Anonymous class.

### Static nested class

```java
class Outer {

    private static int version = 21;

    static class Nested {

        int readVersion() {
            return version;
        }
    }
}
```

Static nested class không giữ implicit reference tới một Outer instance. Nó có thể truy cập static members của Outer và những members được phép theo access control.

Tạo object:

```java
Outer.Nested nested = new Outer.Nested();
```

Phù hợp với helper hoặc type chỉ thuộc namespace của Outer mà không cần state của Outer instance.

### Inner member class

```java
class Account {

    private final String number;

    Account(String number) {
        this.number = number;
    }

    class Statement {

        String title() {
            return "Statement for " + number;
        }
    }
}
```

Inner class giữ implicit reference tới enclosing Account:

```java
Account account = new Account("ACC-1");
Account.Statement statement =
        account.new Statement();
```

Điều này cho phép truy cập instance state của outer object nhưng cũng có thể kéo dài lifetime của outer object nếu inner object sống lâu.

### Local class

Local class được khai báo bên trong method hoặc block:

```java
static Runnable createTask(String name) {

    class Task implements Runnable {

        @Override
        public void run() {
            System.out.println(name);
        }
    }

    return new Task();
}
```

Local class có thể capture local variable nếu biến final hoặc effectively final.

### Anonymous class

Anonymous class tạo một class implementation không có tên:

```java
Runnable task = new Runnable() {

    @Override
    public void run() {
        System.out.println("Running");
    }
};
```

Nếu target là functional interface, lambda thường ngắn gọn hơn:

```java
Runnable task = () ->
        System.out.println("Running");
```

Anonymous class vẫn phù hợp khi cần:

- Thêm state riêng.
- Override nhiều methods.
- Tạo một implementation chỉ dùng một lần.
- Có semantics this của object mới.

### this trong lambda và anonymous class

Trong lambda, this tham chiếu object enclosing. Trong anonymous class, this tham chiếu anonymous object.

Đây là khác biệt quan trọng khi callback truy cập state hoặc method:

```java
class Processor {

    private String name = "processor";

    void execute() {
        Runnable lambda = () ->
                System.out.println(this.name);

        Runnable anonymous = new Runnable() {
            private String name = "anonymous";

            @Override
            public void run() {
                System.out.println(this.name);
            }
        };
    }
}
```

### Rủi ro nested class

- Inner class có thể giữ outer reference ngoài ý muốn.
- Anonymous callback có thể giữ object graph lớn.
- Local class làm stack trace khó đọc.
- Nested type quá sâu làm API khó hiểu.
- Serialization của inner class có thể chứa synthetic reference không mong muốn.

Dùng static nested class nếu không cần outer instance.

## 38.3. Class identity và ClassLoader

Một runtime class không chỉ được xác định bởi fully qualified name. Class identity về khái niệm gồm:

```text
(binary name, defining class loader)
```

Hai class có cùng tên:

```text
com.example.User
```

nhưng được định nghĩa bởi hai class loaders khác nhau có thể là hai runtime types khác nhau.

### Ví dụ lỗi ClassCastException khó hiểu

Một plugin system có thể load cùng một class name từ hai version hoặc hai loader:

```java
Class<?> first = firstLoader.loadClass(
        "com.example.Plugin"
);

Class<?> second = secondLoader.loadClass(
        "com.example.Plugin"
);

System.out.println(first == second);
```

Kết quả có thể là false dù first.getName và second.getName giống nhau.

Object tạo từ first không nhất thiết cast được sang second.

### Context ClassLoader

Thread có context class loader:

```java
ClassLoader loader =
        Thread.currentThread().getContextClassLoader();
```

Framework và ServiceLoader thường dùng context class loader để tìm resource hoặc provider trong application/plugin context.

Khi tạo thread hoặc executor cho plugin, phải hiểu class loader nào sẽ được dùng. Giữ reference tới class loader lâu hơn lifecycle module có thể gây class loader leak.

### Khi nào class loader leak xảy ra?

- Static cache giữ class hoặc object của plugin.
- ThreadLocal trên thread sống lâu giữ plugin object.
- Thread context class loader không được reset.
- Listener hoặc executor không shutdown.
- Generated proxy/class không được giải phóng cùng loader.

Class loader leak thường biểu hiện rõ trong application server, hot reload hoặc plugin reload.

## 38.4. ServiceLoader

ServiceLoader cung cấp cơ chế tìm và load provider implementation theo service contract.

### Service interface

```java
public interface PaymentProcessor {

    String name();

    void process(long amount);
}
```

### Provider implementation

```java
public final class CardPaymentProcessor
        implements PaymentProcessor {

    @Override
    public String name() {
        return "card";
    }

    @Override
    public void process(long amount) {
        System.out.println("Card: " + amount);
    }
}
```

### Load provider bằng class path

Tạo file:

```text
META-INF/services/com.example.PaymentProcessor
```

Nội dung:

```text
com.example.CardPaymentProcessor
```

Đọc provider:

```java
ServiceLoader<PaymentProcessor> loader =
        ServiceLoader.load(PaymentProcessor.class);

for (PaymentProcessor processor : loader) {
    processor.process(100);
}
```

ServiceLoader thường lazy-load provider khi iteration. Constructor provider phải đáp ứng contract của ServiceLoader.

### ServiceLoader trong module system

Provider module:

```java
module com.example.payment.card {

    requires com.example.payment.api;

    provides com.example.PaymentProcessor
            with com.example.CardPaymentProcessor;
}
```

Consumer module:

```java
module com.example.checkout {

    requires com.example.payment.api;

    uses com.example.PaymentProcessor;
}
```

Trong JPMS, provides khai báo implementation; uses khai báo module cần tìm service.

### ServiceLoader và lỗi runtime

Các lỗi thường gặp:

- File services sai tên.
- Provider class không public hoặc không có constructor phù hợp.
- Thiếu module uses hoặc provides.
- Dependency không có trên class path/module path.
- Context class loader không thấy provider.
- Provider constructor throw exception.

### Khi nào dùng ServiceLoader?

Phù hợp:

- Plugin architecture.
- SPI của JDK.
- Driver/provider có thể thay thế.
- Tách core API khỏi implementation.

Không nên dùng khi chỉ cần dependency injection đơn giản trong một application; DI container thường cung cấp lifecycle, scope và configuration phong phú hơn.

## 38.5. MethodHandle

MethodHandle thuộc java.lang.invoke và biểu diễn một reference có thể invoke tới method, constructor hoặc field operation.

So với Reflection, MethodHandle tập trung hơn vào typed invocation và có thể composition với các handle khác.

### Gọi instance method

```java
static int stringLength(String value)
        throws Throwable {

    MethodHandles.Lookup lookup =
            MethodHandles.lookup();

    MethodHandle handle = lookup.findVirtual(
            String.class,
            "length",
            MethodType.methodType(int.class)
    );

    return (int) handle.invokeExact(value);
}
```

invokeExact yêu cầu signature runtime khớp chính xác. Kiểu cast ở return và kiểu static của arguments có thể ảnh hưởng kết quả.

### Gọi static method

```java
static int max(int left, int right)
        throws Throwable {

    MethodHandles.Lookup lookup =
            MethodHandles.lookup();

    MethodHandle handle = lookup.findStatic(
            Math.class,
            "max",
            MethodType.methodType(
                    int.class,
                    int.class,
                    int.class
            )
    );

    return (int) handle.invokeExact(left, right);
}
```

### invoke và invokeExact

- invokeExact yêu cầu type signature chính xác.
- invoke cho phép một số adaptation theo method handle type.
- Cả hai khai báo throws Throwable trong nhiều cách sử dụng.

Không dùng invokeExact như method call thông thường nếu chưa hiểu static type và MethodType.

### Lookup và access control

MethodHandles.Lookup xác định quyền truy cập tại nơi lookup được tạo. Không phải lookup nào cũng có quyền private hoặc module-crossing.

```java
MethodHandles.Lookup lookup =
        MethodHandles.privateLookupIn(
                Target.class,
                MethodHandles.lookup()
        );
```

privateLookupIn vẫn phụ thuộc module opens và access rules; nó không phải bypass vô hạn.

### Khi nào dùng MethodHandle?

- Framework invocation.
- Dynamic language runtime.
- Adapter và method composition.
- Performance-sensitive infrastructure sau benchmark.
- Thay thế một số reflective hot path.

Business code nên dùng direct call hoặc interface nếu type đã biết.

## 38.6. VarHandle

VarHandle cung cấp typed access tới fields, array elements hoặc memory locations với các access modes khác nhau, bao gồm volatile, acquire/release và compare-and-set.

```java
class Counter {
    int value;
}

VarHandle VALUE = MethodHandles.lookup()
        .findVarHandle(
                Counter.class,
                "value",
                int.class
        );

Counter counter = new Counter();
VALUE.set(counter, 10);
int value = (int) VALUE.get(counter);
```

VarHandle hữu ích trong concurrent data structure và low-level library. Nó không nên được dùng để thay thế synchronized hoặc AtomicInteger mà không hiểu Java Memory Model.

### VarHandle và Atomicity

```java
boolean updated = VALUE.compareAndSet(
        counter,
        10,
        11
);
```

Compare-and-set chỉ atomic cho access được hỗ trợ, không làm toàn bộ business transaction atomic. Vẫn phải thiết kế invariant và retry loop đúng.

## 38.7. Java Platform Module System

JPMS được giới thiệu từ Java 9 để tổ chức application và library thành các module có dependency graph và encapsulation rõ hơn.

### module-info.java

```java
module com.example.orders {

    requires java.net.http;

    exports com.example.orders.api;
}
```

Module có thể:

- requires dependency.
- exports public package.
- opens package cho deep reflection.
- uses service.
- provides service implementation.

### exports và opens

```java
module com.example.orders {

    exports com.example.orders.api;

    opens com.example.orders.persistence
            to org.hibernate.orm.core;
}
```

exports phục vụ ordinary access tới public types. opens phục vụ deep reflection runtime; opens không đồng nghĩa package được export để module khác compile trực tiếp.

Không mở toàn bộ module bằng opens ... nếu chỉ một framework package cần truy cập.

### requires transitive và static

requires transitive làm dependency trở thành một phần readable API của module phụ thuộc.

requires static biểu diễn dependency cần ở compile time nhưng có thể không cần trong runtime module graph. Nếu code thực sự gọi class ở runtime mà module không có, lỗi vẫn xảy ra.

### Compile và run module

```bash
javac -d out --module-source-path src ^
    -m com.example.orders,com.example.app

java --module-path out ^
    -m com.example.app/com.example.app.Main
```

Dấu ^ là line continuation của Windows CMD. Unix-like shell dùng backslash hoặc viết trên một dòng.

### Class path và module path

Class path linh hoạt và tương thích legacy hơn, nhưng không có strong encapsulation như named module. Module path cung cấp:

- Readability graph.
- Explicit exports.
- Service declarations.
- Split package detection trong một số trường hợp.
- Hỗ trợ custom runtime image với jlink.

Không phải application nào cũng cần module hóa ngay. Migration cần kiểm kê dependency, reflection access và build tool.

## 38.8. Java Logging API

Java SE cung cấp java.util.logging, thường gọi là JUL.

### Logger cơ bản

```java
private static final Logger LOGGER =
        Logger.getLogger(OrderService.class.getName());

LOGGER.info("Order created");
LOGGER.warning("Slow downstream");
LOGGER.log(
        Level.SEVERE,
        "Cannot process order",
        exception
);
```

Logger có levels thường gặp:

```text
SEVERE
WARNING
INFO
CONFIG
FINE
FINER
FINEST
```

### Logger thay vì System.out

System.out không cung cấp:

- Level.
- Timestamp chuẩn.
- Logger name.
- Handler/configuration.
- Structured context.
- Routing theo environment.

Backend nên dùng logging abstraction phù hợp với stack, nhưng hiểu JUL giúp đọc Java SE và library logs.

### Lazy message

```java
LOGGER.log(
        Level.FINE,
        () -> "Expensive detail: " + buildDebugText()
);
```

Supplier giúp tránh tạo message tốn chi phí khi level không được bật.

### Không log secrets

Không ghi vào log:

- Password.
- Access token.
- Refresh token.
- Private key.
- Full payment card number.
- Personal data không cần thiết.

Log exception cần giữ stack trace ở nơi phù hợp nhưng phải redact request data.

### JUL configuration

JUL có Handler, Formatter, Filter và Level. File logging.properties có thể cấu hình handler và level, nhưng production thường cần integration với logging framework hoặc collector tập trung.

## 38.9. Formatter

Formatter cung cấp format text theo pattern.

```java
String message = String.format(
        "User %s has %d orders",
        "alice",
        3
);
```

Hoặc:

```java
String message = "User %s has %d orders"
        .formatted("alice", 3);
```

### Format specifier

```java
String value = String.format(
        "amount=%,.2f",
        1_234_567.5
);
```

Formatter có thể chịu ảnh hưởng Locale:

```java
String value = String.format(
        Locale.US,
        "amount=%,.2f",
        1_234_567.5
);
```

Không dùng String.format để tạo SQL command hoặc shell command từ input user. Formatting và escaping theo security context là hai vấn đề khác nhau.

### java.util.Formatter

Formatter hỗ trợ ghi vào Appendable như StringBuilder hoặc Writer:

```java
StringBuilder builder = new StringBuilder();

try (Formatter formatter = new Formatter(builder)) {
    formatter.format(
            Locale.US,
            "total=%,.2f",
            1250.5
    );
}
```

Đối với string đơn giản, formatted thường dễ đọc hơn. Formatter hữu ích khi cần nhiều specifier, Locale hoặc output stream.

## 38.10. Locale và Internationalization

Locale mô tả language, country/region và đôi khi variant của người dùng hoặc môi trường.

```java
Locale vietnam = Locale.forLanguageTag("vi-VN");
Locale english = Locale.US;

System.out.println(vietnam.getLanguage());
System.out.println(vietnam.getCountry());
```

### Locale mặc định

```java
Locale current = Locale.getDefault();
```

Không nên dựa vào default Locale cho dữ liệu machine-to-machine:

- Decimal parsing.
- Date parsing.
- Protocol field.
- Database key.
- Log format cần máy đọc.

Hãy chỉ định Locale rõ ràng, thường Locale.ROOT hoặc một Locale nghiệp vụ cụ thể.

### Locale.ROOT

```java
String normalized =
        input.toLowerCase(Locale.ROOT);
```

Locale.ROOT phù hợp cho normalization kỹ thuật, không phải hiển thị văn bản tự nhiên cho người dùng.

### Internationalization và localization

- Internationalization, i18n: thiết kế ứng dụng có thể hỗ trợ nhiều ngôn ngữ/region.
- Localization, l10n: cung cấp dữ liệu và format cho một Locale cụ thể.

Các phần cần quan tâm:

- Text translation.
- Date/time format.
- Number format.
- Currency.
- Pluralization.
- Time zone.
- Collation/sorting.

Không nên tự nối chuỗi UI bằng if language quá nhiều trong business code.

## 38.11. ResourceBundle

ResourceBundle tìm resource theo base name và Locale, thường dùng cho message dịch.

File:

```text
messages.properties
messages_vi.properties
messages_en.properties
```

Nội dung messages.properties:

```properties
welcome=Welcome, {0}
order.created=Order {0} was created
```

Nội dung messages_vi.properties:

```properties
welcome=Xin chào, {0}
order.created=Đơn hàng {0} đã được tạo
```

Đọc bundle:

```java
Locale locale = Locale.forLanguageTag("vi-VN");

ResourceBundle bundle =
        ResourceBundle.getBundle(
                "messages",
                locale
        );

String template = bundle.getString("welcome");
String message = MessageFormat.format(
        template,
        "Alice"
);
```

### Fallback

ResourceBundle có cơ chế tìm fallback theo Locale và base bundle. Nếu thiếu key, MissingResourceException có thể xảy ra.

Best practice:

- Dùng key ổn định, không dùng câu text làm key.
- Kiểm tra bundle đầy đủ trong CI.
- Không đưa secret hoặc business decision vào properties.
- Format arguments đúng kiểu.
- Chọn Locale từ request/user profile nhưng validate.

### MessageFormat

```java
String message = MessageFormat.format(
        "There are {0} orders",
        3
);
```

MessageFormat có quy tắc riêng cho quote, number, date và plural. Không dùng nó như String.format nếu format cần locale-specific.

## 38.12. ProcessBuilder

ProcessBuilder tạo process bên ngoài JVM.

```java
ProcessBuilder builder = new ProcessBuilder(
        "git",
        "--version"
);

Process process = builder.start();
int exitCode = process.waitFor();
```

Truyền arguments thành từng phần tử giúp tránh shell parsing không cần thiết:

```java
new ProcessBuilder(
        "command",
        userArgument
);
```

Không ghép user input vào một shell command:

```java
new ProcessBuilder(
        "sh",
        "-c",
        "command " + userInput
);
```

Cách này có nguy cơ command injection.

### Đọc output

```java
Process process = new ProcessBuilder(
        "java",
        "-version"
).redirectErrorStream(true).start();

String output = new String(
        process.getInputStream().readAllBytes(),
        StandardCharsets.UTF_8
);

int exitCode = process.waitFor();
```

### Deadlock khi đọc output

Nếu process ghi đầy stdout hoặc stderr pipe nhưng parent không đọc, child có thể block và parent waitFor cũng không hoàn thành.

Biện pháp:

- redirectErrorStream(true) khi phù hợp.
- Đọc stdout và stderr đồng thời.
- redirectOutput tới file hoặc DISCARD nếu không cần.
- Giới hạn output size.
- Đặt timeout và destroy process khi quá hạn.

### ProcessBuilder environment và directory

```java
ProcessBuilder builder = new ProcessBuilder("tool", "--check");
builder.directory(new File("work"));
builder.environment().put("APP_MODE", "batch");
```

Không đặt secret vào command line vì command line có thể bị quan sát bởi process monitor. Dùng environment hoặc secret mechanism phù hợp, vẫn đánh giá rủi ro leakage.

## 38.13. ProcessHandle

ProcessHandle đại diện cho process và cung cấp thông tin/lifecycle operations.

```java
ProcessHandle current =
        ProcessHandle.current();

System.out.println(current.pid());
System.out.println(current.info().command());
System.out.println(current.children().count());
```

Lấy descendants:

```java
current.descendants().forEach(
        child -> System.out.println(child.pid())
);
```

Theo dõi process kết thúc:

```java
process.toHandle()
        .onExit()
        .thenAccept(handle ->
                System.out.println(
                        "Exit: " + handle.pid()
                )
        );
```

### destroy và destroyForcibly

- destroy yêu cầu process kết thúc theo cơ chế bình thường của OS.
- destroyForcibly yêu cầu mạnh hơn nhưng vẫn phụ thuộc platform.

Luôn thiết kế cleanup nếu process bị timeout hoặc application shutdown.

### Rủi ro khi chạy process

- Command injection.
- Quyền OS quá rộng.
- Working directory không an toàn.
- Path traversal.
- Process zombie hoặc orphan.
- Resource exhaustion.
- Output chứa secret hoặc dữ liệu không kiểm soát.

ProcessBuilder không phải sandbox. Nếu chạy input không tin cậy, cần isolation ở OS/container và policy riêng.

## 38.14. Java Security Basics

Java security không phải một API duy nhất. Nó gồm nhiều lớp:

- Access control và module boundaries.
- TLS và certificate validation.
- Cryptographic primitives.
- Secure random generation.
- Secret management.
- Input validation.
- Process/OS permissions.
- Serialization và deserialization safety.
- Authentication, authorization ở application layer.

Không nên nhầm việc dùng HTTPS với việc application đã có authentication và authorization. TLS bảo vệ channel; nó không quyết định user được phép làm gì.

### Không tự thiết kế cryptography

Nếu cần encryption, signature, password hashing hoặc token protocol, nên dùng chuẩn và thư viện đã được kiểm chứng. Không tự ghép hash, salt, XOR hoặc encoding để tạo security scheme.

## 38.15. MessageDigest

MessageDigest tính digest một chiều của bytes:

```java
MessageDigest digest =
        MessageDigest.getInstance("SHA-256");

byte[] hash = digest.digest(
        "hello".getBytes(StandardCharsets.UTF_8)
);

String hex = HexFormat.of().formatHex(hash);
System.out.println(hex);
```

Digest phù hợp với:

- Integrity check.
- Content fingerprint.
- Cache key.
- So sánh dữ liệu đã hash trong use case phù hợp.

Digest không phải encryption; không thể lấy lại input từ hash theo cách thông thường.

### So sánh digest

Không dùng == để so sánh byte array:

```java
boolean same = MessageDigest.isEqual(
        expected,
        actual
);
```

MessageDigest.isEqual có semantics phù hợp hơn cho so sánh giá trị byte trong context cần giảm timing leak. Tuy nhiên, chống timing attack còn phụ thuộc toàn bộ hệ thống và cách secret được xử lý.

### Password hashing

Không dùng SHA-256 đơn giản để lưu password:

```java
MessageDigest.getInstance("SHA-256");
```

Password cần password hashing function có salt, cost và memory hardness phù hợp, chẳng hạn Argon2id, bcrypt hoặc scrypt thông qua thư viện được kiểm chứng. Java SE không cung cấp đầy đủ password storage policy cho application.

### Digest và encoding

Hash bytes phải thống nhất charset:

```java
byte[] bytes =
        text.getBytes(StandardCharsets.UTF_8);
```

Không dùng charset mặc định khi digest dữ liệu cần portable.

## 38.16. SecureRandom

SecureRandom tạo random values phù hợp hơn cho token, nonce và security-sensitive identifier so với Random.

```java
SecureRandom random = new SecureRandom();

byte[] token = new byte[32];
random.nextBytes(token);

String value = HexFormat.of().formatHex(token);
```

### Random vs ThreadLocalRandom vs SecureRandom

| API | Use case | Security token |
| --- | --- | --- |
| Random | Random thông thường, reproducible nếu seed | Không |
| ThreadLocalRandom | Concurrent simulation/load/random utility | Không |
| SecureRandom | Token, nonce, key material theo contract | Có thể phù hợp |

UUID.randomUUID thường dùng SecureRandom-based mechanism nhưng không nên mặc định coi UUID là secret token hoặc authorization credential. Token cần entropy, expiry, revocation và storage policy rõ.

### Không tự seed thiếu entropy

Không seed SecureRandom bằng timestamp để “tăng random”. Có thể làm entropy yếu. Để provider/OS seed theo cơ chế của JDK, trừ khi có yêu cầu cryptographic rõ ràng.

### Secret token best practices

- Đủ dài và đủ entropy.
- Encode bằng Hex hoặc Base64 URL-safe.
- Có expiry.
- Có rotation/revocation.
- Không log token.
- Lưu hash token nếu database chỉ cần kiểm tra token.
- So sánh giá trị nhạy cảm bằng cơ chế phù hợp.

## 38.17. HexFormat và binary-to-text

Java 17 cung cấp HexFormat:

```java
HexFormat hex = HexFormat.of();

String encoded = hex.formatHex(new byte[]{1, 2, 15});
byte[] decoded = hex.parseHex(encoded);
```

Hex dễ đọc nhưng kích thước gấp đôi bytes. Base64 thường ngắn hơn cho transport:

```java
String base64 = Base64.getUrlEncoder()
        .withoutPadding()
        .encodeToString(token);
```

Chọn encoding theo protocol; encoding không phải encryption.

## 38.18. Security và Reflection/Annotations

Reflection và annotation có thể tạo attack surface:

- Annotation chứa endpoint hoặc class name từ config không tin cậy.
- Reflection invoke method mà user điều khiển tên.
- Custom deserializer instantiate class tùy ý.
- Plugin provider chạy code với quyền của JVM.
- ProcessBuilder chạy command từ annotation/config.

Nguyên tắc:

1. Không dùng class name từ user để load tùy ý.
2. Whitelist provider, method và command.
3. Validate annotation values ở startup.
4. Fail fast nếu security-critical annotation sai.
5. Không coi metadata là trusted chỉ vì nó nằm trong class file.
6. Giới hạn module opens.

## 38.19. Bài tập thực hành

### Bài 1 — Mini dependency injector

Tạo annotation Inject có Retention RUNTIME và Target FIELD. Viết container nhỏ:

1. Nhận Class<?> root type.
2. Tạo object bằng constructor không tham số.
3. Tìm fields có Inject.
4. Tạo dependency từ một whitelist.
5. Set field nếu access hợp lệ.

Không cho phép class name từ user input và ghi rõ giới hạn của bài tập.

### Bài 2 — Annotation route scanner

Tạo annotation Route với method, path và status. Scan một controller:

1. Tìm methods có Route.
2. Kiểm tra method public và signature hợp lệ.
3. Tạo immutable route registry.
4. Từ chối duplicate method/path ở startup.

### Bài 3 — HTTP client wrapper

Viết ApiClient:

- Nhận HttpClient qua constructor.
- Có base URI.
- Có connect/request timeout.
- Kiểm tra 2xx.
- Map 4xx và 5xx thành exception riêng.
- Restore interrupt khi bị InterruptedException.
- Không log Authorization header.

### Bài 4 — SSRF-safe fetcher

Viết URL fetcher chỉ cho phép:

- Scheme https.
- Allowlist host.
- Port 443.
- Response tối đa 1 MB.
- Timeout tổng thể.
- Không follow redirect sang host ngoài allowlist.

### Bài 5 — ServiceLoader plugin

Tạo PaymentProcessor SPI và hai providers. Load bằng ServiceLoader, kiểm tra duplicate provider name và xử lý provider lỗi.

### Bài 6 — Process timeout

Dùng ProcessBuilder chạy một command an toàn từ allowlist, đọc stdout/stderr, đặt timeout bằng ProcessHandle hoặc Future, rồi destroy process khi quá hạn.

## 38.20. Câu hỏi phỏng vấn tổng hợp

### Reflection và direct invocation khác nhau thế nào?

Direct invocation được compiler kiểm tra rõ và thường dễ tối ưu. Reflection linh hoạt ở runtime nhưng có lookup, access, typing và debugging cost.

### MethodHandle có luôn nhanh hơn Method.invoke không?

Không. MethodHandle có thể tối ưu tốt trong một số hot path sau khi cache và warmup, nhưng phải benchmark đúng workload.

### Annotation Retention mặc định là gì?

CLASS. Muốn đọc qua runtime Reflection cần RUNTIME.

### Inherited có làm annotation truyền qua interface không?

Không. Inherited không tự truyền annotation theo interface implementation hoặc method override.

### Enum ordinal có nên lưu database không?

Không nên. Thứ tự constant có thể thay đổi. Lưu code hoặc name có contract migration rõ.

### Inner class khác static nested class thế nào?

Inner class giữ implicit reference tới outer instance. Static nested class không cần outer instance và thường tránh được retention không mong muốn.

### TCP có phải protocol message không?

Không. TCP là ordered byte stream. Application protocol phải tự định nghĩa message framing.

### HttpClient có xử lý JSON không?

Không có JSON mapper đầy đủ trong Java SE. HttpClient truyền bytes/text; JSON mapping thường dùng thư viện ngoài.

### Vì sao retry POST nguy hiểm?

POST có thể tạo side effect nhiều lần. Cần idempotency key hoặc business contract bảo đảm lặp request an toàn.

### MessageDigest có dùng để hash password không?

Không dùng digest nhanh đơn giản cho password storage. Cần password hashing function có salt và cost phù hợp như Argon2id, bcrypt hoặc scrypt qua thư viện kiểm chứng.

### SecureRandom khác Random thế nào?

SecureRandom được thiết kế cho security-sensitive randomness; Random và ThreadLocalRandom phù hợp simulation hoặc utility không yêu cầu chống đoán.

### ProcessBuilder có phải sandbox không?

Không. Process chạy với quyền OS của JVM nếu không có isolation bên ngoài.

### ServiceLoader phù hợp với use case nào?

SPI, provider và plugin architecture. Nó không thay thế toàn bộ dependency injection container.

## 38.21. Kiến thức cần nhớ

- Reflection đọc và thao tác runtime metadata nhưng không nên thay thế type-safe design.
- Class identity gồm binary name và defining class loader.
- getFields/getMethods chỉ tập trung vào public members; getDeclared... chỉ members được khai báo trực tiếp.
- Reflection invoke bọc exception của target trong InvocationTargetException.
- Module boundaries ảnh hưởng deep reflection; exports và opens có ý nghĩa khác nhau.
- Annotation chỉ là metadata cho đến khi compiler, processor hoặc framework xử lý.
- Retention, Target, Inherited, Documented và Repeatable quyết định annotation hoạt động ở đâu.
- Runtime annotation processing khác compile-time annotation processing.
- URI là data structure identifier; HttpClient mới thực hiện HTTP request.
- TCP là byte stream không có message boundary; UDP là datagram best-effort.
- HTTP 4xx/5xx vẫn là response hợp lệ ở transport layer; phải kiểm tra status code.
- Timeout, cancellation, retry, idempotency và SSRF protection là trách nhiệm của application.
- Enum là object type có tập constant hữu hạn; không lưu ordinal làm persistence contract.
- Static nested class không giữ outer reference; inner class có thể giữ outer object.
- ServiceLoader tách service contract khỏi provider implementation.
- MethodHandle và VarHandle là low-level APIs, cần hiểu access và memory semantics.
- MessageDigest không phải encryption và không phải password hashing policy.
- SecureRandom phù hợp token/nonce; không log hoặc tự seed yếu.

# TỔNG KẾT PHẦN 12

Phần 12 giúp kết nối Java Core với cách framework và backend runtime hoạt động:

1. Reflection cung cấp khả năng inspect và invoke động.
2. Annotation cung cấp metadata để compiler, processor và framework xử lý.
3. Networking cung cấp các tầng từ DNS, TCP/UDP đến HTTP client.
4. Advanced APIs cung cấp SPI, module boundary, dynamic invocation, logging, process và security primitives.

Spring Boot thường che giấu phần lớn cơ chế này, nhưng khi gặp lỗi startup, proxy, class loader, timeout, certificate, missing provider hoặc annotation không được đọc, kiến thức Java SE là nền tảng để chẩn đoán.

Không nên dùng Reflection, process execution hoặc cryptography primitives một cách tùy tiện. Hãy ưu tiên API type-safe, giới hạn input, cấu hình timeout, bảo vệ secret và kiểm thử behavior trên đúng JDK/runtime mà hệ thống triển khai.

# TÀI LIỆU THAM KHẢO

- [Class and Reflection API — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Class.html)
- [java.lang.reflect Package — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/reflect/package-summary.html)
- [Annotations — Java Language Specification](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html)
- [java.net.http Package — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/module-summary.html)
- [HttpClient — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.net.http/java/net/http/HttpClient.html)
- [ServiceLoader — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ServiceLoader.html)
- [MethodHandle — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/invoke/MethodHandle.html)
- [ProcessBuilder — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ProcessBuilder.html)
- [MessageDigest — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/MessageDigest.html)
- [SecureRandom — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/security/SecureRandom.html)
