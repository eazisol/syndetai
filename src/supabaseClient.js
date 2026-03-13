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
    console.log('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY');
    // Return a mock client to prevent crashes during development
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        signInWithOtp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: new Error('Supabase not configured') }) }) }),
        insert: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ error: new Error('Supabase not configured') })
        })
      }
    };
  }

  try {
    cachedClient = createClient(supabaseUrl, supabaseAnonKey, {
      db: { schema: 'syndet' }
    });
    return cachedClient;
  } catch (error) {
    console.log('Failed to create Supabase client:', error);
    // Return mock client as fallback
    return {
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: error }),
        signInWithOtp: () => Promise.resolve({ error: error }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({ eq: () => ({ order: () => Promise.resolve({ data: [], error: error }) }) }),
        insert: () => Promise.resolve({ data: null, error: error }),
        update: () => ({ eq: () => Promise.resolve({ data: null, error: error }) })
      }),
      storage: {
        from: () => ({
          upload: () => Promise.resolve({ error: error })
        })
      }
    };
  }
}


