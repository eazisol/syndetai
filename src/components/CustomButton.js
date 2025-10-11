'use client';

import React from 'react';

const CustomButton = ({ 
  children, 
  type = 'button', 
  onClick, 
  className = '',
  disabled = false,
  ...props 
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`custom-button ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default CustomButton;