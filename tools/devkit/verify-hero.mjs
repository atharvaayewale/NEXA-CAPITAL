// Verifies the hero artwork's motion: a strict horizontal flip only - no rotation,
// no vertical mirroring - plus a screenshot of each extreme.
import puppeteer from 'puppeteer-core';
const b = await puppeteer.launch({ executablePath: '/tmp/chromium', headless: true,
  args: ['--no-sandbox','--disable-setuid-sandbox','--disable-dev-shm-usage','--disable-gpu','--hide-scrollbars'],
  env: { ...process.env, LD_LIBRARY_PATH: '/tmp/fake' } });
const errs = [];
const p = await b.newPage();
p.on('pageerror', e => errs.push(e.message));
p.on('response', r => { if (r.status() >= 400) errs.push(r.status() + ' ' + r.url()); });
await p.setViewport({ width: 1440, height: 900 });
await p.goto('http://127.0.0.1:3100/', { waitUntil: 'networkidle0', timeout: 45000 });
await new Promise(r => setTimeout(r, 900));

const probe = async (frac) => p.evaluate(async (f) => {
  const img = document.querySelector('.hero-scene-img');
  const anim = img.getAnimations()[0];
  anim.pause(); anim.currentTime = f * 40000;
  await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  const m = new DOMMatrixReadOnly(getComputedStyle(img).transform);
  return { scaleX: +m.a.toFixed(3), skew: +m.b.toFixed(3), rotY: +m.c.toFixed(3), scaleY: +m.d.toFixed(3) };
}, frac);

const start = await probe(0);
const mid = await probe(0.25);
const end = await probe(0.5);
// screenshot the two extremes
for (const [frac, name] of [[0, 'flip-a'], [0.5, 'flip-b']]) {
  await p.evaluate(async (f) => {
    const anim = document.querySelector('.hero-scene-img').getAnimations()[0];
    anim.pause(); anim.currentTime = f * 40000;
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
  }, frac);
  await p.screenshot({ path: `/tmp/shot/${name}.png`, captureBeyondViewport: false });
}
const cs = await p.evaluate(() => {
  const img = document.querySelector('.hero-scene-img');
  return { src: img.getAttribute('src'), anim: getComputedStyle(img).animationName + ' ' + getComputedStyle(img).animationDuration };
});
console.log(JSON.stringify({ cs, start, mid, end,
  verdict: { noRotation: start.skew === 0 && start.rotY === 0 && end.skew === 0 && end.rotY === 0,
             noVerticalFlip: start.scaleY > 0 && mid.scaleY > 0 && end.scaleY > 0,
             mirrored: start.scaleX > 0 && end.scaleX < 0 } }), '| problems:', errs.length ? errs.slice(0, 3) : 'none');
await b.close();
