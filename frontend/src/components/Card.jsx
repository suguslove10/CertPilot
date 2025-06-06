import React from 'react';
import PropTypes from 'prop-types';

/**
 * A versatile card component that can be used throughout the application
 * with consistent styling and customization options.
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
  borderPosition = 'top'
}) => {
  // Variant styles
  const variantStyles = {
    default: {
      border: 'border-gray-200',
      gradient: 'from-indigo-500 to-indigo-600',
    },
    success: {
      border: 'border-green-200',
      gradient: 'from-green-500 to-green-600',
    },
    warning: {
      border: 'border-yellow-200',
      gradient: 'from-yellow-500 to-amber-500',
    },
    danger: {
      border: 'border-red-200',
      gradient: 'from-red-500 to-red-600',
    },
    info: {
      border: 'border-blue-200',
      gradient: 'from-blue-500 to-blue-600',
    },
    dark: {
      border: 'border-gray-700',
      gradient: 'from-gray-700 to-gray-800',
    }
  };

  // Get variant styling or default
  const style = variantStyles[variant] || variantStyles.default;

  // Border position classes
  const borderPositionClass = {
    top: 'before:top-0 before:left-0 before:right-0 before:h-1',
    left: 'before:left-0 before:top-0 before:bottom-0 before:w-1',
    bottom: 'before:bottom-0 before:left-0 before:right-0 before:h-1',
    right: 'before:right-0 before:top-0 before:bottom-0 before:w-1',
    none: 'before:hidden'
  };

  return (
    <div 
      className={`
        relative overflow-hidden bg-white rounded-lg shadow-sm border ${style.border} 
        ${hoverEffect ? 'hover:shadow-md transition-all duration-300 hover:-translate-y-1' : ''}
        ${className}
        before:absolute before:bg-gradient-to-r ${style.gradient} 
        ${borderPositionClass[borderPosition]}
      `}
    >
      {/* Card header */}
      {(title || actions) && (
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:px-6">
          <div className="flex items-center space-x-3">
            {icon && <div className="text-indigo-500 flex-shrink-0">{icon}</div>}
            <div>
              {title && <h3 className="text-lg font-medium text-gray-900">{title}</h3>}
              {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
            </div>
          </div>
          {actions && <div className="flex items-center space-x-2">{actions}</div>}
        </div>
      )}

      {/* Card body */}
      <div className={noPadding ? '' : 'p-4 sm:p-6'}>
        {children}
      </div>
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
  borderPosition: PropTypes.oneOf(['top', 'left', 'bottom', 'right', 'none'])
};

export default Card; 