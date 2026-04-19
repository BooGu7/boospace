# Boo Space

Nguon ma cho website [boospace.tech](https://boospace.tech), xay dung bang Astro va Tailwind CSS.

## Stack

- Astro 5
- Svelte 5
- Tailwind CSS
- Pagefind cho tim kiem tai cho

## Yeu cau

- Node.js 20+
- pnpm 9+

## Chay local

```bash
pnpm install
pnpm dev
```

Website mac dinh chay tai `http://localhost:4321`.

## Lenh chinh

```bash
pnpm dev
pnpm check
pnpm build
pnpm preview
pnpm format
pnpm lint
```

## Cau truc thu muc

```text
src/
  components/    Giao dien va layout
  content/       Bai viet va noi dung
  pages/         Routing cua Astro
  styles/        Bien va style mo rong
public/          Tai nguyen tinh
scripts/         Script ho tro van hanh
```

## Trien khai

Du an dang duoc cau hinh de build static va co the deploy len Vercel, Cloudflare Pages, Netlify hoac bat ky nen tang static hosting nao.

## TikTok Login + Upload

Trang `/login/` da duoc them de demo TikTok OAuth va upload draft video.

- UI: `src/pages/login.astro`
- API: `api/tiktok/*`
- Huong dan cau hinh: `docs/tiktok-login-upload.md`
- Luu y: flow OAuth/upload can runtime server-side tren Vercel functions

## Ghi chu

Kho ma nay da duoc tuy bien phuc vu rieng cho Boo Space. Thong tin ve thanh phan ben thu ba nam trong `THIRD_PARTY_NOTICES.md`.
