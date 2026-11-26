"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { authClient } from "@/lib/auth-client";
import { CREATE_INVOICE_PATH } from "@/lib/routes";

interface AuthFormProps {
  mode: "sign-in" | "sign-up";
}

function getSafeRedirectUrl(raw: string | null): string {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) {
    return CREATE_INVOICE_PATH;
  }
  return raw;
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignUp = mode === "sign-up";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const redirectTo = getSafeRedirectUrl(searchParams.get("redirect_url"));

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setIsPending(true);

    try {
      if (isSignUp) {
        const result = await authClient.signUp.email({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        if (result.error) {
          setError(result.error.message ?? "Could not create account.");
          return;
        }
        setSuccessMsg("Account created! Redirecting...");
      } else {
        const result = await authClient.signIn.email({
          email: email.trim(),
          password,
        });
        if (result.error) {
          setError(result.error.message ?? "Invalid email or password.");
          return;
        }
        setSuccessMsg("Signed in! Redirecting...");
      }

      router.push(redirectTo);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <div
      className="relative my-auto flex w-full max-w-[1040px] flex-col overflow-hidden rounded-3xl backdrop-blur-xl transition-all duration-300 md:min-h-[640px] md:flex-row"
      style={{
        background: "rgba(10, 10, 12, 0.72)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
        borderTop: "1px solid rgba(255, 255, 255, 0.20)",
        borderLeft: "1px solid rgba(255, 255, 255, 0.20)",
        boxShadow:
          "0 25px 60px rgba(0, 0, 0, 0.8), inset 1px 1px 2px rgba(255, 255, 255, 0.12), inset -1px -1px 4px rgba(0, 0, 0, 0.4)",
      }}
    >
      {/* Left branding panel */}
      <div className="relative flex w-full flex-col justify-between overflow-hidden border-b border-white/10 bg-gradient-to-br from-zinc-900/90 via-black to-zinc-950 p-7 md:w-[45%] md:border-b-0 md:border-r md:p-10">
        <div
          className="pointer-events-none absolute inset-0 opacity-25"
          style={{
            backgroundImage:
              "radial-gradient(circle at 25% 20%, rgba(255,255,255,0.16), transparent 55%), radial-gradient(circle at 80% 80%, rgba(161,161,170,0.12), transparent 50%)",
          }}
        />
        <div className="relative z-10 flex items-center justify-between md:justify-start">
          <Link
            href="/"
            className="text-2xl font-semibold tracking-tight text-white md:text-3xl"
          >
            Billed
          </Link>
        </div>

        <div className="relative z-10 mt-6 hidden flex-col md:mt-0 md:flex">
          <span className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-white/60">
            Invoicing made simple
          </span>
          <h2 className="text-2xl font-bold leading-snug tracking-tight text-white lg:text-3xl">
            Create, send, and track
            <br />
            beautiful invoices in
            <br />
            seconds.
          </h2>
          <p className="mt-4 max-w-xs text-sm text-zinc-400">
            PDF export, payment tracking, revision history, and automated
            overdue reminders in one clean workspace.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="relative z-10 flex w-full flex-col justify-center p-6 sm:p-8 md:w-[55%] md:p-12">
        <div className="mx-auto flex w-full max-w-[390px] flex-col justify-center">
          <div className="mb-6 text-center md:text-left">
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              {isSignUp ? "Create your account" : "Welcome back"}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-400">
              {isSignUp
                ? "Enter your details to start invoicing with Billed."
                : "Enter your credentials to access your workspace."}
            </p>
          </div>

          {(error || successMsg) && (
            <div
              role="alert"
              className={`mb-4 flex items-center rounded-xl border px-4 py-2.5 text-xs font-medium backdrop-blur-md ${
                error
                  ? "border-red-500/30 bg-red-500/10 text-red-400"
                  : "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              }`}
            >
              <span>{error ?? successMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
            {isSignUp && (
              <div>
                <label
                  htmlFor="auth-name"
                  className="mb-1.5 block text-xs font-medium text-zinc-300"
                >
                  Full name
                </label>
                <input
                  id="auth-name"
                  type="text"
                  required
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                />
              </div>
            )}

            <div>
              <label
                htmlFor="auth-email"
                className="mb-1.5 block text-xs font-medium text-zinc-300"
              >
                Email address
              </label>
              <input
                id="auth-email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
              />
            </div>

            <div>
              <label
                htmlFor="auth-password"
                className="mb-1.5 block text-xs font-medium text-zinc-300"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="auth-password"
                  type={showPassword ? "text" : "password"}
                  required
                  minLength={8}
                  autoComplete={isSignUp ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 pr-11 text-sm text-white placeholder:text-zinc-500 outline-none transition-colors focus:border-white/25 focus:bg-white/[0.08]"
                />
                <button
                  type="button"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 cursor-pointer text-zinc-400 transition-colors hover:text-white"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isPending || Boolean(successMsg)}
              className="mt-2 inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 py-3 text-sm font-semibold text-white shadow-[0_4px_12px_rgba(0,0,0,0.2)] transition-all hover:scale-[1.01] hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
              {isPending
                ? "Processing..."
                : isSignUp
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>

          <p className="mt-6 text-center text-xs font-medium text-zinc-400">
            {isSignUp ? "Already have an account?" : "Don’t have an account?"}{" "}
            <Link
              href={isSignUp ? "/sign-in" : "/sign-up"}
              className="text-zinc-200 underline-offset-4 transition-colors hover:text-white hover:underline"
            >
              {isSignUp ? "Sign in" : "Sign up"}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
