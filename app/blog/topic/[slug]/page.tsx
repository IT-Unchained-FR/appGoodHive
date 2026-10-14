import type { Metadata } from "next";
import { notFound } from "next/navigation";
import BlogHeader from "@/app/components/blog/BlogHeader";
import BlogSidebar from "@/app/components/blog/BlogSidebar";
import PostList from "@/app/components/blog/PostList";
import TopicBar from "@/app/components/blog/TopicBar";
import { getActiveTopics, getPublishedPosts, getPublishedPostsByTopic, getTopicBySlug } from "@/lib/blog/queries";
import "../../blog.css";

export const dynamic = "force-dynamic";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const topic = await getTopicBySlug(params.slug);
  if (!topic) return { title: "Topic not found | GoodHive Blog" };
  const description = topic.description ?? `Every GoodHive article about ${topic.name}.`;
  return {
    title: `${topic.name} | GoodHive Blog`,
    description,
    openGraph: { title: `${topic.name} | GoodHive Blog`, description, type: "website", siteName: "GoodHive" },
  };
}

export default async function BlogTopicPage({ params }: Props) {
  const topic = await getTopicBySlug(params.slug);
  if (!topic) notFound();

  const [posts, topics, allPosts] = await Promise.all([
    getPublishedPostsByTopic(topic.id),
    getActiveTopics(),
    getPublishedPosts(),
  ]);

  return (
    <div className="blog-page min-h-screen bg-[#fffdf6]">
      <BlogHeader
        eyebrow={`Topic · ${posts.length} ${posts.length === 1 ? "article" : "articles"}`}
        title={topic.name}
        subtitle={topic.description}
      >
        <TopicBar topics={topics} activeSlug={topic.slug} totalCount={allPosts.length} />
      </BlogHeader>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-16 xl:gap-16">
        <main className="min-w-0">
          {posts.length > 0 ? (
            <PostList posts={posts} />
          ) : (
            <p className="py-20 text-center text-gray-500">No articles in this topic yet.</p>
          )}
        </main>
        <BlogSidebar topics={topics} recentPosts={allPosts.slice(0, 5)} activeTopicSlug={topic.slug} />
      </div>
    </div>
  );
}
