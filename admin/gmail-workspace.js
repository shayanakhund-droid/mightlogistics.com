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
      <div class="stats"><div class="stat"><span>STATUS</span><strong id="gmailStatus">Checking...</strong><small id="gmailEmail">Gmail connection</small></div></div>
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
    const token=session?.access_token;
    if(!token) throw new Error('No active session token');
    const r=await fetch(functions(fn),{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify(body||{})});
    const text=await r.text();
    let json={};
    try{json=JSON.parse(text)}catch(e){}
    if(!r.ok) throw new Error(json.error||text||`Function failed: ${r.status}`);
    return json;
  }

  async function status(){
    const el=document.getElementById('gmailStatus');
    const email=document.getElementById('gmailEmail');
    try{
      const data=await call('might-gmail-status-v2');
      el.textContent=data?.connected?'Connected':'Not Connected';
      email.textContent=data?.email || 'Gmail connection';
    }catch(e){
      console.error('Gmail status error',e);
      el.textContent='Error';
      email.textContent=e.message;
    }
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