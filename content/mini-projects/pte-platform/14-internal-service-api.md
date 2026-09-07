# PTE Platform — Internal Service-to-Service API: Ranh Giới Riêng Cho Cuộc Gọi Giữa Service

*Bài 14/14 (cuối) trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Xuyên suốt series, nhiều nơi đã nhắc "gọi nội bộ" — `exam-delivery` pin snapshot gọi `authoring`/`scheduling`/`media` ([bài 9](09-attempt-state-machine.md)), `reporting` rebuild gọi `exam-delivery`/`scoring` ([bài 12](12-scoring-review-va-reporting.md)). Bài cuối này gom lại: những cuộc gọi đó xác thực bằng cơ chế gì, và vì sao nó phải tách hẳn khỏi JWT người dùng.

## Vì sao không dùng JWT cho cuộc gọi giữa service

JWT ở [bài 6](06-admin-va-iam.md) đại diện cho **một người dùng cụ thể** — subject là `publicId` của user, claim mang `tenant_id`/`roles` của chính người đó. Một cuộc gọi service-to-service (ví dụ `exam-delivery` hỏi `authoring` "nội dung snapshot X là gì") không có người dùng nào đứng sau nó tại thời điểm gọi — hoặc có, nhưng danh tính không quan trọng bằng việc **caller là chính service đó, không phải ai giả mạo**. Dùng JWT ở đây buộc phải "mượn" JWT của người dùng đang request gốc, kéo dài vòng đời token qua nhiều hop, phức tạp không cần thiết cho một việc đơn giản: xác nhận "bạn là service hợp lệ trong hệ thống".

## Xác thực bằng shared secret, constant-time so sánh, filter chain riêng biệt

```java
/**
 * Authenticates a request as ROLE_INTERNAL_SERVICE when it carries the
 * shared header. Wired into a SEPARATE, narrower SecurityFilterChain matched
 * to /internal/** only — never the main JWT chain — so a leaked/guessed key
 * can't authenticate anything outside the explicit internal surface. Key
 * comparison uses MessageDigest.isEqual (constant-time) rather than
 * String.equals (code-review finding, fixed) to avoid a timing side-channel
 * on the shared secret.
 */
public class InternalApiKeyFilter extends OncePerRequestFilter {

    private final String expectedKey;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain) {
        String provided = request.getHeader(InternalServiceAuth.HEADER);
        if (provided != null
                && MessageDigest.isEqual(provided.getBytes(UTF_8), expectedKey.getBytes(UTF_8))) {
            var authorities = List.of(new SimpleGrantedAuthority(InternalServiceAuth.AUTHORITY_INTERNAL_SERVICE));
            var auth = new UsernamePasswordAuthenticationToken("internal-service", null, authorities);
            SecurityContextHolder.getContext().setAuthentication(auth);
        }
        chain.doFilter(request, response);
    }
}
```

Ba quyết định bảo mật đáng chú ý trong một class ngắn:

1. **`MessageDigest.isEqual` thay vì `String.equals`.** So sánh chuỗi thường trả về sai sớm ngay ký tự đầu tiên không khớp — kẻ tấn công đo thời gian phản hồi có thể suy ra dần từng ký tự đúng của key (timing side-channel). `MessageDigest.isEqual` luôn so sánh đủ độ dài bất kể khớp hay không, thời gian chạy không phụ thuộc nội dung.
2. **Filter chain riêng cho `/internal/**`, không chung với chain JWT chính.** Một key bị lộ hoặc đoán trúng chỉ xác thực được đúng phạm vi `/internal/**` — không có cách nào dùng nó để giả mạo một người dùng thật ở API công khai.
3. **`AUTHORITY_INTERNAL_SERVICE` là 1 authority riêng**, không map vào bất kỳ role người dùng nào (`STUDENT`, `HOST_ADMIN`...) — endpoint nội bộ dùng `@PreAuthorize("hasRole('INTERNAL_SERVICE')")` không thể vô tình khớp với JWT của người dùng thật dù JWT đó có quyền cao tới đâu.

## Danh sách endpoint nội bộ và lý do mỗi cái tồn tại

| Controller | Service | Việc |
|---|---|---|
| `InternalSnapshotController` | authoring | `exam-delivery` lấy full nội dung (kèm đáp án đúng) để pin, `scheduling` lấy summary (không đáp án) cho composition |
| `InternalSessionController` | scheduling | `exam-delivery` check entitlement lúc tạo attempt, `proctor` check assignment lúc mở phiên giám sát |
| `InternalMediaController` | media | `exam-delivery` presign URL đọc audio/ảnh lúc pin snapshot |
| `InternalExportController` | exam-delivery, scoring | `reporting` kéo dữ liệu để rebuild read model |
| `InternalRebuildController` | reporting | vận hành viên bootstrap toàn bộ tenant cho instance `reporting` mới, trống dữ liệu |

Một chi tiết dễ bị đọc nhầm: `InternalSnapshotController.getContent` **trả về cả đáp án đúng** — doc comment cảnh báo tường minh "never call that from a human-facing flow". Một endpoint như vậy không thể tồn tại ở API công khai dưới bất kỳ role nào (kể cả `PLATFORM_ADMIN`) — nó chỉ an toàn vì `/internal/**` không bao giờ lộ ra ngoài, tách biệt hoàn toàn khỏi mọi con đường mà client thật có thể chạm tới.

## Export cho rebuild: phân trang bằng keyset cursor, không phải offset

`InternalExportController` (ở cả `exam-delivery` và `scoring`) phục vụ đúng 1 mục đích: cho [`reporting` rebuild read model](12-scoring-review-va-reporting.md) khi cần dựng lại từ đầu — không phải đường đi chính (đường chính vẫn là `@RabbitListener` steady-state). Vì dữ liệu xuất ra có thể tới hàng triệu dòng, phân trang dùng **keyset cursor** (`updatedAt` + `publicId`) thay vì `OFFSET/LIMIT` truyền thống — offset lớn trên Postgres chậm dần theo số trang đã lướt qua, keyset cursor giữ tốc độ ổn định bất kể đang ở trang thứ mấy:

```java
@GetMapping("/attempts/export")
public ApiResponse<ExportPage<AttemptExportItem>> exportAttempts(Authentication authentication,
        @RequestParam(required = false) UUID tenantId,
        @RequestParam(required = false) String since,
        @RequestParam(required = false) Integer limit) {
    UUID scopedTenantId = InternalExportScope.resolve(authentication, tenantId);
    KeysetCursor.Cursor cursor = KeysetCursor.decode(since);
    Instant cursorTime = cursor != null ? cursor.updatedAt() : Instant.EPOCH;
    UUID cursorId = cursor != null ? cursor.publicId() : new UUID(0, 0);

    List<ExamAttempt> rows = examAttemptRepository.findSubmittedForExport(
            scopedTenantId, cursorTime, cursorId, PageRequest.of(0, boundedLimit(limit)));
    ...
}
```

`AttemptExportItem`/`AnswerExportItem` chỉ mang đúng tập field `reporting` thật sự cần chiếu lại — không phải toàn bộ aggregate gốc. Đây là ranh giới rõ ràng giữa "nội bộ" và "toàn quyền": dù là service-to-service, endpoint export vẫn không phơi trọn vẹn entity nội bộ của mình ra ngoài, chỉ đúng phần cần thiết cho mục đích cụ thể đó.

## Ranh giới tenant vẫn phải giữ, kể cả giữa các service tin cậy nhau

```java
/**
 * Resolves the tenant scope for a /internal/**\/export endpoint: a request
 * tenantId is required UNLESS the caller carries
 * AUTHORITY_INTERNAL_SERVICE_BOOTSTRAP, in which case omitting tenantId
 * means "export ALL tenants." Centralized here, not duplicated per
 * controller, because this is the actual security boundary preventing a
 * normal per-tenant-forwarding call from silently widening into a
 * cross-tenant export.
 */
public static UUID resolve(Authentication authentication, UUID requestedTenantId) {
    if (requestedTenantId != null) {
        return requestedTenantId;
    }
    boolean bootstrapAuthorized = authentication.getAuthorities().stream()
            .anyMatch(a -> InternalServiceAuth.AUTHORITY_INTERNAL_SERVICE_BOOTSTRAP.equals(a.getAuthority()));
    if (!bootstrapAuthorized) {
        throw new AccessDeniedException("tenantId is required unless authorized for the all-tenant bootstrap export mode");
    }
    return null;   // null nghĩa là "toàn bộ tenant" — CHỈ hợp lệ khi có quyền bootstrap
}
```

Đây chính xác là điểm khác biệt giữa `RebuildController` (host tự rebuild dữ liệu tenant mình, [bài 12](12-scoring-review-va-reporting.md)) và `InternalRebuildController` (vận hành viên bootstrap toàn bộ):

```java
/**
 * New-instance full-bootstrap rebuild — a fresh reporting instance with an
 * empty DB has no single tenant's JWT to drive tenant scoping, so this is a
 * distinct, more-privileged trigger: requires BOTH the base internal-service
 * key AND the separate bootstrap key, invoked by an operator/ops script,
 * never by another service in the normal request path. Rebuilds ALL tenants.
 */
@RequestMapping("/internal/rebuild")
@PreAuthorize("hasRole('INTERNAL_SERVICE_BOOTSTRAP')")
public class InternalRebuildController {
    @PostMapping("/bootstrap")
    public ApiResponse<RebuildSummary> bootstrap() {
        return ApiResponse.success(rebuildOrchestrationService.rebuild(null));   // null = mọi tenant
    }
}
```

`INTERNAL_SERVICE_BOOTSTRAP` là một authority **tách riêng khỏi** `INTERNAL_SERVICE` thường — cần **cả 2 key cùng lúc** (`X-Internal-Service-Key` + `X-Internal-Bootstrap-Key`, theo đúng thiết kế đã nhắc ở [bài saga](04-event-driven-saga.md)). Một service bình thường có key nội bộ thông thường không thể tự ý gọi bootstrap toàn hệ thống — quyền "xuất dữ liệu mọi tenant cùng lúc" bị khóa sau một lớp xác thực cao hơn hẳn, chỉ dành cho vận hành viên chạy script thủ công, không nằm trong bất kỳ luồng request bình thường nào giữa các service.

## Tổng kết: 3 lớp phòng thủ cho một "cuộc gọi tin cậy"

Ngay cả khi service A tin tưởng service B hoàn toàn, mỗi endpoint nội bộ vẫn giữ đủ 3 lớp: **xác thực** (key so sánh constant-time, filter chain riêng), **phạm vi dữ liệu** (tenant scope không bao giờ ngầm định "tất cả" trừ khi có quyền bootstrap rõ ràng), và **phạm vi trường dữ liệu** (export chỉ trả đúng field cần, không phơi nguyên aggregate). Ba lớp này lặp lại đúng tinh thần "defense in depth" đã xuất hiện xuyên suốt series — từ RLS + rate-limit + fault-boundary ở [bài 5](05-tenant-isolation.md), tới ownership check kép ở [bài media](11-media-upload.md) — chỉ khác là lần này áp dụng cho ranh giới giữa các service với nhau, không phải giữa người dùng với hệ thống.

---

*Đến đây, series case study PTE Platform khép lại đủ 14 bài — từ kiến trúc nền tảng, qua toàn bộ luồng nghiệp vụ theo vai trò, tới các cơ chế cross-cutting (fan-out messaging, internal API). Sẽ cập nhật thêm khi dự án có chức năng mới triển khai.*
