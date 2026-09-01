"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";

export default function AppShell({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [loading, user, router]);

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-neutral-500">Loading…</div>;
  }

  if (!user) return null;

  const navLink = (href: string, label: string) => (
    <Link
      href={href}
      className={`text-sm px-3 py-2 rounded-md transition-colors ${
        pathname?.startsWith(href)
          ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
          : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-300 dark:hover:bg-neutral-800"
      }`}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-neutral-200 dark:border-neutral-800">
        <div className="max-w-5xl mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-900 dark:text-white">KnowledgeOS</span>
            <nav className="flex items-center gap-1 ml-6">
              {navLink("/assistants", "Assistants")}
              {user.role === "admin" && navLink("/documents", "Documents")}
            </nav>
          </div>
          <div className="flex items-center gap-3 text-sm text-neutral-500">
            <span>
              {user.email} <span className="text-xs uppercase text-neutral-400">({user.role})</span>
            </span>
            <button
              onClick={logout}
              className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white"
            >
              Log out
            </button>
          </div>
        </div>
      </header>
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8">{children}</main>
    </div>
  );
}
