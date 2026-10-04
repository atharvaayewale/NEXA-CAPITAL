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

test('the hero cube is replaced by a 3D glass rupee with mobile-safe rendering', () => {
  // The CSS-3D prism/cube is gone from markup, styles and scripts.
  assert.doesNotMatch(html, /prism-scene|prism-rig|prism-face|prism-cap|prism-spin|beam-out|beam-spread/);
  assert.ok(idSet.has('rupee-stage'), 'Glass rupee stage must exist');
  assert.ok(idSet.has('rupee-canvas'), 'WebGL canvas must exist');
  assert.match(html, /<canvas class="rupee-gl" id="rupee-canvas"><\/canvas>/);
  // Dependency-free static mark when WebGL is unavailable.
  // A blank canvas is never the answer: the fallback is an extruded SVG mesh that keeps spinning.
  assert.match(html, /class="rupee-static"[\s\S]*?<svg class="rupee-coin-mark" viewBox="0 0 100 100"/);
  assert.match(html, /rupee-strokes" stroke="url\(#rupee-face-grad\)"/);
  assert.match(html, /is-fallback/);
  // Canvas box cannot collapse, and the mark is above the decorative layers.
  assert.match(html, /\.rupee-gl\{ position:relative; z-index:2; display:block; width:100%; height:100%; min-height:300px; \}/);
  assert.match(html, /camera: \{ position: \{ z: 5 \} \}/);
  assert.match(html, /renderer\.setScale\(Math\.min\(window\.innerWidth \/ 500, 1\.2\)\)/);
  assert.match(html, /gl\.clear\(gl\.COLOR_BUFFER_BIT\)/);
  // Transparent canvas, capped pixel ratio and continuous rAF auto-rotation.
  assert.match(html, /const contextAttributes = \{ alpha: true, antialias: false/);
  assert.match(html, /renderer\.setPixelRatio\(Math\.min\(window\.devicePixelRatio, 2\)\)/);
  assert.match(html, /maxPixelRatio: 2/);
  assert.match(html, /rafId = requestAnimationFrame\(step\)/);
  // The orbit is unconditional: reduced motion slows it, it never freezes it,
  // and the no-WebGL fallback spins in CSS for the same reason.
  assert.match(html, /autoYaw \+= delta \* \(calm \? 0\.2 : 0\.65\);/);
  // Layering and sizing: the mark must paint above the hero copy, sit in the free right
  // column instead of being nudged behind the headline, and keep the real CSS aspect.
  assert.match(html, /\.hero-canvas\{ position:absolute; inset:0; z-index:2; pointer-events:none; \}/);
  assert.match(html, /\.rupee-stage\{ width:min\(72vw, 260px\); opacity:\.72; \}/);
  assert.doesNotMatch(html, /padding:44px -7%|padding:30px -16%/);
  assert.doesNotMatch(html, /translate3d\(-17%, -7%, 0\)/);
  assert.match(html, /const height = Math.max\(140, Math.round\(cssH \* factor\)\);/);
  assert.match(html, /gl\.uniform1f\(pixelLocation, \(2\.56 \/ Math\.max\(renderer\.height, 1\)\) \* 1\.6\);/);
  assert.match(html, /if \(framesDrawn === 2 && !glHealthy\(\)\) stage\.classList\.add\('is-fallback'\);/);
  assert.match(html, /const canRun = \(\) => !document\.hidden && stageVisible;/);
  assert.doesNotMatch(html, /const canRun = \(\) =>[^;]*motionPreference/);
  assert.match(html, /animation:rupee-coin 12s linear infinite;/);
  // Mouse and touch both tilt the mark; vertical page scroll stays intact.
  assert.match(html, /addEventListener\('touchstart'/);
  assert.match(html, /addEventListener\('touchmove'/);
  assert.match(html, /addEventListener\('touchend'/);
  assert.match(html, /addEventListener\('mousemove'/);
  assert.match(html, /\.rupee-stage\{[^}]*touch-action:pan-y/s);
  // Per-device quality budget keeps phones at 60fps.
  // Fewer march steps on phones, but still enough to reach the mark without tunnelling.
  assert.match(html, /steps: coarsePointer \? 40 : 64/);
  assert.match(html, /t \+= clamp\(d \* 0\.9, 0\.0022, 0\.045\);/);
  assert.match(html, /maxSide = coarsePointer \? 620 : 980/);
  assert.match(html, /renderScale: coarsePointer \? 0\.8 : 1/);
  // Palette: electric emerald (#10B981 / #00F5A0) and cyan on dark onyx.
  assert.match(html, /EMERALD = vec3\(0\.063, 0\.725, 0\.506\)/);
  assert.match(html, /MINT = vec3\(0\.0, 0\.961, 0\.627\)/);
  assert.match(html, /CYAN = vec3\(0\.0, 0\.898, 1\.0\)/);
});

test('SBI is removed from the lending network and all remaining lenders have real SVG logos', () => {
  assert.doesNotMatch(html, /State Bank of India|\bSBI\b/i);
  assert.match(html, /48 INSTITUTIONS/);
  assert.match(html, /All institutions <span>48<\/span>/);
  assert.match(html, /--lenders 48 --upfront-fees 0/);
  assert.match(html, /Public sector banks <span>9<\/span>/);
  assert.equal((html.match(/class="partner-mark"[^>]*><svg\b/g) || []).length, 6);
  // Every directory chip renders a brand mark built from the per-institution SVG logo map.
  assert.match(html, /logo\.className = 'lender-chip-logo';/);
  assert.match(html, /logo\.innerHTML = lenderLogos\[name\]/);
  assert.equal((html.match(/'[^']+': '<svg viewBox="0 0 32 32">/g) || []).length, 48);
  assert.equal((html.match(/<span><svg viewBox="0 0 32 32">/g) || []).length, 3);
});

