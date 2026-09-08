# PTE Platform — Mã Hóa Đáp Án STRICT

*Bài 3/12 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Với các kỳ thi có giám sát (`answerIntegrityLevel = STRICT` trên attempt đã pin), đáp án không chỉ cần xác thực **ai** gửi (JWT lo việc đó) — nó cần bằng chứng **không bị sửa** trên đường truyền. Đây là chỗ `exam-delivery` dùng một cặp key RSA-2048 **riêng của chính nó**, tách hẳn khỏi key ký JWT của `iam`.

## Hai route song song, tách theo integrity level

```java
// AttemptController.java
/** STANDARD-pinned attempts only — server rejects if the attempt is pinned STRICT. */
@PostMapping("/{publicId}/answers")
public ApiResponse<AttemptTaskResponse> submitAnswer(@PathVariable UUID publicId,
                                                      @Valid @RequestBody SubmitAnswerRequest request) {
    return ApiResponse.success(attemptService.submitAnswer(publicId, request, currentUser()));
}

/** STRICT-pinned attempts only — server rejects if the attempt is pinned STANDARD. */
@PostMapping("/{publicId}/answers/encrypted")
public ApiResponse<AttemptTaskResponse> submitEncryptedAnswer(@PathVariable UUID publicId,
                                                               @Valid @RequestBody EncryptedSubmissionRequest request) {
    return ApiResponse.success(attemptService.submitEncryptedAnswer(publicId, request, currentUser()));
}
```

Hai endpoint tồn tại song song thay vì 1 endpoint chung tự nhận diện — service kiểm tra `answerIntegrityLevel` đã pin trên attempt và **từ chối chéo** (gửi plain payload vào endpoint STRICT hoặc ngược lại đều bị lỗi). Payload của route STANDARD là chuỗi thô theo quy ước riêng từng task type (ví dụ `MC_READING_SINGLE` gửi `orderIndex` dạng chuỗi số, `RE_ORDER_PARAGRAPHS` gửi thứ tự các đoạn nối bằng dấu phẩy, audio task gửi `publicId` của file đã upload lên `media` chứ không phải byte âm thanh thô) — route STRICT bọc y hệt payload đó trong lớp mã hóa, không đổi ngữ nghĩa nghiệp vụ.

Việc "route nào áp dụng cho attempt nào" không do client tự chọn — server quyết định dựa trên chính snapshot đã pin lúc bắt đầu:

```java
@Transactional
public AttemptTaskResponse submitAnswer(UUID attemptPublicId, SubmitAnswerRequest request, CurrentUser caller) {
    ExamAttempt attempt = findOwned(attemptPublicId, caller.userId());
    requireIntegrityLevel(attempt, "STANDARD");
    return processAnswer(attempt, request.pinnedItemPublicId(), request.payload());
}

@Transactional
public AttemptTaskResponse submitEncryptedAnswer(UUID attemptPublicId, EncryptedSubmissionRequest request,
                                                  CurrentUser caller) {
    ExamAttempt attempt = findOwned(attemptPublicId, caller.userId());
    requireIntegrityLevel(attempt, "STRICT");
    String payload = submissionDecryptionService.decrypt(request, encryptionKeyProvider.getPrivateKey());
    return processAnswer(attempt, request.pinnedItemPublicId(), payload);
}

/** Request shape (plain vs. encrypted) is server-decided by the pinned level, never client-chosen. */
private void requireIntegrityLevel(ExamAttempt attempt, String expectedLevel) {
    if (!expectedLevel.equals(attempt.getPinnedSnapshot().getAnswerIntegrityLevel())) {
        throw new AnswerIntegrityLevelMismatchException();
    }
}
```

Doc comment nói thẳng: "server-decided by the pinned level, never client-chosen". Một client cố tình gọi route STANDARD cho attempt đã pin STRICT (để né việc mã hóa) bị chặn ngay ở đây — `answerIntegrityLevel` gắn cứng trên `PinnedExamSnapshot` từ lúc `exam-delivery` pin snapshot, không phải field client gửi kèm mỗi request, nên không có cách nào hạ cấp bảo mật giữa chừng phiên thi.

## Vì sao tách key mã hóa khỏi key JWT

JWT key trả lời câu hỏi *danh tính* (ai gửi request này). Key mã hóa trả lời câu hỏi *toàn vẹn* (nội dung có bị đụng vào không). Gộp chung một cặp key nghĩa là một lỗi ở tầng này kéo sập cả tầng kia. Tách ra giới hạn blast-radius: `iam` sập không ảnh hưởng khả năng giải mã đáp án đang chờ xử lý; xoay vòng key mã hóa không đụng tới phiên đăng nhập đang hoạt động.

Hệ quả trực tiếp: `exam-delivery` **không cần gọi đồng bộ sang `iam`** để lấy key mã hóa lúc học viên đang làm bài — đúng nguyên tắc "zero outbound sync call lúc thi" ở ADR-001. Một lựa chọn khác từng cân nhắc là dựa hẳn vào TLS (HTTPS) và bỏ qua lớp mã hóa app-level này — nhưng TLS chỉ bảo vệ đường truyền tới gateway/load balancer, nó **terminate** ở đó; sau điểm terminate, payload là plaintext trong nội bộ hạ tầng (log, proxy trung gian, service mesh chưa triển khai mTLS theo ADR-003). Mã hóa ở tầng application đảm bảo ngay cả nếu một khâu nội bộ bị soi, nội dung đáp án STRICT vẫn không đọc được nếu không có private key của `exam-delivery`.

## Fail-fast thay vì tự sinh key ngầm

```java
if (privateMissing || publicMissing) {
    if (!isEphemeralAllowed(activeProfile)) {
        throw new IllegalStateException("exam-delivery encryption keypair is not configured "
                + "... refusing to start with an ephemeral keypair, "
                + "since a restart would invalidate every STRICT-pinned attempt's public key.");
    }
    KeyPair ephemeral = generateEphemeralKeyPair();
    ...
}
```

`EncryptionKeyProvider` chỉ cho phép tự sinh key tạm (ephemeral) ở profile `dev`/`local`. Ở production, thiếu biến môi trường `exam-delivery.encryption.private-key-pem` / `public-key-pem` làm service **từ chối khởi động** thay vì âm thầm sinh key ngẫu nhiên. Lý do: nếu service tự sinh key mỗi lần restart, public key học viên đã dùng để mã hóa từ lần trước sẽ vô hiệu ngay — toàn bộ attempt STRICT đang pin coi như hỏng. Fail-fast ở đây rẻ hơn nhiều so với debug một đợt mất dữ liệu đáp án lúc nửa đêm. Trong `docker-compose.services.yml`, `exam-delivery` chạy với `SPRING_PROFILES_ACTIVE: dev` để được phép fallback ephemeral khi chạy local — production compose/deploy phải set 2 biến PEM ở trên.

## Flow 3 bước

**1. Server phát public key.** Khi học viên bắt đầu attempt STRICT, response trả kèm `encryptionPublicKey` (Base64) lấy từ `EncryptionKeyProvider.getPublicKeyBase64()`. Private key không rời server.

**2. Client mã hóa (Flutter, phía học viên).** Sinh AES-256 key ngẫu nhiên cho riêng lần nộp bài này, mã hóa nội dung đáp án bằng AES-GCM (IV 96-bit, auth tag 128-bit), rồi bọc (wrap) AES key đó bằng RSA public key của server (RSA-OAEP). Gửi lên 4 trường Base64 (khớp `EncryptedSubmissionRequest`): `pinnedItemPublicId` (UUID thô, không mã hóa — chỉ định danh câu hỏi), `wrappedKey`, `iv`, `ciphertext`.

**3. Server giải mã.**

```java
public String decrypt(EncryptedSubmissionRequest request, PrivateKey privateKey) {
    try {
        byte[] wrappedKey = Base64.getDecoder().decode(request.wrappedKey());
        byte[] iv = Base64.getDecoder().decode(request.iv());
        byte[] ciphertext = Base64.getDecoder().decode(request.ciphertext());

        if (iv.length != GCM_IV_LENGTH_BYTES) {
            throw new SubmissionDecryptionException();
        }

        Key aesKey = unwrapAesKey(wrappedKey, privateKey);
        byte[] plaintext = decryptWithAesGcm(ciphertext, aesKey, iv);
        return new String(plaintext, StandardCharsets.UTF_8);
    } catch (IllegalArgumentException | NullPointerException | InvalidKeyException
            | InvalidAlgorithmParameterException | NoSuchAlgorithmException | NoSuchPaddingException
            | IllegalBlockSizeException | BadPaddingException ex) {
        throw new SubmissionDecryptionException();
    }
}

private Key unwrapAesKey(byte[] wrappedKey, PrivateKey privateKey) ... {
    Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    cipher.init(Cipher.UNWRAP_MODE, privateKey, OAEP_SHA256);
    return cipher.unwrap(wrappedKey, "AES", Cipher.SECRET_KEY);
}

private byte[] decryptWithAesGcm(byte[] ciphertext, Key aesKey, byte[] iv) ... {
    Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
    cipher.init(Cipher.DECRYPT_MODE, aesKey, new GCMParameterSpec(GCM_TAG_LENGTH_BITS, iv));
    return cipher.doFinal(ciphertext);
}
```

Unwrap AES key bằng RSA private key, rồi giải mã payload bằng AES-GCM — chính thao tác giải mã GCM verify luôn 128-bit auth tag, nên **tampering bị phát hiện ngay tại bước decrypt**, không cần kiểm tra riêng. Bất kỳ lỗi nào trong toàn bộ flow — Base64 sai định dạng, IV sai độ dài, RSA unwrap thất bại, hay GCM auth tag không khớp — đều gom về một `SubmissionDecryptionException` (4xx) trước khi có cơ hội ghi bất cứ gì xuống DB.

## Chi tiết interop dễ mắc lỗi nhất

`OAEPParameterSpec` khai báo tường minh `SHA-256` cho cả digest chính lẫn MGF1 (`MGF1ParameterSpec.SHA256`) ở **cả hai phía** client và server. Đây là điểm dễ vỡ nhất khi nối một client Dart/Flutter với server Java — nếu một bên mặc định MGF1-SHA1 (default của nhiều thư viện) còn bên kia khai SHA-256, unwrap key sẽ fail mà thông báo lỗi không nói rõ nguyên nhân là do lệch MGF digest.

## Tự kiểm thử flow này bằng Java (không cần Flutter)

Vì thuật toán và tham số (OAEP SHA-256/MGF1-SHA256, AES-GCM 12-byte IV/128-bit tag) đã cố định trong `SubmissionDecryptionService`, có thể viết một đoạn Java độc lập mô phỏng đúng phía client để test cục bộ — dùng chung `Cipher`/`KeyFactory` API, không cần dựng Flutter app:

```java
// Test helper — mô phỏng phía client, đối xứng với SubmissionDecryptionService
PublicKey serverPublicKey = ...; // parse từ Base64 trả về lúc start attempt

KeyGenerator aesGen = KeyGenerator.getInstance("AES");
aesGen.init(256);
SecretKey aesKey = aesGen.generateKey();

byte[] iv = new byte[12];
new SecureRandom().nextBytes(iv);

Cipher aesCipher = Cipher.getInstance("AES/GCM/NoPadding");
aesCipher.init(Cipher.ENCRYPT_MODE, aesKey, new GCMParameterSpec(128, iv));
byte[] ciphertext = aesCipher.doFinal("nội dung đáp án".getBytes(StandardCharsets.UTF_8));

Cipher rsaCipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
rsaCipher.init(Cipher.WRAP_MODE, serverPublicKey,
        new OAEPParameterSpec("SHA-256", "MGF1", MGF1ParameterSpec.SHA256, PSource.PSpecified.DEFAULT));
byte[] wrappedKey = rsaCipher.wrap(aesKey);

// wrappedKey, iv, ciphertext → Base64 → POST /attempts/{publicId}/answers/encrypted
```

Ba giá trị Base64 cuối cùng chính là 3 trường `wrappedKey`/`iv`/`ciphertext` cần gửi lên `EncryptedSubmissionRequest` — đúng route STRICT ở trên.

---

*Bài tiếp theo: [Event-Driven Saga](04-event-driven-saga.md) — luồng nộp bài → chấm điểm → publish, và quyết định đổi từ Kafka sang RabbitMQ.*
