const fs = require('fs');
const path = require('path');
const { cert, initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

const envPath = path.join(__dirname, '..', '.env.local');
const env = fs.readFileSync(envPath, 'utf8');
const config = {};
env.split('\n').forEach(l => {
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
  })
});

const db = getFirestore(app);

async function seed() {
  console.log(`Starting seed to Firestore project: ${config.FIREBASE_PROJECT_ID}...`);
  const data = require('../.data/pm-zaika.json');
  const menuItems = Object.values(data.menu || {});

  if (menuItems.length === 0) {
    console.error('No menu items found in .data/pm-zaika.json');
    process.exit(1);
  }

  console.log(`Found ${menuItems.length} dishes to seed.`);

  // Firestore allows up to 500 writes per batch. We chunk by 250 for safety.
  const chunkSize = 250;
  let seededCount = 0;

  for (let i = 0; i < menuItems.length; i += chunkSize) {
    const chunk = menuItems.slice(i, i + chunkSize);
    const batch = db.batch();

    for (const item of chunk) {
      const docRef = db.collection('menu').doc(item.id);
      batch.set(docRef, item);
    }

    await batch.commit();
    seededCount += chunk.length;
    console.log(`Seeded ${seededCount}/${menuItems.length} dishes...`);
  }

  // Also write the bundled menu_catalog snapshot document so runtime reads cost 1 read
  console.log('Writing bundled settings/menu_catalog snapshot...');
  await db.collection('settings').doc('menu_catalog').set({
    id: 'menu_catalog',
    items: menuItems.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)),
    updatedAt: new Date().toISOString(),
  });
  console.log('Bundled settings/menu_catalog snapshot created.');

  console.log(`\nSUCCESS: All ${seededCount} menu items + catalog snapshot successfully seeded into Firestore!`);
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
