'use client';

import React, { useState } from 'react';
import Sidebar from './Sidebar';
import MobileHeader from './MobileHeader';
import RequestNewReport from './RequestNewReport';
import PreviousSubmissions from './PreviousSubmissions';
import ManageAccount from './ManageAccount';
import AddCredits from './AddCredits';
import LoginScreen from './LoginScreen';
import { useApp } from '../context/AppContext';
import Cards from './newdesign/Cards';
import HomeAlt from './newdesign/HomeAlt';
import LogsDetailed from './LogsDetailed';

function App() {
  const { activePage } = useApp();
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };
// here we have a routing system for the app
  const renderMainContent = () => {
    switch (activePage) {
      case 'Home':
      return (
        <div className="main-content">
          <div className="borderBottom" />
          <Cards />
        </div>
      );
      case 'Home1':
      return (
        <div className="main-content">
          <div className="borderBottom" />
          <HomeAlt />
        </div>
      );
      case 'Library':
        return (
          <div className="main-content">
            <div className="borderBottom" />
            <PreviousSubmissions />
          </div>
        );
      case 'New Request':
        return (
          <div className="main-content">
            <RequestNewReport />
          </div>
        );
      case 'Manage Account':
        return (
          <div className="main-content">
            <ManageAccount />
          </div>
        );
      case 'Add Credits':
        return (
          <div className="main-content">
            <AddCredits />
          </div>
        );
         case 'Logs':
        return (
          <div className="main-content">
            <div className="borderBottom" />
            {/* <LogsDetailed /> */}
          </div>
        );
      default:
        return (
          <div className="main-content">
            <div className="borderBottom" />
            <PreviousSubmissions />
          </div>
        );
    }
  };
// render main content
  // Show login screen if not logged in
  if (!isLoggedIn) {
    return <LoginScreen onLogin={handleLogin} />;
  }
// return app
  // Show dashboard if logged in
  return (
    <div className="app">
      <MobileHeader />
      <div className="app-content">
        <div className="desktop-sidebar">
          <Sidebar />
        </div>
        {renderMainContent()}
      </div>
    </div>
  );
}

export default App;
