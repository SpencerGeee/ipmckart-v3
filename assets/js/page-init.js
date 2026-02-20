// Page initialization scripts - Externalized for CSP compliance

// rIC polyfill and helper to defer non-critical work
(function() {
    if (!('requestIdleCallback' in window)) {
        window.requestIdleCallback = function(cb, opts) {
            var start = Date.now();
            return setTimeout(function() {
                cb({
                    didTimeout: false,
                    timeRemaining: function() {
                        return Math.max(0, 50 - (Date.now() - start));
                    }
                });
            }, (opts && opts.timeout) || 1);
        };
        window.cancelIdleCallback = function(id) { clearTimeout(id); };
    }
})();

function idle(fn, timeout) {
    try {
        return requestIdleCallback(fn, { timeout: timeout || 1500 });
    } catch (e) {
        return setTimeout(fn, 0);
    }
}

// Service Worker Registration (deferred)
idle(function() {
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', function() {
            navigator.serviceWorker.register('/sw.js')
                .then(function(registration) {
                    console.log('SW registered: ', registration);
                })
                .catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                });
        });
    }
});

// Add loaded class to body as soon as possible but off-main-thread chunked
document.addEventListener('DOMContentLoaded', function() {
    idle(function() {
        var body = document.querySelector('body');
        if (body) body.classList.add('loaded');
    }, 500);
});

// Newsletter popup - show only once to new customers (gated and deferred)
document.addEventListener('DOMContentLoaded', function() {
    idle(function() {
        const newsletterPopup = document.getElementById('newsletter-popup-form');
        if (!newsletterPopup) {
            return;
        }

        // If the user has seen the popup, do nothing.
        try {
            if (localStorage.getItem('ipmc_newsletter_shown')) {
                return;
            }
        } catch (e) {
            // localStorage may be blocked; fail silently
        }

        const showPopup = function() {
            // Double check before showing, in case another tab set the flag.
            try {
                if (localStorage.getItem('ipmc_newsletter_shown')) {
                    return;
                }
            } catch (e) {}
            if (typeof $ !== 'undefined' && $.magnificPopup) {
                $.magnificPopup.open({
                    items: {
                        src: '#newsletter-popup-form',
                        type: 'inline'
                    },
                    mainClass: 'mfp-newsletter',
                    removalDelay: 300,
                    callbacks: {
                        beforeOpen: function() {
                            try { localStorage.setItem('ipmc_newsletter_shown', 'true'); } catch (e) {}
                        },
                        close: function() {
                            try { localStorage.setItem('ipmc_newsletter_shown', 'true'); } catch (e) {}
                        }
                    }
                });
            }
        };

        // Stage the popup after a delay but scheduled via idle to avoid TBT impact
        setTimeout(function() { idle(showPopup, 2000); }, 5000);

        // Handle form submission.
        const newsletterForm = newsletterPopup.querySelector('form');
        if (newsletterForm) {
            newsletterForm.addEventListener('submit', async function(e) {
                e.preventDefault();
                const emailInput = newsletterForm.querySelector('#newsletter-email') || newsletterForm.querySelector('input[type="email"]');
                const nameInput = newsletterForm.querySelector('#newsletter-name') || newsletterForm.querySelector('input[name="name"]');
                const email = emailInput ? emailInput.value.trim() : '';
                const name = nameInput ? nameInput.value.trim() : '';
                if (!window.Utils || !window.Utils.isValidEmail || !window.Utils.isValidEmail(email)) {
                    if (emailInput) emailInput.focus();
                    return alert('Please enter a valid email address.');
                }
                try {
                    const res = await fetch('/api/newsletter/subscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, name })
                    });
                    const data = await res.json();
                    try { localStorage.setItem('ipmc_newsletter_shown', 'true'); } catch (e) {}
                    if (typeof $ !== 'undefined' && $.magnificPopup) {
                        $.magnificPopup.close();
                    }
                    if (res.ok) {
                        console.log('Newsletter subscribed:', data);
                    } else {
                        console.warn('Newsletter subscribe failed:', data);
                        alert(data.message || 'Subscription failed.');
                    }
                } catch (err) {
                    console.error('Newsletter subscribe error:', err);
                    alert('Subscription failed. Please try again later.');
                }
            });
        }

        // Handle "Don't show again" checkbox.
        const showAgainCheckbox = document.getElementById('show-again');
        if (showAgainCheckbox) {
            showAgainCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    try { localStorage.setItem('ipmc_newsletter_shown', 'true'); } catch (e) {}
                    if (typeof $ !== 'undefined' && $.magnificPopup) {
                        $.magnificPopup.close();
                    }
                }
            });
        }
    }, 1200);
});



