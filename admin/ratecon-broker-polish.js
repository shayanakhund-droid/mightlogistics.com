(function(){
  const db=window.mightDb;if(!db)return;
  const originalOpen=window.open;
  let patched=false;
  function esc(v){return String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));}

  async function decorate(url,w){
    try{
      const form=document.getElementById('loadForm');
      const id=form?.dataset.id;
      if(!id||!w)return;

      // The broker dropdown is the source of truth at the moment the Rate Con
      // is generated. Persist it before reading the stored load record.
      const selectedBroker=document.getElementById('load_brokerId')?.value||null;
      if(selectedBroker){
        const{error:updateError}=await db.from('loads').update({assigned_employee:selectedBroker,updated_at:new Date().toISOString()}).eq('id',id);
        if(updateError)console.error('Rate confirmation broker persistence failed:',updateError);
      }

      const{data:l,error:loadError}=await db.from('loads').select('assigned_employee').eq('id',id).maybeSingle();
      if(loadError)throw loadError;
      const brokerId=l?.assigned_employee;
      let p=null;
      if(brokerId){
        const{data,error}=await db.from('employee_profiles').select('full_name,email,phone').eq('id',brokerId).maybeSingle();
        if(error)console.warn('Assigned broker profile lookup failed:',error);
        p=data||null;
      }

      const html=await(await fetch(url)).text();
      const name=esc(p?.full_name||'Might Logistics'),email=esc(p?.email||''),phone=esc(p?.phone||'');
      const block=`<div class="kv"><span>Broker Name</span><b>${name||'—'}</b></div><div class="kv"><span>Broker Email</span><b>${email||'—'}</b></div><div class="kv"><span>Broker Phone</span><b>${phone||'—'}</b></div>`;
      const replaced=html.replace(/<div class="kv"><span>Broker<\/span><b>Might Logistics<\/b><\/div>/,block);
      w.document.open();w.document.write(replaced);w.document.close();
      await db.from('load_documents').update({content:replaced,file_size:new Blob([replaced]).size,updated_at:new Date().toISOString()}).eq('load_id',id).eq('document_type','rate_confirmation');
    }catch(e){console.error('Rate confirmation broker decoration failed',e);}
  }

  if(!patched){
    patched=true;
    window.open=function(url,target,features){
      const w=originalOpen.call(window,'about:blank',target,features);
      if(String(url||'').startsWith('blob:'))decorate(url,w);
      else if(w){try{w.location.href=url}catch(_){} }
      return w;
    };
  }
})();