const statusElement = document.getElementById('gmail-status');
const connectButton = document.getElementById('connect-gmail');

async function loadGmailStatus() {
  try {
    const response = await fetch('/api/gmail/status');
    const data = await response.json();

    if (data.connected) {
      statusElement.textContent = `Connected: ${data.email || 'Gmail account'}${data.last_sync ? ` | Last sync: ${data.last_sync}` : ''}`;
      if (connectButton) connectButton.textContent = 'Disconnect Gmail';
      connectButton?.setAttribute('data-connected', 'true');
    } else {
      statusElement.textContent = 'Not connected';
    }
  } catch (error) {
    statusElement.textContent = 'Unable to check Gmail status';
  }
}

loadGmailStatus();
