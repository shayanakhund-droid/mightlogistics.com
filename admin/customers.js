const CRM_URL = 'https://sowdiflodjxxqrarbisi.supabase.co';
const CRM_KEY = 'sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';
const crmDb = window.mightDb || window.supabase.createClient(CRM_URL, CRM_KEY);

(function () {
  const $ = id => document.getElementById(id);
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const fmtDate = v => {
    if (!v) return '—';
    const s = String(v);
    const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T00:00:00` : s);
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric' }).format(d);
  };
  const fmtDateTime = v => {
    if (!v) return '—';
    const d = new Date(String(v));
    if (Number.isNaN(d.getTime())) return '—';
    return new Intl.DateTimeFormat('en-US', { month:'short', day:'numeric', year:'numeric', hour:'numeric', minute:'2-digit' }).format(d);
  };
  const quoteNo = n => `ML-${String(n).padStart(5, '0')}`;
  const statusLabel = s => String(s || '').replace(/_/g, ' ');
  let customers = [], quotes = [], currentQuote = null;

  function showSection(section) {
    const dashboard = $('dashboard'), customerView = $('customers');
    if (!dashboard || !customerView) return;
    dashboard.classList.toggle('hidden', section === 'customers');
    customerView.classList.toggle('hidden', section !== 'customers');
    document.querySelectorAll('nav a[data-section]').forEach(a => a.classList.toggle('active', a.dataset.section === section));
    if ($('pageTitle')) $('pageTitle').textContent = section === 'customers' ? 'Customer Management' : 'Operations Dashboard';
    if (section === 'customers') loadCRM();
  }

  async function loadCRM() {
    const rows = $('customerRows');
    if (!rows) return;
    rows.innerHTML = '<tr><td colspan="7" class="empty">Loading customers…</td></tr>';
    try {
      const { data, error } = await crmDb.from('quote_requests')
        .select('id,quote_number,customer_id,customer_name,company_name,email,phone,origin,destination,pickup_date,status,created_at,notes')
        .order('created_at', { ascending: false });
      if (error) throw error;
      quotes = data || [];
      const map = new Map();
      quotes.forEach(q => {
        const key = q.customer_id || (q.email ? `email:${String(q.email).toLowerCase()}` : `company:${String(q.company_name || '').toLowerCase()}`);
        if (!map.has(key)) map.set(key, {
          id: q.customer_id || key,
          company_name: q.company_name || 'Unnamed customer',
          contact_name: q.customer_name || '—',
          email: q.email || '', phone: q.phone || '', notes: q.notes || '',
          created_at: q.created_at, derived: !q.customer_id
        });
      });
      customers = [...map.values()];
      renderCustomers();
    } catch (err) {
      console.error('Customer CRM load error:', err);
      rows.innerHTML = `<tr><td colspan="7" class="empty">Could not load customers.<br><small>${esc(err.message || 'Supabase request failed')}</small></td></tr>`;
    }
  }

  function relatedQuotes(c) {
    return quotes.filter(q => c.derived
      ? (!q.customer_id && String(q.email || '').toLowerCase() === String(c.email || '').toLowerCase())
      : String(q.customer_id) === String(c.id));
  }

  function renderCustomers() {
    const rows = $('customerRows');
    if (!rows) return;
    const term = ($('customerSearch')?.value || '').trim().toLowerCase();
    const filtered = customers.filter(c => !term || [c.company_name,c.contact_name,c.email,c.phone].some(v => String(v || '').toLowerCase().includes(term)));
    if (!filtered.length) {
      rows.innerHTML = '<tr><td colspan="7" class="empty">No customers match your search.</td></tr>';
      return;
    }
    rows.innerHTML = filtered.map(c => {
      const related = relatedQuotes(c);
      const last = related[0]?.created_at || c.created_at;
      return `<tr>
        <td class="customer"><strong>${esc(c.company_name)}</strong><span>Added ${fmtDate(c.created_at)}</span></td>
        <td>${esc(c.contact_name)}</td>
        <td>${c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '—'}</td>
        <td>${c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : '—'}</td>
        <td><strong>${related.length}</strong></td>
        <td>${fmtDateTime(last)}</td>
        <td><button class="outline crm-customer" data-id="${esc(c.id)}">View</button></td>
      </tr>`;
    }).join('');
    rows.querySelectorAll('.crm-customer').forEach(b => b.addEventListener('click', () => openCustomer(b.dataset.id)));
  }

  function openDrawer() { $('drawer')?.classList.remove('hidden'); $('drawer')?.setAttribute('aria-hidden', 'false'); }
  function closeDrawer() { $('drawer')?.classList.add('hidden'); $('drawer')?.setAttribute('aria-hidden', 'true'); currentQuote = null; $('quoteActions')?.classList.remove('hidden'); if ($('drawerKicker')) $('drawerKicker').textContent = 'QUOTE REQUEST'; }
  function detail(label, value, full = false) { return `<div class="detail-block ${full ? 'full' : ''}"><span>${label}</span><div>${value || '—'}</div></div>`; }

  function openCustomer(id) {
    const c = customers.find(x => String(x.id) === String(id));
    if (!c) return;
    const related = relatedQuotes(c);
    $('drawerKicker').textContent = 'CUSTOMER PROFILE';
    $('drawerTitle').textContent = c.company_name || 'Customer';
    $('quoteActions')?.classList.add('hidden');
    const history = related.length ? related.map(q => `<button class="history-row crm-history" data-id="${esc(q.id)}"><span><strong>${quoteNo(q.quote_number)}</strong><small>${esc(q.origin)} → ${esc(q.destination)}</small></span><span><b class="status ${esc(q.status)}">${esc(statusLabel(q.status))}</b><small>${fmtDate(q.pickup_date)}</small></span></button>`).join('') : '<div class="empty history-empty">No quotes yet.</div>';
    $('drawerBody').innerHTML = `<div class="customer-profile"><div class="profile-company">${esc(c.company_name)}</div><div class="profile-meta">Customer since ${fmtDate(c.created_at)}</div></div><div class="detail-grid customer-details">${detail('Primary contact',esc(c.contact_name))}${detail('Email',c.email ? `<a href="mailto:${esc(c.email)}">${esc(c.email)}</a>` : '—')}${detail('Phone',c.phone ? `<a href="tel:${esc(c.phone)}">${esc(c.phone)}</a>` : '—')}${detail('Total quotes',`<strong>${related.length}</strong>`)}${detail('Internal notes',esc(c.notes),true)}</div><div class="history-heading"><div class="kicker">ACTIVITY</div><h4>Quote History</h4></div><div class="history-list">${history}</div>`;
    openDrawer();
    document.querySelectorAll('.crm-history').forEach(b => b.addEventListener('click', () => openQuote(b.dataset.id)));
  }

  async function openQuote(id) {
    const { data, error } = await crmDb.from('quote_requests').select('*').eq('id', id).maybeSingle();
    if (error || !data) return;
    currentQuote = data;
    $('drawerKicker').textContent = 'QUOTE REQUEST';
    $('drawerTitle').textContent = quoteNo(data.quote_number);
    $('quoteActions')?.classList.remove('hidden');
    $('detailStatus').value = data.status || 'new';
    $('internalNotes').value = data.internal_notes || '';
    $('saveMessage').textContent = '';
    $('drawerBody').innerHTML = `<div class="detail-grid">${detail('Company',`<strong>${esc(data.company_name)}</strong>`)}${detail('Contact',`<strong>${esc(data.customer_name)}</strong>`)}${detail('Email',data.email ? `<a href="mailto:${esc(data.email)}">${esc(data.email)}</a>` : '—')}${detail('Phone',data.phone ? `<a href="tel:${esc(data.phone)}">${esc(data.phone)}</a>` : '—')}${detail('Origin',`<strong>${esc(data.origin)}</strong>`)}${detail('Destination',`<strong>${esc(data.destination)}</strong>`)}${detail('Pickup date',fmtDate(data.pickup_date))}${detail('Equipment',esc(data.equipment))}${detail('Commodity',esc(data.commodity))}${detail('Weight',data.weight_lbs ? `${Number(data.weight_lbs).toLocaleString()} lbs` : '—')}${detail('Pieces',data.pieces ? esc(data.pieces) : '—')}${detail('Special requirements',esc(data.special_requirements),true)}${detail('Customer notes',esc(data.notes),true)}</div>`;
    openDrawer();
  }

  async function saveCRMQuote() {
    if (!currentQuote) return;
    $('saveMessage').textContent = 'Saving…';
    const { error } = await crmDb.from('quote_requests').update({ status: $('detailStatus').value, internal_notes: $('internalNotes').value.trim(), updated_at: new Date().toISOString() }).eq('id', currentQuote.id);
    if (error) { $('saveMessage').textContent = 'Could not save changes.'; return; }
    $('saveMessage').textContent = 'Saved.';
    await loadCRM();
    setTimeout(closeDrawer, 650);
  }

  function init() {
    document.querySelectorAll('nav a[data-section]').forEach(a => a.addEventListener('click', e => { e.preventDefault(); showSection(a.dataset.section); }));
    $('customerSearch')?.addEventListener('input', renderCustomers);
    $('customerRefresh')?.addEventListener('click', loadCRM);
    $('drawerClose')?.addEventListener('click', closeDrawer);
    $('drawerX')?.addEventListener('click', closeDrawer);
    $('saveQuote')?.addEventListener('click', saveCRMQuote);
    if (location.hash === '#customers') showSection('customers');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
