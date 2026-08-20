(function(){
  async function loadScript(src,key){
    if(window[key])return Promise.resolve();
    const id='might-loader-'+key;
    if(document.getElementById(id))return Promise.resolve();
    return new Promise(resolve=>{
      const s=document.createElement('script');s.id=id;s.src=src;
      s.onload=()=>resolve();s.onerror=()=>{console.error('Could not load '+src);resolve()};
      document.head.appendChild(s);
    });
  }
  async function getProfile(){
    try{
      const db=window.mightDb;if(!db)return null;
      const {data:{user}}=await db.auth.getUser();if(!user)return null;
      const {data:p}=await db.from('employee_profiles').select('role,access_level,is_active').eq('id',user.id).maybeSingle();
      return p||null;
    }catch(e){console.error('Admin access profile check failed',e);return null}
  }
  function loadEnhancements(){return loadScript('enhancements.js?v=8','mightEnhancementsLoaded')}
  function loadDashboardV2(){return loadScript('dashboard-v2.js?v=3','mightDashboardV2Loaded')}
  function loadDashboardTheme(){return loadScript('dashboard-theme.js?v=1','mightDashboardThemeLoaded')}
  function loadDispatchAdmin(){return loadScript('dispatch-v2.js?v=4','mightDispatchV2Loaded')}
  function loadDispatcherAccess(){return loadScript('dispatcher-access.js?v=4','mightDispatcherAccessLoaded')}
  function loadBusinessSwitcher(){return loadScript('business-switcher.js?v=8','mightBusinessSwitcherLoaded')}
  function removeLegacyDispatchNav(){document.querySelectorAll('aside.sidebar nav a[data-section="dispatch"],aside.sidebar nav a[href="#dispatch"]').forEach(a=>a.remove())}
  function installLegacyNavGuard(){
    removeLegacyDispatchNav();
    const nav=document.querySelector('aside.sidebar nav');
    if(!nav)return;
    if(window.MIGHT_LEGACY_DISPATCH_GUARD)return;
    window.MIGHT_LEGACY_DISPATCH_GUARD=true;
    new MutationObserver(removeLegacyDispatchNav).observe(nav,{childList:true,subtree:true});
  }
  function hideLegacyDashboard(){if(document.getElementById('mightDashboardLegacyStyle'))return;const s=document.createElement('style');s.id='mightDashboardLegacyStyle';s.textContent='#dashboard>.stats,#dashboard>#mightOverview{display:none!important}';document.head.appendChild(s)}
  function hideAll(){document.querySelectorAll('main .content').forEach(el=>el.classList.add('hidden'))}
  function moveQuotesOutOfDashboard(){const quotes=document.getElementById('quotes'),dashboard=document.getElementById('dashboard'),main=document.querySelector('main.main');if(quotes&&dashboard&&main&&quotes.parentElement===dashboard){main.insertBefore(quotes,document.getElementById('loads')||null);quotes.classList.add('content','hidden')}}
  function refreshSection(section){const ids={quotes:'refresh',loads:'loadRefresh',customers:'customerRefresh',carriers:'carrierRefresh',brokers:'brokerRefresh'};const id=ids[section];if(id)setTimeout(()=>document.getElementById(id)?.click(),0)}
  function showSection(section,pushHash){
    if(window.mightDispatcherRestricted&&section!=='dispatch')section='dispatch';
    if(!window.mightBusinessSwitcherAllowed&&section==='dispatch'&&!window.mightDispatcherRestricted)section='dashboard';
    moveQuotesOutOfDashboard();hideAll();
    if(section==='dispatch')window.initMightDispatchV2?.();
    const target=document.getElementById(section);if(target)target.classList.remove('hidden');
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===section));
    const titles={dashboard:'Operations Dashboard',quotes:'Quote Requests',loads:'Load Management',customers:'Customer Management',carriers:'Carrier Management',brokers:'Broker Management',dispatch:'Dispatch Operations'};
    const title=document.getElementById('pageTitle');if(title)title.textContent=titles[section]||'Operations Dashboard';
    if(pushHash){const next='#'+section;if(location.hash!==next)history.replaceState(null,'',next)}
    if(section!=='dashboard'&&section!=='dispatch')refreshSection(section);
    if(section==='dashboard')setTimeout(()=>window.refreshMightDashboard?.(true),80);
  }
  async function init(){
    hideLegacyDashboard();
    await loadEnhancements();await loadDashboardV2();await loadDashboardTheme();
    const profile=await getProfile();
    const isAdmin=profile?.role==='admin'&&profile?.access_level==='administrator'&&profile?.is_active!==false;
    const isDispatcher=profile?.access_level==='dispatcher'&&profile?.is_active!==false;
    window.mightBusinessSwitcherAllowed=isAdmin;
    if(isAdmin||isDispatcher){await loadDispatchAdmin();await loadDispatcherAccess();}
    await loadBusinessSwitcher();
    moveQuotesOutOfDashboard();hideLegacyDashboard();installLegacyNavGuard();
    document.addEventListener('click',function(e){
      const link=e.target.closest?.('nav a[data-section]');if(!link)return;
      if((window.mightDispatcherRestricted&&link.dataset.section!=='dispatch')||(!window.mightBusinessSwitcherAllowed&&!window.mightDispatcherRestricted&&link.dataset.section==='dispatch')){e.preventDefault();e.stopImmediatePropagation();showSection(window.mightDispatcherRestricted?'dispatch':'dashboard',true);return}
      e.preventDefault();e.stopImmediatePropagation();
      showSection(link.dataset.section,true);
    },true);
    const requested=(location.hash||'#dashboard').slice(1);
    const initial=(!isAdmin&&!isDispatcher&&requested==='dispatch')?'dashboard':requested;
    const resolved=isDispatcher?'dispatch':(document.getElementById(initial)?initial:'dashboard');
    window.mightAdminRouter={showSection};
    if(resolved==='dispatch'){showSection('dispatch',false);if(isAdmin)setTimeout(()=>window.mightBusinessSwitcher?.switchBusiness?.('dispatch'),150)}
    else{showSection(resolved,false);if(isAdmin)setTimeout(()=>window.mightBusinessSwitcher?.switchBusiness?.('brokerage'),150)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
