(function(){
  if(window.mightSalesRoleFixLoaded)return;window.mightSalesRoleFixLoaded=true;
  function addOption(select,value,label,afterValue){if(!select||select.querySelector('option[value="'+value+'"]'))return;const o=document.createElement('option');o.value=value;o.textContent=label;const after=select.querySelector('option[value="'+afterValue+'"]');if(after&&after.nextSibling)select.insertBefore(o,after.nextSibling);else select.appendChild(o)}
  function patch(){document.querySelectorAll('select[name="role"]').forEach(s=>addOption(s,'sales','Sales','dispatcher'));const filter=document.getElementById('ecRole');if(filter)addOption(filter,'sales','Sales','dispatcher')}
  const mo=new MutationObserver(patch);mo.observe(document.body,{childList:true,subtree:true});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',patch,{once:true});else patch();

  // Account-profile opportunity hotfix. The old account-detail handler attempted to
  // navigate back to Book of Business and locate the opportunity card by UUID. When
  // that lookup failed, a null UUID could reach Supabase. Intercept the account-level
  // View action and load the opportunity directly by its actual row id.
  const UUID=/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  const db=()=>window.mightDb;
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  const stages=[['lead','Lead'],['contacted','Contacted'],['qualified','Qualified'],['discovery','Discovery'],['proposal','Proposal'],['negotiation','Negotiation'],['won','Won'],['lost','Lost']];
  function closeModal(){document.getElementById('safeOpportunityModal')?.remove()}
  function showOpportunity(o){
    closeModal();
    const modal=document.createElement('div');modal.id='safeOpportunityModal';modal.style.cssText='position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(7,20,35,.58)';
    modal.innerHTML=`<div style="width:min(760px,96vw);max-height:90vh;overflow:auto;background:#fff;border-radius:16px;box-shadow:0 24px 80px rgba(0,0,0,.25)"><div style="padding:24px;border-bottom:1px solid #e5eaf0;display:flex;justify-content:space-between;align-items:flex-start"><div><div style="font-size:11px;letter-spacing:.14em;font-weight:700;color:#1672c4">OPPORTUNITY</div><h2 style="margin:7px 0 4px;font-size:24px;color:#102033">${esc(o.name||'Opportunity')}</h2><div style="color:#6b7c8f">${esc(o.stage||'lead')} · ${esc(o.account_name||'Account')}</div></div><button id="safeOppClose" style="border:0;background:none;font-size:28px;color:#6b7c8f;cursor:pointer">×</button></div><form id="safeOppForm" style="padding:24px"><div style="display:grid;grid-template-columns:1fr 1fr;gap:16px"><label style="font-weight:600;color:#24364a">Opportunity name<input name="name" required value="${esc(o.name)}" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd7e3;border-radius:8px"></label><label style="font-weight:600;color:#24364a">Stage<select name="stage" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd7e3;border-radius:8px">${stages.map(s=>`<option value="${s[0]}" ${o.stage===s[0]?'selected':''}>${s[1]}</option>`).join('')}</select></label><label style="font-weight:600;color:#24364a">Estimated value<input name="amount" type="number" min="0" value="${Number(o.amount||0)}" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd7e3;border-radius:8px"></label><label style="font-weight:600;color:#24364a">Probability %<input name="probability" type="number" min="0" max="100" value="${Number(o.probability||0)}" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd7e3;border-radius:8px"></label><label style="font-weight:600;color:#24364a">Expected close<input name="expected_close_date" type="date" value="${esc(o.expected_close_date||'')}" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd7e3;border-radius:8px"></label><label style="font-weight:600;color:#24364a">Next follow-up<input name="next_follow_up_at" type="datetime-local" value="${o.next_follow_up_at?new Date(o.next_follow_up_at).toISOString().slice(0,16):''}" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd7e3;border-radius:8px"></label><label style="font-weight:600;color:#24364a;grid-column:1/-1">Notes<textarea name="notes" rows="4" style="display:block;width:100%;box-sizing:border-box;margin-top:7px;padding:11px;border:1px solid #cbd7e3;border-radius:8px">${esc(o.notes||'')}</textarea></label></div><div style="display:flex;justify-content:flex-end;gap:10px;margin-top:20px"><button type="button" id="safeOppCancel" style="padding:11px 18px;border:1px solid #cbd7e3;background:#fff;border-radius:8px;cursor:pointer">Cancel</button><button type="submit" style="padding:11px 18px;border:0;background:#1672c4;color:#fff;border-radius:8px;font-weight:700;cursor:pointer">Save Opportunity</button></div><div id="safeOppError" style="margin-top:12px;color:#b42318"></div></form></div>`;
    document.body.appendChild(modal);
    modal.querySelector('#safeOppClose').onclick=closeModal;modal.querySelector('#safeOppCancel').onclick=closeModal;
    modal.querySelector('#safeOppForm').onsubmit=async e=>{
      e.preventDefault();const f=new FormData(e.currentTarget);const p=Object.fromEntries(f.entries());p.amount=Number(p.amount||0);p.probability=Number(p.probability||0);p.next_follow_up_at=p.next_follow_up_at?new Date(p.next_follow_up_at).toISOString():null;
      const profile=window.mightAdminProfile||{};if(UUID.test(profile.id||''))p.owner_id=profile.id;else delete p.owner_id;
      const r=await db().from('sales_opportunities').update(p).eq('id',o.id);if(r.error){modal.querySelector('#safeOppError').textContent=r.error.message;return}closeModal();if(window.mightAdminRouter?.showSection)window.mightAdminRouter.showSection('sales/book-of-business',true);
    };
  }
  document.addEventListener('click',async e=>{
    const el=e.target.closest?.('[data-detail-opportunity]');if(!el)return;
    const id=el.getAttribute('data-detail-opportunity');
    // Stop the legacy handler before it can navigate or issue a query with null.
    e.preventDefault();e.stopImmediatePropagation();
    if(!UUID.test(id||'')){console.error('Invalid opportunity UUID:',id);return}
    try{
      const r=await db().from('sales_opportunities').select('*').eq('id',id).maybeSingle();
      if(r.error)throw r.error;if(!r.data){throw new Error('Opportunity not found.')}
      showOpportunity(r.data);
    }catch(err){console.error('Opportunity load failed',err);const t=document.createElement('div');t.textContent=err.message||'Unable to open opportunity.';t.style.cssText='position:fixed;right:24px;bottom:24px;z-index:100000;background:#b42318;color:#fff;padding:13px 18px;border-radius:9px;font-weight:600';document.body.appendChild(t);setTimeout(()=>t.remove(),4500)}
  },true);
})();