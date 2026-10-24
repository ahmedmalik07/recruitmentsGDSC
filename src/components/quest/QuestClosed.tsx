import type { CSSProperties } from "react";
import Image from "next/image";
import { DOMAIN_IDS, campus, closed, domains, hosts, introCards, level2, site, success, type HostId } from "@/content";
import { FollowLinks } from "./FollowLinks";
import { HostPhoto } from "./HostPhoto";
import { IntroVideo } from "./IntroVideo";
import { JoinGroup } from "./JoinGroup";
import { SiteFooter } from "./SiteFooter";

const COUNCIL: HostId[] = ["sumaiya", "ahmed", "rafay"];

/** After applications close: interview news, the intro video, Ahmed and his game, and who we are */
export function QuestClosed() {
  const ahmed = hosts.ahmed;
  return (
    <div className="flex flex-col gap-9 pt-8">
      <section aria-labelledby="closed-title" className="flex flex-col gap-3">
        <Image
          src={site.logo}
          alt={site.chapterName}
          width={site.logoSize.width}
          height={site.logoSize.height}
          priority
          sizes="260px"
          className="mb-3 h-auto w-full max-w-[260px]"
        />
        <p className="text-sm font-extrabold tracking-[0.2em] text-eyebrow uppercase">{closed.eyebrow}</p>
        <h1 id="closed-title" className="text-4xl leading-tight font-extrabold sm:text-5xl">
          🔒 {closed.title}
        </h1>
        <p className="text-lg text-muted">{closed.body}</p>
      </section>

      <section
        aria-labelledby="interviews-title"
        className="flex flex-col gap-4 rounded-3xl border-2 border-[#aecbfa] bg-tint-blue p-5"
      >
        <div className="flex items-start gap-3">
          <span className="text-3xl leading-none" aria-hidden="true">
            📅
          </span>
          <div>
            <h2 id="interviews-title" className="text-xl leading-tight font-extrabold">
              {closed.interviews.title}
            </h2>
            <p className="mt-1.5 text-[15px]">{closed.interviews.body}</p>
          </div>
        </div>
        <JoinGroup label={closed.joinGroup} note={closed.joinGroupNote} />
      </section>

      <section aria-labelledby="video-title" className="flex flex-col gap-3">
        <h2 id="video-title" className="text-xl font-extrabold">
          🎬 {closed.video}
        </h2>
        <IntroVideo standalone />
      </section>

      <section
        aria-labelledby="ahmed-title"
        className="flex flex-col gap-5 rounded-3xl border-2 bg-surface p-5"
        style={{ borderColor: ahmed.accent }}
      >
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <figure className="mx-auto w-44 shrink-0 -rotate-3 rounded-sm bg-white p-2 pb-3 shadow-md ring-1 ring-line sm:mx-0">
            <Image
              src={success.polaroid.photo}
              alt={success.polaroid.alt}
              width={480}
              height={360}
              sizes="176px"
              className="h-auto w-full rounded-[2px]"
            />
            <figcaption className="mt-1.5 text-center text-xs font-bold text-ink">{success.polaroid.signed}</figcaption>
          </figure>
          <div className="flex min-w-0 flex-col gap-2">
            <p className="text-xs font-extrabold tracking-wide text-eyebrow uppercase">⭐ {closed.ahmed.eyebrow}</p>
            <h2 id="ahmed-title" className="text-2xl leading-tight font-extrabold">
              {ahmed.name}
            </h2>
            <p className="text-[15px] text-muted">{closed.ahmed.about}</p>
            <p className="self-start rounded-full bg-tint-yellow px-3 py-1 text-sm font-bold">🏆 {ahmed.stats?.[0]}</p>
            <p className="text-sm">
              <span aria-hidden="true">💡 </span>
              {ahmed.funFact}
            </p>
          </div>
        </div>
        <a
          href={closed.ahmed.url}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-3d flex min-h-16 items-center gap-3 rounded-2xl bg-g-blue-strong px-5 py-2.5 text-white hover:bg-g-blue-stronger"
          style={{ "--btn-edge": "#0d47a1" } as CSSProperties}
        >
          <span className="text-3xl leading-none" aria-hidden="true">
            🎮
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-base font-extrabold whitespace-nowrap sm:text-lg">{closed.ahmed.play}</span>
            <span className="text-sm font-semibold text-white/90">{closed.ahmed.domain}</span>
          </span>
          <span className="ml-auto text-2xl" aria-hidden="true">
            →
          </span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </section>

      <section aria-labelledby="about-title" className="flex flex-col gap-3">
        <h2 id="about-title" className="text-xl font-extrabold">
          🌍 {closed.about}
        </h2>
        <figure className="relative overflow-hidden rounded-3xl border-[3px] border-white shadow-md ring-1 ring-line">
          <Image
            src={campus.photo}
            alt={campus.photoAlt}
            width={campus.photoSize.width}
            height={campus.photoSize.height}
            sizes="(min-width: 768px) 672px, 100vw"
            className="h-auto w-full"
          />
          <figcaption className="absolute inset-x-0 bottom-0 flex items-center gap-2 bg-gradient-to-t from-black/75 to-transparent px-3 pt-10 pb-2.5 text-sm font-bold text-white">
            <Image src={campus.logo} alt="" width={28} height={28} className="rounded-md" />
            {campus.caption}
          </figcaption>
        </figure>
        <div className="grid gap-3 sm:grid-cols-3">
          {introCards.map((card) => (
            <article key={card.title} className="flex flex-col gap-1.5 rounded-2xl border border-line bg-surface p-4">
              <span className="text-3xl" aria-hidden="true">
                {card.emoji}
              </span>
              <h3 className="leading-tight font-bold">{card.title}</h3>
              <p className="text-sm text-muted">{card.body}</p>
            </article>
          ))}
        </div>
        <h3 className="mt-2 font-bold">{closed.teams}</h3>
        <ul className="flex flex-wrap gap-2">
          {DOMAIN_IDS.map((id) => (
            <li
              key={id}
              className="rounded-full px-3 py-1 text-sm font-bold"
              style={{ background: domains[id].solid, color: domains[id].onColor }}
            >
              {domains[id].label}
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="council-title" className="flex flex-col gap-3">
        <h2 id="council-title" className="text-xl font-extrabold">
          👑 {closed.council}
        </h2>
        <div className="grid gap-3 sm:grid-cols-3">
          {COUNCIL.map((id) => {
            const host = hosts[id];
            return (
              <article
                key={id}
                className="flex flex-col items-center gap-2 rounded-3xl border-2 p-4 text-center"
                style={{ borderColor: host.accent, background: `${host.accent}14` }}
              >
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-extrabold tracking-wide text-white uppercase"
                  style={{ background: host.badge.bg }}
                >
                  {host.badge.text}
                </span>
                <HostPhoto id={id} size={88} portrait />
                <div>
                  <h3 className="text-lg leading-tight font-bold">{host.name}</h3>
                  <p className="text-sm text-muted">{host.role}</p>
                </div>
                <ul className="flex flex-col gap-1 text-[13px] leading-snug font-semibold">
                  {host.stats?.slice(0, 2).map((line) => (
                    <li key={line}>{line}</li>
                  ))}
                </ul>
                {host.linkedin && (
                  <a
                    href={host.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-auto inline-flex min-h-11 items-center text-sm font-semibold text-link hover:underline"
                  >
                    {level2.linkedin}
                    <span className="sr-only"> with {host.firstName} (opens in a new tab)</span>
                  </a>
                )}
              </article>
            );
          })}
        </div>
      </section>

      <FollowLinks />
      <SiteFooter />
    </div>
  );
}
