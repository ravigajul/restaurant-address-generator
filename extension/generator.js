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
        return {label:'N° TVA intracommunautaire', value:'FR'+String(key).padStart(2,'0')+siren}; },
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
  HU(){ const b = String(num(1,9))+digits(6); const c = (10 - wsum(b,[9,7,3,1,9,7,3])%10)%10;   // 8-digit adószám core
        return {label:'ÁFA-szám (VAT)', value:'HU'+b+c}; },
  JP(){ const b = String(num(1,9))+digits(11); let s=0; // 12 digits, Pn counted from right
        for (let n=1;n<=12;n++) s += +b[12-n] * (n%2?1:2);
        return {label:'Invoice Reg. No. (適格請求書発行事業者)', value:'T'+(9-s%9)+b}; },
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
    cities:[['Toronto','ON','M5$ #$#'],['Vancouver','BC','V6$ #$#'],['Montréal','QC','H2$ #$#'],['Calgary','AB','T2$ #$#'],['Ottawa','ON','K1$ #$#'],['Winnipeg','MB','R3$ #$#']] },
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
  de_DE:{ country:'Deutschland', tax:'DE', style:'D', phone:'030 555####',
    name:()=>pick(['Gasthaus Zum Goldenen Löwen','Zur Linde','Brauhaus am Markt','Ristorante Da Mario','Weinstube Hirsch','Landhaus Eichenhof','Zum Alten Fritz','Gaststätte Lindenhof','Restaurant Rheinblick','Zur Krone']),
    street:()=>`${pick(['Haupt','Bahnhof','Schiller','Goethe','Linden','Garten','Kirch','Markt','Berg','Wald','Mühlen','Rosen'])}${pick(['straße','weg','platz','allee'])} ${num(1,150)}`,
    cities:[['Berlin','Berlin','10###'],['München','Bayern','80###'],['Hamburg','Hamburg','20###'],['Köln','Nordrhein-Westfalen','50###'],['Frankfurt am Main','Hessen','60###'],['Stuttgart','Baden-Württemberg','70###']] },
  fr_FR:{ country:'France', tax:'FR', style:'D', phone:'01 ## ## ## ##',
    name:()=>pick(['Le Petit Bistro','Chez Marcel','La Belle Époque','Le Comptoir','Brasserie du Coin','Au Bon Vivant','La Table de Julie','Le Coq Gaulois','L’Escargot Doré','Café des Arts']),
    street:()=>`${num(1,180)} ${pick(['Rue','Avenue','Boulevard','Place','Quai','Allée'])} ${pick(['Victor Hugo','de la République','de la Paix','Pasteur','Jean Jaurès','des Lilas','du Marché','Gambetta','de Verdun','Voltaire'])}`,
    cities:[['Paris','Île-de-France','750##'],['Lyon','Auvergne-Rhône-Alpes','690##'],['Marseille','Provence-Alpes-Côte d’Azur','130##'],['Toulouse','Occitanie','310##'],['Nice','Provence-Alpes-Côte d’Azur','060##'],['Bordeaux','Nouvelle-Aquitaine','330##']] },
  es_ES:{ country:'España', tax:'ES', style:'D', phone:'91 ### ## ##',
    name:()=>pick(['Casa Pepe','La Taberna del Sol','El Rincón de Juan','Bar La Plaza','Mesón El Toro','Casa Lola','La Cantina','El Jardín Secreto','Asador Los Arcos','Tapas y Vino']),
    street:()=>`${pick(['Calle','Avenida','Plaza','Paseo'])} ${pick(['Mayor','de Cervantes','del Sol','de la Constitución','Real','de Goya','de los Olivos','San Antonio','de Alcalá','Colón'])}, ${num(1,150)}`,
    cities:[['Madrid','Madrid','280##'],['Barcelona','Cataluña','080##'],['Valencia','Comunidad Valenciana','460##'],['Sevilla','Andalucía','410##'],['Bilbao','País Vasco','480##']] },
  it_IT:{ country:'Italia', tax:'IT', style:'E', phone:'06 ### ####',
    name:()=>pick(['Trattoria da Luigi','Osteria La Luna','Ristorante Il Girasole','Pizzeria Napoli','La Dolce Vita','Da Gennaro','Taverna del Borgo','Antica Locanda','Il Pomodoro','Enoteca Bella Vista']),
    street:()=>`${pick(['Via','Viale','Piazza','Corso','Vicolo'])} ${pick(['Roma','Garibaldi','Dante Alighieri','Mazzini','Verdi','Cavour','Marconi','Manzoni','Leonardo da Vinci','della Libertà'])}, ${num(1,150)}`,
    cities:[['Roma','RM','001##'],['Milano','MI','201##'],['Napoli','NA','801##'],['Torino','TO','101##'],['Firenze','FI','501##']] },
  nl_NL:{ country:'Nederland', tax:'NL', style:'D', phone:'020 555 ####',
    name:()=>pick(['Eetcafé De Gouden Leeuw','Restaurant De Molen','Brasserie Het Hoekje','Grand Café De Kroon','De Tulp','Smaak aan de Gracht','Bistro De Vier Seizoenen','Het Witte Huis','Eethuis Noord','De Haven']),
    street:()=>`${pick(['Kerk','Dam','Molen','Haven','Nieuwe','Oude','Markt','Beurs','Linden','Station','Kade','School'])}${pick(['straat','laan','weg','plein','gracht'])} ${num(1,200)}`,
    cities:[['Amsterdam','Noord-Holland','10## @@'],['Rotterdam','Zuid-Holland','30## @@'],['Utrecht','Utrecht','35## @@'],['Den Haag','Zuid-Holland','25## @@'],['Eindhoven','Noord-Brabant','56## @@']] },
  sv_SE:{ country:'Sverige', tax:'SE', style:'D', phone:'08 555 ## ###',
    name:()=>pick(['Restaurang Smak','Krogen Björken','Bistro Norden','Matsalen','Café Fika','Kök & Bar Havet','Gastro Stockholm','Wärdshuset Ekan','Matbaren','Smörgåsen']),
    street:()=>`${pick(['Stor','Drottning','Kung','Kyrk','Järn','Skol','Vasa','Hamn','Bergs','Ringvägen'])}${pick(['gatan','vägen','torget','allén'])} ${num(1,140)}`,
    cities:[['Stockholm','Stockholms län','11# ##'],['Göteborg','Västra Götaland','41# ##'],['Malmö','Skåne','21# ##'],['Uppsala','Uppsala län','75# ##']] },
  hu_HU:{ country:'Magyarország', tax:'HU', style:'D', phone:'1 555 ####',
    name:()=>pick(['Gulyás Csárda','Étterem a Hídnál','Bistro Paprika','Kéknyelű Vendéglő','Arany Szarvas Étterem','Fehér Asztal','Csemege Kisvendéglő','Tokaji Borozó','Hortobágyi Csárda','Kávéház Központ']),
    street:()=>`${pick(['Fő','Kossuth Lajos','Petőfi Sándor','Széchenyi','Rákóczi','Árpád','Ady Endre','Bartók Béla','Deák Ferenc','Arany János','Jókai','Templom'])} ${pick(['utca','tér','út','körút'])} ${num(1,120)}`,
    cities:[['Budapest','Budapest','1###'],['Debrecen','Hajdú-Bihar','40##'],['Szeged','Csongrád-Csanád','67##'],['Pécs','Baranya','76##'],['Győr','Győr-Moson-Sopron','90##']] },
  pt_BR:{ country:'Brasil', tax:'BR', style:'F', phone:'11 9####-####',
    name:()=>pick(['Churrascaria Boi Gordo','Cantinho do Sabor','Restaurante Sabor da Terra','Bar do Zé','Casa da Feijoada','Pizzaria Bella Massa','Fogão de Lenha','Sabor Mineiro','Cozinha da Vovó','Mar & Brasa']),
    street:()=>`${pick(['Rua','Avenida','Travessa','Alameda'])} ${pick(['das Flores','Sete de Setembro','Brasil','XV de Novembro','Paulista','dos Andradas','Getúlio Vargas','das Palmeiras','Tiradentes','São João'])}, ${num(1,2500)}`,
    cities:[['São Paulo','SP','01###-###'],['Rio de Janeiro','RJ','20###-###'],['Brasília','DF','70###-###'],['Curitiba','PR','80###-###'],['Belo Horizonte','MG','30###-###']] },
  ja_JP:{ country:'日本', tax:'JP', style:'J', phone:'03-####-####',
    name:()=>pick(['炉端 鳥吉','寿司 匠','ラーメン 一番','居酒屋 まる','天ぷら 華','焼肉 大楽','そば処 藤','串焼き とり正','うなぎ 松葉','カフェ 桜']),
    street:()=>`${pick(['中央','本町','栄','駅前','新町','道玄坂','銀座','神田','桜木','港'])}${num(1,6)}-${num(1,30)}-${num(1,20)}`,
    cities:[['東京都','渋谷区','1##-####'],['東京都','新宿区','16#-####'],['大阪府','大阪市北区','53#-####'],['京都府','京都市中京区','60#-####'],['北海道','札幌市中央区','06#-####']] },
};



/* ---------- more cities so most states / regions have an entry ---------- */
const EXTRA_CITIES = {
  en_US:[['San Francisco','CA','941##'],['San Diego','CA','921##'],['Dallas','TX','752##'],['Buffalo','NY','142##'],['Orlando','FL','328##'],
    ['Philadelphia','PA','191##'],['Phoenix','AZ','850##'],['Columbus','OH','432##'],['Detroit','MI','482##'],['Portland','OR','972##'],
    ['Las Vegas','NV','891##'],['Nashville','TN','372##'],['New Orleans','LA','701##'],['Minneapolis','MN','554##'],['St. Louis','MO','631##'],
    ['Charlotte','NC','282##'],['Richmond','VA','232##'],['Baltimore','MD','212##'],['Salt Lake City','UT','841##'],['Milwaukee','WI','532##'],
    ['Indianapolis','IN','462##'],['Honolulu','HI','968##'],['Oklahoma City','OK','731##'],['Louisville','KY','402##'],['Washington','DC','200##']],
  en_CA:[['Halifax','NS','B3$ #$#'],['Edmonton','AB','T5$ #$#'],['Québec','QC','G1$ #$#'],['Victoria','BC','V8$ #$#'],['Saskatoon','SK','S7$ #$#'],
    ['St. John’s','NL','A1$ #$#'],['Fredericton','NB','E3$ #$#']],
  en_AU:[['Gold Coast','QLD','42##'],['Newcastle','NSW','23##'],['Geelong','VIC','32##'],['Darwin','NT','08##'],['Cairns','QLD','48##']],
  en_GB:[['Belfast','Northern Ireland','BT# #$$'],['Glasgow','Scotland','G## #$$'],['Liverpool','England','L# #$$'],['Newcastle upon Tyne','England','NE# #$$'],['Swansea','Wales','SA# #$$']],
  en_NZ:[['Tauranga','Bay of Plenty','31##'],['Queenstown','Otago','93##'],['Napier','Hawke’s Bay','41##']],
  en_IN:[['Kolkata','West Bengal','700###','19'],['Ahmedabad','Gujarat','380###','24'],['Jaipur','Rajasthan','302###','08'],['Lucknow','Uttar Pradesh','226###','09'],
    ['Kochi','Kerala','682###','32'],['Chandigarh','Chandigarh','160###','04']],
  de_DE:[['Dresden','Sachsen','01###'],['Hannover','Niedersachsen','30###'],['Nürnberg','Bayern','90###'],['Düsseldorf','Nordrhein-Westfalen','40###'],['Bremen','Bremen','28###']],
  fr_FR:[['Strasbourg','Grand Est','670##'],['Lille','Hauts-de-France','590##'],['Nantes','Pays de la Loire','440##'],['Montpellier','Occitanie','340##'],['Rennes','Bretagne','350##']],
  es_ES:[['Zaragoza','Aragón','500##'],['Málaga','Andalucía','290##'],['Palma','Islas Baleares','070##'],['Murcia','Región de Murcia','300##']],
  it_IT:[['Bologna','BO','401##'],['Genova','GE','161##'],['Palermo','PA','901##'],['Verona','VR','371##'],['Bari','BA','701##']],
  nl_NL:[['Groningen','Groningen','97## @@'],['Maastricht','Limburg','62## @@'],['Arnhem','Gelderland','68## @@']],
  sv_SE:[['Linköping','Östergötland','58# ##'],['Örebro','Örebro län','70# ##'],['Umeå','Västerbotten','90# ##']],
  pt_BR:[['Salvador','BA','40###-###'],['Recife','PE','50###-###'],['Porto Alegre','RS','90###-###'],['Fortaleza','CE','60###-###'],['Manaus','AM','69###-###']],
  ja_JP:[['愛知県','名古屋市中区','460-####'],['福岡県','福岡市中央区','810-####'],['神奈川県','横浜市中区','231-####'],['広島県','広島市中区','730-####']],
};
for (const k in EXTRA_CITIES) LOCALES[k].cities.push(...EXTRA_CITIES[k]);

/* full names for abbreviated regions (used for labels and for dropdowns that list full names) */
const REGION_NAMES = {};
const _RN = ({ US:{NY:'New York',CA:'California',IL:'Illinois',TX:'Texas',WA:'Washington',FL:'Florida',CO:'Colorado',MA:'Massachusetts',GA:'Georgia',PA:'Pennsylvania',AZ:'Arizona',OH:'Ohio',MI:'Michigan',OR:'Oregon',NV:'Nevada',TN:'Tennessee',LA:'Louisiana',MN:'Minnesota',MO:'Missouri',NC:'North Carolina',VA:'Virginia',MD:'Maryland',UT:'Utah',WI:'Wisconsin',IN:'Indiana',HI:'Hawaii',OK:'Oklahoma',KY:'Kentucky',DC:'District of Columbia'},
   CA:{ON:'Ontario',BC:'British Columbia',QC:'Quebec',AB:'Alberta',MB:'Manitoba',NS:'Nova Scotia',SK:'Saskatchewan',NL:'Newfoundland and Labrador',NB:'New Brunswick'},
   AU:{NSW:'New South Wales',VIC:'Victoria',QLD:'Queensland',WA:'Western Australia',SA:'South Australia',TAS:'Tasmania',ACT:'Australian Capital Territory',NT:'Northern Territory'},
   BR:{SP:'São Paulo',RJ:'Rio de Janeiro',DF:'Distrito Federal',PR:'Paraná',MG:'Minas Gerais',BA:'Bahia',PE:'Pernambuco',RS:'Rio Grande do Sul',CE:'Ceará',AM:'Amazonas'},
   IT:{RM:'Roma',MI:'Milano',NA:'Napoli',TO:'Torino',FI:'Firenze',BO:'Bologna',GE:'Genova',PA:'Palermo',VR:'Verona',BA:'Bari'} })

for (const cc in _RN) for (const ab in _RN[cc]) REGION_NAMES[cc+'_'+ab] = _RN[cc][ab];

const regionOf = (L, c) => L.style === 'J' ? c[0] : c[1];           // Japan: the prefecture is the "state"
function regionsFor(code){ const L = LOCALES[code]; return [...new Set(L.cities.map(c => regionOf(L, c)))].sort((a,b) => a.localeCompare(b)); }
function regionLabel(code, r){ const n = REGION_NAMES[code.slice(-2)+'_'+r]; return n && n !== r ? `${r} — ${n}` : r; }


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
    'Montréal':['H2X #$#','H2Y #$#','H3B #$#','H3A #$#','H3G #$#','H2L #$#','H2T #$#','H4C #$#'],
    'Calgary':['T2P #$#','T2R #$#','T2G #$#','T3E #$#','T2E #$#','T2S #$#'],
    'Ottawa':['K1P #$#','K1N #$#','K1R #$#','K2P #$#','K1S #$#','K1Y #$#'],
    'Winnipeg':['R3C #$#','R3B #$#','R3L #$#','R3M #$#','R3G #$#','R2M #$#'],
    'Halifax':['B3H #$#','B3J #$#','B3K #$#','B3L #$#','B3M #$#'],
    'Edmonton':['T5J #$#','T5K #$#','T6E #$#','T5H #$#','T6G #$#'],
    'Québec':['G1R #$#','G1K #$#','G1V #$#','G1S #$#'],
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
    'München':W5('80331 80333 80335 80469 80539 80636 80687 80801 80939 81241'),
    'Hamburg':W5('20095 20097 20144 20146 20253 20354 20457 22083 22765'),
    'Köln':W5('50667 50668 50672 50674 50676 50823 50935 50968'),
    'Frankfurt am Main':W5('60311 60313 60314 60316 60318 60323 60385 60486'),
    'Stuttgart':W5('70173 70174 70178 70182 70190 70372 70469 70563'),
    'Dresden':W5('01067 01069 01099 01307 01309'), 'Hannover':W5('30159 30161 30163 30169 30171 30451 30559'),
    'Nürnberg':W5('90402 90403 90408 90409 90419 90429 90443'),
    'Düsseldorf':W5('40210 40211 40212 40213 40217 40233 40474 40545'), 'Bremen':W5('28195 28203 28205 28209 28211 28217 28325') },
  fr_FR:{ 'Paris':rng(75001,75020), 'Lyon':rng(69001,69009), 'Marseille':rng(13001,13016),
    'Toulouse':W5('31000 31100 31200 31300 31400 31500'), 'Nice':W5('06000 06100 06200 06300'),
    'Bordeaux':W5('33000 33100 33200 33300 33800'), 'Strasbourg':W5('67000 67100 67200'), 'Lille':W5('59000 59800 59160'),
    'Nantes':W5('44000 44100 44200 44300'), 'Montpellier':W5('34000 34070 34080 34090'), 'Rennes':W5('35000 35200 35700') },
  es_ES:{ 'Madrid':rng(28001,28050), 'Barcelona':rng(8001,8042), 'Valencia':rng(46001,46025), 'Sevilla':rng(41001,41020),
    'Bilbao':rng(48001,48015), 'Zaragoza':rng(50001,50018), 'Málaga':rng(29001,29018), 'Palma':rng(7001,7015), 'Murcia':rng(30001,30011) },
  it_IT:{ 'Roma':[...rng(118,199), '00100'].map(x => x.padStart(5,'0')), 'Milano':rng(20121,20162), 'Napoli':rng(80121,80147), 'Torino':rng(10121,10156),
    'Firenze':rng(50121,50145), 'Bologna':rng(40121,40141), 'Genova':rng(16121,16167), 'Palermo':rng(90121,90151),
    'Verona':rng(37121,37142), 'Bari':rng(70121,70132) },
  nl_NL:{ 'Amsterdam':W5('1011 1012 1013 1015 1016 1017 1018 1051 1071 1072 1073 1074 1091 1092').map(x => x+' @@'),
    'Rotterdam':W5('3011 3012 3013 3014 3015 3016 3021 3022 3024 3032').map(x => x+' @@'),
    'Utrecht':W5('3511 3512 3513 3514 3521 3522 3531 3582').map(x => x+' @@'),
    'Den Haag':W5('2511 2512 2513 2514 2515 2516 2517 2518 2521 2562').map(x => x+' @@'),
    'Eindhoven':W5('5611 5612 5613 5614 5615 5616 5617 5621').map(x => x+' @@'),
    'Groningen':W5('9711 9712 9713 9714 9715 9716 9718 9721').map(x => x+' @@'),
    'Maastricht':W5('6211 6212 6213 6214 6221 6222 6223 6224').map(x => x+' @@'),
    'Arnhem':W5('6811 6812 6813 6814 6815 6816 6821 6822').map(x => x+' @@') },
  sv_SE:{ 'Stockholm':['111 20','111 21','111 22','111 29','111 30','111 51','114 32','114 35','118 20','118 46','117 43'],
    'Göteborg':['411 01','411 05','411 11','411 18','413 01','414 51'], 'Malmö':['211 11','211 20','211 22','211 34','212 11'],
    'Uppsala':['753 10','753 20','752 37'], 'Linköping':['582 22','582 24','582 25'], 'Örebro':['702 11','702 22','703 61'], 'Umeå':['903 29','903 32','901 87'] },
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
  ja_JP:{ '渋谷区':['150-0002','150-0001','150-0043','150-0041','150-0013'], '新宿区':['160-0022','160-0023','160-0021','163-8001'],
    '大阪市北区':['530-0001','530-0002','530-0003','530-0012','530-0017'], '京都市中京区':['604-8001','604-8005','604-8006','604-8101'],
    '札幌市中央区':['060-0001','060-0002','060-0003','060-0042','060-0061'], '名古屋市中区':['460-0001','460-0002','460-0003','460-0008'],
    '福岡市中央区':['810-0001','810-0004','810-0041','810-0073'], '横浜市中区':['231-0002','231-0005','231-0023','231-0033'],
    '広島市中区':['730-0011','730-0013','730-0021'] },
};
const postalFor = (code, c) => {
  const L = LOCALES[code], key = L.style === 'J' ? c[1] : c[0], list = POSTAL[code] && POSTAL[code][key];
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
  hu:{f:['Bence','Anna','Márk','Eszter','Gábor','Katalin','Zoltán','Réka','Péter','Dóra'],l:['Nagy','Kovács','Tóth','Szabó','Horváth','Varga','Kiss','Molnár','Németh','Farkas']},
  sv:{f:['Erik','Maja','Oskar','Elsa','Axel','Ebba','Lars','Astrid','Nils','Freja'],l:['Andersson','Johansson','Karlsson','Nilsson','Eriksson','Larsson','Olsson','Persson','Svensson','Gustafsson']},
  pt:{f:['João','Maria','Pedro','Ana','Lucas','Beatriz','Rafael','Camila','Gustavo','Juliana'],l:['Silva','Santos','Oliveira','Souza','Pereira','Costa','Rodrigues','Almeida','Nascimento','Lima']},
  ja:{f:['太郎','花子','健太','美咲','大輔','陽子','翔','愛','直樹','由美'],l:['佐藤','鈴木','高橋','田中','伊藤','渡辺','山本','中村','小林','加藤']},
};
const NAME_SET = {en_IE:'ie', en_IN:'in', de_DE:'de', fr_FR:'fr', es_ES:'es', it_IT:'it', nl_NL:'nl', sv_SE:'sv', hu_HU:'hu', pt_BR:'pt', ja_JP:'ja'};
const ascii = s => s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-zA-Z]/g,'').toLowerCase();
function person(code){
  const n = NAMES[NAME_SET[code] || 'en'], first = pick(n.f), last = pick(n.l);
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
    case 'J': return `〒${f.postal} ${f.city}${f.region}${f.street}`;
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
    if (L.style === 'J'){ f.city = c[0]; f.region = c[1]; } else f.region = c[1];
    const tax = TAX[L.tax]({gst:c[3]}); tax.value = tax.value.replace(/[^A-Za-z0-9]/g, ""); // strip dashes/spaces/dots/slashes
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

