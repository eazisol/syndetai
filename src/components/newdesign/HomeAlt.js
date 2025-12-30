"use client";

import Image from "next/image";
import { useState } from "react";
// import { useCart } from "./cart/CartContext";

export default function HomeAlt() {
  // const { addToCart } = useCart();

  const [plans, setPlans] = useState([
    {
      id: 1,
      icon: "/companyR.svg",
      title: "Company Research Report",
      desc: "Comprehensive analysis of company performance, market position, and strategic insights.",
      billing: "oneoff",
      priceOneOff: "£300",
      priceAnnual: "£300",
      perAnnual: "/ year",
      save: "",
      features: [
        { icon: "/clock.svg", text: "24h delivery" },
        { icon: "/file.svg", text: "PDF & Excel formats" },
        { icon: "/tick.svg", text: "Email support" },
      ],
    },

    {
      id: 2,
      icon: "/images/Banalysis.png",
      title: "Competitive Analysis",
      desc: "In-depth competitive landscape analysis with market positioning and strategies.",
      billing: "oneoff",
      priceOneOff: "£500",
      priceAnnual: "£500",
      perAnnual: "/ year",
      save: "Save 30%",
      features: [
        { icon: "/Gaccess.svg", text: "Quarterly updates" },
        { icon: "/Greports.svg", text: "Priority support" },
        { icon: "/Ganalysis.svg", text: "Data archive access" },
      ],
    },
    {
      id: 3,
      icon: "/images/fund.png",
      title: "Company Deep Dive",
      desc: "Detailed examination of company operations, financials, and growth opportunities.",
      billing: "oneoff",
      priceOneOff: "£300",
      priceAnnual: "£300",
      perAnnual: "/ year",
      save: "",
      features: [
        { icon: "/clock.svg", text: "3-day turnaround" },
        { icon: "/file.svg", text: "Financial model" },
        { icon: "/tick.svg", text: "Raw data access" },
      ],
    },
  ]);

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
                  className={`mi-card d-flex flex-column flex-fill ${
                    idx === 1 ? "hover-card mi-card-featured" : ""
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
                      idx === 1 ? "mi-card-bodyy " : "mi-card-body flex-grow-1"
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
                      idx === 1 ? "mi-card-footerr " : "mi-card-footer mt-auto"
                    }>
                    <button
                      type="button"
                      className="mi-btn w-100 d-flex align-items-center justify-content-center gap-2"
                      style={{ background: "#60A5FA" }}
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
