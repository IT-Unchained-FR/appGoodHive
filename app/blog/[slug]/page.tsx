import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PostGrid from "@/app/components/blog/PostGrid";
import PostMeta from "@/app/components/blog/PostMeta";
import TopicBadge from "@/app/components/blog/TopicBadge";
import { formatBlogDate } from "@/app/components/blog/format";
import { sanitizeBlogHtml } from "@/lib/blog/html";
import { getPublishedPostBySlug, getRelatedPosts } from "@/lib/blog/queries";
import "../blog.css";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) return { title: "Article not found | GoodHive Blog" };

  const images = post.coverImageUrl ? [{ url: post.coverImageUrl, alt: post.title }] : [];
  return {
    title: `${post.title} | GoodHive Blog`,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      images,
      type: "article",
      publishedTime: post.publishedAt ?? undefined,
      authors: [post.authorName],
      url: `https://goodhive.io/blog/${post.slug}`,
      siteName: "GoodHive",
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt,
      images: post.coverImageUrl ? [post.coverImageUrl] : [],
    },
  };
}

export default async function BlogArticlePage({ params }: Props) {
  const post = await getPublishedPostBySlug(params.slug);
  if (!post) notFound();

  const related = await getRelatedPosts(post);

  return (
    <div className="blog-page min-h-screen bg-[#fffdf6]">
      <article className="mx-auto max-w-5xl px-4 pb-16 pt-10 sm:px-6 lg:px-8 lg:pt-14">
        <div className="mx-auto max-w-4xl">
          <Link
            href={"/blog" as Route}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-amber-700"
          >
            <ArrowLeft className="h-4 w-4" />
            All articles
          </Link>
        </div>

        <header className="mx-auto mt-6 max-w-4xl space-y-5">
          <div className="flex items-center gap-3 text-sm">
            {post.topic && <TopicBadge topic={post.topic} variant="pill" />}
            {post.publishedAt && (
              <time dateTime={post.publishedAt} className="text-gray-500">
                {formatBlogDate(post.publishedAt)}
              </time>
            )}
          </div>
          <h1 className="text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
            {post.title}
          </h1>
          {post.excerpt && <p className="text-lg leading-relaxed text-gray-600">{post.excerpt}</p>}
          <PostMeta {...post} size="md" />
        </header>

        {post.coverImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.coverImageUrl}
            alt=""
            className="mt-10 w-full rounded-2xl object-cover ring-1 ring-black/5"
          />
        )}

        <div
          className="blog-content mx-auto mt-12 max-w-4xl"
          dangerouslySetInnerHTML={{ __html: sanitizeBlogHtml(post.contentHtml) }}
        />
      </article>

      {related.length > 0 && (
        <section className="border-t border-gray-200/80">
          <div className="mx-auto max-w-7xl space-y-8 px-4 py-14 sm:px-6 lg:px-8 lg:py-16">
            <h2 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
              {post.topic ? `More on ${post.topic.name}` : "Keep reading"}
            </h2>
            <PostGrid posts={related} />
          </div>
        </section>
      )}
    </div>
  );
}
