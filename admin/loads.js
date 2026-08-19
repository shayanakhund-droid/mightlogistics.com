(function(){
  const db = window.mightDb;
  if(!db) return;
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = v => { if(!v) return '—'; const s=String(v); const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(s)?`${s}T00:00:00`:s); return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d); };
  const money = v => Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
  const statusLabel = s => String(s||'').replace(/_/g,' ');
  const sourceLabel = s => ({website:'Website Quote',email:'Email',phone:'Phone',existing_customer:'Existing Customer',other:'Other'}[s]||'Other');
  const statusFlow=['new','quoted','booked','carrier_assigned','dispatched','picked_up','in_transit','delivered','invoiced','paid'];
  let loads=[];

  function showSection(section){
    const dash=$('dashboard'), cust=$('customers'), loadsView=$('loads');
    if(!dash||!loadsView)return;
    dash.classList.add('hidden'); if(cust) cust.classList.add('hidden');
    loadsView.classList.toggle('hidden',section!=='loads');
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===section));
    if($('pageTitle')) $('pageTitle').textContent='Load Management';
    if(section==='loads') loadLoads();
  }
  async function loadLoads(){
    const rows=$('loadRows'); if(!rows)return; rows.innerHTML='<tr><td colspan="9" class="empty">Loading loads…</td></tr>';
    const {data,error}=await db.from('loads').select('*').order('created_at',{ascending:false});
    if(error){rows.innerHTML=`<tr><td colspan="9" class="empty">Could not load loads.<br><small>${esc(error.message)}</small></td></tr>`;return;}
    loads=data||[]; renderLoads();
  }
  function renderLoads(){
    const term=($('loadSearch')?.value||'').trim().toLowerCase(), filter=$('loadStatusFilter')?.value||'all';
    const filtered=loads.filter(l=>{if(filter!=='all'&&l.status!==filter)return false;if(!term)return true;return [l.load_number,l.company_name,l.origin,l.destination,l.carrier_name,l.source].some(v=>String(v||'').toLowerCase().includes(term));});
    const rows=$('loadRows'); if(!filtered.length){rows.innerHTML='<tr><td colspan="9" class="empty">No loads match your filters.</td></tr>';return;}
    rows.innerHTML=filtered.map(l=>`<tr><td><strong>${esc(l.load_number)}</strong></td><td class="customer"><strong>${esc(l.company_name||'—')}</strong><span>${esc(sourceLabel(l.source))}</span></td><td class="lane">${esc(l.origin)} <span>→</span> ${esc(l.destination)}</td><td>${fmtDate(l.pickup_date)}</td><td>${esc(l.equipment||'—')}</td><td>${esc(l.carrier_name||'Unassigned')}</td><td><span class="status ${esc(l.status)}">${esc(statusLabel(l.status))}</span></td><td>${l.customer_rate!=null?money(l.customer_rate):'—'}</td><td><button class="outline load-view" data-id="${esc(l.id)}">View</button></td></tr>`).join('');
    rows.querySelectorAll('.load-view').forEach(b=>b.addEventListener('click',()=>openLoad(b.dataset.id)));
  }
  function updateLoadEconomics(){
    const customer=Number($('load_customerRate')?.value||0), carrier=Number($('load_carrierRate')?.value||0), profit=customer-carrier, margin=customer>0?(profit/customer)*100:0;
    if($('loadEconomicsCustomer')) $('loadEconomicsCustomer').textContent=money(customer);
    if($('loadEconomicsCarrier')) $('loadEconomicsCarrier').textContent=money(carrier);
    if($('loadGrossMargin')) $('loadGrossMargin').textContent=money(profit);
    if($('loadMarginPercent')) $('loadMarginPercent').textContent=`${margin.toFixed(1)}%`;
  }
  function updateAdvanceButton(){
    const btn=$('advanceLoadStatus');if(!btn)return;const current=$('load_status')?.value||'new',idx=statusFlow.indexOf(current);
    if(current==='cancelled'||idx<0||idx>=statusFlow.length-1){btn.disabled=true;btn.textContent='No Next Status';return;}
    btn.disabled=false;btn.textContent=`Advance to ${statusLabel(statusFlow[idx+1])}`;
  }
  function fieldMap(){return {companyName:'company_name',origin:'origin',destination:'destination',pickupDate:'pickup_date',deliveryDate:'delivery_date',equipment:'equipment',commodity:'commodity',weight:'weight',pieces:'pieces',customerRate:'customer_rate',carrierRate:'carrier_rate',carrierName:'carrier_name',carrierMc:'carrier_mc',driverName:'driver_name',driverPhone:'driver_phone',truckNumber:'truck_number',trailerNumber:'trailer_number',specialRequirements:'special_requirements',internalNotes:'internal_notes'};}
  function openLoad(id){
    const l=loads.find(x=>String(x.id)===String(id));if(!l)return;
    $('loadModalTitle').textContent=l.load_number;$('loadForm').dataset.id=l.id;
    const map=fieldMap();Object.keys(map).forEach(k=>{const el=$('load_'+k);if(el)el.value=l[map[k]]??'';});
    $('load_status').value=l.status||'new';$('load_source').value=l.source||'other';$('loadSaveMessage').textContent='';
    $('loadModal').classList.remove('hidden');updateLoadEconomics();updateAdvanceButton();
  }
  function closeLoad(){$('loadModal')?.classList.add('hidden');}
  async function saveLoad(e){
    e.preventDefault();const f=$('loadForm'),id=f.dataset.id||null,customerRate=Number($('load_customerRate').value||0),carrierRate=Number($('load_carrierRate').value||0);
    const payload={source:$('load_source').value,status:$('load_status').value,origin:$('load_origin').value.trim(),destination:$('load_destination').value.trim(),pickup_date:$('load_pickupDate').value||null,delivery_date:$('load_deliveryDate').value||null,equipment:$('load_equipment').value,commodity:$('load_commodity').value.trim(),weight:Number($('load_weight').value||0)||null,pieces:Number($('load_pieces').value||0)||null,customer_rate:customerRate||null,carrier_rate:carrierRate||null,gross_margin:(customerRate-carrierRate)||null,carrier_name:$('load_carrierName').value.trim()||null,carrier_mc:$('load_carrierMc').value.trim()||null,driver_name:$('load_driverName').value.trim()||null,driver_phone:$('load_driverPhone').value.trim()||null,truck_number:$('load_truckNumber').value.trim()||null,trailer_number:$('load_trailerNumber').value.trim()||null,special_requirements:$('load_specialRequirements').value.trim()||null,internal_notes:$('load_internalNotes').value.trim()||null,updated_at:new Date().toISOString()};
    if(!payload.origin||!payload.destination){$('loadSaveMessage').textContent='Origin and destination are required.';return;}$('loadSaveMessage').textContent='Saving…';
    let result;
    if(id) result=await db.from('loads').update(payload).eq('id',id);
    else { const {data:number,error:numberError}=await db.rpc('next_load_number'); if(numberError){$('loadSaveMessage').textContent=numberError.message;return;} payload.load_number=number; result=await db.from('loads').insert(payload); }
    if(result.error){$('loadSaveMessage').textContent=result.error.message;return;}$('loadSaveMessage').textContent='Saved.';await loadLoads();setTimeout(closeLoad,500);
  }
  async function advanceLoadStatus(){
    const current=$('load_status').value,idx=statusFlow.indexOf(current);if(idx<0||idx>=statusFlow.length-1)return;const next=statusFlow[idx+1];$('load_status').value=next;updateAdvanceButton();
    const id=$('loadForm').dataset.id;if(!id)return;$('loadSaveMessage').textContent=`Saving ${statusLabel(next)}…`;
    const timestamps={picked_up:'picked_up_at',delivered:'delivered_at',invoiced:'invoiced_at',paid:'paid_at',booked:'booked_at'};
    const patch={status:next,updated_at:new Date().toISOString()};if(timestamps[next])patch[timestamps[next]]=new Date().toISOString();
    const {error}=await db.from('loads').update(patch).eq('id',id);if(error){$('loadSaveMessage').textContent=error.message;return;}
    $('loadSaveMessage').textContent=`Status updated to ${statusLabel(next)}.`;await loadLoads();
  }
  async function createFromQuote(){
    const title=$('drawerTitle')?.textContent?.trim()||'',m=title.match(/(\d+)/);if(!m)return;const quoteNo=Number(m[1]);
    const {data:q,error}=await db.from('quote_requests').select('*').eq('quote_number',quoteNo).maybeSingle();if(error||!q){alert('Could not find this quote.');return;}
    const existing=await db.from('loads').select('id,load_number').eq('quote_id',q.id).maybeSingle();if(existing.data){alert(`This quote is already linked to load ${existing.data.load_number}.`);return;}
    const {data:loadNumber,error:numberError}=await db.rpc('next_load_number');if(numberError){alert(numberError.message);return;}
    const {error:insertError}=await db.from('loads').insert({load_number:loadNumber,quote_id:q.id,customer_id:q.customer_id||null,source:'website',status:'booked',origin:q.origin,destination:q.destination,pickup_date:q.pickup_date,equipment:q.equipment,commodity:q.commodity,weight:q.weight_lbs,pieces:q.pieces,special_requirements:q.special_requirements,customer_rate:q.customer_rate,carrier_rate:q.carrier_rate,gross_margin:q.margin,internal_notes:q.internal_notes||q.notes,booked_at:new Date().toISOString()});
    if(insertError){alert(insertError.message);return;}alert(`Load ${loadNumber} created successfully.`);closeLoad();if(window.closeDrawer)window.closeDrawer();loadLoads();
  }
  function addBookButton(){const actions=$('quoteActions');if(!actions||$('bookLoadFromQuote'))return;const btn=document.createElement('button');btn.id='bookLoadFromQuote';btn.className='outline action-button';btn.textContent='Book as Load';btn.addEventListener('click',createFromQuote);actions.querySelector('.quote-action-row')?.appendChild(btn);}
  function init(){
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.addEventListener('click',e=>{if(a.dataset.section==='loads'){e.preventDefault();showSection('loads');}}));
    $('loadSearch')?.addEventListener('input',renderLoads);$('loadStatusFilter')?.addEventListener('change',renderLoads);$('loadRefresh')?.addEventListener('click',loadLoads);
    $('createLoad')?.addEventListener('click',()=>{$('loadForm').reset();$('loadForm').dataset.id='';$('load_source').value='email';$('load_status').value='new';$('loadModalTitle').textContent='New Load';$('loadSaveMessage').textContent='';$('loadModal').classList.remove('hidden');updateLoadEconomics();updateAdvanceButton();});
    $('loadForm')?.addEventListener('submit',saveLoad);$('loadModalClose')?.addEventListener('click',closeLoad);$('loadModalBackdrop')?.addEventListener('click',closeLoad);$('load_customerRate')?.addEventListener('input',updateLoadEconomics);$('load_carrierRate')?.addEventListener('input',updateLoadEconomics);$('load_status')?.addEventListener('change',updateAdvanceButton);$('advanceLoadStatus')?.addEventListener('click',advanceLoadStatus);addBookButton();setInterval(addBookButton,1000);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
