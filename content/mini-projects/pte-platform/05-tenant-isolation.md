# PTE Platform — Cách Ly Multi-Tenant: 3 Lớp Độc Lập

*Bài 5/5 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Nhiều tổ chức luyện thi (host/tenant) dùng chung một instance `authoring`. "Chung service" không đồng nghĩa "chung số phận" — ADR-003 tách rõ 3 lớp cách ly độc lập, mỗi lớp giải một loại rủi ro khác nhau, và cố tình **không trộn chúng vào nhau**.

## Lớp 1 — Data isolation: rò dữ liệu chéo tenant

Đây là lớp nghiêm trọng nhất — một dòng dữ liệu lộ sang tenant khác là sự cố bảo mật, không phải bug thường. Model: shared DB, shared schema, mỗi bảng có cột `tenant_id` (DB-per-tenant chỉ dành cho host enterprise yêu cầu cách ly vật lý riêng).

**Thiết kế theo ADR-003** ép cách ly ở tầng Postgres bằng Row-Level Security — `app.current_tenant` set cho mỗi connection từ JWT claim, policy `USING (tenant_id = current_setting('app.current_tenant'))` áp cho mọi query, để một dev quên viết `WHERE tenant_id = ?` vẫn bị DB chặn thay vì lộ dữ liệu.

**Thực tế implementation hiện tại** cho `authoring` enforce ở tầng application, chưa phải RLS ở DB:

```java
// authoring/service/AuthoringAccessPolicy.java
public boolean canRead(UUID entityTenantId, boolean shared, CurrentUser caller) {
    if (shared) {
        return true;
    }
    if (caller.isPlatformUser()) {
        return true;
    }
    return entityTenantId != null && entityTenantId.equals(caller.tenantId());
}

public boolean canWriteShared(CurrentUser caller) {
    return caller.isPlatformUser();
}
```

`shared` (nội dung admin tạo, `tenant_id = NULL`) thì ai cũng đọc được, chỉ `PLATFORM_AUTHOR` mới ghi. Với dữ liệu riêng tenant, `canRead` so khớp `tenant_id` của entity với `tenant_id` trong JWT của người gọi. Đây là kiểm tra đúng logic ADR-003 mô tả — nhưng nằm ở tầng service, nghĩa là nó phụ thuộc vào việc **mọi query/mọi endpoint đều gọi đúng qua policy này**. RLS ở tầng DB (theo đúng ADR-003) là lớp phòng thủ thứ hai, ép cứng ngay cả khi một chỗ nào đó trong code quên gọi policy — phần đó là khoảng cách giữa thiết kế và implementation hiện tại, chưa phải "đã xong".

## Lớp 2 — Resource isolation: noisy neighbor

Một tenant chạy bulk-import 5000 câu hỏi không được phép làm chậm tenant khác đang thao tác trên cùng service. Giải pháp không phải tách service theo tenant (vô nghĩa khi có hàng trăm host) — mà là rate-limit tại gateway, đây là phần **đã có code thật**, không chỉ dừng ở thiết kế:

```java
// gateway/config/RateLimitConfig.java
@Bean
public KeyResolver tenantKeyResolver() {
    return exchange -> exchange.getPrincipal()
            .filter(JwtAuthenticationToken.class::isInstance)
            .cast(JwtAuthenticationToken.class)
            .map(token -> resolveTenant(token))
            .defaultIfEmpty(ANONYMOUS_KEY);
}

private String resolveTenant(JwtAuthenticationToken token) {
    String tenantId = token.getToken().getClaimAsString(SecurityClaims.TENANT_ID);
    return (tenantId == null || tenantId.isBlank()) ? ANONYMOUS_KEY : tenantId;
}
```

`KeyResolver` là hook chuẩn của Spring Cloud Gateway — trả về key nào thì Redis token bucket rate-limit theo key đó. Ở đây key là `tenant_id` lấy từ JWT claim, không phải IP hay user — nghĩa là một tenant bị giới hạn theo tổng lưu lượng của **toàn bộ user thuộc tenant đó**, không phải từng user riêng lẻ. Request chưa có JWT hợp lệ (hoặc chưa gắn tenant) rơi vào bucket `"anonymous"` dùng chung — cách ly khỏi các tenant đã xác thực.

Đi kèm 2 nguyên tắc khác ở tầng service: **bulk-import chạy async** — không chạy inline trên request thread mà đẩy qua RabbitMQ work-queue với concurrency cap riêng per-tenant; **connection pool đủ lớn + statement timeout** — một query chậm của tenant A không giữ connection vô thời hạn, chặn tenant B.

## Lớp 3 — Fault/blast-radius: một tenant crash không kéo tenant khác

Nhiều replica stateless sau load balancer, input validation cứng kèm giới hạn payload size (chặn poison request từ một tenant làm sập cả instance), circuit breaker giữa `authoring` và các dependency của nó.

**Ranh giới quan trọng nhất trong cả 3 lớp:** multi-tenant chung service chấp nhận được cho `authoring` — vì downtime của nó chịu được (host chờ vài phút không sao). `exam-delivery` thì **không** — một học viên đang thi mà bị crash-do-tenant-khác là không thể chấp nhận, đó chính xác là lý do `exam-delivery` bị tách riêng thành service độc lập ngay từ ADR-001, không chỉ dựa vào 3 lớp isolation nói trên là đủ.

## Xác thực tại biên trước khi chạm bất kỳ lớp nào

Cả 3 lớp isolation phía trên chỉ có ý nghĩa nếu request đã mang đúng `tenant_id` đáng tin — đó là việc gateway làm trước tiên, ở tầng biên, trước khi request chạm service nghiệp vụ nào:

```java
// gateway/config/SecurityConfig.java
.authorizeExchange(exchange -> exchange
        .pathMatchers(PUBLIC_PATHS).permitAll()
        .anyExchange().authenticated())
.oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()));
```

`PUBLIC_PATHS` chỉ gồm health check và 4 endpoint bootstrap auth (`login`/`refresh`/`logout`/`jwks`) — lý do những endpoint này phải public là vì **chưa có JWT để xác thực chúng**, và `jwks` chính là thứ cho phép gateway (và mọi service khác) verify chữ ký JWT ngay từ đầu. Mọi exchange khác bắt buộc `authenticated()` — JWT sai hoặc thiếu bị chặn tại gateway, không bao giờ tới được `authoring`/`exam-delivery` để policy tầng trong phải xử lý.

## Hạ tầng hỗ trợ, triển khai theo lớp — không dàn hàng ngang

ADR-003 liệt kê ~15 thành phần hạ tầng nhưng nhấn mạnh thứ tự ưu tiên rõ ràng, không làm cùng lúc:

1. **Redis warm cache + single-flight lock** — làm trước nhất, vì đây là trải nghiệm học viên nạp đề thi. Đề là snapshot bất biến nên TTL vô hạn, không cần invalidation, không cần lo cache stampede do write.
2. **PgBouncer** — làm sớm, rẻ nhất, chỉ là config đặt trước Postgres, cap số kết nối READ đồng thời.
3. **Gateway rate-limit** — sau khi có gateway, dùng chính Redis làm counter (đúng `RateLimitConfig` ở trên).
4. **RabbitMQ load-leveling** — chỉ khi có write nặng thật (bulk-import), không dựng broker rỗng chờ sẵn.
5. **Read replica** — cuối cùng, chỉ khi đo được read thực sự đè lên write ở primary.

Nguyên tắc chốt: READ được điều tiết bằng PgBouncer pool size (đồng bộ), WRITE được điều tiết bằng RabbitMQ consumer concurrency (bất đồng bộ) — hai van khác tầng, không dùng lẫn cho nhau. Phần bảo mật nâng cao hơn (Vault cho dynamic credential, Keycloak cho OIDC/MFA, Linkerd cho mTLS tự động giữa service) được xếp vào nhóm "nền không thể thiếu" nhưng **triển khai sau khi phần isolation cơ bản đã chạy ổn**, không làm trước.

---

*Đã đi hết 4 mảng kỹ thuật nổi bật của PTE Platform: [kiến trúc & ADR](02-kien-truc-adr.md), [mã hóa đáp án](03-ma-hoa-dap-an.md), [event-driven saga](04-event-driven-saga.md), và tenant isolation ở trên. Series sẽ được cập nhật thêm khi có chức năng mới triển khai.*
