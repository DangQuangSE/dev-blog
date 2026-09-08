# PTE Platform — Host Tổ Chức Thi: Scheduling & Enrollment

*Bài 8/12 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Có đề (snapshot đã publish, [bài 7](07-authoring-va-task-type.md)) chưa đủ để học viên vào thi — cần một `ExamSession` xác định *đề nào*, *ai được vào*, *khi nào*, và *chấm những phần nào*. `scheduling` là service đứng giữa `authoring` và `exam-delivery`, và cũng là nơi phát 2 command host-facing đã nhắc ở [bài saga](04-event-driven-saga.md).

## Tạo session, gắn với 1 snapshot cụ thể

```java
@RequestMapping("/sessions")
@PreAuthorize("hasAnyRole('HOST_ADMIN','HOST_AUTHOR')")
public class SessionController {
    @PostMapping
    public ApiResponse<SessionResponse> create(@Valid @RequestBody CreateSessionRequest request) { ... }

    @PostMapping("/{publicId}/open")
    public ApiResponse<SessionResponse> open(@PathVariable UUID publicId) { ... }

    @PostMapping("/{publicId}/close")
    public ApiResponse<SessionResponse> close(@PathVariable UUID publicId) { ... }
}
```

Session tham chiếu `snapshotPublicId` — chỉ UUID phẳng, đúng quy tắc ADR-004 "không JPA relationship xuyên service boundary" đã nói ở [bài kiến trúc](02-kien-truc-adr.md). Session có vòng đời riêng (`open`/`close`) tách khỏi vòng đời snapshot (bất biến, không đổi) — đúng lý do ADR-001 tách `scheduling` khỏi `authoring`: "nội dung bất biến vs. sự kiện thi có thời gian".

## Composition: cơ chế full-mock vs practice-subset

Đây là chỗ hiện thực hóa khái niệm "practice subset" nhắc ở [bài tổng quan](01-tong-quan.md) — một session không bắt buộc dùng toàn bộ task type trong snapshot, host chọn tập con:

```java
@Transactional
public SessionResponse setComposition(UUID sessionPublicId, SetCompositionRequest request, CurrentUser caller) {
    ExamSession session = sessionService.findOwned(sessionPublicId, caller);
    Set<String> availableTaskTypes = availableTaskTypes(session.getSnapshotPublicId());

    session.getComposition().clear();
    request.items().forEach(item -> {
        if (!availableTaskTypes.contains(item.taskType())) {
            throw new TaskTypeNotInSnapshotException();
        }
        session.addCompositionItem(toEntity(item));
    });
    return SessionMapper.toResponse(session);
}
```

Ràng buộc quan trọng: **mọi task type trong composition phải tồn tại thật trong snapshot đã pin** — không thể "bịa" một task type mà đề gốc không có. `CompositionItem` còn mang `timingOverrideSeconds`/`maxPlayCount` riêng cho từng session — cùng 1 snapshot có thể dùng cho nhiều session với thời gian làm bài hoặc số lần nghe khác nhau (session luyện tập cho phép nghe lại nhiều hơn session thi thử sát thật, ví dụ).

## Khóa bi quan để `open()` và sửa policy không đá nhau

```java
/**
 * Takes the same pessimistic row lock as patchPolicy, so a host patching the
 * policy and a concurrent open() cannot interleave — one blocks until the
 * other's transaction commits.
 */
@Transactional
public SessionResponse open(UUID publicId, CurrentUser caller) {
    ExamSession session = sessionRepository.findWithLockByPublicIdAndTenantId(publicId, requireTenant(caller))
            .orElseThrow(SessionNotFoundException::new);
    session.open();
    return SessionMapper.toResponse(session);
}

/**
 * Partial update: only fields present (non-null) in request change.
 * Hard-rejected once the session has passed the pre-open (SCHEDULED) state
 * — this is the lock point, never attempt count.
 */
@Transactional
public ExamPolicyResponse patchPolicy(UUID publicId, PatchExamPolicyRequest request, CurrentUser caller) {
    ExamSession session = sessionRepository.findWithLockByPublicIdAndTenantId(publicId, requireTenant(caller))
            .orElseThrow(SessionNotFoundException::new);
    if (session.getStatus() != SessionStatus.SCHEDULED) {
        throw new PolicyLockedException();
    }
    ExamPolicy policy = session.getPolicy();
    if (request.replayPolicyType() != null) { ... }          // chỉ field có mặt mới đổi
    if (request.deviceCheckRequired() != null) { ... }
    if (request.answerIntegrityLevel() != null) { ... }       // chính field STRICT/STANDARD ở bài 3
    return SessionMapper.toPolicy(policy);
}
```

Hai thao tác này cùng lấy 1 pessimistic row lock trên `ExamSession` — nếu không, một host vừa bấm "mở session" vừa một host (hoặc chính người đó, 2 tab) đồng thời sửa `answerIntegrityLevel` có thể tạo ra kết quả không xác định: session mở với policy cũ trong khi request patch tưởng mình đã set policy mới trước khi mở. Khóa chung đảm bảo 2 thao tác này luôn tuần tự hóa với nhau. Điểm khóa nghiệp vụ (`PolicyLockedException` khi session đã qua trạng thái `SCHEDULED`) cố tình chọn **trạng thái**, không phải "đã có học viên nộp bài chưa" — đơn giản và dự đoán được hơn.

## Enrollment: dựa vào ràng buộc unique của DB, không phải check-rồi-ghi

```java
/**
 * Double-enroll/assign is guarded by a DB unique constraint, not a
 * check-then-act race.
 */
private Enrollment save(Enrollment enrollment) {
    try {
        return enrollmentRepository.save(enrollment);
    } catch (DataIntegrityViolationException ex) {
        throw new AlreadyEnrolledException();
    }
}
```

Thay vì `if (existsBySessionAndStudent()) throw ...` rồi mới `save()` — luôn có khe hở giữa check và write cho 2 request đồng thời cùng lọt qua check — code ở đây cứ ghi thẳng, để DB (unique constraint trên `(session_id, student_public_id)`) tự chặn nếu trùng, rồi bắt exception tương ứng. Đúng nguyên tắc "database is the source of truth for uniqueness", không phải application code đoán trước.

`bulkEnroll` áp cùng nguyên tắc ở quy mô lớn hơn — dedup 2 lớp trước khi ghi (đã tồn tại trong DB + trùng ngay trong chính request), rồi vẫn giữ `try/catch DataIntegrityViolationException` cho phần còn sót (race hiếm: 2 request bulk-enroll cùng lúc chứa cùng học viên):

```java
List<UUID> existing = enrollmentRepository.findBySessionIdAndStudentPublicIdIn(...);
Set<UUID> alreadyEnrolled = new HashSet<>(existing);
...
for (UUID studentPublicId : request.studentPublicIds()) {
    if (alreadyEnrolled.contains(studentPublicId) || !seenInBatch.add(studentPublicId)) {
        continue;   // đã có sẵn hoặc trùng trong chính request — không phải lỗi, chỉ báo lại
    }
    toCreate.add(...);
}
try {
    saved = enrollmentRepository.saveAll(toCreate);
} catch (DataIntegrityViolationException ex) {
    throw new AlreadyEnrolledException();
}
return new BulkEnrollResponse(enrolled, List.copyOf(alreadyEnrolled));  // báo rõ ai mới thêm, ai đã có sẵn
```

Response trả về tách bạch "vừa thêm" và "đã có từ trước" — import một danh sách lớp học có vài học viên đã enroll từ lần import trước không làm hỏng cả thao tác, cũng không âm thầm bỏ qua mà không báo.

## Entitlement: cú gọi sync duy nhất được phép vào `exam-delivery`

ADR-001 chỉ cho phép đúng 1 lần gọi đồng bộ vào lúc tạo attempt — đây chính là nó, và nó nằm ở phía `scheduling` chứ không phải `exam-delivery` tự quyết:

```java
/**
 * Backs exam-delivery's attempt-create pull; checkProctorAssignment backs
 * proctor's session-open call — same shape, different actor.
 */
@Transactional(readOnly = true)
public EntitlementResponse checkEntitlement(UUID sessionPublicId, UUID studentPublicId) {
    ExamSession session = sessionRepository.findWithCompositionByPublicId(sessionPublicId)
            .orElseThrow(NotEntitledException::new);
    if (session.getStatus() != SessionStatus.OPEN) {
        throw new NotEntitledException();
    }
    if (!enrollmentRepository.existsBySessionIdAndStudentPublicId(session.getId(), studentPublicId)) {
        throw new NotEntitledException();
    }
    List<CompositionItemResponse> composition = session.getComposition().stream()
            .map(SessionMapper::toItem).toList();
    return new EntitlementResponse(session.getPublicId(), session.getSnapshotPublicId(), session.getTenantId(),
            session.getOpensAt(), session.getClosesAt(), SessionMapper.toPolicy(session.getPolicy()), composition);
}
```

3 điều kiện gộp lại thành một câu trả lời duy nhất, atomic: session đang `OPEN`, học viên có enrollment hợp lệ, và composition đúng của session đó. `exam-delivery` gọi endpoint này **đúng 1 lần** lúc học viên bấm bắt đầu — nhận về đủ thông tin để tự pin snapshot + composition + policy, rồi không bao giờ gọi lại `scheduling` nữa trong suốt phiên làm bài. `checkProctorAssignment` dùng chung pattern này cho phía giám thị — cùng hình dạng service-to-service, khác actor gọi.

## Enrollment: ai được vào session

```java
@RequestMapping("/sessions/{sessionPublicId}/enrollments")
@PreAuthorize("hasAnyRole('HOST_ADMIN','HOST_AUTHOR')")
public class EnrollmentController {
    @PostMapping
    public ApiResponse<EnrollmentResponse> enroll(...) { ... }

    @PostMapping("/bulk")
    public ApiResponse<BulkEnrollResponse> bulkEnroll(...) { ... }

    @DeleteMapping("/{enrollmentPublicId}")
    @PreAuthorize("hasRole('HOST_ADMIN')")
    public ApiResponse<Void> unenroll(...) { ... }
}
```

`bulkEnroll` tách riêng khỏi `enroll` đơn — enroll hàng loạt học viên (import danh sách lớp) là thao tác khác hẳn về khối lượng dữ liệu và cách xử lý lỗi từng phần tử (một học viên trong danh sách lỗi không nên chặn cả batch). `unenroll` siết chặt hơn — chỉ `HOST_ADMIN`, không cho `HOST_AUTHOR` — gỡ một học viên khỏi kỳ thi là hành động nhạy cảm hơn thêm vào.

## Phân giám thị: nested resource, không phải field trên session

```java
@RequestMapping("/sessions/{sessionPublicId}/proctors")
@PreAuthorize("hasRole('HOST_ADMIN')")
public class ProctorAssignmentController {
    @PostMapping
    public ApiResponse<ProctorAssignmentResponse> assign(...) { ... }

    @PatchMapping("/{assignmentPublicId}")
    public ApiResponse<ProctorAssignmentResponse> updateRole(...) { ... }
}
```

Toàn bộ endpoint khóa `HOST_ADMIN` (không có `HOST_AUTHOR`) — phân công giám thị là quyết định vận hành, không phải soạn nội dung. `updateRole` cho phép đổi vai trò giám thị (chính/phụ) sau khi đã gán, không cần gỡ-gán-lại.

## 2 command host-facing: chốt lại vì sao chúng nằm ở đây, không phải ở `scoring`

```java
/** Host command: trigger scoring for every submitted attempt in this session (host-gated, ADR-002). */
@PostMapping("/{publicId}/score")
@PreAuthorize("hasRole('HOST_ADMIN')")
public ApiResponse<Void> requestScoring(@PathVariable UUID publicId) {
    hostCommandService.requestScoring(publicId, currentUser());
    return ApiResponse.success(null);
}
```

Đã đi sâu flow đầy đủ ở [bài event-driven saga](04-event-driven-saga.md) — điểm đáng nhắc lại ở đây: `SessionController` (thuộc `scheduling`, service host tương tác trực tiếp) phát ra command, `scoring` chỉ tiêu thụ. Việc đặt endpoint host-facing tại `scheduling` thay vì `scoring` giữ đúng ranh giới ADR-001: `scoring` là service **thực thi**, không phải service **ra quyết định** — quyết định "chấm khi nào, publish khi nào" luôn thuộc phía có tương tác con người (host qua `scheduling`), không lẫn vào service assessment thuần túy.

Bên trong, `HostCommandService` — nơi 2 endpoint này thực sự gọi tới — ngắn gọn đến bất ngờ, và chính sự ngắn gọn đó là điểm đáng nói:

```java
/**
 * Origin of the host-gated scoring/publish commands. scheduling DECIDES when
 * to trigger these — scoring/reporting only EXECUTE on command, they never
 * self-trigger on submission. This is the host-facing side of the
 * host-gated scoring model.
 */
@Service
public class HostCommandService {

    @Transactional
    public void requestScoring(UUID sessionPublicId, CurrentUser caller) {
        ExamSession session = sessionService.findOwned(sessionPublicId, caller);   // xác nhận đúng tenant trước tiên
        outboxWriter.write(SchedulingConstants.AGGREGATE_SESSION, session.getPublicId().toString(),
                SchedulingConstants.EVENT_SCORING_REQUESTED,
                new ScoringRequestedEvent(session.getPublicId(), session.getTenantId()),
                session.getTenantId());
    }

    @Transactional
    public void requestPublish(UUID sessionPublicId, CurrentUser caller) {
        ExamSession session = sessionService.findOwned(sessionPublicId, caller);
        outboxWriter.write(SchedulingConstants.AGGREGATE_SESSION, session.getPublicId().toString(),
                SchedulingConstants.EVENT_PUBLISH_REQUESTED,
                new PublishRequestedEvent(session.getPublicId(), session.getTenantId()),
                session.getTenantId());
    }
}
```

Không có logic nghiệp vụ phức tạp nào ở đây — `HostCommandService` chỉ xác nhận session thuộc đúng tenant của host gọi (`findOwned`), rồi ghi outbox. **Toàn bộ độ phức tạp thật sự** (fan-out `ScoringJob`, gọi AI vendor, retry/backoff/DLQ, cổng review) nằm ở phía tiêu thụ event bên `scoring` — đã mổ xẻ chi tiết ở [bài 12](12-scoring-review-va-reporting.md). Đây là minh chứng rõ cho việc tách "ra lệnh" khỏi "thực thi": bên ra lệnh không cần biết gì về cách lệnh được thực thi, chỉ cần phát đúng sự kiện với đúng ngữ nghĩa.

---

*Bài tiếp theo: [Học viên làm bài — Attempt State Machine](09-attempt-state-machine.md) — nơi entitlement vừa nói ở trên được pin thành snapshot tự thân, và toàn bộ vòng đời một attempt.*
