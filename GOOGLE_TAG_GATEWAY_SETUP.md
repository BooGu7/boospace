# Hướng Dẫn Chi Tiết: Cấu Hình Google Tag Gateway

## 📋 Tổng Quan

Google Tag Gateway cho phép bạn sử dụng tên miền của chính bạn (thông qua Cloudflare) để phục vụ các thẻ Google, thay vì sử dụng trực tiếp `googletagmanager.com`. Điều này mang lại:

- ✅ **Bảo mật tốt hơn**: Người dùng chỉ tương tác với domain của bạn
- ✅ **Quyền riêng tư**: Cải thiện compliance với GDPR, CCPA
- ✅ **Hiệu suất**: Tận dụng Cloudflare CDN
- ✅ **Kiểm soát**: Bạn có quyền kiểm soát domain và traffic

## 🔧 Cấu Hình Hiện Tại

Trong code của bạn đã được cấu hình:
- **Google Analytics ID**: `AW-16629366126`
- **Gateway Domain**: `gtm.boospace.tech`
- **Script URL**: `https://gtm.boospace.tech/gtag/js?id=AW-16629366126`

## 📝 Bước 1: Cấu Hình DNS với Cloudflare

### 1.1. Đăng nhập Cloudflare Dashboard

1. Truy cập: https://dash.cloudflare.com
2. Chọn domain `boospace.tech`

### 1.2. Thêm CNAME Record

1. Vào **DNS** → **Records**
2. Nhấp **Add record**
3. Điền thông tin:
   ```
   Type: CNAME
   Name: gtm
   Target: gtm-gateway.googletagmanager.com
   Proxy status: Proxied (☁️ - màu cam)
   TTL: Auto
   ```
4. Nhấp **Save**

### 1.3. Kiểm Tra DNS Propagation

Sau khi thêm record, chờ 1-5 phút rồi kiểm tra:

```bash
# Kiểm tra bằng command line
nslookup gtm.boospace.tech

# Hoặc sử dụng online tool
# https://dnschecker.org/#CNAME/gtm.boospace.tech
```

Kết quả mong đợi: `gtm.boospace.tech` → `gtm-gateway.googletagmanager.com`

## 📝 Bước 2: Kích Hoạt Google Tag Gateway trong Google Ads

### 2.1. Truy Cập Google Ads

1. Đăng nhập: https://ads.google.com
2. Chọn tài khoản có Conversion ID: `AW-16629366126`

### 2.2. Vào Cài Đặt Conversion Tracking

1. Vào **Tools & Settings** (⚙️) → **Conversions**
2. Tìm conversion action có ID `AW-16629366126`
3. Nhấp vào conversion action đó

### 2.3. Kích Hoạt Google Tag Gateway

1. Trong phần **Tag setup**, tìm **Google Tag Gateway**
2. Nhấp **Set up Google Tag Gateway**
3. Nhập domain: `gtm.boospace.tech`
4. Nhấp **Continue**

### 2.4. Verify Domain Ownership

Google sẽ yêu cầu verify domain. Có 2 cách:

#### Cách 1: DNS TXT Record (Khuyến nghị)
1. Google sẽ cung cấp một TXT record
2. Thêm vào Cloudflare DNS:
   ```
   Type: TXT
   Name: @ (hoặc boospace.tech)
   Content: [giá trị TXT từ Google]
   TTL: Auto
   ```
3. Chờ 5-10 phút để DNS propagate
4. Nhấp **Verify** trong Google Ads

#### Cách 2: HTML File Upload
1. Download file HTML từ Google
2. Upload file vào thư mục `/public` của website
3. Đảm bảo file có thể truy cập tại: `https://boospace.tech/[tên-file].html`
4. Nhấp **Verify** trong Google Ads

### 2.5. Hoàn Tất Setup

1. Sau khi verify thành công, Google Tag Gateway sẽ được kích hoạt
2. Trạng thái sẽ hiển thị: **Active** hoặc **Enabled**

## 📝 Bước 3: Kiểm Tra và Verify

### 3.1. Kiểm Tra Script Load

1. Mở website: https://boospace.tech
2. Mở **Developer Tools** (F12)
3. Vào tab **Network**
4. Filter: `gtm.boospace.tech` hoặc `gtag`
5. Reload trang
6. Bạn sẽ thấy request đến:
   ```
   https://gtm.boospace.tech/gtag/js?id=AW-16629366126
   ```

### 3.2. Kiểm Tra Console

Trong Console (F12), gõ:
```javascript
window.dataLayer
```

Kết quả mong đợi: Mảng chứa các event và config, bao gồm:
```javascript
[
  {gtm.start: [timestamp], event: "gtm.js"},
  {gtm_base_url: "https://gtm.boospace.tech"},
  ...
]
```

### 3.3. Kiểm Tra Network Requests

Trong Network tab, bạn sẽ thấy:
- ✅ Request đến `gtm.boospace.tech` (không phải `googletagmanager.com`)
- ✅ Status code: 200 (thành công)
- ✅ Response headers có `x-goog-tag-gateway: true`

### 3.4. Test Conversion Tracking

1. Thực hiện một action sẽ trigger conversion (nếu có)
2. Vào Google Ads → **Conversions**
3. Kiểm tra xem conversion có được ghi nhận không
4. Có thể mất vài phút để hiển thị

## 🔍 Troubleshooting

### Vấn đề 1: DNS chưa propagate

**Triệu chứng**: Script không load, lỗi 404 hoặc DNS error

**Giải pháp**:
```bash
# Kiểm tra DNS
dig gtm.boospace.tech
# hoặc
nslookup gtm.boospace.tech

# Nếu chưa có kết quả, chờ thêm 5-10 phút
# Hoặc clear DNS cache:
# Windows: ipconfig /flushdns
# Mac/Linux: sudo dscacheutil -flushcache
```

### Vấn đề 2: Domain chưa được verify

**Triệu chứng**: Script load nhưng conversion không được track

**Giải pháp**:
1. Kiểm tra lại TXT record trong Cloudflare
2. Đảm bảo TXT record đúng format từ Google
3. Chờ DNS propagate (có thể mất đến 24 giờ)
4. Thử verify lại trong Google Ads

### Vấn đề 3: Script vẫn load từ googletagmanager.com

**Triệu chứng**: Trong Network tab vẫn thấy request đến `googletagmanager.com`

**Giải pháp**:
1. Kiểm tra `src/config.ts`:
   ```typescript
   googleAnalytics: {
     id: "AW-16629366126",
     gatewayDomain: "gtm.boospace.tech", // Đảm bảo có giá trị này
   }
   ```
2. Rebuild website:
   ```bash
   pnpm run build
   ```
3. Clear browser cache và reload

### Vấn đề 4: CORS Error

**Triệu chứng**: Console hiển thị CORS error

**Giải pháp**:
- Đảm bảo Cloudflare proxy đang bật (☁️ màu cam)
- Kiểm tra SSL/TLS settings trong Cloudflare
- Đảm bảo domain đã được verify trong Google Ads

## 📊 Monitoring và Maintenance

### Kiểm Tra Định Kỳ

1. **Hàng tuần**: Kiểm tra conversion tracking hoạt động
2. **Hàng tháng**: Review DNS records và Cloudflare settings
3. **Sau khi thay đổi**: Luôn test lại sau khi deploy code mới

### Tools Hữu Ích

- **Google Tag Assistant**: Chrome extension để debug tags
- **Google Analytics Debugger**: Chrome extension để debug GA
- **Cloudflare Analytics**: Xem traffic và performance
- **DNS Checker**: https://dnschecker.org

## 🔐 Security Best Practices

1. **Luôn sử dụng HTTPS**: Đảm bảo SSL certificate hợp lệ
2. **Bật Cloudflare Proxy**: Bảo vệ khỏi DDoS và tăng tốc
3. **Regular Updates**: Cập nhật code và dependencies thường xuyên
4. **Monitor Logs**: Theo dõi Cloudflare logs để phát hiện bất thường

## 📞 Support

Nếu gặp vấn đề:

1. **Google Ads Support**: https://support.google.com/google-ads
2. **Cloudflare Support**: https://support.cloudflare.com
3. **Documentation**:
   - Google Tag Gateway: https://support.google.com/google-ads/answer/12215575
   - Cloudflare DNS: https://developers.cloudflare.com/dns/

## ✅ Checklist Hoàn Thành

- [ ] DNS CNAME record đã được thêm vào Cloudflare
- [ ] DNS đã propagate (kiểm tra bằng nslookup)
- [ ] Domain đã được verify trong Google Ads
- [ ] Google Tag Gateway đã được kích hoạt
- [ ] Script load từ `gtm.boospace.tech` (kiểm tra Network tab)
- [ ] Conversion tracking hoạt động (test và verify)
- [ ] Không có lỗi trong Console
- [ ] Website hoạt động bình thường

---

**Lưu ý**: Sau khi hoàn tất tất cả các bước, có thể mất 24-48 giờ để Google Tag Gateway hoạt động hoàn toàn và conversion data được sync đầy đủ.

