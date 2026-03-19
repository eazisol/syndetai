import React, { useEffect, useState } from "react";
import Image from "next/image";
import { VAT_RATE } from "@/config/packagesConfig";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from 'uuid';
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
import { logEvent } from "@/utils/eventLogger";
import { provisionFounderPurchase } from "@/lib/postPaymentFounderProvisioning";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

const createReportEntries = async ({ supabase, companyId, items, personaVariant = "founder" }) => {
  if (!companyId) {
    console.log("No companyId available for reports insert");
    return;
  }

  const titleToSlugMap = {
    "Pre-Diligence Assessment": "due_diligence",
    "Company Research Report": "due_diligence",
    "Competitive Positioning Assessment": "competitor_analysis",
    "Competitive Analysis": "competitor_analysis",
    "Fundraising Readiness Diagnostic": "full_research_report",
    "Company Deep Dive": "full_research_report",
  };

  const uniqueSlugs = [...new Set(
    items
      .map((item) => item?.reportTypeId ? null : titleToSlugMap[item?.title])
      .filter(Boolean)
  )];

  // If items already contain reportTypeId, we can skip fetching report type IDs.
  const payloadRows = [];

  for (const item of items) {
    if (!item) continue;
    if (item.reportTypeId) {
      payloadRows.push({
        company_id: companyId,
        report_type_id: item.reportTypeId,
        persona_variant: personaVariant,
        source: "checkout",
        status: "queued",
        visibility: "locked",
      });
      continue;
    }

    const slug = titleToSlugMap[item.title];
    if (slug) {
      payloadRows.push({
        company_id: companyId,
        report_type_slug: slug,
        persona_variant: personaVariant,
        source: "checkout",
        status: "queued",
        visibility: "locked",
      });
    }
  }

  if (!payloadRows.length) {
    console.log("No reportTypeId found in items, skipping reports insert");
    return;
  }

  // Resolve any slug-based rows to real report_type_id via report_types table.
  let slugToId = {};
  if (uniqueSlugs.length > 0) {
    const { data: reportTypes, error: reportTypesError } = await supabase
      .schema("syndet")
      .from("report_types")
      .select("id, slug")
      .in("slug", uniqueSlugs);

    if (reportTypesError) {
      console.log("Failed to fetch report types:", reportTypesError);
      throw new Error(reportTypesError.message || "Failed to fetch report types");
    }

    slugToId = Object.fromEntries((reportTypes || []).map((rt) => [rt.slug, rt.id]));
  }

  const reportRows = payloadRows
    .map((row) => {
      if (row.report_type_id) return row;
      const resolvedId = slugToId[row.report_type_slug];
      if (!resolvedId) return null;
      return {
        ...row,
        report_type_id: resolvedId,
      };
    })
    .filter(Boolean)
    .map(({ report_type_slug, ...rest }) => rest);

  if (!reportRows.length) {
    console.log("No valid report rows found, skipping reports insert");
    return;
  }

  const reportsQuery = supabase.schema
    ? supabase.schema("syndet").from("reports")
    : supabase.from("reports");

  const { data, error } = await reportsQuery.insert(reportRows).select();

  if (error) {
    console.log("Failed to create reports entries:", error);
    throw new Error(error.message || "Failed to create reports entries");
  }

  console.log("Reports created successfully:", data);
};

function InnerCheckoutModal({
  open,
  onClose,
  items = [],
  total = 0,
  onRemove,
  onEditBasket,
  companyId,
  userId,
  persona = null,
}) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [view, setView] = useState("checkout");
  const [isProcessing, setIsProcessing] = useState(false);
  const [createdUserId, setCreatedUserId] = useState(null); // Track the newly created/synced user ID
  const [cvcLen, setCvcLen] = useState(0);

  // Form state
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    companyName: "",
    email: "",
    agreeTerms: false,
    marketing: false,
  });

  // State to prevent duplicate logging of field completion in one session
  const [loggedFields, setLoggedFields] = useState({
    card: false,
    expiry: false,
    cvc: false,
  });

  const handleElementChange = (field, e) => {
    if (e.complete && !loggedFields[field]) {
      setLoggedFields((prev) => ({ ...prev, [field]: true }));

      const fieldNames = {
        card: "Fill Card Number",
        expiry: "Fill Expiry Date",
        cvc: "Fill CVC",
      };

      logEvent({
        companyId,
        // userId removed here as it is currently a person_id which violates event_log FK
        eventType: fieldNames[field],
      });
    }
  };

  const subtotal = total;
  const vat = subtotal * VAT_RATE;

  const stop = (e) => e.stopPropagation();

  useEffect(() => {
    if (open) {
      setView("checkout");
      logEvent({
        companyId,
        // userId removed here as it is currently a person_id which violates event_log FK
        eventType: "checkout.viewed",
      });
    }
  }, [open, companyId, userId]);

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

    logEvent({
      companyId,
      // userId removed here as it is currently a person_id which violates event_log FK
      eventType: "Click on Pay now button",
    });

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
      // console.log("Payment intent created successfully, Client Secret received");

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

      // console.log("Stripe confirmation result:", { paymentIntent, confirmError });

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      if (paymentIntent.status === "succeeded") {
        const { getSupabase } = await import("@/supabaseClient");
        const supabase = getSupabase();

        const isFounderFlow = !companyId || persona === "company";

        console.log("Checkout: payment succeeded", {
          isFounderFlow,
          companyId,
          persona,
          itemsCount: items.length,
        });

        let paymentUserId = null;
        let finalCompanyId = companyId || null;

        if (isFounderFlow) {
          try {
            const result = await provisionFounderPurchase({
              supabase,
              paymentIntent,
              formData,
              items,
              total,
              existingCompanyId: companyId,
              existingPersonId: userId,
            });
            paymentUserId = result?.userId || null;
            finalCompanyId = result?.companyId || companyId || null;
          } catch (provErr) {
            console.log("Founder post-payment provisioning failed:", provErr);
            toast.error(
              provErr?.message ||
              "Account provisioning failed after payment. Please contact support."
            );
            setIsProcessing(false);
            return;
          }
        } else {
          finalCompanyId = companyId || null;
          // Existing investor/company flow kept as-is
          let newOrgId = null;
          let currentCredits = 0;

          const { data: existingOrg, error: fetchOrgError } = await supabase
            .from("organisations")
            .select("id, credit_balance")
            .eq("company_id", companyId)
            .maybeSingle();

          if (fetchOrgError) {
            console.log("Error fetching organisation:", fetchOrgError);
          }

          if (existingOrg) {
            newOrgId = existingOrg.id;
            currentCredits = existingOrg.credit_balance || 0;
            console.log("Existing organisation found:", newOrgId, "credits:", currentCredits);
            await supabase
              .from("organisations")
              .update({
                name: `${formData.firstName} ${formData.lastName}`,
                is_active: true
              })
              .eq("id", newOrgId);
          } else {
            const { data: orgData, error: orgError } = await supabase
              .from("organisations")
              .insert([
                {
                  name: `${formData.firstName} ${formData.lastName}`,
                  type: "startup",
                  credit_balance: 0,
                  is_active: true,
                  created_at: new Date().toISOString(),
                  company_id: companyId
                },
              ])
              .select();

            if (orgError) {
              console.log("Failed to create organisation entry:", orgError);
              toast.error("Failed to create/link organisation: " + orgError.message);
              setIsProcessing(false);
              return;
            }

            if (orgData && orgData.length > 0) {
              newOrgId = orgData[0].id;
              currentCredits = 0;
              console.log("Organisation created successfully, ID:", newOrgId);
            }
          }

          if (newOrgId) {
            logEvent({
              eventType: "account.created",
              organisationId: newOrgId,
              companyId: companyId
            });

            let authUserId = null;
            try {
              const tempPwd = "User" + Math.random().toString(36).slice(-8) + "!";
              const { data: authData, error: authErr } = await supabase.auth.signUp({
                email: formData.email,
                password: tempPwd,
                options: {
                  data: {
                    full_name: `${formData.firstName} ${formData.lastName}`,
                    first_name: formData.firstName,
                    last_name: formData.lastName
                  }
                }
              });

              if (authErr) {
                console.log("Auth provisioning error:", authErr);
                toast.error("Auth provisioning failed: " + authErr.message);
              } else if (authData && authData.user) {
                authUserId = authData.user.id;
                console.log("Auth provisioning successful for:", formData.email, "ID:", authUserId);
              }
            } catch (aErr) {
              console.log("Auth provisioning exception:", aErr);
              toast.error("An error occurred during auth setup.");
            }

            const appUserId = authUserId;
            paymentUserId = appUserId || null;

            const { error: userError } = await supabase.from("users").upsert([
              {
                id: appUserId,
                organisation_id: newOrgId,
                email: formData.email,
                username: `${formData.firstName} ${formData.lastName}`,
                is_admin: true,
                is_superadmin: false,
                is_active: true,
                created_at: new Date().toISOString(),
                auth_user_id: authUserId,
                person_id: userId,
              },
            ]);

            if (userError) {
              console.log("Failed to create user profile in Database:", userError);
            } else {
              console.log("User profile entry created/updated successfully in Database");

              logEvent({
                eventType: "user.created",
                userId: appUserId,
                organisationId: newOrgId,
                companyId: companyId
              });

              const productTypeMap = {
                "Pre-Diligence Assessment": ["due_diligence"],
                "Company Research Report": ["due_diligence"],
                "due_diligence": ["due_diligence"],

                "Competitive Positioning Assessment": ["competitor_analysis", "due_diligence"],
                "Competitive Analysis": ["competitor_analysis", "due_diligence"],
                "competitor_analysis": ["competitor_analysis", "due_diligence"],

                "Fundraising Readiness Diagnostic": ["due_diligence", "competitor_analysis", "full_research_report"],
                "Company Deep Dive": ["due_diligence", "competitor_analysis", "full_research_report"],
                "full_research_report": ["due_diligence", "competitor_analysis", "full_research_report"]
              };

              // First try by title, then check if title is actually an ID
              const itemTitle = items[0]?.title || "";
              let docTypesToSubmit = productTypeMap[itemTitle] || productTypeMap[items[0]?.id] || [];

              if (docTypesToSubmit.length === 0) {
                console.log("No matching doc types found for title:", itemTitle);
              }

              for (const docType of docTypesToSubmit) {
                let reportUrl = null;
                if (companyId) {
                  try {
                    const { data: rdData, error: rdError } = await supabase
                      .from("reports")
                      .select("storage_path")
                      .eq("company_id", companyId)
                      .eq("report_type", docType)
                      .maybeSingle();

                    if (rdError) {
                      console.log(`Error fetching research document for ${docType}:`, rdError);
                    } else if (rdData) {
                      reportUrl = rdData.storage_path;
                    }
                  } catch (err) {
                    console.log(`Research documents lookup failed for ${docType}:`, err);
                  }
                }

                const { error: submissionError } = await supabase.from("new_submissions").insert([
                  {
                    reviewed_by: appUserId,
                    organisation_id: newOrgId,
                    company_name: formData.companyName,
                    persona_type: "company",
                    full_name: `${formData.firstName} ${formData.lastName}`,
                    email: formData.email,
                    batch_date: new Date().toISOString(),
                    queue_position: 0,
                    status: "pending",
                    report_url: reportUrl,
                    created_at: new Date().toISOString(),
                  },
                ]);

                if (submissionError) {
                  console.log(`Failed to create submission entry for ${docType}:`, submissionError);
                } else {
                  console.log(`Submission entry created successfully for ${docType} with report_url:`, reportUrl);
                }
              }
            }

            console.log("Recording credit transaction for organisation:", newOrgId);
            const { error: txError } = await supabase.from("credit_transactions").insert([
              {
                organisation_id: newOrgId,
                transaction_type: "synapto",
                amount: total,
                balance_after: currentCredits,
                created_at: new Date().toISOString(),
              },
            ]);

            if (txError) {
              console.log("Failed to record credit transaction (ignoring toast):", txError);
            } else {
              console.log("Credit transaction recorded successfully");
            }
          } else {
            console.log("No organisation ID available for processing (newOrgId is null)");
          }
        }

        if (!isFounderFlow) {
          try {
            await createReportEntries({
              supabase,
              companyId: finalCompanyId,
              items,
              personaVariant: "company",
            });
          } catch (reportErr) {
            console.log("Report creation failed:", reportErr);
            toast.error(reportErr.message || "Payment succeeded, but report queueing failed.");
          }
        }

        // Success and Cleanup
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

        // Save the user ID (founder or investor) for later logs, if available
        if (paymentUserId) {
          setCreatedUserId(paymentUserId);
        }

        logEvent({
          companyId,
          userId: paymentUserId, // Use the synced Auth ID when available
          eventType: "Payment successful",
        });
      }
    } catch (err) {
      console.log("Checkout error:", err);
      toast.error(err.message || "An error occurred during checkout");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTakeToDocuments = async () => {
    // Log "Click on Take me to my documents button"
    await logEvent({
      companyId,
      userId: createdUserId, // Use the synced ID stored in state
      eventType: "Click on Take me to my documents button",
    });

    // Log "Redirect to login page"
    await logEvent({
      companyId,
      userId: createdUserId, // Use the synced ID stored in state
      eventType: "Redirect to login page",
    });

    // Final redirect
    router.push("/login");
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
                    onClick={handleTakeToDocuments}
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
                    {/* <span style={{ fontSize: 18, lineHeight: 1 }}>←</span> */}
                    Take me to my documents
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
                            <CardNumberElement
                              options={elementOptions}
                              onChange={(e) => handleElementChange("card", e)}
                            />
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
                            style={{ width: "50%", padding: "10px 14px" }}
                          >
                            <CardExpiryElement
                              options={elementOptions}
                              onChange={(e) => handleElementChange("expiry", e)}
                            />
                          </div>

                          <div
                            className="payment-field payment-cvc"
                            style={{ width: "50%", padding: "10px 14px" }}
                          >
                            <CardCvcElement
                              options={elementOptions}
                              onChange={(e) => handleElementChange("cvc", e)}
                            />
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
