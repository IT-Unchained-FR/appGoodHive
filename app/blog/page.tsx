import type { Metadata } from "next";
import Link from "next/link";
import type { Route } from "next";
import BlogHeader from "@/app/components/blog/BlogHeader";
import BlogSidebar from "@/app/components/blog/BlogSidebar";
import PostCard from "@/app/components/blog/PostCard";
import PostList from "@/app/components/blog/PostList";
import SearchForm from "@/app/components/blog/SearchForm";
import TopicBar from "@/app/components/blog/TopicBar";
import TopicSection from "@/app/components/blog/TopicSection";
import { getActiveTopics, getPublishedPosts, searchPublishedPosts } from "@/lib/blog/queries";
import "./blog.css";

export const metadata: Metadata = {
  title: "Blog - Web3 & Blockchain Insights | GoodHive",
  description:
    "Stay updated with the latest insights, tips, and stories from the Web3 and blockchain world. Discover trends, career advice, and industry news from GoodHive.",
  keywords:
    "Web3 blog, blockchain insights, crypto career advice, decentralized economy news, Web3 trends, blockchain education",
};

// Articles are edited live from /admin/blog; render per request so edits show immediately.
export const dynamic = "force-dynamic";

const POSTS_PER_TOPIC = 3;
const RECENT_POSTS = 5;

type Props = { searchParams: { q?: string | string[] } };

export default async function BlogPage({ searchParams }: Props) {
  const query = (Array.isArray(searchParams.q) ? searchParams.q[0] : searchParams.q)?.trim() ?? "";
  const [posts, topics, results] = await Promise.all([
    getPublishedPosts(),
    getActiveTopics(),
    query ? searchPublishedPosts(query) : Promise.resolve(null),
  ]);

  return (
    <div className="blog-page min-h-screen bg-[#fffdf6]">
      <BlogHeader
        title="Stories from the hive"
        subtitle="Insights on Web3 hiring, building GoodHive, and the future of collaborative work."
      >
        <div className="max-w-xl">
          <SearchForm defaultValue={query} size="lg" />
        </div>
        <div className="mt-6">
          <TopicBar topics={topics} totalCount={posts.length} />
        </div>
      </BlogHeader>

      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:px-8 lg:py-16 xl:gap-16">
        <main className="min-w-0">
          {results ? <SearchResults query={query} results={results} /> : <BlogHome posts={posts} topics={topics} />}
        </main>
        <BlogSidebar topics={topics} recentPosts={posts.slice(0, RECENT_POSTS)} query={query} />
      </div>
    </div>
  );
}

function SearchResults({ query, results }: { query: string; results: Awaited<ReturnType<typeof searchPublishedPosts>> }) {
  return (
    <section aria-labelledby="search-results">
      <div className="mb-8 flex items-end justify-between gap-4 border-b-2 border-gray-900 pb-3">
        <h2 id="search-results" className="text-2xl font-bold tracking-tight text-gray-900">
          {results.length} {results.length === 1 ? "result" : "results"} for “{query}”
        </h2>
        <Link href={"/blog" as Route} className="shrink-0 text-sm font-semibold text-amber-700 hover:text-amber-900">
          Clear search
        </Link>
      </div>
      {results.length > 0 ? (
        <PostList posts={results} />
      ) : (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-16 text-center">
          <p className="text-lg font-semibold text-gray-900">No articles match your search</p>
          <p className="mt-2 text-gray-600">Try a different word, or browse by topic.</p>
        </div>
      )}
    </section>
  );
}

function BlogHome({
  posts,
  topics,
}: {
  posts: Awaited<ReturnType<typeof getPublishedPosts>>;
  topics: Awaited<ReturnType<typeof getActiveTopics>>;
}) {
  const [featured, ...rest] = posts;
  if (!featured) return <p className="py-20 text-center text-gray-500">No articles yet — check back soon.</p>;

  // Each article appears once in the main column: featured first, then in its
  // topic section, and anything left over in "More articles".
  const shown = new Set<string>([featured.id]);
  const sections = topics
    .map((topic) => {
      const topicPosts = rest.filter((post) => post.topic?.slug === topic.slug).slice(0, POSTS_PER_TOPIC);
      topicPosts.forEach((post) => shown.add(post.id));
      return { topic, posts: topicPosts };
    })
    .filter((section) => section.posts.length > 0);
  const remaining = rest.filter((post) => !shown.has(post.id));

  return (
    <div className="space-y-16">
      <PostCard post={featured} variant="featured" />
      {sections.map(({ topic, posts: topicPosts }) => (
        <TopicSection key={topic.id} topic={topic} posts={topicPosts} totalCount={topic.postCount} />
      ))}
      {remaining.length > 0 && (
        <section aria-labelledby="more-articles">
          <h2
            id="more-articles"
            className="mb-8 border-b-2 border-gray-900 pb-3 text-2xl font-bold tracking-tight text-gray-900"
          >
            More articles
          </h2>
          <PostList posts={remaining} />
        </section>
      )}
    </div>
  );
}
