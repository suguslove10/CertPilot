import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

/**
 * A flexible modal/dialog component with animation
 * and backdrop click handling.
 */
const Modal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closeOnBackdropClick = true,
  closeOnEsc = true,
  showCloseButton = true,
  footer,
  className = '',
  overlayClassName = '',
}) => {
  const modalRef = useRef(null);

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      document.body.style.overflow = 'hidden'; // Prevent background scrolling
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      document.body.style.overflow = ''; // Restore scrolling when modal closes
    };
  }, [isOpen, onClose, closeOnEsc]);

  // Handle click outside modal
  const handleBackdropClick = (event) => {
    if (closeOnBackdropClick && modalRef.current && !modalRef.current.contains(event.target)) {
      onClose();
    }
  };

  // Size classes
  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4',
  };

  // Don't render if not open
  if (!isOpen) return null;

  return createPortal(
    <div 
      className={`
        fixed inset-0 z-50 flex items-center justify-center p-4 
        ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        transition-opacity duration-300 ease-in-out
        ${overlayClassName}
      `}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div 
        className={`
          absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm
          ${isOpen ? 'opacity-100' : 'opacity-0'}
          transition-opacity duration-300 ease-in-out
        `}
      ></div>
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`
          relative bg-white w-full rounded-lg shadow-xl 
          ${sizeClasses[size]}
          ${isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}
          transition-all duration-300 ease-out
          ${className}
        `}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            {title && (
              <h3 className="text-lg font-medium text-gray-900" id="modal-title">
                {title}
              </h3>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="text-gray-400 bg-transparent rounded-md p-1.5 inline-flex items-center justify-center hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                onClick={onClose}
                aria-label="Close"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(100vh-14rem)]">
          {children}
        </div>
        
        {/* Footer */}
        {footer && (
          <div className="px-4 py-3 sm:px-6 bg-gray-50 border-t border-gray-200 rounded-b-lg">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};

Modal.propTypes = {
  /** Whether the modal is open */
  isOpen: PropTypes.bool.isRequired,
  /** Function to call when the modal should close */
  onClose: PropTypes.func.isRequired,
  /** Modal title */
  title: PropTypes.node,
  /** Modal content */
  children: PropTypes.node.isRequired,
  /** Modal size */
  size: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', 'full']),
  /** Whether clicking the backdrop should close the modal */
  closeOnBackdropClick: PropTypes.bool,
  /** Whether pressing ESC should close the modal */
  closeOnEsc: PropTypes.bool,
  /** Whether to show the close button */
  showCloseButton: PropTypes.bool,
  /** Footer content */
  footer: PropTypes.node,
  /** Additional CSS classes for the modal */
  className: PropTypes.string,
  /** Additional CSS classes for the overlay */
  overlayClassName: PropTypes.string,
};

export default Modal; 