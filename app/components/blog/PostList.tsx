import type { BlogPostSummary } from "@/lib/blog/types";
import PostListItem from "./PostListItem";

export default function PostList({ posts }: { posts: BlogPostSummary[] }) {
  return (
    <div className="divide-y divide-gray-200/80">
      {posts.map((post) => (
        <div key={post.id} className="py-8 first:pt-0 last:pb-0">
          <PostListItem post={post} />
        </div>
      ))}
    </div>
  );
}
