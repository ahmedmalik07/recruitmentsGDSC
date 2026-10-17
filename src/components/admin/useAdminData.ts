"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "firebase/auth";
import { adminFetch, ApiError } from "./api";
import type { ApplicationDoc, ReviewDoc, Row } from "./types";

const POLL_MS = 30_000;

/**
 * Applications + reviews for this admin, loaded through the server API.
 * Refreshes every 30s while the tab is visible, and right after any change.
 */
export function useAdminData(user: User) {
  const [apps, setApps] = useState<ApplicationDoc[] | null>(null);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [error, setError] = useState<ApiError | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastLoaded, setLastLoaded] = useState<number | null>(null);
  const busy = useRef(false);

  const refresh = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setLoading(true);
    try {
      const data = await adminFetch<{ applications: ApplicationDoc[]; reviews: ReviewDoc[] }>(user, "/api/admin/applications");
      setApps(data.applications);
      setReviews(data.reviews);
      setError(null);
      setLastLoaded(Date.now());
    } catch (e) {
      setError(e instanceof ApiError ? e : new ApiError("network"));
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    const first = window.setTimeout(refresh, 0);
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
    const byRoll = new Map<string, ReviewDoc[]>();
    for (const r of reviews) {
      const list = byRoll.get(r.rollNo) ?? [];
      list.push(r);
      byRoll.set(r.rollNo, list);
    }
    return apps.map((a) => {
      const rs = byRoll.get(a.id) ?? [];
      const avg = rs.length ? rs.reduce((s, r) => s + r.rating, 0) / rs.length : null;
      return { ...a, reviews: rs, avgRating: avg };
    });
  }, [apps, reviews]);

  return { rows, error, loading, lastLoaded, refresh };
}
