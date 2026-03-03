---
title: Các Thuật Ngữ LLM Quan Trọng Mà Developer Nên Biết
published: 2026-03-03
description: Khi làm việc với các Large Language Model (LLM), chúng ta thường xuyên bắt gặp những thuật ngữ như Parameters, Context Size, Tokens, Temperature. Hiểu rõ những khái niệm này không chỉ giúp chúng ta giao tiếp hiệu quả hơn với mô hình mà còn là chìa khóa để tối ưu hóa hiệu suất.
image: ./banner.png
tags:
  - LLM
  - AI
  - Developer
category: Web Developer
draft: false
---

Khi làm việc với các Large Language Model (LLM), chúng ta thường xuyên bắt gặp những thuật ngữ như **"Parameters"**, **"Context Size"**, **"Tokens"**, **"Temperature"**,... Hiểu rõ những khái niệm này không chỉ giúp chúng ta giao tiếp hiệu quả hơn với mô hình mà còn là chìa khóa để tối ưu hóa hiệu suất và nhận output đầu ra đúng như mong muốn.

Bài viết này sẽ giúp bạn dễ dàng nắm bắt được các thuật ngữ quan trọng khi sử dụng LLM.

---

## **1. Parameter**

Khi bạn bắt gặp một model được gắn nhãn **70B**, điều đó nghĩa là nó có **70 tỷ tham số**.

### Khái niệm

**Tham số (parameters)** là các trọng số (weights) và độ lệch (biases) mà mạng nơ-ron học được trong quá trình huấn luyện. Số lượng tham số càng lớn, model càng có khả năng nhận diện và xử lý các mẫu dữ liệu phức tạp, đồng nghĩa với việc model "thông minh" hơn.

- **Ví dụ:** Grok-1 với **314 tỷ tham số** là minh chứng cho một model cực kỳ phức tạp.

### Hiệu năng & Chi phí

Model càng lớn (nhiều tham số) thì chất lượng đầu ra thường tốt hơn, nhưng đồng thời yêu cầu phần cứng mạnh để thực thi (inference) và chi phí vận hành cao hơn.

### Self-Hosting vs. API

| Model Size | Khuyến nghị |
|------------|-------------|
| **7B** | Có thể chạy trên một GPU cao cấp, phù hợp để tự triển khai (self-hosting) |
| **70B** | Gần như bắt buộc phải sử dụng dịch vụ cloud chuyên dụng (Vertex AI, SageMaker) hoặc truy cập qua API |

> **💡 Mẹo:** Nếu chạy self-host trên 1 server GPU thì nên lựa chọn những model nhỏ hơn 10B tham số.

### Sự đánh đổi

Chọn giữa model lớn hay nhỏ luôn là bài toán cân bằng giữa:
- ✅ Chất lượng
- ✅ Tốc độ
- ✅ Chi phí
- ✅ Tính kiểm soát

---

## **2. Token**

**Token** là đơn vị nhỏ nhất mà LLM sử dụng để phân tích và tạo ra văn bản. Trước khi xử lý, toàn bộ input của bạn sẽ được chia nhỏ thành các token.

### Quy ước chung

Trong tiếng Anh, người ta thường ước tính:
- **1 token ≈ 0.75 từ** hoặc **4 ký tự**

### Thực tế kỹ thuật

Đối với developer, việc dựa vào quy ước trên là không đủ chính xác. Quá trình **"tokenization"** (phân tách thành token) phức tạp hơn:

```plaintext
"model"       → ["model"]           // 1 token
"Tokenization" → ["Token", "ization"] // 2 tokens
```

Các dấu câu, khoảng trắng, và ký tự đặc biệt cũng thường được tính là các token riêng biệt.

> **⚠️ Lưu ý:** Nhiều LLM như Google Gemini đã cố gắng tối ưu xử lý bằng cách bỏ đi các kí tự xuống dòng không cần thiết trong file code gốc. Điều này ảnh hưởng đến file diff mà bạn nhận về, hoàn toàn không khớp với file code gốc ban đầu, dẫn đến việc apply diff bị lộn dòng.

---

## **3. Context Window (Context Length)**

**Context window** (hay context length) là số token tối đa mà model có thể "ghi nhớ" trong một lần xử lý, bao gồm cả phần prompt và câu trả lời.

### Ví dụ

| Model | Context Window |
|-------|----------------|
| GPT-3.5 | 4,096 tokens |
| GPT-4 Turbo | 128,000 tokens |
| Claude 3 | 200,000 tokens |

### Trong IDE lập trình AI (như Cursor)

Context Window chính là "phạm vi hiểu biết" của AI tại một thời điểm. Nó quyết định AI có thể "nhìn thấy" bao nhiêu phần code và cuộc trò chuyện của bạn.

**Những thứ được đóng gói vào Context:**

1. **Câu lệnh của bạn:** "Tìm bug trong function này"
2. **Đoạn code bạn đang mở:** Toàn bộ file `main.py` bạn đang xem
3. **Các file/folder bạn "tag" vào:** Khi bạn gõ `@` và chọn một file khác
4. **Lịch sử cuộc trò chuyện:** Những câu hỏi và câu trả lời trước đó
5. **Terminal output, Linter warnings...**

### Ví dụ thực tế

Giả sử bạn hỏi AI: *"Refactor lại hàm `handlePayment` trong file `paymentController.js` để nó clean hơn và xử lý được lỗi khi gọi API thanh toán."*

| Thành phần | Tokens |
|------------|--------|
| File `paymentController.js` | 1,500 |
| File `apiClient.js` | 1,000 |
| File `errorHelper.js` | 800 |
| Lịch sử chat + câu lệnh | 200 |
| **Tổng cộng** | **3,500 tokens** |

---

## **4. Temperature**

**Temperature** là một tham số cho phép bạn kiểm soát mức độ ngẫu nhiên trong câu trả lời của mô hình, thường nằm trong khoảng từ **0 đến 2**.

### Cách hoạt động

LLM tạo ra câu trả lời bằng cách dự đoán từ tiếp theo có xác suất xuất hiện cao nhất. Ví dụ, với câu *"Bầu trời hôm nay..."*, các lựa chọn có thể là:

| Lựa chọn | Xác suất |
|---------|----------|
| "trong xanh" | 90% |
| "quang đãng" | 8% |
| "thật đẹp" | 1.5% |
| "đang bốc cháy" | 0.001% |

### Điều chỉnh Temperature

| Temperature | Hành vi | Trường hợp sử dụng |
|-------------|---------|---------------------|
| **Thấp (0.1)** | Chọn từ có xác suất cao nhất | Code, phân tích, trả lời factual |
| **Cao (1.5)** | Tăng cơ hội cho từ ít phổ biến | Sáng tạo, brainstorm, viết story |

> **💡 Tóm lại:** Temperature không làm thay đổi kiến thức của mô hình, mà chỉ tác động đến mức độ ngẫu nhiên khi lựa chọn câu chữ dựa trên những gì đã học.

---

## **5. Hallucination**

**Hallucination** là hiện tượng khi một mô hình ngôn ngữ lớn (LLM) tạo ra thông tin không chính xác, không có thật, hoặc không liên quan đến ngữ cảnh được cung cấp, nhưng lại trình bày nó một cách tự tin và mạch lạc như thể đó là sự thật.

### Tại sao xảy ra?

Hallucination xảy ra do LLM hoạt động dựa trên **dự đoán xác suất** chứ không phải cơ sở dữ liệu truy vấn sự thật. Khi nhận câu hỏi, model không đi tìm kiếm thông tin mà chỉ dự đoán token tiếp theo dựa trên các mẫu ngôn ngữ đã học.

Nếu gặp chủ đề thiếu dữ liệu chính xác, model sẽ tự "lấp chỗ trống" bằng những câu trả lời nghe có vẻ hợp lý, ưu tiên sự mạch lạc thay vì tính đúng đắn.

> **Nói đơn giản:** AI không biết nó nói sai mà chỉ đang tạo ra văn bản xác suất cao nhất có thể.

### Cách giảm thiểu Hallucination

#### 1. Cung cấp Ngữ cảnh (Grounding) - Kỹ thuật RAG

Đây là phương pháp hiệu quả nhất. Thay vì để AI "tự nhớ", hãy cung cấp cho nó "tài liệu tham khảo" ngay trong câu lệnh. Kỹ thuật này được gọi là **Retrieval-Augmented Generation (RAG)**.

#### 2. Kỹ thuật Prompt Engineering

```plaintext
❌ "Hãy trả lời câu hỏi này..."
✅ "Hãy trả lời dựa trên tài liệu X, không được bịa đặt thông tin."
✅ "Nếu bạn không chắc chắn, hãy nói là bạn không biết."
```

#### 3. Điều chỉnh Temperature

Thiết lập **temperature = 0** hoặc giá trị thấp (0.1, 0.2). Mô hình sẽ đưa ra câu trả lời dễ đoán, an toàn và bám sát vào các thông tin có xác suất cao nhất.

---

## **Kết luận**

Vậy là chúng ta đã cùng điểm qua khái niệm của **5 thuật ngữ quan trọng** khi làm việc với LLM. Trong thực tế, các khái niệm này không hoạt động riêng lẻ:

Bạn thiết kế một prompt bằng **Token**, đảm bảo nó nằm gọn trong **Context Window**. Sau đó tinh chỉnh **Temperature** để kiểm soát độ tin cậy của đầu ra. Tất cả những điều đó nhằm khai thác sức mạnh của hàng tỷ **Parameter** một cách tối ưu, đồng thời xây dựng các hàng rào kỹ thuật (như RAG) để vô hiệu hóa **Hallucination**.

---

**Xem thêm thông tin:**

- Trang chủ: [Boo Space](https://boospace.tech)
- Kho tài nguyên: [Boo Space Gumroad](https://boospace.gumroad.com)
- Các sản phẩm kèm theo: [Linktr](https://linktr.ee/boospace)
