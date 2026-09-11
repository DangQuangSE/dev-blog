# PTE Platform — Deploy Free Tier: 11 Container JVM Trên Một VM

*Bài 16 — phần tiếp nối series case study PTE Platform. Trạng thái tại 2026-09-09. Cùng loại với [bài 15](15-cell-based-architecture.md): đây là **phương án triển khai** chưa chạy thật, viết ra để có thể phản biện trước khi tốn thời gian.*

Sau khi hệ thống chạy được end-to-end trên máy local, nhu cầu tiếp theo rất đời thường: **cần một URL để giáo viên và team mở được từ máy của họ**, không phải dựng docker-compose trên từng laptop.

Ràng buộc: ngân sách bằng 0.

Bài này ghi lại cách chọn hạ tầng cho ràng buộc đó, các bước triển khai cụ thể, và — quan trọng hơn — **những chỗ phương án này phá vỡ chính thiết kế cell-based ở bài 15**, cùng lý do vẫn chấp nhận.

---

## Phần 1 — Vì sao mọi PaaS free đều trượt

### Đếm số deployable trước, chọn nhà cung cấp sau

Hệ thống hiện tại, đếm từ `docker-compose.services.yml` và `docker-compose.yml`:

| Nhóm | Số container | RAM ước tính |
|---|---|---|
| Service Spring Boot | 10 | ~300MB/cái = 3.0GB |
| Gateway (Spring Cloud Gateway) | 1 | ~300MB |
| Postgres (`pg-core`, `pg-exam`, `pg-live`, `pg-async`) | 4 | ~250MB/cái = 1.0GB |
| RabbitMQ | 1 | ~400MB |
| Redis | 1 | ~50MB |
| MinIO | 1 | ~200MB |
| Mailpit + Jaeger | 2 | ~350MB |
| **Tổng** | **20** | **~5.3GB idle** |

Con số quyết định không phải 5.3GB — mà là **11 deployable JVM**.

### Đây là chỗ mô hình tính phí của PaaS gãy

PaaS free tính theo **số deployable**. VM tính theo **số máy**. Với 11 deployable, mô hình per-unit vỡ ngay ở dòng đầu tiên của bảng giá:

| Nền tảng | Free tier | Vì sao trượt |
|---|---|---|
| Render | 512MB/service, ngủ sau 15 phút không traffic | Đủ RAM cho 1 service. Cần 11. Và cold start ~50s của JVM sau khi ngủ là không chấp nhận được với bài thi có timer |
| Koyeb | 1 service, 512MB | Cần 11 |
| Railway | $5 credit dùng thử rồi hết | Không phải free |
| Fly.io | Đã bỏ free allowance | Không phải free |
| Google Cloud e2-micro | Always Free nhưng 1GB RAM | Chạy được 2 service |
| Heroku | Không còn free dyno từ 2022 | — |

Không có nền tảng nào cho 11 instance miễn phí. Kết luận: **thuê một máy đủ to, tự chạy compose** — quay về đúng mô hình đang chạy trên laptop.

### Ứng viên duy nhất còn lại

| Tài nguyên | Oracle Cloud Always Free (A1 Ampere) |
|---|---|
| CPU / RAM | 4 vCPU ARM / **24GB** |
| Disk | 200GB block storage |
| Egress | 10TB/tháng |
| Thời hạn | Always Free — không hết hạn |

24GB cho 5.3GB nhu cầu idle là dư gấp 4 lần. Đây là free tier duy nhất trên thị trường ở mức RAM này, và nó tồn tại vì Oracle cần đẩy ARM Ampere.

Điểm mấu chốt: **không cần refactor gì để deploy.** `git clone` + `docker compose up --build` là chạy. Việc tái kiến trúc cell-based ở bài 15 và việc deploy là hai quyết định độc lập — điều này quan trọng, vì nó có nghĩa là không phải chờ refactor xong mới có môi trường test.

---

## Phần 2 — Topology

| Thành phần | Chỗ đặt | Lý do chọn |
|---|---|---|
| 11 service + gateway | Oracle A1 VM | 1 box, không cold start, không giới hạn số deployable |
| Postgres × 4 cell | **Trên VM** (mặc định) | Latency ~0.2ms. Xem phần Neon bên dưới cho lựa chọn thay thế |
| MinIO | **Cloudflare R2** | S3-compatible — chỉ đổi env var. 10GB free, egress $0 |
| RabbitMQ | Trên VM | CloudAMQP free giới hạn 20 connection; hệ thống có ~10 consumer + publisher, chạm trần ngay |
| Redis | Trên VM | Upstash free 10k command/ngày quá ít cho rate-limit ở gateway |
| Mailpit | Trên VM | Chỉ dùng để xem email test, không cần gửi thật |
| Jaeger | **Tắt** | Ngốn RAM, không cần cho môi trường demo |
| `tenant-web`, `vendor-web` | Vercel / Cloudflare Pages | Free, có CDN, build từ Git |
| TLS | Caddy trước gateway | Auto Let's Encrypt, hỗ trợ WebSocket trong suốt |

Chỉ **2 dịch vụ ngoài** (R2 + Vercel), phần còn lại nằm trên một máy. Càng ít nhà cung cấp thì càng ít thứ hỏng theo cách khó chẩn đoán.

---

## Phần 3 — Các bước triển khai

### Bước 1 — Tạo tài khoản và nâng lên Pay As You Go ngay

Nghe phản trực giác với mục tiêu "miễn phí", nhưng đây là bước quan trọng nhất.

Tài khoản ở trạng thái **Free Tier** bị Oracle thu hồi VM nếu CPU trung bình dưới 20% trong 7 ngày. Môi trường demo chắc chắn rơi vào diện này — máy đứng yên phần lớn thời gian.

Nâng lên **Pay As You Go** vẫn giữ nguyên toàn bộ Always Free resources và **không bị thu hồi**. Cần thẻ để xác minh, không bị trừ tiền nếu chỉ dùng trong hạn mức Always Free.

> Làm ngay từ đầu. Mất VM sau khi đã cấu hình xong là mất toàn bộ công.

### Bước 2 — Tạo instance A1

- Shape: `VM.Standard.A1.Flex` — 4 OCPU, 24GB RAM (dùng trọn hạn mức trong 1 máy, đừng chia nhỏ)
- Image: Ubuntu 24.04 (**ARM/aarch64**)
- Boot volume: 100–200GB
- Region: chọn gần người dùng — Singapore `ap-southeast-1` cho VN

**Lỗi sẽ gặp:** `Out of host capacity`. A1 thường hết chỗ ở region hot. Hai cách xử lý: đổi sang Availability Domain khác, hoặc script retry gọi `oci compute instance launch` mỗi vài phút. Kiên nhẫn — thường lấy được trong vòng một ngày.

### Bước 3 — Mở firewall ở **hai** tầng

Đây là cái bẫy kinh điển của Oracle, và triệu chứng của nó rất dễ chẩn đoán sai.

**Tầng 1 — VCN Security List** (trên web console): thêm Ingress Rule cho port 80 và 443, source `0.0.0.0/0`.

**Tầng 2 — iptables trên chính máy.** Image Ubuntu của Oracle nạp sẵn `/etc/iptables/rules.v4` với luật `REJECT` mọi thứ trừ port 22. Mở Security List mà quên tầng này thì `curl` từ ngoài sẽ **treo rồi timeout**, và người ta sẽ đi debug Caddy, DNS, compose — sai hết.

```bash
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80  -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo netfilter-persistent save
```

Chỉ mở 80/443. **Không mở** 8080 (gateway), 5432–5435 (Postgres), 15672 (RabbitMQ management), 9001 (MinIO console) ra internet — chúng chỉ cần truy cập qua SSH tunnel khi debug:

```bash
ssh -L 15672:localhost:15672 ubuntu@<ip>
```

### Bước 4 — Thêm swap

Image Oracle không có swap. Bước build Maven sẽ ăn RAM đột biến và bị OOM killer giết giữa chừng, để lại image dở dang khó chẩn đoán.

```bash
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile && sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### Bước 5 — Cài Docker

```bash
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker ubuntu
newgrp docker
docker compose version
```

Script chính thức tự nhận arm64. Base image trong `Dockerfile` — `maven:3.9-eclipse-temurin-21` và `eclipse-temurin:21-jre` — đều có bản arm64, nên không phải sửa gì.

> **Build trên chính VM**, đừng cross-build từ máy Windows rồi push. Cross-build ARM qua QEMU chậm gấp nhiều lần và dễ tạo image sai arch mà chỉ phát hiện lúc container crash-loop.

### Bước 6 — Sửa Dockerfile: 1 lần build thay vì 11

`Dockerfile` hiện tại build từng module riêng:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
ARG SERVICE_MODULE
COPY . .
RUN mvn -q -pl ${SERVICE_MODULE} -am package -DskipTests
```

`-am` (also-make) nghĩa là mỗi image build lại toàn bộ dependency của nó — `pte-common` bị compile lại **11 lần**. Trên 4 core ARM, đây là khác biệt giữa 15 phút và hơn một tiếng.

Sửa để `ARG` xuống dưới stage build, BuildKit sẽ chia sẻ stage `build` đã cache cho cả 11 image:

```dockerfile
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /workspace
COPY . .
# Không có ARG ở stage này → stage identical cho mọi image → BuildKit cache 1 lần
RUN --mount=type=cache,target=/root/.m2,sharing=locked \
    mvn -q package -DskipTests

FROM eclipse-temurin:21-jre AS runtime
ARG SERVICE_MODULE
RUN apt-get update && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /workspace/${SERVICE_MODULE}/target/*.jar app.jar
ENTRYPOINT ["java", "-jar", "app.jar"]
```

`ARG SERVICE_MODULE` phải nằm **sau** `FROM ... AS runtime`. Nếu khai báo trước stage build, mọi image sẽ có cache key khác nhau và tối ưu này mất tác dụng hoàn toàn.

### Bước 7 — Giới hạn build song song và heap

**Vấn đề build:** `docker compose build` chạy song song mặc định. 11 tiến trình Maven, mỗi cái ~2GB → 22GB, cộng kernel và Docker daemon → OOM trên máy 24GB.

```bash
COMPOSE_PARALLEL_LIMIT=2 docker compose \
  -f docker-compose.yml -f docker-compose.services.yml build
```

**Vấn đề runtime:** container không đặt limit thì JVM thấy 24GB và tự cho mình heap tối đa 1/4 = 6GB. 11 service × 6GB là công thức OOM.

```yaml
# thêm vào mỗi service trong docker-compose.services.yml
mem_limit: 512m
environment:
  JAVA_TOOL_OPTIONS: "-XX:MaxRAMPercentage=70"
```

Ngân sách RAM sau khi giới hạn: 11 × 512MB + 4 Postgres × 512MB + RabbitMQ 512MB + Redis 256MB ≈ **9GB / 24GB**. Còn dư cho page cache của Postgres.

### Bước 8 — Chuyển MinIO sang Cloudflare R2

`media` đã dùng AWS S3 SDK nên chỉ là chuyện đổi env var — không sửa Java:

```yaml
media:
  environment:
    MINIO_ENDPOINT: https://<account-id>.r2.cloudflarestorage.com
    MINIO_PUBLIC_ENDPOINT: https://<account-id>.r2.cloudflarestorage.com
    MINIO_REGION: auto          # BẮT BUỘC — mặc định us-east-1 sẽ làm SigV4 fail
    MINIO_ROOT_USER: <r2-access-key-id>
    MINIO_ROOT_PASSWORD: <r2-secret-access-key>
```

`MINIO_REGION: auto` là điểm dễ bỏ sót. Giá trị mặc định `us-east-1` trong `application.yml` làm chữ ký SigV4 không khớp, và lỗi trả về từ R2 không nói gì về region.

Tách được `endpoint` và `public-endpoint` từ đầu ([bài 11](11-media-upload.md)) giờ trả cổ tức: presigned URL sinh ra đã trỏ đúng host công khai, không cần sửa logic.

### Bước 9 — Caddy làm TLS termination

**HTTPS không phải tùy chọn.** Frontend đặt trên Vercel chạy `https://`. Trình duyệt chặn mọi request `http://` từ trang `https://` (mixed content), và WebSocket của proctor cũng phải là `wss://`. Không có TLS thì frontend không gọi được backend — chấm hết.

```caddyfile
# /etc/caddy/Caddyfile
api.pte-demo.example {
    reverse_proxy localhost:8080
}
```

Caddy tự xin chứng chỉ Let's Encrypt và proxy WebSocket trong suốt — không cần cấu hình `Upgrade` header thủ công.

Cần một domain thật (Let's Encrypt không cấp cho IP). Domain `.io.vn` giá vài chục nghìn/năm, hoặc DuckDNS miễn phí với DNS challenge.

### Bước 10 — Frontend

`tenant-web` và `vendor-web` là hai app trong turborepo → deploy 2 project Vercel, mỗi project set **Root Directory** trỏ vào `apps/tenant-web` và `apps/vendor-web`.

Sau đó cập nhật CORS ở gateway cho đúng 2 origin đó, và trỏ base URL của frontend về `https://api.pte-demo.example`.

Flutter app (`pte-app`) build APK và phát hành qua Firebase App Distribution — free.

---

## Phần 4 — Nếu vẫn muốn dùng Neon

Neon mua **durability + branching** bằng giá **latency + giới hạn connection**. Khi đã có VM 24GB, Postgres local cộng `pg_dump` nightly lên R2 cho cùng mức an toàn với ít phức tạp hơn nhiều. Nhưng nếu chọn Neon, có 5 thứ sẽ cắn — và 4 trong số đó chỉ lộ ra khi có tải, không phải lúc smoke test.

**1. Giới hạn connection.** 10 service × Hikari pool mặc định 10 = 100 connection. Compute nhỏ nhất của Neon free chịu khoảng 110 direct connection — sát trần. Bắt buộc dùng endpoint có hậu tố `-pooler`:

```yaml
spring:
  datasource:
    url: jdbc:postgresql://ep-xxx-pooler.ap-southeast-1.aws.neon.tech/iam?sslmode=require&prepareThreshold=0
    hikari:
      maximum-pool-size: 5
```

**2. `prepareThreshold=0` là bắt buộc.** PgBouncer ở transaction mode làm server-side prepared statement của JDBC vỡ với `prepared statement "S_1" already exists`. Lỗi này **chỉ xuất hiện khi có nhiều request đồng thời** — test một mình sẽ không bao giờ thấy.

**3. Flyway phải chạy qua endpoint direct** (không `-pooler`). Migration dùng advisory lock giữ qua nhiều transaction; PgBouncer transaction mode không giữ được. Cấu hình `spring.flyway.url` riêng với endpoint direct.

**4. Scale-to-zero sau ~5 phút nhàn rỗi.** Request đầu tiên sau khi ngủ mất từ vài trăm ms tới vài giây. 10 Hikari pool cùng lúc đánh thức compute sẽ làm healthcheck `start_period: 40s` đỏ vào buổi sáng. Hoặc nâng `connection-timeout`, hoặc chạy cron ping giữ ấm.

**5. Region phải trùng với VM.** Neon Singapore + VM Singapore ≈ 5–15ms. Lệch region thì mỗi JDBC roundtrip cộng 100ms — và mọi chỗ N+1 query trong `exam-delivery` biến thành timeout.

Storage free 0.5GB đủ cho demo, nhưng attempt log và media metadata sẽ tăng đều; cần lịch dọn.

---

## Phần 5 — Chỗ phương án này phá vỡ bài 15

Đây là phần trung thực nhất của bài, và cũng là phần đáng nhớ nhất.

[Bài 15](15-cell-based-architecture.md) kết luận: *"10 service chia sẻ 1 Postgres thì vẫn là 1 vùng sập"*, và đề xuất tách 4 cell với 4 Postgres riêng trên 4 node.

Phương án deploy này đặt **cả 4 cell lên một VM**. Nếu dùng Neon free, 4 database cell còn quay về **một compute instance duy nhất**.

Nói thẳng: **môi trường này có đúng 1 vùng sập.** Nó vi phạm toàn bộ kết luận của bài 15.

Vẫn chấp nhận, vì hai lý do:

**Thứ nhất, đây là môi trường demo, không phải production.** Blast radius isolation là thuộc tính mua bằng tiền để bảo vệ doanh thu và uy tín. Môi trường mà người dùng là giáo viên và 4 thành viên team thì không có gì để bảo vệ. Trả tiền cho isolation ở đây là tối ưu sai chỗ.

**Thứ hai — và đây mới là điều quan trọng — ranh giới *logic* vẫn được giữ nguyên.** Bốn Postgres vẫn là 4 container/4 database riêng với credential riêng. Bốn assembly module vẫn tách. Không có service nào query chéo. Cái bị gộp chỉ là **vị trí vật lý**, và vị trí vật lý được điều khiển bởi env var:

```yaml
EXAM_DELIVERY_DB_URL: jdbc:postgresql://pg-exam:5432/exam_delivery
```

Đổi `pg-exam` thành hostname của một máy khác là xong. Không sửa một dòng Java nào.

Đó chính là lý do việc **tách database ngay từ đầu** — dù ban đầu tất cả chạy chung một máy — là quyết định đúng. Nó biến "tách vùng sập" từ một dự án refactor thành một thay đổi cấu hình.

---

## Đánh đổi và giới hạn

**Tự vận hành.** Không có managed backup, không có auto-restart khi máy reboot, không có alert. Bù tối thiểu: `restart: unless-stopped` cho mọi service, và một cron `pg_dump` đẩy lên R2 hằng đêm.

**Phụ thuộc vào chính sách của Oracle.** Always Free là quyết định thương mại, không phải hợp đồng. Nếu Oracle đổi ý thì mất môi trường. Giảm rủi ro bằng cách giữ toàn bộ cấu hình trong `docker-compose` đã commit — dựng lại ở chỗ khác là chuyện của một buổi chiều, không phải một tuần.

**ARM có thể làm lộ dependency chỉ chạy trên x86.** Toàn bộ stack hiện tại là JVM thuần nên rủi ro thấp, nhưng bất kỳ native library nào thêm sau (xử lý audio, ML model cho AI scoring) đều phải kiểm tra arm64 trước.

**Phương án dự phòng nếu không lấy được A1:** GitHub Student Developer Pack cho DigitalOcean $200 (đủ khoảng 12 tháng droplet 4GB) và Azure $100. Không phải "free mãi mãi", nhưng đủ qua một kỳ học.

---

## Bài học rút ra

1. **Chọn hạ tầng bắt đầu bằng việc đếm deployable, không phải đọc bảng giá.** PaaS tính theo số đơn vị triển khai; VM tính theo số máy. Con số 11 loại bỏ toàn bộ nhóm thứ nhất trước khi cần so sánh bất cứ điều gì khác. Ràng buộc kiến trúc quyết định mô hình tính phí phù hợp, không phải ngược lại.

2. **Ranh giới logic tách sẵn biến việc scale thành thay đổi cấu hình.** Bốn database riêng trên một máy trông thừa thãi lúc mọi thứ còn nhỏ. Nhưng khi cần tách thật, chi phí là sửa một env var thay vì một dự án migration. Ranh giới rẻ lúc thiết kế và cực đắt lúc phải tách sau.

3. **Môi trường khác nhau được phép có kiến trúc khác nhau.** Không có gì sai khi môi trường demo cố tình vi phạm nguyên tắc blast-radius của production — miễn là biết mình đang vi phạm, biết vì sao, và biết đường quay lại. Sai lầm thật sự là áp mọi ràng buộc production lên môi trường không cần chúng, rồi không bao giờ deploy được gì.
