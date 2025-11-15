# 🏗️ Google Tag Gateway - Kiến Trúc và Luồng Dữ Liệu

## 📊 Sơ Đồ Kiến Trúc

```
┌─────────────────────────────────────────────────────────────┐
│                    User Browser                              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Website: boospace.tech                             │   │
│  │                                                      │   │
│  │  <script src="https://gtm.boospace.tech/gtag/..."> │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ HTTPS Request
                        ▼
┌─────────────────────────────────────────────────────────────┐
│              Cloudflare CDN                                  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Domain: gtm.boospace.tech                           │   │
│  │  CNAME → gtm-gateway.googletagmanager.com            │   │
│  │  Proxy: ☁️ Enabled                                   │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Proxied Request
                        ▼
┌─────────────────────────────────────────────────────────────┐
│         Google Tag Gateway (Cloudflare Edge)                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Validates domain ownership                         │   │
│  │  • Routes to Google Tag Manager                        │   │
│  │  • Adds security headers                             │   │
│  │  • Caches responses                                  │   │
│  └──────────────────────────────────────────────────────┘   │
└───────────────────────┬───────────────────────────────────────┘
                        │
                        │ Internal Routing
                        ▼
┌─────────────────────────────────────────────────────────────┐
│           Google Tag Manager                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  • Processes gtag.js                                  │   │
│  │  • Returns tracking script                           │   │
│  │  • Handles conversion tracking                        │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

## 🔄 Luồng Dữ Liệu

### 1. Initial Page Load

```
User → boospace.tech
  ↓
HTML loads with script tag:
  <script src="https://gtm.boospace.tech/gtag/js?id=AW-16629366126">
  ↓
Browser requests: gtm.boospace.tech/gtag/js?id=AW-16629366126
  ↓
Cloudflare DNS resolves → gtm-gateway.googletagmanager.com
  ↓
Cloudflare Proxy forwards request
  ↓
Google Tag Gateway validates & routes
  ↓
Google Tag Manager returns gtag.js
  ↓
Script executes in browser
  ↓
Data sent to Google Analytics/Ads
```

### 2. Conversion Tracking

```
User Action (e.g., form submit)
  ↓
gtag('event', 'conversion', {...})
  ↓
Data sent via gtm.boospace.tech
  ↓
Cloudflare Gateway
  ↓
Google Ads/Analytics
  ↓
Conversion recorded
```

## 🔐 Security Flow

```
┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ Only communicates with
       │ gtm.boospace.tech
       │ (your domain)
       ▼
┌──────────────────┐
│   Cloudflare     │
│  (Your Control)  │
└──────┬───────────┘
       │
       │ Proxied to Google
       │ (transparent to user)
       ▼
┌──────────────────┐
│      Google      │
│  Tag Manager     │
└──────────────────┘
```

## 📈 Benefits

### Before (Traditional)
```
User → googletagmanager.com (Google domain)
  ❌ User sees Google domain
  ❌ Third-party cookie issues
  ❌ Privacy concerns
```

### After (With Gateway)
```
User → gtm.boospace.tech (Your domain)
  ✅ User sees your domain
  ✅ First-party context
  ✅ Better privacy compliance
  ✅ Cloudflare CDN performance
```

## 🛠️ Configuration Points

### 1. DNS Level (Cloudflare)
```
gtm.boospace.tech → CNAME → gtm-gateway.googletagmanager.com
```

### 2. Code Level (src/config.ts)
```typescript
googleAnalytics: {
  id: "AW-16629366126",
  gatewayDomain: "gtm.boospace.tech"
}
```

### 3. Script Level (Layout.astro)
```javascript
// Auto-detects gateway domain
const scriptUrl = gatewayDomain 
  ? `https://${gatewayDomain}/gtag/js?id=${gaId}`
  : `https://www.googletagmanager.com/gtag/js?id=${gaId}`;
```

## 🔍 Verification Points

1. **DNS**: `nslookup gtm.boospace.tech`
2. **HTTP**: `curl -I https://gtm.boospace.tech/gtag/js?id=AW-16629366126`
3. **Browser**: Network tab shows `gtm.boospace.tech`
4. **Google Ads**: Domain verified status

## 📝 Key Files

- `src/config.ts` - Gateway domain configuration
- `src/layouts/Layout.astro` - Script injection
- `GOOGLE_TAG_GATEWAY_SETUP.md` - Detailed setup guide
- `scripts/verify-gtm-gateway.js` - Verification script

