(function(){
  function loadScript(src,key){if(window[key])return Promise.resolve();window[key]=true;return new Promise(resolve=>{const s=document.createElement('script');s.src=src;s.onload=()=>resolve();s.onerror=()=>{console.error('Could not load '+src);resolve()};document.head.appendChild(s)})}
  function loadEnhancements(){return loadScript('enhancements.js?v=8','mightEnhancementsLoaded')}
  function loadDashboardV2(){return loadScript('dashboard-v2.js?v=3','mightDashboardV2Loaded')}
  function loadDashboardTheme(){return loadScript('dashboard-theme.js?v=1','mightDashboardThemeLoaded')}
  function loadDispatchAdmin(){return loadScript('dispatch-admin.js?v=3','mightDispatchAdminLoaded')}
  function loadDispatcherAccess(){return loadScript('dispatcher-access.js?v=2','mightDispatcherAccessLoaded')}
  function loadBusinessSwitcher(){return loadScript('business-switcher.js?v=3','mightBusinessSwitcherLoaded')}
  function hideLegacyDashboard(){if(document.getElementById('mightDashboardLegacyStyle'))return;const s=document.createElement('style');s.id='mightDashboardLegacyStyle';s.textContent='#dashboard>.stats,#dashboard>#mightOverview{display:none!important}';document.head.appendChild(s)}
  function hideAll(){document.querySelectorAll('main .content').forEach(el=>el.classList.add('hidden'))}
  function moveQuotesOutOfDashboard(){const quotes=document.getElementById('quotes'),dashboard=document.getElementById('dashboard'),main=document.querySelector('main.main');if(quotes&&dashboard&&main&&quotes.parentElement===dashboard){main.insertBefore(quotes,document.getElementById('loads')||null);quotes.classList.add('content','hidden')}}
  function refreshSection(section){const ids={quotes:'refresh',loads:'loadRefresh',customers:'customerRefresh',carriers:'carrierRefresh',brokers:'brokerRefresh'};const id=ids[section];if(id)setTimeout(()=>document.getElementById(id)?.click(),0)}
  function ensureWorkspaceSwitcher(){
    const nav=document.querySelector('aside.sidebar nav');
    if(!nav||document.getElementById('adminWorkspaceSwitcher'))return;
    const wrap=document.createElement('div');
    wrap.id='adminWorkspaceSwitcher';
    wrap.innerHTML='<div class="aws-label">BUSINESS</div><div class="aws-buttons"><button type="button" data-workspace="brokerage" class="active">Brokerage</button><button type="button" data-workspace="dispatch">Dispatch</button></div><div class="aws-dispatch-links hidden"><div class="aws-label">DISPATCH OPERATIONS</div><button type="button" data-dview="overview">Overview</button><button type="button" data-dview="clients">Clients</button><button type="button" data-dview="fleet">Fleet</button><button type="button" data-dview="loads">Accepted Loads</button><button type="button" data-dview="team">Dispatchers</button><button type="button" data-dview="payments">Payments</button></div>';
    nav.parentNode.insertBefore(wrap,nav);
    const style=document.createElement('style');style.id='adminWorkspaceSwitcherStyle';style.textContent='#adminWorkspaceSwitcher{margin:0 14px 18px}#adminWorkspaceSwitcher .aws-label{font-size:9px;letter-spacing:.16em;font-weight:800;color:#7890a6;margin:0 10px 8px}#adminWorkspaceSwitcher .aws-buttons{display:grid;grid-template-columns:1fr 1fr;gap:5px;background:#071a2a;padding:4px;border:1px solid #17334a;border-radius:10px}#adminWorkspaceSwitcher button{border:0;background:transparent;color:#a9bdd0;border-radius:7px;padding:9px 6px;font:700 11px/1 inherit;cursor:pointer}#adminWorkspaceSwitcher .aws-buttons button.active{background:#176fbe;color:#fff;box-shadow:0 4px 12px #176fbe33}#adminWorkspaceSwitcher .aws-dispatch-links{margin:16px 2px 0;padding:0 7px 0 10px;border-left:1px solid #1d405b}#adminWorkspaceSwitcher .aws-dispatch-links button{display:block;width:100%;text-align:left;margin:2px 0;padding:8px 9px;color:#9eb4c8;border-radius:7px}#adminWorkspaceSwitcher .aws-dispatch-links button:hover,#adminWorkspaceSwitcher .aws-dispatch-links button.active{background:#102f48;color:#fff}.hidden{display:none!important}';document.head.appendChild(style);
    wrap.querySelectorAll('[data-workspace]').forEach(b=>b.addEventListener('click',()=>switchWorkspace(b.dataset.workspace)));
    wrap.querySelectorAll('[data-dview]').forEach(b=>b.addEventListener('click',()=>{showDispatchView(b.dataset.dview);wrap.querySelectorAll('[data-dview]').forEach(x=>x.classList.toggle('active',x===b))}));
  }
  function switchWorkspace(mode){
    const wrap=document.getElementById('adminWorkspaceSwitcher');if(!wrap)return;
    wrap.querySelectorAll('[data-workspace]').forEach(b=>b.classList.toggle('active',b.dataset.workspace===mode));
    const links=wrap.querySelector('.aws-dispatch-links');links?.classList.toggle('hidden',mode!=='dispatch');
    document.body.classList.toggle('biz-dispatch-mode',mode==='dispatch');
    if(mode==='dispatch'){showSection('dispatch',false);setTimeout(()=>showDispatchView('overview'),80)}
    else {showSection('dashboard',false)}
  }
  function showDispatchView(view){
    const section=document.getElementById('dispatch');if(!section)return;
    window.mightBusinessSwitcher?.showDispatchView?.(view);
    const wrap=document.getElementById('adminWorkspaceSwitcher');wrap?.querySelectorAll('[data-dview]').forEach(b=>b.classList.toggle('active',b.dataset.dview===view));
  }
  function showSection(section,pushHash){if(window.mightDispatcherRestricted&&section!=='dispatch')section='dispatch';moveQuotesOutOfDashboard();hideAll();if(section==='dispatch')window.initMightDispatchAdmin?.();const target=document.getElementById(section);if(target)target.classList.remove('hidden');document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===section));const titles={dashboard:'Operations Dashboard',quotes:'Quote Requests',loads:'Load Management',customers:'Customer Management',carriers:'Carrier Management',brokers:'Broker Management',dispatch:'Dispatch Operations'};const title=document.getElementById('pageTitle');if(title)title.textContent=titles[section]||'Operations Dashboard';if(pushHash){const next=`#${section}`;if(location.hash!==next)history.replaceState(null,'',next)}if(section!=='dashboard'&&section!=='dispatch')refreshSection(section);if(section==='dashboard')setTimeout(()=>window.refreshMightDashboard?.(true),80)}
  async function init(){
    ensureWorkspaceSwitcher();
    hideLegacyDashboard();
    await loadEnhancements();await loadDashboardV2();await loadDashboardTheme();await loadDispatchAdmin();await loadDispatcherAccess();await loadBusinessSwitcher();
    ensureWorkspaceSwitcher();
    moveQuotesOutOfDashboard();hideLegacyDashboard();window.initMightDispatchAdmin?.();
    document.addEventListener('click',function(e){const link=e.target.closest?.('nav a[data-section]');if(!link)return;if(window.mightDispatcherRestricted&&link.dataset.section!=='dispatch'){e.preventDefault();e.stopImmediatePropagation();showSection('dispatch',true);return}e.preventDefault();e.stopImmediatePropagation();showSection(link.dataset.section,true)},true);
    const initial=(location.hash||'#dashboard').slice(1);showSection(window.mightDispatcherRestricted?'dispatch':(document.getElementById(initial)?initial:'dashboard'),false);window.mightAdminRouter={showSection};
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
