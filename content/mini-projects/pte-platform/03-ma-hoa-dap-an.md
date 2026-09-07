# PTE Platform — Mã Hóa Đáp Án STRICT

*Bài 3/5 trong series case study PTE Platform. Trạng thái tại 2026-09-07.*

Với các kỳ thi có giám sát (`answerIntegrityLevel = STRICT` trên attempt đã pin), đáp án không chỉ cần xác thực **ai** gửi (JWT lo việc đó) — nó cần bằng chứng **không bị sửa** trên đường truyền. Đây là chỗ `exam-delivery` dùng một cặp key RSA-2048 **riêng của chính nó**, tách hẳn khỏi key ký JWT của `iam`.

## Vì sao tách key mã hóa khỏi key JWT

JWT key trả lời câu hỏi *danh tính* (ai gửi request này). Key mã hóa trả lời câu hỏi *toàn vẹn* (nội dung có bị đụng vào không). Gộp chung một cặp key nghĩa là một lỗi ở tầng này kéo sập cả tầng kia. Tách ra giới hạn blast-radius: `iam` sập không ảnh hưởng khả năng giải mã đáp án đang chờ xử lý; xoay vòng key mã hóa không đụng tới phiên đăng nhập đang hoạt động.

Hệ quả trực tiếp: `exam-delivery` **không cần gọi đồng bộ sang `iam`** để lấy key mã hóa lúc học viên đang làm bài — đúng nguyên tắc "zero outbound sync call lúc thi" ở ADR-001.

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

`EncryptionKeyProvider` chỉ cho phép tự sinh key tạm (ephemeral) ở profile `dev`/`local`. Ở production, thiếu biến môi trường `exam-delivery.encryption.private-key-pem` / `public-key-pem` làm service **từ chối khởi động** thay vì âm thầm sinh key ngẫu nhiên. Lý do: nếu service tự sinh key mỗi lần restart, public key học viên đã dùng để mã hóa từ lần trước sẽ vô hiệu ngay — toàn bộ attempt STRICT đang pin coi như hỏng. Fail-fast ở đây rẻ hơn nhiều so với debug một đợt mất dữ liệu đáp án lúc nửa đêm.

## Flow 3 bước

**1. Server phát public key.** Khi học viên bắt đầu attempt STRICT, response trả kèm `encryptionPublicKey` (Base64) lấy từ `EncryptionKeyProvider.getPublicKeyBase64()`. Private key không rời server.

**2. Client mã hóa (Flutter, phía học viên).** Sinh AES-256 key ngẫu nhiên cho riêng lần nộp bài này, mã hóa nội dung đáp án bằng AES-GCM (IV 96-bit, auth tag 128-bit), rồi bọc (wrap) AES key đó bằng RSA public key của server (RSA-OAEP). Gửi lên 3 trường Base64: `wrappedKey`, `iv`, `ciphertext`.

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
```

Unwrap AES key bằng RSA private key, rồi giải mã payload bằng AES-GCM — chính thao tác giải mã GCM verify luôn 128-bit auth tag, nên **tampering bị phát hiện ngay tại bước decrypt**, không cần kiểm tra riêng.

```java
private Key unwrapAesKey(byte[] wrappedKey, PrivateKey privateKey) ... {
    Cipher cipher = Cipher.getInstance("RSA/ECB/OAEPWithSHA-256AndMGF1Padding");
    cipher.init(Cipher.UNWRAP_MODE, privateKey, OAEP_SHA256);
    return cipher.unwrap(wrappedKey, "AES", Cipher.SECRET_KEY);
}
```

## Chi tiết interop dễ mắc lỗi nhất

`OAEPParameterSpec` khai báo tường minh `SHA-256` cho cả digest chính lẫn MGF1 (`MGF1ParameterSpec.SHA256`) ở **cả hai phía** client và server. Đây là điểm dễ vỡ nhất khi nối một client Dart/Flutter với server Java — nếu một bên mặc định MGF1-SHA1 (default của nhiều thư viện) còn bên kia khai SHA-256, unwrap key sẽ fail mà thông báo lỗi không nói rõ nguyên nhân là do lệch MGF digest. Bất kỳ lỗi nào trong toàn bộ flow — Base64 sai định dạng, IV sai độ dài, RSA unwrap thất bại, hay GCM auth tag không khớp — đều gom về một `SubmissionDecryptionException` (4xx) trước khi có cơ hội ghi bất cứ gì xuống DB.

---

*Bài tiếp theo: [Event-Driven Saga](04-event-driven-saga.md) — luồng nộp bài → chấm điểm → publish, và quyết định đổi từ Kafka sang RabbitMQ.*
