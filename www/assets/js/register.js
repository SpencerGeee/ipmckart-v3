// public/js/register.js
document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('registerForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const firstName = document.getElementById('regFirstName').value.trim();
    const lastName = document.getElementById('regLastName').value.trim();
    const email = document.getElementById('regEmail').value.trim();
    const password = document.getElementById('regPassword').value;
    const confirm = document.getElementById('regConfirm').value;

    if (!firstName || !lastName || !email || !password || !confirm) {
      return showError('All fields are required');
    }
    if (password.length < 8) return showError('Password must be at least 8 characters');
    if (password !== confirm) return showError('Passwords do not match');

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ firstName, lastName, email, password })
      });

      const data = await res.json();
      if (!res.ok) return showError(data.message || 'Registration failed');

      // Redirect to dashboard
      window.location.href = 'dashboard.html';
    } catch {
      showError('Network error');
    }
  });

  function showError(msg) {
    const box = document.getElementById('registerError');
    if (box) {
      box.textContent = msg;
      box.style.display = 'block';
    }
  }
});
