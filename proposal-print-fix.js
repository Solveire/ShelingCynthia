(() => {
  function waitForImage(img){
    if(img.complete && img.naturalWidth>0) return Promise.resolve();
    return new Promise(resolve=>{
      const done=()=>resolve();
      img.addEventListener('load',done,{once:true});
      img.addEventListener('error',done,{once:true});
      setTimeout(done,4000);
    });
  }

  window.proposalPrint = async function proposalPrint(){
    if(typeof proposalValidate==='function' && !proposalValidate()) return;
    const p=typeof proposalCurrent==='function'?proposalCurrent():null;
    if(!p) return;
    const w=window.open('','_blank');
    if(!w){
      if(typeof toast==='function') toast('Sta pop-ups toe om het voorstel af te drukken.');
      return;
    }

    const cssUrl=new URL('proposals.css',location.href).href;
    w.document.write('<!doctype html><html lang="nl"><head><meta charset="utf-8"><title>'+esc(p.number)+'</title><link rel="stylesheet" href="'+esc(cssUrl)+'"><style>html,body{background:#fff!important;-webkit-print-color-adjust:exact!important;print-color-adjust:exact!important}.proposal-document-cover-img{display:block!important;visibility:visible!important;opacity:1!important}</style></head><body class="proposal-print"><article class="proposal-document">'+proposalDocument(p)+'</article></body></html>');
    w.document.close();

    const printWhenReady=async()=>{
      const images=[...w.document.images];
      await Promise.all(images.map(waitForImage));
      if(w.document.fonts?.ready) await w.document.fonts.ready.catch(()=>{});
      await new Promise(r=>setTimeout(r,250));
      w.focus();
      w.print();
    };

    if(w.document.readyState==='complete') printWhenReady();
    else w.addEventListener('load',printWhenReady,{once:true});
  };
})();