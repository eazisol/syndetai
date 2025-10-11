"use client";
import MobileHeader from "../../components/MobileHeader";
import Sidebar from "../../components/Sidebar";
import AddCredits from "../../components/AddCredits";

export default function AddCreditsPage() {
  return (
    <div className="app">
      <MobileHeader />
      <div className="app-content">
        <div className="desktop-sidebar">
          <Sidebar />
        </div>
        <div className="main-content">
          <AddCredits />
        </div>
      </div>
    </div>
  );
}


