# JAVA CORE 21 — PHẦN 14: INTERVIEW PREPARATION & PRACTICAL REVIEW

Ôn tập tổng hợp 40 chương · Java SE 21 · Junior / Junior+ Backend Developer

Phần 14 là phần tổng kết của lộ trình Java Core 21. Mục tiêu không phải là học thêm thật nhiều API mới, mà là biến kiến thức đã học thành năng lực có thể quan sát được trong phỏng vấn và trong công việc:

- Đọc một đoạn code và dự đoán đúng kết quả.
- Giải thích cơ chế thay vì chỉ nói tên khái niệm.
- Nhận diện bug về kiểu dữ liệu, equality, collection, concurrency, transaction và resource lifecycle.
- Chọn giải pháp phù hợp với constraint, không dùng một công cụ cho mọi bài toán.
- Viết code có thể kiểm thử, bảo trì và mở rộng.
- Trình bày trade-off một cách rõ ràng, trung thực.

Một ứng viên Junior+ không nhất thiết phải thuộc mọi class trong JDK. Tuy nhiên, khi được hỏi về `HashMap`, `equals()`, `CompletableFuture`, transaction hoặc virtual threads, bạn nên giải thích được ít nhất bốn lớp:

1. Khái niệm đó là gì?
2. Cơ chế quan trọng bên dưới hoạt động như thế nào?
3. Ưu điểm, giới hạn và lỗi thường gặp là gì?
4. Nó được áp dụng ra sao trong một Backend service?

## Cấu trúc Phần 14

| Chương | Nội dung | Mục tiêu |
| --- | --- | --- |
| 41 | Java Core Interview Questions | Trả lời câu hỏi lý thuyết, cơ chế và các bẫy thường gặp |
| 42 | Java Coding Challenges | Viết code, chọn cấu trúc dữ liệu, xử lý edge cases và phân tích complexity |
| 43 | Backend Practical Scenarios | Giải quyết tình huống concurrency, database, external API, cache và production |
| 44 | Mock Interview & Revision Roadmap | Tự đánh giá, luyện phỏng vấn và lập kế hoạch ôn tập |

---

# CHƯƠNG 41. JAVA CORE INTERVIEW QUESTIONS

## 41.1. Cách trả lời câu hỏi phỏng vấn

Một câu trả lời tốt không cần dài ngay từ câu đầu. Hãy trả lời theo tầng để người phỏng vấn có thể đào sâu đúng mức:

### Tầng 1 — Definition

Nêu định nghĩa ngắn, chính xác.

### Tầng 2 — Mechanism

Giải thích các bước hoặc quy tắc chính làm cho khái niệm hoạt động.

### Tầng 3 — Trade-offs

Nêu giới hạn, chi phí, trường hợp không nên dùng và những hiểu lầm phổ biến.

### Tầng 4 — Practical Example

Liên hệ với service, database, HTTP request, cache hoặc code mà bạn đã từng viết.

Ví dụ với câu hỏi:

> What is the difference between `HashMap` and `ConcurrentHashMap`?

Một câu trả lời chưa đủ sâu là:

> `HashMap` không thread-safe, còn `ConcurrentHashMap` thread-safe.

Câu trả lời tốt hơn:

> `HashMap` không cung cấp contract cho concurrent reads/writes khi không có coordination bên ngoài. `ConcurrentHashMap` được thiết kế cho nhiều threads truy cập, hỗ trợ những thao tác atomic theo từng method như `putIfAbsent()`, `computeIfAbsent()` và `merge()`, đồng thời không cho phép `null` key hoặc value. Tuy nhiên, một chuỗi nhiều thao tác của application vẫn không tự động trở thành một transaction atomic. Ví dụ kiểm tra tồn tại rồi gọi một API bên ngoài vẫn cần cơ chế phối hợp riêng. Trong Backend, em chọn `ConcurrentHashMap` khi cần shared in-memory state có concurrent access, nhưng vẫn xem xét giới hạn kích thước, eviction, consistency và việc nhiều instance có thể không chia sẻ cùng một JVM.

### Quy trình khi không nhớ chính xác

Không nên đoán một con số hoặc một implementation detail như thể đó là Java Language Specification.

Có thể trả lời:

> Theo contract của Java, hành vi được bảo đảm là ...
> Ở OpenJDK/HotSpot hiện tại, implementation thường làm ... nhưng đây không phải điều code nên phụ thuộc trực tiếp.

Cách phân biệt contract với implementation detail thường được đánh giá cao hơn việc nhớ một chi tiết nhưng nói sai phạm vi áp dụng.

### Những lỗi khi trả lời

- Chỉ nêu thuộc tính mà không giải thích cơ chế.
- Nói “luôn luôn” hoặc “không bao giờ” cho một implementation detail.
- Nhầm `thread-safe` với `atomic` hoặc `distributed-safe`.
- Đưa ra giải pháp mà không hỏi constraint.
- Chỉ biết happy path, không nói về null, empty input, overflow, timeout hoặc retry.
- Đề xuất tăng memory, tăng thread pool hoặc thêm `synchronized` trước khi xác định nguyên nhân.

## 41.2. Nhóm OOP và Java Fundamentals

### Q1. Java là pass-by-value hay pass-by-reference?

Java luôn là pass-by-value.

Với primitive, method nhận một bản sao của giá trị:

```java
static void change(int x) {
    x = 100;
}

int a = 10;
change(a);

System.out.println(a); // 10
```

Với object, giá trị được sao chép là một reference value. Hai biến có thể cùng trỏ tới một object, nhưng bản thân biến reference của caller không được truyền để method thay thế trực tiếp:

```java
record User(String name) {}

static void reassign(User user) {
    user = new User("Bob");
}

User original = new User("Alice");
reassign(original);

System.out.println(original.name()); // Alice
```

Nếu object mutable, method có thể thay đổi object mà cả hai reference đang trỏ tới:

```java
static void update(List<String> names) {
    names.add("Bob");
}

List<String> names = new ArrayList<>();
names.add("Alice");

update(names);

System.out.println(names); // [Alice, Bob]
```

Điểm cần nhấn mạnh trong phỏng vấn:

- Java không truyền biến caller theo reference.
- Java truyền bản sao của value.
- Với reference type, value đó là reference trỏ tới object theo mô hình ngôn ngữ.
- Mutation của object khác với reassignment của biến reference.

### Q2. Overloading và Overriding khác nhau thế nào?

| Tiêu chí | Overloading | Overriding |
| --- | --- | --- |
| Ý nghĩa | Nhiều method cùng tên nhưng khác parameter list | Subclass cung cấp implementation phù hợp cho inherited instance method |
| Resolution | Chủ yếu ở compile time | Dynamic dispatch ở runtime đối với instance methods |
| Quan hệ class | Có thể trong cùng class | Cần inheritance hoặc interface implementation |
| Parameters | Phải khác nhau về số lượng, kiểu hoặc thứ tự | Phải tương thích với method được override |
| Return type | Chỉ đổi return type là không đủ để overload | Có thể covariant nếu thỏa override rules |
| Static method | Có thể overload | Không override theo dynamic dispatch |

Ví dụ overloading:

```java
class Printer {

    void print(String value) {
        System.out.println("String");
    }

    void print(int value) {
        System.out.println("int");
    }
}
```

Ví dụ overriding:

```java
class Animal {

    void speak() {
        System.out.println("Animal");
    }
}

class Dog extends Animal {

    @Override
    void speak() {
        System.out.println("Dog");
    }
}

Animal animal = new Dog();
animal.speak(); // Dog
```

`@Override` nên được sử dụng vì compiler sẽ kiểm tra rằng method thực sự override hoặc implement một method phù hợp. Nếu viết sai tên hoặc sai parameter list, compiler sẽ báo lỗi thay vì âm thầm tạo một method mới.

### Q3. `==` và `equals()` khác nhau thế nào?

Với primitive, `==` so sánh giá trị theo semantics của kiểu primitive.

Với reference, `==` so sánh identity: hai reference có cùng trỏ đến một object hay không.

`equals()` là method dùng để kiểm tra equality theo contract của type. `Object.equals()` mặc định có hành vi tương đương identity comparison, nhưng nhiều class như `String`, `Integer` hoặc domain value object override method này để so sánh nội dung.

```java
String a = new String("Java");
String b = new String("Java");

System.out.println(a == b);       // false
System.out.println(a.equals(b));  // true
```

Không nên dùng `==` để so sánh nội dung String:

```java
String role = new String("ADMIN");

if (role == "ADMIN") {
    // Không đáng tin cậy: phụ thuộc identity
}

if ("ADMIN".equals(role)) {
    // So sánh nội dung và an toàn khi role có thể null
}
```

Dạng `"ADMIN".equals(role)` còn tránh được `NullPointerException` nếu `role` là `null`.

### Q4. Tại sao phải override `hashCode()` khi override `equals()`?

Contract quan trọng là:

> Nếu `a.equals(b)` trả về `true`, `a.hashCode()` và `b.hashCode()` phải bằng nhau.

Chiều ngược lại không bắt buộc: hai object có cùng hash code vẫn có thể không equal vì hash collision là điều hợp lệ.

Hash-based collections dùng hash code để định vị vùng tìm kiếm trước, sau đó dùng equality để phân biệt chính xác:

```java
record ProductCode(String value) {}

Set<ProductCode> codes = new HashSet<>();
codes.add(new ProductCode("JAVA-21"));

System.out.println(
        codes.contains(new ProductCode("JAVA-21"))
); // true
```

Record tự sinh `equals()` và `hashCode()` dựa trên components. Với class thông thường, nếu override một method mà bỏ qua method còn lại, `HashSet`, `HashMap` và cache key có thể hoạt động sai.

Một lỗi khác là dùng object mutable làm key rồi thay đổi field dùng trong `hashCode()` sau khi đã đưa object vào map. Khi đó object có thể vẫn nằm trong bucket cũ nhưng không còn được tìm thấy bằng hash mới.

### Q5. Interface và Abstract Class khác nhau thế nào?

Interface thường mô tả contract hoặc capability. Abstract class có thể cung cấp shared state, constructor và implementation dùng chung.

| Tiêu chí | Interface | Abstract class |
| --- | --- | --- |
| Mục đích thường gặp | Contract/capability | Base class có state hoặc behavior chung |
| Kế thừa | Một class có thể implement nhiều interfaces | Một class chỉ extends trực tiếp một class |
| Instance fields | Không có instance fields thông thường | Có thể có instance fields |
| Constructor | Không có instance constructor | Có constructor |
| Default implementation | Có `default` methods | Có instance methods đầy đủ |
| Quan hệ domain | “Có khả năng làm gì” | “Là một loại của base class” |

Không nên áp dụng quy tắc “interface luôn tốt hơn abstract class”. Hãy xét:

- Có cần chia sẻ state và constructor logic không?
- Nhiều class không liên quan có cùng capability không?
- Contract có cần mở rộng độc lập với hierarchy không?
- Client có cần phụ thuộc vào một interface nhỏ không?

Trong Backend, `PaymentGateway`, `ClockProvider` hoặc `UserRepository` thường là những abstraction phù hợp cho dependency injection. Một base class có audit fields hoặc lifecycle behavior có thể phù hợp hơn khi có shared implementation thật sự.

### Q6. `String`, `StringBuilder` và `StringBuffer` khác nhau thế nào?

| Type | Đặc điểm | Use case thường gặp |
| --- | --- | --- |
| `String` | Immutable | Giá trị văn bản, key, DTO field, message |
| `StringBuilder` | Mutable, không đồng bộ hóa | Xây dựng chuỗi trong một thread |
| `StringBuffer` | Mutable, nhiều method chính synchronized | Legacy code hoặc shared buffer có yêu cầu synchronization cụ thể |

Ví dụ xây dựng chuỗi trong loop:

```java
StringBuilder builder = new StringBuilder();

for (int i = 0; i < 100; i++) {
    if (i > 0) {
        builder.append(',');
    }

    builder.append(i);
}

String csv = builder.toString();
```

`String` immutable giúp value ổn định và an toàn khi chia sẻ. `StringBuilder` giảm việc tạo nhiều intermediate String khi thật sự có một chuỗi tích lũy động.

Không nên khẳng định mọi phép nối `+` đều chậm. Compiler và runtime có thể tối ưu concatenation, đặc biệt với biểu thức đơn giản. Hãy cân nhắc `StringBuilder` khi:

- Có loop nhiều lần nối.
- Có nhiều nhánh cùng ghi vào một buffer.
- Cần kiểm soát việc xây dựng nội dung.
- Đã đo hoặc biết rõ workload.

`StringBuffer` synchronized từng method không biến một chuỗi nhiều thao tác thành một operation atomic. Nếu logic là “kiểm tra rồi cập nhật”, cần synchronization ở mức compound operation.

## 41.3. Nhóm Collections và Generics

### Q7. `ArrayList` và `LinkedList` khác nhau thế nào?

| Tiêu chí | `ArrayList` | `LinkedList` |
| --- | --- | --- |
| Cấu trúc | Resizable array | Doubly linked list |
| `get(index)` | O(1) | O(n) để tìm node |
| Append cuối | Amortized O(1) | O(1) theo cấu trúc |
| Insert/remove khi đã có vị trí/node | Có thể phải shift O(n) | Relink thường O(1) |
| Cache locality | Thường tốt | Thường kém hơn |
| Memory overhead | Thấp hơn | Mỗi node có thêm links/object overhead |
| Use case mặc định | Danh sách truy cập/duyệt thường xuyên | Một số deque/list workload đặc thù |

Lỗi suy luận phổ biến là:

> `LinkedList` có insert O(1), nên luôn nhanh hơn `ArrayList`.

Nếu code vẫn phải gọi `get(index)` để tìm vị trí, chi phí tìm node đã là O(n). Ngoài ra, array thường có locality tốt và ít object overhead hơn. Với queue/deque, `ArrayDeque` thường thể hiện đúng ý định hơn `LinkedList`.

### Q8. `HashMap` hoạt động như thế nào?

Ở mức khái niệm, khi gọi:

```java
V value = map.get(key);
```

`HashMap` thực hiện một quy trình gần như:

1. Lấy hash code của key.
2. Trộn hoặc biến đổi hash theo implementation.
3. Tính bucket index.
4. Tìm các entry trong bucket.
5. So sánh hash và equality để xác định key đúng.
6. Trả value hoặc `null` nếu không tìm thấy.

Nhiều key có thể rơi vào cùng bucket, gọi là collision. Hash collision không có nghĩa key bị mất; collection cần cơ chế so sánh equality để phân biệt chúng.

Trong các implementation OpenJDK phổ biến, bucket có nhiều collision có thể được chuyển sang cấu trúc dạng tree khi đạt các điều kiện nhất định. Đây là implementation detail, không phải contract để application phụ thuộc.

Lookup có độ phức tạp kỳ vọng gần O(1) khi hash distribution tốt. Trong trường hợp xấu, collision hoặc hash function kém có thể làm hiệu năng giảm. Khi dùng custom key:

- `equals()` và `hashCode()` phải nhất quán.
- Key nên immutable trong thời gian nằm trong map.
- Không nên dùng field có thể thay đổi để tạo hash nếu object sẽ bị sửa sau khi `put()`.

### Q9. `HashMap` và `ConcurrentHashMap` khác nhau thế nào?

`HashMap` không cung cấp thread-safety cho concurrent writes hoặc compound operations. Nếu nhiều threads cùng cập nhật, có thể xảy ra lost update, visibility issue hoặc trạng thái không được bảo vệ.

`ConcurrentHashMap` hỗ trợ concurrent access theo contract của nó:

```java
ConcurrentHashMap<String, User> users =
        new ConcurrentHashMap<>();

users.computeIfAbsent(
        "alice",
        username -> loadUser(username)
);
```

Các method như `putIfAbsent()`, `computeIfAbsent()`, `compute()` và `merge()` hữu ích khi cần một số thao tác atomic trên mapping.

`ConcurrentHashMap` không cho phép `null` key hoặc value. `null` ở đây không thể được dùng để phân biệt “không có mapping” với “có mapping nhưng value là null”.

Cần phân biệt ba mức:

- Method-level atomicity: một method như `putIfAbsent()` có contract atomic.
- Object-level thread safety: map bảo vệ các cấu trúc bên trong theo contract.
- Workflow-level consistency: nhiều thao tác và side effects bên ngoài vẫn cần transaction, lock hoặc idempotency riêng.

Mapping function của `computeIfAbsent()` nên ngắn, không blocking lâu và không tự cập nhật cùng map theo cách tạo recursive update. Nếu function gọi database hoặc HTTP chậm cho hàng nghìn key, map vẫn có thể bị contention và hệ thống vẫn cần một chiến lược giới hạn concurrency.

### Q10. `Comparable` và `Comparator` khác nhau thế nào?

`Comparable<T>` định nghĩa natural ordering của chính type:

```java
record Student(String name, int score)
        implements Comparable<Student> {

    @Override
    public int compareTo(Student other) {
        return Integer.compare(score, other.score);
    }
}
```

`Comparator<T>` định nghĩa ordering bên ngoài class:

```java
Comparator<Student> byName =
        Comparator.comparing(Student::name);

Comparator<Student> byScoreDescending =
        Comparator.comparingInt(Student::score)
                .reversed();
```

Dùng `Integer.compare()` hoặc `Comparator.comparingInt()` thay vì phép trừ:

```java
return this.score - other.score;
```

Phép trừ có thể overflow với giá trị lớn. Ngoài ra, nếu dùng comparator chỉ so sánh `score` trong `TreeSet`, hai student khác nhau nhưng cùng score có thể bị xem là trùng theo ordering vì comparator trả `0`.

### Q11. `? extends T` và `? super T` là gì?

PECS là quy tắc ghi nhớ:

> Producer Extends, Consumer Super.

Một collection producer cung cấp dữ liệu cho code đọc:

```java
static double sum(List<? extends Number> numbers) {
    double result = 0;

    for (Number number : numbers) {
        result += number.doubleValue();
    }

    return result;
}
```

Có thể truyền `List<Integer>` hoặc `List<Double>`. Nhưng không thể thêm một `Integer` tùy ý vào `List<? extends Number>`, vì compiler không biết kiểu cụ thể bên trong là `Integer`, `Double` hay một subtype khác.

Một consumer nhận dữ liệu để ghi:

```java
static void addScores(
        List<? super Integer> destination) {

    destination.add(10);
    destination.add(20);
}
```

Có thể truyền `List<Integer>`, `List<Number>` hoặc `List<Object>`. Khi đọc lại từ `List<? super Integer>`, kiểu an toàn nhất chỉ là `Object`.

Đây là vấn đề type safety, không phải quy tắc runtime của collection. Wildcard không làm `List<Integer>` trở thành subtype của `List<Number>`.

### Q12. Type Erasure là gì?

Java Generics chủ yếu được kiểm tra ở compile time và được chuyển đổi qua cơ chế erasure-based translation.

Ví dụ:

```java
List<String> names = new ArrayList<>();
String first = names.get(0);
```

Ở source code, compiler biết `get()` phải cho kết quả String. Sau khi generic type information bị erase ở phần runtime phù hợp, compiler có thể chèn cast cần thiết.

Vì vậy, điều này không hợp lệ:

```java
if (value instanceof List<String>) {
    // Không compile
}
```

Có thể kiểm tra raw reifiable type:

```java
if (value instanceof List<?>) {
    // Hợp lệ
}
```

Type erasure dẫn đến một số giới hạn:

- Không thể dùng primitive type argument.
- Không thể tạo `new T()`.
- Không thể tạo `new List<String>[10]` trực tiếp.
- Không thể overload hai method chỉ khác nhau ở generic type argument sau erasure.
- Runtime object không tự mang đầy đủ `String` hay `Integer` như nhiều người lầm tưởng.

Tuy vậy, generic declarations vẫn có thể tồn tại trong class-file metadata và được đọc qua Reflection API trong những ngữ cảnh phù hợp.

## 41.4. Exception Handling, Stream và Optional

### Q13. Checked và unchecked exceptions khác nhau thế nào?

Checked exception là exception không thuộc `RuntimeException` hoặc `Error` hierarchy. Compiler yêu cầu code catch hoặc declare theo contract.

Ví dụ:

```java
String content = Files.readString(path);
```

Method cần xử lý hoặc khai báo `IOException`.

Unchecked exceptions gồm `RuntimeException` và các subclass của nó. `Error` cũng không phải checked exception.

| Nhóm | Compiler bắt buộc catch/declare? | Ví dụ |
| --- | --- | --- |
| Checked | Có, theo quy tắc | `IOException`, `SQLException` |
| Unchecked | Không | `IllegalArgumentException`, `NullPointerException` |
| `Error` | Không | `OutOfMemoryError`, `StackOverflowError` |

Không nên đồng nhất:

- Checked = lỗi bên ngoài.
- Unchecked = lỗi lập trình.
- Checked = luôn recoverable.
- Error = tuyệt đối không được catch.

Việc chọn loại exception phải dựa trên API contract, khả năng xử lý của caller và domain semantics.

### Q14. `finally` có luôn chạy không?

Trong luồng thực thi bình thường, `finally` thường chạy khi control rời `try` hoặc `catch`, dù có return hay exception.

```java
static int calculate() {
    try {
        return 10;
    } finally {
        System.out.println("Cleanup");
    }
}
```

Nhưng không có bảo đảm tuyệt đối khi:

- `System.exit()` kết thúc JVM.
- Process bị kill hoặc máy bị mất điện.
- JVM crash.
- Thread bị kẹt vĩnh viễn trước khi rời try.
- Runtime bị dừng theo cách không chạy tiếp được bytecode.

Không nên đặt `return` trong `finally`, vì nó có thể che khuất return hoặc exception ban đầu. Với resource, ưu tiên try-with-resources vì cơ chế này xử lý thứ tự close và suppressed exceptions rõ ràng hơn.

### Q15. `map()` và `flatMap()` trong Stream khác nhau thế nào?

`map()` biến mỗi phần tử thành một phần tử khác. Nếu hàm biến đổi trả về Stream, kết quả sẽ là stream lồng nhau:

```java
List<List<Integer>> data = List.of(
        List.of(1, 2),
        List.of(3, 4)
);

Stream<Stream<Integer>> nested =
        data.stream().map(List::stream);
```

`flatMap()` vừa map vừa làm phẳng:

```java
List<Integer> result = data.stream()
        .flatMap(List::stream)
        .toList();

System.out.println(result); // [1, 2, 3, 4]
```

Liên hệ Backend:

- `map`: `Order` → `OrderDto`.
- `flatMap`: `User` → danh sách orders → một stream orders phẳng.
- `Optional.flatMap`: nối các bước có thể tiếp tục trả về Optional mà không tạo `Optional<Optional<T>>`.

### Q16. `Stream.toList()` và `Collectors.toList()` khác nhau thế nào?

`Stream.toList()` trong Java hiện đại trả về một List không sửa được qua các operation mutation thông thường.

```java
List<String> names = Stream.of("A", "B").toList();

names.add("C"); // Có thể ném UnsupportedOperationException
```

`Collectors.toList()` không bảo đảm concrete implementation hoặc khả năng mutable theo contract đủ mạnh để code nên dựa vào một loại cụ thể.

Nếu cần một `ArrayList` mutable rõ ràng:

```java
List<String> names = Stream.of("A", "B")
        .collect(Collectors.toCollection(ArrayList::new));
```

Đừng chỉ hỏi “list nào nhanh hơn”. Hãy hỏi thêm:

- Caller có được phép sửa kết quả không?
- Có cần defensive boundary không?
- Có cần loại List cụ thể không?
- Kết quả có được trả ra ngoài API không?

### Q17. `Optional.orElse()` và `orElseGet()` khác nhau thế nào?

`orElse()` nhận một value expression được đánh giá trước khi method được gọi:

```java
User user = optional.orElse(createDefaultUser());
```

`createDefaultUser()` có thể chạy dù `optional` đang có value.

`orElseGet()` nhận Supplier và chỉ gọi Supplier khi Optional empty:

```java
User user = optional.orElseGet(this::createDefaultUser);
```

Dùng `orElseGet()` khi fallback tốn chi phí, có side effect hoặc gọi database/API.

`orElseThrow()` phù hợp khi absence là lỗi của contract:

```java
User user = repository.findById(id)
        .orElseThrow(() ->
                new UserNotFoundException(id));
```

Không nên dùng Optional như một field hoặc parameter ở mọi nơi một cách máy móc. Nó đặc biệt hữu ích ở return type biểu diễn khả năng thiếu dữ liệu; API boundary cần tuân theo convention của project.

### Q18. Parallel Stream có luôn nhanh hơn sequential stream không?

Không.

Parallel stream có chi phí:

- Chia nhỏ workload.
- Scheduling và coordination.
- Merge kết quả.
- Thread contention.
- Giữ ordering trong một số terminal operations.
- Tăng áp lực memory.

Có thể cân nhắc parallel stream khi:

- Dữ liệu đủ lớn.
- Tác vụ độc lập và CPU-bound.
- Hàm xử lý không có side effect nguy hiểm.
- Chi phí chia task nhỏ hơn lợi ích parallelism.
- Đã benchmark bằng workload gần production.

Không nên mặc định dùng parallel stream cho blocking I/O trong Backend. Hãy thiết kế rõ executor, timeout, backpressure và giới hạn concurrency.

## 41.5. Nhóm Concurrency và JVM

### Q19. `volatile` và `synchronized` khác nhau thế nào?

`volatile` cung cấp visibility và một số ordering guarantees cho việc đọc/ghi field. Nó không biến compound operation thành atomic:

```java
volatile int count;

count++; // read -> add -> write, vẫn có thể lost update
```

`synchronized` cung cấp mutual exclusion khi các threads dùng cùng monitor, đồng thời tạo happens-before relationship giữa unlock và lock kế tiếp trên monitor đó.

```java
synchronized void increment() {
    count++;
}
```

Chọn `volatile` khi state đơn giản, ví dụ cờ shutdown:

```java
private volatile boolean running = true;

void stop() {
    running = false;
}
```

Chọn lock hoặc atomic primitive khi cần cập nhật phối hợp, invariant hoặc read-modify-write.

### Q20. Race condition là gì?

Race condition xảy ra khi kết quả phụ thuộc vào thứ tự/interleaving của các thao tác concurrent và code không bảo vệ đúng phần state cần bảo vệ.

Ví dụ:

```java
if (balance >= amount) {
    balance -= amount;
}
```

Nếu hai threads cùng kiểm tra `balance` trước khi một thread cập nhật, cả hai có thể cùng được cho phép dù chỉ một giao dịch hợp lệ.

Cách sửa không chỉ là thêm `volatile`. Có thể cần:

- `synchronized`.
- `Lock`.
- Atomic compare-and-set.
- Database conditional update.
- Transaction isolation.
- Distributed coordination nếu nhiều instance.

### Q21. `AtomicInteger` và `LongAdder` khác nhau thế nào?

`AtomicInteger` phù hợp khi cần một giá trị atomic có thể đọc và cập nhật bằng CAS:

```java
AtomicInteger count = new AtomicInteger();

count.incrementAndGet();
int current = count.get();
```

`LongAdder` chia cập nhật qua nhiều cell để giảm contention trong counter có nhiều writers:

```java
LongAdder requests = new LongAdder();

requests.increment();
long total = requests.sum();
```

`LongAdder` phù hợp cho metrics/statistics. `sum()` trong lúc updates còn diễn ra không phải snapshot transaction atomic theo nghĩa mọi update được đóng băng tại một thời điểm duy nhất.

Nếu cần invariant như “chỉ tăng khi giá trị dưới giới hạn”, `LongAdder` không phải lựa chọn thay thế tự động cho lock hoặc atomic state transition.

### Q22. Heap và Stack khác nhau thế nào?

Theo mô hình JVM:

- Mỗi JVM thread có JVM stack và các frames riêng.
- Heap là runtime data area được chia sẻ, dùng cho objects và arrays theo mô hình JVM.
- Frame chứa local variables, operand stack và dữ liệu liên quan đến method execution.
- Reference local có thể nằm trong frame, còn object được mô hình hóa trên heap.

Ví dụ:

```java
static void process() {
    User user = new User("Alice");
}
```

Khi method kết thúc, object không nhất thiết bị thu hồi ngay. Nếu còn reference từ cache, static field, thread hoặc object khác, nó vẫn reachable.

HotSpot JIT có thể tối ưu allocation, giữ value trong register hoặc loại bỏ object allocation qua escape analysis. Vì vậy, không nên mô tả mọi local variable và mọi object như một ô RAM cố định theo sơ đồ đơn giản.

### Q23. Memory leak trong Java xảy ra như thế nào?

GC chỉ thu hồi object không còn reachable từ GC Roots. Nếu object không còn cần nhưng vẫn được giữ bởi static collection, ThreadLocal, listener, cache hoặc task, GC không thể thu hồi.

```java
static final Map<String, byte[]> cache = new HashMap<>();

static void remember(
        String requestId,
        byte[] payload
) {
    cache.put(requestId, payload);
}
```

Nếu `requestId` liên tục khác nhau và không có eviction, memory tăng dần.

Cách điều tra:

1. Xác định heap usage sau full/major collection có giảm hay không.
2. Thu thập heap dump khi an toàn.
3. Tìm dominator tree và retention path.
4. Kiểm tra static fields, caches, ThreadLocal và listeners.
5. Phân biệt leak với workload hợp lệ cần nhiều memory.

Tăng `-Xmx` có thể trì hoãn lỗi nhưng không sửa retention bug.

### Q24. Virtual Threads có thay thế thread pools không?

Virtual threads trong Java 21 phù hợp cho rất nhiều concurrent tasks có thời gian chờ blocking I/O. Chúng giảm chi phí mỗi thread so với platform threads trong nhiều workload, nhưng không làm CPU nhanh hơn và không làm database có thêm connection.

Không nên pool virtual threads để tái sử dụng như cách pool platform threads. Thay vào đó, tạo virtual thread cho task và giới hạn tài nguyên khan hiếm riêng:

- Database connection pool.
- External API concurrency.
- CPU-bound work.
- Memory và queue size.
- Rate limit của downstream.

Virtual threads cũng không loại bỏ timeout, cancellation, backpressure hoặc idempotency. Khi code giữ lock lâu hoặc gọi native/foreign operation không phù hợp, cần hiểu nguy cơ pinning và đo workload thực tế.

### Q25. Khi nào dùng `CompletableFuture`?

`CompletableFuture` phù hợp để biểu diễn và kết hợp asynchronous stages:

```java
CompletableFuture<User> userFuture =
        CompletableFuture.supplyAsync(
                () -> userClient.load(userId),
                executor
        );

CompletableFuture<Profile> profileFuture =
        userFuture.thenCompose(
                user -> profileClient.load(user.id())
        );

CompletableFuture<String> result =
        profileFuture.thenApply(Profile::displayName);
```

Các method thường gặp:

- `thenApply()`: biến đổi kết quả.
- `thenCompose()`: nối async stage trả về một future khác.
- `thenCombine()`: kết hợp hai futures độc lập.
- `allOf()`: chờ nhiều futures.
- `exceptionally()`, `handle()`, `whenComplete()`: xử lý lỗi hoặc completion.
- `orTimeout()`, `completeOnTimeout()`: đặt chính sách timeout ở mức future.

Cần truyền executor phù hợp thay vì để mọi công việc blocking rơi vào common pool. `CompletableFuture` không tự bảo đảm cancellation đã dừng công việc bên ngoài; cần thiết kế cancellation và timeout từ đầu.

## 41.6. Modern Java 21, API và Runtime

### Q26. Record khác class thông thường ở điểm nào?

Record là class được thiết kế để biểu diễn data carrier với components cố định. Java tự cung cấp private final component fields, accessor, canonical constructor, `equals()`, `hashCode()` và `toString()` theo quy tắc record.

```java
public record UserSummary(
        long id,
        String displayName
) {}
```

Record phù hợp với:

- Request/response DTO.
- Value object.
- Event payload.
- Read-only projection.

Record không tự làm object deep immutable:

```java
record Group(List<String> members) {}

List<String> members = new ArrayList<>();
Group group = new Group(members);

members.add("Alice");
// group.members() phản ánh cùng List nếu không defensive copy
```

Có thể dùng `List.copyOf()` trong compact constructor khi cần snapshot cấu trúc list. Record cũng không phù hợp mặc định cho mọi JPA entity vì entity thường cần lifecycle, proxying và identity semantics khác.

### Q27. Sealed class/interface và pattern matching giúp gì?

Sealed type giới hạn direct subtypes được phép. Khi kết hợp với pattern matching for switch, compiler có thể kiểm tra exhaustive handling.

```java
sealed interface PaymentResult
        permits Success, Rejected {}

record Success(String id)
        implements PaymentResult {}

record Rejected(String reason)
        implements PaymentResult {}

static String message(PaymentResult result) {
    return switch (result) {
        case Success success ->
                "Success: " + success.id();
        case Rejected rejected ->
                "Rejected: " + rejected.reason();
    };
}
```

Nếu thêm subtype mới, những switch không còn exhaustive có thể bị compiler phát hiện. Không nên thêm `default` theo thói quen nếu muốn compiler giúp phát hiện domain variant chưa được xử lý.

### Q28. `var` có phải dynamic typing không?

Không. `var` chỉ là local-variable type inference. Compiler vẫn suy luận một kiểu tĩnh:

```java
var age = 21;
age = "Java"; // Compile-time error
```

`var` không dùng được cho field, method return type, parameter hoặc local variable không có initializer.

Nên dùng khi kiểu từ bên phải đã rõ:

```java
var users = new ArrayList<User>();
```

Nếu `var result = service.execute();` làm người đọc khó biết kiểu, khai báo tường minh có thể dễ bảo trì hơn.

### Q29. Vì sao `BigDecimal` phù hợp với tiền tệ hơn `double`?

`double` biểu diễn số thực theo floating-point binary, nên nhiều decimal fraction không thể biểu diễn chính xác tuyệt đối.

```java
System.out.println(0.1 + 0.2);
// Có thể in 0.30000000000000004
```

Với tiền tệ, dùng:

```java
BigDecimal amount = new BigDecimal("0.10");
BigDecimal total = amount.add(
        new BigDecimal("0.20")
);
```

Không nên khởi tạo `BigDecimal` từ `double` nếu cần giá trị decimal đúng theo input. Cần xác định scale, rounding mode, currency minor unit và quy tắc nghiệp vụ.

Ngoài ra, `BigDecimal.equals()` xét cả value và scale, còn `compareTo()` chỉ xét giá trị số:

```java
new BigDecimal("1.0")
        .equals(new BigDecimal("1.00")); // false

new BigDecimal("1.0")
        .compareTo(new BigDecimal("1.00")); // 0
```

### Q30. `Instant`, `LocalDateTime` và `ZonedDateTime` khác nhau thế nào?

- `Instant`: một điểm trên timeline UTC, phù hợp lưu timestamp sự kiện.
- `LocalDateTime`: ngày và giờ không kèm timezone/offset; không đủ để xác định một điểm duy nhất trên timeline.
- `ZonedDateTime`: ngày giờ đi kèm zone rules, hữu ích khi hiển thị hoặc tính theo múi giờ.
- `OffsetDateTime`: ngày giờ đi kèm offset cụ thể.

Trong Backend, có thể lưu event timestamp dưới dạng UTC/Instant, sau đó chuyển sang zone của user ở lớp presentation. Không nên dùng `LocalDateTime` làm timestamp toàn cục nếu hệ thống chạy ở nhiều timezone.

### Q31. Try-with-resources xử lý exception đóng tài nguyên ra sao?

Resource được đóng tự động theo thứ tự ngược với thứ tự khai báo. Nếu body ném exception và `close()` cũng ném exception, lỗi trong `close()` thường được gắn vào lỗi chính dưới dạng suppressed exception.

```java
try (BufferedReader reader =
        Files.newBufferedReader(path)) {
    return reader.readLine();
} catch (IOException e) {
    for (Throwable suppressed : e.getSuppressed()) {
        System.err.println(suppressed);
    }

    throw e;
}
```

Đây là lý do không nên tự viết cleanup thủ công làm mất exception gốc.

### Q32. `Path`/`Files` tốt hơn `File` ở điểm nào?

`java.io.File` là API cũ biểu diễn đường dẫn. `Path` và `Files` trong NIO.2 cung cấp API giàu hơn cho:

- Resolve và normalize path.
- Đọc/ghi với charset rõ ràng.
- Directory traversal.
- File attributes.
- Symbolic link options.
- Copy/move/delete.
- Watch service.
- Channels và file locks.

`Path` chỉ là mô tả đường dẫn; nó không bảo đảm file tồn tại. `normalize()` cũng không tự tạo ra bảo vệ chống path traversal hoặc race condition. Khi xử lý path từ user, cần validate theo root được phép, kiểm tra authorization và thực hiện operation an toàn.

### Q33. Reflection và annotation khác nhau thế nào?

Annotation là metadata gắn vào source/class elements. Reflection là cơ chế runtime đọc metadata và tương tác với class members.

```java
@Retention(RetentionPolicy.RUNTIME)
@Target(ElementType.TYPE)
@interface Auditable {}

@Auditable
class OrderService {}
```

```java
boolean enabled =
        OrderService.class.isAnnotationPresent(
                Auditable.class
        );
```

Annotation tự nó không tạo behavior. Compiler, annotation processor, framework hoặc code Reflection phải đọc và xử lý nó. Reflection cũng bị giới hạn bởi Java Platform Module System, access rules và performance/maintainability trade-offs.

### Q34. HTTP client production cần quan tâm những gì?

Không chỉ cần gọi được endpoint. Một HTTP client thực tế cần:

- Connect timeout.
- Request/response timeout.
- Connection pool policy.
- Retry có giới hạn và backoff.
- Idempotency khi retry mutation.
- Authentication và secret handling.
- Status code mapping.
- Response size limit.
- Circuit breaker hoặc bulkhead.
- Metrics, logs và tracing.
- Cancellation.

Không nên retry mọi lỗi. HTTP 4xx do request sai thường cần sửa input; timeout của payment mutation cần biết operation có thể đã thành công hay chưa trước khi retry.

### Q35. Vì sao phải phân biệt contract và implementation detail?

Các collection contracts như “List giữ encounter order” hoặc “Set không chứa duplicate theo equality/ordering phù hợp” là điều code có thể dựa vào.

Ngược lại, các chi tiết như:

- Bucket `HashMap` treeify ở ngưỡng nào.
- Compiler cụ thể tạo bytecode concatenation ra sao.
- HotSpot đặt object ở vùng bộ nhớ nào sau JIT.
- Một collector chia region nội bộ thế nào.

có thể thay đổi giữa JDK implementations hoặc versions. Khi trả lời phỏng vấn, hãy nói rõ phạm vi:

> Theo Java API contract ...
> Trong OpenJDK/HotSpot thường ...
> Application không nên phụ thuộc trực tiếp vào chi tiết này.

## 41.7. Rapid-fire checklist

Đây là nhóm câu hỏi ngắn nên luyện trả lời trong 30–60 giây:

| Câu hỏi | Điểm cần chạm tới |
| --- | --- |
| Vì sao String immutable? | Pool, hash stability, sharing, security |
| Vì sao key HashMap nên immutable? | Hash bucket và equality không được thay đổi sau khi insert |
| `final` có làm List immutable không? | Không; final chỉ khóa reassignment của reference |
| `throw` và `throws`? | `throw` ném object; `throws` khai báo khả năng truyền ra |
| `ArrayDeque` hay `Stack`? | `ArrayDeque` thường phù hợp hơn legacy `Stack` |
| `HashSet` giữ order không? | Không; dùng `LinkedHashSet` nếu cần encounter order |
| `Optional.empty()` có phải null không? | Không; là một Optional không chứa value |
| `map` hay `flatMap`? | Biến đổi một phần tử hay làm phẳng nested result |
| `volatile` có làm `count++` atomic không? | Không |
| `synchronized` có phân tán giữa instances không? | Không, chỉ trong phạm vi monitor/JVM |
| GC có thu hồi file descriptor không? | Không nên dựa vào GC; phải close resource |
| `record` có deep immutable không? | Không |
| Virtual thread có làm DB pool lớn hơn không? | Không |
| `ConcurrentHashMap` có hỗ trợ null không? | Không |
| Stream có chạy trước terminal operation không? | Intermediate operations lazy |
| `orElseGet` khác `orElse`? | Lazy fallback so với eager argument evaluation |
| `BigDecimal` khởi tạo từ String hay double? | Thường dùng String cho decimal exact |
| `ClassNotFoundException` vs `NoClassDefFoundError`? | Checked dynamic load vs runtime linkage/definition failure |
| `equals()` true thì hash code? | Bắt buộc bằng nhau |
| `List<? extends Number>` thêm Integer được không? | Không an toàn vì unknown subtype |

---

# CHƯƠNG 42. JAVA CODING CHALLENGES

## 42.1. Cách tiếp cận một bài coding

Trước khi viết code, hãy nói rõ:

1. Input và output là gì?
2. Constraint về kích thước, duplicate, null và ordering?
3. Có cần trả một đáp án hay tất cả đáp án?
4. Có được mutate input không?
5. Cần tối ưu time, space hay cả hai?
6. Có vấn đề overflow, Unicode hoặc concurrency không?

Một quy trình tốt:

- Viết brute-force đơn giản để xác nhận hiểu đề.
- Tìm phần tính toán lặp lại.
- Chọn cấu trúc dữ liệu phù hợp.
- Viết invariant của thuật toán.
- Kiểm tra edge cases.
- Phân tích time/space complexity.
- Nêu trade-off của phương án khác.

Độ phức tạp Big-O không phải lời trang trí. Nó giúp giải thích tại sao một solution còn phù hợp khi số lượng request hoặc dữ liệu tăng lên.

## 42.2. Bài 1 — First Non-Repeating Character

Đề bài: Cho một chuỗi, tìm ký tự đầu tiên chỉ xuất hiện một lần.

Input:

```text
swiss
```

Output:

```text
w
```

### Cách giải bằng `LinkedHashMap`

```java
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;

public class CharacterProblems {

    static Optional<Character> firstUnique(String input) {
        if (input == null || input.isEmpty()) {
            return Optional.empty();
        }

        Map<Character, Integer> frequency =
                new LinkedHashMap<>();

        for (char ch : input.toCharArray()) {
            frequency.merge(ch, 1, Integer::sum);
        }

        for (var entry : frequency.entrySet()) {
            if (entry.getValue() == 1) {
                return Optional.of(entry.getKey());
            }
        }

        return Optional.empty();
    }
}
```

### Tại sao dùng `LinkedHashMap`?

- `HashMap` đếm frequency tốt nhưng không bảo đảm thứ tự duyệt.
- `LinkedHashMap` giữ encounter order của các key lần đầu xuất hiện.
- Sau khi đếm, entry đầu tiên có count bằng một là đáp án.

### Complexity

- Time: O(n) expected.
- Space: O(k), với `k` là số ký tự khác nhau.

### Bẫy Unicode

`char` là UTF-16 code unit, không luôn là một Unicode code point. Nếu đề bài yêu cầu xử lý code point:

```java
Map<Integer, Integer> frequency =
        new LinkedHashMap<>();

input.codePoints().forEach(
        codePoint ->
                frequency.merge(
                        codePoint, 1, Integer::sum
                )
);
```

Grapheme cluster như một emoji kết hợp nhiều code point còn phức tạp hơn nữa. Hãy hỏi rõ “character” trong constraint.

## 42.3. Bài 2 — Two Sum

Đề bài: Cho mảng số nguyên và target, tìm hai indices khác nhau có tổng bằng target.

```text
nums = [2, 7, 11, 15]
target = 9
output = [0, 1]
```

### Cách giải O(n) expected

```java
import java.util.HashMap;
import java.util.Map;

static int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];

        if (seen.containsKey(complement)) {
            return new int[]{
                    seen.get(complement),
                    i
            };
        }

        seen.putIfAbsent(nums[i], i);
    }

    return new int[0];
}
```

### Invariant

Trước khi xử lý index `i`, `seen` chứa những giá trị ở các index nhỏ hơn `i`. Vì kiểm tra complement trước khi thêm phần tử hiện tại, cùng một index không bị dùng hai lần.

### Complexity

- Time: O(n) expected.
- Space: O(n).

### Bẫy overflow

Nếu input có thể sát `Integer.MIN_VALUE` hoặc `Integer.MAX_VALUE`, phép `target - nums[i]` có thể overflow. Có thể dùng `long` trong phép tính và thiết kế key phù hợp với constraint.

## 42.4. Bài 3 — Group Anagrams

Đề bài: Nhóm các chuỗi là anagram của nhau.

Input:

```text
["eat", "tea", "tan", "ate", "nat", "bat"]
```

### Cách giải bằng sorted-character key

```java
import java.util.ArrayList;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

static List<List<String>> groupAnagrams(
        List<String> words) {

    Map<String, List<String>> groups =
            new HashMap<>();

    for (String word : words) {
        char[] chars = word.toCharArray();
        Arrays.sort(chars);

        String key = new String(chars);

        groups.computeIfAbsent(
                key,
                ignored -> new ArrayList<>()
        ).add(word);
    }

    return new ArrayList<>(groups.values());
}
```

`eat`, `tea` và `ate` đều tạo key `aet`.

### Complexity

Với `n` chuỗi và độ dài tối đa `k`:

- Sort từng chuỗi: O(k log k).
- Tổng thời gian: O(n × k log k).
- Space: phụ thuộc tổng độ dài key và group.

Nếu alphabet bị giới hạn, có thể dùng frequency signature để giảm chi phí sort. Nếu cần thứ tự group ổn định, dùng `LinkedHashMap`.

`char[]` cũng mang nghĩa UTF-16 code units. Nếu anagram phải hiểu theo Unicode code points, cần thiết kế key theo code point.

## 42.5. Bài 4 — LRU Cache

Đề bài: Xây dựng cache có capacity giới hạn. Khi đầy, loại bỏ entry ít được truy cập gần đây nhất.

### Giải pháp dựa trên `LinkedHashMap`

```java
import java.util.LinkedHashMap;
import java.util.Map;

public class LruCache<K, V> {

    private final Map<K, V> cache;

    public LruCache(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException(
                    "Capacity must be positive"
            );
        }

        cache = new LinkedHashMap<>(
                16,
                0.75f,
                true
        ) {
            @Override
            protected boolean removeEldestEntry(
                    Map.Entry<K, V> eldest) {
                return size() > capacity;
            }
        };
    }

    public synchronized V get(K key) {
        return cache.get(key);
    }

    public synchronized void put(K key, V value) {
        cache.put(key, value);
    }

    public synchronized int size() {
        return cache.size();
    }
}
```

`accessOrder = true` làm cho access cập nhật thứ tự. Vì thế `get()` cũng có thể mutate cấu trúc và không nên coi là read-only khi nhiều threads truy cập.

Đây là implementation phục vụ học tập. Production cache thường cần thêm:

- TTL và eviction policy.
- Giới hạn memory chứ không chỉ số entry.
- Metrics hit/miss.
- Stampede protection.
- Serialization và consistency policy.
- Concurrency strategy đã được kiểm thử.

### Complexity

`get()` và `put()` có expected O(1) trong điều kiện hash operation thông thường.

## 42.6. Bài 5 — Top K Frequent Elements

Đề bài: Tìm `k` số xuất hiện nhiều nhất.

```text
numbers = [1, 1, 1, 2, 2, 3]
k = 2
output = [1, 2]
```

### HashMap + min-heap

```java
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.PriorityQueue;

static List<Integer> topK(int[] numbers, int k) {
    if (k < 0) {
        throw new IllegalArgumentException(
                "k must not be negative"
        );
    }

    Map<Integer, Integer> frequency =
            new HashMap<>();

    for (int number : numbers) {
        frequency.merge(number, 1, Integer::sum);
    }

    PriorityQueue<Integer> heap =
            new PriorityQueue<>(
                    Comparator
                            .comparingInt(
                                    frequency::get
                            )
                            .thenComparingInt(
                                    Integer::intValue
                            )
            );

    for (int number : frequency.keySet()) {
        heap.offer(number);

        if (heap.size() > k) {
            heap.poll();
        }
    }

    List<Integer> result = new ArrayList<>(heap);

    result.sort(
            Comparator
                    .comparingInt(
                            (Integer n) -> frequency.get(n)
                    )
                    .reversed()
                    .thenComparingInt(
                            Integer::intValue
                    )
    );

    return result;
}
```

Gọi `u` là số giá trị khác nhau:

- Count frequency: O(n) expected.
- Heap: O(u log k) khi giữ tối đa `k` phần tử.
- Sort result: O(k log k).
- Space: O(u + k).

Nếu đề bài cho phép tie bất kỳ, comparator đơn giản hơn. Nếu cần kết quả deterministic, phải mô tả tie-break rule.

## 42.7. Bài 6 — Producer-Consumer

Yêu cầu: Producer tạo công việc, consumer xử lý công việc, queue có giới hạn.

### Dùng `BlockingQueue`

```java
import java.util.concurrent.ArrayBlockingQueue;
import java.util.concurrent.BlockingQueue;

public class ProducerConsumerExample {

    private static final int POISON_PILL = -1;

    public static void main(String[] args)
            throws InterruptedException {

        BlockingQueue<Integer> queue =
                new ArrayBlockingQueue<>(10);

        Thread producer = new Thread(() -> {
            try {
                for (int i = 1; i <= 100; i++) {
                    queue.put(i);
                }

                queue.put(POISON_PILL);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        Thread consumer = new Thread(() -> {
            try {
                while (true) {
                    int item = queue.take();

                    if (item == POISON_PILL) {
                        break;
                    }

                    System.out.println(
                            "Processed: " + item
                    );
                }
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
        });

        producer.start();
        consumer.start();

        producer.join();
        consumer.join();
    }
}
```

`put()` chờ khi queue đầy, `take()` chờ khi queue rỗng, nhờ đó tránh busy waiting.

Poison pill phải thiết kế theo số consumer. Nếu có ba consumers, thường cần ba tín hiệu hoặc một shutdown protocol khác. Với production worker system, cần tính thêm cancellation, retry, dead-letter, graceful shutdown và backpressure.

## 42.8. Bài 7 — Thread-Safe Counter

### `synchronized`

```java
class SynchronizedCounter {

    private int count;

    synchronized void increment() {
        count++;
    }

    synchronized int get() {
        return count;
    }
}
```

### `AtomicInteger`

```java
class AtomicCounter {

    private final AtomicInteger count =
            new AtomicInteger();

    void increment() {
        count.incrementAndGet();
    }

    int get() {
        return count.get();
    }
}
```

### `LongAdder`

```java
class MetricCounter {

    private final LongAdder count =
            new LongAdder();

    void increment() {
        count.increment();
    }

    long get() {
        return count.sum();
    }
}
```

### Cách chọn

- `synchronized`: cần bảo vệ nhiều fields hoặc invariant.
- `AtomicInteger`: một state transition atomic đơn giản.
- `LongAdder`: counter metrics có contention cao, không cần snapshot transaction tuyệt đối.

Không phải mọi bài concurrency đều giải bằng atomic primitive. Nếu cần “trừ stock khi còn đủ”, cần operation atomic ở đúng nơi state được quản lý, thường là database hoặc lock/transaction phù hợp.

## 42.9. Bài 8 — Refactor một `OrderService` lỗi

Đoạn code:

```java
class OrderService {

    private List<Order> orders = new ArrayList<>();

    public void save(Order order) {
        orders.add(order);
    }

    public Order get(int index) {
        return orders.get(index);
    }
}
```

Nếu class được sử dụng như singleton service trong Backend, cần nêu nhiều lớp vấn đề:

- `ArrayList` không bảo vệ concurrent access.
- Dữ liệu mất khi process restart.
- Memory tăng không giới hạn.
- Index không phải identity nghiệp vụ ổn định.
- Không có validation hoặc authorization.
- Không có transaction semantics.
- Không có uniqueness hoặc idempotency.
- Không có pagination.
- Không biết object nào được phép sửa sau khi lưu.
- Không có observability và error contract.

Thay `ArrayList` bằng `CopyOnWriteArrayList` chỉ giải quyết một số tình huống read-heavy trong memory; nó không biến service thành persistence layer và không giải quyết transaction.

Một hướng thiết kế tốt hơn:

```java
interface OrderRepository {
    Order save(Order order);
    Optional<Order> findById(long id);
}
```

```java
final class OrderService {

    private final OrderRepository repository;

    OrderService(OrderRepository repository) {
        this.repository = repository;
    }

    Order create(CreateOrderCommand command) {
        validate(command);

        Order order = Order.create(command);
        return repository.save(order);
    }

    private void validate(CreateOrderCommand command) {
        // Validate business preconditions
    }
}
```

Trong ứng dụng thật, persistence, transaction, authorization và concurrency policy phải được thiết kế theo domain/database thay vì che bằng một collection trong service.

## 42.10. Bài 9 — Merge Intervals

Đề bài: Cho các khoảng `[start, end]`, gộp những khoảng giao nhau.

```text
[[1, 3], [2, 6], [8, 10], [9, 12]]
→ [[1, 6], [8, 12]]
```

Ý tưởng:

1. Sort theo `start`.
2. Giữ interval đang mở rộng.
3. Nếu interval tiếp theo bắt đầu không lớn hơn `currentEnd`, cập nhật `currentEnd`.
4. Nếu không giao, đưa interval hiện tại vào kết quả và bắt đầu interval mới.

Complexity:

- Sort: O(n log n).
- Merge: O(n).
- Tổng: O(n log n).
- Space: O(n) cho result.

Bẫy là xác định inclusive/exclusive endpoint. Nếu `[1, 3]` và `[3, 5]` được xem là giao nhau hay liền kề phải dựa vào đề bài.

## 42.11. Bài 10 — Stable Pagination

Đề bài Backend: trả danh sách orders theo trang, sắp xếp theo `createdAt` giảm dần.

Không nên chỉ viết:

```sql
ORDER BY created_at DESC
```

Nếu nhiều rows có cùng timestamp, thứ tự giữa chúng có thể không ổn định. Khi người dùng request page tiếp theo, một order có thể bị lặp hoặc bỏ qua.

Nên thêm tie-breaker unique:

```sql
ORDER BY created_at DESC, id DESC
```

Với dữ liệu lớn, keyset pagination thường ổn định và hiệu quả hơn offset pagination:

```sql
WHERE (created_at, id) < (?, ?)
ORDER BY created_at DESC, id DESC
LIMIT ?
```

Cần điều chỉnh cú pháp theo database. Phỏng vấn không chỉ đánh giá code Java; họ muốn biết bạn hiểu behavior của API khi dữ liệu thay đổi giữa các request.

## 42.12. Bài tập tự luyện

| Bài tập | Kiến thức cần dùng |
| --- | --- |
| Valid Parentheses | `Deque`, stack invariant |
| LRU Cache có TTL | Map, time source, eviction |
| K-way Merge | `PriorityQueue`, complexity |
| Rate Limiter đơn giản | Time window, concurrency |
| Debounce task | Scheduled executor, cancellation |
| Batch grouping | Map, stable order, memory limit |
| Safe file copy | NIO, chunking, resource lifecycle |
| Retry utility | exception classification, backoff, interruption |
| Producer có nhiều consumer | `BlockingQueue`, shutdown protocol |
| Concurrent word counter | `ConcurrentHashMap.merge`, contention |
| Log parser | streaming I/O, malformed input policy |
| Top K endpoint | heap, pagination, deterministic tie-break |

Khi luyện, hãy viết thêm test cho:

- Empty input.
- Null input nếu contract cho phép.
- Một phần tử.
- Duplicate.
- Giá trị âm.
- Integer overflow.
- Input rất lớn.
- Unicode.
- Concurrent invocation.
- Timeout hoặc interruption.


---

# CHƯƠNG 43. BACKEND PRACTICAL SCENARIOS

Các câu hỏi tình huống thường không có một đáp án duy nhất. Người phỏng vấn muốn biết bạn có thể:

- Xác định failure mode thật sự.
- Phân biệt lỗi trong JVM với lỗi ở database hoặc distributed system.
- Nêu giả định và constraint.
- Chọn nơi phù hợp để bảo vệ invariant.
- Nói về observability và cách kiểm chứng giải pháp.

Một câu trả lời tốt nên đi theo thứ tự:

1. Mô tả vấn đề và tác động.
2. Giải thích vì sao cách làm hiện tại không đủ.
3. Đưa ra giải pháp chính.
4. Nêu trade-off, edge cases và cách đo.

## 43.1. Hai requests cùng mua sản phẩm cuối cùng

Database có một product với stock bằng 1. Hai requests đến gần như đồng thời:

1. Request A đọc stock = 1.
2. Request B đọc stock = 1.
3. A xác nhận order.
4. B cũng xác nhận order.
5. Cả hai cùng trừ stock.

### Vấn đề

Đây là lost update hoặc overselling. Code Java có thể hoàn toàn “đúng” khi chạy một request, nhưng invariant của hệ thống bị phá vỡ khi nhiều transactions interleave.

### Vì sao chỉ dùng synchronized chưa đủ?

Nếu ứng dụng chạy nhiều instances:

- Mỗi instance có một JVM riêng.
- Mỗi JVM có monitor riêng.
- synchronized trên instance hoặc class ở instance A không khóa instance B.
- Database vẫn là nơi chứa state dùng chung.

Ngay cả một instance, synchronized cũng không thay thế transaction và constraint ở database nếu còn nhiều đường ghi khác.

### Atomic conditional update

Một hướng thường dùng là để database kiểm tra và cập nhật trong một operation:

```sql
UPDATE product
SET stock = stock - 1
WHERE id = ?
  AND stock > 0
```

Sau đó kiểm tra affected row count:

- 1: reservation thành công.
- 0: product không tồn tại hoặc đã hết stock, cần phân biệt bằng query/contract phù hợp.

Đây là ví dụ quan trọng: invariant “không giảm stock dưới 0” được bảo vệ ngay tại nơi state được cập nhật.

### Optimistic locking

Thêm version:

```text
id | stock | version
42 |   1   |   7
```

Update chỉ thành công nếu version vẫn là 7:

```sql
UPDATE product
SET stock = ?, version = version + 1
WHERE id = ?
  AND version = ?
```

Nếu affected row count bằng 0, transaction khác đã thay đổi row. Service cần retry có giới hạn hoặc trả conflict/out-of-stock theo nghiệp vụ.

### Pessimistic locking

Transaction có thể lock row khi đọc, tùy database và transaction isolation:

```sql
SELECT id, stock
FROM product
WHERE id = ?
FOR UPDATE
```

Cách này có thể dễ hiểu hơn nhưng làm tăng lock contention, giảm throughput và cần tránh transaction giữ lock quá lâu.

### Câu trả lời Junior+ mẫu

> Em sẽ không chỉ dùng synchronized, vì nó chỉ có phạm vi một JVM. Em sẽ bảo vệ invariant tại database transaction boundary, chẳng hạn atomic conditional update hoặc optimistic/pessimistic locking. Em cũng kiểm tra unique constraints, timeout, retry policy và response khi hai requests cùng tranh chấp. Nếu order và stock nằm trong cùng consistency boundary, em giữ thao tác cần thiết trong transaction ngắn; nếu có external payment, em không giữ database lock trong toàn bộ cuộc gọi payment.

## 43.2. API tạo order bị gọi hai lần

Client gửi request tạo order. Server xử lý chậm, client timeout và retry. Hai requests có cùng nội dung.

### Vấn đề

Nếu chỉ insert mỗi request:

```java
Order order = orderService.create(command);
```

có thể tạo hai orders hoặc charge payment hai lần.

### Idempotency là gì?

Một operation idempotent có contract rằng việc áp dụng lại cùng request identity không tạo thêm hiệu ứng ngoài lần xử lý đầu tiên.

Trong API mutation, thường dùng Idempotency-Key do client gửi:

```text
POST /orders
Idempotency-Key: checkout-8f2...
```

Backend cần:

1. Xác định owner/user của key.
2. Validate key format và request fingerprint.
3. Tìm record key đã xử lý.
4. Nếu đã hoàn thành, trả lại response đã lưu.
5. Nếu đang xử lý, áp dụng policy chờ, conflict hoặc retry.
6. Nếu chưa có, reserve key atomically rồi xử lý.
7. Lưu status và response theo cách nhất quán.

### Vì sao check-then-insert không đủ?

Đoạn logic sau có race condition:

```java
if (!idempotencyRepository.exists(key)) {
    idempotencyRepository.save(key);
    createOrder();
}
```

Hai transactions có thể cùng thấy key chưa tồn tại. Cần unique constraint:

```sql
CREATE UNIQUE INDEX ux_idempotency_owner_key
ON idempotency_records(owner_id, idempotency_key)
```

Khi insert bị duplicate, code đọc record hiện có thay vì tạo operation thứ hai.

### Những điều cần quyết định

- Key có scope theo user, merchant hay toàn hệ thống?
- Key hết hạn sau bao lâu?
- Nếu cùng key nhưng payload khác, trả lỗi nào?
- Nếu process chết sau khi charge nhưng trước khi lưu response thì reconcile thế nào?
- Payment provider có idempotency contract riêng không?
- Response lỗi transient có được lưu để trả lại hay cho phép retry?

Idempotency không chỉ là thêm một column. Nó là một protocol giữa client, API, database và downstream.

## 43.3. External API chậm làm server quá tải

Một service gọi payment hoặc shipping API. Downstream có lúc phản hồi trong 100 ms, có lúc mất 20 giây.

### Failure chain

1. Request web giữ resource trong lúc chờ downstream.
2. Nhiều requests đồng thời làm connection/thread/task tăng.
3. Downstream tiếp tục chậm, queue nội bộ đầy.
4. Client timeout và retry.
5. Retry làm tải tăng thêm.
6. Hệ thống có thể rơi vào cascading failure.

### Biện pháp

#### Timeout

Luôn đặt timeout phù hợp cho connect và request/response. Không để một operation chờ vô hạn.

Timeout phải phù hợp với overall request deadline. Nếu client còn 200 ms mà service bắt đầu một downstream call timeout 5 giây, policy đó không hợp lý.

#### Retry có giới hạn

Retry cần:

- Phân loại lỗi.
- Exponential backoff.
- Jitter để tránh thundering herd.
- Số lần tối đa.
- Tổng deadline.
- Idempotency với mutation.

Không retry mù quáng HTTP 400. Với HTTP 429, tôn trọng rate limit/Retry-After khi contract cho phép. Với timeout của payment POST, cần xác định operation có thể đã thành công trước khi retry.

#### Circuit breaker

Khi downstream liên tục fail, circuit có thể mở để fail fast thay vì tiếp tục gửi request chắc chắn thất bại. Sau một thời gian, half-open probes kiểm tra khả năng phục hồi.

#### Bulkhead và concurrency limit

Giới hạn số requests đồng thời tới từng downstream để một dependency không chiếm toàn bộ tài nguyên service.

#### Fallback

Chỉ dùng khi nghiệp vụ cho phép. Fallback không được biến “payment chưa xác nhận” thành “payment thành công”.

#### Metrics và tracing

Theo dõi:

- Request count.
- Error rate theo status/cause.
- Timeout count.
- Retry count.
- Downstream latency p50/p95/p99.
- In-flight requests.
- Connection pool saturation.
- Circuit state.

### Virtual threads có giải quyết hết không?

Không. Virtual threads có thể giúp giảm chi phí giữ nhiều tasks đang chờ blocking I/O, nhưng:

- Downstream vẫn chậm.
- Database pool không tự tăng.
- Rate limit không biến mất.
- Memory cho các tasks vẫn tồn tại.
- Retry storm vẫn có thể làm hệ thống quá tải.

Virtual threads là execution model, không phải resilience policy.

## 43.4. Memory tăng liên tục sau mỗi request

Service có đoạn:

```java
private static final Map<String, byte[]> CACHE =
        new HashMap<>();
```

Mỗi request thêm một payload với key khác nhau.

### Có ba nhóm nguy cơ

#### Retention

Map static giữ tất cả payload từ khi process khởi động. Objects vẫn reachable nên GC không thể thu hồi.

#### Concurrency

Nếu nhiều request cùng mutate HashMap, cấu trúc không được bảo vệ.

#### Cache semantics

Không có:

- Maximum size.
- TTL.
- Eviction.
- Invalidation.
- Serialization policy.
- Hit/miss metrics.
- Giới hạn kích thước value.

### Vì sao đổi sang ConcurrentHashMap chưa đủ?

ConcurrentHashMap chỉ giải quyết một phần concurrent access. Nó không:

- Giới hạn memory.
- Xóa dữ liệu cũ.
- Ngăn dữ liệu stale.
- Đồng bộ cache giữa nhiều instances.
- Đảm bảo consistency với database.
- Xử lý cache stampede.

Giải pháp cần phù hợp mục đích:

- Cache có maximum size và expiration.
- Caching library hoặc external cache có policy rõ ràng.
- Invalidation khi dữ liệu thay đổi.
- Key normalization và giới hạn input.
- Metrics và alert theo cache size/hit rate.
- Heap dump để xác nhận retention path.

### Cách trình bày khi debug

Không nói ngay “GC bị lỗi”. Hãy phân biệt:

- Allocated memory: tổng số byte đã cấp phát theo thời gian.
- Live/retained memory: object còn reachable sau GC.
- Native memory: metaspace, thread stacks, direct buffers.
- External resources: connection/file descriptors.

Nếu live set tăng sau nhiều chu kỳ GC dưới workload tương tự, nghi ngờ retention leak. Nếu live set ổn định nhưng allocation rate cao, có thể là allocation pressure chứ không phải leak.

## 43.5. N+1 Query trong JPA

Giả sử endpoint trả danh sách orders và mỗi order cần customer name:

```java
List<Order> orders = orderRepository.findRecent();

return orders.stream()
        .map(order -> new OrderDto(
                order.getId(),
                order.getCustomer().getName()
        ))
        .toList();
```

Query đầu tiên lấy orders. Khi gọi getCustomer() cho từng order, ORM có thể phát sinh thêm một query cho mỗi row.

Với 1 query orders và 100 queries customer, tổng cộng là 101 queries.

Nếu mỗi order còn lazy-load items, số query có thể tăng hơn nữa.

### Vì sao N+1 nguy hiểm?

- Tăng network round trips tới database.
- Tăng latency theo số rows.
- Tăng connection/CPU load.
- Có thể chỉ xuất hiện khi response nhiều dữ liệu.
- Unit test mock repository thường không phát hiện.
- Dễ bị che bởi dữ liệu local nhỏ.

### Các hướng giải quyết

#### DTO projection

Chỉ query columns cần trả:

```sql
SELECT o.id, c.name, o.total, o.created_at
FROM orders o
JOIN customers c ON c.id = o.customer_id
WHERE o.status = ?
ORDER BY o.created_at DESC
```

Ưu điểm là rõ data shape và giảm object graph không cần thiết.

#### Fetch join hoặc EntityGraph

Tải relation cần thiết trong một query theo use case. Phải kiểm tra duplicate rows, cardinality và behavior của ORM.

#### Batch fetching

Cho ORM gom nhiều foreign keys thành một số query theo batch thay vì một query mỗi entity. Đây là trade-off giữa số query và kích thước result.

#### Hai bước khi cần pagination

Fetch join collection cùng pagination có thể gây duplicate, memory pagination hoặc kết quả không như mong muốn tùy ORM/database.

Một pattern thường gặp:

1. Lấy page IDs theo order ổn định.
2. Fetch dữ liệu chi tiết cho các IDs đó.
3. Khôi phục thứ tự page ở application nếu query thứ hai không bảo đảm order.

#### Kiểm tra query thật

- Bật SQL logging ở môi trường phù hợp.
- Dùng datasource metrics.
- Kiểm tra query count trong integration test.
- Dùng database execution plan cho query nặng.
- Đo p95/p99 chứ không chỉ average.

### Câu trả lời phỏng vấn mẫu

> Em xác định N+1 bằng query log hoặc query-count test, không chỉ nhìn code. Sau đó chọn projection, fetch plan hoặc batch fetching theo shape của endpoint. Nếu có pagination và collection, em tránh fetch join mù quáng; có thể page IDs trước rồi fetch detail. Em cũng kiểm tra index, execution plan và kích thước response.


## 43.6. Transaction boundary và rollback

Một service tạo order, trừ stock và gửi email. Câu hỏi: transaction nên đặt ở đâu?

### Boundary phù hợp

Application service/use case thường là nơi điều phối các thay đổi database thuộc cùng consistency boundary:

```text
validate request
  -> reserve stock
  -> create order
  -> persist outbox event
commit transaction
  -> worker gửi email/payment event
```

Không nên giữ database transaction mở trong lúc gọi external API chậm nếu không cần thiết. Database lock lâu làm giảm throughput và tăng deadlock/timeout.

### Rollback không hoàn tác side effect bên ngoài

Nếu transaction database rollback sau khi đã gửi email hoặc charge payment, database không thể tự undo side effect đó.

Các chiến lược:

- Outbox pattern.
- Transactional event record.
- Retry worker.
- Idempotent consumer.
- Compensation/Saga cho workflow nhiều hệ thống.
- Reconciliation job.

### Proxy và self-invocation

Trong một số framework proxy-based, annotation transaction được áp dụng khi lời gọi đi qua proxy. Method trong cùng object gọi trực tiếp method khác có thể không đi qua proxy, nên không nên giả định mọi annotation đều hoạt động bất kể call path.

Khi trả lời, nên nói:

> Chi tiết phụ thuộc framework và configuration; em sẽ kiểm tra proxy boundary, transaction logs và integration test thay vì chỉ nhìn annotation.

### Checked exception và rollback

Chính sách rollback phụ thuộc framework. Không nên khẳng định mọi exception đều rollback hoặc mọi checked exception đều không rollback. Cần biết default của framework, cấu hình rollback rule và exception được ném ra khỏi boundary nào.

## 43.7. Unique constraint và race condition khi đăng ký

Hai requests cùng đăng ký email:

```java
if (userRepository.findByEmail(email).isEmpty()) {
    userRepository.save(new User(email));
}
```

Check-then-insert có thể race. Cả hai request đều thấy email chưa tồn tại.

### Cách đúng

1. Chuẩn hóa email theo domain rule.
2. Tạo unique constraint ở database.
3. Có thể check trước để tạo UX tốt.
4. Vẫn bắt duplicate violation khi insert.
5. Chuyển thành domain error như “email đã được sử dụng”.
6. Xác định behavior khi transaction retry.

Database constraint là lớp bảo vệ cuối cùng cho uniqueness. Application-level check chỉ là optimization hoặc thông báo sớm, không phải guarantee duy nhất.

## 43.8. Upload file và path traversal

Endpoint nhận filename từ user:

```java
Path path = uploadRoot.resolve(fileName);
Files.copy(inputStream, path);
```

Đoạn code có thể bị lợi dụng với path như ../../secret.txt.

### Các lớp bảo vệ

- Không dùng filename user làm path lưu trữ trực tiếp.
- Sinh storage key ngẫu nhiên.
- Giới hạn kích thước request và stream theo chunk.
- Kiểm tra authorization.
- Xác định content type bằng nội dung khi cần, không tin hoàn toàn extension/header.
- Lưu ngoài web root nếu file không public.
- Resolve rồi kiểm tra path vẫn nằm trong permitted root; hiểu rằng normalize không tự xử lý mọi race/symlink attack.
- Quét malware theo yêu cầu nghiệp vụ.
- Không ghi đè file ngoài ý muốn.
- Đặt retention/cleanup policy.
- Không đọc toàn bộ file lớn vào heap.

Một response tốt cần nói cả security, resource lifecycle và operational limit; chỉ gọi Path.normalize() là chưa đủ.

## 43.9. Thiết kế API error response

Không nên trả stack trace raw cho client:

```json
{
  "error": "java.sql.SQLException: password ..."
}
```

Một error contract thường có:

```json
{
  "code": "ORDER_NOT_FOUND",
  "message": "Order was not found",
  "requestId": "req-123",
  "details": []
}
```

### Phân biệt status

- 400: request syntax/validation không hợp lệ.
- 401: chưa xác thực.
- 403: đã xác thực nhưng không có quyền.
- 404: resource không tồn tại hoặc policy không tiết lộ existence.
- 409: conflict, duplicate hoặc state transition conflict.
- 422: semantic validation theo convention của API.
- 429: rate limit.
- 5xx: lỗi server/downstream chưa thể xử lý.

Không phải mọi exception đều map thẳng một status giống nhau. Global handler cần:

- Log server-side với context phù hợp.
- Không lộ secret/stack trace.
- Giữ correlation/request ID.
- Phân biệt lỗi client và lỗi server.
- Giữ contract ổn định cho frontend/client.
- Có test cho error mapping.

## 43.10. Offset pagination và keyset pagination

Offset pagination đơn giản:

```sql
ORDER BY created_at DESC, id DESC
LIMIT ? OFFSET ?
```

Nhưng offset lớn có thể khiến database scan/skip nhiều rows. Dữ liệu chèn/xóa giữa các page cũng có thể làm duplicate hoặc missing rows.

Keyset pagination dùng cursor của row cuối:

```sql
WHERE (created_at, id) < (?, ?)
ORDER BY created_at DESC, id DESC
LIMIT ?
```

### Quyết định

| Trường hợp | Lựa chọn thường phù hợp |
| --- | --- |
| Admin page nhỏ, cần nhảy tới page | Offset |
| Feed lớn, đọc tuần tự | Keyset/cursor |
| Dữ liệu thay đổi liên tục | Keyset với stable ordering |
| Cần tổng số chính xác | Count riêng, cân nhắc chi phí |
| Sort theo field không unique | Thêm tie-breaker unique |

API cần giới hạn page size, validate sort field bằng allow-list và không nhận raw SQL order từ client.

## 43.11. Eventual consistency và Outbox

Service cập nhật database rồi publish message. Nếu database commit thành công nhưng publish thất bại, hệ thống có order nhưng consumer không biết.

Nếu publish trước rồi database rollback, consumer có thể nhận event cho order không tồn tại.

### Outbox pattern

Trong cùng database transaction:

1. Ghi business state.
2. Ghi một outbox event.
3. Commit.
4. Worker đọc outbox và publish.
5. Đánh dấu published hoặc retry.

Consumer phải idempotent vì message có thể được gửi lại. Outbox giảm khoảng trống giữa database commit và message publish nhưng vẫn cần xử lý duplicate, poison message và ordering.

### Câu trả lời phỏng vấn

> Em không hứa exactly-once end-to-end nếu infrastructure không cung cấp guarantee đó. Em thiết kế at-least-once với outbox, idempotent consumer, event ID và retry/dead-letter. Em xác định rõ business operation nào cần synchronous consistency và operation nào chấp nhận eventual consistency.

## 43.12. Debug API latency tăng đột biến

Không nên bắt đầu bằng việc tăng thread pool. Hãy chia latency thành các đoạn:

```text
total request
├── queue wait
├── controller/service
├── database
├── external HTTP
├── serialization
└── response write
```

### Quy trình

1. Kiểm tra p50/p95/p99 theo endpoint.
2. So sánh error rate, throughput và saturation.
3. Dùng request/trace ID nối log giữa services.
4. Kiểm tra DB slow query, pool wait và lock.
5. Kiểm tra external dependency latency/timeouts.
6. Kiểm tra thread dump nếu nghi thread starvation.
7. Kiểm tra GC pauses và allocation nếu latency trùng GC.
8. Kiểm tra response size và serialization.
9. So sánh deploy/config change gần nhất.
10. Reproduce bằng workload có kiểm soát.

### Câu trả lời tốt

> Em cần metric để phân biệt CPU saturation, queueing, DB pool exhaustion, downstream timeout, GC pause và lock contention. Sau khi có bằng chứng, em mới chọn fix. Tăng pool có thể làm throughput tốt hơn hoặc làm hệ thống quá tải nhanh hơn nếu bottleneck nằm ở database.

## 43.13. Retry và interruption

Một retry loop không nên nuốt interruption:

```java
try {
    Thread.sleep(delay);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    throw new CancellationException(
            "Retry interrupted"
    );
}
```

Với thread task, interruption là tín hiệu hợp tác để dừng. Không nên catch InterruptedException rồi tiếp tục vòng lặp như không có gì xảy ra.

Retry utility cần biết:

- Exception nào retryable?
- Có retry sau partial success không?
- Backoff và jitter thế nào?
- Deadline tổng là bao nhiêu?
- Có idempotency không?
- Khi shutdown, task có dừng nhanh không?

## 43.14. Security và secret handling

Trong phỏng vấn Backend, một câu trả lời có chất lượng nên tránh các đề xuất nguy hiểm:

- Không log password, token, private key hoặc card data.
- Không commit secret vào source.
- Không tự hash password bằng SHA-256 thay cho password hashing algorithm phù hợp.
- Không deserialize dữ liệu untrusted bằng cơ chế nguy hiểm.
- Không tạo SQL bằng string concatenation.
- Không tin filename, content type hoặc user role từ client.
- Không trả exception message chứa connection string hoặc credentials.
- Không dùng Random cho token security-sensitive nếu cần SecureRandom.
- Không tắt TLS certificate verification để “sửa nhanh”.

Khi không chắc về một security detail, hãy nói rõ cần xem contract, threat model và security policy thay vì khẳng định tùy tiện.

## 43.15. Khung trả lời mọi Backend scenario

Dùng mẫu sau để không bỏ sót phần quan trọng:

### Problem

Vấn đề cụ thể là gì? Invariant nào có nguy cơ bị phá?

### Scope

Một JVM hay nhiều instances? Sync hay async? Có database/external system không? Workload và latency target là gì?

### Root cause

Race condition, stale data, timeout, missing constraint, unbounded retention hay sai transaction boundary?

### Primary solution

Chọn một giải pháp chính và chỉ rõ nó bảo vệ state ở đâu.

### Failure handling

Timeout, retry, rollback, duplicate, cancellation, partial success và shutdown xử lý thế nào?

### Observability

Metric, log, trace, query count, heap dump hoặc test nào chứng minh giải pháp?

### Trade-off

Chi phí lock, throughput, consistency, latency, operational complexity và khả năng mở rộng?


---

# CHƯƠNG 44. MOCK INTERVIEW & REVISION ROADMAP

## 44.1. Mục tiêu của mock interview

Mock interview không phải là đọc lại toàn bộ giáo trình. Nó mô phỏng áp lực phải:

- Hiểu câu hỏi trước khi trả lời.
- Nói rõ giả định.
- Tư duy thành tiếng nhưng có cấu trúc.
- Viết code không bỏ qua edge cases.
- Nhận feedback và sửa lỗi lặp lại.

Sau mỗi buổi, hãy ghi lại câu hỏi mà bạn:

- Không biết.
- Biết nhưng diễn đạt không rõ.
- Trả lời đúng nhưng thiếu trade-off.
- Viết code đúng nhưng complexity chưa tốt.
- Bị mắc ở edge case.
- Đề xuất giải pháp không phù hợp distributed system.

## 44.2. Format mock interview 60 phút

| Thời lượng | Hoạt động | Mục tiêu |
| --- | --- | --- |
| 5 phút | Giới thiệu project/kinh nghiệm | Kiểm tra khả năng trình bày |
| 15 phút | Java fundamentals/OOP/API | Kiểm tra nền tảng |
| 15 phút | Collections/Generics/Stream | Kiểm tra cơ chế và code reading |
| 15 phút | Coding challenge | Kiểm tra thuật toán và edge cases |
| 8 phút | Backend scenario | Kiểm tra production thinking |
| 2 phút | Ứng viên hỏi ngược | Kiểm tra sự quan tâm và tư duy hệ thống |

Có thể kéo dài phần coding lên 30 phút nếu đó là mục tiêu chính. Điều quan trọng là phải đo thời gian và ghi lại câu trả lời, không chỉ luyện trong đầu.

## 44.3. Rubric tự đánh giá

Chấm mỗi tiêu chí từ 0 đến 3:

| Điểm | Ý nghĩa |
| --- | --- |
| 0 | Không biết hoặc trả lời sai bản chất |
| 1 | Nhớ định nghĩa nhưng không giải thích được cơ chế |
| 2 | Giải thích đúng và có ví dụ, còn thiếu trade-off |
| 3 | Giải thích cơ chế, giới hạn, ví dụ và cách kiểm chứng |

### Các tiêu chí

| Tiêu chí | Câu hỏi kiểm tra |
| --- | --- |
| Fundamentals | Có giải thích được pass-by-value, equality, immutability không? |
| OOP | Có phân biệt abstraction với encapsulation và polymorphism không? |
| Collections | Có chọn đúng cấu trúc dữ liệu và complexity không? |
| Generics | Có giải thích PECS, invariance, erasure không? |
| Exceptions | Có phân loại và giữ cause/stack trace không? |
| Streams | Có phân biệt lazy, eager, map, flatMap, side effect không? |
| Concurrency | Có nhận diện race, visibility, atomicity và scope lock không? |
| JVM | Có phân biệt heap, stack, GC, native memory và leak không? |
| Java 21 | Có dùng đúng record, sealed, pattern, virtual thread không? |
| Backend | Có xét transaction, database constraint, idempotency, timeout không? |
| Testing | Có chọn unit/integration test và viết assertion có ý nghĩa không? |
| Communication | Có nói theo cấu trúc và nêu giả định không? |

Tổng điểm không phải chứng chỉ tuyệt đối. Nó giúp tìm khoảng trống để ôn tập có mục tiêu.

## 44.4. Phân loại mức sẵn sàng

### Chưa sẵn sàng

- Nhớ tên API nhưng không biết khi nào dùng.
- Trả lời HashMap bằng “O(1) luôn luôn”.
- Dùng synchronized cho mọi race condition.
- Không phân biệt mutation với reassignment.
- Không xử lý null, empty, overflow hoặc timeout.
- Coding solution chỉ chạy happy path.

### Junior có nền tảng

- Viết được code business thông thường.
- Hiểu OOP, collections, exceptions và generics cơ bản.
- Biết viết unit test.
- Phân tích được complexity của bài quen thuộc.
- Nhận diện được lỗi rõ ràng trong concurrency.

### Strong Junior

- Giải thích được contract và implementation detail.
- Chọn collection dựa trên access pattern.
- Dùng equals/hashCode đúng.
- Viết Stream/Optional mà không lạm dụng.
- Xử lý timeout, retry và resource lifecycle.
- Biết khi nào database phải bảo vệ invariant.

### Junior+

- Nhìn vấn đề qua boundary của JVM, database và distributed system.
- Nói được consistency, idempotency, backpressure và observability.
- Không đề xuất local lock cho distributed problem.
- Thiết kế test cho race, duplicate, failure và integration.
- Đưa ra trade-off thay vì một câu trả lời tuyệt đối.
- Có thể review code và giải thích vì sao một thay đổi giảm hoặc tăng risk.

## 44.5. Roadmap ôn tập 6 tuần

### Tuần 1 — Fundamentals, OOP, String và Exception

Ôn:

- JDK/JVM, bytecode, classpath.
- Primitive/reference, scope, pass-by-value.
- Class/object, constructor, inheritance, polymorphism.
- Encapsulation, access modifiers.
- String pool, immutability, Unicode basics.
- Exception hierarchy, try-with-resources.

Bài thực hành:

- Viết value object immutable.
- Viết custom exception có cause.
- Đọc output của 20 đoạn code ngắn.
- Viết test cho validation và exception.

### Tuần 2 — Collections và Generics

Ôn:

- List, Set, Map, Queue, Deque.
- Hashing, equality, ordering.
- ArrayList/ArrayDeque/HashMap/TreeMap.
- Comparable/Comparator.
- Wildcards, PECS, invariance, erasure.

Bài thực hành:

- First unique character.
- Two Sum.
- Group Anagrams.
- LRU cache.
- Viết method generic copy producer/consumer.
- Đo complexity và memory cho từng solution.

### Tuần 3 — Lambda, Stream, Optional, Date/Time và BigDecimal

Ôn:

- Functional interfaces.
- Stream pipeline và laziness.
- Collectors, map/flatMap, grouping.
- Optional API và eager fallback.
- Instant, ZoneId, Duration, Period.
- Decimal arithmetic và rounding.

Bài thực hành:

- Chuyển imperative code sang Stream rồi so sánh readability.
- Viết pipeline không side effect.
- Test timezone boundary và rounding.
- Chỉ ra khi nào vòng lặp rõ hơn Stream.

### Tuần 4 — I/O, Concurrency và JVM

Ôn:

- Byte/character streams, NIO.2.
- Resource ownership và interruption.
- Race condition, visibility, atomicity.
- Locks, executors, futures, blocking queues.
- Heap, stack, GC, memory leak, JIT.

Bài thực hành:

- File copy theo chunk.
- Producer-consumer có graceful shutdown.
- Counter benchmark.
- Đọc thread dump/heap retention ở mức cơ bản.
- Viết code không nuốt InterruptedException.

### Tuần 5 — Java 21, Clean Code và Backend scenarios

Ôn:

- Records, sealed classes, pattern matching, text blocks.
- Virtual threads và resource limits.
- SOLID, immutability, refactoring.
- Transaction, N+1, idempotency.
- Timeout, retry, circuit breaker, cache.

Bài thực hành:

- Thiết kế payment result sealed hierarchy.
- Viết endpoint pagination ổn định.
- Thiết kế idempotency record.
- Review một service có race condition và N+1.
- Viết error contract và integration test.

### Tuần 6 — Mock interview và project review

Mỗi ngày:

1. 20 phút flashcards/câu hỏi.
2. 30 phút coding có bấm giờ.
3. 20 phút đọc hoặc refactor code.
4. 20 phút trả lời một Backend scenario.
5. 10 phút ghi error log.

Cuối tuần:

- Làm ít nhất hai mock interviews.
- Chọn một project để giải thích end-to-end.
- Chạy test/build từ đầu.
- Kiểm tra README, API contract, database migration, logging và error handling.
- Viết lại ba câu trả lời yếu nhất.

## 44.6. Lịch học mỗi ngày

Một phiên 90 phút có thể chia:

| Thời gian | Hoạt động |
| --- | --- |
| 10 phút | Recall không nhìn tài liệu |
| 25 phút | Ôn lý thuyết một chủ đề |
| 30 phút | Coding hoặc code reading |
| 15 phút | Viết test/edge cases |
| 10 phút | Ghi lại điều chưa hiểu |

Recall chủ động hiệu quả hơn việc chỉ đọc lại. Hãy đóng tài liệu, tự trả lời “vì sao”, sau đó mở ra đối chiếu.

## 44.7. Error log cho quá trình ôn tập

Tạo một bảng như sau:

| Ngày | Chủ đề | Câu hỏi/bài lỗi | Nguyên nhân | Cách sửa | Ngày xem lại |
| --- | --- | --- | --- | --- | --- |
| 11/10 | Generics | Thêm vào wildcard extends | Nhầm producer | Vẽ type hierarchy, viết lại example | 13/10 |
| 12/10 | Concurrency | Dùng volatile cho count++ | Nhầm visibility với atomicity | Viết race test | 15/10 |

Phân loại nguyên nhân:

- Thiếu kiến thức.
- Nhớ sai.
- Đọc đề thiếu.
- Không hỏi constraint.
- Code có bug.
- Complexity chưa phù hợp.
- Diễn đạt chưa rõ.
- Quên production concern.

Mỗi lỗi nên có một hành động sửa được, chẳng hạn viết test, vẽ sơ đồ, triển khai lại từ đầu hoặc giải thích thành tiếng.

## 44.8. Kỹ thuật đọc code trong phỏng vấn

Khi được đưa một đoạn code, không chạy ngay. Đọc theo thứ tự:

1. Xác định type của từng biến.
2. Theo dõi mutation và aliasing.
3. Kiểm tra overload/override resolution.
4. Xác định exception path.
5. Kiểm tra thứ tự evaluation.
6. Kiểm tra thread interleaving nếu có concurrency.
7. Dự đoán output hoặc lỗi compile.
8. Sau đó mới đề xuất sửa.

### Ví dụ cần hỏi

- equals đang so identity hay primitive value?
- Collection có giữ order không?
- get có làm mutation không?
- Lambda capture biến effectively final nào?
- Stream đã có terminal operation chưa?
- finally có che exception không?
- HashMap key có mutable không?
- volatile có đủ cho compound update không?
- Transaction có đi qua proxy boundary không?
- Resource có được close không?

## 44.9. Bộ mock interview mẫu

### Vòng 1 — Fundamentals

1. Giải thích pass-by-value bằng ví dụ mutable object.
2. Vì sao override hashCode cùng với equals?
3. String pool có liên quan gì đến immutability?
4. Checked exception nên được dùng khi nào?
5. Record có phải deep immutable không?

### Vòng 2 — Collections/Generics

1. Chọn collection cho queue FIFO, stack LIFO và ordered unique values.
2. HashMap xử lý collision thế nào ở mức contract và implementation?
3. Viết method copy từ producer sang consumer bằng PECS.
4. Vì sao List<Integer> không phải List<Number>?
5. Khi nào Comparator trả 0 gây mất phần tử trong TreeSet?

### Vòng 3 — Concurrency/JVM

1. Vì sao volatile count vẫn không sửa được count++?
2. Khi nào dùng AtomicInteger, LongAdder hoặc lock?
3. Phân biệt memory leak và high allocation rate.
4. Virtual thread giải quyết phần nào và không giải quyết phần nào?
5. Làm gì khi API p99 tăng nhưng average vẫn ổn?

### Vòng 4 — Backend

1. Bảo vệ sản phẩm cuối cùng khi hai requests mua đồng thời.
2. Thiết kế idempotency cho create order.
3. Xử lý external API timeout sau khi payment có thể đã thành công.
4. Tìm và sửa N+1 query.
5. Thiết kế upload file an toàn.

### Vòng 5 — Coding

Chọn một bài, bấm giờ 30 phút:

- Two Sum với constraints thay đổi.
- LRU cache có TTL.
- Top K với tie-breaker.
- Rate limiter thread-safe.
- Merge intervals từ input streaming.
- Producer-consumer có cancellation.
- Stable cursor pagination.
- Group và aggregate dữ liệu lớn không đọc toàn bộ vào memory.

## 44.10. Checklist trước ngày phỏng vấn

### Kiến thức

- [ ] Giải thích được 4 pillars của OOP.
- [ ] Phân biệt ==, equals và hashCode.
- [ ] Nói được complexity và use case của collections chính.
- [ ] Dùng PECS đúng trong ví dụ.
- [ ] Phân biệt checked/unchecked và giữ cause.
- [ ] Giải thích Stream lazy và terminal operation.
- [ ] Phân biệt visibility, atomicity và mutual exclusion.
- [ ] Nói được GC không sửa memory leak do reference retention.
- [ ] Hiểu record, sealed, pattern matching và virtual thread ở mức Java 21.
- [ ] Biết Instant/timezone và BigDecimal cho domain phù hợp.

### Coding

- [ ] Hỏi rõ constraints trước khi code.
- [ ] Nêu brute force và solution tối ưu.
- [ ] Viết invariant.
- [ ] Xử lý empty/null/duplicate/overflow.
- [ ] Phân tích time/space complexity.
- [ ] Có test hoặc dry-run với input nhỏ.
- [ ] Nói rõ nếu code đang xử lý UTF-16 code unit thay vì code point.

### Backend

- [ ] Không dùng local synchronized cho distributed invariant.
- [ ] Dùng database constraint cho uniqueness.
- [ ] Có timeout và retry policy.
- [ ] Retry mutation phải xét idempotency.
- [ ] Biết N+1 và stable pagination.
- [ ] Không giữ transaction/lock lâu trong external call không cần thiết.
- [ ] Không log secrets.
- [ ] Có metrics, logs, traces cho failure quan trọng.
- [ ] Biết unit test không thay thế integration test.
- [ ] Biết cache cần eviction/invalidation/consistency policy.

### Giao tiếp

- [ ] Nói rõ giả định.
- [ ] Không dùng “luôn luôn” cho implementation detail.
- [ ] Thừa nhận khi cần kiểm tra contract hoặc đo thực tế.
- [ ] Trình bày trade-off sau giải pháp chính.
- [ ] Hỏi ngược về workload, scale, consistency và latency target.

## 44.11. Bản đồ ôn tập 40 chương

| Chương | Nhóm cần recall | Đầu ra cần đạt |
| --- | --- | --- |
| 1–5 | Java Fundamentals | Biên dịch/chạy code, kiểu dữ liệu, flow, methods, packages |
| 6 | Classes & Objects | Mô hình hóa state, behavior, constructor, lifecycle |
| 7 | Four Pillars of OOP | Đóng gói, kế thừa, đa hình, trừu tượng |
| 8 | Advanced OOP | Static/final, nested types, enum, sealed, record, SOLID |
| 9 | String Handling | Immutability, pool, Unicode, builder, regex |
| 10 | Wrapper Classes | Boxing, unboxing, cache, null |
| 11 | Math/Numbers/Utilities | BigDecimal, BigInteger, rounding, UUID, Objects |
| 12 | Date & Time | Instant, zone, duration, period, clock |
| 13 | Exception Handling | Hierarchy, propagation, resources, custom exceptions |
| 14–19 | Collections Framework | List/Set/Map/Queue, hashing, ordering, concurrency |
| 20 | Generics | Bounds, wildcard, PECS, erasure, API design |
| 21 | Lambda | Functional interface, method reference, capture |
| 22 | Stream API | Pipeline, collectors, laziness, parallel trade-off |
| 23 | Optional | Absence model, map/flatMap, fallback |
| 24–26 | I/O/NIO/Serialization | Stream, Path/Files, resource/security concerns |
| 27–29 | Concurrency | Thread, lock, executor, Future, coordination |
| 30–31 | JVM/GC | Class loading, memory, JIT, GC, diagnostics |
| 32–34 | Modern Java 21 | var, text block, switch, record, sealed, virtual thread |
| 35–38 | Reflection/Networking/Advanced APIs | Metadata, annotation, HTTP, modules, ServiceLoader |
| 39 | Clean Code | Naming, cohesion, SOLID, refactoring |
| 40 | Testing/Debugging | JUnit, Mockito, integration, Testcontainers, diagnosis |

Mỗi dòng nên được chuyển thành một output có thể kiểm chứng. Ví dụ:

- Không ghi “biết HashMap”.
- Ghi “giải thích được equality/hash contract, collision, resize ở mức phù hợp và viết test cho mutable key”.
- Không ghi “biết concurrency”.
- Ghi “phân biệt visibility/atomicity, sửa được race condition và nói được vì sao local lock không đủ cho nhiều instances”.

## 44.12. Project review cuối lộ trình

Chọn một project Backend nhỏ nhưng hoàn chỉnh, chẳng hạn order, task, booking hoặc inventory service. Hãy chuẩn bị giải thích:

1. Domain và invariants.
2. API endpoints và error contract.
3. Database schema/index/constraint.
4. Transaction boundary.
5. Concurrency risks.
6. Idempotency và retry.
7. Cache hoặc external API.
8. Test strategy.
9. Logging/metrics/tracing.
10. Một trade-off bạn biết là chưa hoàn hảo.

Một project nhỏ nhưng bạn giải thích được failure modes sẽ thuyết phục hơn một project lớn chỉ có happy path.

## 44.13. Kết luận

Java Core 21 không nên được học như một danh sách keyword rời rạc. Những chủ đề quan trọng liên kết với nhau:

- OOP quyết định cách mô hình hóa state và behavior.
- Equality quyết định collections và cache hoạt động đúng hay không.
- Generics bảo vệ type contract.
- Stream và Optional biểu diễn data transformation và absence.
- Concurrency liên quan trực tiếp tới memory model, database và resource limits.
- JVM/GC giúp giải thích performance và memory symptoms.
- Java 21 cung cấp record, sealed types, pattern matching và virtual threads, nhưng mỗi tính năng vẫn cần dùng theo domain và workload.
- Testing, observability và clean code biến lý thuyết thành phần mềm có thể vận hành.

Mục tiêu cuối cùng của phỏng vấn không phải là trả lời mọi câu hỏi bằng một câu thuộc lòng. Đó là chứng minh bạn có thể suy luận từ yêu cầu đến thiết kế, từ code đến failure mode, và từ lỗi đến cách kiểm chứng.

Khi đã hoàn thành checklist này, hãy tiếp tục bằng cách xây một project thật, đo behavior thật, viết test thật và thường xuyên tự giải thích lại quyết định kỹ thuật của mình.
