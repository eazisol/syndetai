'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import CustomInputField from '../../components/CustomInputField';
import CustomButton from '../../components/CustomButton';
import { toast } from 'react-toastify';
import MobileHeader from '../../components/MobileHeader';
import Sidebar from '../../components/Sidebar';
import { createClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function SuperadminPage() {
  const { submissions } = useApp();

  // Organisations state with Supabase integration
  const [organisations, setOrganisations] = useState([]);
  const [selectedOrgId, setSelectedOrgId] = useState(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(false);

  const selectedOrganisation = useMemo(() => {
    return organisations.find(o => o.id === selectedOrgId) || null;
  }, [organisations, selectedOrgId]);

  // Fetch organisations from Supabase
  const fetchOrganisations = async () => {
    try {
      setIsLoadingOrgs(true);
      const { data, error } = await supabase
        .from('organisations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching organisations:', error);
        toast.error('Failed to fetch organisations', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      setOrganisations(data || []);
      if (data && data.length > 0 && !selectedOrgId) {
        setSelectedOrgId(data[0].id);
      }
    } catch (error) {
      console.error('Error fetching organisations:', error);
      toast.error('Failed to fetch organisations', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } finally {
      setIsLoadingOrgs(false);
    }
  };

  // Load organisations on component mount
  useEffect(() => {
    fetchOrganisations();
  }, []);

  // Org form
  const [orgForm, setOrgForm] = useState({
    name: '',
    type: '',
    credits: '',
    active: true,
  });

  const handleSelectOrganisation = (e) => {
    const value = e.target.value;
    if (value === 'NEW') {
      setSelectedOrgId(null);
      setOrgForm({ name: '', type: '', credits: '', active: true });
    } else {
      setSelectedOrgId(value);
      const found = organisations.find(o => o.id === value);
      if (found) setOrgForm({ 
        name: found.name, 
        type: found.type, 
        credits: String(found.credits), 
        active: found.active 
      });
    }
  };

  const handleOrgFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setOrgForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveOrganisation = async (e) => {
    e.preventDefault();
    const creditsNum = Number(orgForm.credits || 0);
    if (!orgForm.name || !orgForm.type || Number.isNaN(creditsNum)) {
      toast.error('Please fill all fields correctly', { 
        autoClose: 4000, 
        pauseOnHover: false, 
        pauseOnFocusLoss: false 
      });
      return;
    }

    try {
      if (selectedOrgId == null) {
        // Create new organisation
        const { data, error } = await supabase
          .from('organisations')
          .insert([
            {
              id: uuidv4(),
              name: orgForm.name,
              type: orgForm.type,
              credits: creditsNum,
              active: orgForm.active,
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
        // Update existing organisation
        const { error } = await supabase
          .from('organisations')
          .update({
            name: orgForm.name,
            type: orgForm.type,
            credits: creditsNum,
            active: orgForm.active
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
      }
    } catch (error) {
      console.error('Error saving organisation:', error);
      toast.error('Failed to save organisation', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  // Users for selected organisation with Supabase integration
  const [orgUsers, setOrgUsers] = useState([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Fetch users for selected organisation
  const fetchOrgUsers = async (orgId) => {
    if (!orgId) {
      setOrgUsers([]);
      return;
    }

    try {
      setIsLoadingUsers(true);
      const { data, error } = await supabase
        .from('app_users')
        .select('id, email, username, is_admin, is_active')
        .eq('organisation_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to fetch users', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      setOrgUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Load users when organisation changes
  useEffect(() => {
    fetchOrgUsers(selectedOrgId);
  }, [selectedOrgId]);

  const toggleAdmin = async (userId) => {
    if (!selectedOrgId) return;
    
    try {
      const user = orgUsers.find(u => u.id === userId);
      if (!user) return;

      const { error } = await supabase
        .from('app_users')
        .update({ is_admin: !user.is_admin })
        .eq('id', userId);

      if (error) {
        console.error('Error updating admin status:', error);
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
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  const removeUser = async (userId) => {
    if (!selectedOrgId) return;
    
    try {
      const { error } = await supabase
        .from('app_users')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) {
        console.error('Error removing user:', error);
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
      console.error('Error removing user:', error);
      toast.error('Failed to remove user', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  const [inviteForm, setInviteForm] = useState({ username: '', email: '', isAdmin: false });
  const handleInviteChange = (e) => {
    const { name, value, type, checked } = e.target;
    setInviteForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };
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

    try {
      const { data, error } = await supabase
        .from('app_users')
        .insert([
          {
            id: uuidv4(),
            username: inviteForm.username,
            email: inviteForm.email,
            is_admin: inviteForm.isAdmin,
            is_active: true,
            organisation_id: selectedOrgId
          }
        ])
        .select();

      if (error) {
        console.error('Error inviting user:', error);
        toast.error('Failed to invite user', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      toast.success('User invited successfully', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      setInviteForm({ username: '', email: '', isAdmin: false });
      fetchOrgUsers(selectedOrgId); // Refresh users
    } catch (error) {
      console.error('Error inviting user:', error);
      toast.error('Failed to invite user', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  // Submissions for selected organisation with Supabase integration
  const [orgSubmissions, setOrgSubmissions] = useState([]);
  const [isLoadingSubmissions, setIsLoadingSubmissions] = useState(false);

  // Fetch submissions for selected organisation
  const fetchOrgSubmissions = async (orgId) => {
    if (!orgId) {
      setOrgSubmissions([]);
      return;
    }

    try {
      setIsLoadingSubmissions(true);
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          id,
          company_name,
          company_url,
          user_id,
          status,
          batch_date,
          queue_position,
          report_url,
          organisation_id,
          created_at,
          app_users!inner(username, email)
        `)
        .eq('organisation_id', orgId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching submissions:', error);
        toast.error('Failed to fetch submissions', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      setOrgSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to fetch submissions', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } finally {
      setIsLoadingSubmissions(false);
    }
  };

  // Load submissions when organisation changes
  useEffect(() => {
    fetchOrgSubmissions(selectedOrgId);
  }, [selectedOrgId]);

  // Filters for submissions
  const [filters, setFilters] = useState({ company: '', website: '', email: '' });
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const filteredSubmissions = useMemo(() => {
    return orgSubmissions.filter(s => {
      const companyMatch = !filters.company || 
        (s.company_name && s.company_name.toLowerCase().includes(filters.company.toLowerCase()));
      const websiteMatch = !filters.website || 
        (s.company_url && s.company_url.toLowerCase().includes(filters.website.toLowerCase()));
      const emailMatch = !filters.email || 
        (s.app_users?.email && s.app_users.email.toLowerCase().includes(filters.email.toLowerCase()));
      
      return companyMatch && websiteMatch && emailMatch;
    });
  }, [orgSubmissions, filters]);

  return (
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
        <h3 className="subsection-title">Manage Organisations</h3>

        <div className="row g-0 g-lg-4">
          <div className="col-12 col-lg-4">
            <label className="input-label">Select Organisation</label>
            <select
              className="org-select"
              value={selectedOrgId !== null && selectedOrgId !== undefined ? selectedOrgId : 'NEW'}
              onChange={handleSelectOrganisation}
            >
              {organisations.map(o => (
                <option key={o.id} value={o.id}>{o.name}</option>
              ))}
              <option value="NEW">-- New Organisation --</option>
            </select>
          </div>

          <div className="col-12 col-lg-6">
            <form onSubmit={handleSaveOrganisation} className="row g-0 g-lg-2">
              <div className="col-12 col-md-6">
                <CustomInputField name="name" placeholder="Organisation Name" value={orgForm.name} onChange={handleOrgFormChange} />
              </div>
              <div className="col-12 col-md-6">
                <CustomInputField name="type" placeholder="Organisation Type" value={orgForm.type} onChange={handleOrgFormChange} />
              </div>
              <div className="col-12 col-md-6">
                <CustomInputField name="credits" type="number" placeholder="Credits" value={orgForm.credits} onChange={handleOrgFormChange} />
              </div>
              <div className="col-12 col-md-6 d-flex align-items-center ml-3">
                <label className="checkbox-label">
                  <input type="checkbox" name="active" checked={orgForm.active} onChange={handleOrgFormChange} />
                  <span style={{ marginLeft: 8 }}>Active</span>
                </label>
              </div>
              <div className="col-12 d-flex justify-content-end">
                <CustomButton type="submit" className='btn-submit-manage-org'>{selectedOrgId ? 'Update Organisation' : 'Create Organisation'}</CustomButton>
              </div>
            </form>
          </div>
        </div>
      </div>
<div className='borderBottom mt-3 mb-3'/>
      {/* Users in Organisation */}
      <div className="card-block">
        <h3 className="subsection-title mb-2">Users in Organisation</h3>

        <div className="table-container">
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
                    <td>
                      <input 
                        type="checkbox" 
                        checked={user.is_admin} 
                        onChange={() => toggleAdmin(user.id)} 
                        className="admin-checkbox" 
                      />
                    </td>
                    <td>
                      <button 
                        onClick={() => removeUser(user.id)} 
                        className="delete-btn-manage" 
                        title="Delete User"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Invite New User */}
        <div className="invite-section" style={{ marginTop: '3%' }}>
          <h3 className="subsection-title mb-2">Invite a New User</h3>
          <form onSubmit={handleInvite} className="invite-form">
            <div className="row g-0 g-lg-4 mb-0">
              <div className="col-12 col-md-4">
                <CustomInputField name="username" placeholder="Username" value={inviteForm.username} onChange={handleInviteChange} />
              </div>
              <div className="col-12 col-md-4">
                <CustomInputField name="email" type="email" placeholder="Email" value={inviteForm.email} onChange={handleInviteChange} />
              </div>
              <div className="col-12 col-md-2 d-flex align-items-center">
                <label className="checkbox-label">
                  <input type="checkbox" name="isAdmin" checked={inviteForm.isAdmin} onChange={handleInviteChange} />
                  <span style={{ marginLeft: 8 }}>Admin</span>
                </label>
              </div>
              <div className="col-12 col-md-2 d-flex align-items-end" style={{marginLeft:"-29px"}}>
                <CustomButton type="submit">Send Invite</CustomButton>
              </div>
            </div>
          </form>
        </div>
      </div>

      {/* Report Submissions */}
      <div className="card-block superadmin-reports mt-4">
        <h3 className="subsection-title mb-2">Report Submissions</h3>

        <div className="row g-0 g-lg-3" style={{ marginBottom: 12 }}>
          <div className="col-12 col-md-3">
            <CustomInputField name="company" placeholder="Filter by Company" value={filters.company} onChange={handleFilterChange} />
          </div>
          <div className="col-12 col-md-3">
            <CustomInputField name="website" placeholder="Filter by Website" value={filters.website} onChange={handleFilterChange} />
          </div>
          <div className="col-12 col-md-3">
            <CustomInputField name="email" placeholder="Filter by Email" value={filters.email} onChange={handleFilterChange} />
          </div>
        </div>

        <div className="table-container">
          <table className="submissions-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>WEBSITE</th>
                <th>REQUESTED BY</th>
                <th>STATUS</th>
                <th>BATCH DATE</th>
                <th>QUEUE POSITION</th>
                <th>REPORT</th>
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
                    <td>{s.company_url || '-'}</td>
                    <td>{s.app_users?.email || s.app_users?.username || '-'}</td>
                    <td>
                      <span>
                        {s.status === 'Completed' ? s.status : '-'}
                      </span>
                    </td>
                    <td>{s.batch_date || s.created_at?.split('T')[0] || '-'}</td>
                    <td>{s.queue_position || '-'}</td>
                    <td>
                      {s.status === 'Completed' && s.report_url ? (
                        <a 
                          className="link-button" 
                          href={s.report_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          View Report
                        </a>
                      ) : (
                        <span>-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
          </div>
        </div>
      </div>
    </div>
    </div>
  );
}

export default SuperadminPage
