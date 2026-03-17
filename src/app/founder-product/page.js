"use client";

import React, { Suspense } from "react";
import { CartProvider } from "@/components/newdesign/CartContext";
import HomePage from "@/components/newdesign/HomePage";

function FounderProductContent() {
  return (
    <CartProvider companyId={null} userId={null}>
      <HomePage />
    </CartProvider>
  );
}

export default function FounderProductPage() {
  return (
    <Suspense fallback={null}>
      <FounderProductContent />
    </Suspense>
  );
}

