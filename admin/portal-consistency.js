(function(){
  if(window.mightPortalConsistencyLoaded)return;
  window.mightPortalConsistencyLoaded=true;
  const style=document.createElement('style');
  style.id='mightPortalConsistencyStyles';
  style.textContent=`
    :root{--might-brand:#176fbe;--might-brand-dark:#0d2338;--might-line:#d8e0e8;--might-text:#172033;--might-muted:#66768a;--might-surface:#fff;--might-bg:#f4f6f8}
    #appView button,#appView input,#appView select,#appView textarea{font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}
    #appView button{box-sizing:border-box}
    #appView .primary,#appView button.primary{height:38px;padding:0 15px;border:1px solid var(--might-brand);border-radius:9px;background:var(--might-brand);color:#fff;font-size:12px;font-weight:800;line-height:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 2px 5px rgba(23,111,190,.14);transition:background .16s,border-color .16s,transform .16s,box-shadow .16s}
    #appView .primary:hover,#appView button.primary:hover{background:#125f9f;border-color:#125f9f;transform:translateY(-1px);box-shadow:0 5px 12px rgba(23,111,190,.18)}
    #appView .outline,#appView button.outline{height:38px;padding:0 14px;border:1px solid var(--might-line);border-radius:9px;background:#fff;color:#243548;font-size:12px;font-weight:750;line-height:1;display:inline-flex;align-items:center;justify-content:center;gap:7px;box-shadow:0 1px 2px rgba(13,35,56,.03);transition:background .16s,border-color .16s,color .16s,transform .16s,box-shadow .16s}
    #appView .outline:hover,#appView button.outline:hover{background:#f7fafd;border-color:#b9c8d7;color:var(--might-brand-dark);transform:translateY(-1px);box-shadow:0 4px 10px rgba(13,35,56,.06)}
    #appView .ghost{height:38px;padding:0 14px;border:1px solid #27445c;border-radius:9px;background:transparent;color:#a8b8c8;font-size:12px;font-weight:750;display:inline-flex;align-items:center;justify-content:center}
    #appView .controls,#appView .loads-toolbar{display:flex;align-items:center;gap:8px;flex-wrap:nowrap}
    #appView .controls input,#appView .controls select,#appView .loads-toolbar input,#appView .loads-toolbar select{height:38px;margin:0;border:1px solid var(--might-line);border-radius:9px;background:#fff;color:var(--might-text);padding:0 12px;font-size:12px;outline:0;box-shadow:none}
    #appView .controls input:focus,#appView .controls select:focus,#appView .loads-toolbar input:focus,#appView .loads-toolbar select:focus{border-color:#7eb4df;box-shadow:0 0 0 3px rgba(23,111,190,.10)}
    #appView .table-wrap button:not(.primary):not(.outline):not(.ghost),#appView td button{height:30px;padding:0 11px;border:1px solid #cbd6e1;border-radius:999px;background:#fff;color:#34495e;font-size:11px;font-weight:750;line-height:1;display:inline-flex;align-items:center;justify-content:center;box-shadow:none;transition:background .15s,border-color .15s,color .15s,transform .15s}
    #appView .table-wrap td button:hover{background:#f4f8fb;border-color:#9eb4c9;color:var(--might-brand-dark);transform:translateY(-1px)}
    #appView .table-wrap td button.primary{height:30px;border-radius:999px;padding:0 12px}
    #appView .table-wrap td .danger,#appView .table-wrap td button[data-action="delete"]{color:#a62d2d;border-color:#efc8c8}
    #appView .table-wrap td .danger:hover,#appView .table-wrap td button[data-action="delete"]:hover{background:#fff3f3;border-color:#dfaaaa;color:#8f2323}
    #appView .panel-head{min-height:92px;align-items:center;padding:20px 22px}
    #appView .panel-head h3{font-weight:800;color:var(--might-text)}
    #appView .panel-subtitle{color:var(--might-muted);font-size:12px;line-height:1.5;margin:5px 0 0}
    #appView table thead th{height:44px;background:#f8fafc;font-weight:800;color:#718096;border-bottom:1px solid #dfe6ed;white-space:nowrap}
    #appView table tbody tr{transition:background .14s}
    #appView table tbody tr:hover{background:#f8fbfd}
    #appView table tbody td{height:58px}
    #appView .status{border:1px solid transparent}
    .might-consistency-toast{position:fixed;right:22px;bottom:22px;z-index:5000;min-width:280px;max-width:420px;padding:13px 15px;border:1px solid #dce4eb;border-radius:11px;background:#fff;color:#243548;box-shadow:0 16px 40px rgba(13,35,56,.16);font-size:12px;font-weight:650;opacity:0;transform:translateY(8px);transition:.2s;pointer-events:none}
    .might-consistency-toast.show{opacity:1;transform:none}
    .might-consistency-toast.error{border-color:#efc8c8;color:#8f2323}
    .might-consistency-toast.success{border-color:#c6e5d5;color:#176a43}
    @media(max-width:900px){#appView .controls,#appView .loads-toolbar{flex-wrap:wrap}#appView .controls input,#appView .loads-toolbar input{flex:1;min-width:170px}}
    @media(max-width:560px){#appView .controls,#appView .loads-toolbar{width:100%}#appView .controls>* ,#appView .loads-toolbar>*{flex:1;min-width:100px}}
  `;
  document.head.appendChild(style);

  function toast(message,type='success'){
    let el=document.getElementById('mightConsistencyToast');
    if(!el){el=document.createElement('div');el.id='mightConsistencyToast';el.className='might-consistency-toast';document.body.appendChild(el)}
    el.textContent=message;el.className=`might-consistency-toast ${type} show`;
    clearTimeout(el._timer);el._timer=setTimeout(()=>el.classList.remove('show'),3200);
  }
  window.mightToast=toast;
})();
