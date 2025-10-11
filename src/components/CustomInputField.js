'use client';

import React from 'react';

const CustomInputField = ({ 
  type = 'text', 
  placeholder, 
  value, 
  onChange, 
  name, 
  className = '',
  wrapperClassName = '',
  rightIcon = null,
  onRightIconClick,
  rightIconAriaLabel = 'input adornment',
  ...props 
}) => {
  const hasRightIcon = Boolean(rightIcon);
  return (
    <div className={`custom-input-wrapper ${wrapperClassName}`}>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        className={`custom-input-field ${hasRightIcon ? 'has-right-icon' : ''} ${className}`}
        {...props}
      />
      {hasRightIcon && (
        onRightIconClick ? (
          <button
            type="button"
            className="custom-input-right-icon"
            onClick={onRightIconClick}
            aria-label={rightIconAriaLabel}
            tabIndex={-1}
          >
            {rightIcon}
          </button>
        ) : (
          <span className="custom-input-right-icon" aria-hidden>
            {rightIcon}
          </span>
        )
      )}
    </div>
  );
};

export default CustomInputField;