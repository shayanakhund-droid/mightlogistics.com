(function(){
  const emailButton=document.getElementById('emailQuote');
  if(emailButton){
    const replacement=emailButton.cloneNode(true);
    emailButton.replaceWith(replacement);
    replacement.addEventListener('click',function(){
      const mailto=document.querySelector('#drawerBody a[href^="mailto:"]');
      const email=mailto ? mailto.getAttribute('href').replace(/^mailto:/i,'') : '';
      const quote=document.getElementById('previewQuoteNumber')?.textContent?.trim() || '';
      const lane=document.querySelector('#quotePreviewContent .quote-lane');
      const laneText=lane ? lane.innerText.replace(/\s+/g,' ').trim() : '';
      const rate=document.querySelector('#quotePreviewContent .quote-rate strong')?.textContent?.trim() || '';
      const subject=`Might Logistics Quote ${quote}`;
      const body=`Hello,\n\nPlease find our transportation quote below.\n\n${quote}\n${laneText}\nRate: ${rate}\n\nPlease reply to confirm or if you have any questions.\n\nMight Logistics`;
      if(!email){ alert('No customer email address is available for this quote.'); return; }
      const gmail=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmail,'_blank','noopener,noreferrer');
    });
  }

  const previewButton=document.getElementById('previewQuote');
  if(previewButton){
    previewButton.addEventListener('click',function(){
      const logo=document.querySelector('#quotePreviewContent .quote-brand .brand-mark');
      if(logo){
        const img=document.createElement('img');
        img.className='quote-logo';
        img.src='../logo.svg';
        img.alt='Might Logistics';
        logo.replaceWith(img);
      }
    });
  }

  const style=document.createElement('style');
  style.textContent=`
    @media print{#appView,#drawer{display:none!important}.quote-preview{display:block!important;position:static!important}.quote-preview-panel{position:static!important}.quote-document{overflow:visible!important}.quote-paper{page-break-inside:avoid!important}.quote-logo{width:42px;height:42px;display:block}}
    .dashboard-charts{margin-top:22px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}
    .dashboard-chart{background:#fff;border:1px solid #e0e5ec;border-radius:12px;padding:20px;box-shadow:0 2px 8px rgba(15,35,55,.03)}
    .dashboard-chart-head{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:18px}.dashboard-chart h3{margin:0;font-size:16px}.dashboard-chart p{margin:5px 0 0;color:#748196;font-size:12px}
    .chart-bars{display:grid;gap:12px}.chart-row{display:grid;grid-template-columns:105px 1fr 34px;align-items:center;gap:10px;font-size:12px}.chart-label{color:#425168;text-transform:capitalize}.chart-track{height:9px;background:#eef2f6;border-radius:999px;overflow:hidden}.chart-fill{height:100%;border-radius:999px;background:#1976c8;min-width:2px}.chart-value{text-align:right;font-weight:700;color:#172033}
    .dashboard-snapshot{margin-top:18px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.snapshot-card{background:#fff;border:1px solid #e0e5ec;border-radius:12px;padding:16px 18px}.snapshot-card span{display:block;color:#748196;font-size:10px;letter-spacing:.14em;text-transform:uppercase}.snapshot-card strong{display:block;margin-top:7px;font-size:22px;color:#172033}.snapshot-card small{display:block;margin-top:4px;color:#748196}
    .quotes-workspace{display:block!important}.dashboard-queue-hidden{display:none!important}
    @media(max-width:900px){.dashboard-charts{grid-template-columns:1fr}.dashboard-snapshot{grid-template-columns:repeat(2,minmax(0,1fr))}}
  `;
  document.head.appendChild(style);

  function setActive(section){
    document.querySelectorAll('nav a[data-section]').forEach(function(a){
      a.classList.toggle('active',a.dataset.section===section);
    });
  }

  function ensureDashboardCharts(){
    const dashboard=document.getElementById('dashboard');
    const stats=dashboard?.querySelector('.stats');
    if(!dashboard||!stats||document.getElementById('dashboardCharts'))return;
    const snapshot=document.createElement('div');
    snapshot.id='dashboardSnapshot';snapshot.className='dashboard-snapshot';
    snapshot.innerHTML='<div class="snapshot-card"><span>Total Loads</span><strong id="dashTotalLoads">—</strong><small>All operational shipments</small></div><div class="snapshot-card"><span>Delivered</span><strong id="dashDelivered">—</strong><small>Successfully completed</small></div><div class="snapshot-card"><span>Cancelled</span><strong id="dashCancelled">—</strong><small>All cancellation reasons</small></div><div class="snapshot-card"><span>Gross Profit</span><strong id="dashGrossProfit">—</strong><small>Across recorded loads</small></div>';
    const charts=document.createElement('div');charts.id='dashboardCharts';charts.className='dashboard-charts';
    charts.innerHTML='<section class="dashboard-chart"><div class="dashboard-chart-head"><div><h3>Quote Pipeline</h3><p>Current quote requests by status</p></div></div><div id="quotePipelineBars" class="chart-bars"></div></section><section class="dashboard-chart"><div class="dashboard-chart-head"><div><h3>Load Status</h3><p>Current operational load distribution</p></div></div><div id="loadStatusBars" class="chart-bars"></div></section>';
    stats.insertAdjacentElement('afterend',snapshot);snapshot.insertAdjacentElement('afterend',charts);
  }

  function renderBars(target,items){
    const el=document.getElementById(target);if(!el)return;
    const max=Math.max(1,...items.map(x=>x.value));
    el.innerHTML=items.map(x=>`<div class="chart-row"><span class="chart-label">${x.label}</span><div class="chart-track"><div class="chart-fill" style="width:${Math.max(2,(x.value/max)*100)}%"></div></div><span class="chart-value">${x.value}</span></div>`).join('');
  }

  async function refreshDashboard(){
    ensureDashboardCharts();
    const total=(window.quotes||[]).length;
    const q=window.quotes||[];
    const quoteStatuses=['new','reviewing','quoting','quoted','booked','lost','cancelled'];
    renderBars('quotePipelineBars',quoteStatuses.map(s=>({label:s,value:q.filter(x=>x.status===s).length})));
    try{
      const {data,error}=await window.mightDb.from('loads').select('status,customer_rate,carrier_rate,gross_margin,cancellation_reason');
      if(error)throw error;
      const loads=data||[];
      const delivered=loads.filter(x=>x.status==='delivered'||x.status==='invoiced'||x.status==='paid').length;
      const cancelled=loads.filter(x=>x.status==='cancelled').length;
      const profit=loads.reduce((sum,x)=>sum+Number(x.gross_margin||((Number(x.customer_rate)||0)-(Number(x.carrier_rate)||0))||0),0);
      document.getElementById('dashTotalLoads').textContent=loads.length;
      document.getElementById('dashDelivered').textContent=delivered;
      document.getElementById('dashCancelled').textContent=cancelled;
      document.getElementById('dashGrossProfit').textContent=Number(profit).toLocaleString('en-US',{style:'currency',currency:'USD'});
      const statuses=['new','quoted','booked','carrier_assigned','dispatched','picked_up','in_transit','delivered','invoiced','paid','cancelled'];
      renderBars('loadStatusBars',statuses.map(s=>({label:s.replace(/_/g,' '),value:loads.filter(x=>x.status===s).length})).filter(x=>x.value>0));
      if(!loads.length)renderBars('loadStatusBars',[{label:'No loads',value:0}]);
    }catch(e){
      console.error('Dashboard load stats failed',e);
      document.getElementById('dashTotalLoads').textContent='—';document.getElementById('dashDelivered').textContent='—';document.getElementById('dashCancelled').textContent='—';document.getElementById('dashGrossProfit').textContent='—';
      renderBars('loadStatusBars',[{label:'Unavailable',value:0}]);
    }
  }

  function hideWorkspaces(){
    ['quotes','customers','loads','carriers'].forEach(id=>document.getElementById(id)?.classList.add('dashboard-queue-hidden'));
  }
  function showWorkspace(section){
    const dashboard=document.getElementById('dashboard');
    const customers=document.getElementById('customers');
    const loads=document.getElementById('loads');
    const carriers=document.getElementById('carriers');
    const stats=dashboard?.querySelector('.stats');
    const quotes=document.getElementById('quotes');
    const title=document.getElementById('pageTitle');
    ensureDashboardCharts();

    if(section==='quotes'){
      dashboard?.classList.remove('hidden');
      customers?.classList.add('hidden');loads?.classList.add('hidden');carriers?.classList.add('hidden');
      stats?.classList.add('hidden');
      document.getElementById('dashboardSnapshot')?.classList.add('hidden');document.getElementById('dashboardCharts')?.classList.add('hidden');
      quotes?.classList.remove('dashboard-queue-hidden');quotes?.classList.add('quotes-workspace');
      setActive('quotes');if(title)title.textContent='Quote Requests';if(typeof loadQuotes==='function')loadQuotes();window.scrollTo({top:0,behavior:'instant'});return;
    }

    if(section==='dashboard'){
      dashboard?.classList.remove('hidden');customers?.classList.add('hidden');loads?.classList.add('hidden');carriers?.classList.add('hidden');
      stats?.classList.remove('hidden');
      document.getElementById('dashboardSnapshot')?.classList.remove('hidden');document.getElementById('dashboardCharts')?.classList.remove('hidden');
      quotes?.classList.add('dashboard-queue-hidden');
      setActive('dashboard');if(title)title.textContent='Operations Dashboard';refreshDashboard();window.scrollTo({top:0,behavior:'instant'});return;
    }
  }

  window.refreshMightDashboard=refreshDashboard;

  document.querySelectorAll('nav a[data-section]').forEach(function(link){
    link.addEventListener('click',function(){
      const section=link.dataset.section;
      if(section==='quotes' || section==='dashboard')setTimeout(function(){showWorkspace(section);},0);
    });
  });

  ensureDashboardCharts();
  setTimeout(function(){
    if(!location.hash || location.hash==='#dashboard')showWorkspace('dashboard');
    else if(location.hash==='#quotes')showWorkspace('quotes');
  },0);
})();
