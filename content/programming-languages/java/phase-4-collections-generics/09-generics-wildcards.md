# [09] Phase 4 - Collections & Generics: Generics, Type Erasure & Wildcards

## 1. Nguồn gốc và lý do ra đời của Generics trong Java

### Sự nguy hiểm của việc ép kiểu ép buộc (Casting) trong Java 1.4
Trước Java 5 (năm 2004), các lớp Collection chỉ lưu trữ kiểu dữ liệu chung nhất là `Object`.
- **Hạn chế**: Khi lấy dữ liệu ra khỏi Collection, bạn bắt buộc phải ép kiểu (Cast) thủ công về kiểu dữ liệu mong muốn. Nếu bạn vô tình đưa một đối tượng kiểu `Integer` vào một `List` vốn dĩ chỉ nên chứa `String`, trình biên dịch hoàn toàn không báo lỗi. Lỗi chỉ phát nổ tại thời điểm chạy (Runtime) dưới dạng ngoại lệ `ClassCastException`.

### Giải pháp: Generics (Java 5)
Generics được giới thiệu để mang lại khả năng tham số hóa kiểu dữ liệu (Parameterized Types).
- **Lợi ích**: Giúp trình biên dịch phát hiện lỗi sai kiểu dữ liệu ngay tại thời điểm biên dịch (Compile-time type safety), loại bỏ hoàn toàn việc ép kiểu thủ công rườm rà.

---

## 2. So sánh và Cơ chế Hoạt động bên dưới (Under the Hood)

### a) Cơ chế Xóa kiểu (Type Erasure)
Để đảm bảo tính tương thích ngược với các phiên bản Java cũ hơn (nơi không có Generics), Java áp dụng cơ chế **Type Erasure**:
- Khi biên dịch chương trình, trình biên dịch Java sẽ kiểm tra tính an toàn của kiểu dữ liệu.
- Sau khi kiểm tra xong, nó sẽ **xóa sạch** tất cả các thông tin về kiểu generic (như `<T>` hoặc `<String>`) và thay thế bằng kiểu gốc (thường là `Object` hoặc kiểu biên đầu tiên như `Number`).
- Tại thời điểm Runtime, JVM không hề biết đến sự tồn tại của kiểu Generic. Tất cả đều là `Object` hoặc lớp thô (Raw Type).

### b) Wildcard và Nguyên tắc vàng PECS (Producer Extends, Consumer Super)
Ký tự đại diện `?` được dùng khi ta không biết rõ kiểu cụ thể.
- **`? extends T` (Upper Bounded Wildcard)**: Đại diện cho bất kỳ kiểu nào là con của `T`. Phù hợp khi bạn chỉ đọc dữ liệu từ Collection đó ra (Collection đóng vai trò là nhà sản xuất - **Producer**).
- **`? super T` (Lower Bounded Wildcard)**: Đại diện cho bất kỳ kiểu nào là cha của `T`. Phù hợp khi bạn muốn ghi thêm dữ liệu vào Collection đó (Collection đóng vai trò là nơi tiêu thụ - **Consumer**).
- **PECS Rule**: *Producer Extends, Consumer Super*.

---

## 3. Rủi ro khi lập trình Generics sai cách

1. **Sử dụng Lớp thô (Raw Types)**: Khai báo `List list = new ArrayList();` thay vì chỉ định kiểu cụ thể. Điều này vô hiệu hóa hoàn toàn cơ chế kiểm soát kiểu của Generics, đưa code trở lại thời kỳ Java 1.4 đầy rủi ro.
2. **Không thể khởi tạo mảng hoặc thực thể Generic trực tiếp**: Do cơ chế xóa kiểu (Type Erasure), bạn không thể viết code dạng `T obj = new T();` hoặc `T[] array = new T[10];` vì tại Runtime, JVM không biết kiểu cụ thể của `T` là gì để cấp phát bộ nhớ tương ứng.
   - *Khắc phục*: Phải truyền đối tượng `Class<T>` vào để dùng Reflection khởi tạo.

---

## 4. Code ví dụ minh họa chi tiết

```java
import java.util.ArrayList;
import java.util.List;

public class GenericsDemo {

    // 1. Generic Class
    static class Box<T> {
        private T value;

        public void set(T value) {
            this.value = value;
        }

        public T get() {
            return value;
        }
    }

    // Lớp cha và con phục vụ ví dụ PECS
    static class Animal {
        public void makeSound() { System.out.println("Animal sound"); }
    }
    
    static class Dog extends Animal {
        @Override
        public void makeSound() { System.out.println("Woof Woof"); }
    }

    // 2. Minh họa Producer Extends (Chỉ đọc dữ liệu ra)
    public static void printAnimalSounds(List<? extends Animal> animals) {
        for (Animal animal : animals) {
            animal.makeSound(); // Đọc an toàn vì chắc chắn phần tử là con của Animal
            // animals.add(new Dog()); // BÁO LỖI BIÊN DỊCH: Không thể ghi thêm phần tử mới
        }
    }

    // 3. Minh họa Consumer Super (Chỉ ghi dữ liệu vào)
    public static void addDogs(List<? super Dog> dogConsumerList) {
        dogConsumerList.add(new Dog()); // Ghi an toàn vì danh sách chứa kiểu cha của Dog
        // Object obj = dogConsumerList.get(0); // Chỉ đọc ra được kiểu Object chung nhất
    }

    public static void main(String[] args) {
        // Sử dụng Generic Class
        Box<String> stringBox = new Box<>();
        stringBox.set("Hello Generics");
        String val = stringBox.get(); // Không cần ép kiểu thủ công
        System.out.println("Box value: " + val);

        // Minh họa PECS
        List<Dog> dogs = new ArrayList<>();
        dogs.add(new Dog());
        
        // dogs là List<Dog>, truyền vào hàm nhận List<? extends Animal> -> Hợp lệ (Producer)
        printAnimalSounds(dogs);

        List<Animal> animals = new ArrayList<>();
        // animals là List<Animal>, truyền vào hàm nhận List<? super Dog> -> Hợp lệ (Consumer)
        addDogs(animals);
        System.out.println("Số lượng động vật sau khi add: " + animals.size());
    }
}
```
