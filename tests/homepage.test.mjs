import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import test from 'node:test';
import { Script } from 'node:vm';

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map((match) => match[1]);
const body = html.slice(html.indexOf('<body>')).replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
const idSet = new Set(ids);

function attribute(tag, name) {
  const match = tag.match(new RegExp(`\\b${name}="([^"]+)"`));
  assert.ok(match, `Missing ${name} attribute`);
  return match[1];
}

test('hero, calculator and disclosures consistently use the indicative 9.99% rate', () => {
  assert.match(html, /Compare rates starting from <strong>9\.99% p\.a\.<\/strong>/);
  assert.match(html, /id="calc-rate-value"[^>]*>9\.99%<\/output>/);
  assert.match(html, /Rates starting from 9\.99% p\.a\. are indicative, not a personalised offer/);
  assert.doesNotMatch(html, /10\.49/);

  const input = html.match(/<input\b[^>]*id="calc-rate"[^>]*>/)?.[0];
  assert.ok(input, 'Calculator rate input must exist');
  const value = Number(attribute(input, 'value'));
  const min = Number(attribute(input, 'min'));
  const max = Number(attribute(input, 'max'));
  const step = Number(attribute(input, 'step'));
  assert.equal(value, 9.99);
  assert.equal(step, 0.01);
  assert.ok(value >= min && value <= max);
  assert.ok(Math.abs((value - min) / step - Math.round((value - min) / step)) < 1e-8,
    'The browser must not round 9.99 to a different step-aligned rate');
});

test('dummy application tracking is removed from markup, styles and scripts', () => {
  assert.doesNotMatch(html, /href="#track"|id="track"|track-form|track-mobile|tracking-card|TRACKING DEMO/);
});

test('demo labels and fictional borrower evidence are not presented as real', () => {
  assert.doesNotMatch(body, /\b(?:demo|prototype|concept|sample borrower|illustrative review|preview only)\b/i);
  assert.doesNotMatch(html, /Aarav M\.|Neha R\.|Sana K\.|review-rating-badge|proof-avatars/);
  assert.doesNotMatch(body, /State Bank of India|SBI/);
  assert.ok(idSet.has('borrower-guide'));
  assert.equal((html.match(/<article class="guide-card glass">/g) || []).length, 3);
  assert.match(body, /Key Facts Statement/);
});

test('every local link targets an existing, unique element', () => {
  assert.equal(idSet.size, ids.length, 'Element IDs must be unique');
  for (const match of html.matchAll(/\bhref="#([^"]+)"/g)) {
    assert.ok(idSet.has(match[1]), `Broken navigation target: #${match[1]}`);
  }
});

test('inline JavaScript parses and does not reference deleted elements', () => {
  assert.ok(scripts.length > 0);
  scripts.forEach((script, index) => {
    new Script(script, { filename: `index.html:inline-script-${index + 1}` });
    for (const match of script.matchAll(/getElementById\('([^']+)'\)/g)) {
      assert.ok(idSet.has(match[1]), `Missing JavaScript element: ${match[1]}`);
    }
  });
});

test('motion is paused offscreen and reduced-motion preference also controls scrolling', () => {
  assert.match(html, /IntersectionObserver/);
  assert.match(html, /animation-play-state:paused !important/);
  assert.match(html, /animation:none !important; transition:none !important; scroll-behavior:auto !important/);
  assert.match(html, /behavior: motionPreference\.matches \? 'auto' : 'smooth'/);
  assert.match(html, /'\.hero-canvas, \.term-dot/);
});

test('consent, privacy and lender-specific loan disclosures are retained', () => {
  assert.ok(idSet.has('consent'));
  assert.ok(idSet.has('personal-consent'));
  assert.ok(idSet.has('privacy'));
  assert.ok(idSet.has('disclaimer'));
  assert.match(html, /not confirmation of a direct partnership or product availability/);
  assert.match(html, /No enquiry details will be sent yet/);
  assert.match(html, /PAN, income and address are sensitive/);
});

test('mobile hero can shrink without clipping and the phone prefix has reserved space', () => {
  assert.match(html, /\.hero-layout > \*\{ min-width:0; \}/);
  assert.match(html, /grid-template-columns:minmax\(0, 1fr\)/);
  assert.match(html, /\.input-shell \.prefix \+ input\{ padding-left:52px; \}/);
});

test("SBI's own web typeface, Open Sans, covers every heading, label, tag and paragraph", () => {
  assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);
  assert.doesNotMatch(html, /Space Grotesk|JetBrains Mono/);
  assert.doesNotMatch(html, /Inter Variable|assets\/fonts\/inter-/);
  assert.match(html, /--font-display:"Open Sans Variable","Open Sans","Effra","Effra Std","Rupee Sign"/);
  assert.match(html, /--font-mono:"Open Sans Variable"/);

  const families = [...html.matchAll(/font-family:([^;]+);/g)].map((match) => match[1].trim());
  assert.ok(families.length > 10, 'Expected the stylesheet to declare its typeface');
  for (const family of families) {
    assert.ok(/^(?:var\(--font-(?:display|mono)\)|"Open Sans Variable"|"Rupee Sign")/.test(family),
      `Unexpected font family: ${family}`);
  }

  assert.match(html, /url\("assets\/fonts\/open-sans-latin-wght-normal\.woff2"\)/);
  assert.match(html, /url\("assets\/fonts\/currency-rupee\.woff2"\)/);
});

test('the wordmark is a larger, spectrum-coloured lock-up', () => {
  assert.match(html, /\.brand-name\{\s*font-family:var\(--font-mono\); font-size:19\.5px; font-weight:700; letter-spacing:\.075em; color:#fff;/);
  assert.match(html, /\.brand-name \.brand-dim\{[\s\S]*?background:linear-gradient\(94deg, #7DF9FF 0%, #00E5FF 20%, #4D7CFF 44%, #8B5CF6 66%, #FF2ED2 86%, #FFB454 100%\)/);
  assert.match(html, /-webkit-background-clip:text; background-clip:text; color:transparent;/);
  assert.match(html, /\.brand-mark\{ width:42px; height:42px;/);
  assert.match(html, /<link rel="icon" href="data:image\/svg\+xml,/);
});

test('the hero shows the glass-prism artwork as a local image', () => {
  assert.match(html, /<img class="hero-scene-img" src="assets\/hero-prism\.webp" alt="" width="2912" height="1440"/);
  assert.match(html, /<div class="hero-scene" id="prism-scene">/);
  assert.match(html, /\.hero-scene\{ position:absolute; inset:0; overflow:hidden; \}/);
  assert.match(html, /\.hero-scene img\{[\s\S]*?object-fit:cover; object-position:62% 50%/);
  assert.match(html, /\.hero-scene::after\{[\s\S]*?linear-gradient\(90deg, rgba\(0,0,0,\.95\) 0%, rgba\(0,0,0,\.86\) 26%/);
  assert.match(html, /animation:prism-spin 48s linear infinite;/);
  assert.match(html, /@keyframes prism-spin\{[\s\S]*?rotate\(360deg\) scale\(1\.5\)/);
  assert.match(html, /-webkit-mask-image:radial-gradient\(118% 118% at 50% 50%, #000 52%, transparent 88%\)/);
  // the page-wide colour wheels and the hero colour discs were explicitly rolled back
  assert.doesNotMatch(html, /hero-spectrum|void-spin|page-spectrum|prism-drift/);
  assert.doesNotMatch(html, /class="scene"|px-spectrum|prism-rig|prism-face|hero-aura/);
});

test('the lending network shows official lender marks in uniform cards, not text initials', () => {
  assert.doesNotMatch(html, /partner-mark|partner-logo--/);
  assert.equal((html.match(/<div class="partner-logo glass">/g) || []).length, 12);
  assert.equal((html.match(/class="partner-logo-plate"/g) || []).length, 12);

  const marks = [...body.matchAll(/<img src="assets\/brands\/([a-z0-9-]+)\.svg" alt="" width="(\d+)" height="(\d+)"/g)];
  assert.equal(marks.length, 12, 'Every card needs an official vector mark');
  for (const [, slug, width, height] of marks) {
    assert.ok(existsSync(new URL(`../assets/brands/${slug}.svg`, import.meta.url)), `Missing lender logo: ${slug}`);
    assert.ok(Number(width) > 0 && Number(height) > 0, `Logo ${slug} needs intrinsic dimensions`);
  }

  for (const name of ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Bank of Maharashtra', 'Bajaj Finserv', 'Tata Capital']) {
    assert.ok(body.includes(name), `Lender card missing: ${name}`);
  }
});

test('self-hosted fonts and lender marks are present on disk', () => {
  // Catches markup attributes, CSS url() references and paths built inside the inline script.
  const refs = new Set([...html.matchAll(/assets\/[\w./-]+\.(?:svg|woff2?|png|jpe?g|webp)/g)].map((match) => match[0]));
  assert.ok(refs.size >= 12, 'Expected self-hosted fonts and lender marks to be referenced');
  for (const ref of refs) {
    assert.ok(existsSync(new URL(`../${ref}`, import.meta.url)), `Missing asset: ${ref}`);
  }
});

test('the lender directory maps real vector marks to the named institutions', () => {
  const map = html.slice(html.indexOf('const lenderMarks = {'), html.indexOf('const makeLenderChips'));
  const entries = [...map.matchAll(/'([^']+)': 'assets\/brands\/marks\/([a-z0-9-]+)-mark\.svg'/g)];
  assert.ok(entries.length >= 47, `Expected at least 47 mapped marks, found ${entries.length}`);

  const groups = html.slice(html.indexOf('const lenderGroups = {'), html.indexOf('const lenderList ='));
  const listed = [...groups.matchAll(/'([^']+)'/g)]
    .map((match) => match[1])
    .filter((value) => !['private', 'public', 'nbfc', 'fintech'].includes(value));
  assert.equal(listed.length, 48, 'The directory lists 48 institutions once SBI is removed');

  const mapped = new Set(entries.map(([, name]) => name));
  assert.ok(mapped.size >= 47 && mapped.size <= listed.length, 'Coverage must stay within the directory');
  for (const name of mapped) assert.ok(listed.includes(name), `${name} is mapped but not listed`);
  for (const name of ['HDFC Bank', 'ICICI Bank', 'Axis Bank', 'Kotak Mahindra Bank', 'Bajaj Finserv', 'Tata Capital', 'Indian Bank', 'Bank of Maharashtra', 'InCred Financial Services', 'Godrej Capital', 'Mahindra Finance', 'ZipLoan', 'PaySense', 'Finnable']) {
    assert.ok(mapped.has(name), `Named lender missing a mark: ${name}`);
  }

  for (const [, , slug] of entries) {
    assert.ok(existsSync(new URL(`../assets/brands/marks/${slug}-mark.svg`, import.meta.url)), `Missing mark: ${slug}`);
  }
});

test('hero mark stack and directory chips use vector marks instead of letter tiles', () => {
  const stack = body.match(/<div class="partner-mini-stack"[\s\S]*?<\/div>/)?.[0];
  assert.ok(stack, 'Hero lender stack must exist');
  assert.equal((stack.match(/<img /g) || []).length, 5);
  assert.equal((stack.match(/<span>[HIA+]<\/span>/g) || []).length, 0);
  assert.match(html, /icon\.className = 'lender-chip-mark'/);
  assert.match(html, /\.lender-chip-mark\{[\s\S]*?min-width:26px; max-width:56px; height:26px/);
  assert.match(html, /\.lender-chip\.has-mark::before\{ display:none; \}/);
  assert.match(html, /lenderMarks/);
  assert.match(html, /Founder <strong>Atharva Yewale<\/strong>/);
});
