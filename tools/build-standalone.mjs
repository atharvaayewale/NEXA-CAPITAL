// Build a single-file copy of the homepage with every self-hosted asset inlined.
//
// Why: `index.html` references `assets/fonts/*.woff2` and `assets/brands/**/*.svg`.
// Those paths resolve when the page is served (npm run dev / Vercel) but NOT when the
// file is opened straight from disk or forwarded as an attachment — in that case the
// fonts fall back to a system family and every lender mark disappears.
//
// This script produces `nexa-capital-standalone.html`: one file, no external requests,
// identical markup and behaviour. Run it after changing fonts or lender marks:
//   node tools/build-standalone.mjs
import { readFileSync, writeFileSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'index.html'), 'utf8');

const mime = (path) => {
  if (path.endsWith('.woff2')) return 'font/woff2';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  if (path.endsWith('.webp')) return 'image/webp';
  return 'application/octet-stream';
};

const cache = new Map();
const inline = (path) => {
  if (cache.has(path)) return cache.get(path);
  const bytes = readFileSync(join(root, path));
  const uri = `data:${mime(path)};base64,${bytes.toString('base64')}`;
  cache.set(path, uri);
  return uri;
};

const refs = [...new Set([...source.matchAll(/assets\/[\w./-]+\.(?:svg|woff2?|png|jpe?g|webp)/g)].map((m) => m[0]))];
let output = source;
for (const ref of refs) {
  output = output.split(ref).join(inline(ref));
}

// the preload tag has nothing to fetch once the font is embedded
output = output.replace(/\s*<link rel="preload"[^>]*as="font"[^>]*>\n?/, '\n');

const target = join(root, 'nexa-capital-standalone.html');
writeFileSync(target, output);
const kb = (statSync(target).size / 1024).toFixed(0);
console.log(`standalone written: nexa-capital-standalone.html (${kb} KB, ${refs.length} assets inlined)`);
