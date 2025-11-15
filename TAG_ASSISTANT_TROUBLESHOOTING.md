# 🔧 Khắc Phục: Google Tag Assistant Không Tìm Thấy Tags

## ❌ Vấn Đề

Google Tag Assistant hiển thị:
> "Tag Assistant đã kết nối, nhưng chúng tôi không tìm thấy vùng chứa Trình quản lý thẻ hoặc thẻ Google nào được cài đặt trên trang này."

## ✅ Giải Pháp

### 1. Kiểm Tra Scripts Đã Được Load

1. Mở website: https://boospace.tech
2. Mở **Developer Tools** (F12)
3. Vào tab **Network**
4. Filter: `gtag` hoặc `gtm`
5. Reload trang
6. Kiểm tra xem có request đến:
   - `googletagmanager.com/gtag/js?id=AW-16629366126` (Google Analytics)
   - `googletagmanager.com/gtm.js?id=GTM-KNR33RBV` (Google Tag Manager)

### 2. Kiểm Tra Console

Trong Console (F12), gõ:
```javascript
window.dataLayer
```

Kết quả mong đợi: Mảng chứa các event và config

### 3. Kiểm Tra HTML Source

1. View page source (Ctrl+U hoặc Cmd+U)
2. Tìm kiếm: `gtag` hoặc `GTM-KNR33RBV`
3. Đảm bảo scripts được đặt trong `<head>`

### 4. Tạm Thời Tắt Gateway Domain (Nếu Gateway Chưa Hoạt Động)

Nếu gateway domain `gtm.boospace.tech` chưa được cấu hình hoặc chưa hoạt động, tạm thời tắt để test:

**File: `src/config.ts`**
```typescript
googleAnalytics: {
  id: "AW-16629366126",
  gatewayDomain: "", // Tạm thời để trống để dùng googletagmanager.com
},
```

Sau đó rebuild:
```bash
pnpm run build
```

### 5. Kiểm Tra Gateway Domain

Nếu đang sử dụng gateway domain, kiểm tra xem nó có hoạt động không:

```bash
# Kiểm tra DNS
nslookup gtm.boospace.tech

# Kiểm tra HTTP
curl -I https://gtm.boospace.tech/gtag/js?id=AW-16629366126
```

Nếu gateway không hoạt động, script sẽ tự động fallback về `googletagmanager.com`.

### 6. Kiểm Tra GTM Container

1. Đăng nhập Google Tag Manager: https://tagmanager.google.com
2. Chọn container: `GTM-KNR33RBV`
3. Kiểm tra xem container đã được **Published** chưa
4. Đảm bảo có ít nhất một tag được cấu hình

### 7. Clear Cache và Test Lại

1. Clear browser cache (Ctrl+Shift+Delete)
2. Hard reload (Ctrl+Shift+R hoặc Cmd+Shift+R)
3. Test lại với Google Tag Assistant

## 🔍 Debug Chi Tiết

### Kiểm Tra Scripts Trong HTML

Scripts phải được đặt **ngay sau `<meta charset>`** trong `<head>`:

```html
<head>
  <meta charset="UTF-8" />
  
  <!-- Google Analytics -->
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
  </script>
  <script async src="https://..."></script>
  ...
</head>
```

### Kiểm Tra DataLayer

Trong Console, chạy:
```javascript
// Kiểm tra dataLayer
console.log(window.dataLayer);

// Kiểm tra gtag function
console.log(typeof gtag);

// Kiểm tra GTM
console.log(window.google_tag_manager);
```

### Network Tab Checklist

Trong Network tab, đảm bảo thấy:
- ✅ Request đến `googletagmanager.com` (status 200)
- ✅ Response có content (không phải empty)
- ✅ Không có CORS errors
- ✅ Không có 404 errors

## 🚨 Các Lỗi Thường Gặp

### Lỗi 1: Script không load

**Nguyên nhân**: Gateway domain chưa hoạt động

**Giải pháp**: 
- Tạm thời tắt gateway domain trong config
- Hoặc cấu hình DNS và verify domain

### Lỗi 2: CORS Error

**Nguyên nhân**: Gateway domain chưa được verify

**Giải pháp**: Verify domain trong Google Ads

### Lỗi 3: 404 Not Found

**Nguyên nhân**: URL không đúng hoặc domain chưa được cấu hình

**Giải pháp**: Kiểm tra lại config và DNS

### Lỗi 4: GTM Container không hiển thị

**Nguyên nhân**: Container chưa được published

**Giải pháp**: Publish container trong GTM dashboard

## 📝 Checklist

- [ ] Scripts được đặt trong `<head>` (ngay sau `<meta charset>`)
- [ ] `dataLayer` được khởi tạo sớm
- [ ] Request đến googletagmanager.com thành công (status 200)
- [ ] Không có lỗi trong Console
- [ ] GTM container đã được published
- [ ] Gateway domain hoạt động (nếu sử dụng) hoặc đã tắt
- [ ] Browser cache đã được clear
- [ ] Google Tag Assistant extension đã được enable

## 🔄 Sau Khi Sửa

1. Rebuild website: `pnpm run build`
2. Deploy lên production
3. Clear cache
4. Test lại với Google Tag Assistant
5. Kiểm tra trong Google Analytics/Ads dashboard

## 📞 Nếu Vẫn Không Hoạt Động

1. Kiểm tra lại tất cả các bước trên
2. Xem Console và Network tab để tìm lỗi cụ thể
3. Test với Google Tag Assistant extension
4. Kiểm tra GTM Preview mode
5. Xem logs trong Google Analytics Real-time reports

