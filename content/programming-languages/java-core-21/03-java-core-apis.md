# JAVA CORE 21 — PHẦN 3: JAVA CORE APIs

Giáo trình lý thuyết chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Ở Phần 1, bạn đã tìm hiểu các kiến thức nền tảng của Java như kiểu dữ liệu, biến, toán tử, vòng lặp và mảng. Phần 2 tập trung vào Object-Oriented Programming (OOP), bao gồm Class, Object, Encapsulation, Inheritance, Polymorphism và Abstraction.

Phần 3 sẽ tập trung vào các API có sẵn trong Java Standard Library, được sử dụng thường xuyên trong những ứng dụng thực tế, đặc biệt là Java Backend.

## Nội dung Phần 3

| Chương | Chủ đề | Trọng tâm |
| ------ | ------------------------- | ----------------------------------------------------------------- |
| 9 | String Handling | Immutability, String Pool, StringBuilder, Encoding, Regex |
| 10 | Wrapper Classes | Autoboxing, Unboxing, Integer Cache, Null Handling |
| 11 | Math, Numbers & Utilities | BigDecimal, BigInteger, Rounding, Random, UUID, Objects |
| 12 | Date & Time API | LocalDateTime, Instant, ZonedDateTime, Timezone, Duration, Period |

Mục tiêu sau khi hoàn thành phần này là bạn có thể hiểu và vận dụng được các API của Java để xử lý chuỗi, số, ngày giờ và dữ liệu nghiệp vụ một cách chính xác, hiệu quả.

# CHƯƠNG 9. STRING HANDLING

## 9.1. String là gì?

Trong Java, `String` là một class thuộc package:

```java
java.lang.String
```

Class này đại diện cho một chuỗi các ký tự được biểu diễn bằng UTF-16 code units.

Ví dụ:

```java
String name = "Java";
String message = "Hello World";
String empty = "";
```

Một số đặc điểm quan trọng:

- `String` là reference type, không phải primitive type.
- `String` là một `final class`, không thể kế thừa.
- `String` là immutable.
- Java có String Pool để tái sử dụng các chuỗi được intern.
- `String` triển khai `CharSequence`, `Comparable<String>` và một số interfaces khác.
- String hỗ trợ nhiều API xử lý văn bản.

### String có phải một array of char không?

Không nên hiểu như vậy.

Về mặt logic, String biểu diễn một chuỗi UTF-16 code units.

Tuy nhiên, trong các phiên bản OpenJDK hiện đại, implementation sử dụng cơ chế Compact Strings, thường lưu dữ liệu bên trong một `byte[]` kết hợp với thông tin encoding.

Đây là chi tiết implementation, không phải contract bắt buộc của Java Language Specification.

### String là Object

Ví dụ:

```java
String name = "Java";

System.out.println(name.length());
System.out.println(name.toUpperCase());
```

Bởi `String` là class, bạn có thể gọi các instance methods trên reference.

## 9.2. String Immutability

Immutable có nghĩa là trạng thái nội dung của String không thể thay đổi sau khi object được tạo.

Ví dụ:

```java
String text = "Java";

text.concat(" Core");

System.out.println(text);
```

Kết quả:

```text
Java
```

Tại sao không phải `"Java Core"`?

Bởi vì:

```java
text.concat(" Core");
```

tạo ra hoặc trả về một String biểu diễn kết quả, nhưng không thay đổi nội dung String ban đầu.

Nếu muốn sử dụng kết quả:

```java
text = text.concat(" Core");

System.out.println(text);
```

Kết quả:

```text
Java Core
```

### Phân tích cơ chế

String Immutability

Ban đầu

text

"Java"

Sau text = text.concat(" Core")

text

"Java Core"

"Java" — object ban đầu không bị sửa đổi

String ban đầu vẫn có thể tồn tại nếu nó còn reachable từ những references khác hoặc được giữ trong String Pool.

### Tại sao String được thiết kế Immutable?

1. String Pool

Nếu nhiều references dùng chung một interned String, việc cho phép thay đổi nội dung sẽ có thể ảnh hưởng đến nhiều phần của chương trình.

2. Thread Safety

Nội dung String bất biến nên có thể được chia sẻ giữa các threads mà không cần đồng bộ hóa để bảo vệ chính nội dung đó.

Điều này không có nghĩa mọi cấu trúc chứa String đều tự động thread-safe.

3. Hash Code Stability

`String` có thể được sử dụng làm key trong HashMap.

Giá trị hash code dựa trên nội dung không thay đổi trong suốt vòng đời của String.

4. Security và API Reliability

Các giá trị như đường dẫn, tên tài nguyên hoặc thông tin cấu hình có thể được truyền qua nhiều API mà không lo nội dung String object bị một thành phần khác sửa đổi trực tiếp.

## 9.3. String Constant Pool

String Pool là cơ chế lưu trữ và tái sử dụng những String đã được intern.

Ví dụ:

```java
String a = "Java";
String b = "Java";

System.out.println(a == b);
```

Kết quả:

```text
true
```

Vì hai String literals tương ứng tham chiếu cùng một canonical String object được intern.

### Sơ đồ String Pool

String Pool trong Heap

Cả hai references trỏ đến cùng một interned String object.

### String Literal vs new String()

Ví dụ:

```java
String a = "Java";
String b = new String("Java");

System.out.println(a == b);
System.out.println(a.equals(b));
```

Kết quả:

```text
false
true
```

Giải thích:

```java
String a = "Java";
```

Tham chiếu đến String literal được intern.

```java
String b = new String("Java");
```

Tạo một String object riêng biệt.

Vì thế:

```java
a == b
```

là `false`.

Nhưng:

```java
a.equals(b)
```

là `true`, vì hai String có cùng nội dung.

### new String() có tạo hai objects không?

Đây là câu hỏi phỏng vấn thường gặp.

Xét:

```java
String s = new String("Hello");
```

Một String object mới được tạo bởi `new String(...)`.

Literal `"Hello"` cũng được xử lý qua cơ chế intern, nhưng không thể mặc định kết luận mọi lần chạy dòng code này sẽ tạo đúng hai String objects mới.

Literal có thể đã được intern trước đó.

## 9.4. String Interning

`intern()` trả về canonical representation của String từ String Pool.

Ví dụ:

```java
String a = new String("Java");
String b = a.intern();
String c = "Java";

System.out.println(a == b);
System.out.println(b == c);
```

Kết quả:

```text
false
true
```

`b` và `c` tham chiếu cùng interned String.

### Khi nào nên dùng intern()?

Không nên sử dụng `intern()` bừa bãi.

Nó có thể hữu ích khi:

- Có rất nhiều String trùng lặp.
- Muốn canonicalize một tập giá trị chuỗi.
- Đã đánh giá rõ đặc điểm bộ nhớ và hiệu năng.

Trong ứng dụng Backend, String interning thủ công thường không phải lựa chọn mặc định vì có thể làm tăng áp lực quản lý String Pool.

## 9.5. String Concatenation

Concatenation là phép nối chuỗi.

Java hỗ trợ toán tử `+`.

```java
String firstName = "Dang";
String lastName = "Quang";

String fullName = firstName + " " + lastName;
```

Kết quả:

```text
Dang Quang
```

### Concatenation với các kiểu khác

```java
String result = "Age: " + 22;
```

Kết quả:

```text
Age: 22
```

Java chuyển các operands phù hợp sang biểu diễn String theo quy tắc string concatenation.

### Bẫy về thứ tự phép toán

```java
System.out.println("Result: " + 10 + 20);
```

Kết quả:

```text
Result: 1020
```

Vì biểu thức được đánh giá từ trái sang phải:

```java
("Result: " + 10) + 20
```

Muốn tính tổng:

```java
System.out.println("Result: " + (10 + 20));
```

Kết quả:

```text
Result: 30
```

### String Concatenation có luôn tạo nhiều objects không?

Không nhất thiết.

Compiler và runtime có thể tối ưu hóa String concatenation.

Ví dụ:

```java
String a = "Hello" + " " + "Java";
```

Compiler có thể thực hiện constant folding thành một String literal.

Đối với concatenation tại runtime, OpenJDK hiện đại có cơ chế được giới thiệu qua `invokedynamic` để tối ưu hóa.

Vì vậy, không nên khẳng định mỗi dấu `+` luôn tạo chính xác một String object mới.

## 9.6. StringBuilder

`StringBuilder` là một mutable sequence of characters, phù hợp khi cần xây dựng một chuỗi qua nhiều thao tác nối hoặc chỉnh sửa.

Khác với `String`, `StringBuilder` cho phép thay đổi dữ liệu trong object hiện tại. Mỗi lần gọi `append()` không tạo ra một String immutable mới cho toàn bộ kết quả.

### Ví dụ cơ bản

```java
StringBuilder builder = new StringBuilder();

builder.append("Java");
builder.append(" ");
builder.append("Core");
builder.append(" 21");

System.out.println(builder);
System.out.println(builder.toString());
```

Kết quả của hai lệnh in đều biểu diễn:

```text
Java Core 21
Java Core 21
```

Khi truyền `StringBuilder` cho `System.out.println`, Java gọi `toString()` để lấy chuỗi hiển thị.

### Các method quan trọng

| Method | Chức năng |
| --- | --- |
| `append(value)` | Thêm dữ liệu ở cuối |
| `insert(index, value)` | Chèn dữ liệu tại vị trí |
| `delete(start, end)` | Xóa đoạn theo khoảng `[start, end)` |
| `deleteCharAt(index)` | Xóa một UTF-16 code unit |
| `replace(start, end, str)` | Thay thế một đoạn |
| `reverse()` | Đảo thứ tự các code unit |
| `setCharAt(index, ch)` | Gán một UTF-16 code unit |
| `length()` | Số UTF-16 code units hiện có |
| `capacity()` | Dung lượng buffer hiện tại |
| `ensureCapacity(n)` | Yêu cầu capacity tối thiểu |
| `toString()` | Tạo String biểu diễn nội dung |

Ví dụ:

```java
StringBuilder builder = new StringBuilder("Java");

builder.insert(4, " Core");
builder.append(" 21");
builder.replace(0, 4, "JAVA");
builder.delete(4, 9);

System.out.println(builder);
```

Kết quả:

```text
JAVA 21
```

Hãy luôn kiểm tra index khi dùng `insert`, `delete` hoặc `replace`. Index không hợp lệ có thể gây `StringIndexOutOfBoundsException`.

### `length()` và `capacity()`

```java
StringBuilder builder = new StringBuilder();

System.out.println(builder.length());
System.out.println(builder.capacity());
```

Với constructor mặc định, Java SE quy định capacity ban đầu là 16 code units. Capacity không phải số ký tự đang chứa.

Có thể chủ động cấp phát gần đúng kích thước cần dùng:

```java
StringBuilder csv = new StringBuilder(256);
csv.ensureCapacity(1024);
```

Việc chọn capacity ban đầu phù hợp có thể giảm số lần mở rộng buffer trong các tác vụ xây dựng chuỗi lớn. Quy tắc tăng capacity cụ thể không nên được xem là contract ổn định của ứng dụng vì đó là chi tiết implementation.

### `append` và giá trị null

```java
StringBuilder builder = new StringBuilder();

builder.append("name=");
builder.append((String) null);

System.out.println(builder);
```

Kết quả:

```text
name=null
```

Nếu null có ý nghĩa đặc biệt trong nghiệp vụ, nên xử lý rõ ràng thay vì để chuỗi `"null"` xuất hiện ngẫu nhiên.

### Vì sao StringBuilder hữu ích trong loop?

Cách dễ viết nhưng có thể tạo nhiều object trung gian:

```java
String result = "";

for (int i = 1; i <= 5; i++) {
    result += i;
}

System.out.println(result);
```

Với mỗi iteration, String hiện tại là immutable. Chương trình có thể phải tạo kết quả mới và sao chép dữ liệu. Khi số iteration lớn, việc này có thể gây nhiều allocation.

Cách rõ ràng hơn:

```java
StringBuilder result = new StringBuilder();

for (int i = 1; i <= 5; i++) {
    if (result.length() > 0) {
        result.append(',');
    }
    result.append(i);
}

System.out.println(result);
```

Kết quả:

```text
1,2,3,4,5
```

Ví dụ backend thực tế: xây chuỗi hiển thị danh sách ID, nội dung CSV đơn giản, đoạn log có cấu trúc hoặc text response. Với JSON, XML hoặc CSV có quy tắc escaping phức tạp, nên dùng thư viện chuyên dụng.

### StringBuilder và thread safety

`StringBuilder` không thread-safe. Không nên để nhiều thread cùng sửa một instance nếu không có cơ chế đồng bộ bên ngoài.

Thông thường, cách tốt là:

- Tạo builder bên trong method và chỉ dùng trong một thread.
- Trả về `String` sau khi hoàn tất.
- Không chia sẻ builder mutable qua field singleton.
- Nếu cần shared mutable sequence, cân nhắc thiết kế lại ownership của dữ liệu.

```java
public String buildOrderSummary(List<String> items) {
    StringBuilder result = new StringBuilder();

    for (String item : items) {
        result.append("- ").append(item).append(System.lineSeparator());
    }

    return result.toString();
}
```

### StringBuilder và Unicode

`setCharAt`, `deleteCharAt` và index của `StringBuilder` làm việc theo UTF-16 code units. Không nên mặc định xem một index là một Unicode code point hoàn chỉnh.

```java
StringBuilder builder = new StringBuilder("😀");

System.out.println(builder.length()); // 2
builder.setCharAt(0, '?');

System.out.println(builder);
```

Thao tác trên một nửa surrogate pair có thể tạo dữ liệu Unicode không hợp lệ. Nếu xử lý emoji hoặc supplementary characters, hãy dùng các API code point và thiết kế thao tác theo code point.

## 9.7. StringBuffer

`StringBuffer` có API tương tự `StringBuilder` nhưng nhiều method được synchronized. Nó phù hợp với một số code legacy yêu cầu mutable sequence có đồng bộ hóa ở cấp operation.

Ví dụ:

```java
StringBuffer buffer = new StringBuffer("start");

buffer.append("-middle");
buffer.insert(0, "log-");

System.out.println(buffer);
```

Kết quả:

```text
log-start-middle
```

### StringBuffer có làm cả chuỗi nghiệp vụ atomic không?

Không.

Các method riêng lẻ có thể được đồng bộ hóa, nhưng một chuỗi nhiều bước vẫn có thể bị thread khác xen vào:

```java
if (buffer.length() > 0) {
    buffer.deleteCharAt(buffer.length() - 1);
}
```

Nếu hai thread đồng thời thực hiện kiểm tra và xóa, toàn bộ đoạn kiểm tra + xóa không tự động là một critical section.

Nếu thật sự cần tính atomic cho chuỗi thao tác, phải dùng lock phù hợp hoặc thiết kế lại ownership của dữ liệu.

### Khi nào dùng StringBuilder và StringBuffer?

| Tình huống | Lựa chọn thường phù hợp |
| --- | --- |
| Xây chuỗi trong một method, một thread | `StringBuilder` |
| Cần shared mutable sequence | Thiết kế ownership/lock rõ ràng trước |
| Code legacy yêu cầu synchronized API | `StringBuffer` |
| Dữ liệu bất biến sau khi tạo | `String` |

`StringBuffer` không phải lựa chọn mặc định chỉ vì có từ “thread-safe”. Đồng bộ hóa cũng tạo chi phí và không thay thế thiết kế concurrency đúng.

## 9.8. So sánh String: `==`, `equals()` và `compareTo()`

### `==` so sánh identity

Với reference types, `==` kiểm tra hai reference có trỏ tới cùng object hay không.

```java
String literal = "java";
String sameLiteral = "java";
String created = new String("java");

System.out.println(literal == sameLiteral);
System.out.println(literal == created);
```

Kết quả thường thấy:

```text
true
false
```

Đây không phải lý do để dùng `==` so sánh nội dung. Kết quả phụ thuộc vào identity và interning.

### `equals()` so sánh nội dung

```java
String expected = "ACTIVE";
String actual = new String("ACTIVE");

System.out.println(expected.equals(actual));
System.out.println("ACTIVE".equals(null));
```

Kết quả:

```text
true
false
```

Khi biến có thể là null, viết literal ở bên trái giúp tránh NPE:

```java
String status = null;

System.out.println("ACTIVE".equals(status));
System.out.println(java.util.Objects.equals(status, "ACTIVE"));
```

### `compareTo()` và thứ tự từ điển

`compareTo()` trả về số âm, `0` hoặc số dương tùy theo thứ tự từ điển dựa trên UTF-16 code units. Không nên giả định kết quả luôn là `-1`, `0` hoặc `1`.

```java
System.out.println("apple".compareTo("banana") < 0);
System.out.println("java".compareTo("java") == 0);
System.out.println("zoo".compareTo("java") > 0);
```

`compareTo` không tự động áp dụng quy tắc ngôn ngữ tự nhiên. Khi cần sắp xếp tên theo locale, tìm hiểu `Collator`.

### `compareToIgnoreCase()` và `equalsIgnoreCase()`

```java
String input = "admin";
String expected = "ADMIN";

System.out.println(input.equalsIgnoreCase(expected));
System.out.println(input.compareToIgnoreCase(expected));
```

Kết quả:

```text
true
0
```

Các method này phù hợp cho nhiều flag hoặc mã ASCII đơn giản. Chúng không phải công cụ đầy đủ cho mọi quy tắc so sánh theo locale.

### `contentEquals()`

`String.contentEquals` cho phép so sánh String với một `CharSequence` hoặc `StringBuffer` theo nội dung.

```java
String expected = "Java";
StringBuilder actual = new StringBuilder("Java");

System.out.println(expected.contentEquals(actual));
```

Kết quả là `true`.

## 9.9. String API — Các method thường dùng

### `length()`

```java
String text = "Java Core";

System.out.println(text.length());
```

Kết quả là `9` vì `length()` đếm UTF-16 code units.

### `isEmpty()` và `isBlank()`

```java
String empty = "";
String spaces = "   ";
String lines = "\n\t";

System.out.println(empty.isEmpty());
System.out.println(spaces.isEmpty());
System.out.println(spaces.isBlank());
System.out.println(lines.isBlank());
```

Kết quả:

```text
true
false
true
true
```

- `isEmpty()` chỉ kiểm tra length bằng 0.
- `isBlank()` kiểm tra chuỗi rỗng hoặc chỉ chứa whitespace theo quy tắc của Java.
- Cả hai đều ném `NullPointerException` nếu reference là null.

Trong backend, cần phân biệt:

```java
if (value == null || value.isBlank()) {
    throw new IllegalArgumentException("value is required");
}
```

`isBlank` không thay thế hoàn toàn validation nghiệp vụ. Chuỗi `"  42  "` có thể không blank nhưng vẫn cần parse và kiểm tra range.

### `charAt()` và giới hạn UTF-16

```java
String text = "Java";

System.out.println(text.charAt(0));
System.out.println(text.charAt(3));
```

Kết quả:

```text
J
a
```

Index bắt đầu từ 0. Index âm hoặc index lớn hơn hoặc bằng `length()` gây `StringIndexOutOfBoundsException`.

`charAt()` trả về một `char`, tức một UTF-16 code unit, không đảm bảo là một Unicode character hoàn chỉnh.

### Code unit và code point

Đây là một phần thường bị bỏ qua khi xử lý emoji hoặc ký tự ngoài Basic Multilingual Plane.

```java
String emoji = "😀";

System.out.println(emoji.length());
System.out.println(emoji.codePointCount(0, emoji.length()));
System.out.println(emoji.codePointAt(0));
```

Kết quả:

```text
2
1
128512
```

Một supplementary character có thể được biểu diễn bởi một surrogate pair gồm hai code units. Vì vậy:

- `length()` trả về số code units.
- `codePointCount()` đếm số code points.
- `charAt()` trả về một code unit.
- `codePointAt()` đọc một code point bắt đầu tại index code unit.

Duyệt theo code point:

```java
String text = "A😀B";

text.codePoints()
        .forEach(codePoint ->
                System.out.println(
                        new String(Character.toChars(codePoint))
                ));
```

Kết quả:

```text
A
😀
B
```

Nếu nghiệp vụ đếm “ký tự người dùng nhìn thấy”, code point vẫn chưa luôn đủ vì một grapheme cluster có thể gồm nhiều code point kết hợp. Những bài toán hiển thị phức tạp có thể cần thư viện Unicode chuyên dụng.

### `substring()` và `subSequence()`

Khoảng của `substring(beginIndex, endIndex)` là:

```text
[beginIndex, endIndex)
```

Bao gồm `beginIndex` nhưng không bao gồm `endIndex`.

```java
String path = "/api/v1/users/42";

String version = path.substring(5, 7);
String resource = path.substring(8, 13);

System.out.println(version);
System.out.println(resource);
```

Kết quả:

```text
v1
users
```

Nếu chỉ truyền `beginIndex`, Java lấy từ vị trí đó đến cuối:

```java
String suffix = "report.csv".substring(7);
System.out.println(suffix);
```

Kết quả là `csv`.

Lỗi thường gặp:

- Nhầm `endIndex` là inclusive.
- Dùng index của byte thay cho index của UTF-16 code unit.
- Cắt ở giữa surrogate pair.
- Không kiểm tra độ dài trước khi cắt.

`subSequence` trả về một `CharSequence`; trong nhiều tình huống xử lý chuỗi, `substring` dễ đọc hơn vì kết quả là `String`.

### `contains()`, `startsWith()` và `endsWith()`

```java
String fileName = "report-2026.csv";

System.out.println(fileName.contains("2026"));
System.out.println(fileName.startsWith("report"));
System.out.println(fileName.endsWith(".csv"));
System.out.println(fileName.startsWith("2026", 7));
```

Kết quả:

```text
true
true
true
true
```

Các method này phân biệt hoa thường:

```java
System.out.println("Java".contains("java"));
```

Kết quả là `false`.

Đối với extension file, không nên chỉ dựa vào tên file để quyết định MIME type trong hệ thống upload. Cần kiểm tra content type, signature và policy bảo mật ở tầng phù hợp.

### `indexOf()` và `lastIndexOf()`

```java
String path = "/api/v1/users/42";

System.out.println(path.indexOf('/'));
System.out.println(path.indexOf("users"));
System.out.println(path.lastIndexOf('/'));
System.out.println(path.indexOf("orders"));
```

Kết quả:

```text
0
8
14
-1
```

Nếu không tìm thấy, kết quả là `-1`. Không được dùng kết quả này làm index tiếp theo mà không kiểm tra:

```java
int separator = path.indexOf(':');

if (separator >= 0) {
    String scheme = path.substring(0, separator);
}
```

### `replace()` — thay thế literal

`replace` xử lý ký tự hoặc literal sequence, không diễn giải argument như regular expression.

```java
String text = "Java Java";

System.out.println(text.replace("Java", "Backend"));
System.out.println(text.replace('a', 'o'));
```

Kết quả:

```text
Backend Backend
Jovo Jovo
```

`replace` trả về String mới; String ban đầu không bị thay đổi.

### `replaceFirst()` và `replaceAll()` — regular expression

`replaceFirst` và `replaceAll` nhận regex pattern:

```java
String input = "  Java   Core   21  ";

String normalized = input
        .replaceAll("\\s+", " ")
        .strip();

System.out.println(normalized);
```

Kết quả:

```text
Java Core 21
```

So sánh:

| Method | Ý nghĩa |
| --- | --- |
| `replace` | Literal/character replacement |
| `replaceFirst` | Thay match regex đầu tiên |
| `replaceAll` | Thay tất cả match regex |

Nếu giá trị tìm kiếm do user nhập và bạn muốn tìm literal, không đưa trực tiếp vào regex. Dùng `Pattern.quote`:

```java
String keyword = "a+b";
String input = "a+b aab";

String result = input.replaceAll(
        java.util.regex.Pattern.quote(keyword),
        "[TOKEN]"
);

System.out.println(result);
```

Nếu không quote, dấu `+` trong input có thể bị hiểu là quantifier của regex.

### `split()` và các giới hạn

`split` nhận regex, không phải literal separator đơn giản.

```java
String csv = "alice,bob,charlie";

String[] names = csv.split(",");

for (String name : names) {
    System.out.println(name);
}
```

Với separator có ý nghĩa regex, phải escape hoặc quote:

```java
String text = "a.b.c";

String[] parts = text.split("\\.");

System.out.println(java.util.Arrays.toString(parts));
```

Kết quả:

```text
[a, b, c]
```

Một bẫy quan trọng là trailing empty strings:

```java
String data = "A,,B,";

System.out.println(java.util.Arrays.toString(data.split(",")));
System.out.println(java.util.Arrays.toString(data.split(",", -1)));
```

Kết quả:

```text
[A, , B]
[A, , B, ]
```

Tham số limit âm giữ lại trailing empty strings. Điều này quan trọng khi parse dữ liệu có số lượng cột cố định.

Có thể giới hạn số lần tách:

```java
String line = "key=value=rest";
String[] parts = line.split("=", 2);

System.out.println(java.util.Arrays.toString(parts));
```

Kết quả:

```text
[key, value=rest]
```

Không nên dùng `split` để parse CSV đầy đủ vì CSV có thể chứa dấu phẩy trong quoted field, escaped quote và newline. Hãy dùng CSV library khi format có grammar thực sự.

### `strip()`, `trim()`, `stripLeading()` và `stripTrailing()`

`trim` là API legacy dựa trên các code unit có giá trị nhỏ hơn hoặc bằng U+0020. `strip` dùng nhận thức whitespace tốt hơn theo Unicode.

```java
String text = "\u2003 Java \u2003";

System.out.println("[" + text.trim() + "]");
System.out.println("[" + text.strip() + "]");
System.out.println("[" + text.stripLeading() + "]");
System.out.println("[" + text.stripTrailing() + "]");
```

Trong dữ liệu quốc tế, ưu tiên `strip` nếu mục tiêu là loại bỏ whitespace theo Unicode. Tuy nhiên, đừng strip mù quáng dữ liệu mà khoảng trắng ở đầu/cuối có ý nghĩa.

### `String.join()`

`String.join` phù hợp để nối các phần tử với delimiter:

```java
String result = String.join(
        ", ",
        "Java",
        "Spring Boot",
        "PostgreSQL"
);

System.out.println(result);
```

Kết quả:

```text
Java, Spring Boot, PostgreSQL
```

Dùng với collection:

```java
List<String> roles = List.of("ADMIN", "REPORT_VIEWER");

String header = String.join(" | ", roles);
System.out.println(header);
```

Nếu dữ liệu đến từ stream và cần filtering/mapping, có thể dùng `Collectors.joining`:

```java
String csv = roles.stream()
        .map(String::toLowerCase)
        .collect(java.util.stream.Collectors.joining(","));
```

### `String.format()` và `formatted()`

`String.format` hữu ích khi template có nhiều placeholder:

```java
int orderId = 42;
String status = "PAID";

String message = String.format(
        "Order #%d has status %s",
        orderId,
        status
);

System.out.println(message);
```

Kết quả:

```text
Order #42 has status PAID
```

Với Java 15+, một String có thể gọi `formatted`:

```java
String template = "User %s has %d points";
String message = template.formatted("alice", 120);

System.out.println(message);
```

Định dạng số:

```java
String orderCode = String.format(
        java.util.Locale.ROOT,
        "ORDER-%05d",
        42
);

System.out.println(orderCode);
```

Kết quả là `ORDER-00042`.

Khi format tiền tệ hoặc ngày giờ cho người dùng, locale là một phần của nghiệp vụ. Không nên dùng locale mặc định một cách vô thức trong service backend chạy trên nhiều môi trường.

`String.format` phù hợp cho presentation text. Không dùng nó để nối dữ liệu user vào SQL, shell command hoặc HTML mà bỏ qua cơ chế parameterization/escaping chuyên dụng.

### `repeat()` và `lines()`

```java
System.out.println("=".repeat(10));

String text = "first\nsecond\nthird";
long lineCount = text.lines().count();

System.out.println(lineCount);
```

Kết quả:

```text
==========
3
```

Phần tiếp theo sẽ tập trung vào Text Blocks, encoding, regular expressions và các tình huống xử lý String trong backend.

## 9.10. Text Blocks trong Java

Text block dùng ba dấu double quote và phù hợp với JSON, SQL, HTML hoặc prompt nhiều dòng.

```java
String json = """
        {
          "name": "Java",
          "version": 21
        }
        """;

System.out.println(json);
```

Text block giúp giảm escape quote và giữ layout dễ đọc hơn so với chuỗi nối nhiều dòng.

### Incidental indentation

Java loại bỏ phần indentation chung theo quy tắc của text block. Vì vậy, indentation trong source không luôn xuất hiện nguyên trạng trong kết quả.

Có thể dùng `stripIndent` nếu đang xử lý text nhiều dòng được tạo từ nguồn khác:

```java
String text = """
        line one
          line two
        """;

System.out.println(text.stripIndent());
```

### Dấu xuống dòng và escape

Trong text block:

- Xuống dòng vật lý thường trở thành newline trong kết quả.
- Dùng `\\` ở cuối dòng để nối dòng mà không chèn newline.
- Vẫn phải escape các dấu `"` nếu cần tạo chuỗi ba quote liên tiếp.

Text block không phải template engine và không tự động escape JSON, SQL hoặc HTML. Dữ liệu user vẫn phải được serialize/escape bằng công cụ phù hợp.

## 9.11. String và Unicode: UTF-16, UTF-8 và byte encoding

### Khác nhau giữa character và byte

`String` là chuỗi ký tự trong mô hình Unicode/UTF-16 của Java. Khi gửi qua network hoặc ghi xuống file, dữ liệu phải được encode thành bytes.

```java
import java.nio.charset.StandardCharsets;

String text = "Xin chào 😀";

byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
String decoded = new String(bytes, StandardCharsets.UTF_8);

System.out.println(decoded);
System.out.println(text.equals(decoded));
```

Kết quả:

```text
Xin chào 😀
true
```

Số byte UTF-8 không nhất thiết bằng `String.length()`:

```java
System.out.println(text.length());
System.out.println(bytes.length);
```

`length` đếm UTF-16 code units; `bytes.length` đếm byte sau encoding UTF-8.

### Không nên phụ thuộc default charset

Tránh:

```java
byte[] bytes = text.getBytes();
String decoded = new String(bytes);
```

Hai lệnh trên phụ thuộc default charset của runtime. Java 21 thường dùng UTF-8 làm default charset, nhưng runtime có thể được cấu hình khác; việc ghi rõ charset vẫn giúp contract của ứng dụng minh bạch và tránh phụ thuộc môi trường giữa máy developer, container và production.

Ưu tiên:

```java
byte[] bytes = text.getBytes(StandardCharsets.UTF_8);
String decoded = new String(bytes, StandardCharsets.UTF_8);
```

Khi dùng file API, chỉ rõ charset khi overload cho phép:

```java
String content = java.nio.file.Files.readString(
        java.nio.file.Path.of("data.txt"),
        StandardCharsets.UTF_8
);
```

UTF-8 là lựa chọn phổ biến cho REST API, JSON và file text. HTTP vẫn cần header/content negotiation đúng, ví dụ `Content-Type` và charset phù hợp với giao thức.

### UTF-8 không phải URL encoding

UTF-8 là character encoding. URL encoding là cơ chế encode dữ liệu thành dạng phù hợp trong URL/query parameter.

Không nên dùng `URLEncoder` để thay thế việc encode text sang UTF-8 hoặc ngược lại. Mỗi lớp có mục đích khác nhau:

- String ↔ bytes: charset như UTF-8.
- Query parameter: URL encoding.
- JSON: JSON serializer.
- HTML: HTML escaping.
- SQL: prepared statement/parameter binding.

## 9.12. Regular Expressions cơ bản

Regular expression là pattern mô tả tập chuỗi. Java cung cấp:

- `Pattern`: compiled representation của regex.
- `Matcher`: engine áp dụng pattern lên input.
- String methods như `matches`, `replaceAll`, `split` dùng regex ở bên trong.

### `matches()` khác `find()`

`String.matches` kiểm tra toàn bộ chuỗi có match pattern hay không:

```java
System.out.println("12345".matches("\\d+"));
System.out.println("id=12345".matches("\\d+"));
```

Kết quả:

```text
true
false
```

Nếu muốn tìm một đoạn khớp bên trong chuỗi, dùng `Matcher.find`:

```java
var pattern = java.util.regex.Pattern.compile("\\d+");
var matcher = pattern.matcher("order-123-status-200");

while (matcher.find()) {
    System.out.println(matcher.group());
}
```

Kết quả:

```text
123
200
```

Đây là một nhầm lẫn phổ biến: `matches` không có nghĩa “chứa một đoạn khớp”; nó yêu cầu toàn bộ input phù hợp.

### Groups và named groups

```java
var pattern = java.util.regex.Pattern.compile(
        "order-(?<id>\\d+)-(?<status>[a-z]+)"
);

var matcher = pattern.matcher("order-42-paid");

if (matcher.matches()) {
    System.out.println(matcher.group("id"));
    System.out.println(matcher.group("status"));
}
```

Kết quả:

```text
42
paid
```

Named group giúp code dễ đọc hơn group index khi regex có nhiều phần.

### Precompile pattern trong code lặp lại

Không nên compile cùng một regex trong mỗi request hoặc mỗi iteration nếu pattern cố định:

```java
private static final java.util.regex.Pattern USERNAME =
        java.util.regex.Pattern.compile("[a-z][a-z0-9_]{2,19}");
```

Sau đó tái sử dụng:

```java
boolean valid = USERNAME.matcher(input).matches();
```

`Pattern` là immutable và có thể được chia sẻ; `Matcher` mang state của một lần match nên tạo matcher mới cho input/lần xử lý tương ứng.

### Quote input không phải regex

Nếu giá trị pattern đến từ user và mục tiêu là tìm literal, dùng:

```java
String userInput = "a+b";
String regexLiteral = java.util.regex.Pattern.quote(userInput);

boolean found = java.util.regex.Pattern
        .compile(regexLiteral)
        .matcher("x a+b y")
        .find();
```

### Regex và bảo mật

Regex mạnh nhưng không phải lúc nào cũng là lựa chọn tốt:

- Pattern phức tạp có thể gây backtracking lớn.
- Input dài không giới hạn có thể dẫn đến ReDoS.
- Regex email đầy đủ thường khó bảo trì và không bảo đảm email tồn tại.
- Regex không thay thế parser cho JSON, XML, CSV hoặc SQL.
- Cần giới hạn độ dài input và viết test cho worst-case.

Trong backend public-facing, hãy đánh giá regex như một phần của attack surface, không chỉ như một tiện ích validate.

## 9.13. String trong các tình huống Backend thực tế

### Chuẩn hóa input request

Một helper đơn giản:

```java
static String requireNonBlank(String value, String fieldName) {
    if (value == null || value.isBlank()) {
        throw new IllegalArgumentException(
                fieldName + " must not be blank"
        );
    }
    return value.strip();
}
```

Có thể dùng cho username, mã đơn hàng hoặc query parameter. Tuy nhiên, quy tắc normalize phải thuộc domain: mã có phân biệt hoa thường không, whitespace bên trong có hợp lệ không, Unicode normalization có cần không.

### Tạo mã định danh hiển thị

```java
static String orderCode(long id) {
    return String.format(
            java.util.Locale.ROOT,
            "ORD-%08d",
            id
    );
}
```

Kết quả với id 42 là `ORD-00000042`.

Đây là presentation identifier, không nên nhầm với database primary key hoặc secret token.

### Xây query động

Không nên nối user input trực tiếp vào SQL:

```java
String sql = "SELECT * FROM users WHERE name = '" + userInput + "'";
```

Cách này có thể tạo SQL injection. Hãy dùng prepared statement hoặc cơ chế parameter binding của framework/database driver.

String API chỉ giải quyết việc xử lý text; nó không cung cấp cơ chế an toàn cho ngữ cảnh SQL.

### Log và dữ liệu nhạy cảm

Có thể dùng String để tạo log có cấu trúc, nhưng không nên ghi password, access token, refresh token hoặc dữ liệu cá nhân nhạy cảm vào log.

```java
String logMessage = String.format(
        java.util.Locale.ROOT,
        "userId=%d action=%s",
        userId,
        action
);
```

Trong hệ thống lớn, structured logging và parameterized logging thường phù hợp hơn việc nối một chuỗi lớn thủ công.

### Tạo response text

`StringBuilder` có thể phù hợp cho text đơn giản:

```java
StringBuilder response = new StringBuilder();

response.append("status=OK\n");
response.append("items=").append(itemCount).append('\n');
response.append("requestId=").append(requestId);

return response.toString();
```

Nếu response là JSON, hãy dùng JSON serializer để xử lý quote, escape, null và nested object chính xác.

## 9.14. Các lỗi thường gặp

### Dùng `==` để so sánh nội dung

```java
if (status == "ACTIVE") {
    // Không nên
}
```

Dùng:

```java
if ("ACTIVE".equals(status)) {
    // Null-safe cho status
}
```

### Gọi method trên input có thể null

```java
input.strip();
```

Nếu input đến từ HTTP request hoặc database nullable, có thể gây `NullPointerException`. Hãy xác định contract null trước khi gọi method.

### Nhầm `isEmpty` với `isBlank`

```java
"   ".isEmpty(); // false
"   ".isBlank(); // true
```

Chọn method theo business rule, không theo thói quen.

### Dùng `trim` cho mọi dữ liệu Unicode

`trim` và `strip` không hoàn toàn giống nhau. Với dữ liệu đa ngôn ngữ, hãy hiểu loại whitespace cần xử lý.

### Dùng `split` để parse dữ liệu có grammar

CSV có quote, escaped delimiter và newline không nên parse bằng một `split(",")` đơn giản.

### Dùng regex để thay thế parser

Regex phù hợp cho pattern cục bộ. JSON/XML/SQL/CSV cần parser hoặc API chuyên dụng.

### Dùng StringBuilder như shared field

Một `StringBuilder` là mutable state. Đặt nó trong singleton service rồi dùng cho nhiều request có thể gây race condition và dữ liệu bị trộn.

### Nối secret vào log hoặc exception

Chuỗi được đưa vào log có thể tồn tại lâu hơn dự kiến ở file log, collector hoặc hệ thống observability. Luôn phân loại dữ liệu trước khi format.

### Cắt Unicode bằng char index mà không kiểm tra

`charAt` và index của String làm việc theo UTF-16 code units. Với emoji hoặc supplementary character, hãy cân nhắc code point API.

## 9.15. Câu hỏi phỏng vấn tự kiểm tra

1. Vì sao `String` immutable?
2. `String Pool` hoạt động như thế nào?
3. Vì sao `"Java" == new String("Java")` thường là `false`?
4. Khi nào dùng `StringBuilder` thay vì `String`?
5. `StringBuilder` và `StringBuffer` khác nhau thế nào?
6. `==` và `equals()` khác nhau ra sao?
7. Vì sao `"ACTIVE".equals(value)` an toàn hơn `value.equals("ACTIVE")` khi value có thể null?
8. `isEmpty()` và `isBlank()` khác nhau thế nào?
9. `String.length()` có luôn bằng số ký tự người dùng nhìn thấy không?
10. UTF-8 khác UTF-16 ở lớp nào?
11. Vì sao nên truyền `StandardCharsets.UTF_8` thay vì dùng default charset?
12. `replace()` khác `replaceAll()` như thế nào?
13. `String.matches()` khác `Matcher.find()` ra sao?
14. Vì sao không nên dùng `split(",")` để parse CSV tổng quát?
15. Vì sao regex có thể trở thành rủi ro ReDoS?
16. Làm thế nào để tạo một chuỗi danh sách có delimiter mà không bị delimiter dư ở cuối?
17. Vì sao không nên nối user input trực tiếp vào SQL?
18. Vì sao không nên dùng một `StringBuilder` dùng chung cho nhiều HTTP requests?

## 9.16. Tóm tắt Chương 9

- `String` là immutable reference type và dùng UTF-16 code units trong Java API.
- `==` so sánh identity; `equals` so sánh nội dung.
- `String Pool` giúp tái sử dụng interned strings nhưng không làm `==` trở thành phép so sánh nội dung.
- `StringBuilder` phù hợp cho mutable string building trong một thread.
- `StringBuffer` có synchronized operations nhưng không biến chuỗi nghiệp vụ nhiều bước thành atomic.
- `length` và index của String liên quan đến UTF-16 code units, không luôn là số Unicode characters người dùng nhìn thấy.
- Dùng `isBlank` cho whitespace-aware validation; phân biệt với `isEmpty` và null.
- `replace` là literal replacement; `replaceAll` và `split` dùng regex.
- Luôn chỉ rõ charset khi chuyển String ↔ byte[].
- Dùng `String.join`, `Collectors.joining` và `String.format` theo đúng mục đích.
- Không dùng String API để thay thế prepared statement, JSON/CSV parser hoặc HTML escaping.
- Với input từ bên ngoài, cần quan tâm null, độ dài, Unicode, regex complexity và dữ liệu nhạy cảm.

## 9.17. Tài liệu tham khảo chính thức

- [java.lang.String — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/String.html)
- [java.lang.StringBuilder — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuilder.html)
- [java.lang.StringBuffer — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/StringBuffer.html)
- [java.nio.charset.StandardCharsets — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/StandardCharsets.html)
- [java.nio.charset.Charset — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/charset/Charset.html)
- [java.util.regex package — Java SE 21 API](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/regex/package-summary.html)

> Phần 3 hiện đã được mở rộng chi tiết ở Chương 9. Các chương Wrapper Classes, Math/Numbers/Utilities và Date & Time API sẽ được bổ sung tiếp theo nội dung tương ứng.
