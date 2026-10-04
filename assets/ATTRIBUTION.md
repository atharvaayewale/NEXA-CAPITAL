# Third-party assets

Everything in this folder is bundled with the site so the homepage has no runtime
dependency on a remote CDN. Typography follows the typeface SBI uses on its own website
(see below): Open Sans Variable, self-hosted, with Effra named but not bundled.

## `fonts/` — Open Sans Variable (SBI's web typeface)

| File | Contents |
| --- | --- |
| `open-sans-latin-wght-normal.woff2` | Latin subset, variable weight axis 300–800 |
| `currency-rupee.woff2` | Noto Sans cut holding only the Indian rupee sign (₹) and two other currency marks, because Open Sans ships no ₹ glyph |

**Open Sans** is the typeface State Bank of India serves on its own website
(`sbi.bank.in/o/SBI-Theme/css/fonts/OpenSans.woff2`); the 2017 corporate identity wordmark
itself is set in **Effra** (Dalton Maag). Open Sans is licensed under the **SIL Open Font
License 1.1** (<https://github.com/googlefonts/opensans>) and is redistributed from the
`@fontsource-variable/open-sans` package. The rupee subset is a `subset-font` extract of
`noto-sans-latin-ext-wght-normal.woff2` (**Noto Sans**, also **SIL OFL 1.1**, the sibling
design of Open Sans). Effra is a commercial typeface: it is listed in the CSS stack so a
machine that already has it licensed renders it, but the font files are intentionally
**not** bundled and must not be redistributed.

## `brands/` — lender marks

Vector logos for the institutions displayed in the **Lending Network** section:
`*.svg` are the wide lock-ups used in the lender cards, `marks/*.svg` are the square
monograms used in the hero mark stack and in the lender-directory chips. They are
illustrations of the relevant brand names and are shown for identification only.

`hero-prism.webp` is the hero light artwork: an AI-generated render
(glossy glass prism, cyan and white beams, rainbow spectrum on pure black) with no
text, logo or third-party branding in it. It exists so the hero scene ships as one
local, credential-free file; swap it for a licensed render before launch if a
photographer's asset is preferred.

### Sources

| Files | Source | Licence |
| --- | --- | --- |
| all except the three below | [Finmarks](https://github.com/Finmarks/Finmarks) | MIT |
| `marks/mpokket-mark.svg` | [LawnchairLauncher/lawnicons](https://github.com/LawnchairLauncher/lawnicons) (`svgs/mpokket.svg`) | Apache-2.0 |
| `marks/dhanlaxmi-bank-mark.svg` | [keyushhh/indian-bank-logos](https://github.com/keyushhh/indian-bank-logos) (`logos/dhanlaxmi.svg`) | no formal licence — repository states "free to use"; treat as identification use |
| `marks/hero-fincorp-mark.svg` | [detain/svg-logos](https://github.com/detain/svg-logos) (`svg/h/hero-fincorp-new-logo.svg`) | no licence declared — treat as identification use |
| `marks/indian-bank-mark.svg`, `marks/bank-of-maharashtra-mark.svg` (the same lock-up is used as the card logo `brands/bank-of-maharashtra.svg`) | [keyushhh/indian-bank-logos](https://github.com/keyushhh/indian-bank-logos) (`logos/indian-bank.svg`, `logos/bom.svg`) | no formal licence — repository states "free to use"; treat as identification use |
| `marks/incred-financial-services-mark.svg` | third-party lender-logo collection (`public/lender-logos/incred.svg`) | no licence declared — treat as identification use |
| `marks/godrej-capital-mark.svg` | Godrej group script mark from a public Inkscape-exported SVG | no licence declared — treat as identification use |
| `marks/mahindra-finance-mark.svg` | "Mahindra FINANCE" lock-up from a public site-asset repository | no licence declared — treat as identification use |

| `marks/ziploan-mark.svg`, `marks/paysense-mark.svg`, `marks/finnable-mark.svg` | Re-drawn locally as vectors from the brands' published logos (ZipLoan header lock-up, PaySense navy lock-up, Finnable white wordmark) because no vector source exists online | derived artwork — identification use only, replace from the brand's media kit before a commercial launch |

The wide lock-ups in `marks/` were minified with SVGO (no geometry changes) for weight.
Note that `marks/godrej-capital-mark.svg` is the Godrej group script, not a
Godrej Capital-specific lock-up; swap it from the brand's media kit before launch.

The last two are included only so the directory shows a real mark rather than a blank
slot. Swap them for files from the brand's official media kit (or drop the mark) before
a commercial launch.
* All logos, brand names and trademarks remain the property of their respective owners
  (HDFC Bank Ltd, ICICI Bank Ltd, Axis Bank Ltd, Kotak Mahindra Bank Ltd, IDFC FIRST Bank
  Ltd, IndusInd Bank Ltd, Bank of Baroda, Bank of Maharashtra, Punjab National Bank,
  Bajaj Finserv Ltd, Tata Capital Ltd, Aditya Birla Capital Ltd, Shriram Finance Ltd).
* State Bank of India artwork was removed on request; no SBI mark remains in the bundle.
* Displaying a mark here does **not** imply a partnership, an active channel
  authorisation, a product offer or an endorsement by that institution. Verify display
  permissions before publication — see the disclosure block in the homepage footer and
  the "Partner content and pricing" note in the project README.
