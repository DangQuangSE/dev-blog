# [03] Phase 1 - Foundations: Linux, Shell Scripting & Git nâng cao

## Giới thiệu

Nhiều DE jobs không đòi hỏi bạn là Linux expert, nhưng biết những lệnh cơ bản và shell scripting sẽ giúp bạn làm việc hiệu quả hơn rất nhiều trong môi trường data — đặc biệt khi debug pipeline trên server, xử lý files, và automation.

---

## 1. Linux Commands thiết yếu cho DE

### File và Directory Operations

```bash
# Navigation
pwd                              # Print working directory
ls -la                           # List all files with details
ls -lh                           # Human readable sizes (MB, GB)
cd /path/to/dir                  # Change directory
cd ..                            # Go up one level
cd ~                             # Go to home directory

# File operations
cp source.parquet dest.parquet   # Copy
mv old_name.csv new_name.csv     # Move/rename
rm file.txt                      # Delete file
rm -rf old_directory/            # Delete directory (cẩn thận!)
mkdir -p data/raw/2024/01        # Create nested directories

# View file content
cat small_file.txt               # Print entire file (nhỏ)
head -n 50 large_file.csv        # Xem 50 dòng đầu
tail -n 100 pipeline.log         # Xem 100 dòng cuối
tail -f airflow.log              # Follow log (realtime, Ctrl+C để thoát)
less big_file.csv                # Pager (q để thoát)

# File info
wc -l data.csv                   # Đếm số dòng
du -sh /data/raw/                # Disk usage của folder (human readable)
df -h                            # Disk space của toàn hệ thống
```

### Text Processing - Cực hữu ích cho DE

```bash
# grep: Tìm kiếm trong file
grep "ERROR" pipeline.log                # Tìm dòng có "ERROR"
grep -i "error" pipeline.log             # Case insensitive
grep -n "FAILED" pipeline.log            # Hiện số dòng
grep -c "SUCCESS" pipeline.log           # Đếm số dòng match
grep -v "DEBUG" pipeline.log             # Exclude DEBUG lines

# awk: Xử lý cột
awk -F',' '{print $1, $3}' data.csv      # In cột 1 và 3 của CSV
awk -F',' 'NR>1 {sum += $5} END {print sum}' data.csv  # Sum cột 5 (skip header)
awk -F',' '{if ($3 > 100) print}' data.csv  # Filter rows

# sed: Stream editor
sed 's/old_value/new_value/g' file.txt   # Replace
sed -i 's/old/new/g' file.txt           # In-place replace
sed '1d' file.csv                        # Xóa dòng đầu (header)
sed -n '100,200p' large_file.txt         # Print dòng 100-200

# sort và uniq
sort -k2 -t',' data.csv                  # Sort theo cột 2, delimiter là ','
sort -rn -k5 -t',' data.csv             # Sort ngược, numeric, cột 5
sort data.txt | uniq                     # Remove duplicate lines
sort data.txt | uniq -c | sort -rn      # Count occurrences (word frequency!)

# cut: Lấy cột
cut -d',' -f1,3,5 data.csv              # Lấy cột 1, 3, 5 từ CSV

# xargs: Pass output làm argument
find /data -name "*.csv" | xargs wc -l  # Count lines của tất cả CSV files
```

### Process Management

```bash
# Xem processes
ps aux                           # Tất cả processes
ps aux | grep "spark"            # Tìm Spark processes
top                              # Interactive process monitor (q để thoát)
htop                             # Better top (nếu được cài)

# Background jobs
python long_pipeline.py &        # Chạy background
nohup python pipeline.py &       # Chạy background, không bị kill khi logout
jobs                             # List background jobs
fg 1                             # Bring job 1 to foreground

# Kill processes
kill 12345                       # Kill process ID 12345
kill -9 12345                    # Force kill
pkill -f "my_pipeline"           # Kill by process name

# Check resource usage
free -h                          # Memory usage
nvidia-smi                       # GPU usage (nếu có)
```

### Pipes và Redirection

```bash
# Pipe: Output của lệnh này là input của lệnh tiếp theo
cat data.csv | grep "completed" | wc -l     # Đếm completed orders
ps aux | sort -k3 -rn | head -10            # Top 10 CPU-consuming processes

# Redirection
echo "start time: $(date)" > pipeline.log   # Write (overwrite)
echo "new line" >> pipeline.log             # Append
python extract.py > output.log 2>&1         # Redirect stdout + stderr
python extract.py 2>/dev/null               # Suppress errors

# Process substitution
diff <(cat file1.csv | sort) <(cat file2.csv | sort)  # Compare 2 sorted files
```

---

## 2. Shell Scripting cho Data Pipelines

### Bash Script cơ bản

```bash
#!/bin/bash
# pipeline.sh - Simple data pipeline script

set -e          # Exit immediately nếu có error
set -u          # Error nếu dùng undefined variable
set -o pipefail # Pipe fail nếu any command trong pipe fail

# Variables
DATE="${1:-$(date -d 'yesterday' +%Y-%m-%d)}"  # Accept arg, default = yesterday
LOG_FILE="/logs/pipeline_${DATE}.log"
DATA_DIR="/data/raw/${DATE}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "${LOG_FILE}"
}

# Error handling
handle_error() {
    log "ERROR: Pipeline failed at line $1"
    # Send alert
    curl -X POST https://hooks.slack.com/... \
        -d "{\"text\": \"Pipeline FAILED for date ${DATE}\"}"
    exit 1
}
trap 'handle_error $LINENO' ERR

# Main pipeline
log "Starting pipeline for date: ${DATE}"

# Step 1: Create directory
mkdir -p "${DATA_DIR}"
log "Created directory: ${DATA_DIR}"

# Step 2: Download data
log "Downloading data..."
python download_data.py --date "${DATE}" --output "${DATA_DIR}"
log "Download complete"

# Step 3: Validate
log "Validating data..."
RECORD_COUNT=$(wc -l < "${DATA_DIR}/orders.csv")
if [ "${RECORD_COUNT}" -lt 100 ]; then
    log "ERROR: Too few records: ${RECORD_COUNT}"
    exit 1
fi
log "Validation passed: ${RECORD_COUNT} records"

# Step 4: Transform
log "Running transformation..."
python transform.py --input "${DATA_DIR}" --date "${DATE}"

# Step 5: Load
log "Loading to DWH..."
python load_to_bigquery.py --date "${DATE}"

log "Pipeline completed successfully!"
```

### Cron Jobs cho Scheduling

```bash
# Crontab format: minute hour day month day_of_week command
# Mở crontab editor
crontab -e

# Các ví dụ schedule:
# ┌───────────── minute (0-59)
# │ ┌───────────── hour (0-23)
# │ │ ┌───────────── day of month (1-31)
# │ │ │ ┌───────────── month (1-12)
# │ │ │ │ ┌───────────── day of week (0-7, 0=Sunday)
# │ │ │ │ │
# 0 2 * * * /scripts/daily_pipeline.sh >> /logs/cron.log 2>&1    # 2am mỗi ngày
# 0 * * * * /scripts/hourly_ingest.sh >> /logs/hourly.log 2>&1   # Mỗi giờ
# */15 * * * * /scripts/health_check.sh                            # Mỗi 15 phút
# 0 8 * * 1 /scripts/weekly_report.sh                             # 8am thứ Hai
# 0 0 1 * * /scripts/monthly_rollup.sh                            # Đầu tháng

# View crontab
crontab -l
```

### SSH và Remote Execution

```bash
# Connect đến server
ssh user@data-server.company.com

# Copy files
scp local_file.parquet user@server:/data/raw/         # Upload
scp user@server:/data/output/result.csv ./            # Download
rsync -avz /local/data/ user@server:/remote/data/    # Sync (fast, incremental)

# Run command trên remote server
ssh user@server "python /scripts/pipeline.py --date 2024-01-15"

# Forward port (debugging)
ssh -L 8080:localhost:8080 user@server                # Forward Airflow UI
```

---

## 3. Git Advanced cho DE

### Git Workflow trong Data Engineering

```bash
# === BASIC WORKFLOW ===
git init                         # Init repository
git clone https://github.com/... # Clone repo

git status                       # Xem changed files
git diff                         # Xem changes (unstaged)
git diff --staged                # Xem changes (staged)

git add .                        # Stage all changes
git add specific_file.py         # Stage specific file

git commit -m "feat: add daily orders pipeline"   # Commit
git push origin main             # Push to remote

# === BRANCHING ===
git branch feature/kafka-ingestion    # Create branch
git checkout feature/kafka-ingestion  # Switch branch
git checkout -b feature/new-pipeline  # Create + switch

git merge feature/kafka-ingestion     # Merge into current branch
git branch -d feature/kafka-ingestion # Delete local branch

# === HISTORY ===
git log --oneline -20            # Last 20 commits (compact)
git log --graph --oneline --all  # Visual branch graph
git show abc1234                 # Show specific commit
git blame pipeline.py            # Who changed each line?
```

### Git cho Data và Notebooks

```bash
# .gitignore cho DE project
cat > .gitignore << 'EOF'
# Python
__pycache__/
*.pyc
.env
*.egg-info/

# Data files (KHÔNG commit data!)
*.csv
*.parquet
*.json
data/
raw/
processed/

# Credentials (KHÔNG commit credentials!)
credentials.json
service-account.json
*.pem
*.key

# IDE
.vscode/
.idea/
*.swp

# Logs
*.log
logs/

# Virtual env
venv/
.env/
EOF

# Kiểm tra nếu accidentally committed credentials
git log --all --full-history -- credentials.json  # Tìm trong history
git secret  # Tool để encrypt secrets trong repo
```

### Pre-commit Hooks - Tự động kiểm tra trước khi commit

```bash
# Cài pre-commit
pip install pre-commit

# .pre-commit-config.yaml
cat > .pre-commit-config.yaml << 'EOF'
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace      # Remove trailing whitespace
      - id: end-of-file-fixer        # Ensure files end with newline
      - id: check-yaml               # Validate YAML syntax
      - id: check-json               # Validate JSON syntax
      - id: detect-private-key       # Detect accidentally committed private keys
      - id: no-commit-to-branch      # Prevent direct commit to main
        args: ['--branch', 'main']
  
  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black                    # Format Python code
  
  - repo: https://github.com/PyCQA/flake8
    rev: 6.0.0
    hooks:
      - id: flake8                   # Lint Python code
  
  - repo: https://github.com/sqlfluff/sqlfluff
    rev: 2.1.0
    hooks:
      - id: sqlfluff-lint            # Lint SQL files
        args: ['--dialect', 'bigquery']
EOF

pre-commit install        # Install hooks
pre-commit run --all-files  # Run on all files
```

### Semantic Versioning và Tags

```bash
# Tagging releases
git tag -a v1.0.0 -m "Initial release: orders pipeline"
git push origin v1.0.0

# Changelog
git log v0.9.0..v1.0.0 --oneline  # Changes between versions
```

---

## 4. Environment Management

```bash
# Python virtual environment
python -m venv venv
source venv/bin/activate          # Linux/Mac
venv\Scripts\activate             # Windows

pip install -r requirements.txt

# Freeze current packages
pip freeze > requirements.txt

# Conda (phổ biến hơn trong data science)
conda create -n de_env python=3.10
conda activate de_env
conda install pandas pyspark apache-airflow

# Docker (nếu biết Docker)
docker run -it python:3.10 bash   # Isolated environment
```

---

## 5. Interview Q&A

**Q1: "Làm thế nào để monitor pipeline đang chạy?"**
> `tail -f /logs/pipeline.log` để xem log realtime. `ps aux | grep python` để xem processes. `htop` cho system resources. Trong production, thường dùng centralized logging (ELK stack, CloudWatch) và monitoring (Prometheus + Grafana, Datadog).

**Q2: "Shell scripting vs Python cho automation — khi nào dùng gì?"**
> Shell scripting: Simple file operations, invoke multiple commands, glue existing tools, cronjob scheduling. Python: Complex logic, error handling, data transformation, API calls, khi cần readability và testing. Rule of thumb: Nếu script > 50 lines hoặc có complex logic → dùng Python.

**Q3: "Làm thế nào để chạy Python script mà không bị kill khi logout SSH?"**
> Dùng `nohup python script.py &` (output vào nohup.out). Tốt hơn: Dùng `tmux` hoặc `screen` (terminal multiplexer). Tốt nhất: Dùng orchestration tool (Airflow, Kubernetes Job) để manage long-running jobs properly với restart policy, logging, và monitoring.

---

## Tài liệu tham khảo

- [The Missing Semester of Your CS Education (MIT)](https://missing.csail.mit.edu/)
- [Shell Scripting Tutorial](https://www.shellscript.sh/)
- [Pro Git Book (Free)](https://git-scm.com/book/en/v2)
