(function(){
  const $=id=>document.getElementById(id);
  let patched=null;

  function patch(){
    const b=$('rateconAction');
    if(!b||!b.onclick||b.dataset.popupPatched==='1')return;
    const original=b.onclick;
    b.dataset.popupPatched='1';
    b.onclick=async function(e){
      // Open exactly one tab synchronously from the user's click. Chrome allows this
      // because it happens before the rate-con workflow performs any async work.
      const rateTab=window.open('about:blank','_blank');
      if(!rateTab){
        alert('Chrome blocked the Rate Confirmation tab. Please allow pop-ups for mightlogistics.com.');
        return;
      }
      rateTab.document.open();
      rateTab.document.write('<!doctype html><html><body style="font-family:Arial,sans-serif;padding:40px;color:#17202b"><strong>Might Logistics</strong><p>Generating Rate Confirmation…</p></body></html>');
      rateTab.document.close();

      const nativeOpen=window.open;
      let gmailUrl='';
      let rateConsumed=false;
      window.open=function(url,target,features){
        const value=String(url||'');
        if(value.startsWith('blob:')||value.startsWith('data:')){
          rateConsumed=true;
          try{rateTab.location.href=value}catch{}
          return rateTab;
        }
        if(value.startsWith('https://mail.google.com/mail/')){
          gmailUrl=value;
          return {closed:false};
        }
        return nativeOpen.call(window,url,target,features);
      };

      try{
        await original.call(this,e);
      }finally{
        window.open=nativeOpen;
        if(gmailUrl){
          // Navigate the existing portal tab to Gmail instead of opening a second
          // popup. This is not subject to the browser popup blocker.
          window.location.href=gmailUrl;
        }else if(!rateConsumed&&!rateTab.closed){
          rateTab.document.open();
          rateTab.document.write('<!doctype html><html><body style="font-family:Arial,sans-serif;padding:40px;color:#b42318"><h2>Rate Confirmation was not opened</h2><p>The document was generated, but the preview could not be opened.</p></body></html>');
          rateTab.document.close();
        }
      }
    };
  }

  function init(){
    patch();
    new MutationObserver(patch).observe(document.body,{childList:true,subtree:true});
    setInterval(patch,500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
