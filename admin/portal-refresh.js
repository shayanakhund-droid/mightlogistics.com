(function(){
  if(window.mightPortalRefresh)return;window.mightPortalRefresh=true;
  const $=s=>document.querySelector(s);
  const $$=(s,r=document)=>[...r.querySelectorAll(s)];
  const isUuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  function getSalesAccountId(){
    const m=location.hash.match(/(?:^|\/)sales\/account\/([0-9a-f-]{36})(?:$|[/?])/i);
    return m&&isUuid(m[1])?m[1]:null;
  }
  function primeSalesOpportunityContext(){
    const id=getSalesAccountId();
    if(!id)return;
    if(window.mightSalesAccountDetailActions?.setAccount)window.mightSalesAccountDetailActions.setAccount(id);
    if(window.mightSalesAccountDetail?.setAccountId)window.mightSalesAccountDetail.setAccountId(id);
  }
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-detail-opportunity],#accountAddOpp,#accountAddOpp2,#accountEdit'))primeSalesOpportunityContext();
  },true);
  primeSalesOpportunityContext();
  function busy(){return document.querySelector('.drawer:not(.hidden),.loads-modal:not(.hidden),.carrier-modal:not(.hidden),.quote-preview:not(.hidden),.approval-modal.open')||['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)}
  function refresh(){
    if(document.hidden||busy())return;
    const admin=$('.sidebar');
    if(admin){
      if($('#dashboard')&&!$('#dashboard').classList.contains('hidden'))window.refreshMightDashboard?.();
      else if($('#quotes')&&!$('#quotes').classList.contains('hidden'))$('#refresh')?.click();
      else if($('#loads')&&!$('#loads').classList.contains('hidden'))$('#loadRefresh')?.click();
      else if($('#customers')&&!$('#customers').classList.contains('hidden'))$('#customerRefresh')?.click();
      else if($('#carriers')&&!$('#carriers').classList.contains('hidden'))$('#carrierRefresh')?.click();
    }else if($('#refresh'))$('#refresh').click();
  }
  setInterval(refresh,30000);
})();