'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '../context/AppContext';
import CustomInputField from './CustomInputField';
import CustomButton from './CustomButton';
import ConfirmModal from './ConfirmModal';
import { toast } from 'react-toastify';
// Supabase will be imported dynamically to avoid SSR env issues
import { v4 as uuidv4 } from 'uuid';

let supabase = null;
async function ensureSupabase() {
  if (supabase) return supabase;
  const { getSupabase } = await import('../supabaseClient');
  supabase = getSupabase();
  return supabase;
}

const ManageAccount = () => {
  const { users, addUser, removeUser } = useApp();
  const [orgUsers, setOrgUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Organization ID
  const organizationId = '1aa7dc0d-e404-45cf-b3e9-02f44151913f';
  
  const [inviteForm, setInviteForm] = useState({
    username: '',
    email: ''
  });

  // Supabase function to fetch users data
  const fetchUsersData = async (orgId) => {
    try {
      setIsLoading(true);
      
      const client = await ensureSupabase();
      const { data, error } = await client
        .from('app_users')
        .select('id, email, username, is_admin, is_active')
        .eq('organisation_id', orgId)
        .eq('is_active', true);
  
      if (error) {
        console.error('Supabase error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch organization users on component mount
  useEffect(() => {
    const loadUsers = async () => {
      const data = await fetchUsersData(organizationId);
      setOrgUsers(data);
    };
    loadUsers();
  }, [organizationId]);

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.username || !inviteForm.email) return;

    try {
      // 1) Send magic link (simple call as requested)
      const client = await ensureSupabase();
      const { error: otpError } = await client.auth.signInWithOtp({ email: inviteForm.email.trim() });
      if (otpError) {
        toast.error(otpError.message || 'Failed to send invite', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      // 2) Save to pending_invites
      const { error: insertError } = await client
        .from('pending_invites')
        .insert([{
          email: inviteForm.email.trim(),
          username: inviteForm.username.trim(),
          organisation_id: organizationId,
          invited_at: new Date().toISOString()
        }]);
      if (insertError) {
       
        toast.error('Invite sent but logging failed', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
      }

      // 3) Also create an entry in app_users so admins can manage immediately
      try {
        const newUserRow = {
          id: uuidv4(),
          username: inviteForm.username.trim(),
          email: inviteForm.email.trim(),
          is_admin: true,
          is_active: true,
          organisation_id: organizationId
        };
        const { data: newUser, error: userErr } = await client
          .from('app_users')
          .insert([newUserRow])
          .select('id, email, username, is_admin, is_active')
          .maybeSingle();
        if (!userErr && newUser) {
          setOrgUsers(prev => [newUser, ...prev]);
        }
      } catch {}

      toast.success('Invite sent successfully.', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });

      // Reset form
      setInviteForm({ username: '', email: '' });
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to send invite', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  const handleInputChange = (e) => {
    setInviteForm({
      ...inviteForm,
      [e.target.name]: e.target.value
    });
  };

  const [confirmState, setConfirmState] = useState({ open: false, userId: null, name: '' });

  const openConfirm = (user) => {
    setConfirmState({ open: true, userId: user.id, name: user.username });
  };

  const closeConfirm = () => setConfirmState({ open: false, userId: null, name: '' });

  const confirmDelete = async () => {
    if (confirmState.userId != null) {
      try {
        const removed = orgUsers.find(u => u.id === confirmState.userId);
        
        // Update user in Supabase to set is_active = false
        const client = await ensureSupabase();
        const { error } = await client
          .from('app_users')
          .update({ is_active: false })
          .eq('id', confirmState.userId);
        
        if (error) {
          toast.error('Failed to delete user', {
            autoClose: 4000,
            pauseOnHover: false,
            pauseOnFocusLoss: false
          });
          return;
        }
        
        setOrgUsers(prev => prev.filter(u => u.id !== confirmState.userId));
        toast.success(`${removed?.username || 'User'} deleted`, {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
      } catch (error) {
        toast.error('Failed to delete user', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
      }
    }
    closeConfirm();
  };

  const toggleAdmin = async (userId) => {
    try {
      const user = orgUsers.find(u => u.id === userId);
      const newAdminStatus = !user.is_admin;
      
      // Update admin status in Supabase
      const client = await ensureSupabase();
      const { error } = await client
        .from('app_users')
        .update({ is_admin: newAdminStatus })
        .eq('id', userId);
      
      if (error) {
        toast.error('Failed to update admin status', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }
      
      // Update local state
      setOrgUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_admin: newAdminStatus }
          : user
      ));
      
      toast.success('Admin status updated', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } catch (error) {
      toast.error('Failed to update admin status', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  return (
    <>
    <div className="manage-account-section">
      <h2 className="section-title">Users in Your Organisation</h2>
      
      {/* Users Table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading organization users...</p>
          </div>
        ) : orgUsers.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            {/* <p style={{ color: '#5F6368', fontSize: '16px' }}>No data found</p> */}
            <p style={{ color: '#5F6368', fontSize: '14px', marginTop: '8px' }}>
              No users found for this organization
            </p>
          </div>
        ) : (
          <table className="submissions-table">
            <thead>
              <tr> 
                <th>USERNAME</th>
                <th>EMAIL</th> 
                <th>ADMIN</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orgUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>
                    <input 
                      type="checkbox" 
                      checked={user.is_admin}
                      onChange={() => toggleAdmin(user.id)}
                      className="admin-checkbox"
                    />
                  </td>
                  <td>
                    <div className="action-buttons position-check">
                      <button 
                        onClick={() => openConfirm(user)}
                        className="delete-btn-manage" 
                        title="Delete User"
                      >
                        <Image src="/delete.svg" alt="Delete User" width={16} height={16} className="action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="borderBottom" style={{ marginTop: '3%' }} />
      <div className="invite-section" style={{ marginTop: '3%' }}>
        <h2 className="section-title">Invite a New User</h2>
        <form onSubmit={()=>{}} className="invite-form">
        {/* <form onSubmit={handleInviteSubmit} className="invite-form"> */}
          <div className="row g-0 g-lg-5">
            <div className="col-12 col-md-6 col-lg-4">
              <CustomInputField
                type="text"
                name="username"
                placeholder="Username"
                value={inviteForm.username}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-12 col-md-6 col-lg-4">
              <CustomInputField
                type="email"
                name="email"
                placeholder="Email"
                value={inviteForm.email}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="col-12 col-md-12 col-lg-4 d-flex align-items-end justify-content-center justify-content-md-start">
              <CustomButton type="submit" className='manage-account-button'>
                Send Invite
              </CustomButton>
            </div>
          </div>
        </form>
      </div>
    </div>
    <ConfirmModal
      open={confirmState.open}
      title={`Delete ${confirmState.name}?`}
      onConfirm={confirmDelete}
      onCancel={closeConfirm}
    />
    </>
  );
};

export default ManageAccount;
