(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
  const fmtDate=v=>{if(!v)return'—';const d=new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(v))?`${v}T00:00:00`:v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('en-US',{month:'2-digit',day:'2-digit',year:'numeric'}).format(d)};
  const timeRange=(a,b)=>a&&b?`${a} – ${b}`:a||b||'—';
  const statusFlow=['new','quoted','booked','carrier_assigned','dispatched','picked_up','in_transit','delivered','invoiced','paid'];
  const TERMS=[
    'This Rate Confirmation is incorporated by reference into the Broker-Carrier Agreement between Might Logistics and Carrier, together with any written revisions or addenda for this shipment.',
    'By accepting this Rate Confirmation, Carrier confirms that its operating authority is active, insurance is current and sufficient, and its equipment and drivers comply with all applicable requirements.',
    'Carrier shall provide clean, safe, roadworthy equipment suitable for the commodity. Carrier is responsible for lawful operation, loading and securement except where the shipper expressly assumes those duties.',
    'Carrier must immediately notify Might Logistics of any delay, accident, breakdown, detention, rejection, shortage, overage, damage, temperature issue or other event affecting pickup or delivery.',
    'Pickup and delivery appointments must be honored. Detention, layover, TONU and other accessorial charges require the notice and authorization required by the Broker-Carrier Agreement unless separately authorized in writing.',
    'Carrier shall not double broker, re-broker, interline or transfer the shipment without prior written authorization. The carrier arriving at the shipper must match the carrier booked for the load.',
    'Carrier shall accept and maintain any required electronic tracking before pickup and promptly correct any material interruption in tracking.',
    'Carrier shall not break seals or alter shipping documents without authorization. Seals, shortages, overages and damage must be recorded on the BOL and reported promptly.',
    'Signed BOL/POD documents must be provided promptly after delivery and must be legible and complete. Carrier remains responsible for preserving original documents as required by law.',
    'Carrier is responsible for cargo while in its possession and shall maintain cargo liability insurance required by the Broker-Carrier Agreement and applicable law. Potential claims must be reported immediately.',
    'The rate shown is inclusive of ordinary transportation charges unless a separate written agreement states otherwise. Conflicting rate sheets or shipping documents do not supersede this confirmation.',
    'Carrier shall comply with applicable FMCSA hours-of-service, safety, equipment, drug and alcohol, environmental and cargo-securement requirements and all communicated shipper safety rules.',
    'For temperature-controlled freight, Carrier shall maintain the required temperature, verify equipment operation before loading and immediately report temperature deviations or mechanical issues.',
    'Advances, quick-pay and normal payment are subject to the Broker-Carrier Agreement and any applicable processing requirements. Carrier must submit invoice, signed BOL/POD and approved accessorial support.',
    'Acceptance by signature, electronic acceptance, dispatch, pickup or transportation of the shipment constitutes Carrier acceptance of the rate and applicable terms, subject to the Broker-Carrier Agreement.'
  ];
  const SPECIAL_TERMS=[
    'No TONU, detention, layover or other accessorial is payable without the notice and authorization required by the Broker-Carrier Agreement.',
    'Carrier must have required securement equipment, PPE and other equipment specified by the shipper before arrival.',
    'Truck, trailer and driver information must be provided before dispatch. Changes must be reported to Might Logistics immediately.',
    'Late or missed appointments, unauthorized substitutions, failure to make required precalls, tracking failures or missing paperwork may affect accessorial eligibility or result in removal from the load as permitted by the agreement and law.',
    'Carrier must not co-mingle unauthorized freight, partial the shipment or add other product when doing so violates shipper instructions or the Broker-Carrier Agreement.'
  ];

  function addStyles(){
    if($('rateconUiStyles'))return;
    const s=document.createElement('style');s.id='rateconUiStyles';s.textContent=`
      #loadOperationalTiming{grid-column:1/-1}.load-docs-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.load-upload{display:inline-flex!important;align-items:center!important;justify-content:center;border:1px solid #1d6fd1;border-radius:9px;padding:9px 12px!important;color:#1768b4!important;cursor:pointer!important;white-space:nowrap}.load-upload input{display:none!important}.load-documents-list{display:flex;flex-direction:column;gap:8px;margin-top:10px}.load-doc-row{display:flex;justify-content:space-between;gap:12px;align-items:center;border:1px solid #e1e6ed;border-radius:10px;padding:10px 12px;background:#fafbfc}.load-doc-row>div:first-child{min-width:0}.load-doc-row strong{display:block;overflow:hidden;text-overflow:ellipsis}.load-doc-row span{display:block;font-size:11px;color:#667085;margin-top:3px}.load-doc-actions{display:flex;gap:7px;flex-shrink:0}.load-doc-empty{padding:12px;border:1px dashed #cfd6df;border-radius:9px;color:#667085;font-size:13px}@media(max-width:600px){.load-docs-head{flex-direction:column}.load-doc-row{align-items:flex-start;flex-direction:column}.load-doc-actions{width:100%}}
    `;document.head.appendChild(s);
  }

  function ensureFields(){
    const grid=document.querySelector('#loadForm .loads-form-grid');if(!grid||$('loadOperationalTiming'))return;
    const section=document.createElement('div');section.id='loadOperationalTiming';section.className='loads-form-section';section.innerHTML='<h4>Operational Timing & Driver Instructions</h4><p class="loads-section-note">These fields are printed on the carrier rate confirmation.</p>';
    grid.appendChild(section);
    [['Pickup Time (From)','load_pickupTimeFrom','8:00 AM'],['Pickup Time (To)','load_pickupTimeTo','4:00 PM'],['Drop Off Time (From)','load_deliveryTimeFrom','8:00 AM'],['Drop Off Time (To)','load_deliveryTimeTo','4:00 PM']].forEach(([label,id,ph])=>{const l=document.createElement('label');l.innerHTML=`${label}<input id="${id}" placeholder="${ph}">`;grid.appendChild(l)});
    const d=document.createElement('label');d.className='loads-full';d.innerHTML='Driver Instructions<textarea id="load_driverInstructions" placeholder="Instructions the driver must follow at pickup, in transit or delivery…"></textarea>';grid.appendChild(d);
    const docs=document.createElement('div');docs.id='loadDocumentsSection';docs.className='loads-form-section loads-full';docs.innerHTML='<div class="load-docs-head"><div><h4>Documents</h4><p class="loads-section-note">The rate confirmation is generated automatically at Carrier Assigned. Upload BOLs, PODs, commodity photos, signed confirmations and PDFs here.</p></div><label class="load-upload"><span>+ Upload Document</span><input id="loadDocumentInput" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" multiple></label></div><div id="loadDocumentsList" class="load-documents-list"><div class="load-doc-empty">Open a saved load to view documents.</div></div>';
    grid.appendChild(docs);$('loadDocumentInput').addEventListener('change',uploadFiles);
  }

  async function currentLoad(){
    const id=$('loadForm')?.dataset.id;if(id){const {data}=await db.from('loads').select('*').eq('id',id).maybeSingle();return data||null}
    const o=$('load_origin')?.value.trim(),d=$('load_destination')?.value.trim();if(!o||!d)return null;
    const {data}=await db.from('loads').select('*').eq('origin',o).eq('destination',d).order('created_at',{ascending:false}).limit(1).maybeSingle();return data||null;
  }
  function fillFields(l){
    if($('load_pickupTimeFrom'))$('load_pickupTimeFrom').value=l?.pickup_time_from||'';
    if($('load_pickupTimeTo'))$('load_pickupTimeTo').value=l?.pickup_time_to||'';
    if($('load_deliveryTimeFrom'))$('load_deliveryTimeFrom').value=l?.delivery_time_from||'';
    if($('load_deliveryTimeTo'))$('load_deliveryTimeTo').value=l?.delivery_time_to||'';
    if($('load_driverInstructions'))$('load_driverInstructions').value=l?.driver_instructions||'';
  }
  async function saveOperational(l){
    if(!l)return null;const p={pickup_time_from:$('load_pickupTimeFrom')?.value.trim()||null,pickup_time_to:$('load_pickupTimeTo')?.value.trim()||null,delivery_time_from:$('load_deliveryTimeFrom')?.value.trim()||null,delivery_time_to:$('load_deliveryTimeTo')?.value.trim()||null,driver_instructions:$('load_driverInstructions')?.value.trim()||null,updated_at:new Date().toISOString()};
    const {data,error}=await db.from('loads').update(p).eq('id',l.id).select('*').single();if(error)console.error(error);return data||l;
  }

  function rateConHtml(l){
    const rate=Number(l.carrier_rate||0),pt=timeRange(l.pickup_time_from,l.pickup_time_to),dt=timeRange(l.delivery_time_from,l.delivery_time_to),special=l.special_requirements||'',driver=l.driver_instructions||'';
    const terms=TERMS.map(x=>`<li>${esc(x)}</li>`).join(''),specials=SPECIAL_TERMS.map(x=>`<li>${esc(x)}</li>`).join('');
    return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(l.load_number)} Rate Confirmation</title><style>@page{size:Letter;margin:.45in}body{font-family:Arial,Helvetica,sans-serif;color:#111;font-size:10px;line-height:1.28}.page{page-break-after:always}.page:last-child{page-break-after:auto}.head{display:flex;justify-content:space-between;border-bottom:2px solid #173b65;padding-bottom:8px}.brand{display:flex;gap:9px;align-items:center}.mark{width:38px;height:38px;border-radius:8px;background:#0a2340;color:#fff;display:flex;align-items:center;justify-content:center;font-size:23px;font-weight:800}.brand b{display:block;font-size:18px}.brand span{font-size:8px;color:#68768a;letter-spacing:.14em}.title{text-align:right}.title h1{font-size:18px;margin:0;text-transform:uppercase}.title strong{color:#173b9a;font-size:13px}.title small{display:block;margin-top:3px}.section{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;border-bottom:1px solid #b9c3cf;padding:7px 0 4px;margin-top:10px}.grid{display:grid;grid-template-columns:1fr 1fr;gap:8px}.box{border:1px solid #c9d0d8;padding:7px}.kv{display:grid;grid-template-columns:105px 1fr;gap:3px}.kv span{font-weight:700;color:#536173}.rate{border:1px solid #aeb9c5;background:#f2f5f8;padding:10px;text-align:right}.rate strong{font-size:20px}.stops{width:100%;border-collapse:collapse}.stops th,.stops td{border:1px solid #c7cdd5;padding:5px;text-align:left;vertical-align:top}.stops th{background:#e9edf2;font-size:8px;text-transform:uppercase}.yellow{background:#fff59a;border:1px solid #d1c400;padding:9px;white-space:pre-wrap}.terms{font-size:9px}.terms li{margin-bottom:5px}.sig{display:grid;grid-template-columns:1fr 1fr;gap:35px;margin-top:32px}.sig div{border-top:1px solid #222;padding-top:5px;min-height:32px}.note{background:#f7f8fa;border-left:3px solid #173b65;padding:8px;margin-top:10px}.foot{text-align:center;color:#68768a;font-size:8px;margin-top:12px}@media print{body{width:100%}}</style></head><body>
      <section class="page"><header class="head"><div class="brand"><div class="mark">M</div><div><b>MIGHT LOGISTICS</b><span>FREIGHT • CAPACITY • CONTROL</span></div></div><div class="title"><h1>Carrier Rate Confirmation</h1><strong>${esc(l.load_number)}</strong><small>Issued ${fmtDate(new Date().toISOString().slice(0,10))}</small></div></header>
      <div class="grid"><div><div class="section">Broker / Load</div><div class="box"><div class="kv"><span>Broker</span><b>Might Logistics</b><span>Load #</span><b>${esc(l.load_number)}</b><span>Status</span><b>${esc(l.status)}</b></div></div></div><div><div class="section">Carrier Rate</div><div class="rate"><strong>${money(rate)} USD</strong></div></div></div>
      <div class="section">Load Information</div><div class="grid"><div class="box"><div class="kv"><span>Pickup Date</span><b>${fmtDate(l.pickup_date)}</b><span>Pickup Time</span><b>${esc(pt)}</b><span>Origin</span><b>${esc(l.origin)}</b><span>Equipment</span><b>${esc(l.equipment||'—')}</b><span>Commodity</span><b>${esc(l.commodity||'—')}</b></div></div><div class="box"><div class="kv"><span>Drop Date</span><b>${fmtDate(l.delivery_date)}</b><span>Drop Off Time</span><b>${esc(dt)}</b><span>Destination</span><b>${esc(l.destination)}</b><span>Weight</span><b>${l.weight?`${Number(l.weight).toLocaleString('en-US')} lbs`:'—'}</b><span>Pieces</span><b>${esc(l.pieces||'—')}</b></div></div></div>
      <div class="section">Carrier Information</div><div class="grid"><div class="box"><div class="kv"><span>Carrier</span><b>${esc(l.carrier_name||'—')}</b><span>MC</span><b>${esc(l.carrier_mc||'—')}</b><span>Driver</span><b>${esc(l.driver_name||'—')}</b><span>Driver Phone</span><b>${esc(l.driver_phone||'—')}</b></div></div><div class="box"><div class="kv"><span>Truck #</span><b>${esc(l.truck_number||'—')}</b><span>Trailer #</span><b>${esc(l.trailer_number||'—')}</b></div></div></div>
      <div class="section">Stops</div><table class="stops"><thead><tr><th>Type</th><th>Scheduled Date & Time</th><th>Location</th><th>Product / Equipment</th></tr></thead><tbody><tr><td>Pick</td><td>${fmtDate(l.pickup_date)} ${esc(pt)}</td><td>${esc(l.origin)}</td><td>${esc(l.commodity||l.equipment||'—')}</td></tr><tr><td>Drop</td><td>${fmtDate(l.delivery_date)} ${esc(dt)}</td><td>${esc(l.destination)}</td><td>${esc(l.commodity||l.equipment||'—')}</td></tr></tbody></table>
      ${driver?`<div class="section">Driver Instructions</div><div class="yellow">${esc(driver)}</div>`:''}${special?`<div class="section">Special Instructions</div><div class="yellow">${esc(special)}</div>`:''}<div class="foot">Might Logistics • ${esc(l.load_number)} • Carrier Rate Confirmation</div></section>
      <section class="page"><div class="section">Special Instructions & Accessorial Guidelines</div><div class="yellow"><ul>${specials}</ul></div><div class="section">Terms & Conditions</div><ol class="terms">${terms}</ol><div class="note"><b>Important:</b> This confirmation should be read together with the applicable Might Logistics Broker-Carrier Agreement. It does not waive any requirement imposed by applicable law.</div><div class="sig"><div><b>Might Logistics Representative</b><br>Signature / Date</div><div><b>Carrier Representative</b><br>Signature / Date</div></div><div class="foot">Acceptance by signature, electronic acceptance, dispatch, pickup or transportation acknowledges the rate and applicable terms.</div></section>
      </body></html>`;
  }

  async function ensureRateConfirmation(l){
    if(!l?.id||!l.carrier_id)return;if(statusFlow.indexOf(l.status)<3||l.status==='cancelled')return;
    const html=rateConHtml(l),size=new Blob([html]).size;const {data:old,error:findError}=await db.from('load_documents').select('id').eq('load_id',l.id).eq('document_type','rate_confirmation').order('created_at',{ascending:false}).limit(1).maybeSingle();if(findError){console.error(findError);return}
    const payload={file_name:`${l.load_number}_Rate_Confirmation.html`,mime_type:'text/html',file_size:size,content:html,storage_path:null,updated_at:new Date().toISOString()};
    if(old?.id){const {error}=await db.from('load_documents').update(payload).eq('id',old.id);if(error)console.error(error)}else{const u=(await db.auth.getUser()).data.user;const {error}=await db.from('load_documents').insert({...payload,load_id:l.id,document_type:'rate_confirmation',created_by:u?.id||null});if(error)console.error(error)}
    listDocs(l.id);
  }

  async function listDocs(loadId){
    const box=$('loadDocumentsList');if(!box||!loadId)return;const {data,error}=await db.from('load_documents').select('*').eq('load_id',loadId).order('created_at',{ascending:false});if(error){console.error(error);return}
    if(!data?.length){box.innerHTML='<div class="load-doc-empty">No documents attached yet.</div>';return}
    box.innerHTML=data.map(d=>`<div class="load-doc-row"><div><strong>${esc(d.file_name)}</strong><span>${d.document_type==='rate_confirmation'?'Rate Confirmation':esc(d.document_type||'Attachment')} • ${fmtDate(d.created_at)}</span></div><div class="load-doc-actions"><button type="button" class="outline load-doc-open" data-id="${esc(d.id)}">${d.document_type==='rate_confirmation'?'View':'Open'}</button>${d.document_type!=='rate_confirmation'?`<button type="button" class="outline load-doc-delete" data-id="${esc(d.id)}">Delete</button>`:''}</div></div>`).join('');
    box.querySelectorAll('.load-doc-open').forEach(b=>b.addEventListener('click',()=>openDoc(b.dataset.id)));box.querySelectorAll('.load-doc-delete').forEach(b=>b.addEventListener('click',()=>deleteDoc(b.dataset.id)));
  }
  async function openDoc(id){const {data,error}=await db.from('load_documents').select('*').eq('id',id).maybeSingle();if(error||!data)return;if(data.content){const u=URL.createObjectURL(new Blob([data.content],{type:data.mime_type||'text/html'}));window.open(u,'_blank','noopener');setTimeout(()=>URL.revokeObjectURL(u),60000);return}if(data.storage_path){const {data:s,error:e}=await db.storage.from('load-documents').createSignedUrl(data.storage_path,3600);if(e)alert(e.message);else window.open(s.signedUrl,'_blank','noopener')}}
  async function uploadFiles(e){const input=e.target,l=await currentLoad();if(!l){input.value='';return}for(const f of Array.from(input.files||[])){if(f.size>15*1024*1024){alert(`${f.name} is larger than 15 MB.`);continue}if(!['application/pdf','image/jpeg','image/png','image/webp'].includes(f.type)){alert(`${f.name}: PDF, JPG, PNG and WEBP files are supported.`);continue}const safe=f.name.replace(/[^a-zA-Z0-9._-]/g,'_'),path=`${l.id}/${Date.now()}_${safe}`;const {error:u}=await db.storage.from('load-documents').upload(path,f,{upsert:false,contentType:f.type});if(u){alert(`Could not upload ${f.name}: ${u.message}`);continue}const {error:d}=await db.from('load_documents').insert({load_id:l.id,document_type:f.type==='application/pdf'?'pdf_attachment':'image_attachment',file_name:f.name,mime_type:f.type,file_size:f.size,storage_path:path,created_by:(await db.auth.getUser()).data.user?.id||null});if(d){await db.storage.from('load-documents').remove([path]);alert(`Could not save ${f.name}: ${d.message}`)}}input.value='';await listDocs(l.id)}
  async function deleteDoc(id){if(!confirm('Delete this attachment?'))return;const {data}=await db.from('load_documents').select('storage_path,load_id').eq('id',id).maybeSingle();if(!data)return;if(data.storage_path)await db.storage.from('load-documents').remove([data.storage_path]);await db.from('load_documents').delete().eq('id',id);listDocs(data.load_id)}
  async function hydrate(){ensureFields();const form=$('loadForm');if(!form?.dataset.id||$('loadModal')?.classList.contains('hidden'))return;const {data}=await db.from('loads').select('*').eq('id',form.dataset.id).maybeSingle();if(data){fillFields(data);listDocs(data.id)}}

  function init(){
    addStyles();ensureFields();
    document.addEventListener('submit',e=>{if(e.target?.id!=='loadForm')return;setTimeout(async()=>{const l=await currentLoad();if(!l)return;const saved=await saveOperational(l);await ensureRateConfirmation(saved||l);listDocs((saved||l).id)},900)},true);
    setInterval(()=>{ensureFields();hydrate()},1200);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.mightRateCon={ensureRateConfirmation,rateConHtml,listDocs};
})();
