const SUPABASE_URL = 'https://sowdiflodjxxqrarbisi.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_3URkcBfqIZmtujzRnO1a1g_Xdadmjvt';

const client = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const form = document.getElementById('quote-form');
const submitButton = document.getElementById('quote-submit');
const errorBox = document.getElementById('quote-error');
const originZipInput = document.getElementById('origin_zip');
const destinationZipInput = document.getElementById('destination_zip');
const distancePreview = document.getElementById('distance-preview');
const distanceValue = document.getElementById('distance-value');

let latestMiles = null;
let distanceRequestId = 0;

function showError(message) {
  errorBox.textContent = message;
  errorBox.style.display = 'block';
}

function clearError() {
  errorBox.textContent = '';
  errorBox.style.display = 'none';
}

function cleanZip(value) {
  return String(value || '').replace(/\D/g, '').slice(0, 5);
}

async function getZipLocation(zip) {
  const response = await fetch(`https://api.zippopotam.us/us/${encodeURIComponent(zip)}`);
  if (!response.ok) throw new Error(`ZIP ${zip} could not be found.`);
  const data = await response.json();
  const place = data.places?.[0];
  if (!place) throw new Error(`ZIP ${zip} could not be found.`);
  return {
    latitude: Number(place.latitude),
    longitude: Number(place.longitude),
    city: place['place name'],
    state: place['state abbreviation']
  };
}

async function calculateDrivingMiles(originZip, destinationZip) {
  const [origin, destination] = await Promise.all([
    getZipLocation(originZip),
    getZipLocation(destinationZip)
  ]);

  const routeUrl = `https://router.project-osrm.org/route/v1/driving/${origin.longitude},${origin.latitude};${destination.longitude},${destination.latitude}?overview=false`;
  const response = await fetch(routeUrl);
  if (!response.ok) throw new Error('The routing service is temporarily unavailable.');

  const data = await response.json();
  if (data.code !== 'Ok' || !data.routes?.[0]) throw new Error('A driving route could not be calculated for this lane.');

  const miles = Math.round(Number(data.routes[0].distance) / 1609.344);
  if (!Number.isFinite(miles) || miles <= 0) throw new Error('A valid driving distance could not be calculated.');

  return { miles, origin, destination };
}

function showDistanceLoading() {
  distancePreview.style.display = 'block';
  distanceValue.textContent = 'Calculating driving distance…';
}

function showDistance(miles) {
  latestMiles = miles;
  distancePreview.style.display = 'block';
  distanceValue.textContent = `Approximately ${miles.toLocaleString('en-US')} miles`;
}

function showDistanceError(message) {
  latestMiles = null;
  distancePreview.style.display = 'block';
  distanceValue.textContent = message;
}

async function updateDistancePreview() {
  const originZip = cleanZip(originZipInput.value);
  const destinationZip = cleanZip(destinationZipInput.value);
  originZipInput.value = originZip;
  destinationZipInput.value = destinationZip;

  if (originZip.length !== 5 || destinationZip.length !== 5) {
    latestMiles = null;
    distancePreview.style.display = 'none';
    return;
  }

  const requestId = ++distanceRequestId;
  showDistanceLoading();

  try {
    const result = await calculateDrivingMiles(originZip, destinationZip);
    if (requestId !== distanceRequestId) return;

    // If the city/state fields are empty, use the ZIP's recommended location.
    const originField = document.getElementById('origin');
    const destinationField = document.getElementById('destination');
    if (!originField.value.trim()) originField.value = `${result.origin.city}, ${result.origin.state}`;
    if (!destinationField.value.trim()) destinationField.value = `${result.destination.city}, ${result.destination.state}`;

    showDistance(result.miles);
  } catch (error) {
    if (requestId !== distanceRequestId) return;
    showDistanceError(error.message || 'Distance could not be calculated. You can still submit the request.');
  }
}

originZipInput.addEventListener('input', updateDistancePreview);
destinationZipInput.addEventListener('input', updateDistancePreview);
originZipInput.addEventListener('blur', updateDistancePreview);
destinationZipInput.addEventListener('blur', updateDistancePreview);

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  clearError();

  if (!form.reportValidity()) return;

  // Simple honeypot for basic automated spam.
  if (document.getElementById('website').value.trim() !== '') return;

  const data = Object.fromEntries(new FormData(form).entries());
  const originZip = cleanZip(data.origin_zip);
  const destinationZip = cleanZip(data.destination_zip);

  if (originZip.length !== 5 || destinationZip.length !== 5) {
    showError('Please enter valid 5-digit pickup and delivery ZIP codes.');
    return;
  }

  submitButton.disabled = true;
  submitButton.textContent = 'Calculating distance…';

  try {
    const route = await calculateDrivingMiles(originZip, destinationZip);
    latestMiles = route.miles;
    showDistance(route.miles);

    const weightLbs = data.weight_lbs === '' ? null : Number(data.weight_lbs);
    const pieces = data.pieces === '' ? null : Number(data.pieces);
    const pickupDate = data.pickup_date === '' ? null : data.pickup_date;

    submitButton.textContent = 'Submitting…';

    // The database function stores the ZIP codes and calculated approximate driving miles.
    const { data: quoteNumber, error } = await client.rpc('submit_quote_request', {
      p_customer_name: data.customer_name,
      p_company_name: data.company_name,
      p_email: data.email,
      p_phone: data.phone || null,
      p_origin: data.origin,
      p_origin_zip: originZip,
      p_destination: data.destination,
      p_destination_zip: destinationZip,
      p_estimated_miles: route.miles,
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

    // During troubleshooting, show the actual Supabase error instead of hiding it
    // behind the generic submission message. This lets us identify the exact
    // database/function/permission issue if the RPC is not yet synchronized.
    const rawMessage = error?.message || error?.details || error?.hint || 'Unknown submission error.';
    const errorCode = error?.code ? ` [${error.code}]` : '';
    showError(`Quote submission failed${errorCode}: ${rawMessage}`);

    submitButton.disabled = false;
    submitButton.textContent = 'Request My Quote';
  }
});
