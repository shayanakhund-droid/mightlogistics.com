// Might Logistics Gmail widget loader
// Injects the Gmail integration card without modifying the main admin portal HTML.
(function () {
  function mountGmailWidget() {
    if (document.getElementById('gmailWidget')) return;

    const container = document.createElement('section');
    container.id = 'gmailWidget';
    container.className = 'panel gmail-panel';
    container.innerHTML = `
      <div class="panel-head">
        <div>
          <div class="kicker">INTEGRATIONS</div>
          <h3>Gmail Integration</h3>
          <p class="panel-subtitle">Connect your work Gmail and sync customer emails into CRM activity.</p>
        </div>
        <button id="connectGmail" class="primary">Connect Gmail</button>
      </div>
    `;

    const dashboard = document.getElementById('dashboard');
    if (dashboard) dashboard.insertBefore(container, dashboard.firstChild);

    const button = document.getElementById('connectGmail');
    if (button) {
      button.addEventListener('click', function () {
        window.location.href = '/functions/v1/might-gmail-oauth-start-v2';
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountGmailWidget);
  } else {
    mountGmailWidget();
  }
})();
