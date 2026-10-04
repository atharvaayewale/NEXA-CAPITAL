# Nexa Capital homepage + lead notifications

`index.html` is a single-file responsive homepage with inline CSS/JavaScript, inline Lucide-style SVGs, and one self-hosted typeface — **Open Sans Variable**, the web typeface SBI itself serves on `sbi.bank.in` (Latin and rupee-sign subsets live in `assets/fonts/`) — used for every heading, subheading, form label, lender tag and body line. Nothing is fetched from a font CDN. It retains the pitch-black, white and neon cyan/magenta/violet spectrum theme, glass-style panels, spectrum borders and rotating CSS 3D prism. Decorative animations pause when offscreen or in a background tab; pointer parallax is frame-batched and disabled for reduced-motion/coarse-pointer users. Mobile cards avoid overlapping backdrop filters. The **Lending Network** opens with twelve official vector lender marks (`assets/brands/*.svg`) inside uniform glassmorphic cards, followed by a 48-institution directory grouped into banks, public-sector banks, NBFCs and fintech lenders.

The Personal Loan path links to a detailed application form: full name, mobile, pincode, monthly take-home salary, loan amount, requested tenure, residential address, and PAN. The quick hero form carries amount/mobile/pincode into the full application when Personal Loan is selected.

`server.mjs` is the backend needed for email and WhatsApp delivery. It validates form fields and consent, applies a basic in-memory rate limit, and forwards applications to the configured recipient via Resend and WhatsApp Business Cloud API. It does not write a lead database or log submitted PII. A static HTML page alone cannot securely send messages; provider credentials stay on the server. The same process also serves the local `assets/` folder (`/assets/fonts/*` as `font/woff2`, `/assets/brands/*` as `image/svg+xml`) so the homepage preview matches production; nothing outside `assets/` is exposed. On Vercel those files are served by the static deployment.

## Homepage updates and checks

- The indicative starting rate is **9.99% p.a.** in the hero and disclosures. The EMI calculator starts at the same **9.99%**, with a 0.01-percentage-point slider step so browsers do not round the initial rate to a different value.
- Dummy application tracking, demo/preview badges, fictional borrower names, sample testimonials, mock ratings and placeholder social links have been removed. A practical borrowing guide replaces the sample customer stories.
- Consent, sensitive-data warnings, lender-specific pricing/approval disclosures and honest notification-configuration messages remain in place.
- Vertical rhythm is deliberately tight: hero, lending network, personal-loan form, calculator, process, guide, CTA and footer padding were reduced so no empty scrolling gaps remain between sections. Adjust the `padding` values on `.hero`, `.network-section`, `.section`, `.calculator-section`, `.final-cta-section` and `.site-footer` if the spacing needs to breathe again.
- One typeface rules the product: `--font-display` and `--font-mono` both resolve to the self-hosted **Open Sans Variable** — the typeface State Bank of India serves on its own website (`/o/SBI-Theme/css/fonts/OpenSans.woff2` on `sbi.bank.in`) — so no element can fall back to a second family. SBI's corporate identity face **Effra** (Dalton Maag) is named later in the same stack so licensed machines pick it up, but it is a commercial font and is deliberately not bundled. Open Sans carries no ₹ glyph, so `assets/fonts/currency-rupee.woff2` (a 1.3 KB `subset-font` extract of Noto Sans, its sibling design, `U+20A8,U+20B0,U+20B9`) covers ₹ in amounts and hints.
- The hero shows the **glass-prism light artwork** (`assets/hero-prism-mono-v2.webp`, 95 KB, 2912×1440, local file served by `server.mjs`) behind the tag line and the lead card: a glass triangle standing on a reflective water surface with a white beam striking it. It is deliberately colour-free — the prism is the only subject.
- The artwork turns by itself: `.hero-scene img` runs a slow full revolution *right to left* (`prism-spin`, -360deg over 48s, scaled 1.5× and radially masked) so the prism and its beams sweep round anticlockwise. Transform-only, so it stays on the compositor.
- On top of it a **live spectrum** (`.hero-scene::before`) is a huge blurred conic-gradient disc, `mix-blend-mode:screen`, turning once every 34s while its opacity swells on an 11s ease, so colours keep arriving and leaving around the glass. The image itself only drifts (`prism-drift`, 46s alternate). Both are transform/opacity only, they are in the IntersectionObserver pause list and the reduced-motion block switches them off. The artwork carries no text, logo or third-party branding. `.hero-scene::after` feathers it with a left-to-right wash under the text column, a vignette and top/bottom fades; tune `object-position` and the wash percentages in that rule to reframe it. The earlier rotating conic-gradient aura and the inline-SVG prism recreation were both replaced by this image.
- The header and footer lock-up now read **NEXA_CAPITAL** in a spectrum gradient (cyan → blue → violet → magenta) at 17.5 px with a soft cyan glow; the footer contact block credits **“Founder Atharva Yewale”**.
- The footer's contact block carries the founder credit **“Founded by Atharva Yewale”** above the contact lines.
- Every lender mark in `assets/brands/marks/` was re-framed to its true ink bounds, so square 64×64 viewBoxes no longer shrink a wide wordmark into a dot inside the directory chips and the hero stack.
- Marks render bigger everywhere: directory chips carry a 26 px fluid plate (wide wordmarks stretch to 56 px, compact monograms stay square), lender cards show up to 40 px lock-ups in a 58 px plate, and the hero stack shows 23 px marks on 36 px tiles.
- The aura plume is multi-hue now — electric emerald into mint, cyan, blue, violet and magenta — while staying anchored on `#10B981`.
- **Ultra-wide fidelity:** the layout scales through 4K (`1500px`), 8K-class (`2100px`) and true-8K (`3000px`) tiers. The stage widens to 2500 px, lender marks grow to 50 px chips / 54 px cards, and the display type grows with it (hero `h1` 66 px at 1440, 106 px on a 3840 px canvas). Everything is vector + self-hosted webfonts, so nothing turns blurry at any density.
- `tools/build-standalone.mjs` writes **`nexa-capital-standalone.html`** — the whole page with all 61 assets inlined as data URIs (611 KB). Use it when the file is opened from disk or sent as an attachment: `index.html` on its own cannot load `assets/`, which is why a downloaded copy showed system fonts and missing logos.
- **State Bank of India has been removed** from the hero mark stack, the lender card wall, the directory and the mark map; `assets/brands/state-bank-of-india.svg` and `assets/brands/marks/state-bank-of-india-mark.svg` were deleted with it, and Bank of Maharashtra took the empty card slot while Punjab National Bank joined the hero stack.
- Lender-logo assets are third-party material — see `assets/ATTRIBUTION.md` for provenance (Finmarks MIT, plus two identification-use files) and the trademark/display-permission caveat.
- The lender directory maps a real vector mark to 47 of the 48 institutions (`lenderMarks` in the inline script). ZipLoan, PaySense and Finnable had no vector artwork anywhere online, so their marks were redrawn as vectors locally from the brands' published logos and saved as `assets/brands/marks/*-mark.svg`; only Manappuram Finance still shows the neutral name chip. Add a mark by dropping `<slug>-mark.svg` into `assets/brands/marks/` and adding one line to that map.
- Run `npm test` for the rate, navigation, deleted-element, inline-JavaScript, single-typeface, asset-existence and disclosure regression checks. Rebuild `nexa-capital-standalone.html` with `node tools/build-standalone.mjs` whenever fonts or marks change. Run `npm run dev` for a local preview on port 3000.

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
