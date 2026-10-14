import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import type { BlogPostSummary, BlogTopic } from "@/lib/blog/types";
import PostList from "./PostList";

interface TopicSectionProps {
  topic: Pick<BlogTopic, "slug" | "name" | "description">;
  posts: BlogPostSummary[];
  totalCount: number;
}

export default function TopicSection({ topic, posts, totalCount }: TopicSectionProps) {
  return (
    <section aria-labelledby={`topic-${topic.slug}`}>
      <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-gray-900 pb-3">
        <div>
          <h2 id={`topic-${topic.slug}`} className="text-2xl font-bold tracking-tight text-gray-900">
            {topic.name}
          </h2>
          {topic.description && <p className="mt-1 text-sm text-gray-600">{topic.description}</p>}
        </div>
        <Link
          href={`/blog/topic/${topic.slug}` as Route}
          className="group/link inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-amber-700 hover:text-amber-900"
        >
          See all {totalCount}
          <ArrowRight className="h-4 w-4 transition group-hover/link:translate-x-0.5" />
        </Link>
      </div>
      <PostList posts={posts} />
    </section>
  );
}
