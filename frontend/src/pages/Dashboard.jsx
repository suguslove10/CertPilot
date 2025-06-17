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

  useEffect(() => {
    // Store username in localStorage for persistence
    if (user && user.name) {
      localStorage.setItem('username', user.name);
    }
    
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

        // Get subdomain count
        try {
          const subdomainsResponse = await api.get('/subdomains/count');
          setStats(prev => ({
            ...prev,
            subdomains: subdomainsResponse.data.count || 0
          }));
        } catch (error) {
          console.error('Error fetching subdomains count:', error);
        }

        // Get certificate count
        try {
          const certsResponse = await api.get('/certificates/count');
          setStats(prev => ({
            ...prev,
            certificates: certsResponse.data.count || 0
          }));
        } catch (error) {
          console.error('Error fetching certificates count:', error);
        }

        // Get Traefik SSL count
        try {
          const traefikResponse = await api.get('/traefik-certificates/count');
          setStats(prev => ({
            ...prev,
            traefikSSL: traefikResponse.data.count || 0
          }));
        } catch (error) {
          console.error('Error fetching traefik certificates count:', error);
        }

        // Get system status
        try {
          const statusResponse = await api.get('/server-detection/status');
          setStats(prev => ({
            ...prev,
            systemStatus: statusResponse.data.status || 'inactive'
          }));
        } catch (error) {
          console.error('Error fetching system status:', error);
        }
      } catch (error) {
        console.error('Dashboard data fetch error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user]);

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
      {/* Welcome section */}
      <div className="mb-8">
        <h1 className="text-3xl font-light text-gray-800 mb-1">
          Welcome back, <span className="font-medium">{username}</span>
        </h1>
        <p className="text-gray-500 text-sm">
          Last login: {lastLogin}
        </p>
      </div>

      {/* AWS credentials warning */}
      {!awsCredentialsConfigured && (
        <div className="mb-8 bg-amber-50 border-l-4 border-amber-400 p-4 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-amber-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-amber-700">
                Please configure your AWS credentials to use all features.
              </p>
              <div className="mt-2">
                <Link
                  to="/aws-credentials"
                  className="text-sm font-medium text-amber-700 hover:text-amber-600 underline"
                >
                  Configure Now →
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stats overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <StatCard 
          title="Subdomains" 
          count={stats.subdomains} 
          link="/subdomains"
          color="blue"
        />
        
        <StatCard 
          title="SSL Certificates" 
          count={stats.certificates} 
          link="/certificates"
          color="green"
        />
        
        <StatCard 
          title="Traefik SSL" 
          count={stats.traefikSSL} 
          link="/traefik-certificates"
          color="purple"
        />
        
        <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">System Status</h3>
          <div className="flex items-center mt-2">
            <div className={`h-3 w-3 rounded-full mr-2 ${stats.systemStatus === 'active' ? 'bg-green-500' : 'bg-gray-300'}`} />
            <span className="text-xl font-medium text-gray-800">
              {stats.systemStatus === 'active' ? 'Active' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* Quick access cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickAccessCard
          title="AWS Credentials"
          description="Configure your AWS credentials to access Route53 for DNS record management."
          link="/aws-credentials"
          buttonText="Configure AWS"
        />
        
        <QuickAccessCard
          title="Subdomain Management"
          description="Create and configure subdomains for your websites and applications using Route53."
          link="/subdomains"
          buttonText="Manage Subdomains"
        />
        
        <QuickAccessCard
          title="SSL Certificate Management"
          description="Let's Encrypt certificates for your domains and subdomains with automated renewal."
          link="/certificates"
          buttonText="Manage SSL Certificates"
        />

        <QuickAccessCard
          title="Traefik SSL Certificate Management"
          description="Issue and manage SSL certificates using Traefik's automatic HTTPS support for your domains."
          link="/traefik-certificates"
          buttonText="Manage Traefik SSL"
        />
      </div>
    </div>
  );
};

// Stat Card Component
const StatCard = ({ title, count, link, color }) => {
  const colors = {
    blue: {
      bg: 'bg-blue-50',
      text: 'text-blue-600'
    },
    green: {
      bg: 'bg-green-50',
      text: 'text-green-600'
    },
    purple: {
      bg: 'bg-purple-50',
      text: 'text-purple-600'
    },
    gray: {
      bg: 'bg-gray-50',
      text: 'text-gray-600'
    }
  };
  
  const colorClasses = colors[color] || colors.gray;
  
  return (
    <Link to={link} className="block">
      <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow duration-200">
        <h3 className="text-sm font-medium text-gray-500">{title}</h3>
        <div className="mt-2 flex items-center justify-between">
          <span className="text-3xl font-medium text-gray-800">{count}</span>
          <div className={`w-8 h-8 rounded-full ${colorClasses.bg} ${colorClasses.text} flex items-center justify-center`}>
            {color === 'blue' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
            {color === 'green' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            )}
            {color === 'purple' && (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
};

// Quick Access Card Component
const QuickAccessCard = ({ title, description, link, buttonText }) => (
  <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
    <div className="p-6">
      <h3 className="text-lg font-medium text-gray-800 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 mb-4">{description}</p>
      <Link to={link}>
        <button className="bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 px-4 py-2 rounded text-sm font-medium transition-colors w-full">
          {buttonText}
        </button>
      </Link>
    </div>
  </div>
);

export default Dashboard;
