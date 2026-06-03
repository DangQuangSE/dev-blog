const BLOG_POSTS = [
    // === DATA ENGINEERING ===
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[00] Lộ trình học: Tổng Quan về Data Engineering",
        path: "content/data-engineering/00-overview.md",
        description: "Tìm hiểu vai trò Data Engineer, sự khác biệt cốt lõi với Backend Engineer, và lộ trình chi tiết chuyển ngành từ BE sang DE giúp bạn phỏng vấn thành công."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[01] Phase 1 - Foundations: Data Engineering là gì & Vòng đời dữ liệu",
        path: "content/data-engineering/phase-1-foundations/01-what-is-data-engineering.md",
        description: "Khám phá Data Engineering Lifecycle dưới góc nhìn hệ thống, các khối chức năng chính từ thu thập, lưu trữ, xử lý đến phục vụ báo cáo."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[02] Phase 1 - Foundations: Python cho Data Engineering",
        path: "content/data-engineering/phase-1-foundations/02-python-for-de.md",
        description: "Sử dụng Python hiệu quả: Ingest data từ API bên ngoài, thao tác dữ liệu với Pandas, định dạng Parquet tối ưu và các design patterns thông dụng."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[03] Phase 1 - Foundations: Linux, Shell Scripting & Git nâng cao",
        path: "content/data-engineering/phase-1-foundations/03-linux-and-shell.md",
        description: "Làm chủ câu lệnh Linux thiết yếu, viết shell script tự động hóa công việc, lập lịch cron job và các chiến lược quản lý Git nâng cao."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[04] Phase 1 - Foundations: Lập trình SQL nâng cao cho DE",
        path: "content/data-engineering/phase-1-foundations/04-sql-advanced.md",
        description: "Làm chủ Analytical SQL: Window functions, Common Table Expressions (CTEs), tối ưu hóa câu lệnh truy vấn lớn và các pattern phân tích phổ biến."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[05] Phase 2 - Data Storage: Thiết kế mô hình dữ liệu OLAP (Star/Snowflake)",
        path: "content/data-engineering/phase-2-data-storage/01-data-modeling-olap-oltp.md",
        description: "Cách chuyển đổi tư duy từ mô hình OLTP sang OLAP. Thiết kế bảng Fact, Dimension, khóa Surrogate và xử lý Slowly Changing Dimensions (SCD)."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[06] Phase 2 - Data Storage: NoSQL Databases cho Data Engineer",
        path: "content/data-engineering/phase-2-data-storage/02-nosql-databases.md",
        description: "Phân tích trường hợp sử dụng các cơ sở dữ liệu phi quan hệ (NoSQL) trong hệ thống Big Data: Document, Key-Value và Wide-Column."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[07] Phase 2 - Data Storage: Data Warehouse vs Data Lake vs Lakehouse",
        path: "content/data-engineering/phase-2-data-storage/03-data-warehouse-vs-data-lake.md",
        description: "So sánh kiến trúc lưu trữ dữ liệu lớn: Sự tiến hóa từ Data Warehouse truyền thống đến Data Lake và mô hình Data Lakehouse hiện đại."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[08] Phase 2 - Data Storage: So sánh Snowflake vs BigQuery vs Redshift",
        path: "content/data-engineering/phase-2-data-storage/04-snowflake-bigquery-redshift.md",
        description: "Đánh giá chi tiết 3 nền tảng Cloud Data Warehouse hàng đầu: So sánh kiến trúc tách biệt Compute/Storage, cơ chế tính phí và cách tối ưu hiệu năng."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[09] Phase 3 - Pipelines: Tư duy thiết kế Pipeline (ETL vs ELT & CDC)",
        path: "content/data-engineering/phase-3-pipelines/01-etl-vs-elt.md",
        description: "Sự chuyển dịch từ ETL sang ELT, so sánh Batch vs Streaming, kỹ thuật Change Data Capture (CDC) đồng bộ hóa dữ liệu thời gian thực."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[10] Phase 3 - Pipelines: Điều phối Pipeline với Apache Airflow",
        path: "content/data-engineering/phase-3-pipelines/02-apache-airflow.md",
        description: "Hướng dẫn xây dựng và điều phối data workflow bằng Python: Định nghĩa DAGs, Tasks, truyền tham số XCom và cơ chế retry tự động."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[11] Phase 3 - Pipelines: Biến đổi dữ liệu thông minh với dbt",
        path: "content/data-engineering/phase-3-pipelines/03-dbt-data-build-tool.md",
        description: "Làm chủ dbt - tiêu chuẩn công nghiệp cho Analytics Engineering: Viết SQL models, snapshots lịch sử, macros tái sử dụng và testing tự động."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[12] Phase 3 - Pipelines: Data Quality & Monitoring",
        path: "content/data-engineering/phase-3-pipelines/04-data-quality.md",
        description: "Ngăn ngừa \"rác vào, rác ra\" (GIGO) bằng Data Contracts, dbt tests, và framework kiểm định chất lượng dữ liệu Great Expectations."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[13] Phase 4 - Big Data: Hệ thống phân tán cho Data Engineer",
        path: "content/data-engineering/phase-4-big-data/01-distributed-computing-concepts.md",
        description: "Nền tảng Big Data: MapReduce, kỹ thuật Partitioning & Sharding, định lý CAP, định dạng Serialization (Avro, Parquet) và Cluster management."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[14] Phase 4 - Big Data: Xử lý dữ liệu lớn với Apache Spark",
        path: "content/data-engineering/phase-4-big-data/02-apache-spark.md",
        description: "Tìm hiểu RDD, DataFrames, Lazy Evaluation, tối ưu hóa Spark Catalyst, kỹ thuật Partitioning và thực hành viết PySpark job."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[15] Phase 4 - Big Data: Streaming Data với Apache Kafka",
        path: "content/data-engineering/phase-4-big-data/03-apache-kafka-streaming.md",
        description: "Hiểu rõ Topics, Partitions, Consumer Groups, Offsets, cơ chế phân phối tin nhắn và ứng dụng trong các streaming pipelines."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[16] Phase 5 - Cloud & Ops: Dịch vụ Cloud (AWS/GCP) & Terraform IaC",
        path: "content/data-engineering/phase-5-cloud-and-modern/01-cloud-platforms-aws-gcp-azure.md",
        description: "Bản đồ đối chiếu các dịch vụ DE trên AWS, GCP, Azure và cách quản lý tài nguyên hạ tầng khai báo tự động bằng Terraform."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[17] Phase 5 - Cloud & Ops: Docker & Kubernetes cho Data Pipelines",
        path: "content/data-engineering/phase-5-cloud-and-modern/02-docker-kubernetes-for-de.md",
        description: "Container hóa data pipelines, thiết lập môi trường local bằng docker-compose, submit Spark jobs và deploy Airflow trên Kubernetes."
    },
    {
        category: "data-engineering",
        date: "2026-06-03",
        title: "[18] Phase 5 - Cloud & Ops: Data Governance và Security",
        path: "content/data-engineering/phase-5-cloud-and-modern/03-data-governance-and-security.md",
        description: "Bảo vệ dữ liệu với Masking/Hashing PII, phân quyền Column/Row-level security, Data Catalog (Datahub) và Data Lineage nguồn gốc dữ liệu."
    },

    // === DSA (DATA STRUCTURES & ALGORITHMS) ===
    {
        category: "data-structures",
        date: "2026-05-11",
        title: "Stack & Queue: Cơ chế LIFO/FIFO và ứng dụng trong điều phối hệ thống",
        path: "content/dsa/data-structures/05-stack-va-queue-lifo-fifo-trong-thuc-te.md",
        description: "Khám phá hai \"người điều phối\" kỷ luật nhất trong cấu trúc dữ liệu. Từ cơ chế Stack Frame của CPU đến hàng đợi tin nhắn trong hệ thống lớn, và cách giải quyết bài toán Valid Parentheses trên LeetCode."
    },
    {
        category: "data-structures",
        date: "2026-05-11",
        title: "Danh sách liên kết (LinkedList): Toàn tập từ lý thuyết đến thực hành",
        path: "content/dsa/data-structures/04-linked-list-toan-tap-tu-ly-thuyet-den-thuc-hanh.md",
        description: "Hướng dẫn chuyên sâu về LinkedList: Từ cơ chế cấp phát động trong RAM đến thuật toán \"Rùa và Thỏ\" trên LeetCode. Giải mã lý do tại sao LinkedList là cứu cánh cho bài toán bộ nhớ phân tán."
    },
    {
        category: "data-structures",
        date: "2026-05-11",
        title: "Danh sách liên kết (LinkedList): Linh hoạt trong lưu trữ",
        path: "content/dsa/data-structures/03-danh-sach-lien-ket-linkedlist.md",
        description: "Khám phá sức mạnh của LinkedList, giải quyết nhược điểm về kích thước cố định của mảng. Học cách đảo ngược danh sách với LeetCode 206."
    },
    {
        category: "data-structures",
        date: "2026-05-11",
        title: "Mảng (Array): Cấu trúc dữ liệu cơ bản nhất",
        path: "content/dsa/data-structures/01-mang-array-co-ban.md",
        description: "Tìm hiểu về mảng, lý do ra đời và cách tối ưu hóa truy xuất dữ liệu. Ví dụ thực tế với bài toán LeetCode Remove Duplicates."
    },
    {
        category: "data-structures",
        date: "2026-05-11",
        title: "HashSet và HashMap: Sức mạnh của Bảng băm",
        path: "content/dsa/data-structures/02-hashset-va-hashmap-trong-java.md",
        description: "Làm chủ kỹ thuật bảng băm để tối ưu tốc độ tìm kiếm từ O(n) xuống O(1). Giải quyết các bài toán LeetCode Two Sum và Contains Duplicate."
    },

    // === JAVA ===
    {
        category: "java",
        date: "2026-06-03",
        title: "[00] Lộ trình học: Tổng Quan về Lập trình Java",
        path: "content/programming-languages/java/00-overview.md",
        description: "Tổng quan về ngôn ngữ lập trình Java, các tính năng nổi bật giúp Java trường tồn và lộ trình học chi tiết từ cơ bản đến nâng cao."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[01] Phase 1 - Foundations: Phân biệt JDK, JRE, JVM & Cơ chế biên dịch",
        path: "content/programming-languages/java/phase-1-foundations/01-jvm-jre-jdk.md",
        description: "Tìm hiểu cấu trúc máy ảo Java (JVM), môi trường chạy (JRE), bộ phát triển (JDK) và quy trình biên dịch Bytecode tĩnh/động với JIT Compiler."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[02] Phase 1 - Foundations: Cú pháp cơ bản, Biến, Ép kiểu, Toán tử & Mảng",
        path: "content/programming-languages/java/phase-1-foundations/02-java-basics-syntax.md",
        description: "Phân biệt kiểu dữ liệu nguyên thủy (Stack) vs tham chiếu (Heap), cơ chế tối ưu String Pool và các cú pháp điều khiển luồng, mảng cơ bản."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[03] Phase 2 - OOP: Lớp, Đối tượng, Access Specifiers, Static & Final",
        path: "content/programming-languages/java/phase-2-oop/03-basics-of-oop.md",
        description: "Làm chủ các khái niệm nền tảng của OOP: Lớp, Đối tượng, phạm vi truy cập dữ liệu, biến/phương thức static và từ khóa hằng số final."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[04] Phase 2 - OOP: Kế thừa, Trừu tượng, Đóng gói, Đa hình, Records & Enums",
        path: "content/programming-languages/java/phase-2-oop/04-more-about-oop.md",
        description: "Khám phá các tính năng OOP nâng cao, cơ chế Dynamic Binding, bản chất Pass-by-value của Java và các tính năng hiện đại như Record, Enum."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[05] Phase 2 - OOP: Áp dụng 5 nguyên tắc SOLID trong Java",
        path: "content/programming-languages/java/phase-2-oop/05-nguyen-tac-solid-trong-java.md",
        description: "Chi tiết 5 nguyên tắc thiết kế SOLID giúp lập trình viên viết mã nguồn sạch, ít phụ thuộc, dễ dàng mở rộng và bảo trì hệ thống."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[06] Phase 3 - Common APIs: Làm việc với Date-Time, RegEx, Cryptography & Networking",
        path: "content/programming-languages/java/phase-3-common-apis/06-java-common-apis.md",
        description: "Làm chủ các API thiết yếu: Phân tích múi giờ với Java Time API mới, so khớp mẫu RegEx, mã hóa bảo mật AES/SHA và gọi HTTP với HttpClient mới."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[07] Phase 3 - Common APIs: Quản lý Optionals, I/O Stream & Thao tác File",
        path: "content/programming-languages/java/phase-3-common-apis/07-io-file-operations.md",
        description: "Xử lý lỗi tham chiếu null chuyên nghiệp với Optional, làm việc với luồng nhập xuất (I/O) và thao tác file siêu tốc bằng Java NIO.2."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[08] Phase 4 - Collections & Generics: Làm chủ List, Set, Map, Queue & Stack",
        path: "content/programming-languages/java/phase-4-collections-generics/08-collections-framework.md",
        description: "Khám phá thế giới cấu trúc dữ liệu Java: Giải mã cơ chế tự co giãn của ArrayList và cơ chế băm/va chạm cây đỏ-đen của HashMap trong RAM."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[09] Phase 4 - Collections & Generics: Generics, Type Erasure & Wildcards",
        path: "content/programming-languages/java/phase-4-collections-generics/09-generics-wildcards.md",
        description: "Viết mã nguồn an toàn kiểu dữ liệu bằng Generics, cơ chế xóa kiểu (Type Erasure) của trình biên dịch và nguyên tắc vàng PECS khi dùng Wildcard."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[10] Phase 5 - Exceptions & FP: Xử lý ngoại lệ, try-with-resources, Annotations & Modules",
        path: "content/programming-languages/java/phase-5-exceptions-fp/10-exceptions-handling.md",
        description: "Quản lý lỗi chuyên nghiệp bằng Exception, tự động đóng tài nguyên qua try-with-resources, tạo custom Annotations và cấu trúc dự án Java Modules."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[11] Phase 5 - Exceptions & FP: Lập trình hàm: Lambda, Functional Interfaces & Stream API",
        path: "content/programming-languages/java/phase-5-exceptions-fp/11-functional-programming-stream.md",
        description: "Lập trình hàm ngắn gọn, khai báo: Hiểu sâu Functional Interfaces chuẩn, biểu thức Lambda và xử lý tập hợp mảng song song với Stream API."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[12] Phase 6 - Concurrency: Threads, volatile, JMM, Thread Pool & Virtual Threads",
        path: "content/programming-languages/java/phase-6-concurrency/12-concurrency-jmm-threads.md",
        description: "Lập trình đa luồng nâng cao: volatile, Happens-Before, quản lý Thread Pool tối ưu và giải pháp cách mạng Virtual Threads trong Java 21+."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[13] Phase 6 - Concurrency: Nguyên lý Dependency Injection & Design Patterns",
        path: "content/programming-languages/java/phase-6-concurrency/13-dependency-injection.md",
        description: "Hiểu sâu nguyên lý IoC/DI, so sánh Constructor vs Setter Injection và áp dụng các mẫu thiết kế Strategy, Factory, Singleton trong Java."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[14] Phase 7 - Ecosystem: Công cụ Build (Maven, Gradle, Bazel) & Web Frameworks",
        path: "content/programming-languages/java/phase-7-ecosystem/14-build-tools-frameworks.md",
        description: "Tổng quan các công cụ quản lý build tự động Maven/Gradle/Bazel và so sánh các web frameworks hàng đầu: Spring Boot, Quarkus, Javalin, Play."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[15] Phase 7 - Ecosystem: Truy xuất Cơ sở dữ liệu: JDBC, EBean, Hibernate & JPA",
        path: "content/programming-languages/java/phase-7-ecosystem/15-database-access.md",
        description: "Kết nối cơ sở dữ liệu quan hệ trong Java: So sánh JDBC thô vs các bộ ORM (EBean, Hibernate, JPA) và cách xử lý lỗi hiệu năng N+1 Query."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[16] Phase 7 - Ecosystem: Logging Frameworks (Logback, Log4j2, SLF4J) & Javadoc",
        path: "content/programming-languages/java/phase-7-ecosystem/16-logging-documentation.md",
        description: "Ghi log chuyên nghiệp với SLF4J, so sánh Logback vs Log4j2 (lỗ hổng Log4Shell) và hướng dẫn viết tài liệu Javadoc tiêu chuẩn."
    },
    {
        category: "java",
        date: "2026-06-03",
        title: "[17] Phase 7 - Ecosystem: Kiểm thử toàn diện: Unit, Integration, Mocking & Behavior Testing",
        path: "content/programming-languages/java/phase-7-ecosystem/17-testing-frameworks.md",
        description: "Bảo vệ mã nguồn an toàn bằng kiểm thử: JUnit 5, giả lập dependency với Mockito, kiểm thử API với REST Assured và BDD test với Cucumber."
    },

    // === SPRING BOOT ===
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[00] Lộ trình học: Tổng Quan về Spring Boot",
        path: "content/frameworks/springboot/00-overview.md",
        description: "Tổng quan về hệ sinh thái Spring Boot, so sánh với Spring Framework truyền thống và lộ trình học chi tiết từ cơ bản đến nâng cao."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[01] Phase 1 - Foundations: Spring Framework & Spring Boot là gì?",
        path: "content/frameworks/springboot/phase-1-foundations/01-introduction-to-spring.md",
        description: "Tìm hiểu lịch sử tiến hóa từ J2EE sang Spring Framework, cơ chế Auto-Configuration, Starters và Embedded Web Server nhúng."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[02] Phase 1 - Foundations: Spring Core: IoC, DI, AOP & Bean Lifecycle",
        path: "content/frameworks/springboot/phase-1-foundations/02-spring-core-fundamentals.md",
        description: "Khám phá các khái niệm nền tảng của Spring: Inversion of Control (IoC), Dependency Injection (DI), Bean Lifecycle và Aspect Oriented Programming (AOP)."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[03] Phase 2 - Spring MVC: Kiến trúc Spring MVC: Servlet, JSP & Components",
        path: "content/frameworks/springboot/phase-2-spring-mvc/03-spring-mvc-architecture.md",
        description: "Tìm hiểu kiến trúc web của Java: Servlets, JSP Files, DispatcherServlet, HandlerMapping, ViewResolver và mô hình Front Controller."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[04] Phase 2 - Spring MVC: Xây dựng RESTful API với Spring MVC",
        path: "content/frameworks/springboot/phase-2-spring-mvc/04-restful-api-spring-mvc.md",
        description: "Xây dựng RESTful API chuẩn REST: Sự khác biệt giữa Controller và RestController, DTO Pattern và kiểm soát HTTP response với ResponseEntity."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[05] Phase 2 - Spring MVC: Exception Handling & Validation trong Spring Boot",
        path: "content/frameworks/springboot/phase-2-spring-mvc/05-exception-handling-validation.md",
        description: "Ràng buộc dữ liệu đầu vào bằng Jakarta Bean Validation (@Valid) và xử lý lỗi tập trung an toàn với RestControllerAdvice."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[06] Phase 3 - Data Access: Hibernate Core: Transactions, Relationships & Entity Lifecycle",
        path: "content/frameworks/springboot/phase-3-data-access/06-hibernate-core-lifecycle.md",
        description: "Khám phá bản chất của ORM: Quản lý giao dịch, các loại quan hệ thực tế (Fetch/Cascade Types) và 4 trạng thái vòng đời của Entity."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[07] Phase 3 - Data Access: Spring Data: Spring Data JPA, MongoDB & JDBC",
        path: "content/frameworks/springboot/phase-3-data-access/07-spring-data-jpa-nosql.md",
        description: "So sánh 3 nền tảng dữ liệu trong Spring Data: Spring Data JPA, NoSQL MongoDB và Spring Data JDBC tối giản."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[08] Phase 4 - Security: Spring Security Architecture & Authentication Flow",
        path: "content/frameworks/springboot/phase-4-security/08-spring-security-architecture.md",
        description: "Hiểu sâu về cơ chế bảo mật của Spring Security: Kiến trúc Filter Chain, DelegatingFilterProxy và phân tích luồng xác thực chi tiết."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[09] Phase 4 - Security: Bảo mật nâng cao: JWT & OAuth2",
        path: "content/frameworks/springboot/phase-4-security/09-jwt-oauth2-security.md",
        description: "Bảo mật hệ thống hiện đại: Phân biệt cơ chế xác thực không trạng thái JWT và giao thức ủy quyền OAuth2 (Google Login)."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[10] Phase 5 - Advanced: Lập trình bất đồng bộ & Thread Pool",
        path: "content/frameworks/springboot/phase-5-advanced/10-async-thread-pool.md",
        description: "Hướng dẫn cấu hình ThreadPoolTaskExecutor để xử lý bất đồng bộ (@Async) hiệu quả và tránh cạn kiệt tài nguyên hệ thống."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[11] Phase 5 - Advanced: Monitoring & Observability với Actuator & Micrometer",
        path: "content/frameworks/springboot/phase-5-advanced/11-monitoring-observability-actuator.md",
        description: "Giám sát sức khỏe ứng dụng thời gian thực bằng Spring Boot Actuator, tích hợp Micrometer thu thập số liệu và hiển thị trên Grafana."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[12] Phase 6 - Testing: Kiểm thử: JUnit 5, Mockito, MockMvc, @SpringBootTest & @MockBean",
        path: "content/frameworks/springboot/phase-6-testing/12-unit-integration-testing.md",
        description: "Phân biệt Unit Test và Integration Test: Sử dụng JUnit 5, Mockito và MockMvc giả lập Servlet để kiểm thử toàn diện luồng ứng dụng."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[13] Phase 6 - Testing: Containerized Testing với Testcontainers",
        path: "content/frameworks/springboot/phase-6-testing/13-testcontainers.md",
        description: "Sử dụng thư viện Testcontainers để chạy cơ sở dữ liệu PostgreSQL thực tế trong môi trường Docker giả lập lúc chạy kiểm thử tích hợp."
    },
    {
        category: "springboot",
        date: "2026-06-03",
        title: "[14] Phase 7 - Microservices: Kiến trúc Microservices với Spring Cloud",
        path: "content/frameworks/springboot/phase-7-microservices/14-spring-cloud-microservices.md",
        description: "Xây dựng hệ thống phân tán lớn: Service Discovery (Eureka), API Gateway, Config Server, Circuit Breaker (Resilience4j) và Feign Client."
    }
];
