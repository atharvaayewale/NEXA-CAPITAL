import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

const ROOT = path.dirname(fileURLToPath(import.meta.url));

function loadLocalEnv() {
  const filename = path.join(ROOT, '.env');
  if (!fs.existsSync(filename)) return;
  const lines = fs.readFileSync(filename, 'utf8').split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const match = trimmed.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1]] = value;
  }
}

loadLocalEnv();

const PORT = Number(process.env.PORT || 3000);
const EMAIL_TO = process.env.LEAD_EMAIL_TO || 'ATHARVAAYEWALE102@GMAIL.COM';
const EMAIL_FROM = process.env.RESEND_FROM || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WA_TO = (process.env.WHATSAPP_TO || '919325324711').replace(/\D/g, '');
const WA_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || '';
const WA_TEMPLATE_LANG = process.env.WHATSAPP_TEMPLATE_LANG || 'en';
const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || '';

const emailConfigured = Boolean(RESEND_API_KEY && EMAIL_FROM && EMAIL_TO);
const whatsappConfigured = Boolean(WA_ACCESS_TOKEN && WA_PHONE_NUMBER_ID && WA_TO && WA_TEMPLATE_NAME && META_GRAPH_VERSION);
// Email and WhatsApp are independent channels: whichever one is configured is used.
const notificationsConfigured = emailConfigured || whatsappConfigured;
const allowedLoanTypes = new Set(['Personal Loan', 'Business Loan', 'Overdraft', 'Home Loan']);
const rateLimit = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 8;

function json(response, status, payload) {
  const body = JSON.stringify(payload);
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer'
  });
  response.end(body);
}

function html(response, status, body) {
  response.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-cache',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  response.end(body);
}

// Static homepage assets (self-hosted Inter fonts and official lender marks).
const ASSET_TYPES = new Map([
  ['.svg', 'image/svg+xml'],
  ['.woff2', 'font/woff2'],
  ['.woff', 'font/woff'],
  ['.png', 'image/png'],
  ['.jpg', 'image/jpeg'],
  ['.jpeg', 'image/jpeg'],
  ['.webp', 'image/webp'],
  ['.ico', 'image/x-icon'],
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.txt', 'text/plain; charset=utf-8']
]);

function serveAsset(request, response, pathname) {
  const root = path.join(ROOT, 'assets');
  let relative;
  try {
    relative = decodeURIComponent(pathname.slice('/assets/'.length));
  } catch {
    return json(response, 404, { ok: false, message: 'Not found.' });
  }
  const target = path.resolve(root, relative);
  const type = ASSET_TYPES.get(path.extname(target).toLowerCase());
  // Anything outside assets/, or with an unrecognised extension, stays unserved.
  if (!type || (target !== root && !target.startsWith(root + path.sep))) {
    return json(response, 404, { ok: false, message: 'Not found.' });
  }
  let body;
  try {
    body = fs.readFileSync(target);
  } catch {
    return json(response, 404, { ok: false, message: 'Not found.' });
  }
  response.writeHead(200, {
    'Content-Type': type,
    'Content-Length': body.length,
    'Cache-Control': 'public, max-age=86400',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  });
  return response.end(request.method === 'HEAD' ? undefined : body);
}

function isSameOrigin(request) {
  const origin = request.headers.origin;
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.host;
  } catch {
    return false;
  }
}

function clientKey(request) {
  return request.socket.remoteAddress || 'unknown';
}

function allowedByRateLimit(request) {
  const now = Date.now();
  const key = clientKey(request);
  const recent = (rateLimit.get(key) || []).filter((time) => now - time < RATE_WINDOW_MS);
  if (recent.length >= RATE_LIMIT) {
    rateLimit.set(key, recent);
    return false;
  }
  recent.push(now);
  rateLimit.set(key, recent);
  if (rateLimit.size > 2000) {
    for (const [storedKey, timestamps] of rateLimit) {
      if (!timestamps.some((time) => now - time < RATE_WINDOW_MS)) rateLimit.delete(storedKey);
    }
  }
  return true;
}

async function readJson(request, maxBytes = 8_000) {
  let size = 0;
  const chunks = [];
  for await (const chunk of request) {
    size += chunk.length;
    if (size > maxBytes) {
      const error = new Error('Request too large');
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    const error = new Error('Invalid JSON request');
    error.statusCode = 400;
    throw error;
  }
}

function formatINR(value) {
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

function cleanText(value, maxLength = 80) {
  return String(value ?? '').trim().replace(/[\u0000-\u001f\u007f]/g, '').slice(0, maxLength);
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
}

function validateLead(body) {
  const loanType = cleanText(body.loanType, 40);
  const applicationType = cleanText(body.applicationType, 40);
  const mobile = String(body.mobile ?? '').replace(/\D/g, '');
  const pincode = String(body.pincode ?? '').replace(/\D/g, '');
  const amount = Number(body.amount);
  const consent = body.consent === true;
  if (body.website) return { spam: true };
  if (!allowedLoanTypes.has(loanType)) return { error: 'Please choose a valid loan type.' };
  if (!Number.isInteger(amount) || amount < 100000 || amount > 10000000) return { error: 'Please choose a valid loan amount.' };
  if (!/^[6-9]\d{9}$/.test(mobile)) return { error: 'Enter a valid 10-digit Indian mobile number.' };
  if (!/^\d{6}$/.test(pincode)) return { error: 'Enter a valid 6-digit pincode.' };
  if (!consent) return { error: 'Consent is required before sending an enquiry.' };

  const lead = { applicationType: applicationType || 'quick', loanType, mobile, pincode, amount };
  if (applicationType === 'personal-loan') {
    const fullName = cleanText(body.fullName, 100);
    const monthlySalary = Number(body.monthlySalary);
    const tenureMonths = Number(body.tenureMonths);
    const address = cleanText(body.address, 300);
    const pan = String(body.pan ?? '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    const validTenures = new Set([12, 24, 36, 48, 60, 72, 84]);
    if (loanType !== 'Personal Loan') return { error: 'Personal application type does not match the selected product.' };
    if (fullName.length < 2) return { error: 'Enter your full name.' };
    if (!Number.isInteger(monthlySalary) || monthlySalary < 5000 || monthlySalary > 5000000) return { error: 'Enter a valid monthly take-home salary.' };
    if (!validTenures.has(tenureMonths)) return { error: 'Choose a valid loan tenure.' };
    if (address.length < 10) return { error: 'Enter your full residential address.' };
    if (!/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) return { error: 'Enter a valid 10-character PAN.' };
    Object.assign(lead, { fullName, monthlySalary, tenureMonths, address, pan });
  }
  return { lead };
}

async function sendEmail(lead, requestId, timestamp) {
  const subject = `New Nexa lead · ${lead.loanType} · ${formatINR(lead.amount)}`;
  const details = [
    ['Reference', requestId],
    ['Customer name', lead.fullName || 'Not provided'],
    ['Loan type', lead.loanType],
    ['Requested amount', formatINR(lead.amount)],
    ['Preferred tenure', lead.tenureMonths ? `${lead.tenureMonths} months` : 'Not provided'],
    ['Monthly take-home salary', lead.monthlySalary ? formatINR(lead.monthlySalary) : 'Not provided'],
    ['Mobile', `+91 ${lead.mobile}`],
    ['Pincode', lead.pincode],
    ['Residential address', lead.address || 'Not provided'],
    ['PAN', lead.pan || 'Not provided'],
    ['Consent recorded', 'Yes'],
    ['Received', timestamp]
  ];
  const text = [
    'New customer enquiry for Nexa Capital',
    ...details.map(([label, value]) => `${label}: ${value}`),
    '',
    'Customer data is sensitive. Use only for the consented purpose and handle securely.'
  ].join('\n');
  const htmlRows = details.map(([label, value]) => `<tr><th style="padding:7px 10px;text-align:left;color:#667085">${escapeHtml(label)}</th><td style="padding:7px 10px;color:#101828">${escapeHtml(value)}</td></tr>`).join('');
  const htmlBody = `<h2>New Nexa Capital enquiry</h2><table style="border-collapse:collapse;width:100%">${htmlRows}</table><p style="margin-top:16px;color:#667085">Customer data is sensitive. Use only for the consented purpose and handle securely.</p>`;
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
      'Idempotency-Key': `nexa-lead-${requestId}`
    },
    body: JSON.stringify({ from: EMAIL_FROM, to: [EMAIL_TO], subject, text, html: htmlBody })
  });
  if (!response.ok) throw new Error('Email provider did not accept the notification');
}

async function sendWhatsApp(lead, requestId, timestamp) {
  const parameters = [
    requestId,
    lead.fullName || 'Not provided',
    lead.loanType,
    formatINR(lead.amount),
    lead.tenureMonths ? `${lead.tenureMonths} months` : 'Not provided',
    lead.monthlySalary ? formatINR(lead.monthlySalary) : 'Not provided',
    `+91 ${lead.mobile}`,
    lead.pincode,
    lead.address || 'Not provided',
    lead.pan || 'Not provided',
    timestamp
  ].map((text) => ({ type: 'text', text }));
  const response = await fetch(`https://graph.facebook.com/${encodeURIComponent(META_GRAPH_VERSION)}/${encodeURIComponent(WA_PHONE_NUMBER_ID)}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${WA_ACCESS_TOKEN}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: WA_TO,
      type: 'template',
      template: {
        name: WA_TEMPLATE_NAME,
        language: { code: WA_TEMPLATE_LANG },
        components: [{ type: 'body', parameters }]
      }
    })
  });
  if (!response.ok) throw new Error('WhatsApp provider did not accept the notification');
}

async function handleLead(request, response) {
  if (process.env.NODE_ENV === 'production') {
    const forwardedProto = String(request.headers['x-forwarded-proto'] || '').split(',')[0].trim().toLowerCase();
    if (!request.socket.encrypted && forwardedProto !== 'https') {
      request.resume();
      return json(response, 400, { ok: false, message: 'Secure HTTPS is required before submitting personal information.' });
    }
  }
  if (!isSameOrigin(request)) return json(response, 403, { ok: false, message: 'Request origin was not accepted.' });
  if (!allowedByRateLimit(request)) return json(response, 429, { ok: false, message: 'Too many attempts. Please wait a few minutes and try again.' });
  if (!notificationsConfigured) {
    request.resume();
    return json(response, 503, {
      ok: false,
      message: 'Email/WhatsApp delivery is not configured yet. Your details were not sent. Please contact the site owner.'
    });
  }
  if (!String(request.headers['content-type'] || '').includes('application/json')) {
    request.resume();
    return json(response, 415, { ok: false, message: 'Unsupported request format.' });
  }

  let body;
  try {
    body = await readJson(request);
  } catch (error) {
    return json(response, error.statusCode || 400, { ok: false, message: error.message });
  }
  const validation = validateLead(body);
  if (validation.spam) return json(response, 200, { ok: true, ignored: true });
  if (validation.error) return json(response, 400, { ok: false, message: validation.error });

  const requestId = randomUUID().split('-')[0].toUpperCase();
  const timestamp = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date());
  const lead = validation.lead;
  // Only the channels that are actually configured are attempted, so email works on its own.
  const channels = [];
  if (emailConfigured) channels.push({ name: 'email', send: sendEmail });
  if (whatsappConfigured) channels.push({ name: 'whatsapp', send: sendWhatsApp });
  const results = await Promise.allSettled(channels.map((channel) => channel.send(lead, requestId, timestamp)));
  const delivered = channels.filter((_, index) => results[index].status === 'fulfilled').map((channel) => channel.name);
  const failed = channels.filter((_, index) => results[index].status === 'rejected').map((channel) => channel.name);
  const label = (names) => names.map((name) => (name === 'whatsapp' ? 'WhatsApp' : 'email')).join(' and ');

  if (!failed.length) {
    return json(response, 200, {
      ok: true,
      requestId,
      channels: delivered,
      message: `Notification accepted by ${label(delivered)}.`
    });
  }

  // Do not log the submitted lead or provider payloads. A partial send may already have reached one channel.
  console.error('[lead notification] One or more delivery providers failed.', { delivered, failed, requestId });
  if (delivered.length) {
    return json(response, 502, {
      ok: false,
      partial: true,
      requestId,
      channels: delivered,
      failedChannels: failed,
      message: `Sent by ${label(delivered)}, but ${label(failed)} delivery failed. Check before retrying to avoid duplicates.`
    });
  }
  return json(response, 502, { ok: false, message: 'The notification provider did not accept the enquiry. Your details were not stored; please try again later.' });
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || '/', `http://${request.headers.host || 'localhost'}`);
  if (request.method === 'GET' && url.pathname === '/api/status') {
    return json(response, 200, { notificationsConfigured, emailConfigured, whatsappConfigured });
  }
  if (request.method === 'POST' && url.pathname === '/api/leads') {
    try {
      return await handleLead(request, response);
    } catch (error) {
      console.error('[lead notification] Unexpected delivery error.');
      return json(response, 500, { ok: false, message: 'A server error prevented delivery. Your details were not stored.' });
    }
  }
  if ((request.method === 'GET' || request.method === 'HEAD') && url.pathname.startsWith('/assets/')) {
    return serveAsset(request, response, url.pathname);
  }
  if ((request.method === 'GET' || request.method === 'HEAD') && (url.pathname === '/' || url.pathname === '/index.html')) {
    try {
      const page = fs.readFileSync(path.join(ROOT, 'index.html'));
      response.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Length': page.length,
        'Cache-Control': 'no-cache',
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });
      return response.end(request.method === 'HEAD' ? undefined : page);
    } catch {
      return html(response, 500, '<h1>Homepage file is unavailable.</h1>');
    }
  }
  return json(response, 404, { ok: false, message: 'Not found.' });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Nexa Capital server listening on port ${PORT}`);
  console.log(`Lead notifications: email ${emailConfigured ? 'configured' : 'not configured'}, WhatsApp ${whatsappConfigured ? 'configured' : 'not configured'}`);
});
