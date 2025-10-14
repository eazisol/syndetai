"use client";
import MobileHeader from "../../components/MobileHeader";
import Sidebar from "../../components/Sidebar";
import RequestNewReport from "../../components/RequestNewReport";
import Protected from "../../components/Protected";

export default function NewRequestPage() {
  return (
    <Protected>
      <div className="app">
        <MobileHeader />
        <div className="app-content">
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
          <div className="main-content">
            {/* <h2 className="section-title">New Request</h2> */}
            <RequestNewReport />
          </div>
        </div>
      </div>
    </Protected>
  );
}


