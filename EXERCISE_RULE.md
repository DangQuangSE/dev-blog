# Rules and Guidelines for Exercise Posts ("Bài tập")

## 1. Introduction

This document governs the **"Bài tập" (Exercises)** section of the blog — a place to store practice exercises submitted by the author (đề bài + đáp án), distinct from `BLOG_RULE.md` which governs pure-theory "Kiến thức" posts and from the project-build-log posts under "Dự án". An exercise post is a single file that contains **both** the problem statement and its solution — never split into two files.

Read this document alone before adding any exercise post. It is self-sufficient: you should not need to inspect other exercise posts to understand the required format (though a worked example is included below).

## 2. Objectives

- Store practice exercises (DSA/LeetCode-style, SQL, system design, backend, ...) with their solutions in one place.
- Keep exercise posts fully separable from theory posts and project posts — no mixing in filtered lists.
- Guarantee format consistency across exercises submitted over many separate sessions, without relying on any automated linting (none exists in this repo).

## 3. Content Structure

Exercises live under `content/exercises/`, split into topic subfolders — created on demand, no fixed list:

```
/content/exercises
|
├── /dsa
|   ├── 01-two-sum.md
|   └── 02-...
├── /sql
|   ├── 01-...
|   └── ...
└── /system-design
    └── ...
```

- **`content/exercises`**: root directory for all exercise posts.
- **Topic subfolder**: one per subject area (`dsa`, `sql`, `system-design`, `backend`, ...). Create a new subfolder the first time an exercise of that type is submitted — do not pre-create empty ones.
- **File naming**: lowercase, hyphen-separated, optionally prefixed with a two-digit number for ordering within the topic (e.g. `01-two-sum.md`, `02-group-anagrams.md`), matching the convention in `BLOG_RULE.md`.

## 4. Rules for Adding a New Exercise (For AI)

When the user sends a đề bài + đáp án and asks to add it as an exercise, follow these rules exactly:

### 4.1 Determine Topic and Path

1. Identify the topic (e.g. `dsa`, `sql`, `system-design`). If it doesn't map cleanly to an existing subfolder under `content/exercises/`, create a new one — topics are open-ended by design.
2. Determine the next numeric prefix within that topic folder (highest existing + 1, or `01` if the folder doesn't exist yet).
3. Filename is based on the exercise title: lowercase, no accents, words joined by hyphens (e.g. `03-longest-substring.md`).

### 4.2 No YAML Frontmatter

Do **not** use YAML frontmatter (`---` blocks). This matches every other post on this site — metadata lives inline in the markdown body, and page-level metadata (title/date/description) lives in `posts.js`, not in the file itself.

### 4.3 Required Metadata Block

Immediately after the `#` title, before `## Đề bài`, include a metadata block in this exact form:

```markdown
**Độ khó:** {Dễ | Trung bình | Khó}
**Nguồn:** {LeetCode #N - Tên bài, hoặc "Tự biên soạn", hoặc "Phỏng vấn công ty X", ...}
**Tags:** {tag1, tag2, tag3}
```

- **Độ khó** must be exactly one of `Dễ`, `Trung bình`, `Khó` — no English substitutes (`Easy`/`Medium`/`Hard`), no other free text. This is a closed enum; do not invent a fourth value.
- **Nguồn** is free text but must always be present, even if it's just `Tự biên soạn`.
- **Tags** is a comma-separated list of relevant topics/techniques (e.g. `Array, Hash Table` or `SQL, Window Function`).

### 4.4 Required Sections (in this exact order)

1. `## Đề bài` — the problem statement, verbatim or lightly cleaned up from what the user sent.
2. `## Ràng buộc & Ví dụ` — constraints and example input/output.
3. `## Đáp án` — the solution, as a fenced code block with the language tag matching whatever language fits the exercise (Java for DSA-style by convention since that's the blog's baseline language, `sql` for SQL exercises, or omitted entirely for exercises with no code — e.g. pure system-design questions).
4. `## Giải thích` — explanation of why the solution works, the approach/algorithm used.
5. `## Độ phức tạp` — Time/Space complexity. **Omit this section entirely** (do not include it with "N/A") when complexity analysis doesn't apply — e.g. SQL exercises, system-design questions with no single algorithmic complexity to state.

### 4.5 Category Naming for `posts.js` (Critical — Prevents Collisions)

Every exercise entry registered in `posts.js` **must** use a category prefixed with `exercise-`, in the form `exercise-{topic}`:

```javascript
{
    category: "exercise-dsa",              // ✅ correct — prefixed, distinct from theory categories
    date: "YYYY-MM-DD",
    title: "[NN] {Tên bài toán}",
    path: "content/exercises/dsa/01-two-sum.md",
    description: "{Tóm tắt ngắn gọn đề bài và hướng giải}"
}
```

**Wrong** — never reuse an existing theory category name or a bare topic name without the prefix:

```javascript
{
    category: "data-structures",   // ❌ wrong — collides with theory posts, they'll mix in the same filtered list
    // ...
}
{
    category: "dsa",               // ❌ wrong — missing the "exercise-" prefix
    // ...
}
```

The `exercise-` prefix is what keeps `posts.html?category=exercise-dsa` from ever mixing with the theory-post filter for `data-structures`, `java`, `springboot`, etc.

### 4.6 Publish Flow

1. Determine topic/path per §4.1, confirm with the user if the topic is new or ambiguous.
2. Write the `.md` file per §4.2–§4.4.
3. Wait for the user to confirm content is good.
4. Add the corresponding entry to `posts.js` per §4.5.
5. Confirm the topic tile exists on `exercises.html` (add one if this is the first exercise for that topic — copy the existing tile-block pattern).

## 5. Worked Example

The following is a complete, valid exercise post — use it as the pattern to match. This exact content is what a file at `content/exercises/dsa/01-two-sum.md` should look like:

---

````markdown
# Two Sum

**Độ khó:** Dễ
**Nguồn:** LeetCode #1 - Two Sum
**Tags:** Array, Hash Table

## Đề bài

Cho một mảng số nguyên `nums` và một số nguyên `target`, hãy trả về chỉ số (index) của hai phần tử trong mảng sao cho tổng của chúng bằng `target`.

Giả định mỗi đầu vào có đúng một lời giải, và không được dùng cùng một phần tử hai lần.

## Ràng buộc & Ví dụ

- `2 <= nums.length <= 10^4`
- `-10^9 <= nums[i] <= 10^9`
- Chỉ tồn tại đúng một cặp đáp án hợp lệ.

**Ví dụ:**

```
Input: nums = [2,7,11,15], target = 9
Output: [0,1]
Giải thích: nums[0] + nums[1] = 2 + 7 = 9
```

## Đáp án

```java
public int[] twoSum(int[] nums, int target) {
    Map<Integer, Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) {
        int complement = target - nums[i];
        if (seen.containsKey(complement)) {
            return new int[] { seen.get(complement), i };
        }
        seen.put(nums[i], i);
    }
    throw new IllegalArgumentException("No solution found");
}
```

## Giải thích

Duyệt mảng một lần, với mỗi phần tử `nums[i]`, tính phần bù `complement = target - nums[i]`. Nếu `complement` đã xuất hiện trong `HashMap` (nghĩa là ta đã gặp nó ở một chỉ số trước đó), ta có ngay cặp đáp án. Nếu chưa, lưu `nums[i]` cùng chỉ số của nó vào map để các phần tử sau có thể tra cứu.

Cách này tránh được việc phải duyệt lồng hai vòng lặp (brute force O(n²)) bằng cách đánh đổi thêm bộ nhớ (HashMap) để tra cứu độ phức tạp O(1).

## Độ phức tạp

- **Thời gian:** O(n) — duyệt mảng một lần.
- **Không gian:** O(n) — trong trường hợp xấu nhất, HashMap lưu tất cả n phần tử trước khi tìm được cặp đáp án.
````

---

By following the rules above, every exercise post added — regardless of which AI session writes it — will stay structurally and visually consistent with the rest of the blog.
