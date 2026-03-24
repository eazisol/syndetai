'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useApp } from '../../../context/AppContext';
import { toast } from 'react-toastify';
import MobileHeader from '../../../components/MobileHeader';
import Sidebar from '../../../components/Sidebar';
import Protected from '../../../components/Protected';
import CustomInputField from '../../../components/CustomInputField';
import { Loader2, Search } from 'lucide-react';

function UserManagementContent() {
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(null); // ID of row being updated
  const [searchQuery, setSearchQuery] = useState('');

  const fetchSubmissions = async () => {
    try {
      setIsLoading(true);
      const { getSupabase } = await import('../../../supabaseClient');
      const supabase = getSupabase();
      
      const { data, error } = await supabase
        .from('new_submissions')
        .select('id, full_name, email, persona_type, status, created_at, target_company_name, target_company_url, own_company_name, own_company_url, company_fund_name ')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.log('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const handleStatusChange = async (submissionId, newStatus) => {
    try {
      setIsUpdating(submissionId);
      
      if (newStatus === 'approved') {
        // Use our special provisioning API
        const res = await fetch('/api/approve-submission', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ submissionId, status: 'approved' })
        });
        
        const data = await res.json();
        if (data.success) {
          toast.success('User approved and provisioned successfully!');
        } else {
          toast.error(data.error || 'Provisioning failed');
          // Revert or refresh on failure?
        }
      } else {
        // Direct status update
        const { getSupabase } = await import('../../../supabaseClient');
        const supabase = getSupabase();
        
        const { error } = await supabase
          .from('new_submissions')
          .update({ status: newStatus })
          .eq('id', submissionId);

        if (error) throw error;
        toast.success(`Status updated to ${newStatus}`);
      }
      
      // Refresh data to reflect changes
      await fetchSubmissions();
    } catch (error) {
      console.log('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setIsUpdating(null);
    }
  };

  const filteredSubmissions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return submissions;
    return submissions.filter(s => 
      s.full_name?.toLowerCase().includes(q) || 
      s.email?.toLowerCase().includes(q)
    );
  }, [submissions, searchQuery]);

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
              <header className="d-flex justify-content-between align-items-center mb-4">
                <h2 className="section-title mb-0">User Management</h2>
                <div className="search-box-wrapper" style={{ position: 'relative', width: '300px' }}>
                  <Search 
                    size={16} 
                    style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} 
                  />
                  <input 
                    type="text"
                    placeholder="Search by name or email..."
                    className="form-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ paddingLeft: '40px' }}
                  />
                </div>
              </header>

              <div className="card-block">
                <div className="table-container">
                  <table className="submissions-table">
                    <thead>
                      <tr>
                        <th>NAME</th>
                        <th>EMAIL</th>
                         <th>COMPANY NAME</th>
                        <th>COMPANY URL</th>
                        <th>PERSONA</th>
                        <th style={{ textAlign: 'center' }}>STATUS</th>
                        <th style={{ textAlign: 'center' }}>SUBMITTED AT</th>
                       
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>
                            <Loader2 className="animate-spin d-inline-block me-2" size={20} />
                            Loading users...
                          </td>
                        </tr>
                      ) : filteredSubmissions.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={{ padding: '40px', textAlign: 'center' }}>
                            No users found.
                          </td>
                        </tr>
                      ) : (
                        filteredSubmissions.map((s) => (
                          <tr key={s.id}>
                            <td className="fw-medium">{s.full_name}</td>
                            <td>{s.email}</td>
                         
                             <td>{s.target_company_name || '-'}</td>
                            {/* <td>
                              {s.target_company_url ? (
                                <a href={s.target_company_url} target="_blank" rel="noopener noreferrer" className="text-link">
                                  {s.target_company_url.replace(/(^\w+:|^)\/\//, '')}
                                </a>
                              ) : '-'}
                            </td> */}
                            <td>
                      {s.target_company_url && s.target_company_url !== '-' ? (
                        <a
                          href={s.target_company_url.startsWith('http') ? s.target_company_url : `https://${s.target_company_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="website-link"
                        >
                          {s.target_company_url}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                       <td>
                              <span style={{ 
                                textTransform: 'capitalize',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                backgroundColor: s.persona_type === 'investor' ? '#eff6ff' : '#fef2f2',
                                color: s.persona_type === 'investor' ? '#2563eb' : '#dc2626'
                              }}>
                                {s.persona_type}
                              </span>
                            </td>
                            <td style={{ textAlign: 'center' }}>
                              {isUpdating === s.id ? (
                                <Loader2 className="animate-spin mx-auto" size={16} />
                              ) : (
                                <select 
                                  value={s.status || 'pending'}
                                  onChange={(e) => handleStatusChange(s.id, e.target.value)}
                                  className="status-select"
                                  style={{
                                    padding: '4px 8px',
                                    borderRadius: '6px',
                                    border: '1px solid #e2e8f0',
                                    fontSize: '13px',
                                    backgroundColor: s.status === 'approved' ? '#dcfce7' : (s.status === 'rejected' ? '#fee2e2' : (s.status === 'waitlist' ? '#e0f2fe' : '#fef9c3')),
                                    color: s.status === 'approved' ? '#166534' : (s.status === 'rejected' ? '#991b1b' : (s.status === 'waitlist' ? '#0369a1' : '#854d0e')),
                                    cursor: 'pointer',
                                    outline: 'none'
                                  }}
                                  disabled={s.status === 'approved'}
                                >
                                  <option value="pending">Pending</option>
                                  <option value="waitlist">Waitlist</option>
                                  <option value="approved">Approved</option>
                                  <option value="rejected">Rejected</option>
                                </select>
                              )}
                            </td>
                            <td style={{ textAlign: 'center', fontSize: '13px', color: '#666' }}>
                              {new Date(s.created_at).toLocaleDateString()}
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

      <style jsx>{`
        .status-select:hover {
          border-color: #cbd5e1;
        }
        .status-select:disabled {
          cursor: not-allowed;
          opacity: 0.8;
        }
      `}</style>
    </Protected>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense fallback={null}>
      <UserManagementContent />
    </Suspense>
  );
}
