// Might Logistics CRM Gmail integration status handler
// Uses the authenticated employee session. No employee_id is accepted from the client.

import { supabase } from '../../lib/supabase.js';

export async function loadGmailIntegrationStatus() {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('Authentication required');
  }

  const { data, error } = await supabase
    .from('sales_integrations')
    .select('provider_account, is_active, last_synced_at')
    .eq('provider', 'gmail')
    .eq('employee_id', session.user.id)
    .maybeSingle();

  if (error) throw error;

  return data;
}
