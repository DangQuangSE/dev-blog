# Mảng (Array): Cấu trúc dữ liệu cơ bản nhất

Mảng là một cấu trúc dữ liệu lưu trữ một tập hợp các phần tử có cùng kiểu dữ liệu tại các vị trí bộ nhớ liên tiếp nhau.

## 1. Nguồn gốc và Lý do ra đời

Trong những ngày đầu của lập trình, khi cần lưu trữ 10 giá trị điểm số, lập trình viên phải khai báo 10 biến khác nhau: `score1`, `score2`, ..., `score10`. Điều này làm cho việc xử lý hàng ngàn dữ liệu trở nên bất khả thi.

Mảng ra đời để:
- **Quản lý tập trung**: Chỉ cần một tên biến duy nhất để quản lý hàng triệu phần tử.
- **Tối ưu truy xuất**: Nhờ việc lưu trữ liên tiếp, máy tính có thể tính toán vị trí của bất kỳ phần tử nào dựa trên địa chỉ phần tử đầu tiên và chỉ số (index), giúp việc truy xuất đạt độ phức tạp **O(1)**.

## 2. So sánh với cách làm cũ (Biến đơn lẻ)

| Đặc điểm | Sử dụng Biến đơn | Sử dụng Mảng |
| :--- | :--- | :--- |
| **Khai báo** | Rườm rà, lặp đi lặp lại. | Nhanh gọn (`int[] arr = new int[100]`). |
| **Xử lý** | Không thể dùng vòng lặp hiệu quả. | Dễ dàng duyệt qua bằng `for` hoặc `while`. |
| **Khả năng mở rộng** | Rất kém. | Rất tốt. |

## 3. Cơ chế lưu trữ trong bộ nhớ

Mảng hoạt động cực nhanh nhờ vào cách nó được sắp xếp trong RAM:
- **Bộ nhớ liên tiếp**: Khi bạn khai báo `new int[5]`, Java sẽ tìm một khối bộ nhớ trống đủ lớn để chứa 5 số nguyên nằm sát cạnh nhau.
- **Công thức tính địa chỉ**: Để lấy phần tử tại `index = i`, máy tính không cần duyệt mảng mà dùng công thức:
  `Địa chỉ phần tử i = Địa chỉ bắt đầu + (i * kích thước kiểu dữ liệu)`
- **Stack và Heap**: Biến mảng (reference) được lưu ở **Stack**, trong khi đối tượng mảng thực sự và các giá trị của nó nằm ở **Heap**.

## 4. Rủi ro khi sử dụng

- **Kích thước cố định**: Trong Java, một khi mảng đã được khởi tạo, bạn không thể thay đổi kích thước của nó. Nếu cần thêm phần tử, bạn phải tạo mảng mới và sao chép dữ liệu sang.
- **Lãng phí bộ nhớ**: Nếu khai báo mảng quá lớn mà không dùng hết, phần bộ nhớ còn lại vẫn bị chiếm dụng.
- **Chèn/Xóa tốn kém**: Để chèn hoặc xóa một phần tử ở giữa mảng, bạn phải dịch chuyển toàn bộ các phần tử phía sau, độ phức tạp là **O(n)**.

## 4. Ví dụ thực tế: LeetCode 26 - Remove Duplicates from Sorted Array

**Bài toán**: Cho một mảng đã sắp xếp, hãy loại bỏ các phần tử trùng lặp sao cho mỗi phần tử chỉ xuất hiện một lần và trả về độ dài mới của mảng.

```java
public int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;
    
    // Sử dụng kỹ thuật Two Pointers
    int i = 0; // Pointer trỏ vào vị trí phần tử duy nhất cuối cùng tìm thấy
    
    for (int j = 1; j < nums.length; j++) {
        // Nếu tìm thấy phần tử mới khác với phần tử tại i
        if (nums[j] != nums[i]) {
            i++;
            nums[i] = nums[j]; // Cập nhật phần tử duy nhất vào vị trí tiếp theo
        }
    }
    
    return i + 1; // Độ dài của mảng không trùng lặp
}
```

**Giải thích**: 
- Chúng ta tận dụng đặc tính truy xuất nhanh của mảng và kỹ thuật hai con trỏ để xử lý tại chỗ (in-place) mà không cần dùng thêm bộ nhớ phụ.
- Độ phức tạp thời gian: **O(n)**.
- Độ phức tạp không gian: **O(1)**.
