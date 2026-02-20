document.addEventListener('DOMContentLoaded', function () {
    const form = document.querySelector('.contact-form');
    if (form) {
        form.addEventListener('submit', async function (e) {
            e.preventDefault();
            const formData = {
                name: document.getElementById('contact-name').value,
                email: document.getElementById('contact-email').value,
                subject: document.getElementById('contact-subject').value,
                message: document.getElementById('contact-message').value,
                website: document.getElementById('contact-website').value, // Honeypot field
            };

            const messageContainer = document.createElement('div');
            messageContainer.className = 'form-message';
            form.prepend(messageContainer);

            try {
                const response = await fetch('/api/forms/contact', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(formData),
                });

                const result = await response.json();

                if (response.ok) {
                    messageContainer.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    form.reset();
                } else {
                    messageContainer.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                }
            } catch (error) {
                messageContainer.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
            }
        });
    }
});
