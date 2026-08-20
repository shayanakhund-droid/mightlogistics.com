(function(){
  const WORKSPACES=['dashboard','quotes','loads','customers','carriers','brokers','dispatch'];

  function $(id){return document.getElementById(id)}

  function loadScript(src,key){
    if(window[key]) return Promise.resolve();
    const id='might-loader-'+key;
    if(document.getElementById(id)) return Promise.resolve();
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.id=id;
      s.src=src;
      s.onload=()=>resolve();
      s.onerror=()=>{console.error('Could not load '+src);resolve()};
      document.head.appendChild(s);
    });
  }

  async function getProfile(){
    try{
      const db=window.mightDb;
      if(!db)return null;
      const {data:{user}}=await db.auth.getUser();
      if(!user)return null;
      const {data:p}=await db.from('employee_profiles')
        .select('id,role,access_level,is_active,full_name,email')
        .eq('id',user.id)
        .maybeSingle();
      return p||null;
    }catch(e){
      console.error(e);
      return null;
    }
  }

  const loadEnhancements=()=>loadScript('enhancements.js?v=8','mightEnhancementsLoaded');
  const loadDashboardV2=()=>loadScript('dashboard-v2.js?v=3','mightDashboardV2Loaded');
  const loadDashboardTheme=()=>loadScript('dashboard-theme.js?v=2','mightDashboardThemeLoaded');
  const loadAdminWelcome=()=>loadScript('admin-welcome.js?v=1','mightAdminWelcomeLoaded');
  const loadDispatchAdmin=()=>loadScript('dispatch-v2.js?v=10','mightDispatchV2Loaded');
  const loadDispatcherAccess=()=>loadScript('dispatcher-access.js?v=4','mightDispatcherAccessLoaded');
  const loadBusinessSwitcher=()=>loadScript('business-switcher.js?v=11','mightBusinessSwitcherLoaded');

  function normalizeWorkspaces(){
    const main=document.querySelector('main.main');
    if(!main)return;
    const quotes=$('quotes');
    if(quotes && quotes.parentElement!==main)main.appendChild(quotes);
    const dispatch=$('dispatch');
    if(dispatch && dispatch.parentElement!==main)main.appendChild(dispatch);
  }

  function setTitle(section){
    const titles={dashboard:'Operations Dashboard',quotes:'Quote Requests',loads:'Load Management',customers:'Customer Management',carriers:'Carrier Management',brokers:'Broker Management',dispatch:'Dispatch Operations'};
    const title=$('pageTitle');
    if(title)title.textContent=titles[section]||'Operations Dashboard';
  }

  function setWorkspace(section){
    normalizeWorkspaces();
    for(const id of WORKSPACES){
      const el=$(id);
      if(!el)continue;
      const visible=id===section;
      el.classList.toggle('hidden',!visible);
      el.setAttribute('data-might-active',visible?'true':'false');
    }
    setTitle(section);
  }

  function refreshSection(section){
    const ids={quotes:'refresh',loads:'loadRefresh',customers:'customerRefresh',carriers:'carrierRefresh',brokers:'brokerRefresh'};
    const id=ids[section];
    if(id)setTimeout(()=>$(id)?.click(),0);
  }

  function showSection(section,pushHash=false,refresh=false){
    if(window.mightDispatcherRestricted && section!=='dispatch')section='dispatch';
    if(!window.mightBusinessSwitcherAllowed && !window.mightDispatcherRestricted && section==='dispatch')section='dashboard';

    setWorkspace(section);
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===section));

    if(pushHash){
      const next='#'+section;
      if(location.hash!==next)history.replaceState(null,'',next);
    }

    if(section==='dispatch'){
      if(window.initMightDispatchV2)window.initMightDispatchV2();
    }else if(refresh && section!=='dashboard'){
      refreshSection(section);
    }else if(section==='dashboard'){
      setTimeout(()=>window.refreshMightDashboard?.(true),80);
      setTimeout(()=>window.mightAdminWelcomeRefresh?.(),120);
    }
  }

  function installNavigation(){
    document.addEventListener('click',e=>{
      const link=e.target.closest('a[data-section]');
      if(!link)return;
      const section=link.dataset.section;
      if(!WORKSPACES.includes(section))return;
      e.preventDefault();
      e.stopImmediatePropagation();
      showSection(section,true,false);
    },true);

    window.addEventListener('hashchange',()=>{
      const requested=(location.hash||'#dashboard').slice(1).split('/')[0]||'dashboard';
      showSection(WORKSPACES.includes(requested)?requested:'dashboard',false,false);
    });
  }

  function hideLegacyDashboard(){
    if($('mightDashboardLegacyStyle'))return;
    const s=document.createElement('style');
    s.id='mightDashboardLegacyStyle';
    s.textContent='#dashboard>.stats,#dashboard>#mightOverview{display:none!important}';
    document.head.appendChild(s);
  }

  function forceWelcomeVisibility(){
    if($('mightAdminWelcomeVisibility'))return;
    const s=document.createElement('style');
    s.id='mightAdminWelcomeVisibility';
    s.textContent='#dashboard>#adminWelcome{display:grid!important}';
    document.head.appendChild(s);
  }

  async function init(){
    hideLegacyDashboard();
    await loadEnhancements();
    await loadDashboardV2();
    await loadDashboardTheme();

    const profile=await getProfile();
    const isAdmin=profile?.role==='admin' && profile?.access_level==='administrator' && profile?.is_active!==false;
    const isDispatcher=profile?.access_level==='dispatcher' && profile?.is_active!==false;

    window.mightBusinessSwitcherAllowed=isAdmin;

    if(isAdmin){
      await loadAdminWelcome();
      forceWelcomeVisibility();
    }

    if(isAdmin||isDispatcher){
      await loadDispatchAdmin();
      await loadDispatcherAccess();
    }

    await loadBusinessSwitcher();

    normalizeWorkspaces();
    installNavigation();

    const requested=(location.hash||'#dashboard').slice(1).split('/')[0]||'dashboard';
    const resolved=isDispatcher?'dispatch':(WORKSPACES.includes(requested)?requested:'dashboard');

    window.mightAdminRouter={showSection};
    showSection(resolved,false,true);

    if(resolved==='dispatch'){
      if(isAdmin)setTimeout(()=>window.mightBusinessSwitcher?.switchBusiness?.('dispatch'),250);
    }else if(isAdmin){
      setTimeout(()=>window.mightBusinessSwitcher?.switchBusiness?.('brokerage'),250);
    }
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);
  else init();
})();