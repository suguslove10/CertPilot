import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import axios from 'axios';

// Create a base URL for API requests
const API_URL = import.meta.env.VITE_API_URL || '/api';

const AwsCredentials = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [credentialsData, setCredentialsData] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    setValue
  } = useForm();

  // Fetch existing credentials on component mount
  useEffect(() => {
    const fetchCredentials = async () => {
      try {
        const res = await axios.get(`${API_URL}/aws-credentials`);
        setCredentialsData(res.data);
        setHasCredentials(true);
        
        // Pre-fill the form with existing data
        setValue('accessKeyId', res.data.accessKeyId);
        setValue('region', res.data.region);
        
        setMessage({ type: '', text: '' });
      } catch (error) {
        if (error.response?.status !== 404) {
          setMessage({
            type: 'danger',
            text: error.response?.data?.message || 'Error fetching AWS credentials'
          });
        }
        setHasCredentials(false);
      } finally {
        setLoading(false);
      }
    };

    fetchCredentials();
  }, [setValue]);

  // Handle form submission
  const onSubmit = async (data) => {
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post(`${API_URL}/aws-credentials`, data);
      setHasCredentials(true);
      setCredentialsData({
        accessKeyId: data.accessKeyId,
        secretAccessKey: '••••••••••••••••••••••',
        region: data.region,
        updatedAt: new Date()
      });
      
      setMessage({
        type: 'success',
        text: res.data.message
      });
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Error saving AWS credentials'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Verify credentials without saving
  const verifyCredentials = async (data) => {
    setVerifying(true);
    setMessage({ type: '', text: '' });

    try {
      const res = await axios.post(`${API_URL}/aws-credentials/verify`, data);
      setMessage({
        type: 'success',
        text: res.data.message
      });
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.error || error.response?.data?.message || 'Error verifying AWS credentials'
      });
    } finally {
      setVerifying(false);
    }
  };

  // Handle delete credentials
  const deleteCredentials = async () => {
    if (!window.confirm('Are you sure you want to delete your AWS credentials?')) {
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await axios.delete(`${API_URL}/aws-credentials`);
      setHasCredentials(false);
      setCredentialsData(null);
      reset({
        accessKeyId: '',
        secretAccessKey: '',
        region: 'us-east-1'
      });
      
      setMessage({
        type: 'success',
        text: 'AWS credentials deleted successfully'
      });
    } catch (error) {
      setMessage({
        type: 'danger',
        text: error.response?.data?.message || 'Error deleting AWS credentials'
      });
    } finally {
      setSubmitting(false);
    }
  };

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
      <div className="row justify-content-center">
        <div className="col-md-8">
          <div className="card">
            <div className="card-body">
              <h2 className="card-title text-center mb-4">
                {hasCredentials ? 'Update AWS Credentials' : 'Add AWS Credentials'}
              </h2>
              
              {message.text && (
                <div className={`alert alert-${message.type}`}>{message.text}</div>
              )}
              
              {hasCredentials && (
                <div className="alert alert-info mb-4">
                  <h5>Current AWS Configuration</h5>
                  <p><strong>Access Key ID:</strong> {credentialsData?.accessKeyId}</p>
                  <p><strong>Secret Access Key:</strong> {credentialsData?.secretAccessKey}</p>
                  <p><strong>Region:</strong> {credentialsData?.region}</p>
                  <p><strong>Last Updated:</strong> {new Date(credentialsData?.updatedAt).toLocaleString()}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="form-group mb-3">
                  <label htmlFor="accessKeyId">AWS Access Key ID</label>
                  <input
                    type="text"
                    className={`form-control ${errors.accessKeyId ? 'is-invalid' : ''}`}
                    id="accessKeyId"
                    {...register('accessKeyId', { 
                      required: 'Access Key ID is required',
                      minLength: {
                        value: 16,
                        message: 'Access Key ID should be at least 16 characters'
                      }
                    })}
                  />
                  {errors.accessKeyId && (
                    <div className="invalid-feedback">{errors.accessKeyId.message}</div>
                  )}
                  <small className="form-text text-muted">
                    Your AWS Access Key ID from IAM console
                  </small>
                </div>
                
                <div className="form-group mb-3">
                  <label htmlFor="secretAccessKey">AWS Secret Access Key</label>
                  <input
                    type="password"
                    className={`form-control ${errors.secretAccessKey ? 'is-invalid' : ''}`}
                    id="secretAccessKey"
                    {...register('secretAccessKey', { 
                      required: 'Secret Access Key is required',
                      minLength: {
                        value: 30,
                        message: 'Secret Access Key should be at least 30 characters'
                      }
                    })}
                  />
                  {errors.secretAccessKey && (
                    <div className="invalid-feedback">{errors.secretAccessKey.message}</div>
                  )}
                  <small className="form-text text-muted">
                    Your AWS Secret Access Key from IAM console
                  </small>
                </div>
                
                <div className="form-group mb-4">
                  <label htmlFor="region">AWS Region</label>
                  <select
                    className={`form-control ${errors.region ? 'is-invalid' : ''}`}
                    id="region"
                    {...register('region', { required: 'Region is required' })}
                  >
                    <option value="us-east-1">US East (N. Virginia)</option>
                    <option value="us-east-2">US East (Ohio)</option>
                    <option value="us-west-1">US West (N. California)</option>
                    <option value="us-west-2">US West (Oregon)</option>
                    <option value="ca-central-1">Canada (Central)</option>
                    <option value="eu-west-1">EU (Ireland)</option>
                    <option value="eu-central-1">EU (Frankfurt)</option>
                    <option value="eu-west-2">EU (London)</option>
                    <option value="eu-west-3">EU (Paris)</option>
                    <option value="eu-north-1">EU (Stockholm)</option>
                    <option value="ap-northeast-1">Asia Pacific (Tokyo)</option>
                    <option value="ap-northeast-2">Asia Pacific (Seoul)</option>
                    <option value="ap-southeast-1">Asia Pacific (Singapore)</option>
                    <option value="ap-southeast-2">Asia Pacific (Sydney)</option>
                    <option value="ap-south-1">Asia Pacific (Mumbai)</option>
                    <option value="sa-east-1">South America (São Paulo)</option>
                  </select>
                  {errors.region && (
                    <div className="invalid-feedback">{errors.region.message}</div>
                  )}
                </div>
                
                <div className="d-flex justify-content-between">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleSubmit(verifyCredentials)}
                    disabled={verifying || submitting}
                  >
                    {verifying ? 'Verifying...' : 'Verify Credentials'}
                  </button>
                  
                  <div>
                    {hasCredentials && (
                      <button
                        type="button"
                        className="btn btn-danger me-2"
                        onClick={deleteCredentials}
                        disabled={submitting}
                      >
                        Delete Credentials
                      </button>
                    )}
                    
                    <button
                      type="submit"
                      className="btn btn-primary"
                      disabled={submitting}
                    >
                      {submitting ? 'Saving...' : hasCredentials ? 'Update Credentials' : 'Save Credentials'}
                    </button>
                  </div>
                </div>
              </form>
              
              <div className="mt-4">
                <h4>Required AWS Permissions</h4>
                <p>
                  Your AWS credentials must have the following permissions:
                </p>
                <ul>
                  <li>Route53 access for DNS record management</li>
                  <li>Ability to list and modify hosted zones</li>
                </ul>
                <p>
                  We recommend creating a dedicated IAM user with only the necessary permissions
                  for security best practices.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AwsCredentials; 