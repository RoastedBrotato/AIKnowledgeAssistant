"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import { api, DocumentItem } from "@/lib/api";

function NewAssistantInner() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(
    "You are a helpful company knowledge assistant. Answer clearly and always cite your sources."
  );
  const [allowedRoles, setAllowedRoles] = useState<string[]>(["admin", "employee"]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.listDocuments().then((docs) => setDocuments(docs.filter((d) => d.status === "ready")));
  }, []);

  function toggleRole(role: string) {
    setAllowedRoles((prev) => (prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]));
  }

  function toggleDoc(id: string) {
    setSelectedDocs((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const assistant = await api.createAssistant({
        name,
        description,
        system_prompt: systemPrompt,
        allowed_roles: allowedRoles,
        document_ids: selectedDocs,
      });
      router.push(`/assistants/${assistant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create assistant");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold">New assistant</h1>
        <p className="text-sm text-neutral-500">Scope it to specific documents and roles.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label className="block text-sm mb-1">Name</label>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="HR Assistant"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:focus:border-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Description</label>
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Policies, leave, benefits, onboarding"
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:focus:border-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-1">Instructions (system prompt)</label>
          <textarea
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            rows={4}
            className="w-full rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:focus:border-white"
          />
        </div>

        <div>
          <label className="block text-sm mb-2">Who can use this assistant</label>
          <div className="flex gap-4">
            {["admin", "employee"].map((role) => (
              <label key={role} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={allowedRoles.includes(role)}
                  onChange={() => toggleRole(role)}
                />
                {role}
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm mb-2">Knowledge (documents this assistant can see)</label>
          {documents.length === 0 ? (
            <p className="text-sm text-neutral-500">
              No ready documents yet. Upload some on the Documents page first.
            </p>
          ) : (
            <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg divide-y divide-neutral-200 dark:divide-neutral-800 max-h-64 overflow-y-auto">
              {documents.map((doc) => (
                <label key={doc.id} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedDocs.includes(doc.id)}
                    onChange={() => toggleDoc(doc.id)}
                  />
                  {doc.filename}
                </label>
              ))}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          {submitting ? "Creating…" : "Create assistant"}
        </button>
      </form>
    </div>
  );
}

export default function NewAssistantPage() {
  return (
    <AppShell>
      <NewAssistantInner />
    </AppShell>
  );
}
