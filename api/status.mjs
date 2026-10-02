// Vercel serverless handler: GET /api/status
// Reports whether email/WhatsApp delivery credentials are configured.

const EMAIL_TO = process.env.LEAD_EMAIL_TO || 'ATHARVAAYEWALE102@GMAIL.COM';
const EMAIL_FROM = process.env.RESEND_FROM || '';
const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const WA_ACCESS_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN || '';
const WA_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
const WA_TO = (process.env.WHATSAPP_TO || '919325324711').replace(/\D/g, '');
const WA_TEMPLATE_NAME = process.env.WHATSAPP_TEMPLATE_NAME || '';
const META_GRAPH_VERSION = process.env.META_GRAPH_VERSION || '';

const emailConfigured = Boolean(RESEND_API_KEY && EMAIL_FROM && EMAIL_TO);
const whatsappConfigured = Boolean(WA_ACCESS_TOKEN && WA_PHONE_NUMBER_ID && WA_TO && WA_TEMPLATE_NAME && META_GRAPH_VERSION);

export default function handler(request, response) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.setHeader('Allow', 'GET');
    return response.status(405).json({ ok: false, message: 'Method not allowed.' });
  }
  response.setHeader('Cache-Control', 'no-store');
  response.setHeader('X-Content-Type-Options', 'nosniff');
  return response.status(200).json({
    notificationsConfigured: emailConfigured || whatsappConfigured,
    emailConfigured,
    whatsappConfigured
  });
}
