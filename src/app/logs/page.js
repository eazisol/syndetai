"use client";

import React, { Suspense } from "react";
import LogsDetailed from "@/components/LogsDetailed";
import Protected from "@/components/Protected";
import MobileHeader from "@/components/MobileHeader";
import Sidebar from "@/components/Sidebar";

export default function Logs() {
  return (
    <>

      <Protected requireSuperadmin={true}>
        <div className="app">
          <MobileHeader />
          <div className="app-content">
            <div className="desktop-sidebar">
              <Sidebar />
            </div>
            <div className="main-content-library" >
              <LogsDetailed />
            </div>
          </div>
        </div>
      </Protected>
    </>

  );
}
