/**
 * GDG Quest content config.
 *
 * Every piece of candidate-facing copy and every editable value lives here.
 * Anything marked PLACEHOLDER should be replaced before launch.
 * Photos go in /public/team, brand assets in /public/brand.
 */

// ---------------------------------------------------------------------------
// Chapter + logistics
// ---------------------------------------------------------------------------

export const site = {
  appName: "GDG Quest",
  chapterName: "GDG on Campus Air University",
  chapterShort: "GDGOC AU",
  city: "Islamabad",
  /** Instagram handle, printed on the Applicant Card */
  igHandle: "@gdgocau",
  instagram: "https://www.instagram.com/gdgocau",
  /** Chapter LinkedIn page */
  linkedinName: "Google Developer Groups on Campus Air University",
  linkedin: "https://www.linkedin.com/company/gdgocair/",
  /** Link printed on the Applicant Card, so friends can apply too */
  link: "recruitments.wyibe.com",
  /** Official GDG on Campus lockup with your chapter name. Replace the placeholder file. */
  logo: "/brand/gdgoc-au-logo.png",
  /** Logo lockup size (px) so it never shifts the layout while loading */
  logoSize: { width: 701, height: 122 },
  /** Full artwork: the AU building in Google colors + lockup (desktop side panel) */
  art: "/brand/gdgoc-au-full.png",
  artSize: { width: 800, height: 524 },
  /**
   * Optional. Applications close at this moment if NEXT_PUBLIC_APPLICATIONS_DEADLINE is set
   * (ISO 8601 with timezone, e.g. 2026-11-01T23:59:00+05:00). Empty = applications stay open.
   */
  deadline: process.env.NEXT_PUBLIC_APPLICATIONS_DEADLINE || "",
  /** Shown on the success screen instead of a date */
  shortlistNote: "Date will be announced soon on our Instagram and WhatsApp.",
  /** Recruitment WhatsApp group: updates, shortlist, interview slots */
  whatsappGroup: "https://chat.whatsapp.com/G1vkks6yNgaHT6pKYOJhen",
  /** WhatsApp contact for problems. Number in international format, digits only. */
  /** Main help contact (shown first everywhere) */
  helpEmail: "gdscair@gmail.com",
  /** WhatsApp help numbers, in order */
  president: {
    name: "Sumaiyyah Masood",
    number: "923220173439",
    display: "0322 0173439",
  },
  whatsapp: {
    name: "Ahmed Malik",
    number: "923193608483",
    display: "0319 3608483",
  },
  /** Roll number rule: 5 to 12 digits (also the application document id, so digits only). */
  rollNoRegex: "^\\d{5,12}$",
  rollNoHint: "Digits only, e.g. 231234",
} as const;

// ---------------------------------------------------------------------------
// Core team (NPC hosts)
// ---------------------------------------------------------------------------

export type HostId = "sumaiya" | "ahmed" | "rafay";

export type Host = {
  id: HostId;
  name: string;
  firstName: string;
  role: string;
  /** Square photo, at least 256x256. Replace the SVG placeholders with .jpg/.webp files. */
  photo: string;
  /** Optional bigger portrait for the council card (falls back to `photo`) */
  cardPhoto?: string;
  /** Optional profile link shown on the council card */
  linkedin?: string;
  /** Achievement lines on the back of the council card */
  stats?: readonly string[];
  /** Leave empty to hide */
  funFact: string;
  bio: string;
  accent: string;
  /** Pill on their cards. bg is a strong shade so white text passes WCAG AA */
  badge: { text: string; bg: string };
};

export const hosts: Record<HostId, Host> = {
  sumaiya: {
    id: "sumaiya",
    name: "Sumaiyyah Masood",
    firstName: "Sumaiyyah",
    role: "President",
    photo: "/team/sumaiya.jpg",
    linkedin: "https://www.linkedin.com/in/sumaiyyah-masood-b1b103308",
    stats: ["Top 5 performer, national wilderness leadership camp", "Debate winner, writer & mentor", "President, GDGOC AU"],
    funFact: "Spent 5 days camping in the lower Himalayas without her phone. A real-life survival challenge.",
    bio: "Wears many hats, but keeps coming back to one: building inclusive spaces. Innovation grows when everyone belongs.",
    accent: "#EA4335",
    badge: { text: "👑 President", bg: "#C5221F" },
  },
  ahmed: {
    id: "ahmed",
    name: "Ahmed Malik",
    firstName: "Ahmed",
    role: "Vice President",
    photo: "/team/ahmed.jpg",
    cardPhoto: "/team/ahmed-card.jpg",
    linkedin: "https://www.linkedin.com/in/ahhmedmalik",
    stats: ["4× National Hackathon Winner", "Founder, Wyibe", "VP, GDGOC AU"],
    funFact: "Builds video games in Unreal Engine for fun, in between shipping AI agents at Wyibe.",
    bio: "Your guide for this quest. Builds things, wins hackathons, ships AI agents.",
    accent: "#4285F4",
    badge: { text: "⭐ Your Guide", bg: "#1967D2" },
  },
  rafay: {
    id: "rafay",
    name: "Abdul Rafay",
    firstName: "Rafay",
    role: "General Secretary",
    photo: "/team/rafay.jpg",
    linkedin: "https://www.linkedin.com/in/abdulrafayqar",
    stats: [
      "International Gold Medalist Calligrapher",
      "3× National Art Contest Winner",
      "AI Researcher",
      "“Youngest Calligrapher of Pakistan” (Indian press)",
    ],
    funFact: "Goes from calligraphy qalam to Python notebook in the same afternoon.",
    bio: "Keeps everything on track. Knows where every file, form and chair is.",
    accent: "#34A853",
    badge: { text: "📜 Gen Sec", bg: "#188038" },
  },
};

/** Level 4 intro: an animated story starring the council (no video needed) */
export const introStory = {
  label: "GDGOC AU council intro",
  slides: [
    { hosts: ["sumaiya", "ahmed", "rafay"], text: "Salam! We're the GDGOC AU council 👋", sub: "Sumaiyyah · Ahmed · Rafay" },
    { teams: true, text: "5 teams run the chapter", sub: "Every single one matters." },
    {
      hosts: ["sumaiya"],
      backdrop: "/team/sumaiya.jpg",
      text: "Innovation grows when everyone belongs. There's a seat for you here 💛",
      sub: "Sumaiyyah, President",
    },
    {
      hosts: ["ahmed"],
      backdrop: "/team/ahmed-intro-poster.jpg",
      text: "Pick the team that actually sounds like you, not the one that sounds cool.",
      sub: "Ahmed, Vice President",
    },
    {
      hosts: ["rafay"],
      backdrop: "/team/rafay.jpg",
      text: "Then choose your position. Doors are right below 👇",
      sub: "Rafay, General Secretary",
    },
  ] as ReadonlyArray<{ hosts?: HostId[]; teams?: boolean; backdrop?: string; text: string; sub: string }>,
  secondsPerSlide: 4,
  pause: "Pause",
  play: "Play",
  replay: "Replay",
};

/**
 * Level 4 intro video: a 15 s trailer with the council and our own song, made in code (no filming needed).
 * Edit scripts/intro-video/trailer.html and run `node scripts/intro-video/render.mjs` to change it.
 */
export const introVideo = {
  src: "/intro/gdg-quest-intro.mp4",
  /** Same video for browsers without H.264 */
  srcWebm: "/intro/gdg-quest-intro.webm",
  poster: "/intro/poster.jpg",
  label: "GDG Quest intro video with Sumaiyyah, Ahmed and Rafay, 15 seconds",
  /** Read by screen readers instead of the burned-in text */
  transcript:
    "Yeh koi form nahi hai, yeh game hai. Air University, Islamabad: GDG on Campus Air University presents GDG Quest, Recruitment 2026. " +
    "Sumaiyyah, President. Ahmed Malik, Vice President and your guide, 4 times national hackathon winner. " +
    "Abdul Rafay, General Secretary, international gold medalist calligrapher. Pick your house: Technical, Marketing and Partnerships, Creatives, Media, Operations. " +
    "Your quest starts now at recruitments.wyibe.com. Upbeat music plays throughout.",
  caption: "🎬 15 sec intro with the council",
  play: "Play intro",
  showStory: "Tap through it instead",
  showVideo: "Watch the video instead",
};

// ---------------------------------------------------------------------------
// Level 0 + 1: Sumaiyyah
// ---------------------------------------------------------------------------

export const titleScreen = {
  tagline: "Recruitment 2026",
  title: "GDG Quest",
  subtitle: "7 levels. ~5 minutes. No sign-in. One shot at joining the team.",
  start: "Press Start",
  resume: (level: number) => `Continue from Level ${level}`,
  restart: "Start over",
  joinGroup: "Join the recruitment WhatsApp group (required)",
  joinGroupNote: "You have to join it. The shortlist, interview slots and every recruitment update are shared there.",
  /** The "Your quest starts now" block above Press Start (same as the intro video's ending) */
  cta: "Your quest starts now",
  ctaNames: "Sumaiyyah · Ahmed · Rafay",
  ctaSub: "No sign-in · ~5 minutes · all AU students",
  facts: ["🎮 7 levels", "⏱️ ~5 minutes", "🔓 No sign-in", "🏆 Shareable card"],
  npc: [
    "Hey hey! I'm Sumaiyyah, President of GDGOC AU 👋",
    "Welcome to GDG Quest. Yeh koi boring form nahi hai, it's a mini game.",
  ],
  /** Ahmed joins right after Sumaiyyah's welcome */
  npcAhmed: [
    "And I'm Ahmed, VP. I built this whole quest, so I'll be your guide 🫡",
    "7 levels, ~5 minutes. Finish them all and your application is in. Ready?",
  ],
  /** Rafay says hi too */
  npcRafay: ["And I'm Rafay, General Secretary. I'll take your details in Level 3 📋"],
};

export const introCards = [
  {
    emoji: "🌍",
    title: "What is GDG on Campus?",
    body: "Google Developer Groups on Campus are student communities backed by Google. Students learn, build and grow together, across 100+ countries.",
  },
  {
    emoji: "🛠️",
    title: "What GDGOC AU does",
    body: "Events, hackathons, hands-on workshops, real projects, and baithaqs: our chill networking sessions where you meet people who actually build stuff.",
  },
  {
    emoji: "🚀",
    title: "Why it matters for you",
    body: "Skills that don't come from lectures, a network that actually helps, and a team that ships things together.",
  },
] as const;

export const level1 = {
  npcIntro: [
    "At GDGOC AU we believe innovation grows when everyone belongs 💛",
    "Quick lore drop first. Swipe through these 3 cards 👉",
  ],
  handover: "Ab tumhara guide Ahmed hai. He'll take it from here. Good luck! ✨",
  ahmedReply: "Shukriya Sumaiyyah! Chalo, let's meet the council 🚀",
  swipeHint: "Swipe or use the arrows",
  nextHint: "Swipe through all 3 cards first",
  /** Card that slides in when Sumaiyyah hands over to Ahmed */
  guideCard: "Your guide from here",
};

/** Real Air University photos (Level 1 and the hero badge) */
export const campus = {
  name: "Air University · Islamabad",
  photo: "/campus/au-day.jpg",
  photoSize: { width: 588, height: 210 },
  photoAlt: "The Air University main building in Islamabad",
  logo: "/campus/au-logo.jpg",
  caption: "Home base: Air University, Islamabad",
};

// ---------------------------------------------------------------------------
// Level 2: Meet the Council
// ---------------------------------------------------------------------------

export const level2 = {
  npc: {
    ahmed: [
      "Ahmed here, your guide for the rest of the quest 🫡",
      "Meet the council first. Tap each card to flip it. All 3, no skipping.",
    ],
    sumaiya: ["Psst, mine has a Himalayas story in it 🏔️"],
  },
  nextHint: "Flip all 3 cards to continue",
  unlocked: (firstName: string) => `${firstName} unlocked`,
  flipHint: "Tap to flip",
  progress: (n: number) => `${n}/3 flipped`,
  linkedin: "Connect on LinkedIn",
};

/** Desktop side panel (only shown on wide screens) */
export const sidebar = {
  title: "Your character",
  empty: "Your character builds up here as you play.",
  map: "Quest map",
  help: "Stuck? Email",
  orWhatsApp: "or WhatsApp",
};

// ---------------------------------------------------------------------------
// Level 3: Build your Character (Abdul Rafay)
// ---------------------------------------------------------------------------

export const level3 = {
  npc: [
    "Rafay here, GS. I handle the paperwork, so let's make it quick.",
  ],
  npcAhmed: [
    "Every field you fill unlocks something on your character. Watch it at the top 👀",
  ],
  labels: {
    fullName: "Full name",
    email: "Email",
    rollNo: "Roll no",
    phone: "WhatsApp number",
    semester: "Semester",
    department: "Department",
  },
  placeholders: {
    fullName: "e.g. Ayesha Khan",
    email: "you@example.com",
    rollNo: "231234",
    phone: "03XXXXXXXXX",
    department: "Type it, or tap one below",
  },
  help: {
    phone: "Pakistani mobile, 11 digits, starts with 03",
  },
  departmentHint: "Suggestions (or just type yours):",
  /** The checklist next to the character: what each field unlocks */
  parts: {
    title: "Your character",
    fullName: "Face",
    email: "Lanyard",
    rollNo: "Jersey no.",
    phone: "Sneakers",
    semester: "Level badge",
    department: "Jersey color",
  },
  /** Toasts when each field unlocks an avatar part */
  unlocks: {
    fullName: "Face unlocked",
    email: "Lanyard unlocked",
    rollNo: "Jersey number unlocked",
    phone: "Sneakers unlocked",
    semester: "Level badge unlocked",
    department: "Jersey color unlocked",
  },
};

/**
 * Department is free text. These show up as tap-to-fill chips and autocomplete while typing,
 * so candidates can still write anything. Add or remove freely.
 */
export const departmentSuggestions = [
  "Computer Science",
  "Software Engineering",
  "Artificial Intelligence",
  "Cyber Security",
  "Data Science",
  "Information Technology",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Aerospace Engineering",
  "Avionics Engineering",
  "Business Administration",
  "Accounting & Finance",
  "Economics",
  "English",
  "Psychology",
  "Media & Communication",
  "Mathematics",
  "Physics",
] as const;

/** Jersey colors. A department always maps to the same color (picked from its name). */
export const jerseyColors = [
  "#4285F4",
  "#1A73E8",
  "#7C4DFF",
  "#00897B",
  "#0097A7",
  "#F9AB00",
  "#E8710A",
  "#D93025",
  "#3949AB",
  "#188038",
  "#C2185B",
  "#455A64",
] as const;

// ---------------------------------------------------------------------------
// Portfolio links (Level 5). Candidates can add up to MAX_LINKS of any kind.
// ---------------------------------------------------------------------------

export const LINK_KINDS = ["github", "linkedin", "behance", "dribbble", "instagram", "youtube", "drive", "website"] as const;
export type LinkKind = (typeof LINK_KINDS)[number];
export const MAX_LINKS = 4;

export type LinkKindInfo = {
  label: string;
  icon: string;
  placeholder: string;
  /** A bare handle like "@ahmed" becomes this + "ahmed" */
  handleBase?: string;
  /** Hostnames used to auto-detect the kind of a pasted link */
  hosts: readonly string[];
};

export const linkKinds: Record<LinkKind, LinkKindInfo> = {
  github: {
    label: "GitHub",
    icon: "🐙",
    placeholder: "github.com/yourname",
    handleBase: "https://github.com/",
    hosts: ["github.com"],
  },
  linkedin: {
    label: "LinkedIn",
    icon: "💼",
    placeholder: "linkedin.com/in/yourname",
    handleBase: "https://www.linkedin.com/in/",
    hosts: ["linkedin.com"],
  },
  behance: {
    label: "Behance",
    icon: "🎨",
    placeholder: "behance.net/yourname",
    handleBase: "https://www.behance.net/",
    hosts: ["behance.net"],
  },
  dribbble: {
    label: "Dribbble",
    icon: "🏀",
    placeholder: "dribbble.com/yourname",
    handleBase: "https://dribbble.com/",
    hosts: ["dribbble.com"],
  },
  instagram: {
    label: "Instagram",
    icon: "📸",
    placeholder: "@yourhandle or a post link",
    handleBase: "https://www.instagram.com/",
    hosts: ["instagram.com"],
  },
  youtube: {
    label: "YouTube",
    icon: "🎬",
    placeholder: "youtube.com/@yourchannel",
    handleBase: "https://www.youtube.com/@",
    hosts: ["youtube.com", "youtu.be"],
  },
  drive: {
    label: "Drive / Docs",
    icon: "📁",
    placeholder: "Drive link (set to anyone with the link)",
    hosts: ["drive.google.com", "docs.google.com"],
  },
  website: {
    label: "Website / other",
    icon: "🔗",
    placeholder: "Any link: site, Figma, Notion, Medium…",
    hosts: [],
  },
};

// ---------------------------------------------------------------------------
// Level 4: Choose your House (Ahmed)
// ---------------------------------------------------------------------------

export const DOMAIN_IDS = ["technical", "marketing_partnerships", "creatives", "media", "ops"] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

export type Position = { id: string; label: string };

export type Domain = {
  id: DomainId;
  label: string;
  house: string;
  /** Brand color: doors, glows, emblems, chart bars */
  color: string;
  /** Same hue, dark enough for text on top (WCAG AA) */
  solid: string;
  /** Text color on top of `solid` */
  onColor: string;
  description: [string, string];
  /** Optional, shown under the door. Leave empty to hide. */
  lead: string;
  /** Positions candidates can apply for in this team */
  positions: readonly Position[];
  skills: readonly string[];
  /** Link types offered first in Level 5 (the first one is the default) */
  linkKinds: readonly LinkKind[];
};

const LEAD: Position = { id: "lead", label: "Lead" };
const CO_LEAD: Position = { id: "co_lead", label: "Co-lead" };
const MEMBER: Position = { id: "member", label: "Member" };

export const domains: Record<DomainId, Domain> = {
  technical: {
    id: "technical",
    label: "Technical",
    house: "House of Code",
    color: "#4285F4",
    solid: "#1967D2",
    onColor: "#FFFFFF",
    description: [
      "Build the stuff: websites, apps, AI demos, workshop content.",
      "You teach sessions and help run hackathons.",
    ],
    lead: "",
    positions: [LEAD, CO_LEAD, MEMBER],
    skills: ["Web", "App", "AI/ML", "Cloud", "Game Dev"],
    linkKinds: ["github", "linkedin", "website"],
  },
  marketing_partnerships: {
    id: "marketing_partnerships",
    label: "Marketing & Partnerships",
    house: "House of Hype",
    color: "#FBBC04",
    solid: "#FBBC04",
    onColor: "#202124",
    description: [
      "Get the word out and bring sponsors on board.",
      "Campaigns, outreach, copy and deals with brands.",
    ],
    lead: "",
    positions: [LEAD, CO_LEAD, MEMBER],
    skills: ["Sponsorships", "Outreach", "Copywriting", "Campaigns", "Brand Deals"],
    linkKinds: ["linkedin", "drive", "website"],
  },
  creatives: {
    id: "creatives",
    label: "Creatives",
    house: "House of Pixels",
    color: "#EA4335",
    solid: "#C5221F",
    onColor: "#FFFFFF",
    description: [
      "Shoot, edit and design everything GDGOC AU puts out.",
      "Photos, videos, posters and the whole visual vibe.",
    ],
    lead: "",
    positions: [
      { id: "photographer", label: "Photographer" },
      { id: "videographer", label: "Videographer" },
      { id: "graphics", label: "Graphics" },
    ],
    skills: ["Photography", "Videography", "Graphic Design", "Video Editing", "UI/UX"],
    linkKinds: ["behance", "instagram", "drive", "dribbble", "youtube"],
  },
  media: {
    id: "media",
    label: "Media",
    house: "House of Stories",
    color: "#A142F4",
    solid: "#8430CE",
    onColor: "#FFFFFF",
    description: [
      "Run our socials and tell the GDGOC AU story.",
      "Posts, reels, captions, event coverage and announcements.",
    ],
    lead: "",
    positions: [LEAD, MEMBER],
    skills: ["Social Media", "Content Writing", "Reels", "Event Coverage", "Hosting/Anchoring"],
    linkKinds: ["instagram", "linkedin", "youtube", "drive"],
  },
  ops: {
    id: "ops",
    label: "Operations",
    house: "House of Ops",
    color: "#34A853",
    solid: "#188038",
    onColor: "#FFFFFF",
    description: [
      "Make events actually happen: venues, schedules, logistics.",
      "Hosting, anchoring and keeping the docs tight.",
    ],
    lead: "",
    positions: [LEAD, CO_LEAD, MEMBER],
    skills: ["Event Management", "Logistics", "Hosting/Anchoring", "Documentation"],
    linkKinds: ["linkedin", "drive", "website"],
  },
};

/** Label for a position id in a team, e.g. ("technical", "co_lead") → "Co-lead" */
export function positionLabel(domain: DomainId | null | undefined, id: string | null | undefined): string {
  if (!domain || !id) return "";
  return domains[domain]?.positions.find((p) => p.id === id)?.label ?? id;
}

export const level4 = {
  npc: [
    "Okay, the big one. Choosing your house 🏠",
    "Watch our quick intro, then pick exactly one door.",
  ],
  pickDoor: "Pick one door to continue",
  emblem: (house: string) => `${house} emblem unlocked`,
  doorsTitle: "Pick your door",
  chosen: "Your house",
  positionTitle: "Which position are you applying for?",
  positionNote:
    "Going for Lead or Co-lead? Aim high. Selection ke waqt we also consider you for the other roles in this team.",
  skillsTitle: "Your skills (optional, pick any)",
  npcAfterPick: (house: string) => `${house}, nice pick. Now choose your position, add skills if you want, then let's go.`,
};

// ---------------------------------------------------------------------------
// Level 5: Your Story (Ahmed)
// ---------------------------------------------------------------------------

export const TEAM_ROLES = ["Planner", "Builder", "Hype Person", "Problem Solver", "Creative"] as const;
export type TeamRole = (typeof TEAM_ROLES)[number];

export const HOURS = ["2-4", "5-8", "8+"] as const;
export type Hours = (typeof HOURS)[number];
export const hoursLabels: Record<Hours, string> = {
  "2-4": "2 to 4 hrs",
  "5-8": "5 to 8 hrs",
  "8+": "8+ hrs",
};

export const EXCITED = ["Events", "Hackathons", "Workshops", "Baithaqs", "Networking", "Content"] as const;
export type Excited = (typeof EXCITED)[number];

export const level5 = {
  npc: [
    "Story time. This is the part we actually read, so be real 🙌",
    "No essays needed. Just honest answers.",
  ],
  npcSumaiya: ["And no experience is totally okay. We care more about who you are than your CV 💛"],
  /** Small signed note above the questions */
  ahmedTip: {
    label: "Ahmed's tip",
    text: "I read every one of these myself. Write like you talk, not like ChatGPT 😄",
  },
  experience: {
    label: "Your past experience",
    helper:
      "Projects, internships, societies, events you helped run, freelancing, roles you've held. No experience? Totally fine, tell us what you want to learn.",
  },
  achievements: {
    label: "Achievements you're proud of",
    helper: "Competitions, hackathons, awards, certifications, positions, published work. Small wins count too. Optional.",
    placeholder: "e.g. 2nd place at a uni hackathon, Google Cloud cert, Head of Media at XYZ society",
  },
  whyJoin: {
    label: "Why do you want to join GDGOC AU?",
    helper: "What do you want to get out of it, and what will you bring?",
  },
  /** Ahmed's hint bubbles while they type. 4 to 5 lines. */
  hints: [
    "Start with one thing you've built, organised or learned recently.",
    "Specific beats fancy. 'Made a bot for my class group' > 'passionate about tech'.",
    "No experience? Bata do kya seekhna hai aur kyun. That counts.",
    "Mention anything you did outside class. Societies, freelancing, side quests.",
    "Keep it real. We can smell ChatGPT answers from Rawalpindi 😅",
  ],
  meter: {
    tooShort: (n: number) => `${n} words. Thora aur, minimum 10`,
    charging: "Charging… 40+ words gets full power",
    full: "Full power ⚡",
    long: "Strong, but keep it tight",
    tooLong: "Over 250 words, trim it a bit",
  },
  links: {
    label: "Show us your work",
    help: "Optional, but it helps a lot. GitHub, Behance, Instagram, Drive, anything. Handles like @yourname work too.",
    add: "Add another link",
    remove: "Remove link",
    kind: "Link type",
    url: "Link",
    addShort: "+ Add",
    invalid: "That link doesn't look right",
  },
  equipped: (item: string) => `${item} equipped`,
  teamRoleLabel: "In a team, you're usually the…",
  hoursLabel: "Hours per week you can give",
  excitedLabel: "What are you excited about? (pick any)",
  funFactLabel: "Fun fact about you (optional)",
  funFactPlaceholder: "e.g. I can solve a Rubik's cube in 40 sec",
};

/** Accessory each team role puts on the avatar */
export const roleAccessory: Record<TeamRole, string> = {
  Planner: "Clipboard",
  Builder: "Hard hat",
  "Hype Person": "Headphones",
  "Problem Solver": "Smart glasses",
  Creative: "Beret",
};

// ---------------------------------------------------------------------------
// Level 6: Boss Check (Abdul Rafay)
// ---------------------------------------------------------------------------

export const level6 = {
  npc: [
    "Boss check! 2 quick questions 🧠",
    "Relax, this doesn't affect selection. Just for fun.",
  ],
  npcAhmed: ["Pro tip: question 2 is about me 😉"],
  correct: ["Sahi jawab! 🎯", "Easy money ✅"],
  wrong: ["Close, but nope 😅", "Oof. Plot twist 🙃"],
  answerWas: "Correct answer:",
  question: (n: number, total: number) => `Boss question ${n}/${total}`,
  hit: "Boss hit!",
  nextHint: "Answer both to continue",
};

export const quiz = [
  {
    question: "What does GDG stand for?",
    options: [
      "Google Developer Groups",
      "Global Design Guild",
      "Google Data Gang",
      "Great Developers Gathering",
    ],
    answer: 0,
  },
  {
    question: "Who's your guide on this quest?",
    options: ["Sumaiyyah", "Ahmed", "Abdul Rafay", "Google Assistant"],
    answer: 1,
  },
] as const;

// ---------------------------------------------------------------------------
// Level 7: Review + Loot (all 3)
// ---------------------------------------------------------------------------

export const level7 = {
  npc: {
    ahmed: "Last stop. Check your character sheet, fix any typos.",
    rafay: "Once you submit, no edits. Rafay rules 📋",
    sumaiya: "And then the loot drops 🎁",
  },
  sections: {
    character: "Character",
    house: "House",
    story: "Story",
    extras: "Extras",
  },
  edit: "Edit",
  backToReview: "Back to review",
  consent:
    "I confirm these details are correct and I'm okay with GDGOC AU using them to review my application and contact me.",
  groupNote: "Heads up: after submitting, you have to join the recruitment WhatsApp group. All recruitment updates are shared only there.",
  submit: "Submit application",
  submitting: "Submitting…",
  botCheck: "Quick bot check",
  needBotCheck: "Complete the bot check first.",
  needConsent: "Tick the consent box to submit",
  missing: "Missing",
  nonePicked: "None picked",
  noneAdded: "None added",
  notAdded: "Not added",
};

export const success = {
  title: "Quest complete! 🎉",
  npc: {
    sumaiya: "You're in the pool! Thanks for applying.",
    ahmed: "Proud of you for finishing. Now go flex your card 😎",
    rafay: "Ab WhatsApp group join karo, it's a must. Everything gets announced there 📢",
  },
  cardLine: "I entered the GDG Quest",
  cardGuide: "Guided by",
  share: "Share your card",
  download: "Download card",
  generating: "Making your card…",
  nextTitle: "What happens next",
  next: [
    "Join the recruitment WhatsApp group (green button above). It's required: saari recruitment updates wahin aayengi.",
    "We review every application, one by one.",
    "Shortlisted folks get a WhatsApp + email for an interview. Interviews are short and chill. Promise.",
  ],
  joinGroup: "Join the GDG Recruitment WhatsApp group (required)",
  joinGroupNote: "You have to join this group. The shortlist, interview slots and every recruitment update are shared only here.",
  shortlistLabel: "Shortlist",
  /** Small tilted polaroid near the end */
  polaroid: {
    photo: "/team/ahmed-speaking.jpg",
    alt: "Ahmed presenting at Air University",
    caption: "See you at our next session 👋",
    signed: "Ahmed",
  },
  /** Small bonus at the very end. Kept quiet on purpose so it doesn't steal focus. */
  gift: {
    title: "🎁 Bonus level",
    text: "Ahmed also built a little game. Play it whenever you're bored.",
    cta: "Play",
    url: "https://ahmadmalik.wyibe.com",
  },
};

/** Lines when someone pokes their character */
export const avatarQuips = [
  "Hehe, that tickles 😆",
  "Looking sharp 😎",
  "Boing! 🦘",
  "Ready for the next level 💪",
  "Main character energy ✨",
  "Okay okay, back to the quest 😅",
];

export const closed = {
  title: "Quest closed",
  body: "Applications for this round are closed. Follow us so you don't miss the next one.",
  follow: "Follow on Instagram",
};

export const footer = {
  help: "Need help? Email",
  whatsappPresident: "WhatsApp the President",
  whatsappVp: "or Ahmed (VP)",
  group: "Recruitment WhatsApp group",
  builtBy: "Built with",
  builtByName: "Ahmed Malik",
  builtByRole: "your Vice President",
};

export const follow = {
  title: "Follow GDGOC AU",
  instagram: "Instagram",
  linkedin: "LinkedIn",
};

export const errors = {
  turnstileLoad: "Bot check couldn't load. Check your connection and refresh.",
  cardFailed: "Couldn't make the card on this device. Try a screenshot instead 📸",
  duplicate: "Is roll no se already apply ho chuka hai. Masla ho to email ya WhatsApp karo",
  closed: "Applications are closed now. The deadline passed.",
  bot: "Bot check failed. Refresh the page and try again.",
  validation: "Kuch fields theek nahi hain. Check the highlighted ones.",
  network: "Network issue. Check your connection and try again.",
  generic: "Something went wrong on our side. Your answers are saved on this device, so just try again in a minute.",
  busy: "Bohat rush hai abhi! Your answers are saved on this device. Try submitting again in a few minutes.",
  whatsapp: "WhatsApp the President",
  email: "Email us",
};

export const ui = {
  level: (n: number) => `Level ${n}/7`,
  xp: "XP",
  speedMode: "Speed mode",
  speedShort: "Speed",
  speedModeOn: "Speed mode on: no animations",
  next: "Next",
  back: "Back",
  continue: "Continue",
  skip: "Skip",
  required: "Required",
  optional: "Optional",
  skipChat: "Skip chat",
  poke: "Poke your character",
  pokeTitle: "Poke me",
  sound: "Sound",
  soundOn: "Sound on: music and effects",
  soundOff: "Sound off",
  soundHint: "🎵 Music on. Tap 🔊 at the top to mute",
};

export const levelNames = [
  "Press Start",
  "Welcome to GDG",
  "Meet the Council",
  "Build your Character",
  "Choose your House",
  "Your Story",
  "Boss Check",
  "Review + Loot",
] as const;

/** Per-level look: badge color (AA with its text color), emoji, and who hosts it */
export const levelStyle: Record<number, { color: string; solid: string; onSolid: string; emoji: string; hosts: HostId[] }> = {
  1: { color: "#4285F4", solid: "#1967D2", onSolid: "#FFFFFF", emoji: "🌍", hosts: ["sumaiya", "ahmed"] },
  2: { color: "#EA4335", solid: "#C5221F", onSolid: "#FFFFFF", emoji: "👑", hosts: ["ahmed", "sumaiya"] },
  3: { color: "#FBBC04", solid: "#FBBC04", onSolid: "#202124", emoji: "🧑‍🎨", hosts: ["rafay", "ahmed"] },
  4: { color: "#34A853", solid: "#188038", onSolid: "#FFFFFF", emoji: "🚪", hosts: ["ahmed"] },
  5: { color: "#4285F4", solid: "#1967D2", onSolid: "#FFFFFF", emoji: "📝", hosts: ["ahmed", "sumaiya"] },
  6: { color: "#EA4335", solid: "#C5221F", onSolid: "#FFFFFF", emoji: "🧠", hosts: ["rafay", "ahmed"] },
  7: { color: "#FBBC04", solid: "#FBBC04", onSolid: "#202124", emoji: "🎁", hosts: ["ahmed", "sumaiya", "rafay"] },
};

export const levelUp = {
  cleared: (n: number) => `Level ${n} cleared!`,
  xp: "+50 XP",
  /** Ahmed's one-liner on each cleared level (index = level cleared) */
  cheers: ["", "Nice one 👍", "Kya baat hai 🔥", "Looking good 😎", "Great pick 🚪", "On a roll 🚀", "Last stop next 🎁"],
};

/** Confirmation email (only sent when RESEND_API_KEY is set) */
export const email = {
  subject: "Quest accepted ✅ GDGOC AU application received",
  body: (firstName: string, house: string) =>
    [
      `Hey ${firstName},`,
      "",
      `Your GDG Quest application for ${house} is in. Nice work.`,
      "If you're shortlisted, we'll reach out on WhatsApp and email for a short interview.",
      "",
      `You have to join the recruitment WhatsApp group. The shortlist, interview slots and every update are shared there: ${site.whatsappGroup}`,
      "",
      `Questions? Email ${site.helpEmail}, or WhatsApp ${site.president.name} (President) at ${site.president.display}.`,
      "",
      `Team ${site.chapterShort}`,
    ].join("\n"),
};
