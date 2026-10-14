export type BlogPostStatus = "draft" | "published";

export interface BlogTopic {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
}

export interface BlogTopicWithCount extends BlogTopic {
  postCount: number;
}

/** What a card needs. Never carries the article body. */
export interface BlogPostSummary {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  authorName: string;
  authorImageUrl: string | null;
  publishedAt: string | null;
  readingMinutes: number;
  topic: Pick<BlogTopic, "slug" | "name"> | null;
}

export interface BlogPost extends BlogPostSummary {
  contentHtml: string;
}

/** Admin view of an article, including drafts. */
export interface AdminBlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  coverImageUrl: string | null;
  contentHtml: string;
  authorName: string;
  authorImageUrl: string | null;
  topicId: string | null;
  topicName: string | null;
  status: BlogPostStatus;
  publishedAt: string | null;
  updatedBy: string | null;
  createdAt: string;
  updatedAt: string;
}
