// ==============================
// AUTH — Login & Register
// ==============================

async function login() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msg      = document.getElementById('auth-msg');

  try {
    const res  = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) { msg.textContent = data.error; return; }

    // Store token and redirect
    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'dashboard.html';
  } catch {
    msg.textContent = 'Server error. Try again.';
  }
}

async function register() {
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  const msg      = document.getElementById('auth-msg');

  try {
    const res  = await fetch(`${API}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    const data = await res.json();

    if (!res.ok) { msg.textContent = data.error; return; }

    localStorage.setItem('token', data.token);
    localStorage.setItem('user', JSON.stringify(data.user));
    window.location.href = 'dashboard.html';
  } catch {
    msg.textContent = 'Server error. Try again.';
  }
}
