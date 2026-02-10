"use client";

import React, { useState } from "react";
import Image from "next/image";
import CartDrawer from "./CartDrawer";

export default function Navbar() {
  const [showCart, setShowCart] = useState(false);
  const cartCount = 0;

  return (
    <>
      <header className="mi-navbar sticky-top">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mi-navbar-inner">
            {/* Logo */}
            <Image
              src="/logo.svg"
              alt="SyndetAI Logo"
              width={24}
              height={24}
              className="logo-svg"
            />

            {/* Cart */}
            {/* <button
              type="button"
              className="mi-cart-btn"
              aria-label="cart"
              onClick={() => setShowCart(true)}
            >
              {cartCount > 0 && (
                <span className="mi-nav-badge">{cartCount}</span>
              )}
              <span className="mi-nav-badge">0</span>

              <Image
                src="/cartB.svg"
                alt="Cart"
                width={26}
                height={26}
                className="mi-cart-icon"
              />
            </button> */}
          </div>
        </div>
      </header>

      {showCart && (
        <CartDrawer
          open={showCart}
          onClose={() => setShowCart(false)}
          items={[]}
        />
      )}
    </>
  );
}
