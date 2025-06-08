import React from 'react';
import PropTypes from 'prop-types';

/**
 * A clean card component with minimal styling, consistent design,
 * and flexible layout options for a professional look across the application.
 */
const Card = ({
  children,
  title,
  subtitle,
  icon,
  actions,
  variant = 'default',
  className = '',
  hoverEffect = true,
  noPadding = false,
  borderPosition = 'top',
  isLoading = false,
  footerContent,
  elevation = 'md'
}) => {
  // Variant styles with more consistent, professional colors
  const variantStyles = {
    default: {
      border: 'border-gray-200',
      gradient: 'from-gray-600 to-gray-800',
      iconColor: 'text-gray-700',
      bgAccent: 'bg-gray-50',
    },
    success: {
      border: 'border-green-200',
      gradient: 'from-green-600 to-green-800',
      iconColor: 'text-green-700',
      bgAccent: 'bg-green-50',
    },
    warning: {
      border: 'border-amber-200',
      gradient: 'from-amber-600 to-amber-800',
      iconColor: 'text-amber-700',
      bgAccent: 'bg-amber-50',
    },
    danger: {
      border: 'border-red-200',
      gradient: 'from-red-600 to-red-800',
      iconColor: 'text-red-700',
      bgAccent: 'bg-red-50',
    },
    info: {
      border: 'border-blue-200',
      gradient: 'from-blue-600 to-blue-800',
      iconColor: 'text-blue-700',
      bgAccent: 'bg-blue-50',
    },
    dark: {
      border: 'border-gray-700',
      gradient: 'from-gray-800 to-gray-900',
      iconColor: 'text-gray-500',
      bgAccent: 'bg-gray-800',
    }
  };

  // Get variant styling or default
  const style = variantStyles[variant] || variantStyles.default;

  // Border position classes with minimal styling
  const borderPositionClass = {
    top: 'before:top-0 before:left-0 before:right-0 before:h-1',
    left: 'before:left-0 before:top-0 before:bottom-0 before:w-1',
    bottom: 'before:bottom-0 before:left-0 before:right-0 before:h-1',
    right: 'before:right-0 before:top-0 before:bottom-0 before:w-1',
    none: 'before:hidden'
  };
  
  // Simplified elevation styles
  const elevationClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow',
    lg: 'shadow-md',
    xl: 'shadow-lg'
  };

  return (
    <div 
      className={`
        relative overflow-hidden bg-white rounded-lg border ${style.border} 
        ${elevationClasses[elevation]}
        ${hoverEffect ? `hover:shadow transition-all duration-300 ease-out
                        ${borderPosition !== 'none' ? 'hover:before:scale-x-100 hover:before:opacity-80' : ''}` : ''}
        ${className}
        before:absolute before:bg-gradient-to-r ${style.gradient} 
        ${borderPositionClass[borderPosition]}
        before:transform ${borderPosition === 'left' || borderPosition === 'right' ? 'before:scale-y-0' : 'before:scale-x-0'}
        before:origin-left before:transition-transform before:duration-300 before:ease-out
      `}
    >
      {/* Card header with improved contrast */}
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-gray-200 p-4 sm:px-5">
          <div className="flex items-center space-x-3">
            {icon && <div className={`${style.iconColor} flex-shrink-0 text-xl`}>{icon}</div>}
            <div>
              {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-600 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}

      {/* Card body with loading state */}
      <div className={`${noPadding ? '' : 'p-4 sm:p-5'} relative`}>
        {isLoading ? (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="w-7 h-7 border-2 border-gray-700 border-t-transparent animate-spin rounded-full"></div>
          </div>
        ) : null}
        <div className={isLoading ? "opacity-50" : ""}>
          {children}
        </div>
      </div>
      
      {/* Optional footer with improved styling */}
      {footerContent && (
        <div className="border-t border-gray-200 p-4 bg-gray-50 rounded-b-lg">
          {footerContent}
        </div>
      )}
    </div>
  );
};

Card.propTypes = {
  /** The content of the card */
  children: PropTypes.node,
  /** The title of the card */
  title: PropTypes.node,
  /** The subtitle displayed under the title */
  subtitle: PropTypes.node,
  /** Icon displayed next to the title */
  icon: PropTypes.node,
  /** Action buttons/elements displayed on the top right */
  actions: PropTypes.node,
  /** Style variant for the card */
  variant: PropTypes.oneOf(['default', 'success', 'warning', 'danger', 'info', 'dark']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Whether to apply hover effects */
  hoverEffect: PropTypes.bool,
  /** Whether to remove padding from the card body */
  noPadding: PropTypes.bool,
  /** Position of the accent border */
  borderPosition: PropTypes.oneOf(['top', 'left', 'bottom', 'right', 'none']),
  /** Whether the card is in loading state */
  isLoading: PropTypes.bool,
  /** Optional footer content */
  footerContent: PropTypes.node,
  /** Card elevation/shadow level */
  elevation: PropTypes.oneOf(['none', 'sm', 'md', 'lg', 'xl'])
};

export default Card; 