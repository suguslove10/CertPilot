import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

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
    return location.pathname.startsWith(path) ? 'text-blue-600' : '';
  };

  return (
    <>
      {/* Main navbar */}
      <nav className="bg-white shadow-sm fixed top-0 left-0 right-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            {/* Logo and brand */}
            <div className="flex-shrink-0 flex items-center">
              <Link
                to="/"
                className="flex items-center"
                aria-label="CertPilot Home"
              >
                <img src="/logo.svg" alt="CertPilot Logo" className="h-8 w-auto mr-2" />
                <div className="flex items-center">
                  <span className="text-gray-900 font-semibold text-lg mr-1">CertPilot</span>
                  <span className="text-xs bg-blue-100 text-blue-800 rounded-full px-2 py-0.5 font-medium">v1.0</span>
                </div>
              </Link>
            </div>

            {/* Desktop menu */}
            <div className="hidden sm:ml-6 sm:flex sm:space-x-6 sm:items-center">
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
                  <NavLink to="/traefik-dashboard" isActive={isActive('/traefik')}>
                    Traefik
                  </NavLink>
                  <NavLink to="/certificate-lifecycle" isActive={isActive('/certificate-lifecycle')}>
                    Certificate Lifecycle
                  </NavLink>
                  <NavLink to="/observability" isActive={isActive('/observability')}>
                    Observability
                  </NavLink>

                  {/* User dropdown */}
                  <div className="ml-4 relative flex-shrink-0" ref={dropdownRef}>
                    <button
                      onClick={toggleDropdown}
                      className="flex text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <div className="h-9 w-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                        {user?.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                    </button>

                    {dropdownOpen && (
                      <div className="origin-top-right absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 py-1">
                        <div className="px-4 py-2 text-sm text-gray-700 border-b border-gray-100">
                          <p className="font-medium text-gray-900">{user?.name}</p>
                          <p className="truncate text-xs mt-1">{user?.email}</p>
                        </div>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                        >
                          Sign out
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}

              {!isAuthenticated && (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium shadow-sm"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex items-center sm:hidden">
              <button
                onClick={toggleMenu}
                className="inline-flex items-center justify-center p-3 rounded-md text-blue-600 hover:text-blue-800 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
                aria-expanded={isMenuOpen}
                aria-label="Toggle navigation"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-7 w-7"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile menu overlay */}
      <div
        className={`fixed inset-0 bg-gray-800 bg-opacity-75 transition-opacity duration-300 sm:hidden ${
          isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={toggleMenu}
      />

      {/* Mobile menu panel */}
      <div
        className={`sm:hidden fixed inset-y-0 right-0 w-full max-w-xs bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="h-full flex flex-col">
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200">
            <span className="text-xl font-semibold text-gray-900">Menu</span>
            <button
              onClick={toggleMenu}
              className="p-2 rounded-md text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto">
            <div className="px-2 pt-2 pb-3 space-y-1">
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
                  <MobileNavLink to="/certificate-lifecycle" active={location.pathname === '/certificate-lifecycle'}>
                    Certificate Lifecycle
                  </MobileNavLink>
                  <MobileNavLink to="/traefik-dashboard" active={location.pathname === '/traefik-dashboard'}>
                    Traefik Dashboard
                  </MobileNavLink>
                  <MobileNavLink to="/observability" active={location.pathname === '/observability'}>
                    Observability
                  </MobileNavLink>

                  <div className="border-t border-gray-200 mt-4 pt-4">
                    <div className="flex items-center px-4">
                      <div className="flex-shrink-0">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-medium">
                          {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </div>
                      <div className="ml-3">
                        <div className="text-base font-medium text-gray-800">{user?.name}</div>
                        <div className="text-sm font-medium text-gray-500">{user?.email}</div>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-3 w-full flex items-center px-4 py-2 text-base font-medium text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                    >
                      Sign out
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col space-y-2 px-4 py-2">
                  <Link
                    to="/login"
                    className="text-gray-700 hover:text-blue-600 block px-3 py-2 text-base font-medium"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-base font-medium shadow-sm text-center"
                  >
                    Register
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Desktop navigation link
const NavLink = ({ children, to, isActive }) => (
  <Link
    to={to}
    className={`text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium transition-colors ${isActive}`}
  >
    {children}
  </Link>
);

// Mobile navigation link
const MobileNavLink = ({ children, to, active }) => (
  <Link
    to={to}
    className={`block px-3 py-2 text-base font-medium rounded-md ${
      active
        ? 'text-blue-700 bg-blue-50'
        : 'text-gray-900 hover:text-blue-700 hover:bg-blue-50'
    }`}
  >
    {children}
  </Link>
);

export default Navbar; 