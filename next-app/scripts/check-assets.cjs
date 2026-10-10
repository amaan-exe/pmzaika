const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const files = [
  'src/app/reservation/page.tsx',
  'src/app/contact/page.tsx',
  'src/app/about/page.tsx',
  'src/app/gallery/page.tsx',
  'src/components/SubpageHero.tsx',
];

const IMG_RE = /\/assets\/images\/[^'"`\s)]+/g;
const refs = new Set();

for (const file of files) {
  const src = fs.readFileSync(path.join(root, file), 'utf8');
  // `const IMG = '/assets/images/...'` is a template prefix, not a real file.
  const withoutPrefixes = src.replace(/^const IMG\s*=.*$/m, '');
  for (const m of withoutPrefixes.matchAll(IMG_RE)) refs.add(m[0].replace(/[',;]+$/, ''));
}

const missing = [...refs].filter((r) => !fs.existsSync(path.join(root, 'public', r)));

console.log('static image paths referenced: ' + refs.size);
console.log('broken: ' + missing.length);
missing.forEach((m) => console.log('  BROKEN ' + m));

// The gallery builds its filenames from an id list, so verify those directly.
const gallery = fs.readFileSync(path.join(root, 'src/app/gallery/page.tsx'), 'utf8');
const ids = [
  ...new Set([...gallery.matchAll(/'((?:8\.01|2\.36)\.\d+-PM(?:-\d)?)'/g)].map((m) => m[1])),
];

const gmissing = ids.filter((id) =>
  !fs.existsSync(
    path.join(root, 'public/assets/images', `WhatsApp-Image-2026-02-03-at-${id}-300x300.jpeg`)
  )
);

console.log('gallery photo ids: ' + ids.length + ', broken: ' + gmissing.length);
gmissing.forEach((m) => console.log('  BROKEN ' + m));

process.exit(missing.length + gmissing.length === 0 ? 0 : 1);