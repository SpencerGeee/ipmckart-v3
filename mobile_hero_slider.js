const img=new Image();img.onload=function(){console.log('Mobile hero image loaded successfully')};img.onerror=function(){console.log('Mobile hero image not found,using CSS positioning fallback');smartphoneSlide.style.cssText+=`
            background-image: url(assets/images/demoes/demo21/slider/8.webppng) !important;
            background-size: cover !important;
            background-position: 70% center !important;
            background-repeat: no-repeat !important;
        `};img.src='assets/images/demoes/demo21/slider/8-mobile.webp';window.addEventListener('resize',function(){optimizeHeroSliderForMobile()})