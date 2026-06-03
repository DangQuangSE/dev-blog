# [00] Lộ trình học: Tổng Quan về Lập trình Java

## Giới thiệu về Ngôn ngữ lập trình Java

**Java** là một trong những ngôn ngữ lập trình phổ biến nhất thế giới kể từ khi ra mắt vào năm 1995 bởi Sun Microsystems (sau này được Oracle mua lại). Triết lý nổi tiếng của Java là **"Write Once, Run Anywhere" (WORA)** - Viết một lần, chạy mọi nơi. Nhờ máy ảo Java (JVM), code Java có thể chạy trên mọi nền tảng phần cứng mà không cần biên dịch lại.

Lộ trình này được thiết kế dựa trên tiêu chuẩn tại [roadmap.sh/java](https://roadmap.sh/java), giúp bạn đi từ các khái niệm nền tảng, tư duy hướng đối tượng (OOP), các tính năng nâng cao (Collections, Generics, Concurrency) đến các khái niệm hiện đại nhất như **Virtual Threads** ở Java 21+.

---

## 1. Tại sao Java lại trường tồn và phổ biến?

### a) Máy ảo Java (JVM) & Độc lập nền tảng
Ngôn ngữ C/C++ biên dịch trực tiếp thành mã máy của hệ điều hành cụ thể (Windows x86, Linux ARM). Java đi theo cách khác: biên dịch mã nguồn thành một dạng mã trung gian gọi là **Bytecode** (tệp `.class`), sau đó JVM trên từng hệ điều hành sẽ thông dịch hoặc biên dịch Bytecode này thành mã máy tương ứng.

### b) Tự động Quản lý Bộ nhớ (Garbage Collection)
Không giống C/C++, nơi lập trình viên phải gọi hàm giải phóng bộ nhớ thủ công (dễ gây lỗi Memory Leak hoặc Crash), Java có bộ dọn rác **Garbage Collector (GC)** tự động quét RAM và thu hồi bộ nhớ của các đối tượng không còn được sử dụng.

### c) Hệ sinh thái Doanh nghiệp (Enterprise) Khổng lồ
Java là ngôn ngữ xương sống của hầu hết hệ thống tài chính, ngân hàng, thương mại điện tử lớn nhờ tính bảo mật cao, đa luồng tốt và hiệu năng ổn định. Khung phát triển **Spring Boot** chính là nền tảng số 1 để xây dựng web service hiện nay.

---

## 2. Rủi ro khi không học Java theo lộ trình bài bản

1. **Hiểu sai về OOP & SOLID**: Viết code hướng đối tượng nhưng tư duy kiểu thủ tục (procedural), lạm dụng kế thừa dẫn đến code cứng nhắc, khó bảo trì.
2. **Lỗi Memory Leak & Hiệu năng do GC**: Không hiểu cơ chế Heap/Stack và cách GC hoạt động sẽ dẫn đến việc tạo quá nhiều đối tượng rác, gây ra lỗi lag hệ thống (Stop-the-world) hoặc Out-Of-Memory (OOM).
3. **Cạnh tranh luồng (Concurreny Bugs)**: Viết code đa luồng nhưng không hiểu cơ chế khóa (Lock/Synchronized), dẫn đến lỗi giật luồng (Deadlock) hoặc sai lệch dữ liệu (Race Condition) rất khó tái hiện để sửa.

---

## 3. Lộ trình học (Roadmap) Java chi tiết

Dưới đây là danh sách các bài viết chi tiết được lập chỉ mục và sắp xếp theo đúng lộ trình học chuẩn tại [roadmap.sh/java](https://roadmap.sh/java):

### Phase 1: Foundations (Nền tảng cú pháp & Máy ảo)
1. **JVM & Biên dịch**: [\[01\] Phase 1: Phân biệt JDK, JRE, JVM & Cơ chế biên dịch](reader.html?post=content/programming-languages/java/phase-1-foundations/01-jvm-jre-jdk.md) - Tìm hiểu cách mã Java chạy trên máy ảo.
2. **Cú pháp cơ bản**: [\[02\] Phase 1: Cú pháp cơ bản, Biến, Ép kiểu, Toán tử & Mảng](reader.html?post=content/programming-languages/java/phase-1-foundations/02-java-basics-syntax.md) - Nắm vững bộ nhớ Stack/Heap, String Pool và cấu trúc rẽ nhánh.

### Phase 2: Object-Oriented Programming (OOP)
1. **Lớp & Đối tượng**: [\[03\] Phase 2: Lớp, Đối tượng, Access Specifiers, Static & Final](reader.html?post=content/programming-languages/java/phase-2-oop/03-basics-of-oop.md) - Tìm hiểu cấu trúc Class cơ bản, phạm vi truy cập và biến static.
2. **Kế thừa & Đa hình**: [\[04\] Phase 2: Kế thừa, Trừu tượng, Đóng gói, Đa hình, Records & Enums](reader.html?post=content/programming-languages/java/phase-2-oop/04-more-about-oop.md) - Đi sâu vào các tính năng OOP nâng cao, Record hiện đại và Enums.
3. **Nguyên tắc SOLID**: [\[05\] Phase 2: Áp dụng 5 nguyên tắc SOLID trong Java](reader.html?post=content/programming-languages/java/phase-2-oop/05-nguyen-tac-solid-trong-java.md) - 5 nguyên tắc thiết kế hướng đối tượng giúp hệ thống mở rộng linh hoạt.

### Phase 3: Common APIs (Date-Time, RegEx, Crypto & Net)
1. **Các API thông dụng**: [\[06\] Phase 3: Làm việc với Date-Time, RegEx, Cryptography & Networking](reader.html?post=content/programming-languages/java/phase-3-common-apis/06-java-common-apis.md) - Làm chủ Date-Time mới, RegEx, mã hóa dữ liệu và HttpClient.
2. **I/O & Optionals**: [\[07\] Phase 3: Quản lý Optionals, I/O Stream & Thao tác File](reader.html?post=content/programming-languages/java/phase-3-common-apis/07-io-file-operations.md) - Xử lý null an toàn với Optional và thao tác file siêu tốc với Java NIO.2.

### Phase 4: Collections & Generics (Cấu trúc dữ liệu & An toàn kiểu)
1. **Collections Framework**: [\[08\] Phase 4: Làm chủ List, Set, Map, Queue & Stack](reader.html?post=content/programming-languages/java/phase-4-collections-generics/08-collections-framework.md) - Hiểu sâu cấu trúc dữ liệu ArrayList, HashSet, HashMap hoạt động thế nào trong RAM.
2. **Generics & Wildcards**: [\[09\] Phase 4: Generics, Type Erasure & Wildcards](reader.html?post=content/programming-languages/java/phase-4-collections-generics/09-generics-wildcards.md) - Viết code an toàn kiểu dữ liệu tại thời điểm biên dịch và nguyên tắc vàng PECS.

### Phase 5: Exceptions & Functional Programming (Xử lý ngoại lệ & Lập trình hàm)
1. **Xử lý ngoại lệ**: [\[10\] Phase 5: Xử lý ngoại lệ, try-with-resources, Annotations & Modules](reader.html?post=content/programming-languages/java/phase-5-exceptions-fp/10-exceptions-handling.md) - Tránh crash app, phân biệt Checked/Unchecked Exception, Custom Annotations và Java Modules.
2. **Lập trình hàm (FP)**: [\[11\] Phase 5: Lập trình hàm: Lambda, Functional Interfaces & Stream API](reader.html?post=content/programming-languages/java/phase-5-exceptions-fp/11-functional-programming-stream.md) - Phong cách viết code khai báo (declarative) ngắn gọn và tối ưu hóa xử lý mảng.

### Phase 6: Concurrency & DI (Đa luồng & Thiết kế hệ thống)
1. **Đa luồng & Virtual Threads**: [\[12\] Phase 6: Threads, volatile, JMM, Thread Pool & Virtual Threads](reader.html?post=content/programming-languages/java/phase-6-concurrency/12-concurrency-jmm-threads.md) - Đa luồng từ cơ bản đến nâng cao, Happens-Before và Virtual Threads (Java 21+).
2. **Dependency Injection**: [\[13\] Phase 6: Nguyên lý Dependency Injection & Design Patterns](reader.html?post=content/programming-languages/java/phase-6-concurrency/13-dependency-injection.md) - Nguyên lý IoC/DI, Strategy, Factory, Singleton Patterns giúp hệ thống lỏng lẻo.

### Phase 7: Ecosystem (Công cụ Build, DB, Logging & Testing)
1. **Công cụ Build & Web**: [\[14\] Phase 7: Công cụ Build (Maven, Gradle, Bazel) & Web Frameworks](reader.html?post=content/programming-languages/java/phase-7-ecosystem/14-build-tools-frameworks.md) - Quản lý build và đối chiếu các web frameworks hàng đầu.
2. **Truy xuất Cơ sở dữ liệu**: [\[15\] Phase 7: Truy xuất Cơ sở dữ liệu: JDBC, EBean, Hibernate & JPA](reader.html?post=content/programming-languages/java/phase-7-ecosystem/15-database-access.md) - Kết nối DB thô và tối ưu hóa các ORM (tránh N+1 query).
3. **Logging & Javadoc**: [\[16\] Phase 7: Logging Frameworks (Logback, Log4j2, SLF4J) & Javadoc](reader.html?post=content/programming-languages/java/phase-7-ecosystem/16-logging-documentation.md) - Ghi log an toàn, phân biệt log levels và viết tài liệu chuẩn.
4. **Kiểm thử toàn diện**: [\[17\] Phase 7: Kiểm thử toàn diện: Unit, Integration, Mocking & Behavior Testing](reader.html?post=content/programming-languages/java/phase-7-ecosystem/17-testing-frameworks.md) - JUnit 5, Mockito, REST Assured và Cucumber-JVM.

---

## 4. Tài liệu tham khảo quan trọng
- [Tài liệu chính thức của Oracle Java](https://docs.oracle.com/en/java/)
- **Effective Java (3rd Edition)** - Joshua Bloch (Sách gối đầu giường của mọi Java Developer)
- **Java Concurrency in Practice** - Brian Goetz
