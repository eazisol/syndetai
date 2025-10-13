import { createClient } from '@supabase/supabase-js';

let cachedClient = null;

export function getSupabase() {
  if (cachedClient) return cachedClient;

  // Guard: only initialize on client side to avoid Next.js prerender errors
  if (typeof window === 'undefined') {
    throw new Error('Supabase client is unavailable during SSR/prerender. Call getSupabase() on client only.');
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
  }

  cachedClient = createClient(supabaseUrl, supabaseAnonKey);
  return cachedClient;
}


