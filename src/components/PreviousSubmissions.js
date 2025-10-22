import React, { useState, useEffect } from 'react';
import { Eye, Download } from 'lucide-react';
import { useApp } from '../context/AppContext';
import CustomInputField from './CustomInputField';
import ReportPreviewModal from './ReportPreviewModal';
// Supabase will be imported dynamically to avoid build-time env requirement

const PreviousSubmissions = () => {
  const { searchQuery, setSearchQuery, userData } = useApp();
  const [libraryData, setLibraryData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const userId = userData?.id;
  
  // Report preview modal state
  const [previewModal, setPreviewModal] = useState({ 
    isOpen: false, 
    reportUrl: null, 
    companyName: '' 
  });
  // Fetch library data
  const fetchLibraryData = async (userId) => {
    try {
      setIsLoading(true);
      const { getSupabase } = await import('../supabaseClient');
      const supabase = getSupabase();
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
        console.log('Supabase error:', error);
        return [];
      }
      return data || [];
    } catch (error) {
      console.log('Error fetching library data:', error);
      return [];
    } finally {
      setIsLoading(false);
    }
  };
  // Load library data
  useEffect(() => {
    if (userData?.id) {
      const loadLibraryData = async () => {
        const data = await fetchLibraryData(userData?.id);
        setLibraryData(data);
      };
      loadLibraryData();
    }
  }, [userData?.id]);

  const filteredSubmissions = libraryData.filter(submission =>
    submission.company_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.company_url?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.app_users?.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    submission.app_users?.username?.toLowerCase().includes(searchQuery.toLowerCase())
  );
// Handle download
  const handleDownload = async (reportUrl, companyName) => {
    try {
      if (!reportUrl) {
        console.log('No report URL available for download');
        return;
      }
      // Fetch file for download
      const response = await fetch(reportUrl);
      if (!response.ok) {
        console.log('Failed to fetch file for download');
        return;
      }
      // Create blob
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = `${companyName || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      console.log('Download initiated for:', companyName);
    } catch (error) {
      console.log('Error downloading report:', error);
    }
  };
// Handle view report
  const handleViewReport = (reportUrl, companyName) => {
    setPreviewModal({
      isOpen: true,
      reportUrl: reportUrl,
      companyName: companyName || 'Report'
    });
  };
// Close preview modal
  const closePreviewModal = () => {
    setPreviewModal({
      isOpen: false,
      reportUrl: null,
      companyName: ''
    });
  };
// Return previous submissions
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

{/* library table */}
      <div className="table-container">
        {isLoading ? (
          <div style={{ padding: '20px', textAlign: 'center' }}>
            <p>Loading reports...</p>
          </div>
        ) : filteredSubmissions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center' }}>
            <p style={{ color: '#5F6368', fontSize: '14px' }}>
              {libraryData.length === 0
                ? 'No reports found'
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
                <th style={{ textAlign: 'center' }}>STATUS</th>
                <th style={{ textAlign: 'center' }}>BATCH DATE</th>
                <th style={{ textAlign: 'center' }}>REPORT</th>
              </tr>
            </thead>
            <tbody>
              {filteredSubmissions.map((submission) => {
                let link = "https://tnsqnyriumdgaugkgxun.supabase.co/storage/v1/object/public/documents/6441a892-8a2c-4ed4-8c3a-c3739fd88c28.pdf"
                return (
                  <tr key={submission.id}>
                    <td>{submission.company_name || '-'}</td>
                    <td>
                      {submission.company_url && submission.company_url !== '-' ? (
                        <a
                          href={submission.company_url.startsWith('http') ? submission.company_url : `https://${submission.company_url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="website-link"
                        >
                          {submission.company_url}
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td>{submission.app_users?.email || submission.app_users?.username || '-'}</td>
                    <td style={{ textAlign: 'center' }}>
                      {submission.status || '-'}
                    </td>
                    <td style={{ textAlign: 'center' }}>{submission.batch_date || submission.created_at?.split('T')[0] || '-'}</td>
                    <td style={{ textAlign: 'center' ,padding:"0px"}}>
                      {submission?.report_url && <div className="action-buttons" style={{ justifyContent: 'center' }}>
                        <button className="link-button download-button" onClick={() => handleViewReport(submission?.report_url, submission.company_name)} title="View Report">
                          <Eye className="action-icon" />
                        </button>
                        <div className="action-separator"></div>
                        <button className="link-button download-button" onClick={() => handleDownload(submission?.report_url, submission.company_name)} title="Download Report">
                          <Download className="action-icon" />
                        </button>
                      </div>}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
      
      {/* Report Preview Modal */}
      <ReportPreviewModal
        isOpen={previewModal.isOpen}
        reportUrl={previewModal.reportUrl}
        companyName={previewModal.companyName}
        onClose={closePreviewModal}
        onDownload={(url, name) => handleDownload(url, name)}
      />
    </div>
  );
};

export default PreviousSubmissions;
