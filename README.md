# Nexa Capital homepage + lead notifications

`index.html` is a single-file responsive homepage with inline CSS/JavaScript, inline Lucide-style SVGs, and one self-hosted typeface — **Inter Variable** (regular and rupee-sign subsets live in `assets/fonts/`) — used for every heading, subheading, form label, lender tag and body line. Nothing is fetched from a font CDN. It retains the pitch-black, white and neon cyan/magenta/violet spectrum theme, glass-style panels, spectrum borders and rotating CSS 3D prism. Decorative animations pause when offscreen or in a background tab; pointer parallax is frame-batched and disabled for reduced-motion/coarse-pointer users. Mobile cards avoid overlapping backdrop filters. The **Lending Network** opens with twelve official vector lender marks (`assets/brands/*.svg`) inside uniform glassmorphic cards, followed by a 49-institution directory grouped into banks, public-sector banks, NBFCs and fintech lenders.

The Personal Loan path links to a detailed application form: full name, mobile, pincode, monthly take-home salary, loan amount, requested tenure, residential address, and PAN. The quick hero form carries amount/mobile/pincode into the full application when Personal Loan is selected.

`server.mjs` is the backend needed for email and WhatsApp delivery. It validates form fields and consent, applies a basic in-memory rate limit, and forwards applications to the configured recipient via Resend and WhatsApp Business Cloud API. It does not write a lead database or log submitted PII. A static HTML page alone cannot securely send messages; provider credentials stay on the server. The same process also serves the local `assets/` folder (`/assets/fonts/*` as `font/woff2`, `/assets/brands/*` as `image/svg+xml`) so the homepage preview matches production; nothing outside `assets/` is exposed. On Vercel those files are served by the static deployment.

## Homepage updates and checks

- The indicative starting rate is **9.99% p.a.** in the hero and disclosures. The EMI calculator starts at the same **9.99%**, with a 0.01-percentage-point slider step so browsers do not round the initial rate to a different value.
- Dummy application tracking, demo/preview badges, fictional borrower names, sample testimonials, mock ratings and placeholder social links have been removed. A practical borrowing guide replaces the sample customer stories.
- Consent, sensitive-data warnings, lender-specific pricing/approval disclosures and honest notification-configuration messages remain in place.
- Vertical rhythm is deliberately tight: hero, lending network, personal-loan form, calculator, process, guide, CTA and footer padding were reduced so no empty scrolling gaps remain between sections. Adjust the `padding` values on `.hero`, `.network-section`, `.section`, `.calculator-section`, `.final-cta-section` and `.site-footer` if the spacing needs to breathe again.
- One typeface rules the product: `--font-display` and `--font-mono` both resolve to the self-hosted **Inter Variable**, so no element can fall back to a second family. Inter lacks the rupee glyph in its Latin subset, so `assets/fonts/inter-currency.woff2` (a `pyftsubset` extract of the Latin-extended cut, `U+20A8,U+20B0,U+20B9`) covers ₹ in amounts and hints.
- Lender-logo assets are third-party material — see `assets/ATTRIBUTION.md` for provenance (Finmarks MIT, plus two identification-use files) and the trademark/display-permission caveat.
- The lender directory maps a real vector mark to 40 of the 49 institutions (`lenderMarks` in the inline script); the remaining nine keep the neutral name chip. Add a mark by dropping `<slug>-mark.svg` into `assets/brands/marks/` and adding one line to that map.
- Run `npm test` for the rate, navigation, deleted-element, inline-JavaScript, single-typeface, asset-existence and disclosure regression checks. Run `npm run dev` for a local preview on port 3000.

## Configure delivery

1. Use Node.js 20+ and copy `.env.example` to `.env`.
2. The recipient defaults are the email and WhatsApp number supplied by the site owner. Change them in `.env` if needed.
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
3. Email and WhatsApp are independent: set up whichever you want. With only the Resend variables set, email delivery works on its own; WhatsApp is skipped and reported as "not configured" by `/api/status`. Until at least one channel is configured, `/api/leads` safely returns a 503 and the UI reports that delivery is not configured—no false successes.

Note: the serverless rate limit is in-memory and best-effort (function instances are short-lived); add an external store for hard limits before launch. `server.mjs` remains the local development server (`npm run dev`).

## Sensitive information and production readiness

PAN, income, phone number, pincode, and address are personal data. The application currently sends submitted personal-loan fields—including PAN and address—to the configured email and WhatsApp recipients only after the customer checks the explicit consent box. Email inboxes and WhatsApp/provider systems may retain messages. For a real lending operation, use a secure lender/CRM portal for PAN and KYC, minimize data in email/WhatsApp alerts, require HTTPS, publish a clear retention/deletion policy, and complete compliance review before collection. Never place API credentials in `index.html` or share them in chat. Add production-grade bot protection and persistent rate limiting before launch.

## Partner content and pricing

Lender names, the indicative 9.99% starting rate, fee claims and processing timelines are not proof of current commercial relationships, personalised offers or performance. Verify all DSA/channel-partner authorisations, the Ruconnect relationship, lender display permission, pricing and compliance copy before publication. No fictional customer reviews or ratings are displayed. The supplied City Union Bank link pointed to a Bank of Maharashtra Justdial listing, so City Union Bank is shown by name without that mismatched link.
