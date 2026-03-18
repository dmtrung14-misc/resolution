import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  collection,
  serverTimestamp,
} from 'firebase/firestore';

const SOURCE_DOC_PATH = 'resolutions/appState';
const TARGET_YEAR = '2026';
const TARGET_TASKS_COLLECTION_PATH = `resolutions/${TARGET_YEAR}/tasks`;
const TARGET_NOTIFICATIONS_COLLECTION_PATH = `notifications/${TARGET_YEAR}/items`;

function loadEnvFromDotenv() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const envPath = path.resolve(__dirname, '..', '.env');

  if (!fs.existsSync(envPath)) {
    return {};
  }

  const raw = fs.readFileSync(envPath, 'utf8');
  const env = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const idx = trimmed.indexOf('=');
    if (idx === -1) {
      continue;
    }

    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^['"]|['"]$/g, '');
    env[key] = value;
  }

  return env;
}

function getFirebaseConfig() {
  const dotenvEnv = loadEnvFromDotenv();
  const read = (key) => process.env[key] || dotenvEnv[key];

  const config = {
    apiKey: read('VITE_FIREBASE_API_KEY'),
    authDomain: read('VITE_FIREBASE_AUTH_DOMAIN'),
    projectId: read('VITE_FIREBASE_PROJECT_ID'),
    storageBucket: read('VITE_FIREBASE_STORAGE_BUCKET'),
    messagingSenderId: read('VITE_FIREBASE_MESSAGING_SENDER_ID'),
    appId: read('VITE_FIREBASE_APP_ID'),
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Firebase config values: ${missing.join(', ')}`);
  }

  return config;
}

async function copyIfMissing(docRef, data) {
  const existing = await getDoc(docRef);
  if (existing.exists()) {
    return false;
  }

  await setDoc(docRef, data);
  return true;
}

async function run() {
  const app = initializeApp(getFirebaseConfig());
  const db = getFirestore(app);

  const sourceRef = doc(db, SOURCE_DOC_PATH);
  const sourceSnap = await getDoc(sourceRef);

  if (!sourceSnap.exists) {
    throw new Error(`Source doc not found: ${SOURCE_DOC_PATH}`);
  }

  const source = sourceSnap.data() || {};
  const tasks = Array.isArray(source.tasks) ? source.tasks : [];
  const notifications = Array.isArray(source.notifications) ? source.notifications : [];

  let copiedTaskCount = 0;
  let skippedTaskCount = 0;

  for (const task of tasks) {
    if (!task?.id) {
      // Keep script resilient; skip malformed rows instead of failing entire run.
      skippedTaskCount += 1;
      continue;
    }

    const taskRef = doc(collection(db, TARGET_TASKS_COLLECTION_PATH), String(task.id));
    const copied = await copyIfMissing(taskRef, task);
    if (copied) {
      copiedTaskCount += 1;
    } else {
      skippedTaskCount += 1;
    }
  }

  let copiedNotificationCount = 0;
  let skippedNotificationCount = 0;

  for (const notification of notifications) {
    if (!notification?.id) {
      skippedNotificationCount += 1;
      continue;
    }

    const notificationRef = doc(
      collection(db, TARGET_NOTIFICATIONS_COLLECTION_PATH),
      String(notification.id)
    );
    const copied = await copyIfMissing(notificationRef, notification);
    if (copied) {
      copiedNotificationCount += 1;
    } else {
      skippedNotificationCount += 1;
    }
  }

  const yearMetaRef = doc(db, `resolutions/${TARGET_YEAR}`);
  await setDoc(
    yearMetaRef,
    {
      userName: source.userName ?? '',
      partnerName: source.partnerName ?? '',
      sourceDocPath: SOURCE_DOC_PATH,
      targetTasksCollectionPath: TARGET_TASKS_COLLECTION_PATH,
      migratedAt: serverTimestamp(),
      note: 'One-time copy migration. Source data is untouched.',
    },
    { merge: true }
  );

  console.log('Copy migration complete.');
  console.log(`Source: ${SOURCE_DOC_PATH}`);
  console.log(`Tasks copied: ${copiedTaskCount}, skipped: ${skippedTaskCount}`);
  console.log(
    `Notifications copied: ${copiedNotificationCount}, skipped: ${skippedNotificationCount}`
  );
  console.log(`Tasks target: ${TARGET_TASKS_COLLECTION_PATH}`);
  console.log(`Notifications target: ${TARGET_NOTIFICATIONS_COLLECTION_PATH}`);
  console.log('No source data was modified or deleted.');
}

run().catch((error) => {
  console.error('Migration failed.');
  console.error(error);
  process.exitCode = 1;
});
