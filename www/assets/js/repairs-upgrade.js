document.addEventListener('DOMContentLoaded', function() {
    const form = document.querySelector('.repair-form');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            // Get form values
            const formData = {
                name: document.getElementById('full-name').value,
                email: document.getElementById('email-address').value,
                phone: document.getElementById('phone-no').value,
                serviceType: document.getElementById('service-type').value,
                deviceType: document.getElementById('device-type').value,
                issueDescription: document.getElementById('request').value
            };

            const messageContainer = document.createElement('div');
            messageContainer.className = 'form-message';
            form.prepend(messageContainer);

            try {
                const response = await fetch('/api/forms/repair-upgrade', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const result = await response.json();

                if (response.ok) {
                    // Form submitted successfully
                    messageContainer.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    form.reset();

                    // Auto-redirect to home page after 3 seconds
                    setTimeout(() => {
                        window.location.href = 'index.html';
                    }, 3000);
                } else {
                    messageContainer.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                }
            } catch (error) {
                messageContainer.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
            }
        });
    }
});
