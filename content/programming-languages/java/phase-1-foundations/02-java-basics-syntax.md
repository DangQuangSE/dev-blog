# [02] Phase 1 - Foundations: Cú pháp cơ bản, Biến, Ép kiểu, Toán tử & Mảng

## 1. Nguồn gốc và lý do phân chia bộ nhớ Stack và Heap trong Java

### b) Sự hạn chế của quản lý bộ nhớ thủ công trong C/C++
Trong các ngôn ngữ như C/C++, lập trình viên tự quản lý việc phân bổ bộ nhớ. Biến cục bộ được lưu trên Stack và tự động giải phóng khi thoát hàm, nhưng biến cấp phát động (dùng `malloc` hoặc `new`) nằm trên Heap và bắt buộc phải giải phóng thủ công bằng `free` hoặc `delete`. Nếu quên, bộ nhớ sẽ bị rò rỉ (Memory Leak); nếu giải phóng hai lần, ứng dụng sẽ bị crash.

### b) Giải pháp của Java: Tự động hóa qua Heap & GC
Java tách biệt bộ nhớ thành hai khu vực rõ ràng để quản lý hiệu quả và tự động:
- **Stack (Bộ nhớ ngăn xếp)**: Lưu trữ các lời gọi hàm (Stack Frame), các biến cục bộ (local variables) thuộc kiểu nguyên thủy (primitive) hoặc tham chiếu (reference pointer) trỏ tới đối tượng trên Heap. Stack có tốc độ truy cập cực nhanh, hoạt động theo cơ chế LIFO (Last In First Out), tự động giải phóng khi kết thúc luồng chạy hoặc thoát khỏi block code.
- **Heap (Bộ nhớ đống)**: Lưu trữ toàn bộ các đối tượng (objects) được tạo bởi từ khóa `new`. Heap được chia sẻ giữa tất cả các luồng (thread-shared). Bộ dọn rác (Garbage Collector - GC) sẽ quét Heap định kỳ để thu hồi các đối tượng không còn biến tham chiếu nào trỏ tới.

```
┌───────────────────────────────┐        ┌───────────────────────────────┐
│        Stack Memory           │        │          Heap Memory          │
│                               │        │                               │
│  ┌─────────────────────────┐  │        │   ┌───────────────────────┐   │
│  │ main() frame            │  │        │   │ String "Hello"        │   │
│  │  - int age = 25         │  │        │   │ (String Pool)         │◄──┼──┐
│  │  - String name ---------┼──┼────────┼──►│                       │   │
│  │  - int[] arr -----------┼──┼──┐     │   └───────────────────────┘   │
│  └─────────────────────────┘  │  │     │   ┌───────────────────────┐   │
└───────────────────────────────┘  │     │   │ int[3] {10, 20, 30}   │   │
                                   └─────┼──►│                       │   │
                                         │   └───────────────────────┘   │
                                         └───────────────────────────────┘
```

---

## 2. So sánh Cách làm cũ vs Cách làm mới

### a) Biến và Scope (Local, Instance, Static)
- **Local Variable**: Biến khai báo trong phương thức hoặc block code `{}`. Phải được khởi tạo giá trị trước khi sử dụng. Lưu trên Stack.
- **Instance Variable**: Biến thực thể khai báo trong class nhưng ngoài phương thức. Tự động nhận giá trị mặc định (`0`, `false`, `null`) nếu không khởi tạo. Lưu trên Heap cùng đối tượng.
- **Static Variable**: Biến tĩnh khai báo với từ khóa `static`, thuộc về class chứ không thuộc về thực thể. Chỉ khởi tạo một lần duy nhất khi class được load vào bộ nhớ JVM (Metaspace).

### b) Ép kiểu (Type Casting)
- **Implicit Casting (Ép kiểu ngầm định - Widening)**: Chuyển kiểu nhỏ hơn sang lớn hơn (ví dụ từ `int` sang `double`). Không mất mát dữ liệu, JVM tự thực hiện.
- **Explicit Casting (Ép kiểu tường minh - Narrowing)**: Chuyển kiểu lớn hơn về nhỏ hơn (ví dụ từ `double` sang `int`). Phải khai báo thủ công và có nguy cơ tràn số hoặc mất phần thập phân.

### c) String Pool - Cơ chế tối ưu bộ nhớ của Java
Tránh tạo ra quá nhiều đối tượng chuỗi giống nhau trong bộ nhớ Heap.
- **Cách 1**: Khai báo Literal `String s1 = "Hello";` -> JVM kiểm tra xem "Hello" đã có trong String Pool chưa. Nếu có rồi, s1 sẽ trỏ thẳng tới đó. Nếu chưa, tạo mới trong String Pool.
- **Cách 2**: Khai báo `String s2 = new String("Hello");` -> Bắt buộc tạo một đối tượng chuỗi hoàn toàn mới nằm ngoài String Pool trong vùng Heap thông thường.

---

## 3. Rủi ro khi thiết kế sai cú pháp và bộ nhớ

1. **NullPointerException (NPE)**: Khi khai báo biến tham chiếu (ví dụ `String name;`) mà không khởi tạo (hoặc gán `null`), sau đó gọi phương thức (ví dụ `name.length()`).
2. **Memory Leak trong String**: Sử dụng nối chuỗi bằng toán tử `+` liên tục trong vòng lặp lớn. Do `String` trong Java là **Immutable** (không thể biến đổi), mỗi phép nối chuỗi sẽ tạo ra một đối tượng String mới trên Heap, làm đầy bộ nhớ.
   - *Khắc phục*: Dùng `StringBuilder` hoặc `StringBuffer`.
3. **Tràn bộ nhớ Stack (StackOverflowError)**: Xảy ra khi gọi đệ quy vô hạn hoặc quá sâu làm cho vùng nhớ Stack chứa các Frame bị vượt quá giới hạn.

---

## 4. Code ví dụ minh họa chi tiết

```java
public class JavaBasicsDemo {
    // Static variable (Metaspace)
    private static final String APP_NAME = "Java Basics Tutorial";
    
    // Instance variable (Heap)
    private String author = "Antigravity";

    public static void main(String[] args) {
        // Local variables (Stack)
        int localPrimitive = 100;
        String localReference = "Hello World"; // Literal, trỏ vào String Pool

        System.out.println("App Name: " + APP_NAME);

        // 1. Minh họa Ép kiểu (Casting)
        double myDouble = 9.78d;
        int myInt = (int) myDouble; // Explicit Casting (Narrowing): Mất phần thập phân
        System.out.println("Double: " + myDouble + " -> Int: " + myInt); // Output: 9

        // 2. Minh họa String Pool vs Heap
        String str1 = "Java";
        String str2 = "Java";
        String str3 = new String("Java");

        System.out.println("str1 == str2: " + (str1 == str2)); // true (cùng tham chiếu String Pool)
        System.out.println("str1 == str3: " + (str1 == str3)); // false (str3 nằm ở vùng Heap riêng)
        System.out.println("str1.equals(str3): " + str1.equals(str3)); // true (so sánh nội dung)

        // 3. Minh họa Mảng và Vòng lặp
        int[] numbers = {10, 20, 30, 40, 50};
        int sum = 0;
        
        // Dùng Foreach loop
        for (int num : numbers) {
            sum += num;
        }
        System.out.println("Tổng mảng: " + sum);

        // 4. Tránh lãng phí bộ nhớ khi nối chuỗi lớn
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 5; i++) {
            sb.append("Lần ").append(i).append("; ");
        }
        System.out.println("Nối chuỗi an toàn: " + sb.toString());
    }
}
```
