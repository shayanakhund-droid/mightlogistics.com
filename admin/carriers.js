(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const statusLabel=s=>String(s||'').replace(/_/g,' ');
  const phoneFmt=v=>{const d=String(v||'').replace(/\D/g,'').replace(/^1/,'').slice(0,10);return d.length===10?`(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`:String(v||'');};
  const daysUntil=v=>{if(!v)return null;const d=new Date(`${v}T00:00:00`);if(Number.isNaN(d.getTime()))return null;const today=new Date();today.setHours(0,0,0,0);return Math.ceil((d.getTime()-today.getTime())/86400000);};
  let carriers=[];

  function ensureLookupFields(){
    const grid=$('carrierForm')?.querySelector('.carrier-form-grid');
    if(!grid||$('carrierOperationalSection'))return;
    const section=document.createElement('div');
    section.id='carrierOperationalSection';
    section.className='carrier-section carrier-full';
    section.innerHTML='<h4>Carrier Compliance & Fleet</h4><p>Public carrier data is stored separately from your internal notes.</p>';
    const authority=document.createElement('label');authority.innerHTML='Authority Status<input id="carrier_authorityStatus" readonly>';authority.className='carrier-full';
    const units=document.createElement('label');units.innerHTML='Power Units<input id="carrier_powerUnits" type="number" min="0" readonly>';
    const drivers=document.createElement('label');drivers.innerHTML='Drivers<input id="carrier_drivers" type="number" min="0" readonly>';
    const source=document.createElement('label');source.innerHTML='Data Source<input id="carrier_dataSource" readonly>';
    const profile=document.createElement('label');profile.innerHTML='Source Profile<input id="carrier_sourceProfile" readonly>';
    const notes=$('carrier_notes')?.closest('label');
    grid.insertBefore(section,notes||null);
    grid.insertBefore(authority,notes||null);
    grid.insertBefore(units,notes||null);
    grid.insertBefore(drivers,notes||null);
    grid.insertBefore(source,notes||null);
    grid.insertBefore(profile,notes||null);
  }

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
    carriers=data||[];
    renderCarrierAlerts();renderCarriers();populateSelect();
  }

  function renderCarrierAlerts(){
    const box=$('carrierAlerts');if(!box)return;
    const expired=carriers.filter(c=>c.status==='do_not_use'||c.insurance_status==='expired'||(c.insurance_expiration&&daysUntil(c.insurance_expiration)<0));
    const soon=carriers.filter(c=>c.status!=='do_not_use'&&c.insurance_expiration&&daysUntil(c.insurance_expiration)>=0&&daysUntil(c.insurance_expiration)<=30);
    if(!expired.length&&!soon.length){box.className='carrier-alerts hidden';box.innerHTML='';return;}
    const parts=[];
    if(expired.length)parts.push(`<div class="carrier-alert danger"><strong>${expired.length} carrier${expired.length===1?'':'s'} require attention.</strong> Insurance is expired/no longer active or the carrier is already marked Do Not Use.</div>`);
    if(soon.length)parts.push(`<div class="carrier-alert warning"><strong>${soon.length} insurance expiration${soon.length===1?'':'s'} within 30 days.</strong> Review these carriers before tendering loads.</div>`);
    box.className='carrier-alerts';box.innerHTML=parts.join('');
  }

  function renderCarriers(){
    const rows=$('carrierRows');if(!rows)return;
    const term=($('carrierSearch')?.value||'').trim().toLowerCase();
    const filtered=carriers.filter(c=>!term||[c.legal_name,c.dba_name,c.mc_number,c.dot_number,c.contact_name,c.phone,c.email,c.city,c.state,c.zip_code].some(v=>String(v||'').toLowerCase().includes(term)));
    if(!filtered.length){rows.innerHTML='<tr><td colspan="6" class="empty">No carriers found.</td></tr>';return;}
    rows.innerHTML=filtered.map(c=>{
      const d=daysUntil(c.insurance_expiration);
      const insuranceText=c.insurance_status==='expired'?'Insurance expired':c.insurance_expiration?(d<=30?`Insurance expires in ${Math.max(d,0)} days`:`Insurance ${c.insurance_expiration}`):(c.insurance_status==='active'?'Insurance active':'Insurance unknown');
      return `<tr><td class="customer"><strong>${esc(c.legal_name)}</strong>${c.dba_name?`<span>${esc(c.dba_name)}</span>`:''}<span>${c.dot_number?`DOT ${esc(c.dot_number)}`:'DOT —'}</span></td><td>${esc(c.mc_number||'—')}</td><td>${esc(c.contact_name||'—')}</td><td>${c.phone?`<a href="tel:${esc(c.phone)}">${esc(phoneFmt(c.phone))}</a>`:'—'}</td><td><span class="status ${esc(c.status)}">${esc(statusLabel(c.status))}</span><small class="carrier-insurance ${c.insurance_status==='expired'?'expired':d!==null&&d<=30?'warning':''}">${esc(insuranceText)}</small></td><td><button class="outline carrier-view" data-id="${esc(c.id)}">View</button></td></tr>`;
    }).join('');
    rows.querySelectorAll('.carrier-view').forEach(b=>b.addEventListener('click',()=>openCarrier(b.dataset.id)));
  }

  function populateSelect(){
    const sel=$('load_carrierId');if(!sel)return;const current=sel.value;
    sel.innerHTML='<option value="">Unassigned</option>'+carriers.filter(c=>c.status!=='do_not_use').map(c=>`<option value="${esc(c.id)}">${esc(c.legal_name)}${c.mc_number?` — ${esc(c.mc_number)}`:''}</option>`).join('');
    if(current)sel.value=current;
  }

  function resetForm(){
    $('carrierForm')?.reset();ensureLookupFields();$('carrierForm').dataset.id='';$('carrierModalTitle').textContent='Add Carrier';$('carrierSaveMessage').textContent='';$('carrierLookupMessage').textContent='Enter an MC number to retrieve carrier information automatically.';$('carrier_status').value='active';$('carrier_insuranceStatus').value='unknown';updateInsuranceMessage();
  }
  function openModal(){ensureLookupFields();$('carrierModal')?.classList.remove('hidden');$('carrierModal')?.setAttribute('aria-hidden','false');}
  function closeModal(){ $('carrierModal')?.classList.add('hidden');$('carrierModal')?.setAttribute('aria-hidden','true'); }

  function fillCarrier(c){
    ensureLookupFields();
    $('carrierForm').dataset.id=c?.id||'';
    $('carrierModalTitle').textContent=c?'Edit Carrier':'Add Carrier';
    $('carrier_legalName').value=c?.legal_name||'';$('carrier_dba').value=c?.dba_name||'';$('carrier_mc').value=c?.mc_number||'';$('carrier_dot').value=c?.dot_number||'';$('carrier_contact').value=c?.contact_name||'';$('carrier_phone').value=phoneFmt(c?.phone||'');$('carrier_email').value=c?.email||'';$('carrier_address1').value=c?.address_line1||'';$('carrier_address2').value=c?.address_line2||'';$('carrier_city').value=c?.city||'';$('carrier_state').value=c?.state||'';$('carrier_zip').value=c?.zip_code||'';$('carrier_insurance').value=c?.insurance_expiration||'';$('carrier_insuranceStatus').value=c?.insurance_status||'unknown';$('carrier_insuranceCompany').value=c?.insurance_company||'';$('carrier_policyNumber').value=c?.insurance_policy_number||'';$('carrier_insuranceEffective').value=c?.insurance_effective_date||'';$('carrier_coverage').value=c?.insurance_coverage??'';$('carrier_authorityStatus').value=c?.authority_status||'';$('carrier_powerUnits').value=c?.power_units??'';$('carrier_drivers').value=c?.drivers??'';$('carrier_dataSource').value=c?.data_source||'';$('carrier_sourceProfile').value=c?.source_profile_url||'';$('carrier_status').value=c?.status||'active';$('carrier_notes').value=c?.notes||'';$('carrier_lookupMc').value=c?.mc_number||'';$('carrierSaveMessage').textContent='';updateInsuranceMessage();
  }
  function openCarrier(id){const c=carriers.find(x=>String(x.id)===String(id));if(!c)return;fillCarrier(c);openModal();}

  function updateInsuranceMessage(){
    const msg=$('carrierInsuranceMessage');if(!msg)return;
    const exp=$('carrier_insurance')?.value;const status=$('carrier_insuranceStatus')?.value;const d=daysUntil(exp);
    if(status==='expired'||(d!==null&&d<0)){msg.textContent='Insurance is expired. This carrier will be saved as Do Not Use.';msg.className='insurance-message danger';}
    else if(d!==null&&d<=30){msg.textContent=`Insurance expires in ${d} day${d===1?'':'s'}. Review this carrier before tendering.`;msg.className='insurance-message warning';}
    else if(status==='active'){msg.textContent='Active insurance found.';msg.className='insurance-message good';}
    else {msg.textContent='Insurance status has not been verified.';msg.className='insurance-message';}
  }

  async function lookupCarrier(){
    ensureLookupFields();
    const raw=$('carrier_lookupMc').value.trim();if(!raw){$('carrierLookupMessage').textContent='Enter an MC number first.';return;}
    const mc=raw.replace(/[^0-9]/g,'');if(!mc){$('carrierLookupMessage').textContent='Enter a valid MC number.';return;}
    const btn=$('carrierLookup');if(btn){btn.disabled=true;btn.textContent='Fetching…';}$('carrierLookupMessage').textContent='Retrieving carrier information and enriching the record…';
    try{
      const {data,error}=await db.functions.invoke('carrier-lookup',{body:{mc}});
      if(error)throw error;if(!data?.data)throw new Error(data?.error||'Carrier not found.');
      const c=data.data;
      $('carrier_legalName').value=c.legal_name||'';$('carrier_dba').value=c.dba_name||'';$('carrier_mc').value=c.mc_number||mc;$('carrier_dot').value=c.dot_number||'';$('carrier_contact').value=c.contact_name||'';$('carrier_phone').value=phoneFmt(c.phone||'');$('carrier_email').value=c.email||'';$('carrier_address1').value=c.address_line1||'';$('carrier_address2').value=c.address_line2||'';$('carrier_city').value=c.city||'';$('carrier_state').value=c.state||'';$('carrier_zip').value=c.zip_code||'';$('carrier_insuranceStatus').value=c.insurance_status||'unknown';$('carrier_insuranceCompany').value=c.insurance_company||'';$('carrier_policyNumber').value=c.insurance_policy_number||'';$('carrier_insuranceEffective').value=c.insurance_effective_date||'';$('carrier_insurance').value=c.insurance_expiration||'';$('carrier_coverage').value=c.insurance_coverage??'';$('carrier_authorityStatus').value=c.authority_status||'';$('carrier_powerUnits').value=c.power_units??'';$('carrier_drivers').value=c.drivers??'';$('carrier_dataSource').value=c.source||'Public carrier data';$('carrier_sourceProfile').value=c.source_profile_url||c.dotsearch_url||'';
      const expired=c.insurance_status==='expired'||(c.insurance_expiration&&daysUntil(c.insurance_expiration)<0);$('carrier_status').value=expired?'do_not_use':(c.authority_status&&String(c.authority_status).toLowerCase().includes('active')?'active':'inactive');
      // IMPORTANT: lookup data never overwrites internal Notes. Notes are reserved for the Might team.
      $('carrierLookupMessage').textContent=expired?'Carrier found — no active insurance was found. Carrier marked Do Not Use.':`Carrier found: ${c.legal_name||'Unknown'} — fields populated automatically.`;updateInsuranceMessage();
    }catch(err){console.error(err);$('carrierLookupMessage').textContent='Automatic lookup failed. Opening DOT Search as a fallback.';window.open('https://www.dotsearch.io/','_blank','noopener,noreferrer');}
    finally{if(btn){btn.disabled=false;btn.textContent='Fetch Carrier';}}
  }

  async function saveCarrier(e){
    e.preventDefault();ensureLookupFields();const id=$('carrierForm').dataset.id||null;const legal=$('carrier_legalName').value.trim();if(!legal){$('carrierSaveMessage').textContent='Legal name is required.';return;}
    const exp=$('carrier_insurance').value||null;const expDays=daysUntil(exp);let insuranceStatus=$('carrier_insuranceStatus').value||'unknown';let status=$('carrier_status').value;if(expDays!==null&&expDays<0){insuranceStatus='expired';status='do_not_use';}if(insuranceStatus==='expired')status='do_not_use';
    const payload={legal_name:legal,dba_name:$('carrier_dba').value.trim()||null,mc_number:$('carrier_mc').value.trim()||null,dot_number:$('carrier_dot').value.trim()||null,contact_name:$('carrier_contact').value.trim()||null,phone:phoneFmt($('carrier_phone').value.trim())||null,email:$('carrier_email').value.trim()||null,address_line1:$('carrier_address1').value.trim()||null,address_line2:$('carrier_address2').value.trim()||null,city:$('carrier_city').value.trim()||null,state:$('carrier_state').value.trim()||null,zip_code:$('carrier_zip').value.trim()||null,insurance_expiration:exp,insurance_status:insuranceStatus,insurance_company:$('carrier_insuranceCompany').value.trim()||null,insurance_policy_number:$('carrier_policyNumber').value.trim()||null,insurance_effective_date:$('carrier_insuranceEffective').value||null,insurance_coverage:$('carrier_coverage').value?Number($('carrier_coverage').value):null,authority_status:$('carrier_authorityStatus').value.trim()||null,power_units:$('carrier_powerUnits').value!==''?Number($('carrier_powerUnits').value):null,drivers:$('carrier_drivers').value!==''?Number($('carrier_drivers').value):null,data_source:$('carrier_dataSource').value.trim()||null,source_profile_url:$('carrier_sourceProfile').value.trim()||null,status,notes:$('carrier_notes').value.trim()||null,updated_at:new Date().toISOString()};
    $('carrierSaveMessage').textContent='Saving…';const result=id?await db.from('carriers').update(payload).eq('id',id):await db.from('carriers').insert(payload);if(result.error){$('carrierSaveMessage').textContent=result.error.message;return;}$('carrierSaveMessage').textContent=status==='do_not_use'?'Saved — carrier marked Do Not Use.':'Saved.';await loadCarriers();setTimeout(closeModal,700);
  }

  window.mightCarriers={populateSelect,loadCarriers};
  function init(){
    ensureLookupFields();
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.addEventListener('click',e=>{if(a.dataset.section==='carriers'){e.preventDefault();showSection('carriers');}}));
    $('carrierSearch')?.addEventListener('input',renderCarriers);$('carrierRefresh')?.addEventListener('click',loadCarriers);$('createCarrier')?.addEventListener('click',()=>{resetForm();openModal();});$('carrierForm')?.addEventListener('submit',saveCarrier);$('carrierLookup')?.addEventListener('click',lookupCarrier);$('carrierModalClose')?.addEventListener('click',closeModal);$('carrierModalCancel')?.addEventListener('click',closeModal);$('carrierModalBackdrop')?.addEventListener('click',closeModal);$('carrier_insurance')?.addEventListener('change',updateInsuranceMessage);$('carrier_insuranceStatus')?.addEventListener('change',updateInsuranceMessage);
    if(location.hash==='#carriers')showSection('carriers');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
