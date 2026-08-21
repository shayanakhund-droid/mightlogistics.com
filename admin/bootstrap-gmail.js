(function(){
  if(window.__mightGmailLoaded) return;
  window.__mightGmailLoaded=true;
  const script=document.createElement('script');
  script.src='gmail-loader.js?v=1';
  script.async=false;
  document.head.appendChild(script);
})();
