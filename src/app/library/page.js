"use client";
import MobileHeader from "../../components/MobileHeader";
import Sidebar from "../../components/Sidebar";
import PreviousSubmissions from "../../components/PreviousSubmissions";

export default function LibraryPage() {
  return (
    <div className="app">
      <MobileHeader />
      <div className="app-content">
        <div className="desktop-sidebar">
          <Sidebar />
        </div>
        <div className="main-content-library" >
          <PreviousSubmissions />
        </div>
      </div>
    </div>
  );
}


