import Link from "next/link";
import type { Route } from "next";

interface TopicBadgeProps {
  topic: { slug: string; name: string };
  variant?: "pill" | "text";
}

export default function TopicBadge({ topic, variant = "text" }: TopicBadgeProps) {
  const className =
    variant === "pill"
      ? "relative z-10 inline-flex w-fit items-center rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 transition hover:bg-amber-200"
      : "relative z-10 font-semibold text-amber-700 transition hover:text-amber-900";
  return (
    <Link href={`/blog/topic/${topic.slug}` as Route} className={className}>
      {topic.name}
    </Link>
  );
}
