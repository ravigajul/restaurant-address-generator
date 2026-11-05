// End-to-end test: launches real Chrome (or Edge via BROWSER=/path/to/msedge) with the extension loaded, runs Generate + Fill
// against tests/site/*.html and checks every field. Usage: cd tests && npm i && npm test
const puppeteer=require('puppeteer-core'),http=require('http'),fs=require('fs'),path=require('path'),crypto=require('crypto');
const SRC=path.join(__dirname,'..','extension');
const EXT=fs.mkdtempSync(require('os').tmpdir()+'/ext-test-'); fs.cpSync(SRC,EXT,{recursive:true});
const mf=JSON.parse(fs.readFileSync(EXT+'/manifest.json')); mf.host_permissions=['http://127.0.0.1/*']; fs.writeFileSync(EXT+'/manifest.json',JSON.stringify(mf,null,1)); // test-only: stands in for the activeTab grant a toolbar click gives
const srv=http.createServer((q,r)=>{const f=path.join(__dirname,'site',q.url.split('?')[0]);fs.existsSync(f)?(r.setHeader('content-type','text/html'),r.end(fs.readFileSync(f))):(r.statusCode=404,r.end())}).listen(0);
const PORT=srv.address().port;
const extId=crypto.createHash('sha256').update(EXT).digest('hex').slice(0,32).replace(/./g,c=>String.fromCharCode(97+parseInt(c,16)));
(async()=>{
 const browser=await puppeteer.launch({executablePath:process.env.BROWSER||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:false,pipe:true,
   enableExtensions:[EXT],userDataDir:fs.mkdtempSync('/tmp/pp-'),args:['--no-first-run','--no-default-browser-check']});
 const extId=await browser.installExtension?.(EXT).catch(()=>null) ?? null; if(extId) global.__id=extId;
 let fails=0; const check=(c,m)=>{console.log((c?'  PASS ':'  FAIL ')+m); if(!c)fails++;};
 async function run(page,locale,region){
   const formUrl=`http://127.0.0.1:${PORT}/${page}`;
   const form=await browser.newPage(); await form.goto(formUrl);
   const pop=await browser.newPage(); await pop.goto(`chrome-extension://${global.__id||extId}/popup.html`);
   const errs=[]; pop.on('pageerror',e=>errs.push(e.message)); pop.on('console',m=>m.type()==='error'&&errs.push(m.text()));
   await pop.evaluate(async url=>{const [t]=await chrome.tabs.query({url}); chrome.tabs.query=async()=>[t];},formUrl);
   await pop.$eval('#loc',(e,v)=>{e.value=v;e.dispatchEvent(new Event('input'))},locale);
   if(region) await pop.$eval('#reg',(e,v)=>e.value=v,region); await pop.click('#gen');
   const rows=await pop.$$eval('.f',els=>els.map(e=>[e.children[0].textContent,e.children[1].textContent]));
   await pop.click('#fill');
   await pop.waitForFunction(()=>/Filled|No matching|Could not|⚠|allow/.test(document.getElementById('msg').textContent),{timeout:15000}).catch(async()=>{console.log('  TIMEOUT msg=',await pop.$eval('#msg',e=>e.textContent),'errs=',errs)});
   const msg=await pop.$eval('#msg',e=>e.textContent);
   const vals=await form.$$eval('input,select',els=>Object.fromEntries(els.map(e=>[e.name,e.tagName==='SELECT'?(e.selectedOptions[0]?.textContent||''):e.value])));
   await pop.close(); await form.close(); return {rows,msg,vals,errs};
 }
 const R=(rows,k)=>rows.find(r=>r[0]===k)?.[1];
 for(const [locale,expState,expCountry] of [['en_US',null,'United States'],['en_AU',null,'Australia'],['en_CA',null,'Canada'],['en_IT',null,'Italy']]){
   console.log(`\n== us.html with ${locale}`); const {rows,msg,vals,errs}=await run('us.html',locale);
   console.log('  popup:',msg.replace(/\n/g,' | ')); check(!errs.length,'no popup errors '+errs.join(';'));
   check(vals.firstName===R(rows,'First name')&&vals.lastName===R(rows,'Last name'),`names ${vals.firstName} ${vals.lastName}`);
   check(/^[^@\s]+@example\.com$/.test(vals.email),'email '+vals.email);
   check(/^\d+$/.test(vals.phone)&&vals.phone===R(rows,'Phone (no code)'),'phone digits only, no +CC: '+vals.phone);
   check(vals.businessName===R(rows,'Restaurant'),'business '+vals.businessName);
   check(vals.address1===R(rows,'Street')&&vals.address2==='','street (suite left blank) '+vals.address1);
   check(vals.city===R(rows,'City'),'city '+vals.city); check(vals.zip===R(rows,'Postal code'),'zip '+vals.zip);
   check(vals.country===expCountry,'country select '+vals.country);
   const reg=R(rows,'State/Region'); if(['en_US','en_AU','en_CA'].includes(locale)) check(vals.state && !/Select/.test(vals.state) && vals.state!=='','STATE selected: '+reg+' -> '+JSON.stringify(vals.state));
   check(vals.taxId===rows.at(-1)[1],'tax '+vals.taxId);
 }
 for(const [locale,typed,key,city,stateName] of [['en_US','WA','WA','Seattle','Washington'],['en_AU','wa','WA','Perth','Western Australia'],['en_CA','NS','NS','Halifax','Nova Scotia'],
     ['en_US','ny','NY',null,'New York'],['en_US','newyork','NY',null,'New York'],['en_US','New York','NY',null,'New York'],['en_US','GA','GA','Atlanta','Georgia'],
     ['en_US','georgia','GA','Atlanta','Georgia'],['en_US','wash','WA','Seattle','Washington'],['en_AU','western australia','WA','Perth','Western Australia']]){
   console.log(`\n== us.html with ${locale} + typed state "${typed}"`); const {rows,msg,vals,errs}=await run('us.html',locale,typed);
   console.log('  popup:',msg.replace(/\n/g,' | ')); check(!errs.length,'no popup errors '+errs.join(';'));
   check(R(rows,'State/Region')===key,'generated state is '+R(rows,'State/Region'));
   if(city) check(R(rows,'City')===city&&vals.city===city,'city is '+vals.city); else check(vals.city===R(rows,'City'),'city '+vals.city);
   check(vals.state===stateName,'STATE dropdown = '+vals.state);
 }
 { console.log('\n== invalid typed state "zz" is rejected, nothing is filled'); const {rows,msg,vals}=await run('us.html','en_US','zz');
   check(/isn't a state\/region/.test(msg),'message: '+msg.replace(/\n/g,' | ')); check(rows.length===0&&vals.city===''&&vals.firstName==='','preview cleared and form left untouched'); }
 for(const locale of ['de_DE','en_GB','fr_FR','ja_JP']){
   console.log(`\n== plain.html with ${locale}`); const {rows,msg,vals,errs}=await run('plain.html',locale);
   console.log('  popup:',msg.replace(/\n/g,' | ')); check(!errs.length,'no popup errors');
   check(vals['given-name']===R(rows,'First name')&&vals['family-name']===R(rows,'Last name'),'names');
   check(/@example\.com$/.test(vals.user_email),'email'); check(vals.mobile===R(rows,'Phone (no code)')&&/^\d+$/.test(vals.mobile),'phone '+vals.mobile);
   check(vals.company===R(rows,'Restaurant'),'company'); check(vals.account_creator===R(rows,'First name')&&R(rows,'Account creator')===R(rows,'First name'),'account creator = first name: '+vals.account_creator); check(vals.street===R(rows,'Street'),'street'); check(vals.postcode===R(rows,'Postal code'),'postcode '+vals.postcode);
   check(vals.town===R(rows,'City'),'town'); check(vals.region===R(rows,'State/Region'),'region text '+vals.region);
   check(vals.vat===rows.at(-1)[1],'vat '+vals.vat); check(vals.username==='','username untouched');
 }
 console.log(`\n${fails?fails+' FAILURE(S)':'ALL PASSED'}`); await browser.close(); srv.close(); process.exit(fails?1:0);
})().catch(e=>{console.error('HARNESS ERROR',e);process.exit(2)});
