# PTE Platform — Tổng Quan Dự Án

*Nền tảng thi thử PTE Academic đa tenant — kiến trúc 10 microservice + API gateway, team 4 người + AI-assisted. Đây là bài 1/5 trong series case study về dự án.*

> Trạng thái tại 2026-09-07. Team đang chuyển sang giai đoạn kiểm thử runtime — bài viết mô tả kiến trúc và code đã hoàn thiện tại thời điểm này, sẽ cập nhật khi có thay đổi lớn.

## Pain point

Một tổ chức luyện thi PTE cần 3 việc cùng lúc: ra đề đúng chuẩn (22 loại task type khác nhau), tổ chức kỳ thi thử có giám sát (proctor) cho hàng trăm học viên đồng thời, và chấm điểm quy về thang 10–90 theo đúng cách Pearson tính (4 kỹ năng giao tiếp + 6 kỹ năng enabling). Làm tay không scale được khi có nhiều tổ chức (tenant) dùng chung nền tảng nhưng dữ liệu đề thi, học viên, kết quả phải cách ly tuyệt đối với nhau — một tenant không được thấy, không được ảnh hưởng tài nguyên của tenant khác.

Ràng buộc khó nhất không nằm ở nghiệp vụ chấm điểm — nó nằm ở **cô lập rủi ro**: một tổ chức đang bulk-import 5000 câu hỏi hoặc một kết nối WebSocket giám thị bị leak không được phép làm chậm học viên khác đang nộp bài thi trong lúc đếm ngược thời gian.

## Kiến trúc: 10 service + API gateway

Hệ thống cắt theo **capability (bounded context)**, không cắt theo actor (student/host/admin dùng chung service `authoring`, phân quyền bằng RBAC + scope thay vì tách service riêng cho từng vai).

| Service | Vai trò |
|---|---|
| **iam** | Định danh, cấp/rotate JWT (RS256/EdDSA), giữ tenant registry |
| **admin** | Control plane: onboard/suspend tenant, feature flag, kill-switch |
| **authoring** | Soạn câu hỏi, exam blueprint, publish snapshot bất biến có version |
| **scheduling** | Tạo phiên thi, enrollment, entitlement cho học viên |
| **exam-delivery** | Critical path — state machine làm bài, timer, nộp bài |
| **proctor** | Giám sát real-time qua WebSocket, audit log tamper-evident |
| **scoring** | Chấm điểm rule-based + gọi AI vendor async (retry/DLQ) |
| **reporting** | Read model CQRS — tổng hợp điểm 10–90 theo kỹ năng |
| **notification** | Fan-out email/push/WebSocket khi có sự kiện |
| **media** | Lưu trữ audio/ảnh, presigned URL upload |

Cộng thêm **API gateway** đứng trước tất cả — xác thực JWT tại biên, rate-limit theo tenant, gắn correlation-id để trace xuyên 10 service.

Toàn bộ 10 service + gateway đã có code triển khai, qua review chất lượng theo từng phase (không phải scaffold rỗng). Bài viết tiếp theo trong series sẽ đi sâu vào 4 mảng: lý do kiến trúc (ADR), cơ chế mã hóa đáp án, luồng event-driven khi nộp bài, và cách ly multi-tenant.

## Tech stack

- **Backend:** Java 21, Spring Boot 4.0.5, Spring Cloud 2025.1.0
- **Database:** PostgreSQL — database-per-service, Row-Level Security
- **Messaging:** RabbitMQ (event backbone + Transactional Outbox)
- **Cache:** Redis — snapshot cache, rate-limit token bucket, idempotency dedup
- **Object storage:** MinIO (S3-compatible)
- **Observability:** OpenTelemetry + Jaeger, Prometheus + Grafana
- **Infra:** Docker Compose (local dev)

## Vai trò leader

Điều phối team 4 người + AI-assisted: chốt kiến trúc microservice và boundary giữa các service, viết ADR làm nguồn quyết định chung, phân công 4 nhánh việc song song (backend runtime verification, Flutter student runner, Flutter host console, AI vendor adapter + CI/CD) sao cho không ai bị block bởi người khác quá lâu.

---

*Bài tiếp theo: [Kiến trúc & ADR](02-kien-truc-adr.md) — vì sao chọn microservice, không phải vì "trend".*
