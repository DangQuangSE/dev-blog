# JAVA CORE 21 — PHẦN 5: JAVA COLLECTIONS FRAMEWORK

Giáo trình lý thuyết chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Java Collections Framework (JCF) là một trong những phần quan trọng nhất của Java Core, đặc biệt đối với lập trình viên Backend. Khi xây dựng REST API, xử lý dữ liệu từ database, phân nhóm đơn hàng, tìm kiếm sản phẩm, quản lý hàng đợi hoặc tối ưu hiệu năng, bạn sẽ liên tục sử dụng Collections.

Ở phần này, chúng ta không chỉ học cách sử dụng `ArrayList`, `HashSet` và `HashMap`, mà còn đi sâu vào:

- Cấu trúc dữ liệu bên trong (Internal Data Structures).
- Độ phức tạp thời gian và bộ nhớ (Time & Space Complexity).
- Cơ chế hashing, buckets, collisions và resizing.
- Vai trò của `equals()`, `hashCode()`, `Comparable` và `Comparator`.
- Sự khác biệt giữa mutable, unmodifiable và immutable.
- Những vấn đề về iteration, concurrency và thread safety.
- Các API mới trong Java 21, đặc biệt là Sequenced Collections.

## Nội dung Phần 5

| Chương | Chủ đề                         | Trọng tâm                                                                      |
| ------ | ------------------------------ | ------------------------------------------------------------------------------ |
| 14     | Collections Fundamentals       | Hierarchy, Interfaces, Iterator, Comparable, Comparator                        |
| 15     | List                           | ArrayList, LinkedList, Vector, Stack, Big-O                                    |
| 16     | Set                            | HashSet, LinkedHashSet, TreeSet, uniqueness                                    |
| 17     | Map                            | HashMap internals, TreeMap, LinkedHashMap, collisions                          |
| 18     | Queue & Deque                  | FIFO, LIFO, PriorityQueue, ArrayDeque                                          |
| 19     | Collection Utilities & Java 21 | Collections API, immutability, SequencedCollection, SequencedSet, SequencedMap |

# CHƯƠNG 14. COLLECTIONS FUNDAMENTALS

## 14.1. Java Collections Framework là gì?

Java Collections Framework (JCF) là một tập hợp các interfaces, classes và algorithms được Java cung cấp để tổ chức, lưu trữ và thao tác với các nhóm đối tượng.

Ví dụ, nếu muốn quản lý danh sách sinh viên:

```java
String[] students = new String[3];
```

Array có kích thước cố định. Khi muốn thêm sinh viên thứ tư, bạn phải tạo array mới hoặc dùng một cấu trúc khác.

Với Collections:

```java
import java.util.ArrayList;
import java.util.List;

List<String> students = new ArrayList<>();

students.add("Alice");
students.add("Bob");
students.add("Charlie");
students.add("David");
```

Số phần tử có thể thay đổi mà không cần bạn tự quản lý việc cấp phát array mới.

### JCF giải quyết những vấn đề gì?

1\. Dynamic Storage

Cho phép quản lý số phần tử thay đổi theo runtime.

2\. Standardized APIs

Các implementations có thể cùng cung cấp những methods chung như:

```text
add()
remove()
contains()
size()
isEmpty()
```

3\. Reusable Algorithms

Bạn không phải tự triển khai các thuật toán thông dụng như sorting, reversing hoặc binary searching.

4\. Type Safety

Collections hỗ trợ Generics.

Ví dụ:

```java
List<String> names = new ArrayList<>();
```

Compiler giúp ngăn việc đưa một `Integer` vào `List<String>` thông qua những thao tác được kiểm tra kiểu.

5\. Abstraction

Bạn có thể lập trình với interface thay vì phụ thuộc trực tiếp vào implementation.

Ví dụ:

```java
List<String> names = new ArrayList<>();
```

Sau này có thể đổi implementation:

```java
List<String> names = new LinkedList<>();
```

mà những đoạn code chỉ dựa vào contract `List` thường không cần sửa.

Dĩ nhiên, đặc tính hiệu năng và một số hành vi phụ thuộc implementation có thể thay đổi.

## 14.2. Ba thành phần chính của Collections Framework

Collections Framework thường được mô tả qua ba nhóm thành phần.

### Interfaces

Định nghĩa contracts và các operations mà collection implementations phải tuân theo.

Ví dụ:

```text
Collection<E>
List<E>
Set<E>
Queue<E>
Deque<E>
Map<K, V>
```

### Implementations

Các classes triển khai những interfaces.

Ví dụ:

```text
ArrayList
LinkedList
HashSet
TreeSet
HashMap
TreeMap
ArrayDeque
PriorityQueue
```

### Algorithms và Utilities

Cung cấp các operations trên collections.

Ví dụ:

```text
Collections.sort()
Collections.reverse()
Collections.shuffle()
Collections.binarySearch()
```

## 14.3. Collections Hierarchy

Bạn cần hiểu rõ mối quan hệ giữa các interfaces.

Java Collections Framework — Simplified Hierarchy

```text
Iterable<E>

Collection<E>

List

ArrayList

LinkedList

Vector

Stack

Set

HashSet

LinkedHashSet

TreeSet

Queue

PriorityQueue

Deque

ArrayDeque

Map<K, V> — Hierarchy riêng

HashMap

LinkedHashMap

TreeMap

Hashtable

ConcurrentHashMap

EnumMap
```

Sơ đồ nhóm theo chức năng, không thể hiện toàn bộ quan hệ extends/implements. Ví dụ LinkedList triển khai cả List và Deque; LinkedHashMap kế thừa HashMap; ConcurrentHashMap thuộc java.util.concurrent.

### Tại sao Map không extends Collection?

`Collection<E>` biểu diễn một nhóm các elements.

Trong khi đó, `Map<K,V>` biểu diễn tập hợp các mappings giữa keys và values.

Một map có các khái niệm đặc thù:

```text
put(key, value)
get(key)
containsKey(key)
entrySet()
```

Do đó Java xây dựng `Map` thành một interface hierarchy riêng.

Tuy nhiên, Map vẫn cung cấp các collection views:

```java
map.keySet()
map.values()
map.entrySet()
```

## 14.4. Collection vs Collections

Đây là một câu hỏi phỏng vấn rất phổ biến.

### Collection

`Collection<E>` là interface.

```java
Collection<String> names = new ArrayList<>();
```

Nó định nghĩa contract chung của nhiều cấu trúc lưu trữ elements.

### Collections

`Collections` là utility class.

```java
Collections.sort(names);
Collections.reverse(names);
```

Nó cung cấp static methods và utility wrappers.

### So sánh

| Collection                                     | Collections                       |
| ---------------------------------------------- | --------------------------------- |
| Interface                                      | Utility class                     |
| `java.util.Collection`                         | `java.util.Collections`           |
| Định nghĩa operations chung                    | Cung cấp algorithms và wrappers   |
| Được implementation bởi các collection classes | Được gọi thông qua static methods |

Không nên nhầm thêm `Collectors` trong Stream API với `Collections`.

## 14.5. Iterable Interface

`Iterable<T>` cung cấp khả năng duyệt tuần tự qua các elements thông qua iterator.

Method cốt lõi:

```java
Iterator<T> iterator();
```

Ví dụ:

```java
List<String> names = List.of(
    "Alice", "Bob", "Charlie"
);

for (String name : names) {
    System.out.println(name);
}
```

Enhanced `for` sử dụng cơ chế iteration tương ứng.

Về ý nghĩa, đoạn trên gần với:

```java
Iterator<String> iterator = names.iterator();

while (iterator.hasNext()) {
    String name = iterator.next();
    System.out.println(name);
}
```

### Iterable không đồng nghĩa với Collection

Một class có thể implement `Iterable` mà không cần implement `Collection`.

Ví dụ:

```java
class NumberRange implements Iterable<Integer> {

    private final int end;

    NumberRange(int end) {
        this.end = end;
    }

    @Override
    public Iterator<Integer> iterator() {

        return new Iterator<>() {

            private int current = 0;

            @Override
            public boolean hasNext() {
                return current < end;
            }

            @Override
            public Integer next() {
                if (!hasNext()) {
                    throw new NoSuchElementException();
                }

                return current++;
            }
        };
    }
}
```

Sử dụng:

```java
for (int number : new NumberRange(5)) {
    System.out.println(number);
}
```

Kết quả:

```text
0
1
2
3
4
```

Cần import `java.util.Iterator` và `java.util.NoSuchElementException`.

## 14.6. Collection Interface

`Collection<E>` cung cấp những methods như:

```text
add(E element)
remove(Object object)
contains(Object object)
size()
isEmpty()
clear()
iterator()
toArray()
addAll(Collection<?> collection)
removeAll(Collection<?> collection)
retainAll(Collection<?> collection)
containsAll(Collection<?> collection)
```

Ví dụ:

```java
Collection<String> languages = new ArrayList<>();

languages.add("Java");
languages.add("Python");

System.out.println(languages.size());
System.out.println(languages.contains("Java"));
```

Kết quả:

```text
2
true
```

### Optional Operations

Không phải implementation nào cũng hỗ trợ mọi operation có khả năng thay đổi dữ liệu.

Ví dụ:

```java
List<String> languages = List.of("Java", "Python");

languages.add("Go");
```

Ném:

```text
UnsupportedOperationException
```

Vì `List.of()` trả về unmodifiable List.

## 14.7. List Interface

`List<E>` là ordered collection cho phép truy cập theo index.

Các đặc điểm:

- Có encounter order được xác định.
- Cho phép duplicate elements.
- Có thể truy cập bằng index.
- Có thể chứa null tùy implementation.

Ví dụ:

```java
List<String> names = new ArrayList<>();

names.add("Alice");
names.add("Bob");
names.add("Alice");
```

Kết quả:

```text
[Alice, Bob, Alice]
```

`List` không bắt buộc các elements phải unique.

## 14.8. Set Interface

`Set<E>` đại diện cho tập hợp không chứa hai elements bằng nhau theo quy tắc equality của Set.

Ví dụ:

```java
Set<String> names = new HashSet<>();

names.add("Alice");
names.add("Bob");
names.add("Alice");

System.out.println(names.size());
```

Kết quả:

```text
2
```

Một số Set implementations dùng `equals()`/`hashCode()`, trong khi sorted sets sử dụng comparison rules để xác định uniqueness.

### Set có bảo đảm thứ tự không?

Không phải mọi Set.

- `HashSet`: không bảo đảm iteration order.
- `LinkedHashSet`: duy trì encounter order.
- `TreeSet`: sắp xếp theo natural ordering hoặc Comparator.

## 14.9. Queue Interface

`Queue<E>` được dùng để lưu các elements chờ xử lý.

Nhiều queue có đặc tính FIFO:

First In, First Out.

Ví dụ:

```java
Queue<String> queue = new ArrayDeque<>();

queue.offer("Task A");
queue.offer("Task B");
queue.offer("Task C");

System.out.println(queue.poll());
```

Kết quả:

```text
Task A
```

Tuy nhiên, không phải mọi queue đều FIFO.

`PriorityQueue` lấy phần tử dựa trên priority order.

## 14.10. Deque Interface

`Deque<E>` là viết tắt của Double-Ended Queue.

Nó hỗ trợ thêm và loại bỏ phần tử tại cả hai đầu.

Ví dụ:

```java
Deque<Integer> deque = new ArrayDeque<>();

deque.addFirst(10);
deque.addLast(20);
deque.addFirst(5);
```

Thứ tự:

```text
[5, 10, 20]
```

Deque có thể được sử dụng làm:

- Queue.
- Stack.
- Double-ended buffer.

## 14.11. Generics trong Collections

Generics giúp xác định kiểu element tại compile time.

Ví dụ:

```java
List<String> names = new ArrayList<>();
```

Không thể thêm:

```java
names.add(100);
```

vì danh sách yêu cầu `String`.

### Diamond Operator

```java
List<String> names = new ArrayList<String>();
```

Có thể rút gọn thành:

```java
List<String> names = new ArrayList<>();
```

Compiler suy luận type arguments ở vế phải.

### Generics không hỗ trợ primitive type arguments

Không thể:

```java
List<int> numbers;
```

Phải:

```java
List<Integer> numbers;
```

Primitive values được boxing thành wrapper objects khi cần.

### Raw Types

Ví dụ:

```java
List list = new ArrayList();

list.add("Java");
list.add(123);
```

Đây là raw type và làm mất nhiều lợi ích type safety của Generics.

Nếu code khác giả định mọi element là String:

```java
String value = (String) list.get(1);
```

có thể xảy ra `ClassCastException`.

Nên tránh raw types trong code mới trừ những tình huống tương thích legacy API thực sự cần thiết.

## 14.12. Iterator

`Iterator<E>` cung cấp cơ chế duyệt elements.

Ba methods quan trọng:

```text
hasNext()
next()
remove()
```

Trong đó `remove()` là optional operation.

Ví dụ:

```java
List<String> names = new ArrayList<>(
    List.of("Alice", "Bob", "Charlie")
);

Iterator<String> iterator = names.iterator();

while (iterator.hasNext()) {

    String name = iterator.next();

    if (name.equals("Bob")) {
        iterator.remove();
    }
}
```

Kết quả:

```text
[Alice, Charlie]
```

### hasNext()

Kiểm tra liệu còn element tiếp theo hay không.

### next()

Lấy element tiếp theo.

Nếu iterator đã hết phần tử:

```java
iterator.next();
```

ném:

```text
NoSuchElementException
```

### remove()

Xóa element vừa được trả về bởi `next()` nếu implementation hỗ trợ.

Cần tuân thủ trạng thái của iterator; chẳng hạn không được gọi `remove()` hai lần liên tiếp nếu không gọi `next()` ở giữa.

## 14.13. ListIterator

`ListIterator<E>` dành cho List và hỗ trợ duyệt hai chiều.

Methods:

```text
hasNext()
next()
hasPrevious()
previous()
nextIndex()
previousIndex()
add()
set()
remove()
```

Ví dụ:

```java
List<String> names = new ArrayList<>(
    List.of("A", "B", "C")
);

ListIterator<String> iterator =
        names.listIterator(names.size());

while (iterator.hasPrevious()) {
    System.out.println(iterator.previous());
}
```

Kết quả:

```text
C
B
A
```

Khác với Iterator thông thường, ListIterator có khả năng duyệt ngược và cập nhật list theo contract.

## 14.14. Comparable

`Comparable<T>` định nghĩa natural ordering của một type.

Interface:

```java
public interface Comparable<T> {
    int compareTo(T other);
}
```

Ví dụ:

```java
record Student(String name, int score)
        implements Comparable<Student> {

    @Override
    public int compareTo(Student other) {
        return Integer.compare(this.score, other.score);
    }
}
```

Sử dụng:

```java
List<Student> students = new ArrayList<>();

students.add(new Student("Alice", 80));
students.add(new Student("Bob", 95));
students.add(new Student("Charlie", 70));

Collections.sort(students);
```

Thứ tự theo điểm tăng dần:

```text
Charlie: 70
Alice: 80
Bob: 95
```

### compareTo() Contract

Giá trị trả về:

- Âm nếu object đứng trước `other`.
- 0 nếu tương đương theo ordering.
- Dương nếu object đứng sau `other`.

Không nên dùng:

```java
return this.score - other.score;
```

trong mọi tình huống, vì phép trừ có thể overflow.

An toàn hơn:

```java
return Integer.compare(this.score, other.score);
```

## 14.15. Comparator

`Comparator<T>` định nghĩa một cách so sánh bên ngoài class.

Ví dụ:

```java
Comparator<Student> byName =
        Comparator.comparing(Student::name);
```

```java
students.sort(byName);
```

Nếu muốn sắp xếp theo điểm giảm dần:

```java
Comparator<Student> byScoreDescending =
        Comparator.comparingInt(Student::score)
                  .reversed();
```

### Multiple Sorting Criteria

```java
Comparator<Student> comparator =
        Comparator.comparingInt(Student::score)
                  .reversed()
                  .thenComparing(Student::name);
```

Ý nghĩa:

1. Ưu tiên điểm giảm dần.
2. Nếu bằng điểm, so sánh tên tăng dần.

### Comparable vs Comparator

| Comparable                     | Comparator                        |
| ------------------------------ | --------------------------------- |
| Định nghĩa natural ordering    | Định nghĩa một ordering tùy chỉnh |
| Method `compareTo()`           | Method `compare()`                |
| Type tự triển khai             | Comparator có thể độc lập         |
| Thường có một natural ordering | Có thể tạo nhiều Comparators      |
| `Collections.sort(list)`       | `list.sort(comparator)`           |

### Comparator và TreeSet

Một điều quan trọng: nếu Comparator trả về `0` cho hai objects, TreeSet sẽ xem chúng tương đương về uniqueness.

Ví dụ, nếu Comparator chỉ so sánh score, hai sinh viên khác nhau nhưng cùng score có thể không cùng tồn tại trong TreeSet.

Vì thế, khi sử dụng sorted collections, hãy thiết kế ordering cẩn thận.

# CHƯƠNG 15. LIST

## 15.1. List là gì?

`List<E>` là một interface đại diện cho dãy các phần tử có thứ tự và hỗ trợ truy cập bằng index.

Các operations phổ biến:

Ví dụ:

### Các List implementations quan trọng

| Implementation | Cấu trúc chính     | Đặc điểm                               |
| -------------- | ------------------ | -------------------------------------- |
| ArrayList      | Resizable array    | Truy cập index nhanh                   |
| LinkedList     | Doubly linked list | Thêm/xóa tại đầu và cuối nhanh         |
| Vector         | Resizable array    | Legacy, các methods chính synchronized |
| Stack          | Kế thừa Vector     | Legacy LIFO stack                      |

## 15.2. ArrayList

`ArrayList<E>` là một resizable-array implementation của `List`.

Nó có khả năng tự mở rộng underlying array khi cần thêm phần tử.

Ví dụ:

### Cấu trúc bên trong

Có thể hình dung:

ArrayList — Underlying Array

10

0

20

1

30

2

—

3

—

4

—

5

Size: 3

Capacity: 6

Ví dụ minh họa: ba phần tử đang sử dụng, ba vị trí capacity chưa sử dụng. Capacity thực tế phụ thuộc implementation.

### Size vs Capacity

Size là số elements hiện có.

Capacity là số phần tử mà underlying array hiện tại có thể chứa trước khi cần mở rộng.

ArrayList public API không cung cấp method `capacity()` để đọc trực tiếp capacity.

Ví dụ:

Kết quả:

Constructor trên đặt initial capacity là 100, nhưng list chưa có element nào.

### ArrayList Resizing

Khi underlying array không đủ chỗ, ArrayList phải cấp phát array mới và chuyển dữ liệu sang.

Trong OpenJDK, chiến lược tăng capacity thường sử dụng mức tăng khoảng 1,5 lần trong nhiều tình huống, nhưng đây là implementation detail chứ không phải bảo,

đảm bảo rằng ứng dụng có thể phụ thuộc vào một con số cụ thể trong tương lai. Khi cần dự đoán memory usage, hãy đo bằng profiler hoặc benchmark thay vì dựa vào implementation detail.

Có thể chủ động chuẩn bị capacity khi biết gần đúng số phần tử:

```java
ArrayList<String> names = new ArrayList<>(10_000);
```

Cách này giúp giảm số lần resizing khi thêm nhiều phần tử.

`ArrayList` cũng có:

- `ensureCapacity(int)`: yêu cầu chuẩn bị đủ capacity tối thiểu.
- `trimToSize()`: thu nhỏ capacity gần với size hiện tại.

Ví dụ:

```java
ArrayList<String> rows = new ArrayList<>();

rows.ensureCapacity(1_000);

// Thêm dữ liệu từ database hoặc file
for (int i = 0; i < 1_000; i++) {
    rows.add("row-" + i);
}

// Chỉ cân nhắc trim sau khi đã hoàn tất việc xây dựng list
rows.trimToSize();
```

`trimToSize()` không phải method của interface `List`. Nếu code cần gọi method này, biến phải có kiểu `ArrayList`.

## 15.3. Các thao tác cơ bản với List

Ví dụ tổng hợp:

```java
List<String> names = new ArrayList<>();

names.add("Alice");             // Thêm cuối
names.add("Bob");
names.add(1, "Charlie");        // Chèn tại index 1

String first = names.get(0);    // Đọc phần tử
names.set(0, "Anna");           // Thay thế phần tử tại index 0

names.remove(1);                // Xóa theo index
names.remove("Bob");            // Xóa lần xuất hiện đầu tiên theo value

boolean exists = names.contains("Anna");
int size = names.size();

System.out.println(names);
System.out.println(first);
System.out.println(exists);
System.out.println(size);
```

### add() không giống set()

`add(index, element)` chèn phần tử mới và làm thay đổi size.

`set(index, element)` thay thế phần tử cũ, không làm thay đổi size.

```java
List<String> values = new ArrayList<>(
    List.of("A", "B", "C")
);

values.set(1, "X");
// [A, X, C]

values.add(1, "Y");
// [A, Y, X, C]
```

Nhầm lẫn hai method này có thể làm sai số lượng phần tử trong kết quả xử lý.

### Bẫy remove(int) với List<Integer>

Khi làm việc với `List<Integer>`, overload resolution có thể gây nhầm lẫn:

```java
List<Integer> numbers = new ArrayList<>(
    List.of(10, 20, 30)
);

numbers.remove(1);

System.out.println(numbers);
```

Kết quả:

```text
[10, 30]
```

`remove(1)` được hiểu là xóa phần tử tại index 1, không phải xóa value `Integer 1`.

Muốn xóa theo value:

```java
numbers.remove(Integer.valueOf(10));
```

Hoặc:

```java
numbers.removeIf(number -> number == 10);
```

### removeIf()

`removeIf(Predicate)` xóa các phần tử thỏa điều kiện.

```java
List<Integer> scores = new ArrayList<>(
    List.of(45, 80, 32, 90, 60)
);

scores.removeIf(score -> score < 50);

System.out.println(scores);
```

Kết quả:

```text
[80, 90, 60]
```

Đây thường là cách rõ ràng hơn so với tự duyệt bằng index rồi xóa phần tử.

### clear(), isEmpty() và contains()

```java
List<String> permissions = new ArrayList<>(
    List.of("READ", "WRITE")
);

if (!permissions.isEmpty()
        && permissions.contains("READ")) {
    System.out.println("Can read");
}

permissions.clear();

System.out.println(permissions.isEmpty());
```

## 15.4. LinkedList

`LinkedList<E>` là một doubly linked list.

Về khái niệm, mỗi node chứa:

```text
previous reference
element
next reference
```

Ví dụ:

```java
LinkedList<String> linked = new LinkedList<>();

linked.add("B");
linked.addFirst("A");
linked.addLast("C");

System.out.println(linked);
```

Kết quả:

```text
[A, B, C]
```

`LinkedList` triển khai cả:

- `List`.
- `Deque`.
- `Queue`.

Do đó nó có thể được sử dụng với nhiều nhóm method:

```java
LinkedList<String> queue = new LinkedList<>();

queue.offer("Task A");
queue.offer("Task B");

System.out.println(queue.poll());
```

### LinkedList không làm mọi thao tác insert/remove thành O(1)

Đây là một hiểu lầm phổ biến.

Nếu đã có reference đến node cần thao tác, việc nối lại các liên kết có thể rất nhanh. Nhưng với lời gọi:

```java
linked.add(500_000, "new value");
```

implementation vẫn phải đi tìm vị trí tương ứng trước. Việc tìm node có thể tốn O(n).

Vì vậy, các nhận định chính xác hơn là:

- Thêm/xóa ở đầu hoặc cuối: thường là O(1).
- Truy cập theo index: O(n).
- Thêm/xóa tại một index bất kỳ: thường O(n) do chi phí tìm vị trí.
- Duyệt tuần tự: O(n).

### LinkedList vs ArrayList về bộ nhớ

`ArrayList` chủ yếu lưu các references trong một underlying array.

`LinkedList` cần thêm node objects và các references `next`/`prev`.

Vì vậy, dù có trường hợp LinkedList có lợi thế về thao tác ở đầu/cuối, nó thường có overhead bộ nhớ lớn hơn và locality của CPU kém hơn.

Trong hầu hết use case CRUD thông thường, `ArrayList` thường là lựa chọn mặc định tốt hơn. Chọn `LinkedList` khi mô hình thao tác thực sự cần đặc tính double-linked/deque và đã được đo lường.

## 15.5. Vector và Stack

### Vector

`Vector` là một resizable array legacy.

Các method chính của `Vector` được synchronized, nhưng điều đó không biến mọi chuỗi thao tác nhiều bước thành một transaction atomic.

Ví dụ, chuỗi:

```java
if (!vector.isEmpty()) {
    vector.remove(0);
}
```

vẫn có thể bị thread khác can thiệp giữa hai lời gọi nếu không có cơ chế đồng bộ bổ sung.

Trong code mới:

- Dùng `ArrayList` nếu không cần đồng bộ.
- Dùng các collection concurrent phù hợp nếu có nhiều thread.
- Không chọn `Vector` chỉ vì thấy method được synchronized.

### Stack

`Stack` là class legacy kế thừa `Vector`.

Ví dụ cũ:

```java
Stack<String> stack = new Stack<>();

stack.push("A");
stack.push("B");

System.out.println(stack.pop());
```

Trong code mới, nên dùng `Deque` với `ArrayDeque`:

```java
Deque<String> stack = new ArrayDeque<>();

stack.push("A");
stack.push("B");

System.out.println(stack.pop());
```

`ArrayDeque` thể hiện rõ ý định LIFO và không mang những đặc điểm legacy của `Stack`.

## 15.6. Duyệt List

### Duyệt bằng index

```java
for (int i = 0; i < names.size(); i++) {
    System.out.println(names.get(i));
}
```

Cách này phù hợp với `ArrayList` khi cần index. Không nên dùng một cách mù quáng với `LinkedList` vì mỗi `get(i)` có thể cần traversal.

### Enhanced for

```java
for (String name : names) {
    System.out.println(name);
}
```

Đây thường là cách dễ đọc nhất khi không cần index.

### Iterator

```java
Iterator<String> iterator = names.iterator();

while (iterator.hasNext()) {
    String name = iterator.next();

    if (name.isBlank()) {
        iterator.remove();
    }
}
```

Nếu cần xóa trong lúc duyệt, hãy dùng `Iterator.remove()` hoặc `removeIf()`.

### ListIterator

`ListIterator` phù hợp khi cần:

- Duyệt xuôi và ngược.
- Thay thế phần tử hiện tại.
- Chèn phần tử tại vị trí iterator.
- Xóa phần tử vừa duyệt.

```java
ListIterator<String> iterator = names.listIterator();

while (iterator.hasNext()) {
    String value = iterator.next();

    if (value.equals("draft")) {
        iterator.set("published");
    }
}
```

## 15.7. ConcurrentModificationException

Đoạn code sau có thể ném `ConcurrentModificationException`:

```java
List<String> statuses = new ArrayList<>(
    List.of("NEW", "CANCELLED", "NEW")
);

for (String status : statuses) {
    if (status.equals("CANCELLED")) {
        statuses.remove(status);
    }
}
```

Nguyên nhân là enhanced `for` sử dụng iterator, trong khi list bị sửa cấu trúc trực tiếp bên ngoài iterator.

Cách 1: dùng `Iterator.remove()`:

```java
Iterator<String> iterator = statuses.iterator();

while (iterator.hasNext()) {
    if (iterator.next().equals("CANCELLED")) {
        iterator.remove();
    }
}
```

Cách 2: dùng `removeIf()`:

```java
statuses.removeIf("CANCELLED"::equals);
```

### Fail-fast có phải bảo đảm tuyệt đối không?

Không.

Fail-fast iterator cố gắng phát hiện việc sửa đổi cấu trúc không phù hợp và ném exception sớm. Đây là cơ chế phát hiện lỗi trong quá trình phát triển, không phải cơ chế đồng bộ hóa và không phải một guarantee tuyệt đối trong mọi race condition.

Nếu nhiều thread cùng thay đổi một list, cần thiết kế thread safety rõ ràng. Không nên catch `ConcurrentModificationException` rồi tiếp tục như thể dữ liệu chắc chắn đúng.

## 15.8. Sorting List

Có thể sắp xếp bằng natural ordering:

```java
List<String> names = new ArrayList<>(
    List.of("Charlie", "Alice", "Bob")
);

Collections.sort(names);

System.out.println(names);
```

Hoặc:

```java
names.sort(Comparator.naturalOrder());
```

Sắp xếp theo một tiêu chí tùy chỉnh:

```java
record Product(String name, int stock) {}

List<Product> products = new ArrayList<>(
    List.of(
        new Product("Keyboard", 10),
        new Product("Mouse", 50),
        new Product("Monitor", 5)
    )
);

products.sort(
    Comparator.comparingInt(Product::stock)
              .reversed()
);

products.forEach(System.out::println);
```

Sắp xếp nhiều tiêu chí:

```java
products.sort(
    Comparator.comparingInt(Product::stock)
              .reversed()
              .thenComparing(Product::name)
);
```

Cần phân biệt:

- `Collections.sort(list)` là utility method.
- `list.sort(comparator)` là method trên List.
- Cả hai đều thay đổi list mutable.
- List unmodifiable sẽ ném `UnsupportedOperationException`.

### Sorting có thay đổi object không?

Sorting thay đổi thứ tự references trong list. Nó không tạo bản sao độc lập của các object và cũng không thay đổi state bên trong từng object.

## 15.9. subList() là view, không phải bản sao

`subList(fromIndex, toIndex)` sử dụng khoảng nửa mở:

```text
[fromIndex, toIndex)
```

Ví dụ:

```java
List<String> all = new ArrayList<>(
    List.of("A", "B", "C", "D", "E")
);

List<String> middle = all.subList(1, 4);

System.out.println(middle);
```

Kết quả:

```text
[B, C, D]
```

`middle` là một view liên kết với `all`.

```java
middle.set(0, "X");

System.out.println(all);
```

Kết quả:

```text
[A, X, C, D, E]
```

Có thể dùng view để xóa một range:

```java
all.subList(1, 3).clear();

System.out.println(all);
```

### Tạo bản sao độc lập

Nếu không muốn phụ thuộc vào list gốc:

```java
List<String> copy = new ArrayList<>(
    all.subList(0, 2)
);
```

Đây là shallow copy: list mới có array riêng, nhưng các object bên trong vẫn là cùng references.

### Bẫy khi sửa structural list gốc

Không nên tiếp tục sử dụng view sau khi list gốc bị structural modification theo cách làm mất tính hợp lệ của view.

`subList` hữu ích cho xử lý batch, nhưng cần hiểu rõ nó là view để tránh bug khó tìm.

## 15.10. List.of(), List.copyOf() và các dạng read-only

### List.of()

`List.of()` tạo một List unmodifiable:

```java
List<String> roles = List.of("ADMIN", "USER");

roles.add("AUDITOR");
```

Dòng cuối ném `UnsupportedOperationException`.

`List.of()`:

- Không cho thêm, xóa hoặc thay thế element.
- Không cho phép phần tử `null`.
- Giữ thứ tự các argument.
- Phù hợp với constant data hoặc input cần công khai dưới dạng read-only.

### List.copyOf()

```java
List<String> source = new ArrayList<>(
    List.of("A", "B")
);

List<String> snapshot = List.copyOf(source);

source.add("C");

System.out.println(snapshot);
System.out.println(source);
```

`snapshot` không tự phản ánh việc thêm `C` vào list gốc.

Tuy nhiên, đây vẫn là shallow copy đối với các element mutable:

```java
class User {
    String name;

    User(String name) {
        this.name = name;
    }
}

List<User> users = new ArrayList<>();
users.add(new User("Alice"));

List<User> readOnlyUsers = List.copyOf(users);

users.get(0).name = "Bob";

System.out.println(readOnlyUsers.get(0).name);
```

Kết quả có thể là:

```text
Bob
```

List không cho thay đổi cấu trúc, nhưng không biến object User thành immutable.

### Arrays.asList()

`Arrays.asList(array)` tạo một fixed-size list backed by array:

```java
String[] array = {"A", "B", "C"};
List<String> fixed = Arrays.asList(array);

fixed.set(0, "X");
array[1] = "Y";

System.out.println(fixed);
```

Kết quả:

```text
[X, Y, C]
```

`set` được phép và phản ánh về array. `add`/`remove` thay đổi size nên không được hỗ trợ.

### Collections.unmodifiableList()

```java
List<String> mutable = new ArrayList<>(
    List.of("A", "B")
);

List<String> view =
        Collections.unmodifiableList(mutable);

mutable.add("C");

System.out.println(view);
```

Kết quả:

```text
[A, B, C]
```

`view` không cho mutation thông qua chính view, nhưng vẫn nhìn thấy thay đổi từ `mutable`. Đây là unmodifiable view, không nhất thiết là snapshot.

### So sánh nhanh

| Cách tạo | Thay đổi qua reference hiện tại | Phản ánh thay đổi từ source | Cho null |
| -------- | ------------------------------- | --------------------------- | -------- |
| `new ArrayList<>(source)` | Có | Không, vì có list mới | Tùy source |
| `List.of(...)` | Không | Không có source mutable | Không |
| `List.copyOf(source)` | Không | Không phản ánh structural change của source | Không |
| `Collections.unmodifiableList(source)` | Không qua view | Có | Tùy source |
| `Arrays.asList(array)` | `set` được, size không đổi | Có | Có thể |

## 15.11. Độ phức tạp thường gặp của List

| Operation | ArrayList | LinkedList |
| --------- | --------- | ---------- |
| get(index) | O(1) | O(n) |
| set(index) | O(1) | O(n) |
| add cuối | Amortized O(1) | O(1) |
| add đầu | O(n) | O(1) |
| remove cuối | O(1) | O(1) |
| remove đầu | O(n) | O(1) |
| contains/search | O(n) | O(n) |
| sort | O(n log n) thường gặp | O(n log n) theo API/algorithm |
| memory locality | Tốt hơn | Kém hơn do node links |

Big-O là mô hình phân tích. Chi phí thực tế còn phụ thuộc kích thước dữ liệu, CPU cache, allocation, garbage collection và pattern sử dụng.

### Chọn List nào?

- Dùng `ArrayList` mặc định cho danh sách cần truy cập index hoặc chủ yếu thêm cuối.
- Dùng `LinkedList` khi thật sự cần thao tác hai đầu qua contract `Deque` và đã có lý do hiệu năng.
- Dùng `ArrayDeque` cho queue/stack thuần túy.
- Dùng `CopyOnWriteArrayList` trong use case đọc rất nhiều, ghi rất ít và cần thread safety; phần này thuộc concurrency chuyên sâu.

## 15.12. List trong Backend

### Pagination

```java
int from = Math.min(page * pageSize, all.size());
int to = Math.min(from + pageSize, all.size());

List<Order> page =
        new ArrayList<>(all.subList(from, to));
```

Trong backend thực tế, không nên load toàn bộ database rồi mới subList nếu dữ liệu lớn. Hãy ưu tiên pagination ở database bằng `LIMIT/OFFSET` hoặc keyset pagination.

### Batch processing

```java
for (int start = 0; start < orders.size(); start += 100) {
    int end = Math.min(start + 100, orders.size());

    List<Order> batch =
            new ArrayList<>(orders.subList(start, end));

    processBatch(batch);
}
```

Copy batch giúp tránh việc code xử lý giữ một view quá lâu nếu list gốc tiếp tục thay đổi.

### API response order

Nếu API contract yêu cầu kết quả theo thứ tự, hãy chọn implementation và sorting rõ ràng. Không nên trả dữ liệu từ `HashSet` rồi giả định client luôn nhận cùng thứ tự.

# CHƯƠNG 16. SET

## 16.1. Set là gì?

`Set<E>` là collection không chứa duplicate elements theo equality rule của Set.

Ví dụ:

```java
Set<String> permissions = new HashSet<>();

permissions.add("READ");
permissions.add("WRITE");
permissions.add("READ");

System.out.println(permissions.size());
```

Kết quả là `2`.

`Set` phù hợp khi câu hỏi chính là:

- Giá trị này đã xuất hiện chưa?
- Người dùng có quyền này không?
- Hai tập dữ liệu có phần tử chung không?
- Loại bỏ duplicate như thế nào?

Nếu cần truy cập theo index hoặc giữ duplicate, hãy dùng `List`.

## 16.2. HashSet

`HashSet<E>` là Set dựa trên hashing.

Về mặt implementation của Java, `HashSet` được xây dựng dựa trên `HashMap`; mỗi element được lưu như một key và dùng một object placeholder làm value.

Ví dụ:

```java
Set<String> tags = new HashSet<>();

tags.add("java");
tags.add("backend");
tags.add("java");

System.out.println(tags);
```

Đặc điểm:

- Không bảo đảm iteration order.
- Cho phép nhiều nhất một `null` element.
- `add` trả về `false` nếu element đã tồn tại.
- Trung bình `add`, `remove`, `contains` có độ phức tạp gần O(1).
- Không thread-safe.
- Capacity và load factor ảnh hưởng memory/performance.

Không nên viết test phụ thuộc vào thứ tự in của `HashSet`.

### Cơ chế hashing khái niệm

Khi gọi:

```java
set.contains(value);
```

implementation cần:

1. Tính hoặc sử dụng hash code của value.
2. Xác định bucket có khả năng chứa value.
3. So sánh equality trong bucket để xác nhận đúng element.
4. Trả về kết quả.

Hash code giống nhau không có nghĩa hai object bằng nhau. Nó chỉ có nghĩa chúng có thể cùng rơi vào một bucket.

### Collision

Collision xảy ra khi nhiều keys/elements được ánh xạ vào cùng bucket.

Collection phải dùng bước so sánh bổ sung như `equals()` để phân biệt.

Trong các implementation hiện đại, bucket có quá nhiều collision có thể được tối ưu bằng cấu trúc dạng tree trong một số điều kiện. Đây là implementation detail của OpenJDK, không nên viết code phụ thuộc vào threshold cụ thể.

## 16.3. LinkedHashSet

`LinkedHashSet` kết hợp hashing với linked structure để duy trì encounter order, thường là insertion order.

```java
Set<String> statuses = new LinkedHashSet<>();

statuses.add("NEW");
statuses.add("PROCESSING");
statuses.add("DONE");
statuses.add("NEW");

System.out.println(statuses);
```

Kết quả:

```text
[NEW, PROCESSING, DONE]
```

Dùng `LinkedHashSet` khi:

- Cần loại duplicate.
- Vẫn cần giữ thứ tự xuất hiện đầu tiên.
- Muốn kết quả ổn định khi tạo response hoặc log.

Đổi lại, nó có thêm memory overhead so với `HashSet`.

## 16.4. TreeSet

`TreeSet` là sorted set.

Nó sắp xếp theo:

- Natural ordering của element.
- Hoặc `Comparator` được truyền vào constructor.

```java
Set<Integer> scores = new TreeSet<>(
    List.of(80, 60, 90, 70, 80)
);

System.out.println(scores);
```

Kết quả:

```text
[60, 70, 80, 90]
```

Đặc điểm:

- Không duplicate theo comparison rule.
- Các thao tác tìm kiếm/thêm/xóa thường O(log n).
- Không cho phép element không tương thích với ordering.
- Thường không cho phép `null` khi dùng natural ordering.
- Không thread-safe.

### Comparator quyết định uniqueness

```java
record Student(String name, int score) {}

Comparator<Student> byScore =
        Comparator.comparingInt(Student::score);

Set<Student> students = new TreeSet<>(byScore);

students.add(new Student("Alice", 90));
students.add(new Student("Bob", 90));

System.out.println(students.size());
```

Kết quả có thể là `1` vì comparator trả về `0` cho hai student cùng score.

TreeSet coi hai element tương đương theo ordering, dù `name` khác nhau.

Nếu muốn giữ cả hai:

```java
Comparator<Student> byScoreThenName =
        Comparator.comparingInt(Student::score)
                  .thenComparing(Student::name);
```

## 16.5. SortedSet và NavigableSet

`SortedSet<E>` cung cấp các operations dựa trên thứ tự:

```java
SortedSet<Integer> values = new TreeSet<>(
    List.of(10, 20, 30, 40, 50)
);

System.out.println(values.first());
System.out.println(values.last());
System.out.println(values.headSet(30));
System.out.println(values.tailSet(30));
System.out.println(values.subSet(20, 50));
```

Khoảng của `headSet`, `tailSet` và `subSet` có quy tắc include/exclude riêng; cần đọc contract method cụ thể.

`NavigableSet<E>` mở rộng khả năng tìm phần tử gần nhất:

```java
NavigableSet<Integer> values = new TreeSet<>(
    List.of(10, 20, 30, 40)
);

System.out.println(values.lower(25));   // 20
System.out.println(values.floor(20));   // 20
System.out.println(values.ceiling(25)); // 30
System.out.println(values.higher(20));  // 30

System.out.println(values.descendingSet());
```

Ý nghĩa:

- `lower(x)`: nhỏ hơn x.
- `floor(x)`: nhỏ hơn hoặc bằng x.
- `ceiling(x)`: lớn hơn hoặc bằng x.
- `higher(x)`: lớn hơn x.

Các method `pollFirst` và `pollLast` vừa đọc vừa xóa phần tử đầu/cuối.

## 16.6. Set.of() và Set.copyOf()

```java
Set<String> roles = Set.of("ADMIN", "USER");
```

Các Set tạo bằng `Set.of` và `Set.copyOf` có đặc điểm:

- Unmodifiable.
- Không cho `null`.
- Duplicate trong `Set.of` gây `IllegalArgumentException`.
- Thứ tự iteration không nên được xem là contract.
- Không nên dùng identity của các instance này để synchronization.

```java
Set<String> duplicated = Set.of("A", "A");
```

Dòng trên ném `IllegalArgumentException`.

## 16.7. Set Operations: Union, Intersection, Difference

Giả sử:

```java
Set<String> backend = new HashSet<>(
    Set.of("Java", "SQL", "HTTP")
);

Set<String> frontend = new HashSet<>(
    Set.of("JavaScript", "HTTP", "CSS")
);
```

### Union

Tập hợp tất cả phần tử của cả hai:

```java
Set<String> union = new HashSet<>(backend);
union.addAll(frontend);
```

### Intersection

Phần tử xuất hiện trong cả hai:

```java
Set<String> intersection = new HashSet<>(backend);
intersection.retainAll(frontend);
```

### Difference

Phần tử có trong backend nhưng không có trong frontend:

```java
Set<String> difference = new HashSet<>(backend);
difference.removeAll(frontend);
```

Không nên gọi trực tiếp `retainAll` hoặc `removeAll` trên tập gốc nếu vẫn cần dữ liệu ban đầu.

## 16.8. equals(), hashCode() và mutable elements

Hash-based Set phụ thuộc vào equality contract.

Nếu một element bị thay đổi field dùng trong `equals()`/`hashCode()` sau khi được thêm vào Set, Set có thể không tìm lại được element ở bucket cũ.

Ví dụ nguy hiểm:

```java
class UserKey {
    String username;

    UserKey(String username) {
        this.username = username;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof UserKey other)) {
            return false;
        }
        return username.equals(other.username);
    }

    @Override
    public int hashCode() {
        return username.hashCode();
    }
}

Set<UserKey> keys = new HashSet<>();
UserKey key = new UserKey("alice");

keys.add(key);
key.username = "bob";

System.out.println(keys.contains(key));
```

Kết quả có thể là `false`.

Cách an toàn hơn:

- Dùng key immutable.
- Không thay đổi field tham gia equality khi object đang nằm trong Set.
- Dùng record hoặc value object phù hợp.
- Nếu cần thay đổi, remove trước, thay đổi rồi add lại.

## 16.9. Chọn Set nào?

| Nhu cầu | Implementation |
| ------- | -------------- |
| Membership nhanh, không cần order | `HashSet` |
| Loại duplicate và giữ insertion order | `LinkedHashSet` |
| Sorted order, range query | `TreeSet` |
| Key là enum | `EnumSet`, dù không nằm trong checklist chính nhưng thường rất hiệu quả |
| Nhiều thread đọc/ghi | Cân nhắc concurrent set phù hợp, không tự thay bằng `HashSet` |

## 16.10. Set trong Backend

Ví dụ kiểm tra quyền:

```java
Set<String> userPermissions = Set.of(
    "ORDER_READ",
    "ORDER_WRITE"
);

boolean canRead =
        userPermissions.contains("ORDER_READ");
```

Ví dụ loại duplicate ID trước khi gọi service khác:

```java
List<Long> requestedIds = List.of(10L, 10L, 20L);

Set<Long> uniqueIds = new LinkedHashSet<>(
    requestedIds
);
```

Dùng `LinkedHashSet` giúp loại duplicate nhưng vẫn giữ thứ tự đầu tiên, hữu ích khi xây dựng response theo thứ tự request.

# CHƯƠNG 17. MAP

## 17.1. Map là gì?

`Map<K, V>` lưu các mapping từ key sang value.

Khác với `Collection`, một `Map` không trực tiếp lưu một nhóm element đơn lẻ. Mỗi phần tử logic là một cặp:

```text
key -> value
```

Ví dụ:

```java
Map<String, Integer> stock = new HashMap<>();

stock.put("keyboard", 10);
stock.put("mouse", 25);

System.out.println(stock.get("keyboard"));
```

Kết quả:

```text
10
```

Đặc điểm cốt lõi:

- Một key chỉ có tối đa một value tại một thời điểm.
- Nhiều key có thể cùng trỏ đến value bằng nhau.
- Gọi `put` với key đã tồn tại sẽ thay thế value cũ.
- Map có các collection views qua `keySet`, `values` và `entrySet`.
- Khả năng cho phép `null` và thứ tự phụ thuộc implementation.

### Map không phải Collection

`Map` không extends `Collection` vì abstraction khác nhau:

- `Collection<E>` làm việc với elements.
- `Map<K,V>` làm việc với mappings.
- `Map.Entry<K,V>` đại diện cho một cặp key/value.

## 17.2. HashMap

`HashMap<K,V>` là implementation phổ biến nhất khi cần tra cứu theo key với hiệu năng trung bình gần O(1).

Ví dụ:

```java
Map<Long, String> users = new HashMap<>();

users.put(101L, "Alice");
users.put(102L, "Bob");

String name = users.get(101L);
```

Đặc điểm:

- Không bảo đảm thứ tự iteration.
- Cho phép một `null` key.
- Cho phép nhiều `null` values.
- Không thread-safe.
- Dựa trên hash table.
- Hiệu năng phụ thuộc chất lượng hash code, capacity và load factor.

Nếu cần thứ tự insertion, dùng `LinkedHashMap`. Nếu cần sorted key, dùng `TreeMap`.

## 17.3. HashMap hoạt động bên trong như thế nào?

Có thể hình dung `HashMap` gồm một table các buckets.

```text
table
  bucket 0
  bucket 1
  bucket 2
  ...
  bucket n
```

Khi gọi:

```java
map.put(key, value);
```

implementation khái niệm thực hiện:

1. Lấy `hashCode()` của key.
2. Áp dụng phép biến đổi hash phù hợp.
3. Tính bucket index.
4. Nếu bucket trống, lưu entry.
5. Nếu bucket đã có entry, so sánh key.
6. Nếu key bằng key cũ, thay value.
7. Nếu key khác, xử lý collision trong cùng bucket.

Khi gọi `get(key)`, map thực hiện quy trình tương tự để tìm bucket rồi so sánh key.

### Hash code và equality

`hashCode()` giúp xác định vị trí ứng viên.

`equals()` xác định hai key có thực sự bằng nhau hay không.

Do đó, một key tốt cần tuân thủ:

```text
a.equals(b) == true
=> a.hashCode() == b.hashCode()
```

Chiều ngược lại không bắt buộc:

```text
a.hashCode() == b.hashCode()
không có nghĩa a.equals(b) == true
```

### Collision

Collision không phải lỗi. Nó là tình huống bình thường khi không gian hash hữu hạn còn số key có thể rất lớn.

Collection phải xử lý collision bằng cấu trúc bổ sung trong bucket. OpenJDK hiện đại có thể chuyển bucket collision cao sang dạng tree trong điều kiện nhất định, nhưng đây là implementation detail, không phải contract mà code ứng dụng nên phụ thuộc.

## 17.4. Capacity, Load Factor và Resizing

`HashMap` có hai khái niệm cần phân biệt:

- Capacity: số bucket hiện có.
- Size: số mapping đang lưu.
- Load factor: ngưỡng sử dụng trung bình trước khi resize.

Load factor mặc định thường được chọn là `0.75` vì cân bằng giữa memory và số collision.

Khi size vượt ngưỡng:

```text
threshold = capacity * loadFactor
```

map có thể resize:

1. Tạo table lớn hơn.
2. Phân bố lại các entry.
3. Cập nhật cấu trúc bucket.

Resize có thể tốn chi phí O(n) tại thời điểm xảy ra. Tuy nhiên, tổng chi phí của nhiều lần thêm vẫn thường được phân tích theo amortized complexity.

Nếu biết trước số lượng entry lớn, có thể truyền initial capacity phù hợp:

```java
Map<Long, Order> orders =
        new HashMap<>(10_000);
```

Không nên chọn capacity quá lớn một cách tùy tiện vì sẽ tiêu tốn memory và làm iteration tốn thêm chi phí.

## 17.5. HashMap Operations

### put()

```java
Map<String, String> config = new HashMap<>();

String oldValue = config.put("timeout", "30");
```

Nếu key chưa tồn tại, `put` trả về `null`. Nếu key đã tồn tại, nó trả về value cũ và ghi đè bằng value mới.

### putIfAbsent()

```java
config.putIfAbsent("timeout", "60");
```

Nếu key đã có value, value cũ được giữ nguyên.

### get() và getOrDefault()

```java
String timeout = config.get("timeout");

String retry =
        config.getOrDefault("retry", "3");
```

`getOrDefault` không tự thêm key mới vào map.

### containsKey() và containsValue()

```java
boolean configured =
        config.containsKey("timeout");

boolean hasThirty =
        config.containsValue("30");
```

`containsKey` thường có ý nghĩa hiệu năng tốt hơn `containsValue` trong `HashMap` vì value search phải duyệt nhiều entry.

### get() trả về null có thể gây mơ hồ

`HashMap` cho phép value `null`:

```java
Map<String, String> map = new HashMap<>();

map.put("enabled", null);

System.out.println(map.get("missing"));
System.out.println(map.get("enabled"));
```

Cả hai đều có thể là `null`. Nếu cần phân biệt key không tồn tại với key có value null, dùng `containsKey`.

### remove() và conditional remove

```java
map.remove("enabled");

map.remove("timeout", "30");
```

Overload thứ hai chỉ xóa khi key đang trỏ đúng value được cung cấp.

### replace()

```java
map.replace("timeout", "60");

map.replace("timeout", "60", "90");
```

Overload ba tham số chỉ thay thế khi value hiện tại khớp.

## 17.6. Map Views: keySet, values, entrySet

Các method sau trả về views liên kết với map:

```java
Map<String, Integer> scores = new HashMap<>();
scores.put("Alice", 80);
scores.put("Bob", 90);

Set<String> keys = scores.keySet();
Collection<Integer> values = scores.values();
Set<Map.Entry<String, Integer>> entries =
        scores.entrySet();
```

### keySet()

Dùng khi chỉ cần key:

```java
for (String name : scores.keySet()) {
    System.out.println(name);
}
```

### values()

Dùng khi chỉ cần value:

```java
for (Integer score : scores.values()) {
    System.out.println(score);
}
```

Value có thể trùng nhau.

### entrySet()

Dùng khi cần cả key và value:

```java
for (Map.Entry<String, Integer> entry
        : scores.entrySet()) {

    System.out.println(
        entry.getKey() + " = " + entry.getValue()
    );
}
```

Duyệt `entrySet` thường rõ ràng và tránh việc gọi `get` lại theo từng key.

Các views thường là backed views: thay đổi qua operation được hỗ trợ trên view có thể tác động lên map.

## 17.7. Duyệt và thay đổi Map an toàn

Không nên structural modify map trực tiếp trong enhanced `for`:

```java
for (String key : map.keySet()) {
    if (key.startsWith("temp")) {
        map.remove(key);
    }
}
```

Đoạn code có thể ném `ConcurrentModificationException`.

Cách dùng iterator:

```java
Iterator<String> iterator =
        map.keySet().iterator();

while (iterator.hasNext()) {
    String key = iterator.next();

    if (key.startsWith("temp")) {
        iterator.remove();
    }
}
```

Hoặc dùng `removeIf` trên key view:

```java
map.keySet().removeIf(key -> key.startsWith("temp"));
```

Với thao tác cập nhật value, có thể dùng `replaceAll`:

```java
scores.replaceAll(
    (name, score) -> score + 5
);
```

## 17.8. computeIfAbsent()

`computeIfAbsent` tạo value khi key chưa có mapping phù hợp.

Một use case rất phổ biến là grouping:

```java
Map<String, List<String>> ordersByCustomer =
        new HashMap<>();

ordersByCustomer
    .computeIfAbsent(
        "customer-1",
        key -> new ArrayList<>()
    )
    .add("order-1001");
```

Có thể viết tổng quát:

```java
for (Order order : orders) {
    ordersByCustomer
        .computeIfAbsent(
            order.customerId(),
            key -> new ArrayList<>()
        )
        .add(order.id());
}
```

Lợi ích là không phải tự viết:

```java
if (!map.containsKey(key)) {
    map.put(key, new ArrayList<>());
}
map.get(key).add(value);
```

Nếu mapping function trả về `null`, mapping sẽ không được thêm.

Không nên thực hiện những side effect phức tạp hoặc sửa chính map một cách khó đoán bên trong mapping function.

## 17.9. merge()

`merge` hữu ích khi muốn thêm mới hoặc gộp value cũ.

Đếm tần suất:

```java
Map<String, Integer> counts = new HashMap<>();

for (String word : List.of(
        "java", "map", "java", "set"
)) {
    counts.merge(word, 1, Integer::sum);
}

System.out.println(counts);
```

Logic:

- Nếu key chưa có, thêm value `1`.
- Nếu key đã có, gọi function gộp value cũ với value mới.
- Nếu function trả về `null`, mapping có thể bị xóa theo contract của `merge`.

Gộp tổng tiền theo customer:

```java
Map<String, BigDecimal> totals =
        new HashMap<>();

for (Payment payment : payments) {
    totals.merge(
        payment.customerId(),
        payment.amount(),
        BigDecimal::add
    );
}
```

## 17.10. LinkedHashMap

`LinkedHashMap` là subclass của `HashMap` có linked structure để duy trì encounter order.

### Insertion-order mode

```java
Map<String, Integer> map =
        new LinkedHashMap<>();

map.put("A", 1);
map.put("B", 2);
map.put("C", 3);

System.out.println(map);
```

Kết quả giữ thứ tự thêm:

```text
{A=1, B=2, C=3}
```

### Access-order mode

Constructor đặc biệt:

```java
LinkedHashMap<String, String> cache =
        new LinkedHashMap<>(
            16,
            0.75f,
            true
        );
```

Tham số cuối `true` bật access order. Khi entry được truy cập, nó có thể được di chuyển về cuối encounter order.

Có thể xây dựng LRU cache đơn giản:

```java
class LruCache<K, V>
        extends LinkedHashMap<K, V> {

    private final int maxEntries;

    LruCache(int maxEntries) {
        super(16, 0.75f, true);
        this.maxEntries = maxEntries;
    }

    @Override
    protected boolean removeEldestEntry(
            Map.Entry<K, V> eldest) {
        return size() > maxEntries;
    }
}
```

Đây chỉ là ví dụ học tập. Production cache thường cần chính sách eviction, metrics, concurrency và persistence phù hợp.

## 17.11. TreeMap

`TreeMap<K,V>` lưu mapping theo sorted order của key.

```java
NavigableMap<Integer, String> levels =
        new TreeMap<>();

levels.put(3, "HIGH");
levels.put(1, "LOW");
levels.put(2, "MEDIUM");

System.out.println(levels);
```

Kết quả:

```text
{1=LOW, 2=MEDIUM, 3=HIGH}
```

Các thao tác chính thường có O(log n):

- `put`.
- `get`.
- `remove`.
- Tìm key gần nhất.
- Range view.

Ví dụ range query:

```java
NavigableMap<Integer, String> scores =
        new TreeMap<>();

scores.put(50, "D");
scores.put(70, "C");
scores.put(80, "B");
scores.put(90, "A");

System.out.println(scores.subMap(70, true, 90, false));
```

### NavigableMap

```java
System.out.println(scores.lowerEntry(80));
System.out.println(scores.floorEntry(80));
System.out.println(scores.ceilingEntry(85));
System.out.println(scores.higherEntry(80));
System.out.println(scores.firstEntry());
System.out.println(scores.lastEntry());
```

`TreeMap` phù hợp với dữ liệu cần sorted keys hoặc range navigation. Nếu chỉ cần lookup exact key, `HashMap` thường đơn giản và nhanh hơn.

Comparator của `TreeMap` cũng quyết định việc hai key có được xem là tương đương. Nếu comparator trả về `0`, map có thể xem key mới là cùng mapping với key cũ.

## 17.12. Hashtable

`Hashtable` là collection legacy với các method synchronized.

Đặc điểm:

- Không cho phép `null` key hoặc `null` value.
- Không nên dùng trong code mới nếu không có lý do tương thích legacy.
- Synchronized từng operation không giải quyết toàn bộ atomicity của workflow.
- Có thể cân nhắc `ConcurrentHashMap` cho concurrency hiện đại.

## 17.13. IdentityHashMap

`IdentityHashMap` sử dụng identity comparison:

```text
a == b
```

thay vì equality thông thường:

```text
a.equals(b)
```

Ví dụ hai String có cùng nội dung nhưng là hai object khác nhau có thể được xem là hai key khác nhau.

`IdentityHashMap` chỉ phù hợp với các use case đặc biệt như:

- Graph traversal cần phân biệt đúng object instance.
- Object graph serialization logic.
- Theo dõi identity của object.

Không dùng nó như một `HashMap` thông thường.

## 17.14. WeakHashMap

`WeakHashMap` giữ key bằng weak reference theo semantics của class.

Khi key không còn strong reference ở nơi khác, entry có thể bị loại bỏ sau khi garbage collection diễn ra.

Ví dụ khái niệm:

```java
Map<Object, String> metadata =
        new WeakHashMap<>();

Object key = new Object();
metadata.put(key, "temporary");

key = null;

// Entry có thể biến mất sau GC.
// Không dựa vào thời điểm cụ thể.
```

Không nên dùng `WeakHashMap` nếu nghiệp vụ yêu cầu entry phải tồn tại chính xác đến một thời điểm. Việc GC chạy không được đảm bảo ngay lập tức.

## 17.15. EnumMap

`EnumMap` được tối ưu cho key là một enum.

```java
enum Status {
    NEW, PROCESSING, DONE, FAILED
}

Map<Status, Integer> counts =
        new EnumMap<>(Status.class);

counts.put(Status.NEW, 10);
counts.put(Status.DONE, 8);
```

Ưu điểm:

- Biết trước universe của key.
- Có thể dùng cấu trúc nhỏ và hiệu quả.
- Thể hiện rõ key chỉ thuộc một enum type.
- Thường tốt hơn việc dùng String làm key cho trạng thái cố định.

## 17.16. Map.of(), Map.ofEntries() và Map.copyOf()

```java
Map<String, Integer> limits =
        Map.of(
            "free", 10,
            "pro", 100
        );
```

Map factory methods tạo map unmodifiable.

Đặc điểm quan trọng:

- Không cho `null` key/value.
- Key trùng trong cùng factory call gây lỗi.
- Không nên dựa vào identity của instance.
- Phù hợp với cấu hình nhỏ, constant mapping và default response data.

Với nhiều entry:

```java
Map<String, Integer> limits =
        Map.ofEntries(
            Map.entry("free", 10),
            Map.entry("pro", 100),
            Map.entry("enterprise", 1_000)
        );
```

`Map.copyOf(source)` tạo map unmodifiable từ source và không phải deep copy value objects.

## 17.17. Mutable keys và rủi ro

Không nên dùng object mutable làm key nếu field tham gia `equals`/`hashCode` có thể thay đổi sau khi thêm vào map.

```java
class RequestKey {
    String tenantId;

    RequestKey(String tenantId) {
        this.tenantId = tenantId;
    }

    @Override
    public boolean equals(Object o) {
        if (!(o instanceof RequestKey other)) {
            return false;
        }
        return tenantId.equals(other.tenantId);
    }

    @Override
    public int hashCode() {
        return tenantId.hashCode();
    }
}

Map<RequestKey, String> cache = new HashMap<>();

RequestKey key = new RequestKey("tenant-a");
cache.put(key, "value");

key.tenantId = "tenant-b";

System.out.println(cache.get(key));
```

Lookup có thể thất bại vì key hiện có hash code khác bucket ban đầu.

Best practice:

- Dùng String, Integer, UUID hoặc record immutable làm key.
- Không sửa key sau khi put.
- Nếu cần thay đổi, remove rồi tạo key mới.

## 17.18. HashMap và ConcurrentHashMap

`HashMap`:

- Không thread-safe.
- Cho phép null key/value.
- Phù hợp với local state hoặc state được bảo vệ bên ngoài.
- Iterator có tính fail-fast best effort.

`ConcurrentHashMap`:

- Được thiết kế cho concurrent access.
- Không cho null key/value.
- Cho phép nhiều thread đọc/ghi với cơ chế concurrency phù hợp.
- Cung cấp các operation atomic như `putIfAbsent`, `computeIfAbsent`, `merge`.
- Không nên bao quanh bằng một lock lớn nếu không cần thiết.

Ví dụ:

```java
ConcurrentHashMap<String, Long> counters =
        new ConcurrentHashMap<>();

counters.merge("login", 1L, Long::sum);
```

Thread-safe collection không có nghĩa business workflow nhiều bước tự động atomic. Ví dụ kiểm tra rồi thêm vẫn cần thiết kế operation phù hợp.

## 17.19. Độ phức tạp và chọn Map

| Nhu cầu | Implementation | Complexity thường gặp |
| ------- | --------------- | ---------------------- |
| Exact lookup, không cần order | HashMap | O(1) trung bình |
| Exact lookup, giữ insertion order | LinkedHashMap | O(1) trung bình |
| Sorted key/range query | TreeMap | O(log n) |
| Key là enum | EnumMap | Gần O(1), compact |
| Identity comparison | IdentityHashMap | Use case đặc biệt |
| Key có thể biến mất theo GC | WeakHashMap | Use case đặc biệt |
| Concurrent exact lookup | ConcurrentHashMap | Tùy contention, thread-safe |

# CHƯƠNG 18. QUEUE & DEQUE

## 18.1. Queue là gì?

`Queue<E>` biểu diễn một cấu trúc lưu các element chờ được xử lý.

Nhiều queue dùng FIFO:

```text
First In, First Out
```

Nhưng interface `Queue` không bắt buộc mọi implementation phải là FIFO. `PriorityQueue` là ví dụ lấy element theo ordering.

### Hai nhóm method của Queue

| Operation | Nếu thành công | Khi queue rỗng/thất bại |
| --------- | --------------- | ------------------------ |
| add(e) | Thêm element | Ném exception |
| offer(e) | Thêm element | Trả về false |
| remove() | Xóa và trả head | Ném exception |
| poll() | Xóa và trả head | Trả về null |
| element() | Đọc head | Ném exception |
| peek() | Đọc head | Trả về null |

Ví dụ an toàn khi queue có thể rỗng:

```java
Queue<String> queue = new ArrayDeque<>();

String task = queue.poll();

if (task == null) {
    System.out.println("No task");
}
```

Không dùng `remove`/`element` nếu muốn biểu diễn trạng thái rỗng bằng giá trị trả về.

## 18.2. ArrayDeque

`ArrayDeque<E>` là một resizable-array implementation của `Deque`.

Dùng như queue:

```java
Queue<String> queue = new ArrayDeque<>();

queue.offer("A");
queue.offer("B");
queue.offer("C");

while (!queue.isEmpty()) {
    System.out.println(queue.poll());
}
```

Kết quả:

```text
A
B
C
```

Dùng như stack:

```java
Deque<String> stack = new ArrayDeque<>();

stack.push("A");
stack.push("B");
stack.push("C");

System.out.println(stack.pop());
```

Kết quả:

```text
C
```

Đặc điểm:

- Thao tác hai đầu hiệu quả.
- Không cho phép `null`.
- Không thread-safe.
- Thường được ưu tiên hơn `Stack` cho LIFO.
- Thường được ưu tiên hơn `LinkedList` khi chỉ cần queue/stack.

## 18.3. Deque

`Deque<E>` hỗ trợ cả đầu trước và đầu sau.

Các method thường dùng:

```java
Deque<Integer> deque = new ArrayDeque<>();

deque.addFirst(2);
deque.addLast(3);
deque.offerFirst(1);
deque.offerLast(4);

System.out.println(deque);
```

Kết quả:

```text
[1, 2, 3, 4]
```

Cặp method theo đầu:

- `addFirst`/`offerFirst`.
- `addLast`/`offerLast`.
- `removeFirst`/`pollFirst`.
- `removeLast`/`pollLast`.
- `getFirst`/`peekFirst`.
- `getLast`/`peekLast`.

Dùng nhóm `offer`, `poll` và `peek` khi muốn xử lý trạng thái thất bại bằng return value thay vì exception.

## 18.4. PriorityQueue

`PriorityQueue<E>` là queue dùng priority order.

```java
PriorityQueue<Integer> queue =
        new PriorityQueue<>();

queue.offer(30);
queue.offer(10);
queue.offer(20);

System.out.println(queue.poll());
System.out.println(queue.poll());
System.out.println(queue.poll());
```

Kết quả:

```text
10
20
30
```

Mặc định, head là phần tử nhỏ nhất theo natural ordering.

Dùng Comparator:

```java
record Job(String id, int priority) {}

PriorityQueue<Job> jobs =
        new PriorityQueue<>(
            Comparator.comparingInt(Job::priority)
                      .reversed()
        );

jobs.offer(new Job("email", 1));
jobs.offer(new Job("payment", 10));
jobs.offer(new Job("report", 5));

while (!jobs.isEmpty()) {
    System.out.println(jobs.poll());
}
```

### Iterator của PriorityQueue không phải thứ tự sorted

```java
PriorityQueue<Integer> values =
        new PriorityQueue<>(
            List.of(30, 10, 20, 5)
        );

for (Integer value : values) {
    System.out.println(value);
}
```

Không nên giả định vòng lặp trực tiếp sẽ in theo thứ tự tăng dần. Nếu cần thứ tự priority, dùng `poll()` liên tục hoặc copy sang cấu trúc phù hợp rồi sort.

### PriorityQueue và backend

Có thể dùng cho:

- Xử lý job ưu tiên.
- Chọn request có deadline gần nhất.
- Top K elements.
- Scheduler đơn giản trong memory.

Nó không tự thay thế message broker bền vững. Khi process crash, dữ liệu trong queue memory có thể mất.

## 18.5. BlockingQueue

`BlockingQueue<E>` thuộc `java.util.concurrent` và hỗ trợ producer-consumer.

Một số implementation:

- `ArrayBlockingQueue`: bounded queue dựa trên array.
- `LinkedBlockingQueue`: linked queue, có thể bounded theo capacity.
- `PriorityBlockingQueue`: priority queue có blocking operations.
- `DelayQueue`: element chỉ có thể lấy khi delay hoàn tất.

Ví dụ:

```java
BlockingQueue<String> queue =
        new ArrayBlockingQueue<>(100);

queue.put("task-1");

String task = queue.take();
```

- `put` có thể block khi queue đầy.
- `take` có thể block khi queue rỗng.
- `offer` và `poll` có overload timeout.

```java
boolean accepted = queue.offer(
    "task-2",
    200,
    TimeUnit.MILLISECONDS
);

String task = queue.poll(
    1,
    TimeUnit.SECONDS
);
```

Các method này có thể ném `InterruptedException`. Không nên nuốt interrupt; thường cần khôi phục interrupt status:

```java
try {
    String task = queue.take();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    return;
}
```

## 18.6. Queue trong Backend

Một queue in-memory phù hợp với tác vụ ngắn hạn trong một process. Với hệ thống nhiều instance hoặc yêu cầu durability, hãy cân nhắc broker/database phù hợp như một thành phần kiến trúc riêng.

Cần phân biệt:

- `ArrayDeque`: nhanh, local, không thread-safe.
- `BlockingQueue`: giao tiếp giữa threads trong cùng JVM.
- Message broker: giao tiếp bền vững giữa process/service, có persistence và delivery semantics riêng.

# CHƯƠNG 19. COLLECTION UTILITIES & JAVA 21 ADDITIONS

## 19.1. Collections.sort()

```java
List<Integer> numbers =
        new ArrayList<>(List.of(4, 1, 3, 2));

Collections.sort(numbers);

System.out.println(numbers);
```

Tương đương về ý định với:

```java
numbers.sort(Comparator.naturalOrder());
```

Cả hai thay đổi list mutable.

## 19.2. Collections.reverse()

```java
List<String> values =
        new ArrayList<>(List.of("A", "B", "C"));

Collections.reverse(values);

System.out.println(values);
```

Kết quả:

```text
[C, B, A]
```

`Collections.reverse` mutate list. Điều này khác với `reversed()` của Sequenced Collections, vốn tạo reverse-ordered view.

## 19.3. Collections.shuffle()

```java
List<String> questions =
        new ArrayList<>(List.of(
            "Q1", "Q2", "Q3", "Q4"
        ));

Collections.shuffle(questions);
```

Mỗi lần có thể tạo thứ tự khác nhau.

Nếu cần kết quả có thể tái lập trong test:

```java
Collections.shuffle(
    questions,
    new Random(42)
);
```

Không dùng random shuffle thông thường cho mục đích bảo mật hoặc token generation.

## 19.4. Collections.binarySearch()

`binarySearch` yêu cầu list đã được sort theo đúng ordering:

```java
List<Integer> values =
        new ArrayList<>(List.of(10, 20, 30, 40));

int index = Collections.binarySearch(
    values,
    30
);

System.out.println(index);
```

Nếu list chưa sort hoặc dùng Comparator khác với Comparator tìm kiếm, kết quả không có ý nghĩa.

Với phần tử không tồn tại, kết quả âm theo encoding insertion point của API; không nên chỉ kiểm tra bằng `== -1`.

```java
int result = Collections.binarySearch(values, 25);

if (result < 0) {
    int insertionPoint = -result - 1;
    System.out.println(insertionPoint);
}
```

## 19.5. Collections.unmodifiableList()

```java
List<String> source =
        new ArrayList<>(List.of("A", "B"));

List<String> readOnly =
        Collections.unmodifiableList(source);
```

`readOnly` chặn mutation qua reference đó:

```java
readOnly.add("C");
```

sẽ ném `UnsupportedOperationException`.

Nhưng thay đổi từ `source` vẫn có thể quan sát được qua `readOnly`:

```java
source.add("C");
System.out.println(readOnly);
```

Đây là view, không phải snapshot.

## 19.6. Immutable, unmodifiable và shallow copy

### Unmodifiable

Không cho mutation qua một API/reference cụ thể.

Ví dụ:

```java
List<String> view =
        Collections.unmodifiableList(source);
```

Source bên dưới vẫn có thể thay đổi.

### Immutable

Trạng thái không thể thay đổi sau khi tạo, theo contract của type.

`List.of` tạo một collection unmodifiable/value-based, nhưng element bên trong có thể vẫn mutable.

### Snapshot copy

```java
List<String> snapshot =
        List.copyOf(source);
```

Structural changes của `source` sau đó không phản ánh vào snapshot.

Không nên gọi đây là deep immutable nếu elements có mutable state.

## 19.7. Fail-fast Iterators

Nhiều collection iterator lưu một trạng thái phát hiện structural modification và có thể ném `ConcurrentModificationException`.

Cần nhớ:

- Fail-fast giúp phát hiện lỗi lập trình sớm.
- Không phải thread-safety mechanism.
- Không phải guarantee tuyệt đối.
- Không nên dùng exception này làm flow-control bình thường.
- Dùng iterator mutation hoặc collection API phù hợp.

## 19.8. Sequenced Collections trong Java 21

Java 21 bổ sung nhóm interface:

- `SequencedCollection<E>`.
- `SequencedSet<E>`.
- `SequencedMap<K,V>`.

Mục tiêu là thống nhất cách làm việc với collection có encounter order rõ ràng.

### SequencedCollection

`SequencedCollection` cung cấp các khái niệm:

```java
addFirst(element)
addLast(element)
getFirst()
getLast()
removeFirst()
removeLast()
reversed()
```

`reversed()` trả về reverse-ordered view, không mặc định là một bản sao độc lập.

Ví dụ:

```java
List<String> values =
        new ArrayList<>(List.of("A", "B", "C"));

System.out.println(values.getFirst());
System.out.println(values.getLast());

values.addFirst("START");
values.addLast("END");

System.out.println(values);
System.out.println(values.reversed());
```

Kết quả khái niệm:

```text
A
C
[START, A, B, C, END]
[END, C, B, A, START]
```

Trong Java 21, `List` là một subinterface của `SequencedCollection`. `Deque` và các sorted/sequenced collection phù hợp cũng tham gia hierarchy này.

### reversed() là view

```java
List<String> values =
        new ArrayList<>(List.of("A", "B", "C"));

List<String> reversed = values.reversed();

values.add("D");

System.out.println(reversed);
```

View có thể quan sát thay đổi từ collection gốc tùy contract/implementation. Không nên xem `reversed()` là deep copy. Nếu cần snapshot:

```java
List<String> snapshot =
        new ArrayList<>(values.reversed());
```

### SequencedSet

`SequencedSet<E>` kết hợp Set semantics với encounter order.

`LinkedHashSet` là implementation quen thuộc trong nhóm này:

```java
SequencedSet<String> tags =
        new LinkedHashSet<>();

tags.add("java");
tags.add("backend");
tags.add("database");

System.out.println(tags.getFirst());
System.out.println(tags.getLast());
System.out.println(tags.reversed());
```

Set vẫn không cho duplicate, nhưng API có thể làm việc rõ ràng với first/last/reversed thay vì tự chuyển qua array hoặc iterator.

### SequencedMap

`SequencedMap<K,V>` biểu diễn map có encounter order và operations ở hai đầu:

```java
SequencedMap<String, Integer> scores =
        new LinkedHashMap<>();

scores.put("A", 80);
scores.put("B", 90);
scores.put("C", 70);

System.out.println(scores.firstEntry());
System.out.println(scores.lastEntry());

scores.putFirst("FIRST", 100);
scores.putLast("LAST", 60);

System.out.println(scores);
System.out.println(scores.reversed());
```

Các method đáng chú ý:

- `firstEntry()`.
- `lastEntry()`.
- `pollFirstEntry()`.
- `pollLastEntry()`.
- `putFirst(key, value)`.
- `putLast(key, value)`.
- `sequencedKeySet()`.
- `sequencedValues()`.
- `sequencedEntrySet()`.
- `reversed()`.

`HashMap` không phải `SequencedMap` vì nó không cung cấp encounter order. Dùng `LinkedHashMap` hoặc implementation phù hợp nếu cần các API này.

## 19.9. Sequenced Collections trong API Backend

Ví dụ tạo response mới nhất trước:

```java
List<String> events =
        new ArrayList<>(eventStore);

List<String> newestFirst =
        new ArrayList<>(events.reversed());
```

Với map lưu insertion order:

```java
SequencedMap<String, String> headers =
        new LinkedHashMap<>();

headers.put("trace-id", "abc");
headers.put("request-id", "xyz");

headers.reversed().forEach(
    (key, value) -> System.out.println(
        key + ": " + value
    )
);
```

Không cần tự viết logic đảo index hoặc copy rồi reverse trong những use case đơn giản.

## 19.10. Bảng chọn Collection thực tế

| Câu hỏi | Lựa chọn thường gặp |
| ------- | -------------------- |
| Cần thứ tự và index? | ArrayList |
| Cần unique và lookup nhanh? | HashSet |
| Cần unique + giữ insertion order? | LinkedHashSet |
| Cần unique + sorted/range? | TreeSet |
| Cần key-value lookup? | HashMap |
| Cần key-value + insertion order? | LinkedHashMap |
| Cần key-value + sorted key? | TreeMap |
| Cần FIFO local? | ArrayDeque |
| Cần LIFO local? | ArrayDeque |
| Cần priority order? | PriorityQueue |
| Cần producer-consumer giữa threads? | BlockingQueue |
| Cần concurrent map? | ConcurrentHashMap |

Đây là lựa chọn ban đầu, không phải quy tắc tuyệt đối. Cần xem null policy, ordering, uniqueness, mutation, concurrency, data size và access pattern.

# 19.11. Những lỗi thường gặp khi dùng Collections

### Dùng HashSet nhưng mong đợi thứ tự

Nếu API cần thứ tự ổn định, chọn `LinkedHashSet` hoặc sort kết quả một cách tường minh.

### Dùng ArrayList để kiểm tra membership liên tục

Nếu có hàng triệu lần `contains`, hãy cân nhắc `HashSet` để có lookup trung bình tốt hơn.

### Dùng LinkedList vì nghĩ add/remove luôn O(1)

Chi phí tìm vị trí vẫn có thể là O(n), và node allocation làm tăng memory overhead.

### Dùng mutable object làm key

Có thể làm map/set không tìm lại được object sau khi field equality thay đổi.

### Dùng Map.get() để phân biệt missing key và null value

Dùng thêm `containsKey` nếu map cho phép null value.

### Xóa collection trực tiếp trong enhanced for

Dùng `Iterator.remove` hoặc `removeIf`.

### Dùng unmodifiable như immutable deep object

Collection không cho sửa cấu trúc không có nghĩa elements bên trong immutable.

### Dùng collection không thread-safe giữa nhiều threads

Chọn concurrent collection hoặc cơ chế synchronization rõ ràng.

# 19.12. Bài tập thực hành

1. Nhận một `List<Integer>`, loại bỏ duplicate nhưng giữ thứ tự xuất hiện đầu tiên.
2. Đếm số lần xuất hiện của từng status bằng `HashMap.merge`.
3. Group danh sách order theo customer bằng `computeIfAbsent`.
4. Tìm top 3 số lớn nhất bằng `PriorityQueue`.
5. Xây dựng LRU cache nhỏ bằng `LinkedHashMap`.
6. Tạo range query theo score bằng `TreeMap`.
7. Duyệt và xóa các phần tử không hợp lệ mà không gây `ConcurrentModificationException`.
8. So sánh output của `HashSet`, `LinkedHashSet` và `TreeSet`.
9. Dùng `SequencedCollection.reversed()` để tạo danh sách newest-first.
10. Thiết kế lựa chọn collection cho một endpoint trả về danh sách sản phẩm có filter và sort.

# 19.13. Câu hỏi phỏng vấn trọng tâm

### ArrayList và LinkedList khác nhau thế nào?

`ArrayList` dựa trên resizable array, truy cập index nhanh và thường có locality tốt. `LinkedList` dựa trên doubly linked nodes, thao tác ở đầu/cuối thuận tiện nhưng truy cập index và memory overhead thường kém hơn.

### HashSet xác định duplicate bằng gì?

Hash-based Set sử dụng hash code để tìm vùng ứng viên và equality để xác định phần tử trùng. Vì vậy `equals` và `hashCode` phải tuân thủ contract.

### HashMap có cho null không?

`HashMap` cho phép một null key và nhiều null values. Các implementation khác như `Hashtable` và `ConcurrentHashMap` có policy khác.

### `==` và `equals()` có vai trò gì trong HashMap?

HashMap chủ yếu dựa trên hash code và equality của key, không dùng identity comparison như `IdentityHashMap`.

### Vì sao key mutable nguy hiểm?

Thay đổi field tham gia hash/equality sau khi put có thể khiến lookup đi tới bucket khác với nơi entry đang nằm.

### `Collections.unmodifiableList` có phải immutable không?

Không nhất thiết. Nó là unmodifiable view; source bên dưới có thể thay đổi và elements có thể mutable.

### `subList` có tạo copy không?

Không. Nó thường là view liên kết với list gốc.

### `ConcurrentModificationException` có chứng minh có nhiều thread không?

Không. Nó có thể xảy ra trong một thread khi collection bị structural modification ngoài iterator.

### Khi nào dùng TreeMap thay vì HashMap?

Dùng `TreeMap` khi cần sorted keys, range queries hoặc nearest-key operations. Nếu chỉ exact lookup và không cần order, `HashMap` thường phù hợp hơn.

### Sequenced Collections Java 21 giải quyết gì?

Chúng thống nhất API cho collection/map có encounter order rõ ràng, đặc biệt là first/last operations và reverse-ordered views.

# 19.14. Tổng kết Phần 5

Bạn cần nhớ:

- Collection là abstraction cho nhóm elements; Map là abstraction cho key-value mappings.
- Dùng interface ở kiểu biến, chọn implementation theo access pattern.
- ArrayList thường là default List; LinkedList không tự động nhanh hơn.
- Set loại duplicate; HashSet không bảo đảm order, LinkedHashSet giữ order, TreeSet sort.
- HashMap lookup nhanh trung bình nhưng không bảo đảm iteration order.
- LinkedHashMap giữ encounter order; TreeMap sắp xếp key.
- Queue có cặp method exception/return-value: add/offer, remove/poll, element/peek.
- ArrayDeque phù hợp cho queue và stack local.
- PriorityQueue iterator không trả dữ liệu theo priority order; poll mới lấy head theo priority.
- BlockingQueue dùng cho producer-consumer giữa threads.
- equals/hashCode phải ổn định khi object nằm trong hash-based collection.
- subList, unmodifiable views và reversed views có thể là view chứ không phải copy.
- Java 21 bổ sung SequencedCollection, SequencedSet và SequencedMap.
- Collection không thread-safe tự động chỉ vì API tiện lợi hoặc fail-fast.
- Trong backend, chọn collection dựa trên ordering, uniqueness, lookup, mutation, concurrency và memory.

## Tài liệu tham khảo chính thức

- [Java Collections Framework — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/package-summary.html)
- [List — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/List.html)
- [ArrayList — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/ArrayList.html)
- [LinkedList — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedList.html)
- [Set — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Set.html)
- [HashMap — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/HashMap.html)
- [LinkedHashMap — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html)
- [TreeMap — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/TreeMap.html)
- [Queue và Deque — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/Queue.html)
- [SequencedCollection — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedCollection.html)
- [SequencedSet — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedSet.html)
- [SequencedMap — Java SE 21](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/SequencedMap.html)

> Trạng thái: Phần 5 đã được hoàn thiện theo checklist Collections Framework và Java 21.
