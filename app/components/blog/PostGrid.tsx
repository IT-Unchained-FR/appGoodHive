import type { BlogPostSummary } from "@/lib/blog/types";
import PostCard from "./PostCard";

export default function PostGrid({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {posts.map((post) => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}
