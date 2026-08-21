// Might Logistics Gmail CRM integration controller
(function(){
  if(window.mightGmailLoaded)return;
  window.mightGmailLoaded=true;

  const SUPABASE_URL='https://sowdiflodjxxqrarbisi.supabase.co';
  const SUPABASE_KEY='sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';
  const db=window.mightDb||supabase.createClient(SUPABASE_URL,SUPABASE_KEY);

  async function callFunction(name,body={}){
    const {data:{session}}=await db.auth.getSession();
    const response=await fetch(`${SUPABASE_URL}/functions/v1/${name}`,{
      method:'POST',
      headers:{'Content-Type':'application/json',Authorization:`Bearer ${session?.access_token||SUPABASE_KEY}`},
      body:JSON.stringify(body)
    });
    return response.json();
  }

  async function refreshStatus(){
    const result=await callFunction('might-gmail-status-v2');
    const status=document.getElementById('gmailStatus');
    if(status) status.textContent=result?.connected?'Connected':'Not connected';
    return result;
  }

  async function connect(){
    const result=await callFunction('might-gmail-oauth-start');
    const url=result?.url||result?.authorization_url;
    if(url) location.href=url;
  }

  async function disconnect(){
    await callFunction('might-gmail-disconnect-v2');
    refreshStatus();
  }

  async function sync(){
    const result=await callFunction('gmail-crm-sync');
    refreshStatus();
    return result;
  }

  function mount(){
    if(document.getElementById('gmailWidget'))return;
    const panel=document.createElement('section');
    panel.id='gmailWidget';
    panel.className='panel gmail-panel';
    panel.innerHTML=`
      <div class="panel-head">
        <div>
          <div class="kicker">INTEGRATIONS</div>
          <h3>Gmail CRM Integration</h3>
          <p class="panel-subtitle">Sync company Gmail conversations into Might Logistics CRM.</p>
        </div>
      </div>
      <div class="controls">
        <span id="gmailStatus">Checking...</span>
        <button id="gmailConnect" class="primary">Connect Gmail</button>
        <button id="gmailSync" class="outline">Sync Emails</button>
        <button id="gmailDisconnect" class="outline">Disconnect</button>
      </div>`;

    document.getElementById('dashboard')?.prepend(panel);
    document.getElementById('gmailConnect')?.addEventListener('click',connect);
    document.getElementById('gmailSync')?.addEventListener('click',sync);
    document.getElementById('gmailDisconnect')?.addEventListener('click',disconnect);
    refreshStatus().catch(console.error);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount);else mount();
})();
