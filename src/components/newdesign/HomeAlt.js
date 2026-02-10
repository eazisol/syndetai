"use client";

import Image from "next/image";
import { useState } from "react";
import { useCart } from "./CartContext";
import { PRODUCT1_PACKAGES } from "@/config/packagesConfig";

export default function HomeAlt() {
  const { addToCart } = useCart();

  // Initialize plans with billing state from config
  const [plans, setPlans] = useState(
    PRODUCT1_PACKAGES.map(pkg => ({ ...pkg, billing: "oneoff" }))
  );

  const setBilling = (id, billing) => {
    setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, billing } : p)));
  };

  return (
    <section className="mi-section py-5">
      <div className="container mi-container">
        <div className="text-center">
          <div className="mi-top-pill mx-auto">
            <Image
              className="mi-top-pill-icon"
              src="/images/logo.png"
              alt=""
              width={24}
              height={24}
            />

            <span>Premium Research Products</span>
          </div>

          <h1 className="mi-hero-title mt-3">
            Unlock Market <span className="mi-accent">Intelligence</span>
          </h1>

          <p className="mi-hero-subtitle mx-auto mb-0">
            Professional research reports and competitive analysis to drive your
            <br className="d-none d-md-block" />
            business forward
          </p>
        </div>

        <div className="d-flex justify-content-between align-items-center mt-5 mb-5">
          <div className="mi-section-left">Individual Reports</div>
          <div className="mi-section-right">Choose your research package</div>
        </div>

        <div className="row row-cols-1 row-cols-lg-3 g-4 align-items-stretch">
          {plans.map((plan, idx) => {
            const isAnnual = plan.billing === "annual";
            const price = isAnnual ? plan.priceAnnual : plan.priceOneOff;

            return (
              <div className="col d-flex" key={plan.id}>
                <div
                  className={`mi-card d-flex flex-column flex-fill ${idx === 1 ? "hover-card mi-card-featured" : ""
                    }`}
                >
                  {idx === 1 && (
                    <div className="mi-popular-badge">Most Popular</div>
                  )}
                  {idx === 1 && isAnnual && (
                    <div className="mi-save100-top">SAVE £100</div>
                  )}

                  <div
                    className={
                      idx === 1 ? "mi-card-bodyy flex-grow-1" : "mi-card-body flex-grow-1"
                    }
                  >
                    <div className={idx === 1 ? "mi-icon-boxx" : "mi-icon-box"}>
                      <Image
                        className="mi-icon"
                        src={plan.icon}
                        alt=""
                        width={48}
                        height={48}
                      />
                    </div>

                    <div className="mi-box">
                      <h5 className="mi-card-title">{plan.title}</h5>
                      <p className="mi-card-desc">{plan.desc}</p>
                    </div>

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
                        onClick={() => setBilling(plan.id, "oneoff")}
                      >
                        One-off
                      </button>

                      <button
                        type="button"
                        className={`mi-toggle-btn ${isAnnual ? "active" : ""}`}
                        onClick={() => setBilling(plan.id, "annual")}
                      >
                        Annual
                      </button>
                    </div>

                    <div className="mi-price-row">
                      <div className="mi-price">
                        {price}
                        {/* {isAnnual && plan.perAnnual ? (
                          <span className="mi-per"> {plan.perAnnual}</span>
                        ) : null} */}
                        {isAnnual && plan.perAnnual && !(idx === 1) ? (
                          <span className="mi-per"> {plan.perAnnual}</span>
                        ) : null}

                        {idx === 1 && isAnnual ? (
                          <span className="mi-price-old">£900/year</span>
                        ) : null}
                      </div>

                      {isAnnual && plan.save ? (
                        <span className="mi-save-badge">{plan.save}</span>
                      ) : null}
                    </div>

                    <ul className="mi-features list-unstyled m-0">
                      {plan.features.map((f, i) => (
                        <li
                          className="mi-feature d-flex align-items-start"
                          key={i}
                        >
                          <Image
                            className="mi-feature-icon"
                            src={f.icon}
                            alt=""
                            width={16}
                            height={16}
                          />

                          <span className="mi-feature-text">{f.text}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div
                    className={
                      idx === 1 ? "mi-card-footerr mt-auto" : "mi-card-footer mt-auto"
                    }
                  >
                    {/* <button
                      type="button"
                      className="mi-btn w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: "#60A5FA" }}
                    > */}
                    <button
                      type="button"
                      className="mi-btn w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: "#60A5FA" }}
                      onClick={() =>
                        addToCart({
                          title: plan.title,
                          type: isAnnual ? "Annual" : "One-off",
                          price:
                            Number(String(price).replace(/[^0-9.]/g, "")) || 0,
                        })
                      }
                    >
                      <Image
                        className="mi-cart-img"
                        src="/cart.svg"
                        alt=""
                        width={18}
                        height={18}
                      />

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
