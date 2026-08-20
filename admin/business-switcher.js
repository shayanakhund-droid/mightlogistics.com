(function(){
  if(window.mightBusinessSwitcherLoaded)return; window.mightBusinessSwitcherLoaded=true;
  const db=window.mightDb;
  let allowedAdmin=false;
  function loadScript(src,id){
    if(id&&document.getElementById(id))return;
    const s=document.createElement('script');if(id)s.id=id;s.src=src;s.onerror=()=>console.error('Could not load',src);document.body.appendChild(s);
  }
  function ensureBrokerage(){loadScript('brokerage-admin.js?v=9','brokerageAdminScript');}
  function ensureDispatch(){loadScript('dispatch-v2.js?v=4','dispatchAdminScript');loadScript('dispatcher-access.js?v=4','dispatcherAccessScript');}
  async function getAccess(){
    try{
      const {data:{user}}=await db.auth.getUser();
      if(!user)return null;
      const {data:p}=await db.from('employee_profiles').select('role,access_level,is_active').eq('id',user.id).maybeSingle();
      return p||null;
    }catch(e){console.error('Business access check failed',e);return null}
  }
  function inject(){
    const nav=document.querySelector('aside.sidebar nav');
    if(!nav||document.getElementById('businessSwitcher')||document.getElementById('adminWorkspaceSwitcher'))return;
    const wrap=document.createElement('div');wrap.id='businessSwitcher';
    wrap.innerHTML=`<div class="biz-switch-label">BUSINESS</div><div class="biz-switch" role="tablist" aria-label="Business operations"><button type="button" data-business="brokerage" class="active">Brokerage</button><button type="button" data-business="dispatch">Dispatch</button></div><div id="dispatchSubnav" class="dispatch-subnav hidden"><div class="biz-switch-label">DISPATCH OPERATIONS</div><a href="#dispatch" data-dview="overview" class="active">Overview</a><a href="#dispatch" data-dview="clients">Clients</a><a href="#dispatch" data-dview="fleet">Fleet</a><a href="#dispatch" data-dview="loads">Accepted Loads</a><a href="#dispatch" data-dview="team">Dispatchers</a><a href="#dispatch" data-dview="payments">Payments</a></div>`;
    nav.parentNode.insertBefore(wrap,nav);
    const style=document.createElement('style');style.id='businessSwitcherStyle';style.textContent=`#businessSwitcher{margin:0 14px 18px}#businessSwitcher .biz-switch-label{font-size:9px;letter-spacing:.16em;font-weight:800;color:#7890a6;margin:0 10px 8px}#businessSwitcher .biz-switch{display:grid;grid-template-columns:1fr 1fr;gap:5px;background:#071a2a;padding:4px;border:1px solid #17334a;border-radius:10px}#businessSwitcher .biz-switch button{border:0;background:transparent;color:#a9bdd0;border-radius:7px;padding:9px 6px;font:700 11px/1 inherit;cursor:pointer}#businessSwitcher .biz-switch button.active{background:#176fbe;color:#fff;box-shadow:0 4px 12px #176fbe33}#businessSwitcher .dispatch-subnav{margin:16px 2px 0;padding:0 7px 0 10px;border-left:1px solid #1d405b}#businessSwitcher .dispatch-subnav a{display:block!important;margin:2px 0;padding:8px 9px!important;border-radius:7px;color:#9eb4c8!important;font-size:11px!important;text-decoration:none}#businessSwitcher .dispatch-subnav a:hover{background:#0c263b!important;color:#fff!important}#businessSwitcher .dispatch-subnav a.active{background:#102f48!important;color:#fff!important}body.biz-dispatch-mode .portal-label{display:none}body.biz-dispatch-mode aside.sidebar nav{display:none!important}body.biz-dispatch-mode #dispatch{animation:bizDispatchIn .2s ease}@keyframes bizDispatchIn{from{opacity:.2;transform:translateY(4px)}to{opacity:1;transform:none}}`;
    document.head.appendChild(style);
    wrap.querySelectorAll('.biz-switch button').forEach(btn=>btn.addEventListener('click',()=>switchBusiness(btn.dataset.business)));
    wrap.querySelectorAll('.dispatch-subnav a').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();showDispatchView(a.dataset.dview)}));
    ensureBrokerage();
  }
  function switchBusiness(mode){
    if(!allowedAdmin)return;
    const wrap=document.getElementById('businessSwitcher');if(!wrap)return;
    wrap.querySelectorAll('.biz-switch button').forEach(b=>b.classList.toggle('active',b.dataset.business===mode));
    document.body.classList.toggle('biz-dispatch-mode',mode==='dispatch');
    const sub=document.getElementById('dispatchSubnav');if(sub)sub.classList.toggle('hidden',mode!=='dispatch');
    if(mode==='dispatch'){ensureDispatch();window.mightAdminRouter?.showSection('dispatch',false);setTimeout(()=>showDispatchView('overview'),100)}
    else{ensureBrokerage();window.mightAdminRouter?.showSection('dashboard',false)}
  }
  function showDispatchView(view){
    if(!allowedAdmin)return;
    const sub=document.getElementById('dispatchSubnav');sub?.querySelectorAll('a').forEach(a=>a.classList.toggle('active',a.dataset.dview===view));
    const root=document.getElementById('dispatch');if(!root)return;
    root.querySelectorAll('.dv2-view').forEach(x=>x.classList.add('hidden'));
    root.querySelectorAll('.dv2-section').forEach(x=>x.classList.toggle('hidden',view!=='overview'));
    const target=root.querySelector(`.dv2-view[data-view="${view}"]`);if(target)target.classList.remove('hidden');
    const title=document.getElementById('pageTitle');const titles={overview:'Dispatch Operations',clients:'Dispatch Clients',fleet:'Client Fleet',loads:'Accepted Dispatch Loads',team:'Dispatchers',payments:'Dispatch Payments'};if(title)title.textContent=titles[view]||'Dispatch Operations';
  }
  async function init(){
    const p=await getAccess();
    allowedAdmin=p?.role==='admin'&&p?.access_level==='administrator'&&p?.is_active!==false;
    window.mightBusinessSwitcherAllowed=allowedAdmin;
    if(allowedAdmin)inject();
    else ensureBrokerage();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else setTimeout(init,0);
  window.mightBusinessSwitcher={switchBusiness,showDispatchView};
})();
