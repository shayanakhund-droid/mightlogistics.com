const b=document.querySelector('.mobile-btn'),p=document.querySelector('.mobile-panel');if(b&&p)b.addEventListener('click',()=>p.classList.toggle('open'));document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const t=document.querySelector(a.getAttribute('href'));if(t){e.preventDefault();t.scrollIntoView({behavior:'smooth'})}}));const items=document.querySelectorAll('.reveal');if('IntersectionObserver' in window){const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target)}}),{threshold:.12});items.forEach(x=>io.observe(x))}else{items.forEach(x=>x.classList.add('show'))}

// Reliable cinematic trucking background. Wikimedia Commons hosts this openly licensed road-transport footage.
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
  source.src='https://commons.wikimedia.org/wiki/Special:Redirect/file/Passing_Truck_by_Train.webm';
  source.type='video/webm';
  video.appendChild(source);
  heroBg.appendChild(video);
  const shade=document.createElement('div');
  shade.style.cssText='position:absolute;inset:0;z-index:1;pointer-events:none;background:linear-gradient(90deg,rgba(6,16,29,.98) 0%,rgba(6,16,29,.88) 42%,rgba(6,16,29,.52) 72%,rgba(6,16,29,.3) 100%);';
  heroBg.appendChild(shade);
  video.play().catch(()=>{});
}