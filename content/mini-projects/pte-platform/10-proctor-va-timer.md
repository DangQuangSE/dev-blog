# PTE Platform — Giám Thị Giám Sát: Proctor & Timer Enforcement

*Bài 10/12 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Attempt đã pin xong, học viên đang làm bài ([bài 9](09-attempt-state-machine.md)). Trong lúc thi diễn ra, 2 việc chạy song song: giám thị giám sát real-time qua WebSocket, và `exam-delivery` tự đếm giờ ở phía server — client chỉ hiển thị, không quyết định gì.

## Timer: deadline tính ở server lúc bắt đầu task, không phụ thuộc callback từ client

```java
/**
 * Server-authoritative timing (client timer is UX only). Both prep and
 * response deadlines are computed at task-start, so enforcement never depends
 * on a client "prep done" callback — a task's response window starts exactly
 * prepSeconds after it began, whether or not the student was ready.
 */
public TimerState startTaskTimer(ExamAttempt attempt, PinnedItemView item, List<PinnedItemView> allItems) {
    ...
    state.setPhase(item.prepSeconds() > 0 ? TimerPhase.PREP : TimerPhase.RESPONSE);
    state.setTaskStartedAt(now);
    state.setPrepDeadline(now.plusSeconds(item.prepSeconds()));
    state.setResponseDeadline(now.plusSeconds((long) item.prepSeconds() + item.responseSeconds()));
    ...
}
```

Đây là lựa chọn thiết kế quan trọng: nếu deadline được tính lại mỗi khi client báo "tôi bấm xong prep", một client bị sửa đổi (hoặc mạng chậm) có thể trì hoãn vô thời hạn. Thay vào đó, `prepDeadline`/`responseDeadline` chốt cứng ngay khi task bắt đầu, dựa hoàn toàn trên đồng hồ server — dù học viên không bấm gì, response window vẫn tự mở đúng giờ. Endpoint client gọi liên tục chỉ để đọc trạng thái, không đổi được nó:

```java
/** Heartbeat poll target for the client's countdown UI (client timer is UX only). */
@GetMapping("/{publicId}/timer")
public ApiResponse<TimerStateResponse> heartbeat(@PathVariable UUID publicId) {
    return ApiResponse.success(attemptService.getTimerState(publicId, currentUser()));
}
```

## Một chi tiết đúng-thật của PTE: Reading section dùng chung 1 đồng hồ

```java
/**
 * Sections in SECTION_SCOPED_SECTIONS (currently only READING, matching the
 * real PTE exam) share a single deadline across every task in the section
 * instead of getting a fresh per-task deadline — computed once, when the
 * first task of the section starts, as the sum of every task's own
 * prepSeconds + responseSeconds in that section's contiguous run.
 */
private static final Set<String> SECTION_SCOPED_SECTIONS = Set.of("READING");
```

Speaking/Writing/Listening mỗi task có deadline riêng — làm xong task này mới sang task sau, đồng hồ reset. Reading thì khác: PTE thật cho học viên tự do di chuyển qua lại giữa các câu hỏi trong section, dùng chung một quỹ thời gian tổng. `sectionBudgetSeconds` cộng dồn `prepSeconds + responseSeconds` của toàn bộ task cùng section ngay khi task đầu tiên của section bắt đầu — các task sau trong cùng section chỉ "thừa kế" lại deadline đã chốt, không tính lại. Đây là chỗ mà hiểu sai nghiệp vụ thi thật (tưởng mọi task đều per-task timer) sẽ ra code sai — nếu không đọc kỹ cách PTE thật vận hành, rất dễ áp nhầm per-task timer cho cả Reading.

## Concurrency thật: giới hạn số lần nghe audio

Với task nghe (`maxPlayCount` từ composition, [bài 8](08-scheduling-va-enrollment.md)), endpoint play audio dùng pessimistic lock — check-rồi-tăng phải atomic, 2 request đồng thời không được cùng "lọt qua" giới hạn:

```java
/** Pessimistic write lock — for the audio-play endpoint's check-and-increment. */
public TimerState getStateWithLock(Long attemptId) {
    return timerStateRepository.findWithLockByAttemptId(attemptId)
            .orElseThrow(() -> new IllegalStateException("No timer state for attempt " + attemptId));
}
```

Không dùng lock ở đây, một double-click hoặc retry mạng có thể khiến học viên nghe được nhiều lần hơn cho phép — nhỏ nhưng đúng loại race condition dễ bị bỏ sót nếu chỉ test happy-path.

## Proctor: WebSocket/STOMP là kênh chính, REST chỉ là fallback

```java
/**
 * The primary command surface. sessions/{sessionPublicId}/open addresses
 * scheduling's exam session (all a client knows before opening); every later
 * frame addresses the resulting ProctorSession's own publicId.
 */
@Controller
public class ProctorStompController {

    @MessageMapping("/sessions/{sessionPublicId}/open")
    @SendToUser("/queue/proctor-session")
    public ProctorSessionResponse open(@DestinationVariable UUID sessionPublicId, Principal principal) { ... }

    @MessageMapping("/proctor-sessions/{proctorSessionPublicId}/commands")
    public void issueCommand(@DestinationVariable UUID proctorSessionPublicId,
                             @Valid @Payload IssueCommandRequest request, Principal principal) { ... }

    @MessageMapping("/proctor-sessions/{proctorSessionPublicId}/violations")
    public void flagViolation(@DestinationVariable UUID proctorSessionPublicId,
                              @Valid @Payload FlagViolationRequest request, Principal principal) { ... }
}
```

`issueCommand` là đường giám thị gửi lệnh force-submit/extend-time sang `exam-delivery` (qua event `ProctorCommand`, đã nhắc ở [ADR-001](02-kien-truc-adr.md)) — REST chỉ tồn tại cho hành động không cần round-trip realtime như `close`. Một chi tiết dễ bị bỏ sót: `@PreAuthorize` **không** enforce trên `@MessageMapping` trong cấu hình STOMP của module này, nên role `PROCTOR` phải tự kiểm tra tay, gom về đúng 1 điểm:

```java
/**
 * @PreAuthorize does not enforce on @MessageMapping methods under this
 * module's STOMP config, so role is checked here explicitly — every
 * handler routes through this one method, so it's the single enforcement
 * point.
 */
private CurrentUser currentUser(Principal principal) {
    if (!(principal instanceof StompPrincipal stompPrincipal)) {
        throw new IllegalStateException("No authenticated STOMP principal");
    }
    CurrentUser currentUser = stompPrincipal.currentUser();
    if (!currentUser.hasRole(ROLE_PROCTOR)) {
        throw new ProctorRoleRequiredException();
    }
    return currentUser;
}
```

Đây là ví dụ thực tế của việc security annotation không tự động phủ mọi transport — Spring Security's method-level `@PreAuthorize` được thiết kế cho request-response HTTP, không áp dụng nguyên xi cho message-driven STOMP handler. Biết giới hạn này và tự bù bằng 1 điểm kiểm tra duy nhất (thay vì rải kiểm tra ở từng handler, dễ quên 1 chỗ) là chủ đích thiết kế, không phải workaround tạm.

## Lệnh giám thị đi trọn vẹn qua event, không bao giờ gọi thẳng

`issueCommand` ở STOMP handler chỉ là lớp vỏ — logic thật nằm ở `ProctorCommandService` phía `proctor`, và nó **không bao giờ gọi HTTP thẳng sang `exam-delivery`**:

```java
/**
 * Issues an attempt-affecting command against exam-delivery — ALWAYS async,
 * via the ProctorCommand outbox event (proctor never calls exam-delivery
 * directly). Broadcasts a confirmation to every proctor watching the same
 * exam session, so a multi-proctor session stays in sync.
 */
@Transactional
public void issueCommand(UUID proctorSessionPublicId, IssueCommandRequest request, CurrentUser caller) {
    ProctorSession session = proctorSessionService.findOwned(proctorSessionPublicId, caller.userId(), caller.tenantId());
    if (!session.isActive()) throw new ProctorSessionNotActiveException();
    if (request.commandType() == ProctorCommandType.EXTEND_TIME
            && (request.extraSeconds() == null || request.extraSeconds() <= 0)) {
        throw new ExtraSecondsRequiredException();
    }

    outboxWriter.write(ProctorConstants.AGGREGATE_PROCTOR_COMMAND, request.attemptPublicId().toString(),
            ProctorConstants.EVENT_PROCTOR_COMMAND,
            new ProctorCommandPublished(request.attemptPublicId(), session.getSessionPublicId(),
                    request.commandType(), request.extraSeconds(), session.getTenantId()),
            session.getTenantId());

    // Đồng thời broadcast xác nhận cho MỌI giám thị khác đang theo dõi cùng session
    messagingTemplate.convertAndSend(ProctorConstants.TOPIC_PREFIX + session.getSessionPublicId(), request);
}
```

Hai việc xảy ra song song: (1) ghi outbox để lệnh tới `exam-delivery` qua RabbitMQ — đúng pattern Transactional Outbox đã nói ở [bài saga](04-event-driven-saga.md), và (2) `convertAndSend` broadcast ngay lập tức qua STOMP topic cho mọi giám thị khác đang mở cùng session — nếu 2 giám thị cùng theo dõi 1 phòng thi, cả hai đều thấy "đã force-submit attempt X" gần như tức thời, không cần chờ round-trip qua `exam-delivery` rồi vòng lại.

Phía nhận, `exam-delivery` tiêu thụ event với đúng ràng buộc ordering đã nhắc ở bài saga (single-queue, concurrency=1):

```java
/**
 * Ordering-sensitive: bound to a SINGLE queue consumed with concurrency=1,
 * so two commands for the same attempt apply in the order proctor issued
 * them.
 */
@RabbitListener(queues = ExamDeliveryConstants.QUEUE_PROCTOR_COMMANDS)
@Transactional
public void onProctorCommand(Message message) {
    UUID eventId = UUID.fromString(message.getMessageProperties().getMessageId());
    if (processedEventRepository.existsById(eventId)) {
        return;   // dedup — event đã xử lý, bỏ qua (at-least-once của RabbitMQ)
    }
    ProctorCommandEvent event = jsonMapper.readValue(payload, ProctorCommandEvent.class);
    applyCommand(event);
    processedEventRepository.save(new ProcessedEvent(eventId));
}
```

Áp lệnh thật sự nằm ở một `ProctorCommandService` **khác** — cùng tên class nhưng thuộc package `exam-delivery`, tách hẳn khỏi `AttemptService` chính:

```java
/**
 * Deliberately separate from AttemptService AND a distinct authorization
 * path: the actor here is a verified proctor command already tenant-scoped
 * by the producer, not the student themselves — no ownership check, only a
 * tenant check. Both methods are silent no-ops if the attempt doesn't exist
 * or isn't IN_PROGRESS — a stale/duplicate/late command is not an error.
 */
@Transactional
public void forceSubmit(UUID attemptPublicId, UUID tenantId) {
    inProgressAttempt(attemptPublicId, tenantId).ifPresent(attempt -> {
        attempt.submit();
        attemptRepository.save(attempt);
        outboxWriter.write(..., new AttemptSubmittedEvent(...));  // kích hoạt tiếp saga nộp bài, y hệt học viên tự nộp
    });
}

@Transactional
public void extendResponseTime(UUID attemptPublicId, UUID tenantId, int extraSeconds) {
    inProgressAttempt(attemptPublicId, tenantId).ifPresent(attempt -> {
        TimerState timer = timerStateRepository.findByAttemptId(attempt.getId()).orElse(null);
        if (timer == null) return;
        timer.setResponseDeadline(timer.getResponseDeadline().plusSeconds(extraSeconds));
        timerStateRepository.save(timer);
    });
}
```

3 quyết định thiết kế đáng chú ý: **(1)** `forceSubmit` không có logic riêng — nó gọi đúng `attempt.submit()` rồi phát `AttemptSubmitted` y hệt học viên tự bấm nộp, nghĩa là toàn bộ saga chấm điểm ở [bài 4](04-event-driven-saga.md) chạy tiếp bình thường, không cần nhánh xử lý riêng cho "bị ép nộp". **(2)** `extendResponseTime` chỉ cộng thêm giây vào `responseDeadline` đã có — không tính lại timer từ đầu, giữ đúng nguyên tắc "deadline chốt cứng lúc task bắt đầu" đã nói ở phần Timer trên, chỉ dịch nó đi. **(3)** Không throw lỗi nếu attempt không còn `IN_PROGRESS` — một lệnh force-submit tới trễ (học viên đã tự nộp trước khi lệnh giám thị kịp xử lý) là tình huống hợp lệ, không phải lỗi hệ thống.

## Audit log tamper-evident: hash chain kiểu blockchain đơn giản

Mỗi vi phạm bị flag không chỉ lưu record — nó **nối vào một chuỗi hash**, để phát hiện được nếu ai đó sửa một dòng audit log sau này:

```java
public String computeHash(UUID sessionPublicId, int sequenceNo, UUID attemptPublicId, ViolationType violationType,
                          String detail, Instant detectedAt, String prevHash) {
    String canonical = String.join("|",
            sessionPublicId.toString(), String.valueOf(sequenceNo), attemptPublicId.toString(),
            violationType.name(), detail == null ? "" : detail, detectedAt.toString(),
            prevHash == null ? "" : prevHash);
    return sha256Hex(canonical);
}
```

Hash của record thứ N phụ thuộc vào **toàn bộ nội dung record đó cộng với hash của record thứ N-1** (`prevHash`). Sửa bất kỳ record cũ nào — dù chỉ đổi 1 ký tự trong `detail` — làm hash của chính nó sai, kéo theo mọi hash phía sau trong chuỗi sai theo, vì mỗi hash sau đều nhúng hash trước. Verify chuỗi không tin cột `hash` lưu sẵn — nó **tính lại từ đầu** và so khớp:

```java
@Transactional
public ViolationEventResponse flag(UUID proctorSessionPublicId, FlagViolationRequest request, CurrentUser caller) {
    ProctorSession session = proctorSessionService.findOwned(proctorSessionPublicId, caller.userId(), caller.tenantId());
    if (!session.isActive()) throw new ProctorSessionNotActiveException();

    int nextSequenceNo = session.getLastSequenceNo() + 1;
    String hash = hashChainService.computeHash(session.getSessionPublicId(), nextSequenceNo,
            request.attemptPublicId(), request.violationType(), request.detail(), Instant.now(), session.getLastHash());
    // ghi ViolationEvent + advance session.lastSequenceNo/lastHash — cùng 1 transaction,
    // không có khoảng hở giữa "đọc head hiện tại" và "ghi head mới"
    ...
}
```

`lastSequenceNo`/`lastHash` (đầu chuỗi hiện tại) đọc và ghi trong cùng transaction với record mới — không có race giữa hai giám thị flag vi phạm gần như đồng thời cùng đọc nhầm một "head" cũ.

## Xem lại audit log: ai được xem của session nào

```java
/** Post-hoc audit review across every proctor who watched a given exam session. */
@RequestMapping("/exam-sessions")
@PreAuthorize("hasAnyRole('PROCTOR','HOST_ADMIN','HOST_AUTHOR')")
public class ViolationAuditController {
    @GetMapping("/{sessionPublicId}/violations")
    public ApiResponse<List<ViolationEventResponse>> listViolations(@PathVariable UUID sessionPublicId) { ... }
}
```

Endpoint này đứng độc lập với `ProctorSessionController` — một session thi có thể có nhiều giám thị theo dõi theo ca, audit log gom theo `sessionPublicId` (id của `scheduling`), không theo từng `ProctorSession` riêng lẻ của từng giám thị. `HOST_ADMIN`/`HOST_AUTHOR` xem được để hậu kiểm, không chỉ giám thị trực tiếp mới xem được việc mình ghi nhận.

---

*Bài tiếp theo: [Học viên nộp bài](11-media-upload.md) — upload audio qua presigned URL, tách binary khỏi transactional API tier.*
