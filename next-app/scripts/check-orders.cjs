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
  console.log(`Checking Firestore project: ${config.FIREBASE_PROJECT_ID}...`);
  const testRef = db.collection('_test_connection').doc('ping');
  await testRef.set({ ping: 'pong', time: new Date().toISOString() });
  console.log('Write to Firestore SUCCESS!');
  const snapPing = await testRef.get();
  console.log('Read from Firestore SUCCESS:', snapPing.data());
  await testRef.delete();
  console.log('Delete from Firestore SUCCESS!');

  const snapshot = await db.collection('orders').get();
  console.log(`Total orders in Firestore: ${snapshot.size}`);
  snapshot.forEach((doc) => {
    const d = doc.data();
    console.log(
      `ID: ${doc.id} | Customer: ${d.customerName} | Phone: ${d.customerPhone} | Status: ${d.status} | Total: Rs ${d.totalPaise / 100} | CreatedAt: ${d.createdAt}`
    );
  });
}

check().catch(console.error);
