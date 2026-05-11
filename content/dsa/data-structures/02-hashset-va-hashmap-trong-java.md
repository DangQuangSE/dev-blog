# HashSet và HashMap: Sức mạnh của Bảng băm (Hash Table)

HashSet và HashMap là hai cấu trúc dữ liệu cực kỳ mạnh mẽ trong Java, cho phép lưu trữ và tìm kiếm dữ liệu với tốc độ gần như tức thời.

## 1. Nguồn gốc và Lý do ra đời

Hãy tưởng tượng bạn có một danh sách 1 triệu sinh viên. Nếu dùng **Mảng (Array)** hoặc **Danh sách liên kết (LinkedList)**, để tìm một sinh viên theo mã số, bạn có thể phải duyệt qua cả 1 triệu phần tử (độ phức tạp **O(n)**).

**Bảng băm (Hash Table)** ra đời để giải quyết vấn đề này. Nó sử dụng một **Hàm băm (Hash Function)** để biến đổi "khóa" (ví dụ: mã sinh viên) thành một chỉ số (index) trong mảng. Nhờ đó, bạn có thể nhảy thẳng tới vị trí cần tìm mà không cần duyệt qua các phần tử khác.

- **HashSet**: Chỉ lưu trữ các giá trị duy nhất (Unique values).
- **HashMap**: Lưu trữ dữ liệu theo cặp Khóa - Giá trị (Key - Value).

## 2. So sánh với cách làm cũ (Mảng/List)

| Đặc điểm | Mảng / ArrayList | HashSet / HashMap |
| :--- | :--- | :--- |
| **Tìm kiếm** | Chậm (**O(n)**) | Rất nhanh (**O(1)** trung bình) |
| **Kiểm tra tồn tại** | Phải duyệt mảng | Dùng hàm `contains()` cực nhanh |
| **Sắp xếp** | Giữ đúng thứ tự chèn | Không đảm bảo thứ tự (trừ LinkedHashMap) |
| **Khóa trùng lặp** | Cho phép | Không cho phép (Key trong HashMap là duy nhất) |

## 3. Luồng hoạt động và Lưu trữ trong bộ nhớ

Khác với mảng lưu liên tiếp, HashMap/HashSet sử dụng một cấu trúc gọi là **Buckets** (một mảng các nút).

### Quy trình lưu trữ một phần tử:
1. **Hashing**: Khi bạn gọi `map.put(key, value)`, Java lấy `key.hashCode()`.
2. **Index calculation**: Mã băm này được đưa qua một hàm phụ để tính toán `index` trong mảng buckets (ví dụ: `index = hashCode % bucket_size`).
3. **Storage**:
   - Nếu vị trí `index` trống: Một nút mới (Node) được tạo và đặt vào đó.
   - Nếu có **Xung đột (Collision)**: (Vị trí đó đã có dữ liệu), Java sẽ kiểm tra:
     - Nếu `key` trùng: Ghi đè giá trị cũ.
     - Nếu `key` khác: Thêm vào một **LinkedList** tại vị trí đó.
     - Nếu LinkedList quá dài (>8 phần tử): Java chuyển nó thành **Red-Black Tree** để giữ tốc độ tìm kiếm là O(log n).

### Load Factor và Rehashing:
Mặc định, khi bảng băm đầy **75%** (Load factor = 0.75), Java sẽ tự động tăng gấp đôi kích thước mảng buckets và tính toán lại vị trí cho toàn bộ phần tử cũ (**Rehashing**).

## 4. Rủi ro khi sử dụng

- **Tốn bộ nhớ**: Bảng băm cần một khoảng không gian dự phòng lớn để giảm thiểu xung đột hàm băm.
- **Xung đột hàm băm (Hash Collision)**: Nếu hai khóa khác nhau sinh ra cùng một chỉ số băm, hiệu suất sẽ giảm xuống (Java xử lý bằng cách dùng LinkedList hoặc Tree tại vị trí đó).
- **Không có thứ tự**: Dữ liệu trong HashSet/HashMap mặc định không được sắp xếp theo thứ tự chèn hay giá trị.

## 4. Ví dụ thực tế

### A. HashSet: LeetCode 217 - Contains Duplicate
**Bài toán**: Kiểm tra xem một mảng có chứa bất kỳ giá trị nào xuất hiện ít nhất 2 lần hay không.

```java
public boolean containsDuplicate(int[] nums) {
    HashSet<Integer> set = new HashSet<>();
    for (int x : nums) {
        if (set.contains(x)) return true; // Tìm thấy phần tử trùng
        set.add(x);
    }
    return false;
}
```

### B. HashMap: LeetCode 1 - Two Sum
**Bài toán**: Cho một mảng số nguyên và một số `target`, hãy tìm chỉ số của hai số sao cho tổng của chúng bằng `target`.

```java
public int[] twoSum(int[] nums, int target) {
    HashMap<Integer, Integer> map = new HashMap<>(); // Key: giá trị số, Value: chỉ số
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (map.containsKey(complement)) {
            return new int[] { map.get(complement), i };
        }
        map.put(nums[i], i);
    }
    throw new IllegalArgumentException("No solution found");
}
```

**Giải thích**:
- Việc sử dụng HashMap giúp chúng ta tìm thấy số còn thiếu (`complement`) chỉ trong **O(1)** thay vì phải dùng thêm một vòng lặp `for` nữa (giảm từ **O(n²)** xuống **O(n)**).
