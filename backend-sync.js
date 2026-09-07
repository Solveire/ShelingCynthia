(() => {
  const API_BASE = 'https://shelingcynthia-api-production.up.railway.app';
  const TOKEN_KEY = 'lynq-backend-token-v1';
  const MIGRATION_KEY = 'lynq-backend-first-sync-v1';
  let syncTimer = null;
  let syncing = false;
  let pending = false;
  let tokenPrompted = false;

  function token(){ return localStorage.getItem(TOKEN_KEY) || ''; }
  function setStatus(text){ const el=document.querySelector('#saveStatus'); if(el){el.hidden=false;el.textContent=text;} }
  function currentTheme(){
    return {
      primary: localStorage.getItem(THEME_KEY) || DEFAULT_ACCENT,
      secondary: localStorage.getItem(SUBTHEME_KEY) || DEFAULT_SUB_ACCENT
    };
  }
  function applyRemoteTheme(theme){
    if(!theme || typeof theme!=='object') return;
    if(theme.primary && typeof applyBrandColor==='function') applyBrandColor(theme.primary,true);
    if(theme.secondary && typeof applySubColor==='function') applySubColor(theme.secondary,true);
  }
  function snapshot(){
    const lynq=structuredClone(data.lynq);
    const sheling=structuredClone(data.sheling);
    lynq._appTheme=currentTheme();
    return {lynq, sheling};
  }
  function meaningfulWorkspace(w){
    if(!w || typeof w!=='object') return false;
    return (Array.isArray(w.clients)&&w.clients.length>0) || (Array.isArray(w.services)&&w.services.length>0) || Object.keys(w).some(k=>!['clients','services'].includes(k));
  }

  async function api(path, options={}){
    const headers = {...(options.headers||{}), 'Content-Type':'application/json'};
    if(token()) headers.Authorization = `Bearer ${token()}`;
    let res = await fetch(API_BASE+path, {...options, headers});
    if(res.status===401 && !tokenPrompted){
      tokenPrompted=true;
      const value=prompt('Voer de beveiligingscode voor de LYNQ/Sheling database in:');
      if(value){
        localStorage.setItem(TOKEN_KEY,value.trim());
        headers.Authorization=`Bearer ${value.trim()}`;
        res=await fetch(API_BASE+path,{...options,headers});
      }
    }
    if(!res.ok){
      const message=await res.text().catch(()=>res.statusText);
      throw new Error(`Backend ${res.status}: ${message}`);
    }
    if(res.status===204) return null;
    return res.json();
  }

  async function pushNow(){
    if(syncing){pending=true;return}
    syncing=true;pending=false;
    try{
      setStatus('Synchroniseren…');
      await api('/api/state',{method:'PUT',body:JSON.stringify(snapshot())});
      setStatus(`Database bijgewerkt · ${new Date().toLocaleTimeString('nl-NL',{hour:'2-digit',minute:'2-digit'})}`);
    }catch(err){
      console.error('Backend sync failed',err);
      setStatus('Niet gesynchroniseerd · lokaal bewaard');
    }finally{
      syncing=false;
      if(pending) schedulePush(150);
    }
  }

  function schedulePush(delay=500){
    clearTimeout(syncTimer);
    syncTimer=setTimeout(pushNow,delay);
  }

  async function firstLoad(){
    try{
      setStatus('Database verbinden…');
      const remote=await api('/api/state',{method:'GET'});
      const remoteHasData=meaningfulWorkspace(remote?.lynq?.data) || meaningfulWorkspace(remote?.sheling?.data);
      const localHasData=meaningfulWorkspace(data?.lynq) || meaningfulWorkspace(data?.sheling);

      if(remoteHasData){
        if(remote.lynq?.data && Object.keys(remote.lynq.data).length) data.lynq=remote.lynq.data;
        if(remote.sheling?.data && Object.keys(remote.sheling.data).length) data.sheling=remote.sheling.data;
        applyRemoteTheme(remote?.lynq?.data?._appTheme);
        localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
        if(typeof migratePackageImages==='function') migratePackageImages();
        if(typeof ensureWorkspaceExtras==='function') ensureWorkspaceExtras();
        if(typeof renderNav==='function') renderNav();
        if(typeof render==='function') render();
        setStatus('Database verbonden');
      } else if(localHasData){
        if(!localStorage.getItem(MIGRATION_KEY)){
          localStorage.setItem(`${STORAGE_KEY}-pre-backend-backup`,JSON.stringify(data));
        }
        await api('/api/state',{method:'PUT',body:JSON.stringify(snapshot())});
        localStorage.setItem(MIGRATION_KEY,new Date().toISOString());
        setStatus('Database verbonden · lokale gegevens overgezet');
      } else {
        setStatus('Database verbonden');
      }
    }catch(err){
      console.error('Backend initial load failed',err);
      setStatus('Offline modus · lokaal opgeslagen');
    }
  }

  const originalSaveData = saveData;
  saveData = function(msg='Opgeslagen'){
    originalSaveData(msg);
    schedulePush();
  };

  const originalApplyBrandColor = applyBrandColor;
  applyBrandColor = function(hex,save=true){
    const ok=originalApplyBrandColor(hex,save);
    if(ok && save) schedulePush(250);
    return ok;
  };

  const originalApplySubColor = applySubColor;
  applySubColor = function(hex,save=true){
    const ok=originalApplySubColor(hex,save);
    if(ok && save) schedulePush(250);
    return ok;
  };

  window.LynqBackend={
    sync:pushNow,
    clearToken(){localStorage.removeItem(TOKEN_KEY)},
    status:()=>({api:API_BASE,tokenConfigured:!!token(),theme:currentTheme()})
  };

  firstLoad();
})();
