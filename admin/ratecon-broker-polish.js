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

      // The administrator-selected assigned_employee on the load is the
      // single source of truth. Brokers must never be able to change it here.
      const{data:l,error:loadError}=await db.from('loads')
        .select('assigned_employee')
        .eq('id',id)
        .maybeSingle();
      if(loadError)throw loadError;

      let p=null;
      if(l?.assigned_employee){
        const{data,error}=await db.from('employee_profiles')
          .select('full_name,email,phone')
          .eq('id',l.assigned_employee)
          .maybeSingle();
        if(error)console.warn('Assigned broker profile lookup failed:',error);
        p=data||null;
      }

      const html=await(await fetch(url)).text();
      const name=esc(p?.full_name||'—');
      const email=esc(p?.email||'—');
      const phone=esc(p?.phone||'—');

      // The current Rate Confirmation template contains the hardcoded
      // Might Logistics broker row. Replace it with the assigned broker's
      // actual contact information before displaying/saving the document.
      const old='<div class="kv"><span>Broker</span><b>Might Logistics</b></div>';
      const block=`<div class="kv"><span>Broker</span><b>Might Logistics</b></div><div class="kv"><span>Broker Name</span><b>${name}</b></div><div class="kv"><span>Broker Email</span><b>${email}</b></div><div class="kv"><span>Broker Phone</span><b>${phone}</b></div>`;
      const replaced=html.includes(old)?html.replace(old,block):html;

      w.document.open();
      w.document.write(replaced);
      w.document.close();

      const{error:updateError}=await db.from('load_documents')
        .update({content:replaced,file_size:new Blob([replaced]).size,updated_at:new Date().toISOString()})
        .eq('load_id',id)
        .eq('document_type','rate_confirmation');
      if(updateError)console.error('Rate confirmation broker details save failed:',updateError);
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
