-- Migration: Add goodhive.knowledge_base_files
-- Backs the Superbot knowledge base with DB rows instead of static files under
-- content/superbot-knowledge/*.md, so admins can upload/edit content live from
-- /admin/knowledge-base without a git commit + redeploy.

CREATE SCHEMA IF NOT EXISTS goodhive;
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS goodhive.knowledge_base_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    slug TEXT NOT NULL UNIQUE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    updated_by TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE goodhive.knowledge_base_files IS 'Superbot knowledge base source files (markdown), editable from /admin/knowledge-base';
COMMENT ON COLUMN goodhive.knowledge_base_files.slug IS 'URL/filename-safe identifier, e.g. "pricing"';
COMMENT ON COLUMN goodhive.knowledge_base_files.title IS 'Display category name, e.g. "Pricing" (rendered as the "# Heading" in the markdown)';
COMMENT ON COLUMN goodhive.knowledge_base_files.content IS 'Full markdown body, "## Question" sections parsed by lib/superbot/knowledge.ts';
