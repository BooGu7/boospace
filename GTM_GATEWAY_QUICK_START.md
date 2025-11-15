# 🚀 Google Tag Gateway - Quick Start Guide

## ⚡ Các Bước Nhanh

### 1. Cấu Hình DNS (Cloudflare)

```
Type: CNAME
Name: gtm
Target: gtm-gateway.googletagmanager.com
Proxy: ☁️ Proxied (ON)
```

### 2. Verify Domain (Google Ads)

1. Vào Google Ads → **Tools & Settings** → **Conversions**
2. Chọn conversion `AW-16629366126`
3. **Set up Google Tag Gateway** → Nhập: `gtm.boospace.tech`
4. Verify bằng TXT record hoặc HTML file

### 3. Verify Setup

```bash
# Chạy script kiểm tra
pnpm run verify-gtm

# Hoặc kiểm tra thủ công
nslookup gtm.boospace.tech
curl -I https://gtm.boospace.tech/gtag/js?id=AW-16629366126
```

### 4. Test trên Website

1. Mở https://boospace.tech
2. F12 → Network tab
3. Filter: `gtm.boospace.tech`
4. Reload → Kiểm tra request thành công

## ✅ Checklist

- [ ] DNS CNAME đã thêm vào Cloudflare
- [ ] Domain đã verify trong Google Ads
- [ ] Script load từ `gtm.boospace.tech` (không phải googletagmanager.com)
- [ ] Conversion tracking hoạt động

## 📚 Tài Liệu Chi Tiết

Xem file `GOOGLE_TAG_GATEWAY_SETUP.md` để biết hướng dẫn chi tiết từng bước.

## 🆘 Troubleshooting

**Script không load?**
- Kiểm tra DNS: `nslookup gtm.boospace.tech`
- Đảm bảo Cloudflare proxy đang bật (☁️)

**Domain chưa verify?**
- Kiểm tra TXT record trong Cloudflare
- Chờ DNS propagate (5-10 phút)

**Conversion không track?**
- Kiểm tra Google Ads dashboard
- Test với Google Tag Assistant extension

