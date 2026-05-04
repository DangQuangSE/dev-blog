# Cấu hình Bất đồng bộ và Thread Pool trong Spring Boot

Trong một ứng dụng Spring Boot hiện đại, việc xử lý các tác vụ tốn thời gian mà không làm gián đoạn luồng chính (Main Thread) là vô cùng quan trọng. Cơ chế `@Async` cung cấp giải pháp cho vấn đề này bằng cách chạy các tác vụ trong một luồng riêng biệt.

## 1. Tại sao cần cấu hình Async Thread Pool?

Mặc định, nếu bạn chỉ sử dụng `@EnableAsync`, Spring sẽ sử dụng một `SimpleAsyncTaskExecutor` (mỗi tác vụ tạo một luồng mới) hoặc một cấu hình mặc định không được tối ưu. Điều này có thể dẫn đến các vấn đề nghiêm trọng:

- **Cạn kiệt tài nguyên**: Tạo quá nhiều luồng có thể làm sập hệ thống (OOM - Out of Memory).
- **Thiếu kiểm soát**: Không thể giới hạn số lượng tác vụ đang chờ xử lý.
- **Khó giám sát**: Các luồng không có tên định danh rõ ràng, khó debug qua log.

Việc định nghĩa một `ThreadPoolTaskExecutor` bean giúp bạn kiểm soát hoàn toàn cách các luồng được tạo ra và quản lý.

## 2. Cấu hình chi tiết `AsyncConfig`

Dưới đây là ví dụ cấu hình một `TaskExecutor` tùy chỉnh cho các tác vụ như gửi Email:

```java
package com.sport_pro_be.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.concurrent.ThreadPoolTaskExecutor;

import java.util.concurrent.Executor;

@Configuration
@EnableAsync
public class AsyncConfig {

    @Bean(name = "taskExecutor")
    public Executor taskExecutor() {
        ThreadPoolTaskExecutor executor = new ThreadPoolTaskExecutor();
        
        // Số luồng cơ bản luôn duy trì trong pool
        executor.setCorePoolSize(5);
        
        // Số luồng tối đa có thể mở rộng
        executor.setMaxPoolSize(20);
        
        // Dung lượng hàng đợi trước khi tạo thêm luồng mới
        executor.setQueueCapacity(500);
        
        // Tiền tố tên luồng để dễ nhận diện trong Log
        executor.setThreadNamePrefix("EmailSender-");
        
        // Khởi tạo executor
        executor.initialize();
        
        return executor;
    }
}
```

## 3. Phân tích các thông số quan trọng

- **`setCorePoolSize(5)`**: Đây là số lượng luồng tối thiểu luôn được giữ trong pool, ngay cả khi chúng đang rảnh rỗi.
- **`setMaxPoolSize(20)`**: Khi hàng đợi đã đầy (`QueueCapacity`), Spring sẽ tạo thêm các luồng mới cho đến khi đạt mức này để xử lý tác vụ quá tải.
- **`setQueueCapacity(500)`**: Khi tất cả các `CorePoolSize` đều bận, các tác vụ mới sẽ được đưa vào hàng đợi này. Chỉ khi hàng đợi đầy thì `MaxPoolSize` mới được huy động.
- **`setThreadNamePrefix("EmailSender-")`**: Giúp bạn biết chính xác luồng nào đang chạy trong log (ví dụ: `EmailSender-1`).

## 4. Cách sử dụng trong Service

Sau khi cấu hình, bạn có thể áp dụng cho các phương thức cần xử lý ngầm:

```java
@Service
public class EmailService {

    @Async("taskExecutor")
    public void sendEmail(String recipient) {
        // Tác vụ gửi email tốn thời gian
        System.out.println("Đang gửi email tới: " + recipient + " bằng luồng " + Thread.currentThread().getName());
    }
}
```

## 5. Những lưu ý quan trọng (Best Practices)

1.  **Cơ chế Proxy**: Phương thức đánh dấu `@Async` phải được gọi từ một Bean khác. Nếu gọi method `@Async` từ bên trong cùng một Class, nó sẽ không hoạt động vì Spring không thể can thiệp qua Proxy.
2.  **Giá trị trả về**:
    - Nếu không quan tâm kết quả: Trả về `void`.
    - Nếu cần kết quả: Sử dụng `CompletableFuture<T>`.
3.  **Xử lý ngoại lệ**: Đối với phương thức `void`, các exception sẽ không được ném ra Main Thread. Bạn nên cấu hình `AsyncUncaughtExceptionHandler`.
4.  **Shutdown**: `ThreadPoolTaskExecutor` của Spring sẽ tự động đóng khi ứng dụng tắt, đảm bảo các tác vụ đang chạy được hoàn tất một cách an toàn.
