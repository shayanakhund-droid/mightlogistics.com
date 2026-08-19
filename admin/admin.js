const SUPABASE_URL = 'https://sowdiflodjxxqrarbisi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
window.mightDb = db;

const $ = (id) => document.getElementById(id);
let quotes = [];
let selectedQuote = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
}
function statusLabel(s){ return (s || '').replace(/_/g,' '); }
function formatDate(v){ if(!v) return '—'; const d=new Date(String(v).length===10 ? v+'T00:00:00' : v); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d); }
function formatQuote(n){ return `ML-${String(n).padStart(5,'0')}`; }
function money(v){ return Number(v || 0).toLocaleString('en-US',{style:'currency',currency:'USD'}); }
function miles(v){ return v ? `${Number(v).toLocaleString('en-US')} mi` : '—'; }

async function getProfile(){
  const { data:{ user } } = await db.auth.getUser();
  if(!user) return null;
  const { data, error } = await db.from('employee_profiles').select('id,role,full_name').eq('id',user.id).maybeSingle();
  if(error) throw error;
  return { user, profile:data };
}

async function signIn(e){
  e.preventDefault();
  $('loginError').textContent='';
  const { error } = await db.auth.signInWithPassword({email:$('email').value.trim(),password:$('password').value});
  if(error){ $('loginError').textContent=error.message; return; }
  await boot();
}

async function boot(){
  try{
    const result = await getProfile();
    if(!result){ showLogin(); return; }
    if(!result.profile || result.profile.role !== 'admin'){
      $('loginError').textContent='This account is not authorized for the Might Logistics operations portal.';
      await db.auth.signOut();
      showLogin();
      return;
    }
    $('userName').textContent = result.profile.full_name || 'Administrator';
    $('userEmail').textContent = result.user.email || '';
    $('userAvatar').textContent = (result.profile.full_name || result.user.email || 'A').charAt(0).toUpperCase();
    $('loginView').classList.add('hidden');
    $('appView').classList.remove('hidden');
    await loadQuotes();
  }catch(err){
    console.error(err);
    $('accessError').textContent = 'Unable to load the operations data. Please refresh and try again.';
  }
}
function showLogin(){ $('appView').classList.add('hidden'); $('loginView').classList.remove('hidden'); }

async function loadQuotes(){
  $('quoteRows').innerHTML='<tr><td colspan="7" class="empty">Loading quote requests…</td></tr>';
  const { data, error } = await db.from('quote_requests').select('*').order('created_at',{ascending:false});
  if(error){ console.error(error); $('quoteRows').innerHTML='<tr><td colspan="7" class="empty">Could not load quote requests.</td></tr>'; return; }
  quotes=data||[];
  window.quotes=quotes;
  renderStats(); renderRows();
  if(typeof window.refreshMightDashboard==='function')window.refreshMightDashboard();
}
function renderStats(){
  const count=s=>quotes.filter(q=>q.status===s).length;
  $('statNew').textContent=count('new'); $('statReviewing').textContent=count('reviewing'); $('statQuoting').textContent=count('quoting'); $('statBooked').textContent=count('booked');
}
function renderRows(){
  const term=$('search').value.trim().toLowerCase(); const filter=$('statusFilter').value;
  const filtered=quotes.filter(q=>{
    if(filter!=='all'&&q.status!==filter) return false;
    if(!term) return true;
    return [formatQuote(q.quote_number),q.company_name,q.customer_name,q.origin,q.pickup_zip,q.destination,q.delivery_zip,q.equipment,q.email].some(v=>String(v||'').toLowerCase().includes(term));
  });
  if(!filtered.length){ $('quoteRows').innerHTML='<tr><td colspan="7" class="empty">No quote requests match your filters.</td></tr>'; return; }
  $('quoteRows').innerHTML=filtered.map(q=>`<tr>
    <td><span class="quote-link" data-id="${q.id}">${formatQuote(q.quote_number)}</span></td>
    <td class="customer"><strong>${esc(q.company_name)}</strong><span>${esc(q.customer_name)}</span></td>
    <td class="lane"><strong>${esc(q.origin)}</strong> <span>→</span> <strong>${esc(q.destination)}</strong>${q.estimated_miles?`<small style="display:block;color:#66768a;margin-top:3px">~${Number(q.estimated_miles).toLocaleString('en-US')} miles</small>`:''}</td>
    <td>${esc(q.equipment)}</td>
    <td>${formatDate(q.pickup_date)}</td>
    <td><span class="status ${esc(q.status)}">${esc(statusLabel(q.status))}</span></td>
    <td><button class="outline open-quote" data-id="${q.id}">View</button></td>
  </tr>`).join('');
  document.querySelectorAll('[data-id]').forEach(el=>el.addEventListener('click',()=>openQuote(el.dataset.id)));
}

function detail(label,value,full=false){return `<div class="detail-block ${full?'full':''}"><span>${label}</span><div>${value||'—'}</div></div>`;}
function updatePricingPreview(){
  const carrier=Number($('carrierRate')?.value || 0);
  const customer=Number($('customerRate')?.value || 0);
  const margin=customer-carrier;
  const percent=customer>0 ? (margin/customer)*100 : 0;
  $('marginAmount').textContent=money(margin);
  $('marginPercent').textContent=`${percent.toFixed(1)}%`;
  const badge=$('marginBadge');
  if(margin>0){ badge.textContent=`${percent.toFixed(1)}% margin`; badge.className='margin-badge positive'; }
  else if(margin<0){ badge.textContent='Loss'; badge.className='margin-badge negative'; }
  else { badge.textContent='Margin —'; badge.className='margin-badge'; }
}
function populatePricing(q){
  $('carrierRate').value = q.carrier_rate ?? '';
  $('customerRate').value = q.customer_rate ?? '';
  updatePricingPreview();
}
function openQuote(id){
  selectedQuote=quotes.find(q=>q.id===id); if(!selectedQuote)return;
  const q=selectedQuote; $('drawerTitle').textContent=formatQuote(q.quote_number); $('detailStatus').value=q.status || 'new'; $('internalNotes').value=q.internal_notes||''; $('saveMessage').textContent='';
  populatePricing(q);
  $('drawerBody').innerHTML=`<div class="detail-grid">
    ${detail('Company',`<strong>${esc(q.company_name)}</strong>`)}
    ${detail('Contact',`<strong>${esc(q.customer_name)}</strong>`)}
    ${detail('Email',`<a href="mailto:${esc(q.email)}">${esc(q.email)}</a>`)}
    ${detail('Phone',q.phone?`<a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>`:'—')}
    ${detail('Origin',`<strong>${esc(q.origin)}</strong>`)}
    ${detail('Pickup ZIP',`<strong>${esc(q.pickup_zip)}</strong>`)}
    ${detail('Destination',`<strong>${esc(q.destination)}</strong>`)}
    ${detail('Delivery ZIP',`<strong>${esc(q.delivery_zip)}</strong>`)}
    ${detail('Estimated Distance',q.estimated_miles?`<strong>~${Number(q.estimated_miles).toLocaleString('en-US')} miles</strong>`:'—')}
    ${detail('Pickup date',formatDate(q.pickup_date))}
    ${detail('Equipment',esc(q.equipment))}
    ${detail('Commodity',esc(q.commodity))}
    ${detail('Weight',q.weight_lbs?`${esc(q.weight_lbs.toLocaleString?.()||q.weight_lbs)} lbs`:'—')}
    ${detail('Pieces',q.pieces?esc(q.pieces):'—')}
    ${detail('Special requirements',esc(q.special_requirements),true)}
    ${detail('Customer notes',esc(q.notes),true)}
  </div>`;
  $('drawer').classList.remove('hidden'); $('drawer').setAttribute('aria-hidden','false');
}
function closeDrawer(){ $('drawer').classList.add('hidden'); $('drawer').setAttribute('aria-hidden','true'); selectedQuote=null; }

async function saveQuote(){
  if(!selectedQuote)return false;
  $('saveMessage').textContent='Saving…';
  const carrier=Number($('carrierRate').value || 0);
  const customer=Number($('customerRate').value || 0);
  const margin=customer-carrier;
  const { error }=await db.from('quote_requests').update({
    status:$('detailStatus').value,
    carrier_rate: carrier || null,
    customer_rate: customer || null,
    margin: margin || null,
    internal_notes:$('internalNotes').value.trim(),
    updated_at:new Date().toISOString()
  }).eq('id',selectedQuote.id);
  if(error){ console.error(error); $('saveMessage').textContent='Could not save changes.'; return false; }
  $('saveMessage').textContent='Saved.';
  await loadQuotes();
  setTimeout(closeDrawer,650);
  return true;
}

function previewData(){
  if(!selectedQuote) return null;
  const q={...selectedQuote};
  q.customer_rate=Number($('customerRate').value || 0);
  return q;
}
function buildQuoteDocument(q){
  const rate=Number(q.customer_rate||0);
  const notes=q.notes || 'Thank you for the opportunity to quote this shipment.';
  return `<article class="quote-paper">
    <header class="quote-paper-head">
      <div class="quote-brand"><div class="brand-mark">M</div><div><strong>MIGHT LOGISTICS</strong><span>FREIGHT • CAPACITY • CONTROL</span></div></div>
      <div class="quote-meta"><strong>${formatQuote(q.quote_number)}</strong><span>Issued ${formatDate(new Date().toISOString().slice(0,10))}</span></div>
    </header>
    <section class="quote-title"><div class="kicker">FREIGHT QUOTE</div><h1>Transportation Quote</h1></section>
    <section class="quote-lane">
      <div><span>Origin</span><strong>${esc(q.origin)}</strong><small>${esc(q.pickup_zip) ? `ZIP ${esc(q.pickup_zip)}` : ''}</small></div>
      <div class="arrow">→</div>
      <div><span>Destination</span><strong>${esc(q.destination)}</strong><small>${esc(q.delivery_zip) ? `ZIP ${esc(q.delivery_zip)}` : ''}</small></div>
    </section>
    ${q.estimated_miles ? `<section class="quote-distance"><span>Estimated Driving Distance</span><strong>~${Number(q.estimated_miles).toLocaleString('en-US')} miles</strong></section>` : ''}
    <section class="quote-info-grid">
      <div class="quote-info"><span>Customer</span><strong>${esc(q.company_name)}</strong></div>
      <div class="quote-info"><span>Contact</span><strong>${esc(q.customer_name)}</strong></div>
      <div class="quote-info"><span>Pickup Date</span><strong>${formatDate(q.pickup_date)}</strong></div>
      <div class="quote-info"><span>Equipment</span><strong>${esc(q.equipment)}</strong></div>
      <div class="quote-info"><span>Commodity</span><strong>${esc(q.commodity) || '—'}</strong></div>
      <div class="quote-info"><span>Weight</span><strong>${q.weight_lbs ? `${Number(q.weight_lbs).toLocaleString('en-US')} lbs` : '—'}</strong></div>
    </section>
    <section class="quote-rate"><div><span>Total Transportation Rate</span><strong>${rate>0 ? money(rate) : 'Rate pending'}</strong></div><div class="kicker">USD</div></section>
    <section class="quote-notes"><h4>Shipment Notes</h4><p>${esc(notes)}</p></section>
    <section class="quote-terms">This quote is based on the shipment information provided and is subject to capacity, equipment availability, and final confirmation. Any changes to the shipment details may require a revised rate. Distance is an approximate driving estimate based on the ZIP codes provided. Carrier cost, margin, and internal pricing information are confidential and are not included in this customer document.</section>
  </article>`;
}
function openQuotePreview(){
  const q=previewData();
  if(!q)return;
  if(q.customer_rate<=0){ $('saveMessage').textContent='Enter a customer rate before generating the quote.'; return; }
  $('previewQuoteNumber').textContent=formatQuote(q.quote_number);
  $('quotePreviewContent').innerHTML=buildQuoteDocument(q);
  $('quotePreview').classList.remove('hidden');
  $('quotePreview').setAttribute('aria-hidden','false');
}
function closeQuotePreview(){ $('quotePreview').classList.add('hidden'); $('quotePreview').setAttribute('aria-hidden','true'); }
function printQuote(){ window.print(); }
function emailQuote(){
  const q=previewData(); if(!q || !q.email)return;
  if(q.customer_rate<=0){ $('saveMessage').textContent='Enter a customer rate before emailing the quote.'; closeQuotePreview(); return; }
  const subject=`Might Logistics Quote ${formatQuote(q.quote_number)} — ${q.origin} to ${q.destination}`;
  const body=`Hello ${q.customer_name || ''},\n\nPlease find our transportation quote below.\n\nQuote: ${formatQuote(q.quote_number)}\nLane: ${q.origin} → ${q.destination}\nDistance: ${q.estimated_miles ? `Approximately ${Number(q.estimated_miles).toLocaleString('en-US')} miles` : 'Not available'}\nPickup: ${formatDate(q.pickup_date)}\nEquipment: ${q.equipment}\nRate: ${money(q.customer_rate)} USD\n\nPlease reply to confirm or if you have any questions.\n\nMight Logistics`;
  window.location.href=`mailto:${encodeURIComponent(q.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
async function markQuoted(){
  if(!selectedQuote)return;
  $('detailStatus').value='quoted';
  const ok=await saveQuote();
  if(ok){ closeQuotePreview(); }
}

$('loginForm').addEventListener('submit',signIn);
$('signOut').addEventListener('click',async()=>{await db.auth.signOut();showLogin();});
$('refresh').addEventListener('click',loadQuotes);
$('search').addEventListener('input',renderRows);
$('statusFilter').addEventListener('change',renderRows);
$('carrierRate').addEventListener('input',updatePricingPreview);
$('customerRate').addEventListener('input',updatePricingPreview);
$('drawerClose').addEventListener('click',closeDrawer); $('drawerX').addEventListener('click',closeDrawer); $('saveQuote').addEventListener('click',saveQuote);
$('previewQuote').addEventListener('click',openQuotePreview);
$('quotePreviewClose').addEventListener('click',closeQuotePreview); $('quotePreviewX').addEventListener('click',closeQuotePreview);
$('printQuote').addEventListener('click',printQuote); $('emailQuote').addEventListener('click',emailQuote); $('markQuoted').addEventListener('click',markQuoted);
document.addEventListener('keydown',e=>{if(e.key==='Escape'){if(!$('quotePreview').classList.contains('hidden'))closeQuotePreview();else if(!$('drawer').classList.contains('hidden'))closeDrawer();}});

db.auth.onAuthStateChange((_event)=>{ if(_event==='SIGNED_OUT') showLogin(); });
boot();
