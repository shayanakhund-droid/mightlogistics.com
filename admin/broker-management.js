(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  let currentUser=null,currentProfile=null,profiles=[];

  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  async function initProfile(){
    const{data:{user}}=await db.auth.getUser();
    if(!user)return;
    currentUser=user;
    const{data}=await db.from('employee_profiles').select('id,full_name,email,phone,role,access_level,is_active').eq('id',user.id).maybeSingle();
    currentProfile=data||null;
    window.mightCurrentUser=user;
    window.mightCurrentProfile=currentProfile;
    const isAdmin=currentProfile?.access_level==='administrator';
    if(!isAdmin)hideAdminOnly();
    if(isAdmin)setupBrokerAdmin();
    setupLoadBrokerFields();
  }

  function hideAdminOnly(){
    document.querySelectorAll('nav a[data-section="brokers"]').forEach(x=>x.remove());
    $('brokers')?.remove();
  }

  function setupBrokerAdmin(){
    const nav=document.querySelector('nav');
    if(nav&&!nav.querySelector('[data-section="brokers"]')){
      const a=document.createElement('a');a.href='#brokers';a.dataset.section='brokers';a.textContent='Brokers';nav.appendChild(a);
      a.addEventListener('click',e=>{e.preventDefault();showBrokers();});
    }
    if($('brokers')){loadBrokers();return;}
    const main=document.querySelector('#appView main');if(!main)return;
    const s=document.createElement('section');
    s.className='content hidden';s.id='brokers';
    s.innerHTML='<section class="panel"><div class="panel-head"><div><div class="kicker">TEAM</div><h3>Broker Profiles</h3><p class="panel-subtitle">Create employee broker logins with their contact information.</p></div><div class="controls"><button id="brokerRefresh" class="outline">Refresh</button><button id="createBroker" class="primary">+ Create Broker</button></div></div><div class="table-wrap"><table><thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th></tr></thead><tbody id="brokerRows"><tr><td colspan="4" class="empty">Loading brokers…</td></tr></tbody></table></div></section></section>';
    main.appendChild(s);
    const modal=document.createElement('div');modal.id='brokerModal';modal.className='loads-modal hidden';
    modal.innerHTML='<div class="loads-backdrop" id="brokerBackdrop"></div><section class="loads-panel"><div class="loads-panel-head"><div><div class="kicker">BROKER PROFILE</div><h3>Create Broker Login</h3></div><button id="brokerClose" class="close">×</button></div><form id="brokerForm"><div class="loads-form-grid"><label>Full Name *<input id="brokerName" required></label><label>Email *<input id="brokerEmail" type="email" required></label><label>Phone<input id="brokerPhone" type="tel"></label><label>Login Password *<input id="brokerPassword" type="password" minlength="8" required></label></div><div id="brokerMessage" class="load-save-message"></div><div class="loads-form-actions"><button type="button" id="brokerCancel" class="outline">Cancel</button><button type="submit" class="primary">Create Broker</button></div></form></section></div>';
    document.body.appendChild(modal);
    $('brokerRefresh').onclick=loadBrokers;$('createBroker').onclick=openBrokerModal;$('brokerClose').onclick=closeBrokerModal;$('brokerCancel').onclick=closeBrokerModal;$('brokerBackdrop').onclick=closeBrokerModal;$('brokerForm').onsubmit=createBroker;
    loadBrokers();
  }

  function showBrokers(){
    ['dashboard','customers','loads','carriers','brokers'].forEach(id=>$(id)?.classList.toggle('hidden',id!=='brokers'));
    document.getElementById('quotes')?.classList.add('hidden');
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section==='brokers'));
    if($('pageTitle'))$('pageTitle').textContent='Broker Management';
    loadBrokers();
  }

  async function loadBrokers(){
    const rows=$('brokerRows');if(!rows)return;
    const{data,error}=await db.from('employee_profiles').select('id,full_name,email,phone,access_level,is_active').eq('access_level','broker').order('full_name');
    if(error){rows.innerHTML='<tr><td colspan="4" class="empty">Could not load brokers.</td></tr>';return;}
    profiles=data||[];
    rows.innerHTML=profiles.map(p=>`<tr><td><strong>${esc(p.full_name||'—')}</strong></td><td>${esc(p.email||'—')}</td><td>${esc(p.phone||'—')}</td><td><span class="status ${p.is_active?'active':'inactive'}">${p.is_active?'Active':'Inactive'}</span></td></tr>`).join('')||'<tr><td colspan="4" class="empty">No broker profiles yet.</td></tr>';
  }

  function openBrokerModal(){$('brokerForm')?.reset();$('brokerMessage').textContent='';$('brokerModal')?.classList.remove('hidden');}
  function closeBrokerModal(){$('brokerModal')?.classList.add('hidden');}

  async function createBroker(e){
    e.preventDefault();
    const msg=$('brokerMessage'),email=$('brokerEmail').value.trim().toLowerCase();
    msg.textContent='Creating secure login…';
    try{
      const{data,error}=await db.functions.invoke('create-broker-user',{body:{full_name:$('brokerName').value.trim(),email,phone:$('brokerPhone').value.trim(),password:$('brokerPassword').value}});
      if(error){
        let detail='';try{if(error.context){const payload=await error.context.clone().json();detail=payload?.error||payload?.message||'';}}catch{}
        msg.textContent=detail||error.message||'Could not create broker.';return;
      }
      if(data?.error){msg.textContent=data.error;return;}
      msg.textContent='Broker created successfully. They can now sign in with the email and password you entered.';
      await loadBrokers();setTimeout(closeBrokerModal,900);
    }catch(err){msg.textContent=err?.message||'Could not create broker.';}
  }

  async function populateBrokerSelect(preferredId){
    const s=$('load_brokerId');if(!s)return;
    const current=preferredId!==undefined?preferredId:s.value||'';
    const{data,error}=await db.from('employee_profiles').select('id,full_name,email,access_level,is_active').in('access_level',['administrator','broker']).eq('is_active',true).order('full_name');
    if(error){console.error('Broker dropdown failed:',error);return;}
    s.innerHTML=(data||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.email||'Broker')}</option>`).join('');
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
      label=document.createElement('label');label.className='loads-full';label.innerHTML='<span>Broker / Account Executive</span><select id="load_brokerId"></select>';
      const marker=grid.querySelector('.loads-form-section');grid.insertBefore(label,marker||grid.firstChild);
    }
    populateBrokerSelect();

    form.addEventListener('submit',e=>{
      const broker=$('load_brokerId')?.value||null;
      if(!broker)return;
      const id=form.dataset.id||'';
      const startedAt=new Date().toISOString();
      const origin=$('load_origin')?.value.trim()||'',destination=$('load_destination')?.value.trim()||'';
      // Capture phase ensures this runs before loads.js closes the modal. For an
      // existing load we update immediately. For a new load we locate the row
      // after loads.js performs its insert.
      (async()=>{
        try{
          let loadId=id;
          if(!loadId)loadId=await findNewLoad(origin,destination,startedAt);
          if(!loadId)return;
          const{error}=await db.from('loads').update({assigned_employee:broker,updated_at:new Date().toISOString()}).eq('id',loadId);
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