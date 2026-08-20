(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  let patched=false,lastHydrated='';
  const isAdmin=()=>window.mightCurrentProfile?.access_level==='administrator';
  const isBroker=()=>window.mightCurrentProfile?.access_level==='broker';
  const currentId=()=>window.mightCurrentUser?.id||window.mightCurrentProfile?.id||null;
  const loadBuilder=ctx=>{try{return String(ctx?.url?.pathname||ctx?.url||'').replace(/\/$/,'').endsWith('/loads')}catch(_){return false}};
  function selectedBroker(){return $('load_brokerId')?.value||null}
  function patchSupabase(){
    if(patched)return;
    try{
      const proto=Object.getPrototypeOf(db.from('loads'));if(!proto)return;
      const oi=proto.insert,ou=proto.update;
      proto.insert=function(values,...args){
        if(loadBuilder(this)){
          const id=isBroker()?currentId():isAdmin()?selectedBroker():null;
          if(id)values=Array.isArray(values)?values.map(v=>({...v,assigned_employee:id})):({...values,assigned_employee:id});
        }
        return oi.call(this,values,...args);
      };
      proto.update=function(values,...args){
        if(loadBuilder(this)){
          const id=isBroker()?currentId():isAdmin()?selectedBroker():null;
          if(id)values={...(values||{}),assigned_employee:id};
        }
        return ou.call(this,values,...args);
      };
      proto.__mightBrokerPersistencePatched=true;patched=true;
    }catch(e){console.error('Load broker persistence patch failed:',e)}
  }
  async function hydrate(){
    const form=$('loadForm'),sel=$('load_brokerId');
    if(!form?.dataset.id||!sel||isBroker())return;
    const id=form.dataset.id;if(lastHydrated===id&&sel.value)return;
    const{data,error}=await db.from('loads').select('assigned_employee').eq('id',id).maybeSingle();
    if(error||!data?.assigned_employee)return;
    const{data:profiles}=await db.from('employee_profiles').select('id,full_name,email').in('id',[data.assigned_employee]);
    const p=profiles?.[0];
    if(p&&!Array.from(sel.options).some(o=>o.value===String(p.id))){
      const o=document.createElement('option');o.value=p.id;o.textContent=p.full_name||p.email||'Broker';sel.appendChild(o);
    }
    sel.value=String(data.assigned_employee);lastHydrated=id;
  }
  function init(){
    patchSupabase();
    document.addEventListener('click',e=>{if(e.target?.closest?.('.load-view')){lastHydrated='';setTimeout(hydrate,100);setTimeout(hydrate,600)}if(e.target?.id==='createLoad')lastHydrated=''});
    setInterval(()=>{patchSupabase();if(!$('loadModal')?.classList.contains('hidden'))hydrate()},400);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
