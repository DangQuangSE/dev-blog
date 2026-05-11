# Danh sách liên kết (LinkedList): Toàn tập từ lý thuyết đến thực hành

## 1. Nguồn gốc và Lý do ra đời
Trong những ngày đầu của lập trình, **Mảng (Array)** là cấu trúc dữ liệu duy nhất để lưu trữ danh sách. Tuy nhiên, mảng gặp phải bài toán "Cái giường chật hẹp":
- **Sự cố bộ nhớ liên tục**: Mảng đòi hỏi một khối RAM liên tiếp. Nếu bạn cần mảng 1GB nhưng RAM chỉ còn các khoảng trống 500MB nằm rải rác, bạn sẽ bị báo lỗi `OutOfMemory` dù tổng RAM trống vẫn đủ.
- **Chi phí dịch chuyển (Shifting Cost)**: Để chèn một phần tử vào đầu mảng 1 triệu phần tử, máy tính phải thực hiện 1 triệu phép gán để đẩy các phần tử cũ ra sau.

**LinkedList** ra đời như một giải pháp "Phân tán": Không cần một khối bộ nhớ lớn liên tục, mỗi phần tử có thể nằm ở bất cứ đâu, chỉ cần chúng "biết địa chỉ" của nhau.

## 2. Luồng hoạt động lưu trữ trong bộ nhớ (Deep Dive)
Khác với mảng được lưu tại **Stack** hoặc một vùng liên tục ở **Heap**, LinkedList hoạt động hoàn toàn dựa trên cơ chế cấp phát động tại **Heap**.

### Cơ chế "Mẩu giấy chỉ đường":
Hãy tưởng tượng một trò chơi tìm kho báu:
1. Bạn có một mảnh giấy (Biến `Head`) ghi địa chỉ của trạm đầu tiên.
2. Tại trạm 1, bạn tìm thấy báu vật (Data) và một mảnh giấy khác (Pointer `next`) ghi địa chỉ trạm 2.
3. Nếu trạm cuối cùng không còn mảnh giấy nào (Pointer = `null`), trò chơi kết thúc.

**Trong RAM diễn ra như sau:**
- Khi bạn dùng lệnh `new Node()`, hệ điều hành sẽ tìm một ô trống bất kỳ trong Heap.
- Ô trống này sẽ lưu: `[Giá trị | Địa chỉ của ô tiếp theo]`.
- **Lưu ý**: Các ô này có thể nằm cách xa nhau hàng triệu byte.

## 3. So sánh với cách làm cũ (Array)
| Đặc điểm | Mảng (Array) | LinkedList |
| :--- | :--- | :--- |
| **Cấp phát** | Liên tục (Contiguous) | Rải rác (Non-contiguous) |
| **Truy cập ngẫu nhiên** | $O(1)$ (Cực nhanh) | $O(n)$ (Phải đi từng bước) |
| **Chèn/Xóa tại vị trí biết trước** | $O(n)$ (Do phải dịch chuyển) | $O(1)$ (Chỉ thay đổi con trỏ) |
| **Vùng nhớ đệm (Cache)** | Tốt (Do nằm cạnh nhau) | Tệ (Dễ bị Cache Miss) |

## 4. Rủi ro khi không áp dụng hoặc dùng sai
- **Memory Leak**: Nếu bạn làm mất con trỏ `Head`, toàn bộ danh sách vẫn nằm trong RAM nhưng bạn không thể truy cập hay xóa chúng được nữa.
- **Duyệt lặp vô tận**: Nếu một node vô tình trỏ ngược lại node phía trước mà không có cơ chế kiểm tra, chương trình sẽ rơi vào vòng lặp vô hạn (Infinite Loop).
- **Overhead**: Nếu dữ liệu mỗi node quá nhỏ (ví dụ kiểu `byte`), bộ nhớ dành cho con trỏ (thường là 8-byte trên hệ 64-bit) sẽ lớn gấp nhiều lần dữ liệu thực tế, gây lãng phí trầm trọng.

## 5. Ví dụ thực tế trên LeetCode

### Bài toán: [LeetCode 141 - Linked List Cycle](https://leetcode.com/problems/linked-list-cycle/)
**Yêu cầu**: Kiểm tra xem một LinkedList có bị vòng lặp (vòng tròn) hay không.

**Giải pháp**: Thuật toán "Rùa và Thỏ" (Floyd's Cycle-Finding Algorithm).

```java
public class Solution {
    public boolean hasCycle(ListNode head) {
        if (head == null) return false;
        
        ListNode slow = head; // Rùa đi 1 bước
        ListNode fast = head; // Thỏ đi 2 bước
        
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            
            // Nếu Thỏ đuổi kịp Rùa, chắc chắn có vòng lặp
            if (slow == fast) {
                return true;
            }
        }
        
        return false;
    }
}
```

**Tại sao dùng LinkedList ở đây?**
Trong mảng, khái niệm "vòng lặp" không tồn tại theo cách này vì chỉ số luôn tăng dần. Trong LinkedList, vì chúng ta kiểm soát con trỏ, việc một node trỏ về node cũ là một rủi ro thực tế mà lập trình viên cần xử lý bằng các thuật toán tối ưu như trên ($O(n)$ thời gian, $O(1)$ không gian).
