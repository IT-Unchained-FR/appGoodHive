-- Migration: Add goodhive.blog_topics and goodhive.blog_posts
-- Replaces Sanity as the blog CMS. Articles and topics are managed from
-- /admin/blog and rendered by /blog, /blog/topic/[slug] and /blog/[slug].
-- Existing Sanity articles are imported by scripts/migrate-sanity-blog.ts.

CREATE SCHEMA IF NOT EXISTS goodhive;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS goodhive.blog_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS goodhive.blog_posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    excerpt TEXT NOT NULL DEFAULT '',
    cover_image_url TEXT,
    content_html TEXT NOT NULL DEFAULT '',
    reading_minutes INTEGER NOT NULL DEFAULT 1,
    author_name TEXT NOT NULL DEFAULT 'GoodHive',
    author_image_url TEXT,
    topic_id UUID REFERENCES goodhive.blog_topics(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
    published_at TIMESTAMPTZ,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_posts_published
    ON goodhive.blog_posts (status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blog_posts_topic
    ON goodhive.blog_posts (topic_id);

COMMENT ON TABLE goodhive.blog_topics IS 'Blog topics shown as filters and sections on /blog, managed from /admin/blog';
COMMENT ON COLUMN goodhive.blog_topics.sort_order IS 'Lower numbers appear first in the topic bar and on /blog';
COMMENT ON TABLE goodhive.blog_posts IS 'Blog articles, managed from /admin/blog (replaced Sanity)';
COMMENT ON COLUMN goodhive.blog_posts.content_html IS 'Article body as HTML from the admin rich-text editor; sanitized on save and on render';
COMMENT ON COLUMN goodhive.blog_posts.reading_minutes IS 'Computed from content_html word count on every save, so cards never load the body';
COMMENT ON COLUMN goodhive.blog_posts.status IS 'draft = hidden from the public blog, published = visible once published_at has passed';
