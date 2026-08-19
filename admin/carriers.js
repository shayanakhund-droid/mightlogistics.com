(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const statusLabel=s=>String(s||'').replace(/_/g,' ');
  const phoneFmt=v=>{const d=String(v||'').replace(/\D/g,'').replace(/^1/,'').slice(0,10);return d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:String(v||'');};
  let carriers=[];

  function showSection(section){
    const views=['dashboard','loads','customers','carriers'];
    views.forEach(id=>$(id)?.classList.toggle('hidden',id!==section));
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===section));
    if($('pageTitle'))$('pageTitle').textContent=section==='carriers'?'Carrier Management':'Operations Dashboard';
    if(section==='carriers')loadCarriers();
  }

  async function loadCarriers(){
    const rows=$('carrierRows');if(!rows)return;
    rows.innerHTML='<tr><td colspan="6" class="empty">Loading carriers…</td></tr>';
    const {data,error}=await db.from('carriers').select('*').order('created_at',{ascending:false});
    if(error){rows.innerHTML=`<tr><td colspan="6" class="empty">Could not load carriers.<br><small>${esc(error.message)}</small></td></tr>`;return;}
    carriers=data||[];renderCarriers();populateSelect();
  }

  function renderCarriers(){
    const rows=$('carrierRows');if(!rows)return;
    const term=($('carrierSearch')?.value||'').trim().toLowerCase();
    const filtered=carriers.filter(c=>!term||[c.legal_name,c.dba_name,c.mc_number,c.dot_number,c.contact_name,c.phone,c.email].some(v=>String(v||'').toLowerCase().includes(term)));
    if(!filtered.length){rows.innerHTML='<tr><td colspan="6" class="empty">No carriers found.</td></tr>';return;}
    rows.innerHTML=filtered.map(c=>`<tr><td class="customer"><strong>${esc(c.legal_name)}</strong>${c.dba_name?`<span>${esc(c.dba_name)}</span>`:''}<span>${c.dot_number?`DOT ${esc(c.dot_number)}`:'DOT —'}</span></td><td>${esc(c.mc_number||'—')}</td><td>${esc(c.contact_name||'—')}</td><td>${c.phone?`<a href="tel:${esc(c.phone)}">${esc(phoneFmt(c.phone))}</a>`:'—'}</td><td><span class="status ${esc(c.status)}">${esc(statusLabel(c.status))}</span></td><td><button class="outline carrier-view" data-id="${esc(c.id)}">View</button></td></tr>`).join('');
    rows.querySelectorAll('.carrier-view').forEach(b=>b.addEventListener('click',()=>openCarrier(b.dataset.id)));
  }

  function populateSelect(){
    const sel=$('load_carrierId');if(!sel)return;const current=sel.value;
    sel.innerHTML='<option value="">Unassigned</option>'+carriers.filter(c=>c.status!=='do_not_use').map(c=>`<option value="${esc(c.id)}">${esc(c.legal_name)}${c.mc_number?` — ${esc(c.mc_number)}`:''}</option>`).join('');
    if(current)sel.value=current;
  }

  function resetForm(){
    $('carrierForm')?.reset();
    $('carrierForm').dataset.id='';
    $('carrierModalTitle').textContent='Add Carrier';
    $('carrierSaveMessage').textContent='';
    $('carrierLookupMessage').textContent='Enter an MC number and we’ll automatically retrieve the carrier record.';
    $('carrier_status').value='active';
  }

  function openModal(){ $('carrierModal')?.classList.remove('hidden');$('carrierModal')?.setAttribute('aria-hidden','false'); }
  function closeModal(){ $('carrierModal')?.classList.add('hidden');$('carrierModal')?.setAttribute('aria-hidden','true'); }

  function fillCarrier(c){
    $('carrierForm').dataset.id=c?.id||'';
    $('carrierModalTitle').textContent=c?'Edit Carrier':'Add Carrier';
    $('carrier_legalName').value=c?.legal_name||'';
    $('carrier_dba').value=c?.dba_name||'';
    $('carrier_mc').value=c?.mc_number||'';
    $('carrier_dot').value=c?.dot_number||'';
    $('carrier_contact').value=c?.contact_name||'';
    $('carrier_phone').value=phoneFmt(c?.phone||'');
    $('carrier_email').value=c?.email||'';
    $('carrier_insurance').value=c?.insurance_expiration||'';
    $('carrier_status').value=c?.status||'active';
    $('carrier_notes').value=c?.notes||'';
    $('carrier_lookupMc').value=c?.mc_number||'';
    $('carrierSaveMessage').textContent='';
  }

  function openCarrier(id){const c=carriers.find(x=>String(x.id)===String(id));if(!c)return;fillCarrier(c);openModal();}

  function setLookupMessage(text,kind=''){const el=$('carrierLookupMessage');if(!el)return;el.textContent=text;el.dataset.state=kind;}

  async function lookupCarrier(){
    const raw=$('carrier_lookupMc').value.trim();
    if(!raw){setLookupMessage('Enter an MC number first.','error');return;}
    const mc=raw.replace(/[^0-9]/g,'');
    if(!mc){setLookupMessage('Enter a valid MC number.','error');return;}

    const btn=$('carrierLookup');
    if(btn){btn.disabled=true;btn.textContent='Retrieving…';}
    setLookupMessage('Retrieving carrier information…','loading');

    try{
      const {data,error}=await db.functions.invoke('carrier-lookup',{body:{mc}});
      if(error)throw error;
      if(!data?.data)throw new Error(data?.error||'Carrier not found.');
      const c=data.data;

      $('carrier_legalName').value=c.legal_name||'';
      $('carrier_dba').value=c.dba_name||'';
      $('carrier_mc').value=c.mc_number||mc;
      $('carrier_dot').value=c.dot_number||'';
      $('carrier_contact').value=c.contact_name||'';
      $('carrier_phone').value=phoneFmt(c.phone||'');
      $('carrier_email').value=c.email||'';
      $('carrier_insurance').value=c.insurance_expiration||'';

      if(c.authority_status){
        const a=String(c.authority_status).toLowerCase();
        $('carrier_status').value=(a.includes('active')||a.includes('authorized'))?'active':'inactive';
      }

      const autoNotes=[];
      if(c.physical_address)autoNotes.push(`Address: ${c.physical_address}`);
      if(c.authority_status)autoNotes.push(`Authority: ${c.authority_status}`);
      if(c.power_units!=null)autoNotes.push(`Power Units: ${c.power_units}`);
      if(c.drivers!=null)autoNotes.push(`Drivers: ${c.drivers}`);
      if(c.insurance_company)autoNotes.push(`Insurance: ${c.insurance_company}`);
      if(c.insurance_coverage!=null)autoNotes.push(`Coverage: $${Number(c.insurance_coverage).toLocaleString('en-US')}`);
      if(autoNotes.length && !$('carrier_notes').value.trim())$('carrier_notes').value=autoNotes.join('\n');

      setLookupMessage(`Carrier found: ${c.legal_name||'Unknown'} — fields populated automatically.`,'success');
    }catch(err){
      console.error(err);
      setLookupMessage('Automatic lookup failed. You can verify the MC on DOT Search and enter the record manually.','error');
      window.open('https://www.dotsearch.io/','_blank','noopener,noreferrer');
    }finally{
      if(btn){btn.disabled=false;btn.textContent='Fetch Carrier';}
    }
  }

  async function saveCarrier(e){
    e.preventDefault();
    const id=$('carrierForm').dataset.id||null;
    const legal=$('carrier_legalName').value.trim();
    if(!legal){$('carrierSaveMessage').textContent='Legal name is required.';return;}
    const payload={
      legal_name:legal,
      dba_name:$('carrier_dba').value.trim()||null,
      mc_number:$('carrier_mc').value.trim()||null,
      dot_number:$('carrier_dot').value.trim()||null,
      contact_name:$('carrier_contact').value.trim()||null,
      phone:phoneFmt($('carrier_phone').value.trim())||null,
      email:$('carrier_email').value.trim()||null,
      insurance_expiration:$('carrier_insurance').value||null,
      status:$('carrier_status').value,
      notes:$('carrier_notes').value.trim()||null,
      updated_at:new Date().toISOString()
    };
    $('carrierSaveMessage').textContent='Saving…';
    const result=id?await db.from('carriers').update(payload).eq('id',id):await db.from('carriers').insert(payload);
    if(result.error){$('carrierSaveMessage').textContent=result.error.message;return;}
    $('carrierSaveMessage').textContent='Saved.';
    await loadCarriers();
    setTimeout(closeModal,500);
  }

  window.mightCarriers={populateSelect,loadCarriers};

  function init(){
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.addEventListener('click',e=>{if(a.dataset.section==='carriers'){e.preventDefault();showSection('carriers');}}));
    $('carrierSearch')?.addEventListener('input',renderCarriers);
    $('carrierRefresh')?.addEventListener('click',loadCarriers);
    $('createCarrier')?.addEventListener('click',()=>{resetForm();openModal();});
    $('carrierForm')?.addEventListener('submit',saveCarrier);
    $('carrierLookup')?.addEventListener('click',lookupCarrier);
    $('carrierModalClose')?.addEventListener('click',closeModal);
    $('carrierModalCancel')?.addEventListener('click',closeModal);
    $('carrierModalBackdrop')?.addEventListener('click',closeModal);
    if(location.hash==='#carriers')showSection('carriers');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
