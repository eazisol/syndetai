"use client";
 
import React, { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { CartProvider } from "@/components/newdesign/CartContext";
import HomePage from "@/components/newdesign/HomePage";

function FounderProductContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("company_id");
  const userId = searchParams.get("user_id") || searchParams.get("uuid");

  return (
    <CartProvider companyId={companyId} userId={userId}>
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
