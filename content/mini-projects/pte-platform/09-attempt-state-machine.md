# PTE Platform — Học Viên Làm Bài: Attempt State Machine

*Bài 9/12 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Mọi bài trước đều nhắc tới `exam-delivery` như "critical path" — service cần bảo vệ nhất, tự chủ tuyệt đối lúc thi, zero outbound sync call. Bài này mới thực sự mở `AttemptService` — nơi hiện thực hóa toàn bộ những tuyên bố kiến trúc đó thành code, và là nơi [mã hóa đáp án](03-ma-hoa-dap-an.md), [timer](10-proctor-va-timer.md), [media](11-media-upload.md) đều cắm vào.

## State machine: 3 trạng thái ở đây, phần còn lại thuộc service khác

```java
/**
 * The attempt state machine: CREATED → IN_PROGRESS → SUBMITTED (SCORING/
 * SCORED/PUBLISHED are driven by events from later phases, out of scope
 * here). Once startAttempt returns, nothing in this class calls out to
 * authoring/scheduling again — every method after that operates purely on
 * this service's own pinned data.
 */
@Service
public class AttemptService {
```

`exam-delivery` chỉ sở hữu 3/6 trạng thái của vòng đời attempt (`CREATED → IN_PROGRESS → SUBMITTED`) — `SCORING/SCORED/PUBLISHED` thuộc về `scoring`/`reporting` đã nói ở [bài 12](12-scoring-review-va-reporting.md). Ranh giới này không phải tình cờ: đúng nguyên tắc ADR-001 "control plane/service khác không nằm trên critical runtime path" — `AttemptService` không cần biết gì về chấm điểm để hoàn thành trách nhiệm của nó.

## Pin: cú gọi sync DUY NHẤT, sau đó tự chủ hoàn toàn

Đây là nơi lời hứa "zero outbound sync call lúc thi" trở thành code thật. `SnapshotPinService.pin()` gọi ra ngoài đúng 1 lần — gom entitlement (từ [`scheduling`](08-scheduling-va-enrollment.md)) và nội dung đầy đủ (từ [`authoring`](07-authoring-va-task-type.md)) — rồi deep-copy tất cả vào một `PinnedExamSnapshot` tự thân:

```java
/**
 * Orchestrates the ONE guarded attempt-create pull: scheduling for
 * entitlement+composition, authoring for full snapshot content — then
 * deep-copies the result into a self-contained PinnedExamSnapshot. After
 * this returns, exam-delivery never calls out again for this attempt.
 */
public PinnedExamSnapshot pin(ExamAttempt attempt, UUID sessionPublicId, UUID studentPublicId) {
    SchedulingEntitlementResponse entitlement = schedulingClient.checkEntitlement(sessionPublicId, studentPublicId);
    if (entitlement == null || entitlement.policy() == null || ...) {
        throw new EntitlementCheckFailedException();
    }
    AuthoringSnapshotContentResponse content = authoringClient.fetchContent(entitlement.snapshotPublicId());
    if (content == null) throw new SnapshotContentFetchFailedException();

    PinnedExamSnapshot pinned = new PinnedExamSnapshot();
    pinned.setAnswerIntegrityLevel(entitlement.policy().answerIntegrityLevel());  // STRICT/STANDARD, khóa cứng từ đây
    ...
    content.items().stream()
            .filter(item -> includedTaskTypes.contains(item.taskType()))   // chỉ pin đúng composition đã chọn ở bài 8
            .sorted(Comparator.comparingInt(AuthoringSnapshotContentResponse.Item::orderIndex))
            .forEach(item -> pinned.addItem(toPinnedItem(item, ...)));
    return pinned;
}
```

Mọi audio/ảnh cần cho bài thi được **presign ngay tại thời điểm pin**, không phải lúc học viên chạm tới từng câu — nếu không, mỗi lần chuyển task sẽ phải gọi `media` giữa lúc đang thi, vi phạm đúng nguyên tắc zero-outbound-call:

```java
if (LISTENING_SECTION.equals(source.section())) {
    // LISTENING's audioPromptRef is mandatory — a listening item with none is
    // an authoring data problem, not a client error, and must keep failing loudly.
    if (source.audioPromptRef() == null) throw new MissingAudioPromptException();
    audioDurationSeconds = resolveAudioUrl(item, source.audioPromptRef(), audioUrlTtlSeconds, tenantId);
}
```

Ghi chú "fail loudly" ở đây đáng chú ý: thiếu audio cho câu Listening không được coi là lỗi input của học viên (không có gì để validate từ phía họ) — nó là **dữ liệu đề bị hỏng** ở khâu authoring, và hệ thống thà chặn cứng lúc pin còn hơn để học viên vào giữa bài rồi kẹt ở một câu không phát được âm thanh.

## Thời gian prep tính động từ độ dài audio thật, không phải số cấu hình cứng

```java
// timing.preListenSeconds() being non-null IS the signal that this task type
// computes prep dynamically from real audio duration instead of the static
// timing.prepSeconds() fallback.
if (timing.preListenSeconds() != null) {
    if (audioDurationSeconds == null) throw new MissingAudioDurationException();
    item.setPrepSeconds(timing.preListenSeconds() + audioDurationSeconds + timing.preRecordSeconds());
} else {
    item.setPrepSeconds(timing.prepSeconds());
}
```

Một số task Speaking (Re-tell Lecture, Repeat Sentence...) có thời gian chuẩn bị phụ thuộc **độ dài file audio thật** (nghe hết bài giảng rồi mới tới lúc chuẩn bị nói) — không phải một con số tĩnh cấu hình sẵn. `audioDurationSeconds` chính là kết quả trích xuất WAV header đã nói ở [bài media](11-media-upload.md) (`parseWavDurationSeconds`), truyền xuyên suốt từ lúc host upload audio prompt tới tận lúc pin attempt cho một học viên cụ thể — một ví dụ rõ về cách 2 service tưởng không liên quan (`media` và `exam-delivery`) nối với nhau qua đúng 1 con số.

## Điều hướng qua từng task: tự động expire câu chưa làm, không chặn học viên lại

```java
private AttemptTaskResponse advanceUntilLiveOrComplete(ExamAttempt attempt) {
    TimerState timer = timerService.getState(attempt.getId());
    while (timerService.isResponseWindowExpired(timer)) {
        PinnedItem currentItem = currentItem(attempt, timer);
        expireIfUnanswered(attempt, currentItem);   // tự động finalize câu đã hết giờ mà chưa trả lời

        int nextIndex = timer.getCurrentOrderIndex() + 1;
        if (nextIndex >= totalItems) {
            completeAttempt(attempt);
            return attemptMapper.toCompletedResponse(attempt);
        }
        PinnedItem nextItem = itemAt(attempt, nextIndex);
        timer = timerService.startTaskTimer(attempt, PinnedSnapshotCacheService.toView(nextItem), allItems);
    }
    return attemptMapper.toTaskResponse(attempt, ...);
}
```

Đây là hệ quả trực tiếp của timer server-authoritative đã nói ở [bài 10](10-proctor-va-timer.md): nếu học viên bị mất kết nối mạng 5 phút rồi quay lại, `getNextTask` không "đứng yên" chờ họ — nó chạy vòng lặp `while` tự động expire mọi task đã hết giờ mà chưa trả lời, tiến qua đúng số task tương ứng với thời gian đã trôi qua, rồi mới trả về task **hiện tại thật sự** theo đồng hồ server. Không có khái niệm "tạm dừng" — thời gian chảy dù client có mặt hay không.

`AnswerSubmitService.autoExpire` ghi một `AttemptAnswer` với `payload = null, expired = true` — câu bị bỏ lỡ vẫn có bản ghi, vẫn phát `AnswerSubmitted` event bình thường (để `scoring` biết mà tính là sai/0 điểm, không phải "thiếu dữ liệu" theo nghĩa insufficientData đã nói ở [bài 12](12-scoring-review-va-reporting.md) — một câu bị bỏ lỡ là có làm nhưng sai, khác hẳn một section chưa từng có trong composition).

## Nộp bài và resume: idempotent, không tạo 2 attempt cho cùng 1 session

```java
@Transactional
public AttemptTaskResponse startAttempt(StartAttemptRequest request, CurrentUser caller) {
    var existing = attemptRepository.findBySessionPublicIdAndStudentPublicId(request.sessionPublicId(), studentPublicId);
    if (existing.isPresent()) {
        return resumeOrReject(existing.get());   // đã có attempt — resume hoặc từ chối, không tạo mới
    }
    return createAndPin(...);
}

private AttemptTaskResponse resumeOrReject(ExamAttempt existing) {
    if (existing.getStatus() != AttemptStatus.CREATED && existing.getStatus() != AttemptStatus.IN_PROGRESS) {
        throw new AlreadyAttemptedException();   // đã SUBMITTED trở đi — không cho làm lại
    }
    return advanceUntilLiveOrComplete(existing);   // còn dang dở — resume đúng chỗ theo đồng hồ server
}
```

Học viên tắt app giữa chừng và mở lại không tạo attempt thứ hai — `startAttempt` tìm attempt hiện có theo `(sessionPublicId, studentPublicId)` trước, chỉ tạo mới nếu chưa từng có. Bảo vệ kép ở tầng DB (`DataIntegrityViolationException` bắt trong `createAndPin` khi 2 request "bắt đầu bài" đến gần như đồng thời) — cùng pattern check-rồi-để-DB-chặn đã thấy ở [bài enrollment](08-scheduling-va-enrollment.md).

`submitAttempt` (học viên chủ động bấm nộp) và nhánh tự động hoàn tất khi hết task cuối cùng đều hội tụ về đúng 1 điểm:

```java
private void completeAttempt(ExamAttempt attempt) {
    attempt.submit();
    attemptRepository.save(attempt);
    outboxWriter.write(..., new AttemptSubmittedEvent(...), attempt.getTenantId());
}
```

Đây chính là điểm khởi đầu saga đã mổ xẻ toàn bộ ở [bài 4](04-event-driven-saga.md) — outbox ghi trong cùng transaction, học viên nhận response ngay, phần chấm điểm diễn ra hoàn toàn tách biệt và bất đồng bộ sau đó theo lệnh host.

## Nghe lại audio: idempotent theo request, khóa bi quan chống double-click

```java
/**
 * Idempotent per playRequestId (client-generated UUID per user-initiated
 * play tap): a repeated request with the same key replays the prior outcome
 * instead of re-incrementing playCount. The pessimistic lock on TimerState
 * serializes concurrent plays so two requests can never both observe the
 * same pre-increment playCount.
 */
@Transactional
public AudioPlayResponse playAudio(UUID attemptPublicId, UUID pinnedItemPublicId, String playRequestId, CurrentUser caller) {
    TimerState timer = timerService.getStateWithLock(attempt.getId());   // khóa ghi — chặn double-click chính xác
    ...
    if (playRequestId.equals(timer.getLastPlayRequestId())) {
        // Cùng 1 lần bấm gửi lại (mất mạng, client retry) — trả lại đúng kết quả cũ, KHÔNG tính thêm 1 lượt nghe
        return Boolean.TRUE.equals(timer.getLastPlayAllowed())
                ? new AudioPlayResponse(currentItem.getAudioUrl())
                : throwReplayLimitExceeded();
    }
    ...
}
```

`playRequestId` do client sinh mỗi lần **bấm nút** (không phải mỗi lần gọi API) — nếu request bị mất mạng và client tự động retry với cùng `playRequestId`, server nhận ra đây là cùng 1 lần bấm và trả lại đúng kết quả trước đó thay vì trừ thêm vào giới hạn số lần nghe. Đây là khác biệt quan trọng so với dùng lock đơn thuần: lock chỉ chống 2 request đồng thời chen vào nhau, còn `playRequestId` chống việc 1 request logic bị đếm 2 lần do lỗi mạng — hai loại race condition khác nhau, cần 2 cơ chế khác nhau để giải quyết cả hai.

---

*Bài tiếp theo: [Giám thị giám sát](10-proctor-va-timer.md) — WebSocket real-time, audit log tamper-evident, và timer server-authoritative đã nhắc ở trên.*
