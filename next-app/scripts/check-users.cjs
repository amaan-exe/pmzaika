const fs = require('fs');
const path = require('path');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const config = {};
env.split('\n').forEach((l) => {
  const trimmed = l.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const idx = trimmed.indexOf('=');
  if (idx !== -1) {
    const k = trimmed.substring(0, idx).trim();
    let v = trimmed.substring(idx + 1).trim();
    if (v.startsWith('"') && v.endsWith('"')) {
      v = v.substring(1, v.length - 1);
    }
    config[k] = v;
  }
});

const app = initializeApp({
  credential: cert({
    projectId: config.FIREBASE_PROJECT_ID,
    clientEmail: config.FIREBASE_CLIENT_EMAIL,
    privateKey: config.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
  }),
});

const db = getFirestore(app);

async function check() {
  const snapshot = await db.collection('users').get();
  console.log(`Total documents in 'users' collection: ${snapshot.size}`);
  snapshot.forEach((doc) => {
    console.log(`Doc ID: ${doc.id} | Email: ${doc.data().email} | Name: ${doc.data().displayName}`);
  });
}

check().catch(console.error);
