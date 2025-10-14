'use client';

import React, { useState } from 'react';
import { getSupabase } from '../supabaseClient';

const UploadTest = () => {
  const [isUploading, setIsUploading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testUpload = async () => {
    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      const supabase = getSupabase();
      
      // Create a simple test file
      const testContent = 'This is a test file for debugging upload issues';
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' });
      
      console.log('Starting upload test...');
      
      // Test 1: Check if storage bucket exists and is accessible
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      
      if (bucketError) {
        throw new Error(`Bucket access error: ${bucketError.message}`);
      }
      
      console.log('Available buckets:', buckets);
      
      // Test 2: Try to upload a simple file
      const fileName = `test_${Date.now()}.txt`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(fileName, testFile);
      
      if (uploadError) {
        throw new Error(`Upload error: ${uploadError.message}`);
      }
      
      console.log('Upload successful:', uploadData);
      
      // Test 3: Try to delete the test file
      const { error: deleteError } = await supabase.storage
        .from('documents')
        .remove([fileName]);
      
      if (deleteError) {
        console.warn('Delete error (non-critical):', deleteError.message);
      }
      
      setResult('Upload test completed successfully!');
      
    } catch (err) {
      console.error('Upload test failed:', err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '20px' }}>
      <h3>Upload Debug Test</h3>
      <p>This component helps debug the upload issue by testing basic storage operations.</p>
      
      <button 
        onClick={testUpload} 
        disabled={isUploading}
        style={{ 
          padding: '10px 20px', 
          backgroundColor: '#007bff', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px',
          cursor: isUploading ? 'not-allowed' : 'pointer'
        }}
      >
        {isUploading ? 'Testing...' : 'Run Upload Test'}
      </button>
      
      {result && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#d4edda', 
          color: '#155724', 
          borderRadius: '4px' 
        }}>
          ✅ {result}
        </div>
      )}
      
      {error && (
        <div style={{ 
          marginTop: '10px', 
          padding: '10px', 
          backgroundColor: '#f8d7da', 
          color: '#721c24', 
          borderRadius: '4px' 
        }}>
          ❌ Error: {error}
        </div>
      )}
    </div>
  );
};

export default UploadTest;
