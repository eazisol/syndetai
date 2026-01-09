"use client";

import React from "react";
import Image from "next/image";

export default function CartDrawer({
  open,
  onClose,
  items = [],
  onRemove = () => {},
  onCheckout = () => {},
}) {
  const subtotal = items.reduce(
    (sum, it) => sum + (Number(it.price) || 0),
    0
  );

  const VAT_RATE = 0.2;
  const vat = +(subtotal * VAT_RATE).toFixed(2);
  const grandTotal = +(subtotal + vat).toFixed(2);

  return (
    <>
      <div className={`cart-overlay ${open ? "show" : ""}`} onClick={onClose} />

      <div className={`cart-drawer ${open ? "open" : ""}`}>
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div>
            <div className="fw-bold">Your Cart</div>
            <div className="text-muted small">{items.length} item(s)</div>
          </div>

          <button type="button" className="btn btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="cart-items">
          {items.length === 0 ? (
            <div className="text-muted">No items yet.</div>
          ) : (
            items.map((it) => (
              <div className="cart-item" key={it.key}>
                <div>
                  <div className="cart-title">{it.title}</div>
                  <div className="cart-type mt-3">{it.type}</div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <div className="fw-bold cart-price">£{it.price}</div>
                  <button
                    type="button"
                    className="btn btn-sm"
                    onClick={() => onRemove(it.key)}
                  >
                    <Image
                      src="/images/delete.png"
                      alt="delete"
                      width={18}
                      height={18}
                    />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="mt-auto pt-3 border-top">
          <div className="d-flex justify-content-between mb-2">
            <div className="fw-semibold">Subtotal</div>
            <div className="fw-bold cart-price">£{subtotal.toFixed(2)}</div>
          </div>

          <div className="d-flex justify-content-between mb-3">
            <div className="fw-semibold">VAT (20%)</div>
            <div className="fw-bold cart-price">£{vat.toFixed(2)}</div>
          </div>

          <div className="d-flex justify-content-between mb-3">
            <div className="fw-semibold">Total</div>
            <div className="fw-bold cart-price" style={{ fontSize: "24px" }}>
              £{grandTotal.toFixed(2)}
            </div>
          </div>

          <button
            type="button"
            className="btn w-100 cart-checkout-btn"
            disabled={items.length === 0}
            onClick={onCheckout}
          >
            Checkout
          </button>
        </div>
      </div>
    </>
  );
}
