import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  block?: boolean;
};

export function Button({ variant = "primary", block, className, type = "button", ...rest }: Props) {
  return (
    <button
      type={type}
      className={cn(
        "inline-flex min-h-12 items-center justify-center gap-2 rounded-2xl px-5 text-base font-semibold transition-[transform,background-color,opacity] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45",
        variant === "primary" && "bg-g-blue-strong text-white hover:bg-g-blue-stronger",
        variant === "secondary" && "border-[1.5px] border-line bg-surface text-ink hover:bg-surface-2",
        variant === "ghost" && "text-muted hover:text-ink",
        block && "w-full",
        className,
      )}
      {...rest}
    />
  );
}
