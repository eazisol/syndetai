// 'use client';

// // Shared helper to send magic link and create a pending_invite
// // Expects a Supabase client instance passed in
// export async function sendInviteAndCreatePendingInvite(supabase, params) {
//   const { email, username, organisationId } = params || {};
//   if (!supabase) throw new Error('Supabase client required');
//   if (!email || !username || !organisationId) {
//     throw new Error('email, username, and organisationId are required');
//   }

//   // 1) Send magic link
//   const { error: otpError } = await supabase.auth.signInWithOtp({ email: String(email).trim() });
//   if (otpError) return { error: otpError };

//   // 2) Insert pending invite (or update if already exists)
//   const pendingInviteRow = {
//     email: String(email).trim(),
//     username: String(username).trim(),
//     organisation_id: organisationId,
//     invited_at: new Date().toISOString()
//   };

//   const { error: insertError } = await supabase
//     .from('pending_invites')
//     .insert([pendingInviteRow]);

//   if (!insertError) {
//     return { error: null };
//   }

//   // If duplicate (already pending for this org/email), update existing row instead of failing
//   // Postgres duplicate code is usually '23505'; we fallback to update regardless of specific code
//   const { error: updateError } = await supabase
//     .from('pending_invites')
//     .update({ username: pendingInviteRow.username, invited_at: pendingInviteRow.invited_at })
//     .eq('email', pendingInviteRow.email)
//     .eq('organisation_id', pendingInviteRow.organisation_id);

//   if (updateError) return { error: updateError };
//   return { error: null };
// }


'use client';

// Shared helper to send magic link and create or update a pending_invite
export async function sendInviteAndCreatePendingInvite(supabase, params) {
  const { email, username, organisationId } = params || {};
  if (!supabase) throw new Error('Supabase client required');
  if (!email || !username || !organisationId) {
    throw new Error('email, username, and organisationId are required');
  }

  const trimmedEmail = String(email).trim();
  const trimmedUsername = String(username).trim();

  // 1) Send magic link with increased expiration (default is 600, set e.g. to 1800 seconds = 30 minutes)
  const { error: otpError } = await supabase.auth.signInWithOtp({ 
    email: trimmedEmail,
    options: { 
      emailRedirectTo: undefined, // optional, leave as is/use your redirect if needed
      shouldCreateUser: true,     // default true
      // increase expire in seconds, e.g. 1800 (30 minutes)
      // As of Supabase JS v2, pass 'expiresIn' property (max is 604800)
      expiresIn: 1800 
    }
  });
  if (otpError) return { error: otpError };

  // 2) Check if email already exists in pending_invites
  const { data: existingInvite, error: fetchError } = await supabase
    .from('pending_invites')
    .select('id')
    .eq('email', trimmedEmail)
    .eq('organisation_id', organisationId)
    .maybeSingle();

  if (fetchError) return { error: fetchError };

  // 3) If exists, update; else insert
  if (existingInvite) {
    const { error: updateError } = await supabase
      .from('pending_invites')
      .update({
        username: trimmedUsername,
        invited_at: new Date().toISOString(),
      })
      .eq('id', existingInvite.id);

    if (updateError) return { error: updateError };
  } else {
    const { error: insertError } = await supabase
      .from('pending_invites')
      .insert([
        {
          email: trimmedEmail,
          username: trimmedUsername,
          organisation_id: organisationId,
          invited_at: new Date().toISOString(),
        },
      ]);

    if (insertError) return { error: insertError };
  }

  return { error: null };
}
