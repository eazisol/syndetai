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
  const [userData,setUserData]=useState(null)
  const getUserData= async()=> {
    try {
      const supabase = getSupabase();
      const { data: { user }, error } = await supabase.auth.getUser()
    
      if (error) {
        console.log('Error fetching user:', error.message)
        return null
      }

      if (user) {
        // Fetch user details from app_users table including organization_id
        const { data: userDetails, error: userError } = await supabase
          .from('app_users')
          .select('id, email, username, is_admin, is_superadmin, organisation_id')
          .eq('id', user.id)
          .maybeSingle();

        if (userError) {
          console.log('Error fetching user details:', userError);
        }

        // Combine auth user data with app_users data
        const combinedUserData = {
          ...user,
          ...userDetails,
          organisation_id: userDetails?.organisation_id || null
        };

        setUserData(combinedUserData);
      }
    } catch (error) {
      console.log('Error in getUserData:', error);
    }
  }
  useEffect(() => {
    getUserData()
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
