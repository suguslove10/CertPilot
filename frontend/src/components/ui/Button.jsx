import React, { forwardRef, useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Button.css';

/**
 * Button component that follows the CertPilot design system
 * Accessible, responsive, and follows WCAG 2.1 AA standards
 * Enhanced with ripple effect and improved interactions
 */
const Button = forwardRef(({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  outlined = false,
  disabled = false,
  loading = false,
  icon = null,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ariaLabel,
  ripple = true,
  ...props 
}, ref) => {
  const baseClasses = 'btn';
  const variantClass = outlined ? `btn-${variant}-outlined` : `btn-${variant}`;
  const sizeClass = `btn-${size}`;
  const widthClass = fullWidth ? 'btn-full-width' : '';
  const disabledClass = disabled || loading ? 'btn-disabled' : '';
  const loadingClass = loading ? 'btn-loading' : '';
  const rippleClass = ripple && !disabled && !loading ? 'btn-ripple' : '';
  
  const classes = [
    baseClasses,
    variantClass,
    sizeClass,
    widthClass,
    disabledClass,
    loadingClass,
    rippleClass,
    className
  ].filter(Boolean).join(' ');
  
  // Ripple effect state and refs
  const [ripples, setRipples] = useState([]);
  const buttonRef = useRef(null);

  // Clean up ripples after animation completes
  useEffect(() => {
    const timeouts = [];
    
    ripples.forEach((ripple, i) => {
      const timeout = setTimeout(() => {
        setRipples(prevRipples => prevRipples.filter((_, index) => index !== i));
      }, 600); // Match the animation duration
      
      timeouts.push(timeout);
    });
    
    return () => {
      timeouts.forEach(timeout => clearTimeout(timeout));
    };
  }, [ripples]);

  // Handle click with ripple effect
  const handleClick = (e) => {
    if (disabled || loading || !ripple) {
      if (onClick) onClick(e);
      return;
    }
    
    const button = buttonRef.current;
    if (!button) {
      if (onClick) onClick(e);
      return;
    }

    // Calculate ripple position relative to button
    const rect = button.getBoundingClientRect();
    const left = e.clientX - rect.left;
    const top = e.clientY - rect.top;
    
    const ripple = { left, top, id: Date.now() };
    setRipples(prevRipples => [...prevRipples, ripple]);
    
    if (onClick) onClick(e);
  };
  
  return (
    <button
      ref={(node) => {
        // Merge refs
        buttonRef.current = node;
        if (ref) {
          if (typeof ref === 'function') {
            ref(node);
          } else {
            ref.current = node;
          }
        }
      }}
      type={type}
      className={classes}
      disabled={disabled || loading}
      onClick={handleClick}
      aria-label={ariaLabel || typeof children === 'string' ? children : undefined}
      aria-busy={loading ? 'true' : 'false'}
      {...props}
    >
      {loading && (
        <span className="btn-spinner" aria-hidden="true">
          <svg className="animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      )}
      
      {icon && iconPosition === 'left' && !loading && (
        <span className="btn-icon btn-icon-left" aria-hidden="true">{icon}</span>
      )}
      
      <span className="btn-text">{children}</span>
      
      {icon && iconPosition === 'right' && !loading && (
        <span className="btn-icon btn-icon-right" aria-hidden="true">{icon}</span>
      )}
      
      {ripple && ripples.map(ripple => (
        <span 
          key={ripple.id}
          className="btn-ripple-effect"
          style={{
            left: ripple.left,
            top: ripple.top
          }}
        />
      ))}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  /** Button content */
  children: PropTypes.node.isRequired,
  /** Button style variant */
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info', 'neutral', 'ghost']),
  /** Button size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Makes button take full width of container */
  fullWidth: PropTypes.bool,
  /** Creates an outlined button */
  outlined: PropTypes.bool,
  /** Disables the button */
  disabled: PropTypes.bool,
  /** Shows loading spinner */
  loading: PropTypes.bool,
  /** Icon element to display */
  icon: PropTypes.node,
  /** Icon position relative to content */
  iconPosition: PropTypes.oneOf(['left', 'right']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Click handler */
  onClick: PropTypes.func,
  /** Button type */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Accessible label (if button only has icon or needs description) */
  ariaLabel: PropTypes.string,
  /** Enable ripple effect */
  ripple: PropTypes.bool,
};

export default Button; 