(function(){'use strict';const config={staggerDelay:100,observerThreshold:0.2,parallaxIntensity:0.3,transitionDuration:800};const prefersReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;if(!prefersReducedMotion){document.addEventListener('DOMContentLoaded',initAnimations)}else{document.addEventListener('DOMContentLoaded',()=>{document.querySelectorAll('[style*="opacity: 0"]').forEach(el=>{el.style.opacity='1';el.style.transform='none'})})}
function initAnimations(){if(typeof AOS!=='undefined'){AOS.init({duration:config.transitionDuration,easing:'ease-in-out',once:!0,delay:config.staggerDelay,offset:100})}else{console.warn('AOS library not loaded. Falling back to basic animations.');setupFallbackAnimations()}
setupCounterAnimations();setupParallaxEffects();setupTextRevealAnimations()}
function setupFallbackAnimations(){const elements=document.querySelectorAll('[data-aos]');elements.forEach(el=>{el.style.opacity='1';el.style.transform='none';el.style.transition=`all ${config.transitionDuration / 1000}s ease-in-out`})}
function setupCounterAnimations(){const counters=document.querySelectorAll('.stat-number');if(!counters.length)return;const valueMap={'200K+':200000,'1800+':1800,'24/7':24,'265+':265,'99%':99};const animateCounter=(counter,startTime,target,displayValue)=>{const duration=config.transitionDuration;const elapsed=Date.now()-startTime;const progress=Math.min(elapsed/duration,1);const current=progress*target;if(displayValue.includes('K+')){counter.textContent=Math.ceil(current/1000)+'K+'}else if(displayValue.includes('+')){counter.textContent=Math.ceil(current)+'+'}else if(displayValue.includes('%')){counter.textContent=Math.ceil(current)+'%'}else if(displayValue.includes('/')){counter.textContent=displayValue}else{counter.textContent=Math.ceil(current)}
if(progress<1){requestAnimationFrame(()=>animateCounter(counter,startTime,target,displayValue))}else{counter.textContent=displayValue}};const observer=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){const counter=entry.target;const originalText=counter.textContent.trim();let target=valueMap[originalText];if(!target){const numMatch=originalText.match(/\d+/);if(numMatch){target=parseInt(numMatch[0],10)}else{target=0}}
if(target>0&&!isNaN(target)){counter.setAttribute('data-target',target.toString());counter.textContent='0';animateCounter(counter,Date.now(),target,originalText)}
observer.unobserve(counter)}})},{threshold:0.5});counters.forEach(counter=>observer.observe(counter))}
function setupParallaxEffects(){const hero=document.querySelector('.about-hero');if(!hero)return;let ticking=!1;function onScroll(){const scrolled=window.pageYOffset||document.documentElement.scrollTop||0;hero.style.transform=`translateY(${scrolled * config.parallaxIntensity}px)`}
const handler=(window.Utils&&window.Utils.throttle)?window.Utils.throttle(onScroll,100):()=>{if(!ticking){ticking=!0;requestAnimationFrame(()=>{onScroll();ticking=!1})}};window.addEventListener('scroll',handler,{passive:!0});onScroll()}
function setupTextRevealAnimations(){const headings=document.querySelectorAll('.section-title, h2, h3');headings.forEach(heading=>{const text=heading.textContent.trim();heading.textContent='';heading.style.opacity='1';if(text.includes(' ')){const words=text.split(/\s+/);words.forEach((word,index)=>{const span=document.createElement('span');span.textContent=word;span.style.display='inline-block';span.style.opacity='0';span.style.transform='translateY(25px)';span.style.transition=`all ${config.transitionDuration / 1000}s ease-in-out ${index * 0.08}s`;heading.appendChild(span);if(index<words.length-1){heading.appendChild(document.createTextNode(' '))}})}else{const letters=text.split('');letters.forEach((letter,index)=>{const span=document.createElement('span');span.textContent=letter;span.style.display='inline-block';span.style.opacity='0';span.style.transform='translateY(25px)';span.style.transition=`all ${config.transitionDuration / 1000}s ease-in-out ${index * 0.03}s`;heading.appendChild(span)})}
const observer=new IntersectionObserver((entries)=>{entries.forEach(entry=>{if(entry.isIntersecting){const spans=entry.target.querySelectorAll('span');spans.forEach(span=>{span.style.opacity='1';span.style.transform='translateY(0)'});observer.unobserve(entry.target)}})},{threshold:0.3});observer.observe(heading)})}
const animations=document.createElement('style');animations.textContent=`
        .animate-in {
            opacity: 1 !important;
            transform: translateY(0) !important;
        }
        .section-title {
            font-size: 2.5rem;
            font-weight: 200;
            line-height: 1.2;
            margin-bottom: 1.5rem;
        }
        h2 {
            font-size: 2rem;
            font-weight: 300;
            line-height: 1.3;
            margin-bottom: 1.2rem;
        }
        h3 {
            font-size: 2.8rem;
            font-weight: 500;
            line-height: 1.4;
            margin-bottom: 1rem;
        }
        /* Ensure text spacing is preserved */
        .section-title, h2, h3 {
            white-space: normal;
            word-spacing: normal;
            letter-spacing: normal;
        }
        * {
            transition-timing-function: ease-in-out;
        }
    `;document.head.appendChild(animations)})()