const SUPABASE_URL = 'https://sowdiflodjxxqrarbisi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const form = document.getElementById('quote-form');
const submitButton = document.getElementById('quote-submit');
const errorBox = document.getElementById('quote-error');

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = 'block';
}

function clearError() {
  errorBox.textContent = '';
  errorBox.style.display = 'none';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  if (!form.reportValidity()) return;

  // Simple honeypot for basic automated spam.
  if (document.getElementById('website').value.trim() !== '') return;

  const data = Object.fromEntries(new FormData(form).entries());
  delete data.website;

  if (data.weight_lbs === '') data.weight_lbs = null;
  else data.weight_lbs = Number(data.weight_lbs);

  if (data.pieces === '') data.pieces = null;
  else data.pieces = Number(data.pieces);

  if (data.pickup_date === '') data.pickup_date = null;

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting…';

  try {
    const { data: quote, error } = await client
      .from('quote_requests')
      .insert([data])
      .select('quote_number')
      .single();

    if (error) throw error;

    const reference = `ML-${String(quote.quote_number).padStart(5, '0')}`;
    window.location.href = `quote-success.html?ref=${encodeURIComponent(reference)}`;
  } catch (error) {
    console.error('Quote submission failed:', error);
    showError('We could not submit your request right now. Please try again or call (201) 633-7756.');
    submitButton.disabled = false;
    submitButton.textContent = 'Request My Quote';
  }
});
