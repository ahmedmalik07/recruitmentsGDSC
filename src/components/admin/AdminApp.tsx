"use client";

import { useCallback, useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type User,
} from "firebase/auth";
import { site } from "@/content";
import { Button } from "@/components/ui/Button";
import { clientAuth, firebaseConfigured } from "@/lib/firebaseClient";
import { adminFetch, ApiError, ERROR_TEXT } from "./api";
import { Dashboard } from "./Dashboard";
import type { Claims } from "./types";

type Gate =
  | { state: "loading"; slow?: boolean }
  | { state: "signedOut" }
  | { state: "checking"; user: User }
  | { state: "denied"; user: User; reason: string; detail?: string }
  | { state: "ok"; user: User; claims: Claims };

const SIGN_IN_ERRORS: Record<string, string> = {
  "auth/unauthorized-domain":
    "This website isn't in Firebase's Authorized domains. Firebase console → Authentication → Settings → Authorized domains → add recruitments.wyibe.com.",
  "auth/operation-not-allowed": "Google sign-in is turned off. Firebase console → Authentication → Sign-in method → enable Google.",
  "auth/network-request-failed": "Network problem while signing in. Check your connection and try again.",
  "auth/invalid-api-key": "NEXT_PUBLIC_FIREBASE_API_KEY in Vercel is wrong. Copy it again from Firebase project settings.",
  "auth/internal-error": "Google sign-in failed inside Firebase. Try again, or try another browser.",
};

export function AdminApp() {
  const [gate, setGate] = useState<Gate>({ state: "loading" });
  const [signInError, setSignInError] = useState<string>();

  const check = useCallback(async (user: User) => {
    setGate({ state: "checking", user });
    try {
      // Fresh token so newly granted roles apply immediately
      await user.getIdToken(true);
      const me = await adminFetch<{ role: "core" | "lead"; domain?: Claims["domain"] }>(user, "/api/admin/me");
      setGate({ state: "ok", user, claims: { role: me.role, domain: me.domain } });
    } catch (e) {
      const err = e instanceof ApiError ? e : new ApiError("network");
      setGate({ state: "denied", user, reason: err.code, detail: err.detail });
    }
  }, []);

  useEffect(() => {
    if (!firebaseConfigured) return;
    const slow = window.setTimeout(() => setGate((g) => (g.state === "loading" ? { state: "loading", slow: true } : g)), 8000);
    const unsub = onAuthStateChanged(clientAuth(), (user) => {
      window.clearTimeout(slow);
      if (!user) setGate({ state: "signedOut" });
      else void check(user);
    });
    return () => {
      window.clearTimeout(slow);
      unsub();
    };
  }, [check]);

  async function signIn() {
    setSignInError(undefined);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(clientAuth(), provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(clientAuth(), provider);
      } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setSignInError(`${SIGN_IN_ERRORS[code] ?? "Sign-in failed. Try again."} (${code || "unknown"})`);
      }
    }
  }

  if (!firebaseConfigured) {
    return (
      <Centered title="Firebase not configured">
        <p className="text-muted">Add the NEXT_PUBLIC_FIREBASE_* variables in Vercel, then redeploy.</p>
        <SetupCheck />
      </Centered>
    );
  }

  if (gate.state === "loading" || gate.state === "checking") {
    return (
      <Centered title={gate.state === "checking" ? "Checking your access…" : "Loading…"}>
        <Spinner />
        {gate.state === "loading" && gate.slow && (
          <p className="text-sm text-muted">
            Firebase sign-in is taking unusually long. Check your connection, or try another browser.
          </p>
        )}
      </Centered>
    );
  }

  if (gate.state === "signedOut") {
    return (
      <Centered title={`${site.appName} Admin`}>
        <p className="text-muted">Core team and leads only.</p>
        <Button onClick={signIn}>Sign in with Google</Button>
        {signInError && (
          <p role="alert" className="rounded-xl bg-g-red/10 p-3 text-sm">
            {signInError}
          </p>
        )}
      </Centered>
    );
  }

  if (gate.state === "denied") {
    return (
      <Centered title="Access denied 🚫">
        <p className="text-muted">
          Signed in as <strong className="text-ink">{gate.user.email}</strong>.
        </p>
        <div className="w-full rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
          <span className="font-semibold text-ink">Reason: </span>
          {ERROR_TEXT[gate.reason] ?? gate.reason}
          {gate.detail && <span className="mt-1 block font-mono text-xs break-words text-ink">{gate.detail}</span>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => check(gate.user)}>Try again</Button>
          <Button variant="secondary" onClick={() => signOut(clientAuth())}>
            Sign out
          </Button>
        </div>
        <SetupCheck />
      </Centered>
    );
  }

  return <Dashboard user={gate.user} claims={gate.claims} onSignOut={() => signOut(clientAuth())} />;
}

type Health = {
  firebaseAdmin: string;
  adminCoreEmails: number;
  adminLeadEmails: number;
  turnstileSecretSet: boolean;
  turnstileSiteKeySet: boolean;
  firebaseWebConfigSet: boolean;
};

/** Live view of /api/health so problems are visible without opening another tab */
function SetupCheck() {
  const [health, setHealth] = useState<Health | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    fetch("/api/health", { cache: "no-store", signal: AbortSignal.timeout(20_000) })
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setFailed(true));
  }, []);

  const row = (ok: boolean, label: string, hint?: string) => (
    <li className="flex gap-2">
      <span aria-hidden="true">{ok ? "✅" : "❌"}</span>
      <span>
        {label}
        {!ok && hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </li>
  );

  return (
    <section className="w-full rounded-2xl border border-line bg-surface p-4 text-sm">
      <h2 className="mb-2 font-bold">Setup check</h2>
      {failed && <p className="text-danger">Couldn&apos;t reach /api/health.</p>}
      {!health && !failed && <p className="text-muted">Checking…</p>}
      {health && (
        <ul className="flex flex-col gap-1.5">
          {row(
            health.firebaseAdmin === "ok",
            health.firebaseAdmin === "ok" ? "Firebase Admin key works" : `Firebase Admin: ${health.firebaseAdmin}`,
            "Easiest fix: in Vercel add FIREBASE_SERVICE_ACCOUNT with the whole key JSON file pasted in, then redeploy.",
          )}
          {row(
            health.adminCoreEmails + health.adminLeadEmails > 0,
            `Admin list: ${health.adminCoreEmails} core, ${health.adminLeadEmails} lead`,
            "Add ADMIN_CORE_EMAILS in Vercel, then redeploy.",
          )}
          {row(health.turnstileSecretSet && health.turnstileSiteKeySet, "Bot check (Turnstile) keys set")}
          {row(health.firebaseWebConfigSet, "Firebase web config set")}
        </ul>
      )}
    </section>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-8 w-8 animate-spin rounded-full border-4 border-surface-2 border-t-g-blue motion-reduce:animate-none"
    />
  );
}

function Centered({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-lg flex-col items-start justify-center gap-4 px-4 py-10">
      <h1 className="text-3xl font-bold">{title}</h1>
      {children}
    </main>
  );
}
