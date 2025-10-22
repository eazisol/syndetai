'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X, FileText, FileImage, File, FileSpreadsheet, FileVideo } from 'lucide-react';
import { toast } from 'react-toastify';

const ALLOWED_EXTENSIONS = ['pdf','docx','xlsx','csv','txt','pptx','png','jpg','jpeg'];
const MAX_FILES = 10;
const MAX_SIZE_MB = 25;

const ImageUpload = ({ onImageSelect, onImageRemove, selectedFiles = [] }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState(selectedFiles);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  // Get file icon based on file type
  const getFileIcon = (file) => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);
    
    if (isImage) return <FileImage className="file-icon" />;
    if (ext === 'pdf') return <FileText className="file-icon" />;
    if (['docx', 'txt'].includes(ext)) return <FileText className="file-icon" />;
    if (['xlsx', 'csv'].includes(ext)) return <FileSpreadsheet className="file-icon" />;
    if (ext === 'pptx') return <FileVideo className="file-icon" />;
    return <File className="file-icon" />;
  };

  // Show toast notification for file selection
  const showFileSelectionToast = (newFiles, totalFiles) => {
    const imageCount = newFiles.filter(file => {
      const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);
      return isImage;
    }).length;
    
    const pdfCount = newFiles.filter(file => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      return ext === 'pdf';
    }).length;

    if (imageCount > 0 && pdfCount > 0) {
      toast.success(`${imageCount} image(s) and ${pdfCount} PDF(s) selected. Total files: ${totalFiles}`, {
        autoClose: 3000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } else if (imageCount > 0) {
      toast.success(`${imageCount} image(s) selected. Total files: ${totalFiles}`, {
        autoClose: 3000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } else if (pdfCount > 0) {
      toast.success(`${pdfCount} PDF(s) selected. Total files: ${totalFiles}`, {
        autoClose: 3000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    } else {
      toast.success(`${newFiles.length} file(s) selected. Total files: ${totalFiles}`, {
        autoClose: 3000,
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });
    }
  };

  // Keep local state in sync when parent resets selectedFiles (e.g., after submit)
  useEffect(() => {
    setFiles(selectedFiles || []);
    if ((selectedFiles?.length || 0) === 0 && fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectedFiles]);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);
//
  // validate and merge files
  const validateAndMerge = (incomingFiles) => {
    const allowed = incomingFiles.filter((file) => {
      const ext = file.name.split('.').pop()?.toLowerCase() || '';
      const sizeOk = file.size <= MAX_SIZE_MB * 1024 * 1024;
      return ALLOWED_EXTENSIONS.includes(ext) && sizeOk;
    });

    if (allowed.length !== incomingFiles.length) {
      setError(`Only ${ALLOWED_EXTENSIONS.join(', ').toUpperCase()} up to ${MAX_SIZE_MB}MB each are allowed.`);
    } else {
      setError('');
    }

    const merged = [...files, ...allowed].slice(0, MAX_FILES);
    if ([...files, ...allowed].length > MAX_FILES) {
      setError(`Maximum ${MAX_FILES} files allowed.`);
    }

    // Show toast notification for newly added files
    if (allowed.length > 0) {
      showFileSelectionToast(allowed, merged.length);
    }

    setFiles(merged);
    onImageSelect && onImageSelect(merged);
  };

  // handle drop
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped && dropped.length) {
      validateAndMerge(dropped);
    }
  }, [files]);

  // handle file select
  const handleFileSelect = useCallback((e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length) {
      validateAndMerge(chosen);
    }
  }, [files]);

  // handle remove file
  const handleRemoveFile = useCallback((index, event) => {
    // Prevent event bubbling to avoid triggering parent click handlers
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onImageRemove && onImageRemove(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelect && onImageSelect(next);
    
    // Show toast notification for file removal
    toast.info(`File removed. ${next.length} file(s) remaining.`, {
      autoClose: 2000,
      pauseOnHover: false,
      pauseOnFocusLoss: false
    });
  }, [files]);

  // open file dialog
  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  // return image upload
  return (
    <div className="image-upload-container image-upload--30">
      <div
        className={`image-upload-dropzone ${isDragOver ? 'drag-over' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <div className="dropzone-content">
          <Upload className="dropzone-icon" />
          <span className="dropzone-title">Supporting documents upload (optional, multiple)</span>
          <span className="dropzone-subtitle">Allowed: PDF, DOCX, XLSX, CSV, TXT, PPTX, PNG, JPG • Max 10 files • 25MB each</span>
        </div>
      </div>

      {files.length > 0 && (
        <div className="file-preview-container">
          <div className="file-preview-header">
            <span className="file-count">Selected Files ({files.length})</span>
          </div>
          <div className="file-preview-grid">
            {files.map((file, idx) => {
              const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);
              const ext = file.name.split('.').pop()?.toLowerCase() || '';
              
              return (
                <div key={idx} className="file-preview-item">
                  <div className="file-preview-content">
                    {isImage ? (
                      <div className="file-thumbnail">
                        <img 
                          src={URL.createObjectURL(file)} 
                          alt={file.name} 
                          className="file-thumbnail-img" 
                        />
                      </div>
                    ) : (
                      <div className="file-icon-container">
                        {getFileIcon(file)}
                        <span className="file-extension">{ext.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <button 
                    className="file-remove-btn"
                    onClick={(event) => handleRemoveFile(idx, event)}
                    title={`Remove ${file.name}`}
                    type="button"
                  >
                    <X className="file-remove-icon" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
      {error && <div className="upload-error">{error}</div>}
      
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={['.pdf','.docx','.xlsx','.csv','.txt','.pptx','.png','.jpg','.jpeg'].join(',')}
        onChange={handleFileSelect}
        className="hidden-file-input"
        style={{ display: 'none' }}
      />
    </div>
  );
};

export default ImageUpload;
