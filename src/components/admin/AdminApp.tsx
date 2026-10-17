"use client";

import { useEffect, useState } from "react";
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  type IdTokenResult,
  type User,
} from "firebase/auth";
import { DOMAIN_IDS, site, type DomainId } from "@/content";
import { Button } from "@/components/ui/Button";
import { clientAuth, firebaseConfigured } from "@/lib/firebaseClient";
import { Dashboard } from "./Dashboard";
import type { Claims } from "./types";

type Gate =
  | { state: "loading" }
  | { state: "signedOut" }
  | { state: "denied"; user: User; reason?: string; detail?: string }
  | { state: "ok"; user: User; claims: Claims };

export function AdminApp() {
  const [gate, setGate] = useState<Gate>({ state: "loading" });
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!firebaseConfigured) return;
    const auth = clientAuth();
    return onAuthStateChanged(auth, async (user) => {
      if (!user) return setGate({ state: "signedOut" });
      try {
        // Force refresh so claims set by scripts/set-claims.ts show up right away
        let claims = claimsFrom(await user.getIdTokenResult(true));
        let reason: string | undefined;
        let detail: string | undefined;
        if (!claims) {
          // Not an admin yet: ask the server, which grants access to allowlisted emails
          const res = await fetch("/api/admin/claim", {
            method: "POST",
            headers: { Authorization: `Bearer ${await user.getIdToken()}` },
          });
          if (res.ok) claims = claimsFrom(await user.getIdTokenResult(true));
          else {
            const body = (await res.json().catch(() => null)) as { error?: string; detail?: string } | null;
            reason = body?.error ?? `http_${res.status}`;
            detail = body?.detail;
          }
        }
        setGate(claims ? { state: "ok", user, claims } : { state: "denied", user, reason, detail });
      } catch {
        setGate({ state: "denied", user, reason: "network" });
      }
    });
  }, []);

  async function signIn() {
    setError(undefined);
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    try {
      await signInWithPopup(clientAuth(), provider);
    } catch (e) {
      const code = (e as { code?: string }).code ?? "";
      if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
        await signInWithRedirect(clientAuth(), provider);
      } else if (code !== "auth/popup-closed-by-user" && code !== "auth/cancelled-popup-request") {
        setError("Sign-in failed. Try again.");
      }
    }
  }

  if (!firebaseConfigured) {
    return (
      <Centered title="Firebase not configured">
        <p className="text-muted">Add the NEXT_PUBLIC_FIREBASE_* variables from .env.example, then restart.</p>
      </Centered>
    );
  }

  if (gate.state === "loading") return <Centered title="Loading…" />;

  if (gate.state === "signedOut") {
    return (
      <Centered title={`${site.appName} Admin`}>
        <p className="text-muted">Core team and leads only.</p>
        <Button onClick={signIn}>Sign in with Google</Button>
        {error && (
          <p role="alert" className="text-sm text-danger">
            {error}
          </p>
        )}
      </Centered>
    );
  }

  if (gate.state === "denied") {
    return (
      <Centered title="Access denied 🚫">
        <p className="text-muted">
          <strong className="text-ink">{gate.user.email}</strong> isn&apos;t on the admin list. Ask Ahmed to add it to{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">ADMIN_CORE_EMAILS</code> (or{" "}
          <code className="rounded bg-surface-2 px-1.5 py-0.5 text-sm">ADMIN_LEAD_EMAILS</code>) in Vercel, redeploy, then
          sign in again.
        </p>
        {gate.reason && (
          <p className="rounded-xl bg-surface-2 px-3 py-2 text-sm text-muted">
            <span className="font-semibold text-ink">Reason: </span>
            {DENY_REASONS[gate.reason] ?? gate.reason}
            {gate.detail && <span className="mt-1 block font-mono text-xs text-ink">{gate.detail}</span>}
          </p>
        )}
        <Button variant="secondary" onClick={() => signOut(clientAuth())}>
          Sign out
        </Button>
      </Centered>
    );
  }

  return <Dashboard user={gate.user} claims={gate.claims} onSignOut={() => signOut(clientAuth())} />;
}

const DENY_REASONS: Record<string, string> = {
  allowlist_not_configured:
    "The server has no admin list. Add ADMIN_CORE_EMAILS in Vercel (Production), then redeploy: new variables only apply to new deployments.",
  not_allowlisted: "The admin list is set, but this email isn't on it. Check the spelling in ADMIN_CORE_EMAILS.",
  email_not_verified: "This Google account's email isn't verified.",
  invalid_token: "Sign-in token was rejected. Sign out and sign in again.",
  server: "The server couldn't save the admin role. Check FIREBASE_* variables in Vercel.",
  network: "Couldn't reach the server. Check your connection and try again.",
  server_config:
    "The server's Firebase settings in Vercel are broken, so it can't check admins (or save applications). Fix the variable named below, then redeploy.",
  http_500: "The server crashed. Check the Firebase variables in Vercel, then redeploy.",
};

function claimsFrom(token: IdTokenResult): Claims | null {
  const role = token.claims.role;
  const domain = token.claims.domain as DomainId | undefined;
  if (role === "core") return { role: "core" };
  if (role === "lead" && domain && (DOMAIN_IDS as readonly string[]).includes(domain)) return { role: "lead", domain };
  return null;
}

function Centered({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-start justify-center gap-4 px-4">
      <h1 className="text-3xl font-bold">{title}</h1>
      {children}
    </main>
  );
}
