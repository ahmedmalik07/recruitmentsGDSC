"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, m } from "framer-motion";

type Toast = { id: number; text: string; xp?: number };

let counter = 0;
const listeners = new Set<(t: Toast) => void>();

/** Fire a small "+XP / unlocked" toast from anywhere in the quest. */
export function toast(text: string, xp?: number) {
  const t = { id: ++counter, text, xp };
  listeners.forEach((l) => l(t));
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);

  useEffect(() => {
    const onToast = (t: Toast) => {
      setItems((prev) => [...prev.slice(-2), t]);
      window.setTimeout(() => setItems((prev) => prev.filter((p) => p.id !== t.id)), 1800);
    };
    listeners.add(onToast);
    return () => {
      listeners.delete(onToast);
    };
  }, []);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 top-20 z-50 flex flex-col items-center gap-2 px-4"
    >
      <AnimatePresence>
        {items.map((t) => (
          <m.div
            key={t.id}
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8 }}
            className="rounded-full border border-line bg-surface-2 px-4 py-2 text-sm font-semibold shadow-lg"
          >
            {t.xp ? <span className="mr-1.5 text-eyebrow">+{t.xp} XP</span> : null}
            {t.text}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
