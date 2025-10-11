'use client';

import { createContext, useContext, useState } from 'react';

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  // User state
  const [user, setUser] = useState({
    email: 'partha@syndeticai.com',
    credits: 46
  });

  // Submissions data
  const [submissions, setSubmissions] = useState([
    {
      id: 1,
      company: 'Earthena AI',
      website: 'earthena.ai',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-15',
      queuePosition: 0
    },
    {
      id: 2,
      company: 'PES Technologies',
      website: 'pes.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-16',
      queuePosition: 0
    },
    {
      id: 3,
      company: 'Opera AI',
      website: 'opera.ai',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 1
    },
    {
      id: 4,
      company: 'BlinkOps',
      website: 'blinkops.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 2
    },
    {
      id: 5,
      company: 'Clear Leaf',
      website: 'clearleaf.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-14',
      queuePosition: 0
    },
    {
      id: 6,
      company: 'Dyna Risk',
      website: 'dynarisk.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-13',
      queuePosition: 0
    },
    {
      id: 7,
      company: 'Drizz',
      website: 'drizz.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 3
    },
    {
      id: 8,
      company: 'TechFlow Solutions',
      website: 'techflow.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-16',
      queuePosition: 0
    },
    {
      id: 9,
      company: 'DataSync Inc',
      website: 'datasync.io',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-12',
      queuePosition: 0
    },
    {
      id: 10,
      company: 'CloudVault',
      website: 'cloudvault.net',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 4
    },
    {
      id: 11,
      company: 'Earthena AI',
      website: 'earthena.ai',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-15',
      queuePosition: 0
    },
    {
      id: 12,
      company: 'PES Technologies',
      website: 'pes.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-16',
      queuePosition: 0
    },
    {
      id: 13,
      company: 'Opera AI',
      website: 'opera.ai',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 1
    },
    {
      id: 14,
      company: 'BlinkOps',
      website: 'blinkops.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 2
    },
    {
      id: 15,
      company: 'Clear Leaf',
      website: 'clearleaf.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-14',
      queuePosition: 0
    },
    {
      id: 16,
      company: 'Dyna Risk',
      website: 'dynarisk.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-13',
      queuePosition: 0
    },
    {
      id: 17,
      company: 'Drizz',
      website: 'drizz.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 3
    },
    {
      id: 18,
      company: 'TechFlow Solutions',
      website: 'techflow.com',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-16',
      queuePosition: 0
    },
    {
      id: 19,
      company: 'DataSync Inc',
      website: 'datasync.io',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-12',
      queuePosition: 0
    },
    {
      id: 20,
      company: 'CloudVault',
      website: 'cloudvault.net',
      requestedBy: 'partha@syndeticai.com',
      status: '-',
      batchDate: '2025-01-17',
      queuePosition: 4
    }
  ]);

  // Users data
  const [users, setUsers] = useState([
    {
      id: 1,
      username: 'Antonia Logue',
      email: 'antonia@syndeticai.com',
      isAdmin: true
    },
    {
      id: 2,
      username: 'Partha Bose',
      email: 'partha@syndeticai.com',
      isAdmin: true
    },
    {
      id: 3,
      username: 'Pat Bosch',
      email: 'partha.bose@gmail.com',
      isAdmin: false
    },
    {
      id: 4,
      username: 'Antonia Logue',
      email: 'antonia@syndeticai.com',
      isAdmin: true
    },
    {
      id: 5,
      username: 'Partha Bose',
      email: 'partha@syndeticai.com',
      isAdmin: true
    },
    {
      id: 6,
      username: 'Pat Bosch',
      email: 'partha.bose@gmail.com',
      isAdmin: false
    },
    {
      id: 7,
      username: 'Antonia Logue',
      email: 'antonia@syndeticai.com',
      isAdmin: true
    },
    {
      id: 8,
      username: 'Partha Bose',
      email: 'partha@syndeticai.com',
      isAdmin: true
    },
    {
      id: 9,
      username: 'Pat Bosch',
      email: 'partha.bose@gmail.com',
      isAdmin: false
    }
  ]);

  // Other states
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState('Library');

  // Simple functions
  const addSubmission = (newSubmission) => {
    setSubmissions([newSubmission, ...submissions]);
  };

  const updateCredits = (newCredits) => {
    setUser({ ...user, credits: newCredits });
  };

  const addUser = (newUser) => {
    setUsers([...users, newUser]);
  };

  const removeUser = (userId) => {
    setUsers(users.filter(user => user.id !== userId));
  };

  const value = {
    user,
    users,
    submissions,
    searchQuery,
    activePage,
    setActivePage,
    setSearchQuery,
    addSubmission,
    updateCredits,
    addUser,
    removeUser
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};

// Custom hook to use context
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
