"use client";

import React, { useState } from "react";
import { useApp } from "../context/AppContext";
import CustomInputField from "./CustomInputField";
import Image from "next/image";
import CustomButton from "./CustomButton";
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
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "",
);

const InnerAddCredits = () => {
  const { user, userData, refreshUserData } = useApp();
  const stripe = useStripe();
  const elements = useElements();

  const [credits, setCredits] = useState(10);
  const [isProcessing, setIsProcessing] = useState(false);

  const [paymentForm, setPaymentForm] = useState({
    cardholderName: "",
    country: "US",
    zip: "",
  });

  const elementOptions = {
    style: {
      base: {
        fontSize: "16px",
        color: "#1f2937",
        fontFamily: "inherit",
        "::placeholder": { color: "#9ca3af" },
        ":-webkit-autofill": { color: "#1f2937" },
      },
      invalid: {
        color: "#ef4444",
      },
    },
  };

  const pricePerCreditGbp = 2;
  const subtotal = credits * pricePerCreditGbp;
  const vat = subtotal * 0.2;
  const total = subtotal + vat;

  const getOrganisationId = () => {
    const idFromUserDataOrganisation = userData?.organisation?.id ?? null;
    const idFromUserDataOrganisationId = userData?.organisation_id ?? null;
    const idFromUser = user?.organisation_id ?? null;
    const idFromLocalStorage =
      typeof window !== "undefined"
        ? localStorage.getItem("organisation_id")
        : null;

    console.log("Organisation ID candidates:", {
      idFromUserDataOrganisation,
      idFromUserDataOrganisationId,
      idFromUser,
      idFromLocalStorage,
    });

    return (
      idFromUserDataOrganisation ||
      idFromUserDataOrganisationId ||
      idFromUser ||
      idFromLocalStorage ||
      null
    );
  };

  const handleCreditsChange = (e) => {
    const value = e.target.value;

    if (value === "" || /^\d+$/.test(value)) {
      setCredits(parseInt(value, 10) || 0);
    }
  };

  const handlePaymentChange = (e) => {
    const { name, value } = e.target;

    let validatedValue = value;

    if (name === "zip") {
      validatedValue = value.slice(0, 10);
    }

    setPaymentForm((prev) => ({
      ...prev,
      [name]: validatedValue,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const { cardholderName, zip, country } = paymentForm;

    console.log("=== PAYMENT FLOW START ===");
    console.log("Credits selected:", credits);
    console.log("Form values:", {
      cardholderName,
      country,
      zip,
    });

    if (!cardholderName.trim()) {
      console.log("Validation failed: missing cardholder name");
      toast.error("Please enter cardholder name");
      return;
    }

    if (!zip.trim()) {
      console.log("Validation failed: missing ZIP code");
      toast.error("Please enter ZIP code");
      return;
    }

    if (!credits || credits <= 0) {
      console.log("Validation failed: invalid credits");
      toast.error("Please enter valid credits");
      return;
    }

    if (!stripe || !elements) {
      console.log("Stripe not initialized yet");
      toast.error("Stripe is not ready yet");
      return;
    }

    setIsProcessing(true);

    try {
      const organisationId = getOrganisationId();

      console.log(
        "Resolved organisation_id before create-intent:",
        organisationId,
      );
      console.log("Sending create-intent request...");

      const piRes = await fetch("/api/payments/create-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          credits,
          organisationId,
        }),
      });

      console.log("create-intent response status:", piRes.status);

      if (!piRes.ok) {
        const errorText = await piRes.text();
        console.log("Payment initialization failed:", errorText);
        toast.error("Payment initialization failed");
        setIsProcessing(false);
        return;
      }

      const intentData = await piRes.json();
      const { clientSecret, paymentIntentId } = intentData;

      console.log("create-intent response data:", intentData);

      if (!clientSecret) {
        console.log("Missing clientSecret from server");
        toast.error("Missing client secret");
        setIsProcessing(false);
        return;
      }

      const card = elements.getElement(CardNumberElement);

      if (!card) {
        console.log("CardNumberElement not ready");
        toast.error("Card input not ready");
        setIsProcessing(false);
        return;
      }

      console.log("Confirming Stripe payment...");

      const confirmResult = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
          billing_details: {
            name: cardholderName,
            address: {
              postal_code: zip,
              country: country,
            },
          },
        },
      });

      console.log("Stripe confirm result:", confirmResult);

      if (confirmResult.error) {
        console.log("Stripe confirmation error:", confirmResult.error);
        toast.error(confirmResult.error.message || "Payment failed");
        setIsProcessing(false);
        return;
      }

      if (confirmResult.paymentIntent?.status !== "succeeded") {
        console.log(
          "Payment status not succeeded:",
          confirmResult.paymentIntent?.status,
        );
        toast.error("Payment not completed");
        setIsProcessing(false);
        return;
      }

      console.log("Payment succeeded");
      console.log("paymentIntentId from API:", paymentIntentId);
      console.log(
        "paymentIntentId from Stripe:",
        confirmResult.paymentIntent?.id,
      );
      console.log("subtotal:", subtotal);
      console.log("vat:", vat);
      console.log("total:", total);

      try {
        const organisationIdAfterPayment = getOrganisationId();

        console.log(
          "Resolved organisation_id before DB work:",
          organisationIdAfterPayment,
        );

        if (!organisationIdAfterPayment) {
          console.log(
            "Payment succeeded but organisation_id is missing, DB operations cannot run",
          );
          toast.error(
            "Payment succeeded, but organisation ID is missing, so no DB entry was saved.",
          );
          setIsProcessing(false);
          return;
        }

        const { getSupabase } = await import("../supabaseClient");
        const supabase = getSupabase();
        const now = new Date().toISOString();

        console.log("Supabase client loaded");
        console.log("Starting DB operations...");

        const creditBundlePayload = {
          name: `${credits} Credits Bundle`,
          credit_quantity: Number(credits || 0),
          price_gbp: subtotal,
          is_active: true,
          created_at: now,
          updated_at: now,
        };

        console.log("credit_bundles payload:", creditBundlePayload);

        const { data: creditBundleData, error: creditBundleError } =
          await supabase
            .schema("syndet")
            .from("credit_bundles")
            .insert([creditBundlePayload])
            .select();

        console.log("credit_bundles response data:", creditBundleData);
        console.log("credit_bundles response error:", creditBundleError);

        if (creditBundleError) {
          toast.error("Failed to insert into credit_bundles");
          setIsProcessing(false);
          return;
        }

        const purchasePayload = {
          organisation_id: organisationIdAfterPayment,
          credit_bundle_id: creditBundleData?.[0]?.id,
          purchase_type: "credit_bundle",
          pricing_model: "one_off",
          amount_gbp: subtotal,
          vat_amount_gbp: vat,
          total_amount_gbp: total,
          currency: "GBP",
          payment_status: "completed",
        };

        console.log("purchases payload:", purchasePayload);

        const { data: purchaseData, error: purchaseError } = await supabase
          .schema("syndet")
          .from("purchases")
          .insert([purchasePayload])
          .select();

        console.log("purchases response data:", purchaseData);
        console.log("purchases response error:", purchaseError);

        if (purchaseError) {
          toast.error("Failed to insert into purchases");
          setIsProcessing(false);
          return;
        }

        console.log("Fetching organisation current credit balance...");

        const { data: organisationRow, error: organisationFetchError } =
          await supabase
            .schema("syndet")
            .from("organisations")
            .select("credit_balance")
            .eq("id", organisationIdAfterPayment)
            .maybeSingle();

        console.log("organisation fetch data:", organisationRow);
        console.log("organisation fetch error:", organisationFetchError);

        if (organisationFetchError) {
          toast.error("Failed to fetch organisation");
          setIsProcessing(false);
          return;
        }

        const currentCredits = Number(organisationRow?.credit_balance) || 0;
        const updatedCredits = currentCredits + Number(credits || 0);

        console.log("Current credit balance:", currentCredits);
        console.log("Updated credit balance:", updatedCredits);

        const organisationUpdatePayload = {
          credit_balance: updatedCredits,
          updated_at: now,
        };

        console.log("organisations update payload:", organisationUpdatePayload);

        const { data: organisationUpdateData, error: organisationUpdateError } =
          await supabase
            .schema("syndet")
            .from("organisations")
            .update(organisationUpdatePayload)
            .eq("id", organisationIdAfterPayment)
            .select();

        console.log("organisations update data:", organisationUpdateData);
        console.log("organisations update error:", organisationUpdateError);

        if (organisationUpdateError) {
          toast.error("Failed to update organisation");
          setIsProcessing(false);
          return;
        }

        console.log("All DB operations completed successfully");

        try {
          await refreshUserData?.();
          console.log("refreshUserData completed");
        } catch (refreshErr) {
          console.log("refreshUserData error:", refreshErr);
        }
      } catch (dbErr) {
        console.log("DB operation exception:", dbErr);
        toast.error("Database operation failed");
        setIsProcessing(false);
        return;
      }

      try {
        elements.getElement(CardNumberElement)?.clear();
        elements.getElement(CardExpiryElement)?.clear();
        elements.getElement(CardCvcElement)?.clear();
        console.log("Stripe card elements cleared");
      } catch (clearErr) {
        console.log("Error clearing stripe elements:", clearErr);
      }

      setCredits(0);
      setPaymentForm({
        cardholderName: "",
        country: "US",
        zip: "",
      });

      console.log("=== PAYMENT FLOW END SUCCESS ===");
      toast.success("Payment successful");
      setIsProcessing(false);
    } catch (error) {
      console.log("Payment exception:", error);
      toast.error("Payment failed");
      setIsProcessing(false);
    }
  };

  return (
    <div className="add-credits-section">
      <div className="credits-layout">
        <div className="credits-column col-12">
          <h2 className="section-title">
            Add Credits ({userData?.organisation?.credit_balance})
          </h2>

          <div className="credits-subsection">
            <h3 className="subsection-title">NUMBER OF CREDITS</h3>
            <div className="credits-input-container">
              <CustomInputField
                type="text"
                name="credits"
                placeholder="10 credits"
                value={credits}
                onChange={handleCreditsChange}
                className="credits-input-field"
                required
              />
            </div>
          </div>

          <div className="payment-summary">
            <div className="summary-row">
              <span>Subtotal</span>
              <span>£{subtotal.toFixed(2)}</span>
            </div>

            <div className="summary-row" style={{ marginTop: "2%" }}>
              <span>VAT</span>
              <span>£{vat.toFixed(2)}</span>
            </div>

            <div className="borderBottom" style={{ marginTop: "2%" }} />

            <div className="summary-row total-row">
              <span>TOTAL</span>
              <span>£{total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <div className="payment-column col-12">
          <h2 className="section-title">Payment Details</h2>

          <form onSubmit={handleSubmit} className="payment-form">
            <div className="form-subsection">
              <h3 className="subsection-title">CARD INFORMATION</h3>

              <div className="card-input-group position-relative">
                <div
                  className="card-number-input"
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    backgroundColor: "#DEE3E9",
                    color: "#0044EE !important",
                    borderTopLeftRadius: "25px",
                    borderTopRightRadius: "25px",
                  }}
                >
                  <CardNumberElement options={elementOptions} />
                </div>

                <div className="right-icon position-absolute top-0 end-0">
                  <Image
                    src="/cards.svg"
                    alt=""
                    width={100}
                    height={40}
                    style={{ marginRight: "10px" }}
                  />
                </div>
              </div>

              <div className="expiry-cvc-group row g-2">
                <div className="col-6">
                  <div
                    className="expiry-input"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#DEE3E9",
                      borderBottomLeftRadius: "25px",
                    }}
                  >
                    <CardExpiryElement options={elementOptions} />
                  </div>
                </div>

                <div className="col-6">
                  <div
                    className="cvc-input"
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      backgroundColor: "#DEE3E9",
                      borderBottomRightRadius: "25px",
                    }}
                  >
                    <CardCvcElement options={elementOptions} />
                  </div>
                </div>
              </div>
            </div>

            <div className="form-subsection">
              <h3 className="subsection-title">CARDHOLDER NAME</h3>
              <CustomInputField
                type="text"
                name="cardholderName"
                placeholder="Full name on card"
                value={paymentForm.cardholderName}
                onChange={handlePaymentChange}
                required
                className="cardholder-name-input"
              />
            </div>

            <div className="form-subsection">
              <h3 className="subsection-title">COUNTRY OR REGION</h3>

              <div className="country-zip-group row g-2">
                <div className="col-12">
                  <select
                    name="country"
                    value={paymentForm.country}
                    onChange={handlePaymentChange}
                    className="country-select"
                    required
                  >
                    <option value="US">United States</option>
                    <option value="CA">Canada</option>
                    <option value="GB">United Kingdom</option>
                    <option value="DE">Germany</option>
                    <option value="FR">France</option>
                  </select>
                </div>

                <div className="col-12">
                  <CustomInputField
                    type="text"
                    name="zip"
                    placeholder="ZIP"
                    value={paymentForm.zip}
                    onChange={handlePaymentChange}
                    className="zip-input"
                    maxLength="10"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="pay-button-container">
              <CustomButton
                type="submit"
                className="pay-button"
                loading={isProcessing}
                loadingText="Processing..."
                disabled={isProcessing}
              >
                Pay
              </CustomButton>
            </div>

            <div className="payment-footer">
              <span className="powered-by">
                Powered by <span style={{ fontWeight: "bold" }}>stripe</span>
              </span>

              <div className="footer-links">
                <a href="#" className="footer-link">
                  Terms
                </a>
                <a href="#" className="footer-link">
                  Privacy
                </a>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

const AddCredits = () => {
  return (
    <Elements stripe={stripePromise}>
      <InnerAddCredits />
    </Elements>
  );
};

export default AddCredits;
