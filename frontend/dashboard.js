// ==============================
// DASHBOARD — Load & Manage URLs
// ==============================

window.addEventListener('DOMContentLoaded', loadMyUrls);

async function loadMyUrls() {
  const token = getToken();
  const status = document.getElementById('dash-status');

  // If not logged in, redirect to login
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  try {
    const res  = await fetch(`${API}/url/my-urls`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const data = await res.json();

    if (!res.ok) { status.textContent = data.error; return; }

    if (data.length === 0) {
      status.textContent = 'You have no short URLs yet. Go shorten one!';
      return;
    }

    // Build table rows
    const tbody = document.getElementById('url-tbody');
    const table = document.getElementById('url-table');
    table.style.display = 'table';

    data.forEach(url => {
      const shortUrl = `${window.location.origin}/${url.shortCode}`;
      const expires  = url.expiresAt ? new Date(url.expiresAt).toLocaleDateString() : 'Never';
      const row = document.createElement('tr');
      row.innerHTML = `
        <td><a href="${shortUrl}" target="_blank">${shortUrl}</a></td>
        <td style="max-width:250px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
          <a href="${url.originalUrl}" target="_blank">${url.originalUrl}</a>
        </td>
        <td>${url.clicks}</td>
        <td>${expires}</td>
        <td><a href="#" onclick="showQR('${url.shortCode}')">View QR</a></td>
        <td><button class="delete-btn" onclick="deleteUrl('${url.shortCode}', this)">Delete</button></td>
      `;
      tbody.appendChild(row);
    });
  } catch {
    status.textContent = 'Could not load URLs. Is the backend running?';
  }
}

// Show QR code in alert (simple approach)
async function showQR(code) {
  const shortUrl = `${window.location.origin}/${code}`;
  window.open(`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(shortUrl)}&size=200x200`, '_blank');
}

// Delete a short URL
async function deleteUrl(code, btn) {
  if (!confirm('Delete this URL?')) return;

  const res = await fetch(`${API}/url/${code}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${getToken()}` },
  });

  if (res.ok) {
    // Remove the table row
    btn.closest('tr').remove();
  } else {
    alert('Could not delete URL.');
  }
}
