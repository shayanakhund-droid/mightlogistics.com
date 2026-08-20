(function(){
  const db=window.mightDb;
  if(!db)return;
  const $=id=>document.getElementById(id);
  let patched=false;
  function isBroker(){return window.mightCurrentProfile?.access_level==='broker';}
  function currentId(){return window.mightCurrentUser?.id||window.mightCurrentProfile?.id||null;}
  function currentName(){return window.mightCurrentProfile?.full_name||window.mightCurrentUser?.email||'Broker';}
  function patchSupabase(){
    if(patched)return;
    try{
      const proto=Object.getPrototypeOf(db.from('loads'));
      if(!proto||proto.__mightBrokerLockPatched)return;
      const originalInsert=proto.insert;
      const originalUpdate=proto.update;
      const isLoadsBuilder=ctx=>{try{return String(ctx?.url?.pathname||ctx?.url||'').replace(/\/$/,'').endsWith('/loads')}catch(_){return false}};
      proto.insert=function(values,...args){
        if(isBroker()&&isLoadsBuilder(this)){
          const id=currentId();
          if(id)values=Array.isArray(values)?values.map(v=>({...v,assigned_employee:id})):({...values,assigned_employee:id});
        }
        return originalInsert.call(this,values,...args);
      };
      proto.update=function(values,...args){
        if(isBroker()&&isLoadsBuilder(this)){
          const id=currentId();
          if(id)values={...(values||{}),assigned_employee:id};
        }
        return originalUpdate.call(this,values,...args);
      };
      proto.__mightBrokerLockPatched=true;
      patched=true;
    }catch(e){console.error('Broker load enforcement patch failed:',e)}
  }
  function lockBrokerField(){
    if(!isBroker())return;
    const select=$('load_brokerId');
    if(select){
      const label=select.closest('label');
      const input=document.createElement('input');
      input.id='load_brokerDisplay';
      input.type='text';
      input.readOnly=true;
      input.value=currentName();
      input.setAttribute('aria-readonly','true');
      input.style.cssText='background:#f5f7fa!important;color:#172033!important;cursor:not-allowed!important;font-weight:600;';
      select.replaceWith(input);
      if(label)label.classList.add('broker-assignment-locked');
    }
    const input=$('load_brokerDisplay');
    if(input){input.value=currentName();input.readOnly=true;input.tabIndex=-1;input.onkeydown=e=>e.preventDefault()}
  }
  function init(){
    patchSupabase();
    setInterval(()=>{patchSupabase();lockBrokerField()},250);
    document.addEventListener('click',e=>{
      if(e.target?.id==='createLoad'||e.target?.closest?.('.load-view')){
        setTimeout(lockBrokerField,150);
        setTimeout(lockBrokerField,600);
      }
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
