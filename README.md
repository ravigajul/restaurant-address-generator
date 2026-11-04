# Restaurant Address Generator

Static, client-side tool: enter a locale (`en_US`, `en_AU`, `de_DE`, ...) and get a fresh, unique restaurant name, full address, phone and a format- and checksum-valid VAT / tax ID. Click any field to copy it.

Shareable per-locale links: `?locale=en_AU`

Supported: en_US en_CA en_GB en_AU en_NZ en_IE en_IN de_DE fr_FR es_ES it_IT nl_NL sv_SE pt_BR ja_JP

Test data only. Addresses are fictional and tax IDs are not registered to any business.

## Chrome extension

`extension/` is a Manifest V3 extension that generates an address for a locale and fills it into the open page's form fields
(matched by `autocomplete`, name, id, placeholder and label text; works with React/Vue forms; skips first/last/email/etc.).

Install: download this repo (Code > Download ZIP), unzip, open `chrome://extensions`, enable **Developer mode**,
click **Load unpacked** and pick the `extension` folder. Pin it, open a form, click the icon, **Generate**, then **Fill this page**.

If you change the generator in `index.html`, run `./build-extension.sh` to sync `extension/generator.js`.
