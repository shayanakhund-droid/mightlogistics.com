const b=document.querySelector('.mobile-btn'),p=document.querySelector('.mobile-panel');if(b&&p)b.addEventListener('click',()=>p.classList.toggle('open'));document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}));const items=document.querySelectorAll('.reveal');if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.12});items.forEach(x=>io.observe(x))}else{items.forEach(x=>x.classList.add('show'))}

// Might Logistics site-wide USA coverage and contact details.
const replaceText=(root)=>{const w=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);const nodes=[];while(w.nextNode())nodes.push(w.currentNode);nodes.forEach(n=>{if(!n.parentElement.closest('script,style,noscript'))n.nodeValue=n.nodeValue.replace(/North America/g,'United States').replace(/North American/g,'U.S.')})};
replaceText(document.body);
if(document.title)document.title=document.title.replace(/North America/g,'United States').replace(/North American/g,'U.S.');
const desc=document.querySelector('meta[name="description"]');if(desc)desc.content=desc.content.replace(/North America/g,'United States').replace(/North American/g,'U.S.');

// Add a consistent contact block to interior-page footers that do not yet have one.
const footerGrid=document.querySelector('.footer-grid');if(footerGrid&&!footerGrid.querySelector('.site-contact')){const c=document.createElement('div');c.className='site-contact';c.innerHTML='<h4>Contact</h4><a href="mailto:info@mightlogistics.com">info@mightlogistics.com</a><span class="footer-contact">2451 W. Grapevine Mills Circle<br>Grapevine, TX 76051<br>United States</span>';footerGrid.appendChild(c)}

// Local 4K hero video uploaded to the Might Logistics repository.
const heroBg=document.querySelector('.hero-bg');
if(heroBg){
  heroBg.style.backgroundImage='none';
  const video=document.createElement('video');
  video.className='hero-video';
  video.autoplay=true;
  video.muted=true;
  video.loop=true;
  video.playsInline=true;
  video.setAttribute('aria-hidden','true');
  video.preload='auto';
  video.poster='https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?auto=format&fit=crop&w=2200&q=88';
  video.style.cssText='position:absolute;inset:0;width:100%;height:100%;object-fit:cover;z-index:0;pointer-events:none;';
  const source=document.createElement('source');
  source.src='hero-video.mp4?v=5';
  source.type='video/mp4';
  video.appendChild(source);
  heroBg.appendChild(video);
  const shade=document.createElement('div');
  shade.style.cssText='position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(6,16,29,.98) 0%,rgba(6,16,29,.88) 42%,rgba(6,16,29,.52) 72%,rgba(6,16,29,.3) 100%);';
  heroBg.appendChild(shade);
  video.play().catch(()=>{});
}