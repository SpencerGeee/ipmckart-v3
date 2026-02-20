document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');

    const requestFormContainer = document.getElementById('request-form-container');
    const resetFormContainer = document.getElementById('reset-form-container');
    const messageContainer = document.getElementById('message-container');

    const requestForm = document.getElementById('request-reset-form');
    const resetForm = document.getElementById('reset-password-form');

    if (token && email) {
        // Show reset password form
        if (requestFormContainer) requestFormContainer.style.display = 'none';
        if (resetFormContainer) resetFormContainer.style.display = 'block';
        if(document.getElementById('reset-email')) {
            document.getElementById('reset-email').value = email;
        }
    } else {
        // Show request reset form
        if (requestFormContainer) requestFormContainer.style.display = 'block';
        if (resetFormContainer) resetFormContainer.style.display = 'none';
    }

    if (requestForm) {
        requestForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('request-email').value;
            
            try {
                const response = await fetch('/api/auth/request-password-reset', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email }),
                });

                const result = await response.json();
                
                if (messageContainer) {
                    if (response.ok) {
                        messageContainer.innerHTML = `<div class="alert alert-success">${result.message}</div>`;
                    } else {
                        messageContainer.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                    }
                }
            } catch (error) {
                if (messageContainer) {
                    messageContainer.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
                }
            }
        });
    }

    if (resetForm) {
        resetForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const password = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (password !== confirmPassword) {
                if (messageContainer) {
                    messageContainer.innerHTML = `<div class="alert alert-danger">Passwords do not match.</div>`;
                }
                return;
            }

            try {
                const response = await fetch('/api/auth/reset-password', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ token, email, password }),
                });

                const result = await response.json();

                if (messageContainer) {
                    if (response.ok) {
                        messageContainer.innerHTML = `<div class="alert alert-success">${result.message} <a href="/login.html">Click here to login</a>.</div>`;
                        resetForm.reset();
                    } else {
                        messageContainer.innerHTML = `<div class="alert alert-danger">${result.message}</div>`;
                    }
                }
            } catch (error) {
                if (messageContainer) {
                    messageContainer.innerHTML = `<div class="alert alert-danger">An error occurred. Please try again.</div>`;
                }
            }
        });
    }
});
