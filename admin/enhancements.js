(function(){
  const PHONE_SELECTOR='input[id*="phone" i],input[name*="phone" i],input[autocomplete="tel"]';
  const EQUIPMENT_OPTIONS=[
    'Dry Van','Reefer','Power Only','Straight Truck','16 ft Box Truck','24 ft Box Truck','26 ft Box Truck',
    'Sprinter Van','Cargo Van','48 ft Van','53 ft Van','Flatbed','48 ft Flatbed','53 ft Flatbed','Step Deck',
    'Conestoga','Double Drop','RGN / Removable Gooseneck','Lowboy','Flatbed Hotshot 40 ft','Flatbed Hotshot 30 ft',
    'Hotshot 20 ft','Hotshot 16 ft','Hotshot','LTL','Expedited','Intermodal','Container','Tanker','Dry Bulk / Hopper',
    'Dump Trailer','End Dump','Walking Floor','B-Train','Curtain Side','Car Hauler / Auto Transport',
    'Refrigerated Straight Truck','Box Truck with Liftgate','Cargo Van with Liftgate','Other'
  ];

  function digits(value){
    let d=String(value||'').replace(/\D/g,'');
    if(d.length===11&&d[0]==='1') d=d.slice(1);
    return d.slice(0,10);
  }
  function formatPhone(value){
    const d=digits(value);
    if(!d)return '';
    if(d.length<4)return `(${d}`;
    if(d.length<7)return `(${d.slice(0,3)}) ${d.slice(3)}`;
    return `(${d.slice(0,3)}) ${d.slice(3,6)}-${d.slice(6)}`;
  }
  function formatPhoneInputs(root=document){
    root.querySelectorAll?.(PHONE_SELECTOR).forEach(input=>{
      input.setAttribute('inputmode','tel');
      input.setAttribute('maxlength','14');
      input.setAttribute('placeholder','(XXX) XXX-XXXX');
      if(!input.dataset.phoneEnhanced){
        input.dataset.phoneEnhanced='1';
        input.addEventListener('input',()=>{ const start=input.selectionStart; input.value=formatPhone(input.value); if(document.activeElement===input) input.setSelectionRange(input.value.length,input.value.length); });
        if(input.value) input.value=formatPhone(input.value);
      }
    });
  }
  function formatPhoneLinks(root=document){
    root.querySelectorAll?.('a[href^="tel:"]').forEach(a=>{
      const formatted=formatPhone(a.textContent);
      if(formatted){ a.textContent=formatted; a.setAttribute('href',`tel:+1${digits(a.textContent)}`); }
    });
  }

  function setupEquipment(){
    const input=document.getElementById('load_equipment');
    if(!input||input.dataset.equipmentEnhanced)return;
    const select=document.createElement('select');
    select.id=input.id; select.name=input.name||'equipment'; select.className=input.className; select.required=input.required;
    select.innerHTML='<option value="">Select equipment</option>'+EQUIPMENT_OPTIONS.map(x=>`<option>${x}</option>`).join('');
    input.replaceWith(select);
    select.dataset.equipmentEnhanced='1';
  }

  function setupLocationAutocomplete(input){
    if(!input||input.dataset.locationEnhanced)return;
    input.dataset.locationEnhanced='1';
    const parent=input.parentElement;
    if(parent) parent.style.position='relative';
    const menu=document.createElement('div');
    menu.className='location-suggestions';
    menu.style.cssText='position:absolute;left:0;right:0;top:calc(100% + 3px);z-index:200;background:#fff;border:1px solid #d9dee8;border-radius:9px;box-shadow:0 14px 35px rgba(0,0,0,.14);overflow:hidden;display:none;text-transform:none;letter-spacing:0;font-weight:500;';
    parent?.appendChild(menu);
    let timer=null, controller=null, results=[];
    function close(){menu.style.display='none';menu.innerHTML='';}
    function choose(item){
      input.value=item.label;
      close();
    }
    async function search(){
      const q=input.value.trim();
      if(q.length<2){close();return;}
      if(controller)controller.abort();
      controller=new AbortController();
      try{
        const url=`https://photon.komoot.io/api/?q=${encodeURIComponent(q)}&limit=8&countrycode=US&bbox=-125,24,-66,50&layer=city&layer=locality&lang=en`;
        const response=await fetch(url,{signal:controller.signal});
        if(!response.ok)throw new Error('Location search failed');
        const data=await response.json();
        results=(data.features||[]).map(f=>f.properties||{}).filter(p=>p.name&&String(p.countrycode||'US').toUpperCase()==='US').map(p=>{
          const city=p.name || p.city || p.locality;
          const state=p.state || '';
          return {label:state?`${city}, ${state}`:city};
        }).filter((v,i,a)=>a.findIndex(x=>x.label.toLowerCase()===v.label.toLowerCase())===i);
        if(!results.length){close();return;}
        menu.innerHTML=results.map((r,i)=>`<button type="button" data-index="${i}" style="display:block;width:100%;padding:10px 12px;border:0;border-bottom:1px solid #eef1f5;background:#fff;text-align:left;font:inherit;color:#172033;cursor:pointer">${r.label}</button>`).join('');
        menu.style.display='block';
        menu.querySelectorAll('button').forEach(b=>b.addEventListener('mousedown',e=>{e.preventDefault();choose(results[Number(b.dataset.index)]);}));
      }catch(e){if(e.name!=='AbortError')close();}
    }
    input.addEventListener('input',()=>{clearTimeout(timer);timer=setTimeout(search,300);});
    input.addEventListener('focus',()=>{if(input.value.trim().length>=2){clearTimeout(timer);timer=setTimeout(search,50);}});
    document.addEventListener('click',e=>{if(!parent?.contains(e.target))close();});
  }

  function setupLoads(){
    setupEquipment();
    setupLocationAutocomplete(document.getElementById('load_origin'));
    setupLocationAutocomplete(document.getElementById('load_destination'));
    formatPhoneInputs(document);
  }

  function init(){
    setupLoads();
    formatPhoneInputs(document);
    formatPhoneLinks(document);
    const observer=new MutationObserver(()=>{
      setupLoads();
      formatPhoneInputs(document);
      formatPhoneLinks(document);
    });
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();
})();
