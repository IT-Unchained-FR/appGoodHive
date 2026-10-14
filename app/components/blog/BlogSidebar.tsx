import Link from "next/link";
import type { Route } from "next";
import { ArrowRight } from "lucide-react";
import type { BlogPostSummary, BlogTopicWithCount } from "@/lib/blog/types";
import { formatBlogDate } from "./format";
import SearchForm from "./SearchForm";

interface BlogSidebarProps {
  topics: BlogTopicWithCount[];
  recentPosts: BlogPostSummary[];
  activeTopicSlug?: string;
  query?: string;
}

function Widget({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200/80 bg-white p-5">
      <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.15em] text-gray-500">{title}</h2>
      {children}
    </section>
  );
}

export default function BlogSidebar({ topics, recentPosts, activeTopicSlug, query }: BlogSidebarProps) {
  return (
    <aside className="space-y-6 lg:sticky lg:top-6">
      <Widget title="Search">
        <SearchForm defaultValue={query} />
      </Widget>

      {topics.length > 0 && (
        <Widget title="Topics">
          <ul className="-mx-2 space-y-0.5">
            {topics.map((topic) => {
              const active = topic.slug === activeTopicSlug;
              return (
                <li key={topic.id}>
                  <Link
                    href={`/blog/topic/${topic.slug}` as Route}
                    className={`flex items-center justify-between rounded-lg px-2 py-2 text-sm transition ${
                      active ? "bg-amber-50 font-semibold text-amber-800" : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    {topic.name}
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${active ? "bg-amber-100 text-amber-800" : "bg-gray-100 text-gray-500"}`}
                    >
                      {topic.postCount}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </Widget>
      )}

      {recentPosts.length > 0 && (
        <Widget title="Recent posts">
          <ul className="space-y-4">
            {recentPosts.map((post) => (
              <li key={post.id}>
                <Link href={`/blog/${post.slug}` as Route} className="group flex gap-3">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-amber-50">
                    {post.coverImageUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={post.coverImageUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-amber-700">
                      {post.title}
                    </p>
                    <p className="mt-1 text-xs text-gray-500">{formatBlogDate(post.publishedAt)}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </Widget>
      )}

      <section className="relative overflow-hidden rounded-2xl bg-gray-900 p-6 text-white">
        <div
          className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-amber-400/30 blur-2xl"
          aria-hidden="true"
        />
        <h2 className="relative text-lg font-bold">Join the hive</h2>
        <p className="relative mt-2 text-sm leading-relaxed text-white/70">
          Find Web3 work or hire vetted talent on GoodHive — where value returns to the people who create it.
        </p>
        <Link
          href={"/talents/job-search" as Route}
          className="relative mt-4 inline-flex items-center gap-1.5 rounded-full bg-amber-400 px-4 py-2 text-sm font-semibold text-gray-900 transition hover:bg-amber-300"
        >
          Explore jobs
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </aside>
  );
}
