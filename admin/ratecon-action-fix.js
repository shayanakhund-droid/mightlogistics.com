(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  let brokerFixBound=false;

  async function populateBrokerSelect(){
    const s=$('load_brokerId');
    if(!s)return;
    const {data,error}=await db.from('employee_profiles')
      .select('id,full_name,email,access_level,is_active')
      .in('access_level',['administrator','broker'])
      .eq('is_active',true)
      .order('full_name');
    if(error){console.error('Broker list load failed:',error);return;}
    const current=s.value;
    s.innerHTML=(data||[]).map(p=>`<option value="${p.id}">${String(p.full_name||p.email||'Broker').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]))}</option>`).join('');
    if(current && [...s.options].some(o=>o.value===current))s.value=current;
  }

  async function hydrateBroker(){
    const id=$('loadForm')?.dataset.id;
    const s=$('load_brokerId');
    if(!id||!s)return;
    const {data,error}=await db.from('loads').select('assigned_employee').eq('id',id).maybeSingle();
    if(error){console.error('Broker assignment load failed:',error);return;}
    if(data?.assigned_employee){
      await populateBrokerSelect();
      s.value=data.assigned_employee;
    }
  }

  async function persistBrokerAssignment(){
    const form=$('loadForm');
    const brokerId=$('load_brokerId')?.value||null;
    if(!form||!brokerId)return;
    const existingId=form.dataset.id||null;

    if(existingId){
      const {error}=await db.from('loads').update({assigned_employee:brokerId,updated_at:new Date().toISOString()}).eq('id',existingId);
      if(error){console.error('Broker assignment save failed:',error);if($('loadSaveMessage'))$('loadSaveMessage').textContent=`Broker assignment could not be saved: ${error.message}`;}
      return;
    }

    // New loads do not have an id until loads.js finishes its insert.
    const startedAt=new Date().toISOString();
    const origin=$('load_origin')?.value.trim()||'';
    const destination=$('load_destination')?.value.trim()||'';
    const started=new Date(startedAt).getTime();
    for(let i=0;i<12;i++){
      await new Promise(r=>setTimeout(r,300));
      const {data,error}=await db.from('loads')
        .select('id,created_at')
        .eq('origin',origin)
        .eq('destination',destination)
        .gte('created_at',startedAt)
        .order('created_at',{ascending:false})
        .limit(1)
        .maybeSingle();
      if(error){console.error('New-load broker lookup failed:',error);return;}
      if(data?.id){
        const {error:updateError}=await db.from('loads').update({assigned_employee:brokerId,updated_at:new Date().toISOString()}).eq('id',data.id);
        if(updateError)console.error('New-load broker assignment save failed:',updateError);
        return;
      }
      if(Date.now()-started>5000)break;
    }
  }

  function ensureBrokerField(){
    const form=$('loadForm'),grid=form?.querySelector('.loads-form-grid');
    if(!form||!grid)return;
    let label=$('load_brokerId')?.closest('label');
    if(!label){
      label=document.createElement('label');
      label.className='loads-full';
      label.innerHTML='<span>Broker / Account Executive</span><select id="load_brokerId"></select>';
      const marker=grid.querySelector('.loads-form-section');
      grid.insertBefore(label,marker||grid.firstChild);
    }
    populateBrokerSelect();

    if(!brokerFixBound){
      brokerFixBound=true;
      // Capture phase runs before loads.js closes the modal, so the assignment is
      // persisted as part of the same Save action instead of relying on a delayed
      // secondary update.
      form.addEventListener('submit',()=>{persistBrokerAssignment();},true);
      document.addEventListener('click',e=>{
        if(e.target?.id==='createLoad'){
          setTimeout(()=>{populateBrokerSelect();},80);
        }
        if(e.target?.closest?.('.load-view')){
          setTimeout(hydrateBroker,120);
          setTimeout(hydrateBroker,450);
        }
      });
      setInterval(()=>{
        if(!$('loadModal')?.classList.contains('hidden')){
          populateBrokerSelect();
          hydrateBroker();
        }
      },700);
    }
  }

  async function getLoad(){
    const id=$('loadForm')?.dataset.id;if(!id)return null;
    const {data,error}=await db.from('loads').select('*').eq('id',id).maybeSingle();
    if(error)throw error;return data;
  }

  async function getAssignedBroker(load){
    if(!load?.assigned_employee)return null;
    const {data,error}=await db.from('employee_profiles')
      .select('id,full_name,email,phone')
      .eq('id',load.assigned_employee)
      .maybeSingle();
    if(error){console.warn('Assigned broker lookup failed:',error);return null;}
    return data||null;
  }

  async function saveOperational(load){
    const p={
      pickup_time_from:$('load_pickupTimeFrom')?.value.trim()||null,
      pickup_time_to:$('load_pickupTimeTo')?.value.trim()||null,
      delivery_time_from:$('load_deliveryTimeFrom')?.value.trim()||null,
      delivery_time_to:$('load_deliveryTimeTo')?.value.trim()||null,
      driver_instructions:$('load_driverInstructions')?.value.trim()||null,
      assigned_employee:$('load_brokerId')?.value||load.assigned_employee||null,
      updated_at:new Date().toISOString()
    };
    const {data,error}=await db.from('loads').update(p).eq('id',load.id).select('*').single();
    if(error)throw error;return data;
  }

  function showHtml(win,html){
    if(!win||win.closed)return false;
    win.document.open();
    win.document.write(html);
    win.document.close();
    return true;
  }

  async function generateAndEmail(){
    const b=$('rateconGenerateAction');let rateTab=null,mailTab=null;
    try{
      rateTab=window.open('about:blank','_blank');
      mailTab=window.open('about:blank','_blank');
      if(rateTab){
        rateTab.document.title='Might Logistics — Generating Rate Confirmation';
        rateTab.document.body.innerHTML='<div style="font-family:Arial,sans-serif;padding:40px;color:#17202b"><strong>Might Logistics</strong><p>Generating your Rate Confirmation…</p></div>';
      }
      if(mailTab){
        mailTab.document.title='Might Logistics — Preparing Email';
        mailTab.document.body.innerHTML='<div style="font-family:Arial,sans-serif;padding:40px;color:#17202b"><strong>Might Logistics</strong><p>Preparing your Gmail message…</p></div>';
      }

      let load=await getLoad();
      if(!load)throw new Error('Save the load first.');
      if(load.status!=='carrier_assigned')throw new Error('Set the load status to Carrier Assigned and save it first.');
      if(!load.carrier_id)throw new Error('Assign a carrier before generating the rate confirmation.');

      // Make absolutely sure the currently selected broker is persisted before
      // generating the document.
      const selectedBroker=$('load_brokerId')?.value||load.assigned_employee||null;
      if(selectedBroker){
        const {error}=await db.from('loads').update({assigned_employee:selectedBroker,updated_at:new Date().toISOString()}).eq('id',load.id);
        if(error)throw error;
      }

      if(b){b.disabled=true;b.textContent='Generating…'}
      await saveOperational(load);
      load=await getLoad();
      const broker=await getAssignedBroker(load);
      if(!window.mightRateCon?.rateConHtml)throw new Error('Rate confirmation module is not loaded. Refresh the page and try again.');
      const html=window.mightRateCon.rateConHtml(load,broker);
      if(!html||html.length<1000)throw new Error('Rate confirmation document was empty.');

      const blob=new Blob([html],{type:'text/html;charset=utf-8'});
      const {data:existing,error:findError}=await db.from('load_documents').select('id').eq('load_id',load.id).eq('document_type','rate_confirmation').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(findError)throw findError;
      const user=(await db.auth.getUser()).data.user;
      const payload={load_id:load.id,document_type:'rate_confirmation',file_name:`${load.load_number}_Rate_Confirmation.html`,mime_type:'text/html',file_size:blob.size,storage_path:null,content:html,updated_at:new Date().toISOString()};
      if(existing?.id){
        const {error}=await db.from('load_documents').update(payload).eq('id',existing.id);if(error)throw error;
      }else{
        payload.created_by=user?.id||null;const {error}=await db.from('load_documents').insert(payload);if(error)throw error;
      }

      if(!showHtml(rateTab,html))throw new Error('Chrome blocked the Rate Confirmation window. Allow pop-ups for mightlogistics.com and try again.');

      let email='';
      const {data:carrier,error:carrierError}=await db.from('carriers').select('email').eq('id',load.carrier_id).maybeSingle();
      if(carrierError)console.warn(carrierError);email=carrier?.email||'';
      if(email){
        const subject=`Might Logistics Rate Confirmation — ${load.load_number}`;
        const body=`Hello ${load.carrier_name||'Carrier'},\n\nPlease find the rate confirmation for load ${load.load_number}.\n\nPickup: ${load.origin} — ${load.pickup_date||'—'} ${load.pickup_time_from||''}${load.pickup_time_to?' – '+load.pickup_time_to:''}\nDelivery: ${load.destination} — ${load.delivery_date||'—'} ${load.delivery_time_from||''}${load.delivery_time_to?' – '+load.delivery_time_to:''}\nCarrier Rate: $${Number(load.carrier_rate||0).toLocaleString('en-US',{minimumFractionDigits:2})} USD\n\nThe rate confirmation has been generated in the Might Logistics portal. Please review it, print/save it as PDF if needed, sign it, and return the signed copy.\n\nThank you,\nMight Logistics`;
        const mailUrl=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        if(mailTab&&!mailTab.closed)mailTab.location.href=mailUrl;
        else alert('Rate confirmation generated successfully, but Chrome blocked the Gmail compose window. Allow pop-ups for mightlogistics.com and try again.');
      }else if(mailTab&&!mailTab.closed){
        mailTab.document.open();
        mailTab.document.write('<div style="font-family:Arial,sans-serif;padding:40px;color:#17202b"><h2>Rate Confirmation Generated</h2><p>No carrier email address is saved, so a Gmail draft could not be prepared.</p></div>');
        mailTab.document.close();
      }else alert('Rate confirmation generated successfully. The carrier does not have an email address on file, so Gmail was not opened.');
    }catch(err){
      console.error(err);
      if(rateTab&&!rateTab.closed){
        rateTab.document.open();
        rateTab.document.write('<div style="font-family:Arial,sans-serif;padding:40px;color:#b42318"><h2>Rate Confirmation could not be generated</h2><p>'+String(err.message||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</p></div>');
        rateTab.document.close();
      }
      if(mailTab&&!mailTab.closed){
        mailTab.document.open();
        mailTab.document.write('<div style="font-family:Arial,sans-serif;padding:40px;color:#b42318"><h2>Email could not be prepared</h2><p>The Rate Confirmation workflow stopped before the Gmail draft could be prepared.</p></div>');
        mailTab.document.close();
      }
      alert(`Rate confirmation failed: ${err.message||err}`);
    }finally{
      if(b){b.disabled=false;b.textContent='Generate Rate Confirmation & Email'}
      ensureButton();
    }
  }

  function ensureButton(){
    ensureBrokerField();
    const form=$('loadForm'),actions=form?.querySelector('.loads-form-actions');if(!form||!actions)return;
    let b=$('rateconGenerateAction');
    if(!b){
      b=document.createElement('button');b.type='button';b.id='rateconGenerateAction';b.className='primary';b.textContent='Generate Rate Confirmation & Email';b.style.display='none';
      actions.insertBefore(b,$('loadModalClose2'));b.addEventListener('click',generateAndEmail);
    }
    b.style.display=form.dataset.id&&$('load_status')?.value==='carrier_assigned'?'inline-flex':'none';
  }

  function init(){
    ensureButton();
    setInterval(ensureButton,500);
    $('load_status')?.addEventListener('change',ensureButton);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();