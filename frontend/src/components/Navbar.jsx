import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';
import './Navbar.css';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const dropdownRef = useRef(null);

  // Handle scroll to change navbar appearance
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setDropdownOpen(false);
  }, [location.pathname]);

  // Handle clicks outside of dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleDropdown = () => {
    setDropdownOpen(!dropdownOpen);
  };

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
    // Prevent body scroll when menu is open
    document.body.style.overflow = !isMenuOpen ? 'hidden' : '';
  };

  const isActive = (path) => {
    return location.pathname.startsWith(path) ? 'navbar-link-active' : '';
  };

  return (
    <>
      {/* Main navbar with enhanced styling */}
      <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-content">
            {/* Logo and brand */}
            <Link
              to="/"
              className="navbar-brand"
              aria-label="CertPilot Home"
            >
              <img src="/logo.svg" alt="CertPilot Logo" className="navbar-logo" />
              <span className="navbar-title">CertPilot</span>
              <span className="navbar-version">v1.0</span>
            </Link>

            {/* Desktop menu with enhanced styling */}
            <div className="navbar-nav">
              {isAuthenticated && (
                <>
                  <NavLink to="/dashboard" isActive={isActive('/dashboard')}>
                    Dashboard
                  </NavLink>
                  <NavLink to="/aws-credentials" isActive={isActive('/aws')}>
                    AWS
                  </NavLink>
                  <NavLink to="/subdomains" isActive={isActive('/subdomains')}>
                    Subdomains
                  </NavLink>
                  <NavLink to="/certificates" isActive={isActive('/certificates')}>
                    SSL
                  </NavLink>
                  <NavLink to="/cloudflare-integration" isActive={isActive('/cloudflare')}>
                    Cloudflare
                  </NavLink>
                  <NavLink to="/traefik-dashboard" isActive={isActive('/traefik')}>
                    Traefik
                  </NavLink>
                  <NavLink to="/certificate-lifecycle" isActive={isActive('/certificate-lifecycle')}>
                    Certificate Lifecycle
                  </NavLink>
                  <NavLink to="/observability" isActive={isActive('/observability')}>
                    Observability
                  </NavLink>

                  {/* Theme toggle */}
                  <ThemeToggle className="ml-2" />

                  {/* User dropdown with enhanced styling */}
                  <div className="user-dropdown" ref={dropdownRef}>
                    <button
                      onClick={toggleDropdown}
                      className="user-avatar"
                      aria-expanded={dropdownOpen}
                      aria-label="User menu"
                    >
                      {user?.name?.charAt(0).toUpperCase() || 'U'}
                    </button>

                    <div className={`dropdown-menu ${dropdownOpen ? 'active' : ''}`}>
                      <div className="dropdown-header">
                        <p className="dropdown-user-name">{user?.name}</p>
                        <p className="dropdown-user-email">{user?.email}</p>
                      </div>
                      <button
                        onClick={handleLogout}
                        className="dropdown-item danger"
                      >
                        <span className="dropdown-item-icon">
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                            <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                          </svg>
                        </span>
                        Sign out
                      </button>
                    </div>
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="auth-buttons">
                  <Link
                    to="/login"
                    className="navbar-link"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="btn btn-primary btn-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button with enhanced styling */}
            <button
              onClick={toggleMenu}
              className="mobile-menu-button"
              aria-expanded={isMenuOpen}
              aria-label="Toggle navigation"
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay with enhanced styling */}
      <div
        className={`mobile-menu-overlay ${isMenuOpen ? 'active' : ''}`}
        onClick={toggleMenu}
      />

      {/* Mobile menu panel with enhanced styling */}
      <div
        className={`mobile-menu-panel ${isMenuOpen ? 'active' : ''}`}
      >
        <div className="mobile-menu-header">
          <span className="mobile-menu-title">Menu</span>
          <button
            onClick={toggleMenu}
            className="mobile-menu-close"
            aria-label="Close menu"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="mobile-menu-content">
          {isAuthenticated ? (
            <>
              <MobileNavLink to="/dashboard" active={location.pathname === '/dashboard'}>
                Dashboard
              </MobileNavLink>
              <MobileNavLink to="/aws-credentials" active={location.pathname === '/aws-credentials'}>
                AWS Credentials
              </MobileNavLink>
              <MobileNavLink to="/subdomains" active={location.pathname === '/subdomains'}>
                Subdomains
              </MobileNavLink>
              <MobileNavLink to="/certificates" active={location.pathname === '/certificates'}>
                SSL Certificates
              </MobileNavLink>
              <MobileNavLink to="/traefik-certificates" active={location.pathname === '/traefik-certificates'}>
                Traefik SSL
              </MobileNavLink>
              <MobileNavLink to="/cloudflare-integration" active={location.pathname === '/cloudflare-integration'}>
                Cloudflare Integration
              </MobileNavLink>
              <MobileNavLink to="/certificate-lifecycle" active={location.pathname === '/certificate-lifecycle'}>
                Certificate Lifecycle
              </MobileNavLink>
              <MobileNavLink to="/traefik-dashboard" active={location.pathname === '/traefik-dashboard'}>
                Traefik Dashboard
              </MobileNavLink>
              <MobileNavLink to="/observability" active={location.pathname === '/observability'}>
                Observability
              </MobileNavLink>

              {/* Theme toggle in mobile menu */}
              <div className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="text-base font-medium">Theme</span>
                  <ThemeToggle />
                </div>
              </div>
              
              {/* User info in mobile menu */}
              {user && (
                <div className="mobile-user-section">
                  <div className="mobile-user-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="mobile-user-info">
                    <p className="mobile-user-name">{user?.name}</p>
                    <p className="mobile-user-email">{user?.email}</p>
                  </div>
                </div>
              )}
              
              <button
                onClick={handleLogout}
                className="dropdown-item danger"
              >
                <span className="dropdown-item-icon">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
                    <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clipRule="evenodd" />
                    <path fillRule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943h9.546A.75.75 0 0019 10z" clipRule="evenodd" />
                  </svg>
                </span>
                Sign out
              </button>
            </>
          ) : (
            <>
              <MobileNavLink to="/login">Log in</MobileNavLink>
              <MobileNavLink to="/register">Register</MobileNavLink>
            </>
          )}
        </div>
      </div>
    </>
  );
};

const NavLink = ({ children, to, isActive }) => (
  <Link
    to={to}
    className={`navbar-link ${isActive}`}
  >
    {children}
  </Link>
);

const MobileNavLink = ({ children, to, active }) => (
  <Link
    to={to}
    className={`mobile-nav-link ${active ? 'active' : ''}`}
  >
    {children}
  </Link>
);

const NavLinks = () => {
  const location = useLocation();
  
  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };
  
  return (
    <ul className="nav-links">
      <li className={isActive('/dashboard')}>
        <Link to="/dashboard">Dashboard</Link>
      </li>
      <li className={isActive('/certificates')}>
        <Link to="/certificates">SSL Certificates</Link>
      </li>
      <li className={isActive('/traefik-certificates')}>
        <Link to="/traefik-certificates">Traefik SSL</Link>
      </li>
      <li className={isActive('/certificate-lifecycle')}>
        <Link to="/certificate-lifecycle">Certificate Lifecycle</Link>
      </li>
      <li className={isActive('/subdomains')}>
        <Link to="/subdomains">Subdomains</Link>
      </li>
      <li className={isActive('/aws-integration')}>
        <Link to="/aws-integration">AWS Integration</Link>
      </li>
      <li className={isActive('/cloudflare-integration')}>
        <Link to="/cloudflare-integration">Cloudflare</Link>
      </li>
      <li className={isActive('/observability')}>
        <Link to="/observability">Observability</Link>
      </li>
    </ul>
  );
};

export default Navbar; 