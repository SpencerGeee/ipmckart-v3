document.addEventListener('click', async (e) => {
								const a = e.target.closest('a[data-logout]');
								if (!a) return;
								e.preventDefault();
								try {
								  await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
								} catch {}
								window.location.href = 'login.html';
							  });
