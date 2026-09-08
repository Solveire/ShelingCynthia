(() => {
  const API_BASE='https://shelingcynthia-api-production.up.railway.app';
  const iconSpark='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3ZM18 15l.8 2.2L21 18l-2.2.8L18 21l-.8-2.2L15 18l2.2-.8L18 15Z"/></svg>';
  const iconSend='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4 5 16 7-16 7 3-7-3-7Zm3 7h13"/></svg>';
  let busy=false;
  const history=[];

  function token(){return window.ShelingAuth?.getToken?.()||''}
  function workspaceId(){try{return state.workspace||'lynq'}catch{return'lynq'}}
  function currentContext(){
    try{return{workspace_id:state.workspace||'lynq',client_id:state.clientId||'',page:state.page||'',tab:state.tab||''}}catch{return{workspace_id:'lynq',client_id:'',page:'',tab:''}}
  }
  function suggestions(){
    const ctx=currentContext();
    if(ctx.client_id)return['Vat deze klant voor me samen','Welke taken staan bij deze klant nog open?','Zijn er betalingen of termijnen die aandacht vragen?','Waar vind ik de bestanden van deze klant?'];
    if(ctx.workspace_id==='sheling')return['Wat vraagt vandaag mijn aandacht?','Welke trajecten lopen binnenkort af?','Welke termijnbetalingen staan nog open?','Waar voeg ik een nieuw traject toe?'];
    return['Wat vraagt vandaag mijn aandacht?','Welke klanten hebben nog open taken?','Welke voorstellen staan nog op concept?','Waar vind ik de contentplanning?'];
  }
  function ensureUI(){
    if(!document.querySelector('.lynq-ai-launch')){
      const button=document.createElement('button');button.type='button';button.className='lynq-ai-launch';button.innerHTML=`${iconSpark}<span class="lynq-ai-launch-copy"><strong>LYNQ AI</strong><small>Vraag het gewoon</small></span>`;button.onclick=open;document.body.appendChild(button);
    }
    if(!document.querySelector('.lynq-ai-layer')){
      const layer=document.createElement('div');layer.className='lynq-ai-layer';layer.innerHTML=`<div class="lynq-ai-backdrop"></div><section class="lynq-ai-panel" role="dialog" aria-modal="true" aria-label="LYNQ AI"><header class="lynq-ai-head"><div class="lynq-ai-title"><span class="lynq-ai-mark">${iconSpark}</span><div><strong>LYNQ AI</strong><small>Helpt je zoeken, begrijpen en samenvatten</small></div></div><button class="lynq-ai-close" type="button" aria-label="Sluiten">×</button></header><div class="lynq-ai-messages" id="lynqAiMessages"></div><footer class="lynq-ai-compose"><div class="lynq-ai-input-wrap"><textarea class="lynq-ai-input" id="lynqAiInput" rows="1" placeholder="Vraag iets over een klant of de software..."></textarea><button class="lynq-ai-send" id="lynqAiSend" type="button" aria-label="Versturen">${iconSend}</button></div><small class="lynq-ai-disclaimer">Read-only: LYNQ AI kan niets in je CRM wijzigen.</small></footer></section>`;document.body.appendChild(layer);
      layer.querySelector('.lynq-ai-backdrop').onclick=close;layer.querySelector('.lynq-ai-close').onclick=close;layer.querySelector('#lynqAiSend').onclick=submit;
      const input=layer.querySelector('#lynqAiInput');input.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();submit()}});input.addEventListener('input',()=>{input.style.height='auto';input.style.height=Math.min(input.scrollHeight,110)+'px'});
      renderWelcome();
    }
  }
  function renderWelcome(){const box=document.querySelector('#lynqAiMessages');if(!box)return;box.innerHTML=`<div class="lynq-ai-welcome"><strong>Waar kan ik mee helpen?</strong><p>Ik kan uitleggen waar iets staat en informatie uit de huidige CRM-gegevens samenvatten. Ik verander zelf niets.</p><div class="lynq-ai-suggestions">${suggestions().map(q=>`<button type="button" class="lynq-ai-suggestion" data-ai-suggestion="${esc(q)}">${esc(q)}</button>`).join('')}</div></div>`;box.querySelectorAll('[data-ai-suggestion]').forEach(b=>b.onclick=()=>ask(b.dataset.aiSuggestion))}
  function open(){ensureUI();renderWelcomeIfEmpty();document.querySelector('.lynq-ai-layer')?.classList.add('open');setTimeout(()=>document.querySelector('#lynqAiInput')?.focus(),150)}
  function close(){document.querySelector('.lynq-ai-layer')?.classList.remove('open')}
  function renderWelcomeIfEmpty(){const box=document.querySelector('#lynqAiMessages');if(box&&!box.children.length)renderWelcome()}
  function addMessage(role,text,loading=false){const box=document.querySelector('#lynqAiMessages');if(!box)return null;const el=document.createElement('div');el.className=`lynq-ai-message ${role}${loading?' loading':''}`;el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight;return el}
  function meta(text){const box=document.querySelector('#lynqAiMessages');if(!box)return;const el=document.createElement('div');el.className='lynq-ai-meta';el.textContent=text;box.appendChild(el);box.scrollTop=box.scrollHeight}
  function submit(){const input=document.querySelector('#lynqAiInput');const q=String(input?.value||'').trim();if(!q||busy)return;input.value='';input.style.height='auto';ask(q)}
  async function ask(question){
    ensureUI();document.querySelector('.lynq-ai-layer')?.classList.add('open');if(busy)return;
    addMessage('user',question);history.push({role:'user',content:question});busy=true;const send=document.querySelector('#lynqAiSend');if(send)send.disabled=true;const loading=addMessage('assistant','Even kijken in je workspace…',true);
    try{
      const ctx=currentContext();const res=await fetch(API_BASE+'/api/ai/ask',{method:'POST',headers:{'Content-Type':'application/json',...(token()?{Authorization:`Bearer ${token()}`}:{})},body:JSON.stringify({...ctx,question,history:history.slice(-6)})});
      let payload={};try{payload=await res.json()}catch{}
      if(res.status===401){window.ShelingAuth?.logout?.();throw new Error('Je sessie is verlopen. Log opnieuw in.')}
      if(!res.ok)throw new Error(payload.error||'LYNQ AI kon nu geen antwoord ophalen.');
      const answer=String(payload.answer||'Ik kon hier geen antwoord op vinden.');loading.classList.remove('loading');loading.textContent=answer;history.push({role:'assistant',content:answer});
      meta(payload.scope==='client'?'Gebaseerd op dit klantdossier + softwarehandleiding':'Gebaseerd op je huidige workspace + softwarehandleiding');
    }catch(error){loading.classList.remove('loading');loading.textContent=error.message||'Er ging iets mis.'}
    finally{busy=false;if(send)send.disabled=false;document.querySelector('#lynqAiInput')?.focus()}
  }
  document.addEventListener('keydown',e=>{if(e.key==='Escape'&&document.querySelector('.lynq-ai-layer')?.classList.contains('open'))close()});
  const start=()=>ensureUI();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
  window.LynqAI={open,ask};
})();
