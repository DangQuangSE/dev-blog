# JAVA CORE 21 — PHẦN 6: JAVA GENERICS

Giáo trình lý thuyết chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Generics là cơ chế quan trọng của hệ thống kiểu dữ liệu Java. Sau khi học Collections Framework, bạn cần hiểu vì sao có thể viết `List<String>`, `Map<Long, User>`, `Optional<User>` hoặc `ResponseEntity<UserDto>`, và compiler bảo vệ tính an toàn kiểu dữ liệu như thế nào.

Phần này tập trung vào bản chất của Generics: type parameter, type argument, bounded types, wildcard, PECS, invariance, type erasure và những giới hạn cần biết khi thiết kế API backend.

## Nội dung Chương 20 — Java Generics

| Nhóm | Chủ đề |
| --- | --- |
| A. Fundamentals | Generics, type safety, generic class, interface, method |
| B. Type Parameters | `T`, `E`, `K`, `V`, bounds, multiple bounds |
| C. Wildcards | `?`, `extends`, `super`, wildcard capture |
| D. PECS | Producer Extends, Consumer Super |
| E. Advanced Generics | Invariance, type erasure, raw types, heap pollution |
| F. Backend Design | Generic DTO, repository, mapper, result và API design |

# CHƯƠNG 20. JAVA GENERICS

## 20.1. Generics là gì?

Generics là cơ chế cho phép class, interface hoặc method khai báo type parameters. Nhờ đó, cùng một implementation có thể làm việc với nhiều kiểu dữ liệu nhưng vẫn được kiểm tra kiểu tại compile time.

Ví dụ:

```java
List<String> names = new ArrayList<>();

names.add("Alice");
names.add("Bob");

String firstName = names.get(0);
```

Trong ví dụ:

- `List<E>` là generic interface.
- `E` là type parameter được khai báo trong `List`.
- `String` là type argument khi sử dụng `List<String>`.
- `List<String>` là một parameterized type.

Nếu cố gắng thêm số nguyên:

```java
names.add(100); // Compile-time error
```

Compiler biết collection này chỉ nhận `String` và phát hiện lỗi trước khi chương trình chạy.

### Type parameter và type argument

Phân biệt hai khái niệm:

```java
class Box<T> {
}
```

Trong khai báo trên, `T` là type parameter.

```java
Box<String> box = new Box<>();
```

Trong cách sử dụng trên, `String` là type argument.

Tương tự với generic method:

```java
public static <T> T identity(T value) {
    return value;
}
```

Khi gọi:

```java
String text = identity("Java");
```

compiler suy luận type parameter `T` tương ứng với `String` trong lời gọi đó.

### Generics giải quyết vấn đề gì?

Trước Java 5, nhiều API collection sử dụng raw type và trả về `Object`:

```java
List names = new ArrayList();

names.add("Alice");
names.add(100);

String name = (String) names.get(0);
```

Lập trình viên phải tự cast. Nếu cast sai:

```java
String value = (String) names.get(1);
```

chương trình chỉ phát hiện lỗi khi chạy và ném `ClassCastException`.

Với Generics:

```java
List<String> names = new ArrayList<>();

names.add("Alice");
names.add(100); // Compile-time error
```

### Ba lợi ích chính

1. **Type safety:** phát hiện nhiều lỗi không tương thích kiểu ở compile time.
2. **Code reusability:** một class hoặc method có thể dùng cho nhiều reference types.
3. **Giảm explicit cast:** compiler biết kiểu của giá trị trả về.

Tuy nhiên, Generics không phải một lớp bảo vệ tuyệt đối. Raw type, unchecked cast, reflection hoặc code dùng varargs không an toàn vẫn có thể làm suy yếu type safety.

## 20.2. Generic Class

Generic class là class khai báo một hoặc nhiều type parameters.

```java
public class Box<T> {

    private T value;

    public Box(T value) {
        this.value = value;
    }

    public T getValue() {
        return value;
    }

    public void setValue(T value) {
        this.value = value;
    }
}
```

### Sử dụng với nhiều kiểu

```java
Box<String> textBox = new Box<>("Java");
String text = textBox.getValue();

Box<Integer> numberBox = new Box<>(100);
Integer number = numberBox.getValue();
```

Cùng một class `Box<T>` được tái sử dụng với các type argument khác nhau.

### Generic class có nhiều type parameters

```java
public class Pair<K, V> {

    private final K key;
    private final V value;

    public Pair(K key, V value) {
        this.key = key;
        this.value = value;
    }

    public K getKey() {
        return key;
    }

    public V getValue() {
        return value;
    }
}
```

Sử dụng:

```java
Pair<Long, String> user =
        new Pair<>(1L, "Alice");

Long id = user.getKey();
String name = user.getValue();
```

Đây là ý tưởng tương tự `Map<K, V>`, trong đó một kiểu đại diện cho key và một kiểu đại diện cho value.

### Generics không nhận primitive type

Không hợp lệ:

```java
Box<int> box = new Box<>(100);
```

Phải dùng wrapper type:

```java
Box<Integer> box = new Box<>(100);
```

Java có thể autobox giá trị `int` thành `Integer` trong biểu thức phù hợp.

## 20.3. Generic Interface

Interface cũng có thể khai báo type parameters.

```java
public interface Repository<T> {

    T save(T entity);

    Optional<T> findById(long id);

    List<T> findAll();
}
```

Một implementation có thể cố định type argument:

```java
public final class UserRepository
        implements Repository<User> {

    @Override
    public User save(User entity) {
        return entity;
    }

    @Override
    public Optional<User> findById(long id) {
        return Optional.empty();
    }

    @Override
    public List<User> findAll() {
        return List.of();
    }
}
```

Hoặc giữ lại type parameter:

```java
public class InMemoryRepository<T>
        implements Repository<T> {

    private final List<T> values = new ArrayList<>();

    @Override
    public T save(T entity) {
        values.add(entity);
        return entity;
    }

    @Override
    public Optional<T> findById(long id) {
        return values.stream().findFirst();
    }

    @Override
    public List<T> findAll() {
        return List.copyOf(values);
    }
}
```

Trong backend, dạng API tương tự thường xuất hiện ở repository, service, mapper và response wrapper. Ví dụ framework có thể biểu diễn repository bằng dạng:

```java
interface JpaRepository<Entity, Id> {
    Optional<Entity> findById(Id id);
}
```

`Entity` và `Id` giúp contract biểu diễn rõ entity nào được lưu và identifier có kiểu gì.

## 20.4. Generic Method

Generic method là method tự khai báo type parameter riêng.

```java
public static <T> T identity(T value) {
    return value;
}
```

Trong khai báo:

```java
public static <T> T identity(T value)
```

- `<T>` khai báo type parameter của method.
- `T` tiếp theo là return type.
- `T value` là parameter type.

Sử dụng:

```java
String text = identity("Java");
Integer number = identity(100);
```

Thông thường compiler tự suy luận type argument. Bạn cũng có thể chỉ định tường minh:

```java
String text = Main.<String>identity("Java");
```

Generic method không cần nằm trong generic class:

```java
public final class ArrayPrinter {

    private ArrayPrinter() {
    }

    public static <T> void print(T[] values) {
        for (T value : values) {
            System.out.println(value);
        }
    }
}
```

Một generic method có thể có nhiều type parameters:

```java
public static <K, V> Pair<K, V> pair(K key, V value) {
    return new Pair<>(key, value);
}
```

```java
Pair<Long, String> user = pair(1L, "Alice");
```

## 20.5. Generic Constructor

Constructor cũng có thể khai báo type parameter riêng, kể cả khi class không phải generic.

```java
public final class Message {

    private final String text;

    public <T> Message(T value) {
        this.text = String.valueOf(value);
    }

    public String text() {
        return text;
    }
}
```

Sử dụng:

```java
Message first = new Message(100);
Message second = new Message("Hello");
```

`T` ở đây thuộc về constructor, không thuộc về class `Message`.

Cần phân biệt:

```java
class Box<T> {
    Box(T value) {
    }
}
```

Ở ví dụ này constructor sử dụng type parameter của class. Còn generic constructor là trường hợp constructor tự khai báo một type parameter riêng, ví dụ `<T> Message(T value)`.

## 20.6. Quy ước đặt tên Type Parameters

Java cho phép đặt tên tùy ý, nhưng các API chuẩn thường dùng convention sau:

| Type parameter | Ý nghĩa thường dùng |
| --- | --- |
| `T` | Type |
| `E` | Element |
| `K` | Key |
| `V` | Value |
| `N` | Number |
| `R` | Result hoặc Return |
| `S`, `U` | Type bổ sung |

Ví dụ:

```java
interface Function<T, R> {
    R apply(T value);
}
```

Tên một chữ cái phù hợp với generic abstraction ngắn. Với domain phức tạp, tên mô tả như `Request`, `Response` hoặc `Entity` có thể dễ đọc hơn, nhưng cần giữ nhất quán trong cùng API.

## 20.7. Type Safety và Compile-time Checking

```java
List<String> names = new ArrayList<>();
names.add("Alice");
```

Compiler cho phép thêm `String` và từ chối `Integer`.

Tuy nhiên, raw type có thể tạo một “lỗ hổng”:

```java
List<String> names = new ArrayList<>();

@SuppressWarnings({"rawtypes", "unchecked"})
List raw = names;

raw.add(123);
```

Tại runtime, khi Java lấy phần tử và cần trả về `String`:

```java
String name = names.get(0);
```

có thể xảy ra `ClassCastException`.

Bài học: Generics cung cấp type safety mạnh khi toàn bộ code giữ parameterized types. Chú thích `@SuppressWarnings` chỉ nên đặt ở phạm vi nhỏ sau khi đã kiểm tra rằng phép chuyển đổi thực sự an toàn.

# 20.8. BOUNDED TYPE PARAMETERS

Bounded type parameter dùng để giới hạn các type argument hợp lệ. Nhờ bound, compiler biết mọi kiểu hợp lệ đều có những capability tối thiểu nhất định.

## 20.8.1. Upper Bounded Type Parameter

Cú pháp:

```java
<T extends UpperBound>
```

Ví dụ:

```java
public static <T extends Number> double sum(List<T> numbers) {

    double total = 0;

    for (T number : numbers) {
        total += number.doubleValue();
    }

    return total;
}
```

Sử dụng:

```java
double integers = sum(List.of(1, 2, 3));
double decimals = sum(List.of(1.5, 2.5));
```

`Integer`, `Double` và các numeric wrapper khác đều là subtype của `Number`, nên có thể gọi `doubleValue()`.

Không thể gọi bằng `String`:

```java
sum(List.of("1", "2")); // Compile-time error
```

### `extends` với interface

Trong bound declaration, Java cũng dùng `extends` khi upper bound là interface:

```java
public static <T extends Comparable<T>> T max(List<T> values) {
    if (values.isEmpty()) {
        throw new IllegalArgumentException("Values must not be empty");
    }

    T result = values.get(0);

    for (int i = 1; i < values.size(); i++) {
        if (values.get(i).compareTo(result) > 0) {
            result = values.get(i);
        }
    }

    return result;
}
```

`String` triển khai `Comparable<String>`, nên có thể gọi:

```java
String ordered = max(List.of("B", "A", "C"));
```

`implements` không được dùng trong khai báo bound. `extends` ở đây có nghĩa “type argument phải là subtype của”.

## 20.8.2. Multiple Bounds

Một type parameter có thể có nhiều upper bounds:

```java
<T extends Number & Comparable<T>>
```

Ví dụ:

```java
public static <T extends Number & Comparable<T>>
T largest(List<T> values) {

    if (values.isEmpty()) {
        throw new IllegalArgumentException("Values must not be empty");
    }

    T result = values.get(0);

    for (T value : values) {
        if (value.compareTo(result) > 0) {
            result = value;
        }
    }

    return result;
}
```

`Integer` thỏa cả hai bound:

- Là subtype của `Number`.
- Triển khai `Comparable<Integer>`.

```java
Integer maximum = largest(List.of(3, 8, 2, 5));
```

### Quy tắc thứ tự bound

Nếu có class bound, class phải đứng trước interface bounds:

```java
<T extends SomeClass & InterfaceA & InterfaceB>
```

Không hợp lệ:

```java
<T extends InterfaceA & SomeClass>
```

Một type parameter chỉ có tối đa một class bound, nhưng có thể có nhiều interface bounds nếu các bounds tương thích.

## 20.8.3. Bounded Generic Methods và Comparable

Một phiên bản tổng quát hơn của method tìm phần tử lớn nhất là:

```java
public static <T extends Comparable<? super T>>
T maxOf(List<? extends T> values) {

    if (values.isEmpty()) {
        throw new IllegalArgumentException("Values must not be empty");
    }

    T result = values.get(0);

    for (int i = 1; i < values.size(); i++) {
        if (values.get(i).compareTo(result) > 0) {
            result = values.get(i);
        }
    }

    return result;
}
```

Có hai ý quan trọng:

- `T extends Comparable<? super T>` cho phép `T` so sánh với chính nó hoặc một supertype của nó.
- `List<? extends T>` cho phép truyền một list chứa subtype của `T` mà không cần sao chép sang list mới.

Pattern này xuất hiện trong nhiều API chuẩn vì linh hoạt hơn chỉ viết `T extends Comparable<T>`.

Ví dụ mô hình:

```java
class Animal implements Comparable<Animal> {

    @Override
    public int compareTo(Animal other) {
        return 0;
    }
}

class Dog extends Animal {
}
```

`Dog` thừa hưởng khả năng so sánh với `Animal`. Bound dùng `? super T` phù hợp với tình huống `Dog` không triển khai riêng `Comparable<Dog>`.

# 20.9. GENERIC INVARIANCE

## 20.9.1. Invariance là gì?

Nếu `Dog` là subtype của `Animal`:

```java
Dog dog = new Dog();
Animal animal = dog;
```

thì assignment giữa hai reference đơn lẻ là hợp lệ.

Nhưng:

```java
List<Dog> dogs = new ArrayList<>();
List<Animal> animals = dogs; // Compile-time error
```

`List<Dog>` không phải subtype của `List<Animal>`. Đây gọi là **invariance** của generic types trong Java.

### Tại sao Java phải giữ invariance?

Nếu assignment trên được phép:

```java
animals.add(new Cat());
```

thì cùng một object list đang được nhìn qua biến `dogs` lại chứa `Cat`. Khi đó lời gọi:

```java
Dog first = dogs.get(0);
```

không còn an toàn.

Invariance ngăn tình huống này ngay từ compile time.

### `List<Object>`, `List<String>` và `List<?>`

Ba kiểu sau không tương đương:

```java
List<Object> objects = new ArrayList<>();
List<String> strings = new ArrayList<>();
List<?> unknown = strings;
```

- `List<Object>` là list mà API cho phép thêm mọi object.
- `List<String>` chỉ cho phép thêm string.
- `List<?>` là một list với element type chưa biết cụ thể.

`List<String>` không thể gán cho `List<Object>`, nhưng có thể gán cho `List<?>`.

## 20.9.2. So sánh với Array Covariance

Java arrays có covariance:

```java
Dog[] dogs = new Dog[2];
Animal[] animals = dogs;
```

Assignment hợp lệ, nhưng thao tác sau có thể lỗi tại runtime:

```java
animals[0] = new Cat(); // ArrayStoreException
```

Generic collections chọn invariance để phát hiện vấn đề sớm hơn:

```java
List<Dog> dogs = new ArrayList<>();
// List<Animal> animals = dogs; // Không compile
```

Đây là khác biệt quan trọng giữa type system của arrays và Generics.

## 20.9.3. Cách biểu diễn quan hệ subtype với wildcard

Khi chỉ muốn đọc các subtype của `Animal`:

```java
List<? extends Animal> animals = new ArrayList<Dog>();
```

Khi muốn ghi các subtype của `Dog`:

```java
List<? super Dog> dogs = new ArrayList<Animal>();
```

Wildcard không biến `List<Dog>` thành `List<Animal>`. Nó tạo ra một kiểu tham chiếu an toàn để mô tả phạm vi type argument.

+

# 20.10. WILDCARDS

Wildcard (`?`) đại diện cho một type argument chưa biết cụ thể. Wildcard thường được dùng ở parameter type để một method chấp nhận nhiều parameterized types có quan hệ phù hợp.

Ví dụ:

```java
static void printAll(List<?> values) {
    for (Object value : values) {
        System.out.println(value);
    }
}
```

Method trên có thể nhận `List<String>`, `List<Integer>` hoặc `List<User>`.

## 20.10.1. Unbounded Wildcard — `?`

```java
List<?> values = List.of("Java", "Spring");
```

Ta biết đây là một list, nhưng không biết element type cụ thể là `String`, `Integer` hay một type khác.

Có thể đọc phần tử dưới dạng `Object`:

```java
Object first = values.get(0);
```

Không thể thêm một giá trị cụ thể:

```java
values.add("New value"); // Compile-time error
values.add(100);         // Compile-time error
```

Lý do là Java không biết type argument thật sự bên trong list. Nó có thể là `List<Integer>` hoặc `List<User>`. Giá trị duy nhất có thể thêm an toàn vào mọi reference-typed list là `null`:

```java
values.add(null);
```

Dù không thêm được element cụ thể, các thao tác không phụ thuộc vào element type vẫn hợp lệ:

```java
int size = values.size();
boolean empty = values.isEmpty();
values.clear();
```

### `List<?>` khác `List<Object>`

`List<Object>` nghĩa là list có thể chứa mọi object:

```java
List<Object> objects = new ArrayList<>();
objects.add("Java");
objects.add(100);
objects.add(new User());
```

`List<?>` nghĩa là có một list với type argument cụ thể nhưng type argument đó chưa được biết ở vị trí đang sử dụng:

```java
List<String> names = new ArrayList<>();
List<?> unknown = names;
```

`unknown` đọc được như `Object`, nhưng không thể thêm `Integer` hoặc `String` tùy ý.

## 20.10.2. Upper Bounded Wildcard — `? extends T`

```java
List<? extends Number> numbers = List.of(1, 2, 3);
```

Reference trên có thể trỏ tới:

- `List<Integer>`.
- `List<Double>`.
- `List<Number>`.
- `List<BigDecimal>`.

Ta có thể đọc element như `Number`:

```java
Number number = numbers.get(0);
double value = number.doubleValue();
```

Nhưng không thể thêm một `Number` cụ thể:

```java
numbers.add(10);       // Compile-time error
numbers.add(10.5);     // Compile-time error
numbers.add(null);     // Hợp lệ
```

Nếu object thật sự là `List<Integer>`, thêm một `Double` sẽ phá vỡ type safety. Vì vậy compiler không cho phép thêm bất kỳ non-null value nào.

`? extends T` là lựa chọn phù hợp khi method **đọc dữ liệu** từ một nguồn có element type là `T` hoặc subtype của `T`.

## 20.10.3. Lower Bounded Wildcard — `? super T`

```java
List<? super Integer> numbers = new ArrayList<Number>();
```

Reference trên có thể trỏ tới:

- `List<Integer>`.
- `List<Number>`.
- `List<Object>`.

Có thể thêm `Integer` và các subtype của `Integer`:

```java
numbers.add(10);
numbers.add(Integer.valueOf(20));
numbers.add(null);
```

Khi đọc, compiler chỉ biết giá trị chắc chắn là một `Object`:

```java
Object value = numbers.get(0);
```

Không thể viết:

```java
Integer value = numbers.get(0); // Compile-time error
```

vì list thật sự có thể là `List<Object>` chứa một object không phải `Integer`.

`? super T` phù hợp khi method **ghi dữ liệu kiểu T** vào một destination.

## 20.10.4. So sánh ba wildcard phổ biến

| Kiểu | Có thể đọc an toàn | Có thể thêm |
| --- | --- | --- |
| `List<?>` | `Object` | Chỉ `null` |
| `List<? extends Number>` | `Number` | Chỉ `null` |
| `List<? super Integer>` | `Object` | `Integer` và subtype của `Integer` |

Cách nhớ thực dụng:

- `extends`: lấy dữ liệu ra.
- `super`: đưa dữ liệu vào.
- `?`: không biết type cụ thể, chỉ dùng những thao tác an toàn với mọi type.

## 20.10.5. Wildcard Capture

Khi compiler gặp `List<?>`, nó có thể xem wildcard đó như một type bí mật riêng, thường gọi là capture type.

Ví dụ, method này không thể trực tiếp gán giá trị lấy ra từ list vào vị trí khác nếu không có helper phù hợp:

```java
static void swapFirstTwo(List<?> values) {
    swapCaptured(values);
}

private static <T> void swapCaptured(List<T> values) {
    T first = values.get(0);
    values.set(0, values.get(1));
    values.set(1, first);
}
```

`T` trong helper đại diện cho đúng type đang bị capture. Method không cần biết đó là `String` hay `Integer`; nó chỉ cần giữ nguyên cùng một type trong các thao tác đọc và ghi.

Đây là lý do một số API generic có helper method private để làm việc với wildcard.

## 20.10.6. Wildcard hay Type Parameter?

Dùng wildcard khi các type chưa biết không cần liên hệ với nhau:

```java
static int sizeOf(List<?> values) {
    return values.size();
}
```

Dùng type parameter khi cần thể hiện quan hệ giữa nhiều vị trí:

```java
static <T> T first(List<T> values) {
    return values.get(0);
}
```

Hoặc:

```java
static <T> void moveFirst(List<? super T> destination,
                          List<? extends T> source) {
    destination.add(source.get(0));
}
```

Trong method cuối, `T` liên kết type mà source cung cấp với type mà destination có thể nhận.

# 20.11. PECS — PRODUCER EXTENDS, CONSUMER SUPER

PECS là quy tắc thực dụng để thiết kế method dùng wildcard:

- **Producer Extends:** nguồn cung cấp dữ liệu nên dùng `? extends T`.
- **Consumer Super:** nơi tiêu thụ hoặc nhận dữ liệu nên dùng `? super T`.

## 20.11.1. Producer Extends

```java
static double total(List<? extends Number> numbers) {
    double result = 0;

    for (Number number : numbers) {
        result += number.doubleValue();
    }

    return result;
}
```

List là producer vì method lấy các phần tử từ list. Method có thể nhận cả `List<Integer>` và `List<Double>`.

## 20.11.2. Consumer Super

```java
static void addDefaults(List<? super Integer> target) {
    target.add(0);
    target.add(1);
    target.add(2);
}
```

List là consumer vì method đưa `Integer` vào list. Method có thể nhận `List<Integer>`, `List<Number>` hoặc `List<Object>`.

## 20.11.3. Ví dụ copy giữa hai collection

```java
public static <T> void copy(
        List<? super T> destination,
        List<? extends T> source
) {
    if (destination.size() < source.size()) {
        throw new IllegalArgumentException(
                "Destination is smaller than source"
        );
    }

    for (int i = 0; i < source.size(); i++) {
        destination.set(i, source.get(i));
    }
}
```

Sử dụng:

```java
List<Dog> dogs = List.of(new Dog(), new Dog());
List<Animal> animals = new ArrayList<>(
        List.of(new Animal(), new Animal())
);

copy(animals, dogs);
```

- `source` là producer nên dùng `? extends T`.
- `destination` là consumer nên dùng `? super T`.
- `T` giúp compiler liên kết hai phía.

Đây cũng là ý tưởng của nhiều method trong Java Collections API.

## 20.11.4. PECS không có nghĩa mọi method đều phải dùng wildcard

Nếu API cần một type cụ thể và không cần chấp nhận subtype/supertype rộng hơn, parameterized type bình thường dễ đọc hơn:

```java
static void saveUsers(List<User> users) {
}
```

Không nên thêm wildcard chỉ để làm chữ ký trông “generic” hơn. Wildcard có giá trị khi nó thể hiện đúng độ linh hoạt mà contract cần.

# 20.12. TYPE INFERENCE VÀ DIAMOND OPERATOR

Compiler có thể suy luận type arguments từ ngữ cảnh.

## 20.12.1. Diamond operator

```java
Map<String, List<Integer>> scores = new HashMap<>();
```

Phần `<>` ở vế phải gọi là diamond operator. Compiler suy luận `String` và `List<Integer>` dựa trên kiểu ở vế trái.

Không có diamond:

```java
Map<String, List<Integer>> scores =
        new HashMap<String, List<Integer>>();
```

Cách viết đầy đủ vẫn hợp lệ nhưng dài hơn.

## 20.12.2. Type inference trong generic method

```java
static <T> T choose(T first, T second) {
    return first;
}

String result = choose("A", "B");
Integer number = choose(1, 2);
```

Compiler suy luận `T` từ arguments và target type. Trong tình huống mơ hồ, có thể chỉ định type witness:

```java
Number number = Main.<Number>choose(1, 2.5);
```

## 20.12.3. Diamond kết hợp với `var`

```java
var names = new ArrayList<String>();
var numbers = new ArrayList<Integer>();
```

Tên biến `names` có kiểu suy luận là `ArrayList<String>`, còn `numbers` có kiểu là `ArrayList<Integer>`.

Với diamond không có target type rõ ràng:

```java
var values = new ArrayList<>();
```

compiler phải chọn một kiểu hợp lệ theo quy tắc suy luận, thường dẫn tới collection với element type rộng như `Object`. Vì vậy không nên lạm dụng cách viết này nếu nó làm mất thông tin kiểu mong muốn.

## 20.12.4. Type inference không phải dynamic typing

```java
var username = "admin";
username = "user"; // Hợp lệ
username = 100;    // Compile-time error
```

`var` chỉ cho compiler suy luận kiểu tĩnh tại compile time. Nó không làm biến thay đổi kiểu trong runtime.

# 20.13. TYPE ERASURE

Java Generics chủ yếu được kiểm tra tại compile time. Để duy trì khả năng tương thích với bytecode và thư viện trước Java 5, compiler sử dụng cơ chế **type erasure**.

Type erasure loại bỏ phần lớn type argument khỏi biểu diễn runtime của generic code.

## 20.13.1. Erasure của type parameter

Type parameter không có bound thường được thay bằng `Object`:

```java
class Box<T> {
    T get() {
        return null;
    }
}
```

Về ý tưởng, sau erasure, chữ ký tương ứng gần với:

```java
class Box {
    Object get() {
        return null;
    }
}
```

Nếu có bound:

```java
class NumericBox<T extends Number> {
    T get() {
        return null;
    }
}
```

erasure của `T` thường dựa trên bound đầu tiên, ở đây là `Number`.

## 20.13.2. Compiler chèn cast cần thiết

```java
List<String> names = new ArrayList<>();
names.add("Alice");

String name = names.get(0);
```

Sau erasure, thao tác bên trong collection về cơ bản trả về `Object`. Compiler có thể chèn cast tương đương:

```java
String name = (String) names.get(0);
```

Lập trình viên không phải viết cast, nhưng runtime vẫn cần kiểm tra khi giá trị được lấy ra.

## 20.13.3. Các parameterized types có cùng runtime class

```java
List<String> strings = new ArrayList<>();
List<Integer> integers = new ArrayList<>();

System.out.println(strings.getClass() == integers.getClass());
```

Kết quả là `true` vì cả hai object đều là instance của implementation runtime `ArrayList`.

Không thể kiểm tra trực tiếp:

```java
if (value instanceof List<String>) {
}
```

vì `List<String>` là non-reifiable type. Có thể kiểm tra bằng wildcard:

```java
if (value instanceof List<?> list) {
    System.out.println(list.size());
}
```

## 20.13.4. Bridge methods

Type erasure có thể làm method overriding thay đổi chữ ký sau khi biên dịch.

Ví dụ:

```java
class Box<T> {
    void set(T value) {
    }
}

class StringBox extends Box<String> {
    @Override
    void set(String value) {
    }
}
```

Sau erasure, method ở class cha có dạng `set(Object)`, còn method ở class con có dạng `set(String)`. Compiler có thể sinh một bridge method ở class con để duy trì polymorphism và gọi đúng implementation.

Bridge method thường không được lập trình viên viết trực tiếp, nhưng có thể xuất hiện khi quan sát bằng reflection hoặc bytecode tools.

## 20.13.5. Type erasure không có nghĩa mọi thông tin generic đều biến mất

Generic signature metadata có thể còn trong class file để reflection hoặc công cụ đọc. Tuy nhiên, object runtime không tự động biết chính xác nó đang được dùng qua `List<String>` hay `List<Integer>`.

Vì vậy:

```java
List<String> names = new ArrayList<>();
List<Integer> numbers = new ArrayList<>();
```

hai list không thể được phân biệt bằng một kiểm tra runtime đơn giản dựa trên type argument.

# 20.14. REIFIABLE VÀ NON-REIFIABLE TYPES

Một type là **reifiable** nếu thông tin kiểu đủ để JVM sử dụng tại runtime mà không cần biết type argument cụ thể đã bị erasure.

Một số reifiable types:

- Primitive types.
- Non-generic classes và interfaces.
- Raw types.
- Parameterized types chỉ dùng unbounded wildcard, như `List<?>`.
- Array types có component type reifiable.

Một số non-reifiable types:

- `List<String>`.
- `Map<String, Integer>`.
- `List<? extends Number>`.
- Generic type parameter `T`.

Ví dụ hợp lệ:

```java
if (value instanceof List<?> list) {
    System.out.println(list.size());
}
```

Ví dụ không hợp lệ:

```java
if (value instanceof List<String>) {
    // Compile-time error
}
```

JVM chỉ biết đây là một `List` ở runtime, không thể xác minh mọi element bên trong đều là `String` tại điểm kiểm tra đó.

# 20.15. RAW TYPES

Raw type là cách sử dụng generic class hoặc interface mà không cung cấp type argument.

```java
List values = new ArrayList();
Map map = new HashMap();
```

Raw types tồn tại chủ yếu để tương thích với code legacy trước Java 5.

## 20.15.1. Vì sao raw type nguy hiểm?

```java
List<String> names = new ArrayList<>();

@SuppressWarnings({"rawtypes", "unchecked"})
List raw = names;

raw.add(100);
```

Biến `names` vẫn có kiểu tĩnh là `List<String>`, nhưng object đã bị ghi một `Integer` thông qua raw reference. Khi lấy ra:

```java
String name = names.get(0);
```

có thể xảy ra `ClassCastException`.

## 20.15.2. Raw type khác unbounded wildcard

| Raw type | Unbounded wildcard |
| --- | --- |
| `List` | `List<?>` |
| Mất nhiều kiểm tra compile time | Vẫn giữ type safety ở mức phù hợp |
| Có thể thêm object tùy ý | Không thể thêm non-null element cụ thể |
| Thường chỉ dùng cho legacy | Phù hợp khi type argument thực sự chưa biết |

Thay vì:

```java
void print(List values) {
}
```

nên viết:

```java
void print(List<?> values) {
}
```

## 20.15.3. Suppress warning đúng phạm vi

Nếu bắt buộc tương tác với API legacy:

```java
@SuppressWarnings({"rawtypes", "unchecked"})
private static List<String> readLegacyValues() {
    // Kiểm tra và chuyển đổi dữ liệu ở đây.
    return new ArrayList<>();
}
```

Nên đặt annotation ở method hoặc statement nhỏ nhất có thể. Không nên tắt toàn bộ warning của một class hoặc module mà không kiểm tra từng phép cast.

# 20.16. HEAP POLLUTION

Heap pollution xảy ra khi một biến có kiểu parameterized trỏ tới object không phù hợp với parameterized type mà compiler tin tưởng.

Ví dụ:

```java
static void addInteger(List raw) {
    raw.add(42);
}

public static void main(String[] args) {
    List<String> values = new ArrayList<>();
    addInteger(values);

    String value = values.get(0);
}
```

Method `addInteger` sử dụng raw type nên compiler chỉ có thể cảnh báo. Runtime ném `ClassCastException` khi kết quả phải được xem là `String`.

Các nguồn thường gặp:

- Raw types.
- Unchecked casts.
- Generic varargs không an toàn.
- Reflection làm sai contract.
- Thư viện legacy.
- `@SuppressWarnings` được dùng để che lỗi thay vì chứng minh tính an toàn.

Heap pollution thường làm lỗi xuất hiện xa nơi nguyên nhân được tạo ra, khiến debugging khó hơn.

# 20.17. GENERIC VARARGS VÀ @SafeVarargs

Varargs được triển khai bằng array. Với generic type, array runtime có thể không biểu diễn đúng type argument.

Ví dụ nguy hiểm:

```java
static void dangerous(List<String>... lists) {
    Object[] array = lists;
    array[0] = List.of(42);

    String value = lists[0].get(0);
}
```

`List<String>...` là non-reifiable. Việc chuyển sang `Object[]` rồi ghi một list khác kiểu có thể tạo heap pollution; lỗi thường xuất hiện khi phần tử được lấy ra và cast thành `String`.

Compiler thường phát cảnh báo về generic varargs.

### @SafeVarargs

`@SafeVarargs` cho compiler biết rằng implementation đã được kiểm tra và không thực hiện thao tác gây unsafe heap pollution.

Chỉ dùng annotation khi method thực sự an toàn:

```java
@SafeVarargs
private static <T> List<T> combine(List<T>... parts) {
    List<T> result = new ArrayList<>();

    for (List<T> part : parts) {
        result.addAll(part);
    }

    return result;
}
```

Annotation này phù hợp với static method, final method hoặc private method; không dùng tùy tiện cho method có thể bị override.

Cách an toàn hơn trong API public thường là nhận `List<List<T>>` thay vì generic varargs:

```java
static <T> List<T> combine(List<List<T>> parts) {
    List<T> result = new ArrayList<>();

    for (List<T> part : parts) {
        result.addAll(part);
    }

    return result;
}
```

# 20.18. GENERIC ARRAYS

## 20.18.1. Vì sao không thể tạo `new T[]`?

```java
class Storage<T> {
    private T[] values = new T[10]; // Compile-time error
}
```

Tại runtime, JVM cần biết component type để tạo array. Nhưng type parameter `T` đã bị erasure và không cung cấp component type cụ thể.

## 20.18.2. Dùng `Object[]` và cast

```java
class Storage<T> {

    private final Object[] values = new Object[10];

    @SuppressWarnings("unchecked")
    T get(int index) {
        return (T) values[index];
    }
}
```

Cách này có thể dùng trong implementation được kiểm soát chặt chẽ, nhưng cast không tự chứng minh rằng mọi giá trị trong array thật sự có kiểu `T`. Vì vậy cần giới hạn phạm vi warning và bảo vệ invariant của class.

## 20.18.3. Dùng Class token

Khi cần tạo array đúng component type, truyền `Class<T>` vào constructor:

```java
import java.lang.reflect.Array;

public final class ArrayFactory<T> {

    private final Class<T> componentType;

    public ArrayFactory(Class<T> componentType) {
        this.componentType = componentType;
    }

    @SuppressWarnings("unchecked")
    public T[] create(int length) {
        return (T[]) Array.newInstance(componentType, length);
    }
}
```

Sử dụng:

```java
ArrayFactory<String> factory =
        new ArrayFactory<>(String.class);

String[] values = factory.create(3);
```

`String.class` cung cấp thông tin runtime mà type parameter không có.

## 20.18.4. Khi nào nên dùng List<T>?

Nếu không có yêu cầu đặc biệt về array, `List<T>` thường đơn giản và an toàn hơn:

```java
class Storage<T> {
    private final List<T> values = new ArrayList<>();
}
```

Generic array có thể cần thiết khi làm việc với API cũ, thư viện hiệu năng thấp tầng hoặc protocol yêu cầu array. Với business code backend, collection thường là lựa chọn dễ bảo trì hơn.
+

# 20.19. CÁC GIỚI HẠN CỦA GENERICS

Generics mạnh ở compile time nhưng chịu ảnh hưởng của type erasure và quy tắc tương thích với JVM. Những giới hạn sau thường xuất hiện trong phỏng vấn và khi thiết kế thư viện.

## 20.19.1. Không dùng primitive type làm type argument

Không hợp lệ:

```java
List<int> numbers;
Map<long, String> values;
```

Phải dùng wrapper:

```java
List<Integer> numbers = new ArrayList<>();
Map<Long, String> values = new HashMap<>();
```

Collections lưu reference, nên primitive value được autobox thành object tương ứng. Khi làm việc với dữ liệu số rất lớn, boxing/unboxing lặp lại có thể có chi phí; trong trường hợp cần tối ưu, hãy cân nhắc primitive streams hoặc cấu trúc chuyên biệt.

## 20.19.2. Không tạo object bằng type parameter

Không hợp lệ:

```java
class Factory<T> {
    T create() {
        return new T();
    }
}
```

Sau erasure, runtime không biết nên gọi constructor của class nào. Cách thiết kế an toàn là nhận factory hoặc type token:

```java
class Factory<T> {

    private final Supplier<? extends T> creator;

    Factory(Supplier<? extends T> creator) {
        this.creator = creator;
    }

    T create() {
        return creator.get();
    }
}
```

```java
Factory<User> users = new Factory<>(User::new);
User user = users.create();
```

Cách này còn cho phép constructor có tham số hoặc logic tạo object phức tạp hơn.

## 20.19.3. Không dùng class type parameter trong static context

```java
class Counter<T> {

    private static T value; // Compile-time error

    static T getValue() {   // Compile-time error
        return value;
    }
}
```

`T` thuộc về từng parameterized instance, còn static member thuộc về class và dùng chung cho mọi type argument. Java không biết static field nên là `String`, `Integer` hay type nào khác.

Có thể khai báo một static generic method, vì type parameter đó thuộc về method:

```java
class Utility {

    static <T> T identity(T value) {
        return value;
    }
}
```

## 20.19.4. Không kiểm tra trực tiếp parameterized type bằng instanceof

Không hợp lệ:

```java
if (value instanceof List<String>) {
}
```

Có thể kiểm tra raw type, nhưng nên ưu tiên wildcard:

```java
if (value instanceof List<?> list) {
    System.out.println(list.size());
}
```

Nếu cần xác minh mọi phần tử là `String`, phải kiểm tra từng phần tử:

```java
static boolean allStrings(Object value) {
    if (!(value instanceof List<?> list)) {
        return false;
    }

    return list.stream().allMatch(String.class::isInstance);
}
```

## 20.19.5. Không tạo array của type parameter

Không hợp lệ:

```java
T[] values = new T[10];
```

Có thể dùng `List<T>` hoặc truyền component type như phần generic arrays đã trình bày.

## 20.19.6. Không dùng type parameter làm Throwable type

Không hợp lệ:

```java
class DataException<T> extends Exception {
}
```

Java không cho generic class trực tiếp hoặc gián tiếp kế thừa `Throwable`. Do erasure, JVM không thể phân biệt các loại exception parameterized khi thực hiện catch.

Tương tự, không thể viết:

```java
static <T extends Exception> void handle() {
    try {
        // ...
    } catch (T exception) {
        // Compile-time error
    }
}
```

Hãy dùng một exception class cụ thể và đặt dữ liệu generic trong field nếu cần.

## 20.19.7. Không overload chỉ bằng generic type argument

Hai method sau có cùng erasure:

```java
void process(List<String> values) {
}

void process(List<Integer> values) {
}
```

Khai báo này không compile vì cả hai đều gần với `process(List)` ở runtime.

Có thể overload bằng parameter có runtime signature khác:

```java
void process(List<String> values) {
}

void process(Set<String> values) {
}
```

Hoặc đặt tên method khác để biểu đạt rõ mục đích.

# 20.20. GENERIC INHERITANCE

Generic types vẫn tuân theo quy tắc kế thừa của class và interface, nhưng cần phân biệt type parameter của superclass với type argument được truyền khi kế thừa.

## 20.20.1. Cố định type argument trong subclass

```java
class Repository<T> {
    T save(T entity) {
        return entity;
    }
}

class UserRepository extends Repository<User> {
}
```

`UserRepository` kế thừa một phiên bản cụ thể là `Repository<User>`.

## 20.20.2. Giữ lại type parameter trong subclass

```java
class AuditedRepository<T>
        extends Repository<T> {

    private String actor;
}
```

Khi sử dụng:

```java
AuditedRepository<User> users =
        new AuditedRepository<>();
```

`T` được truyền tiếp từ subclass vào superclass.

## 20.20.3. Implement generic interface

```java
class UserService
        implements Comparable<UserService> {

    @Override
    public int compareTo(UserService other) {
        return 0;
    }
}
```

Một class không thể implement cùng một generic interface nhiều lần với các type argument khác nhau:

```java
class Invalid implements Comparable<User>,
                          Comparable<Order> {
}
```

Sau erasure, hai interface đều trở thành cùng một raw interface `Comparable`, nên contract bị mơ hồ.

## 20.20.4. Generic class và subtype relationship

```java
class Animal {
}

class Dog extends Animal {
}

class Box<T> {
}
```

```java
Box<Dog> dogs = new Box<>();
Box<Animal> animals = dogs; // Không hợp lệ
```

Kế thừa giữa type arguments không tự động tạo ra kế thừa giữa parameterized types. Khi cần quan hệ linh hoạt, dùng wildcard:

```java
Box<? extends Animal> animals = dogs;
```

Hoặc thiết kế method generic với bound phù hợp.

# 20.21. GENERIC RECORDS

Record cũng có thể là generic. Đây là lựa chọn thuận tiện cho DTO bất biến, response wrapper hoặc value object.

```java
public record ApiResponse<T>(
        boolean success,
        T data,
        String message
) {
    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(true, data, null);
    }

    public static <T> ApiResponse<T> failure(String message) {
        return new ApiResponse<>(false, null, message);
    }
}
```

Sử dụng:

```java
ApiResponse<UserDto> response =
        ApiResponse.success(userDto);

ApiResponse<List<OrderDto>> orders =
        ApiResponse.success(orderDtos);

ApiResponse<UserDto> failure =
        ApiResponse.failure("User not found");
```

Một generic record giúp type của `data` liên kết với ngữ cảnh sử dụng, thay vì trả về `Object` rồi cast ở controller.

Có thể validation trong compact constructor:

```java
public record ValidatedPage<T>(
        List<T> content,
        int page,
        int size,
        long totalElements
) {
    public ValidatedPage {
        if (content == null) {
            throw new NullPointerException("content");
        }
        if (page < 0 || size <= 0 || totalElements < 0) {
            throw new IllegalArgumentException(
                    "Invalid page information"
            );
        }

        content = List.copyOf(content);
    }
}
```

`List.copyOf` giúp snapshot response không bị thay đổi ngoài ý muốn sau khi record được tạo. Tuy nhiên, phần tử bên trong list vẫn phải được thiết kế phù hợp nếu chúng mutable.

# 20.22. THIẾT KẾ GENERIC API CHO BACKEND

Generics có giá trị nhất khi nó mô tả đúng quan hệ giữa các phần của API, không phải khi được thêm vào một cách hình thức.

## 20.22.1. Generic Repository

```java
public interface Repository<T, ID> {

    T save(T entity);

    Optional<T> findById(ID id);

    List<T> findAll();

    List<T> saveAll(
            Iterable<? extends T> entities
    );

    void deleteById(ID id);
}
```

Giải thích:

- `T` là entity type.
- `ID` là identifier type.
- `Iterable<? extends T>` cho phép truyền collection của `T` hoặc subtype của `T`.
- `Optional<T>` biểu diễn kết quả có thể không tồn tại.

Implementation cụ thể:

```java
final class UserRepository
        implements Repository<User, Long> {

    @Override
    public User save(User entity) {
        return entity;
    }

    @Override
    public Optional<User> findById(Long id) {
        return Optional.empty();
    }

    @Override
    public List<User> findAll() {
        return List.of();
    }

    @Override
    public List<User> saveAll(
            Iterable<? extends User> entities
    ) {
        List<User> result = new ArrayList<>();

        for (User entity : entities) {
            result.add(save(entity));
        }

        return result;
    }

    @Override
    public void deleteById(Long id) {
    }
}
```

Generic repository giúp contract tái sử dụng, nhưng không có nghĩa mọi domain đều nên bị ép vào cùng một abstraction. Nếu truy vấn của từng aggregate rất khác nhau, repository cụ thể có thể dễ hiểu hơn.

## 20.22.2. Generic Page Result

```java
public record PageResult<T>(
        List<T> content,
        int page,
        int size,
        long totalElements
) {
    public PageResult {
        content = List.copyOf(
                Objects.requireNonNull(content)
        );
    }
}
```

Một method service có thể trả:

```java
PageResult<UserDto> findUsers(UserSearchRequest request) {
    return new PageResult<>(
            List.of(),
            0,
            20,
            0
    );
}
```

Controller hoặc tầng transport nhận được đúng kiểu `UserDto`, không cần cast thủ công.

## 20.22.3. Generic Mapper

```java
@FunctionalInterface
interface Mapper<S, T> {
    T map(S source);
}
```

Có thể viết method map page:

```java
static <S, T> PageResult<T> mapPage(
        PageResult<? extends S> page,
        Function<? super S, ? extends T> mapper
) {
    List<T> mapped = page.content()
            .stream()
            .<T>map(mapper)
            .toList();

    return new PageResult<>(
            mapped,
            page.page(),
            page.size(),
            page.totalElements()
    );
}
```

`Function<? super S, ? extends T>` linh hoạt vì:

- Function có thể nhận `S` hoặc một supertype của `S`.
- Function có thể trả về `T` hoặc subtype của `T`.

Ví dụ:

```java
PageResult<UserEntity> entities = loadUsers();

PageResult<UserDto> result =
        mapPage(entities, UserDto::from);
```

Trong code backend, pattern này thường xuất hiện khi chuyển entity sang DTO để không trả trực tiếp persistence model ra API.

## 20.22.4. Generic Result cho success/failure

```java
public sealed interface Result<T>
        permits Success, Failure {
}

public record Success<T>(T value)
        implements Result<T> {
}

public record Failure<T>(
        String code,
        String message
) implements Result<T> {
}
```

Sử dụng:

```java
Result<UserDto> success =
        new Success<>(userDto);

Result<UserDto> failure =
        new Failure<>(
                "USER_NOT_FOUND",
                "User does not exist"
        );
```

Generic result giúp success value có kiểu cụ thể và failure vẫn giữ được cùng contract. Tuy nhiên, trong dự án thực tế cần thống nhất cách mapping result sang HTTP status, logging và error response.

## 20.22.5. Generic không thay thế validation

```java
Repository<User, Long> repository = ...;
```

Khai báo trên đảm bảo key có kiểu `Long` ở compile time, nhưng không đảm bảo:

- User có tồn tại trong database.
- User có quyền truy cập.
- Dữ liệu đến từ request hợp lệ.
- Mapping JSON không thiếu field.
- Database schema tương thích.

Generics bảo vệ quan hệ kiểu; validation, authorization và persistence constraints giải quyết các vấn đề khác.

# 20.23. WILDCARD Ở RETURN TYPE

Wildcard thường hữu ích ở input parameter hơn là return type.

Ví dụ return type khó sử dụng:

```java
static List<?> loadValues() {
    return List.of("A", "B");
}
```

Caller chỉ lấy được `Object`:

```java
List<?> values = loadValues();
Object first = values.get(0);
```

Nếu API thực sự trả về string, hãy dùng kiểu cụ thể:

```java
static List<String> loadNames() {
    return List.of("A", "B");
}
```

Nếu cần giữ quan hệ generic, hãy dùng type parameter:

```java
static <T> List<T> copyOf(List<? extends T> source) {
    return new ArrayList<>(source);
}
```

Không có quy tắc tuyệt đối cấm wildcard return. Một return type như `List<? extends BaseEvent>` có thể phù hợp nếu contract cố ý che giấu subtype. Nhưng cần cân nhắc trải nghiệm của caller trước khi dùng.

# 20.24. GENERICS VÀ REFLECTION

Type erasure làm runtime không biết đầy đủ type argument của object, nhưng class file có thể lưu generic signature metadata.

## 20.24.1. Class token

```java
static <T> T convert(Object value, Class<T> type) {
    return type.cast(value);
}
```

Sử dụng:

```java
User user = convert(value, User.class);
String text = convert(value, String.class);
```

`Class<T>` cung cấp thông tin runtime để kiểm tra và cast an toàn hơn so với unchecked cast tùy ý.

## 20.24.2. Đọc generic superclass

```java
class UserRepository
        extends RepositoryBase<User> {
}

Type type = UserRepository.class
        .getGenericSuperclass();

System.out.println(type);
```

Reflection có thể trả về một `ParameterizedType` chứa type argument `User` trong khai báo superclass. Tuy nhiên, điều này là metadata của khai báo class; nó không có nghĩa mọi object generic luôn giữ lại type argument runtime theo cách đầy đủ.

## 20.24.3. Khi cần nhiều type argument

```java
Map<String, List<Integer>>
```

Một `Class<?>` đơn lẻ không biểu diễn đầy đủ cấu trúc nested generic trên. Thư viện serialization hoặc dependency injection thường dùng abstraction kiểu `Type`, `ParameterizedType` hoặc type-token riêng để giữ metadata.

Trong backend, đây là lý do các framework JSON có API nhận thêm thông tin generic type khi cần deserialize response như `List<UserDto>`.

# 20.25. GENERIC EXCEPTION DATA

Java không cho phép generic exception class, nhưng exception có thể chứa metadata liên quan đến type:

```java
public final class DataAccessException
        extends RuntimeException {

    private final Class<?> entityType;

    public DataAccessException(
            Class<?> entityType,
            String message,
            Throwable cause
    ) {
        super(message, cause);
        this.entityType =
                Objects.requireNonNull(entityType);
    }

    public Class<?> entityType() {
        return entityType;
    }
}
```

Generic method vẫn có thể ném exception class bình thường:

```java
static <T> T load(
        Class<T> type
) {
    try {
        Object value = fetchFromStorage();
        return type.cast(value);
    } catch (RuntimeException exception) {
        throw new DataAccessException(
                type,
                "Cannot load " + type.getName(),
                exception
        );
    }
}
```

Ở đây `Class<T>` giúp cast giá trị thành type mong muốn, còn `DataAccessException` giữ thông tin chẩn đoán mà không cần trở thành generic exception.


# 20.26. NHỮNG HIỂU LẦM THƯỜNG GẶP

## Hiểu lầm 1: `List<String>` là một loại `List<Object>`

Sai. Generic types trong Java invariant:

```java
List<String> strings = new ArrayList<>();
// List<Object> objects = strings; // Không compile
```

Nếu cần tham chiếu tổng quát để đọc, dùng `List<?>`:

```java
List<?> values = strings;
```

## Hiểu lầm 2: `List<?>` có nghĩa là list chứa nhiều kiểu khác nhau

Không nhất thiết. `List<?>` có nghĩa là element type cụ thể tồn tại nhưng vị trí hiện tại chưa biết type đó là gì. Object thật có thể là `List<String>` hoặc `List<Integer>`, nhưng mỗi list vẫn có một type argument cụ thể.

## Hiểu lầm 3: `extends` trong wildcard cho phép thêm subtype

Sai:

```java
List<? extends Number> numbers = new ArrayList<Integer>();
// numbers.add(1); // Không compile
```

`extends` ở đây phù hợp với việc đọc. Nếu muốn thêm `Integer`, dùng `? super Integer`.

## Hiểu lầm 4: `super` cho phép đọc ra đúng kiểu T

Sai. Với `List<? super Integer>`, giá trị lấy ra chỉ chắc chắn là `Object`:

```java
List<? super Integer> values = new ArrayList<Number>();
Object value = values.get(0);
```

Nó phù hợp với việc ghi `Integer` vào destination.

## Hiểu lầm 5: Type erasure làm Generics vô dụng

Sai. Compiler vẫn kiểm tra type safety rất nhiều tại compile time và chèn cast cần thiết khi lấy dữ liệu. Erasure chỉ giới hạn những gì có thể xác minh trực tiếp tại runtime.

## Hiểu lầm 6: Generic class biết type argument của object tại runtime

Không nên giả định điều đó:

```java
Box<String> text = new Box<>("Java");
Box<Integer> number = new Box<>(1);

System.out.println(text.getClass() == number.getClass());
```

Kết quả thường là `true`. Nếu runtime cần type information, hãy truyền `Class<T>` hoặc một type token phù hợp.

## Hiểu lầm 7: Wildcard và type parameter có thể thay thế nhau hoàn toàn

Chúng có mục đích khác nhau:

- Wildcard mô tả một type argument chưa biết hoặc một phạm vi type argument.
- Type parameter đặt tên cho type để liên kết nhiều vị trí trong cùng method/class.

```java
static void print(List<?> values) {
}

static <T> T first(List<T> values) {
    return values.get(0);
}
```

## Hiểu lầm 8: `@SuppressWarnings` làm phép cast trở nên an toàn

Annotation chỉ ẩn warning. Nó không thêm runtime check và không sửa được heap pollution.

Chỉ dùng sau khi đã chứng minh invariant, đặt ở phạm vi nhỏ và ghi chú lý do nếu phép chuyển đổi khó hiểu.

## Hiểu lầm 9: Generics thay thế validation

`Repository<User, Long>` giúp compiler kiểm tra entity và id có kiểu phù hợp. Nó không kiểm tra quyền truy cập, dữ liệu request, business rule hay trạng thái database.

Generics giải quyết type relationship; validation và domain logic giải quyết tính hợp lệ nghiệp vụ.

# 20.27. GENERICS BEST PRACTICES

## 20.27.1. Luôn ưu tiên parameterized types

Nên:

```java
List<User> users = new ArrayList<>();
Map<Long, User> usersById = new HashMap<>();
```

Tránh:

```java
List users = new ArrayList();
Map usersById = new HashMap();
```

Raw type chỉ nên xuất hiện ở ranh giới legacy đã được kiểm soát.

## 20.27.2. Lập trình với interface

```java
List<User> users = new ArrayList<>();
Map<Long, User> usersById = new HashMap<>();
```

Biến phụ thuộc vào contract thay vì implementation cụ thể. Khi cần đổi sang implementation khác, phạm vi thay đổi nhỏ hơn.

## 20.27.3. Dùng PECS cho input collection

Nếu method đọc từ collection:

```java
static <T> void addAll(
        List<T> target,
        List<? extends T> source
) {
    target.addAll(source);
}
```

Nếu method ghi vào collection:

```java
static void addDefaultIds(
        List<? super Long> target
) {
    target.add(1L);
    target.add(2L);
}
```

Không cần dùng wildcard cho mọi collection. Hãy chọn chữ ký đơn giản nhất vẫn biểu đạt đúng contract.

## 20.27.4. Thường tránh wildcard ở return type

Nên trả về kiểu mà caller có thể sử dụng trực tiếp:

```java
List<UserDto> findUsers();
```

Thường khó dùng hơn:

```java
List<?> findUsers();
```

Nếu method cần giữ quan hệ generic, dùng type parameter có tên:

```java
<T> List<T> transform(List<? extends T> source);
```

## 20.27.5. Đặt bound ở nơi thật sự cần

Không nên viết API quá hạn chế:

```java
static <T extends Number & Comparable<T>> void print(T value) {
}
```

nếu method chỉ cần gọi `doubleValue()`:

```java
static <T extends Number> void print(T value) {
    System.out.println(value.doubleValue());
}
```

Bound dư thừa làm API khó gọi và giảm khả năng tái sử dụng.

## 20.27.6. Đặt tên type parameter nhất quán

Với abstraction ngắn, dùng `T`, `E`, `K`, `V`. Với domain phức tạp, tên rõ nghĩa có thể tốt hơn:

```java
interface Converter<Source, Target> {
    Target convert(Source source);
}
```

Mục tiêu là người đọc hiểu được quan hệ kiểu mà không cần lần theo nhiều file.

## 20.27.7. Hạn chế unchecked operation

Nếu phải dùng cast:

```java
@SuppressWarnings("unchecked")
T value = (T) object;
```

cần biết tại sao cast an toàn, dữ liệu đến từ đâu và invariant nào bảo vệ nó. Nếu không giải thích được, thiết kế nên được xem xét lại.

## 20.27.8. Bảo vệ collection trả ra ngoài

Khi generic DTO hoặc record chứa list:

```java
public record ResultPage<T>(List<T> content) {
    public ResultPage {
        content = List.copyOf(content);
    }
}
```

Điều này ngăn caller thay đổi trực tiếp cấu trúc list bên trong. Cần nhớ đây là copy cấu trúc collection; nếu `T` là object mutable, object con vẫn có thể bị thay đổi.

## 20.27.9. Không over-generalize API

Một abstraction như `Repository<T, ID>` có thể hữu ích cho thao tác chung. Nhưng nếu nó che giấu các query đặc thù hoặc làm service khó đọc, repository cụ thể thường là lựa chọn tốt hơn.

Generic code nên giảm lặp và làm rõ contract, không nên tạo thêm nhiều tầng gián tiếp chỉ để tránh vài dòng code.

## 20.27.10. Nhớ ảnh hưởng của boxing

```java
List<Integer> values = new ArrayList<>();
values.add(1); // int được autobox thành Integer
```

Trong vòng lặp rất lớn, boxing có thể tạo nhiều object hoặc gây chi phí unboxing. Với phép toán số lượng lớn, cân nhắc:

```java
IntStream.range(0, 1_000_000)
        .sum();
```

hoặc một cấu trúc primitive chuyên dụng nếu profiling cho thấy cần tối ưu.

## 20.27.11. Ghi rõ nullability và mutability

Generic type không tự nói rõ:

- Có cho phép `null` hay không.
- Collection trả về có mutable hay không.
- Element có thể bị thay đổi hay không.
- Method có copy dữ liệu hay giữ reference hay không.

Hãy thể hiện qua validation, JavaDoc, type cụ thể và convention của dự án.

# 20.28. BÀI TẬP THỰC HÀNH

## Bài 1 — Generic Box

Viết `Box<T>` có:

- Constructor nhận giá trị.
- `get()` và `set(T)`.
- Method `map(Function<? super T, ? extends R>)` trả về `Box<R>`.

Chữ ký gợi ý:

```java
<R> Box<R> map(
        Function<? super T, ? extends R> mapper
)
```

Mục tiêu: hiểu type parameter của class và type parameter của method khác nhau thế nào.

## Bài 2 — Generic max

Viết method tìm giá trị lớn nhất:

```java
static <T extends Comparable<? super T>>
T max(List<? extends T> values) {
    // ...
}
```

Xử lý list rỗng bằng `IllegalArgumentException`.

Mục tiêu: luyện bound, wildcard và Comparable.

## Bài 3 — Copy theo PECS

Viết method sao chép dữ liệu từ source sang destination:

```java
static <T> void copy(
        List<? super T> destination,
        List<? extends T> source
) {
    // ...
}
```

Kiểm tra:

- `List<Integer>` sang `List<Number>`.
- `List<Dog>` sang `List<Animal>`.
- Vì sao chiều ngược lại không compile.

## Bài 4 — Generic Stack

Viết `Stack<T>` bằng `ArrayList<T>`, có:

- `push(T)`.
- `pop()` trả về `T`.
- `peek()` trả về `T`.
- `isEmpty()`.
- Ném exception phù hợp khi lấy phần tử từ stack rỗng.

Không dùng raw type.

## Bài 5 — Generic Mapper

Cho các type `UserEntity` và `UserDto`, viết:

```java
static <S, T> List<T> map(
        List<? extends S> source,
        Function<? super S, ? extends T> mapper
) {
    // ...
}
```

Mục tiêu: hiểu pattern thường gặp khi chuyển entity thành DTO.

## Bài 6 — Class token

Viết method:

```java
static <T> T cast(Object value, Class<T> type) {
    // ...
}
```

Thử với `String.class`, `Integer.class` và một object sai kiểu. Giải thích vì sao `Class<T>.cast` an toàn hơn unchecked cast tùy ý.

## Bài 7 — Phân tích compile error

Giải thích vì sao từng dòng sau lỗi:

```java
List<int> numbers;
List<Object> objects = new ArrayList<String>();
List<String> strings = new ArrayList<>();
List<?> values = strings;
values.add("Java");
if (values instanceof List<String>) {
}
```

Dòng `List<?> values = strings` hợp lệ, còn các dòng khác có mục đích và lỗi khác nhau.

# 20.29. CÂU HỎI PHỎNG VẤN

## Q1. Generics là gì?

Generics cho phép class, interface và method làm việc với nhiều type khác nhau trong khi compiler vẫn kiểm tra type safety tại compile time.

## Q2. Type parameter khác type argument thế nào?

Trong `class Box<T>`, `T` là type parameter. Trong `Box<String>`, `String` là type argument.

## Q3. Vì sao `List<String>` không phải subtype của `List<Object>`?

Vì generic types trong Java invariant. Nếu được phép, caller có thể thêm `Integer` vào list thực sự chứa `String`, làm mất type safety.

## Q4. `List<?>` khác `List<Object>` thế nào?

`List<Object>` cho phép thêm mọi object. `List<?>` đại diện cho list có type argument chưa biết, nên chỉ đọc an toàn dưới dạng `Object` và không thêm được non-null element cụ thể.

## Q5. Giải thích PECS.

PECS là Producer Extends, Consumer Super:

- Producer dùng `? extends T`.
- Consumer dùng `? super T`.

## Q6. Vì sao không thể thêm vào `List<? extends Number>`?

Vì list thật có thể là `List<Integer>` hoặc `List<Double>`. Compiler không biết một số cụ thể có đúng type argument thật hay không.

## Q7. Vì sao có thể thêm Integer vào `List<? super Integer>`?

Vì type argument thật chắc chắn là `Integer` hoặc một supertype của `Integer`, nên mọi `Integer` đều hợp lệ với collection đó.

## Q8. Type erasure là gì?

Là cơ chế compiler loại bỏ phần lớn type argument ở runtime, thay type parameter bằng `Object` hoặc bound đầu tiên, đồng thời chèn cast cần thiết để duy trì hành vi source code.

## Q9. Vì sao không dùng được `instanceof List<String>`?

Vì `List<String>` là non-reifiable type. Runtime không có đủ thông tin type argument để kiểm tra trực tiếp.

## Q10. Raw type nguy hiểm thế nào?

Raw type bỏ qua nhiều kiểm tra compile time, cho phép ghi giá trị sai kiểu và có thể tạo heap pollution hoặc `ClassCastException` ở nơi khác.

## Q11. Có thể dùng primitive type trong Generics không?

Không. Phải dùng wrapper như `Integer`, `Long` hoặc `Double`. Java thực hiện autoboxing và unboxing khi phù hợp.

## Q12. Vì sao không thể viết `new T()`?

Vì sau erasure runtime không biết constructor và class cụ thể của `T`. Có thể truyền `Supplier<? extends T>` hoặc `Class<T>`.

## Q13. Vì sao không thể tạo `new T[]`?

Array cần biết component type tại runtime, trong khi type parameter bị erasure. Có thể dùng `List<T>` hoặc truyền component class.

## Q14. Vì sao không overload bằng `List<String>` và `List<Integer>`?

Hai method có cùng erasure, nên runtime signature bị trùng.

## Q15. Có thể generic một exception class không?

Không. Java không cho generic class kế thừa `Throwable`. Có thể đặt generic-related metadata trong field của exception không generic.

## Q16. Khi nào dùng wildcard, khi nào dùng type parameter?

Dùng wildcard khi type chưa biết và không cần liên kết giữa nhiều vị trí. Dùng type parameter khi cần dùng cùng một type ở return type, parameter hoặc nhiều tham số.

## Q17. Có nên dùng wildcard ở return type không?

Thường nên tránh nếu caller cần dùng giá trị cụ thể. Hãy trả về type cụ thể hoặc generic type parameter. Wildcard return vẫn hợp lệ khi việc che giấu subtype là một phần chủ ý của contract.

## Q18. Generics có bảo đảm không bao giờ có ClassCastException không?

Không. Raw type, unchecked cast, reflection và heap pollution vẫn có thể tạo lỗi runtime. Type safety chỉ mạnh khi code tôn trọng contract generic.

# 20.30. TỔNG KẾT CHƯƠNG 20

Bạn cần ghi nhớ:

- Generics cho phép tái sử dụng code với type safety tại compile time.
- Type parameter là biến kiểu trong khai báo; type argument là kiểu cụ thể khi sử dụng.
- Generic class, interface, method và constructor có thể khai báo type parameters.
- Java không hỗ trợ primitive type arguments; dùng wrapper types.
- Bound giới hạn capability của type parameter.
- Multiple bounds dùng `&` và class bound phải đứng trước interface bounds.
- Generic types invariant: `List<Dog>` không phải `List<Animal>`.
- `List<?>` biểu diễn unknown type argument.
- `? extends T` phù hợp với producer/read.
- `? super T` phù hợp với consumer/write.
- PECS là quy tắc thiết kế wildcard thực dụng, không phải công thức bắt buộc cho mọi method.
- Type inference giúp rút gọn diamond và generic method calls nhưng vẫn là static typing.
- Type erasure giải thích vì sao không thể kiểm tra trực tiếp `List<String>` tại runtime.
- Reifiable types có thể được kiểm tra an toàn hơn bằng `instanceof`.
- Raw types và unchecked casts có thể gây heap pollution.
- Generic arrays, generic exceptions và overload theo type argument là các giới hạn quan trọng.
- Generic record, repository, page result và mapper giúp thiết kế API backend rõ type hơn.
- Generics không thay thế validation, authorization, error handling hoặc domain rules.
- API generic tốt phải cân bằng type safety, khả năng đọc và mức độ phức tạp.

## Checklist tự kiểm tra

- [ ] Phân biệt được type parameter, type argument và parameterized type.
- [ ] Viết được generic class, interface và method.
- [ ] Hiểu upper bound, multiple bounds và bound với Comparable.
- [ ] Giải thích được invariance bằng ví dụ `Dog` và `Animal`.
- [ ] Phân biệt `List<Object>`, `List<?>`, `List<? extends T>` và `List<? super T>`.
- [ ] Áp dụng đúng PECS khi thiết kế method.
- [ ] Giải thích type erasure và reifiable type.
- [ ] Nhận diện raw type, unchecked cast và heap pollution.
- [ ] Biết các giới hạn về generic array, generic exception và method overloading.
- [ ] Thiết kế được generic response, repository hoặc mapper cơ bản cho backend.

## Tài liệu tham khảo chính thức

- [Java Language Specification 21 — Types, Values, and Variables](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html)
- [JLS `4.5.1 — Type Arguments of Parameterized Types](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.5.1)
- [JLS `4.6 — Type Erasure](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.6)
- [JLS `4.7 — Reifiable Types](https://docs.oracle.com/javase/specs/jls/se21/html/jls-4.html#jls-4.7)
- [Oracle Java Tutorials — Wildcards](https://docs.oracle.com/javase/tutorial/java/generics/wildcards.html)
- [Oracle Java Tutorials — Restrictions on Generics](https://docs.oracle.com/javase/tutorial/java/generics/restrictions.html)

> Trạng thái: Hoàn thiện Phần 6 — Java Generics. Nội dung bao gồm fundamentals, bounds, invariance, wildcards, PECS, type inference, type erasure, raw types, heap pollution, generic arrays, backend API design, bài tập và câu hỏi phỏng vấn.
