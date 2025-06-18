import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Card, Spinner } from '../components';
import { useAuth } from '../context/AuthContext';

export const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    subdomains: 0,
    certificates: 0,
    traefikSSL: 0,
    systemStatus: 'inactive'
  });
  const [awsCredentialsConfigured, setAwsCredentialsConfigured] = useState(false);

  // Initial data fetch when component mounts
  useEffect(() => {
    // Store username in localStorage for persistence
    if (user && user.name) {
      localStorage.setItem('username', user.name);
    }
    
    fetchDashboardData();
  }, [user]);

  // Set up polling for real-time updates
  useEffect(() => {
    // Skip initial fetch since we already did it in the first useEffect
    const intervalId = setInterval(() => {
      fetchRealTimeStats();
    }, 10000); // Update every 10 seconds
    
    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, []);
  
  // Function to fetch real-time stats only
  const fetchRealTimeStats = async () => {
    try {
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
        
      // Get dashboard stats from dedicated endpoint
      const dashboardStatsResponse = await api.get(`/health/dashboard-stats?_t=${timestamp}`);
      const dashboardStats = dashboardStatsResponse.data;
      
      // Update stats with real data from the dashboard stats endpoint
      setStats(prevStats => ({
        ...prevStats,
        systemStatus: dashboardStats.systemStatus || prevStats.systemStatus,
        subdomains: dashboardStats.subdomains || prevStats.subdomains,
        certificates: dashboardStats.certificates || prevStats.certificates,
        traefikSSL: dashboardStats.traefikCertificates || prevStats.traefikSSL
      }));
      
      console.log('Dashboard real-time stats updated:', dashboardStats);
    } catch (error) {
      console.error('Error fetching real-time stats:', error);
    }
  };
    
  const fetchDashboardData = async () => {
    try {
      // Check AWS credentials
      try {
        const awsResponse = await api.get('/aws-credentials');
        setAwsCredentialsConfigured(true);
      } catch (error) {
        if (error.response && error.response.status === 404) {
          setAwsCredentialsConfigured(false);
        } else {
          setAwsCredentialsConfigured(true);
        }
      }

      // Get dashboard stats
      try {
        // Add timestamp to prevent caching
        const timestamp = new Date().getTime();
        const dashboardStatsResponse = await api.get(`/health/dashboard-stats?_t=${timestamp}`);
        const dashboardStats = dashboardStatsResponse.data;
        
        // Update stats with real data
        setStats({
          subdomains: dashboardStats.subdomains || 0,
          certificates: dashboardStats.certificates || 0,
          traefikSSL: dashboardStats.traefikCertificates || 0,
          systemStatus: dashboardStats.systemStatus || 'inactive'
        });
        
        console.log('Initial dashboard stats loaded:', dashboardStats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        
        // Set fallback data if the request fails
        setStats({
          subdomains: 0,
          certificates: 0,
          traefikSSL: 0,
          systemStatus: 'active'
        });
      }
    } catch (error) {
      console.error('Dashboard data fetch error:', error);
      
      // Set fallback data if all requests fail
      setStats({
        subdomains: 0,
        certificates: 0,
        traefikSSL: 0,
        systemStatus: 'active'
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner size="lg" />
      </div>
    );
  }

  const formatDate = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const lastLogin = formatDate(localStorage.getItem('lastLogin'));
  localStorage.setItem('lastLogin', new Date().toString());
  
  // Get username from localStorage or user object
  const username = localStorage.getItem('username') || user?.name || 'User';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Welcome section with gradient */}
      <div className="mb-8 p-6 bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-800 rounded-2xl shadow-lg text-white">
        <h1 className="text-3xl font-medium mb-2">
          Welcome back, <span className="font-bold">{username}</span>
        </h1>
        <p className="text-blue-100 opacity-90">
          Last login: {lastLogin}
        </p>
        <div className="mt-4 flex items-center space-x-1">
          <div className={`h-2 w-2 rounded-full ${stats.systemStatus === 'active' ? 'bg-green-400' : 'bg-gray-300'} animate-pulse`}></div>
          <span className="text-sm text-blue-100">
            System Status: <span className="font-medium">{stats.systemStatus === 'active' ? 'Active' : 'Inactive'}</span>
          </span>
        </div>
      </div>

      {/* AWS credentials warning */}
      {!awsCredentialsConfigured && (
        <div className="mb-8 bg-gradient-to-r from-amber-50 to-amber-100 dark:from-amber-900/30 dark:to-amber-800/20 border-l-4 border-amber-400 dark:border-amber-500 p-6 rounded-xl shadow-sm">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-amber-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-amber-800 dark:text-amber-300">AWS Credentials Required</h3>
              <p className="mt-1 text-amber-700 dark:text-amber-300">
                Please configure your AWS credentials to use all features of CertPilot.
              </p>
              <div className="mt-3">
                <Link
                  to="/aws-credentials"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-amber-600 hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 transition-colors"
                >
                  Configure Now
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <StatCard 
          title="Subdomains" 
          count={stats.subdomains} 
          link="/subdomains"
          color="blue"
          icon="globe"
        />
        
        <StatCard 
          title="SSL Certificates" 
          count={stats.certificates} 
          link="/certificates"
          color="green"
          icon="shield"
        />
        
        <StatCard 
          title="Traefik SSL" 
          count={stats.traefikSSL} 
          link="/traefik-certificates"
          color="purple"
          icon="lock"
        />
      </div>

      {/* Quick access cards */}
      <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-6">Quick Access</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAccessCard
          title="AWS Credentials"
          description="Configure your AWS credentials to access Route53 for DNS record management."
          link="/aws-credentials"
          buttonText="Configure AWS"
          icon="key"
          color="yellow"
        />
        
        <QuickAccessCard
          title="Subdomain Management"
          description="Create and configure subdomains for your websites and applications using Route53."
          link="/subdomains"
          buttonText="Manage Subdomains"
          icon="globe"
          color="blue"
        />
        
        <QuickAccessCard
          title="SSL Certificate Management"
          description="Let's Encrypt certificates for your domains and subdomains with automated renewal."
          link="/certificates"
          buttonText="Manage SSL Certificates"
          icon="shield"
          color="green"
        />

        <QuickAccessCard
          title="Traefik SSL Certificate Management"
          description="Issue and manage SSL certificates using Traefik's automatic HTTPS support for your domains."
          link="/traefik-certificates"
          buttonText="Manage Traefik SSL"
          icon="lock"
          color="purple"
        />
      </div>
      
      {/* Resources Section */}
      <div className="mt-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">Resources & Documentation</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <ResourceLink 
            title="Certificate Lifecycle" 
            description="Learn about certificate lifecycle management" 
            link="/certificate-lifecycle"
            icon="refresh"
          />
          <ResourceLink 
            title="Observability" 
            description="Monitor your certificates and infrastructure" 
            link="/observability"
            icon="chart"
          />
          <ResourceLink 
            title="Traefik Dashboard" 
            description="View your Traefik configuration and statistics" 
            link="/traefik-dashboard"
            icon="dashboard"
          />
        </div>
      </div>
    </div>
  );
};

// Stat Card Component with improved design
const StatCard = ({ title, count, link, color, icon }) => {
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Add effect to show a brief animation when count changes
  useEffect(() => {
    setIsUpdating(true);
    const timer = setTimeout(() => {
      setIsUpdating(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [count]);

  const colors = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-500 to-blue-600',
      iconBg: 'bg-blue-400/30',
      iconColor: 'text-blue-100',
      shadow: 'shadow-blue-500/20'
    },
    green: {
      bg: 'bg-gradient-to-br from-emerald-500 to-emerald-600',
      iconBg: 'bg-emerald-400/30',
      iconColor: 'text-emerald-100',
      shadow: 'shadow-emerald-500/20'
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-500 to-purple-600',
      iconBg: 'bg-purple-400/30',
      iconColor: 'text-purple-100',
      shadow: 'shadow-purple-500/20'
    },
    gray: {
      bg: 'bg-gradient-to-br from-gray-600 to-gray-700',
      iconBg: 'bg-gray-500/30',
      iconColor: 'text-gray-100',
      shadow: 'shadow-gray-500/20'
    }
  };
  
  const colorClasses = colors[color] || colors.gray;
  
  // Different icons based on the parameter
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'globe':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'shield':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'lock':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <Link to={link} className="block">
      <div className={`${colorClasses.bg} rounded-xl shadow-lg ${colorClasses.shadow} p-6 text-white hover:shadow-xl transform transition-all hover:-translate-y-1 ${isUpdating ? 'pulse-animation' : ''}`}>
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-medium text-white/90">{title}</h3>
            <p className={`text-4xl font-bold mt-2 ${isUpdating ? 'scale-animation' : ''}`}>{count}</p>
          </div>
          <div className={`${colorClasses.iconBg} p-3 rounded-lg ${colorClasses.iconColor}`}>
            {getIcon(icon)}
          </div>
        </div>
        <div className="mt-4">
          <div className="text-sm text-white/80 flex items-center">
            <span>Click to manage</span>
            {isUpdating && (
              <span className="ml-2 inline-block h-2 w-2 rounded-full bg-white animate-pulse"></span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Quick Access Card Component with improved design
const QuickAccessCard = ({ title, description, link, buttonText, icon, color }) => {
  const colors = {
    blue: {
      iconBg: 'bg-blue-100 dark:bg-blue-900/30',
      iconColor: 'text-blue-600 dark:text-blue-400',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
    green: {
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/30',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      button: 'bg-emerald-600 hover:bg-emerald-700 focus:ring-emerald-500',
    },
    purple: {
      iconBg: 'bg-purple-100 dark:bg-purple-900/30',
      iconColor: 'text-purple-600 dark:text-purple-400',
      button: 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500',
    },
    yellow: {
      iconBg: 'bg-amber-100 dark:bg-amber-900/30',
      iconColor: 'text-amber-600 dark:text-amber-400',
      button: 'bg-amber-600 hover:bg-amber-700 focus:ring-amber-500',
    }
  };
  
  const colorClasses = colors[color] || colors.blue;
  
  // Different icons based on the parameter
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'globe':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'shield':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
          </svg>
        );
      case 'lock':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        );
      case 'key':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-all hover:shadow-lg">
      <div className="p-6">
        <div className={`${colorClasses.iconBg} w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses.iconColor} mb-4`}>
          {getIcon(icon)}
        </div>
        <h3 className="font-semibold text-lg text-gray-800 dark:text-gray-200 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-4">{description}</p>
        <Link
          to={link}
          className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white ${colorClasses.button} focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors`}
        >
          {buttonText}
        </Link>
      </div>
    </div>
  );
};

// Resource Link Component
const ResourceLink = ({ title, description, link, icon }) => {
  // Different icons based on the parameter
  const getIcon = (iconName) => {
    switch(iconName) {
      case 'refresh':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        );
      case 'chart':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        );
      case 'dashboard':
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
          </svg>
        );
      default:
        return (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };
  
  return (
    <Link to={link} className="flex items-start p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 hover:shadow-md transition-all">
      <div className="bg-indigo-100 dark:bg-indigo-900/30 rounded-md p-2 text-indigo-600 dark:text-indigo-400 mr-4">
        {getIcon(icon)}
      </div>
      <div>
        <h3 className="font-medium text-gray-800 dark:text-gray-200">{title}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{description}</p>
      </div>
    </Link>
  );
};

export default Dashboard;
