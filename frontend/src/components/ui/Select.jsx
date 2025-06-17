import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Select.css';

/**
 * Select component that follows the CertPilot design system
 * Accessible, responsive, and follows WCAG 2.1 AA standards
 */
const Select = forwardRef(({
  id,
  name,
  label,
  options,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  required = false,
  disabled = false,
  fullWidth = false,
  size = 'md',
  placeholder = 'Select an option',
  className = '',
  hideLabel = false,
  testId,
  ...props
}, ref) => {
  const baseClasses = 'select-wrapper';
  const stateClass = error ? 'select-error' : disabled ? 'select-disabled' : '';
  const widthClass = fullWidth ? 'select-full-width' : '';
  const sizeClass = `select-${size}`;
  
  const classes = [
    baseClasses,
    stateClass,
    widthClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');
  
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${selectId}-error` : undefined;
  const helperId = helperText ? `${selectId}-helper` : undefined;
  const ariaDescribedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  
  // Group options by optgroup if they have a group property
  const hasGroups = options.some(option => option.group);
  
  const getGroupedOptions = () => {
    if (!hasGroups) return null;
    
    const groups = {};
    options.forEach(option => {
      const group = option.group || '';
      if (!groups[group]) {
        groups[group] = [];
      }
      groups[group].push(option);
    });
    
    return Object.entries(groups).map(([groupName, groupOptions]) => {
      if (groupName === '') {
        return groupOptions.map(option => (
          <option key={option.value} value={option.value} disabled={option.disabled}>
            {option.label}
          </option>
        ));
      }
      
      return (
        <optgroup key={groupName} label={groupName}>
          {groupOptions.map(option => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </optgroup>
      );
    });
  };
  
  return (
    <div className={classes} data-testid={testId}>
      {label && (
        <label 
          htmlFor={selectId} 
          className={`select-label ${hideLabel ? 'visually-hidden' : ''}`}
        >
          {label}
          {required && <span className="select-required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="select-field-wrapper">
        <select
          ref={ref}
          id={selectId}
          name={name}
          className="select-field"
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          required={required}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          
          {hasGroups ? getGroupedOptions() : (
            options.map((option) => (
              <option 
                key={option.value} 
                value={option.value} 
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))
          )}
        </select>
        <div className="select-arrow" aria-hidden="true"></div>
      </div>
      
      {error && (
        <div id={errorId} className="select-error-text" role="alert">
          {error}
        </div>
      )}
      
      {!error && helperText && (
        <div id={helperId} className="select-helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
});

Select.displayName = 'Select';

Select.propTypes = {
  /** Select unique identifier */
  id: PropTypes.string,
  /** Select name */
  name: PropTypes.string,
  /** Select label */
  label: PropTypes.string,
  /** Array of options to display */
  options: PropTypes.arrayOf(
    PropTypes.shape({
      /** Option value */
      value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
      /** Option display text */
      label: PropTypes.string.isRequired,
      /** Optional group name for grouping options */
      group: PropTypes.string,
      /** Whether this option is disabled */
      disabled: PropTypes.bool,
    })
  ).isRequired,
  /** Selected value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Change handler */
  onChange: PropTypes.func,
  /** Blur handler */
  onBlur: PropTypes.func,
  /** Focus handler */
  onFocus: PropTypes.func,
  /** Error message */
  error: PropTypes.string,
  /** Helper text displayed below select */
  helperText: PropTypes.string,
  /** Is this field required? */
  required: PropTypes.bool,
  /** Is this field disabled? */
  disabled: PropTypes.bool,
  /** Should select take full width of container */
  fullWidth: PropTypes.bool,
  /** Select size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Placeholder text for empty selection */
  placeholder: PropTypes.string,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Visually hide label (still accessible to screen readers) */
  hideLabel: PropTypes.bool,
  /** Data test ID for testing */
  testId: PropTypes.string,
};

export default Select; 