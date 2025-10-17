export async function POST(req) {
  try {
    const { token } = await req.json();
    if (!token) {
      return new Response(JSON.stringify({ error: 'Missing token' }), { status: 400, headers: { 'Content-Type': 'application/json' } });
    }

    const { getSupabase } = await import('../../../supabaseClient');
    const supabase = getSupabase();

    // Get invite (no status/expiry columns required)
    const { data: invite, error: inviteErr } = await supabase
      .from('pending_invites')
      .select('id, email, username, organisation_id, token')
      .eq('token', token)
      .maybeSingle();
    if (inviteErr || !invite) {
      return new Response(JSON.stringify({ error: 'Invite not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    // Ensure auth user is logged in (after magic link)
    const { data: sessionData } = await supabase.auth.getSession();
    const user = sessionData?.session?.user || null;
    if (!user) {
      return new Response(JSON.stringify({ error: 'Please sign-in from the invite email first' }), { status: 401, headers: { 'Content-Type': 'application/json' } });
    }

    // Create app_users row for the organisation (idempotent)
    const { error: upsertErr } = await supabase
      .from('app_users')
      .upsert({
        id: user.id,
        email: invite.email,
        username: invite.username || invite.email?.split('@')[0] || 'user',
        is_admin: false,
        is_superadmin: false,
        organisation_id: invite.organisation_id
      }, { onConflict: 'id' });
    if (upsertErr) {
      return new Response(JSON.stringify({ error: 'Failed to attach user to organisation' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Remove invite after success
    const { error: markErr } = await supabase
      .from('pending_invites')
      .delete()
      .eq('id', invite.id);
    if (markErr) {
      return new Response(JSON.stringify({ error: 'Failed to mark invite used' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}


