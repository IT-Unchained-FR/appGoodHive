import Image from "next/image";
import { PortableText } from "@portabletext/react";
import { Metadata } from "next";
import { Post } from "../page";
import { getPostBySlug } from "@/lib/blog";
import moment from "moment";
import { CustomPortableTextComponents } from "@/app/components/CustomPortableText/CustomPortableText";

type Props = {
  params: { slug: string };
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post: Post = await getPostBySlug(params.slug);

  return {
    title: `${post.title} | GoodHive Blog`,
    description: post.previewText,
    openGraph: {
      title: post.title,
      description: post.previewText,
      images: [
        {
          url: post.mainImage.asset.url,
          width: 1200,
          height: 630,
          alt: post.title,
        },
      ],
      type: "article",
      url: `https://goodhive.io/blog/${post.slug.current}`,
      siteName: "My Blog",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.previewText,
      images: [post.mainImage.asset.url],
    },
  };
}

export default async function BlogDetailPage({ params }: Props) {
  const post: Post = await getPostBySlug(params.slug);

  return (
    <article className="max-w-3xl mx-auto px-4 py-8">
      {/* Post Title */}
      <h1 className="text-4xl font-bold mb-4">{post.title}</h1>

      {/* Post Author Info */}
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

      {/* Main Image */}
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

      {/* Blog Content */}
      <div className="prose prose-lg max-w-none">
        <PortableText
          value={post.body}
          components={CustomPortableTextComponents}
        />
      </div>
    </article>
  );
}
