(function(){
  const WORKSPACES=['dashboard','quotes','loads','customers','carriers','brokers','dispatch'];
  let activeSection=null;
  let enforcing=false;
  let observer=null;

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
        .select('role,access_level,is_active')
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
  const loadDashboardTheme=()=>loadScript('dashboard-theme.js?v=1','mightDashboardThemeLoaded');
  const loadDispatchAdmin=()=>loadScript('dispatch-v2.js?v=10','mightDispatchV2Loaded');
  const loadDispatcherAccess=()=>loadScript('dispatcher-access.js?v=4','mightDispatcherAccessLoaded');
  const loadBusinessSwitcher=()=>loadScript('business-switcher.js?v=11','mightBusinessSwitcherLoaded');

  function ensureDispatchRoot(){
    let root=$('dispatch');
    if(!root){
      const main=document.querySelector('main.main');
      if(!main)return null;
      root=document.createElement('section');
      root.id='dispatch';
      root.className='content hidden';
      main.appendChild(root);
    }
    return root;
  }

  // Quote Requests was originally nested inside #dashboard. Move every
  // primary workspace to main so one workspace can never reveal another.
  function normalizeWorkspaces(){
    const main=document.querySelector('main.main');
    if(!main)return null;
    WORKSPACES.forEach(id=>{
      if(id==='dispatch')return;
      const el=$(id);
      if(el && el.parentElement!==main)main.appendChild(el);
    });
    return main;
  }

  function hideAllWorkspaces(){
    const main=normalizeWorkspaces();
    if(!main)return;
    WORKSPACES.forEach(id=>{
      const el=$(id);
      if(!el || el.parentElement!==main)return;
      el.classList.add('hidden');
      el.removeAttribute('data-might-active');
    });
  }

  function setTitle(section){
    const titles={
      dashboard:'Operations Dashboard',
      quotes:'Quote Requests',
      loads:'Load Management',
      customers:'Customer Management',
      carriers:'Carrier Management',
      brokers:'Broker Management',
      dispatch:'Dispatch Operations'
    };
    const title=$('pageTitle');
    if(title)title.textContent=titles[section]||'Operations Dashboard';
  }

  function enforceWorkspace(section){
    const main=normalizeWorkspaces();
    if(!main)return;
    enforcing=true;
    try{
      WORKSPACES.forEach(id=>{
        const el=$(id);
        if(!el || el.parentElement!==main)return;
        const visible=id===section;
        el.classList.toggle('hidden',!visible);
        if(visible)el.setAttribute('data-might-active','true');
        else el.removeAttribute('data-might-active');
      });
      setTitle(section);
    }finally{
      enforcing=false;
    }
  }

  function refreshSection(section){
    const ids={quotes:'refresh',loads:'loadRefresh',customers:'customerRefresh',carriers:'carrierRefresh',brokers:'brokerRefresh'};
    const id=ids[section];
    if(id)setTimeout(()=>$(id)?.click(),0);
  }

  function showSection(section,pushHash=false,refresh=false){
    if(window.mightDispatcherRestricted && section!=='dispatch')section='dispatch';
    if(!window.mightBusinessSwitcherAllowed && !window.mightDispatcherRestricted && section==='dispatch')section='dashboard';

    activeSection=section;
    normalizeWorkspaces();
    hideAllWorkspaces();

    if(section==='dispatch'){
      const root=ensureDispatchRoot();
      if(root){
        root.classList.remove('hidden');
        root.style.display='block';
        root.style.visibility='visible';
      }
      if(window.initMightDispatchV2)window.initMightDispatchV2();
      else setTimeout(()=>window.initMightDispatchV2?.(),150);
    }

    enforceWorkspace(section);

    document.querySelectorAll('nav a[data-section]').forEach(a=>{
      a.classList.toggle('active',a.dataset.section===section);
    });

    if(pushHash){
      const next='#'+section;
      if(location.hash!==next)history.replaceState(null,'',next);
    }

    if(refresh && section!=='dashboard' && section!=='dispatch')refreshSection(section);
    if(section==='dashboard')setTimeout(()=>window.refreshMightDashboard?.(true),80);
  }

  function installNavigationGuard(){
    const nav=document.querySelector('aside.sidebar nav');
    if(!nav)return;

    nav.addEventListener('click',e=>{
      const link=e.target.closest('a[data-section]');
      if(!link)return;
      const section=link.dataset.section;
      if(!WORKSPACES.includes(section))return;

      // Existing modules have their own click handlers. Let them load their
      // data, then make the central router authoritative on the same tick.
      setTimeout(()=>showSection(section,true,false),0);
    });

    window.addEventListener('hashchange',()=>{
      const requested=(location.hash||'#dashboard').slice(1).split('/')[0]||'dashboard';
      showSection(WORKSPACES.includes(requested)?requested:'dashboard',false,false);
    });
  }

  function installWorkspaceGuard(){
    const main=document.querySelector('main.main');
    if(!main)return;

    observer=new MutationObserver(()=>{
      if(enforcing || !activeSection)return;

      // Do not call showSection() from the observer. showSection() itself
      // changes classes and DOM structure, which would cause the observer to
      // fire again indefinitely and freeze the browser.
      const active=$(activeSection);
      if(!active || active.parentElement!==main)return;

      let wrongVisible=false;
      WORKSPACES.forEach(id=>{
        const el=$(id);
        if(!el || el.parentElement!==main)return;
        const shouldBeVisible=id===activeSection;
        const isVisible=!el.classList.contains('hidden');
        if(shouldBeVisible!==isVisible)wrongVisible=true;
      });

      if(!wrongVisible)return;

      enforcing=true;
      try{
        WORKSPACES.forEach(id=>{
          const el=$(id);
          if(!el || el.parentElement!==main)return;
          const visible=id===activeSection;
          el.classList.toggle('hidden',!visible);
          if(visible)el.setAttribute('data-might-active','true');
          else el.removeAttribute('data-might-active');
        });
        setTitle(activeSection);
      }finally{
        enforcing=false;
      }
    });

    observer.observe(main,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});
  }

  function hideLegacyDashboard(){
    if($('mightDashboardLegacyStyle'))return;
    const s=document.createElement('style');
    s.id='mightDashboardLegacyStyle';
    s.textContent='#dashboard>.stats,#dashboard>#mightOverview{display:none!important}';
    document.head.appendChild(s);
  }

  async function init(){
    hideLegacyDashboard();
    await loadEnhancements();
    await loadDashboardV2();
    await loadDashboardTheme();

    const profile=await getProfile();
    const isAdmin=profile?.role==='admin' &&
      profile?.access_level==='administrator' &&
      profile?.is_active!==false;
    const isDispatcher=profile?.access_level==='dispatcher' &&
      profile?.is_active!==false;

    window.mightBusinessSwitcherAllowed=isAdmin;

    if(isAdmin||isDispatcher){
      await loadDispatchAdmin();
      await loadDispatcherAccess();
    }

    await loadBusinessSwitcher();

    normalizeWorkspaces();
    installNavigationGuard();
    installWorkspaceGuard();

    const requested=(location.hash||'#dashboard').slice(1).split('/')[0]||'dashboard';
    const resolved=isDispatcher
      ? 'dispatch'
      : (WORKSPACES.includes(requested)?requested:'dashboard');

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