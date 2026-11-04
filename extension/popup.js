/* global LOCALES, generate */
const $ = id => document.getElementById(id);
const EN = { US:'United States', CA:'Canada', GB:'United Kingdom', AU:'Australia', NZ:'New Zealand', IE:'Ireland', IN:'India',
  DE:'Germany', FR:'France', ES:'Spain', IT:'Italy', NL:'Netherlands', SE:'Sweden', BR:'Brazil', JP:'Japan' };
const STATES = { // abbreviation -> full name, for <select> state fields
  NY:'New York',CA:'California',IL:'Illinois',TX:'Texas',WA:'Washington',FL:'Florida',CO:'Colorado',MA:'Massachusetts',GA:'Georgia',
  ON:'Ontario',BC:'British Columbia',QC:'Quebec',AB:'Alberta',MB:'Manitoba',
  NSW:'New South Wales',VIC:'Victoria',QLD:'Queensland',WA_AU:'Western Australia',SA:'South Australia',TAS:'Tasmania',ACT:'Australian Capital Territory' };
let data = null;

function normalize(s){
  s = s.trim().replace('-', '_');
  const m = s.match(/^([a-zA-Z]{2})_([a-zA-Z]{2})$/);
  const code = m ? m[1].toLowerCase()+'_'+m[2].toUpperCase() : (/^[a-zA-Z]{2}$/.test(s) ? '_'+s.toUpperCase() : s);
  if (LOCALES[code]) return code;
  const region = code.slice(-2).toUpperCase();
  return (/^([a-z]{2})?_?[a-z]{2}$/i.test(code) && Object.keys(LOCALES).find(k => k.endsWith('_'+region))) || code;
}
function msg(t, cls){ const m = $('msg'); m.textContent = t; m.className = cls || ''; }

async function copy(t){ try { await navigator.clipboard.writeText(t); return true; } catch(e){ return false; } }

function render(){
  const code = normalize($('loc').value);
  if (!LOCALES[code]) { msg(`Locale "${$('loc').value}" isn't supported.`, 'err'); return; }
  $('loc').value = code;
  const r = generate(code), cc = code.slice(-2);
  data = { name:r.f.name, full:r.full, street:r.f.street, city:r.f.city, region:r.f.region, postal:r.f.postal,
           country:r.f.country, countryEn:EN[cc], countryCode:cc, phone:r.phone, tax:r.tax.value, taxLabel:r.tax.label };
  const rows = [['Restaurant',data.name],['Full address',data.full],['Street',data.street],['City',data.city],
    ['State/Region',data.region],['Postal code',data.postal],['Country',data.country],['Phone',data.phone],[data.taxLabel,data.tax]];
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
  chrome.storage.local.set({ locale: code });
}

/* Runs INSIDE the page (all frames). Must be fully self-contained. */
function fillPage(d, states){
  const rules = [
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
    'postal-code':'postal','country':'country','country-name':'country','tel':'phone','organization':'name' };
  const skipName = /first|last|given|family|user|contact|owner|card|sur|middle|nick|full.?name|person|email|login|search/i;

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
    const hint = [el.name, el.id, el.placeholder, el.getAttribute('aria-label'), labelText(el), el.getAttribute('data-testid')]
      .filter(Boolean).join(' ').replace(/[_\-\[\].]+/g, ' ').replace(/([a-z])([A-Z])/g, '$1 $2');
    for (const [key, re] of rules){
      if (!re.test(hint)) continue;
      if (key === 'name' && skipName.test(hint)) continue;
      if (key === 'street' && el.tagName === 'TEXTAREA') return 'full';
      return key;
    }
    return null;
  };
  const setVal = (el, v) => {
    const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
    el.focus(); setter.call(el, v);
    el.dispatchEvent(new Event('input',  { bubbles:true }));
    el.dispatchEvent(new Event('change', { bubbles:true }));
    el.dispatchEvent(new Event('blur',   { bubbles:true }));
  };
  const norm = s => (s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').trim();
  const pickOption = (sel, wants) => {
    const ws = wants.filter(Boolean).map(norm);
    const opts = [...sel.options];
    return opts.find(o => ws.includes(norm(o.value)) || ws.includes(norm(o.textContent)))
        || opts.find(o => ws.some(w => w.length > 2 && (norm(o.textContent).includes(w) || w.includes(norm(o.textContent)) && norm(o.textContent).length > 2)));
  };

  const full = d.full;
  const values = { name:d.name, full, street:d.street, city:d.city, region:d.region, postal:d.postal, phone:d.phone, tax:d.tax, country:d.country };
  let filled = [], used = new Set();
  const els = [...document.querySelectorAll('input, textarea, select')].filter(el => {
    if (el.disabled || el.readOnly) return false;
    if (el.tagName === 'INPUT' && /hidden|checkbox|radio|file|submit|button|image|reset|password|email|date|range|color/.test(el.type)) return false;
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none';
  });
  for (const el of els){
    const key = classify(el); if (!key || key === 'street2') continue;
    if (used.has(key)) continue; // fill each kind once (first match wins)
    if (el.tagName === 'SELECT'){
      let opt;
      if (key === 'country') opt = pickOption(el, [d.countryCode, d.countryEn, d.country]);
      else if (key === 'region'){
        const abbr = d.region; const long = (d.countryCode === 'AU' && states[abbr + '_AU']) || states[abbr];
        opt = pickOption(el, [abbr, long, d.region]);
      } else if (key === 'city') opt = pickOption(el, [d.city]);
      if (!opt) continue;
      setVal(el, opt.value); filled.push(key); used.add(key);
    } else {
      setVal(el, values[key]); filled.push(key); used.add(key);
    }
    el.style.outline = '2px solid #1b7f4b'; el.style.outlineOffset = '1px';
    setTimeout(() => { el.style.outline = ''; el.style.outlineOffset = ''; }, 1800);
  }
  return filled;
}

async function fill(){
  if (!data) return;
  try {
    const [tab] = await chrome.tabs.query({ active:true, currentWindow:true });
    if (!tab || /^(chrome|edge|about|chrome-extension):/.test(tab.url || '') || /chromewebstore\.google\.com/.test(tab.url || ''))
      return msg("Chrome doesn't allow extensions on this page. Open a normal website tab.", 'err');
    const res = await chrome.scripting.executeScript({ target:{ tabId:tab.id, allFrames:true }, func:fillPage, args:[data, STATES] });
    const keys = res.flatMap(r => r.result || []);
    msg(keys.length ? `Filled ${keys.length} field${keys.length>1?'s':''}: ${[...new Set(keys)].join(', ')}` : 'No matching fields found on this page.', keys.length ? 'ok' : 'err');
  } catch (e) { msg('Could not fill: ' + e.message, 'err'); }
}

for (const code of Object.keys(LOCALES)){ const o = document.createElement('option'); o.value = code; o.label = LOCALES[code].country; $('locs').appendChild(o); }
$('gen').addEventListener('click', render);
$('loc').addEventListener('keydown', e => { if (e.key === 'Enter') render(); });
$('fill').addEventListener('click', fill);
chrome.storage.local.get('locale', ({ locale }) => { if (locale) $('loc').value = locale; render(); });
