import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';

/**
 * An enhanced modal dialog component with smooth animations, backdrop blur,
 * and responsive design for a modern UI experience.
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
  centered = true,
  hideOverflow = true,
  variant = 'default',
  closeButtonPosition = 'header'
}) => {
  const modalRef = useRef(null);
  const [isClosing, setIsClosing] = useState(false);
  
  // Handle controlled close with animation
  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 200);
  };

  // Handle ESC key press
  useEffect(() => {
    const handleEscKey = (event) => {
      if (closeOnEsc && event.key === 'Escape' && isOpen) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
      if (hideOverflow) {
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
      }
    }

    return () => {
      document.removeEventListener('keydown', handleEscKey);
      if (hideOverflow && !isClosing) {
        document.body.style.overflow = ''; // Restore scrolling when modal closes
      }
    };
  }, [isOpen, closeOnEsc, hideOverflow, isClosing]);

  // Handle click outside modal
  const handleBackdropClick = (event) => {
    if (closeOnBackdropClick && modalRef.current && !modalRef.current.contains(event.target)) {
      handleClose();
    }
  };

  // Size classes
  const sizeClasses = {
    xs: 'max-w-xs',
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    '2xl': 'max-w-6xl',
    full: 'max-w-full mx-4'
  };
  
  // Variant styles
  const variantStyles = {
    default: 'bg-white border border-gray-200',
    info: 'bg-white border border-blue-100',
    warning: 'bg-white border border-amber-100',
    danger: 'bg-white border border-red-100',
    success: 'bg-white border border-green-100',
    dark: 'bg-gray-800 border border-gray-700 text-white',
  };

  // Don't render if not open
  if (!isOpen) return null;

  return createPortal(
    <div 
      className={`
        fixed inset-0 z-50 flex ${centered ? 'items-center' : 'items-start pt-16'} justify-center p-4 
        ${isClosing ? 'opacity-0' : 'opacity-100'}
        transition-opacity duration-300 ease-in-out
        ${overlayClassName}
      `}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
    >
      {/* Backdrop with improved blur */}
      <div 
        className={`
          absolute inset-0 bg-gray-900/70 backdrop-blur-sm
          ${isClosing ? 'opacity-0' : 'opacity-100'}
          transition-opacity duration-300 ease-in-out
        `}
      ></div>
      
      {/* Modal */}
      <div 
        ref={modalRef}
        className={`
          relative w-full rounded-xl shadow-2xl overflow-hidden
          ${sizeClasses[size]}
          ${variantStyles[variant]}
          ${isClosing ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}
          transition-all duration-300 ease-out
          ${className}
        `}
      >
        {/* Absolute close button (if position is 'corner') */}
        {showCloseButton && closeButtonPosition === 'corner' && (
          <button
            type="button"
            className="absolute top-3 right-3 z-10 text-gray-400 bg-white rounded-full p-1 shadow-sm inline-flex items-center justify-center hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500 transition-colors"
            onClick={handleClose}
            aria-label="Close"
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
        
        {/* Header */}
        {(title || (showCloseButton && closeButtonPosition === 'header')) && (
          <div className="flex items-center justify-between p-5 border-b border-gray-200">
            {title && (
              <h3 className={`text-xl font-semibold ${variant === 'dark' ? 'text-white' : 'text-gray-900'}`} id="modal-title">
                {title}
              </h3>
            )}
            {showCloseButton && closeButtonPosition === 'header' && (
              <button
                type="button"
                className={`${variant === 'dark' ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'} bg-transparent rounded-md p-1.5 inline-flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-inset focus:ring-indigo-500`}
                onClick={handleClose}
                aria-label="Close"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        )}
        
        {/* Body with improved scrolling */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar max-h-[calc(100vh-14rem)]">
          {children}
        </div>
        
        {/* Footer with improved styling */}
        {footer && (
          <div className={`px-5 py-4 sm:px-6 ${variant === 'dark' ? 'bg-gray-900 border-t border-gray-700' : 'bg-gray-50 border-t border-gray-200'} rounded-b-xl`}>
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
  size: PropTypes.oneOf(['xs', 'sm', 'md', 'lg', 'xl', '2xl', 'full']),
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
  /** Whether to center the modal vertically */
  centered: PropTypes.bool,
  /** Whether to hide body overflow when modal is open */
  hideOverflow: PropTypes.bool,
  /** Style variant for the modal */
  variant: PropTypes.oneOf(['default', 'info', 'warning', 'danger', 'success', 'dark']),
  /** Position of the close button */
  closeButtonPosition: PropTypes.oneOf(['header', 'corner']),
};

export default Modal; 