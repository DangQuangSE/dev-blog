# PTE Platform — Host Duyệt Điểm & Báo Cáo: Scoring Review & Reporting

*Bài 12/14 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Host đã ra lệnh chấm (`POST /sessions/{id}/score`, [bài 8](08-scheduling-va-enrollment.md)). Trước khi publish, một số câu trả lời cần con người duyệt lại kết quả AI — đây là cổng human-review đã hứa hẹn từ [ADR-002](02-kien-truc-adr.md): Pearson yêu cầu review thủ công cho 7 loại task nhạy cảm.

## Cổng duyệt: chỉ cần xác nhận, không sửa điểm

```java
/** scoring's first human-facing endpoint: host approves an AI-scored,
 *  review-required answer. */
@RequestMapping("/answers")
@PreAuthorize("hasAnyRole('HOST_ADMIN','HOST_AUTHOR')")
public class ScoringReviewController {
    @PostMapping("/{answerPublicId}/review")
    public ApiResponse<ScoringAnswerResponse> approve(@PathVariable UUID answerPublicId) {
        return ApiResponse.success(scoringReviewService.approve(answerPublicId, currentUser()));
    }
}
```

```java
@Transactional
public ScoringAnswerResponse approve(UUID answerPublicId, CurrentUser caller) {
    ScoringAnswer answer = findOwned(answerPublicId, caller);
    if (answer.getStatus() != ScoringAnswerStatus.AI_SCORED_PENDING_REVIEW) {
        throw new ReviewNotPendingException();
    }

    int finalScore = answer.getRawScore();   // điểm AI đã tính, host không sửa số
    answer.markScored(finalScore);
    scoringAnswerRepository.save(answer);

    outboxWriter.write(ScoringConstants.AGGREGATE_ANSWER, answer.getAnswerPublicId().toString(),
            ScoringConstants.EVENT_ANSWER_SCORED,
            new AnswerScoredEvent(answer.getAttemptPublicId(), answer.getAnswerPublicId(), answer.getTenantId(), finalScore),
            answer.getTenantId());
    attemptCompletionService.checkAndEmitIfComplete(answer.getAttemptPublicId(), answer.getSessionPublicId(), answer.getTenantId());

    return ScoringAnswerMapper.toResponse(answer);
}
```

API hiện tại chỉ cho phép **approve** — host xác nhận điểm AI đúng, không có endpoint sửa số trực tiếp. `checkAndEmitIfComplete` được gọi sau mỗi lần approve để kiểm tra: nếu đây là câu cuối cùng cần review của attempt, phát sự kiện hoàn tất luôn — không cần một job quét định kỳ để phát hiện "attempt này đã xong review chưa". Từ chối tra cứu trả về `404` (`AnswerNotFoundException`) thay vì `403` khi answer thuộc tenant khác — không tiết lộ sự tồn tại của answer đó cho người không có quyền xem, đúng pattern "không rò rỉ tồn tại" đã lặp lại nhiều lần xuyên series.

## Trước khi tới cổng duyệt: chấm rule-based cho 5 loại Reading

Không phải mọi câu trả lời đều cần AI. 5 task type đọc trắc nghiệm/sắp xếp/điền chỗ trống được chấm bằng luật cứng, đúng công thức chấm điểm thật của PTE (partial credit, negative marking) — không phải so khớp đúng/sai đơn giản:

```java
/** PTE-standard negative marking: +1 per correct selection, -1 per incorrect
 *  selection, floored at 0 for the question — never negative. */
private int scoreMultipleChoice(ScoringAnswer answer) {
    Set<Integer> correctIndexes = ...;
    Set<Integer> submitted = parsePayloadAsOrderIndexSet(answer.getPayload());
    int correctSelections = 0, incorrectSelections = 0;
    for (Integer selected : submitted) {
        if (correctIndexes.contains(selected)) correctSelections++;
        else incorrectSelections++;
    }
    int points = Math.max(correctSelections - incorrectSelections, 0);
    return Math.round(100f * points / correctIndexes.size());
}

/** PTE-standard partial credit: 1 point per correctly-adjacent pair in the
 *  submitted sequence, not an all-or-nothing exact-match check. */
private int scoreReorderParagraphs(ScoringAnswer answer) {
    List<Integer> submitted = parsePayloadAsOrderIndexList(answer.getPayload());
    int correctPairs = 0;
    for (int i = 0; i < submitted.size() - 1; i++) {
        Integer current = submitted.get(i), next = submitted.get(i + 1);
        if (current != null && next != null && next == current + 1) correctPairs++;
    }
    return Math.round(100f * correctPairs / (totalParagraphs - 1));
}
```

`MC_READING_MULTIPLE` chọn thừa bị trừ điểm (chọn bừa tất cả đáp án không "ăn may" được điểm cao) — đúng cách PTE thật chấm loại câu này, không phải kiểu "chọn đúng 1 trong các đáp án đúng là được điểm". `RE_ORDER_PARAGRAPHS` không yêu cầu đúng tuyệt đối toàn bộ trình tự mới có điểm — mỗi cặp đoạn liền kề đặt đúng vị trí tương đối (`submitted[i+1] == submitted[i] + 1`, dùng chính `orderIndex` đã nói ở [bài 7](07-authoring-va-task-type.md)) được tính điểm riêng, gần đúng nhưng không hoàn hảo vẫn được ghi nhận một phần.

Điều bắt buộc phải giữ đúng khi ghép nhiều nguồn chấm khác nhau lại: **mọi scorer trả điểm trên cùng thang 0–100 phần trăm**, dù là rule-based hay AI:

```java
/**
 * @return raw score on a 0–100 PERCENTAGE scale (100 correct, 0 incorrect)
 * — NOT 0/1. AI scoring (also 0–100) must combine with objective scores in
 * reporting's aggregation formula, so every scorer must share one scale.
 */
public int score(ScoringAnswer answer) { ... }
```

`supports(taskType)` cho phép consumer bỏ qua loại task chưa hỗ trợ **mà không coi đó là lỗi** — câu trả lời cứ ở trạng thái `PENDING` mãi, đây là "honest completion": một task type chưa implement rule chấm không bao giờ bị gán điểm giả, attempt đơn giản không bao giờ được coi là "chấm xong" cho tới khi có ai đó (người hoặc AI thật) thực sự chấm nó.

## Adapter cho AI vendor: interface trước, vendor thật thay sau

Speaking/Writing cần chấm bằng AI — kiến trúc tách hẳn phần gọi vendor thành interface, để phần còn lại của pipeline (queue, worker, chuyển trạng thái, phát event) không phụ thuộc vendor cụ thể nào:

```java
/**
 * PLACEHOLDER — makes NO network call, analyzes NO real audio. Returns a
 * deterministic mid-range score so the pipeline (queue → worker → status
 * transitions → events) is exercisable end-to-end before a real vendor is
 * wired in.
 *
 * To replace: implement SpeechScoringClient against a real audio-capable
 * vendor, remove @Component here, and the worker needs no changes — it
 * only depends on the interface.
 */
@Component
public class StubSpeechScoringClient implements SpeechScoringClient {
    private static final int PLACEHOLDER_SCORE = 65;

    @Override
    public AiScoreResult score(String audioMediaPublicId, String referenceText) {
        return new AiScoreResult(PLACEHOLDER_SCORE,
                Map.of("ORAL_FLUENCY", PLACEHOLDER_SCORE, "PRONUNCIATION", PLACEHOLDER_SCORE),
                "STUB: no real vendor configured yet.");
    }
}
```

Toàn bộ phần queue/retry/backoff/DLQ đã nói ở [bài tổng quan](01-tong-quan.md) chạy được đầu-cuối ngay cả khi chưa có vendor thật — `AiScoringWorker` chỉ phụ thuộc interface `SpeechScoringClient`, không phụ thuộc `StubSpeechScoringClient` cụ thể. Cắm vendor thật vào chỉ cần 1 class mới implement đúng interface, gỡ `@Component` của bản stub — không đụng tới queue hay worker.

## Dispatcher → work queue → worker: cơ chế retry/backoff/DLQ thật, không chỉ là lời hứa

Câu trả lời có AI hay không do `AiScoringDispatcher` quyết định (task type nào cần AI vendor), rồi đẩy vào work queue riêng — tách hẳn khỏi outbox event backbone đã nói ở [bài 4](04-event-driven-saga.md), đúng phân biệt "outbox-relay vs work-queue" đã nêu ở đó:

```java
/**
 * Routes AI-scorable PENDING answers to the RabbitMQ work queue instead of
 * leaving them silently pending like a genuinely-unsupported type.
 *
 * Known gap, documented not silent: unlike the outbox path (atomicity
 * guaranteed), this publish happens inside the same DB transaction as the
 * status update with NO outbox in between — a crash between convertAndSend
 * succeeding and the transaction committing could leave a message in flight
 * for a row still showing PENDING. AiScoringWorker is written to be
 * self-healing against this (reads the row fresh, doesn't assert AI_SCORING
 * as a precondition), so the race doesn't corrupt state — just a narrower
 * guarantee than the outbox path.
 */
public void dispatch(ScoringAnswer answer) {
    answer.setStatus(ScoringAnswerStatus.AI_SCORING);
    scoringAnswerRepository.save(answer);
    AiScoringJob job = new AiScoringJob(answer.getAnswerPublicId(), answer.getAttemptPublicId(), ...);
    rabbitTemplate.convertAndSend(ScoringConstants.AI_SCORING_EXCHANGE, ScoringConstants.AI_SCORING_ROUTING_KEY, job);
}
```

Doc comment thừa nhận thẳng một khoảng hở atomicity yếu hơn outbox pattern (publish trực tiếp qua `RabbitTemplate`, không qua outbox row) — nhưng **ghi rõ ra, không giấu**, và bù bằng cách viết worker tự phục hồi được (đọc lại trạng thái thật từ DB, không giả định `AI_SCORING` là điều kiện tiên quyết). Đây là ví dụ về việc chấp nhận một trade-off kỹ thuật có ý thức, khác hẳn một lỗ hổng không ai biết.

Cấu hình retry thật ở tầng RabbitMQ, không phải code tự viết vòng lặp thử lại:

```java
private static final int MAX_ATTEMPTS = 3;
private static final long INITIAL_INTERVAL_MS = 2_000L;
private static final long MAX_INTERVAL_MS = 10_000L;
private static final double MULTIPLIER = 2.0;

@Bean
public Queue aiScoringQueue() {
    return QueueBuilder.durable(ScoringConstants.AI_SCORING_QUEUE)
            .withArgument("x-dead-letter-exchange", DEAD_LETTER_EXCHANGE)
            .withArgument("x-dead-letter-routing-key", ScoringConstants.AI_SCORING_ROUTING_KEY)
            .build();
}

@Bean
public RetryOperationsInterceptor aiScoringRetryInterceptor() {
    MethodInvocationRecoverer<Object> recoverer = (args, cause) -> {
        throw new AmqpRejectAndDontRequeueException("AI scoring retries exhausted", cause);
    };
    return RetryInterceptorBuilder.stateless()
            .maxAttempts(MAX_ATTEMPTS)
            .backOffOptions(INITIAL_INTERVAL_MS, MULTIPLIER, MAX_INTERVAL_MS)
            .recoverer(recoverer)
            .build();
}
```

3 lần thử, khoảng chờ 2s → 4s → 8s (giới hạn trần 10s), rồi dead-letter — con số cụ thể, không phải "retry vài lần" mơ hồ. Hàng đợi chính khai `x-dead-letter-exchange` trỏ thẳng sang exchange DLQ — khi retry cạn, `RetryOperationsInterceptor` throw `AmqpRejectAndDontRequeueException`, container biến nó thành NACK-không-requeue, RabbitMQ tự động route message sang DLX theo đúng cấu hình queue, không cần code nào gọi tay.

Phía worker xử lý cả đường thường lẫn đường lỗi:

```java
@RabbitListener(queues = ScoringConstants.AI_SCORING_QUEUE, containerFactory = "rabbitListenerContainerFactory")
@Transactional
public void onAiScoringJob(AiScoringJob job) {
    ScoringAnswer answer = ...;
    if (answer.getStatus() == ScoringAnswerStatus.SCORED
            || answer.getStatus() == ScoringAnswerStatus.SCORING_FAILED
            || answer.getStatus() == ScoringAnswerStatus.AI_SCORED_PENDING_REVIEW) {
        return; // Already terminal — redelivery no-op, KHÔNG gọi vendor lại
    }
    AiScoreResult result = callVendor(job);
    if (REVIEW_REQUIRED_TASK_TYPES.contains(job.taskType())) {
        answer.setStatus(ScoringAnswerStatus.AI_SCORED_PENDING_REVIEW);   // Write Essay — chờ host duyệt, xem phần trên
    } else {
        answer.markScored(result.rawScore());
        outboxWriter.write(..., new AnswerScoredEvent(...));             // Read Aloud — không cần duyệt, chấm xong là xong
        attemptCompletionService.checkAndEmitIfComplete(...);
    }
}

@RabbitListener(queues = ScoringConstants.AI_SCORING_DLQ, containerFactory = "rabbitListenerContainerFactory")
@Transactional
public void onDeadLettered(AiScoringJob job) {
    scoringAnswerRepository.findByAnswerPublicId(job.answerPublicId()).ifPresent(answer -> {
        answer.setStatus(ScoringAnswerStatus.SCORING_FAILED);   // Host NHÌN THẤY được, không biến mất âm thầm
        scoringAnswerRepository.save(answer);
    });
}
```

Kiểm tra trạng thái "đã terminal chưa" trước khi gọi vendor là điều bắt buộc với RabbitMQ (chỉ đảm bảo at-least-once) — một job bị giao lại (network glitch, consumer restart giữa chừng) không được phép gọi vendor tốn tiền lần thứ hai cho câu đã chấm xong. Và điểm quan trọng nhất: khi retry cạn hẳn, `onDeadLettered` không để câu trả lời "biến mất" — nó set `SCORING_FAILED`, một trạng thái host nhìn thấy được trong hệ thống, khác hẳn một message chết lặng lẽ nằm trong DLQ mà không ai biết.

## Xây read model: cùng logic dùng cho cả steady-state và rebuild

`reporting` không tự chấm hay tự nộp bài — nó chỉ lắng nghe và chiếu lại (project) dữ liệu từ `exam-delivery`/`scoring` thành các bảng tối ưu cho đọc. Logic upsert này dùng chung cho cả consumer thời gian thực **và** cơ chế rebuild đã nhắc ở phần dưới — để 2 đường không bao giờ lệch nhau:

```java
/**
 * The duplicate-insert fallback runs in its own REQUIRES_NEW transaction: on
 * Postgres, a failed statement aborts the WHOLE surrounding transaction at
 * the connection level, not just the Java exception — catching
 * DataIntegrityViolationException without isolating it in its own
 * transaction would poison the caller's ambient transaction, causing the
 * subsequent ProcessedEvent save and commit to fail with an unrelated error
 * instead of the intended silent no-op.
 */
public void ingestAttempt(AttemptSubmittedEvent event) {
    AttemptReport report = new AttemptReport();
    report.setAttemptPublicId(event.attemptPublicId());
    ...
    try {
        requiresNewTransactionTemplate.executeWithoutResult(status -> attemptReportRepository.save(report));
    } catch (DataIntegrityViolationException ex) {
        // Đã ingest rồi (redelivery, hoặc đang chạy rebuild lại) — no-op, không phải lỗi.
    }
}
```

Đây là một chi tiết Postgres dễ bị bỏ sót nếu chưa từng bị nó cắn: **một statement lỗi trên Postgres huỷ toàn bộ transaction đang mở ở tầng connection**, không chỉ ném exception ở tầng Java. Bắt `DataIntegrityViolationException` bằng try/catch thường mà không cô lập nó trong transaction `REQUIRES_NEW` riêng sẽ khiến transaction bao ngoài (của consumer đang lắng nghe event) bị "nhiễm độc" — bước lưu `ProcessedEvent` và commit ngay sau đó sẽ lỗi với một exception hoàn toàn không liên quan, thay vì im lặng bỏ qua bản ghi trùng như ý định ban đầu. Đây đúng là loại lỗi chỉ lộ ra khi có dữ liệu redelivery hoặc chạy rebuild thật — code trông đúng hoàn toàn ở happy path.

## Attempt hoàn tất chấm điểm khi nào: kiểm tra chủ động, không job quét định kỳ

```java
/**
 * Shared "is this attempt fully scored?" check — called from every place an
 * answer can reach a terminal state. "Fully scored" = zero rows left in a
 * non-terminal status — honest completion: an unsupported task type stuck
 * in PENDING still blocks this forever, same as before.
 */
public void checkAndEmitIfComplete(UUID attemptPublicId, UUID sessionPublicId, UUID tenantId) {
    boolean stillIncomplete = scoringAnswerRepository.existsByAttemptPublicIdAndStatusIn(attemptPublicId, NON_TERMINAL);
    if (stillIncomplete) return;
    outboxWriter.write(..., new AttemptScoredEvent(attemptPublicId, sessionPublicId, tenantId), tenantId);
}
```

Hàm này được gọi từ **3 chỗ khác nhau**: consumer chấm rule-based/AI dispatch, worker AI xong việc, và `ScoringReviewService.approve()` đã thấy ở đầu bài — mỗi lần một câu trả lời chuyển sang trạng thái cuối, hệ thống tự hỏi "còn câu nào chưa xong không?" ngay lập tức, thay vì chạy một job nền quét định kỳ toàn bộ DB để tìm attempt đã hoàn tất. Cách này phản ứng tức thời (không có độ trễ chờ tới lượt quét tiếp theo) và rẻ hơn (mỗi lần chỉ kiểm tra đúng 1 attempt, không quét toàn bảng).

## Đọc report: cùng endpoint, quyền xem khác nhau theo vai trò

```java
/**
 * Student sees a report only once published (and only their own); host sees
 * any time within their tenant (review-before-publish). Role guard here is
 * broad; the fine-grained ownership/publish check lives in ReportService.
 */
@RequestMapping("/reports")
@PreAuthorize("hasAnyRole('STUDENT','HOST_ADMIN','HOST_AUTHOR','PLATFORM_ADMIN','PLATFORM_AUTHOR')")
public class ReportController {
    @GetMapping("/attempts/{attemptPublicId}")
    public ApiResponse<ReportResponse> getReport(@PathVariable UUID attemptPublicId) { ... }
}
```

`@PreAuthorize` ở controller chỉ chặn *ai được gọi endpoint này nói chung* — logic thật (student chỉ xem báo cáo của chính mình và chỉ khi đã `PUBLISHED`; host xem được ngay từ `SCORED` để review trước khi publish) nằm trong `ReportService`, không trong annotation. Đây là pattern nhất quán đã thấy nhiều lần: role guard ở controller thô, phạm vi chính xác nằm ở service — vì phạm vi phụ thuộc dữ liệu cụ thể (ai sở hữu attempt này), không chỉ phụ thuộc role tĩnh.

## Công thức tính điểm 10–90: mô phỏng, không phải thuật toán thật của Pearson

```java
/**
 * Computes the 10–90 score summary for an attempt from its scored answers.
 * Simulation formula, not Pearson's algorithm: scaledScore = round(10 +
 * percentCorrect * 80) per skill from its contributing SCORED answers; a
 * skill with zero contributing scored answers reports "insufficient data,"
 * never a fabricated score. Overall averages the communicative skills that
 * have data.
 */
@Transactional(readOnly = true)
public AttemptScoreSummary aggregate(UUID attemptPublicId) {
    List<AnswerProjection> answers = answerProjectionRepository.findByAttemptPublicId(attemptPublicId);

    Map<Skill, List<AnswerProjection>> contributingBySkill = new EnumMap<>(Skill.class);
    for (AnswerProjection answer : answers) {
        if (!answer.isScored()) continue;
        for (Skill skill : taskSkillMappingConfig.skillsFor(answer.getTaskType())) {
            contributingBySkill.get(skill).add(answer);   // 1 câu trả lời có thể đóng góp cho NHIỀU kỹ năng
        }
    }

    Map<Skill, SkillScore> skillScores = new EnumMap<>(Skill.class);
    for (Skill skill : Skill.values()) {
        skillScores.put(skill, computeSkillScore(contributingBySkill.get(skill)));
    }
    return new AttemptScoreSummary(computeOverall(skillScores), skillScores);
}
```

`TaskSkillMappingConfig.skillsFor(taskType)` là bảng ánh xạ mỗi task type sang tập kỹ năng nó đóng góp — một câu Read Aloud vừa tính vào Speaking (communicative) vừa tính vào Pronunciation/Oral Fluency (enabling), đúng cách PTE thật tính điểm chồng chéo giữa 4 kỹ năng giao tiếp và 6 kỹ năng enabling đã nhắc ở [bài tổng quan](01-tong-quan.md).

## Xử lý bài thi partial/practice: không fabricate điểm

```java
private SkillScore computeSkillScore(List<AnswerProjection> contributing) {
    if (contributing.isEmpty()) {
        return SkillScore.insufficientData();   // KHÔNG trả về 0, KHÔNG trả về điểm ước lượng
    }
    double averageRawScore = contributing.stream().mapToInt(AnswerProjection::getRawScore).average().orElse(0);
    double percentCorrect = averageRawScore / 100.0;
    return SkillScore.of((int) Math.round(SCALE_FLOOR + percentCorrect * SCALE_SPAN));
}

private SkillScore computeOverall(Map<Skill, SkillScore> skillScores) {
    List<Integer> communicativeWithData = skillScores.entrySet().stream()
            .filter(e -> e.getKey().isCommunicative() && e.getValue().sufficientData())
            .map(e -> e.getValue().score())
            .toList();
    if (communicativeWithData.isEmpty()) return SkillScore.insufficientData();
    double average = communicativeWithData.stream().mapToInt(Integer::intValue).average().orElse(0);
    return SkillScore.of((int) Math.round(average));
}
```

Đây chính là chỗ hiện thực hóa yêu cầu "gracefully handle partial/practice subsets" đã nhắc ở [bài tổng quan](01-tong-quan.md) khi liệt kê vai trò `reporting`. Một session luyện tập ([bài 8](08-scheduling-va-enrollment.md) — composition chỉ chọn tập con task type) sẽ có nhiều kỹ năng **không có câu trả lời nào đóng góp** — `computeSkillScore` trả `insufficientData()` một cách tường minh thay vì `0` (0 trông giống "làm sai hết", trong khi sự thật là "không có dữ liệu", hai ý nghĩa hoàn toàn khác nhau với học viên đọc report). `Overall` chỉ trung bình các kỹ năng giao tiếp **có dữ liệu thật** — không kéo tụt điểm tổng vì một kỹ năng học viên chưa từng làm.

Một chi tiết sửa lỗi đáng chú ý trong chính doc comment: "every scorer (objective AND AI) reports `rawScore` on the SAME 0–100 percentage scale" — đảm bảo một kỹ năng vừa được chấm bởi rule-based (đọc/nghe trắc nghiệm) vừa được chấm bởi AI vendor (nói/viết) vẫn trung bình đúng, không cần code rẽ nhánh riêng theo nguồn chấm.

## Rebuild: sync-pull thay vì Kafka replay

```java
/**
 * Operator-invoked, single-tenant recovery path — a host re-derives their
 * own tenant's read model from exam-delivery/scoring's source-of-truth data.
 * Tenant scope comes from the caller's own validated JWT, never a request
 * parameter — a host can only ever rebuild their own tenant.
 */
@RequestMapping("/reports")
@PreAuthorize("hasRole('HOST_ADMIN')")
public class RebuildController {
    @PostMapping("/rebuild")
    public ApiResponse<RebuildSummary> rebuild() {
        CurrentUser currentUser = ...;
        return ApiResponse.success(rebuildOrchestrationService.rebuild(currentUser.tenantId()));
    }
}
```

Đã nhắc tới cơ chế này ở [bài event-driven saga](04-event-driven-saga.md) khi giải thích cái giá phải trả lúc bỏ Kafka: mất khả năng replay-from-beginning tự động. `RebuildController` là nửa "operator, single-tenant" của giải pháp thay thế — `tenantId` lấy từ JWT đã validate của host gọi, **không bao giờ** nhận qua request parameter, nên một host không có cách nào yêu cầu rebuild dữ liệu của tenant khác dù có sửa request thủ công. Nửa còn lại — bootstrap toàn bộ tenant cho một instance `reporting` hoàn toàn mới — nằm ở `InternalRebuildController` riêng biệt, endpoint controller này không thể chạm tới.

---

*Đến đây, series đã đi hết toàn bộ luồng nghiệp vụ theo vai trò: [Admin & IAM](06-admin-va-iam.md) → [Authoring](07-authoring-va-task-type.md) → [Scheduling](08-scheduling-va-enrollment.md) → [Attempt State Machine](09-attempt-state-machine.md) → [Proctor & Timer](10-proctor-va-timer.md) → [Media](11-media-upload.md) → Scoring review & Reporting ở trên. Còn 2 bài cross-cutting cuối series: [Notification](13-notification.md) và [Internal Service-to-Service API](14-internal-service-api.md).*
