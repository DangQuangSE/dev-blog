# Danh sách liên kết (LinkedList): Linh hoạt trong lưu trữ

LinkedList là một cấu trúc dữ liệu tuyến tính, trong đó các phần tử không được lưu trữ tại các vị trí bộ nhớ liên tiếp. Thay vào đó, các phần tử được liên kết với nhau bằng các con trỏ (pointers).

## 1. Nguồn gốc và Lý do ra đời

Mặc dù **Mảng (Array)** truy xuất rất nhanh, nhưng nó có hai nhược điểm lớn:
- **Kích thước cố định**: Bạn phải biết trước số lượng phần tử.
- **Chèn/Xóa chậm**: Nếu muốn chèn một phần tử vào đầu mảng, bạn phải đẩy toàn bộ các phần tử cũ ra sau (O(n)).

**LinkedList** ra đời để giải quyết các vấn đề này. Nó cho phép bộ nhớ được cấp phát linh hoạt và việc chèn/xóa chỉ đơn giản là thay đổi địa chỉ mà con trỏ trỏ tới.

## 2. Cơ chế lưu trữ trong bộ nhớ

Khác với mảng là một khối liền mạch, LinkedList giống như một đoàn tàu:
- **Node (Nút)**: Mỗi toa tàu là một Node, chứa hai phần: **Dữ liệu (Data)** và **Địa chỉ của nút tiếp theo (Next Pointer)**.
- **Phân tán**: Các Node có thể nằm ở bất kỳ đâu trong RAM, không cần sát cạnh nhau.
- **Head & Tail**: Nút đầu tiên gọi là Head, nút cuối cùng trỏ vào `null`.

### Luồng hoạt động:
Khi bạn muốn tìm phần tử thứ 3, máy tính không thể tính toán ngay địa chỉ như mảng. Nó phải bắt đầu từ **Head**, hỏi xem nút tiếp theo ở đâu, rồi lại hỏi tiếp cho đến khi tới đích. Đây là lý do truy xuất LinkedList tốn **O(n)**.

## 3. So sánh với ArrayList

| Đặc điểm | ArrayList (Array-based) | LinkedList |
| :--- | :--- | :--- |
| **Truy cập (get)** | Cực nhanh (**O(1)**) | Chậm (**O(n)**) |
| **Thêm/Xóa ở đầu** | Chậm (**O(n)**) | Cực nhanh (**O(1)**) |
| **Thêm/Xóa ở cuối** | Nhanh (**O(1)**) | Nhanh (**O(1)**) |
| **Bộ nhớ** | Tiết kiệm hơn | Tốn hơn (do phải lưu thêm con trỏ) |

## 4. Rủi ro khi sử dụng

- **Truy cập ngẫu nhiên kém**: Không phù hợp nếu ứng dụng của bạn cần đọc dữ liệu tại các vị trí bất kỳ liên tục.
- **Lãng phí bộ nhớ**: Mỗi phần tử phải "gánh" thêm một con trỏ (hoặc hai con trỏ nếu là Doubly LinkedList).
- **Cache Locality**: Do nằm rải rác trong RAM, LinkedList không tận dụng tốt bộ nhớ đệm (Cache) của CPU như mảng.

## 5. Ví dụ thực tế: LeetCode 206 - Reverse Linked List

**Bài toán**: Đảo ngược một danh sách liên kết đơn. Ví dụ: `1 -> 2 -> 3` thành `3 -> 2 -> 1`.

```java
/**
 * Definition for singly-linked list.
 * public class ListNode {
 *     int val;
 *     ListNode next;
 *     ListNode(int x) { val = x; }
 * }
 */
public ListNode reverseList(ListNode head) {
    ListNode prev = null;
    ListNode current = head;
    
    while (current != null) {
        ListNode nextTemp = current.next; // Lưu lại nút tiếp theo
        current.next = prev;              // Đảo ngược con trỏ
        prev = current;                   // Dịch chuyển prev lên
        current = nextTemp;               // Dịch chuyển current lên
    }
    
    return prev; // prev lúc này là Head mới
}
```

**Giải thích**: 
- Chúng ta sử dụng 3 con trỏ để điều hướng: `prev`, `current`, và `nextTemp`.
- Mỗi bước lặp, chúng ta "bẻ" con trỏ `next` của nút hiện tại quay ngược lại phía sau.
- Độ phức tạp thời gian: **O(n)**.
- Độ phức tạp không gian: **O(1)**.
