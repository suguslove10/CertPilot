import { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Card, Alert } from '../ui';
import './AwsIntegration.css'; // Reuse AWS styles

const CloudflareIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [zones, setZones] = useState([]);
  const [selectedZone, setSelectedZone] = useState(null);
  const [dnsRecords, setDnsRecords] = useState([]);
  const [isConfigured, setIsConfigured] = useState(false);

  // Check Cloudflare configuration on component mount
  useEffect(() => {
    checkCloudflareConfig();
  }, []);

  // Check if Cloudflare is configured via environment variables
  const checkCloudflareConfig = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/cloudflare/zones');
      
      // Even if we get an error response with "Invalid access token", 
      // we still consider it configured since the token exists but might be invalid
      if (response.data.error && 
          response.data.error[0] && 
          response.data.error[0].message === "Invalid access token") {
        
        setIsConfigured(true);
        setZones([]);
        setError('Cloudflare API token is invalid. Please update it in the backend.env file.');
      } else if (response.data && !response.data.error) {
        setIsConfigured(true);
        setZones(response.data.zones || []);
        setError(null);
      } else {
        setIsConfigured(false);
        setError('Cloudflare is not configured or has invalid credentials');
      }
    } catch (error) {
      setIsConfigured(false);
      setError('Failed to connect to Cloudflare. Check environment variables.');
      console.error('Error checking Cloudflare configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch DNS records for a zone
  const fetchDnsRecords = async (zoneId) => {
    try {
      setLoading(true);
      setError(null);

      const response = await axios.get(`/api/cloudflare/zones/${zoneId}/dns`);

      if (response.data.success) {
        setDnsRecords(response.data.records);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to fetch DNS records');
      console.error('Error fetching DNS records:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle zone selection
  const handleZoneSelect = (zone) => {
    setSelectedZone(zone);
    fetchDnsRecords(zone.id);
  };

  // Render environment configuration message
  const renderEnvironmentMessage = () => (
    <Card title="Cloudflare Integration">
      <div className="alert alert-info">
        <p>
          <strong>Cloudflare is configured via environment variables.</strong>
        </p>
        <p>
          The Cloudflare API token is set in the backend environment configuration. 
          To change this, update the <code>CLOUDFLARE_API_TOKEN</code> variable in your backend.env file.
        </p>
      </div>
      
      {error && (
        <Alert variant="danger" onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      <div className="form-actions">
        <Button onClick={checkCloudflareConfig} disabled={loading}>
          {loading ? 'Checking...' : 'Test Connection'}
        </Button>
      </div>
    </Card>
  );

  // Render Cloudflare zones
  const renderZones = () => (
    <Card title="Cloudflare Zones">
      <div className="zones-list">
        {zones.length === 0 ? (
          <p>No zones found in your Cloudflare account.</p>
        ) : (
          <ul className="list-group">
            {zones.map((zone) => (
              <li
                key={zone.id}
                className={`list-group-item ${selectedZone?.id === zone.id ? 'active' : ''}`}
                onClick={() => handleZoneSelect(zone)}
              >
                <strong>{zone.name}</strong>
                <small>{zone.status}</small>
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="form-actions">
        <Button onClick={checkCloudflareConfig} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Zones'}
        </Button>
      </div>
    </Card>
  );

  // Render DNS records for selected zone
  const renderDnsRecords = () => (
    <Card title={`DNS Records for ${selectedZone?.name}`}>
      <div className="dns-records-list">
        {dnsRecords.length === 0 ? (
          <p>No DNS records found for this zone.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Name</th>
                <th>Content</th>
                <th>TTL</th>
                <th>Proxied</th>
              </tr>
            </thead>
            <tbody>
              {dnsRecords.map((record) => (
                <tr key={record.id}>
                  <td>{record.type}</td>
                  <td>{record.name}</td>
                  <td>{record.content}</td>
                  <td>{record.ttl === 1 ? 'Auto' : record.ttl}</td>
                  <td>{record.proxied ? 'Yes' : 'No'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      <div className="form-actions">
        <Button onClick={() => fetchDnsRecords(selectedZone.id)} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh Records'}
        </Button>
      </div>
    </Card>
  );

  return (
    <div className="integration-container">
      <h2>Cloudflare Integration</h2>
      
      {successMessage && <Alert variant="success" onClose={() => setSuccessMessage(null)}>{successMessage}</Alert>}

      {renderEnvironmentMessage()}
      
      {isConfigured && (
        <div className="integration-dashboard">
          <div className="row">
            <div className="col-md-4">
              {renderZones()}
            </div>
            <div className="col-md-8">
              {selectedZone && renderDnsRecords()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CloudflareIntegration; 