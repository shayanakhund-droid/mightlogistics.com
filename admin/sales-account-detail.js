(function(){
  if(window.mightSalesAccountDetailLoaded)return;
  window.mightSalesAccountDetailLoaded=true;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v||0));
  const date=v=>v?new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
  const dateTime=v=>v?new Date(v).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
  const inputDate=v=>v?new Date(v).toISOString().slice(0,16):'';
  const stages=[
    {key:'lead',label:'Lead',prob:10},{key:'contacted',label:'Contacted',prob:20},{key:'qualified',label:'Qualified',prob:35},
    {key:'discovery',label:'Discovery',prob:50},{key:'proposal',label:'Proposal',prob:65},{key:'negotiation',label:'Negotiation',prob:80},
    {key:'won',label:'Won',prob:100},{key:'lost',label:'Lost',prob:0}
  ];
  const stageMap=Object.fromEntries(stages.map(s=>[s.key,s]));
  const db=()=>window.mightDb;
  const profile=()=>window.mightAdminProfile||{};
  const userId=()=>profile().id||null;
  let accountId=null, account=null, opportunities=[], activities=[], employees=[];

  function ensure(){return document.getElementById('sales')}
  function ownerName(id){return employees.find(e=>e.id===id)?.full_name||employees.find(e=>e.id===id)?.email||'Unassigned'}
  function stageLabel(k){return stageMap[k]?.label||k||'—'}
  function stageClass(k){return 'stage-'+String(k||'').replace(/[^a-z0-9_-]/gi,'')}
  function openOppModal(o){window.mightSalesWorkspace?.show('book-of-business');setTimeout(()=>{const cards=document.querySelectorAll('[data-opportunity]');const card=[...cards].find(x=>x.dataset.opportunity===o.id);if(card)card.click()},0)}
  async function loadDetail(){
    const d=db();
    const [ar,or,hr,er]=await Promise.all([
      d.from('sales_accounts').select('*').eq('id',accountId).maybeSingle(),
      d.from('sales_opportunities').select('*').eq('account_id',accountId).order('created_at',{ascending:false}),
      d.from('sales_activities').select('*').eq('account_id',accountId).order('activity_at',{ascending:false}),
      d.from('employee_profiles').select('id,full_name,email,role,access_level,is_active').eq('is_active',true)
    ]);
    if(ar.error)throw ar.error;if(or.error)throw or.error;if(hr.error)throw hr.error;
    account=ar.data;opportunities=or.data||[];activities=hr.data||[];employees=er.data||[];
    if(!account)throw new Error('Account not found.');
  }
  function render(){
    const s=ensure();if(!s||!account)return;
    const open=opportunities.filter(o=>!['won','lost'].includes(o.stage));
    const won=opportunities.filter(o=>o.stage==='won');
    const pipeline=open.reduce((n,o)=>n+Number(o.amount||0),0);
    const wonValue=won.reduce((n,o)=>n+Number(o.amount||0),0);
    const overdue=(account.next_follow_up_at&&new Date(account.next_follow_up_at)<new Date())||opportunities.some(o=>o.next_follow_up_at&&new Date(o.next_follow_up_at)<new Date()&&!['won','lost'].includes(o.stage));
    const timeline=activities.slice(0,30);
    s.innerHTML=`<div class="sales-account-detail">
      <div class="sales-detail-top"><button class="sales-btn secondary" id="accountBack">← Back to Book of Business</button><div class="sales-detail-actions"><button class="sales-btn secondary" id="accountEdit">Edit Account</button><button class="sales-btn primary" id="accountAddOpp">+ New Opportunity</button></div></div>
      <section class="sales-account-hero"><div class="sales-account-identity"><div class="sales-company-avatar">${esc((account.company_name||'?').charAt(0).toUpperCase())}</div><div><div class="sales-kicker">ACCOUNT PROFILE</div><div class="sales-detail-title-row"><h1>${esc(account.company_name)}</h1><span class="account-status ${account.status||'active'}">${esc((account.status||'active').replace('_',' ').toUpperCase())}</span></div><p>${esc(account.contact_name||'Primary contact not added')} · Owned by ${esc(ownerName(account.owner_id))}</p></div></div><div class="sales-contact-actions">${account.email?`<a href="mailto:${esc(account.email)}">Email</a>`:''}${account.phone?`<a href="tel:${esc(account.phone)}">Call</a>`:''}${account.website?`<a href="${esc(account.website)}" target="_blank" rel="noopener">Website</a>`:''}</div></section>
      <div class="sales-detail-kpis"><div><span>OPEN OPPORTUNITIES</span><strong>${open.length}</strong><small>${money(pipeline)} open pipeline</small></div><div><span>WON REVENUE</span><strong>${money(wonValue)}</strong><small>${won.length} closed-won</small></div><div><span>ACTIVITIES</span><strong>${activities.length}</strong><small>Recorded touchpoints</small></div><div class="${overdue?'attention':''}"><span>NEXT FOLLOW-UP</span><strong>${account.next_follow_up_at?date(account.next_follow_up_at):'Not scheduled'}</strong><small>${overdue?'Needs attention':'Scheduled next action'}</small></div></div>
      <div class="sales-detail-grid">
        <div class="sales-detail-main">
          <section class="sales-panel"><div class="sales-panel-head"><div><div class="sales-kicker">OPPORTUNITIES</div><h2>Opportunity History</h2><p>Every deal associated with this account, from first contact through close.</p></div><button class="sales-btn primary" id="accountAddOpp2">+ New Opportunity</button></div><div class="account-opportunities">${opportunities.map(o=>`<article class="account-opp-row" data-detail-opportunity="${o.id}"><div class="account-opp-stage"><span class="stage-pill ${stageClass(o.stage)}">${stageLabel(o.stage)}</span><small>${Number(o.probability||0)}% probability</small></div><div class="account-opp-info"><strong>${esc(o.name)}</strong><span>${o.expected_close_date?'Expected close '+date(o.expected_close_date):'No expected close date'} · Owner ${esc(ownerName(o.owner_id))}</span></div><div class="account-opp-value"><strong>${money(o.amount)}</strong><span>${o.next_follow_up_at?'Next '+date(o.next_follow_up_at):'No follow-up'}</span></div><button class="row-btn" data-detail-opportunity="${o.id}">View</button></article>`).join('')||`<div class="sales-empty">No opportunities yet. Create the first deal for this account.</div>`}</div></section>
          <section class="sales-panel"><div class="sales-panel-head"><div><div class="sales-kicker">ACTIVITY TIMELINE</div><h2>Relationship History</h2><p>Calls, emails, meetings, notes and other sales touchpoints.</p></div></div><div class="activity-composer"><form id="activityForm"><div class="activity-form-row"><select name="activity_type"><option value="call">Call</option><option value="email">Email</option><option value="meeting">Meeting</option><option value="note">Note</option><option value="demo">Demo</option><option value="other">Other</option></select><input name="subject" required placeholder="What happened? e.g. Discussed weekly lanes"><input name="next_follow_up_at" type="datetime-local" value="${inputDate(account.next_follow_up_at)}"><button class="sales-btn primary">Log Activity</button></div><textarea name="notes" rows="2" placeholder="Add notes, objections, commitments or next steps..."></textarea></form></div><div class="activity-timeline">${timeline.map(a=>`<article class="activity-item"><div class="activity-marker">${esc((a.activity_type||'N').charAt(0).toUpperCase())}</div><div class="activity-body"><div class="activity-head"><strong>${esc(a.subject||'Sales activity')}</strong><span>${dateTime(a.activity_at)}</span></div><p>${esc(a.notes||'No additional notes.')}</p><small>${esc(ownerName(a.owner_id))}${a.next_follow_up_at?' · Next follow-up '+dateTime(a.next_follow_up_at):''}</small></div></article>`).join('')||`<div class="sales-empty">No activity has been logged for this account yet.</div>`}</div></section>
        </div>
        <aside class="sales-detail-side">
          <section class="sales-panel"><div class="sales-panel-head"><div><div class="sales-kicker">CONTACT</div><h2>Account Information</h2></div></div><div class="account-info"><div><span>PRIMARY CONTACT</span><strong>${esc(account.contact_name||'—')}</strong></div><div><span>EMAIL</span><strong>${account.email?`<a href="mailto:${esc(account.email)}">${esc(account.email)}</a>`:'—'}</strong></div><div><span>PHONE</span><strong>${account.phone?`<a href="tel:${esc(account.phone)}">${esc(account.phone)}</a>`:'—'}</strong></div><div><span>WEBSITE</span><strong>${account.website?`<a href="${esc(account.website)}" target="_blank" rel="noopener">${esc(account.website)}</a>`:'—'}</strong></div><div><span>SOURCE</span><strong>${esc(account.source||'—')}</strong></div><div><span>ACCOUNT OWNER</span><strong>${esc(ownerName(account.owner_id))}</strong></div><div><span>LAST CONTACT</span><strong>${dateTime(account.last_contact_at)}</strong></div><div><span>NEXT FOLLOW-UP</span><strong class="${overdue?'overdue':''}">${dateTime(account.next_follow_up_at)}</strong></div></div></section>
          <section class="sales-panel"><div class="sales-panel-head"><div><div class="sales-kicker">NOTES</div><h2>Account Notes</h2></div></div><div class="account-notes">${account.notes?`<p>${esc(account.notes).replace(/\n/g,'<br>')}</p>`:`<p class="muted-note">No account notes yet.</p>`}</div></section>
          <section class="sales-panel"><div class="sales-panel-head"><div><div class="sales-kicker">FOLLOW-UP</div><h2>Next Action</h2></div></div><div class="next-action-card ${overdue?'overdue':''}"><strong>${account.next_follow_up_at?(overdue?'Follow-up overdue':'Follow-up scheduled'):'No follow-up scheduled'}</strong><span>${account.next_follow_up_at?dateTime(account.next_follow_up_at):'Use the activity log above to schedule the next touch.'}</span><button class="row-btn" id="scheduleFollowup">${account.next_follow_up_at?'Reschedule':'Schedule follow-up'}</button></div></section>
        </aside>
      </div>
    </div>`;
    bind();
  }
  function bind(){
    $('accountBack')?.addEventListener('click',()=>window.mightAdminRouter?.showSection('sales/book-of-business',true));
    const edit=()=>{
      const old=window.mightSalesWorkspace;
      if(old?.show){
        window.mightSalesWorkspace.show('book-of-business').then?.(()=>{});
        setTimeout(()=>{const row=[...document.querySelectorAll('[data-account]')].find(x=>x.dataset.account===account.id);if(row)row.click()},120);
      }
    };
    $('accountEdit')?.addEventListener('click',edit);
    const add=()=>{window.mightSalesWorkspace?.show('book-of-business');setTimeout(()=>document.getElementById('newAccount2')?.click(),100)};
    $('accountAddOpp')?.addEventListener('click',()=>openNewOpportunity());$('accountAddOpp2')?.addEventListener('click',()=>openNewOpportunity());
    document.querySelectorAll('[data-detail-opportunity]').forEach(x=>x.addEventListener('click',e=>{e.stopPropagation();const id=x.dataset.detailOpportunity;const o=opportunities.find(v=>v.id===id);if(o)openOppModal(o)}));
    $('activityForm')?.addEventListener('submit',saveActivity);
    $('scheduleFollowup')?.addEventListener('click',()=>openFollowupModal());
  }
  function openNewOpportunity(){
    window.mightSalesWorkspace?.show('book-of-business');
    setTimeout(()=>{const btn=document.querySelector('#newAccount2');if(btn){const orig=btn.onclick;btn.click()}},100);
    setTimeout(()=>{const tabs=document.querySelectorAll('[data-opportunity]');},150);
    setTimeout(()=>{
      const s=document.getElementById('sales');
      if(!s)return;
      let modal=document.getElementById('salesModal');
      // Use the existing workspace opportunity form by temporarily creating a clean action button in the current UI.
      const cards=s.querySelectorAll('.opportunity-card');
      const helper=s.querySelector('.sales-actions');
      // The existing CRM action module exposes the canonical opportunity form; fall back to a small direct form if unavailable.
      if(window.mightSalesCrmActions?.openOpportunity){window.mightSalesCrmActions.openOpportunity({account_id:account.id});return}
      showOpportunityForm();
    },220);
  }
  function showOpportunityForm(existing){
    let overlay=$('salesDetailOpportunityModal');if(!overlay){overlay=document.createElement('div');overlay.id='salesDetailOpportunityModal';overlay.className='sales-modal';document.body.appendChild(overlay)}
    const o=existing||{};
    overlay.innerHTML=`<div class="sales-modal-backdrop" data-close-detail></div><section class="sales-modal-card"><div class="sales-modal-head"><div><div class="sales-kicker">OPPORTUNITY</div><h2>${o.id?'Edit Opportunity':'New Opportunity'}</h2><p>Create and track a deal for ${esc(account.company_name)}.</p></div><button class="sales-x" data-close-detail>×</button></div><form id="detailOppForm"><div class="sales-form-grid"><label>Opportunity name *<input name="name" required value="${esc(o.name)}" placeholder="e.g. Weekly dry van lanes"></label><label>Stage<select name="stage">${stages.map(st=>`<option value="${st.key}" ${o.stage===st.key?'selected':''}>${st.label}</option>`).join('')}</select></label><label>Estimated value<input name="amount" type="number" min="0" value="${Number(o.amount||0)}"></label><label>Probability %<input name="probability" type="number" min="0" max="100" value="${Number(o.probability??10)}"></label><label>Expected close<input name="expected_close_date" type="date" value="${o.expected_close_date||''}"></label><label>Next follow-up<input name="next_follow_up_at" type="datetime-local" value="${inputDate(o.next_follow_up_at)}"></label><label class="sales-full">Notes<textarea name="notes" rows="4">${esc(o.notes)}</textarea></label></div><div class="sales-modal-actions"><button type="button" class="sales-btn secondary" data-close-detail>Cancel</button><button class="sales-btn primary">Save Opportunity</button></div></form></section>`;
    overlay.classList.add('open');overlay.querySelectorAll('[data-close-detail]').forEach(x=>x.addEventListener('click',()=>overlay.classList.remove('open')));
    overlay.querySelector('#detailOppForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const p=Object.fromEntries(fd.entries());p.account_id=account.id;p.owner_id=o.owner_id||userId();p.amount=Number(p.amount||0);p.probability=Number(p.probability||0);p.next_follow_up_at=p.next_follow_up_at?new Date(p.next_follow_up_at).toISOString():null;p.last_activity_at=new Date().toISOString();const res=o.id?await db().from('sales_opportunities').update(p).eq('id',o.id):await db().from('sales_opportunities').insert(p);if(res.error){if(window.mightSalesWorkspace)window.mightSalesWorkspace.toast?.(res.error.message,'error');return}overlay.classList.remove('open');await openAccountDetail(account.id)};
  }
  async function saveActivity(e){
    e.preventDefault();const fd=new FormData(e.currentTarget);const p=Object.fromEntries(fd.entries());p.account_id=account.id;p.owner_id=userId();p.activity_at=new Date().toISOString();p.next_follow_up_at=p.next_follow_up_at?new Date(p.next_follow_up_at).toISOString():null;
    const res=await db().from('sales_activities').insert(p);if(res.error){window.mightSalesWorkspace?.toast?.(res.error.message,'error');return}
    const updates={last_contact_at:p.activity_at};if(p.next_follow_up_at)updates.next_follow_up_at=p.next_follow_up_at;
    await db().from('sales_accounts').update(updates).eq('id',account.id);await openAccountDetail(account.id);
  }
  function openFollowupModal(){
    let overlay=$('salesFollowupModal');if(!overlay){overlay=document.createElement('div');overlay.id='salesFollowupModal';overlay.className='sales-modal';document.body.appendChild(overlay)}
    overlay.innerHTML=`<div class="sales-modal-backdrop" data-close-follow></div><section class="sales-modal-card"><div class="sales-modal-head"><div><div class="sales-kicker">FOLLOW-UP</div><h2>Schedule Next Action</h2><p>Set the next touchpoint for ${esc(account.company_name)}.</p></div><button class="sales-x" data-close-follow>×</button></div><form id="followupForm"><div class="sales-form-grid"><label class="sales-full">Follow-up date & time<input name="next_follow_up_at" type="datetime-local" required value="${inputDate(account.next_follow_up_at)}"></label><label class="sales-full">Internal note<textarea name="notes" rows="3" placeholder="What should happen on this follow-up?"></textarea></label></div><div class="sales-modal-actions"><button type="button" class="sales-btn secondary" data-close-follow>Cancel</button><button class="sales-btn primary">Schedule Follow-up</button></div></form></section>`;
    overlay.classList.add('open');overlay.querySelectorAll('[data-close-follow]').forEach(x=>x.addEventListener('click',()=>overlay.classList.remove('open')));
    overlay.querySelector('#followupForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const when=new Date(fd.get('next_follow_up_at')).toISOString();const note=String(fd.get('notes')||'').trim();const updates={next_follow_up_at:when};const res=await db().from('sales_accounts').update(updates).eq('id',account.id);if(res.error){window.mightSalesWorkspace?.toast?.(res.error.message,'error');return}if(note)await db().from('sales_activities').insert({account_id:account.id,owner_id:userId(),activity_type:'note',subject:'Follow-up scheduled',notes:note,activity_at:new Date().toISOString(),next_follow_up_at:when});overlay.classList.remove('open');await openAccountDetail(account.id)};
  }
  async function openAccountDetail(id){
    accountId=id;const s=ensure();if(!s)return;
    s.classList.remove('hidden');s.style.display='block';
    s.innerHTML='<div class="sales-detail-loading"><div class="sales-detail-spinner"></div><strong>Loading account profile…</strong><span>Pulling opportunities, activities and follow-ups.</span></div>';
    try{await loadDetail();render();window.mightAdminRouter?.showSection?.('sales/account-detail',true)}catch(e){console.error(e);s.innerHTML=`<div class="sales-detail-error"><h2>Unable to load account</h2><p>${esc(e.message||'Something went wrong.')}</p><button class="sales-btn secondary" id="detailErrorBack">← Back to Book of Business</button></div>`;$('detailErrorBack')?.addEventListener('click',()=>window.mightAdminRouter?.showSection('sales/book-of-business',true))}
  }
  function install(){
    if(window.mightSalesAccountDetailInstalled)return;window.mightSalesAccountDetailInstalled=true;
    document.addEventListener('click',e=>{
      const row=e.target.closest('.sales-table [data-account]');
      const follow=e.target.closest('.followup-item[data-account]');
      const target=row||follow;
      if(!target)return;const id=target.dataset.account;if(!id)return;
      e.preventDefault();e.stopImmediatePropagation();openAccountDetail(id);
    },true);
  }
  if(!document.getElementById('salesAccountDetailCss')){
    const st=document.createElement('style');st.id='salesAccountDetailCss';st.textContent=`
.sales-account-detail{display:grid;gap:18px;padding-bottom:30px}.sales-detail-top{display:flex;justify-content:space-between;gap:12px;align-items:center}.sales-detail-actions{display:flex;gap:8px}.sales-account-hero{background:linear-gradient(135deg,#fff 0%,#f7fbfe 100%);border:1px solid #dce5ec;border-radius:16px;padding:24px;display:flex;justify-content:space-between;align-items:center;gap:20px;box-shadow:0 8px 28px rgba(15,39,58,.05)}.sales-account-identity{display:flex;align-items:center;gap:15px}.sales-company-avatar{width:54px;height:54px;border-radius:14px;background:#102b42;color:#fff;display:grid;place-items:center;font-size:22px;font-weight:800}.sales-detail-title-row{display:flex;align-items:center;gap:10px}.sales-detail-title-row h1{margin:0;color:#102235;font-size:28px;letter-spacing:-.035em}.sales-account-identity p{margin:6px 0 0;color:#718194;font-size:12px}.account-status{font-size:8px;font-weight:800;letter-spacing:.1em;padding:5px 8px;border-radius:999px;background:#e8f7ef;color:#14744d}.account-status.inactive,.account-status.lost{background:#fceaea;color:#a43333}.account-status.won{background:#e7f1ff;color:#1764a0}.sales-contact-actions{display:flex;gap:7px;flex-wrap:wrap}.sales-contact-actions a{border:1px solid #d3e0e8;border-radius:8px;padding:8px 11px;text-decoration:none;color:#1b679d;background:#fff;font-size:11px;font-weight:700}.sales-detail-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:12px}.sales-detail-kpis>div{background:#fff;border:1px solid #dce5ec;border-radius:12px;padding:16px}.sales-detail-kpis span{display:block;font-size:9px;font-weight:800;letter-spacing:.12em;color:#758597}.sales-detail-kpis strong{display:block;margin-top:7px;font-size:20px;color:#132b41;letter-spacing:-.025em}.sales-detail-kpis small{display:block;margin-top:4px;color:#8795a4;font-size:10px}.sales-detail-kpis .attention{border-color:#e8c98d;background:#fffdf7}.sales-detail-kpis .attention strong{color:#9b5a00}.sales-detail-grid{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(290px,.75fr);gap:18px}.sales-detail-main,.sales-detail-side{display:grid;gap:18px;align-content:start}.account-opportunities{padding:3px 0}.account-opp-row{display:grid;grid-template-columns:120px minmax(0,1fr) 130px 55px;align-items:center;gap:14px;padding:15px 20px;border-bottom:1px solid #edf1f4;cursor:pointer}.account-opp-row:hover{background:#f9fbfd}.account-opp-row:last-child{border-bottom:0}.account-opp-stage small{display:block;margin-top:5px;color:#8a98a5;font-size:9px}.account-opp-info strong{display:block;color:#21394f;font-size:13px}.account-opp-info span,.account-opp-value span{display:block;margin-top:4px;color:#8492a0;font-size:10px}.account-opp-value{text-align:right}.account-opp-value strong{color:#17344d;font-size:13px}.activity-composer{padding:15px 20px;border-bottom:1px solid #e8eef2;background:#fbfcfd}.activity-form-row{display:grid;grid-template-columns:100px minmax(0,1fr) 190px auto;gap:8px}.activity-composer input,.activity-composer select,.activity-composer textarea{border:1px solid #d2dee7;border-radius:8px;padding:9px 10px;font:400 12px Inter,sans-serif;color:#21384e;background:#fff;box-sizing:border-box}.activity-composer textarea{width:100%;margin-top:8px;resize:vertical}.activity-timeline{padding:12px 20px}.activity-item{display:flex;gap:12px;padding:13px 0;border-bottom:1px solid #edf1f4}.activity-item:last-child{border-bottom:0}.activity-marker{flex:0 0 30px;height:30px;border-radius:9px;background:#edf5fb;color:#1b73b8;display:grid;place-items:center;font-size:11px;font-weight:800}.activity-body{min-width:0;flex:1}.activity-head{display:flex;justify-content:space-between;gap:15px}.activity-head strong{color:#243b50;font-size:12px}.activity-head span{color:#8996a3;font-size:9px;white-space:nowrap}.activity-body p{margin:5px 0;color:#617487;font-size:11px;line-height:1.5}.activity-body small{color:#8a98a5;font-size:9px}.account-info{padding:5px 20px 15px}.account-info>div{display:flex;justify-content:space-between;gap:15px;padding:11px 0;border-bottom:1px solid #edf1f4}.account-info>div:last-child{border-bottom:0}.account-info span{font-size:9px;font-weight:800;letter-spacing:.08em;color:#8493a2}.account-info strong{font-size:11px;color:#284259;text-align:right;word-break:break-word}.account-info a{color:#176eaf;text-decoration:none}.account-notes{padding:18px 20px;color:#5e7285;font-size:12px;line-height:1.65}.muted-note{color:#97a3af}.next-action-card{margin:14px;padding:15px;border:1px solid #dce6ed;border-radius:10px;background:#f9fbfd}.next-action-card.overdue{border-color:#e9cc95;background:#fffaf1}.next-action-card strong{display:block;color:#284159;font-size:12px}.next-action-card span{display:block;margin:5px 0 12px;color:#7d8d9c;font-size:10px}.next-action-card .row-btn{background:#fff}.sales-detail-loading,.sales-detail-error{min-height:420px;display:grid;place-content:center;justify-items:center;gap:8px;color:#718294}.sales-detail-loading strong,.sales-detail-error h2{color:#193249;margin:0}.sales-detail-spinner{width:25px;height:25px;border:3px solid #dce8ef;border-top-color:#1776c8;border-radius:50%;animation:salesDetailSpin .8s linear infinite}@keyframes salesDetailSpin{to{transform:rotate(360deg)}}.sales-detail-loading span,.sales-detail-error p{font-size:12px}.sales-modal{z-index:10020!important}@media(max-width:1050px){.sales-detail-grid{grid-template-columns:1fr}.sales-detail-kpis{grid-template-columns:repeat(2,1fr)}}@media(max-width:700px){.sales-account-hero,.sales-detail-top{align-items:flex-start;flex-direction:column}.sales-detail-kpis{grid-template-columns:1fr 1fr}.activity-form-row{grid-template-columns:1fr}.account-opp-row{grid-template-columns:1fr}.account-opp-value{text-align:left}.sales-contact-actions{width:100%}}
`;
    document.head.appendChild(st)
  }
  install();
  window.mightSalesAccountDetail={open:openAccountDetail};
})();
