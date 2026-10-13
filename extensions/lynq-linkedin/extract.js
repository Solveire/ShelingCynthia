/* Executed on demand in the active LinkedIn tab; no network or session access. */
function extractLinkedInResults(){
 const page=new URL(location.href);if(page.protocol!=='https:'||!/(^|\.)linkedin\.com$/.test(page.hostname)||page.pathname.replace(/\/$/,'')!=='/search/results/people')throw Error('Open in LinkedIn een zoekresultatenpagina met Personen.');
 const main=document.querySelector('main');if(!main)throw Error('De resultaten zijn nog niet geladen. Wacht even en probeer opnieuw.');
 const seen=new Set(),profiles=[];
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const visible=e=>{const box=e.getBoundingClientRect();const style=getComputedStyle(e);return box.width>0&&box.height>0&&style.display!=='none'&&style.visibility!=='hidden'};
 for(const anchor of main.querySelectorAll('a[href*="/in/"]')){
  if(!visible(anchor))continue;let link;try{const u=new URL(anchor.href,page);if(!/(^|\.)linkedin\.com$/.test(u.hostname)||!/^\/in\/[^/]+\/?$/.test(u.pathname))continue;link='https://www.linkedin.com'+u.pathname.replace(/\/$/,'').toLowerCase()}catch{continue}
  if(seen.has(link))continue;
  const card=anchor.closest('.reusable-search__result-container, .entity-result, [data-chameleon-result-urn], [data-view-name="search-result"], li');if(!card)continue;
  const title=card.querySelector('.entity-result__title-text a[href*="/in/"]')||anchor;
  const nameNode=title.querySelector('span[aria-hidden="true"]');let name=clean(nameNode?.innerText||title.innerText).replace(/\s*[·•]\s*(1st|2nd|3rd|1e|2e|3e).*$/i,'').replace(/\s+(View profile|Profiel bekijken)$/i,'');
  if(!name||name.length>180||/^(LinkedIn (Member|lid)|View|Bekijk|Connect|Connectie|Message|Bericht|Follow|Volgen|Premium)$/i.test(name))continue;
  const headline=clean(card.querySelector('.entity-result__primary-subtitle, [data-view-name="search-result-headline"]')?.innerText||'').slice(0,500);
  const city=clean(card.querySelector('.entity-result__secondary-subtitle')?.innerText||'').slice(0,200);
  seen.add(link);profiles.push({contact:name,company:name,headline,city,linkedinUrl:link,channel:'LinkedIn',source:link});if(profiles.length>=100)break;
 }
 return {profiles,searchUrl:page.href};
}
