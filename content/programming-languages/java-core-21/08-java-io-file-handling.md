# JAVA CORE 21 — PHẦN 8: JAVA I/O & FILE HANDLING

Giáo trình chuyên sâu · Java SE 21 · Beginner → Junior/Junior+ Backend Developer

Trong các phần trước, bạn đã học về OOP, Exception Handling, Collections, Generics và Functional Programming. Phần 8 giải thích cách Java đọc, ghi và trao đổi dữ liệu với những tài nguyên nằm bên ngoài chương trình.

Đối với Java Backend Developer, kiến thức này xuất hiện khi xây dựng:

- upload và download file;
- import CSV, JSON, XML hoặc dữ liệu log;
- export báo cáo;
- xử lý ảnh, PDF và file nén;
- đọc configuration files;
- lưu file tạm;
- trao đổi dữ liệu với network;
- theo dõi một thư mục để xử lý file mới;
- lưu cache hoặc dữ liệu nhị phân.

I/O (Input/Output) không chỉ là gọi read() và write(). Bạn cần hiểu loại dữ liệu đang xử lý, charset, buffer, lifetime của resource, giới hạn bộ nhớ, lỗi quyền truy cập và các rủi ro bảo mật khi đường dẫn hoặc dữ liệu đến từ người dùng.

## Nội dung Phần 8

| Chương | Chủ đề | Kiến thức trọng tâm |
| ------ | ------ | ------------------- |
| 24 | Java Input/Output | Byte Streams, Character Streams, Buffering, Charset, Scanner, try-with-resources |
| 25 | NIO.2 File API | Path, Files, Directory Traversal, Channels, ByteBuffer, WatchService |
| 26 | Serialization | Serializable, Object Streams, serialVersionUID, transient, Externalizable, Security |

# CHƯƠNG 24. JAVA INPUT / OUTPUT

## 24.1. I/O là gì?

I/O là quá trình trao đổi dữ liệu giữa chương trình và một nguồn hoặc đích bên ngoài.

Input là dữ liệu đi vào chương trình:

- đọc file từ ổ đĩa;
- nhận bytes từ network;
- đọc dữ liệu từ bàn phím;
- nhận dữ liệu từ một pipe hoặc process khác.

Output là dữ liệu chương trình gửi ra:

- ghi file;
- gửi HTTP response;
- in ra console;
- gửi bytes đến socket hoặc thiết bị khác.

Có thể hình dung:

~~~text
External resource ── input ──> Java program ── output ──> External resource
                              xử lý dữ liệu
~~~

### I/O khác computation như thế nào?

Phép tính:

~~~java
int result = 10 + 20;
~~~

chủ yếu dùng CPU và dữ liệu đã nằm trong bộ nhớ.

Đọc file:

~~~java
String content = Files.readString(path);
~~~

phải làm việc với filesystem, system call, quyền truy cập, encoding và trạng thái bên ngoài JVM.

I/O thường có:

- latency lớn hơn phép tính trong bộ nhớ;
- khả năng thất bại do file không tồn tại, hết quyền hoặc network lỗi;
- yêu cầu đóng resource;
- giới hạn kích thước dữ liệu;
- ảnh hưởng đến throughput của request backend.

Không nên đọc toàn bộ một file không giới hạn vào heap chỉ vì API readAllBytes() hoặc readString() rất tiện.

## 24.2. Các package I/O quan trọng

| Package | Vai trò |
| ------- | ------- |
| java.io | Stream truyền thống, Reader/Writer, object serialization |
| java.nio | Buffer, Channel và các abstraction I/O hiện đại |
| java.nio.file | Path, Files, thao tác file/directory và WatchService |
| java.nio.charset | Charset, encoder và decoder |
| java.util | Scanner, Formatter và một số utility liên quan |
| java.util.stream | Stream xử lý dữ liệu; không phải I/O stream |

### InputStream có phải Stream API không?

Không.

Hai khái niệm có tên gần giống nhưng mục đích khác nhau:

- java.io.InputStream: nguồn dữ liệu bytes, dùng để đọc I/O.
- java.util.stream.Stream<T>: pipeline xử lý các phần tử dữ liệu.

Ví dụ một file có thể được đọc bằng Files.lines(path) để tạo Stream<String>, nhưng stream đó vẫn giữ một resource bên dưới và phải được đóng.

## 24.2.1. Standard Streams: System.in, System.out và System.err

Java cung cấp ba standard streams gắn với process:

| Stream | Kiểu | Vai trò |
| ------ | ---- | ------- |
| System.in | InputStream | Nhận input mặc định, thường là keyboard hoặc pipe |
| System.out | PrintStream | Ghi output thông thường, thường là console |
| System.err | PrintStream | Ghi diagnostic/error output |

Ví dụ đọc một dòng từ console:

~~~java
BufferedReader reader = new BufferedReader(
        new InputStreamReader(
                System.in,
                StandardCharsets.UTF_8));

String line = reader.readLine();
System.out.println("You entered: " + line);
~~~

Ví dụ này cố ý không đóng reader vì reader đang bọc System.in, là stream mà process vẫn có thể cần dùng. Trong ứng dụng server, không nên đóng System.in, System.out hoặc System.err tùy tiện nếu những stream này còn được framework hoặc phần khác của process sử dụng. Với logging production, nên dùng logging framework và cấu hình output phù hợp thay vì rải System.out.println() trong business code.

System.err thường được dùng cho diagnostics, nhưng việc tách stdout và stderr còn phụ thuộc cách process được triển khai. Container runtime, shell hoặc process supervisor có thể thu thập hai stream theo chính sách khác nhau.

## 24.3. Byte Streams

Byte stream xử lý dữ liệu theo đơn vị byte. Hai abstract classes nền tảng là:

- InputStream: đọc bytes;
- OutputStream: ghi bytes.

Một byte trong file có giá trị từ 0 đến 255. Tuy nhiên Java byte là kiểu signed, có phạm vi -128 đến 127.

### InputStream.read() trả về int

Contract của read() là:

- trả về 0 đến 255 nếu đọc được một byte;
- trả về -1 khi đạt end-of-stream (EOF);
- có thể ném IOException.

~~~java
try (InputStream input =
         Files.newInputStream(Path.of("data.bin"))) {

    int value;

    while ((value = input.read()) != -1) {
        // value là byte unsigned từ 0 đến 255
        System.out.println(value);
    }
}
~~~

Nếu read() trả về byte, giá trị -1 có thể bị nhầm là một byte dữ liệu hợp lệ. Vì vậy API dùng int để dành -1 làm tín hiệu EOF.

### Đọc theo buffer

Đọc từng byte có thể không hiệu quả với file lớn. Thông thường nên đọc theo block:

~~~java
Path source = Path.of("input.bin");
byte[] buffer = new byte[8 * 1024];

try (InputStream input = Files.newInputStream(source)) {
    int bytesRead;

    while ((bytesRead = input.read(buffer)) != -1) {
        // Chỉ xử lý buffer[0..bytesRead)
        System.out.println("Read " + bytesRead + " bytes");
    }
}
~~~

Không được giả định mỗi lần read(buffer) đều điền đầy buffer. Giá trị trả về có thể nhỏ hơn buffer.length.

### Các method hữu ích trong Java hiện đại

InputStream có thể cung cấp:

~~~java
byte[] all = input.readAllBytes();
byte[] part = input.readNBytes(1024);
long copied = input.transferTo(output);
~~~

Các method này tiện lợi nhưng phải cân nhắc kích thước dữ liệu:

- readAllBytes() có thể tạo một mảng rất lớn;
- readNBytes(n) giới hạn số bytes cần đọc;
- transferTo() vẫn có thể truyền một lượng dữ liệu rất lớn, nhưng không cần giữ toàn bộ trong heap.

available() không phải kích thước còn lại chính xác của file. Nó chỉ biểu thị số bytes có thể đọc mà không bị block theo contract của stream, nên không dùng để quyết định kích thước toàn bộ file hoặc điều kiện EOF.

## 24.4. OutputStream

OutputStream cung cấp các thao tác ghi bytes.

~~~java
Path outputPath = Path.of("output.bin");

try (OutputStream output = Files.newOutputStream(outputPath)) {
    output.write(65); // ghi một byte có giá trị 65
    output.write(new byte[] {66, 67, 68});
    output.flush();
}
~~~

Các method thường gặp:

| Method | Ý nghĩa |
| ------ | ------- |
| write(int) | Ghi phần byte thấp của giá trị int |
| write(byte[]) | Ghi toàn bộ mảng bytes |
| write(byte[], off, len) | Ghi một đoạn của mảng |
| flush() | Đẩy dữ liệu đang buffer xuống stream bên dưới |
| close() | Đóng resource; thường flush trước khi đóng |

write(65) không ghi chuỗi "65" mà ghi một byte có giá trị 65. Nếu muốn ghi text, hãy dùng Writer hoặc encode text thành bytes với charset xác định.

## 24.5. FileInputStream và FileOutputStream

FileInputStream và FileOutputStream là các implementation byte stream làm việc trực tiếp với file.

### Đọc file nhị phân

~~~java
Path source = Path.of("photo.jpg");

try (FileInputStream input =
         new FileInputStream(source.toFile())) {

    byte[] buffer = new byte[16 * 1024];

    while (input.read(buffer) != -1) {
        // xử lý bytes của ảnh
    }
}
~~~

### Sao chép file theo chunks

~~~java
Path source = Path.of("source.pdf");
Path target = Path.of("backup.pdf");

try (InputStream input = new FileInputStream(source.toFile());
     OutputStream output = new FileOutputStream(target.toFile())) {

    byte[] buffer = new byte[16 * 1024];
    int bytesRead;

    while ((bytesRead = input.read(buffer)) != -1) {
        output.write(buffer, 0, bytesRead);
    }
}
~~~

### Ghi đè và append

Constructor thông thường của FileOutputStream sẽ tạo file nếu cần và ghi đè nội dung cũ.

~~~java
try (OutputStream output =
         new FileOutputStream("application.log")) {
    output.write("new content".getBytes(StandardCharsets.UTF_8));
}
~~~

Muốn ghi nối tiếp:

~~~java
try (OutputStream output =
         new FileOutputStream("application.log", true)) {
    output.write("next line\n".getBytes(StandardCharsets.UTF_8));
}
~~~

Trong code mới, Files.newOutputStream() với StandardOpenOption thường diễn đạt intent rõ hơn và tích hợp tốt với Path.

### Khi nào dùng byte stream?

Byte stream phù hợp với:

- ảnh, video, audio;
- PDF, ZIP, JAR;
- file database hoặc format nhị phân;
- file upload/download;
- protocol binary;
- dữ liệu chưa được giải mã thành text.

Không dùng Reader/Writer để sao chép file nhị phân tùy ý. Việc decode rồi encode có thể làm thay đổi byte sequence và làm hỏng file.

## 24.6. Character Streams

Character stream được thiết kế cho dữ liệu văn bản. Hai abstract classes cốt lõi:

- Reader: đọc characters;
- Writer: ghi characters.

~~~java
Path path = Path.of("notes.txt");

try (Reader reader = Files.newBufferedReader(
        path, StandardCharsets.UTF_8)) {

    char[] buffer = new char[1024];
    int charsRead;

    while ((charsRead = reader.read(buffer)) != -1) {
        String chunk = new String(buffer, 0, charsRead);
        System.out.print(chunk);
    }
}
~~~

Reader.read() trả về:

- số nguyên biểu diễn character đọc được;
- -1 khi kết thúc.

Tương tự byte stream, không được giả định read(char[]) luôn lấp đầy toàn bộ mảng.

### Writer

~~~java
Path path = Path.of("report.txt");

try (Writer writer = Files.newBufferedWriter(
        path, StandardCharsets.UTF_8)) {

    writer.write("Java Core 21");
    writer.write(System.lineSeparator());
    writer.write("I/O basics");
}
~~~

Text không chỉ là một dãy char độc lập. Trong Java, char là UTF-16 code unit; một số ký tự Unicode cần hai code units để biểu diễn một code point. Vì vậy length() hoặc số char đọc được không luôn bằng số ký tự mà người dùng nhìn thấy.

### FileReader và FileWriter

FileReader và FileWriter là các convenience classes lâu đời dựa trên Reader và Writer. Những constructor cũ không nhận Charset sử dụng charset mặc định của môi trường, vì vậy dễ tạo khác biệt giữa máy developer và production.

Java hiện đại có overload nhận Charset:

~~~java
try (FileReader reader = new FileReader(
        path.toFile(),
        StandardCharsets.UTF_8)) {
    int character = reader.read();
}

try (FileWriter writer = new FileWriter(
        path.toFile(),
        StandardCharsets.UTF_8)) {
    writer.write("Xin chào");
}
~~~

Trong code backend mới, Files.newBufferedReader() và Files.newBufferedWriter() thường rõ ràng hơn vì thể hiện Path, Charset và buffering trong cùng một API.

### Character Encoding và Charset

Charset là quy tắc ánh xạ giữa characters và bytes. Khi ghi text, encoder biến characters thành bytes; khi đọc, decoder biến bytes thành characters.

UTF-8 có thể biểu diễn toàn bộ Unicode và tương thích tốt với nhiều hệ thống web. Tuy nhiên không nên chỉ thấy UTF-8 phổ biến rồi bỏ qua contract của hệ thống đang tích hợp.

Sai charset có thể gây:

- ký tự tiếng Việt bị biến dạng;
- dữ liệu được parse sai;
- chữ ký hoặc hash khác với dữ liệu ban đầu;
- file xuất ra không đọc được bởi hệ thống đối tác.

Luôn xác định rõ charset ở boundary đọc/ghi, HTTP, CSV và message format.

## 24.7. Byte Streams và Character Streams

| Tiêu chí | Byte Streams | Character Streams |
| -------- | ------------ | ----------------- |
| Đơn vị xử lý | Byte | Character/UTF-16 code unit |
| API chính | InputStream, OutputStream | Reader, Writer |
| Dữ liệu phù hợp | Ảnh, PDF, ZIP, binary | Text, CSV, JSON, XML |
| Charset | Không tự diễn giải nội dung | Cần decoding/encoding |
| Rủi ro dùng sai | Ít, nhưng phải hiểu format | Sai charset gây mojibake hoặc mất dữ liệu |

Quy tắc thực tế:

- Nếu dữ liệu là text, chọn charset rõ ràng, thường là UTF-8.
- Nếu dữ liệu là binary, giữ nguyên bytes và không decode thành String.
- Nếu API giao tiếp có contract charset, tuân theo contract thay vì đoán encoding.

## 24.8. InputStreamReader và OutputStreamWriter

Đây là các bridge classes kết nối byte streams với character streams.

~~~java
try (Reader reader = new InputStreamReader(
        inputStream, StandardCharsets.UTF_8)) {
    // bytes từ inputStream được decode thành characters
}
~~~

~~~java
try (Writer writer = new OutputStreamWriter(
        outputStream, StandardCharsets.UTF_8)) {
    writer.write("Xin chào Java");
}
~~~

### Vì sao phải chỉ định charset?

Chuỗi "Tiếng Việt" được mã hóa thành bytes khác nhau tùy charset. Nếu ghi bằng UTF-8 nhưng đọc bằng charset khác, dữ liệu có thể hiển thị như:

~~~text
Tiáº¿ng Viá»‡t
~~~

Đây là lỗi decode sai, không phải lỗi font đơn thuần.

Nên ưu tiên:

~~~java
Files.readString(path, StandardCharsets.UTF_8);
Files.newBufferedReader(path, StandardCharsets.UTF_8);
Files.writeString(path, text, StandardCharsets.UTF_8);
~~~

Tránh dựa vào charset mặc định của hệ điều hành khi dữ liệu phải chạy ổn định trên Windows, Linux và container.

## 24.9. Buffered Streams

Buffering là kỹ thuật gom nhiều thao tác đọc/ghi nhỏ thành các block lớn hơn để giảm số lần gọi I/O bên dưới.

Nếu không buffer, một vòng lặp đọc từng dòng hoặc từng byte có thể tạo ra rất nhiều system calls. BufferedInputStream, BufferedOutputStream, BufferedReader và BufferedWriter giữ một vùng đệm trong bộ nhớ để giảm chi phí đó.

~~~java
try (var input = new BufferedInputStream(
         Files.newInputStream(Path.of("input.bin")));
     var output = new BufferedOutputStream(
         Files.newOutputStream(Path.of("output.bin")))) {

    input.transferTo(output);
}
~~~

### flush() có nghĩa gì?

flush() yêu cầu dữ liệu đang nằm trong buffer của application được chuyển xuống underlying stream.

~~~java
try (var writer = new BufferedWriter(
         Files.newBufferedWriter(
             Path.of("application.log"),
             StandardCharsets.UTF_8))) {

    writer.write("request completed");
    writer.flush();
}
~~~

flush() không đồng nghĩa dữ liệu đã bền vững trên physical storage. Với yêu cầu durability cao, cần xem xét FileChannel.force(...), filesystem và chính sách lưu trữ. Đây là hai vấn đề khác nhau:

- visibility: dữ liệu đã được đẩy qua các buffer hay chưa;
- durability: dữ liệu có còn sau sự cố hệ điều hành hoặc mất điện hay không.

close() thường xử lý flush theo contract của implementation, nhưng resource vẫn phải được đóng bằng try-with-resources.

## 24.10. BufferedReader và BufferedWriter

BufferedReader phù hợp để đọc text theo dòng.

~~~java
Path path = Path.of("users.csv");

try (BufferedReader reader = Files.newBufferedReader(
        path, StandardCharsets.UTF_8)) {

    String line;

    while ((line = reader.readLine()) != null) {
        System.out.println(line);
    }
}
~~~

readLine():

- trả nội dung dòng, không bao gồm line terminator;
- trả null khi EOF;
- không tự phân tích CSV có dấu phẩy nằm trong dấu ngoặc kép.

Nếu xử lý CSV thực tế, cần tuân thủ format CSV hoặc dùng thư viện chuyên dụng thay vì line.split(",") trong mọi trường hợp.

Ghi theo dòng:

~~~java
try (BufferedWriter writer = Files.newBufferedWriter(
        Path.of("report.txt"), StandardCharsets.UTF_8)) {

    writer.write("First line");
    writer.newLine();
    writer.write("Second line");
}
~~~

newLine() dùng line separator phù hợp với môi trường. Khi tạo file protocol hoặc format yêu cầu line ending cố định, hãy ghi theo contract của format thay vì phụ thuộc OS.

## 24.11. Đọc từng byte và đọc theo block

Đọc từng byte dễ hiểu:

~~~java
try (InputStream input =
         Files.newInputStream(Path.of("data.bin"))) {

    int value;

    while ((value = input.read()) != -1) {
        consumeByte(value);
    }
}
~~~

Nhưng với dữ liệu lớn nên dùng chunks:

~~~java
static void copy(InputStream input, OutputStream output)
        throws IOException {

    byte[] buffer = new byte[16 * 1024];
    int bytesRead;

    while ((bytesRead = input.read(buffer)) != -1) {
        output.write(buffer, 0, bytesRead);
    }
}
~~~

Hàm consumeByte trong ví dụ trước chỉ mang tính minh họa.

Lỗi thường gặp:

~~~java
output.write(buffer);
~~~

sau một lần đọc có thể ghi cả phần cũ còn sót lại trong buffer. Phải ghi 0 đến bytesRead, vì chỉ phần đó là dữ liệu hợp lệ của lần đọc hiện tại.

### Xử lý file lớn

Với file lớn:

- giới hạn kích thước trước khi cấp phát bộ nhớ;
- dùng chunk streaming;
- không giữ toàn bộ file trong request object hoặc byte array;
- áp dụng timeout và giới hạn upload;
- theo dõi backpressure nếu truyền qua network;
- tránh log nội dung binary hoặc dữ liệu nhạy cảm.

## 24.12. Scanner

Scanner là utility class giúp đọc và parse text theo token.

~~~java
try (Scanner scanner = new Scanner(
        Path.of("input.txt"), StandardCharsets.UTF_8)) {

    while (scanner.hasNext()) {
        String token = scanner.next();
        System.out.println(token);
    }
}
~~~

Scanner phù hợp với:

- chương trình console nhỏ;
- bài tập;
- input có token đơn giản;
- parse dữ liệu theo delimiter.

Nó thường không phải lựa chọn nhanh nhất cho file rất lớn hoặc HTTP body lớn vì có overhead parsing và regex.

### next() và nextLine()

- next() đọc token tiếp theo theo delimiter.
- nextLine() đọc phần còn lại của dòng hiện tại.

Bẫy quen thuộc:

~~~java
Scanner scanner = new Scanner(System.in);

int age = scanner.nextInt();
String name = scanner.nextLine();
~~~

Sau nextInt(), newline còn lại trong input. Vì vậy nextLine() có thể trả về chuỗi rỗng.

Cách xử lý:

~~~java
int age = scanner.nextInt();
scanner.nextLine(); // consume newline
String name = scanner.nextLine();
~~~

Hoặc đọc toàn bộ bằng nextLine() rồi parse:

~~~java
int age = Integer.parseInt(scanner.nextLine());
String name = scanner.nextLine();
~~~

Cách thứ hai giúp flow input nhất quán hơn trong nhiều chương trình console.

### Scanner và Locale

Các method như nextInt(), nextDouble() có thể chịu ảnh hưởng của Locale.

~~~java
Scanner scanner = new Scanner(input)
        .useLocale(Locale.US);
~~~

Với dữ liệu machine-readable, nên xác định rõ format và Locale, không nên phụ thuộc locale máy chạy.

## 24.13. PrintStream và PrintWriter

System.out và System.err có kiểu PrintStream.

~~~java
System.out.println("Application started");
System.err.println("Warning");
~~~

PrintStream và PrintWriter cung cấp các method tiện dụng như print, println, printf, nhưng nhiều method không ném IOException trực tiếp. Chúng có thể lưu trạng thái lỗi nội bộ.

~~~java
try (PrintWriter writer = new PrintWriter(
        Files.newBufferedWriter(
            Path.of("report.txt"),
            StandardCharsets.UTF_8))) {

    writer.printf("Total: %d%n", 42);

    if (writer.checkError()) {
        throw new IOException("Writing report failed");
    }
}
~~~

Không nên hiểu việc println() hoàn thành là luôn ghi thành công xuống đích. Với API này, cần kiểm tra checkError() nếu failure state có ý nghĩa.

## 24.14. ByteArrayInputStream và ByteArrayOutputStream

Không phải stream nào cũng gắn với file vật lý. Java có memory-backed streams.

~~~java
byte[] data = {1, 2, 3};

try (InputStream input =
         new ByteArrayInputStream(data)) {

    System.out.println(input.read());
}
~~~

~~~java
try (ByteArrayOutputStream output =
         new ByteArrayOutputStream()) {

    output.write("hello".getBytes(StandardCharsets.UTF_8));

    byte[] result = output.toByteArray();
    System.out.println(new String(result, StandardCharsets.UTF_8));
}
~~~

Use cases:

- unit test;
- tạo binary payload nhỏ trong memory;
- xây dựng response body;
- kiểm tra code nhận InputStream mà không cần file thật;
- chuyển đổi dữ liệu tạm thời.

ByteArrayOutputStream lưu toàn bộ nội dung trong heap. Không dùng nó để gom file upload không giới hạn.

## 24.15. DataInputStream và DataOutputStream

DataInputStream và DataOutputStream đọc/ghi primitive values theo một binary format cụ thể.

~~~java
Path path = Path.of("numbers.dat");

try (DataOutputStream output = new DataOutputStream(
         Files.newOutputStream(path))) {

    output.writeInt(2026);
    output.writeDouble(99.5);
    output.writeBoolean(true);
}
~~~

Đọc phải đúng thứ tự và kiểu:

~~~java
try (DataInputStream input = new DataInputStream(
         Files.newInputStream(path))) {

    int year = input.readInt();
    double score = input.readDouble();
    boolean active = input.readBoolean();
}
~~~

Nếu ghi writeInt() nhưng đọc bằng readLong() hoặc đảo thứ tự, dữ liệu sẽ bị diễn giải sai.

writeUTF() dùng modified UTF-8 theo contract riêng của Java. Nó không phải cách chung để tạo một file text UTF-8 tương thích với mọi hệ thống.

## 24.16. Try-with-resources

Resource như file stream, reader, writer, socket và channel thường cần đóng sau khi dùng. Chúng nên implement AutoCloseable hoặc Closeable.

~~~java
Path path = Path.of("config.properties");

try (BufferedReader reader = Files.newBufferedReader(
        path, StandardCharsets.UTF_8)) {

    String firstLine = reader.readLine();
    System.out.println(firstLine);
}
~~~

Khi rời khỏi block:

- reader được đóng dù body kết thúc bình thường;
- reader vẫn được đóng nếu body ném exception;
- exception phát sinh trong close() có thể trở thành suppressed exception.

### Nhiều resources

~~~java
try (InputStream input =
         Files.newInputStream(Path.of("source.bin"));
     OutputStream output =
         Files.newOutputStream(Path.of("target.bin"))) {

    input.transferTo(output);
}
~~~

Resources được đóng theo thứ tự ngược với thứ tự khai báo: output trước, input sau.

### Suppressed exception

Nếu body ném exception và close() cũng ném exception, lỗi trong close() được gắn vào lỗi chính:

~~~java
try {
    operation();
} catch (Exception e) {
    for (Throwable suppressed : e.getSuppressed()) {
        System.err.println(suppressed.getMessage());
    }
}
~~~

Đây là ưu điểm lớn so với việc tự viết finally và vô tình che mất exception ban đầu.

## 24.17. Các exception I/O thường gặp

| Exception | Tình huống điển hình |
| --------- | -------------------- |
| IOException | Lỗi I/O tổng quát |
| FileNotFoundException | Không mở được file theo API cũ hoặc file không tồn tại |
| EOFException | Dữ liệu kết thúc sớm khi format yêu cầu thêm dữ liệu |
| AccessDeniedException | Không có quyền đọc/ghi |
| NoSuchFileException | Đường dẫn không tồn tại |
| DirectoryNotEmptyException | Xóa directory còn chứa entry |
| FileAlreadyExistsException | Tạo file mới nhưng entry đã tồn tại |
| ClosedChannelException | Dùng channel sau khi đã đóng |
| UncheckedIOException | Bọc IOException thành unchecked exception |

Trong backend, không nên trả nguyên stack trace hoặc đường dẫn nội bộ cho client. Hãy log đầy đủ ở server, còn response nên dùng error code và message phù hợp.

## 24.18. Ví dụ backend: copy upload có giới hạn kích thước

Giả sử server nhận một InputStream từ request và lưu file. Không nên tin filename do client gửi hoặc đọc vô hạn vào heap.

~~~java
static long saveUpload(
        InputStream input,
        Path target,
        long maxBytes
) throws IOException {

    if (maxBytes < 0) {
        throw new IllegalArgumentException("maxBytes must not be negative");
    }

    long total = 0;
    byte[] buffer = new byte[16 * 1024];

    try (OutputStream output = Files.newOutputStream(
            target,
            StandardOpenOption.CREATE_NEW,
            StandardOpenOption.WRITE)) {

        int bytesRead;

        while ((bytesRead = input.read(buffer)) != -1) {
            if (total > maxBytes - bytesRead) {
                throw new IOException("Upload exceeds configured limit");
            }

            output.write(buffer, 0, bytesRead);
            total += bytesRead;
        }
    }

    return total;
}
~~~

Trong production, còn cần:

- tạo tên file do server sinh;
- kiểm tra content type bằng nội dung, không chỉ extension;
- lưu ngoài web root;
- dùng temporary file và atomic move;
- giới hạn timeout;
- cleanup file tạm khi xử lý thất bại;
- chống path traversal;
- quét malware nếu domain yêu cầu.

# CHƯƠNG 25. NIO.2 FILE API

## 25.1. NIO và NIO.2 là gì?

NIO (New I/O) được giới thiệu để cung cấp các abstraction như:

- Buffer;
- Channel;
- non-blocking I/O trong một số API;
- thao tác file hiện đại hơn.

NIO.2 được bổ sung từ Java 7, đặc biệt cải thiện filesystem API thông qua:

- Path;
- Files;
- file attributes;
- directory traversal;
- symbolic links;
- filesystem watch service.

Đối với code Java 21, Path và Files thường là lựa chọn mặc định cho thao tác filesystem.

## 25.2. java.io.File và Path

File là API cũ đại diện cho pathname. Path là abstraction hiện đại hơn, hỗ trợ thao tác path rõ ràng và kết hợp tốt với NIO.2.

~~~java
File legacyFile = new File("data/input.txt");
Path modernPath = Path.of("data", "input.txt");
~~~

Một Path chỉ mô tả đường dẫn. Việc tạo Path không có nghĩa file đã tồn tại.

Paths.get(...) vẫn tồn tại, nhưng với Java hiện đại nên ưu tiên factory method:

~~~java
Path path = Path.of("data", "input.txt");
~~~

Thay vì:

~~~java
Path path = Paths.get("data", "input.txt");
~~~

## 25.3. Tạo và phân tích Path

### Relative và absolute path

~~~java
Path relative = Path.of("data", "users.json");
Path absolute = relative.toAbsolutePath();

System.out.println(relative);
System.out.println(absolute);
~~~

Relative path phụ thuộc working directory của process. Vì vậy không nên giả định working directory luôn là thư mục project.

### resolve()

~~~java
Path base = Path.of("storage");
Path userFile = base.resolve("users.json");
~~~

resolve() nối path theo separator của filesystem. Nếu argument là absolute path, nó có thể thay thế base thay vì nối tiếp; input người dùng cần được kiểm tra cẩn thận.

### resolveSibling()

~~~java
Path original = Path.of("data", "report.csv");
Path backup = original.resolveSibling("report.csv.bak");
~~~

### getFileName() và getParent()

~~~java
Path path = Path.of("data", "report.csv");

System.out.println(path.getFileName()); // report.csv
System.out.println(path.getParent());   // data
~~~

Một path chỉ có filename có thể không có parent rõ ràng.

### normalize()

~~~java
Path path = Path.of("data", ".", "users", "..", "report.csv");
System.out.println(path.normalize()); // data/report.csv
~~~

normalize() chỉ xử lý cú pháp . và ... Nó không kiểm tra filesystem, không tự giải quyết symbolic link và không tự biến path thành an toàn.

### toRealPath()

~~~java
Path realPath = path.toRealPath();
~~~

Method này thường yêu cầu entry tồn tại và truy vấn filesystem thực tế. Nó có thể resolve symbolic links tùy options.

| Method | Ý nghĩa |
| ------ | ------- |
| normalize() | Chuẩn hóa cú pháp, không cần file tồn tại |
| toAbsolutePath() | Chuyển thành absolute theo môi trường hiện tại |
| toRealPath() | Lấy path thực tế từ filesystem, thường yêu cầu tồn tại |

## 25.4. Files.exists() và giới hạn của kiểm tra tồn tại

~~~java
Path path = Path.of("config.properties");

if (Files.exists(path)) {
    System.out.println("Entry exists");
}
~~~

Files.exists() trả lời theo khả năng quan sát hiện tại. Nếu hệ điều hành không cho phép kiểm tra hoặc trạng thái không xác định, kết quả không nhất thiết phản ánh đầy đủ thực tế.

exists() và notExists() cũng không luôn là hai kết quả đối lập tuyệt đối.

### TOCTOU race condition

Code như sau có thể có race condition:

~~~java
if (Files.exists(path)) {
    Files.delete(path);
}
~~~

Giữa lúc check và lúc delete, một process khác có thể thay đổi file. Với nhiều operation, hãy thực hiện trực tiếp và xử lý exception:

~~~java
try {
    Files.deleteIfExists(path);
} catch (AccessDeniedException e) {
    // xử lý quyền truy cập
}
~~~

## 25.5. Đọc text bằng Files.readString()

~~~java
Path path = Path.of("message.txt");

String content = Files.readString(
        path,
        StandardCharsets.UTF_8);

System.out.println(content);
~~~

Overload không truyền charset sử dụng UTF-8 theo API hiện đại, nhưng truyền tường minh giúp code thể hiện rõ contract dữ liệu.

readString() phù hợp khi file có kích thước nhỏ hoặc đã có giới hạn rõ ràng. Nó đọc toàn bộ nội dung vào một String, nên không thích hợp cho log hàng GB hoặc upload không giới hạn.

### Xử lý IOException

~~~java
static String loadMessage(Path path) throws IOException {
    return Files.readString(path, StandardCharsets.UTF_8);
}
~~~

Hoặc xử lý tại boundary:

~~~java
try {
    String content = Files.readString(
            path, StandardCharsets.UTF_8);
} catch (NoSuchFileException e) {
    // trả lỗi resource không tồn tại
} catch (IOException e) {
    // log lỗi I/O và trả lỗi server phù hợp
}
~~~

## 25.6. Ghi text bằng Files.writeString()

~~~java
Path path = Path.of("message.txt");

Files.writeString(
        path,
        "Hello Java 21",
        StandardCharsets.UTF_8);
~~~

Cách gọi mặc định thường tạo file nếu chưa có và truncate file cũ. Khi behavior quan trọng, nên ghi rõ options:

~~~java
Files.writeString(
        path,
        "new content",
        StandardCharsets.UTF_8,
        StandardOpenOption.CREATE,
        StandardOpenOption.TRUNCATE_EXISTING,
        StandardOpenOption.WRITE);
~~~

Ghi nối tiếp:

~~~java
Files.writeString(
        Path.of("application.log"),
        "request completed" + System.lineSeparator(),
        StandardCharsets.UTF_8,
        StandardOpenOption.CREATE,
        StandardOpenOption.WRITE,
        StandardOpenOption.APPEND);
~~~

Tạo mới bắt buộc, không ghi đè:

~~~java
Files.writeString(
        Path.of("unique.txt"),
        "created once",
        StandardCharsets.UTF_8,
        StandardOpenOption.CREATE_NEW,
        StandardOpenOption.WRITE);
~~~

### Ghi file an toàn hơn bằng temporary file

Để tránh để lại file đích ở trạng thái dở dang khi process thất bại:

~~~java
static void replaceTextAtomically(
        Path target,
        String content
) throws IOException {

    Path absoluteTarget = target.toAbsolutePath();
    Path directory = absoluteTarget.getParent();

    Path temporary = Files.createTempFile(
            directory,
            absoluteTarget.getFileName().toString(),
            ".tmp");

    try {
        Files.writeString(
                temporary,
                content,
                StandardCharsets.UTF_8,
                StandardOpenOption.TRUNCATE_EXISTING,
                StandardOpenOption.WRITE);

        try {
            Files.move(
                    temporary,
                    absoluteTarget,
                    StandardCopyOption.ATOMIC_MOVE,
                    StandardCopyOption.REPLACE_EXISTING);
        } catch (AtomicMoveNotSupportedException e) {
            Files.move(
                    temporary,
                    absoluteTarget,
                    StandardCopyOption.REPLACE_EXISTING);
        }
    } finally {
        Files.deleteIfExists(temporary);
    }
}
~~~

ATOMIC_MOVE phụ thuộc filesystem. Fallback không phải lúc nào cũng có cùng mức bảo đảm atomic, nên phải chọn chính sách phù hợp với dữ liệu.

## 25.7. readAllLines() và lines()

### Files.readAllLines()

~~~java
List<String> lines = Files.readAllLines(
        Path.of("users.txt"),
        StandardCharsets.UTF_8);
~~~

Toàn bộ dòng được giữ trong List, phù hợp với file nhỏ hoặc vừa và khi logic cần truy cập nhiều lần.

### Files.lines()

~~~java
try (Stream<String> lines = Files.lines(
        Path.of("users.txt"),
        StandardCharsets.UTF_8)) {

    long activeCount = lines
            .filter(line -> line.endsWith(",ACTIVE"))
            .count();

    System.out.println(activeCount);
}
~~~

Files.lines() tạo lazy stream và giữ resource bên dưới. Phải đóng stream bằng try-with-resources.

Không nên viết:

~~~java
Files.lines(path).filter(...).count();
~~~

mà bỏ qua việc đóng stream, đặc biệt trong server xử lý nhiều request. Nếu không đóng, file descriptors có thể bị giữ lại lâu hơn cần thiết.

### Files.lines() và memory

lines() giúp không load toàn bộ file vào một list, nhưng mỗi dòng vẫn được tạo và pipeline vẫn có chi phí. Nó không biến một file vô hạn thành operation miễn phí. Với format phức tạp, cần parser streaming thích hợp.

## 25.8. Đọc và ghi bytes bằng Files

~~~java
byte[] data = Files.readAllBytes(Path.of("image.png"));
Files.write(
        Path.of("image-copy.png"),
        data,
        StandardOpenOption.CREATE,
        StandardOpenOption.TRUNCATE_EXISTING,
        StandardOpenOption.WRITE);
~~~

API này thuận tiện cho file nhỏ. Với file lớn, dùng stream hoặc channel:

~~~java
try (InputStream input = Files.newInputStream(source);
     OutputStream output = Files.newOutputStream(target)) {
    input.transferTo(output);
}
~~~

Giới hạn dung lượng phải được xác định theo domain, không chỉ theo Files.size(), vì file có thể thay đổi giữa lúc kiểm tra và lúc đọc.
## 25.9. copy(), move(), delete() và deleteIfExists()

### Copy

~~~java
Files.copy(
        source,
        target,
        StandardCopyOption.REPLACE_EXISTING,
        StandardCopyOption.COPY_ATTRIBUTES);
~~~

Các options phổ biến:

- REPLACE_EXISTING: thay thế target nếu tồn tại;
- COPY_ATTRIBUTES: cố gắng sao chép metadata;
- NOFOLLOW_LINKS: không đi theo symbolic link ở một số operation.

Không phải mọi filesystem đều hỗ trợ copy toàn bộ attributes.

### Move

~~~java
Files.move(
        temporary,
        target,
        StandardCopyOption.REPLACE_EXISTING);
~~~

Move trong cùng filesystem thường rẻ hơn copy rồi delete, nhưng behavior phụ thuộc filesystem và boundary giữa các filesystem.

ATOMIC_MOVE yêu cầu move atomic nếu filesystem hỗ trợ:

~~~java
Files.move(
        temporary,
        target,
        StandardCopyOption.ATOMIC_MOVE,
        StandardCopyOption.REPLACE_EXISTING);
~~~

Nếu không hỗ trợ, có thể ném AtomicMoveNotSupportedException.

### Delete

~~~java
Files.delete(path);
~~~

delete() ném exception nếu path không tồn tại. Nếu muốn xóa nếu có:

~~~java
boolean deleted = Files.deleteIfExists(path);
~~~

Xóa một directory không đệ quy. Directory phải rỗng, nếu không có thể ném DirectoryNotEmptyException.

Không dùng delete() tùy tiện với path đến từ client. Trước khi xóa phải kiểm tra ownership, scope tenant, quyền và path boundary.

## 25.10. createDirectories() và tạo file

~~~java
Path directory = Path.of("storage", "avatars");
Files.createDirectories(directory);
~~~

createDirectories() tạo cả parent directories nếu cần và không lỗi nếu directory đã tồn tại, miễn entry đó là directory.

~~~java
Path file = directory.resolve("profile.txt");

if (Files.notExists(file)) {
    Files.createFile(file);
}
~~~

Pattern check-then-create vẫn có race condition. Nếu cần đảm bảo không ghi đè, dùng CREATE_NEW:

~~~java
try (OutputStream output = Files.newOutputStream(
        file,
        StandardOpenOption.CREATE_NEW,
        StandardOpenOption.WRITE)) {
    output.write("content".getBytes(StandardCharsets.UTF_8));
}
~~~

Nếu file đã tồn tại, operation thất bại thay vì âm thầm ghi đè.

## 25.11. StandardOpenOption

StandardOpenOption mô tả cách mở file.

| Option | Ý nghĩa |
| ------ | ------- |
| READ | Mở để đọc |
| WRITE | Mở để ghi |
| APPEND | Ghi ở cuối file |
| CREATE | Tạo nếu chưa tồn tại |
| CREATE_NEW | Tạo mới; lỗi nếu đã tồn tại |
| TRUNCATE_EXISTING | Cắt nội dung về độ dài 0 khi mở để ghi |
| DELETE_ON_CLOSE | Cố gắng xóa khi channel đóng |
| SPARSE | Gợi ý file sparse |
| SYNC | Yêu cầu cập nhật file và metadata đồng bộ hơn |
| DSYNC | Yêu cầu cập nhật nội dung đồng bộ hơn metadata |

Một số options không kết hợp hợp lệ trong mọi tình huống. Hãy đọc contract của API tạo stream/channel cụ thể.

APPEND phù hợp log đơn giản, nhưng nhiều process cùng append vẫn cần xem xét concurrency và tính atomic của filesystem.

NOFOLLOW_LINKS thuộc LinkOption, không phải StandardOpenOption. Đây là một option riêng được truyền cho những API có hỗ trợ xử lý symbolic link.

## 25.12. Directory: list(), walk() và find()

### Files.list()

list() chỉ liệt kê immediate children, không đệ quy:

~~~java
try (Stream<Path> entries =
         Files.list(Path.of("storage"))) {

    entries
        .filter(Files::isRegularFile)
        .forEach(System.out::println);
}
~~~

Stream phải đóng vì nó giữ directory resource.

### Files.walk()

walk() duyệt đệ quy:

~~~java
try (Stream<Path> paths =
         Files.walk(Path.of("storage"))) {

    paths.filter(Files::isRegularFile)
         .forEach(System.out::println);
}
~~~

Giới hạn depth:

~~~java
try (Stream<Path> paths =
         Files.walk(Path.of("storage"), 2)) {
    paths.forEach(System.out::println);
}
~~~

Mặc định, Files.walk() không follow symbolic links. Có thể truyền FileVisitOption.FOLLOW_LINKS khi domain thật sự cần:

~~~java
try (Stream<Path> paths = Files.walk(
        root,
        FileVisitOption.FOLLOW_LINKS)) {
    paths.forEach(System.out::println);
}
~~~

Follow links có thể làm cây duyệt đi ra ngoài vùng dự kiến hoặc gặp cycle. Java cố gắng phát hiện cycle trong một số trường hợp, nhưng ứng dụng vẫn phải giới hạn scope, depth và quyền truy cập.

### Xóa cây thư mục

Không thể xóa parent trước children. Có thể duyệt theo thứ tự ngược:

~~~java
try (Stream<Path> paths = Files.walk(directory)) {
    paths.sorted(Comparator.reverseOrder())
         .forEach(path -> {
             try {
                 Files.deleteIfExists(path);
             } catch (IOException e) {
                 throw new UncheckedIOException(e);
             }
         });
}
~~~

Trong code production, nên gom lỗi, log path an toàn và cân nhắc race condition hoặc symbolic links. Đừng dùng đoạn này cho một directory chưa được xác thực.

### Files.find()

find() cho phép lọc theo attributes:

~~~java
try (Stream<Path> paths = Files.find(
        Path.of("storage"),
        5,
        (path, attributes) ->
                attributes.isRegularFile()
                && attributes.size() > 10_000)) {

    paths.forEach(System.out::println);
}
~~~

### walkFileTree()

Khi cần kiểm soát vào/ra directory, skip subtree hoặc xử lý attributes, dùng FileVisitor:

~~~java
Files.walkFileTree(
        root,
        new SimpleFileVisitor<>() {
            @Override
            public FileVisitResult visitFile(
                    Path file,
                    BasicFileAttributes attrs
            ) {
                System.out.println(file);
                return FileVisitResult.CONTINUE;
            }

            @Override
            public FileVisitResult visitFileFailed(
                    Path file,
                    IOException exception
            ) throws IOException {
                System.err.println(
                        "Cannot visit " + file);
                return FileVisitResult.CONTINUE;
            }
        });
~~~

Các callback khác gồm preVisitDirectory, visitFile, visitFileFailed và postVisitDirectory.

## 25.13. Path Traversal và bảo mật đường dẫn

Path traversal là tình huống input người dùng dùng .., absolute path hoặc symbolic link để truy cập ngoài thư mục được phép.

Ví dụ input nguy hiểm:

~~~text
../../../../etc/passwd
..\..\secret.env
C:\Windows\System32\config
~~~

### Kiểm tra base directory

~~~java
static Path resolveInside(
        Path baseDirectory,
        String userProvidedName
) {

    Path base = baseDirectory
            .toAbsolutePath()
            .normalize();

    Path candidate = base
            .resolve(userProvidedName)
            .normalize();

    if (!candidate.startsWith(base)) {
        throw new SecurityException(
                "Path escapes storage directory");
    }

    return candidate;
}
~~~

startsWith() phải dùng Path.startsWith(Path), không dùng String.startsWith() vì string prefix có thể gây nhầm lẫn giữa các path.

### Symbolic link và TOCTOU

normalize() không loại bỏ rủi ro symbolic link. Một path nhìn có vẻ nằm trong base directory vẫn có thể trỏ qua symlink ra ngoài.

Ngoài ra, path có thể thay đổi sau khi validation trước lúc file được mở. Đây là TOCTOU race condition.

Các biện pháp tùy mức độ bảo mật:

- không dùng tên file người dùng làm tên lưu trữ;
- sinh identifier phía server;
- lưu file trong directory riêng;
- kiểm tra canonical/real path khi phù hợp;
- hạn chế follow symbolic links;
- dùng filesystem hoặc storage service có boundary rõ;
- áp dụng quyền OS tối thiểu;
- không trả path nội bộ cho client;
- xử lý operation và exception thay vì tin tuyệt đối một bước check trước đó.

Validation path là một lớp phòng thủ, không phải lý do để bỏ qua authorization.

## 25.14. File Attributes và File Permissions

### BasicFileAttributes

~~~java
BasicFileAttributes attributes =
        Files.readAttributes(
                path,
                BasicFileAttributes.class);

System.out.println(attributes.isRegularFile());
System.out.println(attributes.isDirectory());
System.out.println(attributes.size());
System.out.println(attributes.lastModifiedTime());
~~~

Các thuộc tính thường dùng:

- regular file hay directory;
- symbolic link;
- size;
- creation time;
- last modified time;
- last access time;
- file key nếu filesystem cung cấp.

### POSIX permissions

Linux/Unix có thể hỗ trợ:

~~~java
Set<PosixFilePermission> permissions =
        Files.getPosixFilePermissions(path);
~~~

Windows thường sử dụng DOS attributes hoặc ACL theo cơ chế khác. Không nên giả định mọi filesystem hỗ trợ PosixFilePermission.

### Quyền OS không thay thế authorization ứng dụng

Files.isReadable(path) chỉ là một quan sát tại thời điểm hiện tại. Nó không thay thế:

- kiểm tra user có được phép truy cập resource hay không;
- kiểm tra tenant ownership;
- kiểm tra role;
- xử lý race condition;
- mở file và xử lý lỗi thật.

## 25.15. FileChannel

FileChannel là channel để đọc, ghi và thao tác nâng cao với file.

~~~java
try (FileChannel channel = FileChannel.open(
        Path.of("data.bin"),
        StandardOpenOption.READ)) {

    ByteBuffer buffer = ByteBuffer.allocate(4096);
    int bytesRead = channel.read(buffer);
}
~~~

### Ghi bằng FileChannel

~~~java
try (FileChannel channel = FileChannel.open(
        Path.of("data.bin"),
        StandardOpenOption.CREATE,
        StandardOpenOption.WRITE,
        StandardOpenOption.TRUNCATE_EXISTING)) {

    ByteBuffer buffer = ByteBuffer.wrap(
            "Java 21".getBytes(StandardCharsets.UTF_8));

    while (buffer.hasRemaining()) {
        channel.write(buffer);
    }
}
~~~

Một lần read() hoặc write() không nhất thiết xử lý toàn bộ buffer. Khi cần hoàn tất, hãy lặp đến khi buffer hết hoặc khi EOF.

### Position

~~~java
try (FileChannel channel = FileChannel.open(
        path,
        StandardOpenOption.READ,
        StandardOpenOption.WRITE)) {

    channel.position(100);
}
~~~

Channel có position dùng cho thao tác tuần tự. Có thể dùng positional read/write để không làm thay đổi position hiện tại:

~~~java
int count = channel.read(buffer, 100);
~~~

### Transfer

~~~java
try (FileChannel source = FileChannel.open(
         input, StandardOpenOption.READ);
     FileChannel target = FileChannel.open(
         output,
         StandardOpenOption.CREATE,
         StandardOpenOption.WRITE,
         StandardOpenOption.TRUNCATE_EXISTING)) {

    long position = 0;
    long size = source.size();

    while (position < size) {
        long transferred = source.transferTo(
                position, size - position, target);

        if (transferred == 0) {
            break;
        }

        position += transferred;
    }
}
~~~

Không nên giả định transferTo() luôn chuyển toàn bộ phần còn lại trong một lần gọi.

### force()

~~~java
channel.force(true);
~~~

force(true) yêu cầu cố gắng đẩy cả nội dung và metadata liên quan xuống storage. Đây là yêu cầu durability ở mức API; mức bảo đảm cuối cùng còn phụ thuộc OS, filesystem, thiết bị và cấu hình.

### File locks

FileChannel.lock() hoặc tryLock() có thể dùng để phối hợp truy cập giữa một số process:

~~~java
try (FileChannel channel = FileChannel.open(
        path,
        StandardOpenOption.CREATE,
        StandardOpenOption.WRITE)) {

    try (FileLock lock = channel.lock()) {
        // cập nhật file trong vùng lock
    }
}
~~~

File lock không thay thế database transaction và behavior lock phụ thuộc hệ điều hành/filesystem. Không nên dùng nó như cơ chế đồng bộ hóa tất cả request backend mà không đánh giá kỹ.

## 25.16. ByteBuffer

ByteBuffer là vùng nhớ bytes có state quản lý vị trí.

Bốn khái niệm cần nhớ:

- capacity: tổng số phần tử buffer có thể chứa;
- position: vị trí đọc/ghi hiện tại;
- limit: giới hạn đọc/ghi hiện tại;
- mark: điểm đánh dấu tùy chọn.

### Write mode và read mode

~~~java
ByteBuffer buffer = ByteBuffer.allocate(8);

buffer.put((byte) 10);
buffer.put((byte) 20);

buffer.flip(); // chuyển sang đọc

while (buffer.hasRemaining()) {
    System.out.println(buffer.get());
}
~~~

flip():

- đặt limit bằng position cũ;
- đặt position về 0;
- chuẩn bị đọc phần vừa ghi.

### clear(), rewind(), compact()

~~~java
buffer.clear();   // chuẩn bị ghi lại từ đầu
buffer.rewind();  // đọc lại từ đầu, giữ limit
buffer.compact(); // giữ phần chưa đọc và chuẩn bị ghi tiếp
~~~

clear() không xóa byte vật lý; nó chỉ reset metadata của buffer.

Lỗi phổ biến:

~~~java
ByteBuffer buffer = ByteBuffer.allocate(1024);
channel.read(buffer);

// quên flip()
channel.write(buffer);
~~~

Nếu không gọi flip(), position đang ở cuối dữ liệu đã đọc và write có thể không ghi phần mong muốn.

### Heap và direct buffer

- ByteBuffer.allocate() tạo heap buffer.
- ByteBuffer.allocateDirect() tạo direct buffer, có thể hữu ích trong một số I/O nhưng có cost cấp phát/quản lý khác.
- ByteBuffer.wrap(bytes) bọc một byte array có sẵn.

Không mặc định rằng direct buffer luôn nhanh hơn. Hãy đo trong workload thực tế.

## 25.17. WatchService

WatchService cho phép theo dõi thay đổi trong directory.

~~~java
Path directory = Path.of("incoming");

try (WatchService watcher =
         FileSystems.getDefault().newWatchService()) {

    directory.register(
            watcher,
            StandardWatchEventKinds.ENTRY_CREATE,
            StandardWatchEventKinds.ENTRY_MODIFY,
            StandardWatchEventKinds.ENTRY_DELETE);

    WatchKey key;

    while ((key = watcher.take()) != null) {
        for (WatchEvent<?> event : key.pollEvents()) {
            WatchEvent.Kind<?> kind = event.kind();

            if (kind == StandardWatchEventKinds.OVERFLOW) {
                System.err.println("Events may be lost");
                continue;
            }

            Path fileName =
                    (Path) event.context();

            Path changed = directory.resolve(fileName);
            System.out.println(kind.name() + ": " + changed);
        }

        if (!key.reset()) {
            break;
        }
    }
}
~~~

### Ý nghĩa các event

| Event | Ý nghĩa |
| ----- | ------- |
| ENTRY_CREATE | Entry được tạo trong directory đã đăng ký |
| ENTRY_MODIFY | Entry bị thay đổi |
| ENTRY_DELETE | Entry bị xóa |
| OVERFLOW | Có thể mất hoặc gộp event |

### Những giới hạn cần biết

- WatchService theo dõi directory entry, không tự đệ quy toàn bộ cây.
- Một file copy lớn có thể phát sinh nhiều modify events.
- Event có thể bị gộp hoặc thứ tự không phù hợp với business assumption.
- OVERFLOW nghĩa là phải rescan nếu không được phép bỏ sót.
- File có thể bị xóa hoặc thay đổi trước khi worker xử lý.
- Cần đóng watcher khi ứng dụng shutdown.
- Trên mỗi OS/filesystem, implementation và độ tin cậy chi tiết có thể khác nhau.

Vì vậy WatchService phù hợp cho trigger hoặc cache refresh đơn giản, nhưng không nên là hàng đợi bền vững duy nhất cho workflow quan trọng. Với job cần không mất event, nên dùng durable queue hoặc lưu trạng thái trong database.

## 25.18. Chọn API nào?

| Nhu cầu | API nên cân nhắc |
| ------- | ---------------- |
| Đọc file text nhỏ | Files.readString() |
| Ghi file text nhỏ | Files.writeString() |
| Đọc text theo dòng | Files.newBufferedReader() hoặc Files.lines() |
| Copy binary streaming | InputStream/OutputStream hoặc Files.copy() |
| Đường dẫn và filesystem | Path, Files |
| File lớn, position, lock | FileChannel |
| Protocol binary | ByteBuffer, DataInputStream |
| Duyệt cây thư mục | Files.walk() hoặc walkFileTree() |
| Theo dõi directory | WatchService |
| Input console đơn giản | Scanner |
| Text output định dạng | BufferedWriter, PrintWriter |

# CHƯƠNG 26. SERIALIZATION

## 26.1. Serialization và Deserialization là gì?

Serialization là quá trình chuyển object graph thành một dạng bytes để:

- lưu xuống file;
- truyền qua một kênh;
- cache tạm thời;
- khôi phục object sau đó.

Deserialization là quá trình đọc bytes và tái tạo object graph.

~~~text
Object graph ── serialization ──> bytes
bytes ── deserialization ──> object graph
~~~

Object graph không chỉ là một object đơn lẻ. Nếu object có field tham chiếu đến object khác và các class phù hợp với cơ chế serialization, graph đó có thể được ghi theo quan hệ tham chiếu.

Java native serialization không phải JSON. Bytes của nó gắn với cơ chế Java serialization, class metadata và contract tương thích của Java.

## 26.2. Serializable

Serializable là marker interface: interface không yêu cầu method nhưng cho phép class tham gia cơ chế Object Serialization.

~~~java
public final class UserProfile
        implements Serializable {

    private static final long serialVersionUID = 1L;

    private final long id;
    private final String username;

    public UserProfile(long id, String username) {
        this.id = id;
        this.username = username;
    }

    public long id() {
        return id;
    }

    public String username() {
        return username;
    }
}
~~~

Các field instance phải serializable hoặc phải được đánh dấu transient. Nếu graph chứa field không serializable mà không transient, serialization có thể ném NotSerializableException.

## 26.3. ObjectOutputStream và ObjectInputStream

### Ghi object

~~~java
Path path = Path.of("profile.bin");

UserProfile profile = new UserProfile(1L, "alice");

try (ObjectOutputStream output =
         new ObjectOutputStream(
             Files.newOutputStream(path))) {

    output.writeObject(profile);
}
~~~

### Đọc object

~~~java
try (ObjectInputStream input =
         new ObjectInputStream(
             Files.newInputStream(path))) {

    Object value = input.readObject();

    if (value instanceof UserProfile loaded) {
        System.out.println(loaded.username());
    }
}
~~~

readObject() có thể ném:

- IOException;
- ClassNotFoundException;
- các lỗi liên quan đến format hoặc class compatibility.

Không nên cast mù quáng dữ liệu đọc từ nguồn ngoài:

~~~java
UserProfile profile =
        (UserProfile) input.readObject();
~~~

Nếu bytes bị thay thế hoặc format không đúng, cast có thể lỗi. Với dữ liệu không tin cậy, vấn đề lớn hơn cast là quá trình deserialization itself có thể nguy hiểm.

## 26.4. serialVersionUID

serialVersionUID là định danh phiên bản serialization của class.

~~~java
private static final long serialVersionUID = 1L;
~~~

Khi deserialize, Java so sánh thông tin tương thích của class stream và class hiện tại. Nếu không tương thích, có thể ném InvalidClassException.

### Có nên khai báo tường minh không?

Nên khai báo explicit serialVersionUID khi class thật sự dùng Java serialization. Nếu không, compiler/runtime có thể sinh một giá trị mặc định dựa trên chi tiết class. Một thay đổi tưởng như nhỏ có thể làm UID thay đổi và khiến dữ liệu cũ không đọc được.

serialVersionUID không phải migration framework. Việc tăng hoặc giữ version phải đi cùng chiến lược tương thích field và dữ liệu.

## 26.5. transient và field không được serialize

Field transient bị bỏ qua bởi default serialization:

~~~java
public class SessionData implements Serializable {

    private static final long serialVersionUID = 1L;

    private final String username;
    private transient String accessToken;

    public SessionData(String username, String accessToken) {
        this.username = username;
        this.accessToken = accessToken;
    }
}
~~~

Sau deserialization, accessToken nhận default value của kiểu:

- reference: null;
- số: 0;
- boolean: false.

Static fields cũng không phải state của từng object nên không được lưu như instance state trong default serialization. Giá trị static lúc deserialize đến từ class đang chạy, không phải từ stream.

Không nên serialize:

- password;
- access token;
- refresh token;
- secret key;
- connection;
- thread;
- lock;
- resource handle;
- cache không cần thiết.

transient chỉ ngăn default serialization; nó không biến dữ liệu thành an toàn nếu bạn tự ghi secret trong writeObject().

## 26.6. Constructor và quá trình deserialization

Deserialization không đơn giản là gọi lại constructor public như new.

Với class serializable, constructor của class serializable thường không được gọi theo cách khởi tạo thông thường khi object được khôi phục. Constructor no-arg của superclass đầu tiên không implement Serializable được gọi để khởi tạo phần superclass đó.

Hệ quả:

- không đặt invariant quan trọng chỉ trong constructor rồi giả định deserialize luôn đi qua nó;
- phải validate dữ liệu trong readObject() nếu class dùng native serialization;
- không để object thoát ra ngoài trước khi state được kiểm tra;
- hiểu rằng final fields và private state có cơ chế đặc biệt của serialization.

Đây là một lý do khác khiến native serialization cần được thiết kế cẩn thận.

## 26.7. Custom writeObject() và readObject()

Class có thể cung cấp private methods đặc biệt để kiểm soát default serialization:

~~~java
private void writeObject(ObjectOutputStream output)
        throws IOException {
    output.defaultWriteObject();
    // ghi thêm dữ liệu theo format riêng nếu thật sự cần
}
~~~

~~~java
private void readObject(ObjectInputStream input)
        throws IOException, ClassNotFoundException {

    input.defaultReadObject();

    if (username == null || username.isBlank()) {
        throw new InvalidObjectException(
                "username must not be blank");
    }
}
~~~

readObject() là boundary nhận dữ liệu. Không được coi dữ liệu trong stream là hợp lệ chỉ vì compiler đã tạo ra nó.

Có thể dùng readResolve() hoặc writeReplace() cho một số mô hình đặc biệt, nhưng chúng làm serialization contract phức tạp hơn. Chỉ sử dụng khi hiểu rõ identity, singleton, proxy và compatibility.

## 26.8. Object graph, reference sharing và cycle

Java serialization có thể giữ quan hệ tham chiếu trong graph.

Nếu hai field cùng trỏ đến một object:

~~~java
Address address = new Address("Hanoi");
User first = new User("A", address);
User second = new User("B", address);
~~~

Khi graph được serialize trong cùng một stream, cơ chế có thể ghi reference sharing thay vì nhân bản tùy ý object đó.

Graph có cycle cũng không tự động đồng nghĩa infinite recursion của format, nhưng cycle vẫn có thể gây vấn đề bộ nhớ hoặc logic nếu graph cực lớn.

Khi thiết kế cache hoặc message, nên chọn DTO nhỏ, rõ schema thay vì serialize cả object graph domain với lazy references và dependency phức tạp.

## 26.9. Externalizable

Externalizable cho class toàn quyền xác định format thông qua:

- writeExternal(ObjectOutput out);
- readExternal(ObjectInput in).

~~~java
public class CompactUser implements Externalizable {

    private String username;
    private int level;

    public CompactUser() {
        // bắt buộc public no-arg constructor
    }

    public CompactUser(String username, int level) {
        this.username = username;
        this.level = level;
    }

    @Override
    public void writeExternal(ObjectOutput out)
            throws IOException {
        out.writeUTF(username);
        out.writeInt(level);
    }

    @Override
    public void readExternal(ObjectInput in)
            throws IOException {
        username = in.readUTF();
        level = in.readInt();
    }
}
~~~

Điểm cần nhớ:

- class phải có public no-arg constructor;
- method là public;
- thứ tự đọc phải khớp thứ tự ghi;
- class tự chịu trách nhiệm validation và compatibility;
- format tự định nghĩa dễ bị lỗi nếu versioning không được thiết kế.

Externalizable không tự động an toàn hơn Serializable. Nó vẫn có rủi ro deserialization và phụ thuộc vào input.

## 26.10. Rủi ro bảo mật của Java native serialization

Không deserialize bytes không tin cậy bằng ObjectInputStream.

Rủi ro gồm:

- gadget chains dẫn đến hành vi nguy hiểm;
- gọi logic trong quá trình khôi phục object;
- bypass assumptions của constructor;
- resource exhaustion qua graph sâu, mảng lớn hoặc nhiều references;
- lỗi tương thích và class loading;
- dữ liệu nhạy cảm bị lộ;
- denial of service;
- phụ thuộc classpath khiến attack surface lớn.

Nguồn dữ liệu không tin cậy gồm:

- HTTP request body;
- cookie hoặc session client;
- file upload;
- message queue không được xác thực;
- cache có thể bị sửa;
- dữ liệu từ tenant hoặc service khác không được bảo vệ.

Java 21 cung cấp ObjectInputFilter để giới hạn class, depth, array length, reference count hoặc tổng bytes. Filter là lớp phòng thủ quan trọng nhưng không biến arbitrary deserialization thành an toàn tuyệt đối. Chính sách tốt nhất vẫn là không dùng Java native serialization cho dữ liệu từ nguồn không tin cậy.

## 26.11. ObjectInputFilter

Ví dụ allow-list đơn giản:

~~~java
ObjectInputFilter filter =
        ObjectInputFilter.Config.createFilter(
                "com.example.dto.UserProfile;!*");

try (ObjectInputStream input =
         new ObjectInputStream(
             Files.newInputStream(Path.of("profile.bin")))) {

    input.setObjectInputFilter(filter);

    Object value = input.readObject();
}
~~~

Trong thực tế, filter cần được thiết kế theo toàn bộ object graph hợp lệ, không chỉ class gốc. Có thể kết hợp giới hạn:

~~~java
ObjectInputFilter filter = info -> {
    if (info.depth() > 10) {
        return ObjectInputFilter.Status.REJECTED;
    }

    if (info.references() > 1000) {
        return ObjectInputFilter.Status.REJECTED;
    }

    if (info.arrayLength() >= 0
            && info.arrayLength() > 1_000_000) {
        return ObjectInputFilter.Status.REJECTED;
    }

    return ObjectInputFilter.Status.UNDECIDED;
};
~~~

Không nên copy nguyên filter này vào production mà không lập threat model. Allow-list class và giới hạn kích thước thường an toàn hơn việc cho phép rộng rồi hy vọng input hợp lệ.

## 26.12. Vì sao nên hạn chế Java native serialization?

Native serialization có một số tiện ích trong hệ sinh thái Java, nhưng thường không phù hợp làm format giao tiếp mới vì:

- gắn chặt với Java class structure;
- khó tương thích giữa nhiều ngôn ngữ;
- schema evolution phức tạp;
- security history đáng lưu ý;
- khó quan sát và debug bằng công cụ phổ thông;
- object graph có thể lớn và vô tình kéo theo dependency;
- dễ serialize nhầm state nội bộ.

Trong backend hiện đại, thường cân nhắc:

| Nhu cầu | Lựa chọn thường gặp |
| ------- | ------------------- |
| REST API | JSON DTO |
| Message cross-language | JSON, Avro, Protocol Buffers hoặc format có schema |
| Cache | format có version và kiểm soát type |
| Internal Java-only legacy | Serializable với filter và migration plan |
| File export | CSV, JSON, XML, PDF hoặc format nghiệp vụ |

Jackson, Protobuf và các thư viện khác không thuộc Java SE; chúng cần được lựa chọn, cấu hình và cập nhật riêng. Quan trọng là không expose trực tiếp entity nội bộ chỉ vì serializer có thể làm điều đó.

## 26.13. Best practices cho Serialization

- Tránh deserialize dữ liệu không tin cậy.
- Nếu phải dùng, sử dụng allow-list ObjectInputFilter.
- Khai báo explicit serialVersionUID.
- Không serialize secret hoặc resource handle.
- Validate invariant trong readObject().
- Giữ payload nhỏ và schema rõ.
- Không serialize entity có lazy relation hoặc graph không giới hạn.
- Thiết kế versioning và migration cho dữ liệu lâu dài.
- Ưu tiên DTO và format có schema cho API/message.
- Log lỗi đủ để debug nhưng không log bytes hoặc credential.
- Xác định giới hạn depth, array length, references và tổng bytes.
- Test backward/forward compatibility trước khi lưu format lâu dài.

# PHẦN THỰC HÀNH VÀ ÔN TẬP

## Bài tập 1 — Copy text với charset rõ ràng

Viết method nhận Path source, Path target, đọc UTF-8 và ghi UTF-8 bằng buffering. Không load toàn bộ file vào một String.

Yêu cầu:

- tạo parent directory nếu cần;
- dùng try-with-resources;
- giữ nguyên line content;
- xử lý IOException.

## Bài tập 2 — Đếm file trong directory

Viết chương trình dùng Files.walk() để:

- chỉ lấy regular files;
- bỏ qua symbolic links;
- tính tổng dung lượng;
- đóng stream đúng cách;
- không làm crash toàn bộ chương trình nếu một entry không đọc được.

## Bài tập 3 — Upload an toàn

Thiết kế method:

~~~java
Path storeUpload(
        InputStream input,
        String originalFileName,
        long maxBytes
)
~~~

Hãy giải quyết:

- không dùng originalFileName làm path trực tiếp;
- chống path traversal;
- giới hạn bytes;
- ghi vào temporary file;
- move sang tên server sinh;
- cleanup nếu thất bại.

## Bài tập 4 — WatchService

Tạo watcher cho directory incoming:

- phát hiện file mới;
- chỉ xử lý .csv;
- không xử lý directory;
- rescan khi nhận OVERFLOW;
- dừng sạch khi thread bị interrupt.

## Bài tập 5 — Đánh giá Serialization

Giải thích vì sao không nên deserialize một byte[] nhận trực tiếp từ HTTP client bằng ObjectInputStream. Đề xuất JSON DTO hoặc một format có schema.

# CÂU HỎI PHỎNG VẤN

1. InputStream.read() trả int thay vì byte vì lý do gì?
2. Byte stream và character stream khác nhau thế nào?
3. Vì sao phải chỉ định Charset khi đọc/ghi text?
4. flush() có đảm bảo dữ liệu đã bền vững trên disk không?
5. Vì sao phải dùng try-with-resources?
6. Nếu body và close() cùng ném exception, exception nào là chính?
7. Files.readString() phù hợp với loại file nào?
8. Vì sao Files.lines() phải được đóng?
9. Files.list() có đệ quy không?
10. Files.walk() khác walkFileTree() thế nào?
11. normalize() có chống path traversal tuyệt đối không?
12. Path khác File thế nào?
13. CREATE khác CREATE_NEW thế nào?
14. APPEND có giải quyết toàn bộ vấn đề nhiều process ghi log không?
15. FileChannel.force() dùng để làm gì?
16. Vì sao phải gọi flip() trước khi đọc dữ liệu vừa put() vào ByteBuffer?
17. WatchService có bảo đảm không mất event không?
18. Serializable có phải functional interface không?
19. serialVersionUID dùng để làm gì?
20. transient ảnh hưởng thế nào đến deserialization?
21. Constructor có được gọi khi deserialize không?
22. Serializable và Externalizable khác nhau thế nào?
23. Vì sao không nên deserialize dữ liệu không tin cậy?
24. ObjectInputFilter giải quyết rủi ro nào?
25. Tại sao JSON/Protobuf thường phù hợp hơn Java native serialization cho backend?

# TỔNG KẾT PHẦN 8

Bạn cần ghi nhớ:

- I/O là giao tiếp với tài nguyên bên ngoài và luôn có latency, lỗi cùng resource lifetime.
- Byte streams dành cho dữ liệu nhị phân; Reader/Writer dành cho text.
- Text cần charset rõ ràng; UTF-8 thường là lựa chọn phổ biến cho dữ liệu liên hệ thống.
- Buffer giúp giảm số lần I/O nhỏ; flush() không đồng nghĩa durability.
- Try-with-resources đóng resource đúng cách và bảo toàn suppressed exceptions.
- Path và Files là API hiện đại cho filesystem.
- Files.readString() và readAllBytes() đọc toàn bộ dữ liệu, nên phải giới hạn kích thước.
- Files.list() và Files.walk() trả stream gắn với resource và phải được đóng.
- StandardOpenOption giúp diễn đạt rõ create, append, truncate và exclusive create.
- normalize() không tự biến path người dùng thành an toàn; phải chống traversal, symlink và TOCTOU.
- FileChannel và ByteBuffer cần hiểu partial read/write và state machine flip/clear/compact.
- WatchService là notification mechanism, không phải durable queue.
- Java native serialization gắn chặt với class, khó versioning và nguy hiểm với input không tin cậy.
- serialVersionUID, transient, validation và ObjectInputFilter chỉ có ý nghĩa khi serialization thật sự cần thiết.
- Đối với backend, ưu tiên streaming, giới hạn tài nguyên, authorization và format có schema.

## Tài liệu tham khảo

- [Java SE 21 API — Files](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Files.html)
- [Java SE 21 API — Path](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Path.html)
- [Java SE 21 API — FileChannel](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/channels/FileChannel.html)
- [Java SE 21 API — ByteBuffer](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/ByteBuffer.html)
- [Java SE 21 API — Watchable và WatchService registration](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/Watchable.html)
- [Java SE 21 API — FileVisitor và walkFileTree](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/nio/file/class-use/FileVisitor.html)
- [Java SE 21 API — Serializable](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/Serializable.html)
- [Java SE 21 API — ObjectInputStream](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputStream.html)
- [Java SE 21 API — ObjectInputFilter](https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/io/ObjectInputFilter.html)
- [Java SE 21 Security Developer's Guide](https://docs.oracle.com/en/java/javase/21/security/security-developer-guide.pdf)
