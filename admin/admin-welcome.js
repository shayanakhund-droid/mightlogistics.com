(function(){
  if(window.mightAdminWelcomeLoaded)return;
  window.mightAdminWelcomeLoaded=true;
  const db=window.mightDb;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
  const date=v=>{if(!v)return'—';const d=new Date(String(v).length===10?v+'T00:00:00':v);return Number.isNaN(d.getTime())?'—':new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d)};
  let approvals=[];

  function styles(){
    if($('adminWelcomeStyles'))return;
    const s=document.createElement('style');s.id='adminWelcomeStyles';s.textContent=`
      #adminWelcome{margin:0 0 18px;display:grid;gap:14px}
      .aw-hero{position:relative;overflow:hidden;border-radius:20px;padding:28px 30px;background:linear-gradient(135deg,#0d2338 0%,#176fbe 100%);color:#fff;box-shadow:0 18px 45px rgba(13,35,56,.18)}
      .aw-hero:after{content:'';position:absolute;width:240px;height:240px;right:-70px;top:-110px;border-radius:50%;background:rgba(255,255,255,.08)}
      .aw-eyebrow{font-size:10px;letter-spacing:.16em;font-weight:800;opacity:.72}.aw-hero h1{margin:6px 0 7px;font-size:31px;letter-spacing:-.035em}.aw-hero p{margin:0;max-width:690px;color:rgba(255,255,255,.8);font-size:14px}.aw-time{position:absolute;right:28px;bottom:24px;font-size:12px;color:rgba(255,255,255,.7)}
      .aw-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:14px}.aw-panel{background:#fff;border:1px solid #e2e7ec;border-radius:16px;padding:20px;box-shadow:0 3px 14px rgba(13,35,56,.035)}.aw-panel-head{display:flex;justify-content:space-between;gap:14px;align-items:start;margin-bottom:14px}.aw-panel h3{margin:3px 0 0;font-size:18px}.aw-panel p{margin:4px 0 0;color:#667382;font-size:12px}.aw-actions{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.aw-action{appearance:none;text-align:left;background:#f7f9fc;border:1px solid #e2e7ec;border-radius:12px;padding:14px;cursor:pointer;transition:.18s}.aw-action:hover{transform:translateY(-2px);background:#fff;border-color:#b8cddd;box-shadow:0 10px 22px rgba(13,35,56,.07)}.aw-action strong{display:block;color:#0d2338}.aw-action span{display:block;margin-top:5px;color:#667382;font-size:11px}.aw-notices{display:grid;gap:8px}.aw-notice{display:flex;align-items:center;gap:12px;padding:12px;border:1px solid #e5e9ef;border-radius:11px;background:#fafbfc;cursor:pointer;transition:.15s}.aw-notice:hover{background:#f5f8fc;border-color:#cbdcf3}.aw-icon{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;background:#eef5fb;color:#176fbe;font-weight:900}.aw-notice strong{display:block;font-size:13px}.aw-notice small{display:block;margin-top:3px;color:#667382;font-size:11px}.aw-badge{margin-left:auto;min-width:28px;padding:4px 8px;border-radius:999px;background:#176fbe;color:#fff;font-size:11px;font-weight:800;text-align:center}.aw-empty{padding:18px;border:1px dashed #d7dee7;border-radius:11px;color:#7b8797;text-align:center;font-size:12px}
      .aw-modal{position:fixed;inset:0;z-index:1200;background:rgba(9,20,33,.52);display:grid;place-items:center;padding:20px;opacity:0;pointer-events:none;transition:opacity .18s}.aw-modal.open{opacity:1;pointer-events:auto}.aw-modal-card{width:min(850px,100%);max-height:88vh;overflow:auto;background:#fff;border-radius:18px;box-shadow:0 30px 100px rgba(0,0,0,.24);transform:translateY(10px) scale(.985);transition:.2s}.aw-modal.open .aw-modal-card{transform:none}.aw-modal-head{display:flex;justify-content:space-between;gap:20px;padding:22px 24px;border-bottom:1px solid #e5e9ef}.aw-modal-head h2{margin:4px 0}.aw-close{border:0;background:none;font-size:27px;cursor:pointer;color:#667382}.aw-modal-body{padding:22px 24px}.aw-detail-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}.aw-detail{padding:13px;border:1px solid #e5e9ef;border-radius:11px}.aw-detail.full{grid-column:1/-1}.aw-detail span{display:block;font-size:10px;text-transform:uppercase;letter-spacing:.09em;color:#7b8797;font-weight:800}.aw-detail strong{display:block;margin-top:5px;font-size:14px;color:#172033}.aw-pricing{margin-top:16px;padding:16px;border-radius:13px;background:#f7f9fc;border:1px solid #e2e7ec}.aw-pricing-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.aw-field label{display:block;font-size:11px;color:#667382;font-weight:800;text-transform:uppercase;letter-spacing:.07em}.aw-field input,.aw-field textarea{width:100%;margin-top:6px;padding:11px 12px;border:1px solid #d8dee7;border-radius:9px;font:inherit;box-sizing:border-box}.aw-field textarea{min-height:80px;resize:vertical}.aw-margin{margin-top:10px;font-size:12px;color:#667382}.aw-margin strong{color:#176fbe}.aw-modal-actions{display:flex;justify-content:flex-end;gap:9px;padding:16px 24px;border-top:1px solid #e5e9ef}.aw-btn{border:0;border-radius:9px;padding:11px 15px;font:inherit;font-weight:800;cursor:pointer}.aw-btn.secondary{background:#fff;border:1px solid #d8dee7;color:#172033}.aw-btn.approve{background:#176fbe;color:#fff}.aw-btn.decline{background:#fff0f0;color:#a62d2d;border:1px solid #f0c9c9}
      @media(max-width:900px){.aw-grid{grid-template-columns:1fr}}@media(max-width:600px){.aw-hero{padding:23px}.aw-hero h1{font-size:26px}.aw-time{position:static;margin-top:14px}.aw-actions{grid-template-columns:1fr}.aw-detail-grid,.aw-pricing-grid{grid-template-columns:1fr}.aw-detail.full{grid-column:auto}}
    `;document.head.appendChild(s);
  }

  function greeting(){const h=new Date().getHours();if(h<12)return'Good morning';if(h<18)return'Good afternoon';return'Good evening'}
  function firstName(name,email){const n=(name||'').trim();if(n)return n.split(/\s+/)[0];return(email||'Administrator').split('@')[0]}
  function navigate(section){window.mightAdminRouter?.showSection(section,true,false)}

  async function loadApprovals(){
    if(!db)return;
    const {data,error}=await db.from('load_approval_requests').select('id,status,origin,destination,pickup_date,delivery_date,equipment,commodity,weight,pieces,special_requirements,carrier_rate,carrier_name,carrier_mc,driver_name,driver_phone,truck_number,trailer_number,internal_notes,requested_at,review_note,requested_by,load_id').eq('status','pending').order('requested_at',{ascending:true});
    if(error){console.error('Approval queue:',error);approvals=[];return}
    approvals=data||[];
    render();
  }

  async function loadNewQuotes(){
    const {count,error}=await db.from('quote_requests').select('id',{count:'exact',head:true}).eq('status','new');
    return error?0:(count||0);
  }

  function render(){
    const root=$('adminWelcome');if(!root)return;
    const name=firstName(window.mightAdminProfile?.full_name,$('userEmail')?.textContent);
    const now=new Date();
    root.innerHTML=`<section class="aw-hero"><div class="aw-eyebrow">MIGHT LOGISTICS • ADMINISTRATOR</div><h1>${greeting()}, ${esc(name)}.</h1><p>Welcome back. Your operations command center is ready. Review what needs your attention, then jump straight into the part of the business you want to manage.</p><div class="aw-time">${now.toLocaleDateString('en-US',{weekday:'long',month:'long',day:'numeric'})} • ${now.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit'})}</div></section>
      <div class="aw-grid"><section class="aw-panel"><div class="aw-panel-head"><div><div class="aw-eyebrow" style="color:#7b8797">QUICK ACCESS</div><h3>Where do you want to go?</h3><p>Open a workspace without digging through the sidebar.</p></div></div><div class="aw-actions">
        <button class="aw-action" data-go="quotes"><strong>Quote Requests</strong><span>Review, price and send customer quotes</span></button>
        <button class="aw-action" data-go="loads"><strong>Load Management</strong><span>Review shipments and operational status</span></button>
        <button class="aw-action" data-go="customers"><strong>Customers</strong><span>Manage shippers and customer history</span></button>
        <button class="aw-action" data-go="carriers"><strong>Carriers</strong><span>Manage capacity, compliance and assignments</span></button>
      </div></section>
      <section class="aw-panel"><div class="aw-panel-head"><div><div class="aw-eyebrow" style="color:#7b8797">ATTENTION</div><h3>Notifications</h3><p>Items that may need you now.</p></div></div><div id="awNotices" class="aw-notices"><div class="aw-empty">Checking live notifications…</div></div></section></div>`;
    root.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>navigate(b.dataset.go)));
    renderNotices();
  }

  async function renderNotices(){
    const el=$('awNotices');if(!el)return;
    const newQuotes=await loadNewQuotes();
    const items=[];
    if(approvals.length)items.push({icon:'✓',title:`${approvals.length} load approval${approvals.length===1?'':'s'} waiting`,sub:'Brokers are waiting for an approve / decline decision.',action:'approvals'});
    if(newQuotes)items.push({icon:'Q',title:`${newQuotes} new quote request${newQuotes===1?'':'s'}`,sub:'Customer requests are waiting for review.',action:'quotes'});
    if(!items.length){el.innerHTML='<div class="aw-empty">You are all caught up. No urgent notifications right now.</div>';return}
    el.innerHTML=items.map(i=>`<button class="aw-notice" data-notice="${i.action}"><span class="aw-icon">${i.icon}</span><span><strong>${i.title}</strong><small>${i.sub}</small></span><span class="aw-badge">→</span></button>`).join('');
    el.querySelectorAll('[data-notice]').forEach(b=>b.addEventListener('click',()=>b.dataset.notice==='approvals'?openApprovals():navigate('quotes')));
  }

  function openApprovals(){
    const modal=document.createElement('div');modal.className='aw-modal open';modal.id='awApprovalModal';
    modal.innerHTML=`<section class="aw-modal-card"><header class="aw-modal-head"><div><div class="aw-eyebrow" style="color:#7b8797">LOAD APPROVALS</div><h2>Waiting for your decision</h2><p style="margin:5px 0 0;color:#667382;font-size:12px">Review the broker's proposed carrier cost. Set the customer-facing rate here before approval.</p></div><button class="aw-close" id="awApprovalClose">×</button></header><div class="aw-modal-body"><div id="awApprovalList"></div></div></section>`;
    document.body.appendChild(modal);modal.querySelector('#awApprovalClose').addEventListener('click',()=>modal.remove());modal.addEventListener('click',e=>{if(e.target===modal)modal.remove()});
    renderApprovalList(modal.querySelector('#awApprovalList'));
  }

  function renderApprovalList(container){
    if(!approvals.length){container.innerHTML='<div class="aw-empty">No load approvals are waiting.</div>';return}
    container.innerHTML=approvals.map((r,i)=>`<button class="aw-notice" style="width:100%;text-align:left" data-approval="${esc(r.id)}"><span class="aw-icon">${i+1}</span><span><strong>${esc(r.origin)} → ${esc(r.destination)}</strong><small>${esc(r.carrier_name||'Carrier not specified')} • Carrier rate ${money(r.carrier_rate)} • Requested ${date(r.requested_at)}</small></span><span class="aw-badge">Review</span></button>`).join('');
    container.querySelectorAll('[data-approval]').forEach(b=>b.addEventListener('click',()=>openApprovalDetail(b.dataset.approval)));
  }

  function openApprovalDetail(id){
    const r=approvals.find(x=>x.id===id);if(!r)return;
    const modal=document.getElementById('awApprovalModal');
    const body=modal?.querySelector('.aw-modal-body');if(!body)return;
    body.innerHTML=`<div class="aw-detail-grid">
      <div class="aw-detail"><span>Origin</span><strong>${esc(r.origin)}</strong></div><div class="aw-detail"><span>Destination</span><strong>${esc(r.destination)}</strong></div>
      <div class="aw-detail"><span>Pickup</span><strong>${date(r.pickup_date)}</strong></div><div class="aw-detail"><span>Delivery</span><strong>${date(r.delivery_date)}</strong></div>
      <div class="aw-detail"><span>Equipment</span><strong>${esc(r.equipment||'—')}</strong></div><div class="aw-detail"><span>Commodity</span><strong>${esc(r.commodity||'—')}</strong></div>
      <div class="aw-detail"><span>Weight</span><strong>${r.weight?`${Number(r.weight).toLocaleString('en-US')} lbs`:'—'}</strong></div><div class="aw-detail"><span>Pieces</span><strong>${r.pieces||'—'}</strong></div>
      <div class="aw-detail"><span>Carrier</span><strong>${esc(r.carrier_name||'—')}</strong></div><div class="aw-detail"><span>MC</span><strong>${esc(r.carrier_mc||'—')}</strong></div>
      <div class="aw-detail"><span>Driver</span><strong>${esc(r.driver_name||'—')}</strong></div><div class="aw-detail"><span>Driver Phone</span><strong>${esc(r.driver_phone||'—')}</strong></div>
      <div class="aw-detail"><span>Truck</span><strong>${esc(r.truck_number||'—')}</strong></div><div class="aw-detail"><span>Trailer</span><strong>${esc(r.trailer_number||'—')}</strong></div>
      <div class="aw-detail full"><span>Special Requirements</span><strong>${esc(r.special_requirements||'—')}</strong></div>
      <div class="aw-detail full"><span>Broker Internal Notes</span><strong>${esc(r.internal_notes||'—')}</strong></div>
    </div>
    <div class="aw-pricing"><div class="aw-pricing-grid"><div class="aw-field"><label>Carrier Rate</label><input value="${Number(r.carrier_rate||0).toFixed(2)}" disabled></div><div class="aw-field"><label>Customer Rate *</label><input id="awCustomerRate" type="number" min="0" step="0.01" placeholder="0.00"></div></div><div class="aw-margin">Projected gross margin: <strong id="awMargin">—</strong></div><div class="aw-field" style="margin-top:12px"><label>Review note</label><textarea id="awReviewNote" placeholder="Optional note to the broker"></textarea></div></div>`;
    const customer=modal.querySelector('#awCustomerRate');const margin=modal.querySelector('#awMargin');
    const update=()=>{const c=Number(customer.value||0),carrier=Number(r.carrier_rate||0);margin.textContent=money(c-carrier)};customer.addEventListener('input',update);
    const actions=document.createElement('div');actions.className='aw-modal-actions';actions.innerHTML='<button class="aw-btn secondary" id="awBack">Back</button><button class="aw-btn decline" id="awDecline">Decline</button><button class="aw-btn approve" id="awApprove">Approve Load</button>';modal.querySelector('.aw-modal-card').appendChild(actions);
    modal.querySelector('#awBack').addEventListener('click',()=>{actions.remove();renderApprovalList(body)});
    modal.querySelector('#awDecline').addEventListener('click',()=>review(id,'declined',null,modal.querySelector('#awReviewNote').value,actions));
    modal.querySelector('#awApprove').addEventListener('click',()=>review(id,'approved',Number(customer.value||0),modal.querySelector('#awReviewNote').value,actions));
  }

  async function review(id,decision,customerRate,note,actions){
    if(decision==='approved' && (!Number.isFinite(customerRate)||customerRate<0)){alert('Enter a valid customer rate before approving.');return}
    if(decision==='declined' && !String(note||'').trim()){alert('Add a short reason before declining this load.');return}
    actions.querySelectorAll('button').forEach(b=>b.disabled=true);
    const {error}=await db.rpc('admin_review_load_approval',{p_request_id:id,p_decision:decision,p_customer_rate:customerRate,p_note:String(note||'').trim()||null});
    if(error){alert(error.message);actions.querySelectorAll('button').forEach(b=>b.disabled=false);return}
    const modal=$('awApprovalModal');modal?.remove();await loadApprovals();render();if(typeof window.refreshMightDashboard==='function')window.refreshMightDashboard(true);openApprovals();
  }

  async function init(){
    if(!db||!$('dashboard'))return;
    styles();
    let root=$('adminWelcome');
    if(!root){root=document.createElement('section');root.id='adminWelcome';$('dashboard').insertBefore(root,$('dashboard').firstChild)}
    const {data:{user}}=await db.auth.getUser();
    if(!user)return;
    const {data:p}=await db.from('employee_profiles').select('full_name,email,role,access_level,is_active').eq('id',user.id).maybeSingle();
    if(!p||p.role!=='admin'||p.access_level!=='administrator'||p.is_active===false)return;
    window.mightAdminProfile=p;
    await loadApprovals();
    render();
    window.mightAdminWelcomeRefresh=async()=>{await loadApprovals();render()};
    setInterval(()=>window.mightAdminWelcomeRefresh?.(),60000);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();