'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const MobileHeader = () => {
  const { user } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const menuItems = [
    { id: 'Library', label: 'Library', href: '/library', icon: '/library.svg', inactiveIcon: '/library-inactive.svg' },
    { id: 'New Request', label: 'New Request', href: '/new-request', icon: '/new-request.svg', inactiveIcon: '/new-request-inactive.svg' },
    { id: 'Manage Account', label: 'Manage Account', href: '/manage-account', icon: '/settingactive.svg', inactiveIcon: '/setting.svg' },
    { id: 'Add Credits', label: `Add Credits (${user.credits})`, href: '/add-credits', icon: '/criedtactive.svg', inactiveIcon: '/credit.svg' },
    { id: 'Superadmin', label: 'Superadmin', href: '/superadmin', icon: '/superadmin.svg', inactiveIcon: '/superadmin-inactive.svg' }
  ];

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleMenuClick = (href) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  const handleOverlayClick = () => {
    setIsMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header */}
      <div className="mobile-header">
        <div className="mobile-logo">
          <div className="mobile-logo-icon">
            <Image 
              src="/logo.svg" 
              alt="SyndetAI Logo" 
              width={24}
              height={24}
              className="logo-svg"
            />
          </div>
        </div>
        <button className="hamburger-menu" onClick={toggleMenu}>
          <Image 
            src="/hamburg.svg" 
            alt="Menu icon" 
            width={24}
            height={24}
            className="hamburger-icon"
          />
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      <div 
        className={`mobile-menu-overlay ${isMenuOpen ? 'show' : ''}`} 
        onClick={handleOverlayClick}
      ></div>

      {/* Mobile Menu */}
      <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
        <div className="mobile-menu-header">
          <div className="mobile-logo">
            <div className="mobile-logo-icon">
              <Image 
              src="/logo.svg" 
              alt="SyndetAI Logo" 
              width={24}
              height={24}
              className="logo-svg"
            />
            </div>
          </div>
          <button className="mobile-menu-close" onClick={toggleMenu}>
            <Image 
              src="/cross.svg" 
              alt="Close icon" 
              width={20}
              height={20}
              className="close-icon"
            />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="nav-menu">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            
            return (
              <button
                key={item.id}
                className={`nav-item ${isActive ? 'active' : ''}`}
                onClick={() => handleMenuClick(item.href)}
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
          <span className="logout-text">Logout</span>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
