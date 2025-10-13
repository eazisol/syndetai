'use client';

import React from 'react';

const CustomButton = ({ 
  children, 
  type = 'button', 
  onClick, 
  className = '',
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`custom-button ${className} ${loading ? 'loading' : ''}`}
      {...props}
    >
      {loading ? loadingText : children}
    </button>
  );
};

export default CustomButton;