// Verifies every generated postcode against each country's official format, and that every city uses curated real codes.
const fs = require('fs'), path = require('path');
const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const js = html.split('<script>')[1].split('/* ---------- UI ---------- */')[0];
const L = new Function(js + ';return {LOCALES,generate,POSTAL,regionsFor}')();
const FMT = {
  US:/^\d{5}$/, CA:/^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\d[ABCEGHJ-NPRSTV-Z]\d$/, GB:/^[A-Z]{1,2}\d[A-Z\d]?\d[ABD-HJLNP-UW-Z]{2}$/,
  AU:/^\d{4}$/, NZ:/^\d{4}$/, IE:/^[ACDEFHKNPRTV-Y]\d{2}[0-9ACDEFHKNPRTV-Y]{4}$/, IN:/^[1-9]\d{5}$/, DE:/^\d{5}$/, FR:/^\d{5}$/,
  ES:/^(0[1-9]|[1-4]\d|5[0-2])\d{3}$/, IT:/^\d{5}$/, NL:/^[1-9]\d{3}(?!SA|SD|SS)[A-Z]{2}$/, SE:/^\d{3}\d{2}$/, BR:/^\d{5}-\d{3}$/, HU:/^[1-9]\d{3}$/, JP:/^\d{3}-\d{4}$/ };
let bad = 0, total = 0;
for (const code of Object.keys(L.LOCALES)) {
  const cc = code.slice(-2), Lc = L.LOCALES[code];
  for (const c of Lc.cities) {                      // every city must have a curated list (no random fallback)
    const key = Lc.style === 'J' ? c[1] : c[0];
    if (!L.POSTAL[code] || !L.POSTAL[code][key]) { console.log('NO CURATED POSTCODES:', code, key); bad++; }
  }
  for (const r of ['', ...L.regionsFor(code)]) for (let i = 0; i < 60; i++) {
    const x = L.generate(code, r); total++;
    if (!FMT[cc].test(x.f.postal)) { console.log('BAD FORMAT', code, JSON.stringify(x.f.postal)); bad++; }
    if (cc === 'US') { const ok = Object.values(L.POSTAL[code]).some(a => a.includes(x.f.postal)); if (!ok) { console.log('US ZIP NOT CURATED', x.f.postal); bad++; } }
  }
}
console.log(`${total} postcodes checked across ${Object.keys(L.LOCALES).length} locales: ${bad ? bad + ' PROBLEM(S)' : 'ALL VALID'}`);
process.exit(bad ? 1 : 0);
