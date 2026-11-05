# Restaurant Address Generator

Static, client-side tool: enter a locale (`en_US`, `en_AU`, `de_DE`, ...) and get a fresh, unique restaurant name, full address, phone and a format- and checksum-valid VAT / tax ID. Click any field to copy it.

Optional **State / Region** box limits the address to cities in that state. Type or pick: `NY`, `ny`, `New York`, `newyork`, `ga`, `Georgia`, or a unique prefix like `wash`. Leave it empty for any state.
Shareable links: `?locale=en_AU` or `?locale=en_US&region=WA`

Supported: en_US en_CA en_GB en_AU en_NZ en_IE en_IN de_DE fr_FR es_ES it_IT nl_NL sv_SE hu_HU nb_NO pt_PT fi_FI de_AT nl_BE cs_CZ da_DK el_GR fr_LU pl_PL ro_RO sl_SI es_AR es_CL es_MX es_DO es_PR de_CH ru_RU ru_KZ pt_BR ja_JP

Postcodes are real, commonly accepted codes for the chosen city (real ZIP/PIN/PLZ/CEP lists; for the UK, Canada, Ireland and the Netherlands a real postcode district with a format-valid ending), so they pass format validators and typical city/postcode checks.

Test data only. Addresses are fictional and tax IDs are not registered to any business.

## Browser extension (Chrome and Edge)

`extension/` is a Manifest V3 extension for Chromium browsers — it works in **Google Chrome and Microsoft Edge** (and Brave etc.).
It generates details for a locale and fills them into the open page: first/last name, email (`@example.com`), phone (national
number, no country code), restaurant name, street, city, state/region, postal code, country and tax ID. Dropdowns are selected
(it waits for state lists that load after the country is chosen); first/last/email style fields are matched by `autocomplete`,
name, id, placeholder and label text. React/Vue forms are supported.

**Install** — download `restaurant-address-filler-extension.zip` from this repo and unzip it (or use `extension/` directly), then:
- Chrome: open `chrome://extensions`, enable **Developer mode**, **Load unpacked**, pick the folder.
- Edge: open `edge://extensions`, enable **Developer mode**, **Load unpacked**, pick the folder.

Pin it, open the form page, click the icon, **Generate**, then **Fill this page**.

**Want to know how it works?** See [docs/HOW-IT-WORKS.md](docs/HOW-IT-WORKS.md) for a walkthrough of the manifest, popup, script injection, field matching and tests.

**Tests** — `cd tests && npm i && npm test` tests the web page and launches real Chrome with the extension to fill two test forms across 8 locales and chosen states.
Set `BROWSER=/path/to/msedge` to run the same suite in Edge.

If you change the generator in `index.html`, run `./build-extension.sh` (syncs `extension/generator.js` and rebuilds the zip).
