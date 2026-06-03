# [01] Phase 1 - Foundations: Phân biệt JDK, JRE, JVM & Cơ chế biên dịch

## 1. Nguồn gốc và lý do ra đời của Kiến trúc Máy ảo Java (JVM)

### Khó khăn của ngôn ngữ biên dịch trực tiếp (C/C++)
Trước khi Java xuất hiện, hầu hết các ngôn ngữ phổ biến (như C, C++) biên dịch trực tiếp mã nguồn thành mã máy của một CPU và hệ điều hành cụ thể.
- **Hạn chế**: Nếu bạn viết một chương trình trên Windows (x86), bạn không thể chạy trực tiếp tệp `.exe` đó trên macOS (PowerPC/Intel) hay Linux. Bạn phải mang toàn bộ mã nguồn sang hệ điều hành mới và biên dịch lại (Re-compile). Quá trình này rất mất thời gian do sự khác biệt về tập lệnh CPU và thư viện hệ thống (API OS).

### Triết lý "Write Once, Run Anywhere" (WORA) của Java
Java ra đời với mục tiêu giải quyết triệt để bài toán đa nền tảng này bằng cách đưa vào một tầng trung gian: **Máy ảo Java (JVM)**.
- Thay vì dịch thẳng ra mã máy, mã nguồn Java dịch thành một mã trung gian tiêu chuẩn gọi là **Bytecode**.
- Bất kỳ thiết bị nào (máy tính, điện thoại, tủ lạnh) có cài đặt JVM tương thích đều có thể chạy được Bytecode này mà không cần biên dịch lại mã nguồn.

---

## 2. Phân biệt JDK, JRE và JVM

Ba khái niệm này tạo thành một cấu trúc lồng nhau phân chia theo mục đích sử dụng:

```
┌────────────────────────────────────────────────────────┐
│ JDK (Java Development Kit)                             │
│  - Phát triển (Compiler: javac, Debugger, Javadoc...)  │
│ ┌────────────────────────────────────────────────────┐ │
│ │ JRE (Java Runtime Environment)                     │ │
│ │  - Chạy ứng dụng (Thư viện Core Class, Jar...)     │ │
│ │ ┌────────────────────────────────────────────────┐ │ │
│ │ │ JVM (Java Virtual Machine)                     │ │ │
│ │ │  - Thực thi Bytecode, GC, JIT compiler...      │ │ │
│ │ └────────────────────────────────────────────────┘ │ │
│ └────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────┘
```

### 1. JVM (Java Virtual Machine)
- **Nhiệm vụ**: Đọc tệp Bytecode `.class`, thông dịch hoặc biên dịch nó thành mã máy thực tế để CPU thực thi. Nó cũng quản lý bộ nhớ (Garbage Collection) và bảo mật hệ thống.
- **Đặc điểm**: JVM có tính chất **phụ thuộc nền tảng** (platform-dependent). Có JVM riêng cho Windows, JVM riêng cho macOS và JVM riêng cho Linux.

### 2. JRE (Java Runtime Environment)
- **Nhiệm vụ**: Cung cấp môi trường tối thiểu để **chạy** một ứng dụng Java.
- **Thành phần**: Bao gồm JVM và các thư viện lớp chuẩn của Java (Java class libraries như `java.lang`, `java.util`) để ứng dụng có thể gọi sử dụng.

### 3. JDK (Java Development Kit)
- **Nhiệm vụ**: Cung cấp đầy đủ công cụ để **phát triển** (viết, biên dịch, đóng gói) và chạy ứng dụng Java.
- **Thành phần**: Bao gồm JRE và các công cụ phát triển như trình biên dịch `javac`, trình gỡ lỗi (debugger), công cụ tạo tài liệu `javadoc`.

---

## 3. Quy trình thực thi mã nguồn Java

Quy trình một dòng code Java chuyển từ bàn phím của bạn đến CPU được chia làm 2 giai đoạn:

```
[Mã nguồn .java] 
       │
       ▼ (Giai đoạn 1: Biên dịch tĩnh bằng trình biên dịch 'javac')
[Bytecode .class] (Độc lập nền tảng)
       │
       ├─────────────────────────┐ (Giai đoạn 2: Máy ảo JVM thực thi)
       ▼ (Thông dịch bằng Interpreter)   ▼ (Biên dịch động bằng JIT Compiler)
[Mã máy - Machine Code] ─────────┴─> Thực thi trên CPU của OS
```

### Chi tiết 2 giai đoạn:
1. **Biên dịch tĩnh (Static Compilation)**: Lập trình viên chạy lệnh `javac Program.java`. Trình biên dịch kiểm tra lỗi cú pháp và xuất ra tệp `Program.class` chứa Bytecode.
2. **Thực thi động trên JVM (Dynamic Execution)**:
   - **Interpreter (Trình thông dịch)**: Đọc từng dòng Bytecode và dịch trực tiếp sang mã máy để chạy ngay lập tức. Ưu điểm là khởi động nhanh, nhược điểm là các vòng lặp hay đoạn code chạy lặp lại nhiều lần sẽ phải dịch đi dịch lại, gây chậm.
   - **JIT Compiler (Just-In-Time Compiler - Trình biên dịch tức thời)**: JVM liên tục theo dõi các đoạn code được gọi nhiều lần (gọi là "Hot Spots"). JIT sẽ biên dịch toàn bộ đoạn code "hot" này một lần duy nhất thành mã máy tối ưu và lưu vào cache để các lần sau gọi trực tiếp mã máy này. Việc này giúp cải thiện hiệu năng Java ngang ngửa với C/C++.

---

## 4. Rủi ro khi không hiểu rõ kiến trúc Java

1. **Cấu hình sai môi trường máy chủ (Production Server)**: Cài đặt bản JDK đầy đủ (nặng hàng trăm MB) trên máy chủ chạy production. Thực tế, máy chủ chỉ cần chạy ứng dụng, do đó chỉ cần cài đặt JRE (hoặc chạy bản JVM thu gọn qua công cụ `jlink` từ Java 9+) để tối ưu bộ nhớ và hạn chế rủi ro bảo mật từ các công cụ phát triển đi kèm.
2. **Lỗi không tương thích phiên bản (UnsupportedClassVersionError)**: Biên dịch code trên máy cá nhân bằng JDK phiên bản cao (ví dụ Java 21) nhưng chạy tệp `.class` trên máy chủ sử dụng JRE phiên bản thấp hơn (ví dụ Java 17). Java luôn đảm bảo tính tương thích ngược (máy ảo mới chạy được code cũ) nhưng không tương thích xuôi (máy ảo cũ không chạy được code mới).
