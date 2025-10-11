// supabase/functions/delete-orphaned-auth-users/index.ts

import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (_req) => {
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  // Step 1: Get all app_users ids
  const { data: appUsers, error: appUserError } = await supabase
    .from('app_users')
    .select('id');

  if (appUserError) {
    return new Response(`Failed to fetch app_users: ${appUserError.message}`, { status: 500 });
  }

  const appUserIds = appUsers.map((u) => u.id);

  // Step 2: Get all auth.users
  const { data: authUsers, error: authUserError } = await supabase.auth.admin.listUsers({});

  if (authUserError) {
    return new Response(`Failed to fetch auth.users: ${authUserError.message}`, { status: 500 });
  }

  const toDelete = authUsers.users.filter((user) => !appUserIds.includes(user.id));

  const deleteResults = [];

  for (const user of toDelete) {
    const result = await supabase.auth.admin.deleteUser(user.id);
    deleteResults.push({ user: user.email, status: result.error ? 'fail' : 'deleted' });
  }

  return new Response(
    JSON.stringify({
      deleted: deleteResults.filter(r => r.status === 'deleted').length,
      failed: deleteResults.filter(r => r.status === 'fail').length,
      results: deleteResults
    }),
    { status: 200 }
  );
});
