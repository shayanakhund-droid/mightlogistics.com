(function(){
  if(window.__mightGmailLoaded) return;
  window.__mightGmailLoaded=true;
  ['gmail-loader.js?v=2','gmail-workspace.js?v=1'].forEach((src)=>{
    const script=document.createElement('script');
    script.src=src;
    script.async=false;
    document.head.appendChild(script);
  });
})();
