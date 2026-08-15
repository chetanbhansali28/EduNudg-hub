# Marketing footer

## Requirements

### Shared footer shell

GIVEN a public marketing site (platform, brand, or center)
WHEN the site footer renders
THEN link columns and legal links use the shared `mkt-footer-shell` typography tokens
AND legal link labels are **Privacy Policy**, **Terms & Conditions**, and **Refund Policy**

### Legal policy pages

GIVEN an admin uploads a privacy, terms, or refund document in Homepage Configuration
WHEN they save and a visitor opens `/legal/{kind}`
THEN the published PDF or converted Word HTML is shown
AND the footer includes a link to that route when configured or uploaded

### Brand footer editing

GIVEN a brand admin edits Homepage Configuration
WHEN they update footer Product, Company, or Connect links
THEN the public brand and center footers reflect those links after save

### Center inheritance

GIVEN a center public site
WHEN the footer renders
THEN legal links may still follow brand uploads
AND social icons use that franchise’s `social_links` (not brand `social_connect`)
AND address/phone use Franchise Management Location & Contact via `centerFooterContactFromProfile` on Novu, Abacus Classic, and Spark Academy
AND brand Head office / Our presence / Spark placeholder phone MUST NOT appear

### No WhatsApp float on brand landing

GIVEN a brand public landing page (any marketing theme)
WHEN social_connect includes WhatsApp phone, bubble title/body, or whatsappEnabled
THEN the page MUST NOT render a floating WhatsApp chat button or chat preview bubble
AND Social Media Connect in the homepage editor only configures Facebook and Instagram footer icons
