/**
 * Accessibility enhancements for keyboard navigation and screen reader support
 */

(function() {
    'use strict';

    /**
     * Initialize keyboard navigation for interactive elements
     */
    function initKeyboardNavigation() {
        // Add keyboard support to all buttons and interactive elements
        document.querySelectorAll('button, a[role="button"], .btn-add-cart, .search-toggle, .cart-toggle').forEach(el => {
            if (!el.hasAttribute('tabindex')) {
                el.setAttribute('tabindex', '0');
            }
            
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                }
            });
        });
        
        // Ensure dropdowns work with keyboard
        document.querySelectorAll('[data-toggle="dropdown"]').forEach(el => {
            el.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    el.click();
                } else if (e.key === 'Escape') {
                    const dropdown = document.querySelector(el.getAttribute('data-target') || '.dropdown-menu');
                    if (dropdown) {
                        dropdown.classList.remove('show');
                        el.setAttribute('aria-expanded', 'false');
                    }
                }
            });
        });
    }

    /**
     * Initialize ARIA live regions for dynamic content
     */
    function initAriaLiveRegions() {
        // Create live region if it doesn't exist
        if (!document.getElementById('aria-live-region')) {
            const liveRegion = document.createElement('div');
            liveRegion.id = 'aria-live-region';
            liveRegion.className = 'sr-only';
            liveRegion.setAttribute('role', 'status');
            liveRegion.setAttribute('aria-live', 'polite');
            liveRegion.setAttribute('aria-atomic', 'true');
            document.body.appendChild(liveRegion);
        }
    }

    /**
     * Initialize focus management
     */
    function initFocusManagement() {
        // Trap focus in modals
        document.querySelectorAll('.modal, .dropdown-menu').forEach(modal => {
            const focusableElements = modal.querySelectorAll(
                'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                modal.addEventListener('keydown', function(e) {
                    if (e.key === 'Tab') {
                        if (e.shiftKey && document.activeElement === firstElement) {
                            e.preventDefault();
                            lastElement.focus();
                        } else if (!e.shiftKey && document.activeElement === lastElement) {
                            e.preventDefault();
                            firstElement.focus();
                        }
                    }
                    
                    if (e.key === 'Escape') {
                        modal.classList.remove('show');
                        const trigger = document.querySelector('[data-toggle][data-target]');
                        if (trigger) trigger.focus();
                    }
                });
            }
        });
    }

    /**
     * Initialize skip links
     */
    function initSkipLinks() {
        // Skip to main content link
        const skipLink = document.querySelector('.skip-link');
        if (skipLink) {
            skipLink.addEventListener('click', function(e) {
                e.preventDefault();
                const target = document.querySelector(skipLink.getAttribute('href'));
                if (target) {
                    target.setAttribute('tabindex', '-1');
                    target.focus();
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }

    /**
     * Initialize mobile menu accessibility
     */
    function initMobileMenuAccessibility() {
        const mobileMenuToggle = document.querySelector('.mobile-menu-toggler');
        const mobileMenu = document.querySelector('.mobile-menu-container');
        
        if (mobileMenuToggle && mobileMenu) {
            mobileMenuToggle.addEventListener('click', function() {
                const isExpanded = mobileMenuToggle.getAttribute('aria-expanded') === 'true';
                mobileMenuToggle.setAttribute('aria-expanded', !isExpanded);
                
                if (!isExpanded) {
                    const firstFocusable = mobileMenu.querySelector('a, button');
                    if (firstFocusable) {
                        setTimeout(() => firstFocusable.focus(), 100);
                    }
                }
            });
            
            // Close mobile menu on escape
            mobileMenu.addEventListener('keydown', function(e) {
                if (e.key === 'Escape') {
                    mobileMenuToggle.click();
                }
            });
        }
    }

    /**
     * Initialize form accessibility
     */
    function initFormAccessibility() {
        // Add labels to form fields that only have placeholders
        document.querySelectorAll('input[placeholder]:not([id]), textarea[placeholder]:not([id])').forEach(input => {
            const id = 'input-' + Math.random().toString(36).substr(2, 9);
            input.id = id;
            const label = document.createElement('label');
            label.className = 'sr-only';
            label.setAttribute('for', id);
            label.textContent = input.getAttribute('placeholder');
            input.parentNode.insertBefore(label, input);
        });
        
        // Associate error messages with form fields
        document.querySelectorAll('.error-message').forEach(error => {
            const inputId = error.getAttribute('data-input-id');
            if (inputId) {
                const input = document.getElementById(inputId);
                if (input) {
                    input.setAttribute('aria-describedby', error.id || 'error-' + inputId);
                    input.setAttribute('aria-invalid', 'true');
                }
            }
        });
    }

    /**
     * Initialize image lazy loading accessibility
     */
    function initImageAccessibility() {
        // Ensure all images have alt text or are marked as decorative
        document.querySelectorAll('img:not([alt])').forEach(img => {
            // If image is decorative (in background or decorative context)
            if (img.closest('.bg-img, [style*="background"]') || img.classList.contains('decorative')) {
                img.setAttribute('alt', '');
                img.setAttribute('role', 'presentation');
            } else {
                // Generate alt text from filename or parent context
                const src = img.getAttribute('src') || '';
                const filename = src.split('/').pop().replace(/\.(jpg|jpeg|png|gif|webp)$/i, '');
                img.setAttribute('alt', filename.replace(/[-_]/g, ' '));
            }
        });
    }

    /**
     * Initialize all accessibility features
     */
    function initAccessibility() {
        initKeyboardNavigation();
        initAriaLiveRegions();
        initFocusManagement();
        initSkipLinks();
        initMobileMenuAccessibility();
        initFormAccessibility();
        initImageAccessibility();
        
        // Respect prefers-reduced-motion
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            document.documentElement.style.setProperty('--animation-duration', '0.01ms');
            document.documentElement.style.setProperty('--transition-duration', '0.01ms');
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAccessibility);
    } else {
        initAccessibility();
    }
})();

