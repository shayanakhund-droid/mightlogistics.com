// Gmail workspace integration patch
(function(){
  if(window.mightGmailRouterAddonLoaded)return;
  window.mightGmailRouterAddonLoaded=true;

  const originalWorkspace = window.mightAdminRouter?.showSection;

  function addWorkspace(){
    const nav=document.querySelector('.sidebar nav');
    if(nav && !nav.querySelector('[data-section="gmail"]')){
      const a=document.createElement('a');
      a.href='#gmail';
      a.dataset.section='gmail';
      a.className='might-nav-standalone';
      a.textContent='Gmail CRM';
      nav.appendChild(a);
    }

    if(!document.getElementById('gmail')){
      const main=document.querySelector('main.main');
      if(main){
        const section=document.createElement('section');
        section.id='gmail';
        section.className='content hidden';
        section.innerHTML='<section class="panel"><div id="gmailWorkspace"></div></section>';
        main.appendChild(section);
      }
    }
  }

  function showGmail(){
    document.querySelectorAll('.content').forEach(x=>x.classList.toggle('hidden',x.id!=='gmail'));
    document.getElementById('pageTitle').textContent='Gmail CRM Integration';
    window.mightGmailWorkspace?.mount?.();
  }

  document.addEventListener('click',function(e){
    const a=e.target.closest('a[data-section="gmail"]');
    if(!a)return;
    e.preventDefault();
    showGmail();
    history.replaceState(null,'','#gmail');
  },true);

  window.addEventListener('hashchange',function(){
    if(location.hash==='#gmail')showGmail();
  });

  setTimeout(addWorkspace,1000);
})();
