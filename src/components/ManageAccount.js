'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useApp } from '../context/AppContext';
import CustomInputField from './CustomInputField';
import CustomButton from './CustomButton';
import ConfirmModal from './ConfirmModal';
import TransactionsTable from './TransactionsTable';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import { sendInviteAndCreatePendingInvite } from '../lib/invite';

let supabase = null;
async function ensureSupabase() {
  if (supabase) return supabase;
  const { getSupabase } = await import('../supabaseClient');
  supabase = getSupabase();
  return supabase;
}

const ManageAccount = () => {
  const { users, addUser, removeUser, userData } = useApp();
  const [orgUsers, setOrgUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  
  // Get Organization ID from user data
  const organizationId = userData?.organisation_id;
  
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
        console.log('Supabase error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.log('Error fetching users:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      const loadUsers = async () => {
        const data = await fetchUsersData(organizationId);
        setOrgUsers(data);
      };
      loadUsers();
    }
  }, [organizationId]);
// send invite to users here user custom component sendInviteAndCreatePendingInvite for send invite
  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    if (!inviteForm.username || !inviteForm.email || !organizationId) return;

    setIsInviting(true);
    try {
      const client = await ensureSupabase();
      const { error } = await sendInviteAndCreatePendingInvite(client, {
        email: inviteForm.email,
        username: inviteForm.username,
        organisationId: organizationId
      });
      // If error sending invite, show error toast
      if (error) {
        toast.error(error.message || 'Failed to send invite', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }
      // If invite sent successfully, show success toast
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
    } finally {
      setIsInviting(false);
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
// confirm delete user
  const confirmDelete = async () => {
    if (confirmState.userId != null) {
      try {
        const removed = orgUsers.find(u => u.id === confirmState.userId);
        
        // Update user in Supabase to set is_active false
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

  // toggle admin status
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
                <th className='text-center'>ADMIN</th>
                <th className='text-center'>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {orgUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td className='text-center'>
                    <input 
                      type="checkbox" 
                      checked={user.is_admin}
                      onChange={() => toggleAdmin(user.id)}
                      className="admin-checkbox"
                      disabled={user.id === userData?.id}
                      aria-disabled={user.id === userData?.id}
                      title={user.id === userData?.id ? 'You cannot change your own admin status' : 'Toggle admin status'}
                      style={{ cursor: user.id === userData?.id ? 'not-allowed' : 'pointer' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <div className="action-buttons position-check" style={{ justifyContent: 'center' }}>
                      <button 
                        onClick={(e) => {
                          if (user.id === userData?.id) { e.preventDefault(); e.stopPropagation(); return; }
                          openConfirm(user);
                        }}
                        className="delete-btn-manage" 
                        title={user.id === userData?.id ? 'You cannot delete yourself' : 'Delete User'}
                        aria-disabled={user.id === userData?.id}
                        style={{ display: 'inline-flex', alignItems: 'center', gap: 6, opacity: user.id === userData?.id ? 0.5 : 1, cursor: user.id === userData?.id ? 'not-allowed' : 'pointer' }}
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
        <form onSubmit={handleInviteSubmit} className="invite-form">
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
              <CustomButton 
                type="submit" 
                className='manage-account-button'
                loading={isInviting}
                loadingText="Sending..."
                disabled={isInviting}
              >
                Send Invite
              </CustomButton>
            </div>
          </div>
        </form>
      </div>
      {/* Transactions for this organisation */}
      <div className="borderBottom" style={{ marginTop: '3%' }} />
      <TransactionsTable organisationId={organizationId} title={'Transactions'} />
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
