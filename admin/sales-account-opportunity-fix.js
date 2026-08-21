(function(){
  if(window.mightSalesAccountOpportunityFixLoaded)return;
  window.mightSalesAccountOpportunityFixLoaded=true;
  const $=id=>document.getElementById(id);
  const db=()=>window.mightDb;
  const profile=()=>window.mightAdminProfile||{};
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const money=v=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(Number(v||0));
  const date=v=>v?new Date(v).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'}):'—';
  const dateTime=v=>v?new Date(v).toLocaleString('en-US',{month:'short',day:'numeric',year:'numeric',hour:'numeric',minute:'2-digit'}):'—';
  const inputDate=v=>v?new Date(v).toISOString().slice(0,16):'';
  const stages=[
    ['lead','Lead',10],['contacted','Contacted',20],['qualified','Qualified',35],['discovery','Discovery',50],
    ['proposal','Proposal',65],['negotiation','Negotiation',80],['won','Won',100],['lost','Lost',0]
  ];
  const isUuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);
  function toast(msg,type='success'){
    let t=$('salesToast');
    if(!t){t=document.createElement('div');t.id='salesToast';t.className='sales-toast';document.body.appendChild(t)}
    t.className='sales-toast '+type;t.textContent=msg;clearTimeout(t._timer);requestAnimationFrame(()=>t.classList.add('show'));t._timer=setTimeout(()=>t.classList.remove('show'),3200);
  }
  function closeModal(){document.getElementById('salesAccountOpportunityModal')?.remove()}
  async function openOpportunity(id){
    if(!isUuid(id)){toast('Invalid opportunity ID.','error');return}
    const d=db();
    const [or,er]=await Promise.all([
      d.from('sales_opportunities').select('*').eq('id',id).maybeSingle(),
      d.from('employee_profiles').select('id,full_name,email').eq('is_active',true).order('full_name')
    ]);
    if(or.error){toast(or.error.message,'error');return}
    if(er.error){toast(er.error.message,'error');return}
    const o=or.data;if(!o){toast('Opportunity not found.','error');return}
    const employees=er.data||[];
    const modal=document.createElement('div');modal.id='salesAccountOpportunityModal';modal.className='sales-modal open';
    modal.innerHTML=`<div class="sales-modal-backdrop" data-account-opp-close></div>
      <section class="sales-modal-card sales-opportunity-detail-modal">
        <div class="sales-modal-head"><div><div class="sales-kicker">OPPORTUNITY DETAIL</div><h2>${esc(o.name||'Opportunity')}</h2><p>Review and update this opportunity without leaving the account profile.</p></div><button class="sales-x" data-account-opp-close>×</button></div>
        <div class="opportunity-detail-summary">
          <div><span>STAGE</span><strong>${esc((stages.find(s=>s[0]===o.stage)?.[1]||o.stage||'—'))}</strong></div>
          <div><span>VALUE</span><strong>${money(o.amount)}</strong></div>
          <div><span>PROBABILITY</span><strong>${Number(o.probability||0)}%</strong></div>
          <div><span>EXPECTED CLOSE</span><strong>${date(o.expected_close_date)}</strong></div>
        </div>
        <form id="accountOpportunityForm"><div class="sales-form-grid">
          <label>Opportunity name *<input name="name" required value="${esc(o.name)}"></label>
          <label>Stage<select name="stage">${stages.map(s=>`<option value="${s[0]}" ${o.stage===s[0]?'selected':''}>${s[1]}</option>`).join('')}</select></label>
          <label>Estimated value<input name="amount" type="number" min="0" step="1" value="${Number(o.amount||0)}"></label>
          <label>Probability %<input name="probability" type="number" min="0" max="100" value="${Number(o.probability??10)}"></label>
          <label>Expected close<input name="expected_close_date" type="date" value="${o.expected_close_date||''}"></label>
          <label>Next follow-up<input name="next_follow_up_at" type="datetime-local" value="${inputDate(o.next_follow_up_at)}"></label>
          <label>Owner<select name="owner_id"><option value="">Unassigned</option>${employees.map(e=>`<option value="${e.id}" ${o.owner_id===e.id?'selected':''}>${esc(e.full_name||e.email)}</option>`).join('')}</select></label>
          <label>Lost reason<input name="lost_reason" value="${esc(o.lost_reason)}"></label>
          <label class="sales-full">Notes<textarea name="notes" rows="5">${esc(o.notes)}</textarea></label>
        </div><div class="sales-modal-actions"><div style="margin-right:auto;color:#7b8998;font-size:11px">Created ${dateTime(o.created_at)} · Last updated ${dateTime(o.updated_at)}</div><button type="button" class="sales-btn secondary" data-account-opp-close>Cancel</button><button class="sales-btn primary">Save Opportunity</button></div></form>
      </section>`;
    document.body.appendChild(modal);
    modal.querySelectorAll('[data-account-opp-close]').forEach(x=>x.addEventListener('click',closeModal));
    modal.querySelector('#accountOpportunityForm').addEventListener('submit',async e=>{
      e.preventDefault();
      const fd=new FormData(e.currentTarget),p=Object.fromEntries(fd.entries());
      p.amount=Number(p.amount||0);p.probability=Number(p.probability||0);
      p.next_follow_up_at=p.next_follow_up_at?new Date(p.next_follow_up_at).toISOString():null;
      p.last_activity_at=new Date().toISOString();
      if(!p.owner_id||!isUuid(p.owner_id))delete p.owner_id;
      const save=e.currentTarget.querySelector('button[type="submit"]');if(save)save.disabled=true;
      const r=await d.from('sales_opportunities').update(p).eq('id',o.id);
      if(r.error){if(save)save.disabled=false;toast(r.error.message,'error');return}
      closeModal();toast('Opportunity updated');
      if(window.mightSalesAccountDetail?.refresh)await window.mightSalesAccountDetail.refresh();
      else if(window.mightAdminRouter)await window.mightAdminRouter.showSection('sales/account/'+o.account_id,true);
    });
  }
  async function openNewOpportunityFromAccount(accountId){
    if(!isUuid(accountId)){toast('Invalid account ID.','error');return}
    const d=db();
    const [ar,er]=await Promise.all([
      d.from('sales_accounts').select('id,company_name').eq('id',accountId).maybeSingle(),
      d.from('employee_profiles').select('id,full_name,email').eq('is_active',true).order('full_name')
    ]);
    if(ar.error){toast(ar.error.message,'error');return}if(er.error){toast(er.error.message,'error');return}
    const account=ar.data;if(!account){toast('Account not found.','error');return}
    const employees=er.data||[],uid=profile().id;
    const modal=document.createElement('div');modal.id='salesAccountOpportunityModal';modal.className='sales-modal open';
    modal.innerHTML=`<div class="sales-modal-backdrop" data-account-opp-close></div><section class="sales-modal-card"><div class="sales-modal-head"><div><div class="sales-kicker">NEW OPPORTUNITY</div><h2>Create Opportunity</h2><p>Add a new deal under ${esc(account.company_name)}.</p></div><button class="sales-x" data-account-opp-close>×</button></div><form id="accountOpportunityForm"><div class="sales-form-grid"><label>Opportunity name *<input name="name" required placeholder="e.g. Weekly dry van lanes"></label><label>Stage<select name="stage">${stages.map(s=>`<option value="${s[0]}">${s[1]}</option>`).join('')}</select></label><label>Estimated value<input name="amount" type="number" min="0" step="1" value="0"></label><label>Probability %<input name="probability" type="number" min="0" max="100" value="10"></label><label>Expected close<input name="expected_close_date" type="date"></label><label>Next follow-up<input name="next_follow_up_at" type="datetime-local"></label><label>Owner<select name="owner_id"><option value="">Unassigned</option>${employees.map(e=>`<option value="${e.id}" ${uid===e.id?'selected':''}>${esc(e.full_name||e.email)}</option>`).join('')}</select></label><label>Lost reason<input name="lost_reason"></label><label class="sales-full">Notes<textarea name="notes" rows="5"></textarea></label></div><div class="sales-modal-actions"><button type="button" class="sales-btn secondary" data-account-opp-close>Cancel</button><button class="sales-btn primary">Create Opportunity</button></div></form></section>`;
    document.body.appendChild(modal);modal.querySelectorAll('[data-account-opp-close]').forEach(x=>x.addEventListener('click',closeModal));
    modal.querySelector('#accountOpportunityForm').addEventListener('submit',async e=>{
      e.preventDefault();const fd=new FormData(e.currentTarget),p=Object.fromEntries(fd.entries());p.account_id=accountId;p.amount=Number(p.amount||0);p.probability=Number(p.probability||0);p.next_follow_up_at=p.next_follow_up_at?new Date(p.next_follow_up_at).toISOString():null;p.last_activity_at=new Date().toISOString();if(!p.owner_id||!isUuid(p.owner_id))delete p.owner_id;
      const save=e.currentTarget.querySelector('button[type="submit"]');if(save)save.disabled=true;
      const r=await d.from('sales_opportunities').insert(p);if(r.error){if(save)save.disabled=false;toast(r.error.message,'error');return}
      closeModal();toast('Opportunity created');if(window.mightSalesAccountDetail?.refresh)await window.mightSalesAccountDetail.refresh();
    });
  }
  document.addEventListener('click',e=>{
    const view=e.target.closest('[data-detail-opportunity]');
    if(view){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();openOpportunity(view.dataset.detailOpportunity);return}
    const add=e.target.closest('#accountAddOpp,#accountAddOpp2');
    if(add){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();const accountEl=document.querySelector('.sales-account-detail');const id=accountEl?.querySelector('[data-detail-opportunity]')?.closest('.sales-account-detail')?.dataset?.accountId;const match=location.hash.match(/sales\/account\/([0-9a-f-]+)/i);if(match)openNewOpportunityFromAccount(match[1]);else if(window.mightSalesAccountDetail?.getAccountId)openNewOpportunityFromAccount(window.mightSalesAccountDetail.getAccountId());return}
  },true);
  if(!document.getElementById('salesAccountOpportunityFixCss')){const st=document.createElement('style');st.id='salesAccountOpportunityFixCss';st.textContent='.opportunity-detail-summary{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;padding:18px 25px;background:#f7fafc;border-bottom:1px solid #e4ebf0}.opportunity-detail-summary>div{background:#fff;border:1px solid #e0e8ee;border-radius:9px;padding:11px}.opportunity-detail-summary span{display:block;font-size:9px;font-weight:800;letter-spacing:.1em;color:#7c8d9e}.opportunity-detail-summary strong{display:block;margin-top:5px;font-size:14px;color:#20374d}@media(max-width:700px){.opportunity-detail-summary{grid-template-columns:1fr 1fr}}';document.head.appendChild(st)}
})();
