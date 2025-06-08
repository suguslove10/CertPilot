import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, Button, Spinner } from '../components';
import api from '../utils/api';

const AwsCredentials = () => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [isSystemLevel, setIsSystemLevel] = useState(false);
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
        console.log('Fetching credentials from API');
        const res = await api.get('/aws-credentials');
        console.log('Credentials response:', res.data);
        setCredentialsData(res.data);
        setHasCredentials(true);
        setIsSystemLevel(res.data.isSystemLevel || false);
        
        // Pre-fill the form with existing data
        setValue('accessKeyId', res.data.accessKeyId);
        setValue('region', res.data.region);
        
        // Clear any previous error messages
        setMessage({ type: '', text: '' });
      } catch (error) {
        console.error('Error fetching credentials:', error);
        if (error.response?.status !== 404) {
          setMessage({
            type: 'danger',
            text: error.response?.data?.message || 'Error fetching AWS credentials'
          });
        }
        setHasCredentials(false);
        setIsSystemLevel(false);
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
      console.log('Submitting credentials to API');
      const res = await api.post('/aws-credentials', data);
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
      console.error('Error saving credentials:', error);
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
      const res = await api.post('/aws-credentials/verify', data);
      setMessage({
        type: 'success',
        text: res.data.message
      });
    } catch (error) {
      console.error('Error verifying credentials:', error);
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

    if (isSystemLevel) {
      setMessage({
        type: 'warning',
        text: 'Cannot delete system-level AWS credentials. Please edit backend.env file directly.'
      });
      return;
    }

    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      await api.delete('/aws-credentials');
      setHasCredentials(false);
      setCredentialsData(null);
      reset({
        accessKeyId: '',
        secretAccessKey: '',
        region: 'ap-south-1'
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
      <div className="flex justify-center items-center mt-10">
        <Spinner size="lg" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card 
        title={hasCredentials ? 'Update AWS Credentials' : 'Add AWS Credentials'}
        variant="default"
        elevation="md"
        className="mb-6"
      >
        {message.text && (
          <div className={`mb-4 p-4 rounded-md ${
            message.type === 'success' ? 'bg-green-50 text-green-800 border border-green-200' :
            message.type === 'danger' ? 'bg-red-50 text-red-800 border border-red-200' : 
            'bg-amber-50 text-amber-800 border border-amber-200'
          }`}>
            <p>{message.text}</p>
          </div>
        )}
        
        {hasCredentials && (
          <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-md">
            <h3 className="text-lg font-medium text-gray-800 mb-2">Current AWS Configuration</h3>
            <div className="space-y-2">
              <p className="flex justify-between">
                <span className="font-medium">Access Key ID:</span> 
                <span className="text-gray-700">{credentialsData?.accessKeyId}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Secret Access Key:</span> 
                <span className="text-gray-700">{credentialsData?.secretAccessKey}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Region:</span> 
                <span className="text-gray-700">{credentialsData?.region}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-medium">Last Updated:</span> 
                <span className="text-gray-700">{new Date(credentialsData?.updatedAt).toLocaleString()}</span>
              </p>
              {isSystemLevel && (
                <p className="mt-2 text-sm bg-blue-50 text-blue-800 p-2 rounded">
                  These are system-level credentials configured in backend.env file. To modify them, edit the backend.env file directly.
                </p>
              )}
            </div>
          </div>
        )}
        
        {!isSystemLevel && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="mb-4">
              <label htmlFor="accessKeyId" className="block text-sm font-medium text-gray-700 mb-1">AWS Access Key ID</label>
              <input
                type="text"
                className={`w-full px-3 py-2 border rounded-md shadow-sm ${errors.accessKeyId ? 'border-red-500' : 'border-gray-300'}`}
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
                <p className="text-red-500 text-xs mt-1">{errors.accessKeyId.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Your AWS Access Key ID from IAM console
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="secretAccessKey" className="block text-sm font-medium text-gray-700 mb-1">AWS Secret Access Key</label>
              <input
                type="password"
                className={`w-full px-3 py-2 border rounded-md shadow-sm ${errors.secretAccessKey ? 'border-red-500' : 'border-gray-300'}`}
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
                <p className="text-red-500 text-xs mt-1">{errors.secretAccessKey.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Your AWS Secret Access Key from IAM console
              </p>
            </div>
            
            <div className="mb-6">
              <label htmlFor="region" className="block text-sm font-medium text-gray-700 mb-1">AWS Region</label>
              <select
                className={`w-full px-3 py-2 border rounded-md shadow-sm ${errors.region ? 'border-red-500' : 'border-gray-300'}`}
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
                <p className="text-red-500 text-xs mt-1">{errors.region.message}</p>
              )}
            </div>
            
            <div className="flex justify-between">
              <Button
                type="button"
                variant="light"
                onClick={handleSubmit(verifyCredentials)}
                disabled={verifying || submitting}
                className="mr-2"
              >
                {verifying ? 'Verifying...' : 'Verify Credentials'}
              </Button>
              
              <div className="flex space-x-2">
                {hasCredentials && !isSystemLevel && (
                  <Button
                    type="button"
                    variant="danger"
                    onClick={deleteCredentials}
                    disabled={submitting}
                  >
                    Delete Credentials
                  </Button>
                )}
                
                <Button
                  type="submit"
                  variant="primary"
                  disabled={submitting || isSystemLevel}
                >
                  {submitting ? 'Saving...' : (hasCredentials ? 'Update Credentials' : 'Save Credentials')}
                </Button>
              </div>
            </div>
          </form>
        )}
        
        {isSystemLevel && (
          <div className="text-center py-4">
            <p className="text-sm text-gray-700 mb-4">
              These AWS credentials are configured at the system level. To modify them, please edit the <code className="bg-gray-100 px-1 py-0.5 rounded">backend.env</code> file directly.
            </p>
            <div className="bg-gray-100 p-4 rounded-md text-left max-w-lg mx-auto">
              <pre className="text-xs text-gray-800">
{`# Your AWS Access Key ID
AWS_ACCESS_KEY_ID="${credentialsData?.accessKeyId}"

# Your AWS Secret Access Key 
AWS_SECRET_ACCESS_KEY="••••••••••••••••••••••"

# AWS Region where your Route53 is configured
AWS_REGION="${credentialsData?.region}"
`}
              </pre>
            </div>
          </div>
        )}
      </Card>
      
      <Card 
        title="Required AWS Permissions"
        variant="info"
        elevation="sm"
      >
        <div className="space-y-2">
          <p className="text-sm text-gray-600 mb-2">
            Your AWS credentials must have the following permissions:
          </p>
          <ul className="list-disc pl-5 text-sm text-gray-700">
            <li>Route53 access for DNS record management</li>
            <li>Ability to list and modify hosted zones</li>
          </ul>
          <p className="text-sm text-gray-600 mt-4">
            We recommend creating a dedicated IAM user with only the necessary permissions for security best practices.
          </p>
        </div>
      </Card>
    </div>
  );
};

export default AwsCredentials; 