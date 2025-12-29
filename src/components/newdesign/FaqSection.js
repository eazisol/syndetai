"use client";

import Image from "next/image";
import React, { useState } from "react";

export default function FaqSection() {
  const faqs = [
    {
      id: 1,
      q: "How are reports delivered?",
      a: "Reports are delivered via email as downloadable files (PDF/Excel), depending on the package you choose.",
    },
    {
      id: 2,
      q: "What is the delivery timeline?",
      a: "Delivery time depends on the report type. Most reports are delivered within 24 hours to 3 business days.",
    },
    {
      id: 3,
      q: "Can I share reports with my team?",
      a: "Yes. You can share the report internally with your team for collaboration and planning.",
    },
    {
      id: 4,
      q: "How do annual updates work?",
      a: "If you select annual, you receive updated versions based on the update schedule included in your plan.",
    },
  ];

  const [openId, setOpenId] = useState(null);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className="faq-section py-5">
      <div className="container faq-container">
        {/* Icon */}
        <div className="d-flex justify-content-center mb-3">
          <div className="faq-iconBox">
            <Image
              className="faq-iconImg"
              src="/images/question.png"
              alt="Question"
              width={24}
              height={24}
            />
          </div>
        </div>

        {/* Title */}
        <h2 className="faq-title text-center mb-3">
          Frequently Asked <span className="faq-accent">Questions</span>
        </h2>
        <p className="faq-subtitle text-center mb-5">
          Everything you need to know about our reports
        </p>

        {/* Items */}
        <div className="mx-auto faq-list">
          {faqs.map((item) => {
            const isOpen = openId === item.id;

            return (
              <div
                key={item.id}
                className={`faq-item ${isOpen ? "open" : ""}`}
                role="button"
                tabIndex={0}
                onClick={() => toggle(item.id)}
                onKeyDown={(e) => e.key === "Enter" && toggle(item.id)}
              >
                <div className="d-flex align-items-center justify-content-between">
                  <div className="faq-question">{item.q}</div>

                  <span className={`faq-chevron ${isOpen ? "up" : ""}`}>▾</span>
                </div>

                {isOpen && <div className="faq-answer mt-3">{item.a}</div>}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
