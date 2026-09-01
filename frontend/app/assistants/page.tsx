"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { api, Assistant } from "@/lib/api";
import { useAuth } from "@/lib/auth-context";

function AssistantsInner() {
  const { user } = useAuth();
  const [assistants, setAssistants] = useState<Assistant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .listAssistants()
      .then(setAssistants)
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load assistants"))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold">Assistants</h1>
          <p className="text-sm text-neutral-500">Purpose-built AI assistants grounded in your company knowledge.</p>
        </div>
        {user?.role === "admin" && (
          <Link
            href="/assistants/new"
            className="rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-sm font-medium"
          >
            New assistant
          </Link>
        )}
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      {loading ? (
        <p className="text-sm text-neutral-500">Loading…</p>
      ) : assistants.length === 0 ? (
        <p className="text-sm text-neutral-500">
          No assistants yet.{" "}
          {user?.role === "admin" ? "Create one to get started." : "Ask an admin to create one."}
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {assistants.map((a) => (
            <Link
              key={a.id}
              href={`/assistants/${a.id}`}
              className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors"
            >
              <p className="font-medium">{a.name}</p>
              <p className="text-sm text-neutral-500 mt-1 line-clamp-2">
                {a.description || "No description"}
              </p>
              <p className="text-xs text-neutral-400 mt-3">
                {a.document_ids.length} document{a.document_ids.length === 1 ? "" : "s"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function AssistantsPage() {
  return (
    <AppShell>
      <AssistantsInner />
    </AppShell>
  );
}
