import React, { createContext, useContext, useState } from "react";
import CartDrawer from "./CartDrawer";
import CheckoutModal from "./CheckoutModal";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [items, setItems] = useState([]);

  const openCart = () => setCartOpen(true);
  const closeCart = () => setCartOpen(false);

  const addToCart = (item) => {
    const key = Date.now() + Math.random();
    setItems((prev) => [...prev, { ...item, key }]);
    setCartOpen(true);
  };

  const removeFromCart = (key) => {
    setItems((prev) => prev.filter((x) => x.key !== key));
  };

  const openCheckout = () => {
    setCartOpen(false);
    setCheckoutOpen(true);
  };

  const closeCheckout = () => setCheckoutOpen(false);

  const total = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);

  return (
    <CartContext.Provider
      value={{ openCart, closeCart, addToCart, removeFromCart, items, total }}
    >
      {children}

      <CartDrawer
        open={cartOpen}
        onClose={closeCart}
        items={items}
        onRemove={removeFromCart}
        total={total}
        onCheckout={openCheckout}
      />

      <CheckoutModal open={checkoutOpen} onClose={closeCheckout} total={total} />
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
