(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  let initialized=false;
  let brokerDirty=false;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));

  async function populateBrokerSelect(preserve=true){
    const s=$('load_brokerId');if(!s)return;
    const current=preserve?s.value:'';
    const {data,error}=await db.from('employee_profiles').select('id,full_name,email,phone,access_level,is_active').in('access_level',['administrator','broker']).eq('is_active',true).order('full_name');
    if(error){console.error('Broker list load failed:',error);return;}
    s.innerHTML='<option value="">Unassigned</option>'+(data||[]).map(p=>`<option value="${esc(p.id)}">${esc(p.full_name||p.email||'Broker')} (${p.access_level==='administrator'?'administrator':'broker'})</option>`).join('');
    if(current&&[...s.options].some(o=>o.value===current))s.value=current;
  }

  async function hydrateBroker(){
    const id=$('loadForm')?.dataset.id,s=$('load_brokerId');
    if(!id||!s||brokerDirty)return;
    const {data,error}=await db.from('loads').select('assigned_employee').eq('id',id).maybeSingle();
    if(error){console.error('Broker assignment load failed:',error);return;}
    await populateBrokerSelect(false);s.value=data?.assigned_employee||'';
  }

  async function persistExistingBroker(id,brokerId){
    if(!id)return;
    const {error}=await db.from('loads').update({assigned_employee:brokerId||null,updated_at:new Date().toISOString()}).eq('id',id);
    if(error){console.error('Broker assignment save failed:',error);if($('loadSaveMessage'))$('loadSaveMessage').textContent=`Broker assignment could not be saved: ${error.message}`;}
  }

  async function persistNewBroker(origin,destination,startedAt,brokerId){
    for(let i=0;i<15;i++){
      await new Promise(r=>setTimeout(r,300));
      const {data,error}=await db.from('loads').select('id,created_at').eq('origin',origin).eq('destination',destination).gte('created_at',startedAt).order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(error){console.error('New-load broker lookup failed:',error);return;}
      if(data?.id){await persistExistingBroker(data.id,brokerId);return;}
    }
  }

  function ensureBrokerField(){
    const form=$('loadForm'),grid=form?.querySelector('.loads-form-grid');if(!form||!grid)return;
    let label=$('load_brokerId')?.closest('label');
    if(!label){
      label=document.createElement('label');label.className='loads-full';
      label.innerHTML='<span>Broker / Account Executive</span><select id="load_brokerId"><option value="">Unassigned</option></select>';
      const marker=grid.querySelector('.loads-form-section');grid.insertBefore(label,marker||grid.firstChild);
    }
    const s=$('load_brokerId');
    if(s&&!s.dataset.brokerBound){s.dataset.brokerBound='1';s.addEventListener('change',()=>{brokerDirty=true;});}
    if(s&&!s.dataset.brokerPopulated){s.dataset.brokerPopulated='1';populateBrokerSelect(false);}
  }

  async function onLoadOpened(){brokerDirty=false;ensureBrokerField();await populateBrokerSelect(false);await hydrateBroker();}

  async function saveBrokerOnSubmit(){
    const form=$('loadForm'),s=$('load_brokerId');if(!form||!s)return;
    const brokerId=s.value||null,id=form.dataset.id||null;
    if(id){await persistExistingBroker(id,brokerId);return;}
    const startedAt=new Date().toISOString();
    const origin=$('load_origin')?.value.trim()||'',destination=$('load_destination')?.value.trim()||'';
    if(origin&&destination)persistNewBroker(origin,destination,startedAt,brokerId);
  }

  function showBrokerOnButton(){const form=$('loadForm'),b=$('rateconGenerateAction');if(form&&b)b.style.display=form.dataset.id&&$('load_status')?.value==='carrier_assigned'?'inline-flex':'none';}

  async function getLoad(){const id=$('loadForm')?.dataset.id;if(!id)return null;const {data,error}=await db.from('loads').select('*').eq('id',id).maybeSingle();if(error)throw error;return data;}
  async function getAssignedBroker(load){if(!load?.assigned_employee)return null;const {data,error}=await db.from('employee_profiles').select('id,full_name,email,phone').eq('id',load.assigned_employee).maybeSingle();if(error){console.warn('Assigned broker lookup failed:',error);return null;}return data||null;}
  async function saveOperational(load){const payload={pickup_time_from:$('load_pickupTimeFrom')?.value.trim()||null,pickup_time_to:$('load_pickupTimeTo')?.value.trim()||null,delivery_time_from:$('load_deliveryTimeFrom')?.value.trim()||null,delivery_time_to:$('load_deliveryTimeTo')?.value.trim()||null,driver_instructions:$('load_driverInstructions')?.value.trim()||null,assigned_employee:$('load_brokerId')?.value||load.assigned_employee||null,updated_at:new Date().toISOString()};const {data,error}=await db.from('loads').update(payload).eq('id',load.id).select('*').single();if(error)throw error;return data;}

  function replaceBrokerBlock(html,broker){if(!broker)return html;const name=esc(broker.full_name||broker.email||'—'),email=esc(broker.email||'—'),phone=esc(broker.phone||'—');return html.replace(/<span>Broker Name<\/span><b>.*?<\/b>/,'<span>Broker Name</span><b>'+name+'</b>').replace(/<span>Broker Email<\/span><b>.*?<\/b>/,'<span>Broker Email</span><b>'+email+'</b>').replace(/<span>Broker Phone<\/span><b>.*?<\/b>/,'<span>Broker Phone</span><b>'+phone+'</b>');}

  async function generateAndEmail(){
    const b=$('rateconGenerateAction');let rateTab=null,mailTab=null;
    try{
      rateTab=window.open('about:blank','_blank');mailTab=window.open('about:blank','_blank');
      if(rateTab)rateTab.document.body.innerHTML='<div style="font-family:Arial;padding:40px"><strong>Might Logistics</strong><p>Generating your Rate Confirmation…</p></div>';
      if(mailTab)mailTab.document.body.innerHTML='<div style="font-family:Arial;padding:40px"><strong>Might Logistics</strong><p>Preparing your Gmail message…</p></div>';
      let load=await getLoad();
      if(!load)throw new Error('Save the load first.');
      if(load.status!=='carrier_assigned')throw new Error('Set the load status to Carrier Assigned and save it first.');
      if(!load.carrier_id)throw new Error('Assign a carrier before generating the rate confirmation.');
      const selectedBroker=$('load_brokerId')?.value||null;
      if(selectedBroker!==load.assigned_employee){await persistExistingBroker(load.id,selectedBroker);load=await getLoad();}
      if(b){b.disabled=true;b.textContent='Generating…';}
      load=await saveOperational(load);load=await getLoad();
      const broker=await getAssignedBroker(load);if(!broker)throw new Error('Select a Broker / Account Executive before generating the rate confirmation.');
      if(!window.mightRateCon?.rateConHtml)throw new Error('Rate confirmation module is not loaded. Refresh the page and try again.');
      let html=window.mightRateCon.rateConHtml(load,broker);html=replaceBrokerBlock(html,broker);
      if(!html||html.length<1000)throw new Error('Rate confirmation document was empty.');
      const blob=new Blob([html],{type:'text/html;charset=utf-8'});
      const {data:existing,error:findError}=await db.from('load_documents').select('id').eq('load_id',load.id).eq('document_type','rate_confirmation').order('created_at',{ascending:false}).limit(1).maybeSingle();if(findError)throw findError;
      const user=(await db.auth.getUser()).data.user;const payload={load_id:load.id,document_type:'rate_confirmation',file_name:`${load.load_number}_Rate_Confirmation.html`,mime_type:'text/html',file_size:blob.size,storage_path:null,content:html,updated_at:new Date().toISOString()};
      if(existing?.id){const {error}=await db.from('load_documents').update(payload).eq('id',existing.id);if(error)throw error;}else{payload.created_by=user?.id||null;const {error}=await db.from('load_documents').insert(payload);if(error)throw error;}
      if(!rateTab||rateTab.closed)throw new Error('Chrome blocked the Rate Confirmation window. Allow pop-ups for mightlogistics.com and try again.');
      rateTab.document.open();rateTab.document.write(html);rateTab.document.close();
      const {data:carrier,error:carrierError}=await db.from('carriers').select('email').eq('id',load.carrier_id).maybeSingle();if(carrierError)console.warn(carrierError);const email=carrier?.email||'';
      if(email){const subject=`Might Logistics Rate Confirmation — ${load.load_number}`;const body=`Hello ${load.carrier_name||'Carrier'},\n\nPlease find the rate confirmation for load ${load.load_number}.\n\nBroker / Account Executive: ${broker.full_name||broker.email}\nBroker Email: ${broker.email||'—'}\n\nPickup: ${load.origin} — ${load.pickup_date||'—'} ${load.pickup_time_from||''}${load.pickup_time_to?' – '+load.pickup_time_to:''}\nDelivery: ${load.destination} — ${load.delivery_date||'—'} ${load.delivery_time_from||''}${load.delivery_time_to?' – '+load.delivery_time_to:''}\nCarrier Rate: $${Number(load.carrier_rate||0).toLocaleString('en-US',{minimumFractionDigits:2})} USD\n\nPlease review, sign, and return the Rate Confirmation.\n\nThank you,\nMight Logistics`;const mailUrl=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;if(mailTab&&!mailTab.closed)mailTab.location.href=mailUrl;}
      else if(mailTab&&!mailTab.closed){mailTab.document.open();mailTab.document.write('<div style="font-family:Arial;padding:40px"><h2>Rate Confirmation Generated</h2><p>No carrier email address is saved.</p></div>');mailTab.document.close();}
    }catch(err){console.error(err);if(rateTab&&!rateTab.closed){rateTab.document.open();rateTab.document.write('<div style="font-family:Arial;padding:40px;color:#b42318"><h2>Rate Confirmation could not be generated</h2><p>'+esc(err.message||err)+'</p></div>');rateTab.document.close();}if(mailTab&&!mailTab.closed){mailTab.document.open();mailTab.document.write('<div style="font-family:Arial;padding:40px;color:#b42318"><h2>Email could not be prepared</h2><p>'+esc(err.message||err)+'</p></div>');mailTab.document.close();}alert(`Rate confirmation failed: ${err.message||err}`);}
    finally{if(b){b.disabled=false;b.textContent='Generate Rate Confirmation & Email';showBrokerOnButton();}}
  }

  function ensureButton(){ensureBrokerField();const form=$('loadForm'),actions=form?.querySelector('.loads-form-actions');if(!form||!actions)return;let b=$('rateconGenerateAction');if(!b){b=document.createElement('button');b.type='button';b.id='rateconGenerateAction';b.className='primary';b.textContent='Generate Rate Confirmation & Email';b.style.display='none';actions.insertBefore(b,$('loadModalClose2'));b.addEventListener('click',generateAndEmail);}showBrokerOnButton();}

  function init(){if(initialized)return;initialized=true;ensureButton();document.addEventListener('click',e=>{if(e.target?.id==='createLoad')setTimeout(async()=>{brokerDirty=false;ensureBrokerField();await populateBrokerSelect(false);const s=$('load_brokerId');if(s)s.value='';},100);if(e.target?.closest?.('.load-view'))setTimeout(onLoadOpened,150);},true);$('load_status')?.addEventListener('change',showBrokerOnButton);$('loadForm')?.addEventListener('submit',()=>{brokerDirty=true;saveBrokerOnSubmit();},true);setInterval(ensureButton,1000);}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();