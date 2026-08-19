(function(){
  const db=window.mightDb;if(!db)return;
  const $=id=>document.getElementById(id);
  let ratings=[],loads=[];
  const stars=n=>Array.from({length:5},(_,i)=>i<n?'★':'☆').join('');
  const avgText=v=>v==null?'No ratings yet':`${Number(v).toFixed(1)} / 5`;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate=v=>{if(!v)return'—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
  const statusLabel=s=>String(s||'').replace(/_/g,' ');
  const deliveredStatuses=new Set(['delivered','invoiced','paid']);
  const operationalStatuses=new Set(['booked','carrier_assigned','dispatched','picked_up','in_transit','delivered','invoiced','paid']);

  async function loadRatings(){
    const {data,error}=await db.from('carrier_rating_summary').select('*');
    if(!error)ratings=data||[];
    renderCarrierRatings();
  }

  async function loadCompletedLoads(){
    const {data,error}=await db.from('loads').select('id,load_number,status,carrier_id,carrier_name');
    if(!error)loads=data||[];
    addRateButtons();
  }

  function summaryFor(id){return ratings.find(r=>String(r.carrier_id)===String(id));}

  function renderCarrierRatings(){
    const rows=$('carrierRows');if(!rows)return;
    rows.querySelectorAll('tr').forEach(row=>{
      const btn=row.querySelector('.carrier-view');if(!btn)return;
      const s=summaryFor(btn.dataset.id);
      const company=row.querySelector('.customer');
      if(!company)return;
      const existing=company.querySelector('.carrier-rating');
      if(!s){if(existing)existing.remove();return;}
      if(!existing){
        const el=document.createElement('span');el.className='carrier-rating';
        el.title=`${s.rating_count} completed load rating${s.rating_count===1?'':'s'}`;
        el.innerHTML=`<strong>${stars(Math.round(Number(s.average_rating)))}</strong> ${avgText(s.average_rating)} <small>(${s.rating_count})</small>`;
        company.appendChild(el);
      }else existing.innerHTML=`<strong>${stars(Math.round(Number(s.average_rating)))}</strong> ${avgText(s.average_rating)} <small>(${s.rating_count})</small>`;
    });
  }

  function injectStyle(){
    if($('carrierRatingStyle'))return;
    const s=document.createElement('style');s.id='carrierRatingStyle';
    s.textContent=`
      .carrier-rating{display:block;margin-top:5px;font-size:12px}.carrier-rating strong{letter-spacing:1px}.carrier-rating small{opacity:.65}
      .rating-modal{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center}.rating-modal.hidden{display:none}.rating-backdrop{position:absolute;inset:0;background:rgba(2,12,24,.55)}.rating-card{position:relative;width:min(520px,calc(100vw - 32px));background:#fff;border-radius:18px;padding:24px;box-shadow:0 25px 80px rgba(0,0,0,.25)}.rating-card h3{margin:0 0 4px}.rating-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:18px 0}.rating-field label{display:block;font-weight:600;margin-bottom:7px}.rating-stars{display:flex;gap:4px}.rating-stars button{border:0;background:none;font-size:30px;cursor:pointer;padding:0}.rating-card textarea{width:100%;min-height:90px;box-sizing:border-box}.rating-actions{display:flex;justify-content:flex-end;gap:10px;margin-top:18px}
      .carrier-profile-modal{position:fixed;inset:0;z-index:11000;display:flex;align-items:center;justify-content:center;padding:20px;box-sizing:border-box}.carrier-profile-modal.hidden{display:none}.carrier-profile-backdrop{position:absolute;inset:0;background:rgba(2,12,24,.62);backdrop-filter:blur(2px)}.carrier-profile-card{position:relative;width:min(900px,calc(100vw - 30px));max-height:min(88vh,900px);overflow:auto;background:#fff;border-radius:20px;box-shadow:0 30px 100px rgba(0,0,0,.3)}
      .carrier-profile-head{display:flex;justify-content:space-between;gap:20px;padding:26px 28px 20px;border-bottom:1px solid #e8edf3}.carrier-profile-kicker{font-size:11px;letter-spacing:2px;color:#2776d2;font-weight:700;margin-bottom:6px}.carrier-profile-head h2{margin:0 0 6px;font-size:25px}.carrier-profile-meta{color:#637083;font-size:13px}.carrier-profile-close{border:0;background:#eef2f6;width:38px;height:38px;border-radius:50%;font-size:24px;cursor:pointer}.carrier-profile-body{padding:24px 28px 30px}
      .carrier-profile-rating{display:flex;align-items:center;justify-content:space-between;gap:20px;padding:18px 20px;background:#f6f9fc;border:1px solid #e6edf5;border-radius:14px;margin-bottom:20px}.carrier-profile-rating-stars{font-size:25px;letter-spacing:2px}.carrier-profile-rating-score{font-size:19px;font-weight:800}.carrier-profile-rating-count{font-size:12px;color:#687789}
      .carrier-profile-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:20px}.carrier-profile-stat{padding:16px;border:1px solid #e6edf5;border-radius:13px;background:#fff}.carrier-profile-stat span{display:block;font-size:10px;letter-spacing:1.5px;color:#718096;text-transform:uppercase;margin-bottom:7px}.carrier-profile-stat strong{font-size:23px}.carrier-profile-stat small{display:block;margin-top:5px;color:#718096;font-size:11px}
      .carrier-profile-grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.carrier-profile-section{border:1px solid #e6edf5;border-radius:14px;padding:18px}.carrier-profile-section h4{margin:0 0 14px;font-size:14px}.carrier-profile-details{display:grid;grid-template-columns:1fr 1fr;gap:12px}.carrier-profile-detail span{display:block;color:#7b8794;font-size:10px;text-transform:uppercase;letter-spacing:1px;margin-bottom:4px}.carrier-profile-detail strong{font-size:13px;word-break:break-word}.carrier-profile-bar{height:8px;background:#edf1f5;border-radius:99px;overflow:hidden;margin:8px 0 4px}.carrier-profile-bar i{display:block;height:100%;background:#2476d0;border-radius:99px}.carrier-profile-warning{margin-top:10px;padding:10px 12px;border-radius:10px;background:#fff5e6;color:#8a5a00;font-size:12px}.carrier-profile-danger{margin-top:10px;padding:10px 12px;border-radius:10px;background:#fff0f0;color:#a52a2a;font-size:12px}.carrier-profile-empty{color:#718096;font-size:13px;padding:8px 0}
      @media(max-width:720px){.carrier-profile-stats{grid-template-columns:1fr 1fr}.carrier-profile-grid,.carrier-profile-details{grid-template-columns:1fr}.carrier-profile-head,.carrier-profile-body{padding-left:18px;padding-right:18px}}
    `;
    document.head.appendChild(s);
  }

  function ensureModal(){
    if($('carrierRatingModal'))return;
    const m=document.createElement('div');m.id='carrierRatingModal';m.className='rating-modal hidden';
    m.innerHTML='<div class="rating-backdrop"></div><section class="rating-card"><div class="kicker">CARRIER PERFORMANCE</div><h3 id="ratingCarrierName">Rate Carrier</h3><p class="muted">Rate this carrier after the load is completed. Your rating will be visible to the entire Might Logistics team.</p><div class="rating-grid"><div class="rating-field"><label>Overall</label><div id="ratingOverall" class="rating-stars"></div></div><div class="rating-field"><label>Communication</label><div id="ratingCommunication" class="rating-stars"></div></div><div class="rating-field"><label>Performance</label><div id="ratingPerformance" class="rating-stars"></div></div></div><label>Comments<textarea id="ratingComment" placeholder="How did the load go? Communication, reliability, issues, etc."></textarea></label><div id="ratingMessage" class="save-message"></div><div class="rating-actions"><button id="ratingCancel" class="outline">Cancel</button><button id="ratingSave" class="primary">Save Rating</button></div></section>';
    document.body.appendChild(m);
    ['Overall','Communication','Performance'].forEach(kind=>{
      const wrap=$(`rating${kind}`);for(let i=1;i<=5;i++){
        const b=document.createElement('button');b.type='button';b.textContent='☆';b.dataset.value=i;
        b.addEventListener('click',()=>{wrap.querySelectorAll('button').forEach(x=>x.textContent=Number(x.dataset.value)<=i?'★':'☆');wrap.dataset.value=i});wrap.appendChild(b);
      }
    });
    $('ratingCancel').onclick=closeRating;$('ratingSave').onclick=saveRating;
  }

  function ensureProfileModal(){
    if($('carrierProfileModal'))return;
    const m=document.createElement('div');m.id='carrierProfileModal';m.className='carrier-profile-modal hidden';
    m.innerHTML='<div class="carrier-profile-backdrop" id="carrierProfileBackdrop"></div><section class="carrier-profile-card"><header class="carrier-profile-head"><div><div class="carrier-profile-kicker">CARRIER PROFILE</div><h2 id="carrierProfileName">Carrier</h2><div id="carrierProfileMeta" class="carrier-profile-meta"></div></div><button class="carrier-profile-close" id="carrierProfileClose" aria-label="Close">×</button></header><div id="carrierProfileBody" class="carrier-profile-body"><div class="carrier-profile-empty">Loading carrier profile…</div></div></section>';
    document.body.appendChild(m);$('carrierProfileClose').onclick=closeProfile;$('carrierProfileBackdrop').onclick=closeProfile;
  }

  function closeProfile(){$('carrierProfileModal')?.classList.add('hidden')}
  function closeRating(){$('carrierRatingModal')?.classList.add('hidden')}
  function pct(n,d){return d?Math.round((n/d)*100):0}
  function statCard(label,value,sub=''){return `<div class="carrier-profile-stat"><span>${esc(label)}</span><strong>${esc(value)}</strong>${sub?`<small>${esc(sub)}</small>`:''}</div>`}

  async function openProfile(id){
    ensureProfileModal();const modal=$('carrierProfileModal'),body=$('carrierProfileBody');modal.classList.remove('hidden');body.innerHTML='<div class="carrier-profile-empty">Loading carrier profile…</div>';
    const [carrierResult,loadResult,ratingResult]=await Promise.all([
      db.from('carriers').select('*').eq('id',id).maybeSingle(),
      db.from('loads').select('id,load_number,status,origin,destination,pickup_date,delivery_date,carrier_rate,customer_rate,created_at').eq('carrier_id',id).order('created_at',{ascending:false}),
      db.from('carrier_rating_summary').select('*').eq('carrier_id',id).maybeSingle()
    ]);
    if(carrierResult.error){body.innerHTML=`<div class="carrier-profile-danger">Could not load carrier profile: ${esc(carrierResult.error.message)}</div>`;return}
    const c=carrierResult.data||{},carrierLoads=loadResult.error?[]:(loadResult.data||[]),summary=ratingResult.error?null:ratingResult.data;
    const total=carrierLoads.length,delivered=carrierLoads.filter(l=>deliveredStatuses.has(l.status)).length,cancelled=carrierLoads.filter(l=>l.status==='cancelled').length;
    const active=carrierLoads.filter(l=>operationalStatuses.has(l.status)&&!deliveredStatuses.has(l.status)).length,outcomes=delivered+cancelled;
    const deliveryRate=pct(delivered,outcomes),falloutRate=pct(cancelled,outcomes),rating=summary?.average_rating,ratingCount=Number(summary?.rating_count||0);
    const avgComm=summary?.average_communication,avgPerf=summary?.average_performance;
    const expDate=c.insurance_expiration?new Date(`${c.insurance_expiration}T00:00:00`):null,insurance=c.insurance_status==='expired'||(expDate&&!Number.isNaN(expDate.getTime())&&expDate<new Date(new Date().toDateString()));
    const location=[c.city,c.state,c.zip_code].filter(Boolean).join(', '),recent=carrierLoads.slice(0,5);
    $('carrierProfileName').textContent=c.legal_name||c.dba_name||'Carrier';$('carrierProfileMeta').textContent=`${c.mc_number?'MC '+c.mc_number+' · ':''}${c.dot_number?'USDOT '+c.dot_number+' · ':''}${location||'Location not available'}`;
    body.innerHTML=`
      <div class="carrier-profile-rating"><div><div class="carrier-profile-kicker">TEAM RATING</div><div class="carrier-profile-rating-stars">${stars(Math.round(Number(rating||0)))}</div></div><div style="text-align:right"><div class="carrier-profile-rating-score">${rating!=null?`${Number(rating).toFixed(1)} / 5`:'No ratings yet'}</div><div class="carrier-profile-rating-count">${ratingCount} completed load rating${ratingCount===1?'':'s'}</div></div></div>
      <div class="carrier-profile-stats">${statCard('Loads Booked',total,'Assigned to this carrier')}${statCard('Delivered',delivered,`${deliveryRate}% of completed outcomes`)}${statCard('Cancelled / Fallout',cancelled,`${falloutRate}% of completed outcomes`)}${statCard('Active',active,'Currently in progress')}</div>
      <div class="carrier-profile-grid">
        <section class="carrier-profile-section"><h4>Performance</h4><div class="carrier-profile-detail"><span>Delivery rate</span><strong>${deliveryRate}%</strong><div class="carrier-profile-bar"><i style="width:${deliveryRate}%"></i></div></div><div class="carrier-profile-detail"><span>Fallout rate</span><strong>${falloutRate}%</strong><div class="carrier-profile-bar"><i style="width:${falloutRate}%"></i></div></div>${falloutRate>=20?'<div class="carrier-profile-danger"><strong>High fallout rate.</strong> Consider reviewing this carrier before assigning additional loads.</div>':''}${falloutRate>=10&&falloutRate<20?'<div class="carrier-profile-warning"><strong>Watchlist:</strong> fallout is above 10%.</div>':''}<div class="carrier-profile-details" style="margin-top:16px"><div class="carrier-profile-detail"><span>Communication</span><strong>${avgComm!=null?`${Number(avgComm).toFixed(1)} / 5`:'No ratings'}</strong></div><div class="carrier-profile-detail"><span>Performance</span><strong>${avgPerf!=null?`${Number(avgPerf).toFixed(1)} / 5`:'No ratings'}</strong></div></div></section>
        <section class="carrier-profile-section"><h4>Carrier Information</h4><div class="carrier-profile-details"><div class="carrier-profile-detail"><span>MC Number</span><strong>${esc(c.mc_number||'—')}</strong></div><div class="carrier-profile-detail"><span>USDOT</span><strong>${esc(c.dot_number||'—')}</strong></div><div class="carrier-profile-detail"><span>Contact</span><strong>${esc(c.contact_name||'—')}</strong></div><div class="carrier-profile-detail"><span>Phone</span><strong>${esc(c.phone||'—')}</strong></div><div class="carrier-profile-detail"><span>Email</span><strong>${esc(c.email||'—')}</strong></div><div class="carrier-profile-detail"><span>Location</span><strong>${esc(location||'—')}</strong></div><div class="carrier-profile-detail"><span>Authority</span><strong>${esc(c.authority_status||'—')}</strong></div><div class="carrier-profile-detail"><span>Insurance</span><strong>${insurance?'Expired':(c.insurance_expiration||c.insurance_status||'Unknown')}</strong></div></div>${insurance?'<div class="carrier-profile-danger"><strong>Insurance expired.</strong> This carrier should not be tendered loads.</div>':''}</section>
      </div>
      <section class="carrier-profile-section" style="margin-top:18px"><h4>Recent Loads</h4>${recent.length?`<div style="overflow:auto"><table style="width:100%;border-collapse:collapse;font-size:12px"><thead><tr><th style="text-align:left;padding:8px;border-bottom:1px solid #e8edf3">Load</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e8edf3">Lane</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e8edf3">Status</th><th style="text-align:left;padding:8px;border-bottom:1px solid #e8edf3">Pickup</th></tr></thead><tbody>${recent.map(l=>`<tr><td style="padding:8px;border-bottom:1px solid #eef2f6"><strong>${esc(l.load_number||'—')}</strong></td><td style="padding:8px;border-bottom:1px solid #eef2f6">${esc(l.origin||'—')} → ${esc(l.destination||'—')}</td><td style="padding:8px;border-bottom:1px solid #eef2f6;text-transform:capitalize">${esc(statusLabel(l.status))}</td><td style="padding:8px;border-bottom:1px solid #eef2f6">${esc(fmtDate(l.pickup_date))}</td></tr>`).join('')}</tbody></table></div>`:'<div class="carrier-profile-empty">No loads have been assigned to this carrier yet.</div>'}</section>`;
  }

  function interceptCarrierViews(){
    const rows=$('carrierRows');if(!rows||rows.dataset.profileIntercept)return;rows.dataset.profileIntercept='1';
    rows.addEventListener('click',e=>{const btn=e.target.closest?.('.carrier-view');if(!btn)return;e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openProfile(btn.dataset.id)},true);
  }

  function ensureCarrierProfileHook(){interceptCarrierViews();renderCarrierRatings()}

  function addRateButtons(){
    const rows=$('loadRows');if(!rows)return;
    rows.querySelectorAll('.load-view').forEach(btn=>{
      const row=btn.closest('tr');if(!row||row.querySelector('.rate-carrier'))return;
      const loadNo=row.querySelector('td strong')?.textContent,load=loads.find(x=>x.load_number===loadNo);
      if(!load||!deliveredStatuses.has(load.status)||!load.carrier_id)return;
      const b=document.createElement('button');b.className='outline rate-carrier';b.textContent='Rate';b.addEventListener('click',()=>openRating(load));row.lastElementChild.appendChild(b);
    });
  }

  let active={carrierId:null,loadId:null};
  function openRating(load){
    if(!load?.carrier_id){alert('This load does not have a saved carrier assigned.');return}
    ensureModal();active={carrierId:load.carrier_id,loadId:load.id};$('ratingCarrierName').textContent=load.carrier_name||'Carrier';
    ['Overall','Communication','Performance'].forEach(k=>{$(`rating${k}`).dataset.value='0';$(`rating${k}`).querySelectorAll('button').forEach(b=>b.textContent='☆')});$('ratingComment').value='';$('ratingMessage').textContent='';$('carrierRatingModal').classList.remove('hidden');
  }

  async function saveRating(){
    const overall=Number($('ratingOverall').dataset.value||0),communication=Number($('ratingCommunication').dataset.value||0),performance=Number($('ratingPerformance').dataset.value||0);
    if(!overall||!communication||!performance){$('ratingMessage').textContent='Please select a rating for all three categories.';return}
    $('ratingSave').disabled=true;$('ratingMessage').textContent='Saving rating…';const {data:user}=await db.auth.getUser();
    const {error}=await db.from('carrier_ratings').upsert({carrier_id:active.carrierId,load_id:active.loadId,reviewer_id:user?.user?.id||null,overall_rating:overall,communication_rating:communication,performance_rating:performance,comment:$('ratingComment').value.trim()||null,updated_at:new Date().toISOString()},{onConflict:'carrier_id,load_id'});
    $('ratingSave').disabled=false;if(error){$('ratingMessage').textContent=error.message;return}$('ratingMessage').textContent='Rating saved.';await loadRatings();setTimeout(closeRating,500);
  }

  function init(){injectStyle();ensureModal();ensureProfileModal();loadRatings();loadCompletedLoads();ensureCarrierProfileHook();setInterval(()=>{loadRatings();loadCompletedLoads();ensureCarrierProfileHook()},5000)}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.mightCarrierRatings={loadRatings,openRating,openProfile};
})();