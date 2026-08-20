(function(){
  if(window.mightBusinessSwitcherLoaded)return; window.mightBusinessSwitcherLoaded=true;
  const db=window.mightDb;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'});
  function inject(){
    const nav=document.querySelector('aside.sidebar nav'); if(!nav)return;
    if(document.getElementById('businessSwitcher'))return;
    const wrap=document.createElement('div'); wrap.id='businessSwitcher'; wrap.innerHTML=`<div class="biz-switch-label">BUSINESS</div><div class="biz-switch"><button data-business="brokerage" class="active">Brokerage</button><button data-business="dispatch">Dispatch</button></div><div id="dispatchSubnav" class="dispatch-subnav hidden"><div class="biz-switch-label">DISPATCH OPERATIONS</div><a href="#dispatch" data-dview="overview" class="active">Overview</a><a href="#dispatch" data-dview="clients">Clients</a><a href="#dispatch" data-dview="fleet">Fleet</a><a href="#dispatch" data-dview="loads">Accepted Loads</a><a href="#dispatch" data-dview="team">Dispatchers</a><a href="#dispatch" data-dview="payments">Payments</a></div>`;
    nav.parentNode.insertBefore(wrap,nav);
    const style=document.createElement('style');style.textContent=`#businessSwitcher{margin:0 14px 18px}.biz-switch-label{font-size:9px;letter-spacing:.16em;font-weight:800;color:#7890a6;margin:0 10px 8px}.biz-switch{display:grid;grid-template-columns:1fr 1fr;gap:5px;background:#071a2a;padding:4px;border:1px solid #17334a;border-radius:10px}.biz-switch button{border:0;background:transparent;color:#a9bdd0;border-radius:7px;padding:9px 6px;font:700 11px/1 inherit;cursor:pointer}.biz-switch button.active{background:#176fbe;color:#fff;box-shadow:0 4px 12px #176fbe33}.dispatch-subnav{margin:16px 2px 0;padding:0 7px 0 10px;border-left:1px solid #1d405b}.dispatch-subnav a{display:block!important;margin:2px 0;padding:8px 9px!important;border-radius:7px;color:#9eb4c8!important;font-size:11px!important}.dispatch-subnav a.active{background:#102f48!important;color:#fff!important}.biz-dispatch-mode .portal-label{display:none}.biz-dispatch-mode aside.sidebar nav>a{display:none!important}.biz-dispatch-mode aside.sidebar nav>a[href="#dashboard"]{display:none!important}.biz-dispatch-mode #pageTitle{transition:.2s}.biz-dispatch-mode .dispatch-subnav{display:block}.biz-dispatch-mode #dispatch{animation:bizIn .25s ease}@keyframes bizIn{from{opacity:.2;transform:translateY(4px)}to{opacity:1;transform:none}}`;
    document.head.appendChild(style);
    wrap.querySelectorAll('.biz-switch button').forEach(b=>b.addEventListener('click',()=>switchBusiness(b.dataset.business)));
    wrap.querySelectorAll('.dispatch-subnav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showDispatchView(a.dataset.dview)}));
  }
  function switchBusiness(mode){
    const wrap=document.getElementById('businessSwitcher'); if(!wrap)return;
    wrap.querySelectorAll('.biz-switch button').forEach(b=>b.classList.toggle('active',b.dataset.business===mode));
    document.body.classList.toggle('biz-dispatch-mode',mode==='dispatch');
    const sub=document.getElementById('dispatchSubnav'); if(sub)sub.classList.toggle('hidden',mode!=='dispatch');
    if(mode==='dispatch'){window.mightAdminRouter?.showSection('dispatch',false);setTimeout(()=>showDispatchView('overview'),40)}
    else {window.mightAdminRouter?.showSection('dashboard',false);document.querySelectorAll('#dispatchSubnav a').forEach(a=>a.classList.toggle('active',a.dataset.dview==='overview'))}
  }
  function showDispatchView(view){
    document.querySelectorAll('#dispatchSubnav a').forEach(a=>a.classList.toggle('active',a.dataset.dview===view));
    const section=document.getElementById('dispatch'); if(!section)return;
    section.querySelector('.dispatch-head')?.classList.toggle('hidden',view!=='overview');
    const kpis=section.querySelector('.dispatch-kpis'); if(kpis)kpis.classList.toggle('hidden',view!=='overview');
    const grid=section.querySelector('.dispatch-grid'); if(grid)grid.classList.toggle('hidden',view!=='overview');
    const panels=[...section.querySelectorAll('.d-panel.d-full')];
    const clients=panels[0], loads=panels[1];
    if(clients)clients.classList.toggle('hidden',!(view==='overview'||view==='clients'));
    if(loads)loads.classList.toggle('hidden',!(view==='overview'||view==='loads'));
    if(view==='fleet')renderFleet(section);
    else if(view==='team'){section.querySelector('.dispatch-grid')?.classList.remove('hidden');if(grid){grid.querySelector('.d-panel:first-child')?.classList.add('hidden');grid.querySelector('.d-panel:last-child')?.classList.remove('hidden')}}
    else if(view==='payments')renderPayments(section);
    else {section.querySelector('.dispatch-grid .d-panel:first-child')?.classList.remove('hidden');section.querySelector('.dispatch-grid .d-panel:last-child')?.classList.remove('hidden')}
    const title={overview:'Dispatch Overview',clients:'Dispatch Clients',fleet:'Client Fleet',loads:'Accepted Dispatch Loads',team:'Dispatchers',payments:'Dispatch Payments'}[view]||'Dispatch Operations'; const pt=document.getElementById('pageTitle');if(pt)pt.textContent=title;
    if(view==='fleet')loadFleet(section); if(view==='payments')loadPayments(section);
  }
  async function loadFleet(section){
    const {data}=await db.from('dispatch_trucks').select('*,dispatch_clients(company_name),dispatch_client_dispatchers(dispatcher_id)').order('created_at',{ascending:false});
    const rows=(data||[]).map(t=>`<tr><td><strong>${esc(t.unit_number||'—')}</strong></td><td>${esc(t.dispatch_clients?.company_name||'—')}</td><td>${esc(t.equipment_type||'—')}</td><td>${esc(t.driver_name||'—')}</td><td>${esc(t.home_location||'—')}</td><td>${t.status==='active'?'<span class="d-status paid">Active</span>':'<span class="d-status">'+esc(t.status||'inactive')+'</span>'}</td></tr>`).join('');
    section.querySelector('#bizFleetRows').innerHTML=rows||'<tr><td colspan="6" class="empty">No trucks have been added yet.</td></tr>';
  }
  function renderFleet(section){
    let panel=section.querySelector('#bizFleetPanel'); if(!panel){panel=document.createElement('section');panel.id='bizFleetPanel';panel.className='d-panel d-full';panel.innerHTML=`<div class="d-panel-head"><div><div class="kicker">FLEET MANAGEMENT</div><h3>Client Fleet</h3><span class="d-muted">Every truck across dispatch clients.</span></div><button class="primary" id="bizAddTruck">+ Add Truck</button></div><div class="d-table-wrap"><table class="d-table"><thead><tr><th>Unit</th><th>Client</th><th>Equipment</th><th>Driver</th><th>Home Location</th><th>Status</th></tr></thead><tbody id="bizFleetRows"></tbody></table></div>`;section.querySelector('.dispatch-wrap').appendChild(panel);panel.querySelector('#bizAddTruck').onclick=()=>alert('Truck creation is the next fleet workflow step.');}
    section.querySelector('#bizFleetPanel').classList.remove('hidden');
    [...section.querySelectorAll('.d-panel.d-full')].forEach(p=>{if(p.id!=='bizFleetPanel')p.classList.add('hidden')});
  }
  async function loadPayments(section){
    let panel=section.querySelector('#bizPaymentsPanel'); if(!panel){panel=document.createElement('section');panel.id='bizPaymentsPanel';panel.className='d-panel d-full';panel.innerHTML=`<div class="d-panel-head"><div><div class="kicker">DISPATCH BILLING</div><h3>Dispatch Payments</h3><span class="d-muted">Fees collected from dispatch carriers.</span></div></div><div class="d-table-wrap"><table class="d-table"><thead><tr><th>Load</th><th>Dispatch Fee</th><th>Amount Paid</th><th>Balance</th><th>Status</th><th>Paid Date</th></tr></thead><tbody id="bizPaymentRows"></tbody></table></div>`;section.querySelector('.dispatch-wrap').appendChild(panel);}
    [...section.querySelectorAll('.d-panel.d-full')].forEach(p=>{if(p.id!=='bizPaymentsPanel')p.classList.add('hidden')});
    const {data}=await db.from('dispatch_payments').select('*').order('created_at',{ascending:false}); const rows=(data||[]).map(p=>{const fee=Number(p.dispatch_fee||0),paid=Number(p.amount_paid||0);return `<tr><td>${esc(p.load_id||'—')}</td><td>${money(fee)}</td><td>${money(paid)}</td><td>${money(Math.max(0,fee-paid))}</td><td><span class="d-status ${p.status==='paid'?'paid':''}">${esc(p.status||'pending')}</span></td><td>${esc(p.paid_at?new Date(p.paid_at).toLocaleDateString():'—')}</td></tr>`}).join('');section.querySelector('#bizPaymentRows').innerHTML=rows||'<tr><td colspan="6" class="empty">No dispatch payments recorded.</td></tr>';
  }
  function init(){inject();}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
  window.mightBusinessSwitcher={switchBusiness,showDispatchView};
})();
