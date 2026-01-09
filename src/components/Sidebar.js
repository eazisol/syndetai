'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import Image from 'next/image';
// Avoid top-level import to keep build safe on prerender; import dynamically where needed

const Sidebar = () => {
  const { userData, user } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  // Use userData from AppContext instead of local state
  const isAdmin = Boolean(userData?.is_admin);
  const isSuperadmin = Boolean(userData?.is_superadmin);

  const handleLogout = async () => {
    try {
      const { getSupabase } = await import('../supabaseClient');
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      // no-op; navigate regardless
    } finally {
      router.push('/login');
    }
  };

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
    ...(isAdmin ? [
      {
        id: 'Manage Account',
        label: 'Manage Account',
        href: '/manage-account',
        icon: '/settingactive.svg',
        inactiveIcon: '/setting.svg'
      },
      {
        id: 'Add Credits',
        label: `Add Credits`,
        href: '/add-credits',
        icon: '/criedtactive.svg',
        inactiveIcon: '/credit.svg'
      },
    ] : []),
    {
      id: 'Logs',
      label: 'Logs',
      href: '/Logs',
      icon: '/Logs.svg',
      inactiveIcon: '/Logs-inactive.svg'
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
          <button className="logout-button" style={{ border: "none", backgroundColor: "transparent" }} onClick={handleLogout} title="Logout">
            <Image
              src="/Vector.svg"
              alt="Logout"
              width={16}
              height={16}
              className="logout-icon"
            />
          </button>
        </div>
        <div className="user-credits" style={{ color: '#5F6368', fontSize: 12 }}>Credits: {userData?.organisation?.credits}</div>

      </div>
    </div>
  );
};

export default Sidebar;
