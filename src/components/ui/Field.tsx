import type { ReactNode } from "react";

type Props = {
  id: string;
  label: ReactNode;
  error?: string;
  help?: ReactNode;
  optional?: boolean;
  children: ReactNode;
};

/** Label + control + help + error, wired with ids for aria-describedby. */
export function Field({ id, label, error, help, optional, children }: Props) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] leading-snug font-semibold text-ink">
        {label}
        {optional && <span className="ml-1.5 text-sm font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {help && !error && (
        <p id={`${id}-help`} className="text-sm text-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function describedBy(id: string, error?: string, help?: boolean): string | undefined {
  if (error) return `${id}-error`;
  if (help) return `${id}-help`;
  return undefined;
}
