// Premium Homepage Sections with Advanced Aesthetics & Animations
// Optimized for 60fps performance with GPU-accelerated transforms
(function(){
  'use strict';

  // ============= ADVANCED CSS INJECTION =============
  function injectPremiumStyles(){
    if (document.getElementById('premium-sections-css')) return;
    const style = document.createElement('style');
    style.id = 'premium-sections-css';
    style.textContent = `
      /* ========== CATEGORIES SECTION - PREMIUM DESIGN ========== */
      .cat-section,
      .cat-section.bg-gray {
        padding: 3rem 0 2rem;
        background: linear-gradient(180deg, #ffffff 0%, #fafafa 100%) !important;
      }
      
      .categories-slider.owl-carousel {
        display: flex !important;
        flex-wrap: nowrap;
        overflow-x: auto;
        gap: 20px;
        padding: 20px 10px;
        scrollbar-width: thin;
        scrollbar-color: rgba(178, 34, 34, 0.3) rgba(0,0,0,0.05);
        scroll-behavior: smooth;
        -webkit-overflow-scrolling: touch;
      }
      
      .categories-slider.owl-carousel::-webkit-scrollbar {
        height: 6px;
      }
      
      .categories-slider.owl-carousel::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.03);
        border-radius: 10px;
      }
      
      .categories-slider.owl-carousel::-webkit-scrollbar-thumb {
        background: linear-gradient(90deg, #DC143C, #B22222);
        border-radius: 10px;
        transition: background 0.3s ease;
      }
      
      .categories-slider.owl-carousel::-webkit-scrollbar-thumb:hover {
        background: linear-gradient(90deg, #B22222, #8B0000);
      }
      
      .categories-slider .product-category {
        flex: 0 0 auto;
        min-width: 200px;
        opacity: 0;
        transform: translateY(30px);
        animation: categoryFadeIn 0.6s ease forwards;
      }
      
      .categories-slider .product-category a {
        text-decoration: none;
        display: block;
        color: inherit;
        cursor: pointer;
      }
      
      .categories-slider .product-category a:hover {
        text-decoration: none;
      }
      
      .categories-slider .product-category a:focus {
        outline: 2px solid #DC143C;
        outline-offset: 4px;
        border-radius: 50%;
      }
      
      @keyframes categoryFadeIn {
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      .categories-slider .product-category:nth-child(1) { animation-delay: 0.1s; }
      .categories-slider .product-category:nth-child(2) { animation-delay: 0.15s; }
      .categories-slider .product-category:nth-child(3) { animation-delay: 0.2s; }
      .categories-slider .product-category:nth-child(4) { animation-delay: 0.25s; }
      .categories-slider .product-category:nth-child(5) { animation-delay: 0.3s; }
      .categories-slider .product-category:nth-child(6) { animation-delay: 0.35s; }
      .categories-slider .product-category:nth-child(7) { animation-delay: 0.4s; }
      .categories-slider .product-category:nth-child(8) { animation-delay: 0.45s; }
      
      .categories-slider .product-category {
        text-align: center;
      }
      
      .categories-slider .product-category figure {
        position: relative;
        overflow: hidden;
        border-radius: 50%;
        width: 150px;
        height: 150px;
        margin: 0 auto 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.08);
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        background: #f5f5f5;
        border: 3px solid transparent;
        padding: 0;
        line-height: 0;
      }
      
      .categories-slider .product-category:hover figure {
        transform: translateY(-8px);
        box-shadow: 0 15px 40px rgba(220, 20, 60, 0.2);
        border-color: rgba(220, 20, 60, 0.3);
      }
      
      .categories-slider .product-category figure img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        display: block;
        border: none;
        outline: none;
        background: #f5f5f5;
      }
      
      .categories-slider .product-category:hover figure img {
        transform: scale(1.1);
      }
      
      .category-text-content {
        text-align: center;
        color: #2d2d2d;
        padding: 0 8px;
      }
      
      .category-text-content h3 {
        margin: 0 0 4px 0;
        font-size: 1.2rem;
        font-weight: 600;
        color: #1a1a1a;
        letter-spacing: 0;
        line-height: 1.3;
        transition: color 0.3s ease;
      }
      
      .categories-slider .product-category:hover .category-text-content h3 {
        color: #DC143C;
      }
      
      .category-shop-now {
        display: none;
      }
      
      /* ========== PARTNERS SECTION - INFINITE SCROLL ========== */
      .partners-section {
        background: linear-gradient(180deg, #fafafa 0%, #ffffff 100%);
        padding: 3rem 0;
        overflow: hidden;
        position: relative;
      }
      
      .partners-section::before,
      .partners-section::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        width: 150px;
        z-index: 2;
        pointer-events: none;
      }
      
      .partners-section::before {
        left: 0;
        background: linear-gradient(90deg, #ffffff 0%, transparent 100%);
      }
      
      .partners-section::after {
        right: 0;
        background: linear-gradient(270deg, #ffffff 0%, transparent 100%);
      }
      
      .partners-slider-wrapper {
        position: relative;
        overflow: hidden;
        padding: 20px 0;
      }
      
      .partners-slider {
        display: flex !important;
        align-items: center;
        animation: partnersScroll 40s linear infinite;
        will-change: transform;
      }
      
      .partners-slider:hover {
        animation-play-state: paused;
      }
      
      @keyframes partnersScroll {
        0% {
          transform: translateX(0);
        }
        100% {
          transform: translateX(-50%);
        }
      }
      
      .partner-item {
        flex: 0 0 auto;
        padding: 0 40px;
        position: relative;
        opacity: 0;
        animation: partnerFadeIn 0.6s ease forwards;
      }
      
      @keyframes partnerFadeIn {
        to { opacity: 1; }
      }
      
      .partner-item img {
        height: 60px;
        width: auto;
        max-width: 180px;
        filter: grayscale(100%) brightness(0.3) contrast(1.2);
        opacity: 0.5;
        transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        cursor: pointer;
      }
      
      .partner-item:hover img {
        filter: grayscale(0%) brightness(1) contrast(1);
        opacity: 1;
        transform: scale(1.12);
      }
      
      /* ========== COMBO DEALS - PREMIUM CARDS ========== */
      .combo-offers-section {
        padding: 3rem 0;
        background: linear-gradient(180deg, #ffffff 0%, #f9f9f9 100%);
      }
      
      .combo-offers-section .section-title {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin-bottom: 2rem;
        position: relative;
        padding-bottom: 15px;
      }
      
      .combo-offers-section .section-title::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, #DC143C, #B22222);
        border-radius: 2px;
      }
      
      .combo-scroll {
        gap: 24px !important;
        padding: 10px;
        scrollbar-width: thin;
        scrollbar-color: rgba(178, 34, 34, 0.3) rgba(0,0,0,0.05);
      }
      
      .combo-scroll::-webkit-scrollbar {
        height: 8px;
      }
      
      .combo-scroll::-webkit-scrollbar-track {
        background: rgba(0,0,0,0.03);
        border-radius: 10px;
      }
      
      .combo-scroll::-webkit-scrollbar-thumb {
        background: linear-gradient(90deg, #DC143C, #B22222);
        border-radius: 10px;
      }
      
      .combo-card-wrapper {
        opacity: 0;
        transform: translateY(40px) scale(0.95);
        animation: comboCardReveal 0.7s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      }
      
      @keyframes comboCardReveal {
        to {
          opacity: 1;
          transform: translateY(0) scale(1);
        }
      }
      
      .combo-card-wrapper:nth-child(1) { animation-delay: 0.1s; }
      .combo-card-wrapper:nth-child(2) { animation-delay: 0.2s; }
      .combo-card-wrapper:nth-child(3) { animation-delay: 0.3s; }
      .combo-card-wrapper:nth-child(4) { animation-delay: 0.4s; }
      
      .combo-card {
        position: relative;
        border: none !important;
        border-radius: 20px !important;
        overflow: hidden;
        background: #ffffff;
        box-shadow: 0 8px 30px rgba(0, 0, 0, 0.08);
        transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        height: 100%;
      }
      
      .combo-card::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 4px;
        background: linear-gradient(90deg, #DC143C, #FF6B6B, #DC143C);
        background-size: 200% 100%;
        opacity: 0;
        transition: opacity 0.4s ease;
      }
      
      .combo-card:hover {
        transform: translateY(-16px) scale(1.02);
        box-shadow: 0 24px 60px rgba(220, 20, 60, 0.2);
      }
      
      .combo-card:hover::before {
        opacity: 1;
        animation: gradientShift 3s ease infinite;
      }
      
      @keyframes gradientShift {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      
      .combo-card .card-img-top {
        object-fit: cover;
        height: 200px;
        transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        background: linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%);
      }
      
      .combo-card:hover .card-img-top {
        transform: scale(1.1);
      }
      
      .combo-card .card-body {
        padding: 1.5rem !important;
        position: relative;
      }
      
      .combo-card .card-title {
        font-size: 1.05rem !important;
        font-weight: 700;
        color: #2d2d2d;
        min-height: 2.8em;
        line-height: 1.4;
        margin-bottom: 1rem;
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
      }
      
      .combo-price-container {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
      }
      
      .combo-price-new {
        font-size: 1.5rem;
        font-weight: 800;
        color: #DC143C;
        background: linear-gradient(135deg, #DC143C, #B22222);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      
      .combo-price-old {
        font-size: 1rem;
        color: #999;
        text-decoration: line-through;
        opacity: 0.7;
      }
      
      .combo-savings-badge {
        display: inline-block;
        background: linear-gradient(135deg, #FF4444, #CC0000);
        color: #ffffff;
        padding: 8px 16px;
        border-radius: 25px;
        font-size: 0.9rem;
        font-weight: 700;
        box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
        animation: savingsPulse 2s ease-in-out infinite;
        position: relative;
        overflow: hidden;
      }
      
      .combo-savings-badge::before {
        content: '';
        position: absolute;
        top: 50%;
        left: 50%;
        width: 0;
        height: 0;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: translate(-50%, -50%);
        transition: width 0.6s, height 0.6s;
      }
      
      .combo-card:hover .combo-savings-badge::before {
        width: 200px;
        height: 200px;
      }
      
      @keyframes savingsPulse {
        0%, 100% {
          transform: scale(1);
          box-shadow: 0 4px 15px rgba(255, 68, 68, 0.4);
        }
        50% {
          transform: scale(1.05);
          box-shadow: 0 6px 20px rgba(255, 68, 68, 0.6);
        }
      }
      
      .combo-deal-icon {
        position: absolute;
        top: 15px;
        right: 15px;
        background: linear-gradient(135deg, #DC143C, #B22222);
        color: #ffffff;
        width: 50px;
        height: 50px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 1.3rem;
        box-shadow: 0 4px 15px rgba(220, 20, 60, 0.5);
        animation: dealIconRotate 3s ease-in-out infinite;
        z-index: 10;
      }
      
      @keyframes dealIconRotate {
        0%, 100% { 
          transform: rotate(0deg) scale(1); 
          box-shadow: 0 4px 15px rgba(220, 20, 60, 0.5);
        }
        25% { 
          transform: rotate(-10deg) scale(1.1); 
          box-shadow: 0 6px 20px rgba(220, 20, 60, 0.7);
        }
        75% { 
          transform: rotate(10deg) scale(1.1); 
          box-shadow: 0 6px 20px rgba(220, 20, 60, 0.7);
        }
      }
      
      /* ========== RESPONSIVE OPTIMIZATIONS ========== */
      @media (max-width: 768px) {
        .categories-slider .product-category {
          min-width: 120px;
        }
        
        .categories-slider .product-category figure {
          width: 110px;
          height: 110px;
          border-width: 2px;
        }
        
        .category-text-content h3 {
          font-size: 0.85rem;
        }
        
        .partner-item {
          padding: 0 25px;
        }
        
        .partner-item img {
          height: 45px;
        }
        
        .combo-card .card-img-top {
          height: 160px;
        }
        
        .combo-offers-section .section-title {
          font-size: 1.5rem;
        }
        
        .combo-deal-icon {
          width: 40px;
          height: 40px;
          font-size: 1.1rem;
        }
      }
      
      /* ========== PERFORMANCE OPTIMIZATIONS ========== */
      .categories-slider *,
      .partners-slider *,
      .combo-card * {
        will-change: transform;
      }
      
      @media (prefers-reduced-motion: reduce) {
        .categories-slider .product-category,
        .partner-item,
        .combo-card-wrapper {
          animation: none !important;
          transition: none !important;
        }
        
        .partners-slider {
          animation: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // ============= SECTION CREATION =============
  function ensureSections(){
    injectPremiumStyles();
    const container = document.querySelector('.new-products-section .container');
    if (!container) return;
    
    

    // Partners Section
    const catSection = document.querySelector('.cat-section');
    if (catSection && !document.querySelector('.partners-section')){
      const sec = document.createElement('section');
      sec.className = 'partners-section';
      sec.innerHTML = `
        <div class="container">
          <h2 class="section-title text-center mb-4" style="font-size:1.8rem;font-weight:700;color:#1a1a1a;">Trusted by Leading Brands</h2>
          <div class="partners-slider-wrapper">
            <div class="partners-slider" id="js-partners"></div>
          </div>
        </div>`;
      catSection.parentElement.insertBefore(sec, catSection.nextSibling);
    }
  }

  // ============= UTILITY FUNCTIONS =============
  function priceFmt(n){
    return window.formatPrice ? window.formatPrice(n) : `₵${Math.round(n) || 0}`;
  }

  function lazyLoadImage(img, src){
    if ('IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            img.src = src;
            observer.unobserve(img);
          }
        });
      }, { rootMargin: '50px' });
      observer.observe(img);
    } else {
      img.src = src;
    }
  }



  

  // ============= PARTNERS RENDERER =============
  async function renderPartners(){
    const el = document.getElementById('js-partners');
    if (!el) return;
    
    try {
      let res = await fetch('/api/home-assets/partners');
      let data = res.ok ? await res.json() : null;
      
      const partners = (data && data.partners && Array.isArray(data.partners)) ? data.partners : [
        {img:'assets/images/brands/part1.webp', alt:'HP'},
        {img:'assets/images/brands/part2.webp', alt:'Dell'},
        {img:'assets/images/brands/part3.webp', alt:'Epson'},
        {img:'assets/images/brands/part4.webp', alt:'Nutanix'},
        {img:'assets/images/brands/part5.webp', alt:'Ortea'},
        {img:'assets/images/brands/part6.webp', alt:'Papercut'},
        {img:'assets/images/brands/part7.webp', alt:'Vertiv'}
      ];
      
      // Duplicate for infinite scroll effect
      const duplicatedPartners = [...partners, ...partners];
      
      el.innerHTML = '';
      duplicatedPartners.forEach((b, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'partner-item';
        wrapper.style.animationDelay = `${i * 0.1}s`;
        
        const link = document.createElement(b.href ? 'a' : 'span');
        if (b.href) {
          link.href = b.href;
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
        
        const img = document.createElement('img');
        img.alt = b.alt || 'Partner Brand';
        img.style.opacity = '0';
        
        img.addEventListener('load', () => {
          img.style.opacity = '1';
          img.style.transition = 'opacity 0.3s ease';
        });
        
        img.addEventListener('error', () => {
          wrapper.style.display = 'none';
        });
        
        lazyLoadImage(img, b.img);
        
        link.appendChild(img);
        wrapper.appendChild(link);
        el.appendChild(wrapper);
      });
    } catch(e) {
      console.error('Error loading partners:', e);
    }
  }

  // ============= CATEGORIES CAROUSEL ENHANCER =============
  async function enhanceCategoryCarousel(){
    const slider = document.querySelector('.categories-slider.owl-carousel');
    if (!slider) return;
    
    try {
      let res = await fetch('/api/home-assets/categories');
      let data = res.ok ? await res.json() : null;
      
      const cats = (data && Array.isArray(data.categories)) ? data.categories : [
        { id:'laptops', href:'category1.html?category=computing-devices&subcategory=laptops', title:'Laptops', img:'assets/images/categories/laptop.webp"' },
        { id:'ups', href:'category1.html?category=ups&subcategory=ups', title:'UPS & Power', img:'assets/images/categories/ups.webp"' },
        { id:'speakers', href:'category1.html?category=tech-accessories&subcategory=wireless-sound', title:'Speakers', img:'assets/images/categories/speaker.webp"' },
        { id:'gaming', href:'category1.html?category=tech-accessories&subcategory=playhub', title:'Gaming', img:'assets/images/categories/gaming1.webp"' },
        { id:'watches', href:'category1.html?category=tech-accessories&subcategory=smart-watches', title:'Smart Watches', img:'assets/images/categories/watch.webp"' },
        { id:'power-banks', href:'category1.html?category=tech-accessories&subcategory=power-solutions', title:'Power Banks', img:'assets/images/categories/power.webp"' },
        { id:'cables', href:'category1.html?category=tech-accessories&subcategory=tablet-laptop-sleeves', title:'Cables', img:'assets/images/categories/cables1.webp"' },
        { id:'network', href:'category1.html?category=tech-accessories&subcategory=network-switches', title:'Networking', img:'assets/images/categories/network.webp"' },
        { id:'office', href:'category1.html?category=computing-devices&subcategory=workstations', title:'Workstations', img:'assets/images/categories/workstation.webp"' },
        { id:'surge', href:'category1.html?category=tech-accessories&subcategory=power-solutions', title:'Surge Protectors', img:'assets/images/categories/surge.webp"' }
      ];
      
      const itemTpl = (c) => `
        <div class="product-category mb-2">
          <a href="${c.href}">
            <figure>
              <img data-src="${c.img}" alt="${c.title}" class="category-lazy" loading="lazy">
            </figure>
            <div class="category-text-content">
              <h3>${c.title}</h3>
            </div>
          </a>
        </div>`;
      
      slider.innerHTML = cats.map(itemTpl).join('');
      
      // Lazy load category images
      slider.querySelectorAll('.category-lazy').forEach(img => {
        lazyLoadImage(img, img.dataset.src);
      });
      
      // Smooth scroll functionality
      let isDown = false;
      let startX;
      let scrollLeft;
      
      slider.addEventListener('mousedown', (e) => {
        isDown = true;
        slider.style.cursor = 'grabbing';
        startX = e.pageX - slider.offsetLeft;
        scrollLeft = slider.scrollLeft;
      });
      
      slider.addEventListener('mouseleave', () => {
        isDown = false;
        slider.style.cursor = 'grab';
      });
      
      slider.addEventListener('mouseup', () => {
        isDown = false;
        slider.style.cursor = 'grab';
      });
      
      slider.addEventListener('mousemove', (e) => {
        if (!isDown) return;
        e.preventDefault();
        const x = e.pageX - slider.offsetLeft;
        const walk = (x - startX) * 2;
        slider.scrollLeft = scrollLeft - walk;
      });
    } catch(e) {
      console.error('Error enhancing categories:', e);
    }
  }

  // ============= INTERSECTION OBSERVER FOR SCROLL ANIMATIONS =============
  function initScrollAnimations(){
    if (!('IntersectionObserver' in window)) return;
    
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);
    
    // Observe sections
    document.querySelectorAll('.partners-section').forEach(section => {
      observer.observe(section);
    });
  }

  // ============= INITIALIZATION =============
  document.addEventListener('DOMContentLoaded', function(){
    ensureSections();
    
    // Use requestAnimationFrame for smooth initialization
    requestAnimationFrame(() => {
      
      renderPartners();
      enhanceCategoryCarousel();
      initScrollAnimations();
    });
    
    // Add smooth scroll behavior
    document.documentElement.style.scrollBehavior = 'smooth';
  });
})();