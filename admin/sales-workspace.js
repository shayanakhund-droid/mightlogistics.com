(function(){
  if(window.mightSalesWorkspaceLoaded)return;window.mightSalesWorkspaceLoaded=true;
  const $=id=>document.getElementById(id);
  const esc=v=>String(v??'').replace(/[&<>\"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#39;'}[c]));
  let currentView='book-of-business';
  const views={
    'book-of-business':{title:'Book of Business',kicker:'SALES',desc:'Manage the sales pipeline and the customer relationships owned by your sales team.'},
    performance:{title:'Performance Monitor',kicker:'SALES PERFORMANCE',desc:'Monitor sales activity, conversion and individual representative performance.'}
  };
  function ensure(){let s=$('sales');if(!s){const main=document.querySelector('main.main');if(!main)return null;s=document.createElement('section');s.id='sales';s.className='content hidden sales-workspace';main.appendChild(s)}return s}
  function render(){const s=ensure();if(!s)return;const v=views[currentView]||views['book-of-business'];s.innerHTML=`<div class="sales-shell"><div class="sales-subnav"><button class="sales-tab ${currentView==='book-of-business'?'active':''}" data-sales-view="book-of-business">Book of Business</button><button class="sales-tab ${currentView==='performance'?'active':''}" data-sales-view="performance">Performance Monitor</button></div><section class="sales-panel"><div class="sales-kicker">${v.kicker}</div><h1>${v.title}</h1><p>${v.desc}</p><div class="sales-placeholder"><div class="sales-placeholder-title">${currentView==='book-of-business'?'Sales workspace ready':'Performance workspace ready'}</div><div class="sales-placeholder-copy">The navigation and Sales access layer are now connected. We can build the operational workflows and reporting here next.</div></div></section></div>`;s.querySelectorAll('[data-sales-view]').forEach(b=>b.onclick=()=>{currentView=b.dataset.salesView;window.mightAdminRouter?.showSection('sales/'+currentView,true)})}
  function show(view='book-of-business'){currentView=view||'book-of-business';render();const s=$('sales');if(s){s.classList.remove('hidden');s.style.display='block'}}
  if(!document.getElementById('salesWorkspaceCss')){const st=document.createElement('style');st.id='salesWorkspaceCss';st.textContent=`
.sales-workspace{padding:0}.sales-shell{display:grid;gap:18px}.sales-subnav{display:flex;gap:8px;padding:6px;background:#eef4f8;border:1px solid #dce7ee;border-radius:12px;width:max-content}.sales-tab{border:0;background:transparent;color:#536579;font:600 13px Inter,sans-serif;padding:10px 14px;border-radius:8px;cursor:pointer}.sales-tab:hover{color:#176fbe}.sales-tab.active{background:#fff;color:#176fbe;box-shadow:0 2px 8px rgba(18,44,66,.08)}.sales-panel{background:#fff;border:1px solid #dce5ec;border-radius:14px;padding:28px;box-shadow:0 8px 24px rgba(15,39,58,.05)}.sales-kicker{font-size:11px;font-weight:800;letter-spacing:.14em;color:#1875bf;margin-bottom:6px}.sales-panel h1{margin:0;color:#102235;font-size:26px}.sales-panel p{margin:8px 0 0;color:#66788b}.sales-placeholder{margin-top:28px;border:1px dashed #c9d8e3;border-radius:12px;padding:28px;background:#f8fbfd}.sales-placeholder-title{font-weight:750;color:#17324a;font-size:16px}.sales-placeholder-copy{margin-top:7px;color:#718295;font-size:13px;line-height:1.6}
`;document.head.appendChild(st)}
  window.mightSalesWorkspace={show};
})();
