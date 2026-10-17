"use client";

import { m } from "framer-motion";
import { LINK_KINDS, MAX_LINKS, level5, linkKinds, type Domain, type LinkKind } from "@/content";
import { detectLinkKind, isHttpUrl, normalizeLink, type PortfolioLink } from "@/lib/links";
import { useInstant } from "./state";

type Props = {
  links: PortfolioLink[];
  house: Domain;
  showErrors: boolean;
  touched: boolean;
  onChange: (links: PortfolioLink[]) => void;
  onBlur: () => void;
};

export const linkInputId = (i: number) => `f-link-${i}`;

export function linkRowError(link: PortfolioLink): string | undefined {
  const url = link.url.trim();
  if (!url) return undefined;
  return isHttpUrl(normalizeLink(link.kind, url)) ? undefined : "That link doesn't look right";
}

/**
 * Up to MAX_LINKS portfolio links of any kind. Tap a chip to add a row of that kind;
 * the icon on each row is a (transparent) select, so the kind can be changed too.
 * Pasted links switch to the right kind automatically (a Behance URL gets the Behance icon).
 */
export function LinksEditor({ links, house, showErrors, touched, onChange, onBlur }: Props) {
  const instant = useInstant();
  // Show one empty row of the house's main kind until they add something
  const rows: PortfolioLink[] = links.length ? links : [{ kind: house.linkKinds[0], url: "" }];
  const order = [...house.linkKinds, ...LINK_KINDS.filter((k) => !house.linkKinds.includes(k))];
  const full = rows.length >= MAX_LINKS;

  const update = (i: number, patch: Partial<PortfolioLink>) =>
    onChange(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  function add(kind: LinkKind) {
    // Reuse the empty starter row instead of stacking a second empty one
    const emptyAt = rows.findIndex((r) => !r.url.trim());
    const next = emptyAt >= 0 ? rows.map((r, j) => (j === emptyAt ? { ...r, kind } : r)) : [...rows, { kind, url: "" }];
    onChange(next);
    const focusAt = emptyAt >= 0 ? emptyAt : next.length - 1;
    requestAnimationFrame(() => document.getElementById(linkInputId(focusAt))?.focus());
  }

  function remove(i: number) {
    onChange(rows.filter((_, j) => j !== i));
  }

  function tidy(i: number) {
    const r = rows[i];
    const url = normalizeLink(r.kind, r.url);
    update(i, { url, kind: detectLinkKind(url) ?? r.kind });
    onBlur();
  }

  return (
    <fieldset className="flex flex-col gap-2.5">
      <legend className="mb-1.5 text-[15px] leading-snug font-semibold text-ink">
        {level5.links.label}
        <span className="ml-1.5 text-sm font-normal text-muted">(optional)</span>
      </legend>
      <p id="f-links-help" className="-mt-1 text-sm text-muted">
        {level5.links.help}
      </p>

      {rows.map((row, i) => {
        const info = linkKinds[row.kind];
        const error = showErrors || touched ? linkRowError(row) : undefined;
        return (
          <m.div
            key={i}
            initial={instant ? false : { opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col gap-1"
          >
            <div className="flex items-stretch gap-2">
              <label
                className="relative grid w-12 shrink-0 place-items-center rounded-[14px] border-[1.5px] text-xl focus-within:ring-[3px] focus-within:ring-g-blue/35"
                style={{
                  borderColor: house.color,
                  background: `${house.color}1f`,
                }}
                title={`${level5.links.kind}: ${info.label}`}
              >
                <span aria-hidden="true">{info.icon}</span>
                <select
                  className="absolute inset-0 cursor-pointer opacity-0"
                  aria-label={`${level5.links.kind} ${i + 1}`}
                  value={row.kind}
                  onChange={(e) => update(i, { kind: e.target.value as LinkKind })}
                >
                  {order.map((k) => (
                    <option key={k} value={k}>
                      {linkKinds[k].icon} {linkKinds[k].label}
                    </option>
                  ))}
                </select>
              </label>
              <input
                id={linkInputId(i)}
                className="field-input min-w-0 flex-1"
                type="text"
                inputMode="url"
                autoComplete={i === 0 ? "url" : "off"}
                autoCapitalize="none"
                spellCheck={false}
                maxLength={300}
                placeholder={info.placeholder}
                value={row.url}
                onChange={(e) => update(i, { url: e.target.value })}
                onBlur={() => tidy(i)}
                aria-label={`${info.label} ${level5.links.url.toLowerCase()} ${i + 1}`}
                aria-invalid={Boolean(error)}
                aria-describedby={error ? `${linkInputId(i)}-error` : "f-links-help"}
              />
              {(rows.length > 1 || row.url) && (
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="grid w-11 shrink-0 place-items-center rounded-[14px] border-[1.5px] border-line bg-surface text-muted hover:text-danger"
                  aria-label={`${level5.links.remove} ${i + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
            {error && (
              <p id={`${linkInputId(i)}-error`} role="alert" className="text-sm font-medium text-danger">
                {error}
              </p>
            )}
          </m.div>
        );
      })}

      {!full && (
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label={level5.links.add}>
          <span className="mr-0.5 text-xs font-bold tracking-wide text-muted uppercase">+ Add</span>
          {order.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => add(k)}
              className="inline-flex min-h-9 items-center gap-1 rounded-full border-2 border-line bg-surface px-2.5 text-sm font-semibold transition-transform hover:-translate-y-0.5 active:scale-95"
            >
              <span aria-hidden="true">{linkKinds[k].icon}</span>
              {linkKinds[k].label}
            </button>
          ))}
        </div>
      )}
    </fieldset>
  );
}
