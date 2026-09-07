# PTE Platform — Cách Ly Multi-Tenant: 3 Lớp Độc Lập

*Bài 5/5 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Nhiều tổ chức luyện thi (host/tenant) dùng chung một instance `authoring`. "Chung service" không đồng nghĩa "chung số phận" — ADR-003 tách rõ 3 lớp cách ly độc lập, mỗi lớp giải một loại rủi ro khác nhau, và cố tình **không trộn chúng vào nhau**.

## Lớp 1 — Data isolation: rò dữ liệu chéo tenant

Đây là lớp nghiêm trọng nhất — một dòng dữ liệu lộ sang tenant khác là sự cố bảo mật, không phải bug thường. Model mặc định: shared DB, shared schema, mỗi bảng có cột `tenant_id` (DB-per-tenant chỉ dành cho host enterprise yêu cầu cách ly vật lý riêng).

Điểm mấu chốt: cách ly được **ép ở tầng Postgres bằng Row-Level Security, không tin tưởng tầng application**. `app.current_tenant` được set cho mỗi connection từ JWT claim, policy `USING (tenant_id = current_setting('app.current_tenant'))` áp cho mọi query. Một dev quên viết `WHERE tenant_id = ?` trong code — DB vẫn chặn, không phải hy vọng code review bắt được. Nội dung toàn cục do admin tạo (`tenant_id = NULL`) thì host chỉ đọc, chỉ role `PLATFORM_AUTHOR` mới ghi được.

## Lớp 2 — Resource isolation: noisy neighbor

Một tenant chạy bulk-import 5000 câu hỏi không được phép làm chậm tenant khác đang thao tác trên cùng service. Giải pháp không phải tách service theo tenant (vô nghĩa khi có hàng trăm host) — mà là:

- **Rate-limit/quota per-tenant ở gateway** — token bucket theo `tenant_id`, chặn/làm chậm sớm nhất có thể, trước khi request chạm tới service nghiệp vụ.
- **Bulk-import chạy async** — không chạy inline trên request thread, đẩy qua RabbitMQ work-queue, worker pool có concurrency cap riêng cho từng tenant.
- **Connection pool đủ lớn + statement timeout** — một query chậm của tenant A không giữ connection vô thời hạn, chặn tenant B.

## Lớp 3 — Fault/blast-radius: một tenant crash không kéo tenant khác

Nhiều replica stateless sau load balancer, input validation cứng kèm giới hạn payload size (chặn poison request từ một tenant làm sập cả instance), circuit breaker giữa `authoring` và các dependency của nó.

**Ranh giới quan trọng nhất trong cả 3 lớp:** multi-tenant chung service chấp nhận được cho `authoring` — vì downtime của nó chịu được (host chờ vài phút không sao). `exam-delivery` thì **không** — một học viên đang thi mà bị crash-do-tenant-khác là không thể chấp nhận, đó chính xác là lý do `exam-delivery` bị tách riêng thành service độc lập ngay từ ADR-001, không chỉ dựa vào 3 lớp isolation nói trên là đủ.

## Hạ tầng hỗ trợ, triển khai theo lớp — không dàn hàng ngang

ADR-003 liệt kê ~15 thành phần hạ tầng nhưng nhấn mạnh thứ tự ưu tiên rõ ràng, không làm cùng lúc:

1. **Redis warm cache + single-flight lock** — làm trước nhất, vì đây là trải nghiệm học viên nạp đề thi. Đề là snapshot bất biến nên TTL vô hạn, không cần invalidation, không cần lo cache stampede do write.
2. **PgBouncer** — làm sớm, rẻ nhất, chỉ là config đặt trước Postgres, cap số kết nối READ đồng thời.
3. **Gateway rate-limit** — sau khi có gateway, dùng chính Redis làm counter.
4. **RabbitMQ load-leveling** — chỉ khi có write nặng thật (bulk-import), không dựng broker rỗng chờ sẵn.
5. **Read replica** — cuối cùng, chỉ khi đo được read thực sự đè lên write ở primary.

Nguyên tắc chốt: READ được điều tiết bằng PgBouncer pool size (đồng bộ), WRITE được điều tiết bằng RabbitMQ consumer concurrency (bất đồng bộ) — hai van khác tầng, không dùng lẫn cho nhau. Phần bảo mật nâng cao hơn (Vault cho dynamic credential, Keycloak cho OIDC/MFA, Linkerd cho mTLS tự động giữa service) được xếp vào nhóm "nền không thể thiếu" nhưng **triển khai sau khi phần isolation cơ bản đã chạy ổn**, không làm trước.

---

*Đã đi hết 4 mảng kỹ thuật nổi bật của PTE Platform: [kiến trúc & ADR](02-kien-truc-adr.md), [mã hóa đáp án](03-ma-hoa-dap-an.md), [event-driven saga](04-event-driven-saga.md), và tenant isolation ở trên. Series sẽ được cập nhật thêm khi có chức năng mới triển khai.*
