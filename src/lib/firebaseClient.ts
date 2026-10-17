"use client";

import { getApp, getApps, initializeApp, type FirebaseApp } from "firebase/app";
import { connectAuthEmulator, getAuth, type Auth } from "firebase/auth";
import { connectFirestoreEmulator, getFirestore, type Firestore } from "firebase/firestore";

/** Web SDK, used only by /admin. The candidate route never imports this. */
const config = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

export const firebaseConfigured = Boolean(config.apiKey && config.projectId);

function app(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(config);
}

/** Local dev: NEXT_PUBLIC_USE_FIREBASE_EMULATORS=true talks to `firebase emulators:start` */
const useEmulators = process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATORS === "true";
let authInstance: Auth | undefined;
let dbInstance: Firestore | undefined;

export function clientAuth(): Auth {
  if (!authInstance) {
    authInstance = getAuth(app());
    if (useEmulators) connectAuthEmulator(authInstance, "http://127.0.0.1:9099", { disableWarnings: true });
  }
  return authInstance;
}

export function clientDb(): Firestore {
  if (!dbInstance) {
    dbInstance = getFirestore(app());
    if (useEmulators) connectFirestoreEmulator(dbInstance, "127.0.0.1", 8080);
  }
  return dbInstance;
}
