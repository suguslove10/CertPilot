import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';

/**
 * A reusable input component with validation states
 * and consistent styling across the application.
 */
const Input = forwardRef(({
  type = 'text',
  id,
  name,
  value,
  placeholder,
  label,
  helpText,
  error,
  disabled = false,
  readOnly = false,
  required = false,
  fullWidth = true,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  onChange,
  onBlur,
  onFocus,
  ...props
}, ref) => {
  // Size classes for the input
  const sizeClasses = {
    sm: 'py-1.5 px-2 text-sm',
    md: 'py-2 px-3 text-sm',
    lg: 'py-2.5 px-4 text-base',
  };

  // Container classes
  const containerClasses = `
    relative
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  // Input classes
  const inputClasses = `
    block w-full rounded-md border 
    focus:outline-none focus:ring-2 focus:ring-offset-0
    transition-colors duration-200
    ${error 
      ? 'border-danger-500 text-danger-900 placeholder-danger-300 focus:border-danger-500 focus:ring-danger-500/30 bg-danger-50' 
      : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30'
    }
    ${disabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-white'}
    ${readOnly ? 'bg-gray-50 cursor-default' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon ? 'pr-10' : ''}
    ${sizeClasses[size]}
  `;

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={id} 
          className={`
            block text-sm font-medium mb-1
            ${error ? 'text-danger-600' : 'text-gray-700'}
            ${disabled ? 'text-gray-400' : ''}
          `}
        >
          {label}
          {required && <span className="text-danger-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <span className={`text-gray-500 ${error ? 'text-danger-500' : ''}`}>
              {leftIcon}
            </span>
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          className={inputClasses}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          {...props}
        />
        
        {rightIcon && (
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <span className={`text-gray-500 ${error ? 'text-danger-500' : ''}`}>
              {rightIcon}
            </span>
          </div>
        )}
      </div>
      
      {(error || helpText) && (
        <div className="mt-1 text-sm">
          {error && <p className="text-danger-600">{error}</p>}
          {!error && helpText && <p className="text-gray-500">{helpText}</p>}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  /** Input type */
  type: PropTypes.string,
  /** Input id */
  id: PropTypes.string,
  /** Input name */
  name: PropTypes.string,
  /** Input value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Input placeholder */
  placeholder: PropTypes.string,
  /** Input label */
  label: PropTypes.string,
  /** Help text shown below the input */
  helpText: PropTypes.string,
  /** Error message */
  error: PropTypes.string,
  /** Whether the input is disabled */
  disabled: PropTypes.bool,
  /** Whether the input is read-only */
  readOnly: PropTypes.bool,
  /** Whether the input is required */
  required: PropTypes.bool,
  /** Whether the input should take full width */
  fullWidth: PropTypes.bool,
  /** Input size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Icon displayed on the left */
  leftIcon: PropTypes.node,
  /** Icon displayed on the right */
  rightIcon: PropTypes.node,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Change handler */
  onChange: PropTypes.func,
  /** Blur handler */
  onBlur: PropTypes.func,
  /** Focus handler */
  onFocus: PropTypes.func,
};

export default Input; 