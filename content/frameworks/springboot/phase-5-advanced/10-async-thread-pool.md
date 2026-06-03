# [10] Phase 5 - Advanced: Lập trình bất đồng bộ & Thread Pool

## 1. Nguồn gốc và lý do ra đời của Lập trình Bất đồng bộ trong Spring Boot

### Sự lãng phí CPU của mô hình đồng bộ (Synchronous Blocking)
Mặc định, mọi request gửi tới Controller của Spring Boot được xử lý tuần tự bởi một luồng (Thread) duy nhất thuộc Web Server (Tomcat):
- **Vấn đề**: Nếu trong luồng xử lý đó, ứng dụng cần thực hiện một tác vụ phụ tốn thời gian (như gửi email chúc mừng, gửi mã OTP, gọi sang API của bên thứ ba để đối soát). Luồng xử lý chính sẽ bị **chặn (blocking)**, đứng chờ cho đến khi tác vụ phụ kết thúc mới trả về response cho client.
- Việc này làm tăng đáng kể thời gian phản hồi (Response Time) của API, lãng phí thời gian CPU của Server và làm giảm khả năng chịu tải của hệ thống.

### Giải pháp: Lập trình Bất đồng bộ (`@Async`)
Spring cung cấp Annotation **`@Async`** để giải quyết bài toán này:
- Khi một phương thức được đánh dấu `@Async`, Spring sẽ chặn lời gọi hàm đó và chuyển giao nó cho một luồng khác thuộc một **Thread Pool** quản lý chạy ngầm song song.
- Luồng chính của request lập tức kết thúc và trả về kết quả thành công cho client, nâng cao trải nghiệm người dùng tối đa.

---

## 2. Bản chất các thông số cấu hình ThreadPoolTaskExecutor

Để chạy `@Async` an toàn, bạn bắt buộc phải định cấu hình một **`ThreadPoolTaskExecutor`** rõ ràng thay vì dùng mặc định:

1. **`CorePoolSize` (Số luồng cốt lõi)**: Số lượng luồng tối thiểu luôn được duy trì hoạt động trong pool, sẵn sàng nhận nhiệm vụ.
2. **`QueueCapacity` (Sức chứa của hàng đợi)**: Khi toàn bộ các luồng cốt lõi đều bận, các task mới gửi tới sẽ được đưa vào hàng đợi này nằm chờ.
3. **`MaxPoolSize` (Số luồng tối đa)**: Khi hàng đợi đầy, Spring sẽ tạo thêm các luồng mới vượt quá số luồng cốt lõi để giải quyết công việc, tối đa bằng `MaxPoolSize`.
4. **`RejectedExecutionHandler` (Chính sách từ chối)**: Định nghĩa hành vi khi cả hàng đợi và luồng tối đa đều bị quá tải:
   - **`AbortPolicy` (Mặc định)**: Từ chối chạy và ném ra ngoại lệ `RejectedExecutionException`.
   - **`CallerRunsPolicy`**: Đẩy ngược tác vụ đó bắt buộc chạy trực tiếp trên luồng của client gửi request (Thread chính), giúp giảm tải độ dồn của hệ thống.

---

## 3. Rủi ro sập RAM khi dùng cấu hình mặc định

1. **Lỗi OutOfMemoryError (OOM) do SimpleAsyncTaskExecutor**: Nếu bạn chỉ viết `@Async` mà không cấu hình Custom Executor Bean. Spring Boot mặc định sử dụng **`SimpleAsyncTaskExecutor`**.
   - *Rủi ro*: Bộ thực thi này không tái sử dụng luồng. Với mỗi request, nó sẽ **khởi tạo một Thread mới hoàn toàn**. Nếu có 10,000 request chèn cùng lúc, JVM sẽ tạo 10,000 thread vật lý làm sập bộ nhớ RAM của Server lập tức.
2. **Hàng đợi không giới hạn (Unbounded Queue)**: Đặt `queueCapacity` mặc định của `LinkedBlockingQueue` là vô hạn (`Integer.MAX_VALUE`). Hàng đợi sẽ phình to chứa hàng triệu task chờ xử lý, chiếm dụng toàn bộ RAM và gây crash sập ứng dụng.

---

## 4. Code ví dụ minh họa chi tiết

### a) Cấu hình Thread Pool Executor tùy chỉnh
```java
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;
import java.util.concurrent.Executor;
import java.util.concurrent.ThreadPoolExecutor;

@Configuration
@EnableAsync // Kích hoạt tính năng chạy bất đồng bộ Async của Spring
public class AsyncConfig {

    @Bean(name = "mailExecutor")
    public Executor mailExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        executor.setCorePoolSize(5);        // 5 luồng cốt lõi luôn chạy
        executor.setQueueCapacity(100);     // Hàng đợi chứa tối đa 100 task chờ
        executor.setMaxPoolSize(15);        // Tối đa nâng lên 15 luồng khi hàng đợi đầy
        executor.setThreadNamePrefix("MailThread-"); // Tiền tố tên luồng dễ debug log
        
        // Cấu hình chính sách CallerRunsPolicy để bảo vệ hệ thống khi quá tải
        executor.setRejectedExecutionHandler(new ThreadPoolExecutor.CallerRunsPolicy());
        executor.initialize();
        return executor;
    }
}
```

### b) Viết Service xử lý tác vụ gửi email ngầm bất đồng bộ
```java
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Service
public class NotificationService {

    // Chỉ định rõ bean Executor được sử dụng
    @Async("mailExecutor")
    public void sendWelcomeEmail(String email) {
        System.out.println("Bắt đầu gửi email ngầm trên luồng: " + Thread.currentThread().getName());
        try {
            // Giả lập cuộc gọi mạng gửi email tốn 2 giây
            Thread.sleep(2000);
        } catch (InterruptedException e) {
            e.printStackTrace();
        }
        System.out.println("Gửi email thành công tới: " + email);
    }
}
```
