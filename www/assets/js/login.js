// Updated login.js

const API_BASE = '/api';

function getSafeRedirectUrl(redirectUrl, defaultPath = '/dashboard.html') {
  if (!redirectUrl || typeof redirectUrl !== 'string') return defaultPath;
  
  let url = redirectUrl.trim();
  
  if (url.startsWith('//')) return defaultPath;
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url)) return defaultPath;
  if (!url.startsWith('/')) return defaultPath;
  if (url.includes('..') || url.includes('\\')) return defaultPath;
  if (!/^\/[a-zA-Z0-9\-_./]*(\?[a-zA-Z0-9\-_=&%]*)?$/.test(url)) return defaultPath;
  
  return url;
}

function showLoginError(msg) {
  const box = document.getElementById('loginError');
  if (box) { 
    box.textContent = msg; 
    box.style.display = 'block';
    box.style.cssText = 'margin-bottom: 20px; padding: 12px; background: #f8d7da; border: 1px solid #f5c6cb; color: #721c24; border-radius: 4px;';
    
    // Hide after 5 seconds
    setTimeout(() => { 
      box.style.display = 'none'; 
    }, 5000);
  } else { 
    alert(msg); 
  }
}

function showLoginSuccess(msg) {
  const box = document.getElementById('loginError');
  if (box) {
    box.textContent = msg;
    box.style.display = 'block';
    box.style.cssText = 'margin-bottom: 20px; padding: 12px; background: #d4edda; border: 1px solid #c3e6cb; color: #155724; border-radius: 4px;';
  }
}

// Check if user is already logged in
async function checkAuthStatus() {
  const urlParams = new URLSearchParams(window.location.search);
  const currentPage = window.location.pathname;
  
  // If we just logged out, don't redirect and clean up URL
  if (urlParams.has('logged_out')) {
    console.log('Just logged out - staying on login page');
    
    // Show logout success message
    showLoginSuccess('You have been successfully logged out.');
    
    // Clean the URL
    window.history.replaceState({}, document.title, window.location.pathname);
    
    // Clear any lingering storage
    localStorage.clear();
    sessionStorage.clear();
    
    // CRITICAL: Stop execution here - don't check auth
    return;
  }

  // CRITICAL FIX: Only run auth check on login page
  // This prevents redirect loops on admin.html and dashboard.html
  if (!currentPage.includes('login.html') && currentPage !== '/login' && currentPage !== '/') {
    console.log('Not on login page, skipping auth redirect check');
    return;
  }

  try {
    // Add explicit delay to ensure logout cookie is cleared
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Use /api/me for auth check to match backend and dashboard
    const res = await fetch('/api/me', {
      credentials: 'include',
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      cache: 'no-store' // Force fresh request
    });
    
    if (res.ok) {
      const user = await res.json();
      console.log('User authenticated:', user);
      
      // Check if there's a redirect parameter
      const redirectParam = urlParams.get('redirect');
      
if (redirectParam) {
        window.location.href = getSafeRedirectUrl(decodeURIComponent(redirectParam));
      } else {
        // Default redirect based on role
        if (user.role === 'admin') {
          window.location.href = '/admin.html';
        } else {
          window.location.href = '/dashboard.html';
        }
      }
    } else {
      console.log('Not authenticated - staying on login page');
    }
  } catch (error) {
    console.log('Auth check failed (expected after logout):', error);
    // Stay on login page if auth fails
  }
}

// Run auth check when page loads
document.addEventListener('DOMContentLoaded', () => {
  checkAuthStatus();
  
  // Get redirect parameter and show message if present
  const urlParams = new URLSearchParams(window.location.search);
  const redirectUrl = urlParams.get('redirect');
  
  if (redirectUrl) {
    const messageBox = document.createElement('div');
    messageBox.className = 'alert alert-info';
    messageBox.style.cssText = 'margin-bottom: 20px; padding: 12px; background: #d1ecf1; border: 1px solid #bee5eb; color: #0c5460; border-radius: 4px;';
    messageBox.textContent = 'Please log in to continue';
    
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
      loginForm.parentElement.insertBefore(messageBox, loginForm);
    }
  }
  
  // Update "Don't have an account?" link to preserve redirect parameter
  const registerLinkContainer = document.querySelector('.text-center a[href="register.html"]')?.parentElement;
  if (registerLinkContainer && redirectUrl) {
    const registerLink = registerLinkContainer.querySelector('a');
    if (registerLink) {
      registerLink.href = `register.html?redirect=${encodeURIComponent(redirectUrl)}`;
    }
  }
});

const loginForm = document.getElementById('loginForm');
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = loginForm.querySelector('button[type="submit"]');
    const originalBtnText = submitBtn.innerHTML;
    
    try {
      // Show loading state
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Logging in...';
      
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;

      if (!email || !password) { 
        showLoginError('Please enter email and password'); 
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnText;
        return; 
      }

      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        credentials: 'include', // Important for cookies
        body: JSON.stringify({ email, password })
      });

      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed. Please check your credentials.');
      }

      // Show success message
      showLoginSuccess('Login successful! Redirecting...');

      // Determine redirect URL
      const urlParams = new URLSearchParams(window.location.search);
      const redirectParam = urlParams.get('redirect');
      
      let finalRedirect = '/dashboard.html'; // Default
      
if (redirectParam) {
        finalRedirect = getSafeRedirectUrl(decodeURIComponent(redirectParam));
      } else if (data.redirect) {
        finalRedirect = getSafeRedirectUrl(data.redirect);
      } else if (data.role === 'admin') {
        // Admin users go to admin page
        finalRedirect = '/admin.html';
      }

      // Redirect after short delay
      setTimeout(() => {
        window.location.href = finalRedirect;
      }, 1000);
      
    } catch (error) {
      console.error('Login error:', error);
      showLoginError(error.message || 'An error occurred during login. Please try again.');
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalBtnText;
    }
  });
}

// Update the logout function
function logout() {
  // Clear any client-side state
  localStorage.clear();
  sessionStorage.clear();
  
  // Redirect to server logout endpoint which will clear cookie and redirect
  window.location.href = '/api/auth/logout';
}

// Handle Google OAuth login
const googleBtn = document.getElementById('googleBtn');
if (googleBtn) {
  googleBtn.addEventListener('click', (e) => { 
    e.preventDefault();
    
    // Preserve redirect parameter for OAuth flow
    const urlParams = new URLSearchParams(window.location.search);
    const redirectParam = urlParams.get('redirect');
    
    let oauthUrl = `${API_BASE}/auth/google`;
    if (redirectParam) {
      oauthUrl += `?redirect=${encodeURIComponent(redirectParam)}`;
    }
    
    window.location.href = oauthUrl;
  });
}