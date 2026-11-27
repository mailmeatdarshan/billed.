"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LogOut, FileText } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { CREATE_INVOICE_PATH } from "@/lib/routes";

function getInitials(name?: string | null, email?: string | null): string {
  const source = (name || email || "U").trim();
  const parts = source.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export function UserMenu({
  compact = false,
  placement = "bottom-right",
}: {
  compact?: boolean;
  placement?: "bottom-right" | "top-left";
}) {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutsideClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
      return () => document.removeEventListener("mousedown", handleOutsideClick);
    }
  }, [open]);

  if (!session?.user) return null;

  const { name, email } = session.user;
  const initials = getInitials(name, email);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      setOpen(false);
      router.push("/");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
        className="inline-flex h-8 cursor-pointer items-center gap-2 rounded-full border border-black/15 bg-black/5 px-1.5 text-sm font-medium text-black transition-colors hover:border-black/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black/20"
      >
        <span className="flex size-6 items-center justify-center rounded-full bg-black text-xs font-semibold text-white">
          {initials}
        </span>
        {!compact && (
          <span className="hidden max-w-[110px] truncate pr-1.5 sm:inline">
            {name || email}
          </span>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-56 rounded-2xl border border-black/10 bg-white p-2 shadow-lg ${
            placement === "top-left"
              ? "bottom-full left-0 mb-2"
              : "right-0 mt-2"
          }`}
        >
          <div className="border-b border-black/10 px-3 py-2">
            {name && (
              <p className="truncate text-sm font-medium text-black">{name}</p>
            )}
            <p className="truncate text-xs text-zinc-500">{email}</p>
          </div>
          <div className="mt-1 space-y-0.5">
            <Link
              href={CREATE_INVOICE_PATH}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 hover:text-black"
            >
              <FileText className="size-4" />
              New invoice
            </Link>
            <button
              type="button"
              role="menuitem"
              disabled={signingOut}
              onClick={handleSignOut}
              className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
            >
              <LogOut className="size-4" />
              {signingOut ? "Signing out..." : "Sign out"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
