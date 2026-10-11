# JAVA CORE 21 — PHẦN 11: MODERN JAVA FEATURES & VIRTUAL THREADS

Giáo trình chuyên sâu · Java SE 21 LTS · Beginner → Junior/Junior+ Backend Developer

Ở Phần 10, bạn đã tìm hiểu JVM Architecture, JIT Compiler và Garbage Collection. Phần này quay lại tầng ngôn ngữ và thư viện Java, tập trung vào những tính năng giúp code hiện đại ngắn gọn hơn, mô hình hóa domain rõ hơn và xử lý concurrency ở quy mô lớn hơn.

Java 21 là một mốc quan trọng vì nhiều tính năng đã trải qua các phiên bản Preview trước đó và trở thành chính thức:

- Record Patterns.
- Pattern Matching for switch.
- Virtual Threads.

Ngoài ra, Java 21 vẫn có một nhóm Preview Features. Preview không phải là tính năng ổn định mặc định: cú pháp, API hoặc semantics có thể thay đổi, bị loại bỏ hoặc không trở thành permanent feature ở các phiên bản sau.

## Mục tiêu học tập

Sau phần này, bạn cần có khả năng:

- Dùng var có chủ đích mà không làm mất readability.
- Viết multiline text bằng Text Blocks và hiểu indentation thực tế.
- Dùng switch expression, yield và pattern switch đúng scope.
- Thiết kế DTO/value object bằng record và biết giới hạn shallow immutability.
- Mô hình hóa domain hữu hạn bằng sealed types.
- Deconstruct record bằng Record Patterns và xử lý nested data.
- Phân biệt feature finalized với preview feature.
- Dùng virtual thread cho workload I/O-bound mà không nhầm nó với CPU accelerator.
- Tránh pooling virtual threads, pinning không cần thiết và quá tải resource bên ngoài.
- Đánh giá virtual threads bằng throughput, tail latency và resource limits thực tế.

## Nội dung Phần 11

| Chương | Chủ đề | Trọng tâm |
| --- | --- | --- |
| 32 | Modern Java Language Features | var, Text Blocks, switch expressions, records, helpful NPEs, Sequenced Collections và JPMS |
| 33 | Advanced Java Type Modeling | sealed types, pattern matching, record patterns, exhaustiveness và API design |
| 34 | Java 21 Virtual Threads | Project Loom, carrier threads, blocking I/O, pinning, executors, performance và Backend use cases |
| 35 | Java 21 Preview Features | String Templates, unnamed patterns, unnamed classes, Scoped Values, Structured Concurrency, FFM API và enable-preview |
| 36 | Finalized Features, Preview và Production Guidelines | compatibility, production checklist, bài tập, phỏng vấn và tổng kết |

## Các mốc phiên bản quan trọng

| Tính năng | Phiên bản chính thức |
| --- | --- |
| Lambda Expressions, Stream API | Java 8 |
| Local-variable type inference với var | Java 10 |
| Switch Expressions | Java 14 |
| Text Blocks | Java 15 |
| Records | Java 16 |
| Pattern Matching for instanceof | Java 16 |
| Sealed Classes | Java 17 |
| Record Patterns | Java 21 |
| Pattern Matching for switch | Java 21 |
| Virtual Threads | Java 21 |
| Sequenced Collections | Java 21 |

Các mốc trên là phiên bản feature trở thành permanent. Một số tính năng đã tồn tại ở dạng Preview trước khi được final.

# CHƯƠNG 32. MODERN JAVA LANGUAGE FEATURES

## 32.1. Local Variable Type Inference — var

Từ Java 10, Java cho phép dùng var để compiler suy luận kiểu của local variable dựa trên initializer.

### Cách viết truyền thống

```java
String username = "Alice";

List<String> names = new ArrayList<>();

Map<Long, User> users = new HashMap<>();
```

### Dùng var

```java
var username = "Alice";

var names = new ArrayList<String>();

var users = new HashMap<Long, User>();
```

Compiler vẫn xác định type cụ thể ở compile time:

- username có kiểu String.
- names có kiểu ArrayList<String>.
- users có kiểu HashMap<Long, User>.

var không phải là một type mới và không biến Java thành dynamically typed language.

### var vẫn là static typing

```java
var age = 22;

age = "Alice";
```

Đoạn code không compile vì age đã được suy luận là int.

Mô hình:

```text
var age = 22
       |
       +--> compiler infers int
       |
       +--> variable cannot later become String
```

### Những nơi có thể dùng var

var có thể dùng cho local variables có initializer:

```java
var message = "Hello";
var total = 10 + 20;
var account = new BankAccount();
```

Có thể dùng trong enhanced for:

```java
for (var name : names) {
    System.out.println(name);
}
```

Có thể dùng trong for initializer:

```java
for (var index = 0; index < names.size(); index++) {
    System.out.println(names.get(index));
}
```

Có thể dùng trong try-with-resources:

```java
try (var reader = Files.newBufferedReader(path)) {
    System.out.println(reader.readLine());
}
```

Từ Java 11, var cũng có thể được dùng cho lambda parameters nếu tất cả parameters trong lambda dùng cùng cách khai báo:

```java
BiFunction<String, String, String> join =
        (var left, var right) -> left + right;
```

Không được trộn:

```java
// Không hợp lệ:
// (var left, right) -> left + right
```

### Những nơi không thể dùng var

Không thể khai báo thiếu initializer:

```java
var name;
```

Không thể suy luận từ null:

```java
var value = null;
```

Compiler không biết value phải có reference type cụ thể nào.

Không thể dùng var làm field:

```java
class User {
    // Không hợp lệ:
    // private var name = "Alice";
}
```

Không thể dùng làm method return type:

```java
// Không hợp lệ:
// public var getName() { ... }
```

Không thể dùng làm parameter type thông thường:

```java
// Không hợp lệ:
// void process(var value) { ... }
```

Không thể dùng cho lambda hoặc method reference khi không có target type:

```java
// Không hợp lệ:
// var function = value -> value.toString();
```

Lambda cần functional interface làm target type, chẳng hạn Function<String, String>.

### var và kiểu concrete

Một điểm quan trọng:

```java
var users = new ArrayList<User>();
```

Kiểu suy luận là ArrayList<User>, không phải List<User>.

Nếu API muốn ẩn implementation và chỉ expose contract, viết rõ interface có thể tốt hơn:

```java
List<User> users = new ArrayList<>();
```

Việc dùng var không thay đổi type inference của generic:

```java
var ids = List.of(1L, 2L, 3L);
```

ids có kiểu List<Long> vì các literal được boxing và compiler suy luận type argument phù hợp.

### Khi nào nên dùng var?

Phù hợp khi type đã rõ ngay bên phải:

```java
var executor = Executors.newVirtualThreadPerTaskExecutor();
var users = new ArrayList<User>();
var formatter = DateTimeFormatter.ISO_LOCAL_DATE;
```

Nên cân nhắc viết rõ type khi:

- Vế phải trả về một abstraction khó đoán.
- Type là thông tin quan trọng để hiểu business logic.
- Method name không mô tả được return type.
- Generic type lồng nhau quá phức tạp.
- Code public hoặc onboarding developer mới.

Ví dụ:

```java
var result = service.execute();
```

Có thể khó đọc nếu người đọc chưa biết execute() trả về gì.

Nguyên tắc thực tế:

> Dùng var để giảm nhiễu cú pháp, không dùng var để che giấu mô hình dữ liệu.

## 32.2. Text Blocks

Text Blocks là multiline String literals, trở thành permanent feature từ Java 15.

### Trước Text Blocks

```java
String json = "{\n" +
        "  \"name\": \"Alice\",\n" +
        "  \"age\": 22\n" +
        "}";
```

### Dùng Text Blocks

```java
String json = """
        {
          "name": "Alice",
          "age": 22
        }
        """;
```

Text Block vẫn tạo ra một java.lang.String bình thường:

```java
System.out.println(json instanceof String);
```

Kết quả:

```text
true
```

### Use case Backend

Text Blocks hữu ích cho:

- JSON mẫu trong test.
- SQL query nhiều dòng.
- HTML email template nhỏ.
- Prompt hoặc text fixture.
- XML và cấu hình dạng text.
- Log message nhiều dòng có chủ đích.

Ví dụ SQL:

```java
String sql = """
        SELECT
            u.id,
            u.username,
            u.email
        FROM users u
        WHERE u.status = ?
        ORDER BY u.created_at DESC
        """;
```

Text Block chỉ cải thiện cách viết literal. Nó không tự parameterize SQL và không ngăn SQL injection.

### Incidental indentation

Java xử lý phần indentation dùng để format source code. Khoảng trắng đầu dòng trong runtime String được xác định bởi quy tắc incidental indentation, không đơn giản là giữ nguyên mọi khoảng trắng nhìn thấy trong file.

Ví dụ:

```java
String text = """
        A
        B
        """;
```

Kết quả thường là:

```text
A
B
```

Một cách kiểm tra chính xác:

```java
System.out.println(text.replace(" ", "·"));
```

### Line terminator cuối Text Block

Text Block thường bao gồm newline trước closing delimiter:

```java
String value = """
        Java
        """;
```

Có thể kiểm tra:

```java
System.out.println(value.equals("Java\n"));
```

Kết quả phụ thuộc line terminator được chuẩn hóa theo quy tắc String literal; khi cần contract rõ, hãy viết test thay vì đoán bằng mắt.

### Escape sequences trong Text Blocks

Text Blocks vẫn hỗ trợ escape sequence của String:

```java
String json = """
        {
          "name": "Alice"
        }
        """;
```

Có thể dùng escape để kiểm soát trailing spaces hoặc newline khi cần. Các methods hỗ trợ xử lý text gồm:

- stripIndent().
- translateEscapes().
- formatted().
- indent().
- transform().

Ví dụ formatted:

```java
String message = """
        Hello, %s!
        Your balance is %,.2f.
        """.formatted(username, balance);
```

### Không có interpolation tự động

Text Blocks không tự thay thế biến:

```java
String message = """
        Hello, username
        """;
```

Kết quả chứa chữ username, không phải giá trị biến.

Dùng formatted hoặc String concatenation có kiểm soát:

```java
String message = """
        Hello, %s!
        """.formatted(username);
```

String Templates là Preview Feature riêng trong Java 21, không phải một phần mặc định của Text Blocks.

### Security: Text Block không làm SQL an toàn

Không nên:

```java
String sql = """
        SELECT *
        FROM users
        WHERE username = '%s'
        """.formatted(userInput);
```

Nếu userInput chứa dữ liệu đặc biệt, có thể phát sinh SQL injection.

Dùng parameter binding:

```java
PreparedStatement statement = connection.prepareStatement(
        "SELECT * FROM users WHERE username = ?"
);
statement.setString(1, userInput);
```

## 32.3. Switch Expressions

Trước Java 14, switch chủ yếu được dùng như statement. Switch expression cho phép switch tạo ra một value.

### Traditional switch statement

```java
String result;

switch (status) {
    case 1:
        result = "PENDING";
        break;
    case 2:
        result = "APPROVED";
        break;
    default:
        result = "UNKNOWN";
}
```

### Switch expression với arrow labels

```java
String result = switch (status) {
    case 1 -> "PENDING";
    case 2 -> "APPROVED";
    default -> "UNKNOWN";
};
```

Arrow rule không fall-through sang case tiếp theo. Đây là một trong các lý do switch expression ít gây lỗi hơn colon-style switch.

### Multiple labels

```java
String category = switch (day) {
    case SATURDAY, SUNDAY -> "Weekend";
    default -> "Weekday";
};
```

### Block arm và yield

Khi một arm cần nhiều statements, dùng block và yield:

```java
String result = switch (score) {
    case 100 -> "Perfect";
    default -> {
        String grade = score >= 50 ? "Pass" : "Fail";
        yield grade;
    }
};
```

yield trả value cho switch expression. Nó không trả khỏi enclosing method.

So sánh:

- yield: hoàn thành một arm của switch expression.
- return: hoàn thành method hoặc lambda chứa switch.
- break: điều khiển loop hoặc một số switch statement, không thay thế yield trong block của switch expression.

### Exhaustiveness

Switch expression phải exhaustive, nghĩa là mọi giá trị có thể xảy ra đều phải có cách xử lý.

Với enum:

```java
enum Status {
    PENDING, APPROVED, REJECTED
}

static String label(Status status) {
    return switch (status) {
        case PENDING -> "Waiting";
        case APPROVED -> "Accepted";
        case REJECTED -> "Declined";
    };
}
```

Không cần default vì compiler biết toàn bộ enum constants hiện tại.

Tuy nhiên, khi enum thay đổi giữa compile time và runtime, Java 21 có thể ném MatchException trong trường hợp switch được compiler xem là exhaustive nhưng không còn label phù hợp tại runtime. Recompile code phụ thuộc khi hierarchy hoặc enum thay đổi.

### Switch expression với null

Switch truyền thống thường ném NullPointerException khi selector là null. Với Java 21 pattern switch, có thể xử lý rõ:

```java
static String describe(Object value) {
    return switch (value) {
        case null -> "null";
        case String text -> "String: " + text;
        default -> "Other";
    };
}
```

case null là case label đặc biệt, không phải type pattern.

## 32.4. Pattern Matching for instanceof

Trước Java 16:

```java
if (object instanceof String) {
    String text = (String) object;
    System.out.println(text.length());
}
```

Java 16+ cho phép kiểm tra và bind trong cùng pattern:

```java
if (object instanceof String text) {
    System.out.println(text.length());
}
```

### Flow scoping

Pattern variable chỉ tồn tại ở nơi compiler chứng minh pattern đã match.

```java
if (object instanceof String text
        && !text.isBlank()) {
    System.out.println(text);
}
```

text hợp lệ trong vế phải của && vì vế trái phải đúng thì vế phải mới được đánh giá.

Ví dụ không hợp lệ:

```java
// Không hợp lệ:
// if (object instanceof String text || text.isBlank()) { }
```

Vế phải của || có thể được chạy khi object không phải String, nên text không luôn chắc chắn tồn tại.

### Negation

```java
if (!(object instanceof String text)) {
    return;
}

System.out.println(text.length());
```

Sau return, phần code tiếp theo biết pattern đã match, nên text hợp lệ.

### Pattern variable có phải final không?

Không. Pattern variable có thể được gán lại trong scope hợp lệ, nhưng việc này thường làm code khó đọc:

```java
if (object instanceof String text) {
    text = text.trim();
    System.out.println(text);
}
```

Nên ưu tiên giữ pattern variable không bị thay đổi và tạo biến mới nếu cần normalization.

### Null behavior

```java
Object value = null;

if (value instanceof String text) {
    // Không chạy
}
```

instanceof pattern không match null. Đây là khác biệt với switch pattern khi switch có thể khai báo case null riêng.

## 32.5. Records

Record là một special kind of class được thiết kế để biểu diễn dữ liệu có cấu trúc đơn giản, thường là immutable data carrier ở mức shallow.

### Boilerplate trước record

```java
public final class UserDto {

    private final Long id;
    private final String username;

    public UserDto(Long id, String username) {
        this.id = id;
        this.username = username;
    }

    public Long getId() {
        return id;
    }

    public String getUsername() {
        return username;
    }

    @Override
    public boolean equals(Object obj) {
        // Equality implementation
        return super.equals(obj);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, username);
    }

    @Override
    public String toString() {
        return "UserDto[id=" + id + ", username=" + username + "]";
    }
}
```

### Record declaration

```java
public record UserDto(
        Long id,
        String username
) {
}
```

Compiler cung cấp:

- Private final field tương ứng với mỗi component.
- Public accessor method có tên component.
- Canonical constructor.
- equals().
- hashCode().
- toString().

### Accessor của record

```java
UserDto user = new UserDto(1L, "Alice");

System.out.println(user.id());
System.out.println(user.username());
```

Record dùng id() và username(), không tự sinh getId() hoặc getUsername() theo JavaBean convention.

Nếu framework yêu cầu JavaBean getters, có thể cần mapper hoặc class thông thường. Không nên đổi tên record accessor chỉ để bắt chước getter mà không cân nhắc contract framework.

### Record không phải immutable sâu

Record bảo vệ reference fields khỏi bị gán lại thông qua field public, nhưng object được tham chiếu có thể mutable:

```java
record Group(List<String> members) {
}

List<String> members = new ArrayList<>();
members.add("Alice");

Group group = new Group(members);
members.add("Bob");

System.out.println(group.members());
```

Output có thể là:

```text
[Alice, Bob]
```

Record giữ reference tới List ban đầu. Nó không tự copy nội dung.

### Defensive copy

```java
record Group(List<String> members) {

    Group {
        members = List.copyOf(members);
    }
}
```

List.copyOf tạo một unmodifiable snapshot của list structure tại thời điểm construction. Các element bên trong không tự deep copy:

```java
record Team(List<User> members) {

    Team {
        members = List.copyOf(members);
    }
}
```

Nếu User mutable, User object vẫn có thể thay đổi sau đó.

### Record có thể implement interface

```java
interface Identifiable {
    Long id();
}

record UserDto(Long id, String name)
        implements Identifiable {
}
```

Record có thể implement nhiều interfaces như class thông thường.

### Record không extends arbitrary class

Mọi record trực tiếp kế thừa java.lang.Record. Bạn không thể:

```java
// Không hợp lệ:
// record UserDto(...) extends BaseDto { }
```

Record implicit final và không thể làm superclass của một record/class khác.

### Thành phần record và giới hạn khai báo

Record có thể khai báo:

- Static fields.
- Static initializer.
- Instance methods.
- Static methods.
- Nested types.
- Constructors.
- Implemented interfaces.

Record không thể khai báo instance field bổ sung ngoài các record components. Nếu domain cần state dẫn xuất mutable hoặc lifecycle phức tạp, class thông thường thường phù hợp hơn.

## 32.6. Record Constructors

### Canonical constructor tường minh

```java
public record User(String username, int age) {

    public User(String username, int age) {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException(
                    "Username is required"
            );
        }

        if (age < 0) {
            throw new IllegalArgumentException(
                    "Age cannot be negative"
            );
        }

        this.username = username;
        this.age = age;
    }
}
```

Canonical constructor có parameter list tương ứng với toàn bộ record components theo đúng thứ tự.

Access modifier của canonical constructor không được hạn chế hơn quyền truy cập của record.

### Compact constructor

```java
public record User(String username, int age) {

    public User {
        if (username == null || username.isBlank()) {
            throw new IllegalArgumentException(
                    "Username is required"
            );
        }

        if (age < 0) {
            throw new IllegalArgumentException(
                    "Age cannot be negative"
            );
        }
    }
}
```

Trong compact constructor:

- Không viết parameter list.
- Không tự gán this.username và this.age.
- Java thực hiện việc gán components theo quy tắc của record sau phần validation/normalization.

### Normalization

```java
public record Email(String value) {

    public Email {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(
                    "Email is required"
            );
        }

        value = value.trim().toLowerCase(Locale.ROOT);
    }
}
```

Cần phân biệt normalization và validation. Việc lowercase email chỉ đúng khi business contract coi email là case-insensitive theo cách đó.

### Canonical, compact và non-canonical constructor

Record có thể có canonical constructor để khởi tạo tất cả components. Ngoài ra có thể có overloaded constructor, nhưng overloaded constructor phải delegate tới canonical constructor:

```java
public record Point(int x, int y) {

    public Point() {
        this(0, 0);
    }
}
```

Không được tạo constructor không canonical rồi bỏ qua việc khởi tạo components.

## 32.7. Record Use Cases trong Backend

Record thường phù hợp với:

- Request DTO.
- Response DTO.
- Read-only projection.
- Event payload.
- Command object.
- Value object nhỏ.
- Kết quả query bất biến về cấu trúc.

Ví dụ:

```java
public record CreateUserRequest(
        String username,
        String email
) {
}
```

Record không tự validate annotation hoặc business rule. Validation framework, compact constructor hoặc service layer vẫn cần được thiết kế rõ ràng.

### Record và JPA Entity

Record thường không phải lựa chọn mặc định cho JPA entity vì entity thường cần:

- Identity thay đổi theo lifecycle.
- Proxying.
- Constructor hoặc access strategy phù hợp.
- Dirty checking.
- Persistence lifecycle.
- Quan hệ lazy hoặc mutable state.

Record lại phù hợp hơn ở biên API hoặc projection. Quyết định cuối cùng phụ thuộc framework và provider cụ thể.

## 32.8. Sealed Classes và Pattern Matching — phần chuyển tiếp

Record, sealed interface và pattern switch thường được sử dụng cùng nhau:

```java
sealed interface Result
        permits Success, Failure {
}

record Success(String value)
        implements Result {
}

record Failure(String reason)
        implements Result {
}
```

Ở Chương 33, chúng ta sẽ dùng hierarchy này để xây dựng exhaustive switch và record patterns.

## 32.9. Helpful NullPointerExceptions

Từ Java 14, JVM có thể cung cấp thông tin chi tiết hơn khi NullPointerException xảy ra.

```java
class Profile {
    String displayName;
}

class User {
    Profile profile;
}

User user = new User();
System.out.println(user.profile.displayName.length());
```

Thay vì chỉ báo NullPointerException, runtime có thể chỉ rõ chain nào đang null, chẳng hạn user.profile.

Thông tin cụ thể phụ thuộc bytecode, debug information và runtime. Tính năng này được bật mặc định trong các Java runtime phù hợp; option ShowCodeDetailsInExceptionMessages có thể được dùng để kiểm soát behavior của HotSpot.

Helpful NPE không thay thế validation hoặc null-safe API design. Nó giúp chẩn đoán nhanh hơn sau khi lỗi xảy ra.

## 32.10. Sequenced Collections trong Java 21

Java 21 bổ sung một nhóm interfaces để mô hình hóa collection có encounter order rõ ràng:

- SequencedCollection.
- SequencedSet.
- SequencedMap.

Mục tiêu là cung cấp API nhất quán để truy cập phần tử đầu/cuối và view đảo ngược.

### SequencedCollection

Các operation quan trọng:

```java
SequencedCollection<String> values =
        new ArrayList<>(List.of("A", "B", "C"));

System.out.println(values.getFirst());
System.out.println(values.getLast());

values.addFirst("START");
values.addLast("END");

System.out.println(values.reversed());
```

Các method khái niệm:

- getFirst().
- getLast().
- addFirst().
- addLast().
- removeFirst().
- removeLast().
- reversed().

Không phải mọi Collection implementation đều hỗ trợ mọi mutation operation. Nếu operation không được hỗ trợ, có thể ném UnsupportedOperationException.

### SequencedSet

LinkedHashSet là ví dụ giữ encounter order:

```java
SequencedSet<String> tags =
        new LinkedHashSet<>(List.of("java", "backend"));
```

Set vẫn bảo đảm uniqueness. reversed() trả về view theo thứ tự ngược, không nhất thiết tạo một Set copy độc lập.

### SequencedMap

```java
SequencedMap<String, Integer> scores =
        new LinkedHashMap<>();

scores.put("Alice", 90);
scores.put("Bob", 80);

System.out.println(scores.firstEntry());
System.out.println(scores.lastEntry());
System.out.println(scores.reversed());
```

SequencedMap bổ sung các view và operation ở đầu/cuối như:

- firstEntry().
- lastEntry().
- pollFirstEntry().
- pollLastEntry().
- putFirst().
- putLast().
- reversed().
- sequencedKeySet().
- sequencedValues().
- sequencedEntrySet().

Cần phân biệt reversed view với copy. Thay đổi trên view có thể liên hệ với collection gốc theo contract của implementation.

## 32.11. Java Platform Module System — JPMS

JPMS được giới thiệu từ Java 9 để tổ chức ứng dụng và thư viện thành modules có boundary rõ ràng.

Một module có thể:

- Khai báo dependencies bằng requires.
- Chỉ expose package cần thiết bằng exports.
- Mở package cho reflection bằng opens.
- Khai báo service sử dụng bằng uses.
- Cung cấp service implementation bằng provides ... with.
- Có tên và identity rõ hơn class path không module hóa.

### module-info.java

Ví dụ module:

```java
module com.example.orders {
    requires java.net.http;

    exports com.example.orders.api;
}
```

Cấu trúc:

```text
src/
└── com.example.orders/
    ├── module-info.java
    └── com/example/orders/
        ├── api/OrderService.java
        └── internal/OrderRepository.java
```

Package internal không được exports thì module khác không thể truy cập trực tiếp qua module graph thông thường.

### requires

```java
module com.example.app {
    requires com.example.orders;
}
```

requires cho biết module app đọc được module orders.

### exports

```java
module com.example.orders {
    exports com.example.orders.api;
}
```

Chỉ package api được expose cho module khác. Package không exports vẫn có thể được module tự sử dụng nội bộ.

Có thể export có chọn lọc:

```java
module com.example.orders {
    exports com.example.orders.api
        to com.example.web;
}
```

Qualified export chỉ mở package cho module được chỉ định.

### opens

Framework như serialization, dependency injection hoặc ORM có thể cần reflection trên private members.

```java
module com.example.orders {
    opens com.example.orders.persistence
        to org.hibernate.orm.core;
}
```

exports và opens khác nhau:

- exports: compile-time và ordinary access tới public types.
- opens: deep reflection runtime, không đồng nghĩa mọi loại compile-time access được export.

Không dùng opens rộng hơn cần thiết vì làm giảm encapsulation.

### requires transitive và static

requires transitive làm dependency trở thành observable/readable cho module phụ thuộc.

requires static biểu diễn dependency cần khi compile nhưng không nhất thiết có lúc runtime. Cần dùng thận trọng vì thiếu dependency runtime vẫn gây lỗi.

### ServiceLoader trong JPMS

Provider module:

```java
module com.example.payment.card {
    requires com.example.payment.api;

    provides com.example.payment.PaymentProcessor
        with com.example.payment.card.CardPaymentProcessor;
}
```

Consumer module:

```java
module com.example.checkout {
    requires com.example.payment.api;
    uses com.example.payment.PaymentProcessor;
}
```

Application có thể load service qua ServiceLoader mà không phụ thuộc trực tiếp vào implementation.

### Compile và run module

Ví dụ khái niệm:

```bash
javac -d out --module-source-path src ^
    -m com.example.orders,com.example.app

java --module-path out ^
    -m com.example.app/com.example.app.Main
```

Dấu ^ là line continuation của Windows CMD. Trên Unix-like shell dùng backslash hoặc viết command trên một dòng.

### JPMS và class path

Class path vẫn được hỗ trợ. Không phải dự án nào cũng cần module hóa ngay.

Cân nhắc JPMS khi:

- Ứng dụng lớn có nhiều module.
- Muốn strong encapsulation.
- Cần custom runtime image với jlink.
- Muốn dependency graph rõ.
- Đang xây thư viện/platform dài hạn.

Chi phí cần cân nhắc:

- Build configuration phức tạp hơn.
- Framework reflection cần opens phù hợp.
- Một số library legacy chưa module-aware.
- Migration từ class path cần kiểm kê dependency.


# CHƯƠNG 33. ADVANCED JAVA TYPE MODELING & PATTERN MATCHING

## 33.1. Sealed Classes là gì?

Sealed class hoặc sealed interface cho phép giới hạn những direct subtypes được phép extends hoặc implements.

```java
public sealed interface Payment
        permits CashPayment, CardPayment, BankTransfer {
}
```

Các implementations:

```java
public record CashPayment(long amount)
        implements Payment {
}

public record CardPayment(
        String cardToken,
        long amount
) implements Payment {
}

public record BankTransfer(
        String bankCode,
        long amount
) implements Payment {
}
```

Ở đây, Payment không còn là một interface mở hoàn toàn. Compiler biết direct subtype set được cho phép.

### Vì sao cần sealed types?

Giả sử domain chỉ hỗ trợ ba loại payment. Với interface mở, bất kỳ module nào cũng có thể thêm implementation mà code xử lý có thể chưa biết.

Sealed hierarchy giúp:

- Mô hình hóa domain variants hữu hạn.
- Cho compiler kiểm tra exhaustive switch.
- Làm API contract rõ hơn.
- Giảm trạng thái không được dự đoán.
- Hỗ trợ refactoring an toàn khi thêm subtype mới.

Sealed không thay thế validation runtime. Dữ liệu deserialize từ network vẫn cần kiểm tra.

## 33.2. Quy tắc của permitted direct subclass

Một permitted direct subclass của sealed type phải khai báo một trong các trạng thái:

- final.
- sealed.
- non-sealed.
- Record là final implicit.

```java
public sealed class OnlinePayment
        permits OnlineCardPayment, OnlineWalletPayment {
}

public final class OnlineCardPayment
        extends OnlinePayment {
}

public sealed class OnlineWalletPayment
        extends OnlinePayment
        permits AppleWallet, BankWallet {
}

public final class AppleWallet
        extends OnlineWalletPayment {
}

public final class BankWallet
        extends OnlineWalletPayment {
}

public non-sealed class OtherOnlinePayment
        extends OnlinePayment {
}
```

Một subclass final không được kế thừa tiếp. Một subclass sealed phải khai báo tiếp permitted subclasses. Một subclass non-sealed mở lại khả năng kế thừa tự do từ nhánh đó.

Các direct permitted subclasses thường phải nằm cùng package hoặc cùng named module với sealed type, theo quy tắc Java về accessibility và module boundaries.

## 33.3. sealed, final, non-sealed và abstract

Một sealed type có thể kết hợp với abstract:

```java
public abstract sealed class Shape
        permits Circle, Rectangle {
}
```

Ý nghĩa:

- abstract: không tạo instance trực tiếp.
- sealed: giới hạn direct subclasses.
- final: kết thúc inheritance branch.
- non-sealed: mở branch đó trở lại.

Record có thể là permitted subclass của sealed interface vì record implicit final:

```java
public sealed interface ShapeLike
        permits Circle {
}

public record Circle(double radius)
        implements ShapeLike {
}
```

## 33.4. Sealed Classes vs Abstract Classes vs Interfaces

| Tiêu chí | Abstract Class | Interface | Sealed Class/Interface |
| --- | --- | --- | --- |
| Có abstraction | Có | Có | Có thể có |
| Có state instance | Có | Không có instance fields thông thường | Tùy class hoặc interface |
| Có constructor | Có | Không có instance constructor | Sealed class có thể có |
| Nhiều inheritance | Không cho phép nhiều superclass | Có thể implement nhiều interfaces | Vẫn tuân quy tắc class/interface |
| Giới hạn subtype | Không mặc định | Không mặc định | Có |
| Phù hợp | Shared state/behavior | Capability/contract | Domain variants hữu hạn |

Dùng sealed khi tập biến thể là một phần quan trọng của contract. Nếu API cần mở rộng bởi bên thứ ba, sealed có thể là lựa chọn không phù hợp.

## 33.5. Pattern Matching for switch — Java 21

Java 21 cho phép switch selector là reference type và case label có thể là patterns.

```java
static String describe(Object value) {
    return switch (value) {
        case Integer number ->
                "Integer: " + number;
        case String text ->
                "String: " + text;
        case null ->
                "Null value";
        default ->
                "Other";
    };
}
```

Pattern vừa kiểm tra kiểu vừa bind variable.

### Selector type

Selector của pattern switch có thể là:

- Primitive integral type phù hợp.
- Enum.
- String.
- Reference type.
- Sealed type.
- Record hoặc array reference type.

Không phải mọi primitive đều được hỗ trợ như selector trong Java 21. Các primitive như long, float, double và boolean không thể dùng tùy ý làm selector của switch theo các quy tắc Java 21.

### case null

```java
static String normalize(Object value) {
    return switch (value) {
        case null -> "missing";
        case String text when text.isBlank() -> "blank";
        case String text -> text.trim();
        default -> value.toString();
    };
}
```

Nếu không có case null, null selector thường gây NullPointerException. Khai báo case null làm null handling explicit.

### when clause

Java 21 dùng when để thêm guard cho pattern:

```java
static String classify(Object value) {
    return switch (value) {
        case Integer n when n > 0 -> "positive";
        case Integer n when n < 0 -> "negative";
        case Integer n -> "zero";
        default -> "other";
    };
}
```

Guard chỉ được đánh giá sau khi type pattern match. Nếu guard false, switch tiếp tục xét label phía sau.

### Dominance

Case label tổng quát phải đứng sau label cụ thể:

```java
static String kind(Object value) {
    return switch (value) {
        case String text -> "string";
        // case CharSequence chars -> "char sequence";
        default -> "other";
    };
}
```

Nếu đặt CharSequence trước String, case String phía sau sẽ bị dominated vì mọi String đều là CharSequence.

Tương tự, không đặt Object trước String hoặc một pattern cụ thể khác.

### Pattern switch và null safety

Pattern switch làm null handling rõ ràng hơn, nhưng không tự biến object thành non-null trong phần code bên ngoài switch. Các method được gọi trên pattern variable vẫn cần obey contract của component.

## 33.6. Exhaustive switch với sealed hierarchy

```java
sealed interface PaymentResult
        permits Success, Rejected, Pending {
}

record Success(String transactionId)
        implements PaymentResult {
}

record Rejected(String reason)
        implements PaymentResult {
}

record Pending()
        implements PaymentResult {
}
```

Switch có thể không cần default:

```java
static String message(PaymentResult result) {
    return switch (result) {
        case Success success ->
                "Success: " + success.transactionId();
        case Rejected rejected ->
                "Rejected: " + rejected.reason();
        case Pending pending ->
                "Processing";
    };
}
```

Compiler biết các permitted direct subtypes và kiểm tra type coverage.

### Thêm subtype mới

Nếu thêm:

```java
record Cancelled()
        implements PaymentResult {
}
```

và cập nhật permits, compiler có thể báo lỗi ở những switch expressions chưa xử lý Cancelled.

Đây là lợi ích lớn của exhaustive switch: thay đổi domain model tạo ra compile-time feedback.

### Có nên thêm default không?

Nếu muốn compiler phát hiện subtype mới, tránh default tùy tiện trong sealed hierarchy.

Default phù hợp khi:

- API thực sự muốn fallback.
- Hierarchy có thể thay đổi từ dependency bên ngoài.
- Không thể kiểm soát mọi implementation.
- Fallback là business behavior có chủ đích.

## 33.7. Record Patterns

Record Pattern cho phép kiểm tra record type và deconstruct các components trong cùng một pattern.

```java
record Point(int x, int y) {
}

static void printPoint(Object value) {
    if (value instanceof Point(int x, int y)) {
        System.out.println("x=" + x + ", y=" + y);
    }
}
```

Pattern Point(int x, int y):

1. Kiểm tra value có là Point không.
2. Gọi accessor x().
3. Gọi accessor y().
4. Bind kết quả vào x và y.

### So sánh với cách cũ

```java
if (value instanceof Point point) {
    int x = point.x();
    int y = point.y();

    System.out.println(x + y);
}
```

Record pattern giảm boilerplate nhưng vẫn giữ semantics accessor của record.

### Record pattern trong switch

```java
static String quadrant(Point point) {
    return switch (point) {
        case Point(0, 0) -> "origin";
        case Point(int x, int y) when x >= 0 && y >= 0 ->
                "quadrant I";
        case Point(int x, int y) when x < 0 && y >= 0 ->
                "quadrant II";
        case Point(int x, int y) when x < 0 && y < 0 ->
                "quadrant III";
        case Point(int x, int y) ->
                "quadrant IV";
    };
}
```

Case cụ thể phải đặt trước case tổng quát. Point(int x, int y) không nên đặt đầu vì sẽ dominate những cases phía sau.

### Nested record patterns

```java
record Address(String city, String country) {
}

record User(String name, Address address) {
}

static String countryOf(Object value) {
    return switch (value) {
        case User(
                String name,
                Address(String city, String country)
        ) -> name + " lives in " + city + ", " + country;
        default -> "Unknown";
    };
}
```

Pattern có thể đi sâu nhiều tầng. Tuy nhiên, pattern quá dài có thể làm code khó đọc; nên giới hạn độ sâu hoặc tạo method/domain abstraction rõ ràng.
### Null behavior của record patterns

Record pattern không match null:

```java
record User(String name) {
}

Object value = null;

if (value instanceof User(String name)) {
    // Không chạy
}
```

Nếu selector của switch là null và không có case null, switch có thể ném NullPointerException:

```java
static String readName(User user) {
    return switch (user) {
        case null -> "missing";
        case User(String name) -> name;
    };
}
```

Nested record pattern cũng không biến null component thành object hợp lệ:

```java
record Address(String city) {
}

record User(String name, Address address) {
}

static String cityOf(Object value) {
    return switch (value) {
        case User(
                String name,
                Address(String city)
        ) -> city;
        case User(String name, null) -> "unknown";
        case null -> "missing user";
        default -> "not a user";
    };
}
```

### var trong record pattern

Khi kiểu component đã rõ hoặc muốn giảm lặp lại:

```java
static void printPoint(Point point) {
    if (point instanceof Point(var x, var y)) {
        System.out.println(x + y);
    }
}
```

var trong record pattern không phải dynamic typing. Compiler vẫn suy luận kiểu component tại compile time.

### Record pattern trong instanceof và switch

Record pattern có thể xuất hiện trong:

- instanceof expression.
- switch statement.
- switch expression.

Trong Java 21, record pattern không còn là Preview Feature. Không cần enable-preview để dùng record patterns hoặc pattern matching for switch khi compile bằng Java 21.

### Generic record patterns

Với generic record, compiler có thể suy luận type arguments trong những ngữ cảnh pattern được hỗ trợ:

```java
record Box<T>(T value) {
}

static void inspect(Box<String> box) {
    if (box instanceof Box(var value)) {
        System.out.println(value.length());
    }
}
```

Ở đây selector đã có kiểu Box<String>, nên compiler có thông tin để suy luận value là String.

Không nên cố dùng một parameterized type không reifiable như một type pattern tùy ý trên Object. Khi type information đã bị erasure, cần thiết kế API hoặc kiểm tra runtime phù hợp.

### Record patterns và API design

Record patterns làm việc tốt khi:

- Data carrier có cấu trúc ổn định.
- Các component có ý nghĩa rõ.
- Domain hierarchy hữu hạn.
- Mapping logic cần đọc nhiều component cùng lúc.

Không nên dùng pattern quá sâu cho mọi business rule. Nếu logic trở thành chuỗi deconstruction dài, có thể:

- Tạo method domain có tên rõ.
- Dùng service hoặc mapper riêng.
- Chuẩn hóa dữ liệu trước khi switch.
- Chuyển behavior vào polymorphic type nếu đó là trách nhiệm của object.

## 33.8. Type coverage và exhaustive pattern switch

Compiler có thể tính type coverage cho sealed hierarchy.

```java
sealed interface Shape
        permits Circle, Rectangle {
}

record Circle(double radius)
        implements Shape {
}

record Rectangle(double width, double height)
        implements Shape {
}

static double area(Shape shape) {
    return switch (shape) {
        case Circle(double radius) ->
                Math.PI * radius * radius;
        case Rectangle(double width, double height) ->
                width * height;
    };
}
```

Không cần default vì Circle và Rectangle bao phủ toàn bộ permitted direct subtypes.

### Generic sealed hierarchy

Compiler còn có thể loại trừ subtype không thể xuất hiện dựa trên generic type argument.

Tuy nhiên, đây là phần nâng cao. Khi thiết kế API, không nên làm generic hierarchy quá phức tạp chỉ để loại bỏ một default. Ưu tiên khả năng đọc và contract ổn định.

### MatchException và binary compatibility

Một switch có thể exhaustive tại compile time nhưng runtime class hierarchy đã thay đổi mà class chứa switch chưa được compile lại. Trong tình huống hiếm này, runtime có thể ném MatchException.

Khi thay đổi sealed hierarchy hoặc enum trong module/dependency:

1. Recompile code phụ thuộc.
2. Chạy compatibility tests.
3. Kiểm tra packaging và class path/module path.
4. Không xem exhaustive compile check là bảo đảm thay thế version management.

## 33.9. Pattern matching và polymorphism

Pattern switch hữu ích khi:

- Tập variant đóng.
- Logic xử lý tập trung là chủ ý.
- Kết quả là một projection hoặc classification.
- Exhaustiveness là yêu cầu quan trọng.

Polymorphism/interface method thường phù hợp hơn khi:

- Tập implementation mở.
- Mỗi subtype có behavior riêng.
- Logic nên nằm cạnh data.
- Muốn thêm subtype mà không sửa một switch trung tâm.

Ví dụ không nên biến mọi method thành type switch:

```java
static String render(Object value) {
    return switch (value) {
        case User user -> renderUser(user);
        case Order order -> renderOrder(order);
        default -> "unknown";
    };
}
```

Nếu hệ thống có renderer registry hoặc interface Renderable phù hợp hơn, thiết kế đó có thể giảm coupling.

## 33.10. Checklist thiết kế sealed API

Trước khi dùng sealed type, hãy hỏi:

1. Tập subtype có thật sự hữu hạn không?
2. Các subtype có cùng package/module và ownership không?
3. Việc thêm subtype có nên bắt compiler sửa mọi switch không?
4. Client bên ngoài có cần mở rộng type không?
5. Có cần deserialize các subtype từ input không tin cậy không?
6. Có thể dùng record làm data carrier không?
7. Null có phải một variant hợp lệ hay nên loại bỏ sớm?
8. Default fallback có che giấu lỗi domain không?

Sealed types là công cụ mô hình hóa contract, không chỉ là cú pháp để làm switch ngắn hơn.

# CHƯƠNG 34. JAVA 21 VIRTUAL THREADS

## 34.1. Virtual Thread là gì?

Virtual thread là một instance của java.lang.Thread do Java runtime quản lý, không gắn cố định với một OS thread trong toàn bộ lifetime.

Platform thread là thread truyền thống:

- Là wrapper tương đối gần với OS thread.
- Giữ một OS thread trong suốt thời gian chạy.
- Có stack và native resources lớn hơn.
- Số lượng thực tế bị giới hạn bởi OS và memory.

Virtual thread:

- Vẫn là java.lang.Thread.
- Vẫn có stack trace, interruption và ThreadLocal.
- Chạy code trên carrier platform thread.
- Có thể unmount khi block trong những operation được runtime hỗ trợ.
- Tạo rẻ hơn và có thể dùng với số lượng lớn hơn platform threads.

| Tiêu chí | Platform Thread | Virtual Thread |
| --- | --- | --- |
| Đại diện | Wrapper của OS thread | Java runtime managed thread |
| OS thread binding | Giữ một OS thread trong lifetime | Không giữ cố định một OS thread |
| Chi phí tạo | Cao hơn | Thấp hơn |
| Use case | CPU work, task lâu, native integration | Nhiều task I/O-bound chờ blocking |
| Số lượng | Hạn chế hơn | Có thể rất lớn |
| Mục tiêu | Thực thi trực tiếp trên OS thread | Tăng concurrency/throughput |
| Có nhanh hơn từng task không? | Không tự động | Không; virtual thread không phải CPU accelerator |

### Virtual thread không làm code chạy nhanh hơn

Nếu một task cần 1 giây CPU computation, đổi platform thread thành virtual thread không làm phép tính đó hoàn thành nhanh hơn.

Lợi ích chính là:

- Nhiều task có thể chờ I/O cùng lúc.
- OS/carrier threads không bị giữ trong lúc task đang block ở API hỗ trợ.
- Có thể giữ mô hình thread-per-request dễ đọc.
- Giảm nhu cầu viết callback hoặc reactive chain chỉ để tránh giữ OS thread.

Oracle phân biệt rõ scale và speed: virtual threads hướng tới higher throughput/concurrency, không phải giảm CPU time của từng task.

## 34.2. Project Loom

Project Loom là dự án OpenJDK phát triển lightweight threads và các primitive hỗ trợ concurrency hiện đại.

Virtual threads được final trong Java 21. Đây không phải một programming language mới và không thay đổi mô hình Java Thread cơ bản:

```text
Application task
      |
      v
Virtual Thread
      |
      | mounted while running
      v
Carrier Platform Thread
      |
      v
OS Thread
```

Một virtual thread có thể được mount lên carrier, chạy một đoạn code, sau đó unmount khi bị block. Carrier được giải phóng để scheduler chạy virtual thread khác.

### Carrier thread

Carrier là platform thread thực sự thực thi virtual thread tại một thời điểm.

Developer thường không nên:

- Tạo và quản lý carrier thủ công.
- Gán một virtual thread vĩnh viễn vào carrier.
- Viết logic business dựa trên tên carrier.
- Giả định carrier ID là request ID.

Scheduler và carrier là implementation/runtime details. Hãy lập trình qua Thread, ExecutorService và các API concurrency công khai.

## 34.3. Vòng đời virtual thread

Virtual thread có lifecycle tương tự Thread:

1. New: thread được tạo nhưng chưa start.
2. Runnable/running: scheduler mount thread lên carrier.
3. Waiting/parked: task chờ lock, queue, timer hoặc I/O.
4. Runnable trở lại: operation sẵn sàng.
5. Terminated: task kết thúc bình thường hoặc bằng exception.

Ví dụ:

```java
Thread thread = Thread.ofVirtual()
        .name("payment-worker")
        .unstarted(() -> {
            System.out.println("Running");
        });

System.out.println(thread.getState());

thread.start();
thread.join();

System.out.println(thread.getState());
```

Một virtual thread kết thúc sau khi Runnable hoàn thành. Không tái sử dụng cùng Thread object cho task khác.

### Virtual thread là daemon

Virtual threads luôn là daemon threads trong Java 21. Chúng không giữ JVM sống khi mọi non-daemon platform threads đã kết thúc.

Không thể biến virtual thread thành non-daemon bằng setDaemon(true/false).

Điều này không có nghĩa task có thể bị bỏ qua. Application vẫn phải quản lý lifecycle, shutdown và kết quả task rõ ràng.

## 34.4. API tạo virtual threads

### Thread.startVirtualThread

Dùng cho task đơn giản:

```java
Thread thread = Thread.startVirtualThread(() -> {
    System.out.println("Hello from virtual thread");
});

thread.join();
```

startVirtualThread tạo và start virtual thread ngay.

### Thread.ofVirtual

Dùng khi cần cấu hình name hoặc tạo ThreadFactory:

```java
Thread thread = Thread.ofVirtual()
        .name("worker")
        .start(() -> {
            System.out.println(Thread.currentThread().isVirtual());
        });
```

Tạo factory:

```java
ThreadFactory factory = Thread.ofVirtual()
        .name("request-", 0)
        .factory();

Thread first = factory.newThread(() -> handleRequest());
Thread second = factory.newThread(() -> handleRequest());

first.start();
second.start();

first.join();
second.join();
```

### Kiểm tra loại thread

```java
Thread current = Thread.currentThread();

if (current.isVirtual()) {
    System.out.println("Virtual thread");
} else {
    System.out.println("Platform thread");
}
```

Không nên dùng isVirtual() để rẽ nhánh business logic. Nó hữu ích cho diagnostics, logging hoặc kiểm tra migration.

## 34.5. ExecutorService cho virtual threads

API phổ biến nhất trong Backend:

```java
try (ExecutorService executor =
        Executors.newVirtualThreadPerTaskExecutor()) {

    Future<String> first = executor.submit(
            () -> fetchUserProfile()
    );

    Future<String> second = executor.submit(
            () -> fetchRecommendations()
    );

    String profile = first.get();
    String recommendations = second.get();

    System.out.println(profile);
    System.out.println(recommendations);
}
```

newVirtualThreadPerTaskExecutor tạo một virtual thread mới cho mỗi submitted task. Nó không phải fixed thread pool và không giới hạn số task đang được submit.

try-with-resources giúp executor shutdown khi scope kết thúc. Vẫn cần thiết kế interruption, timeout và failure handling.

### Shutdown và close

Một số nguyên tắc:

- Không bỏ executor đang chứa task sống mà không shutdown.
- Không gọi shutdownNow như cơ chế business cancellation duy nhất.
- Chờ Future hoặc dùng timeout.
- Propagate interruption đúng cách.
- Đảm bảo application lifecycle đóng executor.

## 34.6. Virtual Threads và blocking I/O

Virtual threads đặc biệt phù hợp với code dành phần lớn thời gian chờ:

```text
Virtual thread:
  parse request
      |
      v
  JDBC call ---- blocks, virtual thread parks
      |
      v
  carrier runs another virtual thread
      |
      v
  response ready, virtual thread resumes
```

Các API Java networking và một số blocking I/O operations được runtime tích hợp để virtual thread có thể unmount khi chờ.

Ví dụ concept:

```java
static String callService(HttpClient client, URI uri)
        throws IOException, InterruptedException {

    HttpRequest request = HttpRequest.newBuilder(uri)
            .GET()
            .build();

    HttpResponse<String> response =
            client.send(request, HttpResponse.BodyHandlers.ofString());

    return response.body();
}
```

Nếu method chạy trong virtual thread và operation được hỗ trợ, carrier có thể được dùng cho task khác trong thời gian chờ.

### Không phải mọi blocking library đều thân thiện

Một thư viện có thể:

- Gọi native code lâu.
- Block trong synchronized region.
- Dùng lock không park được.
- Giữ OS thread trong I/O riêng.
- Có connection pool hoặc queue giới hạn.

Cần kiểm tra behavior của library, không suy luận rằng mọi lệnh gọi có chữ read hoặc wait đều tự động unmount.

## 34.7. Scheduler, mount và unmount

Scheduler của virtual threads phân phối runnable virtual threads lên một nhóm carrier platform threads.

Quy trình khái niệm:

1. Virtual thread được submit.
2. Scheduler mount nó lên carrier.
3. Virtual thread chạy Java code.
4. Nếu gặp operation có thể park, virtual thread unmount.
5. Carrier chuyển sang virtual thread khác.
6. Khi operation sẵn sàng, virtual thread được đưa về runnable queue.
7. Scheduler mount lại trên carrier có thể khác.

Vì vậy, không được giả định:

```java
long carrierId = Thread.currentThread().getId();
```

là bất biến trong toàn bộ request. Virtual thread có thể chạy trên nhiều carrier khác nhau qua lifetime.

### Scheduler không thay thế backpressure

Một hệ thống có thể tạo hàng triệu virtual threads nhưng vẫn bị giới hạn bởi:

- Database connections.
- HTTP connection pool.
- Rate limit của downstream.
- File descriptors.
- CPU.
- Heap và native memory.
- Queue của hệ thống bên ngoài.

Virtual threads làm việc chờ rẻ hơn, không tạo thêm database hoặc CPU capacity.

## 34.8. Thread-per-request với virtual threads

Mô hình thread-per-request:

```java
void handleRequest(Request request) {
    User user = userRepository.findById(request.userId());
    Order order = orderRepository.findOpenOrder(user.id());
    Response response = buildResponse(user, order);
    send(response);
}
```

Với platform thread pool nhỏ, nhiều request blocking có thể phải chờ thread rảnh.

Với virtual threads, có thể chạy mỗi request trên một virtual thread:

```java
try (ExecutorService executor =
        Executors.newVirtualThreadPerTaskExecutor()) {

    for (Request request : requests) {
        executor.submit(() -> handleRequest(request));
    }
}
```

Trong server framework, web server hoặc framework có thể tự quản lý executor. Không nên tạo executor mới cho mỗi request nếu framework đã có lifecycle executor.

### Readability

Virtual threads cho phép giữ code synchronous:

```java
User user = userClient.fetch(userId);
Order order = orderClient.fetchOpenOrder(userId);
return combine(user, order);
```

thay vì biến mọi call thành callback chain chỉ để tránh block OS thread. Điều này có thể làm stack trace và debugging dễ hơn, nhưng không loại bỏ nhu cầu timeout, retry và circuit breaker.

## 34.9. Không pool virtual threads

Platform threads đắt nên thường dùng pool:

```java
ExecutorService pool =
        Executors.newFixedThreadPool(100);
```

Virtual threads rẻ và được thiết kế để tạo theo task. Không nên tạo một pool virtual threads để tái sử dụng thread như thói quen cũ.

Sai về mặt ý tưởng:

```java
ExecutorService pool =
        Executors.newFixedThreadPool(100,
                Thread.ofVirtual().factory());
```

Đoạn này giới hạn task vào 100 virtual threads và làm mất một phần mô hình one-thread-per-task. Nếu cần giới hạn concurrency, hãy giới hạn resource hoặc task admission, không pool virtual threads như platform threads.

### Giới hạn concurrency bằng Semaphore

```java
Semaphore permits = new Semaphore(50);

void callPartner(Request request)
        throws InterruptedException {

    permits.acquire();

    try {
        partnerClient.call(request);
    } finally {
        permits.release();
    }
}
```

Trong virtual thread, acquire có thể park thread thay vì chiếm carrier trong lúc chờ permit. Số permit phải dựa trên downstream capacity và SLO.

### Bounded queue và rate limit

Các lựa chọn khác:

- Bounded queue.
- Rate limiter.
- Connection pool size.
- Circuit breaker.
- Bulkhead.
- Timeout.
- Semaphore.
- Batch size giới hạn.

Không nên tạo một virtual thread cho mọi item của một input stream vô hạn mà không có backpressure.

## 34.10. Virtual Threads và resource pools

Virtual threads giải quyết chi phí thread, không giải quyết chi phí resource.

Ví dụ:

```text
10,000 virtual threads
        |
        v
Database connection pool: 30 connections
        |
        v
Most tasks still wait for 30 connections
```

Đây có thể là behavior đúng nếu database chỉ cho phép 30 concurrent connections. Không tăng pool chỉ vì đã dùng virtual threads; tăng connection pool có thể làm database quá tải.

Các resource vẫn cần pool hoặc giới hạn riêng:

- JDBC connections.
- HTTP/2 streams hoặc socket limits.
- File descriptors.
- GPU handles.
- Native resources.
- Rate-limited APIs.

## 34.11. Pinning

Pinning xảy ra khi virtual thread bị block nhưng không thể unmount khỏi carrier, làm carrier platform thread bị giữ.

Trong Java 21, trường hợp quan trọng là blocking operation xảy ra:

- Bên trong synchronized method/block.
- Trong native method hoặc foreign function call.

Ví dụ cần xem xét:

```java
synchronized (lock) {
    partnerClient.call();
}
```

Nếu partnerClient.call() blocking lâu và thường xuyên, carrier có thể bị pinned.

### Pinning có phải mọi synchronized đều xấu?

Không.

Synchronized cho một đoạn in-memory ngắn, không block, thường không phải vấn đề đáng lo. Không nên thay toàn bộ synchronized bằng ReentrantLock chỉ vì dùng virtual threads.

Chỉ cần ưu tiên xử lý pinning khi:

- Operation block lâu.
- Đường code bị gọi thường xuyên.
- Có nhiều virtual threads cạnh tranh.
- Pinning làm giảm carrier availability và throughput.

Cách tổ chức tốt hơn:

```java
RequestData data;

synchronized (lock) {
    data = readSmallInMemoryState();
}

partnerClient.call(data);
```

Giữ vùng synchronized ngắn và đưa blocking I/O ra ngoài monitor khi semantics cho phép.

### ReentrantLock

Một số lock APIs có thể park virtual thread tốt hơn synchronized trong trường hợp cần chờ:

```java
lock.lock();

try {
    updateSmallState();
} finally {
    lock.unlock();
}

partnerClient.call();
```

Không thay lock máy móc. ReentrantLock có complexity riêng, cần unlock trong finally và không tự sửa deadlock.

### Chẩn đoán pinning

Java 21 hỗ trợ:

```bash
java -Djdk.tracePinnedThreads=full -jar app.jar
```

Có thể dùng short thay full để giảm output:

```bash
java -Djdk.tracePinnedThreads=short -jar app.jar
```

JFR có event jdk.VirtualThreadPinned, hữu ích để tìm pinning dài hoặc thường xuyên.

## 34.12. Virtual Threads và CPU-bound work

Virtual threads không làm CPU-bound work chạy nhanh hơn:

```java
for (long i = 0; i < 10_000_000_000L; i++) {
    calculate(i);
}
```

Nếu tạo quá nhiều CPU-bound virtual threads:

- CPU bị oversubscribed.
- Context switching tăng.
- Cache locality giảm.
- Latency của các task khác xấu hơn.
- Throughput không tăng tương ứng.

Với CPU-bound workloads, giới hạn parallelism theo số CPU và dùng executor phù hợp. Parallel streams hoặc ForkJoinPool có thể phù hợp tùy bài toán.

Virtual threads mạnh nhất khi task thường xuyên chuyển từ running sang waiting.

## 34.13. Virtual Threads và CompletableFuture

Hai công cụ giải quyết vấn đề khác nhau:

| Virtual Threads | CompletableFuture |
| --- | --- |
| Mô hình thread-per-task dễ đọc | Mô hình async pipeline |
| Phù hợp blocking I/O | Phù hợp composition của stages |
| Code tuần tự, stack trace trực tiếp | thenApply/thenCompose/exception stages |
| Có thể chạy hàng nghìn task chờ | Không cần giữ thread trong lúc stage async |
| Không tự tạo graph dependency | Mạnh ở kết hợp kết quả và callback |

Dùng virtual threads khi:

- Business flow tự nhiên là tuần tự.
- API blocking đã hỗ trợ tốt.
- Muốn code dễ đọc và debug.
- Cần nhiều request/task I/O-bound.

Dùng CompletableFuture khi:

- Cần compose nhiều stage async.
- Có API native async.
- Cần thenCombine, allOf hoặc pipeline không gắn với một thread.
- Framework đã cung cấp async abstractions phù hợp.

Có thể kết hợp, nhưng không nên dùng CompletableFuture chỉ để bọc mọi method blocking trong supplyAsync trên một pool không được thiết kế.

## 34.14. ThreadLocal với virtual threads

Virtual threads hỗ trợ ThreadLocal và InheritableThreadLocal trong Java 21. Tuy nhiên, vì có thể có rất nhiều virtual threads, mỗi ThreadLocal value có thể làm tăng memory usage.

Không nên dùng ThreadLocal để pool resource giữa nhiều task như cách làm với platform thread pool:

```text
Platform pool:
  worker thread -> reuse expensive resource

Virtual threads:
  each task has its own thread lifetime
  ThreadLocal resource may be created many times
```

Nếu dùng ThreadLocal:

- Xác định lifecycle value ngắn.
- Remove khi task kết thúc nếu cần.
- Không lưu object lớn không cần thiết.
- Không giả định virtual thread sẽ được reuse.
- Kiểm tra InheritableThreadLocal có copy context ngoài ý muốn không.

Scoped Values là Preview Feature trong Java 21 và có thể phù hợp hơn cho immutable, bounded context sharing trong một số thiết kế. Phần này trình bày ở Chương 35.

## 34.15. Interruption, timeout và cancellation

Virtual thread vẫn tuân theo quy tắc interruption của Thread.

```java
try {
    Thread.sleep(Duration.ofSeconds(10));
} catch (InterruptedException interrupted) {
    Thread.currentThread().interrupt();
    throw new CancellationException(
            "Task was interrupted"
    );
}
```

Nguyên tắc:

- Không nuốt InterruptedException nếu caller cần biết cancellation.
- Khôi phục interrupt flag nếu không rethrow.
- Dùng timeout cho HTTP, database và queue.
- Không coi shutdownNow là bảo đảm mọi native operation dừng ngay.
- Đóng resource khi task bị cancel.
- Kiểm tra Future cancellation và exception cause.

Ví dụ Future timeout:

```java
try {
    String result = future.get(500, TimeUnit.MILLISECONDS);
} catch (TimeoutException timeout) {
    future.cancel(true);
    throw timeout;
}
```

Timeout request không tự động rollback side effect đã xảy ra ở downstream. Business operation cần idempotency hoặc compensation riêng.

## 34.16. Backend use cases

### HTTP fan-out

Một request cần gọi nhiều downstream service:

```java
try (ExecutorService executor =
        Executors.newVirtualThreadPerTaskExecutor()) {

    Future<UserProfile> profile =
            executor.submit(() -> profileClient.fetch(userId));

    Future<List<Order>> orders =
            executor.submit(() -> orderClient.findRecent(userId));

    Future<Recommendation> recommendations =
            executor.submit(() -> recommendationClient.fetch(userId));

    return new Dashboard(
            profile.get(),
            orders.get(),
            recommendations.get()
    );
}
```

Cần bổ sung:

- Timeout riêng từng downstream.
- Xử lý partial failure.
- Bounded concurrency nếu user request có fan-out lớn.
- Circuit breaker và retry policy.
- Tránh giữ executor local nếu request rate cao; framework-level lifecycle thường phù hợp hơn.

### JDBC hoặc blocking repository

Virtual thread có thể làm thread-per-request với JDBC dễ mở rộng hơn về concurrency, nhưng database connection pool vẫn là bottleneck. Kiểm tra driver, transaction boundaries và connection acquisition timeout.

### File processing

Một task đọc nhiều file có thể phù hợp virtual thread nếu chủ yếu chờ I/O. Với transformation CPU-heavy trên từng file, cần giới hạn CPU parallelism.

### Message consumer

Virtual threads có thể dùng cho từng message/task, nhưng cần giới hạn số message in-flight, acknowledgement timeout và downstream capacity.

## 34.17. Các giới hạn và hiểu lầm thường gặp

### Hiểu lầm 1: Virtual thread nhanh hơn platform thread

Không. Nó rẻ hơn để tạo và phù hợp scale concurrency; thời gian CPU của task không tự giảm.

### Hiểu lầm 2: Có thể tạo vô hạn virtual threads

Không. Heap, scheduler, file descriptors, downstream resources và application logic vẫn có giới hạn.

### Hiểu lầm 3: Virtual thread loại bỏ mọi thread pool

Không. Platform thread pools vẫn hữu ích cho CPU-bound work, native constraints hoặc framework component. Chỉ không nên dùng pool để tái sử dụng virtual threads cho nhiều task.

### Hiểu lầm 4: Blocking code luôn unmount

Không. Synchronized pinning, native calls và thư viện không tương thích có thể giữ carrier.

### Hiểu lầm 5: Có virtual thread thì không cần timeout

Sai. Virtual thread giúp chờ rẻ hơn nhưng một task có thể chờ vô hạn và giữ business state, resource hoặc request alive.

### Hiểu lầm 6: Virtual threads thay thế CompletableFuture

Không. Chúng phục vụ execution model khác nhau.

### Hiểu lầm 7: Tăng số virtual threads giải quyết database chậm

Không. Nếu database hoặc connection pool chậm, thêm concurrency có thể làm queue và load tăng.

## 34.18. Quan sát và debug virtual threads

Kiểm tra loại thread:

```java
System.out.println(Thread.currentThread().isVirtual());
```

Đặt tên thread khi cần trace:

```java
Thread.ofVirtual()
        .name("order-", 0)
        .start(() -> processOrder());
```

JFR có thể quan sát:

- VirtualThreadStart.
- VirtualThreadEnd.
- VirtualThreadPinned.
- Scheduler events.
- Allocation.
- Blocking và I/O.

Java 21 cung cấp diagnostic thread dump riêng cho virtual threads qua jcmd trong các runtime phù hợp:

```bash
jcmd <pid> Thread.dump_to_file -format=text threads.txt
jcmd <pid> Thread.dump_to_file -format=json threads.json
```

Thread dump virtual có thể khác traditional thread dump về thông tin lock, object address hoặc platform-only management views. Hãy chọn artifact theo câu hỏi cần trả lời.

## 34.19. Benchmark virtual threads đúng cách

Không so sánh bằng một loop nhỏ rồi kết luận. Benchmark cần đại diện:

- Tỉ lệ CPU và I/O.
- Thời gian block.
- Số task đồng thời.
- Connection pool.
- Downstream latency.
- Timeout và retry.
- CPU quota.
- Heap limit.
- p50/p95/p99.
- Throughput và error rate.
- Warmup của JVM.

So sánh công bằng:

1. Cùng workload.
2. Cùng giới hạn memory và CPU.
3. Cùng downstream mock hoặc service.
4. Cùng timeout/retry.
5. Đo đủ thời gian.
6. Lặp nhiều lần.
7. Quan sát GC, thread count và carrier utilization.
8. Không chỉ đo thời gian của task thành công.

## 34.20. Checklist đưa virtual threads vào Backend

- Xác định workload có chủ yếu chờ I/O không.
- Kiểm tra driver/framework có hỗ trợ blocking behavior phù hợp không.
- Tách blocking I/O khỏi synchronized critical section dài.
- Bật diagnostics pinning trên staging.
- Đặt timeout cho tất cả downstream calls.
- Giới hạn database connections và in-flight requests.
- Không tạo virtual thread pool để reuse thread.
- Không dùng ThreadLocal để pool resource đắt tiền.
- Kiểm tra memory usage của per-request context.
- Theo dõi p95/p99, throughput, CPU, heap và downstream saturation.
- Kiểm tra interruption khi shutdown hoặc cancellation.
- Load test trước khi bật production.
- Có fallback hoặc rollback nếu dependency chưa tương thích.

# CHƯƠNG 35. JAVA 21 PREVIEW FEATURES

Java 21 không chỉ giới thiệu những tính năng đã hoàn thiện. Một số tính năng được phát hành dưới dạng **Preview Feature** để cộng đồng có thể dùng thử và cung cấp phản hồi trước khi Java đưa ra quyết định cuối cùng.

Preview Feature cần được nhìn nhận khác với một API hoặc cú pháp Java thông thường:

- Có thể thay đổi cú pháp hoặc semantics ở phiên bản kế tiếp.
- Có thể cần bật bằng compiler flag và launcher flag.
- Có thể bị loại bỏ hoàn toàn.
- Không nên trở thành dependency không thể thay thế trong production nếu chưa đánh giá rủi ro.

Trong Java 21, những preview features đáng biết gồm:

| Preview feature | JEP trong Java 21 | Mục đích |
| --- | ---: | --- |
| String Templates | 430 | Kết hợp template với expression và template processor |
| Unnamed Patterns and Variables | 443 | Bỏ qua những giá trị không cần dùng bằng dấu gạch dưới |
| Unnamed Classes and Instance Main Methods | 445 | Viết chương trình nhỏ với ít ceremony hơn |
| Scoped Values | 446 | Truyền context bất biến theo dynamic scope |
| Structured Concurrency | 453 | Quản lý nhóm task concurrent theo cùng một scope |
| Foreign Function & Memory API | 442 | Gọi native code và làm việc với off-heap memory |

Các tính năng này là preview của Java 21, không được xem là contract ổn định chỉ vì chúng đã xuất hiện trong một bản LTS.

## 35.1. Bật và chạy Preview Features

Khi biên dịch source code có preview feature bằng JDK 21, sử dụng:

```bash
javac --enable-preview --release 21 -d out PreviewDemo.java
```

Khi chạy class:

```bash
java --enable-preview -cp out PreviewDemo
```

Nếu chạy source file trực tiếp:

```bash
java --enable-preview --source 21 PreviewDemo.java
```

Với JShell:

```bash
jshell --enable-preview
```

Tùy chọn release 21 giúp compiler dùng API và ngôn ngữ của Java 21. Tùy chọn enable-preview cho phép compiler chấp nhận những tính năng preview của release tương ứng.

### Compile được nhưng chạy không có enable-preview

Đây là lỗi thường gặp:

```bash
javac --enable-preview --release 21 -d out PreviewDemo.java
java -cp out PreviewDemo
```

Runtime có thể từ chối class vì class file được biên dịch với preview features nhưng launcher chưa được bật preview. Do đó, trong build pipeline phải cấu hình flag cho cả compile, test và run.

### Preview feature không phải experimental code tùy ý

Preview feature vẫn có đặc tả, JEP và compiler/runtime support cụ thể. Tuy nhiên, nó chưa có mức ổn định như những tính năng đã finalized. Việc dùng preview nên đi kèm:

- Ghi rõ JDK version.
- Ghi rõ enable-preview.
- Kiểm tra migration khi nâng JDK.
- Có fallback nếu tính năng bị thay đổi hoặc rút bỏ.
- Không để library public bắt buộc consumer dùng preview nếu không thật sự cần.

## 35.2. String Templates — JEP 430

String Template là cách kết hợp một template với các expression được nội suy và một template processor.

Mục tiêu của thiết kế không chỉ là nối chuỗi thuận tiện hơn. Template processor có thể kiểm tra, escape, parse hoặc chuyển template thành kiểu dữ liệu khác.

### Cú pháp cơ bản

```java
import static java.lang.StringTemplate.STR;

public class TemplateDemo {

    public static void main(String[] args) {
        String name = "Alice";
        int age = 22;

        String message = STR."Hello, \{name}. You are \{age} years old.";

        System.out.println(message);
    }
}
```

Expression nằm trong \{...}. Kết quả của expression được đưa vào template processor STR.

Kết quả:

```text
Hello, Alice. You are 22 years old.
```

### Expression trong template

Expression không chỉ là một biến:

```java
String firstName = "Alice";
String lastName = "Nguyen";

String fullName = STR."\{firstName.toUpperCase()} \{lastName}";
```

Tuy nhiên, expression phức tạp nên được tính trước nếu điều đó làm code dễ đọc hơn.

### Template processor

STR là processor dựng sẵn, tạo ra một String. Ý tưởng quan trọng hơn cú pháp là processor có thể quyết định cách xử lý template.

Ví dụ, cùng dữ liệu nghiệp vụ có thể được đưa vào:

- HTML processor để escape HTML.
- SQL processor để tạo query parameter an toàn.
- JSON processor để kiểm tra kiểu và encoding.
- Custom processor để tạo object domain.

Điều này khác với việc nối chuỗi trực tiếp, vì nối chuỗi không tự biết context mà dữ liệu sẽ được sử dụng.

### Rủi ro bảo mật

Không nên hiểu String Templates là cơ chế tự động chống SQL injection:

```java
String username = inputFromUser();

// Không biến cách này thành an toàn chỉ vì dùng template.
String sql = STR."SELECT * FROM users WHERE username = '\{username}'";
```

Đối với JDBC, hãy dùng PreparedStatement. Đối với JPA hoặc framework database, hãy dùng parameter binding tương ứng.

Tương tự, dữ liệu chèn vào HTML, shell command, LDAP filter hoặc log message cần được xử lý theo đúng context. Template syntax không thay thế security design.

### Trạng thái của String Templates

String Templates là preview feature trong Java 21. Đây là ví dụ điển hình cho việc preview feature có thể bị thay đổi hoặc rút khỏi các bản phát hành sau. Vì vậy, không nên xây dựng public API dài hạn phụ thuộc trực tiếp vào cú pháp này nếu project chưa có chiến lược nâng cấp.

Trong code production cần tương thích Java 21 ổn định, có thể dùng:

```java
String message = "Hello, %s. You are %d years old."
        .formatted(name, age);
```

formatted() không phải String Templates, nhưng là lựa chọn finalized và đủ rõ ràng cho nhiều trường hợp format thông thường.

## 35.3. Unnamed Patterns and Variables — JEP 443

Trong nhiều đoạn code, bạn cần kiểm tra một kiểu hoặc destructure một object nhưng không cần dùng một giá trị cụ thể. Preview feature này cho phép dùng dấu gạch dưới để thể hiện rõ rằng giá trị đó bị cố ý bỏ qua.

### Unnamed pattern

```java
static String classify(Object value) {
    return switch (value) {
        case String _ -> "A string";
        case Integer _ -> "An integer";
        case null -> "Null";
        default -> "Something else";
    };
}
```

Ở đây chương trình quan tâm việc value có phải String hoặc Integer hay không, nhưng không cần giữ object trong một pattern variable.

Nếu dùng tên biến giả:

```java
case String ignored -> "A string";
```

code vẫn hợp lệ, nhưng dấu gạch dưới truyền đạt ý định rõ hơn và tránh tạo ra biến không được sử dụng.

### Unnamed component trong record pattern

```java
record Point(int x, int y) {}

static String horizontal(Point point) {
    return switch (point) {
        case Point(int x, _) -> "x = " + x;
        case null -> "null";
    };
}
```

Method chỉ cần x và cố ý bỏ qua y.

### Unnamed lambda parameters

Trong một lambda, những parameter không cần dùng cũng có thể được biểu diễn bằng dấu gạch dưới trong ngữ cảnh preview phù hợp:

```java
java.util.function.BiFunction<Integer, Integer, Integer> first =
        (firstValue, _) -> firstValue;
```

Việc không đặt tên cho parameter không cần dùng giúp người đọc phân biệt:

- Giá trị nào là một phần của logic.
- Giá trị nào chỉ tồn tại vì functional interface yêu cầu đủ số parameter.

### Unnamed exception/resource variables

Trong những ngữ cảnh được preview hỗ trợ, dấu gạch dưới cũng có thể biểu diễn biến không cần đọc:

```java
try {
    process();
} catch (IllegalStateException _) {
    recover();
}
```

Nếu cần log hoặc đọc cause, không được dùng unnamed variable; hãy đặt tên cho exception:

```java
catch (IllegalStateException exception) {
    logger.warn("Cannot process state", exception);
}
```

### Quy tắc cần nhớ

- Dấu gạch dưới không còn được dùng như tên biến thông thường trong những ngữ cảnh Java đã dành cho unnamed variables.
- Không dùng unnamed pattern nếu bạn thực sự cần truy cập giá trị.
- Đây là preview syntax trong Java 21, nên code cần flag tương ứng.
- Unnamed variable làm rõ ý định, không làm thay đổi semantics của phép kiểm tra kiểu.

## 35.4. Unnamed Classes and Instance Main Methods — JEP 445

Java truyền thống yêu cầu một chương trình nhỏ phải có:

```java
public class Hello {

    public static void main(String[] args) {
        System.out.println("Hello");
    }
}
```

Preview feature này cho phép viết những chương trình đơn giản với ít ceremony hơn:

```java
void main() {
    System.out.println("Hello, Java 21!");
}
```

Compiler và launcher ngầm tạo một class phù hợp cho source file.

### Instance main method

Main method không nhất thiết phải là static trong preview model:

```java
class Hello {

    void main() {
        System.out.println("Hello");
    }
}
```

Mục tiêu chính là giúp người mới tập trung vào logic đầu tiên thay vì phải học ngay class declaration, static và String array.

### Phù hợp cho trường hợp nào?

- Ví dụ nhỏ trong giáo trình.
- Bài tập ngắn.
- Script hoặc prototype.
- Thử nghiệm trong lớp học.

### Không nên nhầm với entry point production

Trong application backend thông thường, dạng truyền thống vẫn rõ ràng và tương thích rộng:

```java
public static void main(String[] args) {
    startApplication(args);
}
```

Những framework, build plugin, static analysis tool hoặc runtime cũ có thể chưa hỗ trợ tốt unnamed classes. Hãy xem đây là công cụ giảm ceremony, không phải quy tắc bắt buộc phải áp dụng cho mọi class.

## 35.5. Scoped Values — JEP 446

ScopedValue là preview API để truyền một giá trị bất biến qua dynamic scope của một đoạn thực thi.

Nó giải quyết một phần nhu cầu thường được xử lý bằng ThreadLocal, chẳng hạn:

- Request ID.
- Authentication context.
- Tenant ID.
- Locale của request.
- Trace context.

### Ví dụ cơ bản

```java
import java.lang.ScopedValue;

public class ScopedValueDemo {

    private static final ScopedValue<String> REQUEST_ID =
            ScopedValue.newInstance();

    static void writeLog(String message) {
        System.out.println(
                "[" + REQUEST_ID.get() + "] " + message
        );
    }

    public static void main(String[] args) {
        ScopedValue.where(REQUEST_ID, "req-1001")
                .run(() -> writeLog("Processing request"));
    }
}
```

REQUEST_ID được bind trong scope của run(). Method writeLog() không cần nhận request ID qua từng parameter, nhưng vẫn đọc được giá trị đang được bind trong dynamic scope.

### get() và isBound()

```java
if (REQUEST_ID.isBound()) {
    System.out.println(REQUEST_ID.get());
}
```

Gọi get() khi value chưa được bind có thể dẫn đến exception. Nếu context là optional, dùng isBound() hoặc thiết kế một giá trị mặc định ở tầng phù hợp.

### Giá trị có thể thay đổi không?

ScopedValue được thiết kế theo hướng value binding bất biến:

- Code bên trong scope đọc được giá trị.
- Code bên trong không gán lại binding của scope cha.
- Scope con có thể bind giá trị khác cho cùng key trong phạm vi riêng.
- Sau khi scope kết thúc, binding không còn hiệu lực ở bên ngoài.

```java
ScopedValue.where(REQUEST_ID, "outer")
        .run(() -> {
            writeLog("Outer");

            ScopedValue.where(REQUEST_ID, "inner")
                    .run(() -> writeLog("Inner"));

            writeLog("Back to outer");
        });
```

### ScopedValue và ThreadLocal

| ScopedValue | ThreadLocal |
| --- | --- |
| Bất biến theo binding | Có thể set/remove mutable value |
| Có phạm vi rõ ràng | Có thể tồn tại gắn với lifetime của thread |
| Phù hợp truyền context xuống call tree | Phù hợp một số state gắn với thread |
| Giảm nguy cơ state bị thay đổi tùy ý | Cần cleanup cẩn thận trong thread pool |
| Preview trong Java 21 | API đã ổn định từ trước |

ScopedValue không thay thế mọi use case của ThreadLocal. Nếu cần mutable state gắn với thread hoặc framework chưa hỗ trợ preview API, ThreadLocal vẫn có thể cần thiết. Tuy nhiên, phải gọi remove() trong các thread pool khi context không còn dùng.

### ScopedValue với virtual threads

Virtual threads tạo ra nhu cầu truyền context với số lượng task rất lớn. Scoped values được thiết kế để hoạt động tốt với mô hình truyền context bất biến và có cấu trúc hơn. Dù vậy, preview API vẫn phải được đánh giá về framework integration trước khi dùng trong production.

## 35.6. Structured Concurrency — JEP 453

Structured Concurrency xem một nhóm task concurrent như một đơn vị có cấu trúc:

- Task con được tạo trong một scope.
- Scope cha chờ hoặc hủy các task con.
- Lỗi của một task có thể làm hủy những task liên quan.
- Lifetime của task con không vượt quá scope cha theo thiết kế.

Điều này giúp tránh tình trạng task được submit nhưng bị quên, exception bị bỏ qua hoặc request đã kết thúc nhưng background task vẫn chạy.

### Ví dụ gọi hai nguồn dữ liệu

```java
import java.util.concurrent.StructuredTaskScope;

record Dashboard(User user, java.util.List<Order> orders) {}

static Dashboard loadDashboard(long userId)
        throws InterruptedException {

    try (var scope = new StructuredTaskScope.ShutdownOnFailure()) {

        var user = scope.fork(() -> loadUser(userId));
        var orders = scope.fork(() -> loadOrders(userId));

        scope.join().throwIfFailed();

        return new Dashboard(user.get(), orders.get());
    }
}
```

Ví dụ trên minh họa ý tưởng. loadUser() và loadOrders() có thể chạy đồng thời. Nếu một task thất bại, ShutdownOnFailure có thể yêu cầu hủy task còn lại và truyền lỗi lên scope.

### Vì sao structured concurrency hữu ích?

Trong cách submit task rời rạc:

```java
Future<User> user = executor.submit(() -> loadUser(id));
Future<List<Order>> orders = executor.submit(() -> loadOrders(id));

// Developer phải tự theo dõi:
// - task nào cần cancel?
// - nếu user fail thì orders có còn chạy không?
// - request timeout xử lý thế nào?
// - exception nào bị bỏ quên?
```

Structured scope đặt các câu hỏi này vào cùng một abstraction.

### Cancellation và interruption

Structured concurrency phụ thuộc vào việc task phản ứng đúng với interruption. Code worker không nên nuốt interruption:

```java
try {
    return callDownstream();
} catch (InterruptedException exception) {
    Thread.currentThread().interrupt();
    throw exception;
}
```

Nếu downstream client hoặc task không hỗ trợ cancellation, việc đóng scope vẫn không tự động dừng được mọi công việc bên ngoài.

### Preview API và production

Structured Concurrency trong Java 21 là preview. API có thể thay đổi, vì vậy cần:

- Đọc đúng JEP của JDK đang dùng.
- Bật preview cho compile/test/run.
- Không trộn phiên bản API giữa JDK 21 và JDK mới hơn.
- Kiểm tra framework executor, tracing, timeout và observability.

## 35.7. Foreign Function & Memory API — JEP 442

Foreign Function & Memory API (FFM API) cho phép Java:

- Gọi hàm native bên ngoài JVM.
- Truy cập vùng nhớ ngoài Java heap.
- Mô tả layout của dữ liệu native.
- Quản lý lifetime của memory segment bằng scope rõ ràng.

Đây là hướng tiếp cận hiện đại hơn cho nhiều use case trước đây cần JNI hoặc Unsafe.

### Off-heap memory cơ bản

```java
import java.lang.foreign.Arena;
import java.lang.foreign.MemorySegment;
import java.lang.foreign.ValueLayout;

try (Arena arena = Arena.ofConfined()) {
    MemorySegment segment =
            arena.allocate(ValueLayout.JAVA_INT);

    segment.set(ValueLayout.JAVA_INT, 0, 42);

    int value = segment.get(ValueLayout.JAVA_INT, 0);
    System.out.println(value);
}
```

Arena quản lý lifetime của segment. Khi arena đóng, vùng nhớ liên quan được giải phóng theo contract của API. Đây là mô hình an toàn hơn việc tự thao tác địa chỉ native mà không có ownership rõ ràng.

### Gọi native function

FFM API cung cấp những thành phần như:

- Linker: tạo downcall handle tới native function.
- SymbolLookup: tìm symbol trong library.
- FunctionDescriptor: mô tả kiểu tham số và kiểu trả về.
- MemorySegment: đại diện function pointer hoặc vùng nhớ.

Quy trình khái niệm:

1. Tìm native library hoặc symbol.
2. Mô tả chữ ký native bằng FunctionDescriptor.
3. Tạo method handle.
4. Gọi với dữ liệu được quản lý bằng memory layout phù hợp.
5. Đóng scope và giải phóng memory đúng lifetime.

### Rủi ro

FFM không làm native code trở nên an toàn tuyệt đối. Bạn vẫn phải quan tâm:

- Sai memory layout.
- Sai calling convention.
- Lifetime của segment.
- Thread confinement.
- Native library ABI.
- Buffer overflow ở phía native.
- Khác biệt giữa Windows, Linux và macOS.

Đây là chủ đề nâng cao. Junior Backend Developer nên biết mục đích và rủi ro, chưa cần sử dụng FFM chỉ để thay thế Java API thông thường.

## 35.8. Preview Feature và Java Modules

Khi project dùng module path, preview flags phải được truyền nhất quán cho các bước compile, test và run. Lệnh cụ thể phụ thuộc shell và build tool.

Trong CI, nên có kiểm tra:

- JDK major version đúng 21.
- Compiler có preview enabled.
- Test JVM có preview enabled.
- Integration test JVM có preview enabled.
- Docker image runtime dùng đúng JDK.
- Artifact không vô tình chạy trên runtime không hỗ trợ preview.

## 35.9. Khi nào nên dùng Preview Features?

Có thể cân nhắc khi:

- Project kiểm soát được JDK runtime.
- Team chấp nhận migration cost.
- Tính năng tạo giá trị thực tế.
- Có test và observability đủ tốt.
- Đã có kế hoạch thay đổi nếu JEP bị sửa hoặc rút.

Nên tránh khi:

- Viết thư viện public cho nhiều JDK.
- Ứng dụng cần compatibility rộng.
- Team chưa kiểm soát được môi trường build và deploy.
- Tính năng chỉ giúp code ngắn hơn nhưng tạo dependency preview dài hạn.
- Không có thời gian kiểm thử sau khi nâng JDK.

## 35.10. Ví dụ cấu hình Maven cho Preview

Một cấu hình tối giản có thể truyền preview flag cho compiler và test JVM:

```xml
<properties>
    <maven.compiler.release>21</maven.compiler.release>
</properties>

<build>
    <plugins>
        <plugin>
            <artifactId>maven-compiler-plugin</artifactId>
            <configuration>
                <compilerArgs>
                    <arg>--enable-preview</arg>
                </compilerArgs>
            </configuration>
        </plugin>

        <plugin>
            <artifactId>maven-surefire-plugin</artifactId>
            <configuration>
                <argLine>--enable-preview</argLine>
            </configuration>
        </plugin>
    </plugins>
</build>
```

Cấu hình thực tế cần pin version plugin phù hợp với project. Điều quan trọng là compiler và test runtime đều nhận được flag, đồng thời release phải khớp JDK mục tiêu.

# CHƯƠNG 36. FINALIZED FEATURES, PREVIEW VÀ PRODUCTION GUIDELINES

Java 21 có cả những tính năng đã finalized và những tính năng đang ở giai đoạn Preview. Phân biệt hai nhóm này rất quan trọng khi xây dựng application, library và hệ thống CI/CD.

## 36.1. Finalized Feature và Preview Feature

### Finalized Feature

Một tính năng finalized đã trở thành một phần chính thức của Java release. Điều này không có nghĩa API sẽ không bao giờ thay đổi, nhưng mức ổn định và compatibility expectation cao hơn nhiều so với preview.

Các tính năng Java 21 quan trọng trong phần này:

- Record Patterns.
- Pattern Matching for switch.
- Virtual Threads.
- Sequenced Collections.

Các tính năng finalized từ những phiên bản trước nhưng vẫn rất quan trọng:

- var.
- Switch Expressions.
- Text Blocks.
- Records.
- Sealed Classes.
- Pattern Matching for instanceof.

### Preview Feature

Preview feature được cung cấp để nhận feedback. Nó cần flag enable-preview, có thể thay đổi và không nên được xem là API contract dài hạn.

| Tiêu chí | Finalized | Preview |
| --- | --- | --- |
| Compiler | Dùng như Java syntax/API thông thường | Cần enable-preview khi cần |
| Runtime | Không cần preview flag | Cần enable-preview để chạy artifact tương ứng |
| Compatibility | Kỳ vọng ổn định cao hơn | Có thể thay đổi hoặc bị rút |
| Production | Có thể dùng sau khi đánh giá thông thường | Cần approval và migration plan rõ ràng |
| Library public | Phù hợp hơn | Rủi ro buộc consumer theo preview |
| CI/CD | Kiểm tra JDK là đủ trong nhiều trường hợp | Phải truyền flag ở compile, test và run |

## 36.2. Preview Class File và Runtime Compatibility

Một class file được compile với preview feature mang thông tin cho biết nó phụ thuộc vào preview của release nào. Runtime cần được bật preview tương ứng.

Ví dụ:

```bash
javac --enable-preview --release 21 -d out PreviewDemo.java
java --enable-preview -cp out PreviewDemo
```

Không nên:

```bash
javac --enable-preview --release 21 -d out PreviewDemo.java
java -cp out PreviewDemo
```

Việc compile thành công không chứng minh artifact có thể chạy trên mọi Java 21 runtime configuration. Compile, test, package, Docker image và production launcher phải dùng cùng chính sách preview.

### Không trộn preview API giữa các JDK

Một ví dụ dễ nhầm là lấy tài liệu hoặc code của một preview feature từ Java 22 rồi chạy với JDK 21. Cú pháp hoặc method có thể khác. Khi học Java 21:

1. Đọc tài liệu đúng Java 21.
2. Kiểm tra JEP version của release.
3. Biên dịch bằng JDK 21.
4. Chỉ sử dụng API mà JDK 21 thực sự cung cấp.

## 36.3. Nguyên tắc chọn tính năng cho Backend

### Dùng records cho data carrier

Phù hợp:

- Request DTO.
- Response DTO.
- Event payload.
- Read-only projection.
- Value object nhỏ.

Không nên mặc định dùng record cho:

- JPA entity có lifecycle phức tạp.
- Object cần lazy mutation.
- Object cần kế thừa class khác.
- Graph dữ liệu cần deep immutability nhưng chưa có defensive copy.

### Dùng sealed types khi domain có tập biến thể hữu hạn

Phù hợp:

- Payment result.
- Command result.
- Parser AST.
- State machine.
- Domain error categories.

Nếu domain cần plugin hoặc implementation mở từ bên ngoài, sealed interface có thể trở thành giới hạn không phù hợp.

### Dùng pattern switch khi xử lý type hierarchy

Pattern switch phù hợp khi một method cần chuyển nhiều subtype thành một kết quả:

```java
static String describe(PaymentResult result) {
    return switch (result) {
        case Approved approved ->
                "Approved: " + approved.transactionId();
        case Rejected rejected ->
                "Rejected: " + rejected.reason();
    };
}
```

Nếu mỗi subtype có behavior phức tạp và thay đổi độc lập, polymorphic method có thể dễ bảo trì hơn:

```java
sealed interface PaymentResult
        permits Approved, Rejected {

    String message();
}

record Approved(String transactionId)
        implements PaymentResult {

    @Override
    public String message() {
        return "Approved: " + transactionId;
    }
}
```

Không có một quy tắc bắt buộc rằng pattern switch luôn tốt hơn polymorphism. Hãy chọn theo hướng thay đổi chính của domain:

- Nhiều loại operation trên cùng một hierarchy: pattern switch có thể phù hợp.
- Nhiều subtype với behavior riêng: polymorphism có thể phù hợp.

### Dùng virtual threads cho concurrency, không phải để tăng CPU

Virtual threads phù hợp cho nhiều task chờ I/O. Chúng không biến một CPU-bound loop thành nhanh hơn. Nếu business logic bị giới hạn bởi CPU, cần tối ưu algorithm, batching, native acceleration hoặc giới hạn số task chạy đồng thời.

## 36.4. Ví dụ kết hợp Record, Sealed và Pattern Switch

Một domain thanh toán đơn giản.

Các type public dưới đây được trình bày trong cùng một đoạn minh họa; trong project Java thực tế, mỗi top-level public type cần đặt trong file phù hợp với tên type.

```java
public sealed interface PaymentResult
        permits Approved, Rejected, Pending {
}

public record Approved(
        String transactionId,
        long amount
) implements PaymentResult {
}

public record Rejected(
        String reason
) implements PaymentResult {
}

public record Pending(
        String reference
) implements PaymentResult {
}
```

Xử lý bằng exhaustive switch:

```java
static int httpStatus(PaymentResult result) {
    return switch (result) {
        case Approved approved -> 200;
        case Pending pending -> 202;
        case Rejected rejected -> 422;
    };
}
```

Tạo thông điệp:

```java
static String responseMessage(PaymentResult result) {
    return switch (result) {
        case Approved approved ->
                "Payment completed: "
                        + approved.transactionId();
        case Pending pending ->
                "Payment is processing: "
                        + pending.reference();
        case Rejected rejected ->
                "Payment rejected: "
                        + rejected.reason();
    };
}
```

Lợi ích của thiết kế:

- Record giảm boilerplate cho dữ liệu.
- Sealed hierarchy giới hạn các trạng thái hợp lệ.
- Switch expression buộc code xử lý đủ subtype.
- Nếu thêm Cancelled, compiler có thể chỉ ra những switch cần cập nhật.

## 36.5. Ví dụ Backend với Virtual Thread per Task

Ví dụ sau mô phỏng hai blocking calls độc lập:

```java
import java.util.concurrent.Callable;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

record UserProfile(String username) {}

record OrderSummary(int totalOrders) {}

static String buildResponse(long userId)
        throws Exception {

    try (var executor =
                 Executors.newVirtualThreadPerTaskExecutor()) {

        Callable<UserProfile> profileTask =
                () -> loadProfile(userId);

        Callable<OrderSummary> orderTask =
                () -> loadOrderSummary(userId);

        Future<UserProfile> profile =
                executor.submit(profileTask);

        Future<OrderSummary> orders =
                executor.submit(orderTask);

        return profile.get().username()
                + ": "
                + orders.get().totalOrders();
    }
}
```

Đây chỉ là skeleton. Trong service thật cần bổ sung:

- Timeout cho từng downstream call.
- Xử lý InterruptedException.
- Chính sách cancellation.
- Giới hạn concurrency ở downstream.
- Logging và tracing.
- Không tạo database connection riêng cho mỗi virtual thread ngoài pool policy.

Nếu task có CPU-heavy transformation sau khi nhận dữ liệu, cần cân nhắc giới hạn phần CPU đó thay vì tạo không giới hạn các task.

## 36.6. Checklist code review cho Java 21

### Đối với var

- Type bên phải có đủ rõ ràng không?
- Có làm API hoặc logic khó đọc không?
- Có đang dùng var ở nơi Java không cho phép không?

### Đối với records

- Component có thật sự là dữ liệu nên bất biến ở mức tham chiếu không?
- Có cần defensive copy cho List, Map hoặc array không?
- Có cần validation ở compact constructor không?
- Record có đang bị dùng như JPA entity mutable không?

### Đối với sealed types và patterns

- Tập subtype có thật sự hữu hạn không?
- Có nên bỏ default để compiler bắt missing case không?
- Pattern order có bị dominance che khuất không?
- Null có được xử lý theo contract không?

### Đối với virtual threads

- Workload có chủ yếu chờ I/O không?
- Có synchronized block dài hoặc native call gây pinning không?
- Có timeout và interruption không?
- Database pool, HTTP connection pool và rate limit có được giữ nguyên không?
- Có đang pooling hoặc tái sử dụng virtual thread không?
- Có đo p95/p99 và downstream saturation không?

### Đối với preview features

- Feature có thật sự cần không?
- CI và production runtime có cùng JDK/flag không?
- Có migration plan nếu feature thay đổi không?
- Public API có vô tình ép consumer dùng preview không?

## 36.7. Bài tập thực hành

### Bài 1 — Record và defensive copy

Tạo record Order với:

- id.
- customerId.
- List<String> itemCodes.

Yêu cầu:

1. Không cho phép id null.
2. Không cho phép itemCodes null.
3. Dùng List.copyOf để giữ snapshot unmodifiable.
4. Viết test chứng minh list bên ngoài không thể thay đổi state bên trong record.

### Bài 2 — Sealed payment result

Tạo sealed interface PaymentResult gồm:

- Approved.
- Rejected.
- Pending.

Viết switch expression trả về HTTP status và message. Thêm một subtype mới để quan sát compiler báo những switch chưa exhaustive.

### Bài 3 — Nested record pattern

Tạo:

```java
record Address(String city, String country) {}

record Customer(String name, Address address) {}
```

Viết method dùng record pattern để lấy city. Xử lý rõ trường hợp Customer null và Address null nếu constructor cho phép null.

### Bài 4 — Virtual thread I/O

Tạo 1.000 task mô phỏng blocking bằng sleep. So sánh:

- Một virtual thread cho mỗi task.
- Fixed platform thread pool.

Đo thời gian hoàn thành, memory và số thread. Không kết luận chỉ từ một lần chạy; lặp benchmark nhiều lần.

### Bài 5 — Giới hạn downstream

Dùng Semaphore để giới hạn tối đa 20 task cùng gọi một mock downstream dù có hàng nghìn virtual threads:

```java
Semaphore limit = new Semaphore(20);

limit.acquire();
try {
    callDownstream();
} finally {
    limit.release();
}
```

Thêm timeout và xử lý interruption đúng cách.

### Bài 6 — Preview feature audit

Tạo một source file dùng một preview feature. Thiết lập compile/test/run với JDK 21, sau đó tắt enable-preview ở từng bước để quan sát lỗi. Viết README nêu rõ rủi ro migration.

## 36.8. Câu hỏi phỏng vấn thường gặp

### 1. var có làm Java thành dynamically typed không?

Không. var chỉ là local-variable type inference. Compiler vẫn suy luận một kiểu cụ thể tại compile time và biến không thể nhận giá trị không tương thích kiểu đó.

### 2. Record có immutable tuyệt đối không?

Không. Record có final component fields nhưng có thể giữ reference tới mutable List, Map, array hoặc object mutable khác. Cần defensive copy và immutable component nếu muốn bảo vệ sâu hơn.

### 3. Record có thể extends class tùy ý không?

Không. Record trực tiếp kế thừa java.lang.Record và không thể extends một class khác. Record có thể implement interfaces.

### 4. Sealed class khác abstract class thế nào?

Abstract class mô tả class có thể chứa abstract behavior nhưng không tự giới hạn tập subclass. Sealed class giới hạn direct permitted subtypes; hai khái niệm có thể kết hợp.

### 5. Vì sao switch trên sealed hierarchy có thể không cần default?

Compiler biết những subtype được phép và có thể kiểm tra exhaustiveness. Không viết default giúp compiler báo lỗi khi hierarchy được mở rộng.

### 6. Record pattern khác instanceof pattern thế nào?

Instanceof pattern kiểm tra và bind một object theo type. Record pattern vừa kiểm tra record type vừa deconstruct các components của record.

### 7. case null có tác dụng gì trong pattern switch?

Nó mô tả rõ cách xử lý selector null. Nếu contract không cho phép null, có thể để null dẫn tới lỗi hoặc validate trước; nếu cho phép, case null giúp behavior tường minh.

### 8. Virtual thread có phải thread pool không?

Không. Virtual thread là thread nhẹ được tạo cho task. Có thể dùng executor tạo một virtual thread per task; không nên lấy virtual threads làm worker objects để pool và tái sử dụng như platform threads.

### 9. Virtual thread có làm CPU-bound task nhanh hơn không?

Không. Virtual thread chủ yếu giúp tăng khả năng quản lý concurrency khi task chờ. CPU vẫn phải được thực thi trên các carrier/platform threads và số core vẫn giới hạn.

### 10. Blocking I/O hoạt động thế nào với virtual thread?

Trong những trường hợp được runtime hỗ trợ, virtual thread có thể được unmount khỏi carrier khi chờ, để carrier chạy task khác. Không phải mọi blocking operation đều unmount; synchronized pinning và native code có thể giữ carrier.

### 11. Pinning là gì?

Pinning xảy ra khi virtual thread không thể unmount khỏi carrier trong lúc block, thường liên quan synchronized lâu hoặc native/foreign call. Pinning nhiều có thể làm giảm lợi ích của virtual threads.

### 12. Có cần giới hạn số virtual threads không?

Không nhất thiết giới hạn số thread bằng một pool cứng, nhưng vẫn phải giới hạn concurrency của resource bên ngoài như database, HTTP downstream, rate limit và CPU-heavy work.

### 13. String Templates có an toàn hơn nối chuỗi không?

Không tự động. An toàn hay không phụ thuộc template processor và context. SQL, HTML, shell command và log cần cơ chế escaping/parameterization riêng.

### 14. Preview feature có nên dùng production không?

Có thể, nếu team kiểm soát JDK, chấp nhận migration cost, có test và fallback. Không nên dùng chỉ vì cú pháp ngắn hơn khi project cần compatibility rộng hoặc là public library.

### 15. ScopedValue khác ThreadLocal ở điểm nào?

ScopedValue hướng tới binding bất biến, có lifetime theo scope và phù hợp truyền context xuống call tree. ThreadLocal cho phép mutable state gắn với thread và cần cleanup cẩn thận, đặc biệt trong thread pool.

### 16. Structured Concurrency giải quyết vấn đề gì?

Nó nhóm các task con vào một scope có lifecycle và failure policy rõ ràng, giúp parent chờ, cancel và propagates failure có cấu trúc thay vì quản lý các Future rời rạc.

## 36.9. Kiến thức cần nhớ

- Java 21 finalized Record Patterns, Pattern Matching for switch và Virtual Threads.
- var không phải dynamic typing.
- Text Blocks vẫn tạo ra String thông thường.
- Switch expression trả về giá trị và thường cần exhaustive coverage.
- Record giảm boilerplate nhưng chỉ cung cấp shallow immutability.
- Sealed types giúp compiler biết tập subtype hợp lệ.
- Record Patterns deconstruct record components và có thể lồng nhau.
- Pattern order phải tránh dominance; pattern tổng quát đặt trước có thể làm pattern cụ thể unreachable.
- Virtual threads tối ưu cho concurrency I/O-bound, không phải phép tăng tốc CPU.
- Virtual threads không xóa bỏ giới hạn database pool, connection pool, file descriptors hoặc downstream capacity.
- Pinning cần được quan sát bằng diagnostic tools và giảm bằng thiết kế critical section phù hợp.
- Preview feature cần enable-preview ở compile và run, đồng thời có migration plan.
- Scoped Values, Structured Concurrency, String Templates, Unnamed Patterns và FFM là preview features trong Java 21.

# TỔNG KẾT PHẦN 11

Phần 11 nối ba lớp kiến thức:

1. Language modeling: records, sealed types, pattern matching và switch expressions giúp biểu diễn domain rõ ràng hơn.
2. Runtime concurrency: virtual threads giúp xây dựng mô hình thread-per-request với chi phí thấp hơn khi workload chủ yếu chờ I/O.
3. Release discipline: finalized feature và preview feature phải được sử dụng với mức kỳ vọng compatibility khác nhau.

Khi bước vào Spring Boot, bạn sẽ gặp các ứng dụng thực tế của những kiến thức này:

- Record cho request/response DTO.
- Sealed result cho domain operation và error handling.
- Pattern switch cho chuyển đổi trạng thái hoặc mapping response.
- Virtual thread executor cho các tác vụ blocking I/O phù hợp.
- Timeout, cancellation, backpressure và resource pool để bảo vệ hệ thống.

Java 21 không làm cho mọi code tự động tốt hơn. Giá trị nằm ở việc chọn đúng abstraction, hiểu giới hạn của runtime và đo behavior thực tế trước khi áp dụng vào production.

# TÀI LIỆU THAM KHẢO

- [Java Language Changes Summary — Java SE 21](https://docs.oracle.com/en/java/javase/21/language/java-language-changes-summary.html)
- [Pattern Matching for switch — Java SE 21](https://docs.oracle.com/en/java/javase/21/language/pattern-matching-switch.html)
- [Record Patterns — Java SE 21](https://docs.oracle.com/en/java/javase/21/language/record-patterns.html)
- [Records — Java SE 21](https://docs.oracle.com/en/java/javase/21/language/records.html)
- [Virtual Threads — Java SE 21](https://docs.oracle.com/en/java/javase/21/core/virtual-threads.html)
- [Preview API List — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/preview-list.html)
- [Implicitly Declared Classes and Instance Main Methods](https://docs.oracle.com/en/java/javase/21/language/implicitly-declared-classes-and-instance-main-methods.html)
- [Unnamed Variables and Patterns](https://docs.oracle.com/en/java/javase/21/language/unnamed-variables-and-patterns.html)
- [ScopedValue API — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ScopedValue.html)
- [JEP 444: Virtual Threads](https://openjdk.org/jeps/444)
