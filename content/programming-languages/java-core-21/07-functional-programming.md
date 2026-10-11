# JAVA CORE 21 — PHẦN 7: FUNCTIONAL PROGRAMMING

Giáo trình lý thuyết chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Phần 7 kết hợp kiến thức OOP, Collections Framework và Generics để giải thích cách Java xử lý behavior như dữ liệu thông qua lambda, functional interface, method reference và Stream API.

Trong Java Backend, bạn sẽ thường xuyên gặp những biểu thức như:

```java
users.stream()
        .filter(User::isActive)
        .map(User::getEmail)
        .toList();
```

Hoặc:

```java
repository.findById(userId)
        .orElseThrow(() ->
                new UserNotFoundException("User not found")
        );
```

Để đọc và thiết kế được những đoạn code này, cần hiểu cả cú pháp, type inference, lazy evaluation, null handling và các quy tắc về side effects.

## Nội dung Phần 7

| Chương | Chủ đề | Trọng tâm |
| --- | --- | --- |
| 21 | Lambda Expressions | Functional Interface, Predicate, Function, Consumer, Supplier, Method Reference |
| 22 | Stream API | Pipeline, intermediate/terminal operations, Collectors, primitive streams, parallel streams |
| 23 | Optional | Nullable values, map, flatMap, fallback, exception và best practices |

# CHƯƠNG 21. LAMBDA EXPRESSIONS

## 21.1. Functional Programming là gì?

Functional Programming (FP) là phong cách lập trình xem function và việc kết hợp các function là công cụ trung tâm để biến đổi dữ liệu.

Một số khái niệm thường gặp:

- **Pure function:** kết quả phụ thuộc vào input và không tạo side effect quan sát được.
- **Immutability:** hạn chế thay đổi state đã tồn tại.
- **Higher-order function:** function nhận function khác làm argument hoặc trả về một function.
- **Function composition:** kết hợp các function nhỏ thành logic lớn hơn.
- **Declarative programming:** mô tả kết quả cần đạt thay vì liệt kê mọi bước điều khiển chi tiết.

Java không phải ngôn ngữ thuần functional. OOP, mutable object, exception và side effect vẫn là những phần quan trọng của Java. Tuy nhiên, từ Java 8, lambda, method reference, functional interface và Stream API cho phép Java viết nhiều logic theo phong cách functional.

### Pure function và side effect

Ví dụ gần với pure function:

```java
static int square(int value) {
    return value * value;
}
```

Method này chỉ phụ thuộc vào `value` và không thay đổi state bên ngoài.

Ví dụ có side effect:

```java
private static int total;

static int addToTotal(int value) {
    total += value;
    return total;
}
```

Kết quả phụ thuộc vào lịch sử gọi trước đó và method thay đổi state dùng chung. Điều này không tự động làm code sai, nhưng làm reasoning, testing và parallel execution khó hơn.

### Imperative và declarative

Giả sử cần lấy số chẵn rồi nhân với 2:

```java
List<Integer> numbers = List.of(1, 2, 3, 4, 5);

List<Integer> imperative = new ArrayList<>();

for (Integer number : numbers) {
    if (number % 2 == 0) {
        imperative.add(number * 2);
    }
}
```

Cách declarative:

```java
List<Integer> declarative = numbers.stream()
        .filter(number -> number % 2 == 0)
        .map(number -> number * 2)
        .toList();
```

Kết quả:

```java
[4, 8]
```

Cách dùng Stream thể hiện pipeline:

1. Lọc phần tử thỏa điều kiện.
2. Biến đổi từng phần tử.
3. Tạo list kết quả.

Không nên hiểu rằng Stream luôn tốt hơn vòng lặp. Vòng lặp thường dễ debug hơn trong logic nhiều nhánh, còn Stream phù hợp với pipeline biến đổi dữ liệu rõ ràng.

## 21.2. Lambda Expression là gì?

Lambda expression là biểu thức cung cấp implementation cho một functional interface trong một target type phù hợp.

Ví dụ:

```java
(a, b) -> a + b
```

Bản thân biểu thức trên chưa cho biết kiểu đầy đủ. Compiler cần target type:

```java
BinaryOperator<Integer> add = (a, b) -> a + b;

int result = add.apply(10, 20);
```

Trong ví dụ:

- `BinaryOperator<Integer>` là target functional interface type.
- `(a, b)` là parameter list.
- `->` là lambda operator.
- `a + b` là expression body.
- `apply` là abstract method được gọi khi lambda thực thi.

Lambda không phải một function độc lập có kiểu tùy ý như trong một số ngôn ngữ khác. Nó luôn được biên dịch trong ngữ cảnh của một functional interface hoặc target type tương thích.

### Lambda được thực thi khi nào?

Việc tạo lambda không đồng nghĩa body được chạy ngay:

```java
Supplier<String> supplier = () -> {
    System.out.println("Body is running");
    return "value";
};

System.out.println("Before get");
String value = supplier.get();
```

Kết quả:

```java
Before get
Body is running
```

Body chạy khi abstract method, ở đây là `get()`, được gọi.

### Lambda có phải Anonymous Class không?

Không.

Lambda và anonymous class đều có thể cung cấp behavior cho một interface, nhưng ngữ nghĩa khác nhau:

- Lambda không tạo ra một scope class declaration như anonymous class.
- `this` trong lambda trỏ tới instance enclosing context; `this` trong anonymous class trỏ tới anonymous object.
- Lambda không tự khai báo fields và methods bổ sung như một anonymous class.
- Runtime có thể tạo lambda bằng cơ chế như `invokedynamic`, không nên suy luận từ source rằng luôn có một anonymous class riêng.
- Lambda phù hợp với một behavior ngắn; anonymous class phù hợp khi cần state hoặc nhiều override phức tạp.

## 21.3. Tại sao Java cần Lambda?

Trước Java 8, behavior thường được truyền bằng anonymous class:

```java
interface Calculator {
    int calculate(int a, int b);
}

Calculator calculator = new Calculator() {
    @Override
    public int calculate(int a, int b) {
        return a + b;
    }
};
```

Với lambda:

```java
Calculator calculator = (a, b) -> a + b;
```

Lambda làm giảm boilerplate và giúp code tập trung vào logic cần truyền.

Trong backend, điều này xuất hiện ở:

- Predicate lọc dữ liệu.
- Function mapping entity sang DTO.
- Comparator sắp xếp.
- Supplier tạo giá trị mặc định hoặc object lazy.
- Callback trong asynchronous API.
- Stream pipeline.

Lambda không làm mất OOP. Functional interface vẫn là object contract, có thể được truyền qua method, lưu vào field hoặc kết hợp với generic type.

## 21.4. Lambda Syntax

### Không có parameter

```java
Runnable task = () -> System.out.println("Running");
task.run();
```

### Một parameter

Có thể bỏ ngoặc:

```java
Consumer<String> printer =
        message -> System.out.println(message);
```

Hoặc viết đầy đủ:

```java
Consumer<String> printer =
        (String message) -> System.out.println(message);
```

Không được trộn kiểu một cách tùy ý:

```java
// (String message, value) -> ... // Không hợp lệ
```

Nếu khai báo explicit type cho một parameter, cần khai báo cho toàn bộ parameter list.

### Nhiều parameters

```java
BinaryOperator<Integer> sum =
        (a, b) -> a + b;
```

Có thể khai báo types tường minh:

```java
BinaryOperator<Integer> sum =
        (Integer a, Integer b) -> a + b;
```

### Expression body

```java
Function<String, Integer> length =
        text -> text.length();
```

Expression được dùng làm return value của functional method.

### Block body

```java
Function<String, Integer> length =
        text -> {
            String normalized = text.strip();
            return normalized.length();
        };
```

Block body phải có `return` nếu target method trả về giá trị.

### Void lambda

```java
Consumer<String> log =
        message -> {
            System.out.println("[INFO] " + message);
        };
```

### Lambda nhiều dòng không phải lúc nào cũng tốt

Nếu lambda có nhiều nhánh, nhiều exception hoặc nhiều side effect, hãy cân nhắc tách thành named method:

```java
.filter(this::isEligibleUser)
.map(this::toUserResponse)
```

Named method thường dễ đặt breakpoint, tái sử dụng và unit test hơn một lambda dài.

## 21.5. Functional Interface là gì?

Functional interface là interface có đúng một abstract method theo các quy tắc của Java.

```java
@FunctionalInterface
interface Calculator {
    int calculate(int a, int b);
}
```

Sử dụng:

```java
Calculator addition = (a, b) -> a + b;
Calculator multiplication = (a, b) -> a * b;

System.out.println(addition.calculate(2, 3));
System.out.println(multiplication.calculate(2, 3));
```

Kết quả:

```java
5
6
```

### Functional interface có được có nhiều method không?

Có, miễn chỉ có một abstract method được tính:

```java
@FunctionalInterface
interface Greeting {

    void greet(String name);

    default void greetDefault() {
        greet("Guest");
    }

    static String version() {
        return "1.0";
    }
}
```

`greet` là abstract method. `greetDefault` là default method và `version` là static method nên không làm mất tính functional.

Các method tương ứng với public method của `Object` có quy tắc đặc biệt khi xác định abstract method. Vì vậy cần dựa vào compiler thay vì đếm máy móc mọi dòng method declaration.

### `@FunctionalInterface` có bắt buộc không?

Không. Một interface vẫn là functional interface nếu thỏa contract mà không có annotation.

Tuy nhiên, nên dùng annotation vì compiler sẽ phát hiện khi ai đó thêm abstract method làm interface không còn phù hợp với lambda.

### Function type và target typing

```java
var add = (Integer a, Integer b) -> a + b;
```

Dòng trên không hợp lệ vì lambda cần target type; `var` không tự cung cấp functional interface type.

Cách đúng:

```java
BinaryOperator<Integer> add =
        (a, b) -> a + b;

var anotherAdd = add;
```

Sau khi có target type, `var` có thể suy luận kiểu của biến là `BinaryOperator<Integer>`.

# 21.6. CÁC FUNCTIONAL INTERFACES QUAN TRỌNG

Các interface chuẩn nằm chủ yếu trong package `java.util.function`.

| Interface | Abstract method | Ý nghĩa |
| --- | --- | --- |
| `Predicate<T>` | `boolean test(T)` | Nhận input, trả boolean |
| `Function<T, R>` | `R apply(T)` | Nhận input, trả output |
| `Consumer<T>` | `void accept(T)` | Nhận input, không trả kết quả |
| `Supplier<T>` | `T get()` | Không nhận input, cung cấp output |
| `UnaryOperator<T>` | `T apply(T)` | Input và output cùng type |
| `BinaryOperator<T>` | `T apply(T, T)` | Hai input và output cùng type |
| `BiFunction<T, U, R>` | `R apply(T, U)` | Hai input, một output |
| `BiPredicate<T, U>` | `boolean test(T, U)` | Hai input, trả boolean |
| `BiConsumer<T, U>` | `void accept(T, U)` | Hai input, không trả output |

## 21.6.1. Predicate<T>

`Predicate<T>` biểu diễn một điều kiện nhận một input và trả về `boolean`.

```java
Predicate<Integer> isEven =
        number -> number % 2 == 0;

System.out.println(isEven.test(4));
System.out.println(isEven.test(5));
```

Kết quả:

```java
true
false
```

Ứng dụng với collection:

```java
List<Integer> evenNumbers = List.of(1, 2, 3, 4)
        .stream()
        .filter(isEven)
        .toList();
```

### Kết hợp Predicate

```java
Predicate<String> notBlank =
        text -> text != null && !text.isBlank();

Predicate<String> longEnough =
        text -> text.length() >= 8;

Predicate<String> validUsername =
        notBlank.and(longEnough);

boolean valid = validUsername.test("backend01");
```

Các method thường dùng:

- `and`: cả hai predicate phải đúng.
- `or`: ít nhất một predicate đúng.
- `negate`: đảo kết quả.
- `Predicate.not`: tạo predicate phủ định từ một predicate khác.

```java
Predicate<String> blank = String::isBlank;
Predicate<String> nonBlank = Predicate.not(blank);
```

Predicate composition có short-circuit: với `and`, predicate sau không được gọi nếu predicate trước là false; với `or`, predicate sau không được gọi nếu predicate trước là true.

## 21.6.2. Function<T, R>

`Function<T, R>` nhận một giá trị kiểu `T` và trả về giá trị kiểu `R`.

```java
Function<String, Integer> parse =
        Integer::parseInt;

Integer value = parse.apply("42");
```

Trong backend, Function thường dùng để map:

```java
Function<UserEntity, UserDto> toDto =
        UserDto::from;

UserDto dto = toDto.apply(entity);
```

### Kết hợp Function

```java
Function<String, String> trim =
        String::strip;

Function<String, String> upper =
        String::toUpperCase;

Function<String, String> normalize =
        trim.andThen(upper);

String result = normalize.apply(" java ");
```

- `andThen` chạy function hiện tại trước rồi function tiếp theo.
- `compose` chạy function được truyền vào trước.

```java
Function<Integer, Integer> doubleValue =
        value -> value * 2;

Function<Integer, Integer> addOne =
        value -> value + 1;

int a = doubleValue.andThen(addOne).apply(3); // 7
int b = doubleValue.compose(addOne).apply(3); // 8
```

Cần phân biệt thứ tự của `andThen` và `compose` khi xây dựng pipeline.

## 21.6.3. Consumer<T>

`Consumer<T>` nhận một input và thực hiện side effect, không trả về giá trị.

```java
Consumer<String> log =
        message -> System.out.println("[INFO] " + message);

log.accept("User created");
```

Kết hợp hai Consumer:

```java
Consumer<String> audit =
        message -> System.out.println("[AUDIT] " + message);

Consumer<String> logAndAudit =
        log.andThen(audit);

logAndAudit.accept("Payment completed");
```

Consumer phù hợp với:

- Ghi log.
- Gửi event.
- Cập nhật một resource.
- Callback không có return value.

Không nên dùng Consumer để âm thầm thay đổi state quan trọng bên trong một Stream pipeline nếu có thể biểu diễn bằng `map`, `filter` hoặc `collect`.

## 21.6.4. Supplier<T>

`Supplier<T>` không nhận argument và cung cấp một giá trị khi `get()` được gọi.

```java
Supplier<String> requestId =
        () -> UUID.randomUUID().toString();

String id = requestId.get();
```

Supplier thường biểu diễn computation lazy:

```java
Supplier<List<String>> fallback =
        () -> loadDefaultNames();
```

Method `loadDefaultNames` chỉ chạy khi gọi `fallback.get()`. Tính lazy này đặc biệt quan trọng khi dùng `Optional.orElseGet`.

## 21.6.5. UnaryOperator<T>

`UnaryOperator<T>` là dạng đặc biệt của Function: input và output cùng type.

```java
UnaryOperator<String> normalize =
        text -> text.strip().toLowerCase();

String value = normalize.apply(" Java ");
```

Thường dùng cho:

- Normalize text.
- Cập nhật state cùng kiểu.
- Transform một value qua nhiều bước.

## 21.6.6. BinaryOperator<T>

`BinaryOperator<T>` nhận hai giá trị cùng kiểu và trả về một giá trị cùng kiểu.

```java
BinaryOperator<Integer> max =
        Integer::max;

int value = max.apply(10, 20);
```

`reduce` trong Stream thường nhận BinaryOperator khi accumulator có cùng kiểu với phần tử stream.

## 21.6.7. BiFunction<T, U, R>

`BiFunction<T, U, R>` nhận hai input có thể khác kiểu và trả về một result.

```java
BiFunction<String, Integer, String> repeat =
        (text, count) -> text.repeat(count);

String result = repeat.apply("Java ", 3);
```

Một ví dụ backend:

```java
BiFunction<UserEntity, UserPreferences, UserDto> toDto =
        UserDto::from;

UserDto dto = toDto.apply(entity, preferences);
```

Method reference trên giả định constructor hoặc method static phù hợp tồn tại.

## 21.6.8. Primitive Functional Interfaces

Các functional interface generic dùng wrapper type có thể gây boxing:

```java
Function<Integer, Integer> square =
        value -> value * value;
```

Java cung cấp primitive specialization:

- `IntPredicate`, `LongPredicate`, `DoublePredicate`.
- `IntFunction<R>`, `ToIntFunction<T>`.
- `IntConsumer`, `LongConsumer`, `DoubleConsumer`.
- `IntSupplier`, `LongSupplier`, `DoubleSupplier`.
- `IntUnaryOperator`, `IntBinaryOperator`.
- `IntToLongFunction`, `LongToIntFunction` và các biến thể.

Ví dụ:

```java
IntUnaryOperator square =
        value -> value * value;

int result = square.applyAsInt(5);
```

Khi xử lý hàng triệu số, primitive specialization có thể giảm boxing. Không nên tối ưu mù quáng; hãy đo bằng profiling và ưu tiên tính rõ ràng trước.
+

## 21.7. METHOD REFERENCES

Method reference là cú pháp rút gọn cho lambda chỉ gọi một method hoặc constructor đã tồn tại.

Thay vì:

```java
Function<String, Integer> parser =
        text -> Integer.parseInt(text);
```

có thể viết:

```java
Function<String, Integer> parser =
        Integer::parseInt;
```

Method reference không tự tạo một function type mới. Nó vẫn cần target functional interface.

## 21.7.1. Static method reference

Cú pháp:

```java
ClassName::staticMethod
```

Ví dụ:

```java
Function<String, Integer> parser =
        Integer::parseInt;

BiFunction<Integer, Integer, Integer> max =
        Math::max;
```

Tương đương:

```java
Function<String, Integer> parser =
        text -> Integer.parseInt(text);
```

## 21.7.2. Bound instance method reference

Một object cụ thể đứng trước `::`:

```java
String prefix = "Java";

Predicate<String> startsWithJava =
        prefix::startsWith;

boolean result = startsWithJava.test("Java Core");
```

Tương đương:

```java
Predicate<String> startsWithJava =
        text -> prefix.startsWith(text);
```

Ví dụ thường gặp:

```java
StringBuilder builder = new StringBuilder();

Consumer<String> append =
        builder::append;

append.accept("Java");
```

Method reference giữ reference tới object cụ thể. Nếu object mutable, side effect vẫn xảy ra trên object đó.

## 21.7.3. Unbound instance method reference

Tên class đứng trước `::`, còn object receiver trở thành argument đầu tiên của functional method:

```java
Function<String, String> upper =
        String::toUpperCase;

String result = upper.apply("java");
```

Tương đương:

```java
Function<String, String> upper =
        text -> text.toUpperCase();
```

Một method instance có nhiều parameter:

```java
BiPredicate<String, String> equals =
        String::equals;

boolean same = equals.test("Java", "Java");
```

## 21.7.4. Constructor reference

Cú pháp:

```java
ClassName::new
```

Ví dụ:

```java
Supplier<ArrayList<String>> listFactory =
        ArrayList::new;

Function<String, User> userFactory =
        User::new;
```

Method reference constructor phải phù hợp với abstract method của functional interface. Nếu class có nhiều constructor overload, target type giúp compiler chọn constructor đúng.

Có thể tham chiếu constructor array:

```java
IntFunction<String[]> arrayFactory =
        String[]::new;

String[] values = arrayFactory.apply(3);
```

## 21.7.5. Khi method reference không làm code dễ đọc hơn

Method reference ngắn hơn nhưng không phải lúc nào cũng rõ hơn:

```java
users.stream()
        .map(User::getProfile)
        .map(Profile::getEmail)
        .toList();
```

Nếu cần nhiều bước, validation hoặc tên nghiệp vụ, named method có thể dễ hiểu hơn:

```java
users.stream()
        .map(this::extractVerifiedEmail)
        .toList();
```

Mục tiêu là làm rõ intent, không phải giảm số ký tự bằng mọi giá.

## 21.8. VARIABLE CAPTURING

Lambda có thể sử dụng biến ở enclosing scope.

```java
String prefix = "USER-";

Function<Long, String> format =
        id -> prefix + id;

String code = format.apply(10L);
```

`prefix` được lambda capture.

### Effectively final

Local variable được capture phải là final hoặc effectively final:

```java
String prefix = "USER-";

Function<Long, String> format =
        id -> prefix + id;

// prefix = "ACCOUNT-"; // Compile-time error
```

Một biến effectively final là biến không khai báo `final` nhưng sau khi khởi tạo không được gán lại.

Hợp lệ:

```java
final String fixed = "USER-";

Function<Long, String> first =
        id -> fixed + id;
```

Cũng hợp lệ:

```java
String fixed = "USER-";

Function<Long, String> second =
        id -> fixed + id;
```

Không hợp lệ:

```java
String prefix = "USER-";
prefix = "ACCOUNT-";

Function<Long, String> format =
        id -> prefix + id; // prefix không effectively final
```

### Lambda capture value, không capture một local variable có thể đổi tùy ý

Về mặt ngữ nghĩa, lambda giữ thông tin cần thiết để sử dụng giá trị local phù hợp với quy tắc Java. Không thể dùng capture để biến local variable thành một mutable shared variable.

Nếu cần thay đổi state, một số lập trình viên dùng mutable holder:

```java
int[] counter = {0};

Runnable task = () -> counter[0]++;

task.run();
System.out.println(counter[0]);
```

Code này compile nhưng làm giảm tính rõ ràng và có thể tạo race condition khi nhiều thread cùng truy cập. Trong backend, nên ưu tiên thiết kế immutable hoặc dùng cơ chế concurrency phù hợp thay vì lách quy tắc effectively final.

### Capture fields

Lambda có thể đọc và thay đổi instance fields:

```java
class Counter {

    private int value;

    Runnable incrementTask() {
        return () -> value++;
    }
}
```

Field không phải local variable nên không bị ràng buộc effectively final. Tuy nhiên, điều này không làm thao tác tăng trở nên thread-safe. Nếu nhiều thread chạy lambda, cần quan tâm visibility và atomicity.

### `this` trong lambda

`this` trong lambda là `this` của enclosing object:

```java
class AuditService {

    private final String serviceName = "audit";

    Runnable task() {
        return () -> System.out.println(this.serviceName);
    }
}
```

Trong anonymous class, `this` lại trỏ tới anonymous class instance. Đây là khác biệt thường gây lỗi khi chuyển code từ anonymous class sang lambda.

## 21.9. LAMBDA VÀ EXCEPTION

Functional interface chuẩn thường không khai báo checked exception trong abstract method.

Ví dụ, `Function<T, R>` không khai báo `throws IOException`:

```java
Function<Path, String> reader =
        path -> Files.readString(path); // Không compile
```

Có thể xử lý ngay trong lambda:

```java
Function<Path, String> reader =
        path -> {
            try {
                return Files.readString(path);
            } catch (IOException exception) {
                throw new UncheckedIOException(exception);
            }
        };
```

Ở ranh giới này, cần giữ cause để debugging và chọn exception runtime có ý nghĩa.

### Custom Throwing Function

Nếu ứng dụng có nhiều thao tác checked exception, có thể định nghĩa interface riêng:

```java
@FunctionalInterface
interface ThrowingFunction<T, R> {
    R apply(T value) throws Exception;
}
```

Sau đó viết adapter chuyển sang Function:

```java
static <T, R> Function<T, R> unchecked(
        ThrowingFunction<T, R> function
) {
    return value -> {
        try {
            return function.apply(value);
        } catch (Exception exception) {
            throw new RuntimeException(exception);
        }
    };
}
```

Cần thiết kế adapter cẩn thận:

- Không làm mất cause.
- Không bắt rộng hơn mức cần thiết nếu có thể.
- Không biến mọi lỗi nghiệp vụ thành một exception chung không thể phân biệt.
- Ghi rõ policy retry hoặc mapping lỗi ở boundary phù hợp.

## 21.10. CUSTOM FUNCTIONAL INTERFACE TRONG DOMAIN

Các interface chuẩn phù hợp cho thao tác chung. Khi domain có ý nghĩa riêng, custom functional interface có thể làm API dễ đọc hơn:

```java
@FunctionalInterface
interface Validator<T> {
    ValidationResult validate(T value);
}
```

```java
Validator<UserRequest> validUser =
        request -> validateUserRequest(request);
```

Tên `Validator<UserRequest>` truyền đạt intent tốt hơn một `Function<UserRequest, ValidationResult>` nếu abstraction này xuất hiện thường xuyên.

Không nên tạo custom interface cho mọi lambda nhỏ. Hãy dùng interface chuẩn khi tên domain riêng không mang thêm giá trị.

## 21.11. LAMBDA VÀ COMPARATOR

Lambda thường được dùng để tạo ordering:

```java
Comparator<User> byName =
        Comparator.comparing(User::name);
```

Sắp xếp nhiều tiêu chí:

```java
Comparator<User> byActiveThenName =
        Comparator.comparing(User::isActive)
                .reversed()
                .thenComparing(User::name);
```

Với primitive field, dùng comparator chuyên biệt để tránh boxing không cần thiết:

```java
Comparator<User> byAge =
        Comparator.comparingInt(User::age);
```

Không nên dùng phép trừ để so sánh số:

```java
// Comparator.comparing(user -> user.age()); // có thể boxing
Comparator<User> safe =
        Comparator.comparingInt(User::age);
```

Nếu comparator trả về 0 cho hai object khác nhau, sorted collection như `TreeSet` có thể xem chúng tương đương về uniqueness. Ordering phải phù hợp với yêu cầu equality của domain.

## 21.12. OVERLOADED METHOD VÀ TARGET TYPE

Lambda có thể trở nên mơ hồ khi method overload nhận nhiều functional interface:

```java
void execute(Consumer<String> action) {
}

void execute(Function<String, String> action) {
}
```

Lời gọi:

```java
execute(value -> System.out.println(value));
```

có thể khiến compiler khó chọn overload tùy body và signature. Có thể chỉ định target type bằng cast:

```java
execute((Consumer<String>)
        value -> System.out.println(value));
```

Hoặc đặt tên method khác để API rõ ràng hơn.

Method reference cũng có thể mơ hồ khi có overload. Khi đó, explicit cast hoặc lambda có parameter type có thể giúp compiler.

## 21.13. NGUYÊN TẮC DÙNG LAMBDA

Nên dùng lambda khi:

- Behavior ngắn và có intent rõ.
- Logic có thể biểu diễn như một predicate, mapper, consumer hoặc supplier.
- Lambda không che giấu side effect quan trọng.
- Việc kết hợp giúp code dễ đọc hơn vòng lặp tương đương.

Nên tách thành method hoặc class khi:

- Lambda dài nhiều dòng.
- Có nhiều nhánh nghiệp vụ.
- Cần logging, retry, transaction hoặc exception mapping phức tạp.
- Cần unit test độc lập.
- Có mutable state dùng chung.
- Lambda xuất hiện ở nhiều nơi với cùng một ý nghĩa.

Lambda là công cụ biểu diễn behavior, không phải lý do để dồn toàn bộ business logic vào một expression.

# CHƯƠNG 22. STREAM API

## 22.1. Stream API là gì?

Stream là một sequence of elements hỗ trợ các phép aggregate và transformation tuần tự hoặc song song.

`Stream<T>` không phải collection lưu trữ dữ liệu. Nó là pipeline mô tả cách xử lý dữ liệu đến từ một source như:

- Collection.
- Array.
- File hoặc I/O channel.
- Generator.
- Một stream khác.

Ví dụ:

```java
List<String> names = List.of(
        "Alice", "Bob", "Charlie"
);

List<String> result = names.stream()
        .filter(name -> name.length() >= 5)
        .map(String::toUpperCase)
        .toList();
```

Stream không tự tạo ra dữ liệu mới cho đến khi có terminal operation bắt đầu tiêu thụ pipeline.

### Stream không phải data structure

Collection trả lời câu hỏi “dữ liệu đang được lưu ở đâu?”. Stream trả lời “dữ liệu được xử lý như thế nào?”.

Một collection có thể tạo nhiều stream:

```java
List<Integer> numbers = List.of(1, 2, 3);

long first = numbers.stream().count();
long second = numbers.stream().count();
```

Mỗi lời gọi `stream()` tạo pipeline mới.

Một stream instance chỉ được tiêu thụ một lần:

```java
Stream<Integer> stream = numbers.stream();

long count = stream.count();
// long again = stream.count(); // IllegalStateException
```

Nếu cần xử lý lại, tạo stream mới từ source.

## 22.2. Stream Pipeline

Một pipeline thường gồm ba phần:

```
Source
  -> Intermediate operations
  -> Terminal operation
```

Ví dụ:

```java
long count = users.stream()       // source
        .filter(User::isActive)   // intermediate
        .map(User::email)         // intermediate
        .distinct()               // intermediate
        .count();                 // terminal
```

### Source

```java
users.stream()
Arrays.stream(values)
Stream.of("A", "B")
```

### Intermediate operations

Intermediate operation trả về một Stream mới, có thể nối tiếp:

- `filter`.
- `map`.
- `flatMap`.
- `distinct`.
- `sorted`.
- `limit`.
- `skip`.
- `peek`.
- `mapMulti`.

### Terminal operations

Terminal operation kết thúc pipeline và tạo result hoặc side effect:

- `toList`.
- `collect`.
- `forEach`.
- `reduce`.
- `count`.
- `min`, `max`.
- `findFirst`, `findAny`.
- `anyMatch`, `allMatch`, `noneMatch`.

Sau terminal operation, stream không được dùng tiếp.

## 22.3. LAZY EVALUATION

Intermediate operations là lazy. Chúng chỉ mô tả pipeline, chưa thực sự xử lý source cho đến khi có terminal operation.

```java
Stream<String> pipeline = names.stream()
        .filter(name -> {
            System.out.println("Filtering " + name);
            return name.length() > 3;
        });

System.out.println("Pipeline created");
```

Chưa có dòng `Filtering` nào được in. Khi gọi:

```java
long count = pipeline.count();
```

source mới được tiêu thụ.

### Fusion và short-circuit

JVM/Stream implementation có thể kết hợp các bước để tránh tạo collection trung gian. Với terminal operation short-circuit, pipeline có thể dừng sớm:

```java
boolean found = names.stream()
        .filter(name -> name.startsWith("A"))
        .findFirst()
        .isPresent();
```

Không nhất thiết mọi phần tử phải được xử lý sau khi đã tìm thấy kết quả.

Không nên dựa vào một thứ tự thực thi nội bộ cụ thể ngoài những guarantee trong API contract.

## 22.4. TẠO STREAM

### Từ Collection

```java
List<String> names = List.of("Alice", "Bob");
Stream<String> stream = names.stream();
```

```java
Set<Integer> values = Set.of(1, 2, 3);
values.stream().forEach(System.out::println);
```

### Từ array

```java
int[] numbers = {1, 2, 3};

IntStream intStream = Arrays.stream(numbers);
```

Với array object:

```java
String[] names = {"Alice", "Bob"};
Stream<String> nameStream = Arrays.stream(names);
```

### `Stream.of` và `ofNullable`

```java
Stream<String> stream = Stream.of("A", "B");

Stream<String> maybeOne =
        Stream.ofNullable(nullableName);
```

`Stream.ofNullable` tạo stream một phần tử nếu giá trị khác null, hoặc empty stream nếu null. Nó hữu ích khi nối dữ liệu nullable vào pipeline.

### Từ range của primitive stream

```java
IntStream range = IntStream.range(1, 5);
IntStream closed = IntStream.rangeClosed(1, 5);
```

`range` tạo 1, 2, 3, 4; `rangeClosed` tạo 1, 2, 3, 4, 5.

### Từ generator

```java
Stream<Double> randomValues =
        Stream.generate(Math::random)
                .limit(5);
```

`Stream.generate` thường tạo stream unordered và có thể vô hạn. Cần có `limit` hoặc một terminal condition phù hợp.

### Từ iterate

```java
List<Integer> powersOfTwo = Stream
        .iterate(1, value -> value <= 64, value -> value * 2)
        .toList();
```

Overload có predicate là lựa chọn an toàn hơn khi muốn giới hạn stream sinh ra.

### Từ file

```java
try (Stream<String> lines =
        Files.lines(Path.of("data.txt"))) {

    long nonBlankLines = lines
            .filter(line -> !line.isBlank())
            .count();
}
```

Method chứa đoạn code này cần khai báo `throws IOException` hoặc xử lý `IOException` bằng `catch`. Đây là ví dụ đồng thời về Stream và resource management.

Stream từ collection thường không cần close. Stream gắn với I/O resource phải được đóng bằng try-with-resources.

## 22.5. FILTER

`filter` giữ lại các phần tử mà predicate trả về true.

```java
List<User> activeUsers = users.stream()
        .filter(User::isActive)
        .toList();
```

Predicate không nên trả về null; abstract method yêu cầu boolean primitive.

Có thể kết hợp nhiều điều kiện:

```java
List<User> candidates = users.stream()
        .filter(User::isActive)
        .filter(user -> user.age() >= 18)
        .filter(user -> user.email() != null)
        .toList();
```

Thứ tự filter có thể ảnh hưởng hiệu năng. Điều kiện rẻ và loại bỏ nhiều phần tử thường nên được cân nhắc đặt sớm, nhưng đừng thay đổi semantics của pipeline.

## 22.6. MAP

`map` biến mỗi phần tử từ type `T` thành type `R`.

```java
List<String> emails = users.stream()
        .map(User::email)
        .toList();
```

`map` giữ số lượng phần tử theo logic một-input thành một-output, dù mapper có thể trả null. Nếu muốn loại bỏ null, cần filter hoặc dùng pipeline phù hợp.

```java
List<String> normalizedEmails = users.stream()
        .map(User::email)
        .filter(Objects::nonNull)
        .map(String::strip)
        .map(String::toLowerCase)
        .toList();
```

Không nên gọi method trên giá trị có thể null trước khi lọc:

```java
// .map(User::email)
// .map(String::strip) // có thể NPE nếu email null
```

## 22.7. FLATMAP

`flatMap` dùng khi mỗi input tạo ra một stream/collection con và muốn “làm phẳng” các stream đó thành một stream duy nhất.

```java
record Order(List<String> itemCodes) {
}

List<Order> orders = ...;

List<String> itemCodes = orders.stream()
        .flatMap(order -> order.itemCodes().stream())
        .distinct()
        .toList();
```

Nếu dùng `map`:

```java
List<List<String>> nested = orders.stream()
        .map(Order::itemCodes)
        .toList();
```

Kết quả là list lồng nhau, không phải list mã phẳng.

### flatMap với nested Optional

```java
Optional<Address> address =
        userRepository.findById(userId)
                .flatMap(User::address);
```

Nếu `User::address` đã trả về `Optional<Address>`, dùng `map` sẽ tạo `Optional<Optional<Address>>`. `flatMap` tránh nesting đó.

### flatMap và null

Mapper của `flatMap` nên trả về stream không null. Nếu dữ liệu có thể null:

```java
.flatMap(order -> order.itemCodes() == null
        ? Stream.empty()
        : order.itemCodes().stream())
```

Trong code mới, tốt hơn nên thiết kế collection không null, ví dụ record constructor chuẩn hóa về empty list.
+

## 22.8. DISTINCT

`distinct` loại bỏ phần tử trùng theo `equals`.

```java
List<String> uniqueRoles = users.stream()
        .map(User::role)
        .distinct()
        .toList();
```

Với ordered stream, phần tử xuất hiện đầu tiên trong mỗi nhóm tương đương thường được giữ theo encounter order. Với unordered stream, không nên dựa vào thứ tự.

`distinct` là stateful intermediate operation: pipeline cần theo dõi những giá trị đã gặp, vì vậy có thể tốn memory.

## 22.9. SORTED

`sorted` sắp xếp theo natural ordering:

```java
List<String> sortedNames = names.stream()
        .sorted()
        .toList();
```

Hoặc dùng Comparator:

```java
List<User> sortedUsers = users.stream()
        .sorted(Comparator.comparing(User::name))
        .toList();
```

`sorted` là stateful operation. Stream thường phải thu thập đủ dữ liệu cần thiết trước khi có thể phát ra kết quả theo thứ tự.

Nếu element không triển khai Comparable mà dùng overload không truyền Comparator, terminal operation có thể ném `ClassCastException`.

## 22.10. LIMIT, SKIP, TAKEWHILE VÀ DROPWHILE

### limit

```java
List<User> firstPage = users.stream()
        .limit(20)
        .toList();
```

`limit` hữu ích cho page nhỏ hoặc lấy top N, nhưng không thay thế pagination ở database. Nếu toàn bộ triệu record đã được load vào memory rồi mới limit, chi phí truy vấn vẫn có thể rất lớn.

### skip

```java
List<User> pageTwo = users.stream()
        .skip(20)
        .limit(20)
        .toList();
```

Đây chỉ là slicing trên dữ liệu đã có. Với bảng lớn, nên phân trang ở data source bằng query/page token phù hợp.

### takeWhile

`takeWhile` lấy prefix liên tiếp cho đến khi predicate đầu tiên trả false:

```java
List<Integer> values = List.of(2, 4, 6, 7, 8);

List<Integer> prefix = values.stream()
        .takeWhile(value -> value % 2 == 0)
        .toList();
```

Kết quả là `[2, 4, 6]`; giá trị 8 phía sau 7 không được xem xét.

### dropWhile

`dropWhile` bỏ prefix liên tiếp còn predicate đúng:

```java
List<Integer> remaining = values.stream()
        .dropWhile(value -> value % 2 == 0)
        .toList();
```

Kết quả bắt đầu từ 7 và giữ cả những giá trị phía sau.

Khác với `filter`, `takeWhile` và `dropWhile` phụ thuộc vào vị trí và encounter order của stream.

## 22.11. PEEK

`peek` là intermediate operation cho phép thực hiện action khi phần tử đi qua pipeline:

```java
List<String> result = names.stream()
        .filter(name -> name.length() > 3)
        .peek(name -> System.out.println("After filter: " + name))
        .map(String::toUpperCase)
        .toList();
```

Use case phù hợp nhất của `peek` là debugging hoặc quan sát tạm thời. Không nên dùng `peek` để chứa business side effect quan trọng:

```java
// Không nên dựa vào peek để gửi payment event.
payments.stream()
        .peek(this::sendPaymentEvent)
        .filter(Payment::isValid)
        .toList();
```

Nếu terminal operation thay đổi, bị bỏ qua hoặc được tối ưu theo contract, side effect trong `peek` có thể không xảy ra như người viết mong đợi.

Để xử lý side effect có chủ ý, thường dùng terminal operation rõ ràng hoặc tách logic ra khỏi pipeline.

# 22.12. TERMINAL OPERATIONS

## 22.12.1. forEach và forEachOrdered

```java
users.stream()
        .forEach(System.out::println);
```

Với sequential ordered stream, thứ tự thường theo encounter order. Với parallel stream, `forEach` không bảo đảm thứ tự.

```java
users.parallelStream()
        .forEachOrdered(System.out::println);
```

`forEachOrdered` cố gắng giữ encounter order nhưng có thể làm giảm lợi ích parallelism.

Không nên thêm phần tử vào một ArrayList dùng chung từ parallel `forEach`:

```java
List<UserDto> result = new ArrayList<>();

users.parallelStream()
        .forEach(user -> result.add(UserDto.from(user)));
```

Đây là shared mutable state và có thể tạo race condition. Hãy dùng `map(...).toList()` hoặc collector phù hợp.

## 22.12.2. toList

```java
List<String> names =
        users.stream()
                .map(User::name)
                .toList();
```

Trong Java 16+, `Stream.toList()` trả về list unmodifiable. Thao tác sau có thể ném `UnsupportedOperationException`:

```java
names.add("New name");
```

Nếu cần list mutable:

```java
List<String> mutableNames =
        users.stream()
                .map(User::name)
                .collect(Collectors.toCollection(ArrayList::new));
```

### `Stream.toList` và `Collectors.toList`

```java
List<String> a = stream.toList();
List<String> b = stream.collect(Collectors.toList());
```

Hai API không nên được xem là hoàn toàn tương đương:

- `toList` trả về list unmodifiable theo contract của Stream API.
- `Collectors.toList` không cam kết implementation, mutability hoặc concrete list type cụ thể.
- Nếu cần yêu cầu rõ ràng, dùng `Collectors.toCollection` hoặc collector unmodifiable phù hợp.

## 22.12.3. collect

`collect` thực hiện mutable reduction thông qua Collector.

```java
List<UserDto> dtos = users.stream()
        .map(UserDto::from)
        .collect(Collectors.toList());
```

Collectors thường dùng:

- `toList`.
- `toSet`.
- `toCollection`.
- `toMap`.
- `groupingBy`.
- `partitioningBy`.
- `joining`.
- `counting`.
- `summarizingInt`.

## 22.12.4. Collectors.toSet

```java
Set<String> roles = users.stream()
        .map(User::role)
        .collect(Collectors.toSet());
```

Không nên giả định Set kết quả có thứ tự cụ thể. Nếu cần giữ thứ tự encounter:

```java
Set<String> roles = users.stream()
        .map(User::role)
        .collect(Collectors.toCollection(
                LinkedHashSet::new
        ));
```

## 22.12.5. Collectors.toMap

```java
Map<Long, User> byId = users.stream()
        .collect(Collectors.toMap(
                User::id,
                Function.identity()
        ));
```

Nếu có duplicate key, collector mặc định ném `IllegalStateException`. Cần truyền merge function khi duplicate là tình huống có thể xảy ra:

```java
Map<String, User> byEmail = users.stream()
        .collect(Collectors.toMap(
                User::email,
                Function.identity(),
                (oldValue, newValue) -> newValue
        ));
```

Nếu cần concrete map và thứ tự:

```java
Map<Long, User> ordered = users.stream()
        .collect(Collectors.toMap(
                User::id,
                Function.identity(),
                (left, right) -> left,
                LinkedHashMap::new
        ));
```

Khi chọn merge policy, cần gắn với business rule. Không nên dùng tùy tiện `left` hoặc `right` rồi vô tình làm mất dữ liệu.

## 22.12.6. Collectors.groupingBy

```java
Map<String, List<User>> usersByRole =
        users.stream()
                .collect(Collectors.groupingBy(
                        User::role
                ));
```

Kết quả gom những user có cùng role vào một list.

Grouping với downstream collector:

```java
Map<String, Long> countByRole =
        users.stream()
                .collect(Collectors.groupingBy(
                        User::role,
                        Collectors.counting()
                ));
```

Tính tổng hoặc mapping thành DTO:

```java
Map<String, Set<String>> emailsByRole =
        users.stream()
                .collect(Collectors.groupingBy(
                        User::role,
                        Collectors.mapping(
                                User::email,
                                Collectors.toSet()
                        )
                ));
```

`groupingBy` tạo cấu trúc dữ liệu tiện cho response hoặc report, nhưng với dataset rất lớn nên cân nhắc memory và khả năng để database thực hiện grouping.

## 22.12.7. Collectors.partitioningBy

`partitioningBy` chia dữ liệu thành đúng hai nhóm theo predicate:

```java
Map<Boolean, List<User>> partitioned =
        users.stream()
                .collect(Collectors.partitioningBy(
                        User::isActive
                ));

List<User> active = partitioned.get(true);
List<User> inactive = partitioned.get(false);
```

Khác với `groupingBy`, key của partition là boolean.

Có thể dùng downstream collector:

```java
Map<Boolean, Long> count =
        users.stream()
                .collect(Collectors.partitioningBy(
                        User::isActive,
                        Collectors.counting()
                ));
```

## 22.12.8. Collectors.joining

```java
String csv = users.stream()
        .map(User::email)
        .collect(Collectors.joining(","));
```

Có prefix và suffix:

```java
String display = users.stream()
        .map(User::name)
        .collect(Collectors.joining(
                ", ",
                "[",
                "]"
        ));
```

Nếu dữ liệu có thể chứa delimiter hoặc ký tự cần escape, không nên xem `joining` là một CSV serializer đầy đủ.

## 22.12.9. Collectors.summarizingInt

```java
IntSummaryStatistics statistics = users.stream()
        .collect(Collectors.summarizingInt(User::age));

long count = statistics.getCount();
int min = statistics.getMin();
int max = statistics.getMax();
double average = statistics.getAverage();
long sum = statistics.getSum();
```

API này thuận tiện cho báo cáo thống kê cơ bản.

# 22.13. REDUCE

`reduce` kết hợp nhiều phần tử thành một kết quả.

## 22.13.1. Reduce không có identity

```java
Optional<Integer> sum = List.of(1, 2, 3)
        .stream()
        .reduce(Integer::sum);
```

Kết quả là `Optional<Integer>` vì stream có thể rỗng.

## 22.13.2. Reduce có identity

```java
int sum = List.of(1, 2, 3)
        .stream()
        .reduce(0, Integer::sum);
```

`0` là identity: khi stream rỗng, kết quả là 0.

Identity phải thật sự là phần tử trung hòa của accumulator. Nếu chọn sai:

```java
int wrong = List.of(1, 2, 3)
        .stream()
        .reduce(10, Integer::sum);
```

kết quả tuần tự có thể là 16, không phải tổng thông thường.

## 22.13.3. Reduce với kiểu kết quả khác

```java
int totalLength = names.stream()
        .reduce(
                0,
                (total, name) -> total + name.length(),
                Integer::sum
        );
```

Overload này nhận:

- Identity hoặc initial state.
- Accumulator giữa state và element.
- Combiner để kết hợp các state trong parallel execution.

## 22.13.4. Reduce phải associative khi dùng parallel

Phép cộng có tính associative:

```java
(a + b) + c == a + (b + c)
```

Vì vậy phù hợp hơn với parallel reduction. Phép trừ không associative:

```java
(10 - 5) - 2 != 10 - (5 - 2)
```

Dùng phép toán không associative trong parallel stream có thể cho kết quả bất ngờ.

### Reduce hay collect?

Dùng `reduce` cho immutable aggregation như sum, min, max hoặc kết hợp logic có identity rõ.

Dùng `collect` cho mutable result như list, map, set hoặc custom accumulator:

```java
List<String> result = names.stream()
        .collect(Collectors.toCollection(ArrayList::new));
```

Không nên dùng reduce để mutate một mutable collection:

```java
// Không nên:
List<String> wrong = names.stream()
        .reduce(
                new ArrayList<>(),
                (list, name) -> {
                    list.add(name);
                    return list;
                },
                (left, right) -> {
                    left.addAll(right);
                    return left;
                }
        );
```

Collector thể hiện đúng ý định và có contract phù hợp hơn.

# 22.14. COUNT, MIN, MAX VÀ TÌM KIẾM

## 22.14.1. count

```java
long activeCount = users.stream()
        .filter(User::isActive)
        .count();
```

Kết quả là `long` vì số lượng phần tử có thể vượt giới hạn của `int`.

## 22.14.2. min và max

```java
Optional<User> oldest = users.stream()
        .max(Comparator.comparingInt(User::age));
```

Kết quả là Optional vì stream có thể rỗng.

## 22.14.3. findFirst và findAny

```java
Optional<User> firstActive = users.stream()
        .filter(User::isActive)
        .findFirst();
```

`findFirst` tôn trọng encounter order nếu stream có order.

`findAny` cho phép implementation chọn một phần tử phù hợp, hữu ích hơn cho parallel execution khi không cần phần tử đầu tiên:

```java
Optional<User> anyActive = users.parallelStream()
        .filter(User::isActive)
        .findAny();
```

Không nên dùng `findAny` nếu business requirement cần kết quả xác định theo thứ tự.

## 22.14.4. anyMatch, allMatch, noneMatch

```java
boolean hasAdmin = users.stream()
        .anyMatch(user -> user.roles().contains("ADMIN"));

boolean allAdults = users.stream()
        .allMatch(user -> user.age() >= 18);

boolean noneBlocked = users.stream()
        .noneMatch(User::isBlocked);
```

Đây là terminal short-circuit operations.

Một chi tiết logic quan trọng:

- `allMatch` trên stream rỗng trả về true.
- `noneMatch` trên stream rỗng trả về true.
- `anyMatch` trên stream rỗng trả về false.

Đây là quy tắc vacuous truth và cần được kiểm tra khi thiết kế business logic.

# 22.15. PRIMITIVE STREAMS

`Stream<Integer>` lưu wrapper objects, có thể gây boxing/unboxing. Java cung cấp:

- `IntStream`.
- `LongStream`.
- `DoubleStream`.

Ví dụ:

```java
int sum = IntStream.rangeClosed(1, 100)
        .sum();

OptionalDouble average =
        IntStream.of(10, 20, 30)
                .average();
```

### map và mapToInt

```java
double averageAge = users.stream()
        .mapToInt(User::age)
        .average()
        .orElse(0.0);
```

`mapToInt` chuyển object stream sang `IntStream`. Các method chuyên biệt như `sum`, `average` và `summaryStatistics` giúp tránh boxing không cần thiết.

Chuyển ngược về object stream:

```java
List<Integer> values = IntStream.range(1, 4)
        .boxed()
        .toList();
```

Không cần dùng primitive stream cho mọi phép tính. Hãy cân nhắc khả năng đọc và đo hiệu năng trong workload thật.

# 22.16. MAPMULTI — JAVA 16+

`mapMulti` cho phép mỗi input phát ra zero hoặc nhiều output mà không nhất thiết tạo một stream con như `flatMap`.

Ví dụ lấy các tag của nhiều bài viết:

```java
record Article(List<String> tags) {
}

List<String> tags = articles.stream()
        .<String>mapMulti((article, downstream) -> {
            for (String tag : article.tags()) {
                downstream.accept(tag);
            }
        })
        .toList();
```

Tương đương khái niệm với:

```java
List<String> tags = articles.stream()
        .flatMap(article -> article.tags().stream())
        .toList();
```

`mapMulti` hữu ích khi logic phát sinh output có điều kiện hoặc nhiều nhánh:

```java
List<String> emails = users.stream()
        .<String>mapMulti((user, downstream) -> {
            if (user.isActive() && user.email() != null) {
                downstream.accept(user.email());
            }
        })
        .toList();
```

Không nên chọn `mapMulti` chỉ vì nó mới hơn. Nếu `flatMap` diễn đạt rõ ràng hơn, hãy dùng `flatMap`.

# 22.17. SIDE EFFECTS VÀ NON-INTERFERENCE

Stream operations nên:

- Stateless: kết quả không phụ thuộc vào state thay đổi trong quá trình pipeline.
- Non-interfering: không thay đổi source trong khi stream đang đọc source.

Không nên:

```java
List<String> names = new ArrayList<>(
        List.of("Alice", "Bob")
);

names.stream()
        .forEach(name -> names.add(name.toUpperCase()));
```

Code có thể ném `ConcurrentModificationException` hoặc có hành vi không phù hợp.

Không nên dùng biến mutable bên ngoài:

```java
List<String> result = new ArrayList<>();

names.stream()
        .forEach(result::add);
```

Với sequential stream có thể chạy, nhưng làm pipeline phụ thuộc side effect. Với parallel stream, đây là thiết kế dễ lỗi.

Nên:

```java
List<String> result = names.stream()
        .map(String::toUpperCase)
        .toList();
```

Nếu cần thực hiện side effect vì yêu cầu nghiệp vụ, tách nó thành bước rõ ràng và kiểm soát transaction/concurrency thay vì giấu trong intermediate operation.

# 22.18. PARALLEL STREAMS

Có thể tạo parallel stream:

```java
users.parallelStream()
        .filter(User::isActive)
        .map(UserDto::from)
        .toList();
```

Hoặc chuyển pipeline:

```java
users.stream()
        .parallel()
        .map(UserDto::from)
        .toList();
```

### Parallel stream không phải “nhanh hơn mặc định”

Chi phí có thể tăng do:

- Chia task.
- Context switching và scheduling.
- Đồng bộ kết quả.
- Giữ ordering.
- Tạo object hoặc merge collector.
- Dataset quá nhỏ.
- Mapper có I/O blocking.
- Shared lock hoặc contention.

Parallel stream thường phù hợp hơn với computation độc lập, đủ lớn, stateless và có operation associative.

### Common ForkJoinPool

Parallel stream thường sử dụng cơ chế Fork/Join chung của JVM. Không nên xem nó là thread pool riêng cho từng request. Nếu pipeline thực hiện blocking I/O, có thể chiếm worker và ảnh hưởng các tác vụ khác.

Trong backend request handling, không nên tự động gọi `parallelStream` trên mọi collection. Hãy benchmark workload thực và xem xét executor/async design phù hợp.

### Ordering và side effect

`forEach` trên parallel stream không bảo đảm order:

```java
users.parallelStream()
        .forEach(System.out::println);
```

Nếu cần order, `forEachOrdered` có thể dùng nhưng làm giảm mức độ song song. Tốt hơn là dùng collector hoặc tạo kết quả immutable.

# 22.19. HIỆU NĂNG VÀ BEST PRACTICES CỦA STREAM

1. Đừng tạo stream pipeline chỉ cho một phép toán rất đơn giản nếu vòng lặp dễ đọc hơn.
2. Đặt filter sớm khi có thể giảm đáng kể số phần tử truyền qua bước sau.
3. Dùng primitive streams cho phép tính số lượng lớn sau khi profiling xác nhận.
4. Tránh gọi database hoặc HTTP trong từng phần tử của stream nếu tạo N+1 requests.
5. Không gọi terminal operation nhiều lần trên cùng một stream.
6. Không dùng parallel stream cho blocking I/O một cách tùy tiện.
7. Không mutate source hoặc collection bên ngoài pipeline.
8. Dùng `toMap` với merge policy rõ ràng khi key có thể trùng.
9. Dùng `collect` cho mutable result, `reduce` cho reduction phù hợp.
10. Đừng dùng `peek` làm business logic.
11. Giữ lambda ngắn; tách named method cho logic phức tạp.
12. Kiểm tra null ở boundary thay vì để NPE xuất hiện giữa pipeline.
13. Benchmark với dữ liệu gần production, không kết luận từ một micro-example.
14. Đọc contract của operation: order, short-circuit, mutability và parallel behavior.

## 22.20. STREAM PIPELINE TRONG BACKEND

Ví dụ biến entity thành response, lọc dữ liệu và nhóm theo trạng thái:

```java
Map<String, List<UserResponse>> responsesByStatus =
        users.stream()
                .filter(User::isVisible)
                .map(UserResponse::from)
                .collect(Collectors.groupingBy(
                        UserResponse::status
                ));
```

Nếu dữ liệu đến từ database, cần cân nhắc bước nào nên thực hiện ở database:

- Filter và projection đơn giản thường có thể đẩy xuống query.
- Grouping lớn có thể cần database aggregation.
- Mapping business phức tạp có thể thực hiện sau khi lấy dữ liệu.
- Không nên load toàn bộ bảng vào memory chỉ để dùng `filter` và `limit`.

Stream là API xử lý dữ liệu trong JVM; nó không tự tối ưu query database hoặc thay thế query planner.


# CHƯƠNG 23. OPTIONAL

## 23.1. Optional là gì?

`Optional<T>` là một container có thể chứa một giá trị non-null hoặc không chứa giá trị nào.

~~~java
Optional<String> present =
        Optional.of("Java");

Optional<String> empty =
        Optional.empty();
~~~

Optional thường được dùng ở method return để biểu diễn rõ trạng thái “có thể không có kết quả”, thay vì trả `null` mà không có contract rõ ràng.

### Optional không phải object thay thế cho mọi null

Optional hữu ích nhất ở boundary của method:

~~~java
Optional<User> findById(long id) {
    // Có thể có hoặc không có User.
}
~~~

Nó không tự động làm code an toàn nếu caller vẫn viết:

~~~java
Optional<User> user = findById(1L);
User value = user.get();
~~~

Nếu Optional rỗng, `get()` ném `NoSuchElementException`. Caller cần chọn fallback, mapping hoặc exception phù hợp.

### Optional là value-based class

Không nên:

- So sánh Optional bằng `==`.
- Dùng Optional làm lock.
- Dựa vào identity của object Optional.
- Gán một biến Optional thành `null`.

~~~java
Optional<String> first = Optional.of("Java");
Optional<String> second = Optional.of("Java");

boolean sameValue = first.equals(second);
boolean sameReference = first == second;
~~~

`equals` mới là cách so sánh theo nội dung. Không nên dựa vào kết quả của `==`.

## 23.2. TẠO OPTIONAL

### 23.2.1. Optional.of

`Optional.of` dùng khi chắc chắn giá trị không null:

~~~java
String name = "Alice";

Optional<String> optionalName =
        Optional.of(name);
~~~

Nếu argument null:

~~~java
Optional<String> invalid =
        Optional.of(null); // NullPointerException
~~~

Dùng `of` thể hiện invariant rằng null không hợp lệ tại vị trí đó.

### 23.2.2. Optional.ofNullable

Khi giá trị có thể null:

~~~java
String name = findNameOrNull();

Optional<String> optionalName =
        Optional.ofNullable(name);
~~~

- Non-null value tạo Optional có giá trị.
- Null value tạo Optional.empty.

`ofNullable` hữu ích khi chuyển API cũ trả null sang contract mới dùng Optional.

### 23.2.3. Optional.empty

~~~java
Optional<String> noName =
        Optional.empty();
~~~

Không cần tự tạo sentinel object để biểu diễn “không có dữ liệu” nếu Optional đã đủ rõ ràng.

Không nên kiểm tra empty bằng identity:

~~~java
if (noName == Optional.empty()) {
    // Không nên dựa vào cách này.
}
~~~

Dùng `isEmpty()` hoặc `isPresent()`.

### 23.2.4. Không trả Optional null

Method có return type Optional phải trả về một Optional instance:

~~~java
return Optional.of(value);
return Optional.ofNullable(value);
return Optional.empty();
~~~

Không nên:

~~~java
return null;
~~~

Nếu caller gọi `isEmpty()` trên kết quả null, lỗi vẫn là `NullPointerException` và Optional mất ý nghĩa.

# 23.3. KIỂM TRA PRESENCE

## 23.3.1. isPresent và isEmpty

~~~java
Optional<String> name = Optional.of("Alice");

if (name.isPresent()) {
    System.out.println(name.get());
}

if (name.isEmpty()) {
    System.out.println("No name");
}
~~~

`isEmpty` có từ Java 11.

### Hạn chế isPresent kết hợp get

Đoạn sau hợp lệ nhưng thường không phải cách biểu đạt tốt nhất:

~~~java
if (user.isPresent()) {
    sendEmail(user.get());
}
~~~

Có thể viết:

~~~java
user.ifPresent(this::sendEmail);
~~~

Hoặc nếu cần cả nhánh else:

~~~java
user.ifPresentOrElse(
        this::sendEmail,
        () -> log.info("User not found")
);
~~~

`get()` chỉ nên dùng khi invariant đã được chứng minh rõ hoặc trong test rất cụ thể.

## 23.3.2. ifPresent

`ifPresent` nhận một `Consumer<? super T>` và chỉ chạy khi có value:

~~~java
findUser(userId)
        .ifPresent(user ->
                audit("Found user " + user.id())
        );
~~~

Consumer có thể tạo side effect. Cần đảm bảo side effect nằm đúng transaction boundary và không bị chạy nhiều lần ngoài ý muốn.

## 23.3.3. ifPresentOrElse

~~~java
findUser(userId)
        .ifPresentOrElse(
                user -> System.out.println(user.name()),
                () -> System.out.println("Not found")
        );
~~~

Method này phù hợp khi cả nhánh present và empty đều có hành vi rõ ràng.

## 23.3.4. get và orElseThrow

`get` ném `NoSuchElementException` nếu Optional empty:

~~~java
User user = findUser(userId).get();
~~~

Nếu đây là điều kiện lỗi nghiệp vụ, nên biểu đạt exception cụ thể:

~~~java
User user = findUser(userId)
        .orElseThrow(() ->
                new UserNotFoundException(
                        "User not found: " + userId
                )
        );
~~~

# 23.4. FALLBACK: orElse VÀ orElseGet

## 23.4.1. orElse

`orElse` trả value bên trong nếu present, hoặc fallback nếu empty:

~~~java
String name = findName()
        .orElse("Guest");
~~~

Nhưng argument của `orElse` được evaluate trước khi method được gọi:

~~~java
String name = findName()
        .orElse(loadDefaultName());
~~~

`loadDefaultName()` có thể chạy ngay cả khi `findName()` đã có giá trị.

## 23.4.2. orElseGet

`orElseGet` nhận một `Supplier<? extends T>` và chỉ gọi supplier khi Optional empty:

~~~java
String name = findName()
        .orElseGet(this::loadDefaultName);
~~~

Dùng `orElseGet` khi fallback:

- Tốn chi phí tính toán.
- Gọi database hoặc network.
- Tạo object lớn.
- Có side effect không muốn chạy khi value đã tồn tại.

### So sánh eager và lazy

~~~java
String eager = Optional.of("value")
        .orElse(expensiveFallback());

String lazy = Optional.of("value")
        .orElseGet(this::expensiveFallback);
~~~

Cả hai cùng trả "value", nhưng `expensiveFallback()` có thể vẫn được gọi ở dòng đầu tiên.

`orElse` phù hợp với constant hoặc expression rẻ, không có side effect. `orElseGet` phù hợp với computation lazy.

## 23.4.3. Fallback không nên che giấu lỗi

~~~java
User user = findUser(userId)
        .orElse(createAnonymousUser());
~~~

Nếu “user không tồn tại” là lỗi nghiệp vụ, việc âm thầm tạo anonymous user có thể làm sai dữ liệu. Fallback phải phản ánh business rule, không chỉ làm code ngắn hơn.

# 23.5. OR ELSE THROW

## 23.5.1. Không argument

~~~java
String name = findName()
        .orElseThrow();
~~~

Nếu empty, method ném `NoSuchElementException`.

## 23.5.2. Exception supplier

~~~java
User user = repository.findById(userId)
        .orElseThrow(() ->
                new UserNotFoundException(
                        "User " + userId + " was not found"
                )
        );
~~~

Supplier giúp exception object chỉ được tạo khi Optional empty.

Trong service backend, pattern thường là:

1. Repository trả `Optional<Entity>`.
2. Service quyết định empty có phải lỗi không.
3. Service ném domain exception cụ thể.
4. Global exception handler map exception sang HTTP response.

Repository không nên tự quyết định mọi HTTP status; đó là trách nhiệm của use case hoặc web boundary.

# 23.6. MAP

`map` biến value bên trong Optional từ `T` thành `R`.

~~~java
Optional<String> email =
        Optional.of(user)
                .map(User::email);
~~~

Nếu Optional ban đầu empty, mapper không được gọi và kết quả vẫn empty.

Nếu mapper trả null, `map` biến kết quả thành Optional.empty thay vì tạo Optional chứa null:

~~~java
Optional<String> normalized =
        Optional.of(user)
                .map(User::email)
                .map(String::strip)
                .map(String::toLowerCase);
~~~

Nếu email null, pipeline trở thành empty ở bước đầu.

### Optional map và Stream map

Cả hai đều biến đổi phần tử, nhưng container khác nhau:

- `Stream.map` tạo stream mới có thể có nhiều phần tử.
- `Optional.map` giữ tối đa một phần tử.
- Empty Optional không chạy mapper.

# 23.7. FLATMAP

`flatMap` dùng khi mapper đã trả về một Optional.

Giả sử:

~~~java
Optional<User> user = repository.findById(userId);

Optional<Address> address =
        user.flatMap(User::primaryAddress);
~~~

Nếu dùng `map`:

~~~java
Optional<Optional<Address>> nested =
        user.map(User::primaryAddress);
~~~

Kết quả bị lồng thành Optional<Optional<Address>>. `flatMap` làm phẳng một tầng.

### Chuỗi truy cập nested data

~~~java
Optional<String> city = repository.findById(userId)
        .flatMap(User::primaryAddress)
        .map(Address::city)
        .filter(cityName -> !cityName.isBlank());
~~~

Pipeline dừng thành empty nếu:

- Không tìm thấy user.
- User không có address.
- City là null.
- City là blank.

Không cần một chuỗi if-null lồng nhau.

### flatMap phải trả Optional non-null

Mapper của `flatMap` không được trả về null:

~~~java
// Sai contract:
user.flatMap(value -> null);
~~~

Nếu không có giá trị, trả về `Optional.empty()`.

# 23.8. FILTER

`filter` giữ value nếu predicate đúng; nếu sai, trả Optional.empty:

~~~java
Optional<User> adult = user
        .filter(value -> value.age() >= 18);
~~~

`filter` không biến đổi value. Nó chỉ quyết định value có tiếp tục trong pipeline hay không.

Kết hợp:

~~~java
Optional<String> validEmail = Optional
        .ofNullable(inputEmail)
        .map(String::strip)
        .filter(email -> !email.isBlank())
        .filter(this::isValidEmail);
~~~

Nếu predicate ném exception, exception truyền ra caller như method Java thông thường. Optional không tự bắt hoặc nuốt exception.

# 23.9. OPTIONAL.STREAM

Từ Java 9, `Optional.stream` chuyển:

- Optional có giá trị thành stream một phần tử.
- Optional empty thành stream rỗng.

Ví dụ:

~~~java
List<UserDto> result = userIds.stream()
        .map(repository::findById)
        .flatMap(Optional::stream)
        .map(UserDto::from)
        .toList();
~~~

Pipeline này:

1. Tìm từng user.
2. Bỏ qua các Optional empty.
3. Map user tồn tại sang DTO.
4. Tạo list kết quả.

Nếu cần biết id nào không tồn tại, không nên âm thầm bỏ mất thông tin. Hãy trả về result có lỗi, partition, hoặc xử lý missing id theo business rule.

## 23.9.1. Optional và Stream khác nhau

| Tiêu chí | Optional | Stream |
| --- | --- | --- |
| Số lượng phần tử | Tối đa 1 | 0, 1 hoặc nhiều |
| Mục tiêu | Có/không có một value | Xử lý một sequence |
| map | Biến một value | Biến từng phần tử |
| flatMap | Làm phẳng Optional | Làm phẳng stream |
| Terminal | orElse, get, ifPresent | collect, reduce, count |

# 23.10. OPTIONAL PRIMITIVE

Java cung cấp:

- `OptionalInt`.
- `OptionalLong`.
- `OptionalDouble`.

Ví dụ:

~~~java
OptionalInt maximum =
        IntStream.of(3, 8, 2).max();

int value = maximum.orElse(0);
~~~

Các loại này tránh boxing primitive thành wrapper trong một số numeric pipeline.

Không có `OptionalBoolean` trong Java standard library. Với boolean, thường dùng primitive mặc định, domain enum hoặc result type phù hợp.


# 23.11. OPTIONAL TRONG BACKEND

## 23.11.1. Repository return type

~~~java
interface UserRepository {
    Optional<User> findById(long id);
}
~~~

Caller buộc phải xem xét trường hợp không tìm thấy trước khi lấy User. Đây là cách tốt hơn method trả null mà không ghi rõ contract.

## 23.11.2. Service quyết định ý nghĩa của empty

Không phải mọi caller đều xử lý empty giống nhau:

~~~java
Optional<User> findPublicUser(long id) {
    return repository.findById(id)
            .filter(User::isPublic);
}
~~~

Ở service khác, missing có thể là lỗi:

~~~java
User requireUser(long id) {
    return repository.findById(id)
            .orElseThrow(() ->
                    new UserNotFoundException(
                            "User not found"
                    )
            );
}
~~~

Cùng một repository result có thể được map thành:

- Empty response.
- HTTP 404.
- Business exception.
- Skip item trong batch.
- Fallback hợp lệ.

Quyết định phải nằm ở use case, không ở bản thân Optional.

## 23.11.3. Optional không thay thế validation

~~~java
Optional<String> email =
        Optional.ofNullable(request.email());
~~~

Đoạn này chỉ biểu diễn nullability. Nó không kiểm tra email có đúng format, domain có cho phép hay user có quyền sử dụng email không.

Validation nên được thực hiện bằng domain rule hoặc validation layer phù hợp.

## 23.11.4. Optional trong API response

Có thể dùng Optional ở service return để biểu diễn missing. Khi tạo HTTP response, thường chuyển sang response contract cụ thể:

~~~java
return userService.findById(id)
        .map(user -> ResponseEntity.ok(UserDto.from(user)))
        .orElseGet(() -> ResponseEntity.notFound().build());
~~~

Nếu framework hoặc team convention yêu cầu response envelope thống nhất, hãy map empty thành envelope/error response theo contract đó thay vì expose Optional trực tiếp một cách không nhất quán.

# 23.12. OPTIONAL VÀ NULL

| Trường hợp | Dùng null | Dùng Optional |
| --- | --- | --- |
| Local variable đơn giản | Có thể phù hợp | Không cần bọc mọi biến |
| Method có thể không trả kết quả | Dễ bị quên kiểm tra | Thường rõ contract hơn |
| Field của entity/DTO | Thường theo framework/schema | Chỉ dùng khi framework contract hỗ trợ rõ |
| Parameter method | Thường dùng validation/non-null contract | Tránh lạm dụng |
| Collection không có phần tử | Dùng empty collection | Không dùng Optional<List<T>> thông thường |
| Giá trị primitive | Primitive/default hoặc OptionalInt | Chọn theo semantics |

### Empty collection thay vì Optional collection

Thường nên:

~~~java
List<Order> findOrders(long userId) {
    return List.of();
}
~~~

thay vì:

~~~java
Optional<List<Order>> findOrders(long userId) {
    // Thường làm API phức tạp hơn.
}
~~~

List rỗng đã biểu diễn “không có order”. Optional<List<T>> chỉ cần khi “không có collection” và “có collection nhưng collection rỗng” là hai trạng thái nghiệp vụ khác nhau.

### Optional trong field

Optional field có thể gây khó khăn cho:

- Serialization.
- ORM mapping.
- Reflection.
- Bean conventions.
- Memory layout.
- Framework binding.

Không có quy tắc cấm tuyệt đối, nhưng trong Java backend phổ biến, Optional được ưu tiên ở method return và dùng kiểu field/DTO rõ ràng theo framework contract.

# 23.13. OPTIONAL BEST PRACTICES

1. Dùng Optional chủ yếu cho method return có khả năng không có value.
2. Không trả về null từ method có return type Optional.
3. Không dùng `Optional.of` với giá trị chưa chắc non-null; dùng `ofNullable`.
4. Tránh `get()` nếu có thể dùng `orElse`, `orElseGet` hoặc `orElseThrow`.
5. Nhớ `orElse` eager, `orElseGet` lazy.
6. Dùng `map` để biến đổi value thường.
7. Dùng `flatMap` khi mapper trả Optional.
8. Dùng `filter` để giữ value khi thỏa điều kiện.
9. Dùng `Optional.stream` khi nối Optional với Stream.
10. Không dùng Optional như một collection nhiều phần tử.
11. Không bọc collection rỗng trong Optional nếu empty collection đã đủ nghĩa.
12. Không dùng Optional làm field hoặc parameter chỉ vì muốn tránh null mà không xét framework contract.
13. Không so sánh Optional bằng `==`.
14. Không tạo side effect khó hiểu trong `map`.
15. Không dùng fallback để che giấu lỗi nghiệp vụ.
16. Chọn exception cụ thể ở use-case boundary.
17. Ghi rõ nullability, mutability và error semantics trong JavaDoc/API contract.
18. Với numeric pipeline lớn, cân nhắc Optional primitive hoặc primitive stream.

# 23.14. VÍ DỤ HOÀN CHỈNH: USER LOOKUP

~~~java
public UserResponse getUser(long userId) {
    return userRepository.findById(userId)
            .filter(User::isActive)
            .map(UserResponse::from)
            .orElseThrow(() ->
                    new UserNotFoundException(
                            "Active user not found: " + userId
                    )
            );
}
~~~

Luồng xử lý:

1. Repository trả Optional<User>.
2. User không tồn tại thì pipeline empty.
3. User inactive thì filter biến kết quả thành empty.
4. User hợp lệ được map sang DTO.
5. Empty cuối pipeline ném domain exception.
6. Exception handler ở tầng web chuyển lỗi thành HTTP response phù hợp.

Ví dụ tìm city qua quan hệ nested:

~~~java
public Optional<String> findUserCity(long userId) {
    return userRepository.findById(userId)
            .flatMap(User::primaryAddress)
            .map(Address::city)
            .map(String::strip)
            .filter(city -> !city.isBlank());
}
~~~

Không nên dùng một pipeline như trên nếu mỗi bước cần error code khác nhau. Khi đó, result type hoặc exception mapping rõ ràng có thể phù hợp hơn.

# 23.15. BÀI TẬP THỰC HÀNH

## Bài 1 — Safe parser

Viết:

~~~java
Optional<Integer> parsePositiveInt(String input) {
    // ...
}
~~~

Yêu cầu:

- Null hoặc blank trả empty.
- Chuỗi không parse được trả empty.
- Số nhỏ hơn hoặc bằng 0 trả empty.
- Số hợp lệ trả Optional<Integer>.

## Bài 2 — User lookup

Viết method:

~~~java
Optional<UserDto> findActiveUser(
        long id
) {
    // ...
}
~~~

Yêu cầu dùng `filter` và `map`, không dùng if-null lồng nhau.

## Bài 3 — Nested Optional

Cho method:

~~~java
Optional<User> findUser(long id);
Optional<Address> primaryAddress(User user);
~~~

Viết method trả `Optional<String>` chứa city bằng `flatMap`.

## Bài 4 — Eager và lazy

Viết test chứng minh `orElse` gọi fallback dù Optional present, còn `orElseGet` không gọi fallback.

## Bài 5 — Optional và Stream

Cho `List<Long> userIds`, tìm các user tồn tại, map sang DTO và giữ encounter order.

## Bài 6 — Stream grouping

Cho list order, tạo:

~~~java
Map<OrderStatus, Long> countByStatus
~~~

bằng `Collectors.groupingBy` và `Collectors.counting`.

## Bài 7 — Collector toMap

Tạo map user theo email. Thiết kế merge policy khi hai user có cùng email và giải thích lý do.

# 23.16. CÂU HỎI PHỎNG VẤN

## Q1. Optional dùng để làm gì?

Optional biểu diễn rõ một return value có thể không tồn tại, giúp caller thấy và xử lý trạng thái empty thay vì nhận null không có contract rõ.

## Q2. Optional có phải thay thế hoàn toàn null không?

Không. Optional chủ yếu hữu ích ở method return. Không nên bọc mọi local variable, field, parameter hoặc collection một cách máy móc.

## Q3. Khác nhau giữa of và ofNullable?

`of` yêu cầu value non-null và ném NPE nếu null. `ofNullable` biến null thành Optional.empty.

## Q4. orElse và orElseGet khác nhau thế nào?

`orElse` evaluate fallback ngay cả khi Optional present. `orElseGet` chỉ gọi Supplier khi Optional empty.

## Q5. map và flatMap khác nhau thế nào?

`map` dùng khi mapper trả value bình thường. `flatMap` dùng khi mapper trả Optional, tránh tạo Optional lồng nhau.

## Q6. Vì sao không nên lạm dụng get?

`get` ném NoSuchElementException nếu empty và không mô tả rõ fallback hoặc lỗi nghiệp vụ. Dùng `orElseThrow` với exception cụ thể thường tốt hơn.

## Q7. Optional.empty có phải singleton không?

Không nên dựa vào identity hoặc dùng `==`. Hãy dùng `isEmpty` hoặc `equals` theo contract.

## Q8. Optional có thể chứa null không?

Không. Optional chứa value non-null hoặc empty. `Optional.ofNullable(null)` tạo empty.

## Q9. Khi nào dùng Optional.stream?

Khi muốn chuyển Optional có thể có một phần tử thành stream 0 hoặc 1 phần tử để nối vào pipeline lớn hơn.

## Q10. Vì sao thường trả empty list thay vì Optional<List<T>>?

Vì list rỗng đã biểu diễn không có phần tử. Optional<List<T>> chỉ phù hợp khi “không có collection” và “collection rỗng” là hai trạng thái nghiệp vụ khác nhau.

## Q11. Stream có lưu dữ liệu không?

Không. Stream là pipeline xử lý sequence từ source; collection mới là cấu trúc lưu trữ thông thường.

## Q12. Intermediate và terminal operation khác nhau thế nào?

Intermediate trả stream mới và lazy. Terminal bắt đầu tiêu thụ pipeline, tạo result hoặc side effect và kết thúc stream.

## Q13. Có thể dùng lại Stream không?

Không. Sau terminal operation, tạo stream instance mới từ source nếu cần xử lý lại.

## Q14. filter và map khác nhau thế nào?

`filter` giữ hoặc loại phần tử dựa trên predicate. `map` biến mỗi phần tử thành giá trị khác.

## Q15. map và flatMap trong Stream khác nhau thế nào?

`map` tạo một output cho mỗi input. `flatMap` dùng khi mỗi input tạo một stream con và cần làm phẳng thành một stream.

## Q16. toList và Collectors.toList có giống nhau không?

Không hoàn toàn. `Stream.toList` trả list unmodifiable theo contract; `Collectors.toList` không cam kết mutability hoặc implementation cụ thể.

## Q17. Vì sao toMap có thể ném IllegalStateException?

Vì key mapper tạo duplicate key mà không có merge function.

## Q18. Khi nào dùng reduce và khi nào dùng collect?

`reduce` phù hợp với reduction immutable có identity/associative accumulator. `collect` phù hợp với mutable result như list, set hoặc map.

## Q19. Parallel stream có luôn nhanh hơn không?

Không. Chi phí chia task, merge, ordering và contention có thể lớn hơn lợi ích, đặc biệt với dữ liệu nhỏ hoặc blocking I/O.

## Q20. Vì sao side effect trong Stream nguy hiểm?

Nó làm pipeline khó reasoning, khó parallelize và có thể tạo race condition hoặc phụ thuộc vào thứ tự thực thi không được bảo đảm.

# 23.17. TỔNG KẾT PHẦN 7

Bạn cần ghi nhớ:

- Lambda là implementation của functional interface trong target type phù hợp.
- Functional interface có đúng một abstract method theo quy tắc Java.
- Predicate biểu diễn điều kiện; Function biểu diễn mapping; Consumer biểu diễn action; Supplier biểu diễn lazy value.
- UnaryOperator và BinaryOperator là các dạng Function cùng type.
- Method reference và constructor reference là cú pháp rút gọn, không phải abstraction khác lambda.
- Local variable được capture phải final hoặc effectively final.
- Lambda không tự làm code thread-safe; field mutable và side effect vẫn cần synchronization phù hợp.
- Stream là pipeline xử lý dữ liệu, không phải collection lưu trữ.
- Intermediate operations lazy; terminal operation bắt đầu computation.
- Một Stream instance chỉ dùng được một lần.
- `filter` chọn phần tử; `map` biến đổi; `flatMap` làm phẳng; `collect` tạo cấu trúc kết quả.
- `toList` và `Collectors.toList` có contract khác về mutability.
- `reduce` yêu cầu identity và accumulator được thiết kế đúng, đặc biệt khi parallel.
- `groupingBy`, `partitioningBy`, `toMap` là những collector quan trọng cho backend.
- Primitive streams giảm boxing trong numeric workload.
- `mapMulti` phát nhiều output trực tiếp mà không nhất thiết tạo stream con.
- Không mutate source hoặc shared state trong Stream pipeline.
- Parallel stream chỉ nên dùng sau khi hiểu workload và đo hiệu năng.
- Optional biểu diễn tối đa một non-null value hoặc empty.
- `of`, `ofNullable` và `empty` tạo Optional theo các invariant khác nhau.
- `orElse` eager; `orElseGet` lazy; `orElseThrow` biểu diễn lỗi rõ hơn `get`.
- `map` và `flatMap` là hai thao tác cốt lõi để biến đổi Optional.
- Optional thường phù hợp ở method return, không nên dùng máy móc cho mọi field/parameter.
- Empty collection thường tốt hơn Optional collection nếu hai trạng thái không khác nhau về nghiệp vụ.

## Checklist tự kiểm tra

- [ ] Viết được lambda expression với zero, one và nhiều parameters.
- [ ] Phân biệt expression body và block body.
- [ ] Giải thích functional interface và vai trò của @FunctionalInterface.
- [ ] Sử dụng Predicate, Function, Consumer, Supplier và các operator.
- [ ] Dùng method reference và constructor reference đúng target type.
- [ ] Hiểu effectively final và lambda variable capture.
- [ ] Phân biệt intermediate/terminal operations và lazy evaluation.
- [ ] Dùng filter, map, flatMap, distinct, sorted, limit, skip và peek.
- [ ] Dùng toList, toMap, groupingBy, partitioningBy, joining và counting.
- [ ] Giải thích reduce, primitive streams, mapMulti và parallel streams.
- [ ] Tránh side effects và shared mutable state trong pipeline.
- [ ] Dùng Optional.of, ofNullable, empty, map, flatMap, filter.
- [ ] Phân biệt orElse, orElseGet và orElseThrow.
- [ ] Thiết kế method backend dùng Optional đúng boundary.
- [ ] Biết khi nào vòng lặp rõ ràng hơn lambda/Stream.

## Tài liệu tham khảo chính thức

- [Java Language Specification 21 — Lambda Expressions](https://docs.oracle.com/javase/specs/jls/se21/html/jls-15.html#jls-15.27)
- [Java Language Specification 21 — Functional Interfaces](https://docs.oracle.com/javase/specs/jls/se21/html/jls-9.html#jls-9.8)
- [Predicate — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Predicate.html)
- [Stream — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Stream.html)
- [Collectors — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/stream/Collectors.html)
- [Optional — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Optional.html)
- [Supplier — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/function/Supplier.html)

> Trạng thái: Hoàn thiện Phần 7 — Functional Programming. Nội dung bao gồm Lambda Expressions, Functional Interfaces, Method References, Stream API, Collectors, Primitive Streams, Parallel Streams, Optional, bài tập và câu hỏi phỏng vấn.
