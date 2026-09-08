# PTE Platform — Nền Tảng: Platform Admin & IAM/Auth Flow

*Bài 6/12 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Trước khi có bất kỳ đề thi hay học viên nào, hệ thống cần một tenant tồn tại và một cách để mọi vai trò đăng nhập được. Bài này đi theo đúng thứ tự vai trò cao nhất trước: `PLATFORM_ADMIN` tạo tenant → `HOST_ADMIN` được cấp tài khoản → mọi vai trò xác thực qua cùng một luồng JWT.

## 1. Platform Admin: onboard tenant

`admin` service quản lý vòng đời tenant — toàn bộ endpoint khóa cứng `@PreAuthorize("hasRole('PLATFORM_ADMIN')")`, không ai khác chạm được:

```java
// admin/controller/TenantController.java
@RestController
@RequestMapping("/tenants")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class TenantController {

    @PostMapping
    public ApiResponse<TenantResponse> onboard(@Valid @RequestBody OnboardTenantRequest request) {
        return ApiResponse.success(tenantLifecycleService.onboard(request));
    }

    @PostMapping("/{publicId}/suspend")
    public ApiResponse<TenantResponse> suspend(@PathVariable UUID publicId) { ... }

    @PostMapping("/{publicId}/reactivate")
    public ApiResponse<TenantResponse> reactivate(@PathVariable UUID publicId) { ... }

    @PostMapping("/{publicId}/quota-transactions")
    public ApiResponse<QuotaTransactionResponse> grantQuota(@PathVariable UUID publicId,
            @Valid @RequestBody GrantQuotaRequest request) { ... }
}
```

`suspend`/`reactivate` tách riêng khỏi CRUD thường vì đây chính là cơ chế kill-switch ADR-001 nhắc tới — admin có thể tắt một tenant ngay lập tức mà không xóa dữ liệu. `grantQuota` + `quotaHistory` theo dõi hạn mức sử dụng (số câu hỏi, số phiên thi...) per tenant, tách thành sub-resource `/quota-transactions` thay vì field đơn trên `Tenant` — giữ lịch sử audit ai cấp bao nhiêu, khi nào.

Dưới `Tenant` là `Organization` (chi nhánh/cơ sở), cùng khóa `PLATFORM_ADMIN`:

```java
// admin/controller/OrganizationController.java
@RequestMapping("/tenants/{tenantPublicId}/organizations")
@PreAuthorize("hasRole('PLATFORM_ADMIN')")
public class OrganizationController {
    @PostMapping
    public ApiResponse<OrganizationResponse> create(@PathVariable UUID tenantPublicId,
            @Valid @RequestBody CreateOrganizationRequest request) { ... }
    // list / get / suspend / reactivate — cùng pattern lồng dưới tenant
}
```

Path lồng `/tenants/{tenantPublicId}/organizations` (thay vì `/organizations` phẳng + field `tenantId` trong body) buộc mọi request phải nêu rõ tenant ngay trên URL — không có cách nào gọi endpoint này mà quên chỉ định tenant.

## 2. Cấp tài khoản: ai được tạo user cho ai

`iam.UserController` mở cho 2 role, nhưng phạm vi khác nhau hoàn toàn — kiểm tra tenant scope nằm ở tầng service, không phải chỉ dựa vào `@PreAuthorize`:

```java
// iam/controller/UserController.java
@RequestMapping("/users")
@PreAuthorize("hasAnyRole('PLATFORM_ADMIN','HOST_ADMIN')")
public class UserController {

    @PostMapping
    public ApiResponse<UserResponse> create(@Valid @RequestBody CreateUserRequest request) {
        return ApiResponse.success(userService.create(request, currentUser()));
    }

    @PostMapping("/bulk")
    public ApiResponse<BulkCreateUsersResponse> createBulk(@Valid @RequestBody BulkCreateUsersRequest request) { ... }

    @GetMapping
    public ApiResponse<List<UserResponse>> list() {
        return ApiResponse.success(userService.listByTenant(currentUser()));  // scope theo tenant của caller
    }

    // Tách riêng khỏi GET /users vì ngữ nghĩa khác hẳn: platform admin tra cứu
    // MỘT tenant bất kỳ theo ID, không phải "tenant của chính mình".
    @GetMapping("/by-tenant/{tenantId}")
    @PreAuthorize("hasRole('PLATFORM_ADMIN')")
    public ApiResponse<List<UserResponse>> listByTenant(@PathVariable UUID tenantId) { ... }
}
```

`HOST_ADMIN` gọi được `POST /users` và `GET /users` y hệt `PLATFORM_ADMIN` — nhưng `userService.create`/`listByTenant` tự giới hạn theo `currentUser().tenantId()`, một host không thể tạo hay xem user của tenant khác dù request hợp lệ về mặt role. Đây là đúng pattern 2 tầng đã thấy ở [bài tenant isolation](05-tenant-isolation.md): role chặn *loại* thao tác, tenant scope ở service chặn *phạm vi dữ liệu*. `listByTenant` (khác hẳn `listByTenant()` không tham số ở trên) là lối riêng chỉ platform admin đi, tách endpoint thay vì overload thêm tham số optional vào `GET /users` — tránh 1 endpoint gánh 2 ngữ nghĩa khác nhau tùy role gọi.

## 3. Auth flow: login → access JWT + refresh token

```java
// iam/service/AuthService.java
@Transactional
public TokenResponse login(LoginRequest request) {
    User user = userRepository.findByEmail(request.email()).orElseThrow(InvalidLoginException::new);
    if (user.isSuspended()) throw new InvalidLoginException();
    LoginHash loginHash = loginHashRepository.findByUserId(user.getId()).orElseThrow(InvalidLoginException::new);
    if (!passwordEncoder.matches(request.password(), loginHash.getHash())) throw new InvalidLoginException();
    return issueTokens(user);
}

private TokenResponse issueTokens(User user) {
    String accessToken = accessTokenIssuer.issue(user);
    String refreshToken = refreshTokenService.issue(user);
    return TokenResponse.bearer(accessToken, refreshToken, IamConstants.ACCESS_TOKEN_TTL_SECONDS);
}
```

Access token là JWT RS256 sống ngắn, refresh token là chuỗi ngẫu nhiên **lưu dạng hash** (không lưu plaintext, giống mật khẩu) và **rotate** — mỗi lần `refresh()` tiêu thụ (`consume`) token cũ và phát token mới, token cũ không dùng lại được. Sai mật khẩu hay user bị suspend đều gom về cùng `InvalidLoginException` — không tiết lộ "email tồn tại nhưng sai mật khẩu" khác với "email không tồn tại".

Claim quan trọng nhất nằm ở bước ký token:

```java
// iam/security/AccessTokenIssuer.java
public String issue(User user) {
    List<String> roles = user.getRoles().stream().map(Role::name).toList();

    JwtClaimsSet.Builder claims = JwtClaimsSet.builder()
            .issuer(IamConstants.TOKEN_ISSUER)
            .subject(user.getPublicId().toString())
            .claim(SecurityClaims.ROLES, roles);
    if (user.getTenantId() != null) {
        claims.claim(SecurityClaims.TENANT_ID, user.getTenantId().toString());
    }

    JwsHeader header = JwsHeader.with(SignatureAlgorithm.RS256).keyId(IamConstants.KEY_ID).build();
    return jwtEncoder.encode(JwtEncoderParameters.from(header, claims.build())).getTokenValue();
}
```

`tenant_id` và `roles` nhét thẳng vào claim — đây chính là claim mà [`gateway.RateLimitConfig.tenantKeyResolver`](05-tenant-isolation.md) đọc ra để rate-limit theo tenant, và mọi `@PreAuthorize("hasRole(...)")` trên các controller ở trên đọc ra để phân quyền. `subject` dùng `publicId` (UUID ổn định) chứ không phải email — đổi email không làm token cũ mất hiệu lực bất thường, và không service nào cần biết email để xác thực claim.

## 3b. Refresh token: rotate, không lưu plaintext, single-use

```java
/**
 * Issues, rotates, and revokes refresh tokens. Only the SHA-256 hash is
 * stored; the raw token is returned once. Rotation (consume) revokes the
 * presented token so a stolen-and-replayed refresh token is single-use.
 */
@Transactional
public String issue(User user) {
    String raw = UUID.randomUUID() + "." + UUID.randomUUID();
    RefreshToken token = new RefreshToken();
    token.setUserId(user.getId());
    token.setTokenHash(tokenHasher.hash(raw));
    token.setExpiresAt(Instant.now().plusSeconds(IamConstants.REFRESH_TOKEN_TTL_SECONDS));
    refreshTokenRepository.save(token);
    return raw;   // duy nhất lần này raw token còn ở dạng đọc được
}

@Transactional
public Long consume(String rawToken) {
    RefreshToken token = refreshTokenRepository.findByTokenHash(tokenHasher.hash(rawToken))
            .orElseThrow(InvalidRefreshTokenException::new);
    if (!token.isActive(Instant.now())) throw new InvalidRefreshTokenException();
    token.setRevoked(true);   // dùng 1 lần — refresh lần sau bắt buộc dùng token MỚI vừa phát
    return token.getUserId();
}
```

Refresh token lưu dưới dạng hash (giống cách `LoginHash` lưu mật khẩu, không phải plaintext) — DB bị đọc trộm cũng không lộ token dùng được. `consume()` đánh dấu `revoked=true` ngay khi tiêu thụ — một refresh token bị đánh cắp và replay chỉ dùng được đúng 1 lần trước khi chủ sở hữu hợp lệ (đã dùng nó trước đó) phát hiện phiên bị "nhảy" bất thường.

## 3c. Cấp tài khoản hàng loạt và reset mật khẩu: giới hạn theo vai trò gọi

```java
/** Roles a tenant-scoped caller (HOST_ADMIN) may reset — rescuing a
 *  locked-out Student/Proctor, not a peer admin. */
private static final Set<Role> HOST_RESETTABLE_ROLES = Set.of(Role.STUDENT, Role.PROCTOR);

@Transactional
public UserResponse resetPassword(UUID publicId, ResetPasswordRequest request, CurrentUser caller) {
    User user = findScoped(publicId, caller);
    if (!caller.isPlatformUser() && !HOST_RESETTABLE_ROLES.containsAll(user.getRoles())) {
        throw new ForbiddenPasswordResetException();
    }
    ...
}
```

`HOST_ADMIN` reset được mật khẩu học viên/giám thị bị khóa tài khoản (tình huống thực tế phổ biến) — nhưng **không** reset được mật khẩu của `HOST_ADMIN`/`HOST_AUTHOR` khác, kể cả cùng tenant. Chỉ `PLATFORM_ADMIN` mới vượt qua giới hạn này. Đây là ranh giới quyền hạn tinh hơn những gì `@PreAuthorize` ở controller thể hiện — controller chỉ chặn 2 role được gọi endpoint, còn "gọi được nhưng target là ai" nằm ở kiểm tra bên trong service.

Tạo hàng loạt (`createBulk`) chọn chiến lược lỗi khác hẳn chiến lược lỗi của tạo đơn:

```java
/**
 * A within-batch duplicate email rejects the whole request (nothing
 * written); a conflict with an EXISTING user just skips that row and
 * reports it. Each row runs in its own REQUIRES_NEW transaction, so a rare
 * concurrent-duplicate race only loses that one row.
 */
public BulkCreateUsersResponse createBulk(BulkCreateUsersRequest request, CurrentUser caller) {
    ...
    for (BulkCreateUserRow row : request.rows()) {
        if (existingEmails.contains(row.email())) {
            skipped.add(new RowError(rowIndex, row.email(), IamConstants.EMAIL_ALREADY_USED));
            continue;   // KHÔNG chặn cả batch, chỉ skip dòng này
        }
        bulkCreateWriter.createOne(writerRow, tenantId)
                .ifPresentOrElse(
                        result -> created.add(new CreatedUser(...)),
                        () -> skipped.add(new RowError(rowIndex, row.email(), IamConstants.EMAIL_ALREADY_USED)));
    }
    return new BulkCreateUsersResponse(created, skipped);
}
```

Trùng email **ngay trong file import** (2 dòng cùng email) là lỗi cấu trúc dữ liệu đầu vào — từ chối toàn bộ request trước khi ghi gì. Trùng với user **đã tồn tại sẵn** trong hệ thống thì khác hẳn về bản chất — không phải lỗi của người import, chỉ đơn giản dòng đó đã có, nên bị skip và báo lại trong response, các dòng còn lại vẫn tạo bình thường. Mỗi dòng chạy trong transaction `REQUIRES_NEW` riêng — một race hiếm gặp (2 request bulk-import trùng thời điểm cùng chứa 1 email) chỉ làm mất đúng dòng đó, không rollback cả batch.

## 4. Vì sao mọi service verify JWT local, không gọi lại iam

```java
// iam/controller/JwksController.java
@GetMapping("/jwks")
public Map<String, Object> jwks() {
    return rsaKeyProvider.publicJwkSet().toJSONObject();
}
```

Mỗi service (kể cả gateway) trỏ `jwk-set-uri` về endpoint này **một lần lúc khởi động** (cache lại), rồi tự verify chữ ký JWT bằng public key đã cache — không có request nào gọi sống sang `iam` để "hỏi token này còn hợp lệ không". Hệ quả trực tiếp đã nêu ở [ADR-002](02-kien-truc-adr.md): `iam` sập, token còn hạn (mặc định ngắn, theo `ACCESS_TOKEN_TTL_SECONDS`) vẫn xác thực được bình thường ở mọi service khác — không có single point of failure runtime cho việc xác thực, dù `iam` vẫn là root-of-trust duy nhất phát hành token mới.

---

*Bài tiếp theo: [Host soạn đề](07-authoring-va-task-type.md) — 22 task type, blueprint, và publish snapshot bất biến.*
