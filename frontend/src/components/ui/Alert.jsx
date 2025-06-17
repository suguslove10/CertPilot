import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Alert.css';

/**
 * Alert component that follows the CertPilot design system
 * Accessible, responsive, and provides clear feedback to users
 */
const Alert = forwardRef(({
  children,
  title,
  variant = 'info',
  onClose,
  icon = null,
  className = '',
  testId,
  dismissible = true,
  elevated = false,
  bordered = true,
  ...props
}, ref) => {
  const baseClasses = 'alert';
  const variantClass = `alert-${variant}`;
  const elevatedClass = elevated ? 'alert-elevated' : '';
  const borderedClass = bordered ? 'alert-bordered' : '';
  
  const classes = [
    baseClasses,
    variantClass,
    elevatedClass,
    borderedClass,
    className
  ].filter(Boolean).join(' ');
  
  const getStatusIconByVariant = () => {
    if (icon) return icon;
    
    const iconProps = {
      xmlns: "http://www.w3.org/2000/svg", 
      width: "20", 
      height: "20", 
      viewBox: "0 0 24 24", 
      fill: "none", 
      stroke: "currentColor", 
      strokeWidth: "2", 
      strokeLinecap: "round", 
      strokeLinejoin: "round",
      className: "alert-default-icon",
      "aria-hidden": "true"
    };
    
    switch (variant) {
      case 'success':
        return (
          <svg {...iconProps}>
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
        );
      case 'error':
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
        );
      case 'warning':
        return (
          <svg {...iconProps}>
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        );
      case 'info':
      default:
        return (
          <svg {...iconProps}>
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        );
    }
  };
  
  return (
    <div 
      ref={ref}
      className={classes} 
      role="alert" 
      data-testid={testId}
      {...props}
    >
      <div className="alert-content">
        <div className="alert-icon">{getStatusIconByVariant()}</div>
        <div className="alert-message">
          {title && <div className="alert-title">{title}</div>}
          <div className="alert-description">{children}</div>
        </div>
      </div>
      {onClose && dismissible && (
        <button
          type="button"
          className="alert-close"
          onClick={onClose}
          aria-label="Close alert"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      )}
    </div>
  );
});

Alert.displayName = 'Alert';

Alert.propTypes = {
  /** Alert content */
  children: PropTypes.node.isRequired,
  /** Alert title */
  title: PropTypes.string,
  /** Alert style variant */
  variant: PropTypes.oneOf(['success', 'error', 'warning', 'info']),
  /** Close handler */
  onClose: PropTypes.func,
  /** Custom icon */
  icon: PropTypes.node,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Data test ID for testing */
  testId: PropTypes.string,
  /** Allow alert to be dismissed */
  dismissible: PropTypes.bool,
  /** Apply elevation (shadow) */
  elevated: PropTypes.bool,
  /** Show variant-colored border */
  bordered: PropTypes.bool,
};

export default Alert; 