(function(){
  if(window.mightGmailWorkspaceLoaded)return;
  window.mightGmailWorkspaceLoaded=true;

  const SUPABASE_URL='https://sowdiflodjxxqrarbisi.supabase.co';
  const functions=(name)=>`${SUPABASE_URL}/functions/v1/${name}`;

  function mount(){
    if(document.getElementById('gmail')) return;
    const section=document.createElement('section');
    section.id='gmail';
    section.className='content hidden';
    section.innerHTML=`<section class="panel">
      <div class="panel-head"><div><div class="kicker">INTEGRATIONS</div><h3>Gmail CRM Integration</h3><p class="panel-subtitle">Connect company Gmail, sync conversations, and attach email history to CRM records.</p></div></div>
      <div class="stats">
        <div class="stat"><span>STATUS</span><strong id="gmailStatus">Checking...</strong><small>Gmail connection</small></div>
      </div>
      <div class="controls">
        <button id="gmailConnect" class="primary">Connect Gmail</button>
        <button id="gmailSync" class="outline">Sync Emails</button>
        <button id="gmailDisconnect" class="ghost">Disconnect</button>
      </div>
    </section>`;
    document.querySelector('main.main')?.appendChild(section);
    bind();
  }

  async function call(fn,body){
    const {data:{session}}=await window.mightDb.auth.getSession();
    const r=await fetch(functions(fn),{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||''}`},body:JSON.stringify(body||{})});
    return r.json();
  }

  async function status(){
    try{
      const data=await call('might-gmail-status-v2');
      document.getElementById('gmailStatus').textContent=data?.connected?'Connected':'Not Connected';
    }catch(e){document.getElementById('gmailStatus').textContent='Unavailable'}
  }

  function bind(){
    document.getElementById('gmailConnect').onclick=()=>location.href=functions('might-gmail-oauth-start');
    document.getElementById('gmailDisconnect').onclick=async()=>{await call('might-gmail-disconnect-v2');status()};
    document.getElementById('gmailSync').onclick=async()=>{await call('gmail-crm-sync');status()};
    status();
  }
  window.mightGmailWorkspace={mount};
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();