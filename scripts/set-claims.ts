/**
 * Give someone admin access to /admin.
 *
 *   npx tsx scripts/set-claims.ts --email someone@gmail.com --role core
 *   npx tsx scripts/set-claims.ts --email lead@gmail.com --role lead --domain technical
 *   npx tsx scripts/set-claims.ts --email someone@gmail.com --remove
 *   npx tsx scripts/set-claims.ts --list
 *
 * The person must have signed in to /admin once (so their Firebase Auth user exists).
 * Reads the same credentials as the site from .env.local: FIREBASE_SERVICE_ACCOUNT (the whole key JSON)
 * or FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY.
 */
import { cert, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { readServiceAccount } from "../src/lib/server/serviceAccount";

const DOMAINS = ["technical", "marketing_partnerships", "creatives", "media", "ops"] as const;

for (const file of [".env.local", ".env"]) {
  try {
    process.loadEnvFile(file);
  } catch {
    // file missing: fine
  }
}

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
}
const has = (name: string) => process.argv.includes(`--${name}`);

function fail(msg: string): never {
  console.error(`✗ ${msg}`);
  process.exit(1);
}

async function main() {
  let sa;
  try {
    sa = readServiceAccount();
  } catch (err) {
    fail(`${(err as Error).message.replace("in Vercel", "in .env.local")}. Put FIREBASE_SERVICE_ACCOUNT (the whole key JSON) in .env.local.`);
  }
  initializeApp({ credential: cert(sa), projectId: sa.projectId });
  const auth = getAuth();

  if (has("list")) {
    let pageToken: string | undefined;
    do {
      const page = await auth.listUsers(1000, pageToken);
      for (const u of page.users) {
        if (u.customClaims?.role) {
          console.log(`${u.email}\t${u.customClaims.role}${u.customClaims.domain ? `\t${u.customClaims.domain}` : ""}`);
        }
      }
      pageToken = page.pageToken;
    } while (pageToken);
    return;
  }

  const email = arg("email")?.trim().toLowerCase();
  if (!email) fail("Missing --email");

  let user;
  try {
    user = await auth.getUserByEmail(email);
  } catch {
    fail(`No Firebase user for ${email}. Ask them to sign in to /admin once first.`);
  }

  if (has("remove")) {
    await auth.setCustomUserClaims(user.uid, null);
    await auth.revokeRefreshTokens(user.uid);
    console.log(`✓ Removed admin access for ${email}`);
    return;
  }

  const role = arg("role");
  if (role !== "core" && role !== "lead") fail('--role must be "core" or "lead"');

  let claims: Record<string, string>;
  if (role === "lead") {
    const domain = arg("domain");
    if (!domain || !(DOMAINS as readonly string[]).includes(domain)) {
      fail(`Leads need --domain, one of: ${DOMAINS.join(", ")}`);
    }
    claims = { role, domain };
  } else {
    claims = { role };
  }

  await auth.setCustomUserClaims(user.uid, claims);
  console.log(`✓ ${email} → ${JSON.stringify(claims)}`);
  console.log("  They should reload /admin (the panel refreshes the token on load).");
}

main().catch((e) => fail((e as Error).message));
