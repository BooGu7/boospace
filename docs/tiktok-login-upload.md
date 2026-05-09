# TikTok Login And Upload Flow

For the full maintenance guide, read:

- `docs/tiktok-integration-handbook.md`

The `/login/` page depends on server-side Vercel functions under `api/tiktok/*`.

Because the Astro site still builds static HTML, the TikTok auth/upload flow does not run inside plain `pnpm dev` or `pnpm preview` alone. Use a Vercel deployment or `vercel dev` when testing the live OAuth flow locally.

## Required environment variables

- `TIKTOK_CLIENT_KEY`
- `TIKTOK_CLIENT_SECRET`
- `TIKTOK_REDIRECT_URI`
- `TIKTOK_SESSION_SECRET`

Optional:

- `TIKTOK_SCOPES`
  Default: `user.info.basic,video.upload`

## TikTok app setup

- Register the exact redirect URI configured in `TIKTOK_REDIRECT_URI`
- For `boospace.tech`, the expected callback is:
  `https://www.boospace.tech/api/tiktok/callback`

## Scope notes

- `user.info.basic` is used to load profile identity on the page
- `video.upload` is used to initialize the draft video upload flow
- TikTok's `user.info.basic` scope returns display identity fields, not `username`
- If you need TikTok `username`, request and get approval for `user.info.profile`

## Upload behavior

- The page initializes a draft upload via TikTok Content Posting API
- Video bytes are sent in chunks through `/api/tiktok/upload/chunk`
- On success, TikTok returns a `publish_id`
- The creator still completes editing/posting inside TikTok
