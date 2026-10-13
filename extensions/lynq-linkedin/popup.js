const CRM='https://shelingcynthia.pages.dev/';
const status=document.getElementById('status'),button=document.getElementById('import');
function message(text,error=false){status.textContent=text;status.classList.toggle('error',error)}
document.getElementById('openCrm').onclick=()=>chrome.tabs.create({url:CRM});
button.onclick=async()=>{
 button.disabled=true;message('De geladen profielen worden gelezen…');
 try{
  const [active]=await chrome.tabs.query({active:true,currentWindow:true});if(!active?.id)throw Error('Open eerst je LinkedIn-zoekopdracht.');
  const extracted=await chrome.scripting.executeScript({target:{tabId:active.id},func:extractLinkedInResults});const payload=extracted[0]?.result;
  if(!payload?.profiles?.length)throw Error('Geen herkenbare personen gevonden. Controleer of de resultaten geladen zijn, scroll door de pagina en probeer opnieuw.');
  const tabs=await chrome.tabs.query({url:CRM+'*'});const crm=tabs[0];if(!crm?.id)throw Error('Open LYNQ via de knop hieronder en log in. Ga daarna terug naar LinkedIn en klik opnieuw op Toevoegen aan LYNQ.');
  const delivered=await chrome.scripting.executeScript({target:{tabId:crm.id},world:'MAIN',func:payload=>{try{if(!window.LynqOutreach?.importBrowserProfiles)return{ok:false,error:'Ververs LYNQ zodat de nieuwste versie wordt geladen.'};return window.LynqOutreach.importBrowserProfiles(payload)}catch(e){return{ok:false,error:e.message||'Import niet beschikbaar.'}}},args:[payload]});const result=delivered[0]?.result;
  if(!result?.ok)throw Error(result?.error||'De resultaten konden niet naar LYNQ worden gestuurd.');
  message(`${result.count} profielen naar LYNQ gestuurd. Controleer het voorbeeld en bevestig de import in het CRM.`);
  await chrome.tabs.update(crm.id,{active:true});
 }catch(e){message(e.message||'Import niet gelukt. Ververs LinkedIn en probeer opnieuw.',true)}finally{button.disabled=false}
};
