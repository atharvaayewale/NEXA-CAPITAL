// Vercel serverless handler: POST /api/leads
// Validates the application, applies a best-effort in-memory rate limit, and forwards
// the lead to Resend (email) and the WhatsApp Business Cloud API. It does not write
// a lead database or log submitted PII. Serverless instances are short-lived, so the
// rate limit is best-effort; add an external store (e.g. KV/Redis) for hard limits.
import { randomUUID } from 'node:crypto';

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
const notificationsConfigured = emailConfigured && whatsappConfigured;
const allowedLoanTypes = new Set(['Personal Loan', 'Business Loan', 'Overdraft', 'Home Loan']);
const rateLimit = new Map();
const RATE_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT = 8;

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
  const forwarded = String(request.headers['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || 'unknown';
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

export default async function handler(request, response) {
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');

  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ ok: false, message: 'Method not allowed.' });
  }
  if (!isSameOrigin(request)) return response.status(403).json({ ok: false, message: 'Request origin was not accepted.' });
  if (!allowedByRateLimit(request)) return response.status(429).json({ ok: false, message: 'Too many attempts. Please wait a few minutes and try again.' });
  if (!notificationsConfigured) {
    return response.status(503).json({
      ok: false,
      message: 'Email and WhatsApp delivery are not configured yet. Your details were not sent. Please contact the site owner.'
    });
  }
  if (!String(request.headers['content-type'] || '').includes('application/json')) {
    return response.status(415).json({ ok: false, message: 'Unsupported request format.' });
  }

  const body = request.body;
  if (!body || typeof body !== 'object') {
    return response.status(400).json({ ok: false, message: 'Invalid JSON request' });
  }
  const validation = validateLead(body);
  if (validation.spam) return response.status(200).json({ ok: true, ignored: true });
  if (validation.error) return response.status(400).json({ ok: false, message: validation.error });

  const requestId = randomUUID().split('-')[0].toUpperCase();
  const timestamp = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata', dateStyle: 'medium', timeStyle: 'short'
  }).format(new Date());
  const lead = validation.lead;
  const [emailResult, whatsappResult] = await Promise.allSettled([
    sendEmail(lead, requestId, timestamp),
    sendWhatsApp(lead, requestId, timestamp)
  ]);
  const emailSent = emailResult.status === 'fulfilled';
  const whatsappSent = whatsappResult.status === 'fulfilled';

  if (emailSent && whatsappSent) {
    return response.status(200).json({ ok: true, requestId, message: 'Notifications accepted by both delivery providers.' });
  }

  // Do not log the submitted lead or provider payloads. A partial send may already have reached one channel.
  console.error('[lead notification] One or more delivery providers failed.', { emailSent, whatsappSent, requestId });
  if (emailSent || whatsappSent) {
    return response.status(502).json({
      ok: false,
      partial: true,
      requestId,
      message: 'One notification channel may already have received this enquiry. Check both inboxes before retrying to avoid duplicates.'
    });
  }
  return response.status(502).json({ ok: false, message: 'Neither notification provider accepted the enquiry. Your details were not stored; please try again later.' });
}
