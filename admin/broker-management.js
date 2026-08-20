(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  let currentUser=null,currentProfile=null;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  // Broker accounts are managed through Employee Central now.
  // This module only keeps the broker/account-executive assignment on loads.
  async function initProfile(){
    const{data:{user}}=await db.auth.getUser();
    if(!user)return;
    currentUser=user;
    const{data}=await db.from('employee_profiles').select('id,full_name,email,phone,role,access_level,is_active').eq('id',user.id).maybeSingle();
    currentProfile=data||null;
    window.mightCurrentUser=user;
    window.mightCurrentProfile=currentProfile;
    document.querySelectorAll('nav a[data-section="brokers"]').forEach(x=>x.remove());
    $('brokers')?.remove();
    $('brokerModal')?.remove();
    setupLoadBrokerFields();
  }

  async function populateBrokerSelect(preferredId){
    const s=$('load_brokerId');if(!s)return;
    const current=preferredId!==undefined?preferredId:s.value||'';
    const{data,error}=await db.from('employee_profiles').select('id,full_name,email,access_level,is_active').in('access_level',['administrator','broker']).eq('is_active',true).order('full_name');
    if(error){console.error('Broker dropdown failed:',error);return;}
    s.innerHTML='<option value="">Unassigned</option>'+(data||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.email||'Broker')}</option>`).join('');
    if(current&&[...s.options].some(o=>o.value===String(current)))s.value=String(current);
    else if(!current&&currentProfile?.access_level==='broker')s.value=currentUser.id;
  }

  async function hydrateLoadAssignment(){
    const form=$('loadForm'),s=$('load_brokerId'),id=form?.dataset.id;
    if(!form||!s||!id)return;
    const{data,error}=await db.from('loads').select('assigned_employee,pickup_time_from,pickup_time_to,delivery_time_from,delivery_time_to').eq('id',id).maybeSingle();
    if(error||!data)return;
    await populateBrokerSelect(data.assigned_employee||'');
    if(data.assigned_employee)s.value=String(data.assigned_employee);
    const map={pickup_time_from:'pickupTimeFrom',pickup_time_to:'pickupTimeTo',delivery_time_from:'deliveryTimeFrom',delivery_time_to:'deliveryTimeTo'};
    Object.keys(map).forEach(k=>{const el=$('load_'+map[k]);if(el)el.value=data[k]||'';});
  }

  async function findNewLoad(origin,destination,startedAt){
    for(let i=0;i<15;i++){
      await new Promise(r=>setTimeout(r,300));
      const{data,error}=await db.from('loads').select('id,created_at').eq('origin',origin).eq('destination',destination).gte('created_at',startedAt).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(error){console.error('Could not locate newly created load:',error);return null;}
      if(data?.id)return data.id;
    }
    return null;
  }

  function setupLoadBrokerFields(){
    const form=$('loadForm'),grid=form?.querySelector('.loads-form-grid');if(!form||!grid)return;
    let label=$('load_brokerId')?.closest('label');
    if(!label){
      label=document.createElement('label');label.className='loads-full';label.innerHTML='<span>Broker / Account Executive</span><select id="load_brokerId"><option value="">Unassigned</option></select>';
      const marker=grid.querySelector('.loads-form-section');grid.insertBefore(label,marker||grid.firstChild);
    }
    populateBrokerSelect();

    form.addEventListener('submit',e=>{
      const broker=$('load_brokerId')?.value||null;
      const id=form.dataset.id||'';
      const startedAt=new Date().toISOString();
      const origin=$('load_origin')?.value.trim()||'',destination=$('load_destination')?.value.trim()||'';
      (async()=>{
        try{
          let loadId=id;
          if(!loadId)loadId=await findNewLoad(origin,destination,startedAt);
          if(!loadId)return;
          const{error}=await db.from('loads').update({assigned_employee:broker||null,updated_at:new Date().toISOString()}).eq('id',loadId);
          if(error)throw error;
          await hydrateLoadAssignment();
        }catch(err){console.error('Broker assignment save failed:',err);if($('loadSaveMessage'))$('loadSaveMessage').textContent=`Broker assignment could not be saved: ${err.message||err}`;}
      })();
    },true);

    document.addEventListener('click',e=>{
      if(e.target?.id==='createLoad')setTimeout(()=>populateBrokerSelect(currentProfile?.access_level==='broker'?currentUser.id:''),100);
      if(e.target?.closest?.('.load-view')){setTimeout(hydrateLoadAssignment,150);setTimeout(hydrateLoadAssignment,500);}
    });
    setInterval(()=>{
      if(!$('loadModal')?.classList.contains('hidden')){
        populateBrokerSelect();
        hydrateLoadAssignment();
      }
    },700);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',initProfile);else initProfile();
})();