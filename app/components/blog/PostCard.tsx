/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Image from "next/image";

import { Post } from "@/app/blog/page";

interface PostCardProps {
  post: Post;
}

const PostCard: React.FC<PostCardProps> = ({ post }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <Image
        src={post.mainImage.asset.url}
        alt={post.title}
        width={400}
        height={225}
        className="w-full h-48 object-cover"
        style={{ aspectRatio: "400/225", objectFit: "cover" }}
      />
      <div className="p-6">
        <h3 className="text-xl font-bold mb-2">
          <Link href={`/blog/${post.slug.current}` as any} prefetch={false}>
            {post.title}
          </Link>
        </h3>
        <div className="flex items-center mb-4">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src={post.author.image.asset.url} alt="Author" />
            <AvatarFallback>
              <span>{post.author.name[0]}</span>
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-500">{post.author.name}</span>
        </div>
        <p className="text-gray-600 line-clamp-3">
          {post.body[0].children[0].text} {post.body[1]?.children[0]?.text}{" "}
          {post.body[2]?.children[0]?.text}
        </p>
      </div>
    </div>
  );
};

export default PostCard;
