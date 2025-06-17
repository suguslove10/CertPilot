import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';

const CloudflareIntegration = () => {
  const [loading, setLoading] = useState(true);
  const [credentialsConfigured, setCredentialsConfigured] = useState(false);
  const [credentialStatus, setCredentialStatus] = useState('');
  const [apiToken, setApiToken] = useState('');
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState('');
  const [dnsRecords, setDnsRecords] = useState([]);
  const [showCredentialsForm, setShowCredentialsForm] = useState(false);
  const [savingCredentials, setSavingCredentials] = useState(false);
  const [loadingZones, setLoadingZones] = useState(false);
  const [loadingRecords, setLoadingRecords] = useState(false);
  const [error, setError] = useState(null);

  // Check if Cloudflare credentials are configured
  useEffect(() => {
    const checkCredentials = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cloudflare/credentials');
        setCredentialsConfigured(response.data.configured);
        if (response.data.configured) {
          setCredentialStatus('Token-based authentication is configured');
          fetchZones();
        }
      } catch (error) {
        console.error('Error checking Cloudflare credentials:', error);
        setError('Failed to check Cloudflare credentials status');
      } finally {
        setLoading(false);
      }
    };

    checkCredentials();
  }, []);

  // Fetch Cloudflare zones (domains)
  const fetchZones = async () => {
    try {
      setLoadingZones(true);
      setError(null);
      console.log('Fetching Cloudflare zones...');
      const response = await axios.get('/api/cloudflare/zones');
      
      console.log('Cloudflare zones response:', response.data);
      
      if (response.data.error && 
          response.data.error[0] && 
          response.data.error[0].message === "Invalid access token") {
        
        setError('Cloudflare API token is invalid. Please update it in the backend.env file.');
        setZones([]);
      } else if (response.data && Array.isArray(response.data.zones)) {
        setZones(response.data.zones || []);
        setError(null);
      } else if (response.data && response.data.success === false) {
        // Handle other API errors
        setError(`Cloudflare API error: ${response.data.message || 'Unknown error'}`);
        setZones([]);
      } else {
        // In case we get an unexpected response format
        console.warn('Unexpected Cloudflare API response format:', response.data);
        if (response.data && response.data.errors && response.data.errors.length > 0) {
          // Format Cloudflare API errors nicely
          const errorMessages = response.data.errors.map(err => `${err.message} (Code: ${err.code})`).join(', ');
          setError(`Cloudflare API errors: ${errorMessages}`);
        } else {
          setError('Failed to fetch Cloudflare zones. Check console for details.');
        }
        setZones([]);
      }
    } catch (error) {
      console.error('Error fetching Cloudflare zones:', error);
      if (error.response && error.response.data) {
        console.error('Error response data:', error.response.data);
      }
      setError(`Failed to fetch Cloudflare zones: ${error.message}`);
      setZones([]);
    } finally {
      setLoadingZones(false);
    }
  };

  // Fetch DNS records for a zone
  const fetchDnsRecords = async (zoneId) => {
    if (!zoneId) return;
    
    try {
      setLoadingRecords(true);
      const response = await axios.get(`/api/cloudflare/zones/${zoneId}/dns-records`);
      setDnsRecords(response.data.records || []);
    } catch (error) {
      console.error('Error fetching DNS records:', error);
      toast.error('Failed to fetch DNS records');
    } finally {
      setLoadingRecords(false);
    }
  };

  // Handle zone selection change
  const handleZoneChange = (e) => {
    const zoneId = e.target.value;
    setSelectedZone(zoneId);
    
    if (zoneId) {
      fetchDnsRecords(zoneId);
    } else {
      setDnsRecords([]);
    }
  };

  // Configuration Message
  const renderConfigMessage = () => {
    return (
      <div className="mb-6">
        <Alert type={credentialsConfigured ? (error ? "warning" : "success") : "warning"}>
          <p>
            <span className="font-semibold">
              {credentialsConfigured 
                ? (error 
                  ? "Cloudflare API token issue" 
                  : "Cloudflare is connected!") 
                : "Cloudflare is not configured."}
            </span>
            <br />
            {credentialsConfigured 
              ? (error 
                ? `${error}` 
                : "Using API token authentication") 
              : "Configure your Cloudflare API token in the backend.env file to manage DNS records and SSL certificates."}
          </p>
          {!credentialsConfigured && (
            <div className="mt-3">
              <p className="text-sm mb-2">Add the following to your backend.env file:</p>
              <code className="bg-gray-200 p-2 rounded block text-sm">
                CLOUDFLARE_API_TOKEN=your_api_token_here
              </code>
            </div>
          )}
          {credentialsConfigured && error && (
            <div className="mt-3">
              <p className="text-sm mb-2">
                The token may be valid but might not have the correct permissions. Ensure your token has the following permissions:
              </p>
              <ul className="list-disc ml-5 text-sm">
                <li>Zone:Zone:Read</li>
                <li>Zone:DNS:Read</li>
                <li>Zone:DNS:Edit (if you need to modify DNS records)</li>
              </ul>
              <p className="text-sm mt-2">
                You can create a new token at: <a href="https://dash.cloudflare.com/profile/api-tokens" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Cloudflare API Tokens</a>
              </p>
            </div>
          )}
          <Button 
            variant="primary" 
            className="mt-2"
            onClick={fetchZones}
            disabled={loadingZones}
          >
            {loadingZones ? "Testing Connection..." : "Test Connection"}
          </Button>
        </Alert>
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="p-4">
          <h2 className="text-xl font-semibold mb-4">Cloudflare Integration</h2>
          <p>Loading...</p>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <div className="p-4">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Cloudflare Integration</h2>
        </div>
        
        {/* Credentials Status */}
        {renderConfigMessage()}
        
        {/* Zones */}
        {credentialsConfigured && !error && (
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Your Cloudflare Zones</h3>
            
            {loadingZones ? (
              <p>Loading zones...</p>
            ) : zones.length === 0 ? (
              <Alert type="info">
                <p>No Cloudflare zones found. Make sure you have domains added to your Cloudflare account.</p>
              </Alert>
            ) : (
              <div>
                <div className="mb-4">
                  <label htmlFor="zoneSelect" className="block mb-2 font-medium">
                    Select a Zone
                  </label>
                  <select
                    id="zoneSelect"
                    className="w-full p-2 border border-gray-300 rounded-md"
                    value={selectedZone}
                    onChange={handleZoneChange}
                  >
                    <option value="">-- Select a Zone --</option>
                    {zones.map((zone) => (
                      <option key={zone.id} value={zone.id}>
                        {zone.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <Button
                  variant="secondary"
                  onClick={fetchZones}
                  disabled={loadingZones}
                >
                  Refresh Zones
                </Button>
              </div>
            )}
          </div>
        )}
        
        {/* DNS Records */}
        {selectedZone && (
          <div className="mt-8">
            <h3 className="text-lg font-medium mb-4">DNS Records</h3>
            
            {loadingRecords ? (
              <p>Loading DNS records...</p>
            ) : dnsRecords.length === 0 ? (
              <Alert type="info">
                <p>No DNS records found for this zone.</p>
              </Alert>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 border text-left">Type</th>
                      <th className="p-2 border text-left">Name</th>
                      <th className="p-2 border text-left">Content</th>
                      <th className="p-2 border text-left">TTL</th>
                      <th className="p-2 border text-left">Proxied</th>
                      <th className="p-2 border text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsRecords.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="p-2 border">{record.type}</td>
                        <td className="p-2 border">{record.name}</td>
                        <td className="p-2 border">{record.content}</td>
                        <td className="p-2 border">{record.ttl === 1 ? 'Auto' : record.ttl}</td>
                        <td className="p-2 border">{record.proxied ? 'Yes' : 'No'}</td>
                        <td className="p-2 border">
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRecord(selectedZone, record.id)}
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CloudflareIntegration; 