/* AUTO-GENERATED from index.html by build-extension.sh — do not edit */

/* ---------- random helpers (crypto-backed) ---------- */
const rnd = n => { const a = new Uint32Array(1); crypto.getRandomValues(a); return a[0] % n; };
const pick = a => a[rnd(a.length)];
const digits = n => Array.from({length:n}, () => rnd(10)).join('');
const SAFE = 'ABCEGHJKLMNPRSTVWXYZ';
const fill = p => p.replace(/[#@$%]/g, c => c==='#' ? rnd(10) : c==='%' ? 2+rnd(8) : c==='@' ? String.fromCharCode(65+rnd(26)) : SAFE[rnd(SAFE.length)]);
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
  pt_BR:{ country:'Brasil', tax:'BR', style:'F', phone:'11 9####-####',
    name:()=>pick(['Churrascaria Boi Gordo','Cantinho do Sabor','Restaurante Sabor da Terra','Bar do Zé','Casa da Feijoada','Pizzaria Bella Massa','Fogão de Lenha','Sabor Mineiro','Cozinha da Vovó','Mar & Brasa']),
    street:()=>`${pick(['Rua','Avenida','Travessa','Alameda'])} ${pick(['das Flores','Sete de Setembro','Brasil','XV de Novembro','Paulista','dos Andradas','Getúlio Vargas','das Palmeiras','Tiradentes','São João'])}, ${num(1,2500)}`,
    cities:[['São Paulo','SP','01###-###'],['Rio de Janeiro','RJ','20###-###'],['Brasília','DF','70###-###'],['Curitiba','PR','80###-###'],['Belo Horizonte','MG','30###-###']] },
  ja_JP:{ country:'日本', tax:'JP', style:'J', phone:'03-####-####',
    name:()=>pick(['炉端 鳥吉','寿司 匠','ラーメン 一番','居酒屋 まる','天ぷら 華','焼肉 大楽','そば処 藤','串焼き とり正','うなぎ 松葉','カフェ 桜']),
    street:()=>`${pick(['中央','本町','栄','駅前','新町','道玄坂','銀座','神田','桜木','港'])}${num(1,6)}-${num(1,30)}-${num(1,20)}`,
    cities:[['東京都','渋谷区','1##-####'],['東京都','新宿区','16#-####'],['大阪府','大阪市北区','53#-####'],['京都府','京都市中京区','60#-####'],['北海道','札幌市中央区','06#-####']] },
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
  sv:{f:['Erik','Maja','Oskar','Elsa','Axel','Ebba','Lars','Astrid','Nils','Freja'],l:['Andersson','Johansson','Karlsson','Nilsson','Eriksson','Larsson','Olsson','Persson','Svensson','Gustafsson']},
  pt:{f:['João','Maria','Pedro','Ana','Lucas','Beatriz','Rafael','Camila','Gustavo','Juliana'],l:['Silva','Santos','Oliveira','Souza','Pereira','Costa','Rodrigues','Almeida','Nascimento','Lima']},
  ja:{f:['太郎','花子','健太','美咲','大輔','陽子','翔','愛','直樹','由美'],l:['佐藤','鈴木','高橋','田中','伊藤','渡辺','山本','中村','小林','加藤']},
};
const NAME_SET = {en_IE:'ie', en_IN:'in', de_DE:'de', fr_FR:'fr', es_ES:'es', it_IT:'it', nl_NL:'nl', sv_SE:'sv', pt_BR:'pt', ja_JP:'ja'};
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
function generate(code){
  const L = LOCALES[code];
  for (let attempt = 0; attempt < 50; attempt++){
    const c = pick(L.cities);
    const city = c[0];
    const f = { name: L.name(), street: L.street(), city, region:'', postal: fill(c[2]), country: L.country };
    if (L.style === 'J'){ f.city = c[0]; f.region = c[1]; } else f.region = c[1];
    const tax = TAX[L.tax]({gst:c[3]});
    const phone = fill(L.phone).replace(/\D/g,'');   // national number, digits only (no country code)
    const full = assemble(L, f);
    const who = person(code);
    const key = f.name + full + tax.value + who.email;
    if (seen.has(key)) continue;
    seen.add(key);
    return { f, tax, phone, full, who };
  }
  throw new Error('Could not produce a unique result');
}

