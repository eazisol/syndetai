"use client";

import React, { useState } from "react";
// import { useCart } from "../cart/CartContext";

const bundles = [
  {
    id: "market",
    icon: "/images/marketing.png",
    title: "Market Analysis Bundle",
    desc: "Complete market intelligence package",
    saveBadge: "SAVE £100",
    price: "£800",
    oldPrice: "£900",
    headerIcon: "/images/goldstar.png",
    headerLabel: "Annual Benefits:",
    features: [
      "Quarterly report updates",
      "Priority support access",
      "Market trend alerts",
    ],
    showSave30: true,
  },
  {
    id: "fundraising",
    icon: "/images/fundraising.png",
    title: "Fundraising Readiness",
    desc: "Complete package for investors",
    saveBadge: "SAVE £250",
    price: "£650",
    oldPrice: "£900",
    headerIcon: "/images/include.png",
    headerLabel: "What's Included:",
    features: [
      "Company Research Report",
      "Competitive Analysis Report",
      "Company Deep Dive",
    ],
    showSave30: false,
  },
];

export default function ValueCards() {
  const [billing, setBilling] = useState(() =>
    Object.fromEntries(bundles.map((b) => [b.id, "oneoff"]))
  );

  const setPlan = (id, plan) => {
    setBilling((prev) => ({ ...prev, [id]: plan }));
  };

  // const { addToCart } = useCart();

  return (
    <section className="mi-section py-5">
      <div className="container mi-container">
        <div className="text-center mb-5">
          <div className="mi-top-pill mx-auto mb-3">
            <img
              src="/images/logo.png"
              alt="Best value bundles"
              className="mi-top-pill-icon"
            />
            <span>Best Value Bundles</span>
          </div>

          <h2 className="mi-hero-title">
            Save More with <span className="mi-accent">Bundles</span>
          </h2>
          <p className="mi-hero-subtitle mx-auto">
            Get multiple reports at a discounted price
          </p>
        </div>

        <div className="row g-4">
          {bundles.map((bundle) => {
            const isAnnual = billing[bundle.id] === "annual";

            return (
              <div className="col-12 col-lg-6" key={bundle.id}>
                <div className="mi-card h-100 d-flex flex-column">
                  <div className="mi-card-body flex-grow-1">
                    <div className="mi-icon-box">
                      <img
                        src={bundle.icon}
                        alt={bundle.title}
                        className="mi-icon"
                      />
                    </div>

                    <div className="d-flex justify-content-between align-items-start">
                      <h3
                        className="mi-card-title"
                        style={{ fontSize: "24px" }}
                      >
                        {bundle.title}
                      </h3>

                      <span className="mi-save-badge">{bundle.saveBadge}</span>
                    </div>

                    <p className="mi-card-desc mb-3">{bundle.desc}</p>

                    <div
                      className="mi-toggle"
                      role="group"
                      aria-label="Billing"
                    >
                      <span
                        className={`mi-toggle-pill ${isAnnual ? "right" : ""}`}
                      />

                      <button
                        type="button"
                        className={`mi-toggle-btn ${!isAnnual ? "active" : ""}`}
                        onClick={() => setPlan(bundle.id, "oneoff")}
                      >
                        One-time Purchase
                      </button>

                      <button
                        type="button"
                        className={`mi-toggle-btn ${isAnnual ? "active" : ""}`}
                        onClick={() => setPlan(bundle.id, "annual")}
                      >
                        Annual Plan
                      </button>
                    </div>

                    <div className="mi-price-row mt-3">
                      <div>
                        <div className="d-flex align-items-baseline gap-2">
                          <span className="mi-price">{bundle.price}</span>

                          {isAnnual && (
                            <span className="text-muted text-decoration-line-through fw-semibold">
                              {bundle.oldPrice}
                            </span>
                          )}
                          {isAnnual && <span className="mi-per">/ year</span>}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="d-flex align-items-center gap-2 mb-2">
                        <img
                          src={bundle.headerIcon}
                          alt=""
                          className="mi-feature-icon"
                        />

                        <span className="mi-feature-text fw-semibold">
                          {bundle.headerLabel}
                        </span>

                        {bundle.showSave30 && isAnnual && (
                          <span className="mi-save-badge ms-auto">
                            Save 30%
                          </span>
                        )}
                      </div>

                      <ul className="list-unstyled mb-0">
                        {bundle.features.map((text, idx) => (
                          <li
                            key={idx}
                            className="d-flex align-items-start mi-feature"
                          >
                            <img
                              src="/images/shieldtick.png"
                              alt=""
                              className="mi-feature-icon"
                            />
                            <span className="mi-feature-text">{text}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <div className="mi-card-footer mt-3">
                    <button
                      type="button"
                      className="mi-btn w-100 d-flex align-items-center justify-content-center gap-2"
                    >
                      <img className="mi-cart-img" src="/cart.svg" alt="" />
                      <span>Add to basket</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
