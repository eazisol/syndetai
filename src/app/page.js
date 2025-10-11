"use client";
import { useState } from "react";
import MobileHeader from "../components/MobileHeader";
import Sidebar from "../components/Sidebar";
import RequestNewReport from "../components/RequestNewReport";
import PreviousSubmissions from "../components/PreviousSubmissions";

export default function Home() {
  const [activeTab, setActiveTab] = useState("Library");
  return (
    <div className="app">
      <MobileHeader />
      <div className="app-content">
        <div className="desktop-sidebar">
          <Sidebar />
        </div>
        <div className="main-content">
          <div className="dashboard-tabs">
            <button
              className={`tab-button ${activeTab === "New Request" ? "active" : ""}`}
              onClick={() => setActiveTab("New Request")}
              type="button"
            >
              New Request
            </button>
            <button
              className={`tab-button ${activeTab === "Library" ? "active" : ""}`}
              onClick={() => setActiveTab("Library")}
              type="button"
            >
              Library
            </button>
          </div>

          {activeTab === "New Request" ? (
            <>
              <RequestNewReport />
            </>
          ) : (
            <>
              <div className="borderBottom" />
              <PreviousSubmissions />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
