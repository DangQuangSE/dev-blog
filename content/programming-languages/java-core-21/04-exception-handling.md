# JAVA CORE 21 — PHẦN 4: EXCEPTION HANDLING

Giáo trình lý thuyết chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Exception Handling là một trong những kiến thức nền tảng quan trọng của Java. Đối với Backend Developer, đây không đơn thuần là việc sử dụng `try-catch` để chương trình không bị dừng, mà là khả năng phát hiện, phân loại, xử lý và truyền đạt lỗi chính xác giữa các tầng của ứng dụng.

Ví dụ trong một ứng dụng Spring Boot, bạn có thể gặp:

- Người dùng gửi dữ liệu không hợp lệ.
- Không tìm thấy một tài nguyên.
- Database không phản hồi.
- Một HTTP request đến dịch vụ bên ngoài bị timeout.
- File được yêu cầu không tồn tại.
- Một giao dịch thanh toán thất bại.

Những trường hợp này không nên được xử lý giống hệt nhau.

## Nội dung Phần 4

| Mục         | Chủ đề                                                                      |
| ----------- | --------------------------------------------------------------------------- |
| 13.1–13.5   | Exception, Error, Throwable Hierarchy, Checked và Unchecked Exceptions      |
| 13.6–13.11  | try, catch, finally, multi-catch và luồng thực thi                          |
| 13.12–13.17 | throw, throws, exception propagation, chaining, stack trace                 |
| 13.18–13.22 | Try-with-Resources, AutoCloseable, suppressed exceptions, custom exceptions |
| 13.23–13.28 | Common Exceptions, best practices, Backend architecture, Java 21            |
| Tổng kết    | Ví dụ thực tế, bài tập và câu hỏi phỏng vấn                                 |

# CHƯƠNG 13. EXCEPTIONS & ERROR HANDLING

## 13.1. Exception là gì?

Exception là một sự kiện bất thường được biểu diễn bằng một object thuộc hierarchy `Throwable`, làm gián đoạn luồng thực thi bình thường khi được ném (thrown).

Ví dụ:

```java
public class Main {

    public static void main(String[] args) {

        int a = 10;
        int b = 0;

        int result = a / b;

        System.out.println(result);
    }
}
```

Khi chạy:

```text
Exception in thread "main"
java.lang.ArithmeticException: / by zero
```

Chương trình đang thực hiện phép chia số nguyên cho 0. Java phát sinh một `ArithmeticException`.

Câu lệnh:

```java
System.out.println(result);
```

không được thực thi, bởi exception đã làm gián đoạn luồng thực thi bình thường và không được xử lý.

### Exception có phải luôn là một bug không?

Không.

Exception có thể xuất hiện do:

- Lỗi lập trình, chẳng hạn truy cập sai index.
- Dữ liệu đầu vào không hợp lệ.
- Tài nguyên bên ngoài không tồn tại.
- Network bị ngắt.
- Tác vụ bị hủy hoặc gián đoạn.
- Một điều kiện nghiệp vụ không được đáp ứng.

Tuy nhiên, không phải mọi kết quả thất bại đều cần được biểu diễn bằng exception.

Ví dụ, khi tìm kiếm một sản phẩm không tồn tại, tùy contract của phương thức, bạn có thể dùng `Optional.empty()` thay vì ném exception.

### Exception Handling là gì?

Exception Handling là cơ chế cho phép chương trình xử lý những tình huống bất thường bằng các cấu trúc như:

```text
try
catch
finally
throw
throws
```

Nó giúp:

1. Ngăn lỗi lan truyền không kiểm soát khi có cách xử lý phù hợp.
2. Phân loại từng loại lỗi.
3. Giải phóng tài nguyên.
4. Truyền lỗi đến nơi có đủ thông tin để xử lý.
5. Cung cấp thông tin phục vụ debugging.
6. Giữ các lớp phần mềm có trách nhiệm rõ ràng.

## 13.2. Luồng thực thi khi xảy ra Exception

Xét:

```java
public class Main {

    public static void main(String[] args) {

        System.out.println("Step 1");

        int result = 10 / 0;

        System.out.println("Step 2");
    }
}
```

Kết quả:

```text
Step 1
Exception in thread "main" java.lang.ArithmeticException: / by zero
```

`Step 2` không được in ra.

### Sơ đồ Exception Flow

Bắt đầu thực thi

`System.out.println("Step 1")`

`10 / 0`

`ArithmeticException` được ném

JVM tìm exception handler phù hợp

Tại method hiện tại hoặc các caller trên call stack

Có handler

Thực thi `catch` phù hợp và tiếp tục từ vị trí sau cấu trúc xử lý nếu hoàn thành bình thường

Không có handler

Exception tiếp tục lan truyền; thread có thể kết thúc do uncaught exception

Điểm quan trọng là Exception Handling không quay lại chạy câu lệnh gây lỗi.

Ví dụ:

```java
try {
    System.out.println("A");
    int result = 10 / 0;
    System.out.println("B");
} catch (ArithmeticException e) {
    System.out.println("C");
}

System.out.println("D");
```

Kết quả:

```text
A
C
D
```

Dòng `"B"` bị bỏ qua.

Sau khi `catch` hoàn thành bình thường, chương trình tiếp tục từ câu lệnh sau cấu trúc `try-catch`.

## 13.3. Throwable Hierarchy

Mọi object được ném bằng `throw` trong Java phải có kiểu tương thích với `Throwable`.

Hierarchy cơ bản:

```text
Throwable

Error

OutOfMemoryError

StackOverflowError

LinkageError

AssertionError

Exception

IOException

SQLException

ClassNotFoundException

RuntimeException

NullPointerException

IllegalArgumentException

IndexOutOfBoundsException
```

`RuntimeException` kế thừa `Exception`. `Error` và `RuntimeException` (cùng các subclass của chúng) thuộc nhóm unchecked exceptions.

### Throwable

`Throwable` là superclass của `Exception` và `Error`.

Một số methods quan trọng:

```java
getMessage()
getCause()
getStackTrace()
printStackTrace()
addSuppressed()
getSuppressed()
```

Ví dụ:

```java
try {
    int result = 10 / 0;
} catch (ArithmeticException e) {

    System.out.println(e.getMessage());

    System.out.println(e.getClass().getName());
}
```

Kết quả:

```text
/by zero
java.lang.ArithmeticException
```

### Exception

`Exception` là nhóm được sử dụng để biểu diễn nhiều điều kiện bất thường mà ứng dụng có thể muốn phát hiện và xử lý.

Ví dụ:

```text
IOException
SQLException
ParseException
InterruptedException
```

### RuntimeException

`RuntimeException` là subclass của `Exception`.

Các subclasses của `RuntimeException` là unchecked exceptions.

Ví dụ:

```text
NullPointerException
IllegalArgumentException
IllegalStateException
NumberFormatException
```

### Error

`Error` thường được sử dụng cho những vấn đề nghiêm trọng ở môi trường runtime hoặc những điều kiện mà ứng dụng thông thường không được kỳ vọng có khả năng phục hồi một cách hợp lý.

Ví dụ:

```text
OutOfMemoryError
StackOverflowError
LinkageError
```

Tuy nhiên, nói rằng mọi `Error` đều tuyệt đối không thể catch là sai. Java cho phép catch `Error`, nhưng việc xử lý các tình huống đó đòi hỏi lý do rất cụ thể.

## 13.4. Checked Exceptions

Checked Exception là một exception class mà không thuộc `RuntimeException` hoặc `Error` hierarchy.

Compiler áp dụng quy tắc kiểm tra đối với checked exceptions.

Nếu một method có thể ném checked exception theo các quy tắc Java, lập trình viên thường phải:

- Catch exception đó.
- Hoặc khai báo exception phù hợp trong `throws`.

### Ví dụ với IOException

```java
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {

    public static void main(String[] args) {

        String content = Files.readString(
            Path.of("data.txt")
        );

        System.out.println(content);
    }
}
```

Đoạn code này không compile nếu không xử lý hoặc khai báo `IOException`.

Vì `Files.readString()` khai báo checked exception này.

### Cách 1: Catch Exception

```java
try {

    String content = Files.readString(
        Path.of("data.txt")
    );

    System.out.println(content);

} catch (IOException e) {

    System.out.println("Cannot read file");
}
```

### Cách 2: Declare throws

```java
public static void main(String[] args)
        throws IOException {

    String content = Files.readString(
        Path.of("data.txt")
    );

    System.out.println(content);
}
```

Điểm quan trọng:

`throws IOException` không xử lý lỗi. Nó khai báo khả năng exception được truyền ra khỏi method.

### Tại sao Java có Checked Exceptions?

Checked exceptions giúp compiler buộc code xem xét các tình huống thất bại được API công khai.

Chẳng hạn:

- File không tồn tại.
- File không thể đọc.
- Network I/O thất bại.
- Thread đang chờ bị interrupt.

Nhưng checked exceptions cũng có nhược điểm:

- Làm method signatures phức tạp hơn.
- Có thể khiến exceptions bị wrap nhiều tầng.
- Không phải lúc nào caller cũng có khả năng phục hồi.
- Có thể gây khó khăn với functional interfaces không khai báo checked exceptions.

## 13.5. Unchecked Exceptions

Unchecked exceptions là `RuntimeException`, `Error` và các subclasses của chúng.

Compiler không bắt buộc lập trình viên phải catch hoặc khai báo chúng trong `throws`.

Ví dụ:

```java
int result = 10 / 0;
```

Không có compile-time error vì thiếu `catch`.

Nhưng tại runtime:

```text
ArithmeticException
```

### Những unchecked exceptions phổ biến

| Exception                       | Nguyên nhân điển hình                    |
| ------------------------------- | ---------------------------------------- |
| `NullPointerException`          | Truy cập object thông qua null reference |
| `IllegalArgumentException`      | Argument không hợp lệ                    |
| `IllegalStateException`         | Object đang ở trạng thái không phù hợp   |
| `NumberFormatException`         | Không thể parse chuỗi thành số           |
| `IndexOutOfBoundsException`     | Index ngoài phạm vi                      |
| `ClassCastException`            | Ép kiểu reference không hợp lệ           |
| `UnsupportedOperationException` | Operation không được hỗ trợ              |
| `ArithmeticException`           | Một số phép toán số học không hợp lệ     |

### Checked vs Unchecked

| Tiêu chí                         | Checked                                                 | Unchecked                                            |
| -------------------------------- | ------------------------------------------------------- | ---------------------------------------------------- |
| Hierarchy                        | Throwable subclasses ngoài RuntimeException/Error       | RuntimeException/Error và subclasses                 |
| Compiler bắt buộc xử lý/khai báo | Có, theo quy tắc                                        | Không                                                |
| Ví dụ                            | IOException                                             | IllegalArgumentException                             |
| Có thể xảy ra tại runtime        | Có                                                      | Có                                                   |
| Có thể catch                     | Có                                                      | Có                                                   |
| Thường dùng                      | Một số lỗi I/O và các điều kiện API muốn caller xem xét | Lỗi programming contract, state hoặc domain failures |

### Có phải Checked luôn là lỗi bên ngoài, Unchecked luôn là lỗi lập trình?

Không.

Đây chỉ là một cách phân biệt gần đúng.

Ví dụ, một hệ thống Backend có thể sử dụng custom `RuntimeException` cho nghiệp vụ:

```java
public class InsufficientBalanceException
        extends RuntimeException {
}
```

Thiếu số dư là một tình huống nghiệp vụ có thể dự đoán, không nhất thiết là lỗi lập trình.

Loại exception không tự động quyết định lỗi đó có thể phục hồi hay không. Điều này phụ thuộc vào contract và ngữ cảnh ứng dụng.

# 13.6. try Statement

`try` xác định vùng code mà bạn muốn theo dõi và xử lý exceptions phát sinh trong quá trình thực thi.

Cú pháp cơ bản:

```java
try {
    // Code có thể ném exception
} catch (ExceptionType e) {
    // Xử lý exception
}
```

Ví dụ:

```java
public class Main {

    public static void main(String[] args) {

        try {
            int number = Integer.parseInt("abc");

            System.out.println(number);

        } catch (NumberFormatException e) {

            System.out.println("Invalid number");
        }
    }
}
```

Kết quả:

```text
Invalid number
```

### Cơ chế hoạt động

Khi Java thực thi `try`:

1. Thực thi lần lượt các statements.
2. Nếu không có exception, bỏ qua các `catch`.
3. Nếu có exception, dừng phần thực thi còn lại của `try`.
4. Tìm catch clause phù hợp với object exception.
5. Thực thi catch body tương ứng.
6. Nếu catch hoàn thành bình thường, tiếp tục sau cấu trúc xử lý.

### try không nhất thiết phải có catch?

Đúng.

Java cho phép `try-finally`:

```java
try {
    System.out.println("Processing");
} finally {
    System.out.println("Cleanup");
}
```

Và `try-with-resources` cũng có thể không cần `catch` hoặc `finally` tường minh:

```java
try (var reader = Files.newBufferedReader(path)) {
    System.out.println(reader.readLine());
}
```

## 13.7. catch Statement

`catch` được dùng để bắt và xử lý exceptions phù hợp.

Ví dụ:

```java
try {

    int[] numbers = {1, 2, 3};

    System.out.println(numbers[10]);

} catch (ArrayIndexOutOfBoundsException e) {

    System.out.println("Invalid array index");
}
```

Kết quả:

```text
Invalid array index
```

### Exception Parameter

Trong:

```java
catch (ArrayIndexOutOfBoundsException e)
```

`e` là một biến tham chiếu đến exception object đang được xử lý.

Bạn có thể đọc thông tin:

```java
e.getMessage();
e.getCause();
e.getStackTrace();
```

### Có nên catch Exception?

Ví dụ:

```java
try {
    process();
} catch (Exception e) {
    System.out.println("Something went wrong");
}
```

Đoạn code hợp lệ, nhưng nếu sử dụng thiếu cân nhắc có thể dẫn đến vấn đề:

- Bắt quá nhiều loại lỗi khác nhau.
- Không phân biệt lỗi có thể phục hồi.
- Làm mất thông tin nguyên nhân.
- Vô tình che giấu bug.
- Khó tìm vị trí lỗi trong production.

Nên ưu tiên bắt exception cụ thể khi có thể.

Ví dụ:

```java
try {
    int age = Integer.parseInt(input);
} catch (NumberFormatException e) {
    System.out.println("Age must be an integer");
}
```

Ở một số ranh giới của ứng dụng, chẳng hạn global exception handler, việc catch tổng quát hơn có thể phù hợp. Tuy nhiên, cần ghi log, bảo toàn thông tin cần thiết và xây dựng chính sách phản hồi lỗi.

## 13.8. Multiple Catch Blocks

Một `try` có thể đi kèm nhiều `catch`.

Ví dụ:

```java
public static void process(String input) {

    try {

        int index = Integer.parseInt(input);

        int[] values = {10, 20, 30};

        System.out.println(values[index]);

    } catch (NumberFormatException e) {

        System.out.println("Input is not a number");

    } catch (ArrayIndexOutOfBoundsException e) {

        System.out.println("Invalid index");
    }
}
```

Nếu:

```java
process("abc");
```

Kết quả:

```text
Input is not a number
```

Nếu:

```java
process("10");
```

Kết quả:

```text
Invalid index
```

### Java chọn catch nào?

Java kiểm tra các catch clauses theo thứ tự khai báo.

Catch đầu tiên tương thích với exception type sẽ được chọn.

### Quy tắc Specific trước General

Ví dụ sai:

```java
try {
    process();

} catch (Exception e) {

    System.out.println("General error");

} catch (NumberFormatException e) {

    System.out.println("Invalid number");
}
```

Không compile.

Vì `NumberFormatException` là subtype của `Exception`.

Khi catch `Exception` đứng trước, catch phía sau không thể được chọn.

Cách đúng:

```java
try {
    process();

} catch (NumberFormatException e) {

    System.out.println("Invalid number");

} catch (Exception e) {

    System.out.println("General error");
}
```

## 13.9. Multi-catch

Từ Java 7, Java hỗ trợ bắt nhiều exception types trong cùng một catch clause.

Cú pháp:

```java
catch (ExceptionTypeA | ExceptionTypeB e)
```

Ví dụ:

```java
try {

    String[] values = {"10", "20"};

    int index = Integer.parseInt(input);

    System.out.println(values[index]);

} catch (
    NumberFormatException |
    ArrayIndexOutOfBoundsException e
) {
```

Multi-catch hữu ích khi nhiều loại exception được xử lý giống nhau.

### Không được dùng các kiểu có quan hệ kế thừa trực tiếp trong cùng multi-catch

Ví dụ:

Không hợp lệ vì `NumberFormatException` là subtype của `RuntimeException`.

Việc liệt kê cả hai là dư thừa và Java không cho phép trường hợp này.

### Exception Variable trong Multi-catch

Biến exception của multi-catch được xem là implicitly final.

Ví dụ:

Không hợp lệ.

## 13.10. finally Block

`finally` là block thường được sử dụng để thực hiện cleanup, bất kể `try` hoàn thành bình thường hay đột ngột.

Ví dụ:

Kết quả:

Nếu `try` ném exception và catch phù hợp:

Kết quả:

### finally có luôn được thực thi không?

Không tuyệt đối.

Những trường hợp `finally` có thể không chạy gồm:

- JVM hoặc process kết thúc đột ngột.
- `System.exit()` kết thúc JVM trước khi thực thi `finally`.
- Process bị kill bởi hệ điều hành.
- Mất điện hoặc runtime bị crash.

Ngoài ra, nếu thread bị kẹt vĩnh viễn trong `try`, execution có thể không bao giờ đi đến `finally`.

Vì vậy, phát biểu chính xác là: finally thường được thực thi khi control rời khỏi try/catch theo các quy tắc điều khiển của Java, không phải một bảo đảm tuyệt đối trong mọi điều kiện hệ thống.

## 13.11. finally và return

Đây là câu hỏi phỏng vấn thường gặp.

Xét:

Kết quả:

### Tại sao?

Khi gặp `return 10`, Java chuẩn bị kết quả trả về.

Trước khi method hoàn thành, `finally` được thực thi.

Sau đó method trả kết quả đã được xác định nếu `finally` hoàn thành bình thường.

### Bẫy: return bên trong finally

Kết quả:

Vì `finally` hoàn thành đột ngột bằng `return 20`, làm thay thế completion trước đó.

Điều này cực kỳ nguy hiểm khi đang có exception.

Ví dụ:

Method trả `20`, còn exception ban đầu bị che khuất.

Best Practice: Không nên viết `return`, `break`, `continue` hoặc ném exception mới một cách thiếu kiểm soát trong finally, vì điều đó có thể làm mất luồng hoàn thành hoặc lỗi gốc.

### finally cũng có thể ném exception

Exception được truyền ra ngoài là `IllegalStateException`, còn lỗi ban đầu có thể bị mất khỏi luồng exception thông thường.

Đây cũng là một trong những lý do nên sử dụng try-with-resources cho resource management.

# 13.12. throw Keyword

`throw` dùng để chủ động ném một exception object.

Cú pháp:

Ví dụ:

Gọi:

Sẽ ném:

### Khi nào nên chủ động throw exception?

Một số trường hợp:

- Argument vi phạm contract.
- Trạng thái object không hợp lệ.
- Business invariant bị vi phạm.
- Resource không tồn tại trong operation bắt buộc.
- Một operation không thể hoàn thành đúng contract.

Ví dụ:

Trong ví dụ, `InsufficientBalanceException` là custom exception cần được định nghĩa.

### throw có bắt buộc new object không?

Không.

Bạn có thể ném một existing Throwable reference:

Bạn cũng có thể rethrow:

Nhưng nếu `throw` một null reference, Java sẽ ném `NullPointerException`.

## 13.13. throws Keyword

`throws` được khai báo trong method hoặc constructor declaration nhằm chỉ ra những exception types có thể được truyền ra ngoài.

Ví dụ:

Method không xử lý `IOException` mà cho phép caller chịu trách nhiệm.

Caller:

### Một method có thể khai báo nhiều exception types

### Unchecked exceptions có thể khai báo trong throws không?

Có.

Ví dụ:

Nhưng compiler không bắt buộc phải khai báo unchecked exceptions.

Việc khai báo có thể hữu ích khi muốn làm rõ contract, nhưng đôi khi JavaDoc `@throws` sẽ phù hợp hơn.

## 13.14. throw vs throws

| Tiêu chí           | `throw`                     | `throws`                                 |
| ------------------ | --------------------------- | ---------------------------------------- |
| Vị trí             | Trong method/block          | Trong method/constructor declaration     |
| Chức năng          | Ném một exception object    | Khai báo exception có thể được truyền ra |
| Đối tượng theo sau | Throwable expression        | Exception types                          |
| Runtime behavior   | Làm thay đổi luồng thực thi | Không tự ném exception                   |
| Ví dụ              | `throw new IOException()`   | `throws IOException`                     |

> Trạng thái: Đã cập nhật theo nội dung đã nhận; phần tiếp theo sẽ được bổ sung khi có tài liệu mới.
