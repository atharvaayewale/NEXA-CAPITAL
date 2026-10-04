# Third-party assets

Everything in this folder is bundled with the site so the homepage has no runtime
dependency on a remote CDN.

## `fonts/` — Inter Variable

| File | Contents |
| --- | --- |
| `inter-latin-wght-normal.woff2` | Latin subset, variable weight axis 100–900 |
| `inter-currency.woff2` | Subset of the Latin-extended cut holding the Indian rupee sign (₹) and two other currency marks |

Inter is licensed under the **SIL Open Font License 1.1**
(<https://github.com/rsms/inter>). Files are redistributed from the
`@fontsource-variable/inter` package (based on the official Inter release) for the
`latin` and `latin-ext` unicode ranges, with the currency subset generated locally
using `pyftsubset --unicodes="U+20A8,U+20B0,U+20B9"`.

## `brands/` — lender marks

Vector logos for the institutions displayed in the **Lending Network** section:
`*.svg` are the wide lock-ups used in the lender cards, `marks/*.svg` are the square
monograms used in the hero mark stack and in the lender-directory chips. They are
illustrations of the relevant brand names and are shown for identification only.

### Sources

| Files | Source | Licence |
| --- | --- | --- |
| all except the three below | [Finmarks](https://github.com/Finmarks/Finmarks) | MIT |
| `marks/mpokket-mark.svg` | [LawnchairLauncher/lawnicons](https://github.com/LawnchairLauncher/lawnicons) (`svgs/mpokket.svg`) | Apache-2.0 |
| `marks/dhanlaxmi-bank-mark.svg` | [keyushhh/indian-bank-logos](https://github.com/keyushhh/indian-bank-logos) (`logos/dhanlaxmi.svg`) | no formal licence — repository states "free to use"; treat as identification use |
| `marks/hero-fincorp-mark.svg` | [detain/svg-logos](https://github.com/detain/svg-logos) (`svg/h/hero-fincorp-new-logo.svg`) | no licence declared — treat as identification use |
| `marks/indian-bank-mark.svg`, `marks/bank-of-maharashtra-mark.svg` | [keyushhh/indian-bank-logos](https://github.com/keyushhh/indian-bank-logos) (`logos/indian-bank.svg`, `logos/bom.svg`) | no formal licence — repository states "free to use"; treat as identification use |
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
  (HDFC Bank Ltd, ICICI Bank Ltd, Axis Bank Ltd, Kotak Mahindra Bank Ltd, State Bank of
  India, IDFC FIRST Bank Ltd, IndusInd Bank Ltd, Bank of Baroda, Bajaj Finserv Ltd,
  Tata Capital Ltd, Aditya Birla Capital Ltd, Shriram Finance Ltd).
* Displaying a mark here does **not** imply a partnership, an active channel
  authorisation, a product offer or an endorsement by that institution. Verify display
  permissions before publication — see the disclosure block in the homepage footer and
  the "Partner content and pricing" note in the project README.
