import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Input.css';

/**
 * Input component that follows the CertPilot design system
 * Accessible, responsive, and follows WCAG 2.1 AA standards
 */
const Input = forwardRef(({
  id,
  name,
  label,
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  error,
  helperText,
  required = false,
  disabled = false,
  readOnly = false,
  fullWidth = false,
  size = 'md',
  prefix,
  suffix,
  className = '',
  hideLabel = false,
  autoComplete,
  maxLength,
  min,
  max,
  pattern,
  testId,
  ...props
}, ref) => {
  const baseClasses = 'input-wrapper';
  const stateClass = error ? 'input-error' : disabled ? 'input-disabled' : readOnly ? 'input-readonly' : '';
  const widthClass = fullWidth ? 'input-full-width' : '';
  const sizeClass = `input-${size}`;
  
  const classes = [
    baseClasses,
    stateClass,
    widthClass,
    sizeClass,
    className
  ].filter(Boolean).join(' ');
  
  const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const errorId = error ? `${inputId}-error` : undefined;
  const helperId = helperText ? `${inputId}-helper` : undefined;
  const ariaDescribedBy = [errorId, helperId].filter(Boolean).join(' ') || undefined;
  
  return (
    <div className={classes} data-testid={testId}>
      {label && (
        <label 
          htmlFor={inputId} 
          className={`input-label ${hideLabel ? 'visually-hidden' : ''}`}
        >
          {label}
          {required && <span className="input-required" aria-hidden="true">*</span>}
        </label>
      )}
      <div className="input-field-wrapper">
        {prefix && <div className="input-prefix" aria-hidden="true">{prefix}</div>}
        <input
          ref={ref}
          id={inputId}
          name={name}
          type={type}
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={onFocus}
          disabled={disabled}
          readOnly={readOnly}
          required={required}
          aria-invalid={!!error}
          aria-describedby={ariaDescribedBy}
          autoComplete={autoComplete}
          maxLength={maxLength}
          min={min}
          max={max}
          pattern={pattern}
          {...props}
        />
        {suffix && <div className="input-suffix" aria-hidden="true">{suffix}</div>}
      </div>
      
      {/* Error message with proper ARIA */}
      {error && (
        <div id={errorId} className="input-error-text" role="alert">
          {error}
        </div>
      )}
      
      {/* Helper text */}
      {!error && helperText && (
        <div id={helperId} className="input-helper-text">
          {helperText}
        </div>
      )}
    </div>
  );
});

Input.displayName = 'Input';

Input.propTypes = {
  /** Input unique identifier */
  id: PropTypes.string,
  /** Input name */
  name: PropTypes.string,
  /** Input label */
  label: PropTypes.string,
  /** Input type (text, email, password, etc.) */
  type: PropTypes.string,
  /** Placeholder text */
  placeholder: PropTypes.string,
  /** Input value */
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Change handler */
  onChange: PropTypes.func,
  /** Blur handler */
  onBlur: PropTypes.func,
  /** Focus handler */
  onFocus: PropTypes.func,
  /** Error message */
  error: PropTypes.string,
  /** Helper text displayed below input */
  helperText: PropTypes.string,
  /** Is this field required? */
  required: PropTypes.bool,
  /** Is this field disabled? */
  disabled: PropTypes.bool,
  /** Is this field read-only? */
  readOnly: PropTypes.bool,
  /** Should input take full width of container */
  fullWidth: PropTypes.bool,
  /** Input size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Content to display before input */
  prefix: PropTypes.node,
  /** Content to display after input */
  suffix: PropTypes.node,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Visually hide label (still accessible to screen readers) */
  hideLabel: PropTypes.bool,
  /** HTML autocomplete attribute */
  autoComplete: PropTypes.string,
  /** Maximum character length */
  maxLength: PropTypes.number,
  /** Minimum value (for number inputs) */
  min: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Maximum value (for number inputs) */
  max: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  /** Validation pattern (regex) */
  pattern: PropTypes.string,
  /** Data test ID for testing */
  testId: PropTypes.string,
};

export default Input; 