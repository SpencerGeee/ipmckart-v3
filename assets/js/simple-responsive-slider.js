/**
 * Simple Responsive Slider - Uses srcset to set background images
 */
document.addEventListener('DOMContentLoaded', function() {
    const slides = document.querySelectorAll('.home-slide.banner');
    
    slides.forEach(function(slide) {
        const picture = slide.querySelector('.slide-bg');
        const sources = picture.querySelectorAll('source');
        const img = picture.querySelector('img');
        
        function updateBackground() {
            let selectedSrc = img.src; // fallback
            
            // Check which source matches current screen size
            sources.forEach(function(source) {
                if (window.matchMedia(source.media).matches) {
                    selectedSrc = source.srcset;
                }
            });
            
            slide.style.backgroundImage = `url('${selectedSrc}')`;
            slide.style.backgroundSize = 'cover';
            slide.style.backgroundPosition = 'center';
            slide.style.backgroundRepeat = 'no-repeat';
        }
        
        // Set initial background
        updateBackground();
        
        // Update on resize
        window.addEventListener('resize', updateBackground);
    });
});