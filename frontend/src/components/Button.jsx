import React from 'react';
import PropTypes from 'prop-types';

/**
 * A flexible button component with multiple variants and sizes
 * for consistent button styling across the application.
 */
const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  type = 'button',
  className = '',
  leftIcon,
  rightIcon,
  isLoading = false,
  loadingText = 'Loading...',
  onClick,
  ...props
}) => {
  // Button variants styling
  const variantClasses = {
    primary: 'bg-primary-600 hover:bg-primary-700 text-white',
    secondary: 'bg-secondary-200 hover:bg-secondary-300 text-secondary-800',
    success: 'bg-success-600 hover:bg-success-700 text-white',
    danger: 'bg-danger-600 hover:bg-danger-700 text-white',
    warning: 'bg-warning-500 hover:bg-warning-600 text-white',
    info: 'bg-blue-500 hover:bg-blue-600 text-white',
    light: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white',
    outline: 'bg-transparent border border-primary-600 text-primary-600 hover:bg-primary-50',
    ghost: 'bg-transparent hover:bg-primary-50 text-primary-600',
    link: 'bg-transparent text-primary-600 hover:underline p-0 h-auto',
  };

  // Button size styling
  const sizeClasses = {
    xs: 'text-xs px-2 py-1 h-6',
    sm: 'text-sm px-3 py-1.5 h-8',
    md: 'text-sm px-4 py-2 h-10',
    lg: 'text-base px-5 py-2.5 h-12',
    xl: 'text-lg px-6 py-3 h-14',
  };

  const classes = `
    inline-flex items-center justify-center
    font-medium rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500
    transition-all duration-200 ease-in-out
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-60 cursor-not-allowed pointer-events-none' : ''}
    ${className}
  `;

  return (
    <button
      type={type}
      className={classes}
      disabled={disabled || isLoading}
      onClick={onClick}
      {...props}
    >
      {isLoading ? (
        <>
          <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em]" role="status"></span>
          {loadingText || children}
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2 -ml-1">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="ml-2 -mr-1">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};

Button.propTypes = {
  /** Button content */
  children: PropTypes.node.isRequired,
  /** Button variant style */
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger', 
    'warning', 'info', 'light', 'dark', 'outline', 
    'ghost', 'link'
  ]),
  /** Button size */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  /** Whether the button should take full width */
  fullWidth: PropTypes.bool,
  /** Whether the button is disabled */
  disabled: PropTypes.bool,
  /** Button type attribute */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Icon to display on the left side of button text */
  leftIcon: PropTypes.node,
  /** Icon to display on the right side of button text */
  rightIcon: PropTypes.node,
  /** Whether the button is in loading state */
  isLoading: PropTypes.bool,
  /** Text to display when loading */
  loadingText: PropTypes.string,
  /** Click handler */
  onClick: PropTypes.func,
};

export default Button; 