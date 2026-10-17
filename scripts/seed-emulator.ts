/**
 * Fill the LOCAL Firestore emulator with fake applications to try the admin panel.
 * Refuses to run against a real project.
 *
 *   npm run emulators            (in one terminal)
 *   npm run seed                 (in another)
 *   npm run seed -- --claims you@gmail.com core     (after signing in to /admin once)
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT = "demo-gdg-quest";
process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8080";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

initializeApp({ projectId: PROJECT });

async function setClaims(email: string, role: string, domain?: string) {
  const auth = getAuth();
  const user = await auth.getUserByEmail(email);
  await auth.setCustomUserClaims(user.uid, domain ? { role, domain } : { role });
  console.log(`✓ ${email} → ${role}${domain ? ` (${domain})` : ""}`);
}

async function seed() {
  const db = getFirestore();
  const names = ["Ayesha Khan", "Hamza Ali", "Zainab Fatima", "Usman Tariq", "Mahnoor Iqbal", "Bilal Ahmed", "Hira Shah", "Saad Raza", "Fatima Noor", "Ali Hassan", "Maryam Javed", "Taha Qureshi"];
  const domains = ["technical", "marketing_partnerships", "creatives", "media", "ops"] as const;
  const positions: Record<string, string[]> = {
    technical: ["lead", "co_lead", "member"],
    marketing_partnerships: ["lead", "co_lead", "member"],
    creatives: ["photographer", "videographer", "graphics"],
    media: ["lead", "member"],
    ops: ["lead", "co_lead", "member"],
  };
  const skills: Record<string, string[]> = {
    technical: ["Web", "App", "AI/ML", "Cloud", "Game Dev"],
    marketing_partnerships: ["Sponsorships", "Outreach", "Copywriting", "Campaigns"],
    creatives: ["Photography", "Videography", "Graphic Design", "Video Editing"],
    media: ["Social Media", "Content Writing", "Reels", "Event Coverage"],
    ops: ["Event Management", "Logistics", "Hosting/Anchoring", "Documentation"],
  };
  const depts = ["Computer Science", "Software Engineering", "Artificial Intelligence", "Cyber Security", "Business Administration", "Electrical Engineering"];
  const statuses = ["submitted", "submitted", "submitted", "shortlisted", "rejected", "selected"];
  const batch = db.batch();
  for (let i = 0; i < 36; i++) {
    const domain = domains[i % domains.length];
    const rollNo = String(230100 + i * 7);
    const created = new Date(Date.now() - (i % 14) * 86400000 - i * 3600000);
    batch.set(db.doc(`applications/${rollNo}`), {
      fullName: names[i % names.length],
      email: `student${i}@example.com`,
      rollNo,
      phone: `0300${String(1000000 + i).slice(-7)}`,
      semester: (i % 8) + 1,
      department: depts[i % depts.length],
      domain,
      position: positions[domain][i % positions[domain].length],
      skillTags: skills[domain].slice(0, (i % 3) + 1),
      experience: "Built a few side projects, helped run a society event and did some freelancing over the summer. Want to get better at shipping with a team.",
      whyJoin: "I want to learn from people who actually build things, and help make GDGOC AU events bigger and better for everyone.",
      // A few use the old single-link field so the admin fallback stays tested
      ...(i % 5 === 0
        ? { portfolioUrl: `https://github.com/student${i}` }
        : {
            links: i % 3
              ? [
                  { kind: "github", url: `https://github.com/student${i}` },
                  { kind: "instagram", url: `https://www.instagram.com/student${i}` },
                ]
              : [],
          }),
      teamRole: ["Planner", "Builder", "Hype Person", "Problem Solver", "Creative"][i % 5],
      hoursPerWeek: ["2-4", "5-8", "8+"][i % 3],
      excitedAbout: ["Events", "Hackathons", "Workshops"].slice(0, (i % 3) + 1),
      funFact: i % 2 ? "Can solve a Rubik's cube in 40 sec" : "",
      quizScore: i % 3,
      timeTakenSec: 180 + i * 7,
      status: statuses[i % statuses.length],
      createdAt: Timestamp.fromDate(created),
      updatedAt: Timestamp.fromDate(created),
    });
  }
  await batch.commit();
  console.log("✓ Seeded 36 applications into the emulator");
}

const i = process.argv.indexOf("--claims");
(i === -1 ? seed() : setClaims(process.argv[i + 1], process.argv[i + 2], process.argv[i + 3])).catch((e) => {
  console.error(e);
  process.exit(1);
});
