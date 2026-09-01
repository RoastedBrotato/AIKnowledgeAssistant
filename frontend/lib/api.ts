const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export type User = {
  id: string;
  email: string;
  role: "admin" | "employee";
  org_id: string;
};

export type DocumentItem = {
  id: string;
  filename: string;
  content_type: string;
  status: "processing" | "ready" | "failed";
  created_at: string;
};

export type Assistant = {
  id: string;
  name: string;
  description: string | null;
  system_prompt: string;
  allowed_roles: string[];
  is_active: boolean;
  document_ids: string[];
};

export type Citation = {
  document_id: string;
  filename: string;
  page_number: number | null;
  snippet: string;
};

export type ChatResponse = {
  conversation_id: string;
  answer: string;
  citations: Citation[];
};

function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}

export function setToken(token: string | null) {
  if (typeof window === "undefined") return;
  if (token) localStorage.setItem("token", token);
  else localStorage.removeItem("token");
}

async function request<T>(
  path: string,
  options: RequestInit & { auth?: boolean } = {}
): Promise<T> {
  const { auth = true, headers, ...rest } = options;
  const finalHeaders: Record<string, string> = {
    ...(headers as Record<string, string>),
  };

  if (auth) {
    const token = getToken();
    if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${path}`, { ...rest, headers: finalHeaders });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const body = await res.json();
      detail = body.detail || detail;
    } catch {
      // ignore
    }
    throw new Error(detail);
  }

  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

function jsonBody(data: unknown): RequestInit {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  };
}

export const api = {
  signup: (org_name: string, email: string, password: string) =>
    request<{ access_token: string }>("/auth/signup", {
      ...jsonBody({ org_name, email, password }),
      auth: false,
    }),

  login: (email: string, password: string) =>
    request<{ access_token: string }>("/auth/login", {
      ...jsonBody({ email, password }),
      auth: false,
    }),

  me: () => request<User>("/auth/me"),

  listDocuments: () => request<DocumentItem[]>("/documents"),

  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    const token = getToken();
    return fetch(`${API_BASE}/documents/upload`, {
      method: "POST",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: form,
    }).then(async (res) => {
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Upload failed");
      }
      return res.json() as Promise<DocumentItem>;
    });
  },

  deleteDocument: (id: string) => request<void>(`/documents/${id}`, { method: "DELETE" }),

  listAssistants: () => request<Assistant[]>("/assistants"),

  getAssistant: (id: string) => request<Assistant>(`/assistants/${id}`),

  createAssistant: (data: {
    name: string;
    description?: string;
    system_prompt?: string;
    allowed_roles: string[];
    document_ids: string[];
  }) => request<Assistant>("/assistants", jsonBody(data)),

  updateAssistant: (id: string, data: Partial<Assistant> & { document_ids?: string[] }) =>
    request<Assistant>(`/assistants/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),

  deleteAssistant: (id: string) => request<void>(`/assistants/${id}`, { method: "DELETE" }),

  chat: (assistantId: string, message: string, conversationId?: string) =>
    request<ChatResponse>(
      `/assistants/${assistantId}/chat`,
      jsonBody({ message, conversation_id: conversationId })
    ),
};
