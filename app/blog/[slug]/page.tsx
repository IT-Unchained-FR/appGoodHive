import Image from "next/legacy/image";
import { PortableText } from "@portabletext/react";

import { Post } from "../page";
import { getPostBySlug } from "@/lib/blog";
import moment from "moment";

type BlogDetailPageProps = {
  params: {
    slug: string;
  };
};
const BlogDetailPage = async (context: BlogDetailPageProps) => {
  const { slug } = context.params;
  const post: Post = await getPostBySlug(slug);

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

      <div className="flex items-center mb-6 gap-4">
        <Image
          src={post.author.image.asset.url}
          alt={post.author.name}
          width={40}
          height={40}
          className="rounded-full mr-3"
        />
        <div>
          <p className="font-semibold">{post.author.name}</p>
          <p className="text-gray-500 text-sm">
            {moment(post.publishedAt).format("MMMM Do YYYY, h:mm a")}
          </p>
        </div>
      </div>

      <div className="mb-8">
        <Image
          src={post.mainImage.asset.url}
          alt={post.title}
          width={800}
          height={400}
          layout="responsive"
          className="rounded-lg"
        />
        <p className="text-sm text-gray-500 mt-2">{post.title}</p>
      </div>

      <div className="prose prose-lg max-w-none">
        <PortableText value={post.body} />
      </div>
    </article>
  );
};

export default BlogDetailPage;
