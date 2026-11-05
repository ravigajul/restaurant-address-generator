/* AUTO-GENERATED from index.html by build-extension.sh — do not edit */

/* ---------- random helpers (crypto-backed) ---------- */
const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
const pick = a => a[rnd(a.length)];
const digits = n => Array.from({length:n}, () => rnd(10)).join('');
const SAFE = 'ABCEGHJKLMNPRSTVWXYZ';
const UKL = 'ABDEFGHJLNPQRSTUWXYZ', EIR = 'ACDEFHKNPRTVWXY';
const fill = p => p.replace(/[#@$%^&]/g, c => c==='#' ? rnd(10) : c==='%' ? 2+rnd(8) : c==='@' ? String.fromCharCode(65+rnd(26)) : c==='^' ? UKL[rnd(UKL.length)] : c==='&' ? EIR[rnd(EIR.length)] : SAFE[rnd(SAFE.length)]);
const num = (lo,hi) => lo + rnd(hi-lo+1);

/* ---------- checksum helpers ---------- */
function luhnCheck(payload){            // returns check digit to append
  let s = 0;
  for (let i = payload.length-1, d = true; i >= 0; i--, d = !d) {
    let n = +payload[i]; if (d) { n *= 2; if (n > 9) n -= 9; } s += n;
  }
  return (10 - s % 10) % 10;
}
const wsum = (str, w) => [...str].reduce((s,c,i) => s + (+c) * w[i], 0);
const grp = (s, sizes) => { let o=[],i=0; for (const z of sizes){ o.push(s.slice(i,i+z)); i+=z; } return o.join(' '); };

/* ---------- tax / VAT ID generators (valid format + checksum) ---------- */
const TAX = {
  US(){ const p = pick(['10','12','27','30','32','35','36','37','38','45','46','47','61','65','81','82','83','84','85','86','87','88','91','92','93','98']);
        return {label:'EIN (Federal Tax ID)', value:`${p}-${digits(7)}`}; },
  AU(){ const body = digits(9), w=[10,1,3,5,7,9,11,13,15,17,19];
        for (let p=10;p<=99;p++){ const d=(''+p+body); const t=[...d].map(Number); t[0]-=1;
          if (t.reduce((s,x,i)=>s+x*w[i],0)%89===0) return {label:'ABN (GST registered)', value:grp(d,[2,3,3,3])}; }
        return TAX.AU(); },
  GB(){ const b = digits(7); const r = wsum(b,[8,7,6,5,4,3,2]) % 97;
        return {label:'VAT Reg. No.', value:'GB'+b+String((97-r)%97).padStart(2,'0')}; },
  CA(){ const b = String(num(1,8))+digits(7); return {label:'GST/HST No. (BN)', value:grp(b+luhnCheck(b),[3,3,3])+' RT0001'}; },
  NZ(){ for(;;){ const b = String(num(10000000,14999999)); const tryW = w => { const r = wsum(b,w)%11; return r===0?0:11-r; };
          let c = tryW([3,2,7,6,5,4,3,2]); if (c===10) c = tryW([7,4,3,2,5,2,7,6]); if (c===10) continue;
          const s=b+c; return {label:'GST No. (IRD)', value:`${s.slice(0,3)}-${s.slice(3,6)}-${s.slice(6)}`}; } },
  IE(){ const b = String(num(1,9))+digits(6); const L='WABCDEFGHIJKLMNOPQRSTUV';
        return {label:'VAT No.', value:'IE'+b+L[wsum(b,[8,7,6,5,4,3,2])%23]}; },
  DE(){ const b = String(num(1,9))+digits(7); let p=10;
        for (const ch of b){ let s=(+ch+p)%10; if(s===0)s=10; p=(2*s)%11; }
        let c=11-p; if(c===10)c=0; return {label:'USt-IdNr. (VAT ID)', value:'DE'+b+c}; },
  FR(){ const b = digits(8); const siren = b+luhnCheck(b); const key = (12 + 3*(+siren % 97)) % 97;
        return {label:'No. TVA intracommunautaire', value:'FR'+String(key).padStart(2,'0')+siren}; },
  ES(){ const b = String(num(1,9))+digits(6); // CIF type B (S.L.), 2-digit province + 5 digits
        const prov = String(num(1,52)).padStart(2,'0'); const d = prov+digits(5); let s=0;
        [...d].forEach((ch,i)=>{ let n=+ch; if(i%2===0){ n*=2; if(n>9)n-=9; } s+=n; });
        return {label:'NIF / CIF (IVA)', value:'ESB'+d+((10-s%10)%10)}; },
  IT(){ const b = digits(7)+String(num(1,100)).padStart(3,'0'); return {label:'Partita IVA', value:'IT'+b+luhnCheck(b)}; },
  NL(){ for(;;){ const b = digits(8); const c = wsum(b,[9,8,7,6,5,4,3,2])%11; if (c<10) return {label:'BTW-nummer (VAT)', value:'NL'+b+c+'B'+String(num(1,99)).padStart(2,'0')}; } },
  SE(){ const b = digits(2)+String(num(2,9))+digits(6); return {label:'Momsnr (VAT)', value:'SE'+b+luhnCheck(b)+'01'}; },
  BR(){ const b = digits(8)+'0001'; const dv = (s,w)=>{ const r=wsum(s,w)%11; return r<2?0:11-r; };
        const d1 = dv(b,[5,4,3,2,9,8,7,6,5,4,3,2]); const d2 = dv(b+d1,[6,5,4,3,2,9,8,7,6,5,4,3,2]);
        const s=b+d1+d2; return {label:'CNPJ', value:`${s.slice(0,2)}.${s.slice(2,5)}.${s.slice(5,8)}/${s.slice(8,12)}-${s.slice(12)}`}; },
  IN(city){ const A=n=>Array.from({length:n},()=>String.fromCharCode(65+rnd(26))).join('');
        const pan = A(3)+'C'+A(1)+digits(4)+A(1); const base = city.gst + pan + num(1,9) + 'Z';
        const cs='0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ'; let s=0;
        [...base].forEach((ch,i)=>{ const p = cs.indexOf(ch)*(i%2?2:1); s += Math.floor(p/36)+p%36; });
        return {label:'GSTIN', value:base+cs[(36-s%36)%36]}; },
  SG(){ const b = digits(8); return {label:'UEN / GST Reg. No.', value:b+'XMKECAWLJDB'[wsum(b,[10,4,9,3,8,2,7,1])%11]}; },
  MY(){ const p2 = n => String(n).padStart(2,'0');   // SST registration number (format only, no public checksum)
        return {label:'SST Reg. No.', value:pick(['W10','B16'])+p2(num(18,25))+p2(num(1,12))+num(10,99)+digits(6)}; },
  TH(){ const b = '0'+String(num(1,9))+digits(10); const c = (11-wsum(b,[13,12,11,10,9,8,7,6,5,4,3,2])%11)%10;   // 13-digit Tax ID, mod 11
        return {label:'Tax ID (TIN)', value:b+c}; },
  VN(city){ for(;;){ const b = city.gst+digits(7); const r = wsum(b,[31,29,23,19,17,13,7,5,3])%11;   // MST: province code + 7 digits + mod 11
          if (r!==0) return {label:'Tax Code (MST)', value:b+(10-r)}; } },
  AE(){ return {label:'TRN (VAT)', value:'100'+digits(12)}; },   // 15-digit TRN (format only, no public checksum)
  CN(city){ const AL='0123456789ABCDEFGHJKLMNPQRTUWXY', org = digits(8); const m = 11-wsum(org,[3,7,9,10,5,8,4,2])%11;   // USCC: org code mod 11, then mod 31
        const b = '91'+city.gst+org+(m===11?'0':m===10?'X':m); let s=0;
        [...b].forEach((ch,i)=>{ s += AL.indexOf(ch)*[1,3,9,27,19,26,16,17,20,29,25,13,8,24,10,30,28][i]; });
        return {label:'USCC (Unified Social Credit Code)', value:b+AL[(31-s%31)%31]}; },
  HK(){ return {label:'Business Registration No. (BR)', value:digits(8)}; },   // no VAT/GST in Hong Kong; format only
  MO(){ return {label:'Taxpayer No. (Contribuinte)', value:digits(7)}; },      // no VAT/GST in Macau; format only
  TW(){ const b = digits(7); let s=0; [...b].forEach((ch,i)=>{ const p=(+ch)*[1,2,1,2,1,2,4,1][i]; s+=Math.floor(p/10)+p%10; });
        return {label:'Unified Business No. (VAT)', value:b+((5-s%5)%5+5*rnd(2))}; },
  KR(){ const b = pick(['101','104','105','106','107','108','109','110','113','114','117','120','123','129','134'])+pick(['81','85','86','87'])+digits(4);
        const s = wsum(b,[1,3,7,1,3,7,1,3,5])+Math.floor(+b[8]*5/10); return {label:'Business Reg. No. (BRN)', value:b+((10-s%10)%10)}; },
  CH(){ for(;;){ const b = String(num(1,9))+digits(7); const c = 11-wsum(b,[5,4,3,2,7,6,5,4])%11;   // UID, mod 11
          if (c!==10) return {label:'MWST-Nr. (UID)', value:'CHE'+b+(c===11?0:c)+'MWST'}; } },
  RU(){ const b = pick(['77','78','50','66','54'])+digits(7); return {label:'INN (Tax ID)', value:b+((wsum(b,[2,4,10,3,5,9,4,6,8])%11)%10)}; },
  KZ(){ const p2 = n => String(n).padStart(2,'0');
        for(;;){ const b = p2(num(0,99))+p2(num(1,12))+p2(num(1,28))+pick(['4','5','6'])+digits(4);
          let s = wsum(b,[1,2,3,4,5,6,7,8,9,10,11])%11; if (s===10) s = wsum(b,[3,4,5,6,7,8,9,10,11,1,2])%11;
          if (s!==10) return {label:'BIN (Business ID)', value:b+s}; } },
  AR(){ for(;;){ const b = pick(['30','33','34'])+digits(8); const c = 11-wsum(b,[5,4,3,2,7,6,5,4,3,2])%11;   // CUIT, mod 11
          if (c!==10) return {label:'CUIT', value:b+(c===11?0:c)}; } },
  CL(){ const b = '76'+digits(6); let s=0; [...b].reverse().forEach((ch,i)=>{ s += +ch * (2 + i%6); }); const m = 11-s%11;   // RUT, mod 11 (K = 10)
        return {label:'RUT', value:b+(m===11?'0':m===10?'K':m)}; },
  MX(){ const A = n => Array.from({length:n},()=>String.fromCharCode(65+rnd(26))).join('');
        const p2 = n => String(n).padStart(2,'0'), hk = Array.from({length:2},()=>'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'[rnd(36)]).join('');
        const base = A(3)+p2(num(0,99))+p2(num(1,12))+p2(num(1,28))+hk;   // persona moral RFC: 3 letters + YYMMDD + homoclave
        const T = '0123456789ABCDEFGHIJKLMN&OPQRSTUVWXYZ Ñ', pad = ' '+base; let s=0;
        for (let i=0;i<12;i++) s += T.indexOf(pad[i])*(13-i);
        const d = 11-s%11; return {label:'RFC (IVA)', value:base+(d===11?'0':d===10?'A':d)}; },
  DO(){ const b = '1'+digits(7); const r = wsum(b,[7,9,8,6,5,4,3,2])%11; return {label:'RNC', value:b+(r===0?2:r===1?1:11-r)}; },
  PR(){ return TAX.US(); },
  AT(){ const b = String(num(1,7))+digits(6); let s=0;
        [...b].forEach((ch,i)=>{ let n=+ch; if(i%2===1){ n*=2; if(n>9)n-=9; } s+=n; });
        return {label:'UID-Nummer (VAT)', value:'ATU'+b+((10-(s+4)%10)%10)}; },
  BE(){ const b = String(rnd(2))+digits(7); return {label:'BTW / TVA-nummer', value:'BE'+b+String(97-(+b%97)).padStart(2,'0')}; },
  CZ(){ const b = String(num(1,8))+digits(6); const a = wsum(b,[8,7,6,5,4,3,2])%11;
        return {label:'DIČ (VAT)', value:'CZ'+b+(a===0?1:a===1?0:11-a)}; },
  DK(){ for(;;){ const b = String(num(1,9))+digits(6); const c = (11-wsum(b,[2,7,6,5,4,3,2])%11)%11;
          if (c<10) return {label:'CVR-nummer (moms)', value:'DK'+b+c}; } },
  GR(){ const b = String(num(1,9))+digits(7); let s=0; [...b].forEach((ch,i)=>{ s += +ch * 2**(8-i); });
        return {label:'AFM (VAT)', value:'EL'+b+((s%11)%10)}; },
  LU(){ const b = String(num(1,9))+digits(5); return {label:'No. TVA', value:'LU'+b+String(+b%89).padStart(2,'0')}; },
  PL(){ for(;;){ const b = String(num(1,9))+digits(8); const c = wsum(b,[6,5,7,2,3,4,5,6,7])%11;
          if (c<10) return {label:'NIP (VAT)', value:'PL'+b+c}; } },
  RO(){ const b = String(num(1,9))+digits(7); let c = (wsum(b,[5,3,2,1,7,5,3,2])*10)%11; if(c===10)c=0;
        return {label:'CIF / CUI (TVA)', value:'RO'+b+c}; },
  SI(){ for(;;){ const b = String(num(1,9))+digits(6); const r = wsum(b,[8,7,6,5,4,3,2])%11; if (r===0) continue;
          return {label:'DDV št. (VAT)', value:'SI'+b+(r===1?0:11-r)}; } },
  FI(){ for(;;){ const b = String(num(1,9))+digits(6); const r = wsum(b,[7,9,10,5,8,4,2])%11; const c = r===0?0:11-r;   // ALV-tunniste, mod 11
          if (c<10) return {label:'ALV-numero (VAT)', value:'FI'+b+c}; } },
  PT(){ for(;;){ const b = '5'+digits(7); const r = wsum(b,[9,8,7,6,5,4,3,2])%11; const c = r<2?0:11-r;   // NIF of a company (starts with 5), mod 11
          return {label:'NIF (IVA)', value:'PT'+b+c}; } },
  NO(){ for(;;){ const b = String(num(8,9))+digits(7); const r = wsum(b,[3,2,7,6,5,4,3,2])%11; const c = r===0?0:11-r;   // organisasjonsnummer, mod 11
          if (c<10) return {label:'MVA-nummer (VAT)', value:'NO'+b+c+'MVA'}; } },
  HU(){ const b = String(num(1,9))+digits(6); const c = (10 - wsum(b,[9,7,3,1,9,7,3])%10)%10;   // 8-digit adószám core
        return {label:'ÁFA-szám (VAT)', value:'HU'+b+c}; },
  JP(){ const b = String(num(1,9))+digits(11); let s=0; // 12 digits, Pn counted from right
        for (let n=1;n<=12;n++) s += +b[12-n] * (n%2?1:2);
        return {label:'Invoice Reg. No. (Qualified Invoice Issuer)', value:'T'+(9-s%9)+b}; },
};

/* ---------- locale data ---------- */
const W = {   // building blocks for names
  en_adj:['Golden','Blue','Rustic','Little','Red','Silver','Hungry','Happy','Urban','Wild','Crimson','Old','Lucky','Salt &','Copper','Velvet','Smoky','Sunny'],
  en_noun:['Fork','Olive','Table','Spoon','Barrel','Oven','Harvest','Anchor','Garden','Ember','Pepper','Lantern','Basil','Thistle','Plate','Fig','Cellar','Orchard'],
  en_kind:['Kitchen','Bistro','Grill','Eatery','Tavern','Diner','Cafe','House','Brasserie','Table'],
};
const enName = () => rnd(3)===0 ? `The ${pick(W.en_adj)} ${pick(W.en_noun)}` : `${pick(W.en_adj)} ${pick(W.en_noun)} ${pick(W.en_kind)}`;
const enStreetNames = ['Main','Oak','Maple','Cedar','Elm','Park','Lake','Hill','Sunset','River','Church','High','Market','Station','King','Queen','Mill','Spring','Willow','Ridge','Harbour','Bridge','Garden','Victoria','Albert','George','Jefferson','Lincoln'];

const LOCALES = {
  en_US:{ country:'United States', tax:'US', style:'A', phone:'%## 555 01##',
    name:enName, street:()=>`${num(1,9899)} ${pick(enStreetNames)} ${pick(['St','Ave','Blvd','Rd','Dr','Ln','Way'])}${rnd(4)===0?`, Suite ${num(100,950)}`:''}`,
    cities:[['New York','NY','100##'],['Los Angeles','CA','900##'],['Chicago','IL','606##'],['Houston','TX','770##'],['Seattle','WA','981##'],['Miami','FL','331##'],['Denver','CO','802##'],['Boston','MA','021##'],['Austin','TX','787##'],['Atlanta','GA','303##']] },
  en_CA:{ country:'Canada', tax:'CA', style:'A', phone:'%## 555 01##',
    name:enName, street:()=>`${num(1,9899)} ${pick(enStreetNames)} ${pick(['St','Ave','Blvd','Rd','Dr','Cres'])}`,
    cities:[['Toronto','ON','M5$ #$#'],['Vancouver','BC','V6$ #$#'],['Montreal','QC','H2$ #$#'],['Calgary','AB','T2$ #$#'],['Ottawa','ON','K1$ #$#'],['Winnipeg','MB','R3$ #$#']] },
  en_GB:{ country:'United Kingdom', tax:'GB', style:'C', phone:'020 7946 0###',
    name:enName, street:()=>`${num(1,240)} ${pick(enStreetNames)} ${pick(['Street','Road','Lane','Close','Way','Gardens','Row'])}`,
    cities:[['London','England','EC# #$$'],['Manchester','England','M## #$$'],['Birmingham','England','B## #$$'],['Edinburgh','Scotland','EH# #$$'],['Bristol','England','BS# #$$'],['Leeds','England','LS# #$$'],['Cardiff','Wales','CF# #$$']] },
  en_AU:{ country:'Australia', tax:'AU', style:'B', phone:'02 5550 ####',
    name:enName, street:()=>`${rnd(3)===0?`Shop ${num(1,30)}/`:''}${num(1,420)} ${pick(enStreetNames)} ${pick(['Street','Road','Avenue','Lane','Parade','Terrace','Place'])}`,
    cities:[['Sydney','NSW','20##'],['Melbourne','VIC','30##'],['Brisbane','QLD','40##'],['Perth','WA','60##'],['Adelaide','SA','50##'],['Hobart','TAS','70##'],['Canberra','ACT','26##']] },
  en_NZ:{ country:'New Zealand', tax:'NZ', style:'C', phone:'09 555 ####',
    name:enName, street:()=>`${num(1,300)} ${pick(enStreetNames)} ${pick(['Street','Road','Avenue','Lane','Drive'])}`,
    cities:[['Auckland','Auckland','10##'],['Wellington','Wellington','60##'],['Christchurch','Canterbury','80##'],['Hamilton','Waikato','32##'],['Dunedin','Otago','90##']] },
  en_IE:{ country:'Ireland', tax:'IE', style:'C', phone:'01 555 ####',
    name:enName, street:()=>`${num(1,150)} ${pick(['Main','Church','Castle','Bridge','Market','Quay','Patrick','Mill','Abbey'])} ${pick(['Street','Road','Lane','Quay','Avenue'])}`,
    cities:[['Dublin','Leinster','D0# $#$#'],['Cork','Munster','T12 $#$#'],['Galway','Connacht','H91 $#$#'],['Limerick','Munster','V94 $#$#']] },
  en_IN:{ country:'India', tax:'IN', style:'A', phone:'9#### #####',
    name:()=>pick(['Spice Route','Tandoor Palace','Curry Leaf','Masala Junction','Saffron Table','Dosa Corner','Biryani House','Chaat Street','Royal Thali','Mirch Masala']),
    street:()=>`Shop No. ${num(1,120)}, ${pick(['MG','Station','Gandhi','Nehru','Temple','Market','Linking','Residency','Brigade','Church'])} ${pick(['Road','Marg','Street','Chowk'])}`,
    cities:[['Mumbai','Maharashtra','400###','27'],['Delhi','Delhi','110###','07'],['Bengaluru','Karnataka','560###','29'],['Chennai','Tamil Nadu','600###','33'],['Hyderabad','Telangana','500###','36'],['Pune','Maharashtra','411###','27']] },
  de_DE:{ country:'Germany', tax:'DE', style:'D', phone:'030 555####',
    name:()=>pick(['Gasthaus Zum Goldenen Löwen','Zur Linde','Brauhaus am Markt','Ristorante Da Mario','Weinstube Hirsch','Landhaus Eichenhof','Zum Alten Fritz','Gaststätte Lindenhof','Restaurant Rheinblick','Zur Krone']),
    street:()=>`${pick(['Haupt','Bahnhof','Schiller','Goethe','Linden','Garten','Kirch','Markt','Berg','Wald','Mühlen','Rosen'])}${pick(['straße','weg','platz','allee'])} ${num(1,150)}`,
    cities:[['Berlin','Berlin','10###'],['Munich','Bavaria','80###'],['Hamburg','Hamburg','20###'],['Cologne','North Rhine-Westphalia','50###'],['Frankfurt','Hesse','60###'],['Stuttgart','Baden-Württemberg','70###']] },
  fr_FR:{ country:'France', tax:'FR', style:'D', phone:'01 ## ## ## ##',
    name:()=>pick(['Le Petit Bistro','Chez Marcel','La Belle Époque','Le Comptoir','Brasserie du Coin','Au Bon Vivant','La Table de Julie','Le Coq Gaulois','L’Escargot Doré','Café des Arts']),
    street:()=>`${num(1,180)} ${pick(['Rue','Avenue','Boulevard','Place','Quai','Allée'])} ${pick(['Victor Hugo','de la République','de la Paix','Pasteur','Jean Jaurès','des Lilas','du Marché','Gambetta','de Verdun','Voltaire'])}`,
    cities:[['Paris','Île-de-France','750##'],['Lyon','Auvergne-Rhône-Alpes','690##'],['Marseille','Provence-Alpes-Côte d’Azur','130##'],['Toulouse','Occitanie','310##'],['Nice','Provence-Alpes-Côte d’Azur','060##'],['Bordeaux','Nouvelle-Aquitaine','330##']] },
  es_ES:{ country:'Spain', tax:'ES', style:'D', phone:'91 ### ## ##',
    name:()=>pick(['Casa Pepe','La Taberna del Sol','El Rincón de Juan','Bar La Plaza','Mesón El Toro','Casa Lola','La Cantina','El Jardín Secreto','Asador Los Arcos','Tapas y Vino']),
    street:()=>`${pick(['Calle','Avenida','Plaza','Paseo'])} ${pick(['Mayor','de Cervantes','del Sol','de la Constitución','Real','de Goya','de los Olivos','San Antonio','de Alcalá','Colón'])}, ${num(1,150)}`,
    cities:[['Madrid','Madrid','280##'],['Barcelona','Catalonia','080##'],['Valencia','Valencian Community','460##'],['Seville','Andalusia','410##'],['Bilbao','Basque Country','480##']] },
  it_IT:{ country:'Italy', tax:'IT', style:'E', phone:'06 ### ####',
    name:()=>pick(['Trattoria da Luigi','Osteria La Luna','Ristorante Il Girasole','Pizzeria Napoli','La Dolce Vita','Da Gennaro','Taverna del Borgo','Antica Locanda','Il Pomodoro','Enoteca Bella Vista']),
    street:()=>`${pick(['Via','Viale','Piazza','Corso','Vicolo'])} ${pick(['Roma','Garibaldi','Dante Alighieri','Mazzini','Verdi','Cavour','Marconi','Manzoni','Leonardo da Vinci','della Libertà'])}, ${num(1,150)}`,
    cities:[['Rome','RM','001##'],['Milan','MI','201##'],['Naples','NA','801##'],['Turin','TO','101##'],['Florence','FI','501##']] },
  nl_NL:{ country:'Netherlands', tax:'NL', style:'D', phone:'020 555 ####',
    name:()=>pick(['Eetcafé De Gouden Leeuw','Restaurant De Molen','Brasserie Het Hoekje','Grand Café De Kroon','De Tulp','Smaak aan de Gracht','Bistro De Vier Seizoenen','Het Witte Huis','Eethuis Noord','De Haven']),
    street:()=>`${pick(['Kerk','Dam','Molen','Haven','Nieuwe','Oude','Markt','Beurs','Linden','Station','Kade','School'])}${pick(['straat','laan','weg','plein','gracht'])} ${num(1,200)}`,
    cities:[['Amsterdam','North Holland','10## @@'],['Rotterdam','South Holland','30## @@'],['Utrecht','Utrecht','35## @@'],['The Hague','South Holland','25## @@'],['Eindhoven','North Brabant','56## @@']] },
  sv_SE:{ country:'Sweden', tax:'SE', style:'D', phone:'08 555 ## ###',
    name:()=>pick(['Restaurang Smak','Krogen Björken','Bistro Norden','Matsalen','Café Fika','Kök & Bar Havet','Gastro Stockholm','Wärdshuset Ekan','Matbaren','Smörgåsen']),
    street:()=>`${pick(['Stor','Drottning','Kung','Kyrk','Järn','Skol','Vasa','Hamn','Bergs','Ringvägen'])}${pick(['gatan','vägen','torget','allén'])} ${num(1,140)}`,
    cities:[['Stockholm','Stockholm County','11# ##'],['Gothenburg','Västra Götaland','41# ##'],['Malmö','Skåne','21# ##'],['Uppsala','Uppsala County','75# ##']] },
  en_SG:{ country:'Singapore', tax:'SG', style:'S', phone:'6555 ####',
    name:()=>pick(['Hawker Delights','Lion City Kitchen','Kopitiam Corner','Chilli Crab House','Laksa Lane','Satay Street','Orchard Noodle Bar','Peranakan Table','Merlion Cafe','Garden Rice House']),
    street:()=>`${num(1,500)} ${pick(['Orchard','Victoria','Bukit Timah','Jurong','Tampines','Bedok','Clementi','Marine Parade','Serangoon','Woodlands'])} ${pick(['Road','Avenue','Street'])}, #${String(num(1,30)).padStart(2,'0')}-${String(num(1,99)).padStart(2,'0')}`,
    cities:[['Orchard','Central Region','23####'],['Marina Bay','Central Region','01####'],['Tampines','East Region','52####'],['Jurong East','West Region','60####'],['Woodlands','North Region','73####']] },
  en_MY:{ country:'Malaysia', tax:'MY', style:'D', phone:'03 5555 ####',
    name:()=>pick(['Restoran Selera Kampung','Nasi Lemak Corner','Mamak Station','Kedai Kopi Ah Seng','Restoran Rasa Sayang','Satay House','Laksa Penang Kitchen','Kopitiam Lama','Dapur Mak Cik','Teh Tarik Cafe']),
    street:()=>`No. ${num(1,200)}, Jalan ${pick(['Bukit Bintang','Ampang','Tun Razak','Sultan Ismail','Pudu','Imbi','Raja Chulan','Pantai','Kenanga','Mawar'])}`,
    cities:[['Kuala Lumpur','Kuala Lumpur','50###'],['Petaling Jaya','Selangor','46###'],['Johor Bahru','Johor','80###'],['George Town','Penang','10###'],['Kota Kinabalu','Sabah','88###']] },
  en_TH:{ country:'Thailand', tax:'TH', style:'T', phone:'02 555 ####',
    name:()=>pick(['Baan Thai Kitchen','Pad Thai Corner','Lotus Garden Restaurant','Tom Yum House','Bangkok Street Eats','Mango Sticky Cafe','Siam Spice','Green Curry Bistro','Night Market Grill','Orchid Noodle House']),
    street:()=>`${num(1,500)} ${pick(['Sukhumvit','Silom','Sathorn','Rama IV','Phetchaburi','Ratchadamri','Charoen Krung','Phahonyothin','Sri Ayutthaya','Nimmanhaemin'])} Road`,
    cities:[['Bangkok','Bangkok','10###'],['Chiang Mai','Chiang Mai','50###'],['Phuket','Phuket','83###'],['Pattaya','Chonburi','20###'],['Khon Kaen','Khon Kaen','40###']] },
  en_VN:{ country:'Vietnam', tax:'VN', style:'T', phone:'028 5555 ####',
    name:()=>pick(['Pho Saigon Kitchen','Banh Mi Corner','Lotus Pond Restaurant','Bun Cha House','Com Tam Quan','Hanoi Noodle House','Cafe Ca Phe Sua','Mekong Delta Eatery','Quan An Ngon','Golden Dragon Cafe']),
    street:()=>`${num(1,300)} ${pick(['Nguyen Hue','Le Loi','Tran Hung Dao','Hai Ba Trung','Pasteur','Dong Khoi','Ly Tu Trong','Pham Ngu Lao','Nguyen Trai','Hoang Dieu'])} Street`,
    cities:[['Hanoi','Hanoi','1#####','01'],['Ho Chi Minh City','Ho Chi Minh City','7#####','03'],['Da Nang','Da Nang','55####','04'],['Hai Phong','Hai Phong','18####','02'],['Can Tho','Can Tho','90####','18']] },
  en_AE:{ country:'United Arab Emirates', tax:'AE', style:'H', phone:'04 555 ####',
    name:()=>pick(['Arabian Nights Restaurant','Shawarma House','Majlis Cafe','Desert Rose Kitchen','Pearl Grill','Falcon Grill','Dhow Palace Restaurant','Saffron Garden','Oasis Cafeteria','Souk Kitchen']),
    street:()=>`${pick(['Shop','Unit','Office'])} ${num(1,200)}, ${pick(['Sheikh Zayed Road','Al Wasl Road','Jumeirah Beach Road','Al Maktoum Street','Corniche Road','Hamdan Street','Al Khaleej Road','Electra Street'])}`,
    cities:[['Dubai','Dubai','00000'],['Abu Dhabi','Abu Dhabi','00000'],['Sharjah','Sharjah','00000'],['Ajman','Ajman','00000'],['Ras Al Khaimah','Ras Al Khaimah','00000']] },
  zh_CN:{ country:'China', tax:'CN', style:'X', phone:'010 5555 ####',
    name:()=>pick(['Old Beijing Hot Pot','Sichuan Flavor House','Jiangnan Bistro','Dim Sum Garden','Fortune Tower Restaurant','Spicy Crab House','Heaven of Food','Hakka Kitchen','Prosperity Garden','Mala Tang House']),
    street:()=>`${num(1,200)} ${pick(['Zhongshan','Jiefang','Renmin','Jianshe','Wenhua','Heping','Xinhua','Chaoyang','Chang’an','Binjiang'])} ${pick(['Road','Avenue','Street'])}`,
    cities:[['Beijing','Beijing','1000##','110105'],['Shanghai','Shanghai','2000##','310115'],['Guangzhou','Guangdong','5106##','440106'],['Shenzhen','Guangdong','5180##','440305'],['Chengdu','Sichuan','6100##','510104']] },
  en_HK:{ country:'Hong Kong', tax:'HK', style:'H', phone:'2555 ####',
    name:()=>pick(['Golden Lotus Cha Chaan Teng','Lucky Wok Kitchen','Harbour View Dim Sum','Jade Garden Congee','Dragon Gate Noodles','Victoria Roast Goose','Kowloon Tea House','Lantern Hot Pot','Pearl Bay Seafood','Red Lantern Bistro']),
    street:()=>`Unit ${num(1,20)}, ${num(1,40)}/F, ${num(1,300)} ${pick(['Nathan','Queen’s','Hennessy','Des Voeux','Jaffe','Canton','Lockhart','Hollywood','Argyle','Wellington'])} ${pick(['Road','Street'])}`,
    cities:[['Central','Hong Kong Island','999077'],['Causeway Bay','Hong Kong Island','999077'],['Tsim Sha Tsui','Kowloon','999077'],['Mong Kok','Kowloon','999077'],['Sha Tin','New Territories','999077']] },
  en_MO:{ country:'Macau', tax:'MO', style:'H', phone:'2855 ####',
    name:()=>pick(['Restaurante Lusitano','Casa de Pasto Macau','Tasca do Porto','Dim Sum Garden','Café Sol Nascente','Congee House','Cotai Hot Pot','Restaurante Sabor de Macau','Pastelaria Doce Lar','Noodle Pavilion']),
    street:()=>`${pick(['Avenida da Praia Grande','Rua da Felicidade','Avenida de Almeida Ribeiro','Rua de São Paulo','Avenida de Sidónio Pais','Rua do Campo','Avenida do Infante D. Henrique','Rua Central'])} ${num(1,300)}`,
    cities:[['Macau Peninsula','Macau Peninsula','999078'],['Taipa','Taipa','999078'],['Cotai','Cotai','999078'],['Coloane','Coloane','999078']] },
  zh_TW:{ country:'Taiwan', tax:'TW', style:'X', phone:'02 5555 ####',
    name:()=>pick(['Lao Zhang Beef Noodles','Xiangji Bistro','Night Market Snacks','Acai Braised Pork Rice','Old Taste Eatery','Fortune Tower','Salt Crispy Chicken','Bubble Tea House','Hakka Stir-fry','Seafood Stir-fry']),
    street:()=>`${num(1,200)} ${pick(['Zhongshan','Zhongzheng','Zhongxiao','Minsheng','Xinyi','Heping','Fuxing','Minquan','Zhonghua','Chenggong'])} ${pick(['Road','Street'])}`,
    cities:[['Taipei','Taipei','1##'],['New Taipei','New Taipei','2##'],['Taichung','Taichung','4##'],['Kaohsiung','Kaohsiung','8##'],['Tainan','Tainan','7##']] },
  ko_KR:{ country:'South Korea', tax:'KR', style:'X', phone:'02 5555 ####',
    name:()=>pick(['Hanu Maeul','Seoul Restaurant','Matna Bunsik','Grandma Kalguksu','Bulgogi House','Tuna Sashimi House','Gohyang Jip','Famous Sundae Soup','Seolleongtang House','Sea Sashimi House']),
    street:()=>`${num(1,300)} ${pick(['Sejong-daero','Teheran-ro','World Cup-ro','Haeundaehaebyeon-ro','Jungang-ro','Dongmyeong-ro','Daehak-ro','Beonyeong-ro','Olympic-ro','Gangbyeon-ro'])}`,
    cities:[['Jung-gu','Seoul','04###'],['Gangnam-gu','Seoul','06###'],['Mapo-gu','Seoul','04###'],['Haeundae-gu','Busan','48###'],['Suseong-gu','Daegu','42###'],['Namdong-gu','Incheon','21###']] },
  de_CH:{ country:'Switzerland', tax:'CH', style:'D', phone:'044 555 ## ##',
    name:()=>pick(['Restaurant Zum Goldenen Kreuz','Gasthof Bären','Café Bahnhof','Wirtshaus Zur Sonne','Stübli am See','Restaurant Alpenblick','Brasserie Central','Landgasthof Rössli','Beizli Zum Löwen','Gasthaus Adler']),
    street:()=>`${pick(['Bahnhof','Haupt','Dorf','Kirch','Schul','See','Mühle','Berg','Linden','Rosen'])}${pick(['strasse','weg','gasse','platz'])} ${num(1,150)}`,
    cities:[['Zurich','Zurich','80##'],['Basel','Basel-Stadt','40##'],['Bern','Bern','30##'],['Lucerne','Lucerne','60##'],['St. Gallen','St. Gallen','90##']] },
  ru_RU:{ country:'Russia', tax:'RU', style:'C', phone:'495 555 ## ##',
    name:()=>pick(['Restaurant Golden Ear','Cafe Berezka','Tavern at Ivan’s','Siberia Dumpling House','Canteen No. 1','Restaurant Volga','Cafe Podkova','Maslenitsa Pancake House','Restaurant Three Bears','Chaikhana Vostok']),
    street:()=>`${num(1,150)} ${pick(['Lenina','Tverskaya','Pushkina','Gagarina','Mira','Sovetskaya','Sadovaya','Pobedy','Kirova','Gorkogo'])} Street`,
    cities:[['Moscow','Moscow','1#####'],['Saint Petersburg','Saint Petersburg','19####'],['Novosibirsk','Novosibirsk Oblast','63####'],['Yekaterinburg','Sverdlovsk Oblast','62####'],['Kazan','Republic of Tatarstan','42####']] },
  ru_KZ:{ country:'Kazakhstan', tax:'KZ', style:'C', phone:'727 555 ## ##',
    name:()=>pick(['Restaurant Alatau','Cafe Bastau','Chaikhana Shanyrak','Restaurant Dostyk','Cafe Zhailau','Beshbarmak House','Restaurant Samal','Cafe Nur','Astana Coffee House','Restaurant Sunkar']),
    street:()=>`${num(1,150)} ${pick(['Abay','Dostyk','Nazarbayev','Tole Bi','Satpayev','Zheltoksan','Kabanbay Batyr','Al-Farabi','Tauke Khan','Gogol'])} Street`,
    cities:[['Almaty','Almaty','0500##'],['Astana','Astana','0100##'],['Shymkent','Shymkent','1600##'],['Karaganda','Karaganda Region','1000##'],['Aktobe','Aktobe Region','0300##']] },
  es_AR:{ country:'Argentina', tax:'AR', style:'D', phone:'11 5555 ####',
    name:()=>pick(['Parrilla El Gaucho','La Cantina del Puerto','Café Palermo','Restaurante El Asador','Bodegón San Telmo','Pizzería La Esquina','Parrilla La Estancia','Rotisería El Palenque','Confitería La Plaza','Cervecería La Costanera']),
    street:()=>`${pick(['Avenida','Calle'])} ${pick(['Corrientes','Santa Fe','Rivadavia','San Martín','Belgrano','Libertador','Mitre','9 de Julio','Sarmiento','Alvear'])} ${num(1,5000)}`,
    cities:[['Buenos Aires','Autonomous City of Buenos Aires','1###'],['Córdoba','Córdoba','50##'],['Rosario','Santa Fe','20##'],['Mendoza','Mendoza','55##'],['La Plata','Buenos Aires','19##']] },
  es_CL:{ country:'Chile', tax:'CL', style:'D', phone:'2 2555 ####',
    name:()=>pick(['Restaurante El Parrón','Picada Don Lucho','Café Valparaíso','Marisquería El Puerto','Cocinería La Rueda','Restaurante Cordillera','Bar Central','Casa del Pastel de Choclo','Sándwichería El Lomito','Fuente Pacífico']),
    street:()=>`${pick(['Calle','Avenida','Pasaje'])} ${pick(['Providencia','Libertador Bernardo O’Higgins','Los Leones','Condell','Pedro de Valdivia','Arturo Prat','Manuel Montt','Vicuña Mackenna','Irarrázaval','Las Condes'])} ${num(1,3500)}`,
    cities:[['Santiago','Santiago Metropolitan Region','8######'],['Valparaíso','Valparaíso','23#####'],['Concepción','Biobío','40#####'],['Antofagasta','Antofagasta','12#####'],['Viña del Mar','Valparaíso','25#####']] },
  es_MX:{ country:'Mexico', tax:'MX', style:'D', phone:'55 5555 ####',
    name:()=>pick(['Taquería El Güero','Restaurante La Hacienda','Cantina Los Arcos','Fonda Doña Lupe','Mariscos El Puerto','Cocina Oaxaqueña','Tacos El Primo','Antojitos La Abuela','Restaurante Casa Azul','Pozolería El Fogón']),
    street:()=>`${pick(['Calle','Avenida','Paseo'])} ${pick(['Reforma','Insurgentes','Juárez','Hidalgo','Morelos','Revolución','Madero','Independencia','Allende','Guerrero'])} ${num(1,999)}`,
    cities:[['Mexico City','Mexico City','0####'],['Guadalajara','Jalisco','44###'],['Monterrey','Nuevo León','64###'],['Puebla','Puebla','72###'],['Querétaro','Querétaro','76###']] },
  es_DO:{ country:'Dominican Republic', tax:'DO', style:'D', phone:'809 555 ####',
    name:()=>pick(['Restaurante El Conuco','Comedor Doña Carmen','Pica Pollo El Rey','Marisquería Playa Dorada','Café Colonial','Cafetería La Esquina','Restaurante Sabor Criollo','Parrillada El Malecón','Colmado Don Pepe','Sancocho de la Abuela']),
    street:()=>`${pick(['Calle','Avenida'])} ${pick(['Duarte','Máximo Gómez','Winston Churchill','Abraham Lincoln','Independencia','27 de Febrero','Sarasota','Mella','Sánchez','Luperón'])} ${num(1,300)}`,
    cities:[['Santo Domingo','National District','101##'],['Santiago de los Caballeros','Santiago','51000'],['Puerto Plata','Puerto Plata','57000'],['La Romana','La Romana','22000'],['Punta Cana','La Altagracia','23000']] },
  es_PR:{ country:'Puerto Rico', tax:'PR', style:'A', phone:'787 555 ####',
    name:()=>pick(['Restaurante El Yunque','Fonda La Criolla','Lechonera Los Amigos','Cafetería El Viejo San Juan','Mofongo y Más','Restaurante Playa Azul','Kiosco La Parguera','Panadería La Borinqueña','Marisquería El Faro','Cocina Tradicional']),
    street:()=>`${pick(['Calle','Avenida','Paseo'])} ${pick(['Luna','San Francisco','Fortaleza','Ponce de León','Muñoz Rivera','Condado','Loíza','Cristo','Sol','Tetuán'])} ${num(1,999)}`,
    cities:[['San Juan','PR','009##'],['Ponce','PR','007##'],['Mayagüez','PR','006##'],['Caguas','PR','007##'],['Bayamón','PR','009##']] },
  de_AT:{ country:'Austria', tax:'AT', style:'D', phone:'01 555 ####',
    name:()=>pick(['Gasthaus zum Goldenen Hirschen','Wirtshaus Zur Linde','Café Central','Gasthof Zum Löwen','Heuriger Huber','Stüberl am Eck','Landgasthaus Alpenblick','Beisl Zum Schwarzen Adler','Restaurant Donaublick','Kaffeehaus Wien']),
    street:()=>`${pick(['Haupt','Bahnhof','Mariahilfer','Linzer','Kärntner','Schubert','Mozart','Rathaus','Garten','Kirchen'])}${pick(['straße','gasse','platz','weg'])} ${num(1,150)}`,
    cities:[['Vienna','Vienna','1###'],['Graz','Styria','80##'],['Linz','Upper Austria','40##'],['Salzburg','Salzburg','50##'],['Innsbruck','Tyrol','60##']] },
  nl_BE:{ country:'Belgium', tax:'BE', style:'D', phone:'02 555 ## ##',
    name:()=>pick(['Brasserie De Gouden Leeuw','Restaurant De Zwaan','Estaminet Het Hoekske','Taverne De Kroon','Eetcafé De Pelikaan','Bistro Den Dijk','Brouwershuis','Café De Markt','Frituur De Hoek','Restaurant Scheldeblik']),
    street:()=>`${pick(['Kerk','Markt','Station','Molen','Nieuw','Oud','Brug','School','Koning','Dorp','Hoog','Schelde'])}${pick(['straat','laan','plein','weg'])} ${num(1,150)}`,
    cities:[['Antwerp','Antwerp','2###'],['Ghent','East Flanders','90##'],['Bruges','West Flanders','80##'],['Leuven','Flemish Brabant','30##'],['Hasselt','Limburg','35##']] },
  cs_CZ:{ country:'Czechia', tax:'CZ', style:'D', phone:'221 555 ###',
    name:()=>pick(['Restaurace U Zlatého Lva','Hospoda U Kocoura','Pivnice Na Růžku','Restaurace U Fleků','Kavárna Slavia','Vinárna U Sklípku','Bistro Praha','Restaurace U Tří Housliček','Hostinec U Mostu','Pohostinství Sokolovna']),
    street:()=>`${pick(['Nádražní','Hlavní','Masarykova','Husova','Palackého','Školní','Zahradní','Jiráskova','Komenského','Dlouhá','Mlýnská','Krátká'])} ${num(1,150)}`,
    cities:[['Prague','Prague','1## ##'],['Brno','South Moravian Region','6## ##'],['Ostrava','Moravian-Silesian Region','70# ##'],['Plzeň','Plzeň Region','3## ##'],['Liberec','Liberec Region','46# ##']] },
  da_DK:{ country:'Denmark', tax:'DK', style:'D', phone:'32 55 ## ##',
    name:()=>pick(['Restaurant Hygge','Smørrebrød Huset','Café Nordlys','Kro & Køkken','Bistro Havnen','Det Gamle Bageri','Madkælderen','Restaurant Fyrtårnet','Brasserie Kongens','Spisehuset']),
    street:()=>`${pick(['Vester','Øster','Nørre','Søndre','Kirke','Skole','Havne','Bred','Lang','Torve','Mølle','Slots'])}${pick(['gade','vej','allé','stræde'])} ${num(1,150)}`,
    cities:[['Copenhagen','Capital Region','1###'],['Aarhus','Central Denmark','80##'],['Odense','Southern Denmark','50##'],['Aalborg','North Denmark','90##'],['Esbjerg','Southern Denmark','67##']] },
  el_GR:{ country:'Greece', tax:'GR', style:'D', phone:'210 555 ####',
    name:()=>pick(['Taverna O Kostas','Restaurant Ilios','Fish Taverna Galini','Ouzeri To Steki','Kafeneio O Platanos','Mezedopoleio Archontiko','Taverna To Archontiko','Restaurant Akrogiali','Grill House I Fotia','Cafe I Plateia']),
    street:()=>`${pick(['Ermou','Amalias','Aristotelous','Kolokotroni','Ippokratous','Papadiamanti','Megalou Alexandrou','Stadiou'])} ${pick(['Street','Avenue'])} ${num(1,150)}`,
    cities:[['Athens','Attica','1## ##'],['Thessaloniki','Central Macedonia','54# ##'],['Patras','Western Greece','26# ##'],['Heraklion','Crete','71# ##'],['Larissa','Thessaly','41# ##']] },
  fr_LU:{ country:'Luxembourg', tax:'LU', style:'D', phone:'26 55 ## ##',
    name:()=>pick(['Brasserie de la Gare','Café du Théâtre','Restaurant Le Grand-Duc','Auberge de la Moselle','Bistro des Ardennes','Chez Jos','Le Petit Luxembourg','Maison Gaasch','Restaurant Le Pont','Taverne Saint-Michel']),
    street:()=>`${num(1,180)} ${pick(['Rue','Avenue','Boulevard','Place'])} ${pick(['de la Gare','Grande-Duchesse Charlotte','de la Liberté','du Fort Neipperg','Adolphe','de la Poste','des Bains','du Marché'])}`,
    cities:[['Luxembourg','Luxembourg','1###'],['Esch-sur-Alzette','Esch-sur-Alzette','40##'],['Dudelange','Esch-sur-Alzette','34##'],['Ettelbruck','Diekirch','90##']] },
  pl_PL:{ country:'Poland', tax:'PL', style:'D', phone:'22 555 ## ##',
    name:()=>pick(['Restauracja Pod Lipą','Bar Mleczny Pod Kogutem','Karczma Rzym','Pierogarnia Babcia','Restauracja Stary Młyn','Bistro Wawel','Gospoda Pod Dębem','Kawiarnia Kometa','Restauracja Smaki Polski','Zajazd Pod Orłem']),
    street:()=>`ul. ${pick(['Długa','Marszałkowska','Piłsudskiego','Kościuszki','Mickiewicza','Słowackiego','Polna','Ogrodowa','Lipowa','Floriańska','Świętokrzyska','Szeroka'])} ${num(1,150)}`,
    cities:[['Warsaw','Masovian','0#-###'],['Kraków','Lesser Poland','3#-###'],['Wrocław','Lower Silesian','5#-###'],['Gdańsk','Pomeranian','80-###'],['Poznań','Greater Poland','6#-###']] },
  ro_RO:{ country:'Romania', tax:'RO', style:'D', phone:'021 555 ####',
    name:()=>pick(['Restaurantul La Mama','Crama Veche','Casa Bunicii','Hanul Domnesc','Cafeneaua București','Restaurant Cetate','La Ciobanul','Terasa Parc','Pizzeria Roma','Bistro Carpați']),
    street:()=>`${pick(['Strada','Bulevardul','Aleea'])} ${pick(['Victoriei','Unirii','Libertății','Eminescu','Republicii','Mihai Viteazu','Ștefan cel Mare','Păcii','Florilor','Independenței'])} ${num(1,120)}`,
    cities:[['Bucharest','Bucharest','0#####'],['Cluj-Napoca','Cluj','4#####'],['Timișoara','Timiș','3#####'],['Iași','Iași','7#####'],['Constanța','Constanța','9#####']] },
  sl_SI:{ country:'Slovenia', tax:'SI', style:'D', phone:'01 555 ## ##',
    name:()=>pick(['Gostilna Pri Lipi','Restavracija Zlata Ladja','Gostilna Pri Mostu','Okrepčevalnica Triglav','Kavarna Evropa','Gostišče Pod Gradom','Restavracija Vila Bled','Pizzerija Napoli','Gostilna Šestica','Bistro Soča']),
    street:()=>`${pick(['Slovenska','Prešernova','Trubarjeva','Cankarjeva','Gosposka','Tržaška','Celovška','Ljubljanska','Mariborska','Vodnikova'])} ${pick(['cesta','ulica'])} ${num(1,100)}`,
    cities:[['Ljubljana','Central Slovenia','1###'],['Maribor','Drava','2000'],['Celje','Savinja','3000'],['Kranj','Upper Carniola','4000'],['Koper','Coastal-Karst','6000']] },
  fi_FI:{ country:'Finland', tax:'FI', style:'D', phone:'09 555 ####',
    name:()=>pick(['Ravintola Kultainen Kala','Kahvila Sininen Talo','Bistro Pohjola','Ravintola Saaristo','Kievari Myllärin Tupa','Ravintola Revontuli','Kellarikuja','Ravintola Koivu','Hertta & Hovi','Kahvila Satama']),
    street:()=>`${pick(['Kirkko','Kauppa','Aleksanteri','Mannerheimin','Satama','Koulu','Puisto','Asema','Ranta','Hämeen','Kuninkaan','Torni'])}${pick(['katu','tie','kuja','polku','tori'])} ${num(1,120)}`,
    cities:[['Helsinki','Uusimaa','00###'],['Espoo','Uusimaa','02###'],['Tampere','Pirkanmaa','33###'],['Turku','Southwest Finland','20###'],['Oulu','North Ostrobothnia','90###']] },
  pt_PT:{ country:'Portugal', tax:'PT', style:'D', phone:'21 ### ####',
    name:()=>pick(['Tasca do Zé','Restaurante O Fado','Cervejaria Ribeira','Casa de Pasto Avenida','Adega do Mar','A Tasquinha','Marisqueira Atlântico','Taberna do Largo','O Cantinho Lusitano','Pastelaria Central']),
    street:()=>`${pick(['Rua','Avenida','Travessa','Largo','Praça'])} ${pick(['da Liberdade','25 de Abril','do Comércio','Dom Dinis','de Camões','da República','dos Descobrimentos','Infante Dom Henrique','da Boavista','de Santa Catarina'])}, ${num(1,200)}`,
    cities:[['Lisbon','Lisbon','1000-###'],['Porto','Porto','4000-###'],['Coimbra','Coimbra','3000-###'],['Faro','Faro','8000-###'],['Braga','Braga','4700-###']] },
  nb_NO:{ country:'Norway', tax:'NO', style:'D', phone:'22 55 ## ##',
    name:()=>pick(['Restaurant Fjordbris','Bistro Nordlys','Kafé Fyrlykten','Gamle Mølla','Brasserie Bryggen','Kro & Kjøkken','Det Blå Hjørnet','Smak av Norge','Matstuen','Havnekjelleren']),
    street:()=>`${pick(['Kirke','Storgata','Kong Haakon','Dronning Mauds','Strand','Skole','Havne','Bryggen','Fjord','Torg','Nedre','Øvre'])}${pick(['gata','veien','plass','allé'])} ${num(1,120)}`,
    cities:[['Oslo','Oslo','0###'],['Bergen','Vestland','50##'],['Trondheim','Trøndelag','70##'],['Stavanger','Rogaland','40##'],['Tromsø','Troms','90##']] },
  hu_HU:{ country:'Hungary', tax:'HU', style:'D', phone:'1 555 ####',
    name:()=>pick(['Gulyás Csárda','Étterem a Hídnál','Bistro Paprika','Kéknyelű Vendéglő','Arany Szarvas Étterem','Fehér Asztal','Csemege Kisvendéglő','Tokaji Borozó','Hortobágyi Csárda','Kávéház Központ']),
    street:()=>`${pick(['Fő','Kossuth Lajos','Petőfi Sándor','Széchenyi','Rákóczi','Árpád','Ady Endre','Bartók Béla','Deák Ferenc','Arany János','Jókai','Templom'])} ${pick(['utca','tér','út','körút'])} ${num(1,120)}`,
    cities:[['Budapest','Budapest','1###'],['Debrecen','Hajdú-Bihar','40##'],['Szeged','Csongrád-Csanád','67##'],['Pécs','Baranya','76##'],['Győr','Győr-Moson-Sopron','90##']] },
  pt_BR:{ country:'Brazil', tax:'BR', style:'F', phone:'11 9####-####',
    name:()=>pick(['Churrascaria Boi Gordo','Cantinho do Sabor','Restaurante Sabor da Terra','Bar do Zé','Casa da Feijoada','Pizzaria Bella Massa','Fogão de Lenha','Sabor Mineiro','Cozinha da Vovó','Mar & Brasa']),
    street:()=>`${pick(['Rua','Avenida','Travessa','Alameda'])} ${pick(['das Flores','Sete de Setembro','Brasil','XV de Novembro','Paulista','dos Andradas','Getúlio Vargas','das Palmeiras','Tiradentes','São João'])}, ${num(1,2500)}`,
    cities:[['São Paulo','SP','01###-###'],['Rio de Janeiro','RJ','20###-###'],['Brasília','DF','70###-###'],['Curitiba','PR','80###-###'],['Belo Horizonte','MG','30###-###']] },
  ja_JP:{ country:'Japan', tax:'JP', style:'X', phone:'03-####-####',
    name:()=>pick(['Robata Torikichi','Sushi Takumi','Ramen Ichiban','Izakaya Maru','Tempura Hana','Yakiniku Dairaku','Soba Fuji','Kushiyaki Toriman','Unagi Matsuba','Cafe Sakura']),
    street:()=>`${num(1,6)}-${num(1,30)}-${num(1,20)} ${pick(['Chuo','Honcho','Sakae','Ekimae','Shinmachi','Dogenzaka','Ginza','Kanda','Sakuragi','Minato'])}`,
    cities:[['Shibuya-ku','Tokyo','1##-####'],['Shinjuku-ku','Tokyo','16#-####'],['Osaka','Osaka','53#-####'],['Kyoto','Kyoto','60#-####'],['Sapporo','Hokkaido','06#-####']] },
};



/* ---------- more cities so most states / regions have an entry ---------- */
const EXTRA_CITIES = {
  en_US:[['San Francisco','CA','941##'],['San Diego','CA','921##'],['Dallas','TX','752##'],['Buffalo','NY','142##'],['Orlando','FL','328##'],
    ['Philadelphia','PA','191##'],['Phoenix','AZ','850##'],['Columbus','OH','432##'],['Detroit','MI','482##'],['Portland','OR','972##'],
    ['Las Vegas','NV','891##'],['Nashville','TN','372##'],['New Orleans','LA','701##'],['Minneapolis','MN','554##'],['St. Louis','MO','631##'],
    ['Charlotte','NC','282##'],['Richmond','VA','232##'],['Baltimore','MD','212##'],['Salt Lake City','UT','841##'],['Milwaukee','WI','532##'],
    ['Indianapolis','IN','462##'],['Honolulu','HI','968##'],['Oklahoma City','OK','731##'],['Louisville','KY','402##'],['Washington','DC','200##']],
  en_CA:[['Halifax','NS','B3$ #$#'],['Edmonton','AB','T5$ #$#'],['Quebec City','QC','G1$ #$#'],['Victoria','BC','V8$ #$#'],['Saskatoon','SK','S7$ #$#'],
    ['St. John’s','NL','A1$ #$#'],['Fredericton','NB','E3$ #$#']],
  en_AU:[['Gold Coast','QLD','42##'],['Newcastle','NSW','23##'],['Geelong','VIC','32##'],['Darwin','NT','08##'],['Cairns','QLD','48##']],
  en_GB:[['Belfast','Northern Ireland','BT# #$$'],['Glasgow','Scotland','G## #$$'],['Liverpool','England','L# #$$'],['Newcastle upon Tyne','England','NE# #$$'],['Swansea','Wales','SA# #$$']],
  en_NZ:[['Tauranga','Bay of Plenty','31##'],['Queenstown','Otago','93##'],['Napier','Hawke’s Bay','41##']],
  en_IN:[['Kolkata','West Bengal','700###','19'],['Ahmedabad','Gujarat','380###','24'],['Jaipur','Rajasthan','302###','08'],['Lucknow','Uttar Pradesh','226###','09'],
    ['Kochi','Kerala','682###','32'],['Chandigarh','Chandigarh','160###','04']],
  de_DE:[['Dresden','Saxony','01###'],['Hanover','Lower Saxony','30###'],['Nuremberg','Bavaria','90###'],['Düsseldorf','North Rhine-Westphalia','40###'],['Bremen','Bremen','28###']],
  fr_FR:[['Strasbourg','Grand Est','670##'],['Lille','Hauts-de-France','590##'],['Nantes','Pays de la Loire','440##'],['Montpellier','Occitanie','340##'],['Rennes','Brittany','350##']],
  es_ES:[['Zaragoza','Aragón','500##'],['Málaga','Andalusia','290##'],['Palma','Balearic Islands','070##'],['Murcia','Region of Murcia','300##']],
  it_IT:[['Bologna','BO','401##'],['Genoa','GE','161##'],['Palermo','PA','901##'],['Verona','VR','371##'],['Bari','BA','701##']],
  nl_NL:[['Groningen','Groningen','97## @@'],['Maastricht','Limburg','62## @@'],['Arnhem','Gelderland','68## @@']],
  sv_SE:[['Linköping','Östergötland','58# ##'],['Örebro','Örebro County','70# ##'],['Umeå','Västerbotten','90# ##']],
  pt_BR:[['Salvador','BA','40###-###'],['Recife','PE','50###-###'],['Porto Alegre','RS','90###-###'],['Fortaleza','CE','60###-###'],['Manaus','AM','69###-###']],
  ja_JP:[['Nagoya','Aichi','460-####'],['Fukuoka','Fukuoka','810-####'],['Yokohama','Kanagawa','231-####'],['Hiroshima','Hiroshima','730-####']],
};
for (const k in EXTRA_CITIES) LOCALES[k].cities.push(...EXTRA_CITIES[k]);
/* ---------- plain-English output: strip accents and special letters (Søndre -> Sondre, Straße -> Strasse) ---------- */
const PLAIN_MAP = {'ø':'o','Ø':'O','æ':'ae','Æ':'AE','œ':'oe','Œ':'OE','ß':'ss','ð':'d','Ð':'D','þ':'th','Þ':'Th','ł':'l','Ł':'L','đ':'d','Đ':'D','ı':'i','’':"'",'‘':"'",'–':'-','—':'-','°':''};
const DE_MAP = {'ä':'ae','ö':'oe','ü':'ue','Ä':'Ae','Ö':'Oe','Ü':'Ue'};   // German-language locales use the standard ae/oe/ue spelling
const plain = (s, code) => { const de = /^de_/.test(code || '');
  return String(s).replace(/[^\u0000-\u007F]/g, ch => (de && DE_MAP[ch]) || (ch in PLAIN_MAP ? PLAIN_MAP[ch] : ch)).normalize('NFD').replace(/[̀-ͯ]/g, ''); };
for (const k in LOCALES) LOCALES[k].code = k;



/* full names for abbreviated regions (used for labels and for dropdowns that list full names) */
const REGION_NAMES = {};
const _RN = ({ US:{NY:'New York',CA:'California',IL:'Illinois',TX:'Texas',WA:'Washington',FL:'Florida',CO:'Colorado',MA:'Massachusetts',GA:'Georgia',PA:'Pennsylvania',AZ:'Arizona',OH:'Ohio',MI:'Michigan',OR:'Oregon',NV:'Nevada',TN:'Tennessee',LA:'Louisiana',MN:'Minnesota',MO:'Missouri',NC:'North Carolina',VA:'Virginia',MD:'Maryland',UT:'Utah',WI:'Wisconsin',IN:'Indiana',HI:'Hawaii',OK:'Oklahoma',KY:'Kentucky',DC:'District of Columbia'},
   CA:{ON:'Ontario',BC:'British Columbia',QC:'Quebec',AB:'Alberta',MB:'Manitoba',NS:'Nova Scotia',SK:'Saskatchewan',NL:'Newfoundland and Labrador',NB:'New Brunswick'},
   AU:{NSW:'New South Wales',VIC:'Victoria',QLD:'Queensland',WA:'Western Australia',SA:'South Australia',TAS:'Tasmania',ACT:'Australian Capital Territory',NT:'Northern Territory'},
   BR:{SP:'São Paulo',RJ:'Rio de Janeiro',DF:'Distrito Federal',PR:'Paraná',MG:'Minas Gerais',BA:'Bahia',PE:'Pernambuco',RS:'Rio Grande do Sul',CE:'Ceará',AM:'Amazonas'},
   IT:{RM:'Rome',MI:'Milan',NA:'Naples',TO:'Turin',FI:'Florence',BO:'Bologna',GE:'Genoa',PA:'Palermo',VR:'Verona',BA:'Bari'} })

for (const cc in _RN) for (const ab in _RN[cc]) REGION_NAMES[cc+'_'+ab] = _RN[cc][ab];

const regionOf = (L, c) => plain(c[1], L.code);
function regionsFor(code){ const L = LOCALES[code]; return [...new Set(L.cities.map(c => regionOf(L, c)))].sort((a,b) => a.localeCompare(b)); }
function regionLabel(code, r){ const n = REGION_NAMES[code.slice(-2)+'_'+r]; return n && plain(n, code) !== r ? `${r} — ${plain(n, code)}` : r; }


function resolveRegion(code, text){          // '' = any; null = not recognised
  const q = (text || '').trim(); if (!q) return '';
  const n = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
  const nq = n(q); if (!nq) return null;
  const list = regionsFor(code), cc = code.slice(-2);
  const names = r => [r, REGION_NAMES[cc+'_'+r], regionLabel(code, r)].filter(Boolean).map(n);
  let hit = list.filter(r => names(r).includes(nq));                       // NY, ny, "New York", newyork, "NY — New York"
  if (hit.length === 1) return hit[0];
  if (nq.length >= 3){ hit = list.filter(r => names(r).some(x => x.startsWith(nq))); if (hit.length === 1) return hit[0]; }  // "wash" -> Washington
  return null;
}


/* ---------- real, commonly accepted postal codes per city ----------
   Plain strings are real postcodes used as-is. Tokens: # digit, @ letter, $ letter (no D F I O Q U),
   ^ UK inward letter, & Eircode letter. Where full lists are impractical (UK, CA, IE, NL) we use REAL districts with a
   format-valid ending, which passes format validators and district checks. */
const rng = (a, b, w = 5) => Array.from({ length: b - a + 1 }, (_, i) => String(a + i).padStart(w, '0'));
const W5 = s => s.split(' ');
const POSTAL = {
  en_US:{ 'New York':W5('10001 10003 10010 10011 10012 10013 10014 10016 10017 10018 10019 10021 10022 10023 10024 10025 10028 10036'),
    'Los Angeles':W5('90012 90013 90014 90015 90017 90021 90024 90025 90034 90036 90046 90048 90064 90066'),
    'Chicago':W5('60601 60602 60605 60606 60607 60610 60611 60614 60622 60654 60657 60661'),
    'Houston':W5('77002 77003 77004 77006 77007 77019 77027 77056'),
    'Seattle':W5('98101 98102 98103 98104 98105 98109 98112 98115 98122'),
    'Miami':W5('33127 33130 33131 33132 33133 33137 33138 33139 33140 33145'),
    'Denver':W5('80202 80203 80204 80205 80206 80209 80210 80211 80218'),
    'Boston':W5('02108 02109 02110 02111 02114 02115 02116 02118 02127 02210'),
    'Austin':W5('78701 78702 78703 78704 78705 78721 78722 78731 78741 78751 78756'),
    'Atlanta':W5('30303 30305 30306 30308 30309 30312 30313 30316 30318 30324'),
    'San Francisco':W5('94102 94103 94105 94107 94108 94109 94110 94111 94114 94115 94117 94118 94121 94122 94123 94133'),
    'San Diego':W5('92101 92102 92103 92104 92105 92106 92107 92109 92110 92113 92115 92116 92122'),
    'Dallas':W5('75201 75202 75204 75205 75206 75207 75214 75219 75225 75226 75231'),
    'Buffalo':W5('14201 14202 14203 14204 14207 14209 14210 14213 14214 14222'),
    'Orlando':W5('32801 32803 32804 32806 32807 32809 32811 32819 32822 32835'),
    'Philadelphia':W5('19102 19103 19104 19106 19107 19115 19123 19125 19130 19146 19147'),
    'Phoenix':W5('85003 85004 85006 85007 85008 85012 85013 85014 85016 85018 85020'),
    'Columbus':W5('43201 43202 43204 43206 43209 43212 43215'),
    'Detroit':W5('48201 48202 48207 48208 48214 48216 48226 48243'),
    'Portland':W5('97201 97202 97204 97205 97209 97210 97211 97214 97215 97232'),
    'Las Vegas':W5('89101 89102 89103 89104 89106 89109 89118 89119 89121 89169'),
    'Nashville':W5('37201 37203 37204 37205 37206 37207 37208 37209 37210 37212 37215'),
    'New Orleans':W5('70112 70113 70115 70116 70117 70118 70119 70122 70130'),
    'Minneapolis':W5('55401 55402 55403 55404 55405 55407 55408 55411 55413 55414 55454'),
    'St. Louis':W5('63101 63102 63103 63104 63108 63109 63110 63116 63118 63139'),
    'Charlotte':W5('28202 28203 28204 28205 28206 28207 28209 28210 28211 28216'),
    'Richmond':W5('23219 23220 23221 23223 23224 23225 23226 23227 23230 23231'),
    'Baltimore':W5('21201 21202 21205 21206 21211 21213 21217 21218 21224 21230 21231'),
    'Salt Lake City':W5('84101 84102 84103 84104 84105 84106 84111 84115 84116'),
    'Milwaukee':W5('53202 53203 53204 53205 53206 53207 53208 53209 53211 53212 53215'),
    'Indianapolis':W5('46201 46202 46203 46204 46205 46208 46220 46225 46227 46240'),
    'Honolulu':W5('96813 96814 96815 96816 96817 96818 96819 96822 96826'),
    'Oklahoma City':W5('73102 73103 73104 73105 73106 73107 73108 73109 73112 73116'),
    'Louisville':W5('40202 40203 40204 40205 40206 40207 40208 40209 40210 40212'),
    'Washington':W5('20001 20002 20003 20004 20005 20007 20009 20010 20016 20036') },
  en_CA:{ 'Toronto':['M5V #$#','M5H #$#','M5J #$#','M5A #$#','M5B #$#','M5C #$#','M5E #$#','M5G #$#','M5S #$#','M5T #$#','M4W #$#','M4Y #$#','M6J #$#','M6K #$#','M4E #$#'],
    'Vancouver':['V6B #$#','V6C #$#','V6E #$#','V6G #$#','V6H #$#','V6J #$#','V6K #$#','V5T #$#','V5Y #$#','V6Z #$#'],
    'Montreal':['H2X #$#','H2Y #$#','H3B #$#','H3A #$#','H3G #$#','H2L #$#','H2T #$#','H4C #$#'],
    'Calgary':['T2P #$#','T2R #$#','T2G #$#','T3E #$#','T2E #$#','T2S #$#'],
    'Ottawa':['K1P #$#','K1N #$#','K1R #$#','K2P #$#','K1S #$#','K1Y #$#'],
    'Winnipeg':['R3C #$#','R3B #$#','R3L #$#','R3M #$#','R3G #$#','R2M #$#'],
    'Halifax':['B3H #$#','B3J #$#','B3K #$#','B3L #$#','B3M #$#'],
    'Edmonton':['T5J #$#','T5K #$#','T6E #$#','T5H #$#','T6G #$#'],
    'Quebec City':['G1R #$#','G1K #$#','G1V #$#','G1S #$#'],
    'Victoria':['V8V #$#','V8W #$#','V8T #$#','V8R #$#','V9A #$#'],
    'Saskatoon':['S7K #$#','S7N #$#','S7H #$#','S7J #$#'],
    'St. John’s':['A1C #$#','A1B #$#','A1A #$#','A1E #$#'],
    'Fredericton':['E3A #$#','E3B #$#','E3C #$#'] },
  en_GB:{ 'London':['SW1A 1AA','SW1A 2AA','EC1A 1BB','W1A 0AX','WC2N 5DU','EC2R #^^','EC3A #^^','EC4A #^^','WC1B #^^','WC2H #^^','W1D #^^','W1F #^^','W1K #^^','W1T #^^','SW1V #^^','SW3 #^^','SW7 #^^','SE1 #^^','SE10 #^^','E1 #^^','E2 #^^','E8 #^^','E14 #^^','N1 #^^','NW1 #^^'],
    'Manchester':['M1 #^^','M2 #^^','M3 #^^','M4 #^^','M15 #^^','M14 #^^','M20 #^^','M60 #^^'],
    'Birmingham':['B1 #^^','B2 #^^','B3 #^^','B4 #^^','B5 #^^','B15 #^^','B16 #^^','B18 #^^'],
    'Edinburgh':['EH1 #^^','EH2 #^^','EH3 #^^','EH8 #^^','EH6 #^^','EH12 #^^'],
    'Bristol':['BS1 #^^','BS2 #^^','BS3 #^^','BS6 #^^','BS8 #^^'],
    'Leeds':['LS1 #^^','LS2 #^^','LS3 #^^','LS6 #^^','LS7 #^^','LS11 #^^'],
    'Cardiff':['CF10 #^^','CF11 #^^','CF14 #^^','CF24 #^^','CF5 #^^'],
    'Belfast':['BT1 #^^','BT2 #^^','BT7 #^^','BT9 #^^','BT3 #^^'],
    'Glasgow':['G1 #^^','G2 #^^','G3 #^^','G12 #^^','G4 #^^'],
    'Liverpool':['L1 #^^','L2 #^^','L3 #^^','L8 #^^','L17 #^^'],
    'Newcastle upon Tyne':['NE1 #^^','NE2 #^^','NE3 #^^','NE4 #^^','NE6 #^^'],
    'Swansea':['SA1 #^^','SA2 #^^','SA3 #^^','SA4 #^^'] },
  en_AU:{ 'Sydney':W5('2000 2007 2010 2011 2015 2017 2021 2026 2034 2041 2060 2065 2095'),
    'Melbourne':W5('3000 3002 3004 3006 3008 3051 3053 3065 3121 3141 3181'),
    'Brisbane':W5('4000 4005 4006 4064 4101 4169'), 'Perth':W5('6000 6003 6004 6008 6009 6010 6050 6160'),
    'Adelaide':W5('5000 5006 5067 5081'), 'Hobart':W5('7000 7004 7005 7008'),
    'Canberra':W5('2600 2601 2602 2603 2604 2612 2617'), 'Gold Coast':W5('4217 4218 4220 4221 4226'),
    'Newcastle':W5('2300 2302 2303 2304 2290'), 'Geelong':W5('3220 3216 3217 3218'),
    'Darwin':W5('0800 0810 0820 0828'), 'Cairns':W5('4870 4868 4869 4879') },
  en_NZ:{ 'Auckland':W5('1010 1011 1021 1023 1051 1060 1061 1072'), 'Wellington':W5('6011 6012 6021 6035 6037'),
    'Christchurch':W5('8011 8013 8014 8041 8024'), 'Hamilton':W5('3200 3204 3216 3240'), 'Dunedin':W5('9016 9012 9010 9054'),
    'Tauranga':W5('3110 3112 3116 3141'), 'Queenstown':W5('9300 9304 9371'), 'Napier':W5('4110 4112') },
  en_IE:{ 'Dublin':['D01 &###','D02 &###','D04 &###','D06 &###','D07 &###','D08 &###','D09 &###','D12 &###','D15 &###','D18 &###'],
    'Cork':['T12 &###','T23 &###'], 'Galway':['H91 &###'], 'Limerick':['V94 &###'] },
  en_IN:{ 'Mumbai':W5('400001 400002 400003 400005 400020 400050 400051 400053 400069'),
    'Delhi':W5('110001 110002 110003 110005 110016 110017 110024 110048 110049'),
    'Bengaluru':W5('560001 560002 560008 560011 560025 560034 560038 560066 560095 560102'),
    'Chennai':W5('600001 600002 600004 600006 600017 600020 600028 600034 600040'),
    'Hyderabad':W5('500001 500003 500004 500016 500032 500033 500034 500081 500082'),
    'Pune':W5('411001 411002 411004 411005 411014 411038 411045 411057'),
    'Kolkata':W5('700001 700004 700006 700016 700019 700020 700027 700091'),
    'Ahmedabad':W5('380001 380006 380009 380015 380054'), 'Jaipur':W5('302001 302004 302006 302015 302017 302020'),
    'Lucknow':W5('226001 226010 226016 226018 226024'), 'Kochi':W5('682001 682016 682020 682024 682030 682035'),
    'Chandigarh':W5('160017 160022 160036 160047') },
  de_DE:{ 'Berlin':W5('10115 10117 10119 10178 10243 10405 10437 10585 10623 10707 10961 12043'),
    'Munich':W5('80331 80333 80335 80469 80539 80636 80687 80801 80939 81241'),
    'Hamburg':W5('20095 20097 20144 20146 20253 20354 20457 22083 22765'),
    'Cologne':W5('50667 50668 50672 50674 50676 50823 50935 50968'),
    'Frankfurt':W5('60311 60313 60314 60316 60318 60323 60385 60486'),
    'Stuttgart':W5('70173 70174 70178 70182 70190 70372 70469 70563'),
    'Dresden':W5('01067 01069 01099 01307 01309'), 'Hanover':W5('30159 30161 30163 30169 30171 30451 30559'),
    'Nuremberg':W5('90402 90403 90408 90409 90419 90429 90443'),
    'Düsseldorf':W5('40210 40211 40212 40213 40217 40233 40474 40545'), 'Bremen':W5('28195 28203 28205 28209 28211 28217 28325') },
  fr_FR:{ 'Paris':rng(75001,75020), 'Lyon':rng(69001,69009), 'Marseille':rng(13001,13016),
    'Toulouse':W5('31000 31100 31200 31300 31400 31500'), 'Nice':W5('06000 06100 06200 06300'),
    'Bordeaux':W5('33000 33100 33200 33300 33800'), 'Strasbourg':W5('67000 67100 67200'), 'Lille':W5('59000 59800 59160'),
    'Nantes':W5('44000 44100 44200 44300'), 'Montpellier':W5('34000 34070 34080 34090'), 'Rennes':W5('35000 35200 35700') },
  es_ES:{ 'Madrid':rng(28001,28050), 'Barcelona':rng(8001,8042), 'Valencia':rng(46001,46025), 'Seville':rng(41001,41020),
    'Bilbao':rng(48001,48015), 'Zaragoza':rng(50001,50018), 'Málaga':rng(29001,29018), 'Palma':rng(7001,7015), 'Murcia':rng(30001,30011) },
  it_IT:{ 'Rome':[...rng(118,199), '00100'].map(x => x.padStart(5,'0')), 'Milan':rng(20121,20162), 'Naples':rng(80121,80147), 'Turin':rng(10121,10156),
    'Florence':rng(50121,50145), 'Bologna':rng(40121,40141), 'Genoa':rng(16121,16167), 'Palermo':rng(90121,90151),
    'Verona':rng(37121,37142), 'Bari':rng(70121,70132) },
  nl_NL:{ 'Amsterdam':W5('1011 1012 1013 1015 1016 1017 1018 1051 1071 1072 1073 1074 1091 1092').map(x => x+' @@'),
    'Rotterdam':W5('3011 3012 3013 3014 3015 3016 3021 3022 3024 3032').map(x => x+' @@'),
    'Utrecht':W5('3511 3512 3513 3514 3521 3522 3531 3582').map(x => x+' @@'),
    'The Hague':W5('2511 2512 2513 2514 2515 2516 2517 2518 2521 2562').map(x => x+' @@'),
    'Eindhoven':W5('5611 5612 5613 5614 5615 5616 5617 5621').map(x => x+' @@'),
    'Groningen':W5('9711 9712 9713 9714 9715 9716 9718 9721').map(x => x+' @@'),
    'Maastricht':W5('6211 6212 6213 6214 6221 6222 6223 6224').map(x => x+' @@'),
    'Arnhem':W5('6811 6812 6813 6814 6815 6816 6821 6822').map(x => x+' @@') },
  sv_SE:{ 'Stockholm':['111 20','111 21','111 22','111 29','111 30','111 51','114 32','114 35','118 20','118 46','117 43'],
    'Gothenburg':['411 01','411 05','411 11','411 18','413 01','414 51'], 'Malmö':['211 11','211 20','211 22','211 34','212 11'],
    'Uppsala':['753 10','753 20','752 37'], 'Linköping':['582 22','582 24','582 25'], 'Örebro':['702 11','702 22','703 61'], 'Umeå':['903 29','903 32','901 87'] },
  en_SG:{ 'Orchard':W5('238858 238801 238863 238877'), 'Marina Bay':W5('018956 018972 018989'), 'Tampines':W5('529510 529536 529653'),
    'Jurong East':W5('609731 609606 609434'), 'Woodlands':W5('738099 730900 737741') },
  en_MY:{ 'Kuala Lumpur':W5('50000 50050 50088 50450 50470 55100 59200'), 'Petaling Jaya':W5('46000 46100 46200 47301'),
    'Johor Bahru':W5('80000 80100 80200 80250'), 'George Town':W5('10000 10050 10200 10450'), 'Kota Kinabalu':W5('88000 88100 88300 88450') },
  en_TH:{ 'Bangkok':W5('10110 10120 10330 10500 10310'), 'Chiang Mai':W5('50000 50200'), 'Phuket':['83000'], 'Pattaya':['20150'], 'Khon Kaen':['40000'] },
  en_VN:{ 'Hanoi':W5('100000 100100 110100 111100'), 'Ho Chi Minh City':W5('700000 710000 720000 723000'), 'Da Nang':W5('550000 550100 550200'),
    'Hai Phong':W5('180000 180100'), 'Can Tho':W5('900000 900100') },
  en_AE:{ 'Dubai':['00000'], 'Abu Dhabi':['00000'], 'Sharjah':['00000'], 'Ajman':['00000'], 'Ras Al Khaimah':['00000'] },
  zh_CN:{ 'Beijing':W5('100000 100010 100020 100022 100025 100101'), 'Shanghai':W5('200000 200030 200040 200120 200122 200135'),
    'Guangzhou':W5('510000 510620 510630 510075'), 'Shenzhen':W5('518000 518026 518052 518057'), 'Chengdu':W5('610000 610016 610041 610066') },
  en_HK:{ 'Central':['999077'], 'Causeway Bay':['999077'], 'Tsim Sha Tsui':['999077'], 'Mong Kok':['999077'], 'Sha Tin':['999077'] },
  en_MO:{ 'Macau Peninsula':['999078'], 'Taipa':['999078'], 'Cotai':['999078'], 'Coloane':['999078'] },
  zh_TW:{ 'Taipei':W5('100 103 104 105 106 110 114'), 'New Taipei':W5('220 231 235 241 242'), 'Taichung':W5('400 403 404 406 407'),
    'Kaohsiung':W5('800 802 806 807 811'), 'Tainan':W5('700 701 702 704 710') },
  ko_KR:{ 'Jung-gu':W5('04524 04526'), 'Gangnam-gu':W5('06164 06236 06292'), 'Mapo-gu':W5('04107 04066'), 'Haeundae-gu':W5('48058 48093'),
    'Suseong-gu':W5('42251 42115'), 'Namdong-gu':W5('21554 21555') },
  de_CH:{ 'Zurich':W5('8001 8002 8003 8004 8005 8006 8008 8032'), 'Basel':W5('4001 4051 4052 4053 4054 4055'),
    'Bern':W5('3000 3001 3005 3006 3011 3012 3013'), 'Lucerne':W5('6003 6004 6005 6006'), 'St. Gallen':W5('9000 9001 9004 9008') },
  ru_RU:{ 'Moscow':W5('101000 103132 107023 109012 115054 119019 125009 127006'), 'Saint Petersburg':W5('190000 191023 191186 195027 197022'),
    'Novosibirsk':W5('630000 630004 630099 630102'), 'Yekaterinburg':W5('620000 620014 620075 620142'), 'Kazan':W5('420000 420015 420111 420107') },
  ru_KZ:{ 'Almaty':W5('050000 050002 050004 050010 050012 050040'), 'Astana':W5('010000 010001 010009 010010'),
    'Shymkent':W5('160000 160001 160011'), 'Karaganda':W5('100000 100008 100012'), 'Aktobe':W5('030000 030002 030010') },
  es_AR:{ 'Buenos Aires':W5('1002 1003 1004 1005 1006 1007 1010 1020 1043 1049 1425 1428'), 'Córdoba':W5('5000 5001 5002 5003 5004 5008'),
    'Rosario':W5('2000 2002 2003 2005'), 'Mendoza':W5('5500 5501 5502 5503'), 'La Plata':W5('1900 1902 1904 1906') },
  es_CL:{ 'Santiago':W5('8320000 8330000 8340000 8350000 7500000 7510000 7550000'), 'Valparaíso':W5('2340000 2350000 2360000'),
    'Concepción':W5('4030000 4070000 4080000'), 'Antofagasta':W5('1240000 1270000'), 'Viña del Mar':W5('2520000 2530000 2540000') },
  es_MX:{ 'Mexico City':W5('06000 06010 06100 06600 11000 03100 04100'), 'Guadalajara':W5('44100 44160 44600 45040'),
    'Monterrey':W5('64000 64060 64620 66220'), 'Puebla':W5('72000 72160 72570'), 'Querétaro':W5('76000 76010 76020 76030') },
  es_DO:{ 'Santo Domingo':W5('10101 10102 10104 10105 10106'), 'Santiago de los Caballeros':['51000'], 'Puerto Plata':['57000'],
    'La Romana':['22000'], 'Punta Cana':['23000'] },
  es_PR:{ 'San Juan':W5('00901 00907 00909 00911 00918 00926'), 'Ponce':W5('00716 00717 00728 00730 00731'), 'Mayagüez':W5('00680 00681 00682'),
    'Caguas':W5('00725 00726 00727'), 'Bayamón':W5('00956 00957 00959 00961') },
  de_AT:{ 'Vienna':W5('1010 1020 1030 1040 1050 1060 1070 1080 1090 1100 1120 1150 1200'), 'Graz':W5('8010 8020 8036 8041 8042 8045'),
    'Linz':W5('4020 4030 4040 4020'), 'Salzburg':W5('5020 5026 5071'), 'Innsbruck':W5('6020 6010 6063') },
  nl_BE:{ 'Antwerp':W5('2000 2018 2020 2030 2050 2060'), 'Ghent':W5('9000 9030 9040 9050 9051 9052'),
    'Bruges':W5('8000 8200 8310 8380'), 'Leuven':W5('3000 3001 3010 3012 3018'), 'Hasselt':W5('3500 3511 3512 3520') },
  cs_CZ:{ 'Prague':['110 00','120 00','130 00','140 00','150 00','160 00','170 00','180 00'],
    'Brno':['602 00','613 00','612 00','639 00','615 00'], 'Ostrava':['702 00','703 00','708 00','709 00'],
    'Plzeň':['301 00','312 00','323 00','326 00'], 'Liberec':['460 01','460 05','460 06'] },
  da_DK:{ 'Copenhagen':W5('1050 1100 1150 1200 1250 1300 1400 2100 2200 2300'), 'Aarhus':W5('8000 8200 8210 8220 8230 8240'),
    'Odense':W5('5000 5200 5210 5220 5230'), 'Aalborg':W5('9000 9200 9210 9220'), 'Esbjerg':W5('6700 6705') },
  el_GR:{ 'Athens':['105 57','106 71','106 82','115 21','116 34','117 43'], 'Thessaloniki':['546 21','546 22','546 24','546 25','546 30'],
    'Patras':['262 21','262 22','263 31'], 'Heraklion':['712 01','712 02','713 06'], 'Larissa':['412 21','412 22','413 33'] },
  fr_LU:{ 'Luxembourg':W5('1009 1111 1219 1331 1470'), 'Esch-sur-Alzette':W5('4001 4002 4010 4040'),
    'Dudelange':W5('3401 3405 3410'), 'Ettelbruck':W5('9001 9002 9080') },
  pl_PL:{ 'Warsaw':['00-001','00-013','00-040','00-120','00-500','02-495'], 'Kraków':['30-001','31-001','31-110','31-420','30-510'],
    'Wrocław':['50-001','50-100','50-307','53-001','54-001'], 'Gdańsk':['80-001','80-210','80-300','80-800','80-851'],
    'Poznań':['60-001','60-101','61-001','61-601','60-700'] },
  ro_RO:{ 'Bucharest':W5('010011 010101 020001 030001 040001 050001 060001'), 'Cluj-Napoca':W5('400001 400100 400112 400347'),
    'Timișoara':W5('300001 300011 300100 300222'), 'Iași':W5('700001 700100 700505'), 'Constanța':W5('900001 900100 900178') },
  sl_SI:{ 'Ljubljana':W5('1000 1210 1231 1260 1291'), 'Maribor':['2000'], 'Celje':['3000'], 'Kranj':['4000'], 'Koper':['6000'] },
  fi_FI:{ 'Helsinki':['00100','00120','00130','00140','00150','00170','00180','00200','00250','00260','00500','00530'],
    'Espoo':['02100','02110','02120','02130','02150','02200','02600','02650'], 'Tampere':['33100','33200','33210','33230','33500','33520'],
    'Turku':['20100','20110','20500','20520','20540'], 'Oulu':['90100','90120','90130','90500','90570'] },
  pt_PT:{ 'Lisbon':['1000-001','1000-017','1100-148','1150-001','1200-195','1250-096','1300-001','1500-155'],
    'Porto':['4000-001','4050-001','4100-001','4150-001','4200-001','4300-001','4400-001'], 'Coimbra':['3000-001','3000-337','3030-001','3040-001'],
    'Faro':['8000-001','8000-079','8000-142','8005-001'], 'Braga':['4700-001','4700-029','4710-001','4715-001'] },
  nb_NO:{ 'Oslo':['0150','0151','0152','0153','0154','0155','0157','0159','0160','0161','0162','0164'],
    'Bergen':['5003','5004','5005','5006','5007','5008','5010','5011','5012'], 'Trondheim':['7010','7011','7012','7013','7014','7030','7031'],
    'Stavanger':['4005','4006','4007','4008','4009','4010','4011'], 'Tromsø':['9008','9009','9010','9011','9012','9013'] },
  hu_HU:{ 'Budapest':['1051','1052','1053','1055','1061','1065','1072','1088','1111','1138','1146','1203'],
    'Debrecen':['4024','4025','4026','4027','4028','4029','4032'], 'Szeged':['6720','6721','6722','6723','6724','6725'],
    'Pécs':['7621','7622','7624','7625','7626','7627'], 'Győr':['9021','9022','9023','9024','9025','9026'] },
  pt_BR:{ 'São Paulo':['01310-###','01311-###','01312-###','01313-###','01414-###','01415-###'],
    'Rio de Janeiro':['20040-###','20031-###','22010-###','22020-###','22040-###','22210-###'],
    'Brasília':['70040-###','70070-###','70297-###','70710-###','70760-###'],
    'Curitiba':['80010-###','80020-###','80060-###','80250-###','80420-###'],
    'Belo Horizonte':['30110-###','30130-###','30140-###','30160-###','30190-###'],
    'Salvador':['40015-###','40020-###','40140-###','40170-###'], 'Recife':['50030-###','50050-###','50070-###','50100-###'],
    'Porto Alegre':['90010-###','90035-###','90040-###','90050-###','90110-###'], 'Fortaleza':['60025-###','60110-###','60115-###','60160-###'],
    'Manaus':['69005-###','69010-###','69020-###','69050-###'] },
  ja_JP:{ 'Shibuya-ku':['150-0002','150-0001','150-0043','150-0041','150-0013'], 'Shinjuku-ku':['160-0022','160-0023','160-0021','163-8001'],
    'Osaka':['530-0001','530-0002','530-0003','530-0012','530-0017'], 'Kyoto':['604-8001','604-8005','604-8006','604-8101'],
    'Sapporo':['060-0001','060-0002','060-0003','060-0042','060-0061'], 'Nagoya':['460-0001','460-0002','460-0003','460-0008'],
    'Fukuoka':['810-0001','810-0004','810-0041','810-0073'], 'Yokohama':['231-0002','231-0005','231-0023','231-0033'],
    'Hiroshima':['730-0011','730-0013','730-0021'] },
};
const postalFor = (code, c) => {
  const L = LOCALES[code], key = c[0], list = POSTAL[code] && POSTAL[code][key];
  for (let i = 0; i < 20; i++){
    const p = fill(list ? pick(list) : c[2]);
    if (!/ S[ADS]$/.test(p) || code !== 'nl_NL') return p;       // Dutch postcodes never end in SA, SD, SS
  }
};

/* ---------- people (first/last names by locale) ---------- */
const NAMES = {
  en:{f:['James','Mary','Robert','Linda','Michael','Sarah','David','Emma','Daniel','Olivia','Thomas','Grace','Henry','Chloe','Samuel','Hannah','Oliver','Megan'],
      l:['Smith','Johnson','Brown','Taylor','Wilson','Anderson','Walker','Hall','Young','Clarke','Turner','Hughes','Morgan','Bennett','Cooper','Reed']},
  ie:{f:['Seán','Aoife','Ciarán','Niamh','Conor','Siobhán','Cian','Orla'],l:['Murphy','Kelly','O’Brien','Walsh','Byrne','Ryan','Doyle','McCarthy']},
  in:{f:['Aarav','Priya','Rohan','Ananya','Vikram','Neha','Arjun','Kavya','Rahul','Sneha'],l:['Sharma','Patel','Reddy','Iyer','Gupta','Nair','Mehta','Singh','Rao','Kapoor']},
  de:{f:['Lukas','Anna','Felix','Laura','Jonas','Marie','Maximilian','Lena','Paul','Julia'],l:['Müller','Schmidt','Schneider','Fischer','Weber','Becker','Wagner','Hoffmann','Koch','Richter']},
  fr:{f:['Louis','Camille','Hugo','Léa','Lucas','Chloé','Gabriel','Manon','Arthur','Inès'],l:['Martin','Bernard','Dubois','Moreau','Laurent','Lefebvre','Girard','Roux','Fournier','Mercier']},
  es:{f:['Carlos','Lucía','Javier','Marta','Diego','Carmen','Pablo','Elena','Sergio','Paula'],l:['García','Fernández','López','Martínez','Sánchez','Pérez','Gómez','Ruiz','Díaz','Moreno']},
  it:{f:['Luca','Giulia','Marco','Sofia','Matteo','Chiara','Alessandro','Francesca','Davide','Elena'],l:['Rossi','Russo','Ferrari','Esposito','Bianchi','Romano','Colombo','Ricci','Marino','Greco']},
  nl:{f:['Daan','Emma','Sem','Sanne','Lars','Fleur','Bram','Lotte','Thijs','Noor'],l:['de Jong','Jansen','de Vries','van den Berg','Bakker','Visser','Smit','Meijer','Mulder','de Boer']},
  sg:{f:['Wei Jie','Mei Ling','Jun Hao','Siti','Ravi','Priya','Kai Xiang','Aisyah'],l:['Tan','Lim','Lee','Ng','Ong','Wong','Goh','Chua']},
  my:{f:['Ahmad','Nur','Muhammad','Siti','Wei Ming','Mei Yee','Rajesh','Priya'],l:['bin Abdullah','binti Ismail','Tan','Lim','Lee','Wong','Kumar','Singh']},
  th:{f:['Somchai','Suda','Anan','Malee','Chai','Pimchanok','Kittipong','Nattaya'],l:['Srisuk','Wongsawat','Charoen','Chaiyasit','Suksan','Prasert','Boonmee','Thongchai']},
  vn:{f:['Minh','Linh','Anh','Huy','Lan','Quang','Thao','Khoa'],l:['Nguyen','Tran','Le','Pham','Hoang','Vu','Dang','Bui']},
  ae:{f:['Mohammed','Fatima','Ahmed','Aisha','Omar','Mariam','Khalid','Layla'],l:['Al Mansoori','Al Hashimi','Khan','Hassan','Al Nuaimi','Ibrahim','Al Suwaidi','Rahman']},
  cn:{f:['Wei','Li','Jun','Yan','Hao','Mei','Lei','Xin','Jie','Ling'],l:['Wang','Li','Zhang','Liu','Chen','Yang','Huang','Zhao','Wu','Zhou']},
  hk:{f:['Chi Ming','Mei Ling','Wai Keung','Siu Fong','Ka Yan','Tak Wah','Hoi Ying','Man Kit'],l:['Chan','Wong','Lee','Cheung','Lau','Leung','Ho','Ng']},
  kr:{f:['Min-jun','Seo-yeon','Ji-ho','Ha-eun','Joon-seo','Soo-ah','Dong-hyun','Yu-na'],l:['Kim','Lee','Park','Choi','Jung','Kang','Cho','Yoon']},
  ru:{f:['Aleksandr','Elena','Dmitry','Olga','Sergey','Natalia','Ivan','Anna','Mikhail','Tatiana'],l:['Ivanov','Smirnov','Kuznetsov','Popov','Sokolov','Lebedev','Kozlov','Novikov','Morozov','Volkov']},
  kz:{f:['Aidar','Aigerim','Nurlan','Dana','Yerlan','Aliya','Marat','Madina','Timur','Saule'],l:['Nurpeisov','Akhmetov','Kenzhebayev','Seitkali','Omarov','Dauletov','Zhumabayev','Abdrakhmanov','Mukanov','Sadykov']},
  cs:{f:['Jan','Eva','Petr','Jana','Tomáš','Lucie','Martin','Tereza','Jakub','Kateřina'],l:['Novák','Dvořák','Černý','Procházka','Kučera','Veselý','Horák','Němec','Pokorný','Marek']},
  da:{f:['Mads','Emma','Lars','Freja','Anders','Ida','Søren','Sofie','Jens','Clara'],l:['Jensen','Nielsen','Hansen','Pedersen','Andersen','Christensen','Larsen','Sørensen','Rasmussen','Jørgensen']},
  el:{f:['Giorgos','Maria','Dimitris','Eleni','Nikos','Katerina','Kostas','Sofia','Yannis','Anna'],l:['Papadopoulos','Georgiou','Dimitriou','Nikolaou','Ioannou','Konstantinou','Vasileiou','Pappas','Antoniou','Makris']},
  pl:{f:['Jakub','Anna','Piotr','Katarzyna','Michał','Magdalena','Tomasz','Agnieszka','Paweł','Zofia'],l:['Nowak','Kowalski','Wiśniewski','Wójcik','Kowalczyk','Kamiński','Lewandowski','Zieliński','Szymański','Woźniak']},
  ro:{f:['Andrei','Maria','Ioan','Elena','Mihai','Ioana','Alexandru','Ana','Ștefan','Cristina'],l:['Popescu','Ionescu','Popa','Stan','Dumitru','Gheorghe','Constantin','Marin','Șerban','Munteanu']},
  sl:{f:['Luka','Nina','Matej','Ana','Jan','Eva','Žiga','Maja','Tadej','Sara'],l:['Novak','Horvat','Kovačič','Krajnc','Zupančič','Potočnik','Kos','Vidmar','Golob','Kralj']},
  fi:{f:['Matti','Aino','Juha','Helmi','Antti','Elina','Mikko','Sanna','Eino','Oona'],l:['Korhonen','Virtanen','Mäkinen','Nieminen','Mäkelä','Hämäläinen','Laine','Heikkinen','Koskinen','Järvinen']},
  no:{f:['Magnus','Ingrid','Henrik','Emilie','Lars','Sofie','Kristian','Nora','Ola','Thea'],l:['Hansen','Johansen','Olsen','Larsen','Andersen','Pedersen','Nilsen','Kristiansen','Jensen','Karlsen']},
  hu:{f:['Bence','Anna','Márk','Eszter','Gábor','Katalin','Zoltán','Réka','Péter','Dóra'],l:['Nagy','Kovács','Tóth','Szabó','Horváth','Varga','Kiss','Molnár','Németh','Farkas']},
  sv:{f:['Erik','Maja','Oskar','Elsa','Axel','Ebba','Lars','Astrid','Nils','Freja'],l:['Andersson','Johansson','Karlsson','Nilsson','Eriksson','Larsson','Olsson','Persson','Svensson','Gustafsson']},
  pt:{f:['João','Maria','Pedro','Ana','Lucas','Beatriz','Rafael','Camila','Gustavo','Juliana'],l:['Silva','Santos','Oliveira','Souza','Pereira','Costa','Rodrigues','Almeida','Nascimento','Lima']},
  ja:{f:['Taro','Hanako','Kenta','Misaki','Daisuke','Yoko','Sho','Ai','Naoki','Yumi'],l:['Sato','Suzuki','Takahashi','Tanaka','Ito','Watanabe','Yamamoto','Nakamura','Kobayashi','Kato']},
};
const NAME_SET = {en_IE:'ie', en_IN:'in', de_DE:'de', fr_FR:'fr', es_ES:'es', it_IT:'it', nl_NL:'nl', sv_SE:'sv', hu_HU:'hu', nb_NO:'no', fi_FI:'fi', de_AT:'de', es_AR:'es', de_CH:'de', zh_CN:'cn', en_SG:'sg', en_MY:'my', en_TH:'th', en_VN:'vn', en_AE:'ae', zh_TW:'cn', en_HK:'hk', en_MO:'hk', ko_KR:'kr', ru_RU:'ru', ru_KZ:'kz', es_CL:'es', es_MX:'es', es_DO:'es', es_PR:'es', nl_BE:'nl', cs_CZ:'cs', da_DK:'da', el_GR:'el', fr_LU:'fr', pl_PL:'pl', ro_RO:'ro', sl_SI:'sl', pt_PT:'pt', pt_BR:'pt', ja_JP:'ja'};
const ALIASES = {en_NO:'nb_NO', en_HU:'hu_HU', en_PT:'pt_PT', en_FI:'fi_FI', en_AT:'de_AT', en_BE:'nl_BE', en_CZ:'cs_CZ', en_DK:'da_DK', en_GR:'el_GR', en_LU:'fr_LU', en_PL:'pl_PL', en_RO:'ro_RO', en_SI:'sl_SI', en_AR:'es_AR', en_CL:'es_CL', en_MX:'es_MX', en_DO:'es_DO', en_PR:'es_PR', en_CH:'de_CH', en_RU:'ru_RU', en_KZ:'ru_KZ', en_CN:'zh_CN', en_TW:'zh_TW', en_KR:'ko_KR'};   // English-style codes accepted as exact matches
const ascii = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z]/g,'').toLowerCase();
function person(code){
  const n = NAMES[NAME_SET[code] || 'en'], first = plain(pick(n.f), code), last = plain(pick(n.l), code);
  const a = ascii(first), b = ascii(last);
  const email = (a && b ? `${a}.${b}` : `guest${digits(4)}`) + num(10,99) + '@example.com';  // example.com is reserved for documentation
  return { first, last, email };
}

/* ---------- address assembly ---------- */
function assemble(L, f){
  switch (L.style){
    case 'A': return `${f.street}, ${f.city}, ${f.region} ${f.postal}, ${f.country}`;
    case 'B': return `${f.street}, ${f.city} ${f.region} ${f.postal}, ${f.country}`;
    case 'C': return `${f.street}, ${f.city}, ${f.postal}, ${f.country}`;
    case 'D': return `${f.street}, ${f.postal} ${f.city}, ${f.country}`;
    case 'E': return `${f.street}, ${f.postal} ${f.city} (${f.region}), ${f.country}`;
    case 'F': return `${f.street} - ${f.city} - ${f.region}, ${f.postal}, ${f.country}`;
    case 'X': return `${f.street}, ${f.city}, ${f.region===f.city?'':f.region+' '}${f.postal}, ${f.country}`;
    case 'S': return `${f.street}, ${f.city}, ${f.country} ${f.postal}`;
    case 'T': return `${f.street}, ${f.city} ${f.postal}, ${f.country}`;
    case 'H': return [f.street, f.city, f.region===f.city?'':f.region, f.country].filter(Boolean).join(', ');
  }
}

const seen = new Set();   // guarantees no repeats within this session
function generate(code, region){
  const L = LOCALES[code];
  for (let attempt = 0; attempt < 50; attempt++){
    const pool = region ? L.cities.filter(x => regionOf(L, x) === region) : L.cities;
    if (!pool.length) throw new Error('No cities for region ' + region);
    const c = pick(pool);
    const city = c[0];
    const f = { name: L.name(), street: L.street(), city, region:'', postal: postalFor(code, c), country: L.country };
    f.region = c[1];
    for (const k of ['name','street','city','region','country']) f[k] = plain(f[k], code);
    const tax = TAX[L.tax]({gst:c[3]}); tax.label = plain(tax.label, code); tax.value = tax.value.replace(/[^A-Za-z0-9]/g, ""); // strip dashes/spaces/dots/slashes
    const phone = fill(L.phone).replace(/\D/g,'');   // national number, digits only (no country code)
    const full = assemble(L, f);          // full address keeps the natural spacing
    f.postal = f.postal.replace(/\s/g, '');   // standalone postal-code field: no spaces
    const who = person(code);
    const key = f.name + full + tax.value + who.email;
    if (seen.has(key)) continue;
    seen.add(key);
    return { f, tax, phone, full, who };
  }
  throw new Error('Could not produce a unique result');
}

