import type { Status } from "@/lib/schema";

export const statusStyle: Record<Status, { label: string; className: string }> = {
  submitted: { label: "Submitted", className: "bg-surface-2 text-ink" },
  shortlisted: { label: "Shortlisted", className: "bg-g-blue/20 text-[#8AB4F8]" },
  rejected: { label: "Rejected", className: "bg-g-red/20 text-[#FF8A80]" },
  selected: { label: "Selected", className: "bg-g-green/20 text-[#81C995]" },
};
