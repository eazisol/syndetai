import React, { useEffect, useState } from "react";
import Image from "next/image";
import { VAT_RATE } from "@/config/packagesConfig";
import {
  Elements,
  useStripe,
  useElements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { toast } from "react-toastify";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

function InnerCheckoutModal({
  open,
  onClose,
  items = [],
  total = 0,
  onRemove,
  onEditBasket,
  companyId,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [view, setView] = useState("checkout");
  const [isProcessing, setIsProcessing] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    agreeTerms: false,
    marketing: false,
  });

  const subtotal = total;
  const vat = subtotal * VAT_RATE;

  const stop = (e) => e.stopPropagation();

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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handlePayNow = async (e) => {
    e.preventDefault();

    if (!stripe || !elements) {
      toast.error("Stripe not initialized");
      return;
    }

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.companyName) {
      toast.error("Please fill in all required fields (Name, Email, Company)");
      return;
    }

    if (!formData.agreeTerms) {
      toast.error("Please agree to the Terms of Service");
      return;
    }

    setIsProcessing(true);

    try {
      // 1. Create PaymentIntent
      const res = await fetch("/api/payments/create-report-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          total: total,
          companyId: companyId,
          email: formData.email,
        }),
      });

      if (!res.ok) {
        throw new Error("Payment initialization failed");
      }

      const { clientSecret } = await res.json();

      // 2. Confirm Payment
      const cardElement = elements.getElement(CardNumberElement);
      const { paymentIntent, error: confirmError } =
        await stripe.confirmCardPayment(clientSecret, {
          payment_method: {
            card: cardElement,
            billing_details: {
              name: `${formData.firstName} ${formData.lastName}`,
              email: formData.email,
            },
          },
        });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === "succeeded") {
        // 3. Record Transaction in Supabase
        const { getSupabase } = await import("@/supabaseClient");
        const supabase = getSupabase();

        // Note: Using exact column names including typos (comapny_id, creadits_added, comapny_name) as requested by user
        const { error: dbError } = await supabase.from("transactions").insert([
          {
            company_id: companyId,
            creadits_added: 0,
            payment_provider: "stripe",
            payment_intent: paymentIntent.id,
            name: `${formData.firstName} ${formData.lastName}`,
            amount: total,
            email: formData.email,
            company_name: formData.companyName,
            created_at: new Date().toISOString(),
          },
        ]);

        if (dbError) {
          console.log("Failed to record transaction:", dbError);
          toast.error("Payment succeeded but failed to save record: " + dbError.message);
        } else {
          // Clear fields on success
          setFormData({
            firstName: "",
            lastName: "",
            companyName: "",
            email: "",
            agreeTerms: false,
            marketing: false,
          });
          setView("success");
          toast.success("Payment successful!");
        }
      }
    } catch (err) {
      console.log("Checkout error:", err);
      // toast.error(err.message || "An error occurred during checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  const elementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#001144",
        "::placeholder": { color: "#9ca3af" },
      },
    },
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
              <form onSubmit={handlePayNow} className="container-fluid">
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
                            name="firstName"
                            value={formData.firstName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="col-md-6">
                          <label className="checkout-label">
                            Last Name <span className="checkout-req">*</span>
                          </label>
                          <input
                            className="form-control checkout-input"
                            type="text"
                            name="lastName"
                            value={formData.lastName}
                            onChange={handleInputChange}
                            required
                          />
                        </div>

                        <div className="col-12">
                          <label className="checkout-label">
                            Company Name <span className="checkout-req">*</span>
                          </label>
                          <input
                            className="form-control checkout-input"
                            type="text"
                            name="companyName"
                            value={formData.companyName}
                            onChange={handleInputChange}
                            required
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
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
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
                          name="agreeTerms"
                          checked={formData.agreeTerms}
                          onChange={handleInputChange}
                          required
                        />
                        <label
                          className="form-check-label checkout-check-text"
                          htmlFor="c1"
                        >
                          I agree to the{" "}
                          <span className="checkout-link">
                            Terms of Service
                          </span>{" "}
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
                          name="marketing"
                          checked={formData.marketing}
                          onChange={handleInputChange}
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
                        <div className="payment-row payment-row-top">
                          <div
                            className="payment-field payment-card-number"
                            style={{ width: "100%", padding: "10px 0" }}
                          >
                            <CardNumberElement options={elementOptions} />
                          </div>

                          <div className="payment-cards-right">
                            <Image
                              src="/cards.svg"
                              alt="cards"
                              width={80}
                              height={28}
                            />
                          </div>
                        </div>

                        {/* Bottom row: MM/YY + CVC */}
                        <div className="payment-row payment-row-bottom">
                          <div
                            className="payment-field payment-expiry"
                            style={{ width: "50%", padding: "10px 0" }}
                          >
                            <CardExpiryElement options={elementOptions} />
                          </div>

                          <div
                            className="payment-field payment-cvc"
                            style={{ width: "50%", padding: "10px 0" }}
                          >
                            <CardCvcElement options={elementOptions} />
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

                        <button
                          type="submit"
                          className="pay-now-btn w-100"
                          disabled={isProcessing || !stripe}
                        >
                          {isProcessing ? "Processing..." : "Pay now"}
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
                        <span>VAT ({VAT_RATE * 100}%)</span>
                        <span>£{vat.toFixed(2)}</span>
                      </div>

                      <div className="order-bottom">
                        <div className="order-total-label">Total</div>
                        <div className="order-total-value">£{total}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          )}
          {/* end body */}
        </div>
      </div>
    </>
  );
}

export default function CheckoutModal(props) {
  return (
    <Elements stripe={stripePromise}>
      <InnerCheckoutModal {...props} />
    </Elements>
  );
}
