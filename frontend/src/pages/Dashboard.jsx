import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import Card from '../components/Card';

// Create a base URL for API requests
const API_URL = import.meta.env.VITE_API_URL || '/api';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [awsCredentialsExist, setAwsCredentialsExist] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAwsCredentials = async () => {
      try {
        await axios.get(`${API_URL}/aws-credentials`);
        setAwsCredentialsExist(true);
      } catch (error) {
        setAwsCredentialsExist(false);
      } finally {
        setLoading(false);
      }
    };

    checkAwsCredentials();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
      <h1 className="page-title">Welcome, {user?.name}!</h1>
      
      <Card 
        title="Overview" 
        className="mb-8"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      >
        <p className="text-gray-600">
          This is your CertPilot dashboard where you can manage your SSL certificates and AWS resources.
        </p>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card 
          title="AWS Credentials" 
          variant={awsCredentialsExist ? "success" : "warning"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          actions={
            <Link
              to="/aws-credentials"
              className={`btn ${awsCredentialsExist ? 'bg-blue-600 hover:bg-blue-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white px-4 py-2 rounded-md transition-colors`}
            >
              {awsCredentialsExist ? 'Update Credentials' : 'Configure Credentials'}
            </Link>
          }
        >
          <p className="text-gray-600 mb-4">
            {awsCredentialsExist
              ? 'Your AWS credentials are configured and active.'
              : 'You need to configure your AWS credentials to use CertPilot features.'}
          </p>
          
          <div className="flex items-center">
            <span className={`inline-block w-3 h-3 rounded-full mr-2 ${awsCredentialsExist ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
            <span className="text-sm font-medium">{awsCredentialsExist ? 'Configured' : 'Not Configured'}</span>
          </div>
        </Card>

        <Card 
          title="Subdomain Management" 
          variant={awsCredentialsExist ? "default" : "info"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
          actions={
            <Link
              to="/subdomains"
              className={`btn ${!awsCredentialsExist ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md transition-colors`}
              onClick={e => !awsCredentialsExist && e.preventDefault()}
            >
              Manage Subdomains
            </Link>
          }
        >
          <p className="text-gray-600 mb-4">
            {awsCredentialsExist
              ? 'Create and manage subdomains using Route53 for your SSL certificates.'
              : 'Configure your AWS credentials first to manage subdomains.'}
          </p>
        </Card>

        <Card 
          title="SSL Certificates" 
          variant={awsCredentialsExist ? "default" : "info"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          actions={
            <Link
              to="/certificates"
              className={`btn ${!awsCredentialsExist ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'} text-white px-4 py-2 rounded-md transition-colors`}
              onClick={e => !awsCredentialsExist && e.preventDefault()}
            >
              Manage Certificates
            </Link>
          }
        >
          <p className="text-gray-600 mb-4">
            {awsCredentialsExist
              ? 'Issue and install SSL certificates for your domains and servers.'
              : 'Configure your AWS credentials first to manage SSL certificates.'}
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard; 