# Feature: Blog CMS + Redesign with Topics

## Status
`IN REVIEW` — built on `feat/blog-cms` (2026-10-14). Data already migrated to dev and prod.

## Business Goal
The blog was a plain card grid backed by a Sanity Studio that lived outside this repo and that nobody maintained. GoodHive now owns its blog: articles and topics are written in the admin panel, and the public blog has a modern layout organised by topic. See ADR-007.

## User Stories
> As a visitor, I want to browse the blog by topic and open all articles on a topic, so that I can read more of what interests me.

> As an admin, I want to write, schedule, publish, and organise articles from /admin/blog, so that I don't need a separate CMS.

## What Was Built

### Public blog
| Route | Content |
|---|---|
| `/blog` | Header → sticky topic bar (All + each topic with published articles) → featured latest article → one section per topic (3 articles + "See all N articles →") → "More articles" for anything not shown yet. No article appears twice. |
| `/blog/topic/[slug]` | Topic header with description and count, same topic bar with the topic highlighted, every article in the topic. Unknown slug → 404. |
| `/blog/[slug]` | Topic badge, title, summary, author/date/reading time, cover, article body, then "More on <topic>" (3 related, topped up with latest). Unknown or unpublished slug → 404. |

Components: `app/components/blog/` — `BlogHeader`, `TopicBar`, `TopicSection`, `PostCard` (`default` / `featured`), `PostGrid`, `PostMeta`, `TopicBadge`. Article typography in `app/blog/blog.css` (the project has no `@tailwindcss/typography`, so the old `prose` classes did nothing).

### Admin (`/admin/blog`, sidebar → "Blog")
- Article table: cover, title, URL, topic, status (Draft / Scheduled / Published), publish date; edit, view live, delete.
- "Topics" dialog: add, edit (name, URL, order, description), delete. Deleting a topic keeps its articles and leaves them without a topic.
- Editor (`/admin/blog/new`, `/admin/blog/[id]`): title, Quill body (headings, bold/italic/underline/strike, lists, quote, code block, links, images uploaded to Backblaze, alignment), URL slug (follows the title until edited), topic, cover image, summary (auto-filled from the body when empty), publish date (future date = scheduled), author name + photo. Buttons: Save draft / Publish, or Unpublish / Save changes once live.

### Data
- Tables `goodhive.blog_topics` and `goodhive.blog_posts` — `db/migrations/add-blog.sql`. One topic per article.
- Visible to the public when `status = 'published' AND published_at <= NOW()`.
- `content_html` is sanitized with DOMPurify on save and again on render. `reading_minutes` is computed on save, so cards never load the body.
- Pages are `force-dynamic`: edits show up immediately, and no build-time DB access is needed.

### Sanity removal
- Deleted `lib/sanity.ts`, `lib/blog.ts`, `CustomPortableText`, `utils/text.ts`, the hardcoded `staticPost` in the article page, and the `cdn.sanity.io` image host.
- Removed packages: `sanity`, `@sanity/client`, `@sanity/image-url`, `@sanity/asset-utils`, `@portabletext/react`.

## Migration (done 2026-10-14)
- `pnpm migrate:sanity-blog` (`scripts/migrate-sanity-blog.ts`) read all 11 Sanity articles over Sanity's public HTTP API, converted Portable Text to HTML, and copied 13 images (11 covers, Benoit's avatar, 1 inline image) to `https://goodhive.s3.us-east-005.backblazeb2.com/blog/…`.
- Imported into **both** Neon branches of project `lucky-hill-12695764`:
  - `development` (`ep-icy-fog`, the host in local `.env`)
  - `production` (`ep-lively-cake`)
  Each now has 3 topics and 11 published articles.
- Starting topics (Sanity had none): **GoodHive** (6: What is GoodHive 1–5, Car Sharing story), **Web3 Hiring** (3), **Entrepreneurship** (2). Editable in the admin.
- The 2 articles with no Sanity publish date got their Sanity creation date.
- The script is re-runnable: existing slugs are skipped, so admin edits are never overwritten.
- Node had to be told to prefer IPv4 to reach Backblaze from this machine: `NODE_OPTIONS="--dns-result-order=ipv4first --network-family-autoselection-attempt-timeout=5000"`.

## Acceptance Criteria
1. `/blog` shows header, topic bar, featured article, topic sections (max 3 each with "See all"), and "More articles"; no duplicates.
2. Topic pills and "See all" open `/blog/topic/[slug]` with the pill highlighted; "All" returns to `/blog`.
3. Unknown topic/article slugs and drafts return 404; metadata never throws.
4. Articles without a topic still appear on `/blog` and work at `/blog/[slug]`.
5. Grid is 1 / 2 / 3 columns (phone / tablet / desktop); topic bar scrolls sideways on phones with no page-level horizontal scroll.
6. Admin can create, edit, schedule, publish, unpublish, and delete articles, and manage topics; non-admins get 401 from `/api/admin/blog/*`.
7. All 11 former Sanity articles render from Postgres with images served from Backblaze.

## API
| Method | Path | Description |
|---|---|---|
| GET / POST | `/api/admin/blog/posts` | List (no bodies) / create |
| GET / PUT / DELETE | `/api/admin/blog/posts/[id]` | Read / update / delete one article |
| GET / POST | `/api/admin/blog/topics` | List with article counts / create |
| PUT / DELETE | `/api/admin/blog/topics/[id]` | Update / delete a topic |

All are protected by `middleware.ts` (admin JWT for `/api/admin/*`) and again by `requireAdminSession()` in each handler.

## Out of Scope / Follow-ups
- Pagination (revisit at ~30 articles), search, tags, comments.
- "From the blog" strip on the site homepage (`app/page.tsx`).
- `/api/upload-file` (used for blog images, as elsewhere) is unauthenticated — a pre-existing issue, not introduced here.
- No sitemap exists in the repo; add `/blog/*` URLs when one is created.
- The Sanity project `bk6p174g` can be archived once the new blog is verified live.

## Validation
```bash
pnpm tsc --noEmit
npx eslint app/blog app/admin/blog app/api/admin/blog app/components/blog lib/blog
```
Done: typecheck clean, lint clean. Every public and admin query was run against the dev database (11 articles, 3 topics, related articles, null for unknown slugs). Not yet clicked through in a browser.
