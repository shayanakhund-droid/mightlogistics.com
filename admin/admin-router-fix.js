(function(){
  if(window.mightAdminRouterFixLoaded)return;
  window.mightAdminRouterFixLoaded=true;

  const WORKSPACES=['dashboard','quotes','loads','customers','carriers','brokers','dispatch','employee-central'];
  const $=id=>document.getElementById(id);
  const scriptPromises={};

  function loadScript(src,key){
    if(window[key])return Promise.resolve();
    if(scriptPromises[key])return scriptPromises[key];
    const id='might-loader-'+key;
    if($(id))return Promise.resolve();
    scriptPromises[key]=new Promise(resolve=>{
      const s=document.createElement('script');
      s.id=id;
      s.src=src;
      s.onload=()=>resolve();
      s.onerror=()=>{console.error('Could not load '+src);resolve()};
      document.head.appendChild(s);
    });
    return scriptPromises[key];
  }

  async function getProfile(){
    try{
      const db=window.mightDb;
      if(!db)return null;
      const{data:{user}}=await db.auth.getUser();
      if(!user)return null;
      const{data:p}=await db.from('employee_profiles').select('id,role,access_level,is_active,full_name,email,employee_code,timezone,scheduled_start_time,scheduled_end_time').eq('id',user.id).maybeSingle();
      return p||null;
    }catch(e){console.error(e);return null}
  }

  const loadEnhancements=()=>Promise.allSettled([
    loadScript('enhancements.js?v=10','mightEnhancementsLoaded'),
    loadScript('quote-economics-fix.js?v=2','mightQuoteEconomicsFixLoaded')
  ]);
  const loadWelcome=()=>loadScript('admin-welcome.js?v=3','mightAdminWelcomeLoaded');
  const loadBrokerage=()=>loadScript('brokerage-admin.js?v=11','mightBrokerageAdminLoaded');
  const loadDispatch=()=>Promise.allSettled([
    loadScript('dispatch-v2.js?v=12','mightDispatchV2Loaded'),
    loadScript('dispatcher-access.js?v=5','mightDispatcherAccessLoaded'),
    loadScript('dispatch-workspaces.js?v=2','mightDispatchWorkspacesLoaded')
  ]);
  const loadEmployeeCentral=()=>loadScript('employee-central.js?v=2','mightEmployeeCentralLoaded');
  const loadAttendance=()=>loadScript('attendance-gate.js?v=2','mightAttendanceGateLoaded');
  const loadPerformance=()=>loadScript('performance-data-v2.js?v=2','mightPerformanceV2');
  const loadPerformanceRoute=()=>loadScript('performance-route-v2.js?v=2','mightPerformanceRouteV2');
  const loadPerformanceDetail=()=>loadScript('performance-detail-v2.js?v=2','mightPerformanceDetailV2');

  function normalize(){
    const main=document.querySelector('main.main');
    if(!main)return;
    const q=$('quotes');if(q&&q.parentElement!==main)main.appendChild(q);
    const d=$('dispatch');if(d&&d.parentElement!==main)main.appendChild(d);
    const ec=$('employee-central');if(ec&&ec.parentElement!==main)main.appendChild(ec);
  }

  function title(s){
    const m={dashboard:'Operations Dashboard',quotes:'Quote Requests',loads:'Load Management',customers:'Customer Management',carriers:'Carrier Management',brokers:'Broker Management',dispatch:'Dispatch Operations','employee-central':'Employee Central',documents:'Documents',billing:'Billing',reports:'Reports'};
    if($('pageTitle'))$('pageTitle').textContent=m[s]||'Operations Dashboard';
  }

  function workspace(s){
    normalize();
    for(const id of WORKSPACES.concat(['documents','billing','reports']))$(id)?.classList.toggle('hidden',id!==s);
    title(s);
  }

  async function showSection(s,push=false){
    if(window.mightDispatcherRestricted&&s!=='dispatch')s='dispatch';
    workspace(s);
    document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===s));
    if(push){const h='#'+s;if(location.hash!==h)history.replaceState(null,'',h)}

    if(s==='dispatch'){
      await loadDispatch();
      window.initMightDispatchV2?.();
    }else if(s==='employee-central'){
      await loadEmployeeCentral();
      await window.mightEmployeeCentral?.show();
    }else if(['documents','billing','reports'].includes(s)){
      await loadBrokerage();
    }
  }

  function installNavigation(){
    if(window.mightAdminNavigationInstalled)return;
    window.mightAdminNavigationInstalled=true;
    document.addEventListener('click',e=>{
      const a=e.target.closest('a[data-section]');
      if(!a)return;
      const s=a.dataset.section;
      if(!WORKSPACES.concat(['dashboard','quotes','loads','customers','brokers','dispatch','employee-central','documents','billing','reports']).includes(s))return;
      e.preventDefault();e.stopImmediatePropagation();
      showSection(s,true).catch(console.error);
    },true);
    window.addEventListener('hashchange',()=>{
      const s=(location.hash||'#dashboard').slice(1).split('/')[0]||'dashboard';
      showSection(s,false).catch(console.error);
    });
  }

  function hideLegacy(){
    if($('mightDashboardLegacyStyle'))return;
    const s=document.createElement('style');
    s.id='mightDashboardLegacyStyle';
    s.textContent='#dashboard>.stats,#dashboard>#dashboardV2{display:none!important}.might-pager{display:flex;justify-content:space-between;align-items:center;gap:12px;padding:12px 2px;color:#66768a;font-size:13px}.might-pager div{display:flex;gap:8px}.might-pager button:disabled{opacity:.45;cursor:not-allowed}';
    document.head.appendChild(s);
  }

  function bootStyle(){
    if($('mightAdminBootStyle'))return;
    const s=document.createElement('style');
    s.id='mightAdminBootStyle';
    s.textContent=`#appView.might-booting{visibility:hidden!important;opacity:0!important} .might-loading{position:relative;overflow:hidden}.might-loading:after{content:'';position:absolute;inset:0;background:linear-gradient(90deg,transparent,rgba(255,255,255,.55),transparent);transform:translateX(-100%);animation:mightShimmer 1.25s infinite}@keyframes mightShimmer{to{transform:translateX(100%)}}`;
    document.head.appendChild(s);
  }

  function release(){
    $('appView')?.classList.remove('might-booting');
  }

  async function init(){
    if(window.mightAdminRouterInitPromise)return window.mightAdminRouterInitPromise;
    window.mightAdminRouterInitPromise=(async()=>{
      bootStyle();
      hideLegacy();

      const p=await getProfile();
      const admin=p?.role==='admin'&&p?.access_level==='administrator'&&p?.is_active!==false;
      const dispatcher=p?.access_level==='dispatcher'&&p?.is_active!==false;
      window.mightBusinessSwitcherAllowed=admin;
      window.mightAdminProfile=p||null;

      window.mightAdminRouter={showSection};
      installNavigation();

      if(!admin&&!dispatcher){release();return}

      // The shell is useful immediately. Heavy feature modules load after first paint.
      workspace(dispatcher?'dispatch':((location.hash||'#dashboard').slice(1).split('/')[0]||'dashboard'));
      release();

      // Load independent enhancements in parallel without blocking the portal shell.
      loadEnhancements().catch(console.error);
      loadAttendance().catch(console.error);

      if(admin){
        loadWelcome().then(()=>window.mightAdminWelcome?.init?.()).catch(console.error);
        loadEmployeeCentral().catch(console.error);
        document.body.classList.add('might-admin-ready');
      }

      // Performance modules are non-critical; never hold the first render for them.
      Promise.allSettled([loadPerformance(),loadPerformanceRoute(),loadPerformanceDetail()]).catch(console.error);

      // If a feature needs an async module, show the workspace first and hydrate it immediately after.
      if(dispatcher){
        showSection('dispatch',false).catch(console.error);
      }else if(['dispatch','employee-central','documents','billing','reports'].includes((location.hash||'').slice(1).split('/')[0])){
        showSection((location.hash||'#dashboard').slice(1).split('/')[0],false).catch(console.error);
      }
    })();
    return window.mightAdminRouterInitPromise;
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});
  else init();
})();
