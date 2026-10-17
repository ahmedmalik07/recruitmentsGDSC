import type { Status } from "@/lib/schema";

export const statusStyle: Record<Status, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-surface-2 text-ink" },
  shortlisted: { label: "Shortlisted", className: "bg-g-blue/12 text-link" },
  rejected: { label: "Rejected", className: "bg-g-red/10 text-danger" },
  selected: { label: "Selected", className: "bg-g-green/15 text-good" },
};
