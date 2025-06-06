import React from 'react';
import PropTypes from 'prop-types';

/**
 * A customizable loading spinner component with different
 * sizes and colors for indicating loading states.
 */
const Spinner = ({ 
  size = 'md',
  variant = 'primary',
  className = '',
  label = 'Loading...',
  showLabel = false,
  centered = false
}) => {
  // Size classes
  const sizeMap = {
    xs: 'h-3 w-3 border-[1.5px]',
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-8 w-8 border-[3px]',
    xl: 'h-12 w-12 border-4'
  };

  // Color variants
  const variantMap = {
    primary: 'border-primary-200 border-t-primary-600',
    secondary: 'border-secondary-200 border-t-secondary-600',
    success: 'border-success-200 border-t-success-600',
    danger: 'border-danger-200 border-t-danger-600',
    warning: 'border-warning-200 border-t-warning-600',
    info: 'border-blue-200 border-t-blue-600',
    light: 'border-gray-100 border-t-gray-400',
    dark: 'border-gray-600 border-t-gray-900',
    white: 'border-white/30 border-t-white'
  };

  // Text size based on spinner size
  const textSizeMap = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg'
  };

  const spinnerClasses = `
    inline-block rounded-full animate-spin
    ${sizeMap[size] || sizeMap.md}
    ${variantMap[variant] || variantMap.primary}
    ${className}
  `;

  const wrapperClasses = `
    inline-flex flex-col items-center justify-center
    ${centered ? 'w-full' : ''}
    ${showLabel ? 'space-y-2' : ''}
  `;

  return (
    <div className={wrapperClasses} role="status" aria-live="polite">
      <div className={spinnerClasses}></div>
      {showLabel && (
        <span className={`${textSizeMap[size]} text-gray-700`}>{label}</span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );
};

Spinner.propTypes = {
  /** Size of the spinner */
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl']),
  /** Color variant */
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'success', 'danger', 
    'warning', 'info', 'light', 'dark', 'white'
  ]),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Loading text label */
  label: PropTypes.string,
  /** Whether to show the text label */
  showLabel: PropTypes.bool,
  /** Whether to center the spinner in its container */
  centered: PropTypes.bool
};

export default Spinner; 