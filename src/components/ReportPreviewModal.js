'use client';

import React from 'react';
import Image from 'next/image';

const ReportPreviewModal = ({ 
  isOpen, 
  reportUrl, 
  companyName, 
  onClose, 
  onDownload 
}) => {
  if (!isOpen) return null;

  return (
    <div className="preview-modal-overlay" onClick={onClose}>
      <div className="preview-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="preview-modal-header">
          <h3 className="preview-modal-title">{companyName} - Report Preview</h3>
          <button className="preview-modal-close" onClick={onClose}>
            <Image src="/cross.svg" alt="Close" width={15} height={15} />
          </button>
        </div>
        <div className="preview-modal-body">
          <iframe
            src={reportUrl}
            className="preview-iframe"
            title="Report Preview"
            style={{
              width: '100%',
              height: '90vh',
              border: 'none',
              borderRadius: '8px'
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default ReportPreviewModal;
