'use client';

import React, { useMemo, useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useApp } from '../../context/AppContext';
import CustomInputField from '../../components/CustomInputField';
import CustomButton from '../../components/CustomButton';
import { toast } from 'react-toastify';
import MobileHeader from '../../components/MobileHeader';
import Sidebar from '../../components/Sidebar';
import ConfirmModal from '../../components/ConfirmModal';
import { v4 as uuidv4 } from 'uuid';
import { sendInviteAndCreatePendingInvite } from '../../lib/invite';
import { Eye, Download, Plus } from 'lucide-react';
// Supabase client will be imported dynamically where used to avoid build-time env requirement
import Image from 'next/image';
import Protected from '../../components/Protected';
import TransactionsTable from '../../components/TransactionsTable';
import ReportPreviewModal from '../../components/ReportPreviewModal';
function SuperadminContent() {
  const { submissions, refreshUserData } = useApp();
  const searchParams = useSearchParams();
  const orgIdFromUrl = searchParams.get('orgId');
  const [transactions, setTransactions] = useState([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  // Organisations state with Supabase integration
  const [organisations, setOrganisations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);
  const [showOrgForm, setShowOrgForm] = useState(false);
  const handleDownload = async (reportUrl, companyName) => {
    try {
      if (!reportUrl) return;
      const response = await fetch(reportUrl);
      if (!response.ok) return;
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${companyName || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.log('Download failed', e);
    }
  };

  const handleViewReport = (reportUrl, companyName) => {
    setPreviewModal({
      isOpen: true,
      reportUrl: reportUrl,
      companyName: companyName || 'Report'
    });
  };

  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      reportUrl: null,
      companyName: ''
    });
  };
  // Fetch transactions from Supabase
  const fetchTransactions = async (orgId) => {
    try {
      setIsLoadingTransactions(true);
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      let query = supabase
        .from('transactions')
        .select(`
          id,
          organisation_id,
          payment_intent,
          created_at,
          organisations!inner(name)
        `)
        .order('created_at', { ascending: false });
      if (orgId) {
        query = query.eq('organisation_id', orgId);
      }
      const { data, error } = await query;
      if (error) {
        console.log('Supabase error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.log('Error fetching transactions:', error);
      return [];
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  // Load transactions when organisation changes
  useEffect(() => {
    const loadTransactions = async () => {
      const data = await fetchTransactions(selectedOrgId);
      setTransactions(data);
    };
    loadTransactions();
  }, [selectedOrgId]);



  const selectedOrganisation = useMemo(() => {
    return organisations.find(o => o.id === selectedOrgId) || null;
  }, [organisations, selectedOrgId]);

  // Fetch organisations from Supabase
  const fetchOrganisations = async () => {
    try {
      setIsLoadingOrgs(true);
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching organisations:', error);

        return;
      }

      setOrganisations(data || []);
      // Only set default if there is no selectedOrgId AND no orgId in the URL
      if (data && data.length > 0 && !selectedOrgId && !orgIdFromUrl) {
        setSelectedOrgId(data[0].id);
      }
    } catch (error) {
      console.log('Error fetching organisations:', error);

    } finally {
      setIsLoadingOrgs(false);
    }
  };

  // Load organisations on component mount
  useEffect(() => {
    fetchOrganisations();
  }, []);

  // Handle orgId from URL
  useEffect(() => {
    if (orgIdFromUrl) {
      setSelectedOrgId(orgIdFromUrl);
    }
  }, [orgIdFromUrl]);

  // Load selected organization data when organizations are loaded and selectedOrgId is set
  useEffect(() => {
    if (selectedOrgId && organisations.length > 0) {
      const found = organisations.find(o => o.id === selectedOrgId);
      if (found) {
        setOrgForm({
          name: found.name || '',
          account_type: found.account_type || '',
          credit_balance: String(found.credit_balance || 0)
        });
        setShowOrgForm(true);
      }
    }
  }, [selectedOrgId, organisations]);

  // Org form
  const [orgForm, setOrgForm] = useState({
    name: '',
    account_type: '',
    credit_balance: '',
  });

  // Loading state for organization operations
  const [isUpdatingOrg, setIsUpdatingOrg] = useState(false);

  const handleSelectOrganisation = (e) => {
    const value = e.target.value;
    if (value === 'NEW') {
      setSelectedOrgId(null);
      setOrgForm({ name: '', account_type: '', credits: '' });
      setShowOrgForm(true);
    } else {
      setSelectedOrgId(value);
      setShowOrgForm(true);
      const found = organisations.find(o => o.id === value);
      if (found) setOrgForm({
        name: found.name || '',
        account_type: found.account_type || '',
        credit_balance: String(found.credit_balance || 0)
      });
    }
  };
  //
  // Handle add new organization
  const handleAddNewOrganization = () => {
    setSelectedOrgId(null);
    setOrgForm({ name: '', account_type: '', credit_balance: '' });
    setShowOrgForm(true);
  };

  // Handle organization form change
  const handleOrgFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrgForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  // Handle save organisation
  const handleSaveOrganisation = async (e) => {
    e.preventDefault();
    const creditsNum = Number(orgForm.credit_balance || 0);
    // account_type is now optional, only name is strictly required along with valid credits
    if (!orgForm.name || Number.isNaN(creditsNum)) {
      toast.error('Please fill the name correctly', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }

    setIsUpdatingOrg(true);
    try {
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      if (selectedOrgId == null) {
        // Create new organisation
        const { data, error } = await supabase
          .from('organisations')
          .insert([
            {
              id: uuidv4(),
              name: orgForm.name,
              account_type: orgForm.account_type || null,
              credit_balance: creditsNum,
              created_at: new Date().toISOString()
            }
          ])
          .select();

        if (error) {
          toast.error('Failed to create organisation', {
            autoClose: 4000,
            pauseOnHover: false,
            pauseOnFocusLoss: false
          });
          return;
        }

        toast.success('Organisation created successfully', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        fetchOrganisations(); // Refresh the list
        setSelectedOrgId(data[0].id);
      } else {
        // Update existing organisation - add credits instead of replacing
        const currentOrg = organisations.find(o => o.id === selectedOrgId);
        const currentCredits = currentOrg?.credit_balance || 0;
        const newCredits = currentCredits + creditsNum;

        const { error } = await supabase
          .from('organisations')
          .update({
            name: orgForm.name,
            account_type: orgForm.account_type || null,
            credit_balance: newCredits
          })
          .eq('id', selectedOrgId);

        if (error) {
          toast.error('Failed to update organisation', {
            autoClose: 4000,
            pauseOnHover: false,
            pauseOnFocusLoss: false
          });
          return;
        }

        toast.success('Organisation updated successfully', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        fetchOrganisations(); // Refresh the list
        refreshUserData(); // Refresh user data for real-time sidebar update
      }
    } catch (error) {
      console.log('Error saving organisation:', error);
      toast.error('Failed to save organisation', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } finally {
      setIsUpdatingOrg(false);
    }
  };

  // Users for selected organisation with Supabase integration
  const [orgUsers, setOrgUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [confirmState, setConfirmState] = useState({ open: false, entityId: null, name: '' });

  // Fetch users for selected organisation
  const fetchOrgUsers = async (orgId) => {
    if (!orgId) {
      setOrgUsers([]);
      return;
    }

    try {
      setIsLoadingUsers(true);
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('users')
        .select('id, email, username, is_admin, is_active')
        .eq('organisation_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching users:', error);


        return;
      }

      setOrgUsers(data || []);
    } catch (error) {
      console.log('Error fetching users:', error);

    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load users when organisation changes
  useEffect(() => {
    fetchOrgUsers(selectedOrgId);
  }, [selectedOrgId]);

  // Toggle admin
  const toggleAdmin = async (userId) => {
    if (!selectedOrgId) return;

    try {
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      const user = orgUsers.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('users')
        .update({ is_admin: !user.is_admin })
        .eq('id', userId);

      if (error) {
        console.log('Error updating admin status:', error);
        toast.error('Failed to update admin status', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      toast.success(`Admin status ${!user.is_admin ? 'granted' : 'revoked'}`, {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      fetchOrgUsers(selectedOrgId); // Refresh users
    } catch (error) {
      console.log('Error updating admin status:', error);
      toast.error('Failed to update admin status', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  // Remove user
  const removeUser = async (userId) => {
    if (!selectedOrgId) return;

    try {
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      const { error } = await supabase
        .from('users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        console.log('Error removing user:', error);
        toast.error('Failed to remove user', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      toast.success('User removed successfully', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      fetchOrgUsers(selectedOrgId); // Refresh users
    } catch (error) {
      console.log('Error removing user:', error);
      toast.error('Failed to remove user', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  // Open confirm delete user
  const openConfirmDeleteUser = (user) => {
    setConfirmState({ open: true, entityId: user.id, name: user?.username || user.username || 'User' });
  };

  const closeConfirm = () => setConfirmState({ open: false, entityId: null, name: '' });

  // Confirm delete user
  const confirmDelete = async () => {
    if (confirmState.entityId) {
      await removeUser(confirmState.entityId);
    }
    closeConfirm();
  };

  // Invite form
  const [inviteForm, setInviteForm] = useState({ username: '', email: '', isAdmin: false });
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [isInviting, setIsInviting] = useState(false);
  const handleInviteChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInviteForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
  // Handle invite
  const handleInvite = async (e) => {
    e.preventDefault();
    if (!selectedOrgId) {
      toast.error('Select an organisation first', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }
    if (!inviteForm.username || !inviteForm.email) {
      toast.error('Please fill in username and email', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }

    setIsInviting(true);
    try {
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      const { error } = await sendInviteAndCreatePendingInvite(supabase, {
        email: inviteForm.email,
        username: inviteForm.username,
        organisationId: selectedOrgId,
        isAdmin: inviteForm.isAdmin
      });
      if (error) {
        toast.error(error.message || 'Failed to invite user', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      toast.success('Invite sent successfully', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      setInviteForm({ username: '', email: '', isAdmin: false });
      setShowInviteForm(false); // Hide the form after successful invitation
    } catch (error) {
      console.log('Error inviting user:', error);
      toast.error('Failed to invite user', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } finally {
      setIsInviting(false);
    }
  };

  // Submissions for selected organisation with Supabase integration
  const [orgSubmissions, setOrgSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Report preview modal state
  const [previewModal, setPreviewModal] = useState({
    isOpen: false,
    reportUrl: null,
    companyName: ''
  });

  // Fetch submissions for selected organisation
  const fetchOrgSubmissions = async (orgId) => {
    // If no organisation ID, set submissions to empty array and return
    if (!orgId) {
      setOrgSubmissions([]);
      return;
    }

    try {
      // Set loading state to true
      setIsLoadingSubmissions(true);
      const { getSupabase } = await import('../../supabaseClient');
      const supabase = getSupabase();
      // Fetch submissions from Supabase
      const { data, error } = await supabase
        .from('new_submissions')
        .select(`
          id,
          company_name,
          company_url,
          reviewed_by,
          status,
          batch_date,
          queue_position,
          report_url,
          organisation_id,
          created_at,
          users!inner(username, email)
        `)
        .eq('organisation_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.log('Error fetching submissions:', error);

        return;
      }

      setOrgSubmissions(data || []);
    } catch (error) {
      console.log('Error fetching submissions:', error);

    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Load submissions when organisation changes
  useEffect(() => {
    fetchOrgSubmissions(selectedOrgId);
  }, [selectedOrgId]);

  // Single filter (Company Name only)
  const [companyFilter, setCompanyFilter] = useState('');
  const handleFilterChange = (e) => {
    setCompanyFilter(e.target.value || '');
  };

  const filteredSubmissions = useMemo(() => {
    const query = companyFilter.trim().toLowerCase();
    if (!query) return orgSubmissions;
    return orgSubmissions.filter(s =>
      s.company_name && s.company_name.toLowerCase().includes(query)
    );
  }, [orgSubmissions, companyFilter]);

  return (
    <Protected requireSuperadmin>
      <div className="app">
        <MobileHeader />
        <div className="app-content">
          <div className="desktop-sidebar">
            <Sidebar />
          </div>
          <div className="main-content">
            <div className="container-page">
              <h2 className="section-title">Superadmin Panel</h2>

              {/* Manage Organisations */}
              <div className="card-block">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="subsection-title mb-0">Manage Organisations</h3>
                </div>

                <div className="row g-3 g-lg-6 align-items-center">
                  <div className="col-12 col-lg-3">
                    <label className="input-label d-flex align-items-center">
                      <span>Select Organisation</span>
                      <button
                        type="button"
                        className="p-0 ms-2"
                        title="Create new organisation"
                        aria-label="Create new organisation"
                        onClick={handleAddNewOrganization}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          border: 'none',
                          background: '#0044EE',
                          color: 'white',
                          width: 27,
                          height: 20,
                          borderRadius: '80px',
                          cursor: 'pointer'
                        }}
                      >
                        <Plus size={16} />
                      </button>
                    </label>
                    <div className="d-flex align-items-center">
                      <select
                        className="org-select"
                        value={selectedOrgId !== null && selectedOrgId !== undefined ? selectedOrgId : 'NEW'}
                        onChange={handleSelectOrganisation}
                        style={{ flex: 1 }}
                      >
                        {organisations.map(o => (
                          <option key={o.id} value={o.id}>{o.name}</option>
                        ))}
                        <option value="NEW">-- New Organisation --</option>
                      </select>
                    </div>
                  </div>
                  {/* Organization form */}
                  <div className="col-12 col-lg-7 d-flex align-items-center" style={{ marginBottom: "-2%" }}>
                    {showOrgForm && (
                      <form onSubmit={handleSaveOrganisation} className="row gy-3 gx-4 gx-lg-5 align-items-center">
                        <div className="col-12 col-md-3">
                          <CustomInputField name="name" placeholder="Organisation Name" className='org-input' value={orgForm.name} onChange={handleOrgFormChange} />
                        </div>
                        <div className="col-12 col-md-3">
                          <CustomInputField name="account_type" placeholder="Account Type" className='org-input' value={orgForm.account_type} onChange={handleOrgFormChange} />
                        </div>
                        <div className="col-12 col-md-2">
                          <CustomInputField name="credit_balance" className='org-input-credits' placeholder="Credits" value={orgForm.credit_balance} onChange={handleOrgFormChange} />
                        </div>
                        <div className="col-12 col-md-4 d-flex justify-content-end">
                          <CustomButton
                            type="submit"
                            className='btn-submit-manage-org'
                            disabled={isUpdatingOrg}
                          >
                            {isUpdatingOrg ? 'Updating...' : (selectedOrgId ? 'Update Organisation' : 'Create Organisation')}
                          </CustomButton>
                        </div>
                      </form>
                    )}
                  </div>
                </div>
              </div>
              <div className='borderBottom mt-3 mb-3' />
              {/* Users in Organisation */}
              <div className="card-block">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="subsection-title mb-0">Users in Organisation</h3>
                  <CustomButton onClick={() => setShowInviteForm(!showInviteForm)}>
                    Invite User
                  </CustomButton>
                </div>

                <div className="table-container">
                  <table className="submissions-table">
                    <thead>
                      <tr>
                        <th>USERNAME</th>
                        <th>EMAIL</th>
                        <th style={{ textAlign: 'center' }}>ADMIN</th>
                        <th style={{ textAlign: 'center' }}>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingUsers ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>
                            Loading users...
                          </td>
                        </tr>
                      ) : orgUsers.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={{ padding: '20px', textAlign: 'center' }}>
                            No users found for this organisation
                          </td>
                        </tr>
                      ) : (
                        orgUsers.map((user) => (
                          <tr key={user.id}>
                            <td>{user.username || '-'}</td>
                            <td>{user.email || '-'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                checked={user.is_admin}
                                onChange={() => toggleAdmin(user.id)}
                                className="admin-checkbox"
                              />
                            </td>

                            <td style={{ textAlign: 'center' }}>
                              <div className="action-buttons position-check" style={{ justifyContent: 'center' }}>
                                <button
                                  onClick={() => openConfirmDeleteUser(user)}
                                  className="delete-btn-manage"
                                  title="Delete User"
                                >
                                  <Image src="/delete.svg" alt="Delete User" width={16} height={16} className="action-icon" />

                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Invite New User */}
                {showInviteForm && (
                  <div className="invite-section" style={{ marginTop: '3%' }}>
                    <h3 className="subsection-title mb-2">Invite a New User</h3>
                    <form onSubmit={handleInvite} className="invite-form">
                      <div className="row g-0 g-lg-4 mb-0">
                        <div className="col-12 col-md-4">
                          <CustomInputField name="username" placeholder="Username" value={inviteForm.username} onChange={handleInviteChange} disabled={isInviting} />
                        </div>
                        <div className="col-12 col-md-4">
                          <CustomInputField name="email" type="email" placeholder="Email" value={inviteForm.email} onChange={handleInviteChange} disabled={isInviting} />
                        </div>
                        <div className="col-12 col-md-2 d-flex align-items-center">
                          <label className="checkbox-label">
                            <input type="checkbox" name="isAdmin" checked={inviteForm.isAdmin} onChange={handleInviteChange} disabled={isInviting} />
                            <span style={{ marginLeft: 8 }}>Admin</span>
                          </label>
                        </div>
                        <div className="col-12 col-md-2 d-flex align-items-end" style={{ marginLeft: "-29px" }}>
                          <CustomButton type="submit" disabled={isInviting}>
                            {isInviting ? 'Sending...' : 'Send Invite'}
                          </CustomButton>
                        </div>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {/* Report Submissions */}
              <div className="card-block superadmin-reports mt-4">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h3 className="subsection-title superadmin-report">Report Submissions</h3>
                  <div style={{ maxWidth: 360 }}>
                    <CustomInputField name="company" placeholder="Filter by Company" value={companyFilter} onChange={handleFilterChange} />
                  </div>
                </div>



                <div className="table-container">
                  <table className="submissions-table">
                    <thead>
                      <tr>
                        <th>COMPANY</th>
                        <th>WEBSITE</th>
                        <th>REQUESTED BY</th>
                        <th style={{ textAlign: 'center' }}>STATUS</th>
                        <th style={{ textAlign: 'center' }}>BATCH DATE</th>
                        <th style={{ textAlign: 'center' }}>REPORT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoadingSubmissions ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>
                            Loading submissions...
                          </td>
                        </tr>
                      ) : filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan="7" style={{ padding: '20px', textAlign: 'center' }}>
                            {orgSubmissions.length === 0 ? 'No submissions found for this organisation' : 'No submissions match the current filters'}
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((s) => (
                          <tr key={s.id}>
                            <td>{s.company_name || '-'}</td>
                            <td>
                              {s.company_url && s.company_url !== '-' ? (
                                <a
                                  href={s.company_url.startsWith('http') ? s.company_url : `https://${s.company_url}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="website-link"
                                >
                                  {s.company_url}
                                </a>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td>{s.users?.email || s.users?.username || '-'}</td>
                            <td style={{ textAlign: 'center' }}>
                              <span>
                                {s.status || '-'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>{s.batch_date || s.created_at?.split('T')[0] || '-'}</td>
                            <td style={{ textAlign: 'center', padding: "0px" }}>
                              {s.report_url ? (
                                <div className="action-buttons" style={{ justifyContent: 'center' }}>
                                  <button
                                    className="link-button download-button"
                                    onClick={() => handleViewReport(s.report_url, s.company_name)}
                                    title="View Report"
                                  >
                                    <Eye className="action-icon" />
                                  </button>
                                  <div className="action-separator"></div>
                                  <button
                                    className="link-button download-button"
                                    onClick={() => handleDownload(s.report_url, s.company_name)}
                                    title="Download Report"
                                  >
                                    <Download className="action-icon" />
                                  </button>
                                </div>
                              ) : (
                                <span></span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
              {/* Transactions Table */}
              <TransactionsTable organisationId={selectedOrgId} title="Transactions" />
            </div>
          </div>
        </div>
      </div>
      <ConfirmModal
        open={confirmState.open}
        title={`Delete ${confirmState.name}?`}
        onConfirm={confirmDelete}
        onCancel={closeConfirm}
      />

      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={previewModal.isOpen}
        reportUrl={previewModal.reportUrl}
        companyName={previewModal.companyName}
        onClose={closePreviewModal}
        onDownload={(url, name) => handleDownload(url, name)}
      />
    </Protected>
  );
}

export default function SuperadminPage() {
  return (
    <Suspense fallback={null}>
      <SuperadminContent />
    </Suspense>
  );
}
