# Docker và Kubernetes cho Data Engineer

## Giới thiệu

Docker và Kubernetes đã thay đổi cách deploy software — và data pipelines cũng không ngoại lệ. Là BE, bạn có thể đã biết Docker cơ bản. Bài này tập trung vào cách DE dùng containerization trong data pipeline context, từ local development đến production deployment.

---

## 1. Tại sao Container hóa Data Pipeline?

### Vấn đề trước Docker

```
"Nó chạy trên máy tôi nhưng không chạy trên production"

Nguyên nhân:
- Python version khác nhau (3.8 vs 3.11)
- Library version khác nhau (pandas 1.3 vs 2.0)
- Environment variables khác nhau
- OS khác nhau (Windows dev, Linux prod)
- Spark config khác nhau

Kết quả: DE mất 2 ngày debug vì "works on my machine"
```

### Docker giải quyết

```
Docker container = "Package everything":
├── Python 3.10.12 (exact version)
├── pandas==2.0.3
├── pyspark==3.4.1
├── All system dependencies
└── Your code

Chạy trên bất kỳ machine nào có Docker → Same behavior!
```

---

## 2. Docker cho DE - Essentials

### Dockerfile cho Python Data Pipeline

```dockerfile
# Dockerfile
FROM python:3.10-slim

# System dependencies
RUN apt-get update && apt-get install -y \
    openjdk-11-jdk \      # Required for PySpark
    curl \
    && rm -rf /var/lib/apt/lists/*

# Set JAVA_HOME
ENV JAVA_HOME=/usr/lib/jvm/java-11-openjdk-amd64

# Working directory
WORKDIR /app

# Install Python dependencies FIRST (layer caching!)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy source code
COPY src/ ./src/
COPY dbt/ ./dbt/

# Environment variables (non-sensitive)
ENV PYTHONPATH=/app
ENV LOG_LEVEL=INFO

# Don't run as root (security!)
RUN useradd -m -u 1000 pipeline
USER pipeline

# Command
CMD ["python", "src/main.py"]
```

### requirements.txt

```txt
pandas==2.0.3
pyspark==3.4.1
great-expectations==0.17.19
google-cloud-bigquery==3.11.4
boto3==1.28.44
apache-airflow==2.7.1
dbt-bigquery==1.6.0
python-dotenv==1.0.0
```

### Build và Run

```bash
# Build image
docker build -t my-pipeline:1.0.0 .
docker build -t my-pipeline:latest .

# Run container
docker run --rm \
    -e DB_HOST=postgres-host \
    -e DB_PASSWORD=$DB_PASSWORD \  # Inject secrets từ environment
    -v $(pwd)/data:/app/data \      # Mount local directory
    my-pipeline:1.0.0 \
    python src/extract.py --date 2024-01-15

# Interactive shell trong container (debugging)
docker run -it --rm my-pipeline:1.0.0 bash

# View logs
docker logs my-pipeline-container -f

# Push lên registry
docker tag my-pipeline:1.0.0 gcr.io/my-project/pipeline:1.0.0
docker push gcr.io/my-project/pipeline:1.0.0
```

---

## 3. Docker Compose cho Local Development

```yaml
# docker-compose.yml - Local development environment
version: '3.8'

services:
  # PostgreSQL source database (simulating production)
  postgres:
    image: postgres:14
    environment:
      POSTGRES_DB: production
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./sql/init.sql:/docker-entrypoint-initdb.d/init.sql

  # Apache Airflow
  airflow-webserver:
    image: apache/airflow:2.7.1
    command: webserver
    ports:
      - "8080:8080"
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@airflow-postgres/airflow
      AIRFLOW__CORE__LOAD_EXAMPLES: false
    volumes:
      - ./dags:/opt/airflow/dags
      - ./logs:/opt/airflow/logs
    depends_on:
      - airflow-postgres

  airflow-scheduler:
    image: apache/airflow:2.7.1
    command: scheduler
    environment:
      AIRFLOW__CORE__EXECUTOR: LocalExecutor
      AIRFLOW__DATABASE__SQL_ALCHEMY_CONN: postgresql+psycopg2://airflow:airflow@airflow-postgres/airflow
    volumes:
      - ./dags:/opt/airflow/dags
    depends_on:
      - airflow-postgres

  airflow-postgres:
    image: postgres:14
    environment:
      POSTGRES_USER: airflow
      POSTGRES_PASSWORD: airflow
      POSTGRES_DB: airflow

  # Kafka for streaming
  zookeeper:
    image: confluentinc/cp-zookeeper:7.4.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181

  kafka:
    image: confluentinc/cp-kafka:7.4.0
    depends_on:
      - zookeeper
    ports:
      - "9092:9092"
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://localhost:9092
      KAFKA_AUTO_CREATE_TOPICS_ENABLE: "true"

  # MinIO (local S3 compatible storage)
  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    ports:
      - "9000:9000"  # S3 API
      - "9001:9001"  # Console UI
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

volumes:
  postgres_data:
```

```bash
# Khởi động toàn bộ local environment
docker-compose up -d

# Xem status
docker-compose ps

# View logs
docker-compose logs airflow-scheduler -f

# Stop và cleanup
docker-compose down -v  # -v xóa cả volumes
```

---

## 4. Kubernetes cho DE

### Tại sao cần Kubernetes?

```
Docker: Chạy containers trên 1 máy
Kubernetes (K8s): Orchestrate containers trên CLUSTER nhiều máy

Kubernetes giải quyết:
- Auto-restart container khi bị crash
- Load balancing
- Auto-scaling (scale up khi có nhiều Spark jobs)
- Rolling deployments (zero downtime)
- Resource management (limit CPU/RAM cho mỗi container)
- Secret management
```

### DE dùng K8s như thế nào?

```yaml
# 1. Airflow trên Kubernetes (KubernetesExecutor)
# Mỗi Airflow task = 1 Kubernetes Pod

# dag task config
extract_task = PythonOperator(
    task_id='extract',
    python_callable=extract_fn,
    executor_config={
        "KubernetesExecutor": {
            "image": "gcr.io/my-project/pipeline:1.0.0",
            "request_memory": "2Gi",
            "request_cpu": "1",
            "limit_memory": "4Gi",
            "limit_cpu": "2",
        }
    }
)
```

```yaml
# 2. Kubernetes Job cho Spark
# spark-job.yaml
apiVersion: v1
kind: Pod
metadata:
  name: spark-orders-etl-20240115
  labels:
    app: spark-etl
spec:
  restartPolicy: Never
  containers:
    - name: spark-driver
      image: gcr.io/my-project/spark-pipeline:1.0.0
      command: 
        - "spark-submit"
        - "--master"
        - "k8s://https://kubernetes:443"
        - "--deploy-mode"
        - "cluster"
        - "--conf"
        - "spark.kubernetes.container.image=gcr.io/my-project/spark-pipeline:1.0.0"
        - "--conf"
        - "spark.executor.instances=10"
        - "--conf"
        - "spark.executor.memory=4g"
        - "--conf"
        - "spark.executor.cores=2"
        - "s3://bucket/scripts/orders_etl.py"
        - "--date=2024-01-15"
      env:
        - name: GOOGLE_APPLICATION_CREDENTIALS
          value: /secrets/service-account.json
      resources:
        requests:
          memory: "2Gi"
          cpu: "1"
        limits:
          memory: "4Gi"
          cpu: "2"
      volumeMounts:
        - name: gcp-credentials
          mountPath: /secrets
  volumes:
    - name: gcp-credentials
      secret:
        secretName: gcp-service-account
```

```bash
# Submit job
kubectl apply -f spark-job.yaml

# Monitor
kubectl get pods -l app=spark-etl
kubectl logs spark-orders-etl-20240115 -f

# Delete after completion
kubectl delete pod spark-orders-etl-20240115
```

### Kubernetes Secrets - Quản lý credentials an toàn

```bash
# Không bao giờ hardcode credentials trong code hoặc image!

# Tạo secret
kubectl create secret generic db-credentials \
    --from-literal=DB_PASSWORD=mysecretpassword \
    --from-literal=DB_USER=admin

# Tạo secret từ file
kubectl create secret generic gcp-service-account \
    --from-file=service-account.json=./credentials.json

# Dùng trong pod
```

```yaml
# pod.yaml
env:
  - name: DB_PASSWORD
    valueFrom:
      secretKeyRef:
        name: db-credentials
        key: DB_PASSWORD
```

---

## 5. CI/CD cho Data Pipelines

```yaml
# .github/workflows/pipeline-ci.yml
name: Pipeline CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.10'
      
      - name: Install dependencies
        run: |
          pip install -r requirements.txt
          pip install pytest pytest-cov
      
      - name: Run unit tests
        run: pytest tests/ -v --cov=src/
      
      - name: Run dbt tests
        run: |
          dbt deps
          dbt test --profiles-dir .
        env:
          DBT_BIGQUERY_PROJECT: ${{ secrets.GCP_PROJECT }}
  
  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3
      
      - name: Authenticate to GCP
        uses: google-github-actions/auth@v1
        with:
          credentials_json: ${{ secrets.GCP_SA_KEY }}
      
      - name: Build and push Docker image
        run: |
          docker build -t gcr.io/${{ secrets.GCP_PROJECT }}/pipeline:${{ github.sha }} .
          docker push gcr.io/${{ secrets.GCP_PROJECT }}/pipeline:${{ github.sha }}
  
  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/airflow-worker \
            worker=gcr.io/${{ secrets.GCP_PROJECT }}/pipeline:${{ github.sha }}
```

---

## 6. Rủi ro khi dùng Docker/K8s sai trong DE

- **Large Docker images**: Base image quá lớn (2GB+) → slow pull, slow CI. Dùng `python:slim`, multi-stage builds.
- **Running as root**: Security risk — dùng user instruction trong Dockerfile
- **Secrets trong Dockerfile**: NEVER `ENV DB_PASSWORD=secret` trong Dockerfile (layer history còn lại!)
- **No resource limits**: 1 Spark job dùng hết tất cả RAM → affect other jobs

---

## 7. Interview Q&A

**Q1: "Tại sao dùng Docker cho data pipeline?"**
> Reproducibility: "It works on my machine" → "it works everywhere". Package code + dependencies + config vào 1 image → chạy giống nhau mọi nơi (local, staging, production). Cũng giúp: Version dependencies chính xác, isolate environments, scale easily.

**Q2: "KubernetesExecutor trong Airflow là gì?"**
> Mỗi Airflow Task được chạy trong 1 riêng biệt Kubernetes Pod. Lợi ích: 1) Isolation (task fail không ảnh hưởng task khác), 2) Resource management (mỗi task có CPU/RAM riêng), 3) Scale (K8s tự provision pods), 4) Custom images (mỗi task có thể dùng Docker image khác). Phức tạp hơn LocalExecutor nhưng production-grade.

**Q3: "Làm thế nào để quản lý secrets trong containerized pipeline?"**
> KHÔNG: Hardcode trong code, environment variables trong Dockerfile image. NÊN: Kubernetes Secrets, AWS Secrets Manager/Parameter Store, HashiCorp Vault, GCP Secret Manager. Inject secrets vào container lúc runtime (không phải build time) qua environment variables hoặc mounted files.

**Q4: "Multi-stage Docker build là gì? Khi nào dùng?"**
> Build image nhiều stages: Stage 1 (builder): Install all build tools, compile code → Image lớn. Stage 2 (runtime): Copy chỉ compiled artifacts từ stage 1, không copy build tools → Image nhỏ. Dùng khi: có compile step (Java/Go), muốn minimize production image size.

---

## Tài liệu tham khảo

- [Docker Documentation](https://docs.docker.com/)
- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [Airflow on Kubernetes](https://airflow.apache.org/docs/apache-airflow/stable/executor/kubernetes.html)
- [Spark on Kubernetes](https://spark.apache.org/docs/latest/running-on-kubernetes.html)
