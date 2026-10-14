import Link from "next/link";
import type { Route } from "next";
import type { BlogPostSummary } from "@/lib/blog/types";
import { formatBlogDate } from "./format";
import PostMeta from "./PostMeta";
import TopicBadge from "./TopicBadge";

interface PostCardProps {
  post: BlogPostSummary;
  variant?: "default" | "featured";
}

function Cover({ post, className }: { post: BlogPostSummary; className: string }) {
  return (
    <div className={`overflow-hidden rounded-2xl bg-amber-50 ring-1 ring-black/5 ${className}`}>
      {post.coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={post.coverImageUrl}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover transition duration-500 ease-out group-hover:scale-[1.03]"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-5xl text-amber-200" aria-hidden="true">
          ⬢
        </div>
      )}
    </div>
  );
}

/** "Web3 Hiring · Jun 9, 2026" */
function Kicker({ post }: { post: BlogPostSummary }) {
  const date = formatBlogDate(post.publishedAt);
  return (
    <div className="flex items-center gap-2 text-xs">
      {post.topic && <TopicBadge topic={post.topic} />}
      {post.topic && date && (
        <span aria-hidden="true" className="text-gray-300">
          •
        </span>
      )}
      {date && (
        <time dateTime={post.publishedAt ?? undefined} className="text-gray-500">
          {date}
        </time>
      )}
    </div>
  );
}

// The whole card is clickable through the title link's ::after overlay; the
// topic link sits above it (z-10) so it stays its own link.
export default function PostCard({ post, variant = "default" }: PostCardProps) {
  const href = `/blog/${post.slug}` as Route;

  if (variant === "featured") {
    return (
      <article className="group relative">
        <Cover post={post} className="aspect-[16/9]" />
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-900 px-3 py-1 text-xs font-semibold text-white">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400" aria-hidden="true" />
              Featured
            </span>
            <Kicker post={post} />
          </div>
          <h2 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
            <Link href={href} className="transition after:absolute after:inset-0 group-hover:text-amber-700">
              {post.title}
            </Link>
          </h2>
          <p className="line-clamp-3 text-lg leading-relaxed text-gray-600">{post.excerpt}</p>
          <PostMeta {...post} size="md" />
        </div>
      </article>
    );
  }

  return (
    <article className="group relative flex h-full flex-col">
      <Cover post={post} className="aspect-[16/10]" />
      <div className="mt-5 flex flex-1 flex-col">
        <Kicker post={post} />
        <h3 className="mt-2.5 line-clamp-2 text-xl font-bold leading-snug tracking-tight text-gray-900">
          <Link href={href} className="transition after:absolute after:inset-0 group-hover:text-amber-700">
            {post.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-2 flex-1 text-[15px] leading-relaxed text-gray-600">{post.excerpt}</p>
        <div className="mt-5">
          <PostMeta {...post} />
        </div>
      </div>
    </article>
  );
}
