# Stack & Queue: Cơ chế LIFO/FIFO và ứng dụng trong điều phối hệ thống

## 1. Nguồn gốc và Lý do ra đời
Trước khi có Stack và Queue, các lập trình viên thường sử dụng mảng và quản lý chỉ số (index) một cách thủ công. Tuy nhiên, khi hệ thống trở nên phức tạp, việc cho phép truy cập ngẫu nhiên vào bất kỳ vị trí nào trong danh sách (Random Access) lại trở thành một "lỗ hổng" logic:
- **Xung đột thứ tự**: Trong các tác vụ cần sự tuần tự tuyệt đối (như lệnh Undo), nếu một hàm vô tình thay đổi dữ liệu ở giữa danh sách, toàn bộ lịch sử sẽ bị hỏng.
- **Quản lý tài nguyên**: Khi nhiều tiến trình cùng tranh giành một tài nguyên (ví dụ máy in), nếu không có một "hàng đợi" chuẩn mực, các tiến trình sẽ bị xung đột hoặc rơi vào tình trạng đói tài nguyên (starvation).

**Stack và Queue** ra đời như những "người điều phối" có kỷ luật, giới hạn quyền truy cập để đảm bảo tính toàn vẹn của luồng dữ liệu.

## 2. So sánh với cách làm cũ
| Đặc điểm | Quản lý mảng thủ công | Stack/Queue (Cấu trúc dữ liệu chuẩn) |
| :--- | :--- | :--- |
| **Quy tắc** | Tự do (Dễ sai sót) | Bắt buộc (LIFO hoặc FIFO) |
| **Bảo mật logic** | Thấp (Có thể thay đổi phần tử bất kỳ) | Cao (Chỉ thao tác tại đầu/cuối) |
| **Độ phức tạp** | Khó kiểm soát khi danh sách lớn | $O(1)$ cho mọi thao tác thêm/xóa |

## 3. Luồng hoạt động lưu trữ trong bộ nhớ
Trong hầu hết các ngôn ngữ lập trình, Stack và Queue có thể được cài đặt bằng **Mảng** hoặc **LinkedList**.

### Stack (Ngăn xếp) - Cơ chế "Chồng đĩa":
- **Vị trí lưu trữ**: Thường gắn liền với vùng nhớ **Stack** của CPU. Khi bạn gọi một hàm, một "Stack Frame" được đẩy vào. Khi hàm kết thúc, nó được lấy ra ngay lập tức.
- **Hoạt động**: Chỉ có một con trỏ duy nhất là `Top`. Mỗi khi `push`, `Top` tăng lên; khi `pop`, `Top` giảm xuống.

### Queue (Hàng đợi) - Cơ chế "Xếp hàng":
- **Vị trí lưu trữ**: Thường nằm ở vùng nhớ **Heap** vì hàng đợi có xu hướng kéo dài và thay đổi liên tục.
- **Hoạt động**: Cần hai con trỏ `Front` (để lấy ra) và `Rear` (để thêm vào). 
- **Lưu ý chuyên sâu**: Để tối ưu bộ nhớ, người ta thường dùng **Circular Queue** (Hàng đợi vòng) để tránh lãng phí các ô trống ở đầu mảng sau khi đã `dequeue`.

## 4. Rủi ro khi không áp dụng hoặc dùng sai
- **Stack Overflow**: Rủi ro lớn nhất của Stack. Nếu bạn đệ quy vô hạn hoặc đẩy quá nhiều dữ liệu vào mà không lấy ra, vùng nhớ Stack của hệ thống sẽ bị tràn, gây sập chương trình.
- **Resource Starvation (Queue)**: Nếu hàng đợi không có cơ chế ưu tiên (Priority), một tiến trình nặng có thể làm tắc nghẽn toàn bộ hệ thống, khiến các tiến trình nhẹ khác phải chờ đợi vô tận.

## 5. Ví dụ thực tế trên LeetCode

### Bài toán Stack: [LeetCode 20 - Valid Parentheses](https://leetcode.com/problems/valid-parentheses/)
**Yêu cầu**: Kiểm tra xem chuỗi các dấu ngoặc `()[]{}` có đóng mở đúng thứ tự hay không.

```java
class Solution {
    public boolean isValid(String s) {
        Stack<Character> stack = new Stack<>();
        for (char c : s.toCharArray()) {
            if (c == '(' || c == '[' || c == '{') {
                stack.push(c); // Gặp ngoặc mở thì đẩy vào
            } else {
                if (stack.isEmpty()) return false;
                char top = stack.pop(); // Gặp ngoặc đóng thì lấy thằng mới nhất ra so khớp
                if ((c == ')' && top != '(') || 
                    (c == ']' && top != '[') || 
                    (c == '}' && top != '{')) return false;
            }
        }
        return stack.isEmpty();
    }
}
```

**Tại sao dùng Stack?** Vì dấu ngoặc đóng phải khớp với dấu ngoặc mở **gần nhất** vừa xuất hiện (Last In - First Out).
