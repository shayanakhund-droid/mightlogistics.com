(function(){
  const emailButton=document.getElementById('emailQuote');
  if(emailButton){
    const replacement=emailButton.cloneNode(true);
    emailButton.replaceWith(replacement);
    replacement.addEventListener('click',function(){
      const mailto=document.querySelector('#drawerBody a[href^="mailto:"]');
      const email=mailto ? mailto.getAttribute('href').replace(/^mailto:/i,'') : '';
      const quote=document.getElementById('previewQuoteNumber')?.textContent?.trim() || '';
      const lane=document.querySelector('#quotePreviewContent .quote-lane');
      const laneText=lane ? lane.innerText.replace(/\s+/g,' ').trim() : '';
      const rate=document.querySelector('#quotePreviewContent .quote-rate strong')?.textContent?.trim() || '';
      const subject=`Might Logistics Quote ${quote}`;
      const body=`Hello,\n\nPlease find our transportation quote below.\n\n${quote}\n${laneText}\nRate: ${rate}\n\nPlease reply to confirm or if you have any questions.\n\nMight Logistics`;
      if(!email){ alert('No customer email address is available for this quote.'); return; }
      const gmail=`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmail,'_blank','noopener,noreferrer');
    });
  }

  const previewButton=document.getElementById('previewQuote');
  if(previewButton){
    previewButton.addEventListener('click',function(){
      const logo=document.querySelector('#quotePreviewContent .quote-brand .brand-mark');
      if(logo){
        const img=document.createElement('img');
        img.className='quote-logo';
        img.src='../logo.svg';
        img.alt='Might Logistics';
        logo.replaceWith(img);
      }
    });
  }

  const style=document.createElement('style');
  style.textContent='@media print{#appView,#drawer{display:none!important}.quote-preview{display:block!important;position:static!important}.quote-preview-panel{position:static!important}.quote-document{overflow:visible!important}.quote-paper{page-break-inside:avoid!important}.quote-logo{width:42px;height:42px;display:block}}';
  document.head.appendChild(style);

  if(!document.querySelector('script[data-might-enhancements]')){
    const script=document.createElement('script');
    script.src='enhancements.js?v=2';
    script.dataset.mightEnhancements='1';
    document.body.appendChild(script);
  }

  function setActive(section){
    document.querySelectorAll('nav a[data-section]').forEach(function(a){
      a.classList.toggle('active',a.dataset.section===section);
    });
  }

  function showWorkspace(section){
    const dashboard=document.getElementById('dashboard');
    const customers=document.getElementById('customers');
    const loads=document.getElementById('loads');
    const stats=dashboard?.querySelector('.stats');
    const quotes=document.getElementById('quotes');
    const title=document.getElementById('pageTitle');

    if(section==='quotes'){
      dashboard?.classList.remove('hidden');
      customers?.classList.add('hidden');
      loads?.classList.add('hidden');
      stats?.classList.add('hidden');
      quotes?.classList.add('quotes-workspace');
      setActive('quotes');
      if(title) title.textContent='Quote Requests';
      if(typeof loadQuotes==='function') loadQuotes();
      window.scrollTo({top:0,behavior:'instant'});
      return;
    }

    if(section==='dashboard'){
      dashboard?.classList.remove('hidden');
      customers?.classList.add('hidden');
      loads?.classList.add('hidden');
      stats?.classList.remove('hidden');
      quotes?.classList.remove('quotes-workspace');
      setActive('dashboard');
      if(title) title.textContent='Operations Dashboard';
      window.scrollTo({top:0,behavior:'instant'});
      return;
    }
  }

  document.querySelectorAll('nav a[data-section]').forEach(function(link){
    link.addEventListener('click',function(){
      const section=link.dataset.section;
      if(section==='quotes' || section==='dashboard'){
        setTimeout(function(){showWorkspace(section);},0);
      }
    });
  });
})();
