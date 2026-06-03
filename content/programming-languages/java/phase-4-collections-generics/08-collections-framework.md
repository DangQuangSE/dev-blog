# [08] Phase 4 - Collections & Generics: Làm chủ List, Set, Map, Queue & Stack

## 1. Nguồn gốc và lý do ra đời của Java Collections Framework

### Khó khăn khi sử dụng Mảng (Array) thuần túy
Trong những ngày đầu, Java chỉ hỗ trợ mảng tĩnh để lưu trữ danh sách đối tượng.
- **Hạn chế**: Mảng có kích thước cố định được khai báo ngay từ đầu (ví dụ: `int[] arr = new int[10]`). Nếu số lượng phần tử vượt quá 10, bạn phải tự tạo mảng mới lớn hơn, sao chép thủ công toàn bộ phần tử cũ sang và giải phóng mảng cũ. Hơn nữa, mảng không hỗ trợ sẵn các thuật toán tìm kiếm, sắp xếp hay lưu trữ dạng cặp Key-Value.

### Giải pháp: Khung tập hợp chuẩn hóa (Collections Framework)
Java 1.2 đã giới thiệu hệ thống các giao diện (Interfaces) và lớp triển khai (Implementations) đồng bộ, tối ưu hóa sẵn cấu trúc dữ liệu và thuật toán:
- **List**: Lưu trữ danh sách có thứ tự, cho phép trùng lặp (ArrayList, LinkedList).
- **Set**: Tập hợp không chứa phần tử trùng lặp (HashSet, LinkedHashSet, TreeSet).
- **Map**: Ánh xạ cặp khóa - giá trị (Key - Value) (HashMap, TreeMap, LinkedHashMap).
- **Queue/Deque**: Hàng đợi phục vụ xử lý tuần tự (Queue, ArrayDeque).

---

## 2. Chi tiết Luồng hoạt động lưu trữ trong Bộ nhớ (Memory Layout & DSA Internals)

### a) Cơ chế co giãn của ArrayList trong RAM
`ArrayList` bọc ngoài một mảng tĩnh `Object[]`. Khi khởi tạo mặc định, nó có kích thước ban đầu là 10.
- **Khi thêm phần tử vượt quá sức chứa**: ArrayList tự động tăng kích thước lên **1.5 lần** kích thước cũ (`newCapacity = oldCapacity + (oldCapacity >> 1)`).
- **Phép toán bộ nhớ**: JVM cấp phát một vùng nhớ liên tục mới trên Heap với kích thước mới, sau đó dùng lệnh tối ưu `System.arraycopy()` để chuyển dữ liệu sang. Vì vậy, việc chèn cuối mảng thường có độ phức tạp trung bình $O(1)$, nhưng nếu phải resize sẽ tốn $O(n)$.

```
Ban đầu (Capacity = 4):
┌───┬───┬───┬───┐
│ A │ B │ C │ D │   --> Full!
└───┴───┴───┴───┘
Chèn thêm E -> ArrayList tự resize (Capacity = 4 * 1.5 = 6) và copy:
┌───┬───┬───┬───┬───┬───┐
│ A │ B │ C │ D │ E │   │
└───┴───┴───┴───┴───┴───┘
```

### b) Cơ chế băm (Hashing) và Xử lý va chạm (Collision) của HashMap
`HashMap` lưu trữ dữ liệu dưới dạng một mảng các Bucket (`Node<K,V>[] table`).
- **Tìm kiếm/Chèn (Hashing)**: Khi gọi `map.put(key, value)`, JVM lấy `hashCode()` của key, đi qua hàm băm phụ để tính toán ra chỉ số index của bucket (`index = (n - 1) & hash`).
- **Va chạm băm (Collision)**: Khi hai key khác nhau cho ra cùng một index.
  - **Dưới Java 8**: HashMap giải quyết va chạm bằng cách tạo một **LinkedList** tại bucket đó (Singly Linked List). Độ phức tạp tìm kiếm lúc này có thể bị suy biến thành $O(n)$.
  - **Từ Java 8+**: Nếu số lượng phần tử tại một bucket vượt quá **8** (và tổng kích thước bảng băm $\ge 64$), LinkedList tại bucket đó sẽ tự động chuyển đổi thành **Cây đỏ đen (Red-Black Tree)**. Độ phức tạp tìm kiếm tối đa giảm từ $O(n)$ xuống $O(\log n)$.

```
Bucket Array
┌───┐
│ 0 │ ───► Null
├───┤
│ 1 │ ───► Node (Key1) ───► Node (Key2)  [LinkedList]
├───┤
│ 2 │ ───► Red-Black Tree Node (Key3)    [Nếu > 8 va chạm]
└───┘
```

- **HashSet** thực chất được triển khai ngầm dựa trên một đối tượng `HashMap` làm nền tảng, trong đó giá trị Key là phần tử của Set, còn Value là một hằng số giả lập (`PRESENT = new Object()`).

---

## 3. Rủi ro khi thiết kế Collections sai cấu trúc

1. **HashMap bị suy biến hiệu năng**: Sử dụng các đối tượng có thuộc tính dễ thay đổi (Mutable object) làm Key cho HashMap. Nếu thuộc tính của đối tượng thay đổi sau khi đưa vào map, `hashCode()` của nó sẽ thay đổi, dẫn đến việc không thể tìm thấy hoặc xóa đối tượng đó ra khỏi map nữa, gây rò rỉ bộ nhớ Heap.
   - *Khắc phục*: Luôn sử dụng các lớp bất biến (như `String`, `Integer`, `Record`) làm Key.
2. **Lỗi sửa đổi đồng thời (ConcurrentModificationException)**: Xảy ra khi bạn duyệt một Collection bằng vòng lặp `for-each` thông thường nhưng lại gọi lệnh xóa phần tử `collection.remove()` trực tiếp trong vòng lặp đó.
   - *Khắc phục*: Sử dụng `Iterator.remove()` hoặc viết `collection.removeIf(...)`.

---

## 4. Ví dụ Leetcode Thực tế: Contains Duplicate (Leetcode 217)

**Đề bài**: Cho một mảng số nguyên `nums`, trả về `true` nếu có bất kỳ giá trị nào xuất hiện ít nhất hai lần trong mảng, và `false` nếu tất cả các phần tử đều phân biệt.

### Giải pháp sử dụng HashSet (Tối ưu độ phức tạp $O(n)$ thời gian, $O(n)$ bộ nhớ)

```java
import java.util.HashSet;
import java.util.Set;

public class LeetCode217 {
    public boolean containsDuplicate(int[] nums) {
        // HashSet lưu trữ các phần tử duy nhất trong Heap
        Set<Integer> visited = new HashSet<>();
        
        for (int num : nums) {
            // Nếu phần tử đã tồn tại trong Set, nghĩa là có trùng lặp
            if (visited.contains(num)) {
                return true;
            }
            // Thêm vào Set với độ phức tạp trung bình O(1)
            visited.add(num);
        }
        return false;
    }
}
```

---

## 5. Code ví dụ minh họa cách sử dụng chuẩn

```java
import java.util.ArrayList;
import java.util.HashMap;
import java.util.Iterator;
import java.util.List;
import java.util.Map;

public class CollectionsDemo {
    public static void main(String[] args) {
        // 1. Thực hành ArrayList an toàn
        List<String> list = new ArrayList<>();
        list.add("Java");
        list.add("Spring");
        list.add("SQL");

        // Cách xóa phần tử an toàn tránh ConcurrentModificationException
        Iterator<String> iterator = list.iterator();
        while (iterator.hasNext()) {
            String element = iterator.next();
            if ("SQL".equals(element)) {
                iterator.remove(); // Xóa an toàn qua Iterator
            }
        }
        System.out.println("ArrayList sau khi xóa: " + list);

        // 2. Thực hành HashMap với Key bất biến
        Map<String, Integer> scoreMap = new HashMap<>();
        scoreMap.put("Hoang", 95);
        scoreMap.put("An", 88);

        // Duyệt Map tối ưu bằng entrySet() tránh lặp khóa hai lần
        for (Map.Entry<String, Integer> entry : scoreMap.entrySet()) {
            System.out.println("Học viên: " + entry.getKey() + " | Điểm số: " + entry.getValue());
        }
    }
}
```
