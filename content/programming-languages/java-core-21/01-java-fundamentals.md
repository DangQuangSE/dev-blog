# Java Core 21 — Phần 1: Java Fundamentals

> Giáo trình lý thuyết chuyên sâu · Java SE 21 · Beginner → Junior Backend Developer

Java không chỉ là một tập hợp cú pháp để in ra `Hello World`. Để viết và debug backend tốt, cần hiểu đoạn code đi qua những lớp nào trước khi được CPU thực thi, dữ liệu được biểu diễn ra sao, biến sống trong phạm vi nào và vì sao cùng một biểu thức có thể cho kết quả khác nhau khi kiểu dữ liệu thay đổi.

Phần 1 xây dựng nền tảng Java SE 21 theo hướng thực hành backend và phỏng vấn kỹ thuật. Nội dung tập trung vào năm nhóm kiến thức:

1. Java, JDK, JRE, JVM và vòng đời thực thi chương trình.
2. Variables, data types và mô hình bộ nhớ khái niệm.
3. Operators, quy tắc chuyển kiểu và thứ tự đánh giá biểu thức.
4. Control flow, `switch` expressions và pattern matching trong Java 21.
5. Arrays và các thao tác sắp xếp, tìm kiếm thường dùng.

Phần này chưa đi vào OOP chuyên sâu, Collections, Generics, Exception Handling, Concurrency hay Spring Boot. Đây sẽ là các phần tiếp theo của series.

## Mục tiêu sau khi hoàn thành

Bạn nên có khả năng:

- phân biệt chính xác `JDK`, `JRE`, `JVM`, bytecode, interpreter và JIT;
- giải thích được quá trình từ file `.java` đến mã máy;
- phân biệt local variable, instance variable, static variable, primitive và reference;
- dự đoán kết quả của phép ép kiểu, phép chia nguyên, overflow và toán tử `==`;
- lựa chọn `if`, `switch`, `switch expression` và loại vòng lặp phù hợp;
- tạo, duyệt, sao chép, sắp xếp và tìm kiếm trong mảng;
- nhận diện những lỗi nền tảng như `NullPointerException`, `ArrayIndexOutOfBoundsException`, `ClassCastException` và `ArithmeticException`;
- trả lời các câu hỏi Java Fundamentals thường gặp trong phỏng vấn junior backend.

## Quy ước khi đọc

Trong bài, từ “Java 21” thường chỉ bộ công cụ và nền tảng Java SE 21. Một số chi tiết như JIT compiler, cách cấp phát object hay GC algorithm phụ thuộc JVM implementation, đặc biệt là HotSpot. Vì vậy, các sơ đồ Stack/Heap dùng để xây dựng mô hình tư duy, không phải cam kết rằng mọi biến luôn nằm đúng tại một vùng RAM vật lý.

# Chương 1. Introduction to Java

## 1.1. Java là gì?

Java là một ngôn ngữ lập trình cấp cao (`High-level Programming Language`), kiểu tĩnh (`Statically Typed`), dựa trên class (`Class-based`), hỗ trợ lập trình hướng đối tượng (`Object-Oriented Programming`) và hướng tới khả năng chạy trên nhiều nền tảng (`Platform Independent`).

Java được James Gosling cùng các cộng sự phát triển tại Sun Microsystems và phát hành chính thức năm 1995. Sau khi Oracle mua lại Sun Microsystems, Oracle trở thành một trong những đơn vị quan trọng duy trì và phát triển nền tảng Java.

Java được dùng rộng rãi trong:

- **Backend Development:** REST API, thương mại điện tử, ngân hàng và hệ thống quản trị doanh nghiệp.
- **Enterprise Applications:** hệ thống nghiệp vụ lớn cần độ ổn định, bảo mật và khả năng mở rộng.
- **Distributed Systems:** các dịch vụ giao tiếp qua mạng và xử lý dữ liệu phân tán.
- **Cloud Applications:** ứng dụng đóng gói, triển khai và quan sát trên cloud.
- **Big Data:** nhiều thành phần trong hệ sinh thái dữ liệu lớn chạy trên JVM.
- **Android Development:** Java vẫn được hỗ trợ, dù Kotlin được ưu tiên trong nhiều dự án Android hiện đại.

### Các đặc điểm quan trọng

| Đặc điểm | Ý nghĩa |
| --- | --- |
| `Simple` | Cú pháp tương đối rõ ràng và loại bỏ nhiều đặc điểm phức tạp của C++. |
| `Object-Oriented` | Hỗ trợ tổ chức mã nguồn bằng class, object, interface và các cơ chế OOP. |
| `Platform Independent` | Bytecode có thể chạy trên các JVM tương thích. |
| `Statically Typed` | Compiler kiểm tra phần lớn quy tắc kiểu tại compile time. |
| `Robust` | Có kiểm tra kiểu, exception handling và quản lý bộ nhớ tự động. |
| `Secure` | Có kiểm tra bytecode, access control và các API bảo mật. |
| `Multithreaded` | Hỗ trợ nhiều thread và các API concurrency. |
| `High Performance` | JVM có interpreter, JIT và nhiều tối ưu hóa runtime. |
| `Portable` | Quy tắc ngôn ngữ, API và kiểu dữ liệu được chuẩn hóa. |
| `Automatic Memory Management` | Garbage Collector thu hồi object không còn reachable. |

### Java có phải ngôn ngữ thuần hướng đối tượng?

Không hoàn toàn.

Java có tám kiểu dữ liệu nguyên thủy (`primitive data types`) như `int`, `double` và `boolean`. Những kiểu này không phải object:

```java
int age = 22;
double salary = 15_000_000.0;
boolean active = true;
```

Ngoài ra, Java có `static`, cho phép truy cập field hoặc method thuộc class mà không cần tạo object của class đó.

Vì vậy, cách mô tả chính xác hơn là: Java hỗ trợ mạnh lập trình hướng đối tượng, nhưng không phải mọi giá trị trong Java đều là object.

### Vì sao Java phù hợp với backend?

Backend thường phải chạy lâu, xử lý nhiều request, kết nối database, giao tiếp qua mạng và duy trì code trong nhiều năm. Java cung cấp một nền tảng trưởng thành cho các yêu cầu này:

- JVM có runtime ổn định và công cụ quan sát phong phú;
- static typing giúp phát hiện nhiều lỗi trước khi deploy;
- Garbage Collection giảm công việc quản lý heap thủ công;
- hệ sinh thái thư viện, framework, database driver và công cụ build lớn;
- Java có mô hình concurrency, networking và I/O chuẩn trong Java SE.

Java không tự động làm một hệ thống backend tốt. Kiến trúc, truy vấn database, cách quản lý thread, bảo mật và quy trình kiểm thử vẫn phụ thuộc vào thiết kế của lập trình viên.

## 1.2. JDK, JRE và JVM

Ba khái niệm này liên quan với nhau nhưng không đồng nghĩa.

### JVM — Java Virtual Machine

`JVM` là máy ảo Java, chịu trách nhiệm thực thi Java bytecode.

CPU không trực tiếp hiểu câu lệnh Java như:

```java
System.out.println("Hello Java");
```

JVM đảm nhận nhiều nhiệm vụ:

1. Load class cần thiết.
2. Verify bytecode.
3. Quản lý runtime data areas.
4. Thực thi bytecode bằng interpreter và/hoặc mã được JIT biên dịch.
5. Hỗ trợ quản lý thread.
6. Thực hiện Garbage Collection.
7. Quản lý exception trong quá trình chạy.

JVM chỉ là thành phần thực thi. Nó không phải toàn bộ bộ công cụ phát triển Java.

### JRE — Java Runtime Environment

`JRE` là khái niệm chỉ môi trường cần thiết để chạy ứng dụng Java, bao gồm JVM và các thư viện runtime.

Trong các tài liệu cũ, mối quan hệ thường được minh họa như sau:

```text
JDK
└── JRE
    └── JVM
```

Đối với các bản Java hiện đại, đặc biệt Java 21, Oracle không còn phân phối một gói JRE riêng theo cách truyền thống như nhiều tài liệu cũ mô tả. Khi triển khai, bạn thường cài JDK hoặc tạo một runtime image tối giản bằng `jlink`.

Điểm cần nhớ: `JRE` vẫn hữu ích như một khái niệm về runtime environment, nhưng không nên mặc định rằng máy nào cũng có một bộ cài JRE độc lập.

### JDK — Java Development Kit

`JDK` là bộ công cụ phát triển ứng dụng Java. JDK 21 cung cấp runtime cần thiết và nhiều công cụ như:

| Công cụ | Vai trò |
| --- | --- |
| `javac` | Biên dịch source code thành bytecode. |
| `java` | Khởi chạy class, JAR hoặc source file mode. |
| `jar` | Đóng gói và quản lý file JAR. |
| `javadoc` | Sinh tài liệu API từ JavaDoc comments. |
| `javap` | Disassemble và xem thông tin class/bytecode. |
| `jshell` | REPL để thử nghiệm Java tương tác. |
| `jdb` | Debug chương trình Java. |
| `jcmd` | Gửi diagnostic command tới JVM đang chạy. |
| `jstack` | Xem thread stack của JVM. |
| `jmap` | Hỗ trợ quan sát heap trong các tình huống phù hợp. |

### So sánh nhanh

| Thành phần | Mục đích | Có compiler không? |
| --- | --- | --- |
| `JVM` | Thực thi bytecode | Không phải mục đích chính |
| `JRE` | Cung cấp môi trường runtime | Không |
| `JDK` | Phát triển, build, debug và chạy ứng dụng | Có `javac` |

Câu trả lời phỏng vấn ngắn:

> `JDK` là bộ công cụ phát triển, bao gồm các thành phần runtime và compiler. `JRE` là khái niệm về môi trường chạy ứng dụng. `JVM` là máy ảo thực thi bytecode và quản lý runtime.

## 1.3. Cài đặt JDK 21, JAVA_HOME và PATH

Để học đúng Java 21, cần kiểm tra cả runtime và compiler. Cài nhiều JDK trên cùng máy dễ tạo lỗi vì lệnh `java` và `javac` trỏ tới hai phiên bản khác nhau.

### Kiểm tra sau khi cài

```bash
java -version
javac -version
```

Kết quả nên thể hiện version 21, ví dụ `21.x`. Trên Windows, mở PowerShell mới sau khi sửa environment variables để nhận giá trị PATH mới.

### JAVA_HOME và PATH

`JAVA_HOME` nên trỏ tới thư mục cài JDK, không trỏ vào thư mục con `bin`.

Ví dụ trên Windows:

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-21"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
javac -version
```

Thiết lập lâu dài có thể thực hiện trong System Environment Variables. Trên Linux/macOS, có thể khai báo trong shell profile:

```bash
export JAVA_HOME=/path/to/jdk-21
export PATH="$JAVA_HOME/bin:$PATH"
java -version
javac -version
```

Không nên copy nguyên path của một máy sang tài liệu triển khai. Hãy dùng đường dẫn thực tế của môi trường và công cụ quản lý version phù hợp.

## 1.4. Từ source code đến machine code

Một chương trình Java truyền thống đi qua hai giai đoạn chính:

1. **Compilation:** compiler biến source code thành bytecode.
2. **Execution:** JVM load, verify và thực thi bytecode.

Tạo file `HelloWorld.java`:

```java
public class HelloWorld {

    public static void main(String[] args) {
        System.out.println("Hello, Java 21!");
    }
}
```

Biên dịch và chạy:

```bash
javac HelloWorld.java
java HelloWorld
```

`javac` tạo `HelloWorld.class`. File `.class` chứa bytecode, không phải machine code riêng cho Windows, Linux hay macOS.

Mô hình tổng quát:

```text
HelloWorld.java
    │
    │ javac
    ▼
HelloWorld.class
    │
    │ JVM: loading + verification
    ▼
Interpreter ───────────────┐
                           ├──> mã thực thi trên CPU
JIT Compiler ──────────────┘
```

Đây là mô hình đơn giản hóa. HotSpot có thể dùng interpreter trong giai đoạn đầu và JIT biên dịch các đoạn code nóng khi có đủ dữ liệu profiling.

### Source code

Source code là mã do lập trình viên viết bằng ngôn ngữ Java:

```java
int result = 10 + 20;
```

CPU không thực thi trực tiếp dòng văn bản này. Compiler phân tích cú pháp, kiểm tra kiểu và tạo bytecode.

### Bytecode

Bytecode là instruction trung gian được lưu trong file `.class`. Nó được thiết kế để JVM hiểu, không gắn trực tiếp với một instruction set CPU cụ thể.

Ví dụ phương thức:

```java
public static int add(int a, int b) {
    return a + b;
}
```

Xem bytecode:

```bash
javap -c HelloWorld
```

Một output đơn giản có thể chứa:

```text
0: iload_0
1: iload_1
2: iadd
3: ireturn
```

- `iload_0`: đưa local variable kiểu `int` ở vị trí tương ứng lên operand stack;
- `iload_1`: đưa giá trị thứ hai lên operand stack;
- `iadd`: lấy hai `int` trên operand stack và cộng;
- `ireturn`: trả về một `int`.

JVM bytecode dùng mô hình máy ảo dựa trên stack. Đây là lý do instruction thường push dữ liệu lên operand stack, thực hiện phép toán rồi lấy kết quả ra.

## 1.5. Write Once, Run Anywhere

`WORA` là nguyên tắc nổi tiếng của Java: viết và biên dịch source code một lần, sau đó dùng bytecode trên các môi trường có JVM tương thích.

```text
             Application.class
            /        |         \
           /         |          \
 Windows JVM     Linux JVM     macOS JVM
      │               │             │
 Windows CPU      Linux CPU      macOS CPU
```

Java đạt được điều này vì:

- source code được biên dịch thành bytecode chung;
- JVM là lớp trung gian giữa bytecode và hệ điều hành/CPU;
- mỗi nền tảng có một JVM implementation phù hợp.

### WORA có đúng tuyệt đối không?

Không. Bytecode có tính độc lập nền tảng, nhưng ứng dụng vẫn có thể phụ thuộc vào:

- native libraries;
- đường dẫn file của hệ điều hành;
- shell command hoặc process hệ thống;
- cấu hình environment;
- phiên bản Java và class-file version;
- khả năng phần cứng hoặc encoding mặc định.

Ví dụ sau phụ thuộc vào Windows:

```java
String path = "C:\\Users\\Public\\data.txt";
```

Backend nên dùng API chuẩn để giảm phụ thuộc nền tảng:

```java
import java.nio.file.Path;

Path path = Path.of("data", "users.txt");
```

Ngoài ra, cần phân biệt tương thích ngược và tương thích xuôi. JVM mới thường chạy được class file cũ trong phạm vi hỗ trợ, nhưng JVM cũ không thể chạy class file được biên dịch bằng một Java version mới hơn nếu class-file version không tương thích.

## 1.6. JVM Architecture

Ba nhóm thành phần quan trọng khi học JVM là:

1. `Class Loader Subsystem`.
2. `Runtime Data Areas`.
3. `Execution Engine`.

JVM cũng có thể giao tiếp với native code thông qua JNI (`Java Native Interface`).

### ClassLoader là gì?

Class loader tìm và nạp định nghĩa class vào JVM khi class cần được sử dụng.

```java
public class Main {

    public static void main(String[] args) {
        Student student = new Student();
    }
}
```

Trước khi JVM tạo object `Student`, nó phải xử lý định nghĩa của class `Student` và các class liên quan.

#### Loading

JVM tìm bytecode từ các nguồn như:

- file `.class`;
- class path;
- file JAR;
- module path;
- custom source do custom `ClassLoader` cung cấp.

Sau đó JVM tạo cấu trúc runtime đại diện cho class.

#### Linking

Linking thường được mô tả qua ba hoạt động:

- **Verification:** kiểm tra bytecode hợp lệ và thỏa các ràng buộc an toàn kiểu.
- **Preparation:** cấp vùng nhớ cho static field và gán giá trị mặc định.
- **Resolution:** phân giải symbolic reference thành runtime reference khi JVM cần; việc này có thể được thực hiện eager hoặc lazy tùy implementation.

#### Initialization

Initialization thực thi logic khởi tạo class, bao gồm static field initializer và static initialization block.

```java
class Configuration {

    static int port = 8080;

    static {
        System.out.println("Initializing Configuration");
    }
}
```

Initialization chỉ xảy ra theo quy tắc của JVM khi class được chủ động sử dụng, không đơn giản là cứ thấy file `.class` là mọi static block chạy ngay.

### Các ClassLoader quan trọng

Trong Java hiện đại, ba class loader thường được nhắc đến là:

| ClassLoader | Vai trò |
| --- | --- |
| Bootstrap ClassLoader | Nạp các class nền tảng cốt lõi. Đây là loader tích hợp trong JVM, không phải một Java object thông thường. |
| Platform ClassLoader | Nạp các class thuộc platform modules phù hợp. |
| Application ClassLoader | Nạp class của ứng dụng từ class path và các module ứng dụng phù hợp. |

Java cũng cho phép viết custom `ClassLoader` cho plugin, hot reload hoặc những cơ chế loading đặc biệt.

### Parent Delegation Model

Một class loader thông thường ủy quyền việc tìm class cho parent trước khi tự tìm. Mô hình này:

- tái sử dụng class đã được load;
- tránh nhiều loader tự tạo phiên bản khác nhau của class nền tảng;
- hạn chế ứng dụng tự thay thế các class quan trọng của Java.

Đây là chiến lược mặc định phổ biến, không phải mọi custom class loader đều bị bắt buộc phải giữ nguyên một triển khai delegation giống nhau.

### Runtime Data Areas

JVM quản lý các vùng dữ liệu phục vụ thực thi:

| Vùng | Đặc điểm |
| --- | --- |
| Heap | Vùng được chia sẻ giữa thread, thường chứa object và array. GC quản lý vùng này. |
| JVM Stack | Mỗi thread có stack riêng, chứa stack frame của các method đang chạy. |
| Method Area | Vùng logic trong JVM Specification chứa thông tin cấp class, method và constant pool runtime. |
| PC Register | Mỗi thread có program counter để theo dõi instruction đang thực thi. |
| Native Method Stack | Hỗ trợ việc thực thi native method khi JVM sử dụng. |

Ở HotSpot, class metadata thường được lưu trong `Metaspace`. `Metaspace` là chi tiết của một JVM implementation, không nên đồng nhất nó với tên bắt buộc của mọi runtime data area trong mọi JVM.

### Stack và Heap: mô hình khái niệm

```java
class Student {
    int age;
}

public class Main {
    public static void main(String[] args) {
        int count = 10;
        Student student = new Student();
        student.age = 22;
    }
}
```

Có thể hình dung:

```text
JVM Stack - main() frame              Heap
┌────────────────────────┐           ┌────────────────────┐
│ count = 10             │           │ Student object     │
│ student ───────────────┼──────────>│ age = 22           │
└────────────────────────┘           └────────────────────┘
```

- `count` là local variable kiểu primitive;
- `student` là local variable chứa reference tới object;
- `Student` object được tạo trong heap theo mô hình thông thường;
- `age` là instance field thuộc object.

Đây là mô hình sư phạm. JIT có thể tối ưu allocation bằng escape analysis, scalar replacement hoặc các kỹ thuật khác. Vì vậy không nên phát biểu tuyệt đối rằng mọi local variable luôn nằm trên RAM stack hoặc mọi object luôn tồn tại trên heap sau mọi tối ưu runtime.

## 1.7. Interpreter và JIT Compiler

### Interpreter

Interpreter đọc bytecode instruction và thực hiện chúng trong runtime.

Ưu điểm:

- chương trình có thể bắt đầu chạy sớm;
- không cần biên dịch toàn bộ chương trình trước khi khởi động;
- phù hợp với code ít được thực thi hoặc startup path.

Nhược điểm:

- code lặp lại nhiều lần phải chịu chi phí diễn giải nhiều lần;
- cơ hội tối ưu toàn cục thấp hơn native code đã được JIT biên dịch.

### JIT Compiler là gì?

`JIT` (`Just-In-Time Compiler`) hoạt động trong runtime. JVM theo dõi profiling data và có thể biên dịch những đoạn code được thực thi thường xuyên thành native machine code.

```java
public class HotCodeDemo {

    static long calculate() {
        long total = 0;
        for (int i = 0; i < 1_000_000; i++) {
            total += i;
        }
        return total;
    }

    public static void main(String[] args) {
        for (int i = 0; i < 1_000; i++) {
            calculate();
        }
    }
}
```

`calculate()` có thể được JVM xem là đoạn code nóng. JIT có thể áp dụng:

- method inlining;
- loop optimization;
- escape analysis;
- dead-code elimination;
- speculative optimization và deoptimization khi giả định runtime không còn đúng.

Không có quy tắc đơn giản kiểu “gọi một method đúng N lần thì chắc chắn JIT compile”. Ngưỡng và quyết định phụ thuộc JVM implementation, flags, profiling data, kích thước method, code cache và trạng thái runtime.

### So sánh Interpreter và JIT

| Tiêu chí | Interpreter | JIT Compiler |
| --- | --- | --- |
| Thời điểm | Có thể thực thi ngay | Biên dịch trong runtime |
| Chi phí khởi đầu | Thường thấp | Có chi phí profiling và compilation |
| Tối ưu hóa | Hạn chế hơn | Có thể tối ưu chuyên sâu |
| Đầu vào thực thi | Bytecode | Native machine code đã biên dịch |
| Phù hợp | Startup và code ít lặp | Hot path chạy nhiều lần |

Trong HotSpot, interpreter và JIT phối hợp với nhau. Java không phải chỉ “thông dịch” hoặc chỉ “biên dịch trước” theo một mô hình đơn giản duy nhất.

## 1.8. Garbage Collection

`Garbage Collection` là cơ chế quản lý bộ nhớ tự động. JVM tìm những object không còn reachable từ các GC roots và thu hồi bộ nhớ của chúng khi phù hợp.

```java
class User {
    String name;

    User(String name) {
        this.name = name;
    }
}

public class GcDemo {
    public static void main(String[] args) {
        User user = new User("Quang");
        user = null;
    }
}
```

Sau khi `user` được gán `null`, object có thể trở thành ứng viên GC nếu không còn reference nào khác tới object. Nhưng:

- GC không nhất thiết chạy ngay lúc gán `null`;
- không thể dùng `System.gc()` như một lệnh bảo đảm thu hồi tức thời;
- object còn reference từ biến khác vẫn reachable;
- object có thể được giữ bởi static field, thread đang chạy, JNI hoặc cấu trúc runtime khác;
- GC chỉ quản lý memory trong phạm vi JVM, không thay thế việc đóng file, socket, database connection hay transaction.

Ví dụ object vẫn còn reachable:

```java
User a = new User("Alice");
User b = a;

a = null;

System.out.println(b.name); // Alice
```

Trong backend, request có thể tạo hàng nghìn object. Nếu giữ reference không cần thiết trong cache, static collection, listener hoặc thread-local, heap vẫn có thể tăng dù Java có GC. Đây là dạng memory retention thường được gọi không chính thức là memory leak trong ứng dụng managed memory.

Tài nguyên bên ngoài heap nên được quản lý bằng API phù hợp, chẳng hạn `try-with-resources` cho resource triển khai `AutoCloseable`.

## 1.9. Java SE, Jakarta EE và Java ME

### Java SE

`Java SE` (`Java Standard Edition`) là nền tảng chuẩn, bao gồm:

- Java language và JVM specification;
- Collections và các API cấu trúc dữ liệu;
- concurrency;
- file I/O và networking;
- date/time;
- reflection, annotations và modules;
- các thư viện nền tảng như `java.base`, `java.sql`, `java.net.http`.

“Java Core” là cách gọi thực tế cho kiến thức về ngôn ngữ, JVM và các API nền tảng này.

### Jakarta EE

`Jakarta EE` cung cấp các specification và API hướng đến ứng dụng enterprise, ví dụ:

- Jakarta Servlet;
- Jakarta Persistence;
- Jakarta RESTful Web Services;
- Jakarta Transactions;
- Jakarta Validation;
- Jakarta CDI.

Jakarta EE phát triển từ nền tảng từng mang tên Java EE.

### Java ME

`Java ME` hướng tới thiết bị hạn chế tài nguyên và một số nền tảng embedded chuyên biệt.

### Vị trí của Spring Boot

Spring Boot là framework trong hệ sinh thái Java, không phải thành phần mặc định của Java SE. Spring Boot giúp xây REST API, dependency injection, configuration và production features nhanh hơn, nhưng vẫn dựa trên các khái niệm nền của Java:

- class và object;
- interface và method;
- exception;
- collection;
- thread;
- I/O;
- memory và type system.

Học Java Core trước giúp việc đọc stack trace, debug bean lifecycle, hiểu transaction callback và xử lý hiệu năng trong Spring Boot chắc chắn hơn.

## 1.10. Cấu trúc một chương trình Java

```java
package com.example.app;

import java.util.Scanner;

public class Main {

    private static final String APP_NAME = "Java Core";

    public static void main(String[] args) {
        System.out.println(APP_NAME);
    }
}
```

### Package declaration

```java
package com.example.app;
```

Package giúp tổ chức class, hạn chế xung đột tên và tham gia vào quy tắc package-private access. Tên package thường dùng reversed domain convention:

```text
com.company.project
```

Cấu trúc thư mục thường tương ứng với package:

```text
src/
└── com/
    └── example/
        └── app/
            ├── Main.java
            ├── User.java
            └── UserService.java
```

### Import statement

```java
import java.util.Scanner;
```

`import` không sao chép source code của thư viện vào file hiện tại. Nó giúp compiler phân giải tên đơn giản `Scanner` thành kiểu `java.util.Scanner`.

Không import cũng có thể dùng fully qualified name:

```java
java.util.Scanner scanner = new java.util.Scanner(System.in);
```

`java.lang` được import tự động, nên có thể dùng `String`, `System` và `Integer` mà không cần viết `import java.lang.String`.

### Class declaration

```java
public class Main {
}
```

- `public`: access modifier;
- `class`: keyword khai báo class;
- `Main`: tên class;
- `{}`: thân class.

Với một public top-level class, tên file thông thường phải trùng tên class: `Main.java`.

### Main method

```java
public static void main(String[] args)
```

| Thành phần | Ý nghĩa |
| --- | --- |
| `public` | Java launcher có thể truy cập method. |
| `static` | Gọi được mà chưa cần tạo instance. |
| `void` | Không trả về giá trị. |
| `main` | Tên entry point thông dụng. |
| `String[]` | Mảng chứa command-line arguments. |
| `args` | Tên biến tham số, có thể đổi tên. |

Ví dụ:

```java
public class Main {

    public static void main(String[] args) {
        System.out.println(args.length);

        for (String arg : args) {
            System.out.println(arg);
        }
    }
}
```

Chạy:

```bash
java Main hello world 123
```

Kết quả:

```text
3
hello
world
123
```

Mọi phần tử trong `args` đều là `String`. Chuỗi `"123"` không tự động trở thành `int`:

```java
int number = Integer.parseInt(args[2]);
```

Nếu chuỗi không phải biểu diễn hợp lệ của số nguyên, `parseInt` có thể ném `NumberFormatException`.

Java 21 có các dạng main method đơn giản hơn trong phạm vi preview của JEP 445. Đây không phải dạng mặc định nên dùng cho mọi dự án. Khi học Java Core và xây ứng dụng thông thường, `public static void main(String[] args)` vẫn là dạng rõ ràng, tương thích và phổ biến.

## 1.11. Các lệnh JDK cơ bản

Kiểm tra phiên bản:

```bash
java -version
javac -version
```

Biên dịch:

```bash
javac Main.java
```

Chạy class:

```bash
java Main
```

Biên dịch output vào thư mục riêng:

```bash
javac -d out Main.java
java -cp out Main
```

Chạy source file trực tiếp từ Java 11:

```bash
java Main.java
```

Đây là single-file source-code mode của launcher. Nó thuận tiện cho ví dụ nhỏ, nhưng dự án backend thực tế thường dùng Maven hoặc Gradle để quản lý source set, dependency, test và packaging.

Xem bytecode:

```bash
javap -c Main
javap -c -p Main
```

Mở JShell:

```bash
jshell
```

Thử biểu thức:

```text
jshell> int a = 10;
jshell> int b = 20;
jshell> a + b
$3 ==> 30
```

JavaDoc comments:

```java
/**
 * Calculates the sum of two integers.
 *
 * @param a the first number
 * @param b the second number
 * @return the sum of a and b
 */
public static int add(int a, int b) {
    return a + b;
}
```

Comments thông thường:

```java
// Single-line comment

/*
 * Multi-line comment
 */
```

## 1.12. Java naming conventions

Convention không phải lúc nào cũng là yêu cầu compiler, nhưng là yêu cầu quan trọng để code dễ đọc và bảo trì.

| Thành phần | Convention | Ví dụ |
| --- | --- | --- |
| Class | PascalCase | `UserService` |
| Interface | PascalCase, thường là danh từ hoặc capability | `PaymentProcessor` |
| Method | camelCase | `calculateSalary()` |
| Variable | camelCase | `totalAmount` |
| Constant | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Package | chữ thường | `com.example.payment` |
| Enum | PascalCase | `PaymentStatus` |
| Enum constant | UPPER_SNAKE_CASE | `PENDING` |

```java
public class PaymentService {

    private static final double TAX_RATE = 0.08;

    public double calculateTotal(double amount) {
        return amount * (1 + TAX_RATE);
    }
}
```

## 1.13. Những điểm cần nhớ của Chương 1

- Java là ngôn ngữ; JVM là máy ảo thực thi bytecode.
- JDK là bộ công cụ phát triển, không đồng nghĩa với JVM.
- `javac` tạo bytecode; `java` khởi chạy ứng dụng.
- Bytecode độc lập nền tảng hơn machine code, nhưng ứng dụng vẫn có thể phụ thuộc môi trường.
- JVM implementation có thể phối hợp interpreter và JIT.
- Heap, stack, method area và PC register có vai trò khác nhau.
- GC thu hồi memory của object không còn reachable; không thay thế việc đóng resource.
- Package tổ chức class; import hỗ trợ phân giải tên.
- `main` là entry point thông dụng, còn command-line argument luôn bắt đầu dưới dạng `String`.

# Chương 2. Variables & Data Types

## 2.1. Variable là gì?

`Variable` là một tên gắn với một giá trị hoặc reference trong một phạm vi nhất định. Trong Java, biến có kiểu tĩnh: sau khi compiler xác định kiểu của biến, biến không thể nhận giá trị của kiểu không tương thích.

```java
int age = 22;

age = 25;       // Hợp lệ
age = "Hello";  // Compile-time error
```

Phân tích khai báo:

- `int`: data type;
- `age`: variable name;
- `=`: assignment operator;
- `22`: initial value;
- `;`: kết thúc statement.

Java kiểm tra kiểu chủ yếu tại compile time. Điều này không có nghĩa mọi lỗi đều được phát hiện trước khi chạy: `NullPointerException`, `ArrayIndexOutOfBoundsException` và nhiều lỗi logic vẫn xảy ra ở runtime.

## 2.2. Static typing và `var`

```java
int quantity = 10;
double price = 25.5;
double total = quantity * price;
```

Compiler biết `quantity` là `int`, `price` là `double` và kết quả phép nhân được nâng lên thành `double`.

Java có type inference thông qua `var`, nhưng Java vẫn là statically typed:

```java
var username = "admin";

username = "newAdmin"; // Hợp lệ
username = 100;        // Không hợp lệ: username vẫn là String
```

`var` chỉ được dùng cho local variable có initializer, bao gồm một số trường hợp trong vòng lặp:

```java
var name = "Java";

for (var i = 0; i < 3; i++) {
    System.out.println(i);
}
```

Không dùng `var` cho:

- field;
- parameter của method hoặc constructor;
- return type;
- biến không có initializer;
- biểu thức chỉ có `null` vì compiler không suy luận được reference type cụ thể.

```java
var value = null; // Không compile
```

`var` bỏ bớt phần lặp lại của kiểu, không biến Java thành dynamically typed language.

## 2.3. Các loại biến trong Java

Ba nhóm thường gặp là local variable, instance variable và static variable. Method parameter, constructor parameter và lambda parameter cũng là các biến có scope riêng.

### Local variable

Local variable được khai báo trong method, constructor hoặc block:

```java
public class Main {

    public static void main(String[] args) {
        int age = 22;
        System.out.println(age);
    }
}
```

Đặc điểm:

- chỉ dùng được trong scope hợp lệ;
- không có giá trị mặc định để đọc;
- phải được gán chắc chắn trước khi sử dụng;
- không khai báo bằng `public`, `private` hoặc `protected`.

```java
int age;
System.out.println(age); // Compile-time error
```

Đây là quy tắc `definite assignment`. Compiler từ chối code có khả năng đọc một local variable chưa được gán.

### Instance variable

Instance variable là field không có `static`, thuộc về từng object:

```java
class Student {
    String name;
    int age;
}

Student student1 = new Student();
Student student2 = new Student();

student1.age = 20;
student2.age = 22;
```

Hai object có trạng thái độc lập. Field `age` của `student1` không phải field dùng chung với `student2`.

### Static variable

Static variable là field có keyword `static`, thuộc về class:

```java
class Student {
    static String school = "FPT University";
    String name;
}

Student.school = "New University";
```

Tất cả object cùng class có thể truy cập giá trị static đó. Nên truy cập bằng tên class để thể hiện ownership:

```java
System.out.println(Student.school);
```

Truy cập static field qua object vẫn có thể compile trong một số trường hợp, nhưng dễ làm người đọc hiểu nhầm rằng field thuộc riêng object.

### So sánh ba loại biến

| Tiêu chí | Local | Instance | Static |
| --- | --- | --- | --- |
| Vị trí khai báo | Method, constructor hoặc block | Trong class, không có `static` | Trong class, có `static` |
| Thuộc về | Lần thực thi và scope cục bộ | Từng object | Class |
| Giá trị mặc định | Không được đọc trước khi gán | Có | Có |
| Số bản sao | Mỗi lần chạy scope | Mỗi object | Thường một giá trị dùng chung trong class loader |
| Truy cập | Qua tên biến | Qua object/reference | Khuyến nghị qua tên class |

## 2.4. Tám primitive data types

Java có tám kiểu nguyên thủy:

| Nhóm | Kiểu | Đặc điểm |
| --- | --- | --- |
| Số nguyên | `byte` | Số nguyên có dấu 8-bit, từ -128 đến 127. |
| Số nguyên | `short` | Số nguyên có dấu 16-bit. |
| Số nguyên | `int` | Số nguyên có dấu 32-bit; kiểu mặc định cho literal nguyên. |
| Số nguyên | `long` | Số nguyên có dấu 64-bit. |
| Số thực | `float` | IEEE 754 binary32, độ chính xác xấp xỉ. |
| Số thực | `double` | IEEE 754 binary64, kiểu mặc định cho literal thập phân. |
| Ký tự | `char` | 16-bit unsigned UTF-16 code unit. |
| Logic | `boolean` | Chỉ có `true` hoặc `false`; cách biểu diễn bộ nhớ không được JLS quy định như một số byte cố định. |

### Số nguyên và numeric literals

```java
byte small = 100;
short medium = 30_000;
int count = 2_000_000_000;
long population = 8_000_000_000L;
```

Literal nguyên mặc định có kiểu `int`. Literal `long` nên có hậu tố `L` khi giá trị vượt phạm vi `int` hoặc muốn thể hiện rõ kiểu.

Java hỗ trợ nhiều hệ cơ số và dấu gạch dưới:

```java
int decimal = 1_000_000;
int binary = 0b1010_1010;
int octal = 0_755;
int hex = 0xFF;
long mask = 0xFFFF_FFFFL;
```

Dấu gạch dưới không được đặt tùy ý ở đầu/cuối literal hoặc ngay cạnh dấu chấm thập phân, hậu tố và tiền tố cơ số.

### Số thực

```java
float ratio = 0.5f;
double average = 10.0 / 3.0;
double scientific = 6.02e23;
```

Literal thập phân mặc định là `double`. Muốn tạo `float` cần hậu tố `f` hoặc `F`.

### `char`

`char` là một UTF-16 code unit, không phải lúc nào cũng đại diện cho toàn bộ một Unicode code point. Nhiều ký tự ngoài Basic Multilingual Plane cần hai `char` tạo thành surrogate pair.

```java
char first = 'A';
char newline = '\n';
int code = first;
```

Khi xử lý văn bản quốc tế, emoji hoặc ký tự Unicode phức tạp, nên hiểu sự khác nhau giữa `char`, code point và grapheme.

### `boolean`

```java
boolean authenticated = true;
boolean expired = false;
```

Không thể coi `boolean` là `0` hoặc `1` như một quy ước ngôn ngữ C:

```java
boolean active = 1; // Không compile
```

## 2.5. Primitive types và reference types

Ngoài primitive, Java có reference type như:

- class;
- interface;
- array;
- enum;
- record;
- các kiểu do thư viện hoặc lập trình viên định nghĩa.

Một reference variable không chứa toàn bộ object theo cách diễn giải đơn giản; nó chứa một reference tới object hoặc có giá trị `null`.

```java
String name = "Java";
Student student = new Student();
int[] scores = new int[3];
```

`String`, `Student` và `int[]` đều là reference type. `int` là primitive type.

### Bảng so sánh

| Tiêu chí | Primitive | Reference |
| --- | --- | --- |
| Ví dụ | `int`, `double`, `boolean` | `String`, `Student`, `int[]` |
| Giá trị | Dữ liệu nguyên thủy | Reference tới object hoặc `null` |
| Có thể `null`? | Không | Có |
| Method | Không có instance method | Có thể gọi method nếu reference không null |
| Equality mặc định | So sánh giá trị | `==` so sánh identity |
| Wrapper | `Integer`, `Double`... | Bản thân đã là object |

### `null`

`null` biểu thị không có reference tới object:

```java
String name = null;
```

Gọi method trên reference `null` gây `NullPointerException`:

```java
// System.out.println(name.length()); // NullPointerException
```

`null` có thể gán cho reference type nhưng không gán trực tiếp cho primitive:

```java
Integer count = null; // Hợp lệ
// int value = null;  // Không hợp lệ
```

## 2.6. Giá trị mặc định của field và array

Field của object và static field được JVM khởi tạo bằng giá trị mặc định nếu chưa có initializer:

| Kiểu field | Giá trị mặc định |
| --- | --- |
| `byte`, `short`, `int`, `long` | `0` |
| `float`, `double` | `0.0` |
| `char` | `\u0000` |
| `boolean` | `false` |
| Reference type | `null` |

```java
class Defaults {
    int count;
    boolean enabled;
    String name;
}

Defaults value = new Defaults();
System.out.println(value.count);   // 0
System.out.println(value.enabled); // false
System.out.println(value.name);    // null
```

Local variable không được tự động cho phép đọc giá trị mặc định:

```java
int count;
// System.out.println(count); // Compile-time error
```

Array element cũng nhận default value theo kiểu:

```java
int[] numbers = new int[3];       // {0, 0, 0}
boolean[] flags = new boolean[2]; // {false, false}
String[] names = new String[2];   // {null, null}
```

## 2.7. Ép kiểu dữ liệu

### Widening và implicit casting

Widening là chuyển từ kiểu có phạm vi biểu diễn nhỏ hơn sang kiểu lớn hơn theo quy tắc ngôn ngữ:

```java
int count = 10;
long total = count;
double result = total;
```

Compiler thường thực hiện ngầm định:

```java
byte b = 10;
int number = b;
```

“Widening” không đồng nghĩa luôn bảo toàn chính xác từng bit. Chuyển `long` sang `float` có thể làm mất độ chính xác vì `float` không biểu diễn được mọi số nguyên 64-bit.

### Narrowing và explicit casting

Narrowing là chuyển về kiểu nhỏ hơn, cần cast tường minh:

```java
double price = 19.99;
int whole = (int) price;

System.out.println(whole); // 19
```

Phần thập phân bị loại bỏ, không phải làm tròn.

Ép kiểu số nguyên có thể overflow:

```java
int large = 130;
byte small = (byte) large;

System.out.println(small); // -126
```

### Numeric promotion

Trong nhiều phép toán, `byte`, `short` và `char` được promote lên `int`:

```java
byte a = 10;
byte b = 20;

// byte sum = a + b; // Không compile: a + b có kiểu int
byte sum = (byte) (a + b);
```

Compound assignment có một quy tắc tiện lợi hơn:

```java
byte value = 1;
value += 2; // Gần tương đương value = (byte) (value + 2)
```

Không nên dựa vào quy tắc này để bỏ qua nguy cơ overflow.

### Reference casting

Reference có thể được upcast an toàn theo quan hệ type:

```java
Integer value = 10;
Number number = value;
Object object = number;
```

Downcast cần cast và có thể ném `ClassCastException`:

```java
Object text = "Java";
String value = (String) text; // Hợp lệ
```

Nên kiểm tra bằng `instanceof` hoặc pattern matching:

```java
if (object instanceof String text) {
    System.out.println(text.length());
}
```

## 2.8. `final` variables và constants

`final` ngăn một biến được gán lại:

```java
final int maxRetries = 3;
// maxRetries = 4; // Compile-time error
```

Với reference, `final` khóa reference chứ không làm object bất biến:

```java
final var names = new java.util.ArrayList<String>();
names.add("Java"); // Hợp lệ: object vẫn mutable
// names = new java.util.ArrayList<>(); // Không hợp lệ
```

Constant thường là static final field:

```java
public class Limits {
    public static final int MAX_PAGE_SIZE = 100;
}
```

Tên constant dùng `UPPER_SNAKE_CASE`. `static` làm một giá trị thuộc class; `final` ngăn assignment lại. Nếu object mà constant reference trỏ tới mutable, state bên trong object vẫn có thể thay đổi.

## 2.9. Scope và lifetime

Scope xác định nơi một biến có thể được truy cập. Lifetime là khoảng thời gian giá trị hoặc object có thể tồn tại trong runtime.

```java
int outer = 10;

if (outer > 0) {
    int inner = 20;
    System.out.println(outer);
    System.out.println(inner);
}

// System.out.println(inner); // Không hợp lệ: inner đã ra khỏi scope
```

- Local variable thường sống trong lần thực thi scope và stack frame tương ứng.
- Instance variable sống cùng object, cho tới khi object không còn reachable và được GC thu hồi.
- Static field sống gắn với class loader và class lifecycle.
- Reference biến mất khỏi scope không nhất thiết object được GC ngay nếu còn reference khác.

Không nên đồng nhất scope Java với vị trí vật lý tuyệt đối trên RAM. JIT có thể tối ưu allocation và representation.

## 2.10. Overflow, underflow và floating-point precision

### Integer overflow và underflow

Kiểu số nguyên Java có kích thước cố định. Khi vượt giới hạn, phép tính thường wrap quanh miền biểu diễn thay vì tự ném exception:

```java
int max = Integer.MAX_VALUE;
int min = Integer.MIN_VALUE;

System.out.println(max + 1); // wrap về giá trị âm
System.out.println(min - 1); // wrap về giá trị dương
```

Đây là overflow và underflow theo nghĩa số nguyên. Khi nghiệp vụ không cho phép wrap, dùng:

```java
int safe = Math.addExact(1_000_000_000, 1_000_000_000);
```

hoặc kiểm tra giới hạn trước khi tính toán. Các method `Math.*Exact` ném `ArithmeticException` khi phát hiện overflow.

### Floating-point underflow

Số thực dấu phẩy động có miền biểu diễn hữu hạn. Một giá trị quá nhỏ có thể bị làm tròn về zero:

```java
double tiny = Double.MIN_VALUE / 2;
System.out.println(tiny); // Có thể trở thành 0.0
```

`Double.MIN_VALUE` là số dương nhỏ nhất khác zero của double, không phải giá trị âm nhỏ nhất. Khi cần hiểu giới hạn, phân biệt `MIN_VALUE` và `MIN_NORMAL`.

### Precision

`float` và `double` biểu diễn số nhị phân gần đúng, nên không phải mọi số thập phân đều được lưu chính xác:

```java
double value = 0.1 + 0.2;
System.out.println(value); // Có thể in 0.30000000000000004
```

Với tiền tệ hoặc số thập phân cần quy tắc chính xác, cân nhắc `BigDecimal`:

```java
import java.math.BigDecimal;

BigDecimal price = new BigDecimal("0.10");
BigDecimal tax = new BigDecimal("0.20");
BigDecimal total = price.add(tax);
```

Khởi tạo `BigDecimal` từ `String` giúp tránh đưa sai số binary floating-point vào ngay từ đầu.

## 2.11. `String` và reference identity

`String` là class, không phải primitive. String literal thường được quản lý qua string pool:

```java
String first = "Java";
String second = "Java";
String third = new String("Java");
```

Không nên dùng `==` để so sánh nội dung string:

```java
System.out.println(first == second);       // Có thể true do cùng literal pool
System.out.println(first == third);        // Thường false: khác reference
System.out.println(first.equals(third));   // true: cùng nội dung
```

`String` immutable nên các phép nối tạo ra giá trị mới. Khi nối trong vòng lặp lớn, cân nhắc `StringBuilder`:

```java
StringBuilder builder = new StringBuilder();
for (int i = 0; i < 5; i++) {
    builder.append("Lần ").append(i).append(';');
}
String result = builder.toString();
```

## 2.12. Những điểm cần nhớ của Chương 2

- Java là statically typed; `var` chỉ suy luận kiểu, không thay đổi bản chất đó.
- Local variable phải được gán trước khi đọc; field có default value.
- Instance field thuộc object; static field thuộc class.
- Có tám primitive, còn `String`, array, class và wrapper là reference type.
- `null` là một reference không trỏ tới object; gọi method trên `null` có thể gây NPE.
- `==` với reference so sánh identity; `equals` thường dùng để so sánh nội dung.
- Widening thường implicit; narrowing cần cast và có thể mất dữ liệu.
- Integer overflow/underflow có thể wrap; floating-point có thể mất precision hoặc underflow.
- Stack/Heap là mô hình tư duy quan trọng nhưng không nên diễn giải quá tuyệt đối sau tối ưu JIT.

# Chương 3. Operators

Toán tử (`operator`) là ký hiệu kết hợp một hoặc nhiều operand để tạo expression. Hiểu operator cần đồng thời nắm kiểu dữ liệu, numeric promotion, short-circuit và precedence.

## 3.1. Arithmetic operators

| Toán tử | Ý nghĩa |
| --- | --- |
| `+` | Cộng hoặc nối chuỗi khi có operand là `String`. |
| `-` | Trừ. |
| `*` | Nhân. |
| `/` | Chia. |
| `%` | Phần dư. |

```java
int a = 17;
int b = 5;

System.out.println(a + b); // 22
System.out.println(a - b); // 12
System.out.println(a * b); // 85
System.out.println(a / b); // 3: chia nguyên
System.out.println(a % b); // 2
```

Nếu cả hai operand là số nguyên, kết quả phép chia là số nguyên:

```java
double average = 17 / 5;   // 3.0, vì phép chia xảy ra trước khi gán
double correct = 17.0 / 5; // 3.4
```

Chia integer cho zero gây `ArithmeticException`:

```java
// int result = 10 / 0;
```

Với floating-point, phép chia zero tuân theo IEEE 754 và có thể tạo `Infinity` hoặc `NaN`, nên không suy luận giống integer.

Toán tử `+` với string được đánh giá từ trái sang phải:

```java
System.out.println("Result: " + 1 + 2);   // Result: 12
System.out.println("Result: " + (1 + 2)); // Result: 3
```

Integer overflow không tự động ném exception:

```java
int max = Integer.MAX_VALUE;
System.out.println(max + 1); // Giá trị âm do overflow
```

Nếu overflow là lỗi nghiệp vụ, dùng `Math.addExact`, `Math.multiplyExact` hoặc kiểm tra phạm vi rõ ràng.

## 3.2. Assignment operators

```java
int total = 10;
total += 5;
total -= 2;
total *= 3;
total /= 2;
total %= 4;
```

`total += value` có ngữ nghĩa gần với `total = (type) (total + value)`, nên compound assignment có thể bao gồm implicit narrowing conversion. Điều này tiện lợi nhưng có thể che giấu overflow.

## 3.3. Relational và equality operators

Các operator quan hệ:

```java
a == b
a != b
a < b
a <= b
a > b
a >= b
```

Với primitive, `==` so sánh giá trị. Với reference, `==` so sánh hai reference có trỏ tới cùng object hay không.

```java
String first = new String("Java");
String second = new String("Java");

System.out.println(first == second);      // false
System.out.println(first.equals(second)); // true
```

Đây là một trong những lỗi phỏng vấn và bug thực tế phổ biến nhất khi so sánh `String`.

Khi gọi `equals`, tránh để object có thể là `null` ở bên trái:

```java
String input = null;
// input.equals("OK"); // NPE

boolean accepted = "OK".equals(input); // false, an toàn hơn
```

Với số thực, không nên so sánh `double` bằng `==` khi phép tính có sai số tích lũy. Có thể dùng sai số cho phép:

```java
double left = 0.1 + 0.2;
double right = 0.3;
double epsilon = 1e-9;

boolean equal = Math.abs(left - right) < epsilon;
```

## 3.4. Logical operators và short-circuit evaluation

| Toán tử | Ý nghĩa |
| --- | --- |
| `&&` | AND có short-circuit. |
| `||` | OR có short-circuit. |
| `!` | NOT. |
| `&`, `|` | Có thể là bitwise với số hoặc logical không short-circuit với boolean. |

```java
boolean active = true;
boolean verified = false;

boolean canAccess = active && verified;
boolean needsReview = !verified || !active;
```

Short-circuit nghĩa là operand bên phải có thể không được đánh giá:

```java
String value = null;

if (value != null && value.length() > 0) {
    System.out.println(value);
}
```

Nếu dùng `&` thay `&&`, cả hai vế đều được đánh giá và có thể gây NPE:

```java
// if (value != null & value.length() > 0) { ... }
```

Short-circuit rất hữu ích để viết guard condition, nhưng không nên giấu side effect trong operand.

## 3.5. Unary operators và increment/decrement

```java
int value = 5;

System.out.println(+value); // 5
System.out.println(-value); // -5
System.out.println(++value); // 6: tăng trước rồi lấy giá trị
System.out.println(value++); // 6: lấy giá trị rồi mới tăng
System.out.println(value);   // 7
```

`++` và `--` tạo side effect. Tránh viết biểu thức quá phức tạp như:

```java
int result = array[index++] + ++index;
```

Code tách thành nhiều statement dễ đọc và ít lỗi hơn.

## 3.6. Bitwise operators

Bitwise làm việc trên từng bit của kiểu nguyên:

- `&`: AND;
- `|`: OR;
- `^`: XOR;
- `~`: đảo bit;
- `<<`: dịch trái;
- `>>`: dịch phải có giữ bit dấu;
- `>>>`: dịch phải chèn zero.

Ví dụ dùng bit mask:

```java
int READ = 1;   // 001
int WRITE = 2;  // 010
int ADMIN = 4;  // 100

int permissions = READ | WRITE;

boolean canRead = (permissions & READ) != 0;
boolean canAdmin = (permissions & ADMIN) != 0;
```

`bitwise` có thể hữu ích trong protocol, flags và tối ưu dữ liệu nhỏ. Trong code nghiệp vụ thông thường, không nên dùng bitwise nếu enum hoặc class rõ nghĩa hơn.

### Shift operators

```java
int value = 1;

System.out.println(value << 3); // 8
System.out.println(16 >> 2);    // 4
```

Cần nhớ shift trên `int` chỉ sử dụng một phần số bit thấp của right operand theo quy tắc Java. Không nên coi shift là phép nhân/chia an toàn trong mọi trường hợp vì overflow vẫn có thể xảy ra.

## 3.7. `instanceof`

`instanceof` kiểm tra một reference có phải là instance của type hoặc subtype hay không:

```java
Object value = "Java";

if (value instanceof String) {
    System.out.println("This is a String");
}
```

Java hiện đại cho phép pattern variable:

```java
if (value instanceof String text && !text.isBlank()) {
    System.out.println(text.trim());
}
```

Nếu reference là `null`, `instanceof` trả về `false`:

```java
Object value = null;
System.out.println(value instanceof String); // false
```

`instanceof` giúp tránh downcast mù và giảm nguy cơ `ClassCastException`. Tuy nhiên, nếu một method có quá nhiều nhánh kiểm tra type, đó có thể là dấu hiệu cần thiết kế lại abstraction.

## 3.8. Conditional/ternary operator

Toán tử ba ngôi (`ternary operator`) có dạng:

```java
String status = active ? "ACTIVE" : "INACTIVE";
```

Dùng tốt cho một lựa chọn ngắn. Nếu hai nhánh chứa nhiều logic hoặc lồng nhiều ternary, nên chuyển thành `if` hoặc method riêng.

Java phải xác định một kiểu chung cho hai nhánh:

```java
var value = condition ? 1 : 2L; // Có thể được nâng thành long
```

Đừng chỉ nhìn kiểu của một nhánh khi dự đoán kiểu của cả expression.

## 3.9. Operator precedence

Thứ tự ưu tiên khái quát từ cao xuống thấp:

| Nhóm | Ví dụ |
| --- | --- |
| Postfix | `x++`, `x--` |
| Unary | `++x`, `--x`, `!x`, `~x` |
| Multiplicative | `*`, `/`, `%` |
| Additive | `+`, `-` |
| Shift | `<<`, `>>`, `>>>` |
| Relational/type | `<`, `>`, `<=`, `>=`, `instanceof` |
| Equality | `==`, `!=` |
| Bitwise AND/XOR/OR | `&`, `^`, `|` |
| Logical AND/OR | `&&`, `||` |
| Conditional | `?:` |
| Assignment | `=`, `+=`, `-=`, ... |

```java
int result = 2 + 3 * 4; // 14
```

Khi ý định quan trọng hơn việc tiết kiệm một cặp ngoặc, hãy viết:

```java
int result = 2 + (3 * 4);
```

Trong code backend, ngoặc giúp review nhanh hơn và tránh thay đổi kết quả khi expression được mở rộng.

## 3.10. Những lỗi operator thường gặp

### Nhầm chia nguyên

```java
int total = 5;
int size = 2;
double average = total / size; // 2.0, không phải 2.5
```

Sửa bằng cách chuyển một operand sang floating-point trước phép chia:

```java
double average = (double) total / size;
```

### Dùng `==` với String

So sánh nội dung bằng `equals`, hoặc dùng một hằng string không null ở bên trái khi phù hợp.

### Quên overflow

Kiểu `int` có giới hạn. Dùng `long`, `BigInteger`, `Math.*Exact` hoặc kiểm tra nghiệp vụ nếu miền dữ liệu có thể vượt giới hạn.

### Nhầm `&` với `&&`

`&` không short-circuit khi làm việc với boolean. Đừng thay thế máy móc nếu vế phải có thể dereference null hoặc có side effect.

## 3.11. Những điểm cần nhớ của Chương 3

- Kiểu của operand ảnh hưởng trực tiếp đến kết quả phép toán.
- Integer division loại bỏ phần thập phân.
- `==` với primitive so sánh giá trị, với reference so sánh identity.
- `&&` và `||` short-circuit; `&` và `|` có semantics khác.
- `instanceof` có thể kết hợp pattern variable.
- Overflow số nguyên thường không tự ném exception.
- Dùng ngoặc để làm rõ precedence.
- Side effect trong `++`, `--` và operand logic nên được giữ đơn giản.

# Chương 4. Control Flow Statements

Control flow quyết định statement nào được thực thi và thực thi bao nhiêu lần. Một backend dễ debug thường ưu tiên luồng điều khiển rõ ràng, guard clause ngắn và tránh nesting không cần thiết.

## 4.1. `if`, `else if` và `else`

```java
int score = 82;

if (score >= 90) {
    System.out.println("Excellent");
} else if (score >= 70) {
    System.out.println("Good");
} else {
    System.out.println("Needs improvement");
}
```

Java yêu cầu condition có kiểu `boolean`; không tự coi số nguyên là true/false.

### Nested if

Nested if phù hợp khi condition bên trong thực sự phụ thuộc vào condition bên ngoài:

```java
if (user != null) {
    if (user.isActive()) {
        System.out.println("Can continue");
    }
}
```

Nếu nesting quá sâu, nên dùng guard clause:

```java
if (user == null) {
    return;
}

if (!user.isActive()) {
    return;
}

System.out.println("Can continue");
```

Guard clause làm giảm indentation và giúp đường đi lỗi nổi bật trong service/backend code.

## 4.2. Traditional `switch-case`

`switch` phù hợp khi một expression được so sánh với nhiều case rời rạc:

```java
String role = "ADMIN";

switch (role) {
    case "ADMIN":
        System.out.println("Full access");
        break;
    case "USER":
        System.out.println("Standard access");
        break;
    default:
        System.out.println("Unknown role");
}
```

Nếu quên `break` trong kiểu statement truyền thống, control flow có thể rơi xuống case tiếp theo (`fall-through`). Với những case cần dùng chung logic, có thể viết nhiều label:

```java
switch (day) {
    case "SATURDAY", "SUNDAY":
        System.out.println("Weekend");
        break;
    default:
        System.out.println("Weekday");
}
```

## 4.3. Switch expressions

`switch expression` trả về một giá trị:

```java
Day day = Day.MONDAY;

String type = switch (day) {
    case SATURDAY, SUNDAY -> "weekend";
    case MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY -> "weekday";
};
```

Với enum exhaustive, không nhất thiết phải có `default`:

```java
enum Day {
    MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
}
```

Nếu dùng block, trả về giá trị bằng `yield`:

```java
String label = switch (day) {
    case SATURDAY, SUNDAY -> {
        System.out.println("Non-working day");
        yield "weekend";
    }
    default -> "weekday";
};
```

Ưu điểm của expression:

- tránh biến tạm và mutation không cần thiết;
- compiler có thể kiểm tra tính exhaustive tốt hơn;
- giảm rủi ro quên `break`;
- thể hiện rõ expression có kết quả.

## 4.4. Pattern matching trong `switch` (Java 21)

Java 21 chuẩn hóa pattern matching for `switch`. Có thể kiểm tra type và bind variable ngay trong case:

```java
static String describe(Object value) {
    return switch (value) {
        case null -> "null";
        case Integer number when number > 0 -> "positive integer";
        case Integer number -> "integer";
        case String text -> "string(" + text.length() + ")";
        default -> value.getClass().getSimpleName();
    };
}
```

Các điểm quan trọng:

- `case String text` vừa kiểm tra type vừa tạo pattern variable `text`;
- `case null` xử lý null rõ ràng;
- `when` thêm điều kiện guard cho pattern;
- case cụ thể cần đặt trước case tổng quát hơn để tránh dominance error;
- `default` thường cần thiết khi type domain không exhaustive.

Pattern variable chỉ tồn tại trong phạm vi mà compiler chứng minh nó đã match:

```java
if (value instanceof String text && !text.isBlank()) {
    System.out.println(text.trim());
}
```

## 4.5. `while` loop

`while` kiểm tra condition trước khi chạy body:

```java
int count = 0;

while (count < 3) {
    System.out.println(count);
    count++;
}
```

Nếu condition ban đầu là `false`, body có thể không chạy lần nào.

## 4.6. `do-while` loop

`do-while` chạy body ít nhất một lần rồi mới kiểm tra condition:

```java
int choice;

do {
    choice = readChoice();
} while (choice < 1 || choice > 3);
```

Dùng khi hành động đầu tiên phải xảy ra trước khi kiểm tra tiếp tục, chẳng hạn hiển thị menu hoặc đọc input lần đầu.

## 4.7. `for` loop

```java
for (int i = 0; i < 5; i++) {
    System.out.println(i);
}
```

Ba phần của `for` là:

1. initialization;
2. condition;
3. update.

Biến `i` chỉ có scope trong vòng lặp nếu khai báo ở phần initialization.

Có thể bỏ một phần, nhưng cần đảm bảo loop có điểm dừng:

```java
int i = 0;
for (; i < 5; ) {
    System.out.println(i++);
}
```

## 4.8. Enhanced `for` loop

Enhanced `for` dùng để duyệt array hoặc `Iterable`:

```java
int[] scores = {70, 80, 90};

for (int score : scores) {
    System.out.println(score);
}
```

Với primitive array, biến `score` nhận bản sao giá trị. Gán lại `score` không thay đổi array:

```java
for (int score : scores) {
    score = 0;
}
```

Nếu cần index hoặc thay đổi phần tử, dùng loop chỉ số:

```java
for (int i = 0; i < scores.length; i++) {
    scores[i] = 0;
}
```

## 4.9. Nested loops

Nested loops thường dùng cho ma trận, bảng hoặc các cặp phần tử:

```java
for (int row = 0; row < 3; row++) {
    for (int column = 0; column < 3; column++) {
        System.out.printf("(%d, %d)%n", row, column);
    }
}
```

Nếu mỗi loop chạy `n` lần, độ phức tạp có thể là `O(n²)`. Trước khi lồng loop trên dữ liệu lớn, kiểm tra xem có thể dùng hash-based lookup, sort hoặc một cấu trúc dữ liệu khác để giảm chi phí hay không.

## 4.10. `break` và `continue`

`break` kết thúc loop hoặc switch gần nhất:

```java
for (int i = 0; i < 10; i++) {
    if (i == 5) {
        break;
    }
    System.out.println(i);
}
```

`continue` bỏ qua phần còn lại của iteration hiện tại:

```java
for (int i = 0; i < 5; i++) {
    if (i % 2 == 0) {
        continue;
    }
    System.out.println(i); // 1, 3
}
```

## 4.11. Labeled break và labeled continue

Với loop lồng nhau, label cho phép điều khiển loop bên ngoài:

```java
outer:
for (int row = 0; row < 3; row++) {
    for (int column = 0; column < 3; column++) {
        if (row == column) {
            break outer;
        }
    }
}
```

Labeled `continue` chuyển sang iteration kế tiếp của loop được đánh dấu:

```java
rows:
for (int row = 0; row < 3; row++) {
    for (int column = 0; column < 3; column++) {
        if (column == 1) {
            continue rows;
        }
        System.out.println(row + ":" + column);
    }
}
```

Label hữu ích trong một số thuật toán, nhưng nếu dùng nhiều có thể làm control flow khó theo dõi. Thường nên tách logic thành method và dùng `return`.

## 4.12. `return` statement

`return` kết thúc method hiện tại. Method `void` có thể return không kèm giá trị; method có return type phải trả về giá trị tương thích:

```java
static int findFirstPositive(int[] values) {
    for (int value : values) {
        if (value > 0) {
            return value;
        }
    }
    return -1;
}
```

Trong service code, `return` thường được dùng cho guard clause hoặc trả kết quả sớm. Cần bảo đảm mọi đường đi của method non-void đều return:

```java
static String status(boolean active) {
    if (active) {
        return "ACTIVE";
    }
    return "INACTIVE";
}
```

`return` trong vòng lặp chỉ thoát method, khác với `break` chỉ thoát loop gần nhất.

## 4.13. Chọn cấu trúc điều khiển

| Tình huống | Lựa chọn thường phù hợp |
| --- | --- |
| Kiểm tra điều kiện boolean hoặc guard | `if` |
| Nhiều nhánh dựa trên một giá trị | `switch` |
| Cần trả về giá trị từ nhiều case | `switch expression` |
| Không biết trước số lần lặp | `while` |
| Luôn chạy body ít nhất một lần | `do-while` |
| Biết biến đếm và điều kiện kết thúc | `for` |
| Duyệt toàn bộ array/collection | Enhanced `for` |

## 4.14. Những điểm cần nhớ của Chương 4

- Condition trong Java phải là `boolean`.
- `switch` statement và `switch` expression là hai cách dùng khác nhau.
- Arrow case `->` giảm fall-through; block expression dùng `yield`.
- Java 21 có pattern matching for `switch` chuẩn và hỗ trợ `case null`, type pattern, `when` guard.
- `while` có thể chạy zero lần, `do-while` chạy ít nhất một lần.
- Enhanced `for` phù hợp để đọc toàn bộ phần tử nhưng không thay thế loop index trong mọi tình huống.
- `break` kết thúc loop; `continue` bỏ qua iteration hiện tại; labeled variants điều khiển loop bên ngoài.
- `return` kết thúc method, không chỉ kết thúc loop.

# Chương 5. Arrays

Array (`mảng`) là cấu trúc dữ liệu có kích thước cố định, chứa các phần tử cùng một kiểu và truy cập bằng index bắt đầu từ `0`.

Array vẫn quan trọng trong Java backend vì được dùng để xử lý byte, buffer, dữ liệu tuần tự, kết quả API thấp tầng và là nền tảng khái niệm của nhiều cấu trúc dữ liệu khác.

## 5.1. One-dimensional array

Cách viết được khuyến nghị:

```java
int[] numbers;
String[] names;
```

Cách đặt dấu `[]` sau tên vẫn hợp lệ nhưng ít nhất quán hơn:

```java
int numbers[];
```

Tạo array có độ dài cố định:

```java
int[] numbers = new int[5];
```

Array có `5` phần tử với index từ `0` đến `4`. Không thể tăng length của chính array sau khi tạo.

## 5.2. Array initialization

Khởi tạo bằng initializer:

```java
int[] scores = {70, 80, 90};
String[] names = {"An", "Bình", "Chi"};
```

Khi dùng initializer sau một phép gán riêng, cần viết `new type[]{...}`:

```java
int[] values;
values = new int[]{1, 2, 3};
```

Array element được khởi tạo theo kiểu:

```java
int[] numbers = new int[3];       // {0, 0, 0}
boolean[] flags = new boolean[2]; // {false, false}
String[] names = new String[2];   // {null, null}
```

Array là object, nên reference tới array có thể là `null`:

```java
int[] values = null;
// System.out.println(values.length); // NullPointerException
```

`length` là field của array, không phải method:

```java
int size = scores.length;
```

Viết `scores.length()` là lỗi compile.

## 5.3. Array traversal

Truy cập và cập nhật phần tử:

```java
int[] numbers = {10, 20, 30};

System.out.println(numbers[0]); // 10
numbers[1] = 25;
```

Index ngoài phạm vi gây `ArrayIndexOutOfBoundsException`:

```java
// numbers[3] = 40;
```

Duyệt bằng index:

```java
for (int i = 0; i < numbers.length; i++) {
    System.out.println(numbers[i]);
}
```

Duyệt bằng enhanced `for`:

```java
for (int number : numbers) {
    System.out.println(number);
}
```

Tính tổng:

```java
int sum = 0;
for (int number : numbers) {
    sum += number;
}
```

Với primitive array, biến loop nhận bản sao giá trị. Gán lại biến loop không thay đổi array:

```java
for (int number : numbers) {
    number = 0;
}
```

Nếu cần sửa phần tử, dùng index:

```java
for (int i = 0; i < numbers.length; i++) {
    numbers[i] = 0;
}
```

## 5.4. Multidimensional và jagged array

Java không có “matrix primitive” riêng. Mảng hai chiều là array chứa các array khác:

```java
int[][] matrix = {
    {1, 2, 3},
    {4, 5, 6}
};

System.out.println(matrix[1][2]); // 6
```

Do là array-of-arrays, các hàng có thể có độ dài khác nhau. Đây là jagged array:

```java
int[][] jagged = new int[3][];
jagged[0] = new int[]{1};
jagged[1] = new int[]{2, 3};
jagged[2] = new int[]{4, 5, 6};
```

Đừng giả định `matrix.length` là số cột. `matrix.length` là số hàng; `matrix[row].length` là số phần tử của từng hàng.

```java
for (int row = 0; row < matrix.length; row++) {
    for (int column = 0; column < matrix[row].length; column++) {
        System.out.println(matrix[row][column]);
    }
}
```

Trong jagged array, nếu một row chưa được gán, `matrix[row]` có thể là `null` và truy cập length sẽ gây NPE.

## 5.5. Mô hình bộ nhớ của array

Theo mô hình khái niệm:

```text
int[] numbers = {10, 20, 30};

reference ───────> array object
                   length = 3
                   [0] = 10
                   [1] = 20
                   [2] = 30
```

Array object lưu length cố định và các element. Với primitive array, element là primitive value. Với reference array, element là reference:

```java
String[] users = new String[2];
users[0] = "Alice";
users[1] = "Bob";
```

Một array reference có thể được gán qua `Object[]` do array covariance:

```java
String[] strings = new String[2];
Object[] objects = strings;
```

Nhưng ghi sai type có thể gây `ArrayStoreException` tại runtime:

```java
// objects[0] = 42; // ArrayStoreException
```

Đây là một lý do Collections với Generics thường an toàn kiểu hơn array covariance trong code ứng dụng.

## 5.6. Array copying

Gán một array reference không tạo bản sao:

```java
int[] original = {1, 2, 3};
int[] alias = original;

alias[0] = 99;
System.out.println(original[0]); // 99
```

Copy bằng `Arrays.copyOf`:

```java
int[] original = {1, 2, 3};
int[] copy = Arrays.copyOf(original, 5);
System.out.println(Arrays.toString(copy)); // [1, 2, 3, 0, 0]
```

Copy một range với cận dưới inclusive và cận trên exclusive:

```java
int[] slice = Arrays.copyOfRange(original, 1, 3); // [2, 3]
```

`System.arraycopy` phù hợp khi cần thao tác copy ở mức thấp:

```java
int[] target = new int[3];
System.arraycopy(original, 0, target, 0, original.length);
```

Đây là shallow copy. Với array chứa object, các array mới vẫn trỏ tới cùng object bên trong:

```java
User[] copied = Arrays.copyOf(users, users.length);
```

Nếu sửa state của một `User`, nhìn từ array kia cũng thấy thay đổi. Deep copy cần clone/copy từng object theo contract riêng của domain.

## 5.7. Class `java.util.Arrays`

### `Arrays.toString()`

```java
import java.util.Arrays;

int[] values = {3, 1, 2};
System.out.println(Arrays.toString(values)); // [3, 1, 2]
```

Với array nhiều chiều:

```java
System.out.println(Arrays.deepToString(matrix));
```

Không dùng trực tiếp `System.out.println(values)` để in nội dung array; cách đó thường in class name và identity hash.

### `Arrays.equals()` và `Arrays.deepEquals()`

```java
int[] first = {1, 2, 3};
int[] second = {1, 2, 3};

System.out.println(first == second);              // false
System.out.println(Arrays.equals(first, second)); // true
```

`Arrays.equals` so sánh element của array một chiều. Với array lồng nhau, dùng `Arrays.deepEquals`:

```java
int[][] left = {{1, 2}, {3, 4}};
int[][] right = {{1, 2}, {3, 4}};

System.out.println(Arrays.deepEquals(left, right)); // true
```

### `Arrays.sort()`

```java
int[] numbers = {5, 1, 4, 2, 3};

Arrays.sort(numbers);
System.out.println(Arrays.toString(numbers)); // [1, 2, 3, 4, 5]
```

`Arrays.sort` thay đổi array gốc. Nếu cần giữ dữ liệu gốc, copy trước. Có thể sort một range hoặc array object theo comparator trong overload phù hợp.

### `Arrays.binarySearch()`

```java
int[] sorted = {10, 20, 30, 40, 50};

int index = Arrays.binarySearch(sorted, 30);
System.out.println(index); // 2
```

Array phải được sort trước khi dùng `binarySearch`. Nếu không tìm thấy, kết quả là số âm biểu diễn insertion point theo công thức `-(insertion point) - 1`.

### `Arrays.fill()`

```java
int[] values = new int[5];
Arrays.fill(values, 7);
Arrays.fill(values, 1, 3, 9);

System.out.println(Arrays.toString(values)); // [7, 9, 9, 7, 7]
```

Range của `fill` có cận dưới inclusive và cận trên exclusive.

### `Arrays.asList()`

`Arrays.asList` chuyển một array reference type hoặc các argument varargs thành một List có kích thước cố định và backed by array:

```java
String[] names = {"An", "Bình", "Chi"};
var namesView = Arrays.asList(names);

namesView.set(0, "Anh"); // Hợp lệ và thay đổi names[0]
// namesView.add("Dung"); // UnsupportedOperationException
```

`Arrays.asList` không phải một mutable-size list. `add` và `remove` thường ném `UnsupportedOperationException`. Với primitive array, cần chú ý trap:

```java
int[] numbers = {1, 2, 3};
var list = Arrays.asList(numbers);
System.out.println(list.size()); // 1: một phần tử kiểu int[]
```

Trong trường hợp này, varargs nhận cả `int[]` như một object thay vì tạo list ba số nguyên. Nếu cần list wrapper, dùng stream hoặc loop chuyển đổi rõ ràng.

## 5.8. Sorting và searching: độ phức tạp

| Thao tác | Cách làm | Độ phức tạp khái quát |
| --- | --- | --- |
| Truy cập `array[index]` | Truy cập trực tiếp | `O(1)` |
| Tìm tuần tự | Duyệt từ đầu đến cuối | `O(n)` |
| Sort comparison-based | `Arrays.sort` | Thường khoảng `O(n log n)` |
| Binary search | Array đã sort | `O(log n)` |
| Copy toàn bộ array | Duyệt/copy n phần tử | `O(n)` |

`binarySearch` chỉ có ý nghĩa khi điều kiện array đã sort được bảo đảm. Nếu dữ liệu thay đổi thường xuyên và cần thêm/xóa linh hoạt, array cố định có thể không phải lựa chọn phù hợp.

## 5.9. Arrays vs Collections

Chọn array khi:

- kích thước cố định là một phần của contract;
- cần primitive array như `byte[]`;
- cần biểu diễn buffer hoặc dữ liệu tuần tự;
- cần API thấp tầng và truy cập index trực tiếp.

Chọn Collection như `ArrayList` khi:

- kích thước thay đổi;
- cần các method thêm, xóa, tìm kiếm và abstraction cao hơn;
- cần kết hợp với Generics để kiểm soát kiểu;
- dữ liệu là tập phần tử nghiệp vụ trong service.

Array không lỗi thời; nó là primitive building block. Nhưng trong Java backend, không nên dùng array cố định cho dữ liệu có yêu cầu thêm/xóa động chỉ vì array có cú pháp đơn giản.

## 5.10. Những lỗi array thường gặp

### `length` và `length()`

```java
int size = values.length; // Đúng
// int wrong = values.length(); // Sai
```

### Off-by-one

```java
for (int i = 0; i <= values.length; i++) { // Sai
    System.out.println(values[i]);
}
```

Index cuối là `values.length - 1`, nên điều kiện đúng là `i < values.length`.

### `ArrayIndexOutOfBoundsException`

Exception xảy ra khi index âm hoặc index lớn hơn/equal length:

```java
int[] values = {1, 2, 3};
// int result = values[3]; // ArrayIndexOutOfBoundsException
```

Không nên bắt exception này để điều khiển loop. Kiểm soát index và invariant ngay tại nơi truy cập.

### So sánh array bằng `==`

`==` chỉ kiểm tra hai biến có trỏ cùng array object hay không. Dùng `Arrays.equals` hoặc `Arrays.deepEquals` để so sánh nội dung.

### Dùng `binarySearch` trên array chưa sort

Kết quả không còn đáng tin cậy nếu precondition bị vi phạm.

## 5.11. Những điểm cần nhớ của Chương 5

- Array có kích thước cố định và index bắt đầu từ `0`.
- `length` là field, không phải method.
- Array element nhận default value theo kiểu.
- `Arrays.sort` thay đổi array gốc; `binarySearch` yêu cầu array đã sort.
- Dùng `Arrays.toString`, `Arrays.equals` và `Arrays.deepToString` thay vì `==` hoặc `println` trực tiếp.
- Array nhiều chiều là array-of-arrays và có thể là jagged array.
- `Arrays.asList` tạo list kích thước cố định và có trap với primitive array.
- Truy cập index là `O(1)`, tìm tuần tự là `O(n)`, binary search trên dữ liệu đã sort là `O(log n)`.

# Tổng kết Java Core 21 — Phần 1

## Bản đồ kiến thức

```text
Source code
   │
   ├── javac
   ▼
Bytecode (.class)
   │
   ├── ClassLoader + Verification
   ├── Interpreter
   └── JIT Compiler
   ▼
JVM runtime
   ├── Stack frames per thread
   ├── Heap và Garbage Collection
   └── Runtime libraries
```

Trong Java code:

```text
Variables → Types → Operators → Control Flow → Arrays
```

Mỗi phần phụ thuộc phần trước. Nếu chưa hiểu numeric promotion, rất dễ sai khi đọc operator. Nếu chưa hiểu reference và array length, rất dễ tạo bug trong loop. Nếu chưa hiểu JVM và GC, rất dễ diễn giải sai về hiệu năng và memory.

## Câu hỏi phỏng vấn tự kiểm tra

1. `JDK`, `JRE` và `JVM` khác nhau thế nào trong Java 21?
2. Vì sao Java được gọi là platform independent nhưng JVM lại platform dependent?
3. Bytecode là gì và vì sao JVM dùng mô hình stack-based?
4. Interpreter và JIT phối hợp như thế nào?
5. Khi nào một object trở thành eligible for GC?
6. Vì sao local variable không có default value như instance field?
7. `var` có làm Java thành dynamically typed không?
8. Khác nhau giữa `==` và `equals` khi làm việc với `String`?
9. Vì sao `byte result = a + b` thường không compile?
10. Integer division khác floating-point division thế nào?
11. Khi nào `&&` an toàn hơn `&`?
12. `switch expression` khác `switch statement` thế nào?
13. Pattern matching for `switch` trong Java 21 giải quyết vấn đề gì?
14. Vì sao enhanced `for` không phù hợp khi cần index hoặc thay đổi vị trí phần tử?
15. Điều kiện nào phải được bảo đảm trước khi gọi `Arrays.binarySearch`?

## Bài tập nhỏ

Viết một chương trình Java 21 nhận các argument dạng số nguyên từ command line và:

1. chuyển từng argument từ `String` thành `int`;
2. lưu chúng trong một `int[]`;
3. tính tổng, giá trị nhỏ nhất và lớn nhất;
4. tạo một bản sao đã sắp xếp bằng `Arrays.copyOf` và `Arrays.sort`;
5. in ra array gốc và array đã sort bằng `Arrays.toString`;
6. xử lý trường hợp không có argument và argument không phải số hợp lệ;
7. giải thích trong comment local variable, reference tới array, stack frame và heap object theo mô hình khái niệm.

Mục tiêu không chỉ là làm chương trình chạy. Hãy giải thích được kiểu dữ liệu của từng expression, điểm có thể phát sinh exception và độ phức tạp của từng thao tác.

## Tài liệu tham khảo

- [Java Language Specification, Java SE 21](https://docs.oracle.com/javase/specs/jls/se21/html/)
- [Java Virtual Machine Specification, Java SE 21](https://docs.oracle.com/javase/specs/jvms/se21/html/)
- [Java SE 21 API Documentation](https://docs.oracle.com/en/java/javase/21/docs/api/)
- [Java Development Kit 21 Documentation](https://docs.oracle.com/en/java/javase/21/)
