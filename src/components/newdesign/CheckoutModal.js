"use client";

import React, { useEffect, useState } from "react"; // ✅ CHANGED: added useState
import Image from "next/image";

export default function CheckoutModal({
  open,
  onClose,
  items = [],
  total = 0,
  onRemove,
  onEditBasket,
}) {
  const [view, setView] = useState("checkout"); // ✅ NEW: checkout | success

  const subtotal = total;
  const vat = 0;

  const stop = (e) => e.stopPropagation();

  // ✅ NEW: whenever modal opens again, reset to checkout view
  useEffect(() => {
    if (open) setView("checkout");
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setView("checkout");
    onClose?.();
  };

  const handlePayNow = () => {
    setView("success");
  };

  return (
    <>
      <div className="cart-overlay show" onClick={handleClose} />
      <div className="checkout-modal" onClick={handleClose}>
        <div className="checkout-modal-inner" onClick={stop}>
          <div className="checkout-header">
            <div className="checkout-title">
              {view === "success" ? "" : "Checkout"}
            </div>

            <button
              type="button"
              className="checkout-close"
              onClick={handleClose}
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          {view === "success" ? (
            <div className="checkout-body">
              <div
                style={{
                  minHeight: "520px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "40px 16px",
                  textAlign: "center",
                }}
              >
                <div style={{ maxWidth: 520, width: "100%" }}>
                  {/* green circle + check */}
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: "999px",
                      background: "#EAF8EF",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 18px",
                    }}
                  >
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: "999px",
                        border: "2px solid #22C55E",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="#22C55E"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: 30,
                      fontWeight: 800,
                      color: "#001144",
                      marginBottom: 10,
                    }}
                  >
                    Payment Successful!
                  </div>

                  <div
                    style={{
                      fontSize: 14,
                      color: "#64748B",
                      lineHeight: 1.5,
                      marginBottom: 22,
                    }}
                  >
                    Thank you for your purchase. A confirmation email with your
                    order details has been sent to your inbox.
                  </div>

                  <button
                    type="button"
                    onClick={handleClose}
                    style={{
                      borderRadius: "999px",
                      padding: "10px 18px",
                      border: "1px solid #E8ECF4",
                      background: "#F1F4F6",
                      color: "#001144",
                      fontWeight: 600,
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span style={{ fontSize: 18, lineHeight: 1 }}>←</span>
                    Back to Products
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="checkout-body">
              <div className="container-fluid">
                <div className="row g-4">
                  {/* LEFT */}
                  <div className="col-lg-7">
                    <div className="checkout-section">
                      <div className="checkout-section-title">
                        Customer Details
                      </div>
                      <div className="checkout-section-sub">
                        These details will be used to create your account where
                        you can access your purchased documents.
                      </div>

                      <div className="row g-3 mt-1">
                        <div className="col-md-6">
                          <label className="checkout-label">
                            First Name <span className="checkout-req">*</span>
                          </label>
                          <input
                            className="form-control checkout-input"
                            type="text"
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="checkout-label">
                            Last Name <span className="checkout-req">*</span>
                          </label>
                          <input
                            className="form-control checkout-input"
                            type="text"
                          />
                        </div>

                        <div className="col-12">
                          <label className="checkout-label">
                            Company Name <span className="checkout-req">*</span>
                          </label>
                          <input
                            className="form-control checkout-input"
                            type="text"
                          />
                        </div>

                        <div className="col-12">
                          <label className="checkout-label">
                            Email Address{" "}
                            <span className="checkout-req">*</span>
                          </label>
                          <input
                            className="form-control checkout-input"
                            type="email"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Consents */}
                    <div className="checkout-section mt-4">
                      <div className="checkout-section-title">Consents</div>

                      <div className="form-check checkout-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="c1"
                        />
                        <label
                          className="form-check-label checkout-check-text"
                          htmlFor="c1"
                        >
                          I agree to the{" "}
                          <span className="checkout-link">Terms of Service</span>{" "}
                          and{" "}
                          <span className="checkout-link">Privacy Policy</span>
                          <span className="checkout-req"> *</span>
                        </label>
                      </div>

                      <div className="form-check checkout-check mt-2">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="c2"
                        />
                        <label
                          className="form-check-label checkout-check-text"
                          htmlFor="c2"
                        >
                          I would like to receive marketing updates and product
                          news (optional)
                        </label>
                      </div>
                    </div>

                    {/* Payment Details */}
                    <div className="checkout-section mt-4">
                      <div className="checkout-section-title">
                        Payment Details
                      </div>

                      <div className="payment-box mt-2">
                        <div className="payment-input">
                          <div className="payment-card-icon">
                            <Image
                              src="/images/creditcard.png"
                              alt="creditcard"
                              width={20}
                              height={20}
                            />
                          </div>

                          <input
                            className="payment-field"
                            placeholder="Card number"
                            type="text"
                          />

                          <div className="payment-hint">
                            MM / YY&nbsp;&nbsp;CVC
                          </div>
                        </div>
                      </div>

                      <div className="payment-boxs">
                        <div className="payment-note">
                          <Image
                            src="/images/lock.png"
                            alt="lock"
                            width={18}
                            height={18}
                          />
                          <span>
                            Payments are processed securely by Stripe. We never
                            store your card details.
                          </span>
                        </div>

                        {/* ✅ CHANGED: Pay now shows success INSIDE modal */}
                        <button
                          type="button"
                          className="pay-now-btn w-100"
                          onClick={handlePayNow}
                        >
                          Pay now
                        </button>

                        <div className="payment-after">
                          After payment, you'll receive immediate access to your
                          reports and an email with your invoice.
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* RIGHT */}
                  <div className="col-lg-5">
                    <div className="order-card">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="order-title">Order Summary</div>

                        <button
                          type="button"
                          className="order-edit"
                          onClick={onEditBasket}
                        >
                          Edit basket
                        </button>
                      </div>

                      {/* items */}
                      <div className="order-items">
                        {items.map((it) => (
                          <div className="order-item" key={it.key}>
                            <div className="order-left">
                              <div className="order-name">{it.title}</div>
                              <div className="order-type">{it.type}</div>
                            </div>

                            <div className="order-right">
                              <div className="order-price">£{it.price}</div>
                              <button
                                type="button"
                                className="order-remove"
                                onClick={() => onRemove && onRemove(it.key)}
                              >
                                <Image
                                  className="remove-btn"
                                  src="/images/delete.png"
                                  alt="delete"
                                  width={18}
                                  height={18}
                                />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="order-line" />

                      <div className="order-row">
                        <span>Subtotal</span>
                        <span>£{subtotal}</span>
                      </div>

                      <div className="order-row">
                        <span>VAT (0%)</span>
                        <span>£{vat}</span>
                      </div>

                      <div className="order-bottom">
                        <div className="order-total-label">Total</div>
                        <div className="order-total-value">£{total}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          {/* end body */}
        </div>
      </div>
    </>
  );
}
