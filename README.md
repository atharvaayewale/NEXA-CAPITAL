# Nexa Capital homepage + lead notifications

`index.html` is a single-file responsive homepage with inline CSS/JavaScript, Google Fonts (Space Grotesk + JetBrains Mono), and inline Lucide-style SVGs. Its visual language follows the vgpu spectrum design: pitch-black (#000000) void background, stark-white (#FFFFFF) text, neon cyan/magenta/violet spectrum accents with rainbow dispersion, glassmorphism panels, animated glowing neon borders, monospace terminal-style code widgets, and a rotating CSS 3D prism hero that refracts a white beam into spectrum light rays (with pointer parallax, disabled under `prefers-reduced-motion`). Its **Lending Network** directory displays all 49 names supplied in the brief by default, grouped into banks, public-sector banks, NBFCs, and fintech lenders.

The Personal Loan path links to a detailed application form: full name, mobile, pincode, monthly take-home salary, loan amount, requested tenure, residential address, and PAN. The quick hero form carries amount/mobile/pincode into the full application when Personal Loan is selected.

`server.mjs` is the backend needed for email and WhatsApp delivery. It validates form fields and consent, applies a basic in-memory rate limit, and forwards applications to the configured recipient via Resend and WhatsApp Business Cloud API. It does not write a lead database or log submitted PII. A static HTML page alone cannot securely send messages; provider credentials stay on the server.

## Configure delivery

1. Use Node.js 20+ and copy `.env.example` to `.env`.2. The recipient defaults are the email and WhatsApp number supplied by the site owner. Change them in `.env` if needed.
3. For email, set a Resend API key and a sender address on a domain verified by Resend.
4. For WhatsApp, set a Meta WhatsApp Business Cloud API access token, phone number ID, currently supported Graph API version, and an approved message template. The template body must contain **11 text placeholders in this order**:
   1. Lead reference
   2. Customer name
   3. Loan type
   4. Requested amount
   5. Preferred tenure
   6. Monthly take-home salary
   7. Customer mobile
   8. Pincode
   9. Residential address
   10. PAN
   11. Received time (India time)
5. Run `npm run dev`. Email and WhatsApp are independent channels: configuring either one is enough for leads to be delivered on that channel, and the UI reports honestly when nothing is configured. There is no false success.

## Deploy to Vercel

The repo is Vercel-ready: `index.html` is served statically, and `api/status.mjs` + `api/leads.mjs` are serverless functions mirroring `server.mjs` (same validation, rate limiting and Resend + WhatsApp delivery contract).

1. Import this repository in the Vercel dashboard (Framework Preset: **Other**, no build command needed), or run `vercel --prod` with a logged-in CLI.
2. In **Project Settings → Environment Variables**, set the same variables used locally: `LEAD_EMAIL_TO`, `RESEND_FROM`, `RESEND_API_KEY`, `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_TO`, `WHATSAPP_TEMPLATE_NAME`, `WHATSAPP_TEMPLATE_LANG`, `META_GRAPH_VERSION`. Redeploy after changing them.
3. **One-off CLI deploy** (no dashboard needed):

   ```bash
   npx vercel@latest deploy --prod --yes --token "$VERCEL_TOKEN" --project nexa-capital
   ```

4. **Continuous deploys** with `.github/workflows/vercel-deploy.yml`: add `VERCEL_TOKEN` under **Settings → Secrets and variables → Actions → New repository secret**. Every push to `main` then deploys to production, and any of the delivery variables above can be added as repository secrets too — the workflow pushes them to the Vercel project before deploying. Trigger manually via **Actions → Deploy to Vercel → Run workflow**. Never commit the token: this repository is public.
5. Email and WhatsApp are independent: set up whichever you want. With only the Resend variables set, email delivery works on its own; WhatsApp is skipped and reported as "not configured" by `/api/status`. Until at least one channel is configured, `/api/leads` safely returns a 503 and the UI reports that delivery is not configured—no false successes.

Note: the serverless rate limit is in-memory and best-effort (function instances are short-lived); add an external store for hard limits before launch. `server.mjs` remains the local development server (`npm run dev`).

## Sensitive information and production readiness

PAN, income, phone number, pincode, and address are personal data. The application currently sends submitted personal-loan fields—including PAN and address—to the configured email and WhatsApp recipients only after the customer checks the explicit consent box. Email inboxes and WhatsApp/provider systems may retain messages. For a real lending operation, use a secure lender/CRM portal for PAN and KYC, minimize data in email/WhatsApp alerts, require HTTPS, publish a clear retention/deletion policy, and complete compliance review before collection. Never place API credentials in `index.html` or share them in chat. Add production-grade bot protection and persistent rate limiting before launch.

## Prototype/partner content

The listed banks/NBFCs, rates, fee claims, processing timelines, and testimonials are concept copy—not proof of current commercial relationships, offers, or performance. Verify all DSA/channel-partner authorisations, the Ruconnect relationship, lender display permission, pricing, customer-review consent, and compliance copy before publication. The supplied City Union Bank link pointed to a Bank of Maharashtra Justdial listing, so City Union Bank is shown by name without that mismatched link.
