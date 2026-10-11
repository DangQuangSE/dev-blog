# JAVA CORE 21 — PHẦN 10: JVM INTERNALS & GARBAGE COLLECTION

Giáo trình chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Trong chín phần trước, bạn đã học cách viết Java, tổ chức code bằng OOP, xử lý collections, generics, stream và concurrency. Phần này đi xuống một tầng sâu hơn: chương trình Java được class loader nạp như thế nào, bytecode được thực thi ra sao, JVM quản lý stack và heap thế nào, và Garbage Collector quyết định vùng nhớ nào có thể thu hồi bằng cách nào.

Đối với Backend Developer, hiểu JVM không phải để ghi nhớ mọi flag của HotSpot. Mục tiêu là xây dựng một mô hình đúng để có thể:

- Giải thích vì sao cùng một bytecode có thể chạy trên nhiều hệ điều hành.
- Phân biệt JVM Specification với chi tiết triển khai của HotSpot.
- Đọc một stack trace, heap dump, thread dump hoặc GC log ở mức cơ bản.
- Hiểu vì sao ứng dụng có thể chậm do allocation rate, GC pause, class loading hoặc thiếu native memory.
- Phân biệt object không còn được dùng với object vẫn reachable nhưng bị giữ lại ngoài ý muốn.
- Chọn hướng điều tra phù hợp thay vì chỉ tăng Xmx hoặc gọi System.gc().

## Nội dung Phần 10

| Chương | Chủ đề | Trọng tâm |
| --- | --- | --- |
| 30 | JVM Architecture & Class Loading | Bytecode, class loader, loading/linking/initialization, runtime data areas, interpreter, JIT và diagnostics |
| 31 | Memory Management & Garbage Collection | Reachability, GC roots, reference types, generations, G1, ZGC, memory leak, dumps, logs và tuning |
| Tổng kết | Thực hành và phỏng vấn | Bài tập chẩn đoán, checklist production và câu hỏi phỏng vấn |

## JVM Specification và HotSpot không phải cùng một khái niệm

JVM Specification mô tả một máy ảo trừu tượng: class file phải có dạng gì, instruction có ý nghĩa gì và các runtime data areas cần cung cấp semantics nào. Specification không bắt buộc mọi JVM phải có cùng layout bộ nhớ, cùng thuật toán GC hay cùng cách JIT compile.

HotSpot là một JVM implementation phổ biến được dùng trong nhiều bản OpenJDK và Oracle JDK. Các khái niệm như Metaspace, G1, ZGC, TLAB, compressed ordinary object pointers và tiered compilation thường là chi tiết của HotSpot hoặc của một implementation cụ thể.

Trong giáo trình này:

- Khi nói theo chuẩn, nội dung sẽ ghi JVM Specification.
- Khi nói về hành vi HotSpot Java 21, nội dung sẽ ghi rõ HotSpot hoặc OpenJDK.
- Một mô hình minh họa như local variable nằm trong stack và object nằm trên heap chỉ là mô hình học tập; JIT có thể tối ưu cách lưu trữ thực tế.

# CHƯƠNG 30. JVM ARCHITECTURE & CLASS LOADING

## 30.1. JVM là gì?

JVM, viết đầy đủ là Java Virtual Machine, là môi trường runtime có khả năng tải và thực thi Java bytecode theo các quy tắc của JVM Specification.

JVM không đọc trực tiếp source code Java như:

~~~java
System.out.println("Hello JVM");
~~~

Quy trình thông thường là:

~~~text
Main.java
   |
   | javac
   v
Main.class
   |
   | java Main
   v
JVM loads, links and executes bytecode
   |
   v
Instructions executed on the current OS and CPU
~~~

Một JVM thường đảm nhận các trách nhiệm sau:

1. Tải class và interface khi cần.
2. Kiểm tra class file và bytecode.
3. Chuẩn bị runtime representation cho class.
4. Quản lý runtime data areas.
5. Thực thi bytecode bằng interpreter và compiler runtime.
6. Quản lý thread và exception flow.
7. Quản lý object memory thông qua garbage collector.
8. Cung cấp giao tiếp với native code khi cần.

JVM là nền tảng thực thi, không phải compiler source code. Compiler javac thuộc JDK và chạy trước hoặc trong quá trình launcher xử lý source file.

## 30.2. Từ source code đến machine code

Ví dụ:

~~~java
public class Main {

    public static void main(String[] args) {
        int total = 10 + 20;
        System.out.println(total);
    }
}
~~~

Biên dịch:

~~~bash
javac Main.java
~~~

Kết quả là một class file chứa bytecode, constant pool, metadata và những attributes cần thiết.

Chạy:

~~~bash
java Main
~~~

Khi chạy, JVM không nhất thiết compile toàn bộ chương trình thành native code ngay lập tức. Một chương trình thường bắt đầu bằng interpreter hoặc một mức compilation ban đầu, sau đó JVM thu thập profile runtime và JIT compile những đoạn code có lợi.

Vì vậy, pipeline thực tế có thể hình dung như sau:

~~~text
Source code
  -> javac
Class file / bytecode
  -> class loading and verification
Interpreter executes initial code
  -> runtime profiling
JIT compiles hot code
  -> optimized native code
CPU executes
~~~

Đây là mô hình động, không phải chuỗi bước cố định áp dụng giống nhau cho từng method.

## 30.3. Write Once, Run Anywhere

Java nổi tiếng với nguyên tắc Write Once, Run Anywhere, thường viết tắt là WORA.

Ý tưởng:

- javac tạo bytecode có format độc lập với CPU và operating system.
- Windows, Linux và macOS có thể dùng JVM phù hợp để thực thi bytecode đó.
- JVM implementation chịu trách nhiệm chuyển semantics của bytecode thành hoạt động phù hợp với nền tảng.

Ví dụ:

~~~text
Application.class
       |
       +-- Windows JVM -> Windows machine instructions
       |
       +-- Linux JVM   -> Linux machine instructions
       |
       +-- macOS JVM   -> macOS machine instructions
~~~

WORA không có nghĩa ứng dụng luôn hoàn toàn portable. Những nguyên nhân làm giảm tính di động gồm:

- Native library hoặc JNI.
- Đường dẫn file phụ thuộc hệ điều hành.
- Lệnh shell riêng của Windows hoặc Unix.
- Khác biệt về file permissions.
- Environment variables và system properties.
- Charset hoặc locale mặc định.
- Phiên bản Java không tương thích class file.
- Database driver, container hoặc dependency phụ thuộc platform.

Ví dụ không portable:

~~~java
String path = "C:\\Users\\Public\\data.txt";
~~~

Cách portable hơn:

~~~java
Path path = Path.of(
        System.getProperty("user.home"),
        "Public",
        "data.txt"
);
~~~

Ngay cả ví dụ dùng Path cũng chỉ portable về cách ghép path; thư mục Public có tồn tại hay không vẫn là vấn đề môi trường.

## 30.4. JVM, JRE và JDK

### JVM

JVM là thành phần thực thi bytecode.

Nó cung cấp execution engine, runtime data areas, class loading và các runtime services cần thiết.

### JRE

JRE, Java Runtime Environment, là thuật ngữ mô tả môi trường cần để chạy một ứng dụng Java, bao gồm JVM và các runtime libraries phù hợp.

Với Java hiện đại, Oracle không còn phân phối JRE độc lập theo mô hình quen thuộc của Java 8 cho mọi trường hợp. Người phát triển thường cài JDK, sau đó có thể tạo runtime image tối thiểu bằng jlink.

### JDK

JDK, Java Development Kit, là bộ công cụ dành cho phát triển Java. JDK bao gồm runtime và các tool như:

~~~text
java
javac
jar
javadoc
javap
jshell
jdb
jcmd
jstack
jmap
jfr
jlink
~~~

Mối quan hệ khái niệm:

~~~text
JDK
├── Development tools
│   ├── javac
│   ├── jar
│   ├── javadoc
│   ├── javap
│   ├── jdb
│   └── jshell
└── Runtime
    ├── Java libraries
    └── JVM
        ├── Class loading
        ├── Execution
        ├── Memory management
        └── Garbage collection
~~~

Một cách trả lời phỏng vấn ngắn gọn:

> JDK là bộ công cụ phát triển, JRE là khái niệm về môi trường runtime, còn JVM là máy ảo trực tiếp tải và thực thi bytecode. Trong Java hiện đại, JRE thường không còn được cài như một bộ phân phối độc lập; có thể dùng JDK hoặc tạo runtime image tùy chỉnh.

## 30.5. JVM Architecture — các nhóm thành phần chính

Một mô hình khái niệm của HotSpot JVM:

~~~text
                    Java Application
                           |
              Class Loader Subsystem
       loading -> linking -> initialization
                           |
       +-------------------+-------------------+
       |                                       |
Runtime Data Areas                     Execution Engine
       |                            interpreter + JIT
       |                                       |
       +-------------------+-------------------+
                           |
                  Native Interface
                           |
                Operating System / CPU

Heap + GC, thread management, code cache,
Metaspace và các native runtime services
~~~

Có thể chia thành các nhóm:

1. Class Loader Subsystem: tìm, nạp và định nghĩa class.
2. Runtime Data Areas: lưu trạng thái phục vụ execution.
3. Execution Engine: interpreter, JIT compiler và các tối ưu hóa.
4. Garbage Collector: quản lý bộ nhớ object.
5. Native interface và runtime services: giao tiếp với hệ điều hành, JNI, signal, profiling và những dịch vụ implementation-specific.

Sơ đồ này không phải bản đồ physical memory bắt buộc. JVM Specification cho phép implementation lựa chọn cách tổ chức bộ nhớ và thực thi.

## 30.6. Java Bytecode và Class File

Bytecode là tập instruction trung gian dành cho JVM. Class file thường có phần mở rộng .class và có cấu trúc binary được chuẩn hóa.

Class file chứa những thông tin như:

- Magic number và class file version.
- Constant pool.
- Access flags.
- Tên class và superclass.
- Interfaces.
- Field definitions.
- Method definitions.
- Code attributes và exception tables.
- Debugging hoặc runtime-visible attributes tùy compiler.

Bạn có thể kiểm tra class file bằng:

~~~bash
javap -c Main
javap -c -v Main
~~~

Option c hiển thị bytecode. Option v hiển thị thông tin verbose như constant pool, flags, descriptors và attributes.

### Ví dụ bytecode

Source code:

~~~java
public class Calculator {

    public static int add(int a, int b) {
        return a + b;
    }
}
~~~

Một output rút gọn có thể giống:

~~~text
public static int add(int, int);
  Code:
     0: iload_0
     1: iload_1
     2: iadd
     3: ireturn
~~~

Ý nghĩa:

| Instruction | Ý nghĩa |
| --- | --- |
| iload_0 | Đưa int ở local variable slot 0 lên operand stack |
| iload_1 | Đưa int ở local variable slot 1 lên operand stack |
| iadd | Lấy hai int trên operand stack, cộng và đẩy kết quả lên stack |
| ireturn | Trả về một giá trị int |

JVM bytecode có tính stack-based. Instruction thường lấy operands từ operand stack và đẩy kết quả trở lại stack.

### Operand stack

~~~text
Ban đầu:       []

iload_0         [a]

iload_1         [a, b]

iadd            [a + b]

ireturn         return a + b
~~~

Một số instruction có prefix mô tả loại dữ liệu:

| Prefix | Ý nghĩa thường gặp |
| --- | --- |
| i | int |
| l | long |
| f | float |
| d | double |
| a | reference |

Ví dụ iload là load int, aload là load reference, lreturn là trả long và areturn là trả reference.

Không nên xem những prefix này là toàn bộ hệ thống kiểu Java. Bytecode còn có instruction và quy tắc riêng cho object, array, conversion, invocation và synchronization.

### Constant pool

Constant pool là bảng các hằng số và symbolic references được class file sử dụng. Nó có thể chứa:

- Integer, long, float, double constants.
- String references.
- Class names.
- Field references.
- Method references.
- MethodHandle và dynamic call-site information.

Một symbolic reference chưa nhất thiết được chuyển thành địa chỉ vật lý ngay khi class được load. JVM có thể resolve nó khi cần theo các quy tắc linking.

### Class file version

Bytecode được tạo bởi JDK mới hơn có thể không chạy trên JVM cũ hơn nếu class file version không được hỗ trợ.

Ví dụ, biên dịch với JDK 21 rồi chạy bằng một JVM cũ có thể gây UnsupportedClassVersionError.

Có thể chỉ định target release khi biên dịch:

~~~bash
javac --release 21 Main.java
~~~

Option release giúp compiler nhắm tới một Java platform release cụ thể, nhưng để chạy được vẫn cần runtime tương thích.

## 30.7. Class Loading là gì?

Class loading là quá trình JVM tìm binary representation của một class hoặc interface và tạo runtime representation tương ứng.

Ví dụ khi code sử dụng:

~~~java
Student student = new Student();
~~~

JVM cần biết định nghĩa của Student trước khi có thể tạo object. Class có thể được tìm từ:

- Application class path.
- Module path.
- JAR file.
- Platform modules.
- Custom ClassLoader.
- Nguồn dữ liệu khác do application định nghĩa.

Class loading thường được mô tả qua ba giai đoạn lớn:

~~~text
Loading
   |
Linking
   ├── Verification
   ├── Preparation
   └── Resolution
   |
Initialization
~~~

Các giai đoạn có liên hệ nhưng không nên hiểu là mọi implementation luôn hoàn thành mọi bước resolution theo một thời điểm cố định.

## 30.8. Loading, Linking và Initialization

### Loading

Trong loading, JVM:

1. Tìm class definition theo binary name.
2. Đọc hoặc tạo dữ liệu class.
3. Tạo runtime Class object hoặc cấu trúc tương ứng.
4. Ghi nhận defining ClassLoader.

Loading không nhất thiết đồng nghĩa với initialization. Một class có thể đã được load nhưng static initializer chưa chạy.

### Linking

Linking gồm ba hoạt động khái niệm.

#### Verification

JVM kiểm tra class file và bytecode có hợp lệ theo những ràng buộc cần thiết hay không.

Ví dụ:

- Instruction có hợp lệ không.
- Operand stack có được dùng đúng kiểu không.
- Branch target có hợp lệ không.
- Class file có format phù hợp không.
- Các symbolic references có đáp ứng quy tắc access và type không.

Verification là một phần trong các bảo đảm an toàn của JVM, nhưng không thay thế việc kiểm tra dữ liệu nghiệp vụ hoặc authorization của ứng dụng.

#### Preparation

JVM chuẩn bị storage cho static fields và đặt giá trị mặc định.

Ví dụ:

~~~java
class Counter {

    static int count = 100;
}
~~~

Theo cách giải thích khái niệm:

1. Preparation đặt count về default value của int là 0.
2. Initialization chạy field initializer và gán count thành 100.

Constant variables có những quy tắc đặc biệt. Một compile-time constant có thể được compiler inline vào class sử dụng nó.

#### Resolution

Resolution chuyển symbolic reference trong constant pool thành dạng runtime reference phù hợp.

Resolution có thể liên quan tới:

- Class hoặc interface.
- Field.
- Method.
- Interface method.
- Method handle hoặc dynamic call site.

JVM Specification cho phép implementation thực hiện resolution sớm hoặc lazy hơn, miễn các ràng buộc về tính đúng đắn và thời điểm ném linkage errors được bảo đảm.

### Initialization

Initialization thực thi logic khởi tạo class hoặc interface:

- Static field initializers.
- Static initialization blocks.
- Logic được compiler gom vào class initialization method, thường được biểu diễn khái niệm bằng method &lt;clinit&gt;.

Ví dụ:

~~~java
class Configuration {

    static int port = 8080;

    static {
        System.out.println("Configuration initialized");
    }
}
~~~

Khi class được initialized, các statements chạy theo thứ tự xuất hiện trong class.

## 30.9. Khi nào class được initialized?

Một số hành động có thể trigger initialization:

- Tạo instance của class bằng new.
- Gọi một static method do class khai báo.
- Đọc hoặc ghi static field do class khai báo, nếu field không phải compile-time constant.
- Một số thao tác reflection hoặc runtime khác yêu cầu initialization.

Ví dụ:

~~~java
class Demo {

    static final int COMPILE_TIME_CONSTANT = 100;

    static int runtimeValue = 200;

    static {
        System.out.println("Demo initialized");
    }
}
~~~

Đọc:

~~~java
int a = Demo.COMPILE_TIME_CONSTANT;
~~~

không nhất thiết trigger initialization, vì compiler có thể inline giá trị 100.

Đọc:

~~~java
int b = Demo.runtimeValue;
~~~

thường cần class được initialized trước khi đọc giá trị runtimeValue.

Không nên dùng một ví dụ đơn giản để suy ra mọi thao tác với Class object đều luôn trigger initialization. Reflection API có các method và flag khác nhau.

### Thứ tự khởi tạo static

~~~java
public class Main {

    static int value = 10;

    static {
        System.out.println("Static block sees: " + value);
        value = 20;
    }

    public static void main(String[] args) {
        System.out.println("Main sees: " + value);
    }
}
~~~

Output:

~~~text
Static block sees: 10
Main sees: 20
~~~

Field initializer và static block chạy theo thứ tự textual, sau bước preparation.

### Initialization là synchronized

Nếu nhiều threads cùng yêu cầu initialization của một class, JVM phải bảo đảm class initialization diễn ra đúng một lần theo semantics của Java. Một thread thực hiện initialization; các thread khác có thể phải chờ hoặc quan sát kết quả phù hợp.

Nếu initialization thất bại, những lần sử dụng tiếp theo có thể dẫn tới ExceptionInInitializerError hoặc NoClassDefFoundError tùy tình huống và trạng thái class.

## 30.10. Built-in ClassLoaders trong Java 21

Java runtime có ba class loader built-in quan trọng:

| ClassLoader | Vai trò |
| --- | --- |
| Bootstrap ClassLoader | Nạp nhiều class cốt lõi của nền tảng |
| Platform ClassLoader | Nạp platform classes và những module phù hợp |
| System/Application ClassLoader | Nạp application classes từ class path hoặc module path |

### Bootstrap ClassLoader

Bootstrap loader là thành phần đặc biệt bên trong JVM. Khi gọi getClassLoader() trên những class do bootstrap loader định nghĩa, kết quả thường được biểu diễn là null.

Null ở đây không có nghĩa class chưa được load. Nó thể hiện class được định nghĩa bởi bootstrap loader đặc biệt.

### Platform ClassLoader

Platform loader phục vụ các Java SE platform classes và một số runtime classes theo module architecture.

### System hoặc Application ClassLoader

System class loader, còn gọi application class loader, thường nạp classes của ứng dụng từ class path hoặc module path.

Kiểm tra:

~~~java
System.out.println(String.class.getClassLoader());
System.out.println(Main.class.getClassLoader());
System.out.println(ClassLoader.getPlatformClassLoader());
System.out.println(ClassLoader.getSystemClassLoader());
~~~

Output cụ thể phụ thuộc runtime, nhưng String.class thường có class loader là null, còn class của application thường có system class loader.

### Custom ClassLoader

Custom ClassLoader có thể được dùng cho:

- Plugin systems.
- Isolated modules.
- Dynamic loading.
- Application servers.
- Reloadable components.
- Một số cơ chế instrument hoặc framework.

Không nên tự viết custom loader chỉ để thay thế import hoặc load class thông thường. Class loading sai có thể gây class identity conflicts, memory leak và lỗi khó debug.

## 30.11. Parent Delegation Model

ClassLoader mặc định thường tuân theo mô hình parent delegation:

1. Kiểm tra class đã được loader này load chưa.
2. Ủy quyền cho parent tìm class.
3. Nếu parent không tìm thấy, loader hiện tại mới tìm class bằng findClass hoặc logic riêng.
4. Nếu resolve được yêu cầu, thực hiện resolution theo quy tắc.

Sơ đồ:

~~~text
Application ClassLoader
          |
          v
Platform ClassLoader
          |
          v
Bootstrap ClassLoader
~~~

Lợi ích:

- Tránh application tự định nghĩa class trùng với class nền tảng.
- Tái sử dụng class đã được loader cha nạp.
- Giúp duy trì tính nhất quán của core types.
- Phân chia trách nhiệm loading.

Parent delegation là chiến lược mặc định phổ biến, nhưng custom class loader có thể có mục đích đặc biệt và không bắt buộc hành xử giống hoàn toàn.

### Class identity

Trong JVM, một runtime class thường được nhận diện bởi cặp:

~~~text
(binary name, defining ClassLoader)
~~~

Vì vậy, hai class có cùng tên đầy đủ com.example.User nhưng được định nghĩa bởi hai class loader khác nhau có thể là hai runtime types khác nhau.

Một object của class User do loader A định nghĩa có thể không cast được sang User do loader B định nghĩa. Lỗi thường xuất hiện dưới dạng ClassCastException dù tên class trong message trông giống nhau.

Đây là nguyên nhân thường gặp trong plugin systems, hot reload và một số application containers.

## 30.12. ClassNotFoundException, LinkageError và NoClassDefFoundError

### ClassNotFoundException

Đây là checked exception, thường xảy ra khi code chủ động yêu cầu load class theo tên nhưng class không tìm thấy.

~~~java
Class<?> type = Class.forName("com.example.DoesNotExist");
~~~

Nếu class không có trên class path hoặc module path phù hợp, Class.forName có thể ném ClassNotFoundException.

### NoClassDefFoundError

Đây là Error. Nó có thể xảy ra khi class đã có liên quan ở compile time hoặc trong quá trình load một class khác, nhưng runtime không thể tìm hoặc định nghĩa class cần thiết.

Các nguyên nhân thường gặp:

- Dependency có lúc compile nhưng thiếu lúc chạy.
- JAR không có trong runtime class path.
- Class initialization của dependency thất bại trước đó.
- Packaging hoặc class path bị sai.

### LinkageError

LinkageError là nhóm lỗi liên quan đến việc liên kết class hoặc interface.

Ví dụ:

- NoClassDefFoundError.
- IncompatibleClassChangeError.
- VerifyError.
- AbstractMethodError.
- UnsupportedClassVersionError thuộc nhóm LinkageError.

Bảng tóm tắt:

| Tình huống | Loại thường gặp | Cách hiểu |
| --- | --- | --- |
| Explicit dynamic loading không tìm thấy class | ClassNotFoundException | Code yêu cầu load nhưng không tìm thấy |
| Runtime cần class nhưng định nghĩa không sẵn sàng | NoClassDefFoundError | Dependency hoặc initialization/runtime linkage có vấn đề |
| Class file version không được JVM hỗ trợ | UnsupportedClassVersionError | JDK compile mới hơn runtime |
| Bytecode verification thất bại | VerifyError | Class file không đáp ứng quy tắc verify |

Cách khắc phục đầu tiên không phải catch Error. Hãy kiểm tra dependency tree, class path, module path, package output và phiên bản JDK.

## 30.13. JVM Runtime Data Areas

JVM Specification chia runtime data areas theo cách logic.

### Shared giữa các JVM threads

- Heap.
- Method Area.
- Runtime Constant Pools gắn với class hoặc interface.

### Riêng cho từng thread

- PC Register.
- JVM Stack.
- Native Method Stack theo implementation.

| Vùng | Chia sẻ? | Vai trò |
| --- | --- | --- |
| Heap | Có | Cấp phát class instances và arrays |
| Method Area | Có | Class metadata, method data, runtime constant pool theo specification |
| JVM Stack | Không | Frames của từng thread |
| PC Register | Không | Vị trí instruction hiện tại của thread |
| Native Method Stack | Theo thread | Hỗ trợ native methods |
| Code Cache | Implementation-specific | Native code do JIT compile |

Specification không bắt buộc layout vật lý hay tên vùng memory của từng JVM. Metaspace và Code Cache là cách HotSpot tổ chức một số dữ liệu, không phải tên bắt buộc của JVM Specification.

## 30.14. JVM Stack và Stack Frame

Mỗi JVM thread có một JVM stack riêng. Mỗi lần method được gọi, một frame được tạo cho invocation đó. Khi method kết thúc bình thường hoặc abrupt completion, frame được loại bỏ.

Một frame có:

- Local variable array.
- Operand stack.
- Reference tới runtime constant pool của class chứa method.
- Thông tin phục vụ dynamic linking và exception dispatch.

Ví dụ:

~~~java
static int add(int a, int b) {
    int result = a + b;
    return result;
}
~~~

Frame khái niệm có thể chứa:

~~~text
Local variables:
slot 0 -> a
slot 1 -> b
slot 2 -> result

Operand stack:
intermediate values for a + b
~~~

Kích thước local variable array và operand stack được compiler ghi trong method code attributes. Tuy nhiên, implementation có thể tổ chức frame vật lý khác với hình minh họa.

### Local variable có luôn là một ô RAM trên stack không?

Không nên nói như vậy.

Theo execution model, local variables thuộc local variable array của frame. HotSpot JIT có thể:

- Giữ value trong CPU register.
- Loại bỏ local không ảnh hưởng kết quả.
- Scalar-replace object.
- Inline method làm thay đổi boundary của frame tối ưu.
- Deoptimize về interpreter khi assumption không còn đúng.

Vì vậy, stack frame là mô hình semantics và execution, không phải cam kết về physical placement sau JIT.

## 30.15. Heap

Heap là vùng runtime data area được chia sẻ giữa các JVM threads, nơi bộ nhớ cho class instances và arrays được cấp phát theo JVM Specification.

Ví dụ:

~~~java
User user = new User("Alice");
~~~

Mô hình khái niệm:

~~~text
Current thread frame
    user --------------------+
                              |
                              v
                         Heap object
                         User("Alice")
~~~

Heap có các đặc điểm:

- Được tạo khi JVM khởi động.
- Có thể có initial size và maximum size.
- Có thể tăng hoặc giảm tùy implementation và policy.
- Object không được developer explicit deallocate như trong C.
- Nếu computation cần nhiều heap hơn mức có thể cung cấp, JVM có thể ném OutOfMemoryError.

Heap không đồng nghĩa toàn bộ memory của process. Metaspace, thread stacks, direct buffers, code cache và native allocations nằm ngoài Java heap.

### Object có chắc chắn nằm trên heap không?

Theo mô hình JVM, heap là nơi cấp phát class instances và arrays. Tuy nhiên, HotSpot JIT có thể chứng minh một object không escape khỏi phạm vi cần thiết và tối ưu allocation, ví dụ scalar replacement.

Do đó:

- Khi học Java, hãy dùng mô hình reference trong frame và object trên heap.
- Khi phân tích performance, nhớ rằng JIT có thể thay đổi physical allocation.
- Không suy luận trực tiếp physical layout chỉ từ source code.

### TLAB

HotSpot thường dùng Thread-Local Allocation Buffer để giúp một thread cấp phát object nhỏ nhanh hơn mà giảm contention trên shared allocation path.

TLAB là implementation detail. Nó không thay đổi semantics của object hoặc quy tắc reachability.

## 30.16. Method Area, Runtime Constant Pool và Metaspace

### Method Area

Method Area là vùng logic trong JVM Specification. Nó lưu class-level structures như:

- Runtime constant pool.
- Field và method data.
- Code của methods và constructors.
- Dữ liệu phục vụ class và interface initialization.

Specification không bắt buộc Method Area phải nằm ở vùng memory tên Method Area ngoài heap.

### Metaspace

Metaspace là vùng native memory trong HotSpot dùng để lưu nhiều class metadata. Nó thay thế PermGen trong HotSpot từ Java 8.

So sánh:

| Khái niệm | Bản chất |
| --- | --- |
| Method Area | Khái niệm logic trong JVM Specification |
| Metaspace | Cách HotSpot lưu nhiều class metadata |
| PermGen | Cơ chế cũ của HotSpot, không còn trong HotSpot Java 21 |

Metaspace có thể bị giới hạn bằng các option phù hợp. Nếu class loader liên tục tạo class hoặc class loader cũ không thể được reclaim, process có thể gặp:

~~~text
java.lang.OutOfMemoryError: Metaspace
~~~

### ClassLoader leak

Một class loader chỉ có thể được thu hồi khi không còn reachable, trực tiếp hoặc gián tiếp. Nếu một static field, ThreadLocal, executor task hoặc listener giữ object được định nghĩa bởi class loader, object graph có thể giữ luôn class loader.

Trong ứng dụng plugin hoặc application server, đây là lý do redeploy nhiều lần có thể làm Metaspace tăng.

## 30.17. PC Register và Native Method Stack

### PC Register

Mỗi JVM thread có PC register riêng. Đối với method Java không phải native, nó giữ vị trí instruction JVM hiện đang thực thi. Đối với native method, giá trị có thể không được định nghĩa theo JVM Specification.

PC register cần riêng cho từng thread vì mỗi thread có execution position khác nhau.

### Native Method Stack

JVM có thể dùng native method stacks để hỗ trợ native methods hoặc interpreter được viết bằng native language.

Không nên giả định mọi JVM phải tách physical native stack và Java stack theo cùng một cách. Đây là vùng phụ thuộc implementation.

## 30.18. StackOverflowError

Ví dụ:

~~~java
public class Main {

    static void recursive() {
        recursive();
    }

    public static void main(String[] args) {
        recursive();
    }
}
~~~

Method gọi chính nó vô hạn. Mỗi invocation cần frame mới. Khi thread không thể cung cấp thêm stack capacity, JVM có thể ném:

~~~text
java.lang.StackOverflowError
~~~

Nguyên nhân thường gặp:

- Recursion không có base case.
- Base case sai.
- Dữ liệu đầu vào làm recursion sâu bất thường.
- Một chuỗi callback hoặc proxy gọi vòng lặp.

Flag HotSpot thường gặp:

~~~bash
java -Xss1m Main
~~~

Tăng Xss chỉ thay đổi stack size theo giới hạn platform. Nó không sửa lỗi recursion vô hạn và làm mỗi thread tiêu tốn nhiều native memory hơn.

## 30.19. OutOfMemoryError không chỉ là thiếu heap

OutOfMemoryError là Error được dùng khi JVM hoặc runtime không thể đáp ứng yêu cầu bộ nhớ hoặc tài nguyên liên quan.

Một số message quan trọng:

| Message | Hướng nghi ngờ ban đầu |
| --- | --- |
| Java heap space | Heap không đủ, live set lớn hoặc leak |
| GC overhead limit exceeded | GC tiêu tốn rất nhiều thời gian nhưng thu hồi ít |
| Metaspace | Class metadata hoặc class loader leak |
| Direct buffer memory | Direct ByteBuffer/native memory limit |
| unable to create native thread | Thread stack, OS limit hoặc native memory |
| Requested array size exceeds VM limit | Array quá lớn hoặc kích thước vượt giới hạn |
| Out of swap space | OS/native memory hoặc swap pressure |

Không nên xử lý mọi OOM bằng cách tăng Xmx. Cần đọc message cụ thể và xác định vùng memory đang thiếu.

## 30.20. Execution Engine

Execution Engine là nhóm thành phần thực thi bytecode.

### Interpreter

Interpreter đọc bytecode và thực thi instruction. Ưu điểm:

- Startup nhanh hơn so với compile toàn bộ application.
- Không cần trả compilation cost cho code hiếm khi chạy.
- Phù hợp trong giai đoạn đầu hoặc code ít nóng.

Nhược điểm:

- Code lặp đi lặp lại có thể chịu chi phí dispatch bytecode.
- Ít cơ hội tối ưu chuyên sâu so với native code đã compile.

### JIT Compiler

JIT, Just-In-Time Compiler, compile code tại runtime dựa trên profile thực tế.

JIT có thể quan sát:

- Method được gọi nhiều lần.
- Branch nào thường được chọn.
- Kiểu object thực tế qua call site.
- Allocation và escape behavior.
- Loop hot.
- Exception path ít hay nhiều được đi qua.

JIT không hoạt động theo một ngưỡng cuộc gọi cố định mà developer có thể đảm bảo. Quyết định phụ thuộc JVM implementation, flags, CPU, profile, code shape và runtime conditions.

### Tiered Compilation

HotSpot thường có tiered compilation, kết hợp các mức execution/profiling/optimization khác nhau. Mục tiêu là cân bằng:

- Startup time.
- Profiling quality.
- Compilation overhead.
- Steady-state throughput.

### On-Stack Replacement

Với một loop chạy lâu, JVM có thể compile loop khi method đang thực thi và chuyển execution sang compiled version. Cơ chế này thường được gọi là On-Stack Replacement.

## 30.21. JIT Optimizations và Deoptimization

### Inlining

JIT có thể đưa body của method nhỏ vào call site:

~~~java
static int square(int value) {
    return value * value;
}

int result = square(10);
~~~

Inlining có thể giảm method invocation overhead và mở ra các tối ưu khác. Nó không phải bảo đảm cho mọi method nhỏ.

### Escape Analysis

JIT phân tích object có escape ra ngoài phạm vi method hoặc thread hay không.

Nếu object không escape, compiler có thể:

- Scalar-replace các field.
- Loại bỏ allocation.
- Loại bỏ một số lock không cần thiết.

Đây là tối ưu runtime, không phải lý do để bỏ qua việc thiết kế object model dễ hiểu.

### Dead Code Elimination

Code không ảnh hưởng đến behavior quan sát được có thể bị loại bỏ.

Ví dụ benchmark tự tạo kết quả nhưng không sử dụng có thể bị tối ưu khác với suy nghĩ của người viết benchmark.

### Speculative Optimization

JIT có thể tối ưu dựa trên assumption từ profile runtime, chẳng hạn một call site thường chỉ gặp một implementation.

### Deoptimization

Nếu assumption không còn đúng, JVM có thể deoptimize:

1. Tạm dừng hoặc chuyển execution theo cơ chế phù hợp.
2. Khôi phục trạng thái cần thiết.
3. Tiếp tục bằng interpreter hoặc compiled code ít chuyên biệt hơn.
4. Thu thập profile mới và compile lại nếu phù hợp.

Vì vậy, JIT vừa tối ưu vừa có khả năng quay lui khi profile thay đổi.

## 30.22. Benchmark Java đúng cách

Đo thời gian bằng System.nanoTime trong một lần chạy thường không đáng tin cậy vì kết quả bị ảnh hưởng bởi:

- Class loading.
- JIT warmup.
- GC.
- CPU frequency scaling.
- OS scheduling.
- Dead-code elimination.
- Escape analysis.
- Background threads.

Ví dụ benchmark không đủ tin cậy:

~~~java
long start = System.nanoTime();

for (int i = 0; i < 1_000_000; i++) {
    calculate();
}

long elapsed = System.nanoTime() - start;
System.out.println(elapsed);
~~~

Để microbenchmark nghiêm túc, nên dùng JMH, có warmup, forks, measurement iterations và kiểm soát kết quả. Đối với Backend, load test ở mức HTTP/database thường quan trọng hơn microbenchmark một method đơn lẻ.

## 30.23. Các công cụ JVM nên biết

| Tool | Mục đích |
| --- | --- |
| javap | Xem class file và bytecode |
| jcmd | Gửi diagnostic commands tới JVM đang chạy |
| jstack | Lấy thread dump |
| jmap | Histogram hoặc heap dump trong các tình huống phù hợp |
| jfr | Thu thập Java Flight Recorder recording |
| jconsole | Quan sát JMX cơ bản |
| VisualVM | Công cụ quan sát JVM, thường cài riêng tùy môi trường |
| Java Mission Control | Phân tích JFR, thường phân phối riêng tùy JDK |

Các tool attach vào JVM có thể yêu cầu quyền phù hợp và có overhead. Không chạy lệnh nặng trên production mà không cân nhắc impact.

# CHƯƠNG 31. MEMORY MANAGEMENT & GARBAGE COLLECTION

## 31.1. Garbage Collection là gì?

Garbage Collection, thường viết tắt GC, là cơ chế runtime tự động xác định vùng bộ nhớ của object không còn reachable theo collector policy và tái sử dụng vùng nhớ đó.

Ví dụ:

~~~java
static void process() {
    User user = new User("Alice");
    System.out.println(user);
}
~~~

Sau khi process kết thúc:

- Frame của process bị loại bỏ.
- Local reference user không còn trong frame đó.
- Nếu không có đường tham chiếu khác từ GC Roots tới User object, object có thể trở thành unreachable.
- Object eligible for collection, nhưng chưa chắc được thu hồi ngay.

### Eligible for GC không có nghĩa bị xóa ngay

Đoạn code:

~~~java
user = null;
~~~

chỉ loại bỏ một reference từ biến user. Nó không:

- Ép GC chạy.
- Bảo đảm object bị reclaim.
- Đóng file, socket hoặc database connection.
- Xóa object khỏi heap ngay lập tức.

System.gc() cũng chỉ là một yêu cầu/hint cho JVM trong các trường hợp thông thường, không phải API bảo đảm một full collection cụ thể. Không nên dùng nó trong request path.

## 31.2. Reachability và GC Roots

Tracing collectors bắt đầu từ một tập các roots và lần theo references.

Một object được xem là reachable nếu có đường tham chiếu hợp lệ từ root đến object.

Các nhóm root thường gặp trong HotSpot:

- References đang sống trên stack của các Java threads.
- Static fields thuộc các class đang được JVM giữ.
- JNI handles.
- Một số runtime và VM internal references.
- Monitor hoặc cấu trúc execution liên quan tùy implementation.

Mô hình:

~~~text
GC Root
  |
  +--> Service
          |
          +--> Cache
                  |
                  +--> User object

User object không có đường đi từ root
  -> có thể eligible for collection
~~~

Reachability là vấn đề của object graph, không phải chỉ của một biến đơn lẻ.

## 31.3. Circular References có làm GC thất bại không?

Không nhất thiết.

~~~java
class Node {
    Node next;
}

Node first = new Node();
Node second = new Node();

first.next = second;
second.next = first;

first = null;
second = null;
~~~

Hai Node vẫn trỏ lẫn nhau, nhưng nếu không còn root nào trỏ vào cycle, tracing GC có thể xác định cả cycle không reachable và reclaim chúng.

Đây là khác biệt quan trọng giữa tracing garbage collection và reference counting đơn giản.

## 31.4. Object Reachability trong Backend

Ví dụ cache tĩnh:

~~~java
public final class RequestCache {

    private static final Map<String, byte[]> CACHE =
            new HashMap<>();

    public static void remember(String requestId, byte[] data) {
        CACHE.put(requestId, data);
    }
}
~~~

Nếu requestId luôn mới và không có eviction, byte arrays vẫn reachable từ static field. GC hoạt động đúng và không thể thu hồi chúng.

Vấn đề không phải GC hỏng. Vấn đề là ứng dụng vẫn tuyên bố cần các objects đó.

Thiết kế an toàn hơn có thể cần:

- Giới hạn kích thước.
- TTL.
- LRU eviction.
- Xóa theo lifecycle.
- External cache.
- Không lưu dữ liệu request-specific nếu không cần.

## 31.5. Các thuật toán GC cơ bản

### Mark-Sweep

1. Mark các objects reachable.
2. Sweep hoặc reclaim vùng của objects không reachable.

Ưu điểm là có thể thu hồi cycles. Nhược điểm là vùng còn lại có thể bị phân mảnh.

### Mark-Compact

1. Mark live objects.
2. Di chuyển chúng gần nhau.
3. Cập nhật references.
4. Reclaim vùng trống còn lại.

Ưu điểm là giảm fragmentation. Nhược điểm là relocation có chi phí và có thể cần pause.

### Copying

Chia vùng memory thành các vùng source và destination, sau đó copy live objects sang vùng đích.

Cách này hữu ích khi phần lớn objects chết sớm, nhưng cần vùng đích đủ chỗ.

### Tracing và compaction không phải một collector cụ thể

G1, ZGC, Parallel và Serial có thể kết hợp nhiều kỹ thuật khác nhau. Không nên gán một thuật toán đơn giản cho toàn bộ behavior của collector hiện đại.

## 31.6. Generational Hypothesis

Generational hypothesis là quan sát thực nghiệm rằng nhiều object có vòng đời ngắn.

Ví dụ xử lý một HTTP request có thể tạo:

- String tạm.
- DTO trung gian.
- Collection nhỏ.
- Exception hoặc log arguments.
- Buffer phục vụ parsing.

Nhiều object không cần tồn tại sau khi request kết thúc. Generational collectors tận dụng bằng cách tập trung thu hồi vùng có nhiều object chết.

Mô hình học tập:

~~~text
Heap
├── Young Generation
│   ├── Eden
│   ├── Survivor 0
│   └── Survivor 1
└── Old Generation
~~~

### Eden

Nhiều object mới được allocation vào vùng young, thường là Eden theo policy collector.

### Survivor

Object còn sống sau collection có thể được copy hoặc chuyển sang survivor region.

### Promotion

Object sống lâu hơn có thể được promote sang old generation khi policy và điều kiện collector phù hợp.

Promotion không chỉ phụ thuộc một con số tuổi cố định. Collector có thể điều chỉnh theo available space, tenuring policy và workload.

### Không phải mọi collector đều có layout giống nhau

G1 là generational và region-based, nên Eden, survivor và old là vai trò logic của regions. ZGC Java 21 có chế độ generational riêng. Những collector không generational không nên bị ép vào sơ đồ Eden/Old giống hệt.

## 31.7. Minor GC, Major GC và Full GC

Các thuật ngữ này thường dùng trong tài liệu và tooling, nhưng ý nghĩa không hoàn toàn thống nhất giữa collectors.

- Minor hoặc Young GC thường chỉ collection tập trung young generation.
- Major hoặc Old GC thường chỉ việc xử lý old generation, nhưng tên gọi phụ thuộc collector.
- Full GC thường chỉ collection phạm vi rộng hơn, có thể gồm nhiều vùng hoặc toàn heap.

Khi đọc log, hãy ưu tiên tên event và phase cụ thể của collector thay vì suy luận chỉ từ chữ Minor hoặc Major.

## 31.8. Stop-The-World và Concurrent Work

Stop-The-World, viết tắt STW, là khoảng thời gian các application threads bị tạm dừng để JVM thực hiện một số công việc.

Mô hình:

~~~text
Application threads running
          |
          v
Short or long STW pause
          |
          v
Application threads resume
~~~

GC hiện đại có thể có:

- STW phases.
- Concurrent marking.
- Concurrent reference processing.
- Concurrent relocation hoặc evacuation tùy collector.
- Parallel GC work trong thời gian application bị dừng.

Concurrent không có nghĩa không bao giờ pause. ZGC và G1 vẫn có những safepoints hoặc pauses, chỉ là mục tiêu thiết kế khác nhau.

### Tại sao pause ảnh hưởng API latency?

Nếu request bình thường trả 50 ms nhưng đúng lúc gặp pause 300 ms, p99 latency có thể tăng mạnh dù business logic không thay đổi.

Vì vậy cần theo dõi:

- Average latency.
- p95/p99/p99.9.
- Allocation rate.
- Live set.
- GC pause distribution.
- CPU và memory headroom.

## 31.9. Garbage Collectors đáng biết trong Java 21

| Collector | Mục tiêu chính | Đặc điểm khái quát |
| --- | --- | --- |
| Serial GC | Footprint nhỏ, workload nhỏ | GC work chủ yếu bằng một thread |
| Parallel GC | Throughput | Dùng nhiều GC threads, nhiều phase STW |
| G1 GC | Cân bằng throughput và latency | Region-based, generational, mostly concurrent |
| ZGC | Low latency | Phần lớn công việc nặng chạy concurrent |
| Shenandoah | Low latency | Có ở một số build/distribution, availability tùy JDK |

### Serial GC

~~~bash
java -XX:+UseSerialGC Main
~~~

Có thể phù hợp với heap nhỏ, một số môi trường giới hạn CPU hoặc workload không cần latency thấp.

### Parallel GC

~~~bash
java -XX:+UseParallelGC Main
~~~

Ưu tiên throughput. Các collection phases tận dụng nhiều threads nhưng có thể tạo STW pauses lớn hơn collector low-latency.

### G1 GC

~~~bash
java -XX:+UseG1GC Main
~~~

G1 là default collector của HotSpot trong nhiều cấu hình thông thường và server-class configurations. Hãy kiểm tra runtime thực tế thay vì giả định mọi JDK vendor và mọi ergonomics đều giống nhau.

### ZGC

~~~bash
java -XX:+UseZGC Main
~~~

ZGC được thiết kế cho low latency và heap lớn. Đổi lại, workload có thể chịu thêm CPU overhead hoặc cần heap headroom.

### Shenandoah

~~~bash
java -XX:+UseShenandoahGC Main
~~~

Shenandoah không nhất thiết có trong mọi bản phân phối JDK 21. Hãy kiểm tra collector có sẵn bằng runtime và tài liệu của vendor.

## 31.10. G1 Garbage Collector

G1, Garbage-First, chia heap thành nhiều regions có kích thước tương đối đồng đều. Region có thể mang vai trò:

- Eden.
- Survivor.
- Old.
- Humongous allocation.

G1 theo dõi lượng live data và khả năng reclaim của regions. Trong collection, nó ưu tiên các vùng có nhiều garbage hơn theo mô hình Garbage-First.

### Đặc điểm quan trọng

- Generational.
- Region-based.
- Parallel trong một số phases.
- Mostly concurrent.
- Có evacuation để chuyển live objects.
- Có young collections.
- Có concurrent marking và mixed collections.
- Có remembered sets để theo dõi references giữa regions.
- Hỗ trợ pause-time goal như một mục tiêu mềm.

### Young collection

G1 chọn collection set chứa young regions và copy live objects sang vùng mới. Vùng cũ sau đó có thể được reclaim.

### Concurrent marking

G1 thực hiện các phần marking khi application vẫn chạy. Có những phase remark hoặc cleanup cần phối hợp với application threads.

### Mixed collection

Sau marking, G1 có thể thu hồi young regions cùng một số old regions có lợi về mặt reclaim.

### Humongous objects

Object lớn có thể cần nhiều regions liền kề hoặc cơ chế đặc biệt. Humongous allocation có thể làm fragmentation và tăng áp lực GC.

### Pause time goal

Ví dụ:

~~~bash
java -XX:+UseG1GC -XX:MaxGCPauseMillis=200 -jar app.jar
~~~

MaxGCPauseMillis là soft goal, không phải SLA bảo đảm mọi pause đều nhỏ hơn hoặc bằng 200 ms. Nếu đặt mục tiêu quá thấp, JVM có thể giảm công việc mỗi pause và ảnh hưởng throughput hoặc vẫn không đạt được mục tiêu.

G1 không phải real-time collector.

## 31.11. ZGC và Generational ZGC trong Java 21

ZGC là scalable low-latency garbage collector. Nhiều công việc nặng được thực hiện concurrent với application threads, nhằm giảm pause phụ thuộc vào heap size.

Trong Java 21, Generational ZGC là khả năng production được cung cấp cho ZGC. Có thể bật bằng:

~~~bash
java -XX:+UseZGC -XX:+ZGenerational -Xms2g -Xmx2g -jar app.jar
~~~

Trên Windows PowerShell, viết command trên một dòng là đơn giản nhất. Trên Unix-like shell, có thể dùng backslash để xuống dòng.

### Khi cân nhắc ZGC

- API có yêu cầu tail latency thấp.
- Heap lớn hoặc live set lớn.
- Pause dài ảnh hưởng rõ đến SLO.
- Có đủ CPU và memory headroom.
- Đã đo workload thực tế.

### ZGC có luôn tốt hơn G1 không?

Không.

Cần cân nhắc:

- Throughput.
- CPU overhead.
- Allocation rate.
- Heap size.
- Live set.
- Tail latency.
- Container memory limit.
- Kiểu workload CPU-bound hay I/O-bound.

Collector nên được chọn bằng benchmark và load test có đại diện, không phải chỉ bằng danh sách tính năng.
## 31.12. Strong, Weak, Soft và Phantom References

Java có nhiều mức độ reference strength trong package java.lang.ref.

### Strong reference

Đây là reference bình thường:

~~~java
User user = new User("Alice");
~~~

Nếu có đường strong reference từ GC Root tới user, object không được reclaim trong collection thông thường.

### WeakReference

Weak reference không giữ object sống. Nếu object chỉ còn weak references và không có strong reference phù hợp, GC có thể clear weak reference trong quá trình xử lý reference.

Ví dụ đơn giản:

~~~java
WeakReference<User> reference =
        new WeakReference<>(new User("Alice"));

User current = reference.get();
~~~

current có thể là object hoặc null. Không được viết logic bắt buộc correctness dựa trên việc weak object chắc chắn còn đó.

WeakReference thường xuất hiện trong:

- Canonicalizing maps.
- Metadata caches.
- Listener hoặc registry cần tránh giữ object sống vô thời hạn.
- WeakHashMap.

### SoftReference

Soft reference được thiết kế cho những objects có thể bị reclaim khi JVM cần memory, tùy policy của collector.

Không nên dùng SoftReference như một cache production có SLA rõ ràng. JVM có thể clear nó sớm hơn hoặc giữ lâu hơn dự đoán; behavior không thay thế cache có giới hạn, TTL và eviction policy.

### PhantomReference

Phantom reference dùng cho những use case cần theo dõi object đã được xác định là phantom reachable, thường kết hợp ReferenceQueue. get() của PhantomReference luôn trả null.

Phantom reference phù hợp với coordination của cleanup hoặc tracking reclamation, không phải cách lấy lại object.

### ReferenceQueue

ReferenceQueue nhận các reference đã được GC xử lý theo semantics của loại reference.

Ví dụ khái niệm:

~~~java
Object resource = new Object();
ReferenceQueue<Object> queue = new ReferenceQueue<>();
PhantomReference<Object> phantom =
        new PhantomReference<>(resource, queue);
~~~

Thread cleanup có thể poll hoặc remove từ queue để thực hiện bookkeeping. Không nên dùng cơ chế này để thay thế việc đóng resource deterministic.

### Reference strengths không phải công cụ chính để sửa leak

Nếu dữ liệu cần tồn tại để business hoạt động, hãy dùng ownership rõ ràng và eviction. Dùng WeakReference để che giấu thiết kế cache không giới hạn thường làm behavior trở nên không dự đoán được.

## 31.13. ThreadLocal và memory leak

ThreadLocal thường dùng để lưu context theo thread:

~~~java
private static final ThreadLocal<RequestContext> CONTEXT =
        new ThreadLocal<>();

static void handle(RequestContext context) {
    CONTEXT.set(context);

    try {
        processRequest();
    } finally {
        CONTEXT.remove();
    }
}
~~~

Điều quan trọng là remove trong finally, đặc biệt khi dùng platform thread pool.

Vì thread pool worker có lifetime dài hơn request:

~~~text
request 1 -> pooled thread -> ThreadLocal value A
request 2 -> cùng thread   -> value A vẫn có thể tồn tại
~~~

Nếu value giữ request, user, buffer hoặc class-loader-specific object graph, nó có thể:

- Giữ memory lâu hơn cần thiết.
- Làm lộ dữ liệu context sang task sau nếu code không overwrite đúng.
- Góp phần tạo class loader leak khi redeploy.

ThreadLocalMap dùng weak references cho keys theo implementation, nhưng value không tự động biến mất trong mọi tình huống key bị clear. Đó là lý do cleanup rõ ràng vẫn cần thiết.

## 31.14. Các nguồn memory leak thường gặp

### Static collection

~~~java
private static final List<byte[]> HISTORY =
        new ArrayList<>();
~~~

Nếu add liên tục mà không giới hạn, live set tăng theo thời gian.

### Unbounded cache

Cache không có max size, TTL hoặc eviction sẽ giữ object theo workload.

### Listener không unregister

Một singleton hoặc event bus giữ listener của request/module cũ có thể giữ toàn bộ object graph phía sau listener.

### Scheduled task

Task lặp hoặc queue có thể giữ lambda, captured object hoặc service reference lâu hơn dự kiến.

### ClassLoader leak

Static field, ThreadLocal, executor thread hoặc JDBC driver có thể giữ class loader cũ sau redeploy.

### Resource leak ngoài heap

File descriptor, socket, native buffer hoặc database connection không đóng có thể làm process cạn tài nguyên dù heap vẫn bình thường.

Try-with-resources xử lý resource lifecycle nhưng không tự giải quyết object retention do collection hoặc cache.

## 31.15. Finalization, Cleaner và resource cleanup

Java không có destructor deterministic như một số ngôn ngữ. finalize() là cơ chế cũ, đã bị deprecated for removal trong Java hiện đại và không nên dùng.

Không dùng finalize để:

- Đóng database connection.
- Đóng file.
- Release lock.
- Giải phóng socket.
- Bảo đảm cleanup theo thời gian.

Dùng AutoCloseable:

~~~java
try (var reader = Files.newBufferedReader(path)) {
    System.out.println(reader.readLine());
}
~~~

Cleaner có thể hỗ trợ một số cleanup fallback, nhưng cũng không phải cơ chế deterministic. Đối với resource quan trọng, API rõ ràng như close(), try-with-resources và ownership lifecycle vẫn là lựa chọn chính.

## 31.16. Heap size và process memory

Hai option cơ bản:

~~~bash
-Xms512m
-Xmx2g
~~~

- Xms là initial heap size.
- Xmx là maximum Java heap size.

Ví dụ:

~~~bash
java -Xms512m -Xmx2g -jar app.jar
~~~

### Xms có nên bằng Xmx không?

Có thể hữu ích trong benchmark hoặc môi trường cần kích thước heap ổn định, nhưng không phải quy tắc chung.

Trong container, process còn cần memory cho:

- Metaspace.
- Thread stacks.
- Code cache.
- Direct buffers.
- GC structures.
- JNI/native libraries.
- Memory-mapped files.
- JIT compiler.
- Agent hoặc profiler.

Vì vậy Xmx 2 GB không có nghĩa process RSS tối đa chỉ là 2 GB.

### Container awareness

Khi chạy trong container, hãy tính cả memory limit của container và native overhead. Xmx quá lớn có thể làm process bị kill bởi cgroup trước khi JVM tạo được heap OOM rõ ràng.

Thiết lập heap theo percentage có thể hữu ích trong một số deployment, nhưng cần kiểm tra cẩn thận với số thread, direct memory, metaspace và headroom.

## 31.17. OutOfMemoryError và cách phân loại

### Java heap space

Hướng điều tra:

1. Kiểm tra Xmx.
2. So sánh used heap sau Full GC hoặc old collection qua thời gian.
3. Tìm dominator tree và retained size trong heap dump.
4. Kiểm tra cache, queue, batch và collection.
5. Kiểm tra object graph có giữ request hoặc response không.

### GC overhead limit exceeded

Thường gợi ý JVM dành quá nhiều thời gian cho GC nhưng reclaim được rất ít. Có thể do heap nhỏ, live set lớn hoặc leak.

Không nên suy luận rằng message này xuất hiện trong mọi collector theo cùng policy.

### Metaspace

Hướng điều tra:

- Số lượng loaded classes.
- Class loader count.
- Framework proxy hoặc dynamic class generation.
- Redeploy lifecycle.
- ThreadLocal/listener giữ class loader.
- Giới hạn MaxMetaspaceSize.

### unable to create native thread

Hướng điều tra:

- Tổng số platform threads.
- Xss.
- OS process/thread limit.
- Container memory limit.
- Thread pool tạo không giới hạn.
- Thread leak.
- Native memory còn lại.

### Direct buffer memory

Hướng điều tra:

- DirectByteBuffer allocations.
- Network client/server buffers.
- NIO channels.
- MaxDirectMemorySize.
- Native memory usage.

## 31.18. GC logging với Unified Logging

Java 9 trở đi dùng Unified JVM Logging.

Bật log GC cơ bản:

~~~bash
java -Xlog:gc -jar app.jar
~~~

Ghi log chi tiết hơn ra file:

~~~bash
java -Xlog:gc*:file=gc.log:time,uptime,level,tags -jar app.jar
~~~

Xem các tag và level có thể dùng:

~~~bash
java -Xlog:help
~~~

Một số log hữu ích:

~~~bash
java -Xlog:gc+heap=debug -jar app.jar
java -Xlog:gc+phases=debug -jar app.jar
~~~

Cần tránh bật mức debug quá rộng trong production nếu chưa đánh giá kích thước log và overhead.

Khi phân tích GC log, quan sát:

- Tần suất collection.
- Pause duration.
- Heap before/after.
- Allocation rate.
- Promotion.
- Humongous allocation.
- Concurrent cycle.
- To-space exhaustion hoặc evacuation failure nếu collector ghi nhận.
- Correlation với p95/p99 latency.

## 31.19. jcmd và các lệnh chẩn đoán

Tìm process Java:

~~~bash
jcmd
~~~

Xem command line và flags:

~~~bash
jcmd <pid> VM.command_line
jcmd <pid> VM.flags
~~~

Xem heap summary:

~~~bash
jcmd <pid> GC.heap_info
~~~

In class histogram:

~~~bash
jcmd <pid> GC.class_histogram
~~~

Lấy thread dump:

~~~bash
jcmd <pid> Thread.print
~~~

Yêu cầu heap dump:

~~~bash
jcmd <pid> GC.heap_dump C:/temp/app.hprof
~~~

Tên lệnh và mức impact phụ thuộc JDK/collector. Heap dump có thể tạo file rất lớn và gây pause hoặc I/O load. Cần kiểm tra disk space, quyền và chính sách dữ liệu trước khi thực hiện.

### jstack

~~~bash
jstack <pid>
~~~

Dùng để lấy thread dump trong các tình huống phù hợp.

### jmap

~~~bash
jmap -histo <pid>
jmap -dump:live,format=b,file=app.hprof <pid>
~~~

jmap có thể có impact đáng kể. Trong nhiều trường hợp, jcmd được khuyến nghị vì cung cấp diagnostic command interface thống nhất hơn.

## 31.20. Heap dump

Heap dump là snapshot của object graph hoặc heap-related state tại một thời điểm.

Một quy trình phân tích thường gồm:

1. Ghi nhận thời gian, traffic và metric khi dump.
2. Lấy heap dump an toàn với disk space đủ.
3. Mở bằng Eclipse Memory Analyzer, VisualVM hoặc tool phù hợp.
4. Xem histogram theo class.
5. Xem dominator tree.
6. Kiểm tra retained heap.
7. Lần theo path to GC roots.
8. So sánh hai dump ở các thời điểm khác nhau.
9. Đối chiếu với code owner và lifecycle.

### Shallow size và retained size

- Shallow size: memory trực tiếp của object.
- Retained size: memory có thể được reclaim nếu object đó không còn được giữ, theo cách tool xây dựng graph.

Một object nhỏ có thể có retained size lớn nếu nó là root của một collection lớn.

Heap dump có thể chứa dữ liệu nhạy cảm như email, token, request payload hoặc thông tin nghiệp vụ. Không upload tùy tiện lên dịch vụ bên ngoài.
## 31.21. Thread dump, heap dump, GC log và JFR

Mỗi loại artifact trả lời một nhóm câu hỏi khác nhau:

| Artifact | Trả lời câu hỏi |
| --- | --- |
| Thread dump | Thread đang chạy, blocked, waiting hay deadlocked? |
| Heap dump | Object nào đang giữ memory và path tới GC root là gì? |
| GC log | Khi nào GC chạy, pause bao lâu, reclaim được bao nhiêu? |
| JFR recording | Trong một khoảng thời gian, CPU, allocation, lock, I/O và GC diễn biến thế nào? |
| Class histogram | Class nào có nhiều instances hoặc chiếm nhiều shallow memory? |

Không có một artifact duy nhất giải thích mọi performance problem.

## 31.22. Java Flight Recorder cơ bản

JFR, Java Flight Recorder, ghi nhận nhiều event runtime với overhead thường thấp hơn việc logging thủ công quá chi tiết.

Ví dụ bắt đầu recording:

~~~bash
jcmd <pid> JFR.start name=backend duration=120s filename=C:/temp/backend.jfr
~~~

Xem trạng thái:

~~~bash
jcmd <pid> JFR.check
~~~

Phân tích recording bằng Java Mission Control hoặc tool hỗ trợ JFR.

Các nhóm event hữu ích:

- Garbage collection.
- Allocation.
- CPU hot methods.
- Thread park và sleep.
- Lock contention.
- File và socket I/O.
- Safepoints.
- Class loading.
- Exceptions.

JFR không tự sửa lỗi. Nó giúp thu thập timeline để liên hệ triệu chứng với nguyên nhân.

## 31.23. Quy trình chẩn đoán memory leak

### Bước 1: Xác nhận bằng trend

Theo dõi heap used sau các collection tương đương. Nếu live set sau GC tăng đều theo thời gian trong cùng workload, nghi ngờ retention.

Không kết luận chỉ từ heap committed tăng; JVM có thể giữ vùng đã commit để phục vụ allocation.

### Bước 2: Phân biệt allocation spike và leak

- Allocation spike: tạo nhiều object tạm, nhưng sau GC live set trở về mức ổn định.
- Leak: objects không còn cần vẫn reachable, live set tăng hoặc không giảm.
- Cache growth hợp lệ: tăng đến giới hạn thiết kế rồi ổn định.
- Native leak: heap bình thường nhưng RSS/direct/native memory tăng.

### Bước 3: Lấy histogram

So sánh class histogram ở nhiều thời điểm. Chú ý byte[], char[], String, collection nodes, DTO, proxy và domain objects.

### Bước 4: Heap dump và path to roots

Tìm class có retained size lớn, sau đó lần theo GC roots tới static field, ThreadLocal, executor, cache hoặc listener.

### Bước 5: Sửa ownership

Sửa lifecycle chứ không chỉ tăng heap:

- Bounded cache.
- Remove listener.
- ThreadLocal cleanup.
- Shutdown executor.
- Close resources.
- Hủy scheduled task.
- Giảm batch size.
- Không giữ request data trong singleton.

## 31.24. Quy trình chẩn đoán GC pause cao

1. Ghi nhận p95/p99 latency cùng timestamp với GC log.
2. Xác định collector và heap size thực tế.
3. Kiểm tra allocation rate và live set.
4. Phân biệt STW pause với CPU saturation hoặc network latency.
5. Tìm Full GC, evacuation failure, humongous allocation hoặc promotion pressure.
6. Kiểm tra container CPU quota và memory limit.
7. Thử thay đổi có kiểm soát trên staging.
8. So sánh throughput, p99, CPU và allocation sau mỗi thay đổi.

Không nên chỉ nhìn average latency vì một vài pause dài có thể bị che khuất.

## 31.25. Quy trình chẩn đoán Metaspace tăng

- Theo dõi loaded class count.
- Theo dõi class loader count.
- Kiểm tra có reload hoặc redeploy lặp không.
- Kiểm tra dynamic proxy, bytecode generation, scripting engine.
- Kiểm tra executor thread và ThreadLocal.
- Kiểm tra static references từ framework hoặc plugin.
- Dùng class histogram và JFR.
- Chỉ tăng MaxMetaspaceSize sau khi hiểu growth pattern.

## 31.26. Quy trình chẩn đoán native memory hoặc thread exhaustion

Nếu heap không cao nhưng process vẫn gần memory limit:

- Kiểm tra số platform threads.
- Kiểm tra Xss và thread pool sizing.
- Kiểm tra direct buffers.
- Kiểm tra Metaspace.
- Kiểm tra code cache và JNI libraries.
- Kiểm tra memory-mapped files.
- Dùng Native Memory Tracking nếu workload và JDK flags cho phép.
- Đối chiếu RSS với heap committed, không chỉ heap used.

Thread pool không giới hạn thường gây cascading failure: traffic tăng, thread count tăng, native memory giảm, context switching tăng và latency xấu hơn.

## 31.27. Tuning GC — nguyên tắc an toàn

### Đo trước khi đổi flag

Ghi baseline:

- QPS.
- p50/p95/p99 latency.
- Error rate.
- CPU.
- RSS.
- Heap used/committed.
- Allocation rate.
- GC pause.
- Live set sau GC.
- Thread count.

### Chọn collector theo SLO

- Workload nhỏ, footprint nhỏ: xem xét Serial.
- Throughput là ưu tiên chính: xem xét Parallel.
- Cân bằng và collector mặc định đáp ứng: bắt đầu với G1.
- Tail latency nghiêm ngặt và heap lớn: benchmark ZGC.
- Shenandoah: chỉ dùng khi JDK distribution hỗ trợ và test xác nhận phù hợp.

### Không copy flag từ internet

Flag phụ thuộc:

- JDK version.
- Collector.
- Vendor distribution.
- CPU và memory.
- Container limit.
- Allocation profile.
- Latency target.

Một flag đúng trên Java 8 có thể lỗi thời trên Java 21.

### Heap không nên chiếm toàn bộ container

Chừa headroom cho native memory, threads, metaspace và system overhead. Xmx chỉ là một phần của memory budget.

### Tối ưu allocation ở tầng application

Trước khi dùng GC flag, kiểm tra:

- Object tạo trong hot path.
- Chuyển đổi JSON không cần thiết.
- Batch quá lớn.
- String concatenation lặp lại.
- Cache không giới hạn.
- Buffer copy nhiều lần.
- Collection initial capacity và lifecycle.
- Log tạo message dù log level không bật.

## 31.28. Bài tập thực hành

### Bài 1: Quan sát bytecode

1. Tạo Calculator.java.
2. Biên dịch bằng javac.
3. Chạy javap -c -v.
4. Xác định method descriptor, constant pool và operand stack.

### Bài 2: Quan sát class initialization

Tạo class có static field, static block và compile-time constant. Gọi chúng theo các thứ tự khác nhau và ghi lại khi static block chạy.

### Bài 3: So sánh stack và heap

Viết recursion có điều kiện dừng, tăng input dần và quan sát StackOverflowError. Sau đó chuyển sang iterative version.

### Bài 4: Allocation spike

Tạo một loop tạo nhiều byte arrays nhưng không giữ reference. Bật GC logging và so sánh với phiên bản lưu tất cả arrays vào static collection.

### Bài 5: Cache leak

Viết cache giới hạn và cache không giới hạn. Dùng load test nhỏ, class histogram hoặc heap dump để so sánh retained objects.

### Bài 6: ThreadLocal cleanup

Tạo fixed thread pool, đặt object lớn vào ThreadLocal, chạy nhiều task và so sánh hành vi trước và sau khi gọi remove trong finally.

### Bài 7: Collector comparison

Chạy cùng workload với G1 và ZGC trên staging. So sánh throughput, CPU, p99 latency, allocation rate và pause distribution. Không kết luận chỉ từ một lần chạy.

## 31.29. Câu hỏi phỏng vấn

### Câu 1: JVM là gì?

JVM là runtime machine thực thi bytecode và cung cấp class loading, execution, memory management, thread support và garbage collection theo JVM semantics.

### Câu 2: Bytecode có phải machine code không?

Không. Bytecode là binary instruction format trung gian cho JVM. Interpreter và JIT compiled code giúp thực thi nó trên CPU cụ thể.

### Câu 3: Method Area có giống Metaspace không?

Không hoàn toàn. Method Area là khái niệm trong JVM Specification; Metaspace là cách HotSpot lưu nhiều class metadata.

### Câu 4: Heap và Stack khác nhau thế nào?

Heap là vùng chia sẻ dùng cho objects và arrays. JVM stack là vùng riêng theo thread, chứa frames của method invocations. Physical placement có thể được tối ưu bởi JVM.

### Câu 5: Object có bị GC ngay khi gán null không?

Không. Gán null chỉ bỏ một reference. Object phải không còn reachable từ roots và GC phải thực sự chọn collection; cả hai thời điểm đều không được đảm bảo tức thì.

### Câu 6: Circular reference có gây leak không?

Không nhất thiết. Nếu cycle không reachable từ GC roots, tracing GC có thể reclaim nó. Leak xảy ra khi object không còn cần nhưng vẫn có đường reachable.

### Câu 7: GC có giải phóng file hoặc database connection không?

Không theo đúng thời điểm ứng dụng cần. Resource ngoài heap cần close rõ ràng, thường bằng AutoCloseable và try-with-resources.

### Câu 8: G1 có bảo đảm pause không vượt MaxGCPauseMillis không?

Không. Đây là soft goal, không phải real-time guarantee.

### Câu 9: ZGC có luôn nhanh hơn G1 không?

Không. ZGC ưu tiên low latency, nhưng throughput, CPU overhead và memory headroom có thể khác. Phải benchmark workload thực tế.

### Câu 10: Generational ZGC Java 21 bật thế nào?

Trong Java 21, dùng UseZGC cùng ZGenerational:

~~~bash
java -XX:+UseZGC -XX:+ZGenerational -jar app.jar
~~~

Ở các JDK release khác, flag và default có thể thay đổi; hãy đọc tài liệu đúng version.

### Câu 11: Vì sao Java có OutOfMemoryError dù có GC?

GC chỉ reclaim được object không còn reachable. Nếu application vẫn giữ references tới objects không cần, GC không thể reclaim. Ngoài ra OOM có thể nằm ở Metaspace, direct memory, native threads hoặc vùng native khác.

### Câu 12: Memory leak trong Java là gì?

Là tình trạng objects không còn cần thiết nhưng vẫn reachable từ một root, thường qua static collection, cache, ThreadLocal, listener, queue hoặc class loader.

### Câu 13: ClassNotFoundException khác NoClassDefFoundError thế nào?

ClassNotFoundException thường phát sinh khi code chủ động load class nhưng không tìm thấy và là checked exception. NoClassDefFoundError là Error xảy ra khi runtime không thể định nghĩa hoặc resolve class cần thiết.

### Câu 14: JIT có thể làm gì?

JIT có thể inlining, specialization, loop optimization, escape analysis, scalar replacement và dead-code elimination dựa trên profile runtime. Nếu assumption sai, JVM có thể deoptimize.

### Câu 15: Vì sao benchmark Java cần warmup?

Vì lần chạy đầu chịu chi phí class loading, interpreter và JIT compilation. Kết quả steady state có thể khác đáng kể.

### Câu 16: Công cụ nào dùng cho từng loại vấn đề?

- Bytecode: javap.
- Thread state hoặc deadlock: jcmd Thread.print hoặc jstack.
- Object retention: heap dump và MAT/VisualVM.
- GC pause: unified GC logs.
- Timeline runtime: JFR.
- Process flags: jcmd VM.flags và VM.command_line.

## 31.30. Kiến thức cần nhớ

- JVM Specification là mô hình trừu tượng; HotSpot là một implementation.
- Bytecode nằm trong class file và được JVM load, verify, link và execute.
- Loading, linking và initialization là các giai đoạn khác nhau.
- Bootstrap, platform và application class loader có trách nhiệm khác nhau.
- Class identity bao gồm binary name và defining class loader.
- Heap là vùng chia sẻ cho objects và arrays; stack chứa frames theo thread.
- Method Area là khái niệm specification; Metaspace là chi tiết HotSpot.
- JIT tối ưu dựa trên profile và có thể deoptimize.
- Eligible for GC không có nghĩa reclaim ngay.
- Reachability từ GC roots là trung tâm của tracing GC.
- Cycle không tự động gây leak.
- GC không thay thế resource management.
- G1 hướng tới cân bằng throughput và latency; ZGC hướng tới low latency.
- Generational ZGC là khả năng đáng chú ý trong Java 21 và cần kiểm tra flag theo version.
- Heap leak, Metaspace leak, direct memory leak và native thread exhaustion là các vấn đề khác nhau.
- Dùng GC logs, heap dump, thread dump và JFR cho các câu hỏi khác nhau.
- Đo p95/p99 và workload thực tế trước khi tuning.
- Không dùng System.gc(), tăng Xmx hoặc thêm flag ngẫu nhiên như cách sửa lỗi mặc định.

# TỔNG KẾT PHẦN 10

Sau phần này, bạn cần có khả năng vẽ được pipeline:

~~~text
Java source
  -> javac
class file / bytecode
  -> class loader
loading -> linking -> initialization
  -> interpreter and JIT
runtime data areas
  -> allocations
  -> reachability analysis
  -> garbage collection
  -> diagnostics and tuning
~~~

Khi một Java Backend gặp lỗi memory hoặc latency, câu hỏi đúng thường là:

1. Lỗi nằm ở heap, metaspace, direct memory, thread stack hay OS limit?
2. Object còn reachable vì business ownership hợp lệ hay vì leak?
3. GC pause có thực sự trùng với latency spike không?
4. Collector, heap size và allocation profile có phù hợp SLO không?
5. Có heap dump, GC log, thread dump hoặc JFR để kiểm chứng không?
6. Thay đổi đề xuất đã được benchmark trong workload đại diện chưa?

Đó là cách chuyển từ “Java tự quản lý memory” sang hiểu đúng JVM đang làm gì và vì sao ứng dụng vẫn cần thiết kế lifecycle cẩn thận.

# TÀI LIỆU THAM KHẢO CHÍNH THỨC

- Java Virtual Machine Specification, Java SE 21 — Structure of the JVM:
  https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-2.html
- Java Virtual Machine Specification, Java SE 21 — Loading, Linking, and Initializing:
  https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-5.html
- Java Virtual Machine Specification, Java SE 21 — Class File Format:
  https://docs.oracle.com/javase/specs/jvms/se21/html/jvms-4.html
- ClassLoader API, Java SE 21:
  https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ClassLoader.html
- Reference Objects API, Java SE 21:
  https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/ref/package-summary.html
- HotSpot VM Garbage Collection Tuning Guide, Java SE 21:
  https://docs.oracle.com/en/java/javase/21/gctuning/index.html
- G1 Garbage Collector, Java SE 21:
  https://docs.oracle.com/en/java/javase/21/gctuning/garbage-first-g1-garbage-collector1.html
- Z Garbage Collector, Java SE 21:
  https://docs.oracle.com/en/java/javase/21/gctuning/z-garbage-collector2.html
- Java launcher options and Unified Logging:
  https://docs.oracle.com/en/java/javase/21/docs/specs/man/java.html
- Java Troubleshooting Guide, Java SE 21:
  https://docs.oracle.com/en/java/javase/21/troubleshoot/
- JEP 439: Generational ZGC:
  https://openjdk.org/jeps/439
