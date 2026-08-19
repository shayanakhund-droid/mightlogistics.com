const CRM_URL = 'https://sowdiflodjxxqrarbisi.supabase.co';
const CRM_KEY = 'sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';
const crmDb = window.supabase.createClient(CRM_URL, CRM_KEY);

(function(){
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const statusLabel = s => (s || '').replace(/_/g,' ');
  const date = v => v ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(v+'T00:00:00')) : '—';
  const dateTime = v => v ? new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}).format(new Date(v)) : '—';
  const quoteNo = n => `ML-${String(n).padStart(5,'0')}`;
  let crmCustomers = [], crmQuotes = [], currentQuote = null;

  function showSection(section){
    const dashboard = $('dashboard'), customers = $('customers');
    if(!dashboard || !customers) return;
    dashboard.classList.toggle('hidden', section === 'customers');
    customers.classList.toggle('hidden', section !== 'customers');
    document.querySelectorAll('nav a[data-section]').forEach(a => a.classList.toggle('active', a.dataset.section === section));
    const title = $('pageTitle'); if(title) title.textContent = section === 'customers' ? 'Customer Management' : 'Operations Dashboard';
    if(section === 'customers') loadCRM();
  }

  async function loadCRM(){
    const rows = $('customerRows'); if(!rows) return;
    rows.innerHTML = '<tr><td colspan="7" class="empty">Loading customers…</td></tr>';

    // Build the CRM list from quote_requests. This keeps the portal working even when
    // the customers table has stricter RLS than the quote queue.
    const {data, error} = await crmDb.from('quote_requests').select('id,quote_number,customer_id,customer_name,company_name,email,phone,origin,destination,pickup_date,status,created_at,updated_at,notes').order('created_at',{ascending:false});
    if(error){
      console.error('Customer CRM load error:', error);
      rows.innerHTML='<tr><td colspan="7" class="empty">Could not load customers. Refresh and try again.</td></tr>';
      return;
    }

    crmQuotes = data || [];
    const map = new Map();
    crmQuotes.forEach(q => {
      const key = q.customer_id || (q.email ? `email:${String(q.email).toLowerCase()}` : `company:${String(q.company_name || '').toLowerCase()}`);
      if(!map.has(key)){
        map.set(key, {
          id: q.customer_id || key,
          company_name: q.company_name || 'Unnamed customer',
          contact_name: q.customer_name || '—',
          email: q.email || '',
          phone: q.phone || '',
          notes: q.notes || '',
          created_at: q.created_at,
          updated_at: q.updated_at || q.created_at,
          derived: !q.customer_id
        });
      }
    });
    crmCustomers = Array.from(map.values());
    renderCustomers();
  }

  function customerQuotes(c){
    return crmQuotes.filter(q => c.derived
      ? (!q.customer_id && String(q.email||'').toLowerCase() === String(c.email||'').toLowerCase())
      : String(q.customer_id) === String(c.id));
  }

  function renderCustomers(){
    const rows=$('customerRows'); if(!rows)return;
    const term=($('customerSearch')?.value||'').trim().toLowerCase();
    const filtered=crmCustomers.filter(c=>!term || [c.company_name,c.contact_name,c.email,c.phone].some(v=>String(v||'').toLowerCase().includes(term)));
    if(!filtered.length){rows.innerHTML='<tr><td colspan="7" class="empty">No customers match your search.</td></tr>';return;}
    rows.innerHTML=filtered.map(c=>{
      const related=customerQuotes(c);
      const last=related[0]?.created_at || c.updated_at;
      return `<tr><td class="customer"><strong>${esc(c.company_name)}</strong><span>Added ${date(c.created_at)}</span></td><td>${esc(c.contact_name)}</td><td>${c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:'—'}</td><td>${c.phone?`<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`:'—'}</td><td><strong>${related.length}</strong></td><td>${dateTime(last)}</td><td><button class="outline crm-customer" data-id="${esc(c.id)}">View</button></td></tr>`;
    }).join('');
    rows.querySelectorAll('.crm-customer').forEach(b=>b.addEventListener('click',()=>openCustomer(b.dataset.id)));
  }

  function openDrawer(){ const d=$('drawer'); d.classList.remove('hidden'); d.setAttribute('aria-hidden','false'); }
  function closeDrawer(){ const d=$('drawer'); d.classList.add('hidden'); d.setAttribute('aria-hidden','true'); currentQuote=null; $('quoteActions')?.classList.remove('hidden'); $('drawerKicker').textContent='QUOTE REQUEST'; }
  function detail(label,value,full=false){return `<div class="detail-block ${full?'full':''}"><span>${label}</span><div>${value||'—'}</div></div>`;}

  function openCustomer(id){
    const c=crmCustomers.find(x=>String(x.id)===String(id)); if(!c)return;
    const related=customerQuotes(c);
    $('drawerKicker').textContent='CUSTOMER PROFILE'; $('drawerTitle').textContent=c.company_name||'Customer'; $('quoteActions').classList.add('hidden');
    const history=related.length?related.map(q=>`<button class="history-row crm-history" data-id="${esc(q.id)}"><span><strong>${quoteNo(q.quote_number)}</strong><small>${esc(q.origin)} → ${esc(q.destination)}</small></span><span><b class="status ${esc(q.status)}">${esc(statusLabel(q.status))}</b><small>${date(q.pickup_date)}</small></span></button>`).join(''):'<div class="empty history-empty">No quotes yet.</div>';
    $('drawerBody').innerHTML=`<div class="customer-profile"><div class="profile-company">${esc(c.company_name)}</div><div class="profile-meta">Customer since ${date(c.created_at)}</div></div><div class="detail-grid customer-details">${detail('Primary contact',esc(c.contact_name))}${detail('Email',c.email?`<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>`:'—')}${detail('Phone',c.phone?`<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>`:'—')}${detail('Total quotes',`<strong>${related.length}</strong>`)}${detail('Internal notes',esc(c.notes),true)}</div><div class="history-heading"><div class="kicker">ACTIVITY</div><h4>Quote History</h4></div><div class="history-list">${history}</div>`;
    openDrawer();
    document.querySelectorAll('.crm-history').forEach(b=>b.addEventListener('click',()=>openQuote(b.dataset.id)));
  }

  async function openQuote(id){
    const {data,error}=await crmDb.from('quote_requests').select('*').eq('id',id).maybeSingle();
    if(error || !data)return;
    currentQuote=data;
    $('drawerKicker').textContent='QUOTE REQUEST'; $('drawerTitle').textContent=quoteNo(data.quote_number); $('quoteActions').classList.remove('hidden'); $('detailStatus').value=data.status; $('internalNotes').value=data.internal_notes||''; $('saveMessage').textContent='';
    $('drawerBody').innerHTML=`<div class="detail-grid">${detail('Company',`<strong>${esc(data.company_name)}</strong>`)}${detail('Contact',`<strong>${esc(data.customer_name)}</strong>`)}${detail('Email',data.email?`<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>`:'—')}${detail('Phone',data.phone?`<a href="tel:${esc(data.phone)}">${esc(data.phone)}</a>`:'—')}${detail('Origin',`<strong>${esc(data.origin)}</strong>`)}${detail('Destination',`<strong>${esc(data.destination)}</strong>`)}${detail('Pickup date',date(data.pickup_date))}${detail('Equipment',esc(data.equipment))}${detail('Commodity',esc(data.commodity))}${detail('Weight',data.weight_lbs?`${Number(data.weight_lbs).toLocaleString()} lbs`:'—')}${detail('Pieces',data.pieces?esc(data.pieces):'—')}${detail('Special requirements',esc(data.special_requirements),true)}${detail('Customer notes',esc(data.notes),true)}</div>`;
    openDrawer();
  }

  async function saveCRMQuote(){
    if(!currentQuote)return;
    $('saveMessage').textContent='Saving…';
    const {error}=await crmDb.from('quote_requests').update({status:$('detailStatus').value,internal_notes:$('internalNotes').value.trim(),updated_at:new Date().toISOString()}).eq('id',currentQuote.id);
    if(error){$('saveMessage').textContent='Could not save changes.';return;}
    $('saveMessage').textContent='Saved.'; await loadCRM(); setTimeout(closeDrawer,650);
  }

  function injectStyle(){
    if(document.getElementById('crmInjectedStyle'))return;
    const s=document.createElement('style'); s.id='crmInjectedStyle'; s.textContent='.panel-subtitle{margin:6px 0 0;color:#7b8794;font-size:12px}.customer-profile{padding:18px;background:linear-gradient(135deg,#f4f8fb,#fff);border:1px solid #e5ebf0;border-radius:12px;margin-bottom:22px}.profile-company{font-size:21px;font-weight:800;letter-spacing:-.03em;color:#142538}.profile-meta{font-size:11px;color:#84909d;margin-top:5px}.history-heading{margin-top:28px;border-top:1px solid #e7ebef;padding-top:22px}.history-heading h4{margin:5px 0 12px;font-size:17px}.history-list{display:flex;flex-direction:column;gap:8px}.history-row{width:100%;display:flex;justify-content:space-between;align-items:center;text-align:left;background:#fff;border:1px solid #e1e7ec;border-radius:10px;padding:13px 14px;cursor:pointer}.history-row:hover{border-color:#9bbbd6;background:#f8fbfd}.history-row span{display:flex;flex-direction:column;gap:4px}.history-row strong{font-size:12px;color:#176fbe}.history-row small{font-size:10px;color:#7f8c99}.history-row .status{align-self:flex-end}.history-empty{padding:25px}.crm-customer{white-space:nowrap}'; document.head.appendChild(s);
  }

  function init(){
    injectStyle();
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showSection(a.dataset.section);}));
    $('customerSearch')?.addEventListener('input',renderCustomers);
    $('customerRefresh')?.addEventListener('click',loadCRM);
    $('drawerClose')?.addEventListener('click',closeDrawer); $('drawerX')?.addEventListener('click',closeDrawer);
    $('saveQuote')?.addEventListener('click',()=>{if(currentQuote)saveCRMQuote();});
    if(location.hash==='#customers')showSection('customers');
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
