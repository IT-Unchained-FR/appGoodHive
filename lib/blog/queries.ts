import sql from "@/lib/db";
import type { BlogPost, BlogPostSummary, BlogTopic, BlogTopicWithCount } from "./types";

// Public read side of the blog. Only published articles whose publish date has
// passed are ever returned from here.

type SummaryRow = {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  cover_image_url: string | null;
  author_name: string;
  author_image_url: string | null;
  published_at: Date | null;
  reading_minutes: number;
  topic_slug: string | null;
  topic_name: string | null;
};

type PostRow = SummaryRow & { content_html: string };

type TopicRow = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sort_order: number;
};

function toSummary(row: SummaryRow): BlogPostSummary {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    coverImageUrl: row.cover_image_url,
    authorName: row.author_name,
    authorImageUrl: row.author_image_url,
    publishedAt: row.published_at ? new Date(row.published_at).toISOString() : null,
    readingMinutes: row.reading_minutes,
    topic: row.topic_slug && row.topic_name ? { slug: row.topic_slug, name: row.topic_name } : null,
  };
}

function toTopic(row: TopicRow): BlogTopic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  };
}

const SUMMARY_COLUMNS = sql`
  p.id, p.slug, p.title, p.excerpt, p.cover_image_url, p.author_name,
  p.author_image_url, p.published_at, p.reading_minutes,
  t.slug AS topic_slug, t.name AS topic_name
`;

const IS_PUBLISHED = sql`p.status = 'published' AND p.published_at <= NOW()`;

export async function getPublishedPosts(): Promise<BlogPostSummary[]> {
  const rows = await sql<SummaryRow[]>`
    SELECT ${SUMMARY_COLUMNS}
    FROM goodhive.blog_posts p
    LEFT JOIN goodhive.blog_topics t ON t.id = p.topic_id
    WHERE ${IS_PUBLISHED}
    ORDER BY p.published_at DESC
  `;
  return rows.map(toSummary);
}

/** Topics that have at least one published article, in display order. */
export async function getActiveTopics(): Promise<BlogTopicWithCount[]> {
  const rows = await sql<(TopicRow & { post_count: number })[]>`
    SELECT t.id, t.slug, t.name, t.description, t.sort_order, COUNT(p.id)::int AS post_count
    FROM goodhive.blog_topics t
    JOIN goodhive.blog_posts p ON p.topic_id = t.id AND ${IS_PUBLISHED}
    GROUP BY t.id
    ORDER BY t.sort_order ASC, t.name ASC
  `;
  return rows.map((row) => ({ ...toTopic(row), postCount: row.post_count }));
}

export async function getTopicBySlug(slug: string): Promise<BlogTopic | null> {
  const [row] = await sql<TopicRow[]>`
    SELECT id, slug, name, description, sort_order
    FROM goodhive.blog_topics
    WHERE slug = ${slug}
  `;
  return row ? toTopic(row) : null;
}

export async function getPublishedPostsByTopic(topicId: string): Promise<BlogPostSummary[]> {
  const rows = await sql<SummaryRow[]>`
    SELECT ${SUMMARY_COLUMNS}
    FROM goodhive.blog_posts p
    JOIN goodhive.blog_topics t ON t.id = p.topic_id
    WHERE ${IS_PUBLISHED} AND p.topic_id = ${topicId}
    ORDER BY p.published_at DESC
  `;
  return rows.map(toSummary);
}

export async function getPublishedPostBySlug(slug: string): Promise<BlogPost | null> {
  const [row] = await sql<PostRow[]>`
    SELECT ${SUMMARY_COLUMNS}, p.content_html
    FROM goodhive.blog_posts p
    LEFT JOIN goodhive.blog_topics t ON t.id = p.topic_id
    WHERE ${IS_PUBLISHED} AND p.slug = ${slug}
  `;
  return row ? { ...toSummary(row), contentHtml: row.content_html } : null;
}

/** Up to `limit` other articles from the same topic, topped up with the latest articles. */
export async function getRelatedPosts(post: BlogPostSummary, limit = 3): Promise<BlogPostSummary[]> {
  const topicSlug = post.topic?.slug ?? null;
  const rows = await sql<SummaryRow[]>`
    SELECT ${SUMMARY_COLUMNS}
    FROM goodhive.blog_posts p
    LEFT JOIN goodhive.blog_topics t ON t.id = p.topic_id
    WHERE ${IS_PUBLISHED} AND p.id <> ${post.id}
    ORDER BY (t.slug IS NOT DISTINCT FROM ${topicSlug} AND ${topicSlug}::text IS NOT NULL) DESC,
             p.published_at DESC
    LIMIT ${limit}
  `;
  return rows.map(toSummary);
}

/** Case-insensitive search over title, summary, and body; title matches rank first. */
export async function searchPublishedPosts(query: string, limit = 50): Promise<BlogPostSummary[]> {
  const term = query.trim().slice(0, 100);
  if (!term) return [];
  const pattern = `%${term.replace(/[\\%_]/g, (char) => `\\${char}`)}%`;
  const rows = await sql<SummaryRow[]>`
    SELECT ${SUMMARY_COLUMNS}
    FROM goodhive.blog_posts p
    LEFT JOIN goodhive.blog_topics t ON t.id = p.topic_id
    WHERE ${IS_PUBLISHED}
      AND (p.title ILIKE ${pattern} OR p.excerpt ILIKE ${pattern} OR p.content_html ILIKE ${pattern}
           OR t.name ILIKE ${pattern})
    ORDER BY (p.title ILIKE ${pattern}) DESC, p.published_at DESC
    LIMIT ${limit}
  `;
  return rows.map(toSummary);
}
