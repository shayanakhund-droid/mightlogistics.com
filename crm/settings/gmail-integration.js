const CONNECT_ENDPOINT = 'might-gmail-oauth-start-v2';
const DISCONNECT_ENDPOINT = 'might-gmail-disconnect';

const status = document.getElementById('gmail-status');
const connectButton = document.getElementById('connect-gmail');
const disconnectButton = document.getElementById('disconnect-gmail');

async function loadGmailStatus() {
  if (!status) return;

  try {
    const response = await fetch('might-gmail-status');
    const data = await response.json();

    if (data.connected) {
      status.innerHTML = `Connected: ${data.email || 'Gmail account'}<br>Last sync: ${data.last_synced_at || 'Not synced yet'}`;
      if (connectButton) connectButton.style.display = 'none';
      if (disconnectButton) disconnectButton.style.display = 'inline-block';
    } else {
      status.textContent = 'Not Connected';
      if (connectButton) connectButton.style.display = 'inline-block';
      if (disconnectButton) disconnectButton.style.display = 'none';
    }
  } catch (error) {
    status.textContent = 'Unable to check Gmail status';
  }
}

if (connectButton) {
  connectButton.addEventListener('click', async () => {
    const response = await fetch(CONNECT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.auth_url) {
      window.location.href = data.auth_url;
    } else {
      alert('Unable to start Gmail connection');
    }
  });
}

if (disconnectButton) {
  disconnectButton.addEventListener('click', async () => {
    await fetch(DISCONNECT_ENDPOINT, { method: 'POST' });
    loadGmailStatus();
  });
}

loadGmailStatus();
