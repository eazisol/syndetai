'use client';

import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';

const MobileHeader = () => {
  const { userData } = useApp();
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperadmin, setIsSuperadmin] = useState(false);
  const [isInvestor, setIsInvestor] = useState(false);
  const [isCompany, setIsCompany] = useState(false);

  const handleLogout = async () => {
    try {
      const { getSupabase } = await import('../supabaseClient');
      const supabase = getSupabase();
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    } finally {
      try {
        localStorage.removeItem('is_admin');
        localStorage.removeItem('is_superadmin');
        localStorage.removeItem('organisation_id');
      } catch { }
      router.push('/login');
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    // Prefer context values; fall back to cached flags to avoid flicker
    const admin = Boolean(userData?.is_admin);
    const superadmin = Boolean(userData?.is_superadmin);
    const accountType = (userData?.account_type || '').toLowerCase();
    const investor = accountType === 'investor';
    const company = accountType === 'company';
    setIsAdmin(admin);
    setIsSuperadmin(superadmin);
    setIsInvestor(investor);
    setIsCompany(company);
    if (!admin || !superadmin) {
      try {
        const cachedAdmin = localStorage.getItem('is_admin');
        const cachedSuper = localStorage.getItem('is_superadmin');
        if (!admin && cachedAdmin !== null) setIsAdmin(cachedAdmin === 'true');
        if (!superadmin && cachedSuper !== null) setIsSuperadmin(cachedSuper === 'true');
      } catch { }
    }
  }, [userData]);
  // Menu items
  const orgCredits = userData?.organisation?.credit_balance;
  const menuItems = [
    { id: 'Library', label: 'Library', href: '/library', icon: '/library.svg', inactiveIcon: '/library-inactive.svg', visible: true },
    { id: 'Store', label: (isCompany && !isSuperadmin) ? 'Purchase Reports' : 'Store', href: '/product', icon: '/images/storeB.png', inactiveIcon: '/images/store.png', visible: isInvestor || isCompany || isSuperadmin },
    { id: 'New Request', label: 'New Request', href: '/new-request', icon: '/new-request.svg', inactiveIcon: '/new-request-inactive.svg', visible: !isCompany || isSuperadmin },
    { id: 'Manage Account', label: 'Manage Account', href: '/manage-account', icon: '/settingactive.svg', inactiveIcon: '/setting.svg', visible: isAdmin || isInvestor || isCompany },
    { id: 'Add Credits', label: `Add Credits${Number.isFinite(orgCredits) ? ` (${orgCredits})` : ''}`, href: '/add-credits', icon: '/criedtactive.svg', inactiveIcon: '/credit.svg', visible: (isAdmin || isInvestor) && !isCompany },
    { id: 'Organization', label: 'Organization', href: '/superadmin/organizations', icon: '/images/organizaB.png', inactiveIcon: '/images/organization.png', visible: isSuperadmin },
    { id: 'Logs', label: 'Logs', href: '/logs', icon: '/Logs.svg', inactiveIcon: '/Logs-inactive.svg', visible: isSuperadmin },
    { id: 'Superadmin', label: 'Superadmin', href: '/superadmin', icon: '/superadmin.svg', inactiveIcon: '/superadmin-inactive.svg', visible: isSuperadmin }
  ].filter(item => {
    // Restrictions for Company users who are not superadmins
    if (isCompany && !isSuperadmin) {
      return ['Library', 'Store', 'Manage Account'].includes(item.id);
    }
    return item.visible;
  });

  // Toggle menu
  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  // Handle menu click
  const handleMenuClick = (href) => {
    router.push(href);
    setIsMenuOpen(false);
  };

  // Handle overlay click
  const handleOverlayClick = () => {
    setIsMenuOpen(false);
  };

  // Return mobile header
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
          <span className="user-email">{userData?.email}</span>
          <button
            className="logout-button"
            onClick={handleLogout}
            title="Logout"
            style={{ border: 'none', backgroundColor: 'transparent', marginLeft: 8 }}
          >
            <Image src="/Vector.svg" alt="Logout" width={16} height={16} className="logout-icon" />
          </button>
        </div>
      </div>
    </>
  );
};

export default MobileHeader;
