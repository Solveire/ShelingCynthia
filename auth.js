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

  function eyeIcon(open=false){
    return open
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.6 4.4 9 5-.4.6-1.6 2.2-3.5 3.6M6.2 6.2C4.4 7.4 3.3 8.9 3 9.4c.4.6 3.8 5 9 5 1 0 2-.2 2.9-.5"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.4-5 9-5 9 5 9 5-3.4 5-9 5-9-5-9-5Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  }

  function ensureOverlay(){
    let overlay=document.getElementById('authOverlay');
    if(overlay) return overlay;
    overlay=document.createElement('div');
    overlay.id='authOverlay';
    overlay.className='auth-overlay';
    overlay.innerHTML=`
      <div class="auth-layout">
        <section class="auth-visual" aria-hidden="true">
          <div class="auth-visual-glow"></div>
          <div class="auth-logo-mark">
            <span></span><span></span><span></span>
            <i></i><i></i>
          </div>
          <div class="auth-visual-copy">
            <span class="auth-eyebrow">LYNQ Agency</span>
            <h2>Alles wat je nodig hebt.<br>Op één rustige plek.</h2>
            <p>Klanten, trajecten, content en planning overzichtelijk bij elkaar.</p>
          </div>
          <div class="auth-visual-meta"><span></span> Private workspace</div>
        </section>

        <section class="auth-panel">
          <div class="auth-panel-inner">
            <div class="auth-mobile-brand">
              <div class="auth-mini-mark"><span></span><span></span><span></span></div>
              <strong>LYNQ Agency</strong>
            </div>

            <div class="auth-heading">
              <span class="auth-kicker">ShelingCynthia</span>
              <h1>Welkom terug</h1>
              <p>Log in om verder te gaan naar je workspace.</p>
            </div>

            <form id="authForm" class="auth-form" novalidate>
              <label>
                <span>E-mailadres</span>
                <input id="authEmail" type="email" value="shelingbusiness@gmail.com" autocomplete="username" required>
              </label>

              <label>
                <div class="auth-label-row"><span>Wachtwoord</span><button class="auth-forgot" id="authForgot" type="button">Wachtwoord vergeten?</button></div>
                <div class="auth-password-wrap">
                  <input id="authPassword" type="password" autocomplete="current-password" required>
                  <button class="auth-eye" id="authEye" type="button" aria-label="Wachtwoord tonen" title="Wachtwoord tonen">${eyeIcon(false)}</button>
                </div>
              </label>

              <div id="authError" class="auth-error" hidden></div>
              <div id="authInfo" class="auth-info" hidden></div>
              <button id="authSubmit" class="auth-submit" type="submit"><span>Inloggen</span><b>→</b></button>
            </form>

            <div class="auth-security"><span class="auth-lock-dot"></span> Beveiligde toegang tot jouw omgeving</div>
          </div>
        </section>
      </div>`;
    document.body.appendChild(overlay);

    const passwordInput=overlay.querySelector('#authPassword');
    const eyeButton=overlay.querySelector('#authEye');
    eyeButton.addEventListener('click',()=>{
      const show=passwordInput.type==='password';
      passwordInput.type=show?'text':'password';
      eyeButton.innerHTML=eyeIcon(show);
      eyeButton.setAttribute('aria-label',show?'Wachtwoord verbergen':'Wachtwoord tonen');
      eyeButton.setAttribute('title',show?'Wachtwoord verbergen':'Wachtwoord tonen');
      passwordInput.focus();
    });

    overlay.querySelector('#authForgot').addEventListener('click',()=>{
      const error=overlay.querySelector('#authError');
      const info=overlay.querySelector('#authInfo');
      error.hidden=true;
      info.textContent='Wachtwoord opnieuw instellen? Neem voorlopig contact op met de beheerder. De e-mailreset wordt in een volgende stap gekoppeld.';
      info.hidden=false;
    });

    overlay.querySelector('#authForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const email=overlay.querySelector('#authEmail').value.trim();
      const password=passwordInput.value;
      const submit=overlay.querySelector('#authSubmit');
      const error=overlay.querySelector('#authError');
      const info=overlay.querySelector('#authInfo');
      error.hidden=true;
      info.hidden=true;
      submit.disabled=true;
      submit.querySelector('span').textContent='Inloggen…';
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
        submit.querySelector('span').textContent='Inloggen';
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