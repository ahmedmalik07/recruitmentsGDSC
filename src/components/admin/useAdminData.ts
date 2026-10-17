"use client";

import { useEffect, useMemo, useState } from "react";
import { collection, collectionGroup, onSnapshot, query, where } from "firebase/firestore";
import { clientDb } from "@/lib/firebaseClient";
import type { ApplicationDoc, Claims, ReviewDoc, Row } from "./types";

/**
 * Live applications + reviews for this admin's scope.
 * Rules are not filters, so leads always query with their domain.
 */
export function useAdminData(claims: Claims) {
  const [apps, setApps] = useState<ApplicationDoc[] | null>(null);
  const [reviews, setReviews] = useState<ReviewDoc[]>([]);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const db = clientDb();
    const appsQuery =
      claims.role === "lead"
        ? query(collection(db, "applications"), where("domain", "==", claims.domain))
        : collection(db, "applications");
    const reviewsQuery =
      claims.role === "lead"
        ? query(collectionGroup(db, "reviews"), where("domain", "==", claims.domain))
        : collectionGroup(db, "reviews");

    const unsubApps = onSnapshot(
      appsQuery,
      (snap) => setApps(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<ApplicationDoc, "id">) }))),
      (e) => setError(e.message),
    );
    const unsubReviews = onSnapshot(
      reviewsQuery,
      (snap) =>
        setReviews(snap.docs.map((d) => ({ reviewerUid: d.id, ...(d.data() as Omit<ReviewDoc, "reviewerUid">) }))),
      (e) => setError(e.message),
    );
    return () => {
      unsubApps();
      unsubReviews();
    };
  }, [claims.role, claims.domain]);

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

  return { rows, error };
}
