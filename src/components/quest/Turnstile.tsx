"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";
import { errors } from "@/content";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  reset: (id?: string) => void;
  remove: (id: string) => void;
};

declare global {
  interface Window {
    turnstile?: TurnstileApi;
    __turnstileLoading?: Promise<void>;
  }
}

const SCRIPT_SRC = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";

function loadScript(): Promise<void> {
  if (window.turnstile) return Promise.resolve();
  if (window.__turnstileLoading) return window.__turnstileLoading;
  window.__turnstileLoading = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = SCRIPT_SRC;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => {
      window.__turnstileLoading = undefined;
      reject(new Error("turnstile script failed"));
    };
    document.head.appendChild(s);
  });
  return window.__turnstileLoading;
}

export type TurnstileHandle = { reset: () => void };

/**
 * Cloudflare Turnstile, loaded only on the Review level so the rest of the
 * quest stays light. Without NEXT_PUBLIC_TURNSTILE_SITE_KEY (local dev) it
 * returns a dev token; the API only accepts that when no secret is configured
 * outside production.
 */
export const Turnstile = forwardRef<TurnstileHandle, { onToken: (t: string | null) => void }>(
  function Turnstile({ onToken }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    const el = useRef<HTMLDivElement>(null);
    const widgetId = useRef<string | null>(null);
    const onTokenRef = useRef(onToken);
    const [failed, setFailed] = useState(false);

    useEffect(() => {
      onTokenRef.current = onToken;
    }, [onToken]);

    useImperativeHandle(ref, () => ({
      reset() {
        onTokenRef.current(siteKey ? null : "dev-token");
        if (window.turnstile && widgetId.current) window.turnstile.reset(widgetId.current);
      },
    }));

    useEffect(() => {
      if (!siteKey) {
        onTokenRef.current("dev-token");
        return;
      }
      let cancelled = false;
      loadScript()
        .then(() => {
          if (cancelled || !el.current || !window.turnstile) return;
          widgetId.current = window.turnstile.render(el.current, {
            sitekey: siteKey,
            theme: "light",
            size: "flexible",
            appearance: "interaction-only",
            callback: (token: string) => onTokenRef.current(token),
            "expired-callback": () => onTokenRef.current(null),
            "error-callback": () => {
              onTokenRef.current(null);
              return false;
            },
          });
        })
        .catch(() => setFailed(true));
      return () => {
        cancelled = true;
        if (window.turnstile && widgetId.current) {
          try {
            window.turnstile.remove(widgetId.current);
          } catch {
            // already gone
          }
        }
        widgetId.current = null;
      };
    }, [siteKey]);

    if (!siteKey) {
      return <p className="text-xs text-muted">Dev mode: Turnstile site key not set, bot check skipped.</p>;
    }
    return (
      <div>
        <div ref={el} className="min-h-[1px]" />
        {failed && (
          <p role="alert" className="text-sm text-danger">
            {errors.turnstileLoad}
          </p>
        )}
      </div>
    );
  },
);
