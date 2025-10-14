'use client';

// Shared helper to send magic link and create a pending_invite
// Expects a Supabase client instance passed in
export async function sendInviteAndCreatePendingInvite(supabase, params) {
  const { email, username, organisationId } = params || {};
  if (!supabase) throw new Error('Supabase client required');
  if (!email || !username || !organisationId) {
    throw new Error('email, username, and organisationId are required');
  }

  // 1) Send magic link
  const { error: otpError } = await supabase.auth.signInWithOtp({ email: String(email).trim() });
  if (otpError) return { error: otpError };

  // 2) Insert pending invite
  const { error: insertError } = await supabase
    .from('pending_invites')
    .insert([
      {
        email: String(email).trim(),
        username: String(username).trim(),
        organisation_id: organisationId,
        invited_at: new Date().toISOString()
      }
    ]);

  if (insertError) return { error: insertError };
  return { error: null };
}


