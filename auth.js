(() => {
  const API_BASE='https://shelingcynthia-api-production.up.railway.app';
  const SESSION_KEY='sheling-session-v1';
  const USER_KEY='sheling-user-v1';

  function getToken(){ return localStorage.getItem(SESSION_KEY)||''; }
  function getUser(){ try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{return null} }
  function setSession(token,user){
    localStorage.setItem(SESSION_KEY,token);
    localStorage.setItem(USER_KEY,JSON.stringify(user||null));
  }
  function clearSession(){
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
  }

  function ensureOverlay(){
    let overlay=document.getElementById('authOverlay');
    if(overlay) return overlay;
    overlay=document.createElement('div');
    overlay.id='authOverlay';
    overlay.className='auth-overlay';
    overlay.innerHTML=`
      <div class="auth-shell">
        <div class="auth-brand">LYNQ Agency</div>
        <div class="auth-kicker">ShelingCynthia workspace</div>
        <div class="auth-card">
          <div class="auth-icon">SC</div>
          <h1>Welkom terug, Sheling</h1>
          <p>Log in om je klanten, trajecten, content en planning te beheren.</p>
          <form id="authForm" class="auth-form" novalidate>
            <label>E-mailadres<input id="authEmail" type="email" value="shelingbusiness@gmail.com" autocomplete="username" required></label>
            <label>Wachtwoord<input id="authPassword" type="password" autocomplete="current-password" required></label>
            <div id="authError" class="auth-error" hidden></div>
            <button id="authSubmit" type="submit">Inloggen</button>
          </form>
        </div>
        <div class="auth-foot">Beveiligde toegang tot jouw LYNQ Agency omgeving</div>
      </div>`;
    document.body.appendChild(overlay);

    overlay.querySelector('#authForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const email=overlay.querySelector('#authEmail').value.trim();
      const password=overlay.querySelector('#authPassword').value;
      const submit=overlay.querySelector('#authSubmit');
      const error=overlay.querySelector('#authError');
      error.hidden=true;
      submit.disabled=true;
      submit.textContent='Inloggen…';
      try{
        const res=await fetch(`${API_BASE}/auth/login`,{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify({email,password})
        });
        const payload=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(payload.error||'Inloggen is niet gelukt.');
        setSession(payload.token,payload.user);
        hideLogin();
        window.dispatchEvent(new CustomEvent('sheling-auth-ready',{detail:payload.user}));
        if(window.LynqBackend?.reload) window.LynqBackend.reload();
      }catch(err){
        error.textContent=err.message||'Inloggen is niet gelukt.';
        error.hidden=false;
      }finally{
        submit.disabled=false;
        submit.textContent='Inloggen';
      }
    });
    return overlay;
  }

  function showLogin(){
    const overlay=ensureOverlay();
    overlay.classList.add('is-visible');
    document.body.classList.add('auth-locked');
    setTimeout(()=>overlay.querySelector('#authPassword')?.focus(),50);
  }
  function hideLogin(){
    document.getElementById('authOverlay')?.classList.remove('is-visible');
    document.body.classList.remove('auth-locked');
  }
  function logout(){
    clearSession();
    showLogin();
  }

  async function validateExistingSession(){
    if(!getToken()){
      showLogin();
      return false;
    }
    try{
      const res=await fetch(`${API_BASE}/auth/me`,{headers:{Authorization:`Bearer ${getToken()}`}});
      if(!res.ok) throw new Error('session invalid');
      const payload=await res.json();
      localStorage.setItem(USER_KEY,JSON.stringify(payload.user||null));
      hideLogin();
      window.dispatchEvent(new CustomEvent('sheling-auth-ready',{detail:payload.user}));
      return true;
    }catch{
      clearSession();
      showLogin();
      return false;
    }
  }

  document.addEventListener('click',e=>{
    const logoutButton=e.target.closest('#logoutBtn');
    if(!logoutButton) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    logout();
  },true);

  window.ShelingAuth={
    getToken,
    getUser,
    logout,
    showLogin,
    hideLogin,
    validate:validateExistingSession
  };

  validateExistingSession();
})();
