'use client';

import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import ImageUpload from './ImageUpload';
import CustomInputField from './CustomInputField';
import CustomButton from './CustomButton';
import UploadTest from './UploadTest';
import { toast } from 'react-toastify';
import { v4 as uuidv4 } from 'uuid';
import ConfirmModal from './ConfirmModal';

const RequestNewReport = () => {
  const { user, updateCredits,userData, refreshUserData } = useApp();
  const [formData, setFormData] = useState({
    company: '',
    website: ''
  });
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  const organizationId = localStorage.getItem('organisation_id');
  const userId = userData?.id;

  

  // Calculate credits needed
  const creditsNeeded = selectedFiles.length > 0 ? 15 : 10;
  const hasEnoughCredits = (userData?.organisation?.credits || 0) >= creditsNeeded;

  const submitReport = async () => {
    if (!formData.company || !formData.website) {
      toast.error('Please fill in all required fields', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }

    if (!organizationId || !userId) {
      toast.error('User organization or ID not found. Please try logging in again.', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }

    if (!hasEnoughCredits) {
      toast.error(`Insufficient credits. You need ${creditsNeeded} credits but have ${userData?.credits}`, {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Dynamically import Supabase client
      const { getSupabase } = await import('../supabaseClient');
      const supabase = getSupabase();

      // Check organisation has enough credits on server
      const { data: orgRow, error: orgErr } = await supabase
        .from('organisations')
        .select('credits')
        .eq('id', organizationId)
        .maybeSingle();

      if (orgErr) {
        console.log('Error fetching organisation credits:', orgErr);
        toast.error('Could not verify credits. Please try again.', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      const currentCredits = Number(orgRow?.credits) || 0;
      if (currentCredits < creditsNeeded) {
        toast.error(`Insufficient credits. Need ${creditsNeeded}, available ${currentCredits}.`, {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }
      
      // Ensure app_users row exists for this user to satisfy FK on submissions
      try {
        const { data: existingUser, error: existingErr } = await supabase
          .from('app_users')
          .select('id')
          .eq('id', userId)
          .maybeSingle();

        if (!existingUser && !existingErr) {
          // Get auth user to retrieve email if not in userData
          let emailToUse = userData?.email || null;
          if (!emailToUse) {
            const { data: authData } = await supabase.auth.getUser();
            emailToUse = authData?.user?.email || null;
          }
          const fallbackUsername = emailToUse ? emailToUse.split('@')[0] : 'user';

          await supabase.from('app_users').insert([
            {
              id: userId,
              email: emailToUse,
              username: fallbackUsername,
              is_admin: false,
              is_superadmin: false,
              organisation_id: organizationId
            }
          ]);
        }
      } catch (provisionErr) {
        console.log('Error ensuring app_users row exists:', provisionErr);
        // Continue; insert may still fail and be handled below
      }
      
      // Create new report in Supabase using the provided user ID
      const { data, error } = await supabase
        .from('submissions')
        .insert([
          {
            id: uuidv4(),
            company_name: formData.company,
            company_url: formData.website,
            user_id: userData?.id,
            status: 'pending',
            batch_date: new Date().toISOString().split('T')[0],
            queue_position: 0,
            organisation_id: organizationId,
            report_url: null,
            created_at: new Date().toISOString()
          }
        ])
        .select();

      if (error) {
        // console.error('Supabase error:', error);
        toast.error('Failed to submit request', {
          autoClose: 4000,
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
        return;
      }

      const submissionId = data[0].id;

      // Upload files if any are selected
      if (selectedFiles.length > 0) {
        try {
          const uploadPromises = selectedFiles.map(async (file, index) => {
            const fileExt = file.name.split('.').pop();
            const storedFileName = `${submissionId}_${index}.${fileExt}`;
            const bucket = 'new_report_images';

            const { error: uploadError } = await supabase.storage
              .from(bucket)
              .upload(storedFileName, file);

            if (uploadError) {
              console.log('File upload error:', uploadError);
              throw uploadError;
            }

            // Build a public URL for the uploaded file
            const { data: publicUrlData } = supabase
              .storage
              .from(bucket)
              .getPublicUrl(storedFileName);

            const fileUrl = publicUrlData?.publicUrl || null;

            // Insert a record into documents table
            try {
              await supabase
                .from('documents')
                .insert([
                  {
                    // id will be default uuid if table has default
                    submission_id: submissionId,
                    file_url: fileUrl,
                    file_name: file.name,
                    uploaded_at: new Date().toISOString()
                  }
                ]);
            } catch (docErr) {
              console.log('Error inserting document row:', docErr);
              // Continue without blocking the whole request
            }

            return storedFileName;
          });

          await Promise.all(uploadPromises);
          console.log('All files uploaded successfully');
        } catch (uploadError) {
          console.log('Error uploading files:', uploadError);
          // toast.error('Request submitted but files failed to upload', {
          //   autoClose: 4000,
          //   pauseOnHover: false,
          //   pauseOnFocusLoss: false
          // });
        }
      }

      // Deduct credits from organisation after successful submission/upload
      try {
        const updatedCredits = currentCredits - creditsNeeded;
        const { error: decErr } = await supabase
          .from('organisations')
          .update({ credits: updatedCredits })
          .eq('id', organizationId);
        if (decErr) {
          console.log('Failed to deduct organisation credits:', decErr);
        }
      } catch (decEx) {
        console.log('Credits deduction exception:', decEx);
      }

      // Refresh user/organisation data so UI updates without reload
      try { await refreshUserData?.(); } catch {}

      // Show success message
      toast.success(`Request submitted for ${formData.company}!`, {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });

      // Reset form
      setFormData({ company: '', website: '' });
      setSelectedFiles([]);

    } catch (error) {
      console.log('Error submitting request:', error);
      toast.error('Failed to submit request', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } finally {
      setIsSubmitting(false);
      setConfirmOpen(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Pre-checks before opening confirmation
    if (!formData.company || !formData.website) {
      toast.error('Please fill in all required fields', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }
    if (!organizationId || !userId) {
      toast.error('User organization or ID not found. Please try logging in again.', {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }
    if (!hasEnoughCredits) {
      toast.error(`Insufficient credits. You need ${creditsNeeded} credits but have ${(userData?.organisation?.credits || 0)}`, {
        autoClose: 4000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
      return;
    }
    setConfirmOpen(true);
  };

  const handleImageSelect = (files) => {
    setSelectedFiles(files);
  };

  const handleImageRemove = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="request-section">
      {/* Temporary debug component - remove after fixing the issue */}
      {/* <UploadTest /> */}
      
      <div className="request-form-container">
        {/* <form onSubmit={()=>{}} className="request-form"> */}
        <form onSubmit={handleSubmit} className="request-form">
        <h2 className="section-title text-center mb-5">Request New Report</h2>
          <div className="row g-3">
            <div className="col-12 col-md-6">
              <CustomInputField
                type="text"
                name="company"
                placeholder="Company name"
                value={formData.company}
                onChange={handleInputChange}
                required
                className="form-field"
              />
            </div>
            
            <div className="col-12 col-md-6">
              <CustomInputField
                type="text"
                name="website"
                placeholder="Company website"
                value={formData.website}
                onChange={handleInputChange}
                required
                className="form-field"
              />
            </div>
          </div>

          <div className="row g-3 mt-2">
            <div className="col-12">
              <ImageUpload
                onImageSelect={handleImageSelect}
                onImageRemove={handleImageRemove}
                selectedFiles={selectedFiles}
              />
            </div>
          </div>

          {/* Credit Information */}
          {/* <div className="row g-3 mt-3">
            <div className="col-12">
              <div style={{ 
                padding: '16px', 
                backgroundColor: '#f8f9fa', 
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div className="row g-0 align-items-center">
                  <div className="col-6">
                    <p style={{ margin: 0, fontSize: '14px', color: '#5F6368' }}>
                      Credits Required:
                    </p>
                  </div>
                  <div className="col-6 text-end">
                    <p style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: selectedFiles.length > 0 ? '#dc3545' : '#28a745'
                    }}>
                      {creditsNeeded} credits
                      {selectedFiles.length > 0 ? ' (with images)' : ' (no images)'}
                    </p>
                  </div>
                </div>
                <div className="row g-0 align-items-center mt-2">
                  <div className="col-6">
                    <p style={{ margin: 0, fontSize: '14px', color: '#5F6368' }}>
                      Your Credits:
                    </p>
                  </div>
                  <div className="col-6 text-end">
                    <p style={{ 
                      margin: 0, 
                      fontSize: '16px', 
                      fontWeight: '600',
                      color: hasEnoughCredits ? '#28a745' : '#dc3545'
                    }}>
                      {userData?.credits} credits
                    </p>
                  </div>
                </div>
                {!hasEnoughCredits && (
                  <div className="row g-0 mt-2">
                    <div className="col-12">
                      <p style={{ 
                        margin: 0, 
                        fontSize: '12px', 
                        color: '#dc3545',
                        textAlign: 'center'
                      }}>
                        ⚠️ Insufficient credits. Please add more credits to submit this request.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div> */}
          
          <div className="row g-3 mt-2">
            <div className="col-12">
              <CustomButton 
                type="submit" 
                className="submit-btn form-button w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : `Submit Request`}
              </CustomButton>
            </div>
          </div>
        </form>
      </div>
      <ConfirmModal
        open={confirmOpen}
        title={`Submit report?`}
        description={
          <div>
            <p style={{ color: 'var(--placeholder-color)', textAlign: 'center', marginBottom: 12 }}>
              This action will deduct credits from your organisation.
            </p>
            <div style={{
              background: 'var(--nav-active-color)',
              border: '1px solid var(--border-color)',
              borderRadius: 12,
              padding: 12,
              // maxWidth: 385,
              margin: '0 auto'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--placeholder-color)' }}>Credits required</span>
                <span style={{ fontWeight: 600 }}>{creditsNeeded}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                <span style={{ color: 'var(--placeholder-color)' }}>Current credits</span>
                <span style={{ fontWeight: 600 }}>{(userData?.organisation?.credits || 0)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border-color)', paddingTop: 8 }}>
                <span style={{ color: 'var(--placeholder-color)' }}>Remaining after submit</span>
                <span style={{ fontWeight: 700 }}>
                  {(userData?.organisation?.credits || 0) - creditsNeeded}
                </span>
              </div>
            </div>
          </div>
        }
        confirmText={isSubmitting ? 'Submitting...' : 'Confirm & Submit'}
        cancelText={'Cancel'}
        onConfirm={() => { if (!isSubmitting) submitReport(); }}
        onCancel={() => { if (!isSubmitting) setConfirmOpen(false); }}
      />
    </div>
  );
};

export default RequestNewReport;
