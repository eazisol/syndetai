'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';

const Protected = ({ children, requireAdmin = false, requireSuperadmin = false, unauthorizedRedirect = '/library' }) => {
  const router = useRouter();
  const { userData } = useApp();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let isActive = true;
    const checkAuth = async () => {
      try {
        const { getSupabase } = await import('../supabaseClient');
        const supabase = getSupabase();
        const { data } = await supabase.auth.getSession();
        const session = data?.session || null;

        if (!isActive) return;

        if (!session) {
          router.push('/login');
          return;
        }

        // If roles are required, ensure userData is loaded and meets requirements
        if (requireSuperadmin) {
          if (!userData || !Boolean(userData.is_superadmin)) {
            router.push(unauthorizedRedirect);
            return;
          }
        } else if (requireAdmin) {
          if (!userData || !Boolean(userData.is_admin)) {
            router.push(unauthorizedRedirect);
            return;
          }
        }

        setChecking(false);
      } catch (e) {
        router.push('/login');
      }
    };
    checkAuth();
    return () => { isActive = false; };
  }, [router, userData, requireAdmin, requireSuperadmin, unauthorizedRedirect]);

  if (checking) return null;
  return children;
};

export default Protected;


