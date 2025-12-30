"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";

export default function CheckoutModal({
  open,
  onClose,
  items = [],
  total = 0,
  onRemove,
  onEditBasket,
}) {
const [cardNumber, setCardNumber] = useState("");
const [expiry, setExpiry] = useState("");
const [cvc, setCvc] = useState("");
  // const subtotal = total;
  // const vat = 0;
  const subtotal = items.reduce((sum, it) => sum + (Number(it.price) || 0), 0);
  const VAT_RATE = 0.2; // dummy VAT 20%
  const vat = +(subtotal * VAT_RATE).toFixed(2);
  const grandTotal = +(subtotal + vat).toFixed(2);

  const stop = (e) => e.stopPropagation();
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);
  if (!open) return null;
  
  return (
    <>
      <div className="cart-overlay show" onClick={onClose} />
      <div className="checkout-modal" onClick={onClose}>
        <div className="checkout-modal-inner" onClick={stop}>
          <div className="checkout-header">
            <div className="checkout-title">Checkout</div>
            <button type="button" className="checkout-close" onClick={onClose}>
              ✕
            </button>
          </div>

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
                          Email Address <span className="checkout-req">*</span>
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

                    {/* <div className="payment-box mt-2">
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
                    </div> */}
                    <div className="payment-box mt-2">
                      <div className="payment-row">
                        {/* Left: card icon + number */}
                        <div className="payment-number">
                          <div className="payment-card-icon">
                            <Image
                              src="/images/creditcard.png"
                              alt="creditcard"
                              width={20}
                              height={20}
                            />
                          </div>

                          <input
                            className="payment-field payment-field-number"
                            placeholder="1234 1234 1234 1234"
                            type="text"
                            inputMode="numeric"
                            autoComplete="cc-number"
                            maxLength={23} // spaces included
                            value={cardNumber}
                            onChange={(e) => {
                              // digits only, format with spaces every 4
                              const digits = e.target.value
                                .replace(/\D/g, "")
                                .slice(0, 19);
                              const spaced = digits
                                .replace(/(.{4})/g, "$1 ")
                                .trim();
                              setCardNumber(spaced);
                            }}
                          />
                        </div>

                        {/* Right: cards image */}
                        <div className="payment-cards">
                          <Image
                            src="/cards.svg"
                            alt=""
                            width={100}
                            height={40}
                            style={{ marginRight: "10px" }}
                          />
                        </div>
                      </div>

                      {/* Bottom row: expiry + cvc */}
                      <div className="payment-row payment-row-bottom">
                        <input
                          className="payment-field payment-field-exp"
                          placeholder="MM / YY"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-exp"
                          maxLength={5}
                          value={expiry}
                          onChange={(e) => {
                            // digits only, auto add "/"
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4);
                            let out = digits;
                            if (digits.length >= 3)
                              out = `${digits.slice(0, 2)}/${digits.slice(2)}`;
                            setExpiry(out);
                          }}
                          onBlur={() => {
                            // basic month validation
                            const [mm, yy] = expiry.split("/");
                            if (!mm || mm.length !== 2) return;
                            const m = Number(mm);
                            if (m < 1 || m > 12) setExpiry("");
                          }}
                        />

                        <input
                          className="payment-field payment-field-cvc"
                          placeholder="CVC"
                          type="text"
                          inputMode="numeric"
                          autoComplete="cc-csc"
                          maxLength={4}
                          value={cvc}
                          onChange={(e) => {
                            const digits = e.target.value
                              .replace(/\D/g, "")
                              .slice(0, 4);
                            setCvc(digits);
                          }}
                          onBlur={() => {
                            // allow 3 or 4 digits
                            if (cvc && !(cvc.length === 3 || cvc.length === 4))
                              setCvc("");
                          }}
                        />
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

                      <button type="button" className="pay-now-btn w-100">
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
                              {/* <img src={deleteIcon} alt="remove" /> */}
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
                      <span>£{subtotal.toFixed(2)}</span>
                    </div>

                    <div className="order-row">
                      <span>VAT (0%)</span>
                      <span>£{vat.toFixed(2)}</span>
                    </div>

                    <div className="order-bottom">
                      <div className="order-total-label">Total</div>
                      <div className="order-total-value">
                        £{grandTotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          {/* end body */}
        </div>
      </div>
    </>
  );
}
