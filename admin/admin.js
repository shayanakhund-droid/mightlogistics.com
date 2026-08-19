const SUPABASE_URL = 'https://sowdiflodjxxqrarbisi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
window.mightDb = db;

const $ = (id) => document.getElementById(id);
let quotes = [];
let selectedQuote = null;

function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function statusLabel(s){ return (s || '').replace(/_/g,' '); }
function formatDate(v){ if(!v) return '—'; return new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(new Date(v+'T00:00:00')); }
function formatQuote(n){ return `ML-${String(n).padStart(5,'0')}`; }

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
  if(error){ $('loginError').textContent = error.message; return; }
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
  renderStats(); renderRows();
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
    return [formatQuote(q.quote_number),q.company_name,q.customer_name,q.origin,q.destination,q.equipment,q.email].some(v=>String(v||'').toLowerCase().includes(term));
  });
  if(!filtered.length){ $('quoteRows').innerHTML='<tr><td colspan="7" class="empty">No quote requests match your filters.</td></tr>'; return; }
  $('quoteRows').innerHTML=filtered.map(q=>`<tr>
    <td><span class="quote-link" data-id="${q.id}">${formatQuote(q.quote_number)}</span></td>
    <td class="customer"><strong>${esc(q.company_name)}</strong><span>${esc(q.customer_name)}</span></td>
    <td class="lane">${esc(q.origin)} <span>→</span> ${esc(q.destination)}</td>
    <td>${esc(q.equipment)}</td>
    <td>${formatDate(q.pickup_date)}</td>
    <td><span class="status ${esc(q.status)}">${esc(statusLabel(q.status))}</span></td>
    <td><button class="outline open-quote" data-id="${q.id}">View</button></td>
  </tr>`).join('');
  document.querySelectorAll('[data-id]').forEach(el=>el.addEventListener('click',()=>openQuote(el.dataset.id)));
}

function detail(label,value,full=false){return `<div class="detail-block ${full?'full':''}"><span>${label}</span><div>${value||'—'}</div></div>`;}
function openQuote(id){
  selectedQuote=quotes.find(q=>q.id===id); if(!selectedQuote)return;
  const q=selectedQuote; $('drawerTitle').textContent=formatQuote(q.quote_number); $('detailStatus').value=q.status; $('internalNotes').value=q.internal_notes||''; $('saveMessage').textContent='';
  $('drawerBody').innerHTML=`<div class="detail-grid">
    ${detail('Company',`<strong>${esc(q.company_name)}</strong>`)}
    ${detail('Contact',`<strong>${esc(q.customer_name)}</strong>`)}
    ${detail('Email',`<a href="mailto:${esc(q.email)}">${esc(q.email)}</a>`)}
    ${detail('Phone',q.phone?`<a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>`:'—')}
    ${detail('Origin',`<strong>${esc(q.origin)}</strong>`)}
    ${detail('Destination',`<strong>${esc(q.destination)}</strong>`)}
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
  if(!selectedQuote)return;
  $('saveMessage').textContent='Saving…';
  const { error }=await db.from('quote_requests').update({status:$('detailStatus').value,internal_notes:$('internalNotes').value.trim(),updated_at:new Date().toISOString()}).eq('id',selectedQuote.id);
  if(error){ console.error(error); $('saveMessage').textContent='Could not save changes.'; return; }
  $('saveMessage').textContent='Saved.';
  await loadQuotes();
  setTimeout(closeDrawer,650);
}

$('loginForm').addEventListener('submit',signIn);
$('signOut').addEventListener('click',async()=>{await db.auth.signOut();showLogin();});
$('refresh').addEventListener('click',loadQuotes);
$('search').addEventListener('input',renderRows);
$('statusFilter').addEventListener('change',renderRows);
$('drawerClose').addEventListener('click',closeDrawer); $('drawerX').addEventListener('click',closeDrawer); $('saveQuote').addEventListener('click',saveQuote);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('drawer').classList.contains('hidden'))closeDrawer();});

db.auth.onAuthStateChange((_event)=>{ if(_event==='SIGNED_OUT') showLogin(); });
boot();
