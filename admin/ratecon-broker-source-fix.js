(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  const NativeBlob=window.Blob;
  let profile=null,profileLoadId='',patchedBlob=false,patchedDocs=false,patchedSingle=false;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const loadId=()=>$('loadForm')?.dataset.id||'';

  function patchSingle(){
    if(patchedSingle)return;
    try{
      const proto=Object.getPrototypeOf(db.from('loads'));if(!proto||!proto.maybeSingle)return;
      const originalMaybeSingle=proto.maybeSingle;
      proto.maybeSingle=function(...args){
        try{return originalMaybeSingle.apply(this.limit(1),args)}
        catch(e){return originalMaybeSingle.apply(this,args)}
      };
      proto.__mightRateconMaybeSinglePatched=true;patchedSingle=true;
    }catch(e){console.warn('Rate confirmation single-result safeguard failed:',e)}
  }

  async function refreshProfile(){
    const id=loadId();if(!id)return;
    const{data:l,error:loadError}=await db.from('loads').select('assigned_employee').eq('id',id).limit(1).maybeSingle();
    if(loadError||!l?.assigned_employee){profile=null;profileLoadId=id;return}
    const{data:p,error:profileError}=await db.from('employee_profiles').select('id,full_name,email,phone').eq('id',l.assigned_employee).limit(1).maybeSingle();
    if(profileError){console.warn('Assigned broker profile lookup failed:',profileError);profile=null;}else profile=p||null;
    profileLoadId=id;window.mightAssignedBrokerProfile=profile;
  }

  function decorate(content,p=profile){
    if(typeof content!=='string'||!p)return content;
    const rows=`<div class="kv"><span>Broker Name</span><b>${esc(p.full_name||'—')}</b></div><div class="kv"><span>Broker Email</span><b>${esc(p.email||'—')}</b></div><div class="kv"><span>Broker Phone</span><b>${esc(p.phone||'—')}</b></div>`;
    let out=content.replace(/<div class="kv"><span>Broker Name<\/span><b>[\s\S]*?<\/b><\/div><div class="kv"><span>Broker Email<\/span><b>[\s\S]*?<\/b><\/div><div class="kv"><span>Broker Phone<\/span><b>[\s\S]*?<\/b><\/div>/g,'');
    const old='<div class="kv"><span>Broker</span><b>Might Logistics</b></div>';
    if(out.includes(old))out=out.replace(old,old+rows);
    return out;
  }

  function patchBlob(){
    if(patchedBlob||!NativeBlob)return;
    class BrokerBlob extends NativeBlob{
      constructor(parts,options){
        try{if(profile&&profileLoadId===loadId()&&Array.isArray(parts))parts=parts.map(x=>typeof x==='string'?decorate(x):x)}catch(e){console.warn('Rate confirmation Blob broker patch failed:',e)}
        super(parts,options);
      }
    }
    window.Blob=BrokerBlob;patchedBlob=true;
  }

  function patchDocuments(){
    if(patchedDocs)return;
    try{
      const proto=Object.getPrototypeOf(db.from('load_documents'));if(!proto)return;
      const oi=proto.insert,ou=proto.update;
      function patchValues(values){
        const one=v=>{if(!v||v.document_type!=='rate_confirmation'||!v.content)return v;const content=decorate(v.content);return {...v,content,file_size:new NativeBlob([content]).size,updated_at:new Date().toISOString()}};
        return Array.isArray(values)?values.map(one):one(values);
      }
      proto.insert=function(values,...args){return oi.call(this,patchValues(values),...args)};
      proto.update=function(values,...args){return ou.call(this,patchValues(values),...args)};
      proto.__mightRateconBrokerPatched=true;patchedDocs=true;
    }catch(e){console.error('Rate confirmation document patch failed:',e)}
  }

  function init(){
    patchSingle();patchBlob();patchDocuments();
    document.addEventListener('click',e=>{if(e.target?.id==='createLoad'||e.target?.closest?.('.load-view'))setTimeout(refreshProfile,100)});
    setInterval(()=>{patchSingle();patchBlob();patchDocuments();if(!$('loadModal')?.classList.contains('hidden')&&loadId())refreshProfile()},500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
