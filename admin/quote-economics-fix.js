(function(){
  if(window.mightQuoteEconomicsFixLoaded)return;
  window.mightQuoteEconomicsFixLoaded=true;

  const money=v=>Number(v||0).toLocaleString('en-US',{style:'currency',currency:'USD'});

  function calculate(){
    const carrier=document.getElementById('carrierRate');
    const customer=document.getElementById('customerRate');
    const amount=document.getElementById('marginAmount');
    const percent=document.getElementById('marginPercent');
    const badge=document.getElementById('marginBadge');
    if(!carrier||!customer||!amount||!percent)return null;

    const carrierRate=Number.parseFloat(carrier.value)||0;
    const customerRate=Number.parseFloat(customer.value)||0;
    const grossMargin=customerRate-carrierRate;
    const marginPercent=customerRate>0?(grossMargin/customerRate)*100:0;

    amount.textContent=money(grossMargin);
    percent.textContent=marginPercent.toFixed(1)+'%';
    if(badge)badge.textContent='Margin '+marginPercent.toFixed(1)+'%';

    return {carrierRate,customerRate,grossMargin,marginPercent};
  }

  async function persist(values){
    const db=window.mightDb;
    if(!db||!values)return;

    const title=document.getElementById('drawerTitle')?.textContent?.trim()||'';
    const match=title.match(/(\d+)$/);
    if(!match)return;
    const quoteNumber=Number(match[1]);
    if(!Number.isFinite(quoteNumber))return;

    const {data,error}=await db
      .from('quote_requests')
      .update({
        carrier_rate:values.carrierRate,
        customer_rate:values.customerRate,
        margin:values.marginPercent
      })
      .eq('quote_number',quoteNumber)
      .select('id')
      .maybeSingle();

    if(error){
      console.error('Quote economics save failed:',error);
      return;
    }

    if(data){
      const message=document.getElementById('saveMessage');
      if(message){
        message.textContent='Saved pricing and margin.';
        message.className='save-message success';
        setTimeout(()=>{if(message.textContent==='Saved pricing and margin.')message.textContent=''},2200);
      }
    }
  }

  function bind(){
    const carrier=document.getElementById('carrierRate');
    const customer=document.getElementById('customerRate');
    if(!carrier||!customer){return false}
    if(carrier.dataset.economicsBound==='1')return true;
    carrier.dataset.economicsBound='1';
    customer.dataset.economicsBound='1';
    ['input','change','keyup'].forEach(evt=>{
      carrier.addEventListener(evt,calculate);
      customer.addEventListener(evt,calculate);
    });
    calculate();
    return true;
  }

  document.addEventListener('click',function(e){
    const save=e.target.closest?.('#saveQuote');
    if(!save)return;
    const values=calculate();
    if(values)persist(values);
  },true);

  const observer=new MutationObserver(()=>bind());
  function init(){
    bind();
    observer.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init);else init();

  window.mightQuoteEconomics={calculate,persist};
})();
