---
title: Thử Nghiệm Chạy Một Tỷ Request Với 5 Web Framework Phổ Biến
published: 2026-03-05
description: Bài test này không phải một benchmark đơn giản. Tác giả đã dựng một môi trường production thực tế, kết nối đầy đủ observability, và stress test bằng wrk2, k6. Mục tiêu là xem thử framework nào thực sự sống sót khi gặp tải lớn.
image: ./banner.png
tags:
  - Benchmark
  - Web Framework
  - Performance
  - Go
  - Rust
  - Node.js
category: Web Developer
draft: false
---

Bài test này không phải một benchmark đơn giản. Tác giả đã dựng một môi trường production thực tế, kết nối đầy đủ observability, và stress test bằng wrk2, k6. Mục tiêu là xem thử framework nào thực sự sống sót khi gặp tải lớn (massive load).

Mặc dù các chỉ số như RPS và RSS giúp đánh giá hiệu năng framework, đây không phải là yếu tố duy nhất khi chọn web framework cho dự án. Bên cạnh hiệu năng, các yếu tố như hệ sinh thái, cộng đồng, tốc độ phát triển, khả năng bảo trì, mức độ phù hợp với đội ngũ và dự án cũng rất quan trọng.

Do đó, kết quả benchmark chỉ nên xem là một phần dữ liệu tham khảo, thay vì tiêu chí duy nhất để lựa chọn công nghệ. Quyết định cuối cùng cần cân bằng giữa nhiều yếu tố để phù hợp với mục tiêu và nguồn lực thực tế.

---

## **1. Năm framework được đưa vào thử nghiệm**

Lineup được chọn bao gồm 5 framework phổ biến, đã được kiểm nghiệm thực chiến, và rất được ưa chuộng bởi developer vào năm 2025:

- **Go (Gin)**: Gọn nhẹ, compiled, nổi tiếng về tốc độ
- **Rust (Actix-Web)**: Memory-safe, kiểm soát low-level tốt, luôn đứng đầu nhiều bảng xếp hạng benchmark
- **Node.js (Fastify)**: Asynchronous, JavaScript-native, tối ưu hóa tốc độ
- **Python (FastAPI)**: Thân thiện với developer, async-aware
- **Java (Spring Boot)**: Quen thuộc với enterprise, mạnh mẽ nhưng khá ngốn RAM

Mỗi framework đều được test với một REST endpoint cơ bản, sát thực tế: parse JSON, truy cập database (PostgreSQL) và trả về JSON response.

---

## **2. Kịch bản Test**

### Hạ tầng

- VM 4 core, 16GB RAM trên GCP
- Tất cả service được deploy qua Docker container
- PostgreSQL được sử dụng với connection pooling
- wrk2 được sử dụng cho load testing với constant rate
- Tải được tăng dần từ 100 đến 100,000 RPS (requests per second), tổng cộng 1 tỷ request

### Metrics được monitor

- Requests per second
- Latency ở percentile 95 và 99
- Memory usage (RSS)
- CPU utilization
- Error rate under pressure
- Connection handling và resilience

---

## **3. Kết quả thử nghiệm**

### **3.1 Go (Gin)**

Gin gần như không hề gặp bất cứ vấn đề gì. Duy trì hơn **100,000 RPS** với latency luôn dưới **10ms**. Garbage collector không gây ra sự cố nào đáng kể, memory luôn dưới **200MB**.

- **Điểm mạnh:** Memory footprint cực nhỏ, JSON serialization rất nhanh, latency tăng rất ít khi chịu tải
- **Điểm yếu:** Mặc dù hệ sinh thái của Go đang phát triển, những chưa đa dạng và phong phú bằng một số ngôn ngữ có lịch sử lâu đời hơn như Java hay Python trong một số lĩnh vực chuyên biệt. Tuy nhiên, trong các ứng dụng backend và hệ thống, Go có một hệ sinh thái rất tốt.

### **3.2 Rust (Actix-Web)**

Actix-Web của Rust thậm chí còn nhanh hơn Go và cho tail latency thấp nhất. Ở mức 99th percentile, Actix vượt qua mọi framework khác. Tuy nhiên, cần nhiều boilerplate và tuning nhất.

- **Điểm mạnh:** Latency tốt nhất khi concurrency cực cao, error rate thấp nhất
- **Điểm yếu:** Độ phức tạp cao, bạn mình có chuyển từ Go qua Rust code thử và bạn ấy nói như phải học code lại từ đầu =))).

### **3.3 Node.js (Fastify)**

Fastify đạt throughput ổn (tới **60,000 RPS**), handle async workload tốt. Memory dùng nhiều hơn (**500–700MB** khi chịu tải), garbage collection gây ra một số spike nhỏ nhưng không crash.

- **Điểm mạnh:** Async scalability, JSON handling tốt, cộng đồng mạnh và đông đảo
- **Điểm yếu:** Latency spike khi GC, memory cao

### **3.4 Python (FastAPI)**

FastAPI khởi đầu ổn, throughput tốt ở mức RPS thấp. Nhưng khi lên **10,000+ concurrent requests** thì bắt đầu nghẽn. Async hoạt động, nhưng CPU đạt mức tối đa, memory vượt **1.2GB**, response time tăng vọt.

- **Điểm mạnh:** Rất thân thiện với developer, mức độ code dễ hiểu cao
- **Điểm yếu:** Performance kém dưới tải đồng thời cao, sử dụng bộ nhớ lớn

### **3.5 Java (Spring Boot)**

Spring Boot rất ổn định nhưng khá nặng nề. Khởi động lâu nhất, idle đã ngốn hơn **1GB RAM**, cần tối ưu JVM kỹ. Nhưng nếu set flag và GC hợp lý, có thể duy trì ở mức **40,000 RPS** mà không bị lỗi.

- **Điểm mạnh:** Hệ sinh thái lâu đời, ổn định, các tính năng cho enterprise đầy đủ
- **Điểm yếu:** Cold start chậm, ngốn tài nguyên

---

## **4. Tổng hợp số liệu Benchmark**

| Framework | RPS (95% success) | Peak Memory (RSS) | 99th Percentile Latency |
|-----------|-------------------|-------------------|-------------------------|
| Go (Gin) | 105,000 | 190MB | 10ms |
| Rust (Actix-Web) | 110,000 | 250MB | 7ms |
| Node.js (Fastify) | 60,000 | 650MB | 35ms |
| Java (Spring Boot) | 40,000 | 1.4GB | 50ms |
| Python (FastAPI) | 8,000 | 1.2GB | 150ms |

---

## **5. Kết luận**

Do tác giả bài viết gốc có một số chỗ nói không chính xác nên mình đã thay mới hoặc lược bỏ.

Khi chọn web framework cho dự án, cần cân nhắc:

1. **Hiệu năng:** Quan trọng nhưng không phải yếu tố duy nhất
2. **Hệ sinh thái:** Thư viện, công cụ, cộng đồng hỗ trợ
3. **Đội ngũ:** Kinh nghiệm hiện có, khả năng học hỏi
4. **Yêu cầu dự án:** Tải dự kiến, độ phức tạp, timeline

**Tham khảo:** [Medium - 1 Billion Requests Test](https://medium.com/@S3CloudHub./i-tried-running-a-billion-requests-through-5-web-frameworks-heres-what-survived-03e24bc7b182)

---

**Xem thêm thông tin:**

- Trang chủ: [Boo Space](https://boospace.tech)
- Kho tài nguyên: [Boo Space Gumroad](https://boospace.gumroad.com)
- Các sản phẩm kèm theo: [Linktr](https://linktr.ee/boospace)