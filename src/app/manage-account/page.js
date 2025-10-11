"use client";
import MobileHeader from "../../components/MobileHeader";
import Sidebar from "../../components/Sidebar";
import ManageAccount from "../../components/ManageAccount";

export default function ManageAccountPage() {
  return (
    <div className="app">
      <MobileHeader />
      <div className="app-content">
        <div className="desktop-sidebar">
          <Sidebar />
        </div>
        <div className="main-content">
          <ManageAccount />
        </div>
      </div>
    </div>
  );
}


