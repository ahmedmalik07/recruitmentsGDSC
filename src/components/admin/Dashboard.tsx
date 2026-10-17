"use client";

import { useMemo, useState } from "react";
import type { User } from "firebase/auth";
import { DOMAIN_IDS, domains, site, type DomainId } from "@/content";
import { STATUSES, type Status } from "@/lib/schema";
import { statusStyle } from "./status";
import { Button } from "@/components/ui/Button";
import { CandidateDrawer } from "./CandidateDrawer";
import { Stats } from "./Stats";
import { downloadCsv } from "./csv";
import { useAdminData } from "./useAdminData";
import type { Claims, Row } from "./types";

type Sort = "newest" | "oldest" | "rating_desc" | "rating_asc";


export function Dashboard({ user, claims, onSignOut }: { user: User; claims: Claims; onSignOut: () => void }) {
  const { rows, error } = useAdminData(claims);
  const [domain, setDomain] = useState<DomainId | "">("");
  const [semester, setSemester] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState<Status | "">("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<Sort>("newest");
  const [openId, setOpenId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!rows) return [];
    const q = search.trim().toLowerCase();
    const out = rows.filter(
      (r) =>
        (!domain || r.domain === domain) &&
        (!semester || r.semester === Number(semester)) &&
        (!department || r.department.toLowerCase().includes(department.trim().toLowerCase())) &&
        (!status || r.status === status) &&
        (!q || r.rollNo.includes(q) || r.fullName.toLowerCase().includes(q)),
    );
    const time = (r: Row) => r.createdAt?.toMillis() ?? 0;
    const rating = (r: Row, empty: number) => r.avgRating ?? empty;
    out.sort((a, b) => {
      switch (sort) {
        case "newest":
          return time(b) - time(a);
        case "oldest":
          return time(a) - time(b);
        case "rating_desc":
          return rating(b, -1) - rating(a, -1) || time(b) - time(a);
        case "rating_asc":
          return rating(a, 99) - rating(b, 99) || time(b) - time(a);
      }
    });
    return out;
  }, [rows, domain, semester, department, status, search, sort]);

  const open = rows?.find((r) => r.id === openId) ?? null;
  const scopeLabel = claims.role === "core" ? "Core · all houses" : `Lead · ${domains[claims.domain!].label}`;
  const anyFilter = domain || semester || department || status || search;

  return (
    <div className="mx-auto max-w-6xl px-4 pb-16">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-line py-4">
        <div>
          <h1 className="text-2xl font-bold">{site.appName} Admin</h1>
          <p className="text-sm text-muted">
            {scopeLabel} · {user.email}
          </p>
        </div>
        <Button variant="secondary" onClick={onSignOut}>
          Sign out
        </Button>
      </header>

      {error && (
        <p role="alert" className="mt-4 rounded-xl bg-g-red/15 p-3 text-sm">
          Firestore error: {error}
        </p>
      )}

      {!rows ? (
        <p className="py-10 text-muted">Loading applications…</p>
      ) : (
        <>
          <Stats rows={rows} />

          <section aria-labelledby="apps-title" className="mt-8 flex flex-col gap-3">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <h2 id="apps-title" className="text-xl font-bold">
                Applications <span className="text-muted">({filtered.length})</span>
              </h2>
              <Button
                variant="secondary"
                onClick={() => downloadCsv(filtered, `gdg-quest-${new Date().toISOString().slice(0, 10)}.csv`)}
                disabled={!filtered.length}
              >
                ⬇ Export CSV ({filtered.length})
              </Button>
            </div>

            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
              <Filter label="Search">
                <input
                  className="field-input min-h-10 py-2"
                  placeholder="Roll no or name"
                  inputMode="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </Filter>
              {claims.role === "core" && (
                <Filter label="Domain">
                  <select className="field-input min-h-10 py-2" value={domain} onChange={(e) => setDomain(e.target.value as DomainId | "")}>
                    <option value="">All</option>
                    {DOMAIN_IDS.map((d) => (
                      <option key={d} value={d}>
                        {domains[d].label}
                      </option>
                    ))}
                  </select>
                </Filter>
              )}
              <Filter label="Semester">
                <select className="field-input min-h-10 py-2" value={semester} onChange={(e) => setSemester(e.target.value)}>
                  <option value="">All</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </Filter>
              <Filter label="Department">
                <input
                  className="field-input min-h-10 py-2"
                  placeholder="Contains…"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                />
              </Filter>
              <Filter label="Status">
                <select className="field-input min-h-10 py-2" value={status} onChange={(e) => setStatus(e.target.value as Status | "")}>
                  <option value="">All</option>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {statusStyle[s].label}
                    </option>
                  ))}
                </select>
              </Filter>
              <Filter label="Sort">
                <select className="field-input min-h-10 py-2" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="rating_desc">Rating: high to low</option>
                  <option value="rating_asc">Rating: low to high</option>
                </select>
              </Filter>
            </div>
            {anyFilter && (
              <button
                type="button"
                className="self-start text-sm text-muted underline underline-offset-2"
                onClick={() => {
                  setDomain("");
                  setSemester("");
                  setDepartment("");
                  setStatus("");
                  setSearch("");
                }}
              >
                Clear filters
              </button>
            )}

            <div className="overflow-x-auto rounded-2xl border border-line">
              <table aria-label="Applications" className="w-full min-w-[760px] border-collapse text-left text-sm">
                <thead className="bg-surface text-muted">
                  <tr>
                    <Th>Roll no</Th>
                    <Th>Name</Th>
                    <Th>Sem</Th>
                    <Th>Department</Th>
                    <Th>House</Th>
                    <Th>Status</Th>
                    <Th>Rating</Th>
                    <Th>Applied</Th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r) => (
                    <tr key={r.id} className="border-t border-line hover:bg-surface/70">
                      <Td className="font-mono">{r.rollNo}</Td>
                      <Td>
                        <button
                          type="button"
                          className="text-left font-semibold text-[#8AB4F8] underline-offset-2 hover:underline"
                          onClick={() => setOpenId(r.id)}
                        >
                          {r.fullName}
                        </button>
                      </Td>
                      <Td>{r.semester}</Td>
                      <Td>{r.department}</Td>
                      <Td>
                        <span className="inline-flex items-center gap-1.5">
                          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: domains[r.domain]?.color }} />
                          {domains[r.domain]?.label ?? r.domain}
                        </span>
                      </Td>
                      <Td>
                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${statusStyle[r.status]?.className ?? ""}`}>
                          {statusStyle[r.status]?.label ?? r.status}
                        </span>
                      </Td>
                      <Td className="tabular-nums">
                        {r.avgRating === null ? <span className="text-muted">-</span> : `★ ${r.avgRating.toFixed(1)}`}
                        {r.reviews.length > 0 && <span className="text-muted"> ({r.reviews.length})</span>}
                      </Td>
                      <Td className="whitespace-nowrap text-muted">{formatDate(r)}</Td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-muted">
                        No applications match.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}

      {open && <CandidateDrawer key={open.id} row={open} user={user} onClose={() => setOpenId(null)} />}
    </div>
  );
}

function formatDate(r: Row) {
  const d = r.createdAt?.toDate();
  return d ? d.toLocaleString("en-PK", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "…";
}

function Filter({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-muted">
      {label}
      {children}
    </label>
  );
}

function Th({ children }: { children: React.ReactNode }) {
  return (
    <th scope="col" className="px-3 py-2.5 font-semibold">
      {children}
    </th>
  );
}

function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-3 py-2.5 align-middle ${className}`}>{children}</td>;
}
