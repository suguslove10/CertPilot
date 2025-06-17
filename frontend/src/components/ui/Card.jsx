import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Card.css';

/**
 * Card component that follows the CertPilot design system
 * Modern, clean, and accessible card component
 */
const Card = forwardRef(({
  children,
  title,
  subtitle,
  headerAction,
  footer,
  elevation = 'md',
  className = '',
  fullWidth = false,
  onClick,
  hoverable = false,
  border = false,
  padding = 'md',
  testId,
  as = 'div',
  ...props
}, ref) => {
  const baseClasses = 'card';
  const elevationClass = `card-elevation-${elevation}`;
  const widthClass = fullWidth ? 'card-full-width' : '';
  const clickableClass = onClick ? 'card-clickable' : '';
  const hoverableClass = hoverable ? 'card-hoverable' : '';
  const borderClass = border ? 'card-border' : '';
  const paddingClass = `card-padding-${padding}`;
  
  const classes = [
    baseClasses,
    elevationClass,
    widthClass,
    clickableClass,
    hoverableClass,
    borderClass,
    paddingClass,
    className
  ].filter(Boolean).join(' ');
  
  // Determine the HTML element to render
  const Element = as;
  
  // Handle keyboard interaction for clickable cards
  const handleKeyDown = (e) => {
    if (onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      onClick(e);
    }
  };
  
  // Accessibility props for clickable cards
  const interactiveProps = onClick ? {
    role: 'button',
    tabIndex: 0,
    onClick,
    onKeyDown: handleKeyDown,
    'aria-pressed': undefined, // This should be controlled by the parent if needed
  } : {};
  
  return (
    <Element 
      ref={ref}
      className={classes}
      data-testid={testId}
      {...interactiveProps}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="card-header">
          <div className="card-header-content">
            {title && (
              typeof title === 'string' 
                ? <h3 className="card-title">{title}</h3>
                : <div className="card-title">{title}</div>
            )}
            {subtitle && <div className="card-subtitle">{subtitle}</div>}
          </div>
          {headerAction && (
            <div className="card-header-action">
              {headerAction}
            </div>
          )}
        </div>
      )}
      <div className="card-content">
        {children}
      </div>
      {footer && (
        <div className="card-footer">
          {footer}
        </div>
      )}
    </Element>
  );
});

Card.displayName = 'Card';

Card.propTypes = {
  /** Card content */
  children: PropTypes.node.isRequired,
  /** Card title (string or component) */
  title: PropTypes.node,
  /** Card subtitle */
  subtitle: PropTypes.node,
  /** Action component in the header (usually a button) */
  headerAction: PropTypes.node,
  /** Footer content */
  footer: PropTypes.node,
  /** Shadow depth */
  elevation: PropTypes.oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl', '2xl']),
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Makes card take full width of container */
  fullWidth: PropTypes.bool,
  /** Click handler */
  onClick: PropTypes.func,
  /** Apply hover effect even without onClick */
  hoverable: PropTypes.bool,
  /** Apply border */
  border: PropTypes.bool,
  /** Content padding size */
  padding: PropTypes.oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl']),
  /** Data test ID for testing */
  testId: PropTypes.string,
  /** Render as different HTML element */
  as: PropTypes.oneOfType([PropTypes.string, PropTypes.elementType]),
};

export default Card; 