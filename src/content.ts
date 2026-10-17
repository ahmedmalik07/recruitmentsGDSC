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
  /** PLACEHOLDER: your real Instagram handle */
  igHandle: "@gdgoc.au",
  /** PLACEHOLDER: link printed on the Applicant Card and in emails */
  link: "gdg.community.dev/gdgoc-air-university",
  /** Official GDG on Campus lockup with your chapter name. Replace the placeholder file. */
  logo: "/brand/gdgoc-au-logo.svg",
  /**
   * Optional. Applications close at this moment if NEXT_PUBLIC_APPLICATIONS_DEADLINE is set
   * (ISO 8601 with timezone, e.g. 2026-11-01T23:59:00+05:00). Empty = applications stay open.
   */
  deadline: process.env.NEXT_PUBLIC_APPLICATIONS_DEADLINE || "",
  /** Shown on the success screen instead of a date */
  shortlistNote: "Date will be announced soon on our Instagram and WhatsApp.",
  /** WhatsApp contact for problems. Number in international format, digits only. */
  whatsapp: {
    name: "Ahmed Malik",
    number: "923193608483",
    display: "0319 3608483",
  },
  /** Roll number rule. Default: exactly 6 digits. */
  rollNoRegex: "^\\d{6}$",
  rollNoHint: "6 digit roll no, e.g. 231234",
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
  funFact: string;
  bio: string;
  accent: string;
};

export const hosts: Record<HostId, Host> = {
  sumaiya: {
    id: "sumaiya",
    name: "Sumaiya",
    firstName: "Sumaiya",
    role: "President",
    photo: "/team/sumaiya.svg",
    funFact: "PLACEHOLDER: Sumaiya's fun fact goes here.",
    bio: "Runs the show. If GDGOC AU has a vision board, she made it.",
    accent: "#EA4335",
  },
  ahmed: {
    id: "ahmed",
    name: "Ahmed Malik",
    firstName: "Ahmed",
    role: "Vice President",
    photo: "/team/ahmed.svg",
    funFact: "PLACEHOLDER: Ahmed's fun fact goes here.",
    bio: "Your guide for this quest. Builds things, wins hackathons, drinks too much chai.",
    accent: "#4285F4",
  },
  rafay: {
    id: "rafay",
    name: "Abdul Rafay",
    firstName: "Rafay",
    role: "General Secretary",
    photo: "/team/rafay.svg",
    funFact: "PLACEHOLDER: Rafay's fun fact goes here.",
    bio: "Keeps everything on track. Knows where every file, form and chair is.",
    accent: "#34A853",
  },
};

/** Ahmed's stat lines on his council card (Level 2). */
export const ahmedStats = [
  "4× National Hackathon Winner",
  "Founder, Wyibe",
  "VP, GDGOC AU",
] as const;

/** Ahmed's intro video for Level 4. Keep it ~15 sec, muted friendly, under 2 MB. */
export const ahmedVideo = {
  src: "/team/ahmed-intro.mp4",
  poster: "/team/ahmed-intro-poster.svg",
  /** Captions shown on top of the muted video. Times in seconds. */
  captions: [
    { start: 0, end: 4, text: "Salam! Ahmed here, VP of GDGOC AU." },
    { start: 4, end: 8, text: "We have 4 houses. Each one runs a different part of the chapter." },
    { start: 8, end: 12, text: "Pick the one that actually sounds like you, not the one that sounds cool." },
    { start: 12, end: 16, text: "Doors are below. Choose wisely 👇" },
  ],
} as const;

// ---------------------------------------------------------------------------
// Level 0 + 1: Sumaiya
// ---------------------------------------------------------------------------

export const titleScreen = {
  tagline: "Recruitment 2026",
  title: "GDG Quest",
  subtitle: "7 levels. ~5 minutes. No sign-in. One shot at joining the team.",
  start: "Press Start",
  resume: (level: number) => `Continue from Level ${level}`,
  restart: "Start over",
  npc: [
    "Hey hey! I'm Sumaiya, President of GDGOC AU 👋",
    "Welcome to GDG Quest. Yeh koi boring form nahi hai, it's a mini game.",
    "Finish all 7 levels and your application is in. Ready?",
  ],
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
    body: "Events, hackathons, hands-on workshops and real projects at Air University. Tech talks, Google tech, and a lot of chai.",
  },
  {
    emoji: "🚀",
    title: "Why it matters for you",
    body: "Skills that don't come from lectures, a network that actually helps, and a team that ships things together.",
  },
] as const;

export const level1 = {
  npcIntro: ["Quick lore drop first. Swipe through these 3 cards 👉"],
  handover: "Ab tumhara guide Ahmed hai. He'll take it from here. Good luck! ✨",
  swipeHint: "Swipe or use the arrows",
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
  },
  guideBadge: "Your Guide",
  flipHint: "Tap to flip",
  progress: (n: number) => `${n}/3 flipped`,
};

// ---------------------------------------------------------------------------
// Level 3: Build your Character (Abdul Rafay)
// ---------------------------------------------------------------------------

export const level3 = {
  npc: [
    "Rafay here, GS. I handle the paperwork, so let's make it quick.",
    "Fill your details and watch your character come alive 👀",
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
    department: "e.g. Computer Science",
  },
  help: {
    phone: "Pakistani mobile, 11 digits, starts with 03",
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
 * Department is free text. These only show up as autocomplete suggestions while typing,
 * so candidates can write anything. Add or remove freely.
 */
export const departmentSuggestions = [
  "Computer Science",
  "Software Engineering",
  "Artificial Intelligence",
  "Cyber Security",
  "Data Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Mechatronics Engineering",
  "Aerospace Engineering",
  "Avionics Engineering",
  "Business Administration",
  "Accounting & Finance",
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
// Level 4: Choose your House (Ahmed)
// ---------------------------------------------------------------------------

export const DOMAIN_IDS = ["technical", "marketing_partnerships", "visual_media", "ops"] as const;
export type DomainId = (typeof DOMAIN_IDS)[number];

export type Domain = {
  id: DomainId;
  label: string;
  house: string;
  /** Google brand color: doors, glows, emblems, chart bars */
  color: string;
  /** Same hue, dark enough for text on top (WCAG AA) */
  solid: string;
  /** Text color on top of `solid` */
  onColor: string;
  description: [string, string];
  /** Optional, shown under the door. Leave empty to hide. */
  lead: string;
  skills: readonly string[];
  portfolioLabel: string;
  portfolioPlaceholder: string;
};

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
    skills: ["Web", "App", "AI/ML", "Cloud", "Game Dev"],
    portfolioLabel: "GitHub",
    portfolioPlaceholder: "https://github.com/yourname",
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
      "Socials, outreach, copy and deals with brands.",
    ],
    lead: "",
    skills: ["Social Media", "Sponsorships", "Outreach", "Copywriting"],
    portfolioLabel: "LinkedIn / past campaign",
    portfolioPlaceholder: "https://linkedin.com/in/yourname",
  },
  visual_media: {
    id: "visual_media",
    label: "Visual Media",
    house: "House of Pixels",
    color: "#EA4335",
    solid: "#C5221F",
    onColor: "#FFFFFF",
    description: [
      "Make GDGOC AU look good: posts, reels, photos, merch.",
      "Design, edit, shoot and set the vibe.",
    ],
    lead: "",
    skills: ["Graphic Design", "Video Editing", "Photography", "UI/UX"],
    portfolioLabel: "Behance / Drive / IG portfolio",
    portfolioPlaceholder: "https://behance.net/yourname",
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
    skills: ["Event Management", "Logistics", "Hosting/Anchoring", "Documentation"],
    portfolioLabel: "LinkedIn / past events",
    portfolioPlaceholder: "https://linkedin.com/in/yourname",
  },
};

export const level4 = {
  npc: [
    "Okay, the big one. Choosing your house 🏠",
    "Watch my 15 sec intro, then pick exactly one door.",
  ],
  videoLabel: "Ahmed's intro to the houses",
  playVideo: "Play intro",
  doorsTitle: "Pick your door",
  chosen: "Your house",
  skillsTitle: "Your skills (optional, pick any)",
  npcAfterPick: (house: string) => `${house}, nice pick. Add your skills if you want, then let's go.`,
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

export const EXCITED = ["Events", "Hackathons", "Workshops", "Networking", "Content"] as const;
export type Excited = (typeof EXCITED)[number];

export const level5 = {
  npc: [
    "Story time. This is the part we actually read, so be real 🙌",
    "No essays needed. Just honest answers.",
  ],
  experience: {
    label: "Tell us about your experience (projects, events, societies, freelancing, anything)",
    helper: "No experience? Totally fine, tell us what you want to learn.",
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
  portfolioHelp: "Optional, but it helps a lot",
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
  correct: ["Sahi jawab! 🎯", "Easy money ✅"],
  wrong: ["Close, but nope 😅", "Oof. Plot twist 🙃"],
  answerWas: "Correct answer:",
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
    options: ["Sumaiya", "Ahmed", "Abdul Rafay", "Google Assistant"],
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
  submit: "Submit application",
  submitting: "Submitting…",
  botCheck: "Quick bot check",
};

export const success = {
  title: "Quest complete! 🎉",
  npc: {
    sumaiya: "You're in the pool! Thanks for applying.",
    ahmed: "Proud of you for finishing. Now go flex your card 😎",
    rafay: "We'll be in touch. Phone pe nazar rakhna.",
  },
  cardLine: "I entered the GDG Quest",
  share: "Share your card",
  download: "Download card",
  generating: "Making your card…",
  nextTitle: "What happens next",
  next: [
    "We review every application, one by one.",
    `Shortlisted folks get a WhatsApp + email for an interview.`,
    "Interviews are short and chill. Promise.",
  ],
  shortlistLabel: "Shortlist",
};

export const closed = {
  title: "Quest closed",
  body: "Applications for this round are closed. Follow us so you don't miss the next one.",
  follow: "Follow on Instagram",
};

export const errors = {
  duplicate: "Is roll no se already apply ho chuka hai. Masla ho to WhatsApp karo",
  closed: "Applications are closed now. The deadline passed.",
  bot: "Bot check failed. Refresh the page and try again.",
  validation: "Kuch fields theek nahi hain. Check the highlighted ones.",
  network: "Network issue. Check your connection and try again.",
  generic: "Something went wrong on our side. Try again in a minute.",
  whatsapp: "WhatsApp us",
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
      `Questions? WhatsApp ${site.whatsapp.name} at ${site.whatsapp.display}.`,
      "",
      `Team ${site.chapterShort}`,
    ].join("\n"),
};
