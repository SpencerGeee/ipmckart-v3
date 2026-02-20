// Phase 5: Reduce hero height, add header social icons + WhatsApp, and videos section hook
(function(){
  'use strict';

  function injectHeroHeightCSS(){
    if (document.getElementById('hero-height-css')) return;
    const css = `
      .home-slider .home-slide { max-height: 500px !important; }
      .home-slider .home-slide .slide-bg, .home-slider .home-slide picture, .home-slider .home-slide img{ height: 100%; }
      @media (max-width: 992px) { .home-slider .home-slide { max-height: 400px !important; } }
      @media (max-width: 768px) { .home-slider .home-slide { max-height: 300px !important; } }
      .home-slider .home-slide img { object-fit: cover; }
      .header .header-right .header-social-icons a { margin-left: 10px; display:inline-flex; align-items:center; justify-content:center; width:32px; height:32px; border-radius:50%; transition: transform .2s ease; }
      .header .header-right .header-social-icons a:hover { transform: translateY(-2px); }
      .header .header-right .header-social-icons .whatsapp-icon { background:#25D366; color:#fff; }
    `;
    const style = document.createElement('style');
    style.id = 'hero-height-css';
    style.textContent = css;
    document.head.appendChild(style);
  }

  function addHeaderSocial(){
    const headerRight = document.querySelector('.header .header-right');
    if (!headerRight) return;
    if (headerRight.querySelector('.header-social-icons')) return;
    const wrap = document.createElement('div');
    wrap.className='header-social-icons d-none d-md-flex align-items-center mr-2';
    wrap.innerHTML = `
      <a href="https://wa.me/233531005871" class="whatsapp-icon" target="_blank" rel="noopener" aria-label="Chat on WhatsApp"><i class="fab fa-whatsapp"></i></a>
      <a href="https://www.facebook.com/IPMCKart/" target="_blank" rel="noopener" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
      <a href="https://x.com/ipmckart" target="_blank" rel="noopener" aria-label="Twitter/X"><i class="fab fa-x-twitter"></i></a>
      <a href="https://www.linkedin.com/company/ipmc-kart/" target="_blank" rel="noopener" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
    `;
    headerRight.insertBefore(wrap, headerRight.firstChild);
  }

  function addVideosSection(){
    if (document.querySelector('.product-videos-section')) return;
    const footer = document.querySelector('footer');
    if (!footer) return;
    const sec = document.createElement('section');
    sec.className = 'product-videos-section py-4';
    sec.innerHTML = `
      <div class="container">
        <h2 class="section-title">Products in Action</h2>
        <div class="video-grid row" id="js-video-grid"></div>
      </div>`;
    footer.parentElement.insertBefore(sec, footer);
  }

  document.addEventListener('DOMContentLoaded', function(){
    injectHeroHeightCSS();
    addHeaderSocial();
    // videos section scaffold (you can place MP4s later)
    addVideosSection();
  });
})();