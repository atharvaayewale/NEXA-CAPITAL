import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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
  assert.doesNotMatch(html, /ring-spin|--ring-angle|blur\(95px\)/);
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
