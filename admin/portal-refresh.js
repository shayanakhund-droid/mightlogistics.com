(function(){
  if(window.mightPortalRefresh)return;window.mightPortalRefresh=true;
  const $=s=>document.querySelector(s);
  function busy(){return document.querySelector('.drawer:not(.hidden),.loads-modal:not(.hidden),.carrier-modal:not(.hidden),.quote-preview:not(.hidden),.approval-modal.open')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)}
  function refresh(){
    if(document.hidden||busy())return;
    const admin=$('.sidebar');
    if(admin){
      const visible=$$('.content:not(.hidden)');
      if($('#dashboard')&&!$('#dashboard').classList.contains('hidden'))window.refreshMightDashboard?.();
      else if($('#quotes')&&!$('#quotes').classList.contains('hidden'))$('#refresh')?.click();
      else if($('#loads')&&!$('#loads').classList.contains('hidden'))$('#loadRefresh')?.click();
      else if($('#customers')&&!$('#customers').classList.contains('hidden'))$('#customerRefresh')?.click();
      else if($('#carriers')&&!$('#carriers').classList.contains('hidden'))$('#carrierRefresh')?.click();
    }else if($('#refresh')){$('#refresh').click()}
  }
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  setInterval(refresh,30000);
})();
