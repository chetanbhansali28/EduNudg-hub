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
WHEN the brand has legal pages or social connect configured
THEN the center footer shows the same legal links and social icons as the brand site
