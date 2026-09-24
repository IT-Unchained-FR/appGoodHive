"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog } from "@headlessui/react";
import { Plus, RefreshCw, Trash2, Upload } from "lucide-react";
import toast from "react-hot-toast";

import { AdminPageLayout } from "@/app/components/admin/AdminPageLayout";
import { EnhancedTable, Column } from "@/app/components/admin/EnhancedTable";
import { QuickActionFAB } from "@/app/components/admin/QuickActionFAB";
import { Button } from "@/components/ui/button";

interface KnowledgeFile {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

const EMPTY_FORM = { id: "", slug: "", title: "", content: "" };

function slugify(fileName: string) {
  return fileName
    .replace(/\.md$/i, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export default function KnowledgeBasePage() {
  const router = useRouter();
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/knowledge-base", { credentials: "include" });
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      const data = await response.json();
      if (response.ok) setFiles(data);
      else toast.error(data.message || "Failed to load knowledge base files");
    } catch (err) {
      console.error("Error fetching knowledge base files:", err);
      toast.error("Failed to load knowledge base files");
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => {
    setMode("create");
    setForm(EMPTY_FORM);
    setError("");
    setIsOpen(true);
  };

  const openEdit = (file: KnowledgeFile) => {
    setMode("edit");
    setForm({ id: file.id, slug: file.slug, title: file.title, content: file.content });
    setError("");
    setIsOpen(true);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const headingLine = text.split("\n").find((line) => line.startsWith("# "));
    setMode("create");
    setForm({
      id: "",
      slug: slugify(file.name),
      title: headingLine ? headingLine.replace(/^#\s+/, "").trim() : slugify(file.name),
      content: text,
    });
    setError("");
    setIsOpen(true);
    e.target.value = "";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    const url = mode === "create" ? "/api/admin/knowledge-base" : `/api/admin/knowledge-base/${form.id}`;
    const method = mode === "create" ? "POST" : "PUT";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ slug: form.slug, title: form.title, content: form.content }),
      });

      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }

      const data = await response.json();
      if (response.ok) {
        setIsOpen(false);
        toast.success(mode === "create" ? "File created" : "File saved");
        fetchFiles();
      } else {
        setError(data.message || "Failed to save file");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (file: KnowledgeFile) => {
    if (!window.confirm(`Delete "${file.title}" (${file.slug}.md)? This can't be undone.`)) return;
    try {
      const response = await fetch(`/api/admin/knowledge-base/${file.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (response.status === 401) {
        router.push("/admin/login");
        return;
      }
      if (response.ok) {
        toast.success("File deleted");
        fetchFiles();
      } else {
        const data = await response.json();
        toast.error(data.message || "Failed to delete file");
      }
    } catch (err) {
      console.error("Error deleting knowledge base file:", err);
      toast.error("Failed to delete file");
    }
  };

  const columns: Column<KnowledgeFile>[] = [
    { key: "title", header: "Title", sortable: true },
    {
      key: "slug",
      header: "Slug",
      sortable: true,
      render: (value) => <code className="text-xs text-gray-500">{value}.md</code>,
    },
    {
      key: "content",
      header: "Questions",
      render: (value: string) => (value.match(/\n##\s+/g)?.length ?? 0) + (value.trim().startsWith("##") ? 1 : 0),
    },
    { key: "updated_by", header: "Updated by", render: (value) => value ?? "—" },
    {
      key: "updated_at",
      header: "Updated",
      sortable: true,
      render: (value) => new Date(value).toLocaleString(),
    },
    {
      key: "id",
      header: "",
      render: (_value, row) => (
        <div className="flex justify-end gap-2">
          <Button size="sm" variant="outline" onClick={() => openEdit(row)}>
            Edit
          </Button>
          <Button size="sm" variant="outline" onClick={() => handleDelete(row)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <AdminPageLayout
      title="Superbot Knowledge Base"
      subtitle="Content the Superbot widget answers questions from. Edits apply live within ~1 minute — no redeploy."
      actions={
        <div className="flex w-full gap-2 sm:w-auto">
          <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <Upload className="h-4 w-4" />
            Upload .md
            <input type="file" accept=".md,text/markdown" className="hidden" onChange={handleFileUpload} />
          </label>
          <Button
            onClick={openCreate}
            className="w-full gap-2 bg-[#FFC905] text-black hover:bg-[#FFC905]/80 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            New File
          </Button>
        </div>
      }
    >
      <EnhancedTable
        data={files}
        columns={columns}
        searchable
        searchPlaceholder="Search by title or slug..."
        pagination
        itemsPerPage={10}
        loading={loading}
        emptyMessage="No knowledge base files yet"
        getRowId={(row) => row.id}
        mobileCardView
        renderMobileCard={(file) => (
          <div className="space-y-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <div className="font-semibold text-gray-900">{file.title}</div>
            <div className="text-sm text-gray-600">{file.slug}.md</div>
            <div className="text-xs text-gray-500">
              Updated {new Date(file.updated_at).toLocaleString()} by {file.updated_by ?? "—"}
            </div>
            <div className="flex gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => openEdit(file)}>
                Edit
              </Button>
              <Button size="sm" variant="outline" onClick={() => handleDelete(file)}>
                Delete
              </Button>
            </div>
          </div>
        )}
      />

      <Dialog open={isOpen} onClose={() => setIsOpen(false)}>
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-lg bg-white p-4 sm:p-6">
            <Dialog.Title className="mb-4 text-lg font-medium">
              {mode === "create" ? "New Knowledge Base File" : `Edit ${form.slug}.md`}
            </Dialog.Title>

            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="title" className="mb-1 block text-sm font-medium text-gray-700">
                      Title (category shown as the "# Heading")
                    </label>
                    <input
                      type="text"
                      id="title"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]"
                      placeholder="Pricing"
                      required
                    />
                  </div>
                  <div>
                    <label htmlFor="slug" className="mb-1 block text-sm font-medium text-gray-700">
                      Slug (filename, lowercase-with-hyphens)
                    </label>
                    <input
                      type="text"
                      id="slug"
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: slugify(e.target.value) })}
                      className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]"
                      placeholder="pricing"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="content" className="mb-1 block text-sm font-medium text-gray-700">
                    Content — one <code>## Question</code> section per Q&amp;A
                  </label>
                  <textarea
                    id="content"
                    value={form.content}
                    onChange={(e) => setForm({ ...form, content: e.target.value })}
                    rows={16}
                    className="w-full rounded-md border border-gray-300 px-4 py-2 font-mono text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#FFC905]"
                    placeholder={"# Pricing\n\n## Is GoodHive free to use?\nCreating a profile is free...\n"}
                    required
                  />
                </div>

                {error && <p className="mt-2 text-sm text-red-500">{error}</p>}

                <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsOpen(false)}
                    className="w-full sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={saving}
                    className="w-full bg-[#FFC905] text-black hover:bg-[#FFC905]/80 sm:w-auto"
                  >
                    {saving ? "Saving..." : mode === "create" ? "Create File" : "Save Changes"}
                  </Button>
                </div>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      <QuickActionFAB
        actions={[
          { icon: Plus, label: "New file", onClick: openCreate },
          { icon: RefreshCw, label: "Refresh list", onClick: fetchFiles },
        ]}
      />
    </AdminPageLayout>
  );
}
