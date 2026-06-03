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
        date: "2026-05-04",
        title: "Nguyên tắc SOLID trong lập trình hướng đối tượng",
        path: "content/programming-languages/java/02-nguyen-tac-solid-trong-java.md",
        description: "Tiêu chuẩn vàng trong thiết kế phần mềm. 5 nguyên tắc giúp hệ thống linh hoạt, dễ bảo trì và mở rộng một cách bền vững."
    },
    {
        category: "java",
        date: "2026-05-04",
        title: "Bốn đặc tính cơ bản của OOP trong Java",
        path: "content/programming-languages/java/01-bon-dac-tinh-oop-trong-java.md",
        description: "Khám phá 4 cột trụ của OOP: Đóng gói, Kế thừa, Đa hình và Trừu tượng. Tìm hiểu lý do ra đời và cách chúng giải quyết các vấn đề của lập trình thủ tục."
    },

    // === SPRING BOOT ===
    {
        category: "springboot",
        date: "2026-05-04",
        title: "Cấu hình Async và Thread Pool trong Spring Boot",
        path: "content/frameworks/springboot/config/01-async-configuration.md",
        description: "Hướng dẫn chi tiết cách cấu hình ThreadPoolTaskExecutor để tối ưu hóa xử lý bất đồng bộ và quản lý tài nguyên hiệu quả trong ứng dụng Spring Boot."
    },
    {
        category: "springboot",
        date: "2026-05-03",
        title: "Spring Core Essentials: Làm chủ IoC, DI và Bean Lifecycle",
        path: "content/frameworks/springboot/02-spring-core-fundamentals.md",
        description: "Khám phá các khái niệm nền tảng của Spring: Inversion of Control, Dependency Injection và vòng đời của một Bean trong IoC Container."
    },
    {
        category: "springboot",
        date: "2026-05-03",
        title: "Bảo mật Spring Boot: Hiểu rõ về IDOR và RBAC",
        path: "content/frameworks/springboot/spring-security/01-idor-and-rbac.md",
        description: "Tìm hiểu cách phòng chống lỗ hổng IDOR và triển khai cơ chế phân quyền RBAC/ABAC hiệu quả trong ứng dụng Spring Boot."
    }
];
