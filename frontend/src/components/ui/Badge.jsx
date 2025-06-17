import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import './Badge.css';

/**
 * Badge component that follows the CertPilot design system
 * Used to highlight status, count or labels with distinct visual styling
 */
const Badge = forwardRef(({
  children,
  variant = 'primary',
  size = 'md',
  pill = false,
  icon = null,
  className = '',
  dot = false,
  outline = false,
  testId,
  ...props
}, ref) => {
  const baseClasses = 'badge';
  const variantClass = `badge-${variant}`;
  const sizeClass = `badge-${size}`;
  const shapeClass = pill ? 'badge-pill' : '';
  const dotClass = dot ? 'badge-dot' : '';
  const outlineClass = outline ? 'badge-outline' : '';
  
  const classes = [
    baseClasses,
    variantClass,
    sizeClass,
    shapeClass,
    dotClass,
    outlineClass,
    className
  ].filter(Boolean).join(' ');
  
  // For empty badge with just a dot
  if (dot && !children && !icon) {
    return <span ref={ref} className={classes} data-testid={testId} {...props} />;
  }
  
  return (
    <span ref={ref} className={classes} data-testid={testId} {...props}>
      {dot && <span className="badge-dot-indicator" aria-hidden="true" />}
      {icon && <span className="badge-icon" aria-hidden="true">{icon}</span>}
      {children && <span className="badge-text">{children}</span>}
    </span>
  );
});

Badge.displayName = 'Badge';

Badge.propTypes = {
  /** Badge content */
  children: PropTypes.node,
  /** Badge style variant */
  variant: PropTypes.oneOf(['primary', 'secondary', 'success', 'error', 'warning', 'info', 'neutral']),
  /** Badge size */
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  /** Make badge fully rounded */
  pill: PropTypes.bool,
  /** Icon to display */
  icon: PropTypes.node,
  /** Additional CSS classes */
  className: PropTypes.string,
  /** Show colored dot indicator */
  dot: PropTypes.bool,
  /** Use outlined style */
  outline: PropTypes.bool,
  /** Data test ID for testing */
  testId: PropTypes.string,
};

export default Badge; 