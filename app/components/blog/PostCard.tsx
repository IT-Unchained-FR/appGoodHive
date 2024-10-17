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
    <div
      className="bg-white rounded-lg overflow-hidden"
      style={{ boxShadow: "rgba(0, 0, 0, 0.08) 0px 0px 0px 1px" }}
    >
      {" "}
      <Link href={`/blog/${post.slug.current}` as any} prefetch={false}>
        <Image
          src={post.mainImage.asset.url}
          alt={post.title}
          width={400}
          height={225}
          className="w-full h-48 object-cover"
          style={{ aspectRatio: "400/225", objectFit: "cover" }}
        />
      </Link>
      <div className="p-6">
        <Link href={`/blog/${post.slug.current}` as any} prefetch={false}>
          <h3 className="text-xl font-bold mb-2">{post.title}</h3>
        </Link>
        <div className="flex items-center mb-4">
          <Avatar className="w-8 h-8 mr-2">
            <AvatarImage src={post.author.image.asset.url} alt="Author" />
            <AvatarFallback>
              <span>{post.author.name[0]}</span>
            </AvatarFallback>
          </Avatar>
          <span className="text-gray-500">{post.author.name}</span>
        </div>
        <p className="text-gray-600">{post.previewText}</p>
      </div>
    </div>
  );
};

export default PostCard;
