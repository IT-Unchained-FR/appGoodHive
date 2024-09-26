import { getAllPosts } from "@/lib/blog";
import PostCard from "../components/blog/PostCard";

export interface Post {
  _id: string;
  title: string;
  slug: {
    current: string;
    _type: string;
  };
  mainImage: {
    asset: {
      _id: string;
      url: string;
    };
  };
  categories: string[];
  publishedAt: string | null;
  body: Array<{
    _type: string;
    style: string;
    _key: string;
    markDefs: Array<any>;
    children: Array<{
      _key: string;
      _type: string;
      marks: Array<string>;
      text: string;
    }>;
    level?: number;
    listItem?: string;
  }>;
  author: {
    name: string;
    image: {
      asset: {
        _id: string;
        url: string;
      };
    };
    bio: string;
  };
}

export default async function Blog() {
  const posts: Post[] = await getAllPosts();
  console.log(posts, "Posts");

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
      <div className="grid grid-cols-3 sm:grid-cols-1 md:grid-cols-2 gap-8">
        {posts.map((post, index) => (
          <PostCard key={index} post={post} />
        ))}
      </div>
    </div>
  );
}
