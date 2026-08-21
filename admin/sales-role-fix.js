(function(){
  if(window.mightSalesRoleFixLoaded)return;window.mightSalesRoleFixLoaded=true;
  function addOption(select,value,label,afterValue){if(!select||select.querySelector('option[value="'+value+'"]'))return;const o=document.createElement('option');o.value=value;o.textContent=label;const after=select.querySelector('option[value="'+afterValue+'"]');if(after&&after.nextSibling)select.insertBefore(o,after.nextSibling);else select.appendChild(o)}
  function patch(){document.querySelectorAll('select[name="role"]').forEach(s=>addOption(s,'sales','Sales','dispatcher'));const filter=document.getElementById('ecRole');if(filter)addOption(filter,'sales','Sales','dispatcher')}
  const mo=new MutationObserver(patch);mo.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();
})();
