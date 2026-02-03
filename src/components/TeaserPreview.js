'use client';

import React from "react";
import Image from "next/image";

export default function TeaserPreview({ pdfUrl, onOpenFullReport }) {
  return (
    <div className="teaser-preview-backdrop">
      <div className="teaser-preview-modal-content">
        {/* Popup Header */}
        <div className="teaser-preview-modal-header">
          <Image
            src="/logo.svg"
            alt="SyndetAI Logo"
            width={120}
            height={40}
            className="logo-svg"
            style={{ marginLeft: 0 }}
          />
        </div>

        {/* Popup Body with PDF */}
        <div className="teaser-preview-modal-body">
          {pdfUrl && (
            <div className="teaser-preview-pdf-wrapper">
              <iframe
                src={pdfUrl}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                title="Teaser Document"
              />
            </div>
          )}
        </div>

        {/* Popup Footer with Button */}
        <div className="teaser-preview-modal-footer">
          <button
            onClick={onOpenFullReport}
            className="nf-btn"
            style={{
              padding: "12px 32px",
              backgroundColor: "#000",
              color: "#fff",
              borderRadius: "8px",
              fontWeight: "600",
              border: "none",
              cursor: "pointer",
              fontSize: "16px"
            }}
          >
            Open Full Report
          </button>
        </div>
      </div>
    </div>
  );
}
