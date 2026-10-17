"use client";

import { AnimatePresence, m } from "framer-motion";
import { domains, jerseyColors, positionLabel, roleAccessory, type DomainId, type TeamRole } from "@/content";
import { quick } from "@/lib/quick";
import type { Draft } from "./state";

const SKIN = "#E0AC69";
const SKIN_SHADE = "#C68B59";
const HAIR = "#2D2A32";
const INK = "#1F2335";
const BASE_JERSEY = "#3A4466";

export type AvatarParts = {
  face: boolean;
  lanyard: boolean;
  number: string | null;
  sneakers: boolean;
  level: number | null;
  jersey: string;
  domain: DomainId | null;
  role: TeamRole | null;
  firstName: string;
  /** Applied position label, e.g. "Co-lead" (shown on the Applicant Card) */
  position: string;
};

/** Which avatar layers are unlocked, based on which fields are valid. */
export function avatarParts(d: Draft): AvatarParts {
  const ok = (key: "fullName" | "email" | "rollNo" | "phone", value: string) => quick[key](value);
  return {
    face: ok("fullName", d.fullName),
    lanyard: ok("email", d.email),
    number: ok("rollNo", d.rollNo) ? d.rollNo.trim().slice(-2) : null,
    sneakers: ok("phone", d.phone),
    level: d.semester,
    jersey: jerseyColor(d.department),
    domain: d.domain,
    role: d.teamRole,
    firstName: ok("fullName", d.fullName) ? d.fullName.trim().split(/\s+/)[0] : "",
    position: positionLabel(d.domain, d.position),
  };
}

/** Same department text (ignoring case/spaces) always gives the same jersey color */
export function jerseyColor(department: string): string {
  const key = department.trim().toLowerCase().replace(/\s+/g, " ");
  if (key.length < 2) return BASE_JERSEY;
  let hash = 0;
  for (const ch of key) hash = (hash * 31 + ch.charCodeAt(0)) >>> 0;
  return jerseyColors[hash % jerseyColors.length];
}

const pop = {
  initial: { scale: 0, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0, opacity: 0 },
  transition: { type: "spring", stiffness: 420, damping: 22 },
} as const;

/**
 * Layered SVG character. Pure SVG so it is tiny, crisp at 1080px for the
 * Applicant Card, and cheap to animate on low-end phones.
 */
export function Avatar({
  parts,
  size = 160,
  showName = true,
  animated = true,
  title,
}: {
  parts: AvatarParts;
  size?: number;
  showName?: boolean;
  animated?: boolean;
  title?: string;
}) {
  const house = parts.domain ? domains[parts.domain] : null;
  const P = animated ? m.g : StaticG;
  const anim = animated ? pop : {};
  const height = showName ? 280 : 256;

  return (
    <svg
      viewBox={`0 0 200 ${height}`}
      width={size}
      height={(size * height) / 200}
      role="img"
      aria-label={title ?? describe(parts)}
      className="overflow-visible"
    >
      {/* House glow */}
      <circle cx="100" cy="140" r="96" fill={house?.color ?? "#C9CFE3"} opacity={house ? 0.22 : 0.45} />

      {/* Legs */}
      <rect x="78" y="186" width="19" height="50" rx="9" fill="#262C47" />
      <rect x="103" y="186" width="19" height="50" rx="9" fill="#262C47" />

      {/* Feet / sneakers */}
      <AnimatePresence initial={false}>
        {parts.sneakers ? (
          <P key="sneakers" {...anim} style={{ originX: "100px", originY: "240px" }}>
            <rect x="66" y="230" width="34" height="16" rx="8" fill="#FFFFFF" />
            <rect x="100" y="230" width="34" height="16" rx="8" fill="#FFFFFF" />
            <rect x="66" y="240" width="34" height="6" rx="3" fill="#EA4335" />
            <rect x="100" y="240" width="34" height="6" rx="3" fill="#EA4335" />
          </P>
        ) : (
          <g key="feet">
            <rect x="72" y="232" width="28" height="12" rx="6" fill="#4A5275" />
            <rect x="100" y="232" width="28" height="12" rx="6" fill="#4A5275" />
          </g>
        )}
      </AnimatePresence>

      {/* Arms + hands */}
      <rect x="44" y="110" width="20" height="66" rx="10" fill={parts.jersey} style={{ transition: "fill .4s" }} />
      <rect x="136" y="110" width="20" height="66" rx="10" fill={parts.jersey} style={{ transition: "fill .4s" }} />
      <circle cx="54" cy="180" r="10" fill={SKIN} />
      <circle cx="146" cy="180" r="10" fill={SKIN} />

      {/* Torso / jersey */}
      <rect x="58" y="102" width="84" height="96" rx="24" fill={parts.jersey} style={{ transition: "fill .4s" }} />
      <path d="M88 102 L100 118 L112 102 Z" fill={SKIN_SHADE} />

      {/* Jersey number (roll no) */}
      <AnimatePresence initial={false}>
        {parts.number && (
          <P key="number" {...anim} style={{ originX: "100px", originY: "168px" }}>
            <text
              x="100"
              y="182"
              textAnchor="middle"
              fontSize="30"
              fontWeight="800"
              fill="#FFFFFF"
              fillOpacity="0.92"
              fontFamily="var(--font-outfit), system-ui, sans-serif"
            >
              {parts.number}
            </text>
          </P>
        )}
      </AnimatePresence>

      {/* House emblem */}
      <AnimatePresence initial={false}>
        {parts.domain && (
          <P key={`emblem-${parts.domain}`} {...anim} style={{ originX: "79px", originY: "134px" }}>
            <circle cx="79" cy="134" r="13" fill={house!.color} stroke="#FFFFFF" strokeWidth="2.5" />
            <Emblem domain={parts.domain} />
          </P>
        )}
      </AnimatePresence>

      {/* Lanyard (email) */}
      <AnimatePresence initial={false}>
        {parts.lanyard && (
          <P key="lanyard" {...anim} style={{ originX: "118px", originY: "140px" }}>
            <path d="M90 104 L114 134 M110 104 L120 134" stroke="#4285F4" strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <rect x="108" y="132" width="22" height="28" rx="4" fill="#FFFFFF" />
            <rect x="108" y="132" width="22" height="7" rx="3" fill="#4285F4" />
            <rect x="112" y="144" width="14" height="3" rx="1.5" fill="#9AA0A6" />
            <rect x="112" y="150" width="10" height="3" rx="1.5" fill="#9AA0A6" />
          </P>
        )}
      </AnimatePresence>

      {/* Neck + head */}
      <rect x="90" y="88" width="20" height="18" rx="6" fill={SKIN_SHADE} />
      <circle cx="100" cy="60" r="36" fill={SKIN} />
      <path d="M64 58 Q64 22 100 22 Q136 22 136 58 Q126 38 100 38 Q74 38 64 58 Z" fill={HAIR} />

      {/* Face */}
      <AnimatePresence initial={false}>
        {parts.face ? (
          <P key="face" {...anim} style={{ originX: "100px", originY: "68px" }}>
            <g className={animated ? "avatar-blink" : undefined}>
              <circle cx="87" cy="62" r="4.2" fill={INK} />
              <circle cx="113" cy="62" r="4.2" fill={INK} />
            </g>
            <path d="M88 76 Q100 87 112 76" stroke={INK} strokeWidth="3.5" strokeLinecap="round" fill="none" />
            <circle cx="80" cy="73" r="4" fill="#EA4335" opacity="0.25" />
            <circle cx="120" cy="73" r="4" fill="#EA4335" opacity="0.25" />
          </P>
        ) : (
          <text key="q" x="100" y="74" textAnchor="middle" fontSize="28" fontWeight="700" fill={SKIN_SHADE}>
            ?
          </text>
        )}
      </AnimatePresence>

      {/* Role accessory */}
      <AnimatePresence initial={false}>
        {parts.role && (
          <P key={`role-${parts.role}`} {...anim} style={{ originX: "100px", originY: "40px" }}>
            <Accessory role={parts.role} />
          </P>
        )}
      </AnimatePresence>

      {/* Level badge (semester) */}
      <AnimatePresence initial={false}>
        {parts.level && (
          <P key={`lvl-${parts.level}`} {...anim} style={{ originX: "164px", originY: "34px" }}>
            <circle cx="164" cy="34" r="25" fill="#FBBC04" stroke="#FFFFFF" strokeWidth="3" />
            <text x="164" y="30" textAnchor="middle" fontSize="11" fontWeight="700" fill="#202124" fontFamily="var(--font-outfit), system-ui, sans-serif">
              Lvl
            </text>
            <text x="164" y="47" textAnchor="middle" fontSize="19" fontWeight="800" fill="#202124" fontFamily="var(--font-outfit), system-ui, sans-serif">
              {parts.level}
            </text>
          </P>
        )}
      </AnimatePresence>

      {/* Name plate */}
      {showName && parts.firstName && (
        <g>
          <rect x="35" y="252" width="130" height="26" rx="13" fill="#FFFFFF" stroke="#E2DCCB" strokeWidth="1.5" />
          <text
            x="100"
            y="270"
            textAnchor="middle"
            fontSize="14"
            fontWeight="700"
            fill="#1D2A5C"
            fontFamily="var(--font-outfit), system-ui, sans-serif"
          >
            {parts.firstName.slice(0, 16)}
          </text>
        </g>
      )}
    </svg>
  );
}

function StaticG({ children }: { children?: React.ReactNode } & Record<string, unknown>) {
  return <g>{children}</g>;
}

function Emblem({ domain }: { domain: DomainId }) {
  const fg = domain === "marketing_partnerships" ? "#202124" : "#FFFFFF";
  switch (domain) {
    case "technical":
      return (
        <path d="M74 129 L69 134 L74 139 M84 129 L89 134 L84 139" stroke={fg} strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      );
    case "marketing_partnerships":
      return <path d="M71 131 L71 137 L75 137 L84 141 L84 127 L75 131 Z" fill={fg} />;
    case "creatives":
      return (
        <g>
          <rect x="70" y="129" width="18" height="12" rx="2.5" fill={fg} />
          <circle cx="79" cy="135" r="3.4" fill="#EA4335" />
          <rect x="74" y="126.5" width="6" height="3" rx="1" fill={fg} />
        </g>
      );
    case "media":
      return (
        <g>
          <rect x="70" y="128" width="18" height="12" rx="3" fill={fg} />
          <path d="M77 131 L83 134 L77 137 Z" fill="#8430CE" />
        </g>
      );
    case "ops":
      return (
        <g>
          <circle cx="79" cy="134" r="5.5" fill="none" stroke={fg} strokeWidth="2.6" strokeDasharray="3 1.6" />
          <circle cx="79" cy="134" r="2" fill={fg} />
        </g>
      );
  }
}

function Accessory({ role }: { role: TeamRole }) {
  switch (role) {
    case "Builder":
      return (
        <g>
          <path d="M62 50 Q62 16 100 16 Q138 16 138 50 Z" fill="#FBBC04" />
          <rect x="56" y="46" width="88" height="10" rx="5" fill="#F29900" />
          <rect x="96" y="16" width="8" height="32" rx="3" fill="#F29900" />
        </g>
      );
    case "Hype Person":
      return (
        <g>
          <path d="M62 60 A38 38 0 0 1 138 60" stroke="#202124" strokeWidth="6" fill="none" strokeLinecap="round" />
          <rect x="54" y="50" width="14" height="24" rx="6" fill="#EA4335" />
          <rect x="132" y="50" width="14" height="24" rx="6" fill="#EA4335" />
        </g>
      );
    case "Problem Solver":
      return (
        <g>
          <circle cx="87" cy="62" r="10" fill="#FFFFFF" fillOpacity="0.18" stroke="#202124" strokeWidth="3" />
          <circle cx="113" cy="62" r="10" fill="#FFFFFF" fillOpacity="0.18" stroke="#202124" strokeWidth="3" />
          <path d="M97 62 L103 62 M77 60 L66 56 M123 60 L134 56" stroke="#202124" strokeWidth="3" strokeLinecap="round" />
        </g>
      );
    case "Creative":
      return (
        <g>
          <ellipse cx="94" cy="28" rx="38" ry="13" fill="#EA4335" transform="rotate(-8 94 28)" />
          <circle cx="94" cy="14" r="4" fill="#EA4335" />
        </g>
      );
    case "Planner":
      return (
        <g>
          <rect x="140" y="148" width="28" height="36" rx="4" fill="#8D6E63" />
          <rect x="144" y="154" width="20" height="26" rx="2" fill="#FFFFFF" />
          <rect x="148" y="144" width="12" height="7" rx="2" fill="#9AA0A6" />
          <path d="M147 161 L150 164 L155 158 M147 171 L150 174 L155 168" stroke="#34A853" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
  }
}

function describe(p: AvatarParts): string {
  const bits = ["Your character"];
  if (p.firstName) bits.push(`named ${p.firstName}`);
  if (p.level) bits.push(`level ${p.level}`);
  if (p.domain) bits.push(`in ${domains[p.domain].house}`);
  if (p.role) bits.push(`with ${roleAccessory[p.role].toLowerCase()}`);
  return bits.join(", ");
}
