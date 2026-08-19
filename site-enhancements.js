(function(){
  function digits(value){
    let d=String(value||'').replace(/\D/g,'');
    if(d.length===11&&d[0]==='1')d=d.slice(1);
    return d.slice(0,10);
  }
  function formatPhone(value){
    const d=digits(value); if(!d)return '';
    if(d.length<4)return `(${d}`;
    if(d.length<7)return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }
  function apply(){
    document.querySelectorAll('input[id*="phone" i],input[name*="phone" i],input[autocomplete="tel"]').forEach(input=>{
      input.setAttribute('inputmode','tel');
      input.setAttribute('maxlength','14');
      input.setAttribute('placeholder','(XXX) XXX-XXXX');
      if(!input.dataset.phoneEnhanced){
        input.dataset.phoneEnhanced='1';
        input.addEventListener('input',()=>{input.value=formatPhone(input.value);});
        if(input.value)input.value=formatPhone(input.value);
      }
    });
    document.querySelectorAll('a[href^="tel:"]').forEach(a=>{
      const formatted=formatPhone(a.textContent);
      if(formatted){a.textContent=formatted;a.href=`tel:+1${digits(formatted)}`;}
    });
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',apply);else apply();
})();
