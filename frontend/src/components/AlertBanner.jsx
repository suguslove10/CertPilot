import React, { useState } from 'react';

/**
 * AlertBanner component for displaying notifications with dismissal functionality
 * @param {Object} props - Component props
 * @param {string} props.type - Alert type: 'success', 'warning', 'error', 'info'
 * @param {string} props.message - Alert message
 * @param {React.ReactNode} props.icon - Custom icon
 * @param {boolean} props.dismissible - Whether the alert can be dismissed
 * @param {function} props.onDismiss - Callback when alert is dismissed
 * @returns {React.ReactElement|null} - Alert component or null if dismissed
 */
const AlertBanner = ({
  type = 'info',
  message,
  icon,
  dismissible = true,
  onDismiss
}) => {
  const [dismissed, setDismissed] = useState(false);

  // Return null if dismissed
  if (dismissed) {
    return null;
  }

  // Handle dismiss click
  const handleDismiss = () => {
    setDismissed(true);
    if (onDismiss) onDismiss();
  };

  // Alert styles by type
  const alertStyles = {
    success: 'bg-green-50 border-green-400 text-green-800',
    warning: 'bg-yellow-50 border-yellow-400 text-yellow-800',
    error: 'bg-red-50 border-red-400 text-red-800',
    info: 'bg-blue-50 border-blue-400 text-blue-800',
  };

  // Default icons by type
  const defaultIcons = {
    success: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    error: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    info: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  // Get the appropriate styles and icon
  const style = alertStyles[type] || alertStyles.info;
  const displayIcon = icon || defaultIcons[type] || defaultIcons.info;

  return (
    <div className={`flex items-center p-4 mb-4 border-l-4 ${style} rounded-md`} role="alert">
      <div className="flex-shrink-0 mr-3">
        {displayIcon}
      </div>
      <div className="flex-grow">
        {message}
      </div>
      {dismissible && (
        <button
          type="button"
          className="ml-auto -mx-1.5 -my-1.5 rounded-lg p-1.5 inline-flex h-8 w-8 hover:bg-opacity-20 hover:bg-gray-500 focus:outline-none"
          onClick={handleDismiss}
          aria-label="Close"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

export default AlertBanner; 