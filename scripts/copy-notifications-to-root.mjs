import fs from 'node:fs';
import path from 'node:path';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
} from 'firebase/firestore';

const SOURCE_DOC_PATH = 'resolutions/appState';
const TARGET_COLLECTION_PATH = 'notifications';

function loadEnv() {
  const raw = fs.readFileSync(path.resolve('.env'), 'utf8');
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }

  return env;
}

async function copyIfMissing(docRef, data) {
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return false;
  }
  await setDoc(docRef, data);
  return true;
}

async function run() {
  const env = loadEnv();
  const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
  });
  const db = getFirestore(app);

  const sourceRef = doc(db, SOURCE_DOC_PATH);
  const sourceSnap = await getDoc(sourceRef);

  if (!sourceSnap.exists()) {
    throw new Error(`Source doc not found: ${SOURCE_DOC_PATH}`);
  }

  const source = sourceSnap.data() || {};
  const notifications = Array.isArray(source.notifications) ? source.notifications : [];

  let copied = 0;
  let skipped = 0;

  for (const notification of notifications) {
    if (!notification?.id) {
      skipped += 1;
      continue;
    }

    const notificationRef = doc(collection(db, TARGET_COLLECTION_PATH), String(notification.id));
    const didCopy = await copyIfMissing(notificationRef, notification);
    if (didCopy) copied += 1;
    else skipped += 1;
  }

  console.log('Notifications root copy complete.');
  console.log(`Source: ${SOURCE_DOC_PATH}`);
  console.log(`Target: ${TARGET_COLLECTION_PATH}/{notificationId}`);
  console.log(`Copied: ${copied}, skipped: ${skipped}`);
  console.log('No source data was modified or deleted.');
}

run().catch((error) => {
  console.error('Copy failed.');
  console.error(error);
  process.exitCode = 1;
});
