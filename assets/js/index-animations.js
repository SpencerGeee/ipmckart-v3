// Optimized Luxury Animation System
// Focus: Buttery smooth scrolling, premium feel, zero lag
(function() {
    'use strict';

    // Streamlined config - Less is more
    const config = {
        observerThreshold: 0.15,
        transitionTiming: 'cubic-bezier(0.4, 0.0, 0.2, 1)', // Material Design easing
        hoverTiming: 'cubic-bezier(0.34, 1.56, 0.64, 1)', // Gentle bounce
    };

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (prefersReducedMotion) {
        document.addEventListener('DOMContentLoaded', () => {
            document.querySelectorAll('[style*="opacity"]').forEach(el => {
                el.style.opacity = '1';
                el.style.transform = 'none';
            });
        });
        return;
    }

    document.addEventListener('DOMContentLoaded', initAnimations);

    function initAnimations() {
        addGlobalStyles();
        // Reduce durations and transition complexity for older devices
        // Applied regardless of reduced-motion to improve TBT
        try {
            const style = document.createElement('style');
            style.textContent = `
                .product-default, .banner, .hero, .header {
                    transition-duration: 180ms !important;
                }
            `;
            document.head.appendChild(style);
        } catch (e) {}

        setupScrollObserver();
        setupProductHover();
        setupButtonEffects();
        setupHeaderBehavior();
        setupLazyImages();
    }

    // ===== GLOBAL STYLES FOR GPU ACCELERATION =====
    function addGlobalStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* Force GPU acceleration */
            .will-animate {
                will-change: transform, opacity;
                backface-visibility: hidden;
                perspective: 1000px;
            }
            
            /* Smooth scroll behavior */
            html {
                scroll-behavior: smooth;
            }
            
            /* Fade-in animation */
            .fade-in {
                animation: luxuryFadeIn 0.8s ${config.transitionTiming} forwards;
            }
            
            @keyframes luxuryFadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            
            /* Product hover state */
            .product-default {
                transition: transform 0.4s ${config.hoverTiming}, 
                            box-shadow 0.4s ${config.transitionTiming};
                will-change: transform;
            }
            
            .product-default:hover {
                transform: translateY(-8px) scale(1.02);
                box-shadow: 0 20px 40px rgba(0,0,0,0.12);
            }
            
            .product-default figure img {
                transition: transform 0.6s ${config.transitionTiming};
            }
            
            .product-default:hover figure img {
                transform: scale(1.05);
            }
            
            /* Button effects */
            .btn, .btn-dark, .btn-primary {
                position: relative;
                overflow: hidden;
                transition: transform 0.3s ${config.hoverTiming},
                            box-shadow 0.3s ${config.transitionTiming};
                will-change: transform;
            }
            
            .btn:hover, .btn-dark:hover, .btn-primary:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 16px rgba(0,0,0,0.15);
            }
            
            .btn:active, .btn-dark:active, .btn-primary:active {
                transform: translateY(0);
            }
            
            /* Icon animations */
            .btn-icon, .btn-icon-wish {
                transition: transform 0.3s ${config.hoverTiming};
            }
            
            .btn-icon:hover, .btn-icon-wish:hover {
                transform: scale(1.1) rotate(5deg);
            }
            
            /* Category hover */
            .product-category {
                transition: transform 0.3s ${config.transitionTiming},
                            color 0.3s ease;
            }
            
            .product-category:hover {
                transform: translateX(5px);
            }
            
            .product-category i {
                transition: transform 0.4s ${config.hoverTiming};
            }
            
            .product-category:hover i {
                transform: scale(1.15);
            }
            
            /* Feature box stagger */
            .feature-box {
                animation: luxuryFadeIn 0.8s ${config.transitionTiming} backwards;
            }
            
            .feature-box:nth-child(1) { animation-delay: 0.1s; }
            .feature-box:nth-child(2) { animation-delay: 0.2s; }
            .feature-box:nth-child(3) { animation-delay: 0.3s; }
            
            /* Smooth label float */
            .product-label {
                animation: gentleFloat 3s ease-in-out infinite;
            }
            
            @keyframes gentleFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-5px); }
            }
            
            /* Header transition */
            .header {
                transition: transform 0.3s ${config.transitionTiming},
                            box-shadow 0.3s ${config.transitionTiming};
            }
            
            .header.scrolled {
                box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            }
        `;
        document.head.appendChild(style);
    }

    // ===== OPTIMIZED INTERSECTION OBSERVER =====
    function setupScrollObserver() {
        const observerOptions = {
            threshold: config.observerThreshold,
            rootMargin: '0px 0px -80px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    // Use CSS animation instead of JS
                    entry.target.classList.add('fade-in');
                    entry.target.classList.add('will-animate');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);

        // Observe only key elements
        const selectors = [
            '.featured-products-section .product-default',
            '.new-products-section .product-default',
            '.special-offer-section .tab-pane .product-default',
            '.product-widget'
        ];

        selectors.forEach(selector => {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el, index) => {
                el.style.opacity = '0';
                el.style.animationDelay = `${index * 0.05}s`;
                observer.observe(el);
            });
        });
    }

    // ===== OPTIMIZED PRODUCT HOVER =====
    function setupProductHover() {
        const productCards = document.querySelectorAll('.product-default');
        
        productCards.forEach(card => {
            // Passive event listeners for better scroll performance
            card.addEventListener('mouseenter', function() {
                this.classList.add('will-animate');
            }, { passive: true });

            card.addEventListener('mouseleave', function() {
                // Remove will-change after transition
                setTimeout(() => {
                    this.classList.remove('will-animate');
                }, 400);
            }, { passive: true });
        });
    }

    // ===== BUTTON RIPPLE EFFECT =====
    function setupButtonEffects() {
        const buttons = document.querySelectorAll('.btn, .btn-dark, .btn-primary, .btn-icon');
        
        buttons.forEach(button => {
            button.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                const x = e.clientX - rect.left - size / 2;
                const y = e.clientY - rect.top - size / 2;

                ripple.style.cssText = `
                    position: absolute;
                    width: ${size}px;
                    height: ${size}px;
                    border-radius: 50%;
                    background: rgba(255, 255, 255, 0.4);
                    left: ${x}px;
                    top: ${y}px;
                    transform: scale(0);
                    animation: ripple 0.6s ease-out;
                    pointer-events: none;
                `;

                this.style.position = 'relative';
                this.style.overflow = 'hidden';
                this.appendChild(ripple);

                setTimeout(() => ripple.remove(), 600);
            });
        });

        // Add ripple animation
        if (!document.getElementById('ripple-style')) {
            const style = document.createElement('style');
            style.id = 'ripple-style';
            style.textContent = `
                @keyframes ripple {
                    to {
                        transform: scale(4);
                        opacity: 0;
                    }
                }
            `;
            document.head.appendChild(style);
        }
    }

    // ===== OPTIMIZED HEADER SCROLL =====
    function setupHeaderBehavior() {
        const header = document.querySelector('.header');
        if (!header) return;

        let lastScroll = 0;

        function onScroll() {
            const currentScroll = window.pageYOffset;
            if (currentScroll > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
            lastScroll = currentScroll;
        }

        const handler = (window.Utils && window.Utils.throttle) ? window.Utils.throttle(onScroll, 100) : onScroll;
        window.addEventListener('scroll', handler, { passive: true });
    }

    // ===== LAZY LOAD IMAGES FOR PERFORMANCE =====
    function setupLazyImages() {
        const images = document.querySelectorAll('img[loading="lazy"]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));
        }
    }

    // ===== PERFORMANCE MONITORING (Development Only) =====
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        let frameCount = 0;
        let lastTime = performance.now();
        
        function checkFPS() {
            frameCount++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
                console.log(`FPS: ${fps}`);
                frameCount = 0;
                lastTime = currentTime;
            }
            
            requestAnimationFrame(checkFPS);
        }
        
        requestAnimationFrame(checkFPS);
    }

})();