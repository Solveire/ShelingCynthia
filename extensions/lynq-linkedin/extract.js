/* User-triggered DOM reader. No network, cookies, private API or pagination. */
function extractLinkedInResults(){
 const page=new URL(location.href);
 if(page.protocol!=='https:'||!/(^|\.)linkedin\.com$/.test(page.hostname)||page.pathname.replace(/\/$/,'')!=='/search/results/people')throw Error('Open in LinkedIn een zoekresultatenpagina met Personen.');
 const main=document.querySelector('main')||document.querySelector('[role="main"]');
 if(!main)throw Error('De resultaten zijn nog niet geladen. Wacht even en probeer opnieuw.');
 const clean=s=>String(s||'').replace(/\s+/g,' ').trim();
 const nameText=s=>clean(String(s||'').split(/\r?\n/).find(x=>x.trim())||'').replace(/\s*[·•]\s*(1st|2nd|3rd\+?|1e|2e|3e\+?|1ste|2de|3de).*$/i,'').replace(/\s+(View profile|Profiel bekijken)$/i,'');
 const profileUrl=value=>{try{const u=new URL(value,page);return /(^|\.)linkedin\.com$/.test(u.hostname)&&/^\/in\/[^/]+\/?$/.test(u.pathname)?'https://www.linkedin.com'+u.pathname.replace(/\/$/,'').toLowerCase():''}catch{return''}};
 const visible=e=>{
  const style=getComputedStyle(e);if(style.display==='none'||style.visibility==='hidden')return false;
  const rect=e.getBoundingClientRect();if(rect.width>0&&rect.height>0)return true;
  // Modern LinkedIn links use display:contents and therefore have no own box.
  for(const child of e.children||[]){const r=child.getBoundingClientRect(),s=getComputedStyle(child);if(r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden')return true}
  try{const range=document.createRange();range.selectNodeContents(e);const r=range.getBoundingClientRect();return r.width>0&&r.height>0}catch{return false}
 };
 const findCard=anchor=>{
  const old=anchor.closest('.reusable-search__result-container, .entity-result, [data-chameleon-result-urn], [data-view-name="search-result"], li');if(old)return old;
  let node=anchor.parentElement,best=null;
  for(let depth=0;node&&node!==main&&depth<8;depth++,node=node.parentElement){
   const text=node.innerText||'';if(text.length>2500)break;
   if((text.split(/\r?\n/).filter(x=>x.trim()).length>=3)&&node.querySelector('button, [role="button"]'))return node;
   if(text.includes('\n')&&text.length>String(anchor.innerText||'').length)best=node;
  }
  return best;
 };
 const seen=new Set(),profiles=[];let linksFound=0;
 for(const anchor of main.querySelectorAll('a[href*="/in/"]')){
  const link=profileUrl(anchor.href);if(!link)continue;linksFound++;
  if(seen.has(link)||!visible(anchor))continue;
  if(anchor.closest('.entity-result__insights, [data-view-name*="mutual"], [data-view-name*="insight"]'))continue;
  const card=findCard(anchor),title=card?.querySelector('.entity-result__title-text a[href*="/in/"]')||anchor;
  // Do not attribute a mutual-connection link to the result's main person.
  if(profileUrl(title.href)!==link)continue;
  const node=title.querySelector('span[aria-hidden="true"]');
  const name=nameText(node?.innerText||node?.textContent||title.innerText||title.textContent);
  if(!name||name.length>180||/^(LinkedIn (Member|lid)|View|Bekijk|Connect|Connectie|Message|Bericht|Follow|Volgen|Premium)$/i.test(name))continue;
  let headline=clean(card?.querySelector('.entity-result__primary-subtitle, [data-view-name="search-result-headline"]')?.innerText||'');
  let city=clean(card?.querySelector('.entity-result__secondary-subtitle')?.innerText||'');
  if(card&&(!headline||!city)){
   const lines=String(card.innerText||'').split(/\r?\n/).map(clean).filter(Boolean);
   const start=lines.findIndex(line=>nameText(line)===name);
   if(start>=0){const following=lines.slice(start+1).filter(line=>nameText(line)!==name&&!/^(?:[·•]?\s*(?:1st|2nd|3rd|1e|2e|3e|1ste|2de|3de)|Connectie maken|Connect|Bericht|Message|Volgen|Follow)$/i.test(line));
    const candidate=following[0]||'';
    if(!headline&&candidate&&!/(gemeenschappelijke|mutual|Huidig:|Current:|Premium)/i.test(candidate))headline=candidate;
    const location=following[1]||'';
    if(!city&&location&&(/,/.test(location)||/^(Nederland|Netherlands|België|Belgium|United Kingdom|United States)$/i.test(location))&&!/(gemeenschappelijke|mutual|Huidig:|Current:)/i.test(location))city=location;
   }
  }
  seen.add(link);profiles.push({contact:name,company:name,headline:headline.slice(0,500),city:city.slice(0,200),linkedinUrl:link,channel:'LinkedIn',source:link});if(profiles.length>=100)break;
 }
 return{profiles,searchUrl:page.href,linksFound};
}
