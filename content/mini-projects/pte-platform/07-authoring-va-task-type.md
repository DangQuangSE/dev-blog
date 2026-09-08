# PTE Platform — Host Soạn Đề: Authoring & 22 Task Type

*Bài 7/12 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Sau khi có tài khoản ([bài 6](06-admin-va-iam.md)), việc đầu tiên `HOST_AUTHOR`/`PLATFORM_AUTHOR` làm là soạn câu hỏi. PTE Academic có 22 task type được chấm điểm + 1 task không chấm (Personal Introduction) — mỗi loại yêu cầu field khác nhau (audio prompt, ảnh, số từ tối thiểu/tối đa...). Viết tay 22 rule validate là công thức chắc chắn để bug lẻ tẻ chỗ này chỗ kia; `authoring` giải bằng **validation category-driven theo flag khai báo trên enum**.

## 22 task type, khai báo bằng flag chứ không phải if-else

```java
public enum PteTaskType {
    // ---- Speaking ----
    READ_ALOUD(PteSection.SPEAKING, true, false, false, true, false, false, false),
    REPEAT_SENTENCE(PteSection.SPEAKING, true, true, false, false, false, false, false),
    DESCRIBE_IMAGE(PteSection.SPEAKING, true, false, true, false, false, false, false),
    ...
    // ---- Writing ----
    WRITE_ESSAY(PteSection.WRITING, true, false, false, true, false, false, true),
    // ---- Reading ----
    MC_READING_SINGLE(PteSection.READING, true, false, false, true, true, true, false),
    ...

    // Constructor thứ tự: section, scored, requiresAudioPrompt, requiresImagePrompt,
    // requiresPromptText, requiresOptions, requiresCorrectAnswer, requiresWordCount
}
```

Mỗi task type chỉ là một dòng khai báo 7 cờ boolean (đúng section nào, có chấm điểm không, cần audio/ảnh/prompt text không, cần đáp án trắc nghiệm hay đáp án đúng, cần giới hạn số từ không). `DESCRIBE_IMAGE` cần ảnh nhưng không cần audio; `REPEAT_SENTENCE` ngược lại; `WRITE_ESSAY` cần prompt text + giới hạn số từ nhưng không cần đáp án đúng (chấm bằng AI, không phải so khớp). Validate dùng chung 1 hàm đọc flag, không phải 22 nhánh code riêng:

```java
public void validate(Question question) {
    PteTaskType type = question.getPteTaskType();

    if (type.requiresAudioPrompt() && question.getAudioPromptRef() == null) {
        throw new QuestionValidationException(AuthoringConstants.AUDIO_PROMPT_REQUIRED);
    }
    if (type.requiresImagePrompt() && question.getImagePromptRef() == null) {
        throw new QuestionValidationException(AuthoringConstants.IMAGE_PROMPT_REQUIRED);
    }
    if (type.requiresPromptText() && !StringUtils.hasText(question.getPromptText())) {
        throw new QuestionValidationException(AuthoringConstants.PROMPT_TEXT_REQUIRED);
    }
    if (type.requiresWordCount() && (question.getMinWordCount() == null || question.getMaxWordCount() == null)) {
        throw new QuestionValidationException(AuthoringConstants.WORD_COUNT_REQUIRED);
    }
    validateAnswers(question, type);
}
```

Thêm task type thứ 23 (nếu Pearson đổi format đề) chỉ cần thêm 1 dòng enum đúng flag — không phải sửa `QuestionValidationHelper`. Đây là lợi ích thật của category-driven validation, không phải lý thuyết suông: logic validate **không tăng theo số task type**.

## Endpoint và RBAC: cùng 4 role, khác phạm vi dữ liệu

```java
@RequestMapping("/questions")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN','PLATFORM_AUTHOR','HOST_ADMIN','HOST_AUTHOR')")
public class QuestionController {
    @PostMapping
    public ApiResponse<QuestionResponse> create(@Valid @RequestBody CreateQuestionRequest request) { ... }

    @GetMapping
    public ApiResponse<List<QuestionResponse>> list() {
        return ApiResponse.success(questionService.listAccessible(currentUser()));
    }
}
```

`listAccessible` áp đúng logic `AuthoringAccessPolicy` đã nói ở [bài tenant isolation](05-tenant-isolation.md): `PLATFORM_AUTHOR` thấy toàn bộ kho global, `HOST_AUTHOR` chỉ thấy câu hỏi của tenant mình + kho global (read-only). Cùng 4 role gọi được `POST /questions`, nhưng `tenant_id` gắn vào câu hỏi mới lấy từ JWT của người tạo — một `HOST_AUTHOR` không thể tạo câu hỏi cho tenant khác dù có gọi đúng API.

`BlueprintController` (gom câu hỏi thành đề — chọn task type nào, thứ tự nào) dùng cùng pattern RBAC hệt vậy, chỉ khác entity.

## Tạo câu hỏi: SHARED vs PRIVATE quyết định tenant nào sở hữu

```java
public enum Visibility {
    SHARED,   // tenant_id null — kho toàn cục, chỉ PLATFORM_AUTHOR ghi
    PRIVATE   // tenant_id = host — riêng của 1 tenant
}
```

```java
@Transactional
public QuestionResponse create(CreateQuestionRequest request, CurrentUser caller) {
    Visibility visibility = parseVisibility(request.visibility());
    UUID tenantId = resolveTenant(visibility, caller);
    ...
}

private UUID resolveTenant(Visibility visibility, CurrentUser caller) {
    if (visibility == Visibility.SHARED) {
        if (!accessPolicy.canWriteShared(caller)) {
            throw new SharedWriteForbiddenException();
        }
        return null;   // SHARED luôn có tenant_id = null
    }
    if (caller.tenantId() == null) {
        throw new QuestionValidationException(AuthoringConstants.PRIVATE_REQUIRES_TENANT);
    }
    return caller.tenantId();   // PRIVATE luôn gắn tenant của chính người tạo, không nhận từ request
}
```

Điểm quan trọng: `tenantId` của câu hỏi **không bao giờ** lấy từ request body — nó luôn suy ra từ `caller` (JWT) và loại `visibility` được chọn. Một `HOST_AUTHOR` không có cách nào gửi `tenantId` của tenant khác trong request để "gán nhầm" quyền sở hữu — field đó thậm chí không tồn tại trong `CreateQuestionRequest`. Cố tạo `SHARED` mà không phải `PLATFORM_AUTHOR` bị chặn ngay ở `resolveTenant`, trước khi bất kỳ dòng nào được ghi xuống DB.

`listAccessible` cũng rẽ nhánh theo đúng ranh giới này — platform user thấy toàn bộ kho (`findAllWithOptions`), host chỉ thấy phần mình được phép (`findAccessible(tenantId)`, gồm SHARED + PRIVATE của chính mình):

```java
@Transactional(readOnly = true)
public List<QuestionResponse> listAccessible(CurrentUser caller) {
    List<Question> questions = caller.isPlatformUser()
            ? questionRepository.findAllWithOptions()
            : questionRepository.findAccessible(caller.tenantId());
    return questions.stream().map(this::toResponse).toList();
}
```

## Blueprint: chỉ gom được câu hỏi mình đọc được

```java
private BlueprintItem buildItem(BlueprintItemRequest request, CurrentUser caller) {
    Question question = questionRepository.findWithOptionsByPublicId(request.questionPublicId())
            .orElseThrow(QuestionNotFoundException::new);
    if (!accessPolicy.canRead(question.getTenantId(), question.isShared(), caller)) {
        throw new QuestionNotFoundException();   // 404, không phải 403 — không lộ sự tồn tại
    }
    ...
}
```

Mỗi câu hỏi được thêm vào blueprint đi qua đúng `AuthoringAccessPolicy.canRead` — một host không thể tạo blueprint tham chiếu câu hỏi PRIVATE của tenant khác, dù có biết chính xác UUID của câu hỏi đó (thử truy cập trả về "không tìm thấy" thay vì "không có quyền", tránh lộ thông tin về sự tồn tại của tài nguyên không thuộc về mình — cùng pattern với `AnswerNotFoundException` ở [bài 12](12-scoring-review-va-reporting.md)).

## Publish: đóng băng bằng deep-copy, không phải versioning kiểu "soft lock"

Đây là chỗ then chốt nối tới nguyên tắc "exam-delivery tự chủ tuyệt đối lúc thi" ở [ADR-001](02-kien-truc-adr.md) — snapshot phải **thực sự bất biến**, không phải chỉ khóa sửa ở tầng UI:

```java
@Transactional
public SnapshotResponse publish(UUID blueprintPublicId, CurrentUser caller) {
    ExamBlueprint blueprint = blueprintRepository.findWithItemsByPublicId(blueprintPublicId)
            .orElseThrow(BlueprintNotFoundException::new);
    if (blueprint.getItems().isEmpty()) throw new EmptyBlueprintException();

    int version = (int) snapshotRepository.countBySourceBlueprintPublicId(blueprintPublicId) + 1;
    ExamSnapshot snapshot = new ExamSnapshot();
    snapshot.setVersion(version);
    snapshot.setSourceBlueprintPublicId(blueprintPublicId);
    blueprint.getItems().forEach(item -> snapshot.addItem(freeze(item)));  // deep-copy từng câu hỏi

    ExamSnapshot saved = snapshotRepository.save(snapshot);
    blueprint.setStatus(BlueprintStatus.PUBLISHED);
    emitPublished(saved);  // outbox event, cùng transaction
    return SnapshotMapper.toResponse(saved);
}

private SnapshotItem freeze(BlueprintItem blueprintItem) {
    Question question = questionRepository.findWithOptionsByPublicId(blueprintItem.getQuestionPublicId())
            .orElseThrow(QuestionNotFoundException::new);
    SnapshotItem item = new SnapshotItem();
    item.setPromptText(question.getPromptText());
    item.setOptionsJson(serializeOptions(question));  // options serialize thành JSON, KHÔNG tham chiếu row gốc
    ...
    return item;
}
```

`freeze()` copy toàn bộ nội dung câu hỏi — kể cả options — thành JSON gắn trực tiếp trên `SnapshotItem`, không giữ foreign key trỏ về `Question` gốc. Sau publish, `HOST_AUTHOR` sửa câu hỏi gốc thoải mái — snapshot đã publish **không đổi theo**. `version` tăng dần theo số lần publish cùng 1 blueprint — mỗi lần publish là một snapshot mới, giữ nguyên các bản trước, không ghi đè.

## Một bug thật: `RE_ORDER_PARAGRAPHS` cần thứ tự bị xáo, không phải thứ tự đúng

```java
/**
 * ...serving the natural (already-ascending) order would deliver every
 * paragraph already correctly placed, making the task trivially solved
 * without any rearranging. A fixed single-position rotation ... breaks
 * that alignment deterministically...
 */
List<QuestionOption> deliveryOrder(Question question) {
    List<QuestionOption> natural = question.getOptions();
    if (question.getPteTaskType() != PteTaskType.RE_ORDER_PARAGRAPHS || natural.size() < 2) {
        return natural;
    }
    List<QuestionOption> rotated = new ArrayList<>(natural);
    Collections.rotate(rotated, 1);
    return rotated;
}
```

`Question.options` luôn trả về theo `orderIndex` tăng dần (JPA `@OrderBy`) — đúng cho mọi task trắc nghiệm bình thường, vì `orderIndex` ở đó chỉ là định danh lựa chọn ổn định. Nhưng `RE_ORDER_PARAGRAPHS` dùng chính `orderIndex` làm **vị trí đúng cuối cùng** — nếu serve nguyên thứ tự tự nhiên, học viên nhận đề đã đúng thứ tự sẵn, tác vụ "sắp xếp lại" trở thành vô nghĩa. Xoay vòng 1 vị trí (`Collections.rotate(rotated, 1)`) đảm bảo mọi lựa chọn dời khỏi vị trí đúng của nó một cách xác định — đây là fix đúng-sai tối thiểu, không phải tính năng random hóa đề (random thật sự là việc khác, để dành cho sau).

## Nội bộ vs bên ngoài: 2 endpoint đọc snapshot khác quyền

`SnapshotPublishService` có `get()` (cho người dùng thật, qua `SnapshotController`, kiểm tra `AuthoringAccessPolicy`) và `getContent()`/`getSummary()` (cho service khác gọi nội bộ — `exam-delivery` lúc pin attempt, `scheduling` lúc tạo session) — **không** check `CurrentUser`/tenant visibility, vì caller ở đây xác thực bằng `ROLE_INTERNAL_SERVICE`, không phải người dùng, và quyền truy cập của học viên/host đã được `scheduling`/`exam-delivery` tự gate ở lớp entitlement riêng của chúng trước khi gọi tới đây. Tách endpoint theo *loại caller* (người vs service) thay vì cố nhét chung 1 endpoint với nhiều nhánh quyền là lý do 2 hàm `get`/`getSummary` trông "giống hệt nhau" vẫn tồn tại song song có chủ đích.

---

*Bài tiếp theo: [Host tổ chức thi](08-scheduling-va-enrollment.md) — tạo session, enrollment, phát command host-facing.*
