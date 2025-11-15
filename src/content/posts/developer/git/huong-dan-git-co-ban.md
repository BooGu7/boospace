---
title: Hướng Dẫn Git Cơ Bản - Các Lệnh và Thuật Ngữ Thông Dụng
published: 2025-09-15
description: Git là một hệ thống kiểm soát phiên bản (Version Control System - VCS) phổ biến nhất hiện nay, giúp quản lý mã nguồn hiệu quả khi làm việc nhóm hoặc cá nhân. Đối với người mới bắt đầu, Git có thể khá phức tạp, nhưng một khi bạn nắm vững các lệnh và thuật ngữ cơ bản, nó sẽ trở thành một công cụ rất hữu ích. Trong bài viết này, chúng ta sẽ tìm hiểu một số thuật ngữ và lệnh Git cơ bản kèm theo các ví dụ thực tế.
image: ./banner-git.png
tags:
  - Git
category: Web Developer
draft: false
---
Git là một hệ thống kiểm soát phiên bản (Version Control System - VCS) phổ biến nhất hiện nay, giúp quản lý mã nguồn hiệu quả khi làm việc nhóm hoặc cá nhân. Đối với người mới bắt đầu, Git có thể khá phức tạp, nhưng một khi bạn nắm vững các lệnh và thuật ngữ cơ bản, nó sẽ trở thành một công cụ rất hữu ích. Trong bài viết này, chúng ta sẽ tìm hiểu một số thuật ngữ và lệnh Git cơ bản kèm theo các ví dụ thực tế.

---

## **Thuật ngữ cơ bản trong Git**

### 1. **Repository (Repo)**

Repository hay Repo là một thư mục chứa toàn bộ dự án của bạn, bao gồm tất cả các tệp tin và các phiên bản lịch sử của chúng. Khi làm việc với Git, bạn sẽ lưu trữ mã nguồn của mình trong một repository để dễ dàng theo dõi thay đổi và chia sẻ với người khác.

- **Ví dụ:** Khi bạn khởi tạo một repo mới, Git sẽ theo dõi tất cả các thay đổi mà bạn thực hiện trong thư mục đó.

### 2. **Branch**

Branch là nhánh của phiên bản chính, giúp bạn làm việc trên các tính năng mới mà không ảnh hưởng đến mã nguồn chính (thường là branch `master` hoặc `main`). Sau khi hoàn thành, bạn có thể gộp (merge) các thay đổi từ branch phụ về branch chính.

- **Ví dụ:** Khi bạn làm việc trên một tính năng mới, bạn có thể tạo branch mới để thử nghiệm mà không làm gián đoạn dự án chính.

### 3. **Conflict (Xung đột)**

Conflict xảy ra khi hai hoặc nhiều thay đổi khác nhau được thực hiện trên cùng một tệp tin trong các branch khác nhau, và Git không thể tự động gộp (merge) chúng. Khi gặp conflict, bạn phải giải quyết thủ công bằng cách chọn phiên bản cần giữ lại.

- **Ví dụ:** Khi nhiều người cùng làm việc trên một dự án, xung đột có thể xảy ra khi cùng chỉnh sửa một dòng code.

### 4. **Local**

Local là các tệp và thay đổi trên máy tính cá nhân của bạn. Khi bạn thực hiện các thay đổi trong dự án, chúng sẽ được lưu ở local trước khi bạn đẩy (push) lên server hoặc remote repository.

- **Ví dụ:** Tất cả các thay đổi bạn thực hiện trên máy tính của mình đều thuộc về local cho đến khi chúng được đẩy lên GitHub hoặc một remote server khác.

### 5. **Remote**

Remote là các tệp và thay đổi được lưu trữ trên một server từ xa, chẳng hạn như GitHub, GitLab hoặc Bitbucket. Đây là nơi bạn chia sẻ mã nguồn với người khác.

- **Ví dụ:** Bạn có thể đẩy các thay đổi từ local lên remote repository để chia sẻ với các thành viên trong nhóm.

---

## **Các lệnh Git cơ bản**

### 1. **git init**

Lệnh này được sử dụng để khởi tạo một repo mới và trống. Nó cũng có thể chuyển một dự án hiện có thành repo Git:

```bash
git init
```

- **Ví dụ:** Khi bắt đầu một dự án mới, bạn dùng lệnh `git init` để Git theo dõi toàn bộ các thay đổi trong thư mục đó.

### 2. **git status**

Lệnh này giúp kiểm tra trạng thái của repo, hiển thị các tệp nào đã thay đổi và tệp nào chưa được lưu:

```bash
git status
```

- **Ví dụ:** Trước khi commit, bạn có thể dùng lệnh này để xem những thay đổi nào chưa được thêm vào staging area.

### 3. **git add**

Lệnh này chuẩn bị tệp để commit. Nó đưa tệp từ working directory (thư mục làm việc) vào staging area (khu vực chuẩn bị lưu trữ):

```bash
git add <filename>
```

Hoặc để thêm tất cả các tệp:

```bash
git add .
```

- **Ví dụ:** Nếu bạn đã thay đổi nhiều tệp trong dự án, thay vì thêm từng tệp, bạn có thể dùng `git add .` để thêm tất cả.

### 4. **git reset**

Lệnh này được sử dụng để hủy các thay đổi đã được thêm vào staging area nhưng chưa commit:

```bash
git reset <filename>
```

- **Ví dụ:** Nếu bạn lỡ thêm một tệp vào staging area nhưng sau đó không muốn commit tệp đó nữa, bạn có thể dùng `git reset` để bỏ tệp khỏi staging area.

### 5. **git commit -m 'message'**

Lệnh này lưu lại các thay đổi vào Git cùng với một tin nhắn mô tả ngắn gọn:

```bash
git commit -m "Initial commit"
```

- **Ví dụ:** Mỗi khi hoàn thành một tính năng hoặc sửa lỗi, bạn sẽ dùng `git commit` để lưu lại phiên bản hiện tại của dự án.

### 6. **git log**

Lệnh này hiển thị lịch sử các commit đã được thực hiện trong repo:

```bash
git log
```

- **Ví dụ:** Để xem các phiên bản cũ hoặc theo dõi lịch sử thay đổi của dự án, bạn có thể dùng `git log`.

### 7. **git checkout**

Lệnh này chuyển đổi giữa các branch trong repo:

```bash
git checkout <branch name>
```

- **Ví dụ:** Khi bạn muốn chuyển sang làm việc trên một branch khác, bạn có thể dùng `git checkout`.

### 8. **git merge**

Lệnh này dùng để gộp (merge) các thay đổi từ một branch khác vào branch hiện tại:

```bash
git merge <branch name>
```

- **Ví dụ:** Sau khi hoàn thành một tính năng trong branch phụ, bạn có thể gộp nó về branch `master`.

### 9. **git push**

Lệnh này đẩy các thay đổi từ local repository lên remote repository:

```bash
git push origin <branch name>
```

- **Ví dụ:** Sau khi commit, bạn có thể dùng `git push` để đẩy các thay đổi từ máy tính cá nhân lên GitHub.

### 10. **git clone**

Lệnh này sao chép một repo từ remote về local:

```bash
git clone <repo url>
```

- **Ví dụ:** Khi muốn tải mã nguồn từ GitHub về máy tính, bạn sẽ dùng lệnh `git clone`.

---

### **Tạo file .gitignore**

Đôi khi bạn không muốn đẩy một số tệp cụ thể lên remote repository (như tệp cấu hình hoặc thư viện). Để làm điều này, bạn tạo file `.gitignore` và thêm tên tệp hoặc thư mục mà bạn muốn bỏ qua vào file đó.

```bash
touch .gitignore
```

- **Ví dụ:** Nếu bạn muốn bỏ qua file `.env`, bạn chỉ cần thêm tên file đó vào `.gitignore`.

---

Bài viết này đã giới thiệu một cách cơ bản về Git, bao gồm các thuật ngữ và lệnh quan trọng. Khi nắm vững Git, bạn sẽ có thể quản lý dự án một cách hiệu quả và dễ dàng hợp tác với người khác. Hãy luyện tập với Git trong các dự án thực tế để hiểu sâu hơn cách nó hoạt động.

---

**Xem thêm thông tin:**

- Trang chủ: [Boo Space](https://boospace.tech)
- Kho tài nguyên: [Boo Space Gumroad](https://boospace.gumroad.com)
- Các sản phẩm kèm theo: [Linktr](https://linktr.ee/boospace)