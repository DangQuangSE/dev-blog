# Rules and Guidelines for Personal Blog

## 1. Introduction

This is a personal blog project created to synthesize and systematize programming knowledge. This blog will be a simple landing page where posts are organized for easy lookup and review. The project does not require complex social features.

## 2. Objectives

- Create a place to store personal knowledge.
- Systematize knowledge by programming language and framework.
- Practice writing and presenting technical documentation.
- Build a simple portfolio page to showcase learned knowledge.

## 3. Content Structure

The blog content will be organized in the `content` directory. The structure is designed to be flexible to accommodate both broad topics and in-depth sub-topics.

```
/content
|
├── /programming-languages
|   ├── /javascript
|   |   ├── 01-getting-started.md
|   |   └── 02-es6-features.md
|   └── /...
|
└── /frameworks
    ├── /springboot
    |   ├── 01-project-configuration.md
    |   ├── 02-understanding-beans.md
    |   ├── /spring-security
    |   |   ├── 01-introduction.md
    |   |   └── 02-jwt-authentication.md
    |   └── ...
    └── /...
```

- **`content`**: The root directory containing all posts.
- **`programming-languages`**: Contains posts about pure programming languages.
- **`frameworks`**: Contains posts about frameworks and libraries.
- **Sub-directories**: Each language or framework will have its own directory. For complex topics like `springboot`, you can create further sub-directories (e.g., `spring-security`) to organize content logically.
- **File Naming**: Post filenames (`.md`) should be lowercase, use hyphens, and can be prefixed with numbers (e.g., `01-`, `02-`) to maintain a specific order.

## 4. Rules for Adding a New Post (For AI)

When I ask to "Add theory about [topic] to the blog," please follow these rules:

1.  **Determine the Category and Path**:
    - Ask me for the main category ("Programming Language" or "Framework") and the specific topic (e.g., `javascript`, `springboot`).
    - Ask if the post belongs in a sub-topic folder (e.g., `springboot/spring-security`).
    - Based on the answer, determine the full directory path. If any directory in the path does not exist, create it.

2.  **Create Markdown File**:
    - Create a new `.md` file in the determined directory.
    - The filename must be based on the post title, lowercase, without accents, and words connected by hyphens (e.g., `01-introduction-to-spring-security.md`).

3.  **Post Content**:
    - Each post must have a clear structure, using Markdown tags (`#`, `##`, `*`, `**`, `` ` ``, ` ``` `).
    - **Yêu cầu chuyên sâu**: Mỗi bài viết lý thuyết cần bao gồm:
        - **Nguồn gốc/Lý do ra đời**: Tại sao công nghệ/khái niệm này xuất hiện? Nó giải quyết vấn đề gì của quá khứ?
        - **So sánh với cách làm cũ**: Trước khi có nó, lập trình viên đã giải quyết vấn đề đó như thế nào? (Ví dụ: Lập trình thủ tục vs Hướng đối tượng).
        - **Rủi ro khi không áp dụng**: Nếu không sử dụng hoặc sử dụng sai, hệ thống sẽ gặp phải những vấn đề gì? (Bug, khó mở rộng, tốn tài nguyên...).
    - **Main title**: Use `#` for the post title.
    - **Major sections**: Use `##` for the main sections of the post.
    - **Source code**: Code snippets must be placed in a ` ``` ` block with the language name (e.g., ` ```java `).
    - **Terminology**: Technical terms or function/variable names should be enclosed in backticks `` ` ``.

4.  **Automatic UI Update**:
    - Sau khi người dùng xác nhận nội dung file `.md` đã ổn, AI phải tự động cập nhật file `index.html` (hoặc trang danh sách tương ứng).
    - Tạo một thẻ `<article>` (Post Card) mới với đầy đủ thông tin: `data-category`, tiêu đề, mô tả ngắn, ngày tháng và đường dẫn đến `reader.html?post=[path_to_file]`.
    - Đảm bảo thẻ mới được đưa lên đầu danh sách bài viết để hiển thị là bài mới nhất.

5.  **Example workflow**:
    - **Me**: "Add a post about JWT Authentication in Spring Security."
    - **AI**: "This post will be added under the path `content/frameworks/springboot/spring-security/`. The filename will be `02-jwt-authentication.md`. Do you agree?"
    - **Me**: "I agree."
    - **AI**: (Tạo file `.md`, viết nội dung và đợi người dùng feedback).
    - **Me**: "Nội dung rất tốt, hãy xuất bản nó."
    - **AI**: (Tự động cập nhật thẻ bài viết vào `index.html` và thông báo hoàn tất).

## 5. Recommended Technologies

This project can be implemented using the following technologies to create a fast, and easy-to-maintain static blog:

- **Static Site Generator (SSG)**:
  - **Next.js (React)**: Powerful, flexible, good for SEO.
  - **Nuxt.js (Vue)**: Similar to Next.js but for the Vue ecosystem.
  - **Hugo**: Extremely fast, written in Go, uses simple templates.
  - **Jekyll**: Popular, well-integrated with GitHub Pages.
- **Styling**:
  - **Tailwind CSS**: A utility-first CSS framework that helps build interfaces quickly.
  - **CSS Modules**: Helps encapsulate CSS for each component.
- **Deployment**:
  - **Vercel**: Optimized for Next.js, with built-in CI/CD.
  - **Netlify**: Very powerful for SSG projects, easy to use.
  - **GitHub Pages**: Free, suitable for simple projects.

By following the rules above, we can build and develop the blog consistently and effectively.
