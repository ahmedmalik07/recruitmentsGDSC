import { follow, site } from "@/content";

/** Instagram + LinkedIn buttons for the chapter */
export function FollowLinks() {
  const base =
    "inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-2xl border-[1.5px] border-line bg-surface px-4 text-sm font-semibold hover:bg-surface-2";
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-semibold text-muted">{follow.title}</p>
      <div className="flex gap-2">
        <a href={site.instagram} target="_blank" rel="noopener noreferrer" className={base}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#C13584" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="5" />
            <circle cx="12" cy="12" r="4" />
            <circle cx="17.5" cy="6.5" r="1" fill="#C13584" stroke="none" />
          </svg>
          {follow.instagram} <span className="text-muted">{site.igHandle}</span>
          <span className="sr-only">(opens in a new tab)</span>
        </a>
        <a href={site.linkedin} target="_blank" rel="noopener noreferrer" className={base} title={site.linkedinName}>
          <svg aria-hidden="true" viewBox="0 0 24 24" width="18" height="18" fill="#0A66C2">
            <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z" />
          </svg>
          {follow.linkedin}
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </div>
    </div>
  );
}
