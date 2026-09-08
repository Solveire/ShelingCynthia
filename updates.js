(() => {
  const VERSION='2026-09-08-ai';
  const SEEN_KEY='lynq-whats-new-seen-v1';
  const bell='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9a6 6 0 0 1 12 0c0 7 3 7 3 7H3s3 0 3-7ZM9.5 20h5"/></svg>';
  const releases=[
    {
      date:'8 september 2026',version:'Nieuw',title:'Slimmer werken in LYNQ',intro:'Deze update maakt de software makkelijker in dagelijks gebruik en geeft Sheling sneller overzicht zonder dat de rustige uitstraling verandert.',
      items:[
        ['LYNQ AI','Vraag waar iets staat, laat een klant samenvatten of check wat aandacht nodig heeft. De assistent is read-only en wijzigt zelf niets.'],
        ['Mobiele app-versie','Een aparte mobiele navigatie, swipebare klanttabs en de mogelijkheid om LYNQ op het iPhone-beginscherm te zetten.'],
        ['Bestanden per klant','Upload documenten en afbeeldingen rechtstreeks in het klantdossier, inclusief categorie, openen, downloaden en verwijderen.'],
        ['Voorstellen verbeterd','Coverfoto’s werken ook in de PDF-preview en voorstellen blijven prettig te maken op desktop en mobiel.'],
        ['Import uit Notion','Importeer klanten vanuit een CSV-export en controleer eerst de kolomkoppelingen en preview.'],
        ['Rustiger beheer','Werkruimtes en datafuncties zijn logischer geplaatst zodat het hoofdmenu minder druk is.']
      ]
    },
    {
      date:'7 september 2026',version:'Basis',title:'Veilige online workspace',intro:'De CRM-omgeving kreeg een echte backend, beveiligde login en centrale synchronisatie.',
      items:[
        ['Login & beveiliging','Persoonlijk account, sessiebeveiliging en wachtwoord wijzigen.'],
        ['Online database','LYNQ Agency en ShelingCynthia synchroniseren met de centrale database.'],
        ['Klantdossiers','Taken, notities, tijdlijn, pakketten, trajecten, content en betalingen komen per klant samen.'],
        ['Twee werkruimtes','LYNQ Agency en ShelingCynthia blijven inhoudelijk gescheiden binnen één omgeving.']
      ]
    }
  ];

  function escHtml(value=''){return String(value).replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[m]))}
  function seen(){return localStorage.getItem(SEEN_KEY)===VERSION}
  function markSeen(){localStorage.setItem(SEEN_KEY,VERSION);document.querySelectorAll('.updates-trigger,.mobile-update-entry').forEach(el=>el.classList.add('seen'))}
  function ensureDesktopTrigger(){
    if(document.querySelector('.updates-trigger'))return;
    const actions=document.querySelector('.topbar-actions');if(!actions)return;
    const b=document.createElement('button');b.type='button';b.className='updates-trigger'+(seen()?' seen':'');b.innerHTML=`${bell}<span>Nieuw</span><i class="updates-dot" aria-hidden="true"></i>`;b.onclick=open;
    const account=actions.querySelector('.topbar-account');if(account)actions.insertBefore(b,account);else actions.prepend(b);
  }
  function releaseHtml(r){return `<section class="updates-release"><div class="updates-date"><strong>${escHtml(r.date)}</strong><small>LYNQ update</small><span class="updates-badge">${escHtml(r.version)}</span></div><div class="updates-content"><h3>${escHtml(r.title)}</h3><p>${escHtml(r.intro)}</p><div class="updates-list">${r.items.map(([title,text])=>`<article class="updates-item"><strong>${escHtml(title)}</strong><span>${escHtml(text)}</span></article>`).join('')}</div></div></section>`}
  function ensureLayer(){
    if(document.querySelector('.updates-layer'))return;
    const layer=document.createElement('div');layer.className='updates-layer';layer.innerHTML=`<section class="updates-card" role="dialog" aria-modal="true" aria-label="Wat is nieuw"><header class="updates-head"><div><small>LYNQ Agency</small><h2>Wat is er nieuw?</h2><p>De belangrijkste verbeteringen in je workspace, kort bij elkaar.</p></div><button type="button" class="updates-close" aria-label="Sluiten">×</button></header><div class="updates-body">${releases.map(releaseHtml).join('')}</div></section>`;document.body.appendChild(layer);layer.addEventListener('click',e=>{if(e.target===layer)close()});layer.querySelector('.updates-close').onclick=close;
  }
  function open(){ensureLayer();markSeen();document.querySelector('.updates-layer')?.classList.add('open');document.body.style.overflow='hidden'}
  function close(){document.querySelector('.updates-layer')?.classList.remove('open');document.body.style.overflow=''}
  function injectMobile(){
    const sheet=document.querySelector('#mobileMoreSheet');if(!sheet||sheet.querySelector('.mobile-update-entry'))return;
    const grid=sheet.querySelector('.mobile-more-grid');if(!grid)return;
    const button=document.createElement('button');button.type='button';button.className='mobile-more-item mobile-update-entry'+(seen()?' seen':'');button.innerHTML=`<span>${bell}</span><div><strong>Wat is nieuw</strong><small>Bekijk de laatste updates</small></div><i class="updates-dot" aria-hidden="true"></i>`;button.onclick=()=>{document.querySelector('#mobileMoreLayer')?.classList.remove('show');document.body.style.overflow='';open()};grid.appendChild(button);
  }
  const observer=new MutationObserver(()=>{ensureDesktopTrigger();injectMobile()});
  const start=()=>{ensureDesktopTrigger();ensureLayer();injectMobile();observer.observe(document.body,{childList:true,subtree:true})};
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.updates-layer')?.classList.contains('open'))close()});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.LynqUpdates={open};
})();
