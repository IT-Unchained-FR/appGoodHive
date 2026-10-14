// One-off import of the Sanity blog into goodhive.blog_topics / goodhive.blog_posts.
// Run after applying db/migrations/add-blog.sql:
//
//   pnpm migrate:sanity-blog --sql tmp/blog-import.sql   # write SQL, run it on each database
//   pnpm migrate:sanity-blog                             # or insert straight into DATABASE_URL
//
// - Reads Sanity's public API over HTTP (no Sanity packages needed).
// - Copies every cover, author, and inline image to our Backblaze bucket under
//   blog/<sanity-asset-id>.<ext>, so the articles no longer depend on cdn.sanity.io.
//   Keys are deterministic, so a re-run overwrites the same objects.
// - Converts Portable Text to HTML (the format the admin editor saves).
// - Safe to re-run: topics and articles whose slug already exists are skipped
//   (ON CONFLICT DO NOTHING), so it never overwrites edits made in /admin/blog.

import fs from "fs";
import path from "path";
import postgres from "postgres";
import { PutObjectCommand, S3 } from "@aws-sdk/client-s3";
import {
  countWords,
  excerptFromHtml,
  readingMinutesFromWords,
  sanitizeBlogHtml,
} from "../lib/blog/html";

const SANITY_QUERY_URL = "https://bk6p174g.api.sanity.io/v2021-03-25/data/query/production";

// Sanity had no categories; these are the starting topics. Editable in /admin/blog.
const TOPICS = [
  {
    slug: "goodhive",
    name: "GoodHive",
    description: "How GoodHive works, the DAO, Good Honey, and the story behind the hive.",
    sortOrder: 1,
  },
  {
    slug: "web3-hiring",
    name: "Web3 Hiring",
    description: "Recruiting, trust, and the future of work in Web3.",
    sortOrder: 2,
  },
  {
    slug: "entrepreneurship",
    name: "Entrepreneurship",
    description: "Lessons from building startups, from first idea to seed round.",
    sortOrder: 3,
  },
] as const;

const TOPIC_BY_POST_SLUG: Record<string, (typeof TOPICS)[number]["slug"]> = {
  "what-is-goodhive": "goodhive",
  "what-is-goodhive-2": "goodhive",
  "what-is-goodhive-3": "goodhive",
  "what-is-goodhive-4": "goodhive",
  "what-is-goodhive-5": "goodhive",
  "from-car-sharing-dreams-to-building-a-talent-hive": "goodhive",
  "the-trust-crisis-quietly-reshaping-web3-hiring": "web3-hiring",
  "the-future-of-recruitment-when-ai-meets-the-human-side-of-hiring": "web3-hiring",
  "recruitment-tips": "web3-hiring",
  entrepreneurship2: "entrepreneurship",
  entrepreneurship3: "entrepreneurship",
};

// ---------------------------------------------------------------------------
// Sanity
// ---------------------------------------------------------------------------

type SanityAsset = { _id: string; url: string; mimeType?: string } | null;

type Span = { _type: string; text?: string; marks?: string[] };
type MarkDef = { _key: string; _type: string; href?: string };
type Block = {
  _type: string;
  _key: string;
  style?: string;
  listItem?: "bullet" | "number";
  level?: number;
  children?: Span[];
  markDefs?: MarkDef[];
  asset?: SanityAsset;
  alt?: string;
};

type SanityPost = {
  title: string;
  slug: string;
  previewText: string | null;
  publishedAt: string | null;
  _createdAt: string;
  mainImage: SanityAsset;
  body: Block[] | null;
  author: { name: string; image: SanityAsset } | null;
};

const POSTS_QUERY = `*[_type == "post" && defined(slug.current)] | order(publishedAt desc) {
  title,
  "slug": slug.current,
  previewText,
  publishedAt,
  _createdAt,
  "mainImage": mainImage.asset->{_id, url, mimeType},
  body[]{
    ...,
    _type == "image" => { "asset": asset->{_id, url, mimeType} }
  },
  author->{ name, "image": image.asset->{_id, url, mimeType} }
}`;

async function fetchSanityPosts(): Promise<SanityPost[]> {
  const url = `${SANITY_QUERY_URL}?query=${encodeURIComponent(POSTS_QUERY)}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Sanity query failed: ${response.status} ${await response.text()}`);
  const { result } = (await response.json()) as { result: SanityPost[] };
  return result;
}

// ---------------------------------------------------------------------------
// Images → Backblaze
// ---------------------------------------------------------------------------

function createBucketClient() {
  const required = ["B2_KEY_ID", "B2_APP_KEY", "B2_ENDPOINT", "B2_REGION", "B2_BUCKET", "B2_HOST"];
  const missing = required.filter((name) => !process.env[name]);
  if (missing.length) throw new Error(`Missing env: ${missing.join(", ")}`);

  const s3 = new S3({
    credentials: { accessKeyId: process.env.B2_KEY_ID!, secretAccessKey: process.env.B2_APP_KEY! },
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION,
    forcePathStyle: true,
  });
  // Backblaze rejects the SDK's default checksum headers (same workaround as app/api/upload-file).
  s3.middlewareStack.add(
    (next) => async (args) => {
      const request = args.request as { headers?: Record<string, string> };
      if (request?.headers) {
        delete request.headers["x-amz-checksum-crc32"];
        delete request.headers["x-amz-sdk-checksum-algorithm"];
      }
      return next(args);
    },
    { step: "build", priority: "low" },
  );
  return s3;
}

const copiedImages = new Map<string, string>();

async function copyImage(s3: S3, asset: SanityAsset): Promise<string | null> {
  if (!asset?.url) return null;
  const cached = copiedImages.get(asset._id);
  if (cached) return cached;

  const response = await fetch(asset.url);
  if (!response.ok) throw new Error(`Could not download ${asset.url}: ${response.status}`);
  const contentType = asset.mimeType || response.headers.get("content-type") || "image/jpeg";
  const extension = path.extname(new URL(asset.url).pathname) || `.${contentType.split("/")[1]}`;
  const key = `blog/${asset._id.replace(/^image-/, "")}${extension}`;

  await s3.send(
    new PutObjectCommand({
      Bucket: process.env.B2_BUCKET,
      Key: key,
      Body: Buffer.from(await response.arrayBuffer()),
      ACL: "public-read",
      ContentType: contentType,
    }),
  );

  const url = `https://${process.env.B2_BUCKET}.${process.env.B2_HOST}/${key}`;
  copiedImages.set(asset._id, url);
  console.log(`  image → ${url}`);
  return url;
}

// ---------------------------------------------------------------------------
// Portable Text → HTML
// ---------------------------------------------------------------------------

const escapeHtml = (text: string) =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const DECORATORS: Record<string, string> = {
  strong: "strong",
  em: "em",
  underline: "u",
  code: "code",
  "strike-through": "s",
};

function renderSpans(block: Block): string {
  const markDefs = new Map((block.markDefs ?? []).map((def) => [def._key, def]));
  return (block.children ?? [])
    .map((span) => {
      let html = escapeHtml(span.text ?? "").replace(/\n/g, "<br>");
      for (const mark of span.marks ?? []) {
        const tag = DECORATORS[mark];
        if (tag) {
          html = `<${tag}>${html}</${tag}>`;
          continue;
        }
        const def = markDefs.get(mark);
        if (def?._type === "link" && def.href) {
          html = `<a href="${escapeHtml(def.href)}" target="_blank" rel="noopener noreferrer">${html}</a>`;
        }
      }
      return html;
    })
    .join("");
}

async function portableTextToHtml(blocks: Block[], s3: S3): Promise<string> {
  const out: string[] = [];
  let openList: "ul" | "ol" | null = null;

  const closeList = () => {
    if (openList) out.push(`</${openList}>`);
    openList = null;
  };

  for (const block of blocks) {
    if (block._type === "image") {
      closeList();
      const url = await copyImage(s3, block.asset ?? null);
      if (url) out.push(`<p><img src="${url}" alt="${escapeHtml(block.alt ?? "")}"></p>`);
      continue;
    }
    if (block._type !== "block") continue;

    const inner = renderSpans(block);

    if (block.listItem) {
      const tag = block.listItem === "number" ? "ol" : "ul";
      if (openList !== tag) {
        closeList();
        out.push(`<${tag}>`);
        openList = tag;
      }
      out.push(`<li>${inner}</li>`);
      continue;
    }

    closeList();
    if (!inner.replace(/<br>/g, "").trim()) continue; // Sanity uses empty blocks as spacers

    const style = block.style ?? "normal";
    // The article title is the page's only <h1>, so h1 in the body becomes h2.
    const tag =
      style === "h1" ? "h2" : /^h[2-6]$/.test(style) ? style : style === "blockquote" ? "blockquote" : "p";
    out.push(`<${tag}>${inner}</${tag}>`);
  }
  closeList();
  return out.join("\n");
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

type ImportedPost = {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  contentHtml: string;
  readingMinutes: number;
  authorName: string;
  authorImageUrl: string | null;
  topicSlug: string | null;
  publishedAt: string;
};

const sqlLiteral = (value: string | number | null) =>
  value === null ? "NULL" : typeof value === "number" ? String(value) : `'${value.replace(/'/g, "''")}'`;

function buildStatements(posts: ImportedPost[]): string[] {
  const lines: string[] = [];
  for (const topic of TOPICS) {
    lines.push(
      `INSERT INTO goodhive.blog_topics (slug, name, description, sort_order) VALUES (${sqlLiteral(topic.slug)}, ${sqlLiteral(topic.name)}, ${sqlLiteral(topic.description)}, ${topic.sortOrder}) ON CONFLICT (slug) DO NOTHING;`,
    );
  }
  for (const post of posts) {
    const topicId = post.topicSlug
      ? `(SELECT id FROM goodhive.blog_topics WHERE slug = ${sqlLiteral(post.topicSlug)})`
      : "NULL";
    lines.push(
      `INSERT INTO goodhive.blog_posts (slug, title, excerpt, cover_image_url, content_html, reading_minutes, author_name, author_image_url, topic_id, status, published_at, updated_by) VALUES (${[
        sqlLiteral(post.slug),
        sqlLiteral(post.title),
        sqlLiteral(post.excerpt),
        sqlLiteral(post.coverImageUrl),
        sqlLiteral(post.contentHtml),
        post.readingMinutes,
        sqlLiteral(post.authorName),
        sqlLiteral(post.authorImageUrl),
        topicId,
        "'published'",
        sqlLiteral(post.publishedAt),
        "'sanity-import'",
      ].join(", ")}) ON CONFLICT (slug) DO NOTHING;`,
    );
  }
  return lines;
}

const buildSqlFile = (posts: ImportedPost[]) =>
  ["-- Generated by scripts/migrate-sanity-blog.ts", "BEGIN;", ...buildStatements(posts), "COMMIT;", ""].join("\n");

async function insertIntoDatabase(posts: ImportedPost[]) {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  const isLocal = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
  const sql = postgres(connectionString, isLocal ? {} : { ssl: { rejectUnauthorized: false } });
  try {
    await sql.begin(async (tx) => {
      for (const statement of buildStatements(posts)) await tx.unsafe(statement);
    });
    const [counts] = await sql`
      SELECT (SELECT COUNT(*) FROM goodhive.blog_topics)::int AS topics,
             (SELECT COUNT(*) FROM goodhive.blog_posts)::int AS posts
    `;
    console.log(`Database now has ${counts.topics} topics and ${counts.posts} articles.`);
  } finally {
    await sql.end();
  }
}

async function main() {
  const sqlFlag = process.argv.indexOf("--sql");
  const sqlOut = sqlFlag !== -1 ? process.argv[sqlFlag + 1] : null;
  if (sqlFlag !== -1 && !sqlOut) throw new Error("--sql needs an output path");

  const s3 = createBucketClient();
  const sanityPosts = await fetchSanityPosts();
  console.log(`Fetched ${sanityPosts.length} articles from Sanity.`);

  const posts: ImportedPost[] = [];
  for (const post of sanityPosts) {
    console.log(`- ${post.slug}`);
    const contentHtml = sanitizeBlogHtml(await portableTextToHtml(post.body ?? [], s3));
    posts.push({
      slug: post.slug,
      title: post.title.trim(),
      excerpt: post.previewText?.trim() || excerptFromHtml(contentHtml),
      coverImageUrl: await copyImage(s3, post.mainImage),
      contentHtml,
      readingMinutes: readingMinutesFromWords(countWords(contentHtml)),
      authorName: post.author?.name ?? "GoodHive",
      authorImageUrl: await copyImage(s3, post.author?.image ?? null),
      topicSlug: TOPIC_BY_POST_SLUG[post.slug] ?? null,
      // Two Sanity articles never had a publish date; fall back to when they were created.
      publishedAt: post.publishedAt ?? post._createdAt,
    });
  }

  if (sqlOut) {
    fs.mkdirSync(path.dirname(sqlOut), { recursive: true });
    fs.writeFileSync(sqlOut, buildSqlFile(posts));
    console.log(`Wrote ${sqlOut}`);
  } else {
    await insertIntoDatabase(posts);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
