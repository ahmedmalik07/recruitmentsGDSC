import Image from "next/image";
import { closed, site } from "@/content";
import { HostPhoto } from "./HostPhoto";

export function QuestClosed() {
  const ig = `https://instagram.com/${site.igHandle.replace(/^@/, "")}`;
  return (
    <section className="flex min-h-dvh flex-col justify-center gap-6 py-10" aria-labelledby="closed-title">
      <Image src={site.logo} alt={site.chapterName} width={360} height={64} unoptimized className="h-auto w-full max-w-[260px]" />
      <div className="flex -space-x-3" aria-hidden="true">
        <HostPhoto id="sumaiya" size={56} />
        <HostPhoto id="ahmed" size={56} />
        <HostPhoto id="rafay" size={56} />
      </div>
      <h1 id="closed-title" className="text-4xl font-extrabold">
        🔒 {closed.title}
      </h1>
      <p className="text-lg text-muted">{closed.body}</p>
      <a
        href={ig}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-g-blue-strong px-5 font-semibold text-white"
      >
        {closed.follow} {site.igHandle}
      </a>
    </section>
  );
}
