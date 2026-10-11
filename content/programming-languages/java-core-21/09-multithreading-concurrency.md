# JAVA CORE 21 — PHẦN 9: MULTITHREADING & CONCURRENCY

Giáo trình chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Multithreading và Concurrency là một trong những chủ đề khó nhất của Java Core, nhưng cũng rất quan trọng khi xây dựng ứng dụng Backend.

Khi nhiều HTTP requests truy cập cùng một service, khi hệ thống xử lý hàng nghìn tác vụ I/O hoặc khi nhiều threads cùng cập nhật một đối tượng, bạn cần hiểu:

- thread nào đang thực thi;
- dữ liệu nào đang được chia sẻ;
- operation nào phải atomic;
- khi nào một thread nhìn thấy thay đổi của thread khác;
- cách dừng task đúng cách;
- cách giới hạn số lượng worker;
- cách tránh race condition, deadlock và thread leak.

Phần này tập trung vào platform threads và các cơ chế concurrency truyền thống. Virtual Threads là tính năng chính thức trong Java 21, nhưng sẽ được học sâu ở Phần 11 sau khi nền tảng thread, synchronization và executor đã vững.

## Nội dung Phần 9

| Chương | Chủ đề | Kiến thức trọng tâm |
| ------ | ------ | ------------------- |
| 27 | Thread Fundamentals | Process vs Thread, Thread Lifecycle, Runnable, Callable, start, run, join, interruption |
| 28 | Synchronization | Race Condition, synchronized, volatile, happens-before, Atomic, Locks, Deadlock |
| 29 | Java Concurrency API | ExecutorService, Thread Pools, Future, CompletableFuture, Concurrent Collections, Coordination |

# CHƯƠNG 27. THREAD FUNDAMENTALS

## 27.1. Process là gì?

Process là một instance của chương trình đang thực thi dưới sự quản lý của hệ điều hành.

Ví dụ, khi chạy:

~~~text
java Main
~~~

hệ điều hành có thể tạo một process để chạy JVM và chương trình Java.

Một process thường có:

- không gian địa chỉ bộ nhớ riêng;
- các tài nguyên hệ điều hành được cấp phát;
- một hoặc nhiều threads;
- file handles;
- network sockets;
- thông tin scheduling và trạng thái process.

Hai process thường không trực tiếp chia sẻ heap. Nếu cần giao tiếp, chúng có thể dùng pipe, socket, file, shared memory hoặc một cơ chế IPC khác.

Trong môi trường JVM, một Java process có thể có application threads và các threads phục vụ runtime như garbage collection, compiler hoặc service nội bộ.

## 27.2. Thread là gì?

Thread là một luồng thực thi trong process.

Các threads cùng process có thể chia sẻ:

- heap objects;
- static fields;
- các cấu trúc dữ liệu dùng chung;
- file handles hoặc network resources nếu application chia sẻ chúng.

Mỗi thread có execution context riêng, chẳng hạn:

- call stack riêng;
- program counter riêng;
- trạng thái thread riêng;
- interruption status riêng.

Có thể hình dung:

~~~text
JVM Process
├── Thread A ── call stack riêng
├── Thread B ── call stack riêng
├── Thread C ── call stack riêng
└── Shared Heap
    ├── objects
    ├── static fields
    └── shared collections
~~~

### Platform thread

Trong Java 21, platform thread thường được map tương ứng với một native OS thread. Nó thường có stack và tài nguyên được hệ điều hành quản lý, vì vậy số lượng platform threads hữu hạn và tương đối đắt hơn so với virtual threads.

Platform threads phù hợp với:

- công việc CPU-bound;
- tác vụ cần kiểm soát thread cụ thể;
- các thư viện native hoặc framework truyền thống;
- executor pool có số worker giới hạn.

Virtual threads cũng thuộc class Thread nhưng có mô hình thực thi khác. Phần này chỉ nhắc đến để phân biệt; chi tiết sẽ nằm ở Phần 11.

### Process vs Thread

| Tiêu chí | Process | Thread |
| -------- | ------- | ------ |
| Bản chất | Đơn vị chạy chương trình và quản lý tài nguyên | Luồng thực thi trong process |
| Address space | Thường tách biệt giữa các process | Các thread cùng process chia sẻ address space |
| Tạo mới | Thường có chi phí lớn hơn | Platform thread nhẹ hơn process nhưng vẫn có giới hạn |
| Chia sẻ dữ liệu | Cần IPC hoặc cơ chế phù hợp | Có thể cùng truy cập heap objects |
| Isolation | Có isolation tương đối | Shared state làm tăng rủi ro ảnh hưởng lẫn nhau |
| Failure | Một process có boundary riêng | Uncaught exception có thể kết thúc thread nhưng không luôn kết thúc JVM |

## 27.3. Concurrency và Parallelism

Hai khái niệm này thường bị nhầm lẫn.

Concurrency là khả năng quản lý nhiều tác vụ có thời gian thực thi chồng lấn nhau. Các tác vụ có thể được scheduler xen kẽ trên một CPU duy nhất.

Parallelism là việc nhiều tác vụ thực sự được thực thi cùng lúc trên nhiều CPU cores hoặc hardware execution units.

~~~text
Concurrency:
Task A ── chạy ── chờ ── chạy ──>
Task B ─────── chạy ───── chờ ──>

Parallelism:
Core 1: Task A ───────────────>
Core 2: Task B ───────────────>
~~~

### Ví dụ Backend

Một web server xử lý nhiều HTTP requests là bài toán concurrency. Nếu mỗi request dùng CPU trên một core khác nhau cùng thời điểm, execution đó có thể có parallelism.

Một request thực hiện:

1. đọc request;
2. chờ database;
3. gọi dịch vụ thanh toán;
4. ghi response.

thường là I/O-bound. Trong thời gian request chờ I/O, tài nguyên thực thi có thể phục vụ task khác.

Một thuật toán mã hóa hoặc xử lý ảnh có thể là CPU-bound. Tăng thread vượt quá khả năng CPU có thể làm tăng context switching thay vì tăng throughput.

## 27.4. Multitasking và Multithreading

Multitasking là khả năng hệ thống quản lý nhiều task hoặc process.

Multithreading là việc một process có nhiều threads thực thi các phần công việc khác nhau.

Lợi ích:

- tận dụng thời gian chờ I/O;
- duy trì responsiveness;
- xử lý nhiều request đồng thời;
- chia nhỏ công việc độc lập;
- tận dụng nhiều core cho một số workload.

Chi phí và rủi ro:

- context switching;
- tranh chấp lock;
- race condition;
- khó tái hiện lỗi;
- memory visibility;
- task bị treo làm giữ worker;
- thread leak;
- deadlock;
- khó shutdown đúng cách.

Concurrency không tự động làm chương trình nhanh hơn. Mục tiêu là chọn đúng mức độ đồng thời và kiểm soát shared state.

## 27.5. Tạo platform thread

### Cách dùng Runnable

Runnable biểu diễn một tác vụ không trả về kết quả:

~~~java
Runnable task = () -> {
    System.out.println(
            Thread.currentThread().getName()
            + " is running");
};

Thread worker = new Thread(task, "email-worker");
worker.start();
~~~

start() yêu cầu JVM scheduler bắt đầu một thread mới. Code trong task sẽ chạy đồng thời với thread đã gọi start().

### Dùng Thread Builder cho platform thread

Java 21 có Thread Builder API:

~~~java
Runnable task = () ->
        System.out.println("processing");

Thread worker = Thread.ofPlatform()
        .name("worker-1")
        .unstarted(task);

worker.start();
~~~

Builder giúp cấu hình tên, daemon status hoặc tạo ThreadFactory. Trong ứng dụng có nhiều task, thường nên giao việc cho ExecutorService thay vì tự tạo một Thread cho từng request.

### Kế thừa Thread

Có thể override run():

~~~java
class ReportThread extends Thread {

    ReportThread(String name) {
        super(name);
    }

    @Override
    public void run() {
        System.out.println("Generating report");
    }
}

Thread thread = new ReportThread("report-worker");
thread.start();
~~~

Cách này hợp lệ nhưng thường kém linh hoạt hơn việc tách task thành Runnable/Callable. Khi kế thừa Thread, class vừa đại diện cho worker vừa chứa logic task, làm việc tái sử dụng khó hơn.

### Không tạo thread tùy ý trong request

Ví dụ không nên dùng cho server có tải lớn:

~~~java
void handleRequest() {
    new Thread(() -> processRequest()).start();
}
~~~

Nếu có hàng nghìn request, code này có thể tạo quá nhiều platform threads. Nên dùng executor có giới hạn, queue và chính sách từ chối phù hợp.

## 27.6. start() và run() khác nhau

Đây là câu hỏi phỏng vấn quan trọng.

~~~java
Thread thread = new Thread(
        () -> System.out.println("worker"));

thread.run();
~~~

run() chỉ là một method invocation thông thường. Nó chạy task trên thread hiện tại.

~~~java
thread.start();
~~~

start() yêu cầu thread mới được scheduler thực thi. Task chạy trên thread khác.

### Ví dụ quan sát tên thread

~~~java
Thread thread = new Thread(
        () -> System.out.println(
                "inside: "
                + Thread.currentThread().getName()),
        "worker");

System.out.println(
        "before: "
        + Thread.currentThread().getName());

thread.run();

System.out.println(
        "after run: "
        + Thread.currentThread().getName());

thread = new Thread(
        () -> System.out.println(
                "inside: "
                + Thread.currentThread().getName()),
        "worker-2");

thread.start();
thread.join();
~~~

Với run(), output inside thường là thread main. Với start(), output inside là worker-2.

Một Thread object chỉ được start một lần. Gọi start() lần thứ hai sẽ ném IllegalThreadStateException.

## 27.7. Thread lifecycle và Thread.State

Java cung cấp các trạng thái quan sát qua Thread.State:

| State | Ý nghĩa |
| ----- | ------- |
| NEW | Thread object đã tạo nhưng chưa start |
| RUNNABLE | Thread đang sẵn sàng chạy hoặc đang chạy; Java gộp hai khái niệm này |
| BLOCKED | Đang chờ lấy intrinsic monitor lock |
| WAITING | Đang chờ vô thời hạn một thread hoặc action khác |
| TIMED_WAITING | Đang chờ có giới hạn thời gian |
| TERMINATED | run() đã hoàn thành hoặc kết thúc do exception |

### BLOCKED, WAITING và TIMED_WAITING

- BLOCKED: chờ vào synchronized block hoặc synchronized method.
- WAITING: ví dụ gọi Object.wait(), Thread.join() không timeout hoặc Condition.await().
- TIMED_WAITING: ví dụ Thread.sleep(), join(timeout), wait(timeout) hoặc timed lock.

State phụ thuộc thời điểm quan sát và scheduler. Không nên viết logic nghiệp vụ dựa trên việc state phải giữ nguyên trong một khoảng thời gian.

## 27.8. Runnable và Callable

### Runnable

Runnable có method run(), không trả kết quả và không khai báo checked exception trong method signature.

~~~java
Runnable task = () -> {
    // xử lý task
};
~~~

### Callable

Callable<T> biểu diễn task trả về giá trị và có thể ném Exception:

~~~java
Callable<Integer> task = () -> 10 + 20;
~~~

Callable thường được submit vào ExecutorService và trả về Future<T>. Future sẽ được học sâu ở Chương 29.

| Tiêu chí | Runnable | Callable<T> |
| -------- | -------- | ----------- |
| Return value | Không | Có kiểu T |
| Method | run() | call() |
| Checked exception | Không khai báo trực tiếp | Có thể ném Exception |
| Kết quả async | Thường không có | Future<T> |
| Use case | Task không cần kết quả | Task cần kết quả hoặc trạng thái lỗi |

Fire-and-forget không có nghĩa là không cần theo dõi lỗi. Task background vẫn cần logging, retry, metric và shutdown policy.

## 27.9. Thread name và current thread

Đặt tên thread giúp đọc log và thread dump:

~~~java
Thread worker = new Thread(
        () -> {
            String name =
                    Thread.currentThread().getName();
            System.out.println(name);
        },
        "payment-worker");
~~~

Các method thường dùng:

~~~java
Thread current = Thread.currentThread();

String name = current.getName();
Thread.State state = current.getState();
boolean alive = current.isAlive();
boolean daemon = current.isDaemon();
boolean virtual = current.isVirtual();
~~~

Tên thread nên thể hiện subsystem hoặc role, ví dụ payment-worker-1 hoặc report-executor-3. Không nên đưa dữ liệu nhạy cảm hoặc user input vào thread name.

## 27.10. Thread.sleep()

sleep() tạm dừng thread hiện tại trong một khoảng thời gian.

~~~java
try {
    Thread.sleep(Duration.ofMillis(200));
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    return;
}
~~~

sleep():

- chỉ ảnh hưởng thread hiện tại;
- không nhường monitor lock mà thread đang giữ;
- không bảo đảm chính xác tuyệt đối thời gian thức dậy;
- có thể ném InterruptedException;
- không phải cơ chế synchronization.

Không dùng sleep để sửa race condition hoặc chờ thread khác “chắc chắn” hoàn thành. Nếu cần chờ điều kiện, dùng join, Future, CountDownLatch, BlockingQueue, Condition hoặc cơ chế phù hợp.

## 27.11. Thread.join()

join() yêu cầu thread hiện tại chờ thread đích kết thúc.

~~~java
Thread worker = new Thread(
        () -> generateReport(),
        "report-worker");

worker.start();
worker.join();

System.out.println("Report finished");
~~~

join() có dạng timeout:

~~~java
worker.join(1_000);

if (worker.isAlive()) {
    System.out.println("Worker did not finish in time");
}
~~~

Timeout không có nghĩa worker đã kết thúc. join tạo quan hệ visibility: actions của thread trước khi kết thúc có thể được nhìn thấy bởi thread gọi join sau khi join hoàn thành theo Java Memory Model.

Không nên join vô hạn trong request thread nếu worker có thể bị kẹt do I/O hoặc deadlock. Hãy cân nhắc timeout và cancellation.

## 27.12. Interruption và cancellation

Interruption là cơ chế yêu cầu một thread dừng hoặc thay đổi hành vi một cách hợp tác. Nó không phải lệnh cưỡng chế giết thread.

~~~java
worker.interrupt();
~~~

Lệnh này đặt interruption status của thread đích. Nếu thread đang ở một số blocking method như sleep, wait hoặc join, method có thể ném InterruptedException.

### Xử lý InterruptedException

~~~java
try {
    queue.take();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
    return;
}
~~~

Nếu method có thể truyền exception ra ngoài:

~~~java
void process() throws InterruptedException {
    Thread.sleep(100);
}
~~~

Khi một method ném InterruptedException và không truyền tiếp, thường nên khôi phục status bằng Thread.currentThread().interrupt() để tầng phía trên biết yêu cầu cancellation.

### isInterrupted() và interrupted()

~~~java
boolean observed =
        Thread.currentThread().isInterrupted();
~~~

isInterrupted() đọc status của thread cụ thể và không clear status.

~~~java
boolean observed =
        Thread.interrupted();
~~~

Thread.interrupted() là static method đọc status của current thread và clear status nếu đang set.

### Vòng lặp có thể bị cancel

~~~java
void runWorker() {
    try {
        while (!Thread.currentThread().isInterrupted()) {
            processOneItem();
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    } finally {
        cleanup();
    }
}
~~~

Nếu code chạy CPU loop mà không kiểm tra interruption, task có thể không dừng. Nếu thư viện bên dưới không phản hồi interrupt, cần timeout hoặc cancellation mechanism riêng.

## 27.13. Daemon Threads

Daemon thread là thread nền không giữ JVM sống khi tất cả started non-daemon threads đã kết thúc.

~~~java
Thread cleaner = new Thread(
        () -> cleanupLoop(),
        "temporary-file-cleaner");

cleaner.setDaemon(true);
cleaner.start();
~~~

Phải gọi setDaemon(true) trước start().

Daemon thread phù hợp với công việc best-effort và maintenance không cần bảo đảm hoàn tất. Không dùng daemon thread cho ghi dữ liệu tài chính, audit bắt buộc, commit transaction hoặc payment event.

## 27.14. Thread Priority

Java định nghĩa MIN_PRIORITY, NORM_PRIORITY và MAX_PRIORITY.

~~~java
Thread worker = new Thread(task);
worker.setPriority(Thread.NORM_PRIORITY);
~~~

Priority chỉ là hint cho scheduler, không bảo đảm thứ tự thực thi, fairness hoặc tránh starvation. Không dùng priority làm cơ chế business ordering.

## 27.15. Uncaught exception

Nếu run() kết thúc do unchecked exception không được catch, thread có thể kết thúc và JVM gọi UncaughtExceptionHandler.

~~~java
Thread worker = new Thread(
        () -> {
            throw new IllegalStateException("worker failed");
        },
        "worker");

worker.setUncaughtExceptionHandler(
        (thread, exception) -> {
            System.err.println(
                    thread.getName()
                    + ": "
                    + exception.getMessage());
        });

worker.start();
~~~

Handler hữu ích cho log, metric và alert, nhưng không thay thế việc xử lý exception trong task. Với task chạy trong executor, exception của submit() thường được giữ trong Future.

## 27.16. Context switching

Context switching là việc CPU hoặc runtime chuyển từ thread này sang thread khác và lưu/khôi phục execution context.

Nếu tạo quá nhiều platform threads:

~~~text
Tasks nhiều hơn khả năng CPU
        ↓
Nhiều thread tranh CPU
        ↓
Context switching tăng
        ↓
Throughput giảm, latency tăng
~~~

Đối với CPU-bound tasks, số worker thường liên quan đến số processor. Đối với I/O-bound tasks, có thể cần concurrency cao hơn nhưng vẫn phải giới hạn database connection, HTTP connection, file descriptors và memory.

## 27.17. Race Condition

Race condition xảy ra khi kết quả phụ thuộc vào thứ tự hoặc timing không được kiểm soát giữa các threads.

~~~java
class Counter {

    private int value;

    void increment() {
        value++;
    }

    int getValue() {
        return value;
    }
}
~~~

value++ gồm đọc, cộng và ghi. Hai threads có thể cùng đọc 0, cùng tính 1 rồi cùng ghi 1, làm mất một increment.

### Check-then-act race

~~~java
if (!cache.containsKey(key)) {
    cache.put(key, loadValue(key));
}
~~~

Hai threads có thể cùng thấy key chưa tồn tại rồi cùng load và put. Nếu load có side effect hoặc tốn kém, đây là bug.

Các operation dễ có race:

- count++;
- balance = balance - amount;
- list.add() trên collection không thread-safe;
- kiểm tra state rồi chuyển state;
- kiểm tra quota rồi tăng usage;
- kiểm tra file tồn tại rồi tạo file.

## 27.18. Thread Safety

Một class thread-safe có thể được sử dụng theo contract của nó bởi nhiều threads mà không làm hỏng invariant do concurrent access.

Thread safety cần xét:

- dữ liệu có bị mất không;
- invariant có được bảo vệ không;
- visibility có đúng không;
- operation nhiều bước có atomic không;
- kết quả có deterministic theo contract không.

Các chiến lược thường dùng:

1. Immutability.
2. Thread confinement.
3. Stateless design.
4. Synchronization.
5. Atomic variables.
6. Concurrent collections.
7. Message passing qua queue.

Một service singleton không nên giữ field mutable dùng chung nếu không có thiết kế synchronization rõ ràng.

## 27.19. Visibility

~~~java
class Worker {

    private boolean stopped;

    void stop() {
        stopped = true;
    }

    void run() {
        while (!stopped) {
            doWork();
        }
    }
}
~~~

Không có synchronization, loop không có bảo đảm visibility phù hợp. Thread.sleep() không sửa được vấn đề.

Một flag đơn giản có thể dùng volatile:

~~~java
class Worker {

    private volatile boolean stopped;

    void stop() {
        stopped = true;
    }

    void run() {
        while (!stopped) {
            doWork();
        }
    }
}
~~~

volatile giải quyết visibility và một số ordering, nhưng không biến value++ thành atomic. Phần này sẽ được phân tích ở Chương 28.

## 27.20. Backend example: worker có cancellation

~~~java
class ImportWorker implements Runnable {

    private final BlockingQueue<Path> queue;

    ImportWorker(BlockingQueue<Path> queue) {
        this.queue = queue;
    }

    @Override
    public void run() {
        try {
            while (!Thread.currentThread().isInterrupted()) {
                Path file = queue.take();
                importFile(file);
            }
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        } finally {
            releaseResources();
        }
    }

    private void importFile(Path file) {
        // parse và lưu dữ liệu
    }

    private void releaseResources() {
        // cleanup
    }
}
~~~

Ví dụ thể hiện task chờ bằng blocking queue, xử lý interruption và cleanup trong finally. Production còn cần executor, retry, transaction boundary và idempotency.

# CHƯƠNG 28. SYNCHRONIZATION

## 28.1. Shared Mutable State

Shared mutable state là dữ liệu được nhiều threads cùng truy cập và có thể bị thay đổi mà không có cơ chế phối hợp đầy đủ.

~~~java
class Inventory {

    private int stock = 10;

    void decrease() {
        if (stock > 0) {
            stock--;
        }
    }
}
~~~

Điều kiện kiểm tra và thay đổi stock phải được nhìn như một operation thống nhất. Nếu hai requests cùng mua item cuối cùng, cả hai có thể vượt qua if.

## 28.2. Critical Section

Critical section là vùng code truy cập shared state và cần được bảo vệ để không có nhiều threads thực hiện xung đột cùng lúc.

~~~java
synchronized (lock) {
    // critical section
}
~~~

Critical section nên ngắn, không gọi network hoặc database chậm nếu không cần, không gọi code bên ngoài không kiểm soát và phải bảo vệ toàn bộ invariant bằng cùng một lock.

## 28.3. Atomicity, Visibility và Ordering

### Atomicity

Operation được quan sát như một đơn vị không bị xen kẽ giữa chừng.

### Visibility

Write của một thread được thread khác đọc theo guarantee của memory model.

### Ordering

Các actions có thứ tự quan sát phù hợp với synchronization rules.

volatile có thể cung cấp visibility và ordering nhưng không tự làm read-modify-write atomic. synchronized thường cung cấp cả mutual exclusion và memory synchronization.

## 28.4. Java Memory Model

Java Memory Model (JMM) mô tả những behavior hợp lệ khi nhiều threads đọc và ghi shared memory.

JMM không đơn giản nói rằng mọi thread luôn đọc giá trị mới nhất theo wall-clock. Nó định nghĩa program order, synchronization order và happens-before.

Instance fields, static fields và array elements có thể là shared variables. Local variables và method parameters thuộc execution context của thread và không được thread khác trực tiếp truy cập theo cách thông thường.

Data race xảy ra khi một thread ghi shared variable, thread khác đọc hoặc ghi cùng variable, ít nhất một access là write và không có happens-before ordering phù hợp.

## 28.5. Happens-before

Nếu action A happens-before action B, A được visible và ordered trước B theo JMM.

Các quan hệ quan trọng:

1. Actions trước trong cùng một thread happens-before actions sau.
2. Unlock một monitor happens-before lock tiếp theo trên cùng monitor.
3. Write vào volatile field happens-before các read tiếp theo của field đó.
4. Actions trước start() happens-before action đầu tiên của thread mới.
5. Actions của thread trước khi kết thúc happens-before thread khác return từ join().
6. Actions trước submit task có thể được nhìn thấy bởi task; task actions happens-before kết quả được lấy qua Future.get() theo contract.

Happens-before là guarantee về visibility và ordering quan sát được, không phải cam kết CPU thực hiện mọi instruction vật lý đúng thứ tự source.

## 28.6. synchronized và intrinsic monitor

Mỗi object Java có intrinsic monitor. synchronized statement acquire monitor trước khi chạy body và release khi rời body, kể cả khi body ném exception.

~~~java
private final Object lock = new Object();
private int balance;

void deposit(int amount) {
    synchronized (lock) {
        balance += amount;
    }
}
~~~

Chỉ một thread có thể giữ monitor tại một thời điểm. Monitor là reentrant: thread đang giữ monitor có thể acquire lại monitor đó.

Dùng private lock giảm nguy cơ code bên ngoài vô tình lock cùng object:

~~~java
private final Object stateLock = new Object();
~~~

Không nên synchronized trên String literal, boxed value hoặc object public có thể được chia sẻ không chủ ý.

## 28.7. synchronized method

Instance synchronized method lock monitor của this:

~~~java
class Counter {

    private int value;

    public synchronized void increment() {
        value++;
    }

    public synchronized int get() {
        return value;
    }
}
~~~

Static synchronized method lock monitor của Class object:

~~~java
class Metrics {

    private static int total;

    public static synchronized void increment() {
        total++;
    }
}
~~~

Synchronized block thường giúp giảm phạm vi lock và thể hiện rõ state nào đang được bảo vệ.

## 28.8. Guarantee và giới hạn của synchronized

synchronized cung cấp:

- mutual exclusion;
- visibility giữa unlock và lock tiếp theo;
- reentrancy;
- release lock tự động khi rời block.

Nó không tự động:

- bảo vệ state nếu code khác dùng lock khác;
- làm mọi method của object thread-safe;
- bảo đảm fairness;
- ngăn deadlock do nhiều lock;
- làm network call trong critical section nhanh hơn.

## 28.9. volatile

volatile field có semantics đặc biệt về visibility và ordering.

~~~java
class Service {

    private volatile boolean running = true;

    void stop() {
        running = false;
    }

    void serve() {
        while (running) {
            handleOne();
        }
    }
}
~~~

### volatile không làm compound operation atomic

~~~java
private volatile int count;

void increment() {
    count++;
}
~~~

count++ vẫn gồm read, add và write. Dùng AtomicInteger hoặc synchronized:

~~~java
private final AtomicInteger count =
        new AtomicInteger();

void increment() {
    count.incrementAndGet();
}
~~~

volatile phù hợp với stop flag hoặc state đơn giản được đọc/ghi độc lập, không phải mọi shared state.

## 28.10. wait(), notify() và notifyAll()

Một thread gọi wait() phải đang giữ monitor của object đó.

~~~java
synchronized (lock) {
    while (!condition) {
        lock.wait();
    }

    useResource();
}
~~~

wait():

- đưa thread vào wait set;
- giải phóng monitor trong thời gian chờ;
- khi thức dậy phải reacquire monitor;
- có thể ném InterruptedException;
- có thể thức dậy vì notify, notifyAll, interrupt, timeout hoặc spurious wakeup.

notify() đánh thức một thread được chọn. notifyAll() đánh thức tất cả threads đang chờ để chúng lần lượt cạnh tranh monitor.

### Luôn kiểm tra condition trong while

Đúng:

~~~java
synchronized (lock) {
    while (!condition) {
        lock.wait();
    }

    useResource();
}
~~~

Không nên dùng if vì có thể xảy ra spurious wakeup hoặc condition bị thread khác tiêu thụ trước khi lock được reacquire.

## 28.11. Bounded buffer bằng wait/notifyAll

~~~java
class BoundedBuffer<T> {

    private final Queue<T> queue =
            new ArrayDeque<>();
    private final int capacity;

    BoundedBuffer(int capacity) {
        if (capacity <= 0) {
            throw new IllegalArgumentException(
                    "capacity must be positive");
        }

        this.capacity = capacity;
    }

    public synchronized void put(T value)
            throws InterruptedException {

        while (queue.size() == capacity) {
            wait();
        }

        queue.add(value);
        notifyAll();
    }

    public synchronized T take()
            throws InterruptedException {

        while (queue.isEmpty()) {
            wait();
        }

        T value = queue.remove();
        notifyAll();
        return value;
    }
}
~~~

Ví dụ bảo vệ queue bằng cùng monitor, producer chờ khi full và consumer chờ khi empty. Trong ứng dụng thực tế, ArrayBlockingQueue thường dễ đọc hơn cho producer-consumer.

## 28.12. ReentrantLock

ReentrantLock là implementation của Lock, cung cấp tryLock, timeout, lockInterruptibly, fairness option và nhiều Condition.

~~~java
class SafeCounter {

    private final ReentrantLock lock =
            new ReentrantLock();
    private int value;

    void increment() {
        lock.lock();

        try {
            value++;
        } finally {
            lock.unlock();
        }
    }
}
~~~

finally là bắt buộc về mặt thực hành. Nếu bỏ unlock khi exception, các threads sau có thể bị block vô hạn.

### tryLock và lockInterruptibly

~~~java
if (lock.tryLock()) {
    try {
        update();
    } finally {
        lock.unlock();
    }
} else {
    handleContention();
}
~~~

~~~java
try {
    lock.lockInterruptibly();

    try {
        update();
    } finally {
        lock.unlock();
    }
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
}
~~~

Fair lock có thể giảm starvation trong một số tình huống nhưng thường có chi phí throughput.

## 28.13. ReadWriteLock

ReadWriteLock tách lock đọc và lock ghi:

- nhiều readers có thể cùng đọc;
- writer cần quyền độc quyền;
- reader và writer không chạy xung đột cùng lúc.

~~~java
class ConfigStore {

    private final ReadWriteLock lock =
            new ReentrantReadWriteLock();
    private String value;

    String get() {
        lock.readLock().lock();

        try {
            return value;
        } finally {
            lock.readLock().unlock();
        }
    }

    void set(String value) {
        lock.writeLock().lock();

        try {
            this.value = value;
        } finally {
            lock.writeLock().unlock();
        }
    }
}
~~~

Phù hợp khi đọc nhiều, ghi ít và critical section đủ lớn để lợi ích bù cho chi phí lock.

## 28.14. Atomic classes và CAS

Atomic classes cung cấp thao tác read-modify-write atomic dựa trên compare-and-set (CAS).

CAS có ý tưởng:

1. đọc giá trị hiện tại;
2. nếu vẫn bằng expected value, ghi update;
3. nếu đã thay đổi, thất bại và retry hoặc trả false.

~~~java
AtomicInteger counter =
        new AtomicInteger();

int after = counter.incrementAndGet();
int before = counter.getAndIncrement();

boolean updated =
        counter.compareAndSet(2, 10);
~~~

AtomicReference phù hợp với state transition đơn giản:

~~~java
AtomicReference<String> state =
        new AtomicReference<>("OPEN");

boolean changed =
        state.compareAndSet("OPEN", "CLOSED");
~~~

LongAdder phù hợp với metrics có nhiều update và đọc ít:

~~~java
LongAdder requests = new LongAdder();

requests.increment();
long total = requests.sum();
~~~

sum() không phải snapshot transaction tuyệt đối trong lúc threads khác tiếp tục update. Không dùng LongAdder cho số dư cần tính chính xác transaction.

## 28.15. Atomic class không phải transaction

AtomicInteger bảo vệ một giá trị int, không làm chuỗi operation trên nhiều object atomic.

~~~java
AtomicInteger count = new AtomicInteger();
List<String> items = new ArrayList<>();
~~~

Nếu cần tăng count và thêm item như một transaction, cần một coordination mechanism chung hoặc thiết kế lại state. Concurrent collection cũng không tự làm compound business operation atomic.
## 28.16. Deadlock

Deadlock xảy ra khi các threads chờ lẫn nhau vô hạn.

~~~java
Object lockA = new Object();
Object lockB = new Object();

Thread first = new Thread(() -> {
    synchronized (lockA) {
        sleepBriefly();
        synchronized (lockB) {
            work();
        }
    }
});

Thread second = new Thread(() -> {
    synchronized (lockB) {
        sleepBriefly();
        synchronized (lockA) {
            work();
        }
    }
});
~~~

Có thể xảy ra:

~~~text
Thread first giữ lockA và chờ lockB
Thread second giữ lockB và chờ lockA
Không thread nào tiến triển
~~~

### Cách phòng tránh

- luôn acquire nhiều lock theo cùng một thứ tự;
- giảm số lock lồng nhau;
- dùng tryLock có timeout;
- lock scope ngắn;
- tránh gọi code bên ngoài khi đang giữ lock;
- dùng queue hoặc data structure có sẵn;
- thiết kế ownership rõ ràng;
- dùng thread dump để chẩn đoán.

Java không tự động ngăn hoặc bắt buộc phát hiện deadlock.

## 28.17. Livelock

Livelock xảy ra khi threads vẫn hoạt động nhưng không tiến triển.

~~~text
A thấy B cần tài nguyên → A nhường
B thấy A cần tài nguyên → B nhường
Hai thread lặp lại hành vi nhường
~~~

Có thể giảm bằng backoff ngẫu nhiên, giới hạn retry hoặc thay đổi protocol.

## 28.18. Starvation và thread contention

Starvation là một thread không nhận đủ cơ hội chạy hoặc lấy lock vì các threads khác luôn chiếm tài nguyên.

Thread contention là sự tranh chấp cùng resource:

- monitor;
- ReentrantLock;
- CPU;
- database connection;
- queue capacity;
- rate limit.

Dấu hiệu thường gặp:

- latency tăng;
- thread dump có nhiều BLOCKED;
- CPU thấp nhưng request chậm;
- pool queue dài;
- lock hold time lớn.

Đừng chỉ tăng số threads khi contention nằm ở database hoặc external API. Điều đó có thể làm downstream quá tải hơn.

## 28.19. Thread safety patterns

### Immutability

~~~java
record UserSnapshot(
        long id,
        String name,
        boolean active
) {}
~~~

Nếu object state không đổi, nhiều threads có thể đọc cùng instance an toàn hơn.

### Thread confinement

Mỗi worker sở hữu một object mutable riêng và không chia sẻ object đó ra ngoài.

### Immutable publication

Tạo object hoàn chỉnh rồi publish qua cơ chế có happens-before như final fields đúng cách, volatile reference, lock hoặc concurrent collection.

### Lock ownership

Class nên nói rõ field nào được bảo vệ bởi lock nào. Một lock riêng cho mỗi method không nhất thiết bảo vệ cùng invariant.

### Không trả internal mutable state

~~~java
List<String> tags() {
    return tags;
}
~~~

Có thể cho caller sửa state mà không đi qua lock. Dùng immutable copy hoặc API kiểm soát phù hợp.

# CHƯƠNG 29. JAVA CONCURRENCY API

## 29.1. Vì sao cần Executor Framework?

Tự tạo Thread cho từng task khiến application phải tự quản lý số lượng threads, queue, lifecycle, exception, shutdown, backpressure, thread naming và rejection.

Executor Framework tách việc submit task khỏi cách task được thực thi.

~~~text
Producer code ── submit task ──> Executor
                                   │
                              work queue
                                   │
                         platform worker threads
~~~

## 29.2. Executor và ExecutorService

Executor là abstraction tối giản:

~~~java
Executor executor = command ->
        new Thread(command).start();

executor.execute(() ->
        System.out.println("async"));
~~~

ExecutorService bổ sung submit, Future, shutdown, awaitTermination, invokeAll, invokeAny và close trong Java 21 vì interface mở rộng AutoCloseable.

### Các factory thường gặp

~~~java
ExecutorService fixed =
        Executors.newFixedThreadPool(4);

ExecutorService single =
        Executors.newSingleThreadExecutor();

ExecutorService cached =
        Executors.newCachedThreadPool();

ScheduledExecutorService scheduler =
        Executors.newScheduledThreadPool(2);
~~~

Fixed pool giới hạn worker nhưng factory mặc định có thể dùng queue rất lớn. Cached pool có thể tạo nhiều threads khi input tăng. Không mặc định rằng các factory này đã tạo backpressure phù hợp cho production.

### Scheduled executor

~~~java
scheduler.schedule(
        () -> refreshCache(),
        5,
        TimeUnit.SECONDS);

scheduler.scheduleAtFixedRate(
        () -> emitMetrics(),
        0,
        10,
        TimeUnit.SECONDS);
~~~

scheduleAtFixedRate điều phối theo rate mục tiêu; scheduleWithFixedDelay chờ delay sau khi task trước hoàn thành. Task định kỳ cần logging, retry và chính sách khi task ném exception.

## 29.3. execute() và submit()

~~~java
executor.execute(() -> process());
~~~

execute nhận Runnable và không trả Future. Uncaught exception có thể đi đến handler của worker tùy implementation.

~~~java
Future<?> future = executor.submit(
        () -> process());
~~~

submit trả Future để chờ, cancel, kiểm tra trạng thái và lấy exception thông qua get(). Exception của task thường được wrap thành ExecutionException khi gọi get().

## 29.4. Future

~~~java
Future<Integer> future = executor.submit(
        () -> calculate());

try {
    Integer result = future.get(
            2,
            TimeUnit.SECONDS);
} catch (TimeoutException e) {
    future.cancel(true);
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
} catch (ExecutionException e) {
    Throwable cause = e.getCause();
}
~~~

| Method | Ý nghĩa |
| ------ | ------- |
| get() | Chờ vô hạn và lấy kết quả |
| get(timeout, unit) | Chờ tối đa một khoảng |
| isDone() | Task đã hoàn thành, kể cả lỗi hoặc cancel |
| isCancelled() | Task đã bị cancel |
| cancel(mayInterruptIfRunning) | Yêu cầu hủy task |
| resultNow() | Lấy kết quả nếu đã hoàn thành |
| exceptionNow() | Lấy exception nếu đã hoàn thành exceptional |

cancel(true) chỉ gửi interrupt đến thread đang chạy nếu task phản hồi interruption. Nó không cưỡng chế dừng code bất hợp tác.

## 29.5. invokeAll() và invokeAny()

~~~java
List<Callable<String>> tasks = List.of(
        () -> load("A"),
        () -> load("B"),
        () -> load("C"));

List<Future<String>> futures =
        executor.invokeAll(tasks);

for (Future<String> future : futures) {
    System.out.println(future.get());
}
~~~

invokeAll chờ các Callable hoàn thành hoặc timeout.

~~~java
String result = executor.invokeAny(tasks);
~~~

invokeAny trả kết quả của task hoàn thành thành công. Những task còn lại có thể bị hủy, vì vậy side effect của task phải idempotent hoặc có cơ chế rollback phù hợp.

## 29.6. Thread pool và sizing

Không có một con số thread đúng cho mọi hệ thống.

Với CPU-bound task, số worker thường gần số available processors, nhưng phải đo với workload thật.

Với I/O-bound task, có thể cần concurrency cao hơn số core, nhưng giới hạn thực tế có thể nằm ở database connections, HTTP connections, file descriptors, rate limit và memory.

Nếu executor có 100 workers nhưng database chỉ có 10 connections, nhiều workers chỉ chờ connection.

### Bounded ThreadPoolExecutor

~~~java
ThreadPoolExecutor executor =
        new ThreadPoolExecutor(
                4,
                8,
                30,
                TimeUnit.SECONDS,
                new ArrayBlockingQueue<>(100),
                runnable -> new Thread(
                        runnable,
                        "api-worker"),
                new ThreadPoolExecutor.CallerRunsPolicy());
~~~

Một production pool thường cần worker limit, queue capacity, rejection policy, ThreadFactory đặt tên, metrics, timeout và graceful shutdown.

CallerRunsPolicy có thể tạo backpressure bằng cách để thread submit chạy task khi pool và queue đều đầy. Policy phù hợp hay không phụ thuộc latency và request context.

## 29.7. shutdown() và shutdownNow()

shutdown():

- ngừng nhận task mới;
- cho phép task đã submit tiếp tục chạy;
- kết thúc khi task hoàn tất.

shutdownNow():

- cố gắng dừng;
- trả list task đang chờ chưa bắt đầu;
- gửi interrupt đến threads đang chạy;
- không bảo đảm task đang chạy tự dừng.

~~~java
static void shutdownAndAwait(
        ExecutorService executor
) {
    executor.shutdown();

    try {
        if (!executor.awaitTermination(
                30, TimeUnit.SECONDS)) {

            executor.shutdownNow();

            if (!executor.awaitTermination(
                    30, TimeUnit.SECONDS)) {
                System.err.println(
                        "Executor did not terminate");
            }
        }
    } catch (InterruptedException e) {
        executor.shutdownNow();
        Thread.currentThread().interrupt();
    }
}
~~~

Trong Java 21, ExecutorService là AutoCloseable:

~~~java
try (ExecutorService executor =
         Executors.newFixedThreadPool(4)) {

    executor.submit(() -> process());
}
~~~

Không tạo và đóng pool cho từng request. Pool thường thuộc lifecycle của application/service.

## 29.8. CompletableFuture

CompletableFuture vừa là Future vừa là CompletionStage. Nó mô tả pipeline asynchronous và kết hợp nhiều kết quả.

~~~java
CompletableFuture<String> future =
        CompletableFuture.supplyAsync(
                () -> loadUserName());
~~~

Nếu không truyền Executor, các async methods thường dùng ForkJoinPool.commonPool(). Không nên mặc định dùng common pool cho blocking database hoặc HTTP calls trong backend.

### thenApply

~~~java
CompletableFuture<String> normalized =
        future.thenApply(String::trim);
~~~

thenApply biến đổi kết quả. Non-async action có thể chạy trên thread hoàn thành future hoặc thread gọi completion method.

### thenApplyAsync

~~~java
CompletableFuture<String> async =
        future.thenApplyAsync(
                String::toUpperCase,
                executor);
~~~

Dùng executor tường minh khi cần kiểm soát pool và workload.

## 29.9. thenCompose và thenCombine

thenCompose dùng để nối operations phụ thuộc nhau và tránh nested future:

~~~java
CompletableFuture<User> user =
        loadUserAsync(userId);

CompletableFuture<List<Order>> orders =
        user.thenCompose(
                value -> loadOrdersAsync(value.id()));
~~~

thenCombine kết hợp hai futures độc lập:

~~~java
CompletableFuture<UserSummary> summary =
        loadUserAsync(userId)
        .thenCombine(
                loadBalanceAsync(userId),
                UserSummary::new);
~~~

Hai tasks có thể chạy độc lập nếu downstream cho phép.

## 29.10. exceptionally, handle và whenComplete

~~~java
CompletableFuture<String> fallback =
        loadAsync()
        .exceptionally(error -> "fallback");
~~~

~~~java
CompletableFuture<String> handled =
        loadAsync()
        .handle((value, error) -> {
            if (error != null) {
                return "fallback";
            }

            return value;
        });
~~~

~~~java
future.whenComplete((value, error) -> {
    if (error != null) {
        logFailure(error);
    } else {
        logSuccess(value);
    }
});
~~~

whenComplete phù hợp với logging và metrics, nhưng không nên nuốt error mà không đưa nó đến caller.

## 29.11. get() và join()

CompletableFuture.get() chờ và ném checked InterruptedException, ExecutionException hoặc TimeoutException ở overload có timeout.

join() chờ và ném CompletionException hoặc CancellationException:

~~~java
try {
    User user = future.get();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
} catch (ExecutionException e) {
    Throwable cause = e.getCause();
}
~~~

~~~java
User user = future.join();
~~~

Không gọi join() vô hạn trên request thread nếu pipeline có thể bị treo.

## 29.12. allOf() và anyOf()

~~~java
CompletableFuture<Void> all =
        CompletableFuture.allOf(
                loadA(),
                loadB(),
                loadC());

all.join();
~~~

allOf trả CompletableFuture<Void>, không tự trả list kết quả. Cần giữ các futures và lấy kết quả riêng.

~~~java
CompletableFuture<Object> first =
        CompletableFuture.anyOf(
                loadFromPrimary(),
                loadFromReplica());
~~~

anyOf hoàn thành khi một future hoàn thành, kể cả exceptional. First completed không luôn là first successful.

## 29.13. Timeout và cancellation

~~~java
CompletableFuture<String> future =
        loadAsync()
        .orTimeout(2, TimeUnit.SECONDS)
        .exceptionally(error -> "timeout fallback");
~~~

~~~java
CompletableFuture<String> defaulted =
        loadAsync()
        .completeOnTimeout(
                "default",
                2,
                TimeUnit.SECONDS);
~~~

Timeout của CompletableFuture không tự động dừng operation blocking bên dưới. Cần truyền deadline hoặc cancellation xuống HTTP client, database hoặc task executor.

## 29.14. Concurrent Collections

ArrayList, HashMap và HashSet trong java.util không tự thread-safe khi bị mutable access từ nhiều threads.

Các collection trong java.util.concurrent thường dùng:

- ConcurrentHashMap;
- CopyOnWriteArrayList;
- BlockingQueue;
- ConcurrentLinkedQueue;
- ConcurrentSkipListMap;
- ConcurrentSkipListSet.

Thread-safe không có nghĩa mọi chuỗi nhiều operation trở thành atomic.

## 29.15. ConcurrentHashMap

~~~java
ConcurrentHashMap<String, Long> counts =
        new ConcurrentHashMap<>();

counts.merge(
        "java",
        1L,
        Long::sum);

counts.computeIfAbsent(
        "spring",
        key -> loadInitialCount());

counts.putIfAbsent("go", 0L);
~~~

computeIfAbsent, merge và putIfAbsent giúp diễn đạt compound map operation theo contract. Function không nên có side effect phức tạp hoặc gọi lại map gây recursion.

ConcurrentHashMap không cho phép null key hoặc null value.

Code sau không atomic:

~~~java
if (!counts.containsKey(key)) {
    counts.put(key, 1L);
}
~~~

## 29.16. CopyOnWriteArrayList

CopyOnWriteArrayList tạo bản copy khi có write. Readers có thể iterate trên snapshot ổn định.

~~~java
CopyOnWriteArrayList<String> listeners =
        new CopyOnWriteArrayList<>();

listeners.add("email");
listeners.add("audit");

for (String listener : listeners) {
    System.out.println(listener);
}
~~~

Phù hợp khi đọc nhiều, ghi ít và list nhỏ hoặc vừa. Không phù hợp khi ghi thường xuyên hoặc list lớn.

## 29.17. BlockingQueue

BlockingQueue hỗ trợ producer-consumer:

- put() chờ khi queue đầy;
- take() chờ khi queue rỗng;
- offer() trả ngay;
- poll() trả ngay hoặc null;
- timed offer/poll chờ có giới hạn.

~~~java
BlockingQueue<String> queue =
        new ArrayBlockingQueue<>(100);

queue.put("task");
String task = queue.take();
~~~

BlockingQueue không nhận null. Nó không có close operation chung; poison pill là một pattern thường dùng:

~~~java
static final String STOP = "__STOP__";
~~~

Marker phải không thể nhầm với dữ liệu hợp lệ và phải đủ cho số consumers cần dừng.

## 29.18. CountDownLatch

CountDownLatch cho phép threads chờ đến khi counter về 0:

~~~java
CountDownLatch ready =
        new CountDownLatch(3);

Runnable worker = () -> {
    try {
        initializePart();
    } finally {
        ready.countDown();
    }
};

ready.await();
startServing();
~~~

Latch one-shot và không reset được. Nếu cần nhiều vòng, cân nhắc CyclicBarrier hoặc Phaser.

## 29.19. CyclicBarrier

CyclicBarrier cho nhóm threads gặp nhau tại barrier và có thể dùng lại:

~~~java
CyclicBarrier barrier =
        new CyclicBarrier(3, () ->
                System.out.println("round complete"));

try {
    barrier.await();
    computeNextRound();
} catch (InterruptedException e) {
    Thread.currentThread().interrupt();
} catch (BrokenBarrierException e) {
    handleBrokenBarrier();
}
~~~

Nếu một party bị interrupt hoặc barrier bị lỗi, barrier có thể chuyển sang broken state.

## 29.20. Semaphore

Semaphore quản lý số permits giới hạn:

~~~java
Semaphore permits = new Semaphore(10);

void callExternalService() {
    try {
        permits.acquire();

        try {
            performCall();
        } finally {
            permits.release();
        }
    } catch (InterruptedException e) {
        Thread.currentThread().interrupt();
    }
}
~~~

Dùng để giới hạn concurrent calls đến downstream hoặc số task sử dụng resource giới hạn. Permit phải được release trong finally.

## 29.21. ThreadLocal

ThreadLocal cung cấp value riêng cho mỗi thread:

~~~java
ThreadLocal<String> requestId =
        new ThreadLocal<>();

try {
    requestId.set("req-123");
    processRequest();
} finally {
    requestId.remove();
}
~~~

Thread pool tái sử dụng worker thread. Nếu không remove(), dữ liệu request trước có thể bị giữ và nhìn thấy trong request sau.

Không đặt object lớn hoặc secret vào ThreadLocal tùy tiện. Trong asynchronous flow, context không tự truyền sang mọi thread.

## 29.22. Fork/Join Framework

Fork/Join phù hợp với bài toán divide-and-conquer CPU-bound:

~~~java
class SumTask extends RecursiveTask<Long> {

    private static final int THRESHOLD = 1_000;
    private final long[] values;
    private final int start;
    private final int end;

    SumTask(long[] values, int start, int end) {
        this.values = values;
        this.start = start;
        this.end = end;
    }

    @Override
    protected Long compute() {
        int length = end - start;

        if (length <= THRESHOLD) {
            long sum = 0;

            for (int i = start; i < end; i++) {
                sum += values[i];
            }

            return sum;
        }

        int middle = start + length / 2;
        SumTask left =
                new SumTask(values, start, middle);
        SumTask right =
                new SumTask(values, middle, end);

        left.fork();
        long rightResult = right.compute();
        long leftResult = left.join();

        return leftResult + rightResult;
    }
}
~~~

ForkJoinPool dùng work-stealing: worker rảnh có thể lấy task từ queue của worker khác. Không mặc định dùng pool này cho blocking I/O.

## 29.23. Work-stealing pool

~~~java
ExecutorService pool =
        Executors.newWorkStealingPool();
~~~

Work-stealing phù hợp với nhiều task nhỏ, độc lập và CPU-bound. Khi task block trên database hoặc HTTP, cân nhắc executor riêng.

## 29.24. Chọn API concurrency

| Nhu cầu | API phù hợp |
| ------- | ----------- |
| Runnable đơn giản | Executor.execute() |
| Task trả kết quả | submit() + Future |
| Chờ nhiều Callable | invokeAll() |
| Kết quả đầu tiên | invokeAny() |
| Chuỗi async phụ thuộc | thenCompose() |
| Kết hợp task độc lập | thenCombine() |
| Chờ tất cả pipeline | allOf() |
| Producer-consumer | BlockingQueue |
| Giới hạn concurrency | Semaphore hoặc bounded executor |
| CPU divide-and-conquer | ForkJoinPool |
| Context theo worker | ThreadLocal, có cleanup |

Nếu caller gọi join() ngay sau async chain, code vẫn có thể block. Hãy xem toàn bộ request flow, timeout và resource boundary.

## 29.25. Backend design: tách pool theo workload

Không nên dùng một pool cho mọi việc:

~~~text
HTTP request pool
    ├── gọi database
    ├── gọi payment provider
    ├── resize ảnh
    ├── gửi email
    └── export report
~~~

Một task export report CPU-heavy hoặc bị treo có thể chiếm worker phục vụ payment.

Có thể tách CPU pool, I/O pool, scheduler, bounded batch queue và executor notification. Mỗi pool cần worker limit, queue capacity, rejection policy, timeout, metrics, graceful shutdown và tracing.

Đừng tạo pool theo từng request. Pool thường thuộc lifecycle của application/service.

## 29.26. Thread safety trong Spring-style backend

Service singleton sống lâu nên field mutable có thể được nhiều requests truy cập đồng thời.

Không an toàn:

~~~java
class UserService {

    private final ArrayList<String> recentUsers =
            new ArrayList<>();

    void record(String username) {
        recentUsers.add(username);
    }
}
~~~

Các lựa chọn:

- bỏ state khỏi singleton;
- dùng database hoặc cache chuyên dụng;
- bảo vệ state bằng lock;
- dùng concurrent collection nếu semantics phù hợp;
- giới hạn kích thước;
- thiết kế immutable snapshot;
- xem xét distributed concurrency nếu có nhiều instances.

Một ConcurrentHashMap trong một JVM không giải quyết race giữa nhiều replicas. Khi nhiều instances cùng xử lý một nghiệp vụ, cần database constraint, distributed lock, message ordering hoặc transaction phù hợp.

## 29.27. Checklist thiết kế concurrent task

Trước khi chạy task đồng thời, hãy trả lời:

1. Task CPU-bound hay I/O-bound?
2. Có shared mutable state không?
3. Invariant nào phải luôn đúng?
4. Operation nào phải atomic?
5. Task dừng bằng cách nào?
6. Nếu downstream chậm thì queue tối đa bao nhiêu?
7. Nếu task lỗi thì retry hay bỏ qua?
8. Retry có idempotent không?
9. Nếu process shutdown giữa chừng thì dữ liệu ra sao?
10. Có metric active task, queue size, latency và rejection không?
11. Có timeout và deadline không?
12. Exception có đến được nơi xử lý không?
13. ThreadLocal/context có được cleanup không?
14. Có test với nhiều threads và stress không?
# PHẦN THỰC HÀNH VÀ ÔN TẬP

## Bài tập 1 — Race condition của counter

Tạo Counter có value++ và chạy 10 threads, mỗi thread increment 100.000 lần.

Yêu cầu:

- quan sát kết quả nhỏ hơn expected;
- sửa bằng synchronized;
- sửa bằng AtomicInteger;
- so sánh độ dễ đọc và chi phí;
- giải thích vì sao kết quả không nên được kiểm tra bằng một lần chạy duy nhất.

## Bài tập 2 — Graceful cancellation

Tạo worker xử lý queue:

- dùng BlockingQueue;
- dừng bằng interrupt;
- không nuốt InterruptedException;
- cleanup trong finally;
- test shutdown khi queue đang rỗng;
- đặt timeout cho quá trình kết thúc.

## Bài tập 3 — Bounded executor

Tạo ThreadPoolExecutor có:

- core size 2;
- max size 4;
- queue capacity 10;
- thread name rõ;
- rejection policy;
- awaitTermination khi shutdown.

Ghi metric số task accepted, rejected và completed. Thử các policy khác nhau với workload chậm.

## Bài tập 4 — Deadlock diagnosis

Tạo hai threads lock hai object theo thứ tự ngược nhau.

Dùng thread dump để nhận diện BLOCKED/deadlock. Sau đó sửa bằng lock ordering hoặc tryLock timeout.

## Bài tập 5 — CompletableFuture pipeline

Mô phỏng:

1. load user;
2. load orders và profile song song;
3. combine thành summary;
4. timeout sau 2 giây;
5. xử lý exception;
6. dùng executor riêng thay vì common pool;
7. kiểm tra cancellation có đến được operation bên dưới không.

## Bài tập 6 — Producer-consumer

Dùng ArrayBlockingQueue:

- nhiều producers;
- nhiều consumers;
- poison pill;
- bounded capacity;
- interrupt khi shutdown;
- không mất task đã được acknowledge;
- test queue đầy và queue rỗng.

## Bài tập 7 — Visibility và happens-before

Viết ví dụ worker dừng bằng boolean thường, sau đó sửa bằng volatile. Viết thêm phiên bản dùng synchronized và giải thích sự khác nhau về visibility, atomicity và ordering.

# CÂU HỎI PHỎNG VẤN

1. Process và thread khác nhau thế nào?
2. Concurrency và parallelism khác nhau thế nào?
3. start() khác run() ở đâu?
4. Thread.State RUNNABLE có luôn nghĩa là đang chạy trên CPU không?
5. Vì sao không nên tạo thread cho mỗi HTTP request?
6. Runnable và Callable khác nhau thế nào?
7. sleep() có giải phóng monitor không?
8. join() dùng để làm gì?
9. interrupt() có cưỡng chế dừng thread không?
10. isInterrupted() và Thread.interrupted() khác nhau thế nào?
11. Daemon thread có giữ JVM sống không?
12. Thread priority có bảo đảm thứ tự thực thi không?
13. Race condition là gì?
14. value++ có atomic không?
15. Visibility, atomicity và ordering khác nhau thế nào?
16. synchronized instance method lock object nào?
17. synchronized static method lock gì?
18. synchronized cung cấp những guarantee nào?
19. volatile có làm increment atomic không?
20. Vì sao wait() phải nằm trong while?
21. wait() khác sleep() thế nào?
22. Khi nào dùng notifyAll() thay notify()?
23. ReentrantLock cần unlock ở đâu?
24. tryLock giúp giải quyết vấn đề gì?
25. Deadlock, livelock và starvation khác nhau thế nào?
26. AtomicInteger dùng CAS như thế nào?
27. ConcurrentHashMap khác HashMap synchronized wrapper thế nào?
28. CopyOnWriteArrayList phù hợp workload nào?
29. BlockingQueue hỗ trợ producer-consumer ra sao?
30. CountDownLatch khác CyclicBarrier thế nào?
31. Semaphore dùng để giới hạn gì?
32. Vì sao ThreadLocal nguy hiểm với thread pool?
33. execute() và submit() khác nhau thế nào?
34. shutdown() và shutdownNow() khác nhau thế nào?
35. Future.get() có thể ném exception nào?
36. CompletableFuture dùng common pool khi nào?
37. thenApply khác thenCompose thế nào?
38. allOf() có trả list kết quả không?
39. ForkJoinPool dùng work-stealing để làm gì?
40. Vì sao không nên block I/O trong common ForkJoinPool?
41. Làm sao sizing thread pool cho CPU-bound và I/O-bound?
42. ExecutorService có cần shutdown không?
43. Vì sao task retry phải idempotent?
44. Một concurrent collection có làm compound business operation atomic không?
45. Làm sao kiểm tra thread leak và executor không shutdown?

# TỔNG KẾT PHẦN 9

Bạn cần ghi nhớ:

- Thread là luồng thực thi; các threads cùng process có thể chia sẻ heap.
- Concurrency không đồng nghĩa với parallelism.
- start() tạo execution trên thread mới; run() chỉ là method call.
- Platform thread có tài nguyên hữu hạn; không tạo tùy ý theo từng request.
- sleep() không giải phóng monitor; join() chờ thread kết thúc.
- Interrupt là cơ chế cancellation hợp tác; không nuốt InterruptedException.
- Race condition thường xuất hiện ở operation read-modify-write và check-then-act.
- Thread safety cần cả mutual exclusion, visibility và đúng invariant.
- synchronized cung cấp monitor-based mutual exclusion và happens-before.
- volatile phù hợp visibility và ordering đơn giản, không thay thế atomic update.
- wait() phải kiểm tra condition trong while và phải giữ đúng monitor.
- ReentrantLock phải unlock trong finally.
- Atomic classes dùng CAS cho state đơn giản; không thay thế transaction nhiều object.
- Deadlock cần lock ordering hoặc timeout strategy; livelock và starvation cũng cần theo dõi.
- ExecutorService tách submit task khỏi worker lifecycle, nhưng phải shutdown.
- Bounded queue, timeout, cancellation, rejection và metrics là phần của production concurrency.
- CompletableFuture biểu diễn pipeline nhưng không tự làm blocking I/O hiệu quả.
- ConcurrentHashMap, BlockingQueue và coordination primitives giải quyết những bài toán khác nhau.
- ThreadLocal phải cleanup trong finally khi dùng thread pool.
- ForkJoinPool phù hợp divide-and-conquer CPU tasks; không mặc định phù hợp blocking I/O.
- Trong backend nhiều instance, JVM-local synchronization không thay thế distributed coordination.

## Tài liệu tham khảo

- [Java SE 21 API — Thread](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/lang/Thread.html)
- [Java Language Specification 21 — Chapter 17: Threads and Locks](https://docs.oracle.com/javase/specs/jls/se21/html/jls-17.html)
- [Java SE 21 API — ExecutorService](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ExecutorService.html)
- [Java SE 21 API — CompletableFuture](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/CompletableFuture.html)
- [Java SE 21 API — Lock](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/locks/Lock.html)
- [Java SE 21 API — Atomic package](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/atomic/package-summary.html)
- [Java SE 21 API — BlockingQueue](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/BlockingQueue.html)
- [Java SE 21 API — ForkJoinPool](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/concurrent/ForkJoinPool.html)
