/**
 * Utility functions for security, accessibility, and common operations
 */

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - The text to escape
 * @returns {string} Escaped HTML string
 */
function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Sanitizes HTML content using textContent approach or DOMPurify if available
 * @param {string} html - The HTML string to sanitize
 * @returns {string} Sanitized HTML string
 */
function sanitizeHtml(html) {
    if (typeof html !== 'string') return '';
    // If DOMPurify is available, use it for better sanitization
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html);
    }
    // Fallback: use escapeHtml for basic protection
    return escapeHtml(html);
}

/**
 * Safely sets text content (prevents XSS)
 * @param {HTMLElement} element - The element to update
 * @param {string} text - The text to set
 */
function safeSetText(element, text) {
    if (!element) return;
    element.textContent = text || '';
}

/**
 * Safely sets HTML content (with sanitization)
 * @param {HTMLElement} element - The element to update
 * @param {string} html - The HTML to set
 */
function safeSetHtml(element, html) {
    if (!element) return;
    element.innerHTML = sanitizeHtml(html);
}

/**
 * Announces content to screen readers via ARIA live region
 * @param {string} message - The message to announce
 * @param {string} priority - 'polite' or 'assertive' (default: 'polite')
 */
function announceToScreenReader(message, priority = 'polite') {
    let liveRegion = document.getElementById('aria-live-region');
    if (!liveRegion) {
        liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.className = 'sr-only';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        document.body.appendChild(liveRegion);
    }
    
    liveRegion.setAttribute('aria-live', priority);
    liveRegion.textContent = message;
    
    // Clear after announcement is read
    setTimeout(() => {
        liveRegion.textContent = '';
    }, 1000);
}

/**
 * Checks if an element is in the viewport
 * @param {HTMLElement} element - The element to check
 * @returns {boolean} True if element is in viewport
 */
function isInViewport(element) {
    if (!element) return false;
    const rect = element.getBoundingClientRect();
    return (
        rect.top >= 0 &&
        rect.left >= 0 &&
        rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
        rect.right <= (window.innerWidth || document.documentElement.clientWidth)
    );
}

/**
 * Adds keyboard navigation support to interactive elements
 * @param {HTMLElement} element - The element to add keyboard support to
 * @param {Function} callback - The callback function to execute on activation
 */
function addKeyboardSupport(element, callback) {
    if (!element || typeof callback !== 'function') return;
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            callback(e);
        }
    });
    
    // Ensure element is focusable
    if (element.tagName === 'A' || element.tagName === 'BUTTON') {
        element.setAttribute('tabindex', '0');
    } else {
        element.setAttribute('tabindex', '0');
        element.setAttribute('role', 'button');
    }
}

/**
 * Adds focus visible styles
 */
function addFocusVisibleStyles() {
    if (document.getElementById('focus-visible-styles')) return;
    
    const style = document.createElement('style');
    style.id = 'focus-visible-styles';
    style.textContent = `
        *:focus-visible {
            outline: 2px solid #0066cc;
            outline-offset: 2px;
            border-radius: 2px;
        }
        .skip-link {
            position: absolute;
            top: -40px;
            left: 0;
            background: #000;
            color: #fff;
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
        }
        .skip-link:focus {
            top: 0;
        }
        .sr-only {
            position: absolute;
            width: 1px;
            height: 1px;
            padding: 0;
            margin: -1px;
            overflow: hidden;
            clip: rect(0, 0, 0, 0);
            white-space: nowrap;
            border-width: 0;
        }
    `;
    document.head.appendChild(style);
}

/**
 * Validates email format
 * @param {string} email - The email to validate
 * @returns {boolean} True if email is valid
 */
function isValidEmail(email) {
    if (typeof email !== 'string') return false;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validates phone number format
 * @param {string} phone - The phone number to validate
 * @returns {boolean} True if phone is valid
 */
function isValidPhone(phone) {
    if (typeof phone !== 'string') return false;
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Debounce function to limit function calls
 * @param {Function} func - The function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Throttle function to limit executions per interval
 * @param {Function} func - The function to throttle
 * @param {number} wait - Minimum time between calls in ms
 * @returns {Function} Throttled function
 */
function throttle(func, wait) {
    let last = 0;
    let pending;
    return function throttled(...args) {
        const now = Date.now();
        const remaining = wait - (now - last);
        if (remaining <= 0) {
            last = now;
            func.apply(this, args);
        } else if (!pending) {
            pending = setTimeout(() => {
                last = Date.now();
                pending = null;
                func.apply(this, args);
            }, remaining);
        }
    };
}

/**
 * Formats currency
 * @param {number} amount - The amount to format
 * @param {string} currency - The currency code (default: 'GHS')
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'GHS') {
    if (typeof amount !== 'number') return 'GHS 0.00';
    return new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Shows error message with accessibility support
 * @param {HTMLElement} container - The container to show error in
 * @param {string} message - The error message
 * @param {string} inputId - The input field ID to associate with
 */
function showError(container, message, inputId = null) {
    if (!container) return;
    
    const errorId = `error-${inputId || Date.now()}`;
    let errorElement = container.querySelector(`#${errorId}`);
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.id = errorId;
        errorElement.className = 'error-message';
        errorElement.setAttribute('role', 'alert');
        errorElement.setAttribute('aria-live', 'assertive');
        container.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Associate with input field
    if (inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.setAttribute('aria-describedby', errorId);
            input.setAttribute('aria-invalid', 'true');
        }
    }
    
    // Announce to screen readers
    announceToScreenReader(message, 'assertive');
}

/**
 * Hides error message
 * @param {HTMLElement} container - The container
 * @param {string} errorId - The error element ID
 * @param {string} inputId - The input field ID
 */
function hideError(container, errorId, inputId = null) {
    if (container) {
        const errorElement = container.querySelector(`#${errorId}`);
        if (errorElement) {
            errorElement.style.display = 'none';
        }
    }
    
    if (inputId) {
        const input = document.getElementById(inputId);
        if (input) {
            input.removeAttribute('aria-describedby');
            input.setAttribute('aria-invalid', 'false');
        }
    }
}

// Export for use in other scripts
window.Utils = {
    escapeHtml,
    sanitizeHtml,
    safeSetText,
    safeSetHtml,
    announceToScreenReader,
    isInViewport,
    addKeyboardSupport,
    addFocusVisibleStyles,
    isValidEmail,
    isValidPhone,
    debounce,
    throttle,
    formatCurrency,
    showError,
    hideError
};

// Initialize focus styles on load
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', addFocusVisibleStyles);
} else {
    addFocusVisibleStyles();
}

