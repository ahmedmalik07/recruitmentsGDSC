"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { adminFetch, ApiError } from "./api";
import type { ApplicationDoc, ReviewDoc, Row } from "./types";

const POLL_MS = 45_000;

type Payload = { applications: ApplicationDoc[]; syncedAt: number; full: boolean };

/**
 * Applications for this admin, through the server API.
 * First load reads everything once; after that only what changed since the last sync
 * (about 1 database read per refresh), so the free plan's daily read limit is never at risk.
 * Refreshes every 45s while the tab is visible, and right after any change you make.
 */
export function useAdminData(user: User) {
  const [apps, setApps] = useState<Map<string, ApplicationDoc> | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<number | null>(null);
  const busy = useRef(false);
  const syncedAt = useRef<number | null>(null);

  const refresh = useCallback(
    async (opts: { full?: boolean } = {}) => {
      if (busy.current) return;
      busy.current = true;
      setLoading(true);
      try {
        const since = opts.full ? null : syncedAt.current;
        const data = await adminFetch<Payload>(user, `/api/admin/applications${since ? `?since=${since}` : ""}`);
        setApps((prev) => {
          const next = data.full || !prev ? new Map<string, ApplicationDoc>() : new Map(prev);
          for (const a of data.applications) next.set(a.id, a);
          return next;
        });
        syncedAt.current = data.syncedAt;
        setError(null);
        setLastLoaded(Date.now());
      } catch (e) {
        setError(e instanceof ApiError ? e : new ApiError("network"));
      } finally {
        busy.current = false;
        setLoading(false);
      }
    },
    [user],
  );

  useEffect(() => {
    const first = window.setTimeout(() => refresh({ full: true }), 0);
    const id = window.setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, POLL_MS);
    const onVisible = () => document.visibilityState === "visible" && refresh();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  const rows: Row[] | null = useMemo(() => {
    if (!apps) return null;
    return Array.from(apps.values()).map((a) => {
      const reviews: ReviewDoc[] = Object.entries(a.ratings ?? {}).map(([uid, r]) => ({
        reviewerUid: uid,
        rollNo: a.id,
        domain: a.domain,
        rating: r.rating,
        notes: r.notes,
        reviewerName: r.reviewerName,
        reviewerEmail: r.reviewerEmail,
        createdAt: null,
        updatedAt: r.updatedAt,
      }));
      const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
      return { ...a, reviews, avgRating: avg };
    });
  }, [apps]);

  const manualRefresh = useCallback(() => refresh({ full: true }), [refresh]);
  return { rows, error, loading, lastLoaded, refresh, manualRefresh };
}
