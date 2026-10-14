"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import type { Route } from "next";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ExternalLink, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import type ReactQuillType from "react-quill";
import "react-quill/dist/quill.snow.css";
import "./blog-editor.css";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { uploadFileToBucket } from "@/app/utils/upload-file-bucket";
import { Button } from "@/components/ui/button";
import type { AdminBlogPost, BlogPostStatus, BlogTopicWithCount } from "@/lib/blog/types";
import ImageField from "./ImageField";

// react-quill must load client-side only, and next/dynamic drops refs, so the
// ref is forwarded by hand to reach the Quill instance for image uploads.
const ReactQuill = dynamic(
  async () => {
    const { default: RQ } = await import("react-quill");
    const Wrapped = ({
      forwardedRef,
      ...props
    }: React.ComponentProps<typeof RQ> & { forwardedRef: React.Ref<ReactQuillType> }) => (
      <RQ ref={forwardedRef} {...props} />
    );
    return Wrapped;
  },
  { ssr: false, loading: () => <div className="h-[520px] animate-pulse rounded-lg bg-gray-100" /> },
);

const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

/** ISO → value for <input type="datetime-local"> in the admin's local time. */
const toLocalInput = (iso: string | null) => {
  if (!iso) return "";
  const date = new Date(iso);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
};

interface FormState {
  title: string;
  slug: string;
  excerpt: string;
  coverImageUrl: string;
  contentHtml: string;
  authorName: string;
  authorImageUrl: string;
  topicId: string;
  status: BlogPostStatus;
  publishedAt: string;
}

const EMPTY_FORM: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  coverImageUrl: "",
  contentHtml: "",
  authorName: "Benoit Kulesza",
  authorImageUrl:
    "https://goodhive.s3.us-east-005.backblazeb2.com/blog/dbbb20bafdec56e268ca5e6a628baa15ea4553f4-1255x1144-jpg.jpg",
  topicId: "",
  status: "draft",
  publishedAt: "",
};

const inputClass =
  "w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]";

export default function PostEditor({ postId }: { postId?: string }) {
  const router = useRouter();
  const quillRef = useRef<ReactQuillType>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [topics, setTopics] = useState<BlogTopicWithCount[]>([]);
  const [loading, setLoading] = useState(Boolean(postId));
  const [saving, setSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(Boolean(postId));
  const [savedSlug, setSavedSlug] = useState<string | null>(null);
  const [savedStatus, setSavedStatus] = useState<BlogPostStatus | null>(null);
  const [error, setError] = useState("");

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  useEffect(() => {
    const load = async () => {
      try {
        const requests = [fetch("/api/admin/blog/topics", { credentials: "include" })];
        if (postId) requests.push(fetch(`/api/admin/blog/posts/${postId}`, { credentials: "include" }));
        const [topicsRes, postRes] = await Promise.all(requests);

        if (topicsRes.status === 401 || postRes?.status === 401) {
          router.push("/admin/login");
          return;
        }
        if (topicsRes.ok) setTopics(await topicsRes.json());
        if (postRes) {
          if (!postRes.ok) {
            toast.error("Article not found");
            router.push("/admin/blog");
            return;
          }
          const post: AdminBlogPost = await postRes.json();
          setForm({
            title: post.title,
            slug: post.slug,
            excerpt: post.excerpt,
            coverImageUrl: post.coverImageUrl ?? "",
            contentHtml: post.contentHtml,
            authorName: post.authorName,
            authorImageUrl: post.authorImageUrl ?? "",
            topicId: post.topicId ?? "",
            status: post.status,
            publishedAt: toLocalInput(post.publishedAt),
          });
          setSavedSlug(post.slug);
          setSavedStatus(post.status);
        }
      } catch (err) {
        console.error("Error loading blog editor:", err);
        toast.error("Failed to load the article");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [postId, router]);

  const modules = useMemo(
    () => ({
      toolbar: {
        container: [
          [{ header: [2, 3, 4, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          ["blockquote", "code-block", "link", "image"],
          [{ align: [] }],
          ["clean"],
        ],
        handlers: {
          // Upload to our bucket instead of Quill's default base64 inlining.
          image: () => {
            const input = document.createElement("input");
            input.type = "file";
            input.accept = "image/*";
            input.onchange = async () => {
              const file = input.files?.[0];
              const editor = quillRef.current?.getEditor();
              if (!file || !editor) return;
              const toastId = toast.loading("Uploading image…");
              try {
                const url = (await uploadFileToBucket(file)) as string | null;
                if (!url) return;
                const range = editor.getSelection(true);
                editor.insertEmbed(range.index, "image", url, "user");
                editor.setSelection(range.index + 1, 0);
              } finally {
                toast.dismiss(toastId);
              }
            };
            input.click();
          },
        },
      },
    }),
    [],
  );

  const save = async (status: BlogPostStatus) => {
    setSaving(true);
    setError("");
    try {
      const response = await fetch(postId ? `/api/admin/blog/posts/${postId}` : "/api/admin/blog/posts", {
        method: postId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          ...form,
          status,
          publishedAt: form.publishedAt ? new Date(form.publishedAt).toISOString() : "",
        }),
      });
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await response.json();
      if (!response.ok) {
        setError(data.message || "Failed to save the article");
        return;
      }
      toast.success(status === "published" ? "Article published" : "Draft saved");
      if (postId) {
        setForm((prev) => ({ ...prev, status, slug: data.slug }));
        setSavedSlug(data.slug);
        setSavedStatus(status);
      } else {
        router.replace(`/admin/blog/${data.id}` as Route);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save the article");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AdminPageLayout title="Blog article">
        <div className="flex justify-center py-24">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      </AdminPageLayout>
    );
  }

  const isPublished = form.status === "published";

  return (
    <AdminPageLayout
      title={postId ? "Edit article" : "New article"}
      subtitle={
        isPublished
          ? "Published — saving updates the live article right away."
          : "Draft — only admins can see it until you publish."
      }
      breadcrumbLabels={postId ? { [postId]: "Edit" } : undefined}
      actions={
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          {savedSlug && savedStatus === "published" && (
            <Link
              href={`/blog/${savedSlug}` as Route}
              target="_blank"
              className="inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              View live
            </Link>
          )}
          {isPublished ? (
            <>
              <Button variant="outline" disabled={saving} onClick={() => save("draft")}>
                Unpublish
              </Button>
              <Button
                disabled={saving}
                onClick={() => save("published")}
                className="bg-[#FFC905] text-black hover:bg-[#FFC905]/80"
              >
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" disabled={saving} onClick={() => save("draft")}>
                {saving ? "Saving…" : "Save draft"}
              </Button>
              <Button
                disabled={saving}
                onClick={() => save("published")}
                className="bg-[#FFC905] text-black hover:bg-[#FFC905]/80"
              >
                Publish
              </Button>
            </>
          )}
        </div>
      }
    >
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((prev) => ({ ...prev, title, slug: slugTouched ? prev.slug : slugify(title) }));
            }}
            placeholder="Article title"
            className="w-full rounded-md border border-gray-300 px-4 py-3 text-2xl font-bold focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]"
            aria-label="Title"
          />
          <div id="blog-article-editor">
            <ReactQuill
              forwardedRef={quillRef}
              theme="snow"
              modules={modules}
              value={form.contentHtml}
              onChange={(html: string) => set("contentHtml", html)}
              placeholder="Write your article…"
            />
          </div>
        </div>

        <aside className="space-y-5 rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-4 lg:self-start">
          <div>
            <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
              URL
            </label>
            <div className="flex items-center rounded-md border border-gray-300 focus-within:ring-2 focus-within:ring-[#FFC905]">
              <span className="pl-3 text-sm text-gray-400">/blog/</span>
              <input
                id="slug"
                type="text"
                value={form.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
                className="w-full rounded-md px-1 py-2 font-mono text-sm focus:outline-none"
                placeholder="my-article"
              />
            </div>
          </div>

          <div>
            <label htmlFor="topic" className="mb-1 block text-sm font-medium text-gray-700">
              Topic
            </label>
            <select id="topic" value={form.topicId} onChange={(e) => set("topicId", e.target.value)} className={inputClass}>
              <option value="">No topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {topic.name}
                </option>
              ))}
            </select>
          </div>

          <ImageField label="Cover image" value={form.coverImageUrl} onChange={(url) => set("coverImageUrl", url)} />

          <div>
            <label htmlFor="excerpt" className="mb-1 block text-sm font-medium text-gray-700">
              Summary <span className="font-normal text-gray-400">(shown on cards)</span>
            </label>
            <textarea
              id="excerpt"
              value={form.excerpt}
              onChange={(e) => set("excerpt", e.target.value)}
              rows={4}
              maxLength={500}
              className={inputClass}
              placeholder="Leave empty to use the start of the article"
            />
          </div>

          <div>
            <label htmlFor="publishedAt" className="mb-1 block text-sm font-medium text-gray-700">
              Publish date
            </label>
            <input
              id="publishedAt"
              type="datetime-local"
              value={form.publishedAt}
              onChange={(e) => set("publishedAt", e.target.value)}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-gray-500">Empty = now when you publish. A future date schedules it.</p>
          </div>

          <div className="flex items-end gap-3">
            <ImageField
              label="Author"
              shape="avatar"
              value={form.authorImageUrl}
              onChange={(url) => set("authorImageUrl", url)}
            />
            <input
              type="text"
              value={form.authorName}
              onChange={(e) => set("authorName", e.target.value)}
              className={inputClass}
              placeholder="Author name"
              aria-label="Author name"
            />
          </div>
        </aside>
      </div>
    </AdminPageLayout>
  );
}
