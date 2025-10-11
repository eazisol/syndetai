'use client';

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '../context/AppContext';
import Image from 'next/image';

const Sidebar = () => {
  const { user } = useApp();
  const pathname = usePathname();
  const router = useRouter();

  const menuItems = [
    // { 
    //   id: 'Dashboard', 
    //   label: 'Dashboard', 
    //   href: '/',
    //   icon: '/dashboard.svg',
    //   inactiveIcon: '/dashbaordinactive.svg'
    // },
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
  
    { 
      id: 'Manage Account', 
      label: 'Manage Account', 
      href: '/manage-account',
      icon: '/settingactive.svg',
      inactiveIcon: '/setting.svg'
    },
    { 
      id: 'Add Credits', 
      label: `Add Credits (${user.credits})`, 
      href: '/add-credits',
      icon: '/criedtactive.svg',
      inactiveIcon: '/credit.svg'
    },
    {
      id: 'Superadmin',
      label: 'Superadmin',
      href: '/superadmin',
      icon: '/superadmin.svg',
      inactiveIcon: '/superadmin-inactive.svg'
    }
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
      <div className="user-info">
        <span className="user-email">{user.email}</span>
        <Image 
          src="/Vector.svg" 
          alt="Logout icon" 
          width={16}
          height={16}
          className="logout-icon"
        />
      </div>
    </div>
  );
};

export default Sidebar;
