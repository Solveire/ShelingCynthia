(() => {
  const API_BASE='https://shelingcynthia-api-production.up.railway.app';
  const SESSION_KEY='sheling-session-v1';
  const USER_KEY='sheling-user-v1';

  function getToken(){ return localStorage.getItem(SESSION_KEY)||''; }
  function getUser(){ try{return JSON.parse(localStorage.getItem(USER_KEY)||'null')}catch{return null} }
  function setSession(token,user){ localStorage.setItem(SESSION_KEY,token); localStorage.setItem(USER_KEY,JSON.stringify(user||null)); }
  function clearSession(){ localStorage.removeItem(SESSION_KEY); localStorage.removeItem(USER_KEY); }

  function eyeIcon(open=false){
    return open
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.3A10.8 10.8 0 0 1 12 4c5.2 0 8.6 4.4 9 5-.4.6-1.6 2.2-3.5 3.6M6.2 6.2C4.4 7.4 3.3 8.9 3 9.4c.4.6 3.8 5 9 5 1 0 2-.2 2.9-.5"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12s3.4-5 9-5 9 5 9 5-3.4 5-9 5-9-5-9-5Z"/><circle cx="12" cy="12" r="2.5"/></svg>';
  }

  function wireEye(button,input){
    button.addEventListener('click',()=>{
      const show=input.type==='password';
      input.type=show?'text':'password';
      button.innerHTML=eyeIcon(show);
      button.setAttribute('aria-label',show?'Wachtwoord verbergen':'Wachtwoord tonen');
      button.setAttribute('title',show?'Wachtwoord verbergen':'Wachtwoord tonen');
      input.focus();
    });
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
          <div class="auth-logo-mark"><span></span><span></span><span></span><i></i><i></i></div>
          <div class="auth-visual-copy">
            <span class="auth-eyebrow">LYNQ Agency</span>
            <h2><span>Alles wat je nodig hebt.</span><span>Op één rustige plek.</span></h2>
            <p>Klanten, trajecten, content en planning overzichtelijk bij elkaar.</p>
          </div>
          <div class="auth-visual-meta"><span></span> Private workspace</div>
        </section>
        <section class="auth-panel">
          <div class="auth-panel-inner">
            <div class="auth-mobile-brand"><div class="auth-mini-mark"><span></span><span></span><span></span></div><strong>LYNQ Agency</strong></div>
            <div class="auth-heading"><span class="auth-kicker">ShelingCynthia</span><h1>Welkom terug</h1><p>Log in om verder te gaan naar je workspace.</p></div>
            <form id="authForm" class="auth-form" novalidate>
              <label><span>E-mailadres</span><input id="authEmail" type="email" value="shelingbusiness@gmail.com" autocomplete="username" required></label>
              <label>
                <div class="auth-label-row"><span>Wachtwoord</span><button class="auth-forgot" id="authForgot" type="button">Wachtwoord vergeten?</button></div>
                <div class="auth-password-wrap"><input id="authPassword" type="password" autocomplete="current-password" required><button class="auth-eye" id="authEye" type="button" aria-label="Wachtwoord tonen" title="Wachtwoord tonen">${eyeIcon(false)}</button></div>
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
    wireEye(overlay.querySelector('#authEye'),passwordInput);

    overlay.querySelector('#authForgot').addEventListener('click',async()=>{
      const error=overlay.querySelector('#authError');
      const info=overlay.querySelector('#authInfo');
      const button=overlay.querySelector('#authForgot');
      error.hidden=true; info.hidden=true; button.disabled=true; button.textContent='Versturen…';
      try{
        const email=overlay.querySelector('#authEmail').value.trim();
        const res=await fetch(`${API_BASE}/auth/forgot-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email})});
        const payload=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(payload.error||'Resetmail versturen is niet gelukt.');
        info.textContent='Check je inbox. Als dit e-mailadres klopt, ontvang je een link om je wachtwoord opnieuw in te stellen.';
        info.hidden=false;
      }catch(err){ error.textContent=err.message||'Resetmail versturen is niet gelukt.'; error.hidden=false; }
      finally{ button.disabled=false; button.textContent='Wachtwoord vergeten?'; }
    });

    overlay.querySelector('#authForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const email=overlay.querySelector('#authEmail').value.trim();
      const password=passwordInput.value;
      const submit=overlay.querySelector('#authSubmit');
      const error=overlay.querySelector('#authError');
      const info=overlay.querySelector('#authInfo');
      error.hidden=true; info.hidden=true; submit.disabled=true; submit.querySelector('span').textContent='Inloggen…';
      try{
        const res=await fetch(`${API_BASE}/auth/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email,password})});
        const payload=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(payload.error||'Inloggen is niet gelukt.');
        setSession(payload.token,payload.user); hideLogin();
        window.dispatchEvent(new CustomEvent('sheling-auth-ready',{detail:payload.user}));
        if(window.LynqBackend?.reload) window.LynqBackend.reload();
      }catch(err){ error.textContent=err.message||'Inloggen is niet gelukt.'; error.hidden=false; }
      finally{ submit.disabled=false; submit.querySelector('span').textContent='Inloggen'; }
    });
    return overlay;
  }

  function activateResetMode(rawToken){
    const overlay=ensureOverlay();
    const heading=overlay.querySelector('.auth-heading');
    const form=overlay.querySelector('#authForm');
    heading.innerHTML='<span class="auth-kicker">ShelingCynthia</span><h1>Nieuw wachtwoord</h1><p>Kies een nieuw wachtwoord voor je workspace.</p>';
    form.innerHTML=`
      <label><span>Nieuw wachtwoord</span><div class="auth-password-wrap"><input id="resetPassword" type="password" minlength="10" autocomplete="new-password" required><button class="auth-eye" type="button" aria-label="Wachtwoord tonen">${eyeIcon(false)}</button></div></label>
      <label><span>Herhaal nieuw wachtwoord</span><div class="auth-password-wrap"><input id="resetPasswordConfirm" type="password" minlength="10" autocomplete="new-password" required><button class="auth-eye" type="button" aria-label="Wachtwoord tonen">${eyeIcon(false)}</button></div></label>
      <div id="authError" class="auth-error" hidden></div><div id="authInfo" class="auth-info" hidden></div>
      <button id="authSubmit" class="auth-submit" type="submit"><span>Nieuw wachtwoord opslaan</span><b>→</b></button>`;
    form.querySelectorAll('.auth-password-wrap').forEach(w=>wireEye(w.querySelector('.auth-eye'),w.querySelector('input')));
    form.addEventListener('submit',async e=>{
      e.preventDefault();
      const p=form.querySelector('#resetPassword').value, c=form.querySelector('#resetPasswordConfirm').value;
      const error=form.querySelector('#authError'), info=form.querySelector('#authInfo'), submit=form.querySelector('#authSubmit');
      error.hidden=true; info.hidden=true;
      if(p!==c){ error.textContent='De wachtwoorden zijn niet hetzelfde.'; error.hidden=false; return; }
      submit.disabled=true; submit.querySelector('span').textContent='Opslaan…';
      try{
        const res=await fetch(`${API_BASE}/auth/reset-password`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({token:rawToken,newPassword:p})});
        const payload=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(payload.error||'Wachtwoord resetten is niet gelukt.');
        clearSession();
        info.textContent='Gelukt. Je kunt nu inloggen met je nieuwe wachtwoord.'; info.hidden=false;
        history.replaceState({},'',location.pathname);
        setTimeout(()=>location.reload(),1200);
      }catch(err){ error.textContent=err.message||'Wachtwoord resetten is niet gelukt.'; error.hidden=false; }
      finally{ submit.disabled=false; submit.querySelector('span').textContent='Nieuw wachtwoord opslaan'; }
    });
    overlay.classList.add('is-visible'); document.body.classList.add('auth-locked');
  }

  function ensureAccountModal(){
    let layer=document.getElementById('accountSecurityLayer');
    if(layer) return layer;
    layer=document.createElement('div');
    layer.id='accountSecurityLayer'; layer.className='account-security-layer';
    layer.innerHTML=`<div class="account-security-card" role="dialog" aria-modal="true" aria-labelledby="accountSecurityTitle"><button class="account-security-close" type="button" aria-label="Sluiten">×</button><div class="account-security-kicker">Account & beveiliging</div><h2 id="accountSecurityTitle">Wachtwoord wijzigen</h2><p class="account-security-intro">Wijzig hier veilig het wachtwoord waarmee je inlogt op je workspace.</p><div class="account-security-email"><span>E-mailadres</span><strong>shelingbusiness@gmail.com</strong></div><form id="changePasswordForm" class="account-security-form" novalidate><label><span>Huidig wachtwoord</span><div class="auth-password-wrap"><input id="currentPassword" type="password" autocomplete="current-password" required><button class="auth-eye" type="button" aria-label="Wachtwoord tonen">${eyeIcon(false)}</button></div></label><label><span>Nieuw wachtwoord</span><div class="auth-password-wrap"><input id="newPassword" type="password" autocomplete="new-password" minlength="10" required><button class="auth-eye" type="button" aria-label="Wachtwoord tonen">${eyeIcon(false)}</button></div><small>Minimaal 10 tekens.</small></label><label><span>Herhaal nieuw wachtwoord</span><div class="auth-password-wrap"><input id="confirmPassword" type="password" autocomplete="new-password" minlength="10" required><button class="auth-eye" type="button" aria-label="Wachtwoord tonen">${eyeIcon(false)}</button></div></label><div id="changePasswordError" class="auth-error" hidden></div><div id="changePasswordSuccess" class="account-security-success" hidden></div><button id="changePasswordSubmit" class="auth-submit" type="submit"><span>Wachtwoord opslaan</span><b>→</b></button></form></div>`;
    document.body.appendChild(layer);
    layer.querySelectorAll('.auth-password-wrap').forEach(wrap=>wireEye(wrap.querySelector('.auth-eye'),wrap.querySelector('input')));
    layer.querySelector('.account-security-close').addEventListener('click',hideAccountSecurity);
    layer.addEventListener('click',e=>{if(e.target===layer)hideAccountSecurity()});
    layer.querySelector('#changePasswordForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const currentPassword=layer.querySelector('#currentPassword').value, newPassword=layer.querySelector('#newPassword').value, confirmPassword=layer.querySelector('#confirmPassword').value;
      const error=layer.querySelector('#changePasswordError'), submit=layer.querySelector('#changePasswordSubmit');
      error.hidden=true;
      if(newPassword!==confirmPassword){ error.textContent='De nieuwe wachtwoorden zijn niet hetzelfde.'; error.hidden=false; return; }
      submit.disabled=true; submit.querySelector('span').textContent='Opslaan…';
      try{
        const res=await fetch(`${API_BASE}/auth/change-password`,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${getToken()}`},body:JSON.stringify({currentPassword,newPassword})});
        const payload=await res.json().catch(()=>({}));
        if(!res.ok) throw new Error(payload.error||'Wachtwoord wijzigen is niet gelukt.');
        clearSession(); hideAccountSecurity(); showLogin();
        const info=document.querySelector('#authInfo'); if(info){info.textContent='Wachtwoord gewijzigd. Log opnieuw in met je nieuwe wachtwoord.';info.hidden=false;}
      }catch(err){ error.textContent=err.message||'Wachtwoord wijzigen is niet gelukt.'; error.hidden=false; }
      finally{ submit.disabled=false; submit.querySelector('span').textContent='Wachtwoord opslaan'; }
    });
    return layer;
  }

  function showAccountSecurity(){ if(!getToken()) return showLogin(); const layer=ensureAccountModal(); layer.classList.add('is-visible'); document.body.classList.add('account-security-open'); setTimeout(()=>layer.querySelector('#currentPassword')?.focus(),60); }
  function hideAccountSecurity(){ document.getElementById('accountSecurityLayer')?.classList.remove('is-visible'); document.body.classList.remove('account-security-open'); }
  function showLogin(){ const overlay=ensureOverlay(); overlay.classList.add('is-visible'); document.body.classList.add('auth-locked'); setTimeout(()=>overlay.querySelector('#authPassword')?.focus(),50); }
  function hideLogin(){ document.getElementById('authOverlay')?.classList.remove('is-visible'); document.body.classList.remove('auth-locked'); }
  function logout(){ clearSession(); hideAccountSecurity(); showLogin(); }

  async function validateExistingSession(){
    if(!getToken()){ showLogin(); return false; }
    try{
      const res=await fetch(`${API_BASE}/auth/me`,{headers:{Authorization:`Bearer ${getToken()}`}});
      if(!res.ok) throw new Error('session invalid');
      const payload=await res.json(); localStorage.setItem(USER_KEY,JSON.stringify(payload.user||null)); hideLogin(); window.dispatchEvent(new CustomEvent('sheling-auth-ready',{detail:payload.user})); return true;
    }catch{ clearSession(); showLogin(); return false; }
  }

  document.addEventListener('click',e=>{
    const logoutButton=e.target.closest('#logoutBtn');
    if(logoutButton){ e.preventDefault(); e.stopImmediatePropagation(); logout(); return; }
    const profile=e.target.closest('.profile-box');
    if(profile && getToken() && !document.getElementById('authOverlay')?.classList.contains('is-visible')){ e.preventDefault(); e.stopImmediatePropagation(); showAccountSecurity(); }
  },true);
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') hideAccountSecurity(); });

  window.ShelingAuth={getToken,getUser,logout,showLogin,hideLogin,showAccountSecurity,hideAccountSecurity,validate:validateExistingSession};

  const resetToken=new URLSearchParams(location.search).get('reset');
  if(resetToken) activateResetMode(resetToken); else validateExistingSession();
})();
