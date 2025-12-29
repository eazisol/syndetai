'use client';

import React from "react";
import Link from "next/link";

export default function Page404() {
  return (
    <div className="nf-wrap">
      <div className="nf-content">
        <div className="nf-404">404</div>

        <p className="nf-text">
          We can't seem to find a page you're looking for.
        </p>

        {/* <Link href="/" className="nf-btn">
          BACK TO HOMEPAGE
        </Link> */}
      </div>

      {/* soft bottom arc */}
      <div className="nf-arc" />
    </div>
  );
}
