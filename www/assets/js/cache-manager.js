let swRegistration = null;
let updatePending = false;

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.warn('[CacheManager] Service Worker not supported');
    return;
  }

  try {
    swRegistration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    console.log('[CacheManager] SW registered:', swRegistration.scope);

    swRegistration.addEventListener('updatefound', () => {
      const newWorker = swRegistration.installing;
      console.log('[CacheManager] New SW installing...');

      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          updatePending = true;
          showUpdateBanner();
        }
      });
    });

    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (updatePending) {
        console.log('[CacheManager] New SW active, reloading...');
        window.location.reload();
      }
    });

    navigator.serviceWorker.addEventListener('message', handleSWMessage);

    setInterval(() => swRegistration.update(), 60000);

  } catch (error) {
    console.error('[CacheManager] Registration failed:', error);
  }
}

function handleSWMessage(event) {
  const { type, version, requiresRefresh } = event.data || {};
  
  switch (type) {
    case 'SW_UPDATED':
      console.log(`[CacheManager] SW updated to ${version}`);
      if (requiresRefresh) {
        showUpdateBanner();
      }
      break;
    case 'FORCE_REFRESH':
      window.location.reload();
      break;
    case 'CACHES_CLEARED':
      showNotification('Caches cleared', 'success');
      setTimeout(() => window.location.reload(), 500);
      break;
  }
}

function showUpdateBanner() {
  if (document.getElementById('sw-update-banner')) return;
  
  const banner = document.createElement('div');
  banner.id = 'sw-update-banner';
  banner.innerHTML = `
    <div style="position:fixed;bottom:0;left:0;right:0;background:linear-gradient(135deg,#667eea 0%,#764ba2 100%);color:#fff;padding:16px 24px;display:flex;justify-content:space-between;align-items:center;z-index:99999;box-shadow:0 -4px 20px rgba(0,0,0,0.15);font-family:system-ui,-apple-system,sans-serif;">
      <span style="font-size:14px;font-weight:500;">✨ A new version is available!</span>
      <div style="display:flex;gap:12px;">
        <button onclick="window.location.reload()" style="background:#fff;color:#667eea;border:none;padding:8px 20px;border-radius:6px;cursor:pointer;font-weight:600;font-size:13px;">Refresh Now</button>
        <button onclick="this.closest('#sw-update-banner').remove()" style="background:transparent;color:#fff;border:1px solid rgba(255,255,255,0.4);padding:8px 16px;border-radius:6px;cursor:pointer;font-size:13px;">Later</button>
      </div>
    </div>
  `;
  document.body.appendChild(banner);
}

function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position:fixed;top:20px;right:20px;padding:16px 24px;
    background:${type === 'success' ? '#10B981' : '#3B82F6'};
    color:#fff;border-radius:8px;box-shadow:0 4px 12px rgba(0,0,0,0.15);
    z-index:10000;font-family:system-ui,-apple-system,sans-serif;font-size:14px;
    animation:slideIn 0.3s ease;
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

async function clearAllCaches() {
  if (swRegistration?.active) {
    swRegistration.active.postMessage({ type: 'CLEAR_ALL_CACHES' });
  }
  
  try {
    const names = await caches.keys();
    await Promise.all(names.map(name => caches.delete(name)));
    localStorage.clear();
    sessionStorage.clear();
  } catch (e) {
    console.error('[CacheManager] Clear error:', e);
  }
  
  showNotification('Caches cleared', 'success');
  setTimeout(() => window.location.reload(), 500);
}

async function forceUpdate() {
  if (swRegistration) {
    await swRegistration.unregister();
  }
  await clearAllCaches();
}

const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
  @keyframes slideOut { from { transform: translateX(0); opacity: 1; } to { transform: translateX(100%); opacity: 0; } }
`;
document.head.appendChild(styleSheet);

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', registerServiceWorker);
} else {
  registerServiceWorker();
}

document.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.shiftKey && e.key === 'K') {
    e.preventDefault();
    clearAllCaches();
  }
});

window.CacheManager = {
  clearAll: clearAllCaches,
  forceUpdate: forceUpdate,
  checkForUpdate: () => swRegistration?.update(),
  getRegistration: () => swRegistration
};

console.log('[CacheManager] Ready. Ctrl+Shift+K to clear caches.');
