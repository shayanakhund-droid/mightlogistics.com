(function(){
  function loadScript(src,key){
    if(window[key])return Promise.resolve();
    const id='might-loader-'+key;
    if(document.getElementById(id))return Promise.resolve();
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.id=id;
      s.src=src;
      s.onload=()=>resolve();
      s.onerror=()=>{console.error('Could not load '+src);resolve()};
      document.head.appendChild(s);
    });
  }

  function loadEnhancements(){return loadScript('enhancements.js?v=8','mightEnhancementsLoaded')}
  function loadDashboardV2(){return loadScript('dashboard-v2.js?v=3','mightDashboardV2Loaded')}
  function loadDashboardTheme(){return loadScript('dashboard-theme.js?v=1','mightDashboardThemeLoaded')}
  function loadDispatchAdmin(){return loadScript('dispatch-v3.js?v=1','mightDispatchV3Loaded')}
  function loadDispatcherAccess(){return loadScript('dispatcher-access.js?v=3','mightDispatcherAccessLoaded')}
  function loadBusinessSwitcher(){return loadScript('business-switcher.js?v=5','mightBusinessSwitcherLoaded')}

  function hideLegacyDashboard(){
    if(document.getElementById('mightDashboardLegacyStyle'))return;
    const s=document.createElement('style');
    s.id='mightDashboardLegacyStyle';
    s.textContent='#dashboard>.stats,#dashboard>#mightOverview{display:none!important}';
    document.head.appendChild(s);
  }

  function hideAll(){
    document.querySelectorAll('main .content').forEach(el=>el.classList.add('hidden'));
  }

  function moveQuotesOutOfDashboard(){
    const quotes=document.getElementById('quotes');
    const dashboard=document.getElementById('dashboard');
    const main=document.querySelector('main.main');
    if(quotes&&dashboard&&main&&quotes.parentElement===dashboard){
      main.insertBefore(quotes,document.getElementById('loads')||null);
      quotes.classList.add('content','hidden');
    }
  }

  function refreshSection(section){
    const ids={quotes:'refresh',loads:'loadRefresh',customers:'customerRefresh',carriers:'carrierRefresh',brokers:'brokerRefresh'};
    const id=ids[section];
    if(id)setTimeout(()=>document.getElementById(id)?.click(),0);
  }

  function showSection(section,pushHash){
    if(window.mightDispatcherRestricted&&section!=='dispatch')section='dispatch';
    moveQuotesOutOfDashboard();
    hideAll();
    if(section==='dispatch')window.initMightDispatchV2?.();
    const target=document.getElementById(section);
    if(target)target.classList.remove('hidden');
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===section));
    const titles={dashboard:'Operations Dashboard',quotes:'Quote Requests',loads:'Load Management',customers:'Customer Management',carriers:'Carrier Management',brokers:'Broker Management',dispatch:'Dispatch Operations'};
    const title=document.getElementById('pageTitle');
    if(title)title.textContent=titles[section]||'Operations Dashboard';
    if(pushHash){const next='#'+section;if(location.hash!==next)history.replaceState(null,'',next)}
    if(section!=='dashboard'&&section!=='dispatch')refreshSection(section);
    if(section==='dashboard')setTimeout(()=>window.refreshMightDashboard?.(true),80);
  }

  async function init(){
    hideLegacyDashboard();
    await loadEnhancements();
    await loadDashboardV2();
    await loadDashboardTheme();
    await loadDispatchAdmin();
    await loadDispatcherAccess();
    await loadBusinessSwitcher();
    moveQuotesOutOfDashboard();
    hideLegacyDashboard();
    window.initMightDispatchV2?.();
    document.addEventListener('click',function(e){
      const link=e.target.closest?.('nav a[data-section]');
      if(!link)return;
      if(window.mightDispatcherRestricted&&link.dataset.section!=='dispatch'){
        e.preventDefault();e.stopImmediatePropagation();showSection('dispatch',true);window.mightBusinessSwitcher?.switchBusiness?.('dispatch');return;
      }
      e.preventDefault();e.stopImmediatePropagation();
      const section=link.dataset.section;showSection(section,true);
      if(section==='dispatch')window.mightBusinessSwitcher?.switchBusiness?.('dispatch');
      else window.mightBusinessSwitcher?.switchBusiness?.('brokerage');
    },true);
    const initial=(location.hash||'#dashboard').slice(1);
    const resolved=window.mightDispatcherRestricted?'dispatch':(document.getElementById(initial)?initial:'dashboard');
    window.mightAdminRouter={showSection};
    if(resolved==='dispatch'){showSection('dispatch',false);setTimeout(()=>window.mightBusinessSwitcher?.switchBusiness?.('dispatch'),150)}
    else{showSection(resolved,false);setTimeout(()=>window.mightBusinessSwitcher?.switchBusiness?.('brokerage'),150)}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();