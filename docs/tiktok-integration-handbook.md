# TikTok Integration Handbook

Tai lieu nay dung de bao tri va phat trien tiep phan TikTok trong `boospace.tech`.

Neu sau nay can sua login, hien thi user, upload video, hoac doi scope TikTok, hay doc file nay truoc.

## 1. Muc tieu hien tai

Website da co mot page:

- `/login/`

Page nay phuc vu 3 viec:

1. Redirect nguoi dung sang TikTok de authorize
2. Quay lai site va hien thi thong tin user co ban
3. Upload video len TikTok theo flow draft/inbox

## 2. Kien truc tong quan

Tich hop nay chia lam 2 lop:

- Frontend Astro + Svelte:
  render giao dien `/login/`
- Backend Vercel Functions:
  xu ly OAuth, session, user info va upload

Ly do:

- `TIKTOK_CLIENT_SECRET` khong duoc dua ra client
- token exchange va refresh token phai xu ly server-side
- upload draft can di qua server routes de kiem soat session va request

## 3. File map

### Frontend

- `src/pages/login.astro`
  page `/login/`

- `src/components/TikTokLoginConsole.svelte`
  giao dien login, user state, chon file, upload progress, success/error

### Backend

- `api/_lib/tiktok.js`
  helper trung tam cho toan bo flow TikTok

- `api/tiktok/login.js`
  tao URL authorize va redirect sang TikTok

- `api/tiktok/callback.js`
  nhan `code` tu TikTok, doi access token, lay user info, tao session cookie

- `api/tiktok/me.js`
  tra ve trang thai session hien tai cho frontend

- `api/tiktok/logout.js`
  revoke session va xoa cookie

- `api/tiktok/upload/init.js`
  khoi tao upload draft voi TikTok Content Posting API

- `api/tiktok/upload/chunk.js`
  gui tung chunk video len `upload_url` ma TikTok cap ve

### Tai lieu lien quan

- `docs/tiktok-login-upload.md`
  note ngan ve setup co ban

- `README.md`
  co link toi phan TikTok flow

## 4. Flow dang nhap

Flow hien tai:

1. User mo `/login/`
2. Frontend goi `GET /api/tiktok/me`
3. Neu chua login:
   UI hien `Login with TikTok`
4. User bam nut:
   frontend redirect toi `/api/tiktok/login?returnTo=/login/`
5. `api/tiktok/login.js` tao URL authorize TikTok
6. TikTok redirect ve:
   `TIKTOK_REDIRECT_URI`
7. `api/tiktok/callback.js`:
   - xac thuc `state`
   - exchange `code` -> access token
   - goi user info API
   - tao signed session cookie
   - redirect ve `/login/?tiktok=connected`
8. Frontend load lai va goi `GET /api/tiktok/me`
9. UI hien user da connect

## 5. Flow upload video

Flow hien tai:

1. User chon file video tren `/login/`
2. Frontend goi `POST /api/tiktok/upload/init`
3. Server:
   - validate session
   - kiem tra scope `video.upload`
   - tinh chunk plan
   - goi TikTok init upload API
4. TikTok tra ve:
   - `publish_id`
   - `upload_url`
5. Frontend chia file thanh cac chunk
6. Moi chunk duoc gui qua:
   `POST /api/tiktok/upload/chunk`
7. Backend proxy chunk do len `upload_url` cua TikTok
8. Khi xong het chunk:
   frontend hien `success`
   va giu `publish_id`

Luu y:

- flow hien tai la upload draft/inbox
- nguoi dung van co the can hoan tat mot so buoc ben TikTok

## 6. Scope dang dung

Mac dinh:

- `user.info.basic`
- `video.upload`

### Y nghia

- `user.info.basic`
  dung de doc display identity cua user

- `video.upload`
  dung de tao upload draft video

### Van de `username`

Trong UI ban dau, minh muon hien thi:

- avatar
- username

Nhung theo TikTok docs va implementation hien tai:

- `user.info.basic` chi an toan cho display identity co ban
- `username` khong nen gia dinh la nam trong scope nay

Vi vay UI hien tai dang hien:

- avatar
- `displayName`
- `openId`

Neu muon hien `username` dung nghia hon, can:

1. xin them scope phu hop cua TikTok
2. update requested scopes
3. sua user info fields trong backend
4. sua UI

## 7. Bien moi truong can co

Can 4 bien:

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI`
- `TIKTOK_SESSION_SECRET`

Optional:

- `TIKTOK_SCOPES`

Gia tri mac dinh neu khong set:

- `user.info.basic,video.upload`

## 8. Cac gia tri local da test

Khi test local voi `vercel dev`, redirect URI tam dung la:

- `http://127.0.0.1:3000/api/tiktok/callback`

Neu test local that su, callback nay phai duoc whitelist trong TikTok Developer Portal.

## 9. Cach chay local dung

Khong dung:

- `pnpm dev`
- `pnpm preview`

cho flow TikTok that, vi:

- page Astro van chay
- nhung `api/tiktok/*` la serverless functions

Cach dung:

```powershell
npx vercel dev --listen 127.0.0.1:3000 --yes
```

Sau do mo:

- `http://127.0.0.1:3000/login/`

## 10. Session va bao mat

Session dang dung signed cookie.

Co cac helper trong:

- `api/_lib/tiktok.js`

No xu ly:

- ky token session bang HMAC
- verify token
- set cookie
- clear cookie
- state token cho OAuth
- refresh access token khi gan het han

Nguyen tac:

- khong dua `client_secret` ra frontend
- khong commit `.env.local`
- khong hard-code secret trong source

## 11. Cach sua UI

UI nam chu yeu trong:

- `src/components/TikTokLoginConsole.svelte`

Neu muon doi giao dien:

- headline
- trang thai
- section upload
- nut login
- thong diep success/error

thi sua file nay.

Neu muon doi route page:

- sua `src/pages/login.astro`

## 12. Cach doi scopes

Noi sua:

- env `TIKTOK_SCOPES`
  hoac
- `DEFAULT_SCOPES` trong `api/_lib/tiktok.js`

Sau khi doi scope:

1. can app TikTok duoc phe duyet scope do
2. can login lai de nhan token scope moi
3. can cap nhat UI neu hien thi them field moi

## 13. Cach them field user moi

Neu muon lay them thong tin user:

1. kiem tra docs TikTok xem field do thuoc scope nao
2. them field vao request trong `fetchBasicUserInfo()`
3. dua field do vao object `session.user`
4. cap nhat `SessionResponse` trong Svelte component
5. render field moi trong UI

Cho sua chinh:

- `api/_lib/tiktok.js`
- `src/components/TikTokLoginConsole.svelte`

## 14. Cach doi upload flow

Neu sau nay can:

- upload video lon hon
- doi chunk strategy
- them metadata video
- doi tu draft inbox sang flow khac

thi bat dau o:

- `createChunkPlan()` trong `api/_lib/tiktok.js`
- `initInboxUpload()` trong `api/_lib/tiktok.js`
- `api/tiktok/upload/init.js`
- `api/tiktok/upload/chunk.js`

Frontend upload loop nam trong:

- `uploadVideo()` cua `src/components/TikTokLoginConsole.svelte`

## 15. Cac gioi han va assumption hien tai

### 15.1 Static site + serverless

Site van build static bang Astro, nhung phan TikTok can server runtime.

### 15.2 Username

UI hien tai khong render `username` that su, vi scope hien co chua dam bao phu hop.

### 15.3 Publish flow

Upload hien tai la khoi tao draft upload, khong phai full publishing dashboard.

### 15.4 File type

Dang whitelist:

- `video/mp4`
- `video/quicktime`
- `video/webm`

Neu TikTok thay doi support matrix, sua `normalizeMimeType()`.

## 16. Cac loi thuong gap

### `configured: false`

Nguyen nhan:

- thieu 1 trong 4 env vars

Check:

- `GET /api/tiktok/me`

### Login bi fail sau khi redirect sang TikTok

Nguyen nhan thuong gap:

- `TIKTOK_REDIRECT_URI` khong trung voi callback da whitelist
- app chua duoc cap scope
- state het han

### Upload fail

Nguyen nhan thuong gap:

- token khong co scope `video.upload`
- file mime type khong hop le
- chunk metadata sai
- upload URL cua TikTok het han

## 17. Neu muon mo rong tiep

Danh sach hop ly cho phase sau:

1. Them `username` neu app duoc phe duyet scope phu hop
2. Them preview thumbnail/video metadata truoc khi upload
3. Luu `publish_id` vao database hoac Notion/CRM
4. Tao dashboard quan ly lich su TikTok upload
5. Them retry cho upload chunk
6. Them progress chi tiet hon theo MB da gui
7. Them toast notifications thay vi chi text block

## 18. Checklist truoc khi deploy

1. Set env vars tren Vercel
2. Whitelist dung callback URL production
3. Test:
   - `/login/`
   - `Login with TikTok`
   - callback quay lai site
   - user info hien dung
   - upload draft thanh cong
4. Confirm TikTok scope da duoc app phe duyet
5. Dam bao khong commit secret vao git

## 19. Production callback de nghi

Production nen dung:

- `https://www.boospace.tech/api/tiktok/callback`

Va phai trung 100% voi gia tri tren TikTok app settings.

## 20. Ghi chu quan trong

Client secret da tung duoc chia se trong chat khi test local.

Ve bao mat, nen:

1. rotate `TIKTOK_CLIENT_SECRET`
2. update lai secret moi trong Vercel env
3. update `.env.local` local neu can

## 21. File can doc neu tiep quan

Neu quay lai du an sau mot thoi gian, doc theo thu tu nay:

1. `docs/tiktok-integration-handbook.md`
2. `docs/tiktok-login-upload.md`
3. `api/_lib/tiktok.js`
4. `src/components/TikTokLoginConsole.svelte`
5. `src/pages/login.astro`
