import React, { useState, useEffect } from 'react';
import { Eye, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CustomInputField from './CustomInputField';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

const PreviousSubmissions = () => {
  const { searchQuery, setSearchQuery } = useApp();
  const [libraryData, setLibraryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // User ID for fetching library data
  const userId = '3839564b-a0f0-4816-8de8-dae60fc4ed7f';

  // Fetch library data from Supabase
  const fetchLibraryData = async (userId) => {
    try {
      setIsLoading(true);
      
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
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
  
      if (error) {
        console.error('Supabase error:', error);
        return [];
      }
      
      return data || [];
    } catch (error) {
      console.error('Error fetching library data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch library data on component mount
  useEffect(() => {
    const loadLibraryData = async () => {
      const data = await fetchLibraryData(userId);
      setLibraryData(data);
    };
    loadLibraryData();
  }, [userId]);

  // Filter submissions based on search query
  const filteredSubmissions = libraryData.filter(submission =>
    submission.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.company_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.app_users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.app_users?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleView = (id) => {
    console.log('View submission:', id);
    // Add view functionality here
  };

  const handleDownload = (id) => {
    console.log('Download submission:', id);
    // Add download functionality here
  };

  return (
    <div className="submissions-section ">
      <div className="row g-3 mb-2 align-items-center justify-content-between">
        <div className="col-12 col-md-6">
          <h2 className="section-title">Library</h2>
        </div>
        <div className="col-12 col-md-6 text-end">
          <CustomInputField
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-50"
          />
        </div>
      </div>


      <div className="table-container">
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading library data...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#5F6368', fontSize: '14px' }}>
              {libraryData.length === 0 
                ? 'No reports found for this organization' 
                : 'No reports match your search criteria'
              }
            </p>
          </div>
        ) : (
          <table className="submissions-table">
            <thead>
              <tr>
                <th>COMPANY</th>
                <th>WEBSITE</th>
                <th>REQUESTED BY</th>
                <th>STATUS</th>
                <th>BATCH DATE</th>
                <th>QUEUE POSITION</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => {
                return(
                <tr key={submission.id}>
                  <td>{submission.company_name || '-'}</td>
                  <td>{submission.company_url || '-'}</td>
                  <td>{submission.app_users?.email || submission.app_users?.username || '-'}</td>
                  <td>
               
                      {submission.status=='Completed'? submission.status: '-'}
                   
                  </td>
                  <td>{submission.batch_date || submission.created_at?.split('T')[0] || '-'}</td>
                  <td>{submission.queue_position || 0}</td>
                  <td>
                    <div className="action-buttons">
                      {submission.report_url ? (
                        <>
                          {/* <button
                            onClick={() => handleView(submission.id)}
                            className="action-btn"
                            title="View Report"
                          >
                            <Eye className="action-icon" />
                          </button> */}
                           <a 
                          className="link-button" 
                          href={s.report_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                         <Eye className="action-icon" />
                        </a>
                          <button
                            onClick={() => handleDownload(submission.id)}
                            className="action-btn"
                            title="Download Report"
                          >
                            <Download className="action-icon" />
                          </button>
                        </>
                      ) : (
                        <div >-</div>
                      )}
                    </div>
                  </td>
                </tr>
              )})}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default PreviousSubmissions;
