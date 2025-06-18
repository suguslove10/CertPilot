import React, { forwardRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * An enhanced input component with modern styling, animations,
 * and improved validation states for a polished user experience.
 * Updated with dark mode support and better visual feedback.
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
  success,
  disabled = false,
  readOnly = false,
  required = false,
  fullWidth = true,
  size = 'md',
  leftIcon,
  rightIcon,
  className = '',
  isLoading = false,
  variant = 'outlined',
  clearable = false,
  onChange,
  onBlur,
  onFocus,
  ...props
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const hasValue = value !== undefined && value !== '';

  // Size classes for the input
  const sizeClasses = {
    sm: 'py-1.5 px-2.5 text-sm rounded-md',
    md: 'py-2.5 px-3.5 text-sm rounded-lg',
    lg: 'py-3 px-4 text-base rounded-lg',
  };

  // Container classes
  const containerClasses = `
    relative
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  // Variant classes with dark mode support
  const variantClasses = {
    outlined: `
      border 
      ${error 
        ? 'border-red-500 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-red-500/30 bg-red-50 dark:bg-red-900/20' 
        : success
          ? 'border-emerald-500 text-emerald-900 dark:text-emerald-200 placeholder-emerald-300 focus:border-emerald-500 focus:ring-emerald-500/30 bg-emerald-50/30 dark:bg-emerald-900/20'
          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 focus:ring-blue-500/30 dark:focus:border-blue-400 dark:focus:ring-blue-400/30'
      }
    `,
    filled: `
      border border-transparent 
      ${error 
        ? 'bg-red-50 dark:bg-red-900/20 text-red-900 dark:text-red-200 placeholder-red-300 focus:bg-white dark:focus:bg-gray-800 focus:border-red-500 focus:ring-red-500/30' 
        : success
          ? 'bg-emerald-50/50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-200 placeholder-emerald-300 focus:bg-white dark:focus:bg-gray-800 focus:border-emerald-500 focus:ring-emerald-500/30'
          : 'bg-gray-100 dark:bg-gray-700 focus:bg-white dark:focus:bg-gray-800 focus:border-blue-500 focus:ring-blue-500/30 dark:focus:border-blue-400 dark:focus:ring-blue-400/30'
      }
    `,
    underlined: `
      border-t-0 border-l-0 border-r-0 border-b-2 rounded-none px-1
      ${error 
        ? 'border-red-500 text-red-900 dark:text-red-200 placeholder-red-300 focus:border-red-500 focus:ring-0' 
        : success
          ? 'border-emerald-500 text-emerald-900 dark:text-emerald-200 placeholder-emerald-300 focus:border-emerald-500 focus:ring-0'
          : 'border-gray-300 dark:border-gray-600 focus:border-blue-500 dark:focus:border-blue-400 focus:ring-0'
      }
    `,
  };

  // Input classes with dark mode support
  const inputClasses = `
    block w-full 
    focus:outline-none focus:ring-2 focus:ring-offset-0
    transition-all duration-200
    ${variantClasses[variant]}
    ${disabled ? 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-70' : 'bg-white dark:bg-gray-800 dark:text-gray-200'}
    ${readOnly ? 'bg-gray-50 dark:bg-gray-700 cursor-default' : ''}
    ${leftIcon ? 'pl-10' : ''}
    ${rightIcon || (clearable && hasValue) || isLoading ? 'pr-10' : ''}
    ${sizeClasses[size]}
    placeholder:text-gray-400 dark:placeholder:text-gray-500
  `;

  // Handle focus events
  const handleFocus = (e) => {
    setIsFocused(true);
    if (onFocus) onFocus(e);
  };

  const handleBlur = (e) => {
    setIsFocused(false);
    if (onBlur) onBlur(e);
  };

  // Handle clear input
  const handleClear = () => {
    if (onChange) {
      const changeEvent = {
        target: { name, value: '' }
      };
      onChange(changeEvent);
    }
  };

  return (
    <div className={containerClasses}>
      {label && (
        <label 
          htmlFor={id} 
          className={`
            block text-sm font-medium mb-1.5 transition-colors
            ${error ? 'text-red-600 dark:text-red-400' : ''}
            ${success ? 'text-emerald-600 dark:text-emerald-400' : ''}
            ${!error && !success ? 'text-gray-700 dark:text-gray-300' : ''}
            ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}
            ${isFocused && !error && !success ? 'text-blue-600 dark:text-blue-400' : ''}
          `}
        >
          {label}
          {required && <span className="text-red-500 dark:text-red-400 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {leftIcon && (
          <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none transition-colors
            ${error ? 'text-red-400 dark:text-red-400' : ''}
            ${success ? 'text-emerald-500 dark:text-emerald-400' : ''}
            ${!error && !success ? 'text-gray-500 dark:text-gray-400' : ''}
            ${isFocused && !error && !success ? 'text-blue-500 dark:text-blue-400' : ''}
            ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}
          `}>
            {leftIcon}
          </div>
        )}
        
        <input
          ref={ref}
          type={type}
          id={id}
          name={name}
          value={value}
          placeholder={placeholder}
          disabled={disabled || isLoading}
          readOnly={readOnly}
          required={required}
          className={inputClasses}
          onChange={onChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          {...props}
        />
        
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading && (
            <svg className="animate-spin h-4 w-4 text-gray-500 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          
          {!isLoading && clearable && hasValue && (
            <button
              type="button"
              className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 transition-colors focus:outline-none"
              onClick={handleClear}
              tabIndex="-1"
              aria-label="Clear input"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          )}
          
          {!isLoading && !clearable && rightIcon && (
            <span className={`pointer-events-none transition-colors
              ${error ? 'text-red-400 dark:text-red-400' : ''}
              ${success ? 'text-emerald-500 dark:text-emerald-400' : ''}
              ${!error && !success ? 'text-gray-500 dark:text-gray-400' : ''}
              ${isFocused && !error && !success ? 'text-blue-500 dark:text-blue-400' : ''}
              ${disabled ? 'text-gray-400 dark:text-gray-500' : ''}
            `}>
              {rightIcon}
            </span>
          )}
        </div>
      </div>
      
      {(error || success || helpText) && (
        <div className="mt-1.5 text-sm">
          {error && (
            <p className="text-red-600 dark:text-red-400 flex items-start">
              <svg className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
              </svg>
              <span>{error}</span>
            </p>
          )}
          {success && !error && (
            <p className="text-emerald-600 dark:text-emerald-400 flex items-start">
              <svg className="h-3.5 w-3.5 mr-1.5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
              </svg>
              <span>{success}</span>
            </p>
          )}
          {!error && !success && helpText && <p className="text-gray-500 dark:text-gray-400">{helpText}</p>}
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
  /** Success message */
  success: PropTypes.string,
  /** Whether the input is disabled */
  disabled: PropTypes.bool,
  /** Whether the input is read-only */
  readOnly: PropTypes.bool,
  /** Whether the input is required */
  required: PropTypes.bool,
  /** Whether the input should take up full width */
  fullWidth: PropTypes.bool,
  /** Input size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Icon to show on the left side of the input */
  leftIcon: PropTypes.node,
  /** Icon to show on the right side of the input */
  rightIcon: PropTypes.node,
  /** Additional classes to apply to the container */
  className: PropTypes.string,
  /** Whether the input is in a loading state */
  isLoading: PropTypes.bool,
  /** Input variant */
  variant: PropTypes.oneOf(['outlined', 'filled', 'underlined']),
  /** Whether to show a clear button when the input has a value */
  clearable: PropTypes.bool,
  /** Change handler */
  onChange: PropTypes.func,
  /** Blur handler */
  onBlur: PropTypes.func,
  /** Focus handler */
  onFocus: PropTypes.func,
};

export default Input; 