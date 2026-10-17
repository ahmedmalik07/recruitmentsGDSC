/**
 * Service account parsing, shared by the Admin SDK setup and scripts/set-claims.ts.
 * No "server-only" import here so plain Node scripts can use it too. Never put this in client code.
 */

/** Thrown when the server's Firebase settings are missing or unreadable. Message never contains secrets. */
export class AdminConfigError extends Error {}

type ServiceAccount = { projectId: string; clientEmail: string; privateKey: string };

/** Strip wrapping quotes and whitespace that often sneak in when pasting into Vercel */
export function clean(value: string | undefined): string {
  let v = (value ?? "").trim();
  while (v.length > 1 && ((v[0] === '"' && v.at(-1) === '"') || (v[0] === "'" && v.at(-1) === "'"))) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

/** Accepts the key with literal "\n", real newlines, Windows line endings or wrapping quotes */
function normalizePrivateKey(raw: string | undefined): string {
  const key = clean(raw).replace(/\\r/g, "").replace(/\\n/g, "\n").replace(/\r\n/g, "\n").trim();
  return key ? `${key}\n` : "";
}

function fromJson(raw: string): ServiceAccount {
  let text = clean(raw);
  if (!text.startsWith("{")) {
    // Allow base64 of the JSON file too
    try {
      text = Buffer.from(text, "base64").toString("utf8");
    } catch {
      // fall through to the JSON error below
    }
  }
  let json: { project_id?: string; client_email?: string; private_key?: string };
  try {
    json = JSON.parse(text);
  } catch {
    throw new AdminConfigError("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the whole key file contents.");
  }
  return {
    projectId: clean(json.project_id),
    clientEmail: clean(json.client_email),
    privateKey: normalizePrivateKey(json.private_key),
  };
}

/** Reads credentials from FIREBASE_SERVICE_ACCOUNT (whole JSON) or the three separate variables. */
export function readServiceAccount(): ServiceAccount {
  const sa = process.env.FIREBASE_SERVICE_ACCOUNT?.trim()
    ? fromJson(process.env.FIREBASE_SERVICE_ACCOUNT)
    : {
        projectId: clean(process.env.FIREBASE_PROJECT_ID),
        clientEmail: clean(process.env.FIREBASE_CLIENT_EMAIL),
        privateKey: normalizePrivateKey(process.env.FIREBASE_PRIVATE_KEY),
      };

  const missing = [
    !sa.projectId && "FIREBASE_PROJECT_ID",
    !sa.clientEmail && "FIREBASE_CLIENT_EMAIL",
    !sa.privateKey && "FIREBASE_PRIVATE_KEY",
  ].filter(Boolean);
  if (missing.length) throw new AdminConfigError(`Missing in Vercel: ${missing.join(", ")}`);
  if (!sa.privateKey.includes("-----BEGIN PRIVATE KEY-----") || !sa.privateKey.includes("-----END PRIVATE KEY-----")) {
    throw new AdminConfigError(
      "FIREBASE_PRIVATE_KEY doesn't look like a private key. It must start with -----BEGIN PRIVATE KEY----- and end with -----END PRIVATE KEY-----",
    );
  }
  if (!sa.clientEmail.includes("@") || !sa.clientEmail.endsWith(".gserviceaccount.com")) {
    throw new AdminConfigError("FIREBASE_CLIENT_EMAIL should be the service account email ending in .gserviceaccount.com");
  }
  return sa;
}
