// assets/js/pre-checkout.js
(async function checkAuthStatus() {
    try {
        const response = await fetch('/api/me', {
            method: 'GET',
            credentials: 'include', // Essential for sending the session cookie
            headers: { 'Content-Type': 'application/json' }
        });

        if (response.ok) {
            // User is logged in, redirect them.
            window.location.replace('checkout.html');
        }
        // If not ok, do nothing. The page will render for the guest.
    } catch (error) {
        console.error('Auth check failed, proceeding as guest:', error);
    }
})();