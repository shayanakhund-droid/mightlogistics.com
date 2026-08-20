(function(){
  if(window.mightDispatcherAccessLoaded)return;window.mightDispatcherAccessLoaded=true;
  const db=window.mightDb;
  async function apply(){
    try{
      const {data:{user}}=await db.auth.getUser(); if(!user)return;
      const {data:p}=await db.from('employee_profiles').select('access_level,role,full_name').eq('id',user.id).maybeSingle();
      const isDispatcher=p?.access_level==='dispatcher'; const isAdmin=p?.role==='admin'&&p?.access_level==='administrator';
      window.mightDispatcherRestricted=isDispatcher;
      document.querySelectorAll('nav a[data-section]').forEach(a=>{
        if(isDispatcher)a.style.display=a.dataset.section==='dispatch'?'':'none';
        else if(!isAdmin&&a.dataset.section==='dispatch')a.style.display='none';
        else a.style.display='';
      });
      const dash=document.getElementById('dashboard'); if(isDispatcher&&dash)dash.classList.add('hidden');
      const title=document.getElementById('pageTitle'); if(isDispatcher&&title)title.textContent='Dispatch Operations';
      if(isDispatcher&&window.mightAdminRouter?.showSection)window.mightAdminRouter.showSection('dispatch',false);
    }catch(e){console.error('Dispatcher access check failed',e)}
  }
  db.auth.onAuthStateChange((event)=>{if(event==='SIGNED_IN'||event==='TOKEN_REFRESHED')setTimeout(apply,50);if(event==='SIGNED_OUT')window.mightDispatcherRestricted=false;});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(apply,150));else setTimeout(apply,150);
})();
