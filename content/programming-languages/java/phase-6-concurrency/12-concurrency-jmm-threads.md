# [12] Phase 6 - Concurrency: Threads, volatile, JMM, Thread Pool & Virtual Threads

## 1. Nguồn gốc và lý do tiến hóa cơ chế Đa luồng trong Java

### Sự tốn kém của Luồng hệ điều hành (Platform Threads)
Trình duyệt web, ứng dụng máy chủ cần xử lý hàng nghìn kết nối đồng thời.
- **Trước Java 21**: Mỗi luồng Java (`java.lang.Thread`) là một wrapper bọc quanh một luồng hệ điều hành vật lý (1:1 OS Thread mapping).
- **Hạn chế**: Mỗi OS Thread tiêu tốn khoảng **1MB** dung lượng bộ nhớ Stack và mất nhiều chu kỳ CPU để chuyển ngữ cảnh (Context Switching). Vì vậy, máy chủ thông thường chỉ tải được tối đa khoảng vài nghìn luồng trước khi bị sập RAM hoặc treo CPU.

### Giải pháp đột phá: Virtual Threads (Java 21+)
Dự án **Project Loom** trong Java 21 giới thiệu **Virtual Threads (Luồng ảo)**:
- Luồng ảo là các luồng cấp ứng dụng (user-space threads) siêu nhẹ, được quản lý trực tiếp bởi JVM chứ không ánh xạ trực tiếp 1:1 sang OS Thread. Hàng triệu luồng ảo có thể chạy chung trên một vài luồng vật lý (Carrier Threads).
- Bộ nhớ tiêu tốn chỉ vài **Bytes** cho mỗi luồng ảo, cho phép mở hàng triệu luồng ảo đồng thời mà không nghẽn tài nguyên.

---

## 2. So sánh và Cơ chế Hoạt động bên dưới (JMM internals)

### a) Mô hình bộ nhớ Java Memory Model (JMM)
JMM định nghĩa cách các luồng chia sẻ và nhìn thấy các thay đổi bộ nhớ của nhau trên CPU đa nhân.
- **Vấn đề hiển thị bộ nhớ (Memory Visibility)**: Mỗi CPU core có các thanh ghi (registers) và bộ nhớ cache riêng (L1/L2/L3). Khi Luồng A cập nhật giá trị của một biến trên RAM, thay đổi đó có thể chỉ nằm ở CPU Cache của Core A mà chưa được ghi ngược lại RAM chính, khiến Luồng B chạy trên Core B đọc được giá trị cũ.
- **Từ khóa `volatile`**: Buộc JVM phải đọc/ghi biến trực tiếp từ RAM chính, không cache trên CPU Core, giải quyết triệt để lỗi hiển thị bộ nhớ.
- **Quy tắc Happens-Before**: Đảm bảo thứ tự thực thi của các dòng lệnh giữa các luồng để tránh trình biên dịch tự động sắp xếp lại lệnh (Instruction Reordering).

```
┌─────────────────┐        ┌─────────────────┐
│ CPU Core A      │        │ CPU Core B      │
│  - Thread 1     │        │  - Thread 2     │
│  - Cache L1/L2  │<--X--> |  - Cache L1/L2  │
└────────┬────────┘        └────────┬────────┘
         │                          │
         ▼ (volatile ép ghi/đọc)    ▼
┌────────────────────────────────────────────┐
│              Main Memory (RAM)             │
└────────────────────────────────────────────┘
```

### b) Đồng bộ hóa: Synchronized vs Locks vs Thread Pool
- **Synchronized**: Cơ chế khóa ngầm định (intrinsic lock/monitor lock) ở cấp ngôn ngữ. Khóa toàn bộ tài nguyên, dễ dùng nhưng kém linh hoạt.
- **Lock API (ReentrantLock)**: Cung cấp các tính năng nâng cao như khóa có Timeout, ngắt luồng đang chờ khóa.
- **Thread Pool (Executors)**: Tái sử dụng các luồng cũ thay vì liên tục khởi tạo luồng mới gây lãng phí bộ nhớ và CPU.

---

## 3. Rủi ro khi lập trình Đa luồng sai cách

1. **Deadlock (Giằng co khóa)**: Xảy ra khi Luồng 1 giữ Khóa A và chờ Khóa B, trong khi Luồng 2 giữ Khóa B và chờ Khóa A. Cả hai luồng sẽ đứng chờ nhau vô hạn.
2. **Race Condition (Xung đột trạng thái)**: Khi nhiều luồng cùng đọc và sửa đổi đồng thời một biến mutable (ví dụ: biến đếm `count++` vốn gồm 3 bước: đọc, cộng 1, ghi đè).
   - *Khắc phục*: Dùng khối `synchronized`, `ReentrantLock` hoặc các lớp nguyên tử `AtomicInteger`.
3. **Pinning trong Virtual Threads**: Xảy ra khi một luồng ảo chạy một khối code `synchronized` hoặc gọi native code (C/C++). Luồng ảo lúc này bị "dán chặt" (pinned) vào luồng vật lý (Carrier Thread) bên dưới, vô hiệu hóa cơ chế không chặn của Loom.
   - *Khắc phục*: Thay thế khối `synchronized` bằng `ReentrantLock` trong các đoạn code I/O.

---

## 4. Code ví dụ minh họa chi tiết

```java
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicInteger;

public class ConcurrencyDemo {

    // 1. Dùng AtomicInteger để chống Race Condition mà không cần lock nặng nề
    private static final AtomicInteger counter = new AtomicInteger(0);

    public static void main(String[] args) throws Exception {
        
        // 2. Sử dụng Thread Pool truyền thống (Executors)
        try (ExecutorService pool = Executors.newFixedThreadPool(2)) {
            for (int i = 0; i < 1000; i++) {
                pool.submit(counter::incrementAndGet);
            }
        } // try-with-resources tự động đóng pool và đợi các task hoàn thành
        System.out.println("Giá trị counter sau Thread Pool: " + counter.get());

        // 3. Lập trình bất đồng bộ không chặn với CompletableFuture
        CompletableFuture<String> futureTask = CompletableFuture.supplyAsync(() -> {
            try { Thread.sleep(1000); } catch (InterruptedException e) {}
            return "Dữ liệu từ API";
        }).thenApply(data -> data + " -> đã xử lý");

        // Nhận kết quả
        System.out.println("CompletableFuture Result: " + futureTask.join());

        // 4. Khởi tạo và chạy Virtual Threads (Java 21+)
        // Tạo luồng ảo chạy ngầm siêu nhẹ
        Thread vThread = Thread.ofVirtual().name("my-virtual-thread").start(() -> {
            System.out.println("Đang chạy trên Virtual Thread: " + Thread.currentThread());
            try {
                // Giả lập cuộc gọi I/O chặn, Virtual Thread sẽ tự động yield
                // giải phóng Carrier Thread vật lý bên dưới cho luồng ảo khác dùng
                Thread.sleep(500); 
            } catch (InterruptedException e) {
                e.printStackTrace();
            }
            System.out.println("Hoàn thành Virtual Thread!");
        });

        vThread.join(); // Chờ Virtual Thread hoàn thành
    }
}
```
