'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { getSupabase } from '../supabaseClient';

// Create context
const AppContext = createContext();

// Provider component
export const AppProvider = ({ children }) => {
  // User state
  const [user, setUser] = useState({
    email: 'partha@syndeticai.com',
    credit_balance: 46
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

  ]);

  // Users data
  const [users, setUsers] = useState([
    {
      id: 1,
      username: 'Antonia Logue',
      email: 'antonia@syndeticai.com',
      isAdmin: true
    },

  ]);

  // Other states
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState('Library');
  const [userData, setUserData] = useState(null)
  const getUserData = async () => {
    try {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser()

      if (error) {
        console.log('Error fetching user:', error.message)
        return null
      }

      if (user) {
        // Fetch user details from app_users table including organisation_id
        const { data: userDetails, error: userError } = await supabase
          .from('users')
          .select('id, email, username, is_admin, is_superadmin, organisation_id, account_type')
          .eq('id', user.id)
          .maybeSingle();

        if (userError) {
          console.log('Error fetching user details from syndet.users:', userError);
        }

        // Check if user is superadmin from either DB or auth metadata
        const isSuperadmin = Boolean(userDetails?.is_superadmin) ||
          Boolean(user.app_metadata?.is_superadmin) ||
          Boolean(user.user_metadata?.is_superadmin);

        const isAdmin = Boolean(userDetails?.is_admin) || isSuperadmin;

        if (isSuperadmin) {
          console.log('User identified as superadmin:', user.email);
        }

        let organisation = null;
        if (userDetails?.organisation_id) {
          const { data: orgRow, error: orgError } = await supabase
            .from('organisations')
            .select('*')
            .eq('id', userDetails.organisation_id)
            .maybeSingle();
          if (orgError) {
            console.log('Error fetching organisation:', orgError);
          } else {
            organisation = orgRow || null;
          }
        }
        const combinedUserData = {
          ...user,
          ...userDetails,
          is_admin: isAdmin,
          is_superadmin: isSuperadmin,
          organisation_id: userDetails?.organisation_id || null,
          organisation
        };

        setUserData(combinedUserData);
      }
    } catch (error) {
      console.log('Error in getUserData:', error);
    }
  }
  useEffect(() => {
    // Initial load
    getUserData();
    // Keep user data in sync with auth state (login/logout/refresh)
    const supabase = getSupabase();
    const { data: authListener } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        getUserData();
      }
      if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        setUserData(null);
      }
    });
    return () => {
      authListener?.subscription?.unsubscribe?.();
    }
  }, [])
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
    userData,
    refreshUserData: getUserData,
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
