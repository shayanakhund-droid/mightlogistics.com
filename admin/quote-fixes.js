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
  const style=document.createElement('style');
  style.textContent='@media print{#appView,#drawer{display:none!important}.quote-preview{display:block!important;position:static!important}.quote-preview-panel{position:static!important}.quote-document{overflow:visible!important}.quote-paper{page-break-inside:avoid!important}}';
  document.head.appendChild(style);
})();
