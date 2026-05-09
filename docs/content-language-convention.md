# Content Language Convention

Boospace now supports bilingual content by reading both:

- frontmatter fields: `lang`, `translationKey`
- filename suffixes: `.vi.md`, `.en.md`, `-vi.md`, `-en.md`

## Recommended pattern for posts

Use two markdown files and keep them in the same topic folder:

```text
src/content/posts/developer/git/
  basic-git-guide.vi.md
  basic-git-guide.en.md
```

Recommended frontmatter:

```md
---
title: Basic Git Guide
published: 2026-05-09
description: Core Git commands and concepts.
lang: en
translationKey: basic-git-guide
slug: basic-git-guide-en
---
```

```md
---
title: Hướng Dẫn Git Cơ Bản
published: 2026-05-09
description: Các lệnh và khái niệm Git cơ bản.
lang: vi
translationKey: basic-git-guide
slug: huong-dan-git-co-ban
---
```

## Important rules

- `translationKey` must match between the EN and VI versions if you want the `VN | EN` switch to jump to the corresponding article.
- If `lang` is omitted, the system tries to infer it from the filename suffix.
- If `translationKey` is omitted, the system tries to infer it from the filename by removing the locale suffix.
- If you use suffix naming like `.vi.md` or `.en.md`, set `slug` explicitly when you want clean public URLs.

## Static spec pages

For content under `src/content/spec`, use the same convention:

```text
src/content/spec/
  about.vi.md
  about.en.md
  privacypolicy.vi.md
  privacypolicy.en.md
```

The site loader also supports the current legacy Vietnamese filenames without suffixes, but new bilingual content should follow the explicit EN/VI naming pattern.
