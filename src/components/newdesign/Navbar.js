'use client';

import React from "react";
import Image from "next/image";

export default function Navbar() {
  const cartCount = 0;
  return (
    <header className="mi-navbar sticky-top">
      <div className="container">
        <div className="d-flex align-items-center justify-content-between mi-navbar-inner">
          {/* Logo */}
          <Image
            src="/images/LogoT.png"
            alt="Logo"
            width={120}
            height={36}
            className="mi-navbar-logo"
            priority
          />

          {/* Cart */}
          <button type="button" className="mi-cart-btn" aria-label="cart">
          {cartCount > 0 && <span className="mi-nav-badge">{cartCount}</span>}
            <span className="mi-nav-badge">0</span>

            <Image
              src="/cartB.svg"
              alt="Cart"
              width={26}
              height={26}
              className="mi-cart-icon"
            />
          </button>
        </div>
      </div>
    </header>
  );
}
