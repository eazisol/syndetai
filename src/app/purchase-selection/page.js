"use client";

import React, { Suspense } from "react";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";
import Protected from "@/components/Protected";
import { useSearchParams } from "next/navigation";
import { CartProvider } from "@/components/newdesign/CartContext";
import Cards from "@/components/newdesign/Cards";

function PurchaseSelectionContent() {
  const searchParams = useSearchParams();
  const companyId = searchParams.get("company_id");
  const userId = searchParams.get("user_id") || searchParams.get("uuid");

  return (
    <Protected>
      <div className="app">
        <MobileHeader />
        <div className="app-content">
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
          <div className="main-content" style={{ backgroundColor: '#fff', overflowY: 'auto', height: '100vh', width: '100%' }}>
            <CartProvider companyId={companyId} userId={userId}>
              <Cards />
            </CartProvider>
          </div>
        </div>
      </div>
    </Protected>
  );
}

export default function PurchaseSelectionPage() {
  return (
    <Suspense fallback={null}>
      <PurchaseSelectionContent />
    </Suspense>
  );
}
