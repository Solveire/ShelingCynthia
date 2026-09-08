(() => {
  const mq = window.matchMedia('(max-width: 850px)');
  const icon = name => ({
    home:'<svg viewBox="0 0 24 24"><path d="M3 10.5 12 3l9 7.5v9a1.5 1.5 0 0 1-1.5 1.5H15v-6H9v6H4.5A1.5 1.5 0 0 1 3 19.5z"/></svg>',
    clients:'<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3"/><path d="M3.5 19c.6-3.1 2.5-5 5.5-5s4.9 1.9 5.5 5M16 5.5a3 3 0 0 1 0 5.8M17 14c2.2.5 3.5 2.1 3.8 4.5"/></svg>',
    tasks:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 2.5 2.5L16 9"/></svg>',
    more:'<svg viewBox="0 0 24 24"><circle cx="5" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.3" fill="currentColor" stroke="none"/><circle cx="19" cy="12" r="1.3" fill="currentColor" stroke="none"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></svg>',
    plus:'<svg viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>',
    services:'<svg viewBox="0 0 24 24"><path d="M4 7.5 12 3l8 4.5v9L12 21l-8-4.5z"/><path d="m4 7.5 8 4.5 8-4.5M12 12v9"/></svg>',
    content:'<svg viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="3"/><path d="M8 4v16M8 10h12"/></svg>',
    proposals:'<svg viewBox="0 0 24 24"><path d="M6 3h9l4 4v14H6z"/><path d="M15 3v5h5M9 12h7M9 16h5"/></svg>',
    finance:'<svg viewBox="0 0 24 24"><rect x="4" y="5" width="16" height="14" rx="3"/><path d="M4 9h16M8 14h4"/></svg>',
    settings:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M19 15.5l1.5 1.5-3.5 3.5-1.5-1.5M8.5 5 7 3.5 3.5 7 5 8.5M12 3V1M12 23v-2M3 12H1M23 12h-2"/></svg>',
    switcher:'<svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="17" cy="7" r="2" fill="currentColor" stroke="none"/><circle cx="12" cy="17" r="2" fill="currentColor" stroke="none"/><path d="M8.7 8.2 10.8 15M15.3 8.2 13.2 15M9 7h6"/></svg>'
  })[name] || '';

  function workspaceName(){ return state.workspace === 'lynq' ? 'LYNQ Agency' : 'ShelingCynthia'; }

  function ensureMobileUI(){
    if(!document.querySelector('.mobile-app-header')){
      const header=document.createElement('header');
      header.className='mobile-app-header';
      header.innerHTML=`
        <button class="mobile-brand-button" id="mobileWorkspaceOpen" type="button">
          <span class="mobile-brand-mark">${icon('switcher')}</span>
          <span class="mobile-brand-copy"><small>Werkruimte</small><strong id="mobileWorkspaceName"></strong></span>
        </button>
        <div class="mobile-header-actions">
          <button class="mobile-header-button" id="mobileSearchOpen" type="button" aria-label="Zoeken">${icon('search')}</button>
          <button class="mobile-header-button" id="mobileQuickAdd" type="button" aria-label="Nieuwe klant">${icon('plus')}</button>
        </div>`;
      document.body.appendChild(header);
      header.querySelector('#mobileWorkspaceOpen').onclick=()=>openMore(true);
      header.querySelector('#mobileSearchOpen').onclick=()=>openMore(false,true);
      header.querySelector('#mobileQuickAdd').onclick=()=>{ if(typeof openNewClient==='function') openNewClient(); };
    }
    if(!document.querySelector('.mobile-bottom-nav')){
      const nav=document.createElement('nav');
      nav.className='mobile-bottom-nav';
      nav.setAttribute('aria-label','Mobiele navigatie');
      nav.innerHTML=`
        <button class="mobile-nav-item" data-mobile-page="dashboard" type="button">${icon('home')}<span>Vandaag</span></button>
        <button class="mobile-nav-item" data-mobile-page="clients" type="button">${icon('clients')}<span>Klanten</span></button>
        <button class="mobile-nav-item" data-mobile-page="tasks" type="button">${icon('tasks')}<span>Taken</span></button>
        <button class="mobile-nav-item" data-mobile-page="more" type="button">${icon('more')}<span>Meer</span></button>`;
      document.body.appendChild(nav);
      nav.querySelectorAll('[data-mobile-page]').forEach(button=>button.onclick=()=>{
        const page=button.dataset.mobilePage;
        if(page==='more') openMore(); else { closeMore(); if(typeof go==='function') go(page); }
      });
    }
    if(!document.querySelector('.mobile-more-layer')){
      const layer=document.createElement('div');
      layer.className='mobile-more-layer';
      layer.id='mobileMoreLayer';
      layer.innerHTML='<div class="mobile-more-sheet" id="mobileMoreSheet"></div>';
      document.body.appendChild(layer);
      layer.addEventListener('click',e=>{ if(e.target===layer) closeMore(); });
    }
    refreshMobileUI();
  }

  function moreItems(){
    const isL=state.workspace==='lynq';
    return [
      ['services',isL?'Pakketten':'Trajecten',isL?'Catalogus & prijzen':'Aanbod & trajecten','services'],
      ...(isL?[[ 'content','Contentplanning','Planning & publicaties','content'],['proposals','Voorstellen','Maken & opvolgen','proposals'],['finance','Financieel','Betalingen & status','finance']]:[[ 'installments','Termijnbetalingen','Termijnen & status','finance']]),
      ['settings','Instellingen','Huisstijl & beheer','settings']
    ];
  }

  function renderMore(searchOpen=false){
    const sheet=document.querySelector('#mobileMoreSheet'); if(!sheet)return;
    const items=moreItems();
    sheet.innerHTML=`
      <div class="mobile-sheet-grab"></div>
      <div class="mobile-more-head"><div><small>Werkruimte</small><strong>${workspaceName()}</strong></div><button class="mobile-sheet-close" type="button" aria-label="Sluiten">×</button></div>
      <div class="mobile-workspace-switch" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:0 0 12px">
        <button type="button" data-mobile-workspace="lynq" style="min-height:42px;border:1px solid rgba(38,27,31,.08);border-radius:12px;background:${state.workspace==='lynq'?'var(--accent-soft)':'#fff'};font:inherit;font-size:11px;font-weight:600;color:${state.workspace==='lynq'?'var(--wine)':'#55484d'}">LYNQ Agency</button>
        <button type="button" data-mobile-workspace="sheling" style="min-height:42px;border:1px solid rgba(38,27,31,.08);border-radius:12px;background:${state.workspace==='sheling'?'var(--accent-soft)':'#fff'};font:inherit;font-size:11px;font-weight:600;color:${state.workspace==='sheling'?'var(--wine)':'#55484d'}">ShelingCynthia</button>
      </div>
      <div class="mobile-search-wrap" style="margin:0 0 12px"><input id="mobileClientSearch" type="search" placeholder="Zoek klant..." style="width:100%;height:44px;border:1px solid rgba(38,27,31,.1);border-radius:13px;padding:0 13px;font:inherit;font-size:13px;outline:none"><div id="mobileSearchResults"></div></div>
      <div class="mobile-more-grid">${items.map(([page,label,sub,ico])=>`<button class="mobile-more-item" data-mobile-more-page="${page}" type="button"><span>${icon(ico)}</span><div><strong>${label}</strong><small>${sub}</small></div></button>`).join('')}</div>
      <div class="mobile-more-account"><button type="button" id="mobileAccountSecurity">Account</button><button class="danger" type="button" id="mobileLogout">Uitloggen</button></div>`;
    sheet.querySelector('.mobile-sheet-close').onclick=closeMore;
    sheet.querySelectorAll('[data-mobile-more-page]').forEach(b=>b.onclick=()=>{closeMore();go(b.dataset.mobileMorePage)});
    sheet.querySelectorAll('[data-mobile-workspace]').forEach(b=>b.onclick=()=>switchWorkspace(b.dataset.mobileWorkspace));
    sheet.querySelector('#mobileAccountSecurity').onclick=()=>{closeMore();window.ShelingAuth?.showAccountSecurity?.()};
    sheet.querySelector('#mobileLogout').onclick=()=>{closeMore();window.ShelingAuth?.logout?.()};
    const input=sheet.querySelector('#mobileClientSearch');
    input.addEventListener('input',()=>renderSearchResults(input.value));
    if(searchOpen)setTimeout(()=>input.focus(),180);
  }

  function renderSearchResults(q){
    const box=document.querySelector('#mobileSearchResults'); if(!box)return;
    const query=String(q||'').trim().toLowerCase();
    if(query.length<2){box.innerHTML='';return;}
    const list=(workspace().clients||[]).filter(c=>[c.company,c.contact,c.email].some(v=>String(v||'').toLowerCase().includes(query))).slice(0,6);
    box.innerHTML=`<div style="display:grid;margin-top:7px;border:1px solid rgba(38,27,31,.08);border-radius:12px;overflow:hidden">${list.map(c=>`<button type="button" data-mobile-client="${c.id}" style="border:0;border-top:1px solid rgba(38,27,31,.06);background:#fff;padding:10px 12px;text-align:left;font:inherit"><strong style="display:block;font-size:12px">${esc(c.company||c.contact||'Klant')}</strong><small style="font-size:10px;color:#8b7d82">${esc(c.email||'')}</small></button>`).join('')||'<div style="padding:12px;font-size:11px;color:#8b7d82">Geen klant gevonden.</div>'}</div>`;
    box.querySelectorAll('[data-mobile-client]').forEach(b=>b.onclick=()=>{closeMore();openClient(b.dataset.mobileClient)});
  }

  function switchWorkspace(next){
    if(!['lynq','sheling'].includes(next)||state.workspace===next)return;
    state.workspace=next;state.page='dashboard';state.clientId=null;state.tab='overview';
    document.querySelector('#workspaceMenu')?.classList.remove('open');
    if(typeof renderNav==='function')renderNav();
    if(typeof render==='function')render();
    if(typeof saveData==='function')saveData('Werkruimte gewisseld');
    renderMore();refreshMobileUI();
  }

  function openMore(workspaceOnly=false,searchOpen=false){
    ensureMobileUI();renderMore(searchOpen);
    const layer=document.querySelector('#mobileMoreLayer');layer?.classList.add('show');
    document.body.style.overflow='hidden';
  }
  function closeMore(){document.querySelector('#mobileMoreLayer')?.classList.remove('show');document.body.style.overflow=''}

  function activeMobilePage(){
    if(state.page==='client')return'clients';
    if(['dashboard','clients','tasks'].includes(state.page))return state.page;
    return'more';
  }
  function refreshMobileUI(){
    const name=document.querySelector('#mobileWorkspaceName');if(name)name.textContent=workspaceName();
    const active=activeMobilePage();
    document.querySelectorAll('.mobile-nav-item').forEach(b=>b.classList.toggle('active',b.dataset.mobilePage===active));
  }

  document.addEventListener('keydown',e=>{if(e.key==='Escape')closeMore()});
  window.addEventListener('resize',()=>{if(!mq.matches)closeMore();refreshMobileUI()});
  const observer=new MutationObserver(()=>refreshMobileUI());
  const start=()=>{
    ensureMobileUI();
    const content=document.querySelector('#content');if(content)observer.observe(content,{childList:true,subtree:false});
    if('serviceWorker' in navigator)navigator.serviceWorker.register('/sw.js').catch(()=>{});
  };
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
})();
