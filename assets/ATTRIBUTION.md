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

* Source: **Finmarks** — <https://github.com/Finmarks/Finmarks> (MIT licence).
* All logos, brand names and trademarks remain the property of their respective owners
  (HDFC Bank Ltd, ICICI Bank Ltd, Axis Bank Ltd, Kotak Mahindra Bank Ltd, State Bank of
  India, IDFC FIRST Bank Ltd, IndusInd Bank Ltd, Bank of Baroda, Bajaj Finserv Ltd,
  Tata Capital Ltd, Aditya Birla Capital Ltd, Shriram Finance Ltd).
* Displaying a mark here does **not** imply a partnership, an active channel
  authorisation, a product offer or an endorsement by that institution. Verify display
  permissions before publication — see the disclosure block in the homepage footer and
  the "Partner content and pricing" note in the project README.
