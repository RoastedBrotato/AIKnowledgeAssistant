"use client";

import { ChangeEvent, useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api, DocumentItem } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function StatusBadge({ status }: { status: DocumentItem["status"] }) {
  const styles: Record<DocumentItem["status"], string> = {
    ready: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
    processing: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300",
    failed: "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${styles[status]}`}>{status}</span>
  );
}

function DocumentsInner() {
  const { user } = useAuth();
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      setDocuments(await api.listDocuments());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load documents");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api
      .listDocuments()
      .then(setDocuments)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load documents"))
      .finally(() => setLoading(false));
  }, []);

  async function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setUploading(true);
    try {
      await api.uploadDocument(file);
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  async function onDelete(id: string) {
    if (!confirm("Delete this document? Any assistants using it will lose that source.")) return;
    await api.deleteDocument(id);
    await refresh();
  }

  if (user && user.role !== "admin") {
    return <p className="text-sm text-neutral-500">Only admins can manage documents.</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Documents</h1>
          <p className="text-sm text-neutral-500">Upload PDF or DOCX files to make them available to assistants.</p>
        </div>
        <label className="cursor-pointer rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-sm font-medium">
          {uploading ? "Uploading…" : "Upload document"}
          <input
            type="file"
            accept=".pdf,.docx"
            className="hidden"
            disabled={uploading}
            onChange={onFileChange}
          />
        </label>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : documents.length === 0 ? (
        <p className="text-sm text-neutral-500">No documents yet. Upload one to get started.</p>
      ) : (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-800">
          {documents.map((doc) => (
            <div key={doc.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="text-sm font-medium">{doc.filename}</p>
                <p className="text-xs text-neutral-500">{new Date(doc.created_at).toLocaleString()}</p>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={doc.status} />
                <button
                  onClick={() => onDelete(doc.id)}
                  className="text-xs text-neutral-500 hover:text-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentsPage() {
  return (
    <AppShell>
      <DocumentsInner />
    </AppShell>
  );
}
