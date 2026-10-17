import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";

let app: App | undefined;

/** Admin SDK singleton. Credentials come from env, never from the client. */
export function adminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  const projectId = process.env.FIREBASE_PROJECT_ID;
  // Local emulator (FIRESTORE_EMULATOR_HOST set): no service account needed
  if (process.env.FIRESTORE_EMULATOR_HOST && projectId) {
    app = initializeApp({ projectId });
    return app;
  }
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  // Vercel stores the key with literal "\n"; turn them back into newlines
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Firebase Admin env vars missing (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY)");
  }
  app = initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}
