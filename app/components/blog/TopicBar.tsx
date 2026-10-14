import Link from "next/link";
import type { Route } from "next";
import type { BlogTopic } from "@/lib/blog/types";

interface TopicBarProps {
  topics: (Pick<BlogTopic, "slug" | "name"> & { postCount?: number })[];
  /** Slug of the topic being viewed; omit on the blog home ("All"). */
  activeSlug?: string;
  totalCount?: number;
}

const base =
  "inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition";
const active = `${base} border-gray-900 bg-gray-900 text-white`;
const idle = `${base} border-gray-200 bg-white text-gray-700 hover:border-amber-300 hover:text-amber-800`;

function Count({ value, isActive }: { value?: number; isActive: boolean }) {
  if (value === undefined) return null;
  return <span className={`text-xs ${isActive ? "text-white/60" : "text-gray-400"}`}>{value}</span>;
}

export default function TopicBar({ topics, activeSlug, totalCount }: TopicBarProps) {
  if (topics.length === 0) return null;

  return (
    <nav aria-label="Blog topics" className="-mx-4 sm:mx-0">
      <ul className="flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:flex-wrap sm:px-0 [&::-webkit-scrollbar]:hidden">
        <li>
          <Link
            href={"/blog" as Route}
            className={activeSlug ? idle : active}
            aria-current={activeSlug ? undefined : "page"}
          >
            All
            <Count value={totalCount} isActive={!activeSlug} />
          </Link>
        </li>
        {topics.map((topic) => {
          const isActive = topic.slug === activeSlug;
          return (
            <li key={topic.slug}>
              <Link
                href={`/blog/topic/${topic.slug}` as Route}
                className={isActive ? active : idle}
                aria-current={isActive ? "page" : undefined}
              >
                {topic.name}
                <Count value={topic.postCount} isActive={isActive} />
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
