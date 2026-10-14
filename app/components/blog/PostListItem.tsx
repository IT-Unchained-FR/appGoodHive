import Link from "next/link";
import type { Route } from "next";
import type { BlogPostSummary } from "@/lib/blog/types";
import { formatBlogDate } from "./format";
import PostMeta from "./PostMeta";
import TopicBadge from "./TopicBadge";

/** Horizontal blog-feed row: thumbnail left, text right (stacked on phones). */
export default function PostListItem({ post }: { post: BlogPostSummary }) {
  const date = formatBlogDate(post.publishedAt);
  return (
    <article className="group relative grid gap-5 sm:grid-cols-[260px_minmax(0,1fr)] sm:gap-7">
      <div className="aspect-[16/10] overflow-hidden rounded-xl bg-amber-50 ring-1 ring-black/5">
        {post.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-4xl text-amber-200" aria-hidden="true">
            ⬢
          </div>
        )}
      </div>
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-2 text-xs">
          {post.topic && <TopicBadge topic={post.topic} />}
          {post.topic && date && (
            <span aria-hidden="true" className="text-gray-300">
              •
            </span>
          )}
          {date && <time className="text-gray-500">{date}</time>}
        </div>
        <h3 className="mt-2 text-xl font-bold leading-snug tracking-tight text-gray-900">
          <Link
            href={`/blog/${post.slug}` as Route}
            className="transition after:absolute after:inset-0 group-hover:text-amber-700"
          >
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 text-[15px] leading-relaxed text-gray-600">{post.excerpt}</p>
        <div className="mt-4">
          <PostMeta {...post} />
        </div>
      </div>
    </article>
  );
}
