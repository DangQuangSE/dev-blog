# PTE Platform — Tổng Quan Dự Án

*Nền tảng thi thử PTE Academic đa tenant — kiến trúc 10 microservice + API gateway, team 4 người + AI-assisted. Đây là bài 1/5 trong series case study về dự án.*

> Trạng thái tại 2026-09-07. Team đang chuyển sang giai đoạn kiểm thử runtime — bài viết mô tả kiến trúc và code đã hoàn thiện tại thời điểm này, sẽ cập nhật khi có thay đổi lớn.

## Pain point

Một tổ chức luyện thi PTE cần 3 việc cùng lúc: ra đề đúng chuẩn (22 loại task type khác nhau: đọc, nghe, nói, viết, mỗi loại có rubric chấm riêng), tổ chức kỳ thi thử có giám sát (proctor) cho hàng trăm học viên đồng thời với timer server-authoritative (không tin client), và chấm điểm quy về thang 10–90 theo đúng cách Pearson tính (Overall + 4 kỹ năng giao tiếp + 6 kỹ năng enabling — bài thi thử một phần vẫn phải báo cáo đúng, không crash khi thiếu dữ liệu một số kỹ năng).

Làm tay không scale khi nhiều tổ chức (tenant) dùng chung nền tảng nhưng dữ liệu đề thi, học viên, kết quả phải cách ly tuyệt đối — tenant A không được thấy, không được ảnh hưởng tài nguyên của tenant B. Ràng buộc khó nhất không nằm ở nghiệp vụ chấm điểm — nó nằm ở **cô lập rủi ro**: một tổ chức đang bulk-import 5000 câu hỏi hoặc một kết nối WebSocket giám thị bị leak không được phép làm chậm học viên khác đang nộp bài thi trong lúc đếm ngược thời gian.

## Kiến trúc: 10 service + API gateway

Hệ thống cắt theo **capability (bounded context)**, không cắt theo actor — student/host/admin dùng chung service `authoring`, phân quyền bằng RBAC + scope dữ liệu thay vì tách service riêng cho từng vai.

| Service | Port | DB | Vai trò |
|---|---|---|---|
| **iam** | 8081 | `iam` | Định danh, cấp/rotate JWT (RS256/EdDSA), giữ tenant registry |
| **admin** | 8082 | `admin` | Control plane: onboard/suspend tenant, feature flag, kill-switch |
| **authoring** | 8083 | `authoring` | Soạn câu hỏi, exam blueprint, publish snapshot bất biến có version |
| **scheduling** | 8084 | `scheduling` | Tạo phiên thi, enrollment, entitlement, phát command chấm/publish |
| **exam-delivery** | 8085 | `exam_delivery` | Critical path — state machine làm bài, timer, nộp bài |
| **proctor** | 8086 | `proctor` | Giám sát real-time qua WebSocket, audit log tamper-evident |
| **scoring** | 8087 | `scoring` | Chấm điểm rule-based + gọi AI vendor async (retry/DLQ) |
| **reporting** | 8088 | `reporting` | Read model CQRS — tổng hợp điểm 10–90 theo kỹ năng |
| **notification** | 8089 | `notification` | Fan-out email/push/WebSocket khi có sự kiện |
| **media** | 8090 | `media` + MinIO | Lưu trữ audio/ảnh, presigned URL upload |
| **gateway** | 8080 | — | Xác thực JWT tại biên, rate-limit per-tenant, route + CORS |

Mono-repo `pte-api/` (Maven multi-module) — mỗi service là 1 module riêng, build bằng `mvn install` từ root, deploy độc lập từng container. `gateway` không có domain layer/DB riêng — chỉ route + filter, nghĩa là nó **không có business logic**, giữ đúng vai trò biên xác thực chứ không phình thành một service nghiệp vụ ẩn.

Toàn bộ 10 service + gateway đã có code triển khai, qua review chất lượng theo từng phase (không phải scaffold rỗng). Bài viết tiếp theo trong series sẽ đi sâu vào 4 mảng: lý do kiến trúc (ADR), cơ chế mã hóa đáp án, luồng event-driven khi nộp bài, và cách ly multi-tenant.

## Chạy thử local

Toàn bộ hạ tầng chạy qua Docker Compose, tách 2 file: `docker-compose.yml` (backbone — Postgres, RabbitMQ, Redis, MinIO, Jaeger) và `docker-compose.services.yml` (11 service app, build từ source).

```bash
cd pte-api
docker compose -f docker-compose.yml -f docker-compose.services.yml up -d --build
```

Kiểm tra gateway đã sẵn sàng:

```bash
curl -sf http://localhost:8080/actuator/health
# {"status":"UP"}
```

Mỗi service tự expose health check riêng theo pattern `/api/{service}/actuator/health` (ví dụ `exam-delivery`: `http://localhost:8085/api/exam-delivery/actuator/health`), và gateway biết địa chỉ nội bộ của từng service qua biến môi trường dạng `{SERVICE}_URI` (`EXAM_DELIVERY_URI=http://exam-delivery:8085`, `PROCTOR_WS_URI=ws://proctor:8086` — giữ riêng biến WS vì scheme khác `http://`).

## Tech stack

- **Backend:** Java 21, Spring Boot 4.0.5, Spring Cloud 2025.1.0
- **Database:** PostgreSQL — database-per-service, cách ly bằng credential riêng cho mỗi DB
- **Messaging:** RabbitMQ (event backbone + Transactional Outbox, xem [bài 4](04-event-driven-saga.md))
- **Cache:** Redis — snapshot cache, rate-limit token bucket, idempotency dedup
- **Object storage:** MinIO (S3-compatible)
- **Observability:** OpenTelemetry + Jaeger, Prometheus + Grafana
- **Infra:** Docker Compose (local dev)

## Vai trò leader

Điều phối team 4 người + AI-assisted: chốt kiến trúc microservice và boundary giữa các service, viết ADR làm nguồn quyết định chung, phân công 4 nhánh việc song song (backend runtime verification, Flutter student runner, Flutter host console, AI vendor adapter + CI/CD) sao cho không ai bị block bởi người khác quá lâu — nhánh backend runtime luôn đi trước để 2 nhánh Flutter có REST contract thật (controller + DTO) mà code song song, không phải chờ tuần tự.

---

*Bài tiếp theo: [Kiến trúc & ADR](02-kien-truc-adr.md) — vì sao chọn microservice, không phải vì "trend".*
