import React from 'react';
import PropTypes from 'prop-types';

/**
 * A flexible and modern status badge component to visually represent status
 * across the application with consistent styling.
 */
const StatusBadge = ({ 
  status, 
  customColor, 
  size = 'md', 
  withDot = true, 
  className = '',
  pulsate = false
}) => {
  // Predefined status configurations
  const statusConfig = {
    // Success statuses
    success: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      dot: 'bg-green-500'
    },
    active: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      dot: 'bg-green-500'
    },
    verified: {
      bg: 'bg-green-100',
      text: 'text-green-800',
      border: 'border-green-200',
      dot: 'bg-green-500'
    },
    
    // Warning statuses
    warning: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500'
    },
    pending: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500'
    },
    processing: {
      bg: 'bg-yellow-100',
      text: 'text-yellow-800',
      border: 'border-yellow-200',
      dot: 'bg-yellow-500'
    },
    
    // Error statuses
    error: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    },
    failed: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    },
    invalid: {
      bg: 'bg-red-100',
      text: 'text-red-800',
      border: 'border-red-200',
      dot: 'bg-red-500'
    },
    
    // Info statuses
    info: {
      bg: 'bg-blue-100',
      text: 'text-blue-800',
      border: 'border-blue-200',
      dot: 'bg-blue-500'
    },
    inactive: {
      bg: 'bg-gray-100',
      text: 'text-gray-800',
      border: 'border-gray-200',
      dot: 'bg-gray-500'
    }
  };

  // Get status configuration or use custom color
  const config = statusConfig[status.toLowerCase()] || {
    bg: `bg-${customColor}-100`,
    text: `text-${customColor}-800`,
    border: `border-${customColor}-200`,
    dot: `bg-${customColor}-500`
  };

  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-0.5',
    lg: 'text-base px-3 py-1'
  };

  // Dot size classes
  const dotSizeClasses = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5'
  };

  return (
    <span
      className={`
        inline-flex items-center justify-center gap-1.5 
        rounded-full border ${config.border} ${config.bg} ${config.text} font-medium
        ${sizeClasses[size]} 
        transition-all duration-200 
        ${className}
      `}
    >
      {withDot && (
        <span 
          className={`
            ${dotSizeClasses[size]} rounded-full ${config.dot}
            ${pulsate ? 'animate-pulse' : ''}
          `}
          aria-hidden="true"
        />
      )}
      <span className="capitalize">{status}</span>
    </span>
  );
};

StatusBadge.propTypes = {
  /** The status to display */
  status: PropTypes.string.isRequired,
  /** Custom color name (tailwind color without the intensity) when status doesn't match predefined ones */
  customColor: PropTypes.string,
  /** Size of the badge */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Whether to show the status dot */
  withDot: PropTypes.bool,
  /** Additional classes to apply */
  className: PropTypes.string,
  /** Whether the dot should pulsate */
  pulsate: PropTypes.bool
};

export default StatusBadge; 