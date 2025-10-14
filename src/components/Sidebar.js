'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import Image from 'next/image';
// Avoid top-level import to keep build safe on prerender; import dynamically where needed

const Sidebar = () => {
  const { userData,user } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);

  const handleLogout = async () => {
    try {
      const { getSupabase } = await import('../supabaseClient');
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      // no-op; navigate regardless
    } finally {
      try {
        localStorage.removeItem('is_admin');
        localStorage.removeItem('is_superadmin');
        localStorage.removeItem('organisation_id');
      } catch {}
      router.push('/login');
    }
  };

  useEffect(() => {
    const loadRoles = async () => {
      // Hydrate from cache immediately to avoid flicker on refresh
      try {
        const cachedAdmin = localStorage.getItem('is_admin');
        const cachedSuper = localStorage.getItem('is_superadmin');
        if (cachedAdmin !== null) setIsAdmin(cachedAdmin === 'true');
        if (cachedSuper !== null) setIsSuperadmin(cachedSuper === 'true');
      } catch {}

      const { getSupabase } = await import('../supabaseClient');
      const supabase = getSupabase();
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData?.user) return;

      const userId = authData.user.id;
      const userEmail = authData.user.email;

      // First: look up by auth id
      let { data, error } = await supabase
        .from('app_users')
        .select('id, email, is_admin, is_superadmin, organisation_id')
        .eq('id', userId)
        .maybeSingle();

      // Fallback: look up by email if not found
      if (!data && userEmail) {
        const byEmail = await supabase
          .from('app_users')
          .select('id, email, is_admin, is_superadmin, organisation_id')
          .eq('email', userEmail)
          .maybeSingle();
        if (!byEmail.error) {
          data = byEmail.data ?? null;
        }
      }

      // Apply flags
      if (data) {
        setIsAdmin(Boolean(data.is_admin));
        setIsSuperadmin(Boolean(data.is_superadmin));
        try {
          localStorage.setItem('is_admin', String(Boolean(data.is_admin)));
          localStorage.setItem('is_superadmin', String(Boolean(data.is_superadmin)));
          localStorage.setItem('organisation_id', data.organisation_id || '');
        } catch {}
      } else {
        setIsAdmin(false);
        setIsSuperadmin(false);
        try {
          localStorage.removeItem('is_admin');
          localStorage.removeItem('is_superadmin');
          localStorage.removeItem('organisation_id');
        } catch {}
      }
    };
    loadRoles();
  }, []);

  const menuItems = [
    // Public (visible to all logged-in users)
    {
      id: 'Library',
      label: 'Library',
      href: '/library',
      icon: '/library.svg',
      inactiveIcon: '/library-inactive.svg'
    },
    {
      id: 'New Request',
      label: 'New Request',
      href: '/new-request',
      icon: '/new-request.svg',
      inactiveIcon: '/new-request-inactive.svg'
    },
    // Admin only
    ...(isAdmin ? [{ 
      id: 'Manage Account', 
      label: 'Manage Account', 
      href: '/manage-account',
      icon: '/settingactive.svg',
      inactiveIcon: '/setting.svg'
    }] : []),
    // Always visible utility
    { 
      id: 'Add Credits', 
      label: `Add Credits`, 
      href: '/add-credits',
      icon: '/criedtactive.svg',
      inactiveIcon: '/credit.svg'
    },
    // Superadmin only
    ...(isSuperadmin ? [{
      id: 'Superadmin',
      label: 'Superadmin',
      href: '/superadmin',
      icon: '/superadmin.svg',
      inactiveIcon: '/superadmin-inactive.svg'
    }] : [])
  ];

  return (
    <div className="sidebar">
       {/* Logo */}
       <div className="logo">
           <Image 
             src="/logo.svg" 
             alt="SyndetAI Logo" 
             width={150}
             height={56}
             className="logo-svg"
           />
       </div>

      {/* Navigation Menu */}
      <nav className="nav-menu">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          
          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => router.push(item.href)}
            >
              <Image 
                src={isActive ? item.icon : item.inactiveIcon} 
                alt={`${item.label} icon`} 
                width={20}
                height={20}
                className="nav-icon"
              />
              <span className={`nav-text ${isActive ? 'active' : ''}`}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info */}
      <div style={{ padding: '35px 0px' }}>

      <div className="user-info">
        <span className="user-email">{userData?.email}</span>
        <button className="logout-button" style={{border:"none",backgroundColor:"transparent"}}onClick={handleLogout} title="Logout">
          <Image 
            src="/Vector.svg" 
            alt="Logout" 
            width={16}
            height={16}
            className="logout-icon"
          />
        </button>
      </div>
      <div className="user-credits" style={{   color: '#5F6368', fontSize: 12 }}>Credits: {user.credits}</div>

      </div>
    </div>
  );
};

export default Sidebar;
