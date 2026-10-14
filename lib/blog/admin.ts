import sql from "@/lib/db";
import {
  countWords,
  excerptFromHtml,
  readingMinutesFromWords,
  sanitizeBlogHtml,
  slugify,
  SLUG_PATTERN,
} from "./html";
import type { AdminBlogPost, BlogPostStatus, BlogTopicWithCount } from "./types";

// Admin write side of the blog. Route handlers under app/api/admin/blog call
// these after checking the admin session.

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const isUuid = (value: string) => UUID_PATTERN.test(value);

export class BlogValidationError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/** Postgres unique-violation → a readable 409. */
export function rethrowUniqueViolation(error: unknown, message: string): never {
  if (typeof error === "object" && error !== null && (error as { code?: string }).code === "23505") {
    throw new BlogValidationError(message, 409);
  }
  throw error;
}

// ---------------------------------------------------------------------------
// Posts
// ---------------------------------------------------------------------------

type AdminPostRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  content_html: string;
  author_name: string;
  author_image_url: string | null;
  topic_id: string | null;
  topic_name: string | null;
  status: BlogPostStatus;
  published_at: Date | null;
  updated_by: string | null;
  created_at: Date;
  updated_at: Date;
};

function toAdminPost(row: AdminPostRow): AdminBlogPost {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    contentHtml: row.content_html,
    authorName: row.author_name,
    authorImageUrl: row.author_image_url,
    topicId: row.topic_id,
    topicName: row.topic_name,
    status: row.status,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    updatedBy: row.updated_by,
    createdAt: new Date(row.created_at).toISOString(),
    updatedAt: new Date(row.updated_at).toISOString(),
  };
}

const ADMIN_POST_COLUMNS = sql`
  p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.content_html, p.author_name,
  p.author_image_url, p.topic_id, t.name AS topic_name, p.status, p.published_at,
  p.updated_by, p.created_at, p.updated_at
`;

export async function listAdminPosts(): Promise<AdminBlogPost[]> {
  const rows = await sql<AdminPostRow[]>`
    SELECT ${ADMIN_POST_COLUMNS}
    FROM goodhive.blog_posts p
    LEFT JOIN goodhive.blog_topics t ON t.id = p.topic_id
    ORDER BY COALESCE(p.published_at, p.updated_at) DESC
  `;
  // The list view never needs the body; keep the payload small.
  return rows.map((row) => ({ ...toAdminPost(row), contentHtml: "" }));
}

export async function getAdminPost(id: string): Promise<AdminBlogPost | null> {
  const [row] = await sql<AdminPostRow[]>`
    SELECT ${ADMIN_POST_COLUMNS}
    FROM goodhive.blog_posts p
    LEFT JOIN goodhive.blog_topics t ON t.id = p.topic_id
    WHERE p.id = ${id}
  `;
  return row ? toAdminPost(row) : null;
}

export interface BlogPostInput {
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  contentHtml: string;
  readingMinutes: number;
  authorName: string;
  authorImageUrl: string | null;
  topicId: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
}

const asString = (value: unknown) => (typeof value === "string" ? value.trim() : "");

function optionalUrl(value: unknown, field: string): string | null {
  const url = asString(value);
  if (!url) return null;
  if (!/^https:\/\/\S+$/i.test(url)) {
    throw new BlogValidationError(`${field} must be an https:// URL`);
  }
  return url;
}

/** Validates and normalises the editor payload. Throws BlogValidationError. */
export function parseBlogPostInput(body: Record<string, unknown>): BlogPostInput {
  const title = asString(body.title);
  if (!title) throw new BlogValidationError("Title is required");
  if (title.length > 200) throw new BlogValidationError("Title must be 200 characters or fewer");

  const slug = asString(body.slug) || slugify(title);
  if (!SLUG_PATTERN.test(slug)) {
    throw new BlogValidationError(
      'URL slug must be lowercase letters, numbers, and hyphens only (e.g. "web3-hiring-tips")',
    );
  }

  const status: BlogPostStatus = body.status === "published" ? "published" : "draft";

  const contentHtml = sanitizeBlogHtml(typeof body.contentHtml === "string" ? body.contentHtml : "");
  const words = countWords(contentHtml);
  if (status === "published" && words === 0) {
    throw new BlogValidationError("A published article needs some content");
  }

  const excerpt = asString(body.excerpt) || excerptFromHtml(contentHtml);
  if (excerpt.length > 500) throw new BlogValidationError("Summary must be 500 characters or fewer");

  const topicId = asString(body.topicId) || null;
  if (topicId && !isUuid(topicId)) throw new BlogValidationError("Unknown topic");

  let publishedAt: string | null = null;
  const rawPublishedAt = asString(body.publishedAt);
  if (rawPublishedAt) {
    const date = new Date(rawPublishedAt);
    if (Number.isNaN(date.getTime())) throw new BlogValidationError("Publish date is not a valid date");
    publishedAt = date.toISOString();
  } else if (status === "published") {
    publishedAt = new Date().toISOString();
  }

  return {
    slug,
    title,
    excerpt,
    coverImageUrl: optionalUrl(body.coverImageUrl, "Cover image"),
    contentHtml,
    readingMinutes: readingMinutesFromWords(words),
    authorName: asString(body.authorName) || "GoodHive",
    authorImageUrl: optionalUrl(body.authorImageUrl, "Author photo"),
    topicId,
    status,
    publishedAt,
  };
}

export async function createBlogPost(input: BlogPostInput, updatedBy: string): Promise<string> {
  try {
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO goodhive.blog_posts (
        slug, title, excerpt, cover_image_url, content_html, reading_minutes,
        author_name, author_image_url, topic_id, status, published_at, updated_by
      ) VALUES (
        ${input.slug}, ${input.title}, ${input.excerpt}, ${input.coverImageUrl},
        ${input.contentHtml}, ${input.readingMinutes}, ${input.authorName},
        ${input.authorImageUrl}, ${input.topicId}, ${input.status}, ${input.publishedAt},
        ${updatedBy}
      )
      RETURNING id
    `;
    return row.id;
  } catch (error) {
    rethrowUniqueViolation(error, `Another article already uses the URL /blog/${input.slug}`);
  }
}

export async function updateBlogPost(id: string, input: BlogPostInput, updatedBy: string): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE goodhive.blog_posts SET
        slug = ${input.slug},
        title = ${input.title},
        excerpt = ${input.excerpt},
        cover_image_url = ${input.coverImageUrl},
        content_html = ${input.contentHtml},
        reading_minutes = ${input.readingMinutes},
        author_name = ${input.authorName},
        author_image_url = ${input.authorImageUrl},
        topic_id = ${input.topicId},
        status = ${input.status},
        published_at = ${input.publishedAt},
        updated_by = ${updatedBy},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return result.count > 0;
  } catch (error) {
    rethrowUniqueViolation(error, `Another article already uses the URL /blog/${input.slug}`);
  }
}

export async function deleteBlogPost(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM goodhive.blog_posts WHERE id = ${id}`;
  return result.count > 0;
}

// ---------------------------------------------------------------------------
// Topics
// ---------------------------------------------------------------------------

type AdminTopicRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
  post_count: number;
};

/** Every topic, with how many articles (drafts included) use it. */
export async function listAdminTopics(): Promise<BlogTopicWithCount[]> {
  const rows = await sql<AdminTopicRow[]>`
    SELECT t.id, t.slug, t.name, t.description, t.sort_order, COUNT(p.id)::int AS post_count
    FROM goodhive.blog_topics t
    LEFT JOIN goodhive.blog_posts p ON p.topic_id = t.id
    GROUP BY t.id
    ORDER BY t.sort_order ASC, t.name ASC
  `;
  return rows.map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    postCount: row.post_count,
  }));
}

export interface BlogTopicInput {
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export function parseBlogTopicInput(body: Record<string, unknown>): BlogTopicInput {
  const name = asString(body.name);
  if (!name) throw new BlogValidationError("Topic name is required");
  if (name.length > 60) throw new BlogValidationError("Topic name must be 60 characters or fewer");

  const slug = asString(body.slug) || slugify(name);
  if (!SLUG_PATTERN.test(slug)) {
    throw new BlogValidationError("Topic URL must be lowercase letters, numbers, and hyphens only");
  }

  const sortOrder = Number(body.sortOrder ?? 0);
  if (!Number.isInteger(sortOrder)) throw new BlogValidationError("Order must be a whole number");

  return { slug, name, description: asString(body.description) || null, sortOrder };
}

export async function createBlogTopic(input: BlogTopicInput): Promise<string> {
  try {
    const [row] = await sql<{ id: string }[]>`
      INSERT INTO goodhive.blog_topics (slug, name, description, sort_order)
      VALUES (${input.slug}, ${input.name}, ${input.description}, ${input.sortOrder})
      RETURNING id
    `;
    return row.id;
  } catch (error) {
    rethrowUniqueViolation(error, `A topic with the URL /blog/topic/${input.slug} already exists`);
  }
}

export async function updateBlogTopic(id: string, input: BlogTopicInput): Promise<boolean> {
  try {
    const result = await sql`
      UPDATE goodhive.blog_topics SET
        slug = ${input.slug},
        name = ${input.name},
        description = ${input.description},
        sort_order = ${input.sortOrder},
        updated_at = NOW()
      WHERE id = ${id}
    `;
    return result.count > 0;
  } catch (error) {
    rethrowUniqueViolation(error, `A topic with the URL /blog/topic/${input.slug} already exists`);
  }
}

/** Articles in the topic keep existing and become "no topic" (ON DELETE SET NULL). */
export async function deleteBlogTopic(id: string): Promise<boolean> {
  const result = await sql`DELETE FROM goodhive.blog_topics WHERE id = ${id}`;
  return result.count > 0;
}
