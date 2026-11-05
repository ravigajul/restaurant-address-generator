/* global LOCALES, generate */
(() => { // own scope: generator.js already defines helpers like `fill`
const $ = id => document.getElementById(id);
const EN = { US:'United States', CA:'Canada', GB:'United Kingdom', AU:'Australia', NZ:'New Zealand', IE:'Ireland', IN:'India',
  DE:'Germany', FR:'France', ES:'Spain', IT:'Italy', NL:'Netherlands', SE:'Sweden', HU:'Hungary', NO:'Norway', PT:'Portugal', FI:'Finland', BR:'Brazil', JP:'Japan' };
let data = null;

function normalize(s){
  s = s.trim().replace('-', '_');
  const m = s.match(/^([a-zA-Z]{2})_([a-zA-Z]{2})$/);
  const code = m ? m[1].toLowerCase()+'_'+m[2].toUpperCase() : (/^[a-zA-Z]{2}$/.test(s) ? '_'+s.toUpperCase() : s);
  if (LOCALES[code]) return code;
  if (ALIASES[code]) return ALIASES[code];
  const region = code.slice(-2).toUpperCase();
  return (/^([a-z]{2})?_?[a-z]{2}$/i.test(code) && Object.keys(LOCALES).find(k => k.endsWith('_'+region))) || code;
}
function msg(t, cls){ const m = $('msg'); m.textContent = t; m.className = cls || ''; }
async function copy(t){ try { await navigator.clipboard.writeText(t); return true; } catch(e){ return false; } }

function render(){
  const code = normalize($('loc').value);
  if (!LOCALES[code]) { data = null; $('out').innerHTML = ''; $('fill').disabled = true; msg(`Locale "${$('loc').value}" isn't supported.`, 'err'); return; }
  $('loc').value = code;
  const rv = $('reg').value.trim(), region = resolveRegion(code, rv);
  if (region === null) { data = null; $('out').innerHTML = ''; $('fill').disabled = true;     // never fill stale data after a bad entry
    msg(`"${rv}" isn't a state/region for ${code}. Try e.g. ${regionsFor(code).slice(0,6).join(', ')}…`, 'err'); return; }
  $('reg').value = region;
  const r = generate(code, region), cc = code.slice(-2);
  data = { name:r.f.name, full:r.full, street:r.f.street, city:r.f.city, region:r.f.region, postal:r.f.postal,
           country:r.f.country, countryEn:EN[cc], countryCode:cc, phone:r.phone, tax:r.tax.value, taxLabel:r.tax.label,
           first:r.who.first, last:r.who.last, email:r.who.email };
  const rows = [['First name',data.first],['Last name',data.last],['Email',data.email],['Phone (no code)',data.phone],
    ['Restaurant',data.name],['Full address',data.full],['Street',data.street],['City',data.city],
    ['State/Region',data.region],['Postal code',data.postal],['Country',data.country],[data.taxLabel,data.tax]];
  $('out').innerHTML = '';
  for (const [k,v] of rows){
    const b = document.createElement('button'); b.className='f'; b.type='button';
    b.innerHTML = '<span class="k"></span><span class="v"></span>';
    b.firstChild.textContent = k; b.lastChild.textContent = v;
    b.addEventListener('click', async () => { const ok = await copy(v); msg(ok ? `Copied ${k} ✓` : 'Copy failed', ok ? 'ok' : 'err');
      b.classList.add('done'); setTimeout(()=>b.classList.remove('done'), 1200); });
    $('out').appendChild(b);
  }
  $('fill').disabled = false; msg('');
  chrome.storage.local.set({ locale: code, region: $('reg').value });
}

/* Runs INSIDE the page (all frames). Must be fully self-contained. */
async function fillPage(d, states){
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const rules = [
    ['email', /e-?mail/i],
    ['first', /first.?name|given.?name|fname|forename|first$/i],
    ['last',  /last.?name|sur.?name|family.?name|lname|last$/i],
    ['person',/full.?name|contact.?(person|name)|your.?name|owner.?name|cardholder|^name$/i],
    ['tax',   /\b(vat|tax|ein|abn|gst|gstin|tin|trn|siret|siren|nif|cif|btw|ust|partita|cnpj|npwp)\b|tax.?id|tax.?n(o|um)|fiscal|company.?reg|registration.?n/i],
    ['phone', /phone|\btel\b|mobile|telephone/i],
    ['postal',/post(al)?.?code|\bzip|postcode|eircode|pin.?code|\bplz\b|cep\b/i],
    ['country',/country|nation/i],
    ['region',/\b(state|province|region|county|prefecture|territory)\b|address.?level1/i],
    ['city',  /\b(city|town|suburb|locality|municipality)\b|address.?level2/i],
    ['street2',/address.*(line.?2|2\b)|\b(apt|suite|unit|floor)\b|address.?line.?3/i],
    ['full',  /full.?address|complete.?address|formatted.?address|address.?block/i],
    ['street',/street|address.?(line)?.?1|addr(ess)?.?1|^address$|\baddress\b|line.?1/i],
    ['name',  /restaurant|business|company|store|shop|venue|merchant|organi[sz]ation|trading|legal.?name|\bdba\b|\bname\b/i],
  ];
  const ac = { 'street-address':'full','address-line1':'street','address-line2':'street2','address-level1':'region','address-level2':'city',
    'postal-code':'postal','country':'country','country-name':'country','tel':'phone','tel-national':'phone','organization':'name',
    'given-name':'first','family-name':'last','name':'person','email':'email' };
  const skipName = /first|last|given|family|user|contact|owner|card|sur|middle|nick|full.?name|person|login|search/i;

  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
  const visible = el => { const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const labelText = el => {
    let t = '';
    if (el.labels) t += [...el.labels].map(l => l.textContent).join(' ');
    const lb = el.getAttribute('aria-labelledby');
    if (lb) t += ' ' + lb.split(/\s+/).map(i => document.getElementById(i)?.textContent || '').join(' ');
    return t;
  };
  const classify = el => {
    const token = (el.getAttribute('autocomplete') || '').toLowerCase().split(/\s+/).pop();
    if (ac[token]) return ac[token] === 'full' && el.tagName !== 'TEXTAREA' ? 'street' : ac[token];
    const hint = [el.name, el.id, el.placeholder, el.getAttribute('aria-label'), labelText(el), el.getAttribute('data-testid'),
                  el.tagName === 'INPUT' ? '' : (el.getAttribute('role') === 'combobox' || el.tagName === 'BUTTON' ? el.textContent : '')]
      .filter(Boolean).join(' ').replace(/[_\-\[\].]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    for (const [key, re] of rules){
      if (!re.test(hint)) continue;
      if (key === 'name' && skipName.test(hint)) continue;
      if (key === 'street' && el.tagName === 'TEXTAREA') return 'full';
      return key;
    }
    return null;
  };
  const collect = () => [...document.querySelectorAll(
      'input, textarea, select, [role=combobox]:not(input):not(select), button[aria-haspopup=listbox]')]
    .filter(el => {
      if (el.disabled || el.readOnly || el.getAttribute('aria-disabled') === 'true') return false;
      if (el.tagName === 'INPUT' && /hidden|checkbox|radio|file|submit|button|image|reset|password|date|range|color/.test(el.type)) return false;
      return visible(el);
    });

  const setVal = (el, v) => {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    el.focus(); setter.call(el, v);
    el.dispatchEvent(new Event('input',  { bubbles:true }));
    el.dispatchEvent(new Event('change', { bubbles:true }));
    el.dispatchEvent(new Event('blur',   { bubbles:true }));
  };
  const wantsFor = key => key === 'country' ? [d.countryCode, d.countryEn, d.country]
    : key === 'region' ? [d.region, states[d.countryCode + '_' + d.region], d.region]
    : [d.city];
  // loose match: exact value/text, "NY - New York", "New York (NY)", or full-name containment
  const matchOpt = (cands, wants) => {
    const ws = wants.filter(Boolean).map(norm);
    const info = cands.map(o => ({ o, v:norm(o.value), t:norm(o.text), toks:norm(o.text).split(/[^a-z0-9]+/).filter(Boolean) }));
    return (info.find(i => ws.includes(i.v) || ws.includes(i.t))
         || info.find(i => ws.some(w => w.length <= 3 && i.toks.includes(w)))
         || info.find(i => ws.some(w => w.length > 3 && (i.t.includes(w) || (i.t.length > 3 && w.includes(i.t))))))?.o;
  };
  const selectOptions = sel => [...sel.options].map(o => ({ value:o.value, text:o.textContent, o }));
  const listOptions = () => [...document.querySelectorAll('[role=option], [role=listbox] li, ul[role=listbox] > *')]
    .filter(visible).map(el => ({ value:el.getAttribute('data-value') || el.textContent, text:el.textContent, el }));

  const notes = [], filled = [], used = new Set();
  const flash = el => { el.style.outline = '2px solid #1b7f4b'; el.style.outlineOffset = '1px';
    setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 1800); };
  const values = { name:d.name, full:d.full, street:d.street, city:d.city, region:d.region, postal:d.postal, phone:d.phone, tax:d.tax,
                   country:d.country, first:d.first, last:d.last, email:d.email, person:`${d.first} ${d.last}` };

  async function fillOne(el, key){
    if (el.tagName === 'SELECT'){
      if (!['country','region','city'].includes(key)) return false;
      // the state list often loads only after the country changes -> poll for a match
      let hit; for (let i = 0; i < 14 && !hit; i++){ hit = matchOpt(selectOptions(el), wantsFor(key)); if (!hit) await sleep(150); }
      if (!hit){ notes.push(`${key}: no <select> option matches "${wantsFor(key).filter(Boolean).join('" / "')}"`); return false; }
      setVal(el, hit.value); return true;
    }
    const custom = el.tagName !== 'INPUT' && el.tagName !== 'TEXTAREA';
    const combo = custom || el.getAttribute('role') === 'combobox' || el.getAttribute('aria-autocomplete') || el.getAttribute('aria-haspopup') === 'listbox';
    if (combo && ['country','region','city'].includes(key)){
      const wants = wantsFor(key);
      if (custom) el.click(); else { setVal(el, wants[wants.length > 1 && key !== 'region' ? 1 : 0] || wants[0]); }
      let hit; for (let i = 0; i < 10 && !hit; i++){ await sleep(150); hit = matchOpt(listOptions(), wants); }
      if (hit){ hit.el.click(); return true; }
      if (custom){ notes.push(`${key}: custom dropdown opened but no option matched`); return false; }
      return true; // typed text stays in the input
    }
    if (custom) return false;
    setVal(el, values[key]); return true;
  }

  async function pass(only){
    for (const el of collect()){
      const key = classify(el);
      if (!key || key === 'street2' || used.has(key) || (only && !only.includes(key))) continue;
      if (await fillOne(el, key)){ used.add(key); filled.push(key); flash(el); }
    }
  }
  await pass(['country']);                     // country first so dependent state lists can load
  if (used.has('country')) await sleep(600);
  await pass();                                // then everything else (re-queried after the page reacted)
  if (!used.has('region') && !notes.some(n => n.startsWith('region'))) { /* no state field found - nothing to report */ }
  return { filled, notes };
}

async function fillTab(){
  if (!data) return;
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if (!tab || /^(chrome|edge|about|chrome-extension):/.test(tab.url || '') || /chromewebstore\.google\.com/.test(tab.url || ''))
      return msg("Chrome doesn't allow extensions on this page. Open a normal website tab.", 'err');
    msg('Filling…');
    const res = await chrome.scripting.executeScript({ target:{ tabId:tab.id, allFrames:true }, func:fillPage, args:[data, REGION_NAMES] });
    const keys = res.flatMap(r => r.result?.filled || []);
    const notes = [...new Set(res.flatMap(r => r.result?.notes || []))];
    const base = keys.length ? `Filled ${keys.length} field${keys.length>1?'s':''}: ${[...new Set(keys)].join(', ')}` : 'No matching fields found on this page.';
    msg(base + (notes.length ? `\n⚠ ${notes.join('\n⚠ ')}` : ''), keys.length && !notes.length ? 'ok' : 'err');
  } catch (e) { msg('Could not fill: ' + e.message, 'err'); }
}

for (const code of Object.keys(LOCALES)){ const o = document.createElement('option'); o.value = code; o.label = LOCALES[code].country; $('locs').appendChild(o); }
function syncRegions(keep){
  const code = normalize($('loc').value);
  $('regs').innerHTML = '';
  if (!LOCALES[code]) { $('reg').value = ''; return; }
  for (const r of regionsFor(code)){ const o = document.createElement('option'); o.value = r; const n = REGION_NAMES[code.slice(-2)+'_'+r]; if (n && n !== r) o.label = n; $('regs').appendChild(o); }
  $('reg').value = resolveRegion(code, keep || '') || '';
}
let lastCode = null;
$('loc').addEventListener('input', () => { const c = normalize($('loc').value); if (LOCALES[c] && c !== lastCode){ lastCode = c; syncRegions(''); } });
$('reg').addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
$('gen').addEventListener('click', render);
$('loc').addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
$('fill').addEventListener('click', fillTab);
chrome.storage.local.get(['locale','region'], ({ locale, region }) => { if (locale) $('loc').value = locale; lastCode = normalize($('loc').value); syncRegions(region || ''); render(); });
})();
