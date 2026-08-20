(function(){
  function loadEnhancements(){
    if(window.mightEnhancementsLoaded)return Promise.resolve();
    window.mightEnhancementsLoaded=true;
    return new Promise(resolve=>{
      const s=document.createElement('script');
      s.src='enhancements.js?v=8';
      s.onload=()=>resolve();
      s.onerror=()=>{console.error('Could not load dashboard enhancements');resolve()};
      document.head.appendChild(s);
    });
  }
  function hideAll(){document.querySelectorAll('main .content').forEach(el=>el.classList.add('hidden'))}
  function moveQuotesOutOfDashboard(){const quotes=document.getElementById('quotes'),dashboard=document.getElementById('dashboard'),main=document.querySelector('main.main');if(quotes&&dashboard&&main&&quotes.parentElement===dashboard){main.insertBefore(quotes,document.getElementById('loads')||null);quotes.classList.add('content','hidden')}}
  function refreshSection(section){const ids={quotes:'refresh',loads:'loadRefresh',customers:'customerRefresh',carriers:'carrierRefresh',brokers:'brokerRefresh'};const id=ids[section];if(id)setTimeout(()=>document.getElementById(id)?.click(),0)}
  function showSection(section,pushHash){moveQuotesOutOfDashboard();hideAll();const target=document.getElementById(section);if(target)target.classList.remove('hidden');document.querySelectorAll('nav a[data-section]').forEach(a=>a.classList.toggle('active',a.dataset.section===section));const titles={dashboard:'Operations Dashboard',quotes:'Quote Requests',loads:'Load Management',customers:'Customer Management',carriers:'Carrier Management',brokers:'Broker Management'};const title=document.getElementById('pageTitle');if(title)title.textContent=titles[section]||'Operations Dashboard';if(pushHash){const next=`#${section}`;if(location.hash!==next)history.replaceState(null,'',next)}if(section!=='dashboard')refreshSection(section);if(section==='dashboard')setTimeout(()=>window.refreshMightDashboard?.(),50)}
  async function init(){await loadEnhancements();moveQuotesOutOfDashboard();document.addEventListener('click',function(e){const link=e.target.closest?.('nav a[data-section]');if(!link)return;e.preventDefault();e.stopImmediatePropagation();showSection(link.dataset.section,true)},true);const initial=(location.hash||'#dashboard').slice(1);showSection(document.getElementById(initial)?initial:'dashboard',false);window.mightAdminRouter={showSection}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
