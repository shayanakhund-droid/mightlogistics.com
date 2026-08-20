(function(){
  if(window.mightDashboardThemeLoaded)return; window.mightDashboardThemeLoaded=true;
  const style=document.createElement('style'); style.id='mightDashboardTheme'; style.textContent=`
    /* Might Logistics brand palette */
    #dashboardV2{--brand:#176fbe;--brand-dark:#0d2338;--success:#25ad75;--warning:#d88a16;--danger:#c63b3b;--muted:#667382;--line:#e2e7ec;--surface:#fff;}

    /* The old dashboard was sitting underneath the new interactive overview.
       Keep the new dashboard as the single source of truth so there is no blank/duplicate area. */
    #dashboard> :not(#dashboardV2){display:none!important}
    #dashboardV2{margin-bottom:0}

    #dashboardV2 .v2-filter{background:#f8fafc;border:1px solid var(--line);border-radius:10px;padding:6px 7px;box-shadow:0 3px 12px rgba(13,35,56,.05)}
    #dashboardV2 .v2-filter label{padding-left:7px;color:var(--muted)}
    #dashboardV2 .v2-filter select{border:0;background:transparent;box-shadow:none;outline:0;font-weight:750;color:var(--brand-dark);min-width:155px;cursor:pointer}
    #dashboardV2 .v2-filter button{width:38px;height:38px;padding:0;border:0;border-radius:9px;background:var(--brand-dark);color:#fff;font-size:18px;line-height:1;transition:transform .2s,background .2s;box-shadow:0 4px 10px rgba(13,35,56,.16)}
    #dashboardV2 .v2-filter button:hover{background:var(--brand);transform:rotate(20deg) scale(1.04)}

    #dashboardV2 .v2-card{position:relative;overflow:hidden;border:1px solid var(--line);box-shadow:0 3px 12px rgba(13,35,56,.035)}
    #dashboardV2 .v2-card:after{content:'›';position:absolute;right:15px;top:50%;transform:translateY(-50%) translateX(4px);font-size:22px;color:#94a3b8;opacity:0;transition:.2s}
    #dashboardV2 .v2-card:hover{transform:translateY(-4px);border-color:#b8cddd;box-shadow:0 14px 30px rgba(13,35,56,.09)}
    #dashboardV2 .v2-card:hover:after{opacity:1;transform:translateY(-50%) translateX(0);color:var(--brand)}
    #dashboardV2 .v2-card strong{letter-spacing:-.03em;color:var(--brand-dark)}
    #dashboardV2 .v2-card[data-v2-card="quotes"] strong{color:var(--brand)}
    #dashboardV2 .v2-card[data-v2-card="active"] strong{color:#168ba4}
    #dashboardV2 .v2-card[data-v2-card="revenue"] strong{color:var(--success)}
    #dashboardV2 .v2-card[data-v2-card="margin"] strong{color:var(--brand)}
    #dashboardV2 .v2-card[data-v2-card="booked"] strong{color:var(--warning)}
    #dashboardV2 .v2-card[data-v2-card="delivered"] strong{color:var(--success)}
    #dashboardV2 .v2-card[data-v2-card="allQuotes"] strong{color:var(--muted)}
    #dashboardV2 .v2-card[data-v2-card="allLoads"] strong{color:var(--brand-dark)}

    #dashboardV2 .v2-panel{box-shadow:0 3px 14px rgba(13,35,56,.035)}
    #dashboardV2 .v2-bar-btn{border-radius:10px;transition:background .18s,transform .18s}
    #dashboardV2 .v2-bar-btn:hover{background:#f5f8fc;transform:translateY(-2px)}
    #dashboardV2 .v2-bar-btn:focus-visible,#dashboardV2 .v2-card:focus-visible,#dashboardV2 .v2-legend button:focus-visible{outline:3px solid rgba(23,111,190,.18);outline-offset:2px}
    #dashboardV2 .v2-bar{box-shadow:0 5px 12px rgba(13,35,56,.12);transition:height .55s cubic-bezier(.2,.8,.2,1),transform .2s,filter .2s}
    #dashboardV2 .v2-bar-btn:nth-child(1) .v2-bar{background:#94a3b8}
    #dashboardV2 .v2-bar-btn:nth-child(2) .v2-bar{background:#176fbe}
    #dashboardV2 .v2-bar-btn:nth-child(3) .v2-bar{background:#0d2338}
    #dashboardV2 .v2-bar-btn:nth-child(4) .v2-bar{background:#d88a16}
    #dashboardV2 .v2-bar-btn:nth-child(5) .v2-bar{background:#168ba4}
    #dashboardV2 .v2-bar-btn:nth-child(6) .v2-bar{background:#25ad75}
    #dashboardV2 .v2-bar-btn:nth-child(7) .v2-bar{background:#25ad75}
    #dashboardV2 .v2-bar-btn:nth-child(8) .v2-bar{background:#647383}
    #dashboardV2 .v2-bar-btn:hover .v2-bar{filter:brightness(1.05);opacity:1}
    #dashboardV2 .v2-bar-value{color:#243548}
    #dashboardV2 .v2-legend button{border:1px solid transparent;transition:.18s;padding:9px 10px;color:#334252}
    #dashboardV2 .v2-legend button:hover{background:#f5f8fc;border-color:#e2e8f0;transform:translateX(2px)}
    #dashboardV2 .v2-legend button strong{color:var(--brand-dark)}
    #dashboardV2 .v2-donut{box-shadow:0 8px 22px rgba(13,35,56,.08);transition:transform .25s,box-shadow .25s}
    #dashboardV2 .v2-donut:hover{transform:scale(1.025);box-shadow:0 12px 30px rgba(13,35,56,.12)}
    #dashboardV2 .v2-modal-card{animation:dashboardModalIn .24s ease-out;box-shadow:0 30px 90px rgba(13,35,56,.24)}
    #dashboardV2 .v2-item{transition:transform .15s,background .15s,border-color .15s;box-shadow:0 2px 6px rgba(13,35,56,.025)}
    #dashboardV2 .v2-item:hover{transform:translateX(3px);background:#f7faff;border-color:#cbdcf3}
    @keyframes dashboardModalIn{from{opacity:0;transform:translateY(12px) scale(.985)}to{opacity:1;transform:none}}
  `; document.head.appendChild(style);
  const palette=['#94a3b8','#176fbe','#0d2338','#d88a16','#168ba4','#25ad75','#25ad75'];
  function recolor(){
    const root=document.getElementById('dashboardV2'); if(!root)return;
    root.querySelectorAll('.v2-bar').forEach((bar,i)=>bar.style.background=palette[i%palette.length]);
    const donut=root.querySelector('.v2-donut'); if(donut){const buttons=[...root.querySelectorAll('.v2-legend button')];let total=buttons.reduce((a,b)=>a+(Number(b.querySelector('strong')?.textContent)||0),0);if(!total)total=1;let angle=0;const stops=buttons.map((b,i)=>{const n=Number(b.querySelector('strong')?.textContent)||0;const start=angle;angle+=n/total*360;return `${palette[i%palette.length]} ${start}deg ${angle}deg`;});donut.style.background=`conic-gradient(${stops.join(',')})`;}}
  }
  const observer=new MutationObserver(recolor); observer.observe(document.documentElement,{childList:true,subtree:true}); setTimeout(recolor,100); setTimeout(recolor,700);
})();