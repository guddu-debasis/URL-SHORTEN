// ==============================
// GLOBAL CONFIG & UTILITIES
// ==============================
// In Docker, nginx proxies /api → backend container
// In local dev, change this to 'http://localhost:5000/api'
const API = '/api';

// Get stored JWT token
function getToken() {
  return localStorage.getItem('token');
}

// Logout: clear storage and redirect home
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = 'index.html';
}

// Show/hide logout button based on login state
window.addEventListener('DOMContentLoaded', () => {
  const logoutBtn = document.getElementById('logout-btn');
  const navAuth   = document.getElementById('nav-auth');
  if (getToken()) {
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (navAuth)   navAuth.style.display   = 'none';
  }
});

// ==============================
// SHORTEN URL (Home Page)
// ==============================
async function shortenUrl() {
  const originalUrl = document.getElementById('long-url').value.trim();
  const alias       = document.getElementById('custom-alias').value.trim();
  const expiresIn   = document.getElementById('expiry').value;

  if (!originalUrl) return alert('Please enter a URL');

  const headers = { 'Content-Type': 'application/json' };
  if (getToken()) headers['Authorization'] = `Bearer ${getToken()}`;

  try {
    const res  = await fetch(`${API}/url/shorten`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ originalUrl, alias, expiresIn }),
    });
    const data = await res.json();

    if (!res.ok) return alert(data.error || 'Something went wrong');

    // Show result
    document.getElementById('result-box').style.display  = 'block';
    document.getElementById('short-link').textContent    = data.shortUrl;
    document.getElementById('short-link').href           = data.shortUrl;
    document.getElementById('qr-img').src               = data.qrCode;
  } catch (err) {
    alert('Could not connect to server. Is the backend running?');
  }
}

// Copy short URL to clipboard
function copyUrl() {
  const link = document.getElementById('short-link').textContent;
  navigator.clipboard.writeText(link).then(() => alert('Copied!'));
}
