import React from 'react';
import PropTypes from 'prop-types';

/**
 * An enhanced button component with multiple variants, sizes and animations
 * for a consistent and modern UI across the application.
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
  hasPulse = false,
  ...props
}) => {
  // Button variants styling with enhanced colors and transitions
  const variantClasses = {
    primary: 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm shadow-indigo-500/20',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    success: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-500/20',
    danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm shadow-red-500/20',
    warning: 'bg-amber-500 hover:bg-amber-600 text-white shadow-sm shadow-amber-500/20',
    info: 'bg-cyan-500 hover:bg-cyan-600 text-white shadow-sm shadow-cyan-500/20',
    light: 'bg-white border border-gray-300 hover:bg-gray-50 text-gray-700',
    dark: 'bg-gray-800 hover:bg-gray-900 text-white shadow-sm shadow-gray-800/20',
    outline: 'bg-transparent border-2 border-indigo-500 text-indigo-600 hover:bg-indigo-50',
    ghost: 'bg-transparent hover:bg-indigo-50 text-indigo-600',
    link: 'bg-transparent text-indigo-600 hover:text-indigo-700 hover:underline p-0 h-auto shadow-none',
  };

  // Button size styling with improved proportions
  const sizeClasses = {
    xs: 'text-xs px-2.5 py-1 h-7 rounded',
    sm: 'text-sm px-3 py-1.5 h-9 rounded',
    md: 'text-sm px-4 py-2 h-10 rounded-md',
    lg: 'text-base px-5 py-2.5 h-12 rounded-md',
    xl: 'text-lg px-6 py-3 h-14 rounded-md',
  };

  const classes = `
    inline-flex items-center justify-center
    font-medium
    focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-indigo-500
    transition-all duration-300 ease-in-out
    ${variantClasses[variant] || variantClasses.primary}
    ${sizeClasses[size] || sizeClasses.md}
    ${fullWidth ? 'w-full' : ''}
    ${disabled || isLoading ? 'opacity-60 cursor-not-allowed' : 'transform hover:-translate-y-0.5 active:translate-y-0 active:shadow-none'}
    ${hasPulse && !disabled && !isLoading ? 'animate-pulse' : ''}
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
          <span className="mr-2.5 inline-block h-4 w-4 animate-spin rounded-full border-2 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status"></span>
          <span>{loadingText || children}</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="mr-2 -ml-1 flex-shrink-0">{leftIcon}</span>}
          <span className="truncate">{children}</span>
          {rightIcon && <span className="ml-2 -mr-1 flex-shrink-0">{rightIcon}</span>}
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
  /** Whether the button should have a pulse animation */
  hasPulse: PropTypes.bool,
};

export default Button; 