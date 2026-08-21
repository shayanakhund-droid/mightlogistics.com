/* Might Logistics Gmail Integration Widget */
(function () {
  const container = document.getElementById('gmailWidget');
  if (!container) return;

  container.innerHTML = `
    <section class="panel gmail-panel">
      <div class="panel-head">
        <div>
          <div class="kicker">INTEGRATIONS</div>
          <h3>Gmail Integration</h3>
          <p class="panel-subtitle">Connect your work Gmail and sync customer emails into CRM activity.</p>
        </div>
        <button id="connectGmail" class="primary">Connect Gmail</button>
      </div>
    </section>
  `;

  const button = document.getElementById('connectGmail');
  if (!button) return;

  button.addEventListener('click', function () {
    window.location.href = '/functions/v1/might-gmail-oauth-start-v2';
  });
})();
