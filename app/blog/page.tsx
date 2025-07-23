import { getAllPosts } from "@/lib/blog";
import { Metadata } from "next";
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
  previewText: string;
  body: Array<{
    _type: string;
    style: string;
    _key: string;
    markDefs: Array<unknown>;
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

export const metadata: Metadata = {
  title: "Blog - Web3 & Blockchain Insights | GoodHive",
  description:
    "Stay updated with the latest insights, tips, and stories from the Web3 and blockchain world. Discover trends, career advice, and industry news from GoodHive.",
  keywords:
    "Web3 blog, blockchain insights, crypto career advice, decentralized economy news, Web3 trends, blockchain education",
};

export const revalidate = 0;

export default async function Blog() {
  const posts: Post[] = await getAllPosts();

  return (
    <div className="container mx-auto px-4 py-12 md:px-6 lg:px-8">
      <div className="col-span-3 text-center mb-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">
          Our Blog
        </h1>
        <p className="text-base md:text-lg text-gray-600 mt-2">
          Discover the latest news, tips, and stories from our team.
        </p>
      </div>
      <div className="grid gap-8 grid-cols-3 sm:grid-cols-1 lg:grid-cols-2">
        {posts.map((post, index) => (
          <PostCard key={index} post={post} />
        ))}
      </div>
    </div>
  );
}
