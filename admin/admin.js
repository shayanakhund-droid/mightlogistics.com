const SUPABASE_URL = 'https://sowdiflodjxxqrarbisi.supabase.co';
const SUPABASE_KEY = 'sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
window.mightDb = db;

const $ = (id) => document.getElementById(id);
let quotes = [];
let selectedQuote = null;
let otpSent = false;
let otpCooldown = 0;
let otpInterval = null;

function esc(value) { return String(value ?? '').replace(/[&<>\"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c])); }
function statusLabel(s){ return (s || '').replace(/_/g,' '); }
function formatDate(v){ if(!v) return '—'; const d=new Date(String(v).length===10 ? v+'T00:00:00' : v); return Number.isNaN(d.getTime()) ? '—' : new Intl.DateTimeFormat('en-US',{month:'short',day:'numeric',year:'numeric'}).format(d); }
function formatQuote(n){ return `ML-${String(n).padStart(5,'0')}`; }
function money(v){ return Number(v || 0).toLocaleString('en-US',{style:'currency',currency:'USD'}); }
function miles(v){ return v ? `${Number(v).toLocaleString('en-US')} mi` : '—'; }

function showLogin(){ $('appView').classList.add('hidden'); $('loginView').classList.remove('hidden'); }
function setLoginError(message){ $('loginError').textContent=message||''; }
function setOtpMode(){ otpSent=true; $('otpField').classList.remove('hidden'); $('otp').focus(); $('loginSubtitle').textContent=`Enter the 6-digit code sent to ${$('email').value.trim()}.`; $('loginButton').textContent='Verify code'; $('changeEmail').classList.remove('hidden'); $('resendOtp').classList.remove('hidden'); startOtpCooldown(); }
function resetOtpMode(){ otpSent=false; $('otpField').classList.add('hidden'); $('changeEmail').classList.add('hidden'); $('resendOtp').classList.add('hidden'); $('otpTimer').classList.add('hidden'); $('otp').value=''; $('loginSubtitle').textContent='Enter your work email to receive a secure sign-in code.'; $('loginButton').textContent='Send verification code'; setLoginError(''); if(otpInterval)clearInterval(otpInterval); }
function startOtpCooldown(){ otpCooldown=60; $('resendOtp').disabled=true; $('otpTimer').classList.remove('hidden'); const tick=()=>{ $('otpTimer').textContent=otpCooldown>0?`You can request a new code in ${otpCooldown}s.`:'You can request a new code now.'; $('resendOtp').disabled=otpCooldown>0; if(otpCooldown<=0){clearInterval(otpInterval);otpInterval=null;} otpCooldown--; }; if(otpInterval)clearInterval(otpInterval); tick(); otpInterval=setInterval(tick,1000); }

async function sendOtp(){
  setLoginError(''); const email=$('email').value.trim().toLowerCase();
  const {error}=await db.auth.signInWithOtp({email,options:{shouldCreateUser:false}});
  if(error){ setLoginError(error.message); return false; }
  setOtpMode(); return true;
}
async function verifyOtp(){
  setLoginError(''); const email=$('email').value.trim().toLowerCase(); const token=$('otp').value.trim();
  if(!/^\d{6}$/.test(token)){setLoginError('Enter the 6-digit verification code from your email.');return;}
  $('loginButton').disabled=true;
  const {error}=await db.auth.verifyOtp({email,token,type:'email');
  $('loginButton').disabled=false;
  if(error){setLoginError('That code is invalid or has expired. Please request a new code.');return;}
  await boot();
}
async function signIn(e){e.preventDefault();if(otpSent)await verifyOtp();else await sendOtp();}

async function getProfile(){
  const { data:{ user } } = await db.auth.getUser(); if(!user) return null;
  const { data, error } = await db.from('employee_profiles').select('id,role,full_name,is_active').eq('id',user.id).maybeSingle();
  if(error) throw error; return { user, profile:data };
}
async function boot(){
  try{
    const result=await getProfile(); if(!result){showLogin();return;}
    if(!result.profile || result.profile.is_active===false || result.profile.role!=='admin'){
      setLoginError('Your account is not authorized for the administrator portal.'); await db.auth.signOut(); showLogin(); return;
    }
    $('userName').textContent=result.profile.full_name||'Administrator'; $('userEmail').textContent=result.user.email||''; $('userAvatar').textContent=(result.profile.full_name||result.user.email||'A').charAt(0).toUpperCase(); $('loginView').classList.add('hidden'); $('appView').classList.remove('hidden'); await loadQuotes();
  }catch(err){console.error(err);setLoginError('Unable to load your account. Please try again.');showLogin();}
}

async function loadQuotes(){ $('quoteRows').innerHTML='<tr><td colspan="7" class="empty">Loading quote requests…</td></tr>'; const {data,error}=await db.from('quote_requests').select('*').order('created_at',{ascending:false}); if(error){console.error(error);$('quoteRows').innerHTML='<tr><td colspan="7" class="empty">Could not load quote requests.</td></tr>';return;} quotes=data||[];window.quotes=quotes;renderStats();renderRows();if(typeof window.refreshMightDashboard==='function')window.refreshMightDashboard(); }
function renderStats(){const count=s=>quotes.filter(q=>q.status===s).length;$('statNew').textContent=count('new');$('statReviewing').textContent=count('reviewing');$('statQuoting').textContent=count('quoting');$('statBooked').textContent=count('booked');}
function renderRows(){const term=$('search').value.trim().toLowerCase(),filter=$('statusFilter').value;const filtered=quotes.filter(q=>{if(filter!=='all'&&q.status!==filter)return false;if(!term)return true;return[formatQuote(q.quote_number),q.company_name,q.customer_name,q.origin,q.pickup_zip,q.destination,q.delivery_zip,q.equipment,q.email].some(v=>String(v||'').toLowerCase().includes(term));});if(!filtered.length){$('quoteRows').innerHTML='<tr><td colspan="7" class="empty">No quote requests match your filters.</td></tr>';return;}$('quoteRows').innerHTML=filtered.map(q=>`<tr><td><span class="quote-link" data-id="${q.id}">${formatQuote(q.quote_number)}</span></td><td class="customer"><strong>${esc(q.company_name)}</strong><span>${esc(q.customer_name)}</span></td><td class="lane"><strong>${esc(q.origin)}</strong> <span>→</span> <strong>${esc(q.destination)}</strong>${q.estimated_miles?`<small style="display:block;color:#66768a;margin-top:3px">~${Number(q.estimated_miles).toLocaleString('en-US')} miles</small>`:''}</td><td>${esc(q.equipment)}</td><td>${formatDate(q.pickup_date)}</td><td><span class="status ${esc(q.status)}">${esc(statusLabel(q.status))}</span></td><td><button class="outline open-quote" data-id="${q.id}">View</button></td></tr>`).join('');document.querySelectorAll('[data-id]').forEach(el=>el.addEventListener('click',()=>openQuote(el.dataset.id)));}

function openQuote(id){selectedQuote=quotes.find(q=>q.id===id);if(!selectedQuote)return;const q=selectedQuote;$('drawerTitle').textContent=formatQuote(q.quote_number);$('detailStatus').value=q.status||'new';$('internalNotes').value=q.internal_notes||'';populatePricing(q);$('drawerBody').innerHTML=`<div class="detail-grid">${detail('Company',`<strong>${esc(q.company_name)}</strong>`)}${detail('Contact',`<strong>${esc(q.customer_name)}</strong>`)}${detail('Email',`<a href="mailto:${esc(q.email)}">${esc(q.email)}</a>`)}${detail('Phone',q.phone?`<a href="tel:${esc(q.phone)}">${esc(q.phone)}</a>`:'—')}${detail('Origin',`<strong>${esc(q.origin)}</strong>`)}${detail('Pickup ZIP',`<strong>${esc(q.pickup_zip)}</strong>`)}${detail('Destination',`<strong>${esc(q.destination)}</strong>`)}${detail('Delivery ZIP',`<strong>${esc(q.delivery_zip)}</strong>`)}${detail('Estimated Distance',q.estimated_miles?`<strong>~${Number(q.estimated_miles).toLocaleString('en-US')} miles</strong>`:'—')}${detail('Pickup date',formatDate(q.pickup_date))}${detail('Equipment',esc(q.equipment))}${detail('Commodity',esc(q.commodity))}${detail('Weight',q.weight_lbs?`${esc(q.weight_lbs.toLocaleString?.()||q.weight_lbs)} lbs`:'—')}${detail('Pieces',q.pieces?esc(q.pieces):'—')}${detail('Special requirements',esc(q.special_requirements),true)}${detail('Customer notes',esc(q.notes),true)}</div>`;$('drawer').classList.remove('hidden');$('drawer').setAttribute('aria-hidden','false');}
function detail(label,value,full=false){return `<div class="detail-block ${full?'full':''}"><span>${label}</span><div>${value||'—'}</div></div>`;}
function updatePricingPreview(){const carrier=Number($('carrierRate')?.value||0),customer=Number($('customerRate')?.value||0),margin=customer-carrier,percent=customer>0?(margin/customer)*100:0;$('marginAmount').textContent=money(margin);$('marginPercent').textContent=`${percent.toFixed(1)}%`;const badge=$('marginBadge');if(margin>0){badge.textContent=`${percent.toFixed(1)}% margin`;badge.className='margin-badge positive';}else if(margin<0){badge.textContent='Loss';badge.className='margin-badge negative';}else{badge.textContent='Margin —';badge.className='margin-badge';}}
function populatePricing(q){$('carrierRate').value=q.carrier_rate??'';$('customerRate').value=q.customer_rate??'';updatePricingPreview();}
async function saveQuote(){if(!selectedQuote)return false;$('saveMessage').textContent='Saving…';const carrier=Number($('carrierRate').value||0),customer=Number($('customerRate').value||0),margin=customer-carrier;const{error}=await db.from('quote_requests').update({status:$('detailStatus').value,carrier_rate:carrier||null,customer_rate:customer||null,margin:margin||null,internal_notes:$('internalNotes').value.trim(),updated_at:new Date().toISOString()}).eq('id',selectedQuote.id);if(error){console.error(error);$('saveMessage').textContent='Could not save changes.';return false;}$('saveMessage').textContent='Saved.';await loadQuotes();setTimeout(closeDrawer,650);return true;}
function closeDrawer(){$('drawer').classList.add('hidden');$('drawer').setAttribute('aria-hidden','true');selectedQuote=null;}

$('loginForm').addEventListener('submit',signIn);$('changeEmail').addEventListener('click',resetOtpMode);$('resendOtp').addEventListener('click',sendOtp);$('otp').addEventListener('input',e=>{e.target.value=e.target.value.replace(/\D/g,'').slice(0,6);});$('signOut').addEventListener('click',async()=>{await db.auth.signOut();showLogin();resetOtpMode();});$('refresh').addEventListener('click',loadQuotes);$('search').addEventListener('input',renderRows);$('statusFilter').addEventListener('change',renderRows);$('carrierRate').addEventListener('input',updatePricingPreview);$('customerRate').addEventListener('input',updatePricingPreview);$('drawerClose').addEventListener('click',closeDrawer);$('drawerX').addEventListener('click',closeDrawer);$('saveQuote').addEventListener('click',saveQuote);$('previewQuote').addEventListener('click',openQuotePreview);$('quotePreviewClose').addEventListener('click',closeQuotePreview);$('quotePreviewX').addEventListener('click',closeQuotePreview);$('printQuote').addEventListener('click',printQuote);$('emailQuote').addEventListener('click',emailQuote);$('markQuoted').addEventListener('click',markQuoted);
db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_OUT')showLogin();});
boot();