import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import axios from 'axios';

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
      <div className="text-center mt-5">
        <div className="spinner-border" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="container mt-4">
      <div className="row">
        <div className="col-md-12 mb-4">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title">Welcome, {user?.name}!</h2>
              <p className="card-text">
                This is your CertPilot dashboard where you can manage your SSL certificates
                and AWS resources.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="row">
        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title">AWS Credentials</h3>
              <p className="card-text">
                {awsCredentialsExist
                  ? 'Your AWS credentials are configured.'
                  : 'You need to configure your AWS credentials to use CertPilot.'}
              </p>
              <Link
                to="/aws-credentials"
                className={`btn ${
                  awsCredentialsExist ? 'btn-secondary' : 'btn-primary'
                }`}
              >
                {awsCredentialsExist ? 'Update Credentials' : 'Configure Credentials'}
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title">Subdomain Management</h3>
              <p className="card-text">
                {awsCredentialsExist
                  ? 'Create and manage subdomains using Route53.'
                  : 'Configure your AWS credentials first to manage subdomains.'}
              </p>
              <Link
                to="/subdomains"
                className="btn btn-primary"
                disabled={!awsCredentialsExist}
              >
                Manage Subdomains
              </Link>
            </div>
          </div>
        </div>

        <div className="col-md-4 mb-4">
          <div className="card h-100">
            <div className="card-body">
              <h3 className="card-title">SSL Certificates</h3>
              <p className="card-text">
                {awsCredentialsExist
                  ? 'Manage your SSL certificates and domains.'
                  : 'Configure your AWS credentials first to manage SSL certificates.'}
              </p>
              <button
                className="btn btn-primary"
                disabled={!awsCredentialsExist}
              >
                Manage Certificates
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 