(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  let lastCarrierId='';
  async function applyCarrier(){
    const sel=$('load_carrierId');
    if(!sel||!sel.value||sel.value===lastCarrierId)return;
    lastCarrierId=sel.value;
    const {data,error}=await db.from('carriers').select('id,legal_name,mc_number').eq('id',sel.value).maybeSingle();
    if(error||!data)return;
    const name=$('load_carrierName'),mc=$('load_carrierMc');
    if(name)name.value=data.legal_name||'';
    if(mc)mc.value=data.mc_number||'';
  }
  function init(){
    document.addEventListener('change',e=>{if(e.target?.id==='load_carrierId'){lastCarrierId='';applyCarrier();}});
    setInterval(applyCarrier,250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
