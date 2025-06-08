import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import { Link } from 'react-router-dom';
import { Card, Spinner } from '../components';
import { useAuth } from '../context/AuthContext';

const Dashboard = () => {
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
          console.log('AWS credentials found:', awsResponse.data);
          setAwsCredentialsConfigured(true);
        } catch (error) {
          // Only set to false if we get a 404 Not Found error
          // Other errors like network issues shouldn't mark credentials as not configured
          if (error.response && error.response.status === 404) {
            console.error('AWS credentials not found:', error.response.data);
            setAwsCredentialsConfigured(false);
          } else {
            // For other errors, we assume credentials might be configured
            console.error('Error checking AWS credentials:', error);
            // Keep previous state or default to true to avoid showing the warning unnecessarily
            setAwsCredentialsConfigured(true);
          }
        }

        // Get subdomain count
        try {
          console.log('Fetching subdomains count...');
          const subdomainsResponse = await api.get('/subdomains/count');
          console.log('Subdomains count response:', subdomainsResponse.data);
          setStats(prev => ({
            ...prev,
            subdomains: subdomainsResponse.data.count || 0
          }));
        } catch (error) {
          console.error('Error fetching subdomains count:', error);
        }

        // Get certificate count
        try {
          console.log('Fetching certificates count...');
          const certsResponse = await api.get('/certificates/count');
          console.log('Certificates count response:', certsResponse.data);
          setStats(prev => ({
            ...prev,
            certificates: certsResponse.data.count || 0
          }));
        } catch (error) {
          console.error('Error fetching certificates count:', error);
        }

        // Get Traefik SSL count
        try {
          console.log('Fetching traefik certificates count...');
          const traefikResponse = await api.get('/traefik-certificates/count');
          console.log('Traefik certificates count response:', traefikResponse.data);
          setStats(prev => ({
            ...prev,
            traefikSSL: traefikResponse.data.count || 0
          }));
        } catch (error) {
          console.error('Error fetching traefik certificates count:', error);
        }

        // Get system status
        try {
          console.log('Fetching system status...');
          const statusResponse = await api.get('/server-detection/status');
          console.log('System status response:', statusResponse.data);
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
      <div className="flex justify-center items-center mt-10">
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
  localStorage.setItem('lastLogin', new Date());
  
  // Get username from localStorage or user object
  const username = localStorage.getItem('username') || user?.name || 'User';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, 
          {' '}{username}!
        </h1>
        <p className="text-gray-600">
          Manage your SSL certificates and AWS resources with CertPilot's intuitive dashboard.
        </p>

        {/* Time indicator */}
        <div className="flex items-center mt-4">
          <div className="text-sm text-gray-500 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Last login: {lastLogin}
          </div>
        </div>
      </div>

      {!awsCredentialsConfigured && (
        <div className="mb-6">
          <Card variant="warning" className="border-l-4 border-amber-500">
            <div className="flex items-start">
              <div className="flex-shrink-0 mt-0.5">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-amber-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">Action Required</h3>
                <p className="text-sm text-amber-700 mt-1">
                  Please configure your AWS credentials to use all features of CertPilot.
                </p>
                <div className="mt-2">
                  <Link to="/aws-credentials">
                    <button className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-1.5 text-sm rounded transition">
                      Configure Now
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Link to="/subdomains" className="block">
          <Card className="transition-all hover:shadow-lg h-full">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 text-sm">Subdomains</span>
                <span className="block text-2xl font-semibold text-gray-800 mt-1">{stats.subdomains}</span>
              </div>
              <div className="p-2 bg-blue-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                </svg>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/certificates" className="block">
          <Card className="transition-all hover:shadow-lg h-full">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 text-sm">SSL Certificates</span>
                <span className="block text-2xl font-semibold text-gray-800 mt-1">{stats.certificates}</span>
              </div>
              <div className="p-2 bg-green-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/traefik-ssl" className="block">
          <Card className="transition-all hover:shadow-lg h-full">
            <div className="flex items-center justify-between">
              <div>
                <span className="block text-gray-500 text-sm">Traefik SSL</span>
                <span className="block text-2xl font-semibold text-gray-800 mt-1">{stats.traefikSSL}</span>
              </div>
              <div className="p-2 bg-purple-50 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
            </div>
          </Card>
        </Link>

        <Card className="h-full">
          <div className="flex items-center justify-between">
            <div>
              <span className="block text-gray-500 text-sm">System Status</span>
              <div className="flex items-center mt-1">
                <div className={`w-3 h-3 rounded-full mr-2 ${stats.systemStatus === 'active' ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                <span className="block text-lg font-semibold text-gray-800">
                  {stats.systemStatus === 'active' ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
            <div className="p-2 bg-gray-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card 
          title="AWS Credentials Management" 
          className="lg:col-span-1"
          elevation="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Configure your AWS credentials to access Route53 for DNS record management.
            </p>
            <Link to="/aws-credentials">
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center justify-center">
                <span>Configure AWS Credentials</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>
        </Card>

        <Card 
          title="Subdomain Management" 
          className="lg:col-span-1"
          elevation="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Create and configure subdomains for your websites and applications using Route53.
            </p>
            <Link to="/subdomains">
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center justify-center">
                <span>Manage Subdomains</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>
        </Card>

        <Card 
          title="SSL Certificate Management"
          className="lg:col-span-1"
          elevation="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Let's Encrypt certificates for your domains and subdomains with automated renewal.
            </p>
            <Link to="/certificates">
              <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition flex items-center justify-center">
                <span>Manage SSL Certificates</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </Link>
          </div>
        </Card>
      </div>

      <Card 
        title="Quick Start Guide"
        className="mt-8"
        variant="default"
        elevation="sm"
      >
        <div className="space-y-6">
          <p className="text-sm text-gray-600">
            Get started with CertPilot
          </p>
          <ol className="space-y-8">
            <li className="relative pl-10">
              <span className="absolute left-0 flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-sm font-medium">
                1
              </span>
              <h3 className="text-lg font-medium text-gray-800">Configure AWS Credentials</h3>
              <p className="mt-1 text-sm text-gray-600">
                Enter your AWS access key and secret to enable integration with Route53 for DNS management.
              </p>
              <Link to="/aws-credentials" className="mt-2 inline-flex items-center text-sm font-medium text-blue-600">
                Configure AWS Credentials
                <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </li>

            <li className="relative pl-10">
              <span className="absolute left-0 flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-sm font-medium">
                2
              </span>
              <h3 className="text-lg font-medium text-gray-800">Set Up Subdomains</h3>
              <p className="mt-1 text-sm text-gray-600">
                Create and configure subdomains for your websites and applications using Route53.
              </p>
              <Link to="/subdomains" className="mt-2 inline-flex items-center text-sm font-medium text-blue-600">
                Manage Subdomains
                <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </li>

            <li className="relative pl-10">
              <span className="absolute left-0 flex items-center justify-center w-8 h-8 bg-blue-600 rounded-full text-white text-sm font-medium">
                3
              </span>
              <h3 className="text-lg font-medium text-gray-800">Issue SSL Certificates</h3>
              <p className="mt-1 text-sm text-gray-600">
                Issue free Let's Encrypt SSL certificates for your domains and subdomains.
              </p>
              <Link to="/certificates" className="mt-2 inline-flex items-center text-sm font-medium text-blue-600">
                Manage SSL Certificates
                <svg className="w-4 h-4 ml-1" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Link>
            </li>
          </ol>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard; 