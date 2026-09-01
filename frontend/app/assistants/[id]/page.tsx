"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import AppShell from "@/components/AppShell";
import { api, Assistant, Citation } from "@/lib/api";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
  citations?: Citation[];
};

function CitationCard({ index, citation }: { index: number; citation: Citation }) {
  const [expanded, setExpanded] = useState(false);
  return (
    <button
      onClick={() => setExpanded((v) => !v)}
      className="text-left text-xs border border-neutral-200 dark:border-neutral-800 rounded-md px-3 py-2 hover:border-neutral-400 dark:hover:border-neutral-600 transition-colors max-w-xs"
    >
      <div className="flex items-center gap-1.5 font-medium">
        <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 text-[10px]">
          {index}
        </span>
        <span className="truncate">{citation.filename}</span>
        {citation.page_number && <span className="text-neutral-400">p.{citation.page_number}</span>}
      </div>
      {expanded && <p className="mt-2 text-neutral-500 whitespace-pre-wrap">{citation.snippet}</p>}
    </button>
  );
}

function ChatInner() {
  const params = useParams<{ id: string }>();
  const assistantId = params.id;

  const [assistant, setAssistant] = useState<Assistant | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    api.getAssistant(assistantId).then(setAssistant).catch(() => setAssistant(null));
  }, [assistantId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!input.trim() || sending) return;

    const question = input.trim();
    setInput("");
    setError(null);
    setMessages((prev) => [...prev, { role: "user", content: question }]);
    setSending(true);

    try {
      const res = await api.chat(assistantId, question, conversationId);
      setConversationId(res.conversation_id);
      setMessages((prev) => [...prev, { role: "assistant", content: res.answer, citations: res.citations }]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to get a response");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <div className="mb-4">
        <h1 className="text-lg font-semibold">{assistant?.name ?? "Assistant"}</h1>
        {assistant?.description && <p className="text-sm text-neutral-500">{assistant.description}</p>}
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pr-1">
        {messages.length === 0 && (
          <p className="text-sm text-neutral-500">Ask this assistant a question about its documents.</p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-2xl ${m.role === "user" ? "" : "w-full"}`}>
              <div
                className={`rounded-lg px-4 py-2 text-sm whitespace-pre-wrap ${
                  m.role === "user"
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                    : "bg-neutral-100 dark:bg-neutral-800"
                }`}
              >
                {m.content}
              </div>
              {m.citations && m.citations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {m.citations.map((c, ci) => (
                    <CitationCard key={ci} index={ci + 1} citation={c} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        {sending && <p className="text-sm text-neutral-400">Thinking…</p>}
        <div ref={bottomRef} />
      </div>

      {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

      <form onSubmit={onSubmit} className="mt-4 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question…"
          className="flex-1 rounded-md border border-neutral-300 dark:border-neutral-700 bg-transparent px-3 py-2 text-sm outline-none focus:border-neutral-900 dark:focus:border-white"
        />
        <button
          type="submit"
          disabled={sending}
          className="rounded-md bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 px-4 py-2 text-sm font-medium disabled:opacity-50"
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default function ChatPage() {
  return (
    <AppShell>
      <ChatInner />
    </AppShell>
  );
}
