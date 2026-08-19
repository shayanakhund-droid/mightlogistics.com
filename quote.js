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

  const weightLbs = data.weight_lbs === '' ? null : Number(data.weight_lbs);
  const pieces = data.pieces === '' ? null : Number(data.pieces);
  const pickupDate = data.pickup_date === '' ? null : data.pickup_date;

  submitButton.disabled = true;
  submitButton.textContent = 'Submitting…';

  try {
    // Use the locked-down database function rather than exposing table reads/writes.
    const { data: quoteNumber, error } = await client.rpc('submit_quote_request', {
      p_customer_name: data.customer_name,
      p_company_name: data.company_name,
      p_email: data.email,
      p_phone: data.phone || null,
      p_origin: data.origin,
      p_destination: data.destination,
      p_pickup_date: pickupDate,
      p_equipment: data.equipment,
      p_commodity: data.commodity || null,
      p_weight_lbs: weightLbs,
      p_pieces: pieces,
      p_special_requirements: data.special_requirements || null,
      p_notes: data.notes || null
    });

    if (error) throw error;

    const reference = `ML-${String(quoteNumber).padStart(5, '0')}`;
    window.location.href = `quote-success.html?ref=${encodeURIComponent(reference)}`;
  } catch (error) {
    console.error('Quote submission failed:', error);
    showError('We could not submit your request right now. Please try again or call (201) 633-7756.');
    submitButton.disabled = false;
    submitButton.textContent = 'Request My Quote';
  }
});
