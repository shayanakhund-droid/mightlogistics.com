(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);

  function ensureButton(){
    const form=$('loadForm'),actions=form?.querySelector('.loads-form-actions');if(!form||!actions)return;
    let b=$('rateconGenerateAction');
    if(!b){
      b=document.createElement('button');b.type='button';b.id='rateconGenerateAction';b.className='primary';b.textContent='Generate Rate Confirmation & Email';b.style.display='none';
      actions.insertBefore(b,$('loadModalClose2'));b.addEventListener('click',generateAndEmail);
    }
    b.style.display=form.dataset.id&&$('load_status')?.value==='carrier_assigned'?'inline-flex':'none';
  }

  async function getLoad(){
    const id=$('loadForm')?.dataset.id;if(!id)return null;
    const {data,error}=await db.from('loads').select('*').eq('id',id).maybeSingle();
    if(error)throw error;return data;
  }

  async function saveOperational(load){
    const p={
      pickup_time_from:$('load_pickupTimeFrom')?.value.trim()||null,
      pickup_time_to:$('load_pickupTimeTo')?.value.trim()||null,
      delivery_time_from:$('load_deliveryTimeFrom')?.value.trim()||null,
      delivery_time_to:$('load_deliveryTimeTo')?.value.trim()||null,
      driver_instructions:$('load_driverInstructions')?.value.trim()||null,
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
    const b=$('rateconGenerateAction');let rateTab=null;
    try{
      const load=await getLoad();
      if(!load){alert('Save the load first.');return}
      if(load.status!=='carrier_assigned'){alert('Set the load status to Carrier Assigned and save it first.');return}
      if(!load.carrier_id){alert('Assign a carrier before generating the rate confirmation.');return}

      // Open synchronously from the button click so Chrome does not turn the preview into an unusable blank tab.
      rateTab=window.open('about:blank','_blank');
      if(rateTab){
        rateTab.document.title='Might Logistics — Generating Rate Confirmation';
        rateTab.document.body.innerHTML='<div style="font-family:Arial,sans-serif;padding:40px;color:#17202b"><strong>Might Logistics</strong><p>Generating your Rate Confirmation…</p></div>';
      }

      if(b){b.disabled=true;b.textContent='Generating…'}
      await saveOperational(load);
      const l=await getLoad();
      if(!window.mightRateCon?.rateConHtml)throw new Error('Rate confirmation module is not loaded. Refresh the page and try again.');
      const html=window.mightRateCon.rateConHtml(l);
      if(!html||html.length<1000)throw new Error('Rate confirmation document was empty.');

      const blob=new Blob([html],{type:'text/html;charset=utf-8'});
      const {data:existing,error:findError}=await db.from('load_documents').select('id').eq('load_id',l.id).eq('document_type','rate_confirmation').order('created_at',{ascending:false}).limit(1).maybeSingle();
      if(findError)throw findError;
      const user=(await db.auth.getUser()).data.user;
      const payload={load_id:l.id,document_type:'rate_confirmation',file_name:`${l.load_number}_Rate_Confirmation.html`,mime_type:'text/html',file_size:blob.size,storage_path:null,content:html,updated_at:new Date().toISOString()};
      if(existing?.id){
        const {error}=await db.from('load_documents').update(payload).eq('id',existing.id);if(error)throw error;
      }else{
        payload.created_by=user?.id||null;const {error}=await db.from('load_documents').insert(payload);if(error)throw error;
      }

      // Render the generated HTML directly into the already-authorized tab. No blob URL navigation, so no about:blank failure.
      if(!showHtml(rateTab,html)){
        rateTab=window.open('about:blank','_blank');
        if(!showHtml(rateTab,html))throw new Error('Your browser blocked the Rate Confirmation window. Please allow pop-ups for this site.');
      }

      let email='';
      const {data:carrier,error:carrierError}=await db.from('carriers').select('email').eq('id',l.carrier_id).maybeSingle();
      if(carrierError)console.warn(carrierError);email=carrier?.email||'';
      if(email){
        const subject=`Might Logistics Rate Confirmation — ${l.load_number}`;
        const body=`Hello ${l.carrier_name||'Carrier'},\n\nPlease find the rate confirmation for load ${l.load_number}.\n\nPickup: ${l.origin} — ${l.pickup_date||'—'} ${l.pickup_time_from||''}${l.pickup_time_to?' – '+l.pickup_time_to:''}\nDelivery: ${l.destination} — ${l.delivery_date||'—'} ${l.delivery_time_from||''}${l.delivery_time_to?' – '+l.delivery_time_to:''}\nCarrier Rate: $${Number(l.carrier_rate||0).toLocaleString('en-US',{minimumFractionDigits:2})} USD\n\nThe rate confirmation has been generated in the Might Logistics portal. Please review it, print/save it as PDF if needed, sign it, and return the signed copy.\n\nThank you,\nMight Logistics`;
        const mailUrl=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        const mailTab=window.open(mailUrl,'_blank');
        if(!mailTab)alert('Rate confirmation generated successfully, but Chrome blocked the Gmail compose window. Allow pop-ups for mightlogistics.com and click the email button again.');
      }else{
        alert('Rate confirmation generated successfully. The carrier does not have an email address on file, so Gmail was not opened.');
      }
    }catch(err){
      console.error(err);
      if(rateTab&&!rateTab.closed){
        rateTab.document.open();
        rateTab.document.write('<div style="font-family:Arial,sans-serif;padding:40px;color:#b42318"><h2>Rate Confirmation could not be generated</h2><p>'+String(err.message||err).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</p></div>');
        rateTab.document.close();
      }
      alert(`Rate confirmation failed: ${err.message||err}`);
    }finally{
      if(b){b.disabled=false;b.textContent='Generate Rate Confirmation & Email'}
      ensureButton();
    }
  }

  function init(){ensureButton();setInterval(ensureButton,500);$('load_status')?.addEventListener('change',ensureButton)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();