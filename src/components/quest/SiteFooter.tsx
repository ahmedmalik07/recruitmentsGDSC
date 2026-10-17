import { footer, hosts, site } from "@/content";

/** Help number, WhatsApp group and credit, on every quest screen */
export function SiteFooter() {
  return (
    <footer className="mt-6 flex flex-col items-center gap-2 border-t border-line pt-5 pb-8 text-center text-sm text-muted">
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2">
        <a
          href={`https://wa.me/${site.whatsapp.number}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 hover:text-ink"
        >
          💬 {footer.help} <span className="font-semibold text-link">{site.whatsapp.display}</span>
        </a>
        <a
          href={site.whatsappGroup}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center gap-1.5 font-semibold text-good hover:underline"
        >
          👥 {footer.group}
        </a>
      </div>
      <p>
        {footer.builtBy} <span aria-label="love">❤️</span> by{" "}
        <a href={hosts.ahmed.linkedin} target="_blank" rel="noopener noreferrer" className="font-semibold text-ink hover:underline">
          {footer.builtByName}
        </a>
        , {footer.builtByRole}
      </p>
    </footer>
  );
}
