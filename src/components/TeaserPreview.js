'use client';

import React from "react";
import { useSearchParams } from "next/navigation";
import Footer from "./newdesign/Footer";
import Image from "next/image";

export default function TeaserPreview({ companyId, pdfUrl, onOpenFullReport }) {
  const searchParams = useSearchParams();
  const uuid = searchParams?.get("uuid");

  return (
    <>
      <header className="mi-navbar sticky-top">
        <div className="container">
          <div className="d-flex align-items-center justify-content-between mi-navbar-inner">
            {/* Logo */}
            <Image
              src="/logo.svg"
              alt="SyndetAI Logo"
              width={24}
              height={24}
              className="logo-svg"
            />
          </div>
        </div>
      </header>

      {pdfUrl && (
        <div style={{ padding: "0 90px" }}>
          <div
            className="pdf-viewer mb-8 mt-4"
            style={{
              marginBottom: "30px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
            }}
          >
            <div
              style={{
                height: "570px",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Teaser Document"
              />
            </div>

            <div style={{ display: "flex", justifyContent: "center" }}>
              <button
                onClick={onOpenFullReport}
                className="nf-btn mt-3"
                style={{
                  padding: "12px 24px",
                  backgroundColor: "#000",
                  color: "#fff",
                  textDecoration: "none",
                  borderRadius: "6px",
                  fontWeight: "600",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                Open Full Report
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
