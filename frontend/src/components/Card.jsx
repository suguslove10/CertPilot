import React from 'react';

/**
 * Reusable Card component with modern styling
 * @param {Object} props - Component props
 * @param {string} props.title - Card title
 * @param {React.ReactNode} props.children - Card content
 * @param {string} props.className - Additional CSS classes
 * @param {React.ReactNode} props.actions - Optional action buttons to display in the footer
 * @param {string} props.variant - Card variant (default, success, warning, danger)
 * @param {React.ReactNode} props.icon - Optional icon to display in the header
 * @param {boolean} props.isLoading - Whether the card is in loading state
 * @returns {React.ReactElement} - Card component
 */
const Card = ({
  title,
  children,
  className = '',
  actions,
  variant = 'default',
  icon,
  isLoading = false
}) => {
  // Determine card border color based on variant
  const variantStyles = {
    default: 'border-gray-200',
    success: 'border-l-4 border-l-green-500',
    warning: 'border-l-4 border-l-yellow-500',
    danger: 'border-l-4 border-l-red-500',
    info: 'border-l-4 border-l-blue-500'
  };

  return (
    <div className={`bg-white rounded-lg shadow-md border ${variantStyles[variant]} overflow-hidden ${className}`}>
      {/* Card Header */}
      {title && (
        <div className="px-5 py-4 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center">
            {icon && <span className="mr-2">{icon}</span>}
            <h3 className="font-semibold text-lg text-gray-800">{title}</h3>
          </div>
          {isLoading && (
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
          )}
        </div>
      )}
      
      {/* Card Body */}
      <div className="p-5">
        {children}
      </div>
      
      {/* Card Footer with Actions */}
      {actions && (
        <div className="px-5 py-4 bg-gray-50 border-t border-gray-100 flex justify-end space-x-2">
          {actions}
        </div>
      )}
    </div>
  );
};

export default Card; 