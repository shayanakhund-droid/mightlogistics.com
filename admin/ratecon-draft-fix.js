(function(){
  const $=id=>document.getElementById(id);
  const ids=['load_pickupTimeFrom','load_pickupTimeTo','load_deliveryTimeFrom','load_deliveryTimeTo','load_driverInstructions'];
  let activeId=null,draft={},captureTimer=null;
  function key(){return $('loadForm')?.dataset.id||'new'}
  function capture(){ids.forEach(id=>{const el=$(id);if(el)draft[id]=el.value})}
  function restore(){if(!Object.keys(draft).length)return;ids.forEach(id=>{const el=$(id);if(el&&draft[id]!==undefined)el.value=draft[id]})}
  function clear(){draft={}}
  function init(){
    document.addEventListener('input',e=>{if(ids.includes(e.target?.id))draft[e.target.id]=e.target.value});
    document.addEventListener('click',e=>{if(e.target?.id==='createLoad'){activeId='new';clear();setTimeout(capture,300)}},true);
    setInterval(()=>{
      const modal=$('loadModal');if(!modal||modal.classList.contains('hidden')){activeId=null;return}
      const id=key();
      if(id!==activeId){activeId=id;clear();clearTimeout(captureTimer);captureTimer=setTimeout(capture,1500);return}
      restore();
    },250);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
