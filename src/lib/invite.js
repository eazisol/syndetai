'use client';

// Shared helper to send magic link and create a pending_invite
// Expects a Supabase client instance passed in
export async function sendInviteAndCreatePendingInvite(supabase, params) {
  const { email, username, organisationId, isAdmin = false } = params || {};
  if (!supabase) throw new Error('Supabase client required');
  if (!email || !username || !organisationId) {
    throw new Error('email, username, and organisationId are required');
  }

  // 1) Send magic link
  const { error: otpError } = await supabase.auth.signInWithOtp({ email: String(email).trim() });
  if (otpError) return { error: otpError };

  // 2) Insert pending invite (or update if already exists)
  const pendingInviteRow = {
    email: String(email).trim(),
    username: String(username).trim(),
    organisation_id: organisationId,  
    is_admin: Boolean(isAdmin),
    invited_at: new Date().toISOString()
  };

  const { error: insertError } = await supabase
    .from('pending_invites')
    .insert([pendingInviteRow]);

  if (!insertError) {
    return { error: null };
  }

  // If duplicate (already pending for this org/email), update existing row instead of failing
  // Postgres duplicate code is usually '23505'; we fallback to update regardless of specific code
  const { error: updateError } = await supabase
    .from('pending_invites')
    .update({ 
      username: pendingInviteRow.username, 
      is_admin: pendingInviteRow.is_admin,
      invited_at: pendingInviteRow.invited_at 
    })
    .eq('email', pendingInviteRow.email)
    .eq('organisation_id', pendingInviteRow.organisation_id);

  if (updateError) return { error: updateError };
  return { error: null };
}


