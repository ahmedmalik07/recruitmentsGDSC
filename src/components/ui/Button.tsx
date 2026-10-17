import type { ButtonHTMLAttributes, CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  block?: boolean;
};

const EDGE: Record<string, string> = {
  primary: "#0d47a1",
  secondary: "#e2dbc8",
};

/** Chunky game-style button that presses down (Duolingo-ish), AA contrast */
export function Button({ variant = "primary", block, className, type = "button", style, ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-bold tracking-[0.01em] disabled:cursor-not-allowed disabled:opacity-45",
        variant !== "ghost" && "btn-3d",
        variant === "primary" && "bg-g-blue-strong text-white hover:bg-g-blue-stronger",
        variant === "secondary" && "border-2 border-line bg-surface text-ink hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:text-ink",
        block && "w-full",
        className,
      )}
      style={{ ...(EDGE[variant] ? ({ "--btn-edge": EDGE[variant] } as CSSProperties) : {}), ...style }}
      {...rest}
    />
  );
}
