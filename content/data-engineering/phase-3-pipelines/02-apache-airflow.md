# Apache Airflow: Orchestration cho Data Pipeline

## Giới thiệu

Apache Airflow là công cụ orchestration phổ biến nhất trong Data Engineering. Nếu bạn đến từ BE, hãy nghĩ nó như một **cron job steroids** — chạy scheduled tasks, nhưng có dependency management, retry, monitoring, và một UI đẹp để visualize workflow.

---

## 1. Nguồn gốc: Tại sao Airflow ra đời?

### Vấn đề với Cron Jobs trong Data Pipeline

Là BE, bạn đã quen cron jobs. Nhưng cron có vấn đề nghiêm trọng trong production data pipeline:

```bash
# Cron jobs đơn giản - không có dependency management
0 1 * * * python extract_orders.py    # Chạy 1am
0 2 * * * python extract_users.py     # Chạy 2am
0 3 * * * python create_fact_table.py # Chạy 3am - nhưng nếu 2 jobs trên fail?

# Vấn đề:
# 1. Không biết job nào fail (không có central monitoring)
# 2. create_fact_table.py chạy ngay cả khi extract fail
# 3. Retry phải viết tay
# 4. Không có dependency (job B phải chờ job A xong)
# 5. Không có history/audit trail
```

### Airflow ra đời (2014, Airbnb)

Maxime Beauchemin tại Airbnb tạo ra Airflow để giải quyết chính xác những vấn đề này. Ý tưởng:

> **"Pipelines as Code"** — định nghĩa workflow bằng Python code, không phải config file hay UI drag-and-drop.

Năm 2016, Apache nhận Airflow vào incubator. Ngày nay Airflow là tiêu chuẩn công nghiệp.

---

## 2. Kiến trúc Airflow

```
┌──────────────────────────────────────────────────────────┐
│                     Airflow Components                    │
│                                                           │
│  ┌─────────┐    ┌──────────────┐    ┌─────────────────┐  │
│  │  Web    │    │   Scheduler  │    │    Executor      │  │
│  │  Server │    │  (Heartbeat) │    │  (Worker Pool)   │  │
│  │  (UI)   │    │              │    │                  │  │
│  └────┬────┘    └──────┬───────┘    └────────┬─────────┘  │
│       │                │                     │            │
│       └────────────────┴─────────────────────┘            │
│                             │                             │
│                    ┌────────┴────────┐                    │
│                    │    Metadata DB  │                    │
│                    │  (PostgreSQL)   │                    │
│                    └─────────────────┘                    │
└──────────────────────────────────────────────────────────┘
```

- **Web Server**: UI để monitor, trigger, debug DAGs
- **Scheduler**: Kiểm tra liên tục xem DAG nào cần chạy
- **Executor**: Thực thi tasks (LocalExecutor, CeleryExecutor, KubernetesExecutor)
- **Metadata DB**: Lưu trạng thái của mọi DAG run, task run, logs

---

## 3. Core Concepts

### DAG (Directed Acyclic Graph)

```python
from airflow import DAG
from datetime import datetime, timedelta

# DAG = container chứa các tasks và dependencies
dag = DAG(
    dag_id='my_data_pipeline',           # Unique ID
    description='Daily ETL pipeline',
    schedule_interval='0 2 * * *',       # Cron: 2am mỗi ngày
    start_date=datetime(2024, 1, 1),    # Khi nào bắt đầu schedule
    catchup=False,                        # Không backfill nếu missed runs
    tags=['etl', 'orders'],              # Tags để filter trong UI
    default_args={
        'owner': 'data-team',
        'retries': 3,
        'retry_delay': timedelta(minutes=5),
        'email': ['data-alerts@company.com'],
        'email_on_failure': True,
        'email_on_retry': False,
    }
)
```

### Operators - Đơn vị thực thi

```python
from airflow.operators.python import PythonOperator
from airflow.operators.bash import BashOperator
from airflow.operators.empty import EmptyOperator
from airflow.providers.postgres.operators.postgres import PostgresOperator
from airflow.providers.amazon.aws.operators.glue import GlueJobOperator

with DAG('example', ...) as dag:
    
    # PythonOperator: Chạy Python function
    extract_task = PythonOperator(
        task_id='extract_orders',
        python_callable=my_extract_function,  # function cần gọi
        op_kwargs={'date': '{{ ds }}'}        # Jinja template!
    )
    
    # BashOperator: Chạy bash command
    run_dbt = BashOperator(
        task_id='run_dbt_models',
        bash_command='dbt run --profiles-dir /opt/dbt'
    )
    
    # PostgresOperator: Chạy SQL
    create_table = PostgresOperator(
        task_id='create_staging_table',
        postgres_conn_id='my_postgres',
        sql='CREATE TABLE IF NOT EXISTS staging_orders (...)'
    )
    
    # EmptyOperator: Placeholder (start/end markers)
    start = EmptyOperator(task_id='start')
    end = EmptyOperator(task_id='end')
```

### Task Dependencies

```python
# Cách 1: >> operator (dễ đọc nhất)
start >> extract_task >> run_dbt >> end

# Cách 2: set_downstream / set_upstream
extract_task.set_downstream(run_dbt)

# Cách 3: List (parallel execution)
start >> [extract_orders, extract_users] >> create_fact >> end
# extract_orders và extract_users chạy SONG SONG
# create_fact chỉ chạy khi CẢ HAI xong

# Cách 4: Complex dependencies
start >> extract_orders
start >> extract_users
extract_orders >> validate_orders
extract_users >> validate_users
[validate_orders, validate_users] >> create_fact
create_fact >> [update_dashboard, send_report]
[update_dashboard, send_report] >> end
```

---

## 4. Jinja Templating - "Magic Variables"

Airflow có system template variables cực kỳ hữu ích:

```python
# {{ ds }} = execution_date as YYYY-MM-DD string
# {{ ds_nodash }} = execution_date as YYYYMMDD
# {{ execution_date }} = pendulum datetime object
# {{ prev_ds }} = previous execution date
# {{ next_ds }} = next execution date
# {{ run_id }} = unique run ID
# {{ dag.dag_id }} = DAG ID
# {{ task.task_id }} = Task ID

def extract_orders(ds, **context):
    """
    Hàm này được gọi bởi PythonOperator
    ds = '2024-01-15' (execution date)
    """
    query = f"SELECT * FROM orders WHERE DATE(created_at) = '{ds}'"
    return pd.read_sql(query, engine)

extract_task = PythonOperator(
    task_id='extract',
    python_callable=extract_orders,
    # ds tự động được inject vào kwargs
)
```

### Backfilling - Chạy lại cho ngày cũ

```bash
# Chạy lại pipeline cho tất cả ngày từ Jan 1 đến Jan 31
airflow dags backfill --start-date 2024-01-01 --end-date 2024-01-31 my_pipeline

# Rất quan trọng: Vì Airflow inject {{ ds }}, 
# mỗi run sẽ tự động process đúng ngày của nó!
```

---

## 5. XCom - Truyền data giữa Tasks

```python
# XCom (Cross-Communication) cho phép tasks chia sẻ data nhỏ

def extract_task_fn(ti, **context):  # ti = task instance
    data = fetch_data()
    
    # Push data lên XCom
    ti.xcom_push(key='record_count', value=len(data))
    ti.xcom_push(key='file_path', value='/tmp/orders_2024-01-15.parquet')
    
    return len(data)  # Implicit XCom push với key='return_value'

def validate_task_fn(ti, **context):
    # Pull data từ XCom của task trước
    record_count = ti.xcom_pull(task_ids='extract', key='record_count')
    file_path = ti.xcom_pull(task_ids='extract', key='file_path')
    
    if record_count == 0:
        raise ValueError(f"No data extracted!")
    
    # Đọc file và validate
    df = pd.read_parquet(file_path)
    assert len(df) == record_count

# Lưu ý: XCom chỉ phù hợp cho data nhỏ (metadata, paths)
# Không dùng XCom để truyền DataFrame lớn!
```

---

## 6. Hooks và Connections

### Connections - Quản lý credentials tập trung

```bash
# Tạo connection trong Airflow UI hoặc CLI
airflow connections add 'my_postgres' \
    --conn-type postgres \
    --conn-host localhost \
    --conn-port 5432 \
    --conn-schema mydb \
    --conn-login admin \
    --conn-password secret
```

```python
# Dùng connection trong code
from airflow.hooks.base import BaseHook
from airflow.providers.postgres.hooks.postgres import PostgresHook

# PostgresHook tự động lấy connection từ Airflow secrets
hook = PostgresHook(postgres_conn_id='my_postgres')

# Run query
records = hook.get_records("SELECT * FROM orders LIMIT 10")

# Get pandas DataFrame
df = hook.get_pandas_df("SELECT * FROM orders WHERE date = '2024-01-15'")

# Run bulk insert
hook.insert_rows('staging_orders', rows=data, target_fields=['id', 'amount'])
```

---

## 7. Sensors - Chờ điều kiện

```python
from airflow.sensors.filesystem import FileSensor
from airflow.sensors.sql import SqlSensor
from airflow.sensors.time_sensor import TimeSensor

# FileSensor: Chờ file xuất hiện
wait_for_file = FileSensor(
    task_id='wait_for_data_file',
    filepath='/data/orders_{{ ds }}.csv',
    poke_interval=60,    # Check mỗi 60 giây
    timeout=3600,        # Timeout sau 1 giờ
    mode='poke'          # 'poke' giữ worker, 'reschedule' free worker
)

# SqlSensor: Chờ query trả về data
wait_for_upstream = SqlSensor(
    task_id='wait_for_upstream_data',
    conn_id='my_postgres',
    sql="SELECT COUNT(*) FROM source_orders WHERE date = '{{ ds }}' HAVING COUNT(*) > 0",
    poke_interval=300,  # Check mỗi 5 phút
    timeout=7200        # Timeout sau 2 giờ
)

# TimeSensor: Chờ đến giờ nhất định
wait_until_morning = TimeSensor(
    task_id='wait_until_9am',
    target_time=time(9, 0)  # Chờ đến 9 giờ sáng
)

# Dependencies với sensors
[wait_for_file, wait_for_upstream] >> extract_task
```

---

## 8. Task Branching - Điều kiện rẽ nhánh

```python
from airflow.operators.python import BranchPythonOperator

def choose_branch(**context):
    """Quyết định chạy task nào tiếp theo"""
    day_of_week = context['execution_date'].day_of_week
    
    if day_of_week == 0:  # Monday
        return 'weekly_aggregation'  # task_id
    else:
        return 'daily_aggregation'

branch_task = BranchPythonOperator(
    task_id='check_schedule',
    python_callable=choose_branch,
)

daily_agg = PythonOperator(task_id='daily_aggregation', ...)
weekly_agg = PythonOperator(task_id='weekly_aggregation', ...)

# trigger_rule='none_failed' = chạy kể cả khi branch không chọn nó
end = EmptyOperator(task_id='end', trigger_rule='none_failed')

branch_task >> [daily_agg, weekly_agg] >> end
```

---

## 9. Best Practices cho Production Airflow

### Atomic Tasks

```python
# BAD: Task làm quá nhiều việc
def big_task():
    data = extract()
    transformed = transform(data)
    load(transformed)
    send_email("Done!")

# GOOD: Mỗi task làm 1 việc → dễ retry, dễ debug
extract_task = PythonOperator(task_id='extract', python_callable=extract)
transform_task = PythonOperator(task_id='transform', python_callable=transform)
load_task = PythonOperator(task_id='load', python_callable=load)
notify_task = PythonOperator(task_id='notify', python_callable=send_email)

extract_task >> transform_task >> load_task >> notify_task
```

### Idempotent Tasks

```python
# BAD: INSERT mà không check duplicate
def load_bad():
    db.execute("INSERT INTO fact_orders SELECT * FROM staging_orders")
    # Nếu task fail và retry → duplicate data!

# GOOD: Idempotent load
def load_good(execution_date):
    date_str = execution_date.strftime('%Y-%m-%d')
    
    with db.begin():
        # Delete trước
        db.execute(f"DELETE FROM fact_orders WHERE order_date = '{date_str}'")
        # Rồi insert
        db.execute(f"""
            INSERT INTO fact_orders 
            SELECT * FROM staging_orders WHERE order_date = '{date_str}'
        """)
```

### Variables và Connections for Config

```python
from airflow.models import Variable

# Lưu config trong Airflow Variables (không hardcode)
batch_size = Variable.get('BATCH_SIZE', default_var=10000)
target_env = Variable.get('TARGET_ENV', default_var='production')

# Hoặc JSON config
config = Variable.get('pipeline_config', deserialize_json=True)
# config = {"batch_size": 10000, "timeout": 3600}
```

---

## 10. Rủi ro khi dùng Airflow sai

- **Giant DAGs**: 1 DAG với 100+ tasks → rất khó maintain, slow UI
- **Database trong DAG definition**: Code ở top-level bị execute khi Scheduler parse DAG → performance issue
- **Dùng XCom cho data lớn**: XCom lưu trong metadata DB → chậm và bloat DB
- **Không catchup=False**: Nếu DAG disabled 30 ngày, khi enable lại sẽ backfill 30 ngày → cluster quá tải
- **Tight coupling tasks**: Task A viết file, Task B đọc file → cần biết path. Tốt hơn: dùng XCom hoặc database intermediate.

---

## 11. Interview Q&A

**Q1: "DAG trong Airflow là gì?"**
> Directed Acyclic Graph — định nghĩa workflow của pipeline: các tasks và thứ tự/dependency giữa chúng. Directed = có hướng (A chạy trước B). Acyclic = không có vòng lặp (A → B → A là không hợp lệ). Airflow schedule và execute tasks theo topological order của DAG.

**Q2: "Airflow Scheduler hoạt động như thế nào?"**
> Scheduler liên tục (heartbeat mỗi ~5 giây): 1) Parse tất cả DAG files, 2) Kiểm tra xem DAG nào đến thời điểm chạy, 3) Tạo DagRun và TaskInstance trong metadata DB, 4) Executor pick up tasks và chạy. Metadata DB là "brain" của Airflow.

**Q3: "Sự khác biệt giữa execution_date và actual run time?"**
> execution_date = thời điểm data interval bắt đầu (logical time). Actual run time = khi task thực sự chạy. Ví dụ: DAG schedule daily lúc 2am, execution_date = 2024-01-15 nhưng thực sự chạy lúc 2024-01-16 02:00:00 (ngày hôm sau). Điều này rất quan trọng khi query data "của ngày {{ ds }}".

**Q4: "Tại sao cần Idempotent tasks trong Airflow?"**
> Tasks SẼ fail và cần retry. Nếu task không idempotent: retry → duplicate data. Ví dụ: INSERT 1000 rows, fail ở row 500, retry → insert lại 1000 rows → 500 rows bị duplicate. Solution: DELETE-then-INSERT theo partition, hoặc UPSERT.

**Q5: "CeleryExecutor vs KubernetesExecutor?"**
> CeleryExecutor: Dùng Celery queue + worker pool cố định. Workers luôn running (tốn resource ngay cả khi idle). Phù hợp: workload ổn định. KubernetesExecutor: Mỗi task = 1 Kubernetes pod, tạo khi cần, xóa khi xong. Phù hợp: workload variable, cần isolation, cloud-native.

**Q6: "Làm thế nào để test DAG trước khi deploy production?"**
> 1) Unit test: Mock operators, test Python callables independently. 2) `airflow dags test <dag_id> <execution_date>` — chạy DAG locally không ảnh hưởng scheduler. 3) Staging environment với test connections. 4) `airflow tasks test <dag_id> <task_id> <date>` — test 1 task cụ thể.

---

## Tài liệu tham khảo

- [Apache Airflow Documentation](https://airflow.apache.org/docs/apache-airflow/stable/)
- [Airflow Best Practices](https://airflow.apache.org/docs/apache-airflow/stable/best-practices.html)
- [Astronomer's Learn Airflow](https://docs.astronomer.io/learn/)
