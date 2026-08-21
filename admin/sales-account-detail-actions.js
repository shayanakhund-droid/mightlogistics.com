(function(){
  if(window.mightSalesAccountDetailActionsLoaded)return;
  window.mightSalesAccountDetailActionsLoaded=true;
  const db=()=>window.mightDb;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const inputDate=v=>v?new Date(v).toISOString().slice(0,16):'';
  const stages=[
    {key:'lead',label:'Lead',prob:10},{key:'contacted',label:'Contacted',prob:20},{key:'qualified',label:'Qualified',prob:35},
    {key:'discovery',label:'Discovery',prob:50},{key:'proposal',label:'Proposal',prob:65},{key:'negotiation',label:'Negotiation',prob:80},
    {key:'won',label:'Won',prob:100},{key:'lost',label:'Lost',prob:0}
  ];
  let currentAccountId=null;
  const userId=()=>window.mightAdminProfile?.id||null;
  function toast(msg,type='success'){if(window.mightSalesWorkspace?.toast)return window.mightSalesWorkspace.toast(msg,type);let t=$('salesToast');if(!t){t=document.createElement('div');t.id='salesToast';t.className='sales-toast';document.body.appendChild(t)}t.textContent=msg;t.className='sales-toast '+type;requestAnimationFrame(()=>t.classList.add('show'));setTimeout(()=>t.classList.remove('show'),3200)}
  async function reopen(){if(currentAccountId)await window.mightSalesAccountDetail?.open(currentAccountId)}
  function close(id){$(id)?.classList.remove('open')}
  function ensureModal(id){let x=$(id);if(!x){x=document.createElement('div');x.id=id;x.className='sales-modal';document.body.appendChild(x)}return x}
  async function openOpportunity(id){
    let o={};if(id){const r=await db().from('sales_opportunities').select('*').eq('id',id).maybeSingle();if(r.error){toast(r.error.message,'error');return}o=r.data||{}}
    const a=await db().from('sales_accounts').select('company_name').eq('id',currentAccountId).maybeSingle();if(a.error){toast(a.error.message,'error');return}
    const m=ensureModal('salesCrmDetailOppModal');
    m.innerHTML=`<div class="sales-modal-backdrop" data-close-crm></div><section class="sales-modal-card"><div class="sales-modal-head"><div><div class="sales-kicker">OPPORTUNITY</div><h2>${id?'Edit Opportunity':'New Opportunity'}</h2><p>${esc(a.data?.company_name||'Account')}</p></div><button class="sales-x" data-close-crm>×</button></div><form id="crmDetailOppForm"><div class="sales-form-grid"><label>Opportunity name *<input name="name" required value="${esc(o.name)}" placeholder="e.g. Weekly dry van lanes"></label><label>Stage<select name="stage">${stages.map(s=>`<option value="${s.key}" ${o.stage===s.key?'selected':''}>${s.label}</option>`).join('')}</select></label><label>Estimated value<input name="amount" type="number" min="0" step="1" value="${Number(o.amount||0)}"></label><label>Probability %<input name="probability" type="number" min="0" max="100" value="${Number(o.probability??10)}"></label><label>Expected close<input name="expected_close_date" type="date" value="${o.expected_close_date||''}"></label><label>Next follow-up<input name="next_follow_up_at" type="datetime-local" value="${inputDate(o.next_follow_up_at)}"></label><label class="sales-full">Notes<textarea name="notes" rows="4" placeholder="Deal context, objections, commitments...">${esc(o.notes)}</textarea></label></div><div class="sales-modal-actions"><button type="button" class="sales-btn secondary" data-close-crm>Cancel</button><button class="sales-btn primary">${id?'Save Changes':'Create Opportunity'}</button></div></form></section>`;
    m.classList.add('open');m.querySelectorAll('[data-close-crm]').forEach(x=>x.addEventListener('click',()=>close('salesCrmDetailOppModal')));
    m.querySelector('#crmDetailOppForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const p=Object.fromEntries(fd.entries());p.account_id=currentAccountId;p.owner_id=o.owner_id||userId();p.amount=Number(p.amount||0);p.probability=Number(p.probability||0);p.next_follow_up_at=p.next_follow_up_at?new Date(p.next_follow_up_at).toISOString():null;p.last_activity_at=new Date().toISOString();const r=id?await db().from('sales_opportunities').update(p).eq('id',id):await db().from('sales_opportunities').insert(p);if(r.error){toast(r.error.message,'error');return}close('salesCrmDetailOppModal');toast(id?'Opportunity updated':'Opportunity created');await reopen()};
  }
  async function openAccountEdit(){
    const r=await db().from('sales_accounts').select('*').eq('id',currentAccountId).maybeSingle();if(r.error){toast(r.error.message,'error');return}const a=r.data;if(!a)return;
    const m=ensureModal('salesCrmAccountEditModal');
    m.innerHTML=`<div class="sales-modal-backdrop" data-close-crm-account></div><section class="sales-modal-card"><div class="sales-modal-head"><div><div class="sales-kicker">ACCOUNT</div><h2>Edit Account</h2><p>Update contact information, ownership and follow-up details.</p></div><button class="sales-x" data-close-crm-account>×</button></div><form id="crmAccountEditForm"><div class="sales-form-grid"><label>Company name *<input name="company_name" required value="${esc(a.company_name)}"></label><label>Contact name<input name="contact_name" value="${esc(a.contact_name)}"></label><label>Work email<input name="email" type="email" value="${esc(a.email)}"></label><label>Phone<input name="phone" value="${esc(a.phone)}"></label><label>Website<input name="website" value="${esc(a.website)}"></label><label>Source<select name="source">${['Outbound','Referral','Website','Inbound','Existing Customer','Other'].map(x=>`<option ${a.source===x?'selected':''}>${x}</option>`).join('')}</select></label><label>Status<select name="status"><option value="active" ${a.status==='active'?'selected':''}>Active</option><option value="inactive" ${a.status==='inactive'?'selected':''}>Inactive</option><option value="won" ${a.status==='won'?'selected':''}>Won</option><option value="lost" ${a.status==='lost'?'selected':''}>Lost</option></select></label><label>Next follow-up<input name="next_follow_up_at" type="datetime-local" value="${inputDate(a.next_follow_up_at)}"></label><label class="sales-full">Account notes<textarea name="notes" rows="5">${esc(a.notes)}</textarea></label></div><div class="sales-modal-actions"><button type="button" class="sales-btn secondary" data-close-crm-account>Cancel</button><button class="sales-btn primary">Save Account</button></div></form></section>`;
    m.classList.add('open');m.querySelectorAll('[data-close-crm-account]').forEach(x=>x.addEventListener('click',()=>close('salesCrmAccountEditModal')));
    m.querySelector('#crmAccountEditForm').onsubmit=async e=>{e.preventDefault();const fd=new FormData(e.currentTarget);const p=Object.fromEntries(fd.entries());p.next_follow_up_at=p.next_follow_up_at?new Date(p.next_follow_up_at).toISOString():null;const r=await db().from('sales_accounts').update(p).eq('id',currentAccountId);if(r.error){toast(r.error.message,'error');return}close('salesCrmAccountEditModal');toast('Account updated');await reopen()};
  }
  function install(){
    if(window.mightSalesAccountDetailActionsInstalled)return;window.mightSalesAccountDetailActionsInstalled=true;
    const original=window.mightSalesAccountDetail?.open;
    if(original){window.mightSalesAccountDetail.open=async id=>{currentAccountId=id;return original(id)}}
    document.addEventListener('click',e=>{
      const oppAdd=e.target.closest('#accountAddOpp,#accountAddOpp2');
      if(oppAdd){e.preventDefault();e.stopImmediatePropagation();openOpportunity();return}
      const opp=e.target.closest('[data-detail-opportunity]');
      if(opp){e.preventDefault();e.stopImmediatePropagation();openOpportunity(opp.dataset.detailOpportunity);return}
      const edit=e.target.closest('#accountEdit');
      if(edit){e.preventDefault();e.stopImmediatePropagation();openAccountEdit();return}
    },true);
  }
  install();
  window.mightSalesAccountDetailActions={openOpportunity,openAccountEdit,setAccount:id=>currentAccountId=id};
})();
