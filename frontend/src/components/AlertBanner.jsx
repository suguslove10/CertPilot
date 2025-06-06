import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

/**
 * A modern, animated alert banner for displaying system messages,
 * errors, warnings, and success notifications.
 */
const AlertBanner = ({
  type = 'info',
  message,
  onClose,
  autoClose = false,
  autoCloseTime = 5000,
  icon = true,
  className = '',
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isLeaving, setIsLeaving] = useState(false);

  // Auto-close functionality
  useEffect(() => {
    let timer;
    if (autoClose && message) {
      timer = setTimeout(() => {
        handleClose();
      }, autoCloseTime);
    }
    return () => clearTimeout(timer);
  }, [autoClose, message, autoCloseTime]);
  
  // Handle message changes - reset visibility
  useEffect(() => {
    if (message) {
      setIsVisible(true);
      setIsLeaving(false);
    }
  }, [message]);

  // Handle close with animation
  const handleClose = () => {
    setIsLeaving(true);
    
    // Wait for animation to complete before removing from DOM
    setTimeout(() => {
      setIsVisible(false);
      if (onClose) onClose();
    }, 300);
  };

  if (!message || !isVisible) return null;

  // Alert configurations
  const alertConfig = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      text: 'text-blue-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
        </svg>
      ),
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      text: 'text-green-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
        </svg>
      ),
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      text: 'text-yellow-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      ),
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      text: 'text-red-800',
      icon: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      ),
    },
  };

  const config = alertConfig[type] || alertConfig.info;

  return (
    <div 
      className={`
        rounded-lg border p-4 mb-4 flex items-start 
        ${config.bg} ${config.border} ${config.text}
        ${isLeaving ? 'opacity-0 -translate-y-2' : 'opacity-100 translate-y-0'}
        transition-all duration-300 ease-in-out
        ${className}
      `}
      role="alert"
      aria-live="assertive"
    >
      {icon && <div className="flex-shrink-0 mr-3 mt-0.5">{config.icon}</div>}
      
      <div className="flex-grow">
        <div className="text-sm font-medium">
          {message}
        </div>
      </div>
      
      {onClose && (
        <button
          type="button"
          onClick={handleClose}
          className={`ml-3 -mr-1 -mt-1 p-1.5 rounded-md ${config.text} hover:bg-opacity-20 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500`}
          aria-label="Close"
        >
          <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
          </svg>
        </button>
      )}
    </div>
  );
};

AlertBanner.propTypes = {
  /** The type of alert */
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  /** The message to display */
  message: PropTypes.string,
  /** Function to call when the alert is closed */
  onClose: PropTypes.func,
  /** Whether to automatically close the alert after a time period */
  autoClose: PropTypes.bool,
  /** Time in milliseconds before auto-closing (if autoClose is true) */
  autoCloseTime: PropTypes.number,
  /** Whether to show the type icon */
  icon: PropTypes.bool,
  /** Additional classes to apply */
  className: PropTypes.string,
};

export default AlertBanner; 