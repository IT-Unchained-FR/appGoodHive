"use client";

export const dynamic = "force-dynamic";

import Link from "next/link";
import type { Route } from "next";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";
import { ExternalLink, Plus, RefreshCw, Tags, Trash2 } from "lucide-react";
import toast from "react-hot-toast";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { useConfirm } from "@/app/components/ConfirmDialog/ConfirmDialog";
import { EnhancedTable, Column } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { Button } from "@/components/ui/button";
import type { AdminBlogPost, BlogTopicWithCount } from "@/lib/blog/types";

const EMPTY_TOPIC = { id: "", name: "", slug: "", description: "", sortOrder: 0 };

const slugify = (text: string) =>
  text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]";

function statusLabel(post: AdminBlogPost) {
  if (post.status === "draft") return { text: "Draft", className: "bg-gray-100 text-gray-700" };
  if (post.publishedAt && new Date(post.publishedAt) > new Date()) {
    return { text: "Scheduled", className: "bg-blue-50 text-blue-700" };
  }
  return { text: "Published", className: "bg-green-50 text-green-700" };
}

export default function AdminBlogPage() {
  const router = useRouter();
  const [confirm, confirmDialog] = useConfirm();
  const [posts, setPosts] = useState<AdminBlogPost[]>([]);
  const [topics, setTopics] = useState<BlogTopicWithCount[]>([]);
  const [loading, setLoading] = useState(false);
  const [topicsOpen, setTopicsOpen] = useState(false);
  const [topicForm, setTopicForm] = useState(EMPTY_TOPIC);
  const [topicError, setTopicError] = useState("");
  const [savingTopic, setSavingTopic] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [postsRes, topicsRes] = await Promise.all([
        fetch("/api/admin/blog/posts", { credentials: "include" }),
        fetch("/api/admin/blog/topics", { credentials: "include" }),
      ]);
      if (postsRes.status === 401 || topicsRes.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (postsRes.ok) setPosts(await postsRes.json());
      else toast.error("Failed to load articles");
      if (topicsRes.ok) setTopics(await topicsRes.json());
    } catch (err) {
      console.error("Error loading blog admin:", err);
      toast.error("Failed to load articles");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDeletePost = async (post: AdminBlogPost) => {
    const confirmed = await confirm({
      title: `Delete "${post.title}"?`,
      description: `/blog/${post.slug} stops working for everyone. This can't be undone — unpublish instead to hide it.`,
      confirmLabel: "Delete article",
      tone: "danger",
    });
    if (!confirmed) return;
    const response = await fetch(`/api/admin/blog/posts/${post.id}`, { method: "DELETE", credentials: "include" });
    if (response.ok) {
      toast.success("Article deleted");
      fetchAll();
    } else {
      toast.error("Failed to delete article");
    }
  };

  const saveTopic = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingTopic(true);
    setTopicError("");
    try {
      const response = await fetch(
        topicForm.id ? `/api/admin/blog/topics/${topicForm.id}` : "/api/admin/blog/topics",
        {
          method: topicForm.id ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(topicForm),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        setTopicError(data.message || "Failed to save topic");
        return;
      }
      toast.success(topicForm.id ? "Topic saved" : "Topic added");
      setTopicForm(EMPTY_TOPIC);
      fetchAll();
    } finally {
      setSavingTopic(false);
    }
  };

  const deleteTopic = async (topic: BlogTopicWithCount) => {
    const confirmed = await confirm({
      title: `Delete topic "${topic.name}"?`,
      description:
        topic.postCount > 0
          ? `Its ${topic.postCount} article(s) stay published but will have no topic.`
          : "No articles use this topic.",
      confirmLabel: "Delete topic",
      tone: "danger",
    });
    if (!confirmed) return;
    const response = await fetch(`/api/admin/blog/topics/${topic.id}`, { method: "DELETE", credentials: "include" });
    if (response.ok) {
      toast.success("Topic deleted");
      if (topicForm.id === topic.id) setTopicForm(EMPTY_TOPIC);
      fetchAll();
    } else {
      toast.error("Failed to delete topic");
    }
  };

  const rowActions = (post: AdminBlogPost) => (
    <div className="flex justify-end gap-2">
      <Button size="sm" variant="outline" onClick={() => router.push(`/admin/blog/${post.id}` as Route)}>
        Edit
      </Button>
      {post.status === "published" && (
        <Link
          href={`/blog/${post.slug}` as Route}
          target="_blank"
          className="inline-flex h-9 items-center rounded-md border border-input px-3 text-gray-700 hover:bg-gray-50"
          aria-label="View live article"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>
      )}
      <Button size="sm" variant="outline" onClick={() => handleDeletePost(post)} aria-label="Delete article">
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );

  const columns: Column<AdminBlogPost>[] = [
    {
      key: "title",
      header: "Article",
      sortable: true,
      render: (_value, row) => (
        <div className="flex items-center gap-3">
          {row.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={row.coverImageUrl} alt="" className="h-10 w-16 shrink-0 rounded object-cover" />
          ) : (
            <div className="h-10 w-16 shrink-0 rounded bg-amber-50" />
          )}
          <div className="min-w-0">
            <div className="truncate font-medium text-gray-900">{row.title}</div>
            <div className="truncate font-mono text-xs text-gray-500">/blog/{row.slug}</div>
          </div>
        </div>
      ),
    },
    { key: "topicName", header: "Topic", sortable: true, render: (value) => value ?? "—" },
    {
      key: "status",
      header: "Status",
      sortable: true,
      render: (_value, row) => {
        const label = statusLabel(row);
        return <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${label.className}`}>{label.text}</span>;
      },
    },
    {
      key: "publishedAt",
      header: "Publish date",
      sortable: true,
      render: (value) => (value ? new Date(value).toLocaleDateString() : "—"),
    },
    { key: "id", header: "", render: (_value, row) => rowActions(row) },
  ];

  return (
    <AdminPageLayout
      title="Blog"
      subtitle="Write, publish, and organise articles shown on goodhive.io/blog."
      actions={
        <div className="flex w-full gap-2 sm:w-auto">
          <Button variant="outline" onClick={() => setTopicsOpen(true)} className="gap-2">
            <Tags className="h-4 w-4" />
            Topics ({topics.length})
          </Button>
          <Button
            onClick={() => router.push("/admin/blog/new" as Route)}
            className="w-full gap-2 bg-[#FFC905] text-black hover:bg-[#FFC905]/80 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New article
          </Button>
        </div>
      }
    >
      <EnhancedTable
        data={posts}
        columns={columns}
        searchable
        searchPlaceholder="Search articles..."
        pagination
        itemsPerPage={15}
        loading={loading}
        emptyMessage="No articles yet"
        getRowId={(row) => row.id}
        mobileCardView
        renderMobileCard={(post) => {
          const label = statusLabel(post);
          return (
            <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
              <div className="font-semibold text-gray-900">{post.title}</div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className={`rounded-full px-2 py-0.5 font-medium ${label.className}`}>{label.text}</span>
                <span>{post.topicName ?? "No topic"}</span>
                {post.publishedAt && <span>· {new Date(post.publishedAt).toLocaleDateString()}</span>}
              </div>
              <div className="pt-1">{rowActions(post)}</div>
            </div>
          );
        }}
      />

      <Dialog open={topicsOpen} onClose={() => setTopicsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg bg-white p-4 sm:p-6">
            <Dialog.Title className="text-lg font-medium">Blog topics</Dialog.Title>
            <p className="mb-4 text-sm text-gray-500">
              Topics appear as filters and sections on the blog, lowest order first. Topics with no published
              articles are hidden from visitors.
            </p>

            <ul className="mb-6 divide-y divide-gray-100 rounded-md border border-gray-200">
              {topics.length === 0 && <li className="p-3 text-sm text-gray-500">No topics yet.</li>}
              {topics.map((topic) => (
                <li key={topic.id} className="flex items-center justify-between gap-3 p-3">
                  <div className="min-w-0">
                    <div className="font-medium text-gray-900">
                      <span className="mr-2 text-xs text-gray-400">#{topic.sortOrder}</span>
                      {topic.name}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      /blog/topic/{topic.slug} · {topic.postCount} article{topic.postCount === 1 ? "" : "s"}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setTopicForm({
                          id: topic.id,
                          name: topic.name,
                          slug: topic.slug,
                          description: topic.description ?? "",
                          sortOrder: topic.sortOrder,
                        })
                      }
                    >
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => deleteTopic(topic)} aria-label="Delete topic">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>

            <form onSubmit={saveTopic} className="space-y-3 rounded-md bg-gray-50 p-4">
              <div className="text-sm font-medium text-gray-900">
                {topicForm.id ? `Edit "${topicForm.name}"` : "Add a topic"}
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_1fr_90px]">
                <input
                  type="text"
                  value={topicForm.name}
                  onChange={(e) =>
                    setTopicForm({
                      ...topicForm,
                      name: e.target.value,
                      slug: topicForm.id ? topicForm.slug : slugify(e.target.value),
                    })
                  }
                  placeholder="Name"
                  className={inputClass}
                  required
                />
                <input
                  type="text"
                  value={topicForm.slug}
                  onChange={(e) => setTopicForm({ ...topicForm, slug: slugify(e.target.value) })}
                  placeholder="url-slug"
                  className={`${inputClass} font-mono`}
                  required
                />
                <input
                  type="number"
                  value={topicForm.sortOrder}
                  onChange={(e) => setTopicForm({ ...topicForm, sortOrder: Number(e.target.value) })}
                  className={inputClass}
                  aria-label="Order"
                  title="Order"
                />
              </div>
              <textarea
                value={topicForm.description}
                onChange={(e) => setTopicForm({ ...topicForm, description: e.target.value })}
                placeholder="Short description (shown under the topic heading)"
                rows={2}
                className={inputClass}
              />
              {topicError && <p className="text-sm text-red-500">{topicError}</p>}
              <div className="flex justify-end gap-2">
                {topicForm.id && (
                  <Button type="button" variant="outline" onClick={() => setTopicForm(EMPTY_TOPIC)}>
                    Cancel edit
                  </Button>
                )}
                <Button
                  type="submit"
                  disabled={savingTopic}
                  className="bg-[#FFC905] text-black hover:bg-[#FFC905]/80"
                >
                  {savingTopic ? "Saving…" : topicForm.id ? "Save topic" : "Add topic"}
                </Button>
              </div>
            </form>

            <div className="mt-4 flex justify-end">
              <Button variant="outline" onClick={() => setTopicsOpen(false)}>
                Done
              </Button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>

      <QuickActionFAB
        actions={[
          { icon: Plus, label: "New article", onClick: () => router.push("/admin/blog/new" as Route) },
          { icon: RefreshCw, label: "Refresh list", onClick: fetchAll },
        ]}
      />
      {confirmDialog}
    </AdminPageLayout>
  );
}
