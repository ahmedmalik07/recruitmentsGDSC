import "server-only";
import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { AdminConfigError, clean, readServiceAccount } from "./serviceAccount";

export { AdminConfigError, readServiceAccount };

let app: App | undefined;

/** Admin SDK singleton. Credentials come from env, never from the client. */
export function adminApp(): App {
  if (app) return app;
  if (getApps().length) {
    app = getApps()[0];
    return app;
  }
  // Local emulator (FIRESTORE_EMULATOR_HOST set): no service account needed
  const emulatorProject = clean(process.env.FIREBASE_PROJECT_ID);
  if (process.env.FIRESTORE_EMULATOR_HOST && emulatorProject) {
    app = initializeApp({ projectId: emulatorProject });
    return app;
  }
  const sa = readServiceAccount();
  try {
    app = initializeApp({ credential: cert(sa), projectId: sa.projectId });
  } catch (err) {
    throw new AdminConfigError(`Firebase couldn't read the service account key: ${(err as Error).message.slice(0, 160)}`);
  }
  return app;
}

export function adminDb(): Firestore {
  return getFirestore(adminApp());
}
