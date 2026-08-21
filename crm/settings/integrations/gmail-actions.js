// Might Logistics CRM Gmail actions
// Employee identity is handled by Supabase auth, never passed from the client.

export async function disconnectGmail(supabase) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { error } = await supabase
    .from('sales_integrations')
    .update({ is_active: false })
    .eq('employee_id', user.id)
    .eq('provider', 'gmail');

  if (error) throw error;
  return true;
}

export function connectGmail() {
  window.location.href = '/functions/v1/might-gmail-oauth-start-v2';
}
