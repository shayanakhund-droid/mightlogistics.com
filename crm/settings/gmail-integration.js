const CONNECT_ENDPOINT = 'might-gmail-oauth-start-v2';

const button = document.getElementById('connect-gmail');

if (button) {
  button.addEventListener('click', async () => {
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
