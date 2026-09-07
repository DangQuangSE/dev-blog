# PTE Platform — Notification: Fan-Out Khi Có Sự Kiện

*Bài 13/14 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

`notification` không có actor người dùng nào gọi trực tiếp để "gửi thông báo" — nó thuần túy là một **consumer**, lắng nghe sự kiện từ các service khác rồi tự quyết định ai cần biết. Bài 1 liệt kê nó với 1 dòng "fan-out consumer" — bài này mở ra cơ chế thật.

## Vấn đề trước tiên: `notification` không có quyền hỏi thẳng `iam` "email của user này là gì?"

Đúng nguyên tắc "zero outbound sync call" áp dụng rộng hơn `exam-delivery` — `notification` cũng không gọi đồng bộ sang service khác để lấy thông tin nó cần. Thay vào đó, nó **tự xây một bản sao thư mục email cục bộ**, cập nhật liên tục từ event `UserCreated` mà `iam` đã phát ở [bài 6](06-admin-va-iam.md):

```java
/**
 * Builds notification's local email directory from iam's UserCreated — the
 * intended consumer per UserCreatedEvent's own javadoc in iam. Never a sync
 * call to iam. Idempotent: dedups by the producer's outbox row id.
 */
@RabbitListener(queues = NotificationConstants.QUEUE_USER_EVENTS, containerFactory = "eventBackboneListenerContainerFactory")
@Transactional
public void onUserEvent(Message message) {
    UUID eventId = UUID.fromString(message.getMessageProperties().getMessageId());
    if (processedEventRepository.existsById(eventId)) return;

    String eventType = headerValue(message.getMessageProperties(), NotificationConstants.EVENT_TYPE_HEADER);
    if (NotificationConstants.INCOMING_EVENT_USER_CREATED.equals(eventType)) {
        upsertDirectoryEntry(new String(message.getBody(), StandardCharsets.UTF_8));
    }
    // UserSuspended và mọi event type tương lai trên queue này: không phải việc của consumer này, bỏ qua.
    processedEventRepository.save(new ProcessedEvent(eventId));
}
```

Đây là bản chất thật của "mỗi service tự trị dữ liệu" (ADR-001) đi đến tận cùng: `notification` không "mượn" dữ liệu của `iam` qua API call mỗi lần cần — nó **sở hữu bản sao riêng**, luôn có sẵn cục bộ, chấp nhận độ trễ nhỏ (eventual consistency) để đổi lấy việc không bao giờ bị chặn bởi `iam` sập hay chậm. Một `UserDirectoryEntry` chưa kịp đồng bộ (user vừa tạo, event chưa tới) là "khoảng hở cross-topic ordering đã biết" — không phải lỗi, hệ thống chấp nhận silently skip trong trường hợp đó thay vì làm fail cả consumer.

## 3 consumer khác nhau, mỗi loại sự kiện resolve người nhận theo cách riêng

`NotificationDispatchService` dùng chung cho cả 3, nhưng cách **tìm ai là người nhận** khác nhau hoàn toàn tùy loại sự kiện:

```java
/**
 * Shared by all 3 event-triggered consumers: resolves the recipient's email
 * from the local UserDirectoryEntry directory, records a NotificationLog
 * row, and enqueues the actual send (never sends inline).
 */
@Transactional
public void dispatchTo(NotificationType type, UserDirectoryEntry entry, UUID tenantId, String subject, String body) {
    NotificationLog log = new NotificationLog();
    log.setRecipientUserPublicId(entry.getUserPublicId());
    log.setRecipientEmail(entry.getEmail());
    ...
    NotificationLog saved = notificationLogRepository.save(log);
    rabbitTemplate.convertAndSend(NotificationConstants.EMAIL_EXCHANGE, NotificationConstants.EMAIL_ROUTING_KEY,
            new EmailJob(saved.getPublicId(), entry.getEmail(), subject, body));
}
```

`StudentEnrolled` (từ [bài 8](08-scheduling-va-enrollment.md)) và `AttemptPublished` (từ [bài 12](12-scoring-review-va-reporting.md)) đều có sẵn đúng 1 người nhận trong payload — resolve thẳng qua directory rồi gửi. `ViolationDetected` (từ [bài 10](10-proctor-va-timer.md)) thì khác hẳn — sự kiện chỉ mang `tenantId`/`attemptPublicId`, không có "người nhận" cụ thể nào, vì bản chất nghiệp vụ là **mọi quản trị viên của tổ chức đó cần biết**:

```java
/**
 * ViolationDetectedEvent carries no specific recipient — fans out to every
 * HOST_ADMIN in that tenant instead of a single resolved student, unlike
 * the other two event-triggered consumers.
 */
private void notifyHostAdmins(String payload) {
    ViolationDetectedEvent event = jsonMapper.readValue(payload, ViolationDetectedEvent.class);
    String subject = "Violation flagged: " + event.violationType();
    String body = "A proctor flagged attempt " + event.attemptPublicId() + " in session " + event.sessionPublicId()
            + " for " + event.violationType() + ...;

    for (UserDirectoryEntry hostAdmin : userDirectoryRepository
            .findByTenantIdAndRolesContaining(event.tenantId(), NotificationConstants.ROLE_HOST_ADMIN)) {
        dispatchService.dispatchTo(NotificationType.VIOLATION_DETECTED, hostAdmin, event.tenantId(), subject, body);
    }
}
```

Một event, N notification — số lượng bản ghi `NotificationLog` và `EmailJob` sinh ra tùy thuộc số `HOST_ADMIN` đang có trong tenant đó tại thời điểm xử lý. Đây là lý do tên bài này gọi đúng bản chất "fan-out", không phải "gửi thông báo" đơn thuần.

## Ghi log trước, gửi thật sau — không bao giờ gửi email inline trong consumer

`dispatchTo` không tự gọi SMTP — nó ghi `NotificationLog` (trạng thái `PENDING`) rồi đẩy `EmailJob` vào work queue, y hệt cấu trúc dispatcher/worker đã thấy ở [phần AI scoring](12-scoring-review-va-reporting.md#dispatcher--work-queue--worker-cơ-chế-retrybackoffdlq-thật-không-chỉ-là-lời-hứa) phía trên. Một `EmailWorker` riêng tiêu thụ:

```java
/**
 * Consumes EmailJob from the RabbitMQ work queue and sends via
 * JavaMailSender (real SMTP, against Mailpit — no vendor stub needed here).
 * Any exception propagates to the container's retry advice — bounded retry
 * with backoff, then dead-lettered; onDeadLettered marks the row FAILED so
 * a host sees it, instead of it silently vanishing into the DLQ.
 */
@RabbitListener(queues = NotificationConstants.EMAIL_QUEUE, containerFactory = "rabbitListenerContainerFactory")
@Transactional
public void onEmailJob(EmailJob job) {
    NotificationLog log = ...;
    if (log.getStatus() != NotificationStatus.PENDING) return;   // Đã terminal — redelivery no-op

    sendEmail(job);
    log.markSent();
    notificationLogRepository.save(log);
}

@RabbitListener(queues = NotificationConstants.EMAIL_DLQ, containerFactory = "rabbitListenerContainerFactory")
@Transactional
public void onDeadLettered(EmailJob job) {
    notificationLogRepository.findByPublicId(job.notificationLogPublicId()).ifPresent(log -> {
        if (log.getStatus() == NotificationStatus.PENDING) {
            log.markFailed();
            notificationLogRepository.save(log);
        }
    });
}
```

Cùng khuôn mẫu retry/backoff/DLQ đã thấy ở AI scoring worker — không phải trùng hợp, đây là pattern chuẩn hoá cho **mọi thao tác gọi ra hệ thống ngoài không đáng tin cậy** trong toàn bộ platform (gọi AI vendor, gọi SMTP server) — cùng công thức: dispatch ghi trạng thái `PENDING` trước, worker riêng xử lý có retry, thất bại hẳn thì set trạng thái lỗi cho con người thấy, không bao giờ để lỗi biến mất âm thầm trong hàng đợi chết.

**Vì sao không gửi email ngay trong consumer đang xử lý `ViolationDetected`?** Vì SMTP là một lời gọi mạng không đáng tin cậy — nếu gửi inline, một SMTP server chậm hoặc down sẽ giữ transaction của consumer mở kéo dài, chặn cả việc xử lý event tiếp theo trong queue. Tách hẳn thành 2 bước (ghi log nhanh + queue riêng gửi thật) giữ cho consumer chính luôn nhanh và không phụ thuộc độ tin cậy của bên thứ ba.

## Đọc lại lịch sử: host chỉ xem thông báo của tenant mình

```java
@RequestMapping("/notifications")
@PreAuthorize("hasAnyRole('HOST_ADMIN','HOST_AUTHOR')")
public class NotificationLogController {
    @GetMapping
    public ApiResponse<List<NotificationLogResponse>> list() {
        return ApiResponse.success(notificationLogService.list(currentUser()));
    }
}
```

Endpoint duy nhất của `notification` dành cho người dùng thật (không phải consumer) — cho host xem lại toàn bộ thông báo hệ thống đã gửi liên quan tới tenant mình, hữu ích để xác minh "học viên có thực sự nhận được email báo điểm không" khi có khiếu nại.

---

*Bài tiếp theo: [Internal Service-to-Service API](14-internal-service-api.md) — cơ chế xác thực và ranh giới riêng cho các cuộc gọi giữa service, tách hẳn khỏi API người dùng.*
