import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';
import { Card, StatusBadge, Spinner, Button } from '../components';

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
      <div className="flex justify-center items-center min-h-[300px]">
        <Spinner size="lg" variant="primary" showLabel centered />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="page-title">Welcome, {user?.name}!</h1>
        <p className="text-secondary-600 max-w-3xl">
          Manage your SSL certificates and AWS resources with CertPilot's intuitive dashboard. 
          Get started by configuring your AWS credentials below.
        </p>
      </div>
      
      <Card 
        title="System Status" 
        subtitle="Current configuration status"
        className="mb-8"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
        borderPosition="top"
      >
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 bg-secondary-50 rounded-lg">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${awsCredentialsExist ? 'bg-success-500' : 'bg-warning-500'}`}></div>
            <span className="text-sm font-medium">AWS Configuration Status:</span>
          </div>
          <StatusBadge 
            status={awsCredentialsExist ? "Configured" : "Not Configured"} 
            size="md"
            pulsate={!awsCredentialsExist}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        <Card 
          title="AWS Credentials" 
          subtitle="Configure your AWS credentials"
          variant={awsCredentialsExist ? "success" : "warning"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          }
          borderPosition="left"
        >
          <p className="text-secondary-600 mb-6">
            {awsCredentialsExist
              ? 'Your AWS credentials are configured and active. You can update them anytime.'
              : 'Configure your AWS credentials to access all CertPilot features.'}
          </p>
          
          <div className="flex items-center justify-between">
            <StatusBadge 
              status={awsCredentialsExist ? "Active" : "Required"} 
              size="sm"
            />
            <Button
              variant={awsCredentialsExist ? "outline" : "primary"}
              size="sm"
              rightIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
              onClick={() => window.location.href = '/aws-credentials'}
            >
              {awsCredentialsExist ? 'Update' : 'Configure'}
            </Button>
          </div>
        </Card>

        <Card 
          title="Subdomain Management" 
          subtitle="Route53 subdomains"
          variant={awsCredentialsExist ? "default" : "secondary"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
            </svg>
          }
          borderPosition="left"
        >
          <p className="text-secondary-600 mb-6">
            {awsCredentialsExist
              ? 'Create and manage subdomains using Route53 for your SSL certificates.'
              : 'Configure your AWS credentials first to manage subdomains.'}
          </p>
          
          <div className="flex items-center justify-between">
            <StatusBadge 
              status={awsCredentialsExist ? "Available" : "Unavailable"} 
              size="sm"
            />
            <Button
              variant={awsCredentialsExist ? "primary" : "light"}
              size="sm"
              disabled={!awsCredentialsExist}
              rightIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
              onClick={() => awsCredentialsExist && (window.location.href = '/subdomains')}
            >
              Manage
            </Button>
          </div>
        </Card>

        <Card 
          title="SSL Certificates" 
          subtitle="Let's Encrypt SSL certificates"
          variant={awsCredentialsExist ? "default" : "secondary"}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          }
          borderPosition="left"
        >
          <p className="text-secondary-600 mb-6">
            {awsCredentialsExist
              ? 'Issue and install SSL certificates for your domains and servers.'
              : 'Configure your AWS credentials first to manage SSL certificates.'}
          </p>
          
          <div className="flex items-center justify-between">
            <StatusBadge 
              status={awsCredentialsExist ? "Available" : "Unavailable"} 
              size="sm"
            />
            <Button
              variant={awsCredentialsExist ? "primary" : "light"}
              size="sm"
              disabled={!awsCredentialsExist}
              rightIcon={
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              }
              onClick={() => awsCredentialsExist && (window.location.href = '/certificates')}
            >
              Manage
            </Button>
          </div>
        </Card>
      </div>
      
      <Card 
        title="Quick Start Guide" 
        subtitle="Get started with CertPilot"
        className="bg-gradient-to-br from-indigo-50 to-white"
        borderPosition="none"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              1
            </div>
            <div>
              <h3 className="font-medium text-secondary-900">Configure AWS Credentials</h3>
              <p className="text-secondary-600 text-sm">
                Set up your AWS access key and secret to allow CertPilot to manage resources.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              2
            </div>
            <div>
              <h3 className="font-medium text-secondary-900">Create Subdomains</h3>
              <p className="text-secondary-600 text-sm">
                Set up and manage subdomains through the Route53 integration.
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center">
              3
            </div>
            <div>
              <h3 className="font-medium text-secondary-900">Generate SSL Certificates</h3>
              <p className="text-secondary-600 text-sm">
                Issue Let's Encrypt SSL certificates for your domains and install them.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard; 