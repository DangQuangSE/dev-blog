# JAVA CORE 21 — PHẦN 2: OBJECT-ORIENTED PROGRAMMING (OOP)

> Trạng thái: Đã cập nhật theo nội dung chi tiết đã nhận; các mục tiếp theo sẽ được bổ sung khi có tài liệu mới.

Object-Oriented Programming (OOP) là một trong những nền tảng quan trọng nhất của Java. Nếu Java Fundamentals giúp bạn hiểu cú pháp và cách chương trình thực thi, thì OOP giúp bạn biết cách tổ chức code thành các thành phần có trách nhiệm rõ ràng, dễ mở rộng, kiểm thử và bảo trì.

Trong các dự án Spring Boot, bạn sẽ thường xuyên làm việc với class, object, interface, inheritance, polymorphism, dependency injection và abstraction. Vì vậy, mục tiêu của phần này không chỉ là thuộc định nghĩa mà còn phải hiểu tại sao cần OOP, cơ chế Java thực hiện OOP và khi nào nên áp dụng từng nguyên tắc.

## Nội dung Phần 2

| Chương | Nội dung |
| ------ | ------------------------------------------------------------------------------------------- |
| 6 | Classes & Objects |
| 7 | Four Pillars of OOP: Encapsulation, Inheritance, Polymorphism, Abstraction |
| 8 | Advanced OOP: Static, Final, Sealed, Records, Nested Classes, Enums, Object Equality, SOLID |

# CHƯƠNG 6. CLASSES & OBJECTS

## 6.1. Object-Oriented Programming là gì?

OOP là một phương pháp lập trình tổ chức phần mềm xung quanh các objects. Mỗi object có thể kết hợp trạng thái (state) và hành vi (behavior) liên quan.

Ví dụ, hệ thống quản lý ngân hàng có những đối tượng như:

- `Customer`: khách hàng.
- `BankAccount`: tài khoản ngân hàng.
- `Transaction`: giao dịch.
- `Payment`: thanh toán.

Thay vì đặt tất cả dữ liệu và phương thức trong một class lớn, chúng ta mô hình hóa mỗi thực thể theo trách nhiệm của nó.

Ví dụ:

```java
public class BankAccount {

    private String accountNumber;
    private long balance;

    public BankAccount(String accountNumber, long balance) {
        this.accountNumber = accountNumber;
        this.balance = balance;
    }

    public void deposit(long amount) {
        balance += amount;
    }

    public long getBalance() {
        return balance;
    }
}
```

Một object `BankAccount` mang trạng thái và cung cấp hành vi liên quan đến tài khoản.

Lưu ý: ví dụ này chỉ minh họa cách tổ chức class. Một hệ thống ngân hàng thực tế phải kiểm tra số tiền hợp lệ, overflow, quyền truy cập, giao dịch đồng thời và những quy tắc nghiệp vụ khác.

### OOP khác Procedural Programming như thế nào?

Trong lập trình thủ tục, code thường được tổ chức theo các hàm xử lý dữ liệu.

Trong OOP, các hành vi có thể được đặt cùng với trạng thái mà chúng quản lý.

Procedural style:

```java
public class BankUtils {

    public static long deposit(long balance, long amount) {
        return balance + amount;
    }
}
```

Object-oriented style:

```java
BankAccount account = new BankAccount("ACC001", 1000);

account.deposit(500);

System.out.println(account.getBalance());
```

OOP không có nghĩa mọi hàm đều phải trở thành instance method. Các hàm thuần (pure functions) và các tiện ích `static` vẫn có giá trị. Điều quan trọng là lựa chọn mô hình phù hợp.

## 6.2. Class là gì?

Class là một kiểu tham chiếu (reference type) do lập trình viên định nghĩa, mô tả các fields, methods, constructors và những thành phần khác.

Một class thường định nghĩa cấu trúc và hành vi chung của các object được tạo từ class đó.

Ví dụ:

```java
public class Student {

    String name;
    int age;

    void study() {
        System.out.println(name + " is studying");
    }
}
```

Trong đó:

- `Student`: tên class.
- `name`, `age`: instance fields.
- `study()`: instance method.

Bạn có thể hình dung class như một bản thiết kế, còn object là một instance cụ thể được tạo theo bản thiết kế đó.

Tuy nhiên, đây chỉ là phép so sánh để dễ hiểu: class trong JVM cũng có metadata và những hành vi ở cấp class như static members.

## 6.3. Object là gì?

Object là một instance của class, có identity, state và behavior theo mô hình hướng đối tượng.

Ví dụ:

```java
Student student1 = new Student();
Student student2 = new Student();

student1.name = "Alice";
student1.age = 20;

student2.name = "Bob";
student2.age = 22;
```

`student1` và `student2` tham chiếu hai object khác nhau.

Class: Student

Fields: name, age · Method: study()

student1

name = "Alice"

age = 20

Student instance #1

student2

name = "Bob"

age = 22

Student instance #2

### Identity, State và Behavior

Identity: giúp phân biệt object này với object khác. Hai object có thể chứa dữ liệu bằng nhau nhưng không có cùng identity.

State: những giá trị dữ liệu của object tại một thời điểm, thường được biểu diễn qua instance fields.

Behavior: các hành động mà object có thể thực hiện, thường thông qua methods.

Ví dụ:

```java
Student student = new Student();
student.name = "Alice";
student.age = 20;

student.study();
```

`name` và `age` biểu diễn state, còn `study()` là behavior.

## 6.4. Class vs Object

| Tiêu chí | Class | Object |
| -------------- | ------------------------------------------------------------------ | ------------------------------ |
| Bản chất | Định nghĩa kiểu | Instance cụ thể |
| Dữ liệu | Khai báo cấu trúc fields | Chứa trạng thái instance |
| Hành vi | Định nghĩa methods | Có thể thực thi instance methods |
| Tạo bằng `new` | Không phải object instance thông thường được tạo từ chính class đó | Thường được tạo bằng `new` |
| Số lượng | Một class có thể tạo nhiều instances | Mỗi instance có identity riêng |

## 6.5. Fields và Methods

### Fields

Field là biến được khai báo trong class nhưng bên ngoài method, constructor và initialization block.

Ví dụ:

```java
public class Product {

    private String name;
    private double price;
    private int quantity;
}
```

Các field này biểu diễn trạng thái của `Product`.

### Methods

Method định nghĩa một hành vi có thể được gọi.

Cú pháp:

```java
accessModifier returnType methodName(parameters) {
    // Method body
}
```

Ví dụ:

```java
public double calculateTotal() {
    return price * quantity;
}
```

### Instance Methods và Static Methods

Instance method thường được gọi trên object:

```java
product.calculateTotal();
```

Static method được gọi qua class:

```java
Math.max(10, 20);
```

Static method không có `this`, vì nó không gắn với một receiver instance cụ thể.

## 6.6. Object Creation với new

Ví dụ:

```java
Student student = new Student();
```

Có thể phân tích thành ba phần:

```java
Student
```

Là kiểu khai báo của biến.

```java
student
```

Là tên biến reference.

```java
new Student()
```

Là class instance creation expression tạo object mới và gọi constructor phù hợp.

Về mặt khái niệm, quá trình tạo object bao gồm:

1. Đảm bảo class đã được chuẩn bị/khởi tạo theo yêu cầu.
2. Cấp phát và khởi tạo mặc định các instance fields.
3. Thực hiện quá trình gọi constructor, bao gồm superclass initialization.
4. Thực hiện field initializers và instance initialization blocks theo thứ tự quy định.
5. Hoàn thành constructor và trả về reference đến object.

Không nên hiểu rằng Java luôn thực hiện từng bước bằng một thao tác cấp phát bộ nhớ vật lý giống hệt nhau: JVM có thể tối ưu hóa trong khi vẫn giữ nguyên ngữ nghĩa chương trình.

## 6.7. Constructor là gì?

Constructor là thành phần đặc biệt được gọi trong quá trình tạo instance.

Đặc điểm:

- Có cùng tên với class.
- Không khai báo return type.
- Có thể nhận parameters.
- Có thể overload.
- Không được kế thừa như method.
- Không thể khai báo `static`, `abstract` hay `final`.

Ví dụ:

```java
public class Student {

    private String name;

    public Student(String name) {
        this.name = name;
    }
}
```

Sử dụng:

```java
Student student = new Student("Alice");
```

### Constructor có phải method không?

Theo thuật ngữ Java Language Specification, constructor không phải method. Nó có quy tắc khai báo, gọi và kế thừa khác methods.

Đây là một câu hỏi phỏng vấn thường gặp.

## 6.8. Default Constructor

Nếu class không khai báo bất kỳ constructor nào, Java sẽ cung cấp một default constructor.

Ví dụ:

```java
class Student {

    String name;
    int age;
}
```

Bạn có thể gọi:

```java
Student student = new Student();
```

Default constructor không có tham số và có access modifier tương ứng với những quy tắc của class. Nó cũng gọi superclass constructor thích hợp.

Quan trọng: Nếu bạn tự khai báo constructor có tham số:

```java
class Student {

    Student(String name) {
    }
}
```

Thì Java không tự động sinh thêm constructor không tham số.

Dòng này không còn hợp lệ:

```java
Student student = new Student();
```

Muốn có cả hai:

```java
class Student {

    Student() {
    }

    Student(String name) {
    }
}
```

## 6.9. Parameterized Constructor

Parameterized Constructor nhận arguments khi object được tạo.

```java
public class User {

    private String username;
    private int age;

    public User(String username, int age) {
        this.username = username;
        this.age = age;
    }
}
```

Sử dụng:

```java
User user = new User("quang", 22);
```

Lợi ích là class có thể yêu cầu dữ liệu cần thiết để khởi tạo object.

Bạn có thể thêm validation:

```java
public User(String username, int age) {

    if (username == null || username.isBlank()) {
        throw new IllegalArgumentException(
            "Username must not be blank"
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
```

Đây là một bước quan trọng để bảo vệ tính hợp lệ của trạng thái object.

## 6.10. Constructor Overloading

Overloading là khai báo nhiều constructors trong cùng class với parameter lists khác nhau.

Ví dụ:

```java
public class Student {

    private String name;
    private int age;

    public Student() {
        this.name = "Unknown";
        this.age = 0;
    }

    public Student(String name) {
        this.name = name;
        this.age = 0;
    }

    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

Java xác định constructor phù hợp dựa trên arguments và quy tắc overload resolution.

Ví dụ:

```java
new Student();
new Student("Alice");
new Student("Bob", 22);
```

Chỉ thay đổi tên parameter không tạo ra overload mới.

Ví dụ sau không hợp lệ:

```java
Student(String name) {}
Student(String username) {}
```

Vì hai constructors có cùng parameter types.

## 6.11. Constructor Chaining

Constructor Chaining là quá trình một constructor gọi một constructor khác.

Có hai dạng quan trọng:

- `this(...)`: gọi constructor khác trong cùng class.
- `super(...)`: gọi constructor phù hợp của superclass.

### this() Constructor Chaining

```java
public class Student {

    private String name;
    private int age;

    public Student() {
        this("Unknown", 0);
    }

    public Student(String name) {
        this(name, 0);
    }

    public Student(String name, int age) {
        this.name = name;
        this.age = age;
    }
}
```

Lợi ích:

- Tránh lặp logic khởi tạo.
- Tập trung validation.
- Giúp việc bảo trì thuận tiện hơn.

Trong Java 21, lời gọi constructor tường minh `this(...)` hoặc `super(...)` phải là statement đầu tiên trong constructor body. Các phiên bản Java mới hơn có thay đổi liên quan đến flexible constructor bodies, nhưng không nên áp dụng các thay đổi đó khi đang học đúng Java 21.

### super() Constructor Chaining

```java
class Person {

    protected String name;

    public Person(String name) {
        this.name = name;
    }
}
```

```java
class Student extends Person {

    private int studentId;

    public Student(String name, int studentId) {
        super(name);
        this.studentId = studentId;
    }
}
```

`super(name)` gọi constructor của `Person`.

Một constructor không thể sử dụng cả `this(...)` và `super(...)` như hai explicit constructor invocations trong cùng một constructor body.

## 6.12. this Keyword

`this` là reference đến current object trong ngữ cảnh instance phù hợp.

### Phân biệt instance fields và parameters

```java
public class User {

    private String name;

    public User(String name) {
        this.name = name;
    }
}
```

Trong:

```java
this.name = name;
```

- `this.name`: field của object hiện tại.
- `name`: constructor parameter.

### Gọi instance methods

```java
public class Calculator {

    public void print() {
        this.showMessage();
    }

    private void showMessage() {
        System.out.println("Hello");
    }
}
```

Thông thường, `this.` có thể bỏ đi khi không gây nhập nhằng.

### Truyền current object

```java
public void register() {
    registry.add(this);
}
```

Ví dụ này giả định `registry` là một object có method `add()` tương thích.

Cần cẩn thận khi làm cho `this` thoát ra ngoài trong lúc constructor chưa hoàn thành, vì object có thể bị quan sát ở trạng thái chưa khởi tạo đầy đủ.

## 6.13. super Keyword

`super` được dùng để truy cập một số thành phần của superclass hoặc gọi superclass constructor.

Ví dụ:

```java
class Animal {

    void makeSound() {
        System.out.println("Animal sound");
    }
}
```

```java
class Dog extends Animal {

    @Override
    void makeSound() {
        super.makeSound();
        System.out.println("Woof!");
    }
}
```

Sử dụng:

```java
Dog dog = new Dog();
dog.makeSound();
```

Kết quả:

```text
Animal sound
Woof!
```

### this vs super

| `this` | `super` |
| -------------------------------------- | -------------------------------------------------------------- |
| Tham chiếu current object | Cho phép truy cập superclass members theo các quy tắc ngôn ngữ |
| `this(...)` gọi constructor cùng class | `super(...)` gọi constructor superclass |
| Dùng trong instance context | Dùng trong instance context phù hợp |
| Có thể phân biệt field với parameter | Có thể truy cập superclass implementation bị override |

## 6.14. Instance và Static Initialization Blocks

### Instance Initialization Block

```java
class Example {

    {
        System.out.println("Instance block");
    }

    Example() {
        System.out.println("Constructor");
    }
}
```

Khi tạo:

```java
new Example();
```

Kết quả:

```text
Instance block
Constructor
```

Instance initialization blocks chạy trong quá trình khởi tạo object, sau khi superclass constructor hoàn thành và theo thứ tự văn bản cùng instance field initializers.

### Static Initialization Block

```java
class Example {

    static {
        System.out.println("Static block");
    }

    Example() {
        System.out.println("Constructor");
    }
}
```

Static initialization chạy khi class được khởi tạo theo quy tắc JVM, không phải mỗi lần `new`.

Với chương trình:

```java
new Example();
new Example();
```

Trong trường hợp class chưa được khởi tạo trước đó:

```text
Static block
Constructor
Constructor
```

## 6.15. Anonymous Objects

Bạn có thể tạo và sử dụng object mà không lưu reference vào một biến riêng.

```java
new Student("Alice", 20);
```

Hoặc:

```java
new StringBuilder("Hello")
        .append(" Java")
        .toString();
```

Đây là object được tạo trong một biểu thức, không phải Anonymous Inner Class.

Cần phân biệt:

- Anonymous object: object không được gán vào một biến đặt tên.
- Anonymous class: class không có tên tường minh, được khai báo trong class instance creation expression.

## 6.16. Object References và Alias

Ví dụ:

```java
Student a = new Student("Alice", 20);
Student b = a;
```

Hai biến tham chiếu cùng một object.

Đây là hiện tượng aliasing.

Nếu object mutable:

```java
b.setAge(25);
```

thì trạng thái được quan sát qua `a` cũng thay đổi.

Aliasing là nguyên nhân của nhiều lỗi liên quan đến shared mutable state trong ứng dụng.

## 6.17. Pass-by-Value trong Java

Java luôn pass-by-value, kể cả khi tham số là reference type.

```java
static void rename(Student student) {
    student.setName("Bob");
}
```

Method nhận bản sao của reference, nên có thể thay đổi object được tham chiếu.

Nhưng:

```java
static void replace(Student student) {
    student = new Student("Charlie", 22);
}
```

không làm biến reference của caller trỏ sang object mới.

Điểm này đặc biệt quan trọng khi học collections, method parameters, mutable objects và Java memory model.

## 6.18. Object Lifecycle

Một object trong Java thường trải qua các giai đoạn khái niệm:

Creation

Tạo instance và cấp phát dữ liệu

Initialization

Khởi tạo fields, gọi constructors

Usage

Methods đọc hoặc thay đổi trạng thái

Unreachable

Không còn reachable từ GC Roots

Reclamation

GC có thể thu hồi bộ nhớ

Một object có thể tồn tại lâu hơn phạm vi của biến local đã từng tham chiếu nó nếu có những tham chiếu khác giữ object reachable.

Ngoài ra, thời điểm GC chạy không được đảm bảo.

### finalize() và Object Destruction

Java không có destructor deterministic giống một số ngôn ngữ khác.

Cơ chế finalization cũ đã bị deprecated for removal và không nên sử dụng để quản lý tài nguyên.

Nếu một object quản lý file, socket hoặc tài nguyên bên ngoài heap, nên cân nhắc `AutoCloseable` và try-with-resources.

Ví dụ:

```java
try (var reader = Files.newBufferedReader(path)) {
    System.out.println(reader.readLine());
}
```

# CHƯƠNG 7. FOUR PILLARS OF OOP

Bốn tính chất cốt lõi thường được nhắc tới khi học OOP bao gồm:

1. Encapsulation: tính đóng gói.
2. Inheritance: tính kế thừa.
3. Polymorphism: tính đa hình.
4. Abstraction: tính trừu tượng.

Chúng có liên quan với nhau nhưng giải quyết những vấn đề khác nhau.

Encapsulation

Bảo vệ trạng thái và kiểm soát cách dữ liệu được truy cập, thay đổi.

Inheritance

Thiết lập quan hệ kế thừa giữa các class.

Polymorphism

Một kiểu tham chiếu hoặc lời gọi có thể tương ứng với nhiều cách triển khai.

Abstraction

Thể hiện khả năng cần thiết, che giấu chi tiết triển khai.

# 7.1. ENCAPSULATION — TÍNH ĐÓNG GÓI

## 7.1.1. Encapsulation là gì?

Encapsulation là nguyên tắc tổ chức dữ liệu và những hành vi liên quan bên trong một thành phần, đồng thời kiểm soát việc truy cập và thay đổi trạng thái thông qua giao diện được thiết kế phù hợp.

Mục tiêu quan trọng là bảo vệ các invariants — những điều kiện phải luôn đúng đối với trạng thái của object.

Ví dụ, số dư tài khoản không được âm nếu nghiệp vụ không cho phép thấu chi.

### Ví dụ không áp dụng đóng gói tốt

Code bên ngoài có thể:

Nếu trạng thái âm không hợp lệ, class đã cho phép bên ngoài phá vỡ business rule.

### Áp dụng Encapsulation

Sử dụng:

Kết quả:

Bên ngoài không thể trực tiếp thực hiện:

Vì `balance` là `private`.

### Encapsulation không chỉ là private + getter/setter
+
Đây là một hiểu lầm phổ biến.

Ví dụ:

Dù field đã là `private`, setter này vẫn cho phép mọi giá trị được gán.

Vấn đề nghiệp vụ vẫn tồn tại.

Một thiết kế tốt hơn là cung cấp các hành vi có ý nghĩa:

thay vì cho phép thay đổi toàn bộ state tùy ý.

Điểm cốt lõi: Encapsulation là kiểm soát trạng thái thông qua giao diện và hành vi hợp lệ, không đơn thuần là đổi field từ `public` sang `private`.

## 7.1.2. Access Modifiers

Java hỗ trợ bốn mức truy cập phổ biến đối với class members.

| Modifier | Cùng class | Cùng package | Subclass khác package | Class khác package |
| --------------- | ---------- | ------------ | -------------------------- | ------------------ |
| `public` | Có | Có | Có | Có |
| `protected` | Có | Có | Có điều kiện | Không |
| package-private | Có | Có | Không theo cơ chế subclass | Không |
| `private` | Có | Không | Không | Không |

Bảng được đơn giản hóa theo quyền truy cập thành viên. Với `protected` ở subclass khác package, Java áp dụng thêm quy tắc liên quan đến kiểu của biểu thức truy cập.

### public

Có thể được truy cập từ nơi khác nếu các điều kiện module và khả năng truy cập kiểu chứa cho phép.

### private

Chỉ truy cập trong phạm vi được Java cho phép đối với private members của top-level class hoặc interface chứa khai báo đó, bao gồm các nested types liên quan theo quy tắc nestmates.

### protected

Được truy cập trong cùng package và trong các subclass phù hợp.
