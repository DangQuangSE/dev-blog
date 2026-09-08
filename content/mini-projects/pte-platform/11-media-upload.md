# PTE Platform — Học Viên Nộp Bài: Media Upload

*Bài 11/12 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Task nói (Read Aloud, Describe Image...) cần học viên upload audio. Payload đó không đi qua API tier như văn bản thường — đúng nguyên tắc ADR-003 "binary never flows through the transactional API tier" đã nhắc ở [bài mã hóa đáp án](03-ma-hoa-dap-an.md) khi mô tả `payload` của `SubmitAnswerRequest` cho audio task chỉ là `publicId` tham chiếu, không phải byte thô.

## Presigned URL: client upload thẳng lên MinIO, không qua service

```java
/**
 * Presigned upload for student audio (Read Aloud). Short-TTL PUT URL — the
 * student's browser/app uploads DIRECTLY to MinIO, never through this
 * service's own request body (avoids proxying large binaries through the
 * API tier).
 */
@PostMapping
public ApiResponse<RequestUploadResponse> requestUpload(@Valid @RequestBody RequestUploadRequest request) {
    return ApiResponse.success(presignService.requestUpload(request, currentUser()));
}
```

`media` không nhận file qua `multipart/form-data` — nó trả về một URL có chữ ký (presigned), học viên `PUT` thẳng file lên MinIO bằng URL đó. Lý do: nếu mọi upload audio đều chảy qua Spring controller của `media`, service này phải giữ connection mở suốt thời gian upload (vài giây tới vài chục giây với audio dài), tốn thread pool cho việc thuần túy chuyển tiếp byte — không mang giá trị nghiệp vụ. Presigned URL để MinIO tự lo phần đó.

## 2 giai đoạn: request → upload trực tiếp → complete

```java
@Transactional
public RequestUploadResponse requestUpload(RequestUploadRequest request, CurrentUser caller) {
    boolean audioPrompt = Boolean.TRUE.equals(request.audioPrompt());
    if (audioPrompt) {
        if (!MediaConstants.AUDIO_WAV.equals(request.contentType())) {
            throw new UnsupportedContentTypeException();
        }
    } else if (!ALLOWED_CONTENT_TYPES.contains(request.contentType())) {
        throw new UnsupportedContentTypeException();
    }

    MediaObject media = new MediaObject();
    media.setTenantId(caller.tenantId());
    media.setOwnerPublicId(caller.userId());
    media.setStorageKey(buildStorageKey(caller, UUID.randomUUID(), request.contentType()));
    MediaObject saved = mediaObjectRepository.save(media);   // status mặc định: chưa UPLOADED

    String uploadUrl = presignPut(saved.getStorageKey());
    return new RequestUploadResponse(saved.getPublicId(), uploadUrl, UPLOAD_URL_TTL_SECONDS);
}
```

`MediaObject` được tạo **trước khi** byte nào được upload — trạng thái ban đầu chưa `UPLOADED`. Client tự `PUT` file lên URL trả về, rồi gọi `completeUpload` để chốt trạng thái. Tách 2 bước này (thay vì tạo record ngay khi upload xong) cho phép `media` biết và dọn dẹp những upload bị bỏ dở (request presign nhưng không bao giờ upload) — trạng thái trung gian tồn tại có chủ đích.

Danh sách content-type cho phép **khác nhau tùy ngữ cảnh**, không dùng chung 1 allow-list cho mọi trường hợp:

```java
private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
        MediaConstants.AUDIO_MPEG, MediaConstants.AUDIO_WAV, MediaConstants.AUDIO_WEBM,
        MediaConstants.IMAGE_PNG, MediaConstants.IMAGE_JPEG);
```

Bài nói của học viên chấp nhận MP3/WAV/WebM (tùy thiết bị ghi âm), nhưng **audio prompt của Speaking task** (câu hỏi do host upload sẵn) bị siết chặt hơn — chỉ WAV. Lý do lộ ra ở bước tiếp theo: WAV cho phép trích xuất thời lượng chính xác từ header mà không cần decode toàn bộ file.

## Fail-fast, không fallback: audio prompt phải có duration trước khi coi là "đã upload"

```java
@Transactional
public void completeUpload(UUID mediaPublicId, CurrentUser caller) {
    MediaObject media = mediaObjectRepository.findByPublicIdAndTenantId(mediaPublicId, caller.tenantId())
            .filter(m -> m.getOwnerPublicId().equals(caller.userId()))
            .orElseThrow(MediaNotFoundException::new);
    if (media.getStatus() == MediaStatus.UPLOADED) {
        throw new MediaAlreadyUploadedException();
    }
    // Duration extraction happens BEFORE markUploaded()/save() — throws (rolling
    // back this whole transaction) rather than returning. An audio-prompt object
    // must never reach UPLOADED without a known duration.
    if (media.isAudioPrompt()) {
        media.setDurationSeconds(extractWavDurationSeconds(media.getStorageKey()));
    }
    media.markUploaded();
    mediaObjectRepository.save(media);
}

int parseWavDurationSeconds(InputStream raw) {
    AudioFileFormat fileFormat = AudioSystem.getAudioFileFormat(buffered);
    long frameLength = fileFormat.getFrameLength();
    float frameRate = fileFormat.getFormat().getFrameRate();
    if (frameLength == AudioSystem.NOT_SPECIFIED || frameRate <= 0) {
        throw new InvalidWavFileException();
    }
    return Math.round(frameLength / frameRate);
}
```

Đây là chỗ nối trực tiếp với [timer server-authoritative](10-proctor-va-timer.md) đã nói ở bài trước: một audio prompt (câu hỏi Describe Image dạng audio, hay tương tự) cần thời lượng chính xác để `exam-delivery` tính toán thời gian chờ nghe. `parseWavDurationSeconds` đọc thẳng header WAV bằng `javax.sound.sampled` có sẵn trong JDK — không decode, không ước lượng, không thêm dependency. Nếu file không phải WAV hợp lệ, `throw` ngay **trước** `markUploaded()`, khiến transaction rollback toàn bộ — một audio prompt object không bao giờ được phép ở trạng thái "đã upload" mà thiếu duration. Không có fallback "cứ set duration = 0 rồi tính sau" — sai ngay từ bước này thà chặn cứng còn hơn để một giá trị rác lọt xuống pha tính timer.

## 2 MinioClient khác nhau, không dùng chung

```java
public PresignService(MediaObjectRepository mediaObjectRepository,
                      @Qualifier("presignMinioClient") MinioClient presignMinioClient,  // ký URL cho client bên ngoài
                      MinioClient minioClient,                                          // gọi thật, server-to-server
                      @Value("${media.storage.bucket}") String bucket) { ... }
```

`presignMinioClient` chỉ dùng để **ký URL** — endpoint trong URL đó phải là địa chỉ MinIO mà trình duyệt/app học viên với tới được từ bên ngoài. `minioClient` dùng cho cuộc gọi thật server-to-server (đọc byte về để trích duration) — endpoint nội bộ trong Docker network, không phơi ra ngoài. Nhầm lẫn 2 client này (dùng client nội bộ để ký URL) sẽ tạo ra presigned URL trỏ vào địa chỉ mà client bên ngoài không kết nối được — một lớp lỗi cấu hình dễ xảy ra nếu không tách rõ ràng thành 2 bean riêng ngay từ đầu.

## Đọc lại: TTL do caller xin, nhưng server luôn cap

```java
/** Internal service-to-service surface only. Tenant-scoped at the database layer
 *  (not just trusted from the caller) — defense in depth. */
@Transactional(readOnly = true)
public PresignedDownloadResponse presignGet(UUID mediaPublicId, long requestedTtlSeconds, UUID tenantId) {
    MediaObject media = mediaObjectRepository.findByPublicIdAndTenantId(mediaPublicId, tenantId)
            .orElseThrow(MediaNotFoundException::new);
    if (media.getStatus() != MediaStatus.UPLOADED) {
        throw new MediaNotYetUploadedException();
    }
    long ttlSeconds = Math.min(requestedTtlSeconds, MAX_DOWNLOAD_URL_TTL_SECONDS);  // caller xin bao nhiêu cũng bị cap
    String url = presignGetUrl(media.getStorageKey(), ttlSeconds);
    return new PresignedDownloadResponse(url, ttlSeconds, media.getDurationSeconds());
}
```

`exam-delivery` gọi endpoint nội bộ này lúc pin attempt để lấy URL nghe audio prompt, tự đề xuất TTL dựa trên cửa sổ thời gian phiên thi của chính nó — nhưng `media` **không tin con số đó tuyệt đối**, luôn `Math.min` với trần cứng `MAX_DOWNLOAD_URL_TTL_SECONDS` (24 giờ). Không có presigned URL nào sống vĩnh viễn, bất kể caller (dù là service nội bộ) xin gì. Tra cứu cũng lọc thẳng theo `tenantId` ở tầng repository — không chỉ tin caller đã tự kiểm tra entitlement ở lớp trên của nó, đúng tinh thần defense-in-depth đã thấy nhiều lần xuyên suốt series này.

---

*Bài tiếp theo: [Host duyệt điểm & báo cáo](12-scoring-review-va-reporting.md) — cổng human-review trước khi publish, và cách tính điểm 10–90.*
