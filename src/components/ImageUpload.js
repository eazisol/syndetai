'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Upload, X } from 'lucide-react';

const ALLOWED_EXTENSIONS = ['pdf','docx','xlsx','csv','txt','pptx','png','jpg','jpeg'];
const MAX_FILES = 10;
const MAX_SIZE_MB = 25;

const ImageUpload = ({ onImageSelect, onImageRemove, selectedFiles = [] }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [files, setFiles] = useState(selectedFiles);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

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

    setFiles(merged);
    onImageSelect && onImageSelect(merged);
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const dropped = Array.from(e.dataTransfer.files);
    if (dropped && dropped.length) {
      validateAndMerge(dropped);
    }
  }, [files]);

  const handleFileSelect = useCallback((e) => {
    const chosen = Array.from(e.target.files || []);
    if (chosen.length) {
      validateAndMerge(chosen);
    }
  }, [files]);

  const handleRemoveFile = useCallback((index) => {
    const next = files.filter((_, i) => i !== index);
    setFiles(next);
    onImageRemove && onImageRemove(index);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onImageSelect && onImageSelect(next);
  }, [files]);

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

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
        <div className="image-preview-row">
          {files.map((file, idx) => {
            const isImage = file.type?.startsWith('image/') || /\.(png|jpe?g)$/i.test(file.name);
            if (!isImage) return null;
            const url = URL.createObjectURL(file);
            return (
              <div key={idx} className="thumb">
                <img src={url} alt={file.name} className="thumb-img" />
                <X className="thumb-remove" onClick={() => handleRemoveFile(idx)} />
              </div>
            );
          })}
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
