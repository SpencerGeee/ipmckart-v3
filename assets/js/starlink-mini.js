document.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('starlink-order-form');
  if (!form) return;

  const showMessage = (type, text) => {
    let msg = form.querySelector('.form-message');
    if (!msg) {
      msg = document.createElement('div');
      msg.className = 'form-message';
      form.prepend(msg);
    }
    msg.innerHTML = `<div class="alert alert-${type}">${text}</div>`;
  };

  form.addEventListener('submit', async function(e) {
    e.preventDefault();

    const data = {
      firstName: document.getElementById('first-name')?.value?.trim() || '',
      lastName: document.getElementById('last-name')?.value?.trim() || '',
      email: document.getElementById('email')?.value?.trim() || '',
      phone: document.getElementById('phone')?.value?.trim() || '',
      service: document.getElementById('service')?.value || '',
      country: document.getElementById('country')?.value || '',
      message: document.getElementById('message')?.value?.trim() || ''
    };

    if (!data.firstName || !data.lastName || !data.email || !data.phone || !data.service || !data.country) {
      showMessage('danger', 'Please complete all required fields.');
      return;
    }

    try {
      const res = await fetch('/api/forms/starlink-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await res.json().catch(() => ({}));
      if (res.ok) {
        showMessage('success', result.message || 'Your order request has been submitted successfully!');
        form.reset();
      } else {
        showMessage('danger', result.message || 'Submission failed. Please try again.');
      }
    } catch (err) {
      console.error('Starlink order submit error:', err);
      showMessage('danger', 'An unexpected error occurred. Please try again later.');
    }
  });
});
