import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import axios from 'axios';
import Card from './ui/Card';
import Button from './ui/Button';
import Input from './ui/Input';
import Alert from './ui/Alert';
import Modal from './Modal';

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
  const [showAddRecordModal, setShowAddRecordModal] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [editingRecord, setEditingRecord] = useState(null);
  const [newRecord, setNewRecord] = useState({
    type: 'A',
    name: '',
    content: '',
    ttl: 1, // Auto TTL
    proxied: false,
    priority: 10,
    port: 80,
    service: '',
    protocol: '_tcp'
  });
  const [certificateData, setCertificateData] = useState({
    domain: '',
    subdomains: '',
    validationMethod: 'dns'
  });
  const [creatingCertificate, setCreatingCertificate] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);

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

  // Handle record input change
  const handleRecordChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewRecord(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle certificate input change
  const handleCertificateChange = (e) => {
    const { name, value } = e.target;
    setCertificateData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Add or edit DNS record
  const handleSubmitRecord = async (e) => {
    e.preventDefault();
    
    try {
      if (editingRecord) {
        // Update existing record
        await axios.put(`/api/cloudflare/zones/${selectedZone}/dns-records/${editingRecord.id}`, newRecord);
        toast.success('DNS record updated successfully');
      } else {
        // Create new record
        await axios.post(`/api/cloudflare/zones/${selectedZone}/dns-records`, newRecord);
        toast.success('DNS record created successfully');
      }
      
      // Reset form and refresh records
      setNewRecord({
        type: 'A',
        name: '',
        content: '',
        ttl: 1,
        proxied: false,
        priority: 10,
        port: 80,
        service: '',
        protocol: '_tcp'
      });
      setEditingRecord(null);
      setShowAddRecordModal(false);
      fetchDnsRecords(selectedZone);
    } catch (error) {
      console.error('Error saving DNS record:', error);
      toast.error(`Failed to save DNS record: ${error.response?.data?.message || error.message}`);
    }
  };

  // Delete DNS record
  const handleDeleteRecord = async (recordId) => {
    if (!window.confirm('Are you sure you want to delete this DNS record?')) return;
    
    try {
      await axios.delete(`/api/cloudflare/zones/${selectedZone}/dns-records/${recordId}`);
      toast.success('DNS record deleted successfully');
      fetchDnsRecords(selectedZone);
    } catch (error) {
      console.error('Error deleting DNS record:', error);
      toast.error(`Failed to delete DNS record: ${error.response?.data?.message || error.message}`);
    }
  };

  // Edit DNS record
  const handleEditRecord = (record) => {
    setEditingRecord(record);
    setNewRecord({
      type: record.type,
      name: record.name,
      content: record.content,
      ttl: record.ttl,
      proxied: record.proxied,
      priority: record.priority || 10,
      port: record.port || 80,
      service: record.service || '',
      protocol: record.protocol || '_tcp'
    });
    setShowAddRecordModal(true);
  };

  // Request certificate for domain
  const handleCreateCertificate = async (e) => {
    e.preventDefault();
    
    try {
      setCreatingCertificate(true);
      
      // Find the zone details for the selected zone
      const selectedZoneDetails = zones.find(zone => zone.id === selectedZone);
      if (!selectedZoneDetails) {
        toast.error('Please select a valid zone first');
        return;
      }
      
      // Prepare certificate request data
      const domain = certificateData.domain || selectedZoneDetails.name;
      const subdomains = certificateData.subdomains
        ? certificateData.subdomains.split(',').map(s => s.trim())
        : [];
        
      // Create ACME challenge TXT record for validation
      // This is a simplified example - in a real implementation, you would:
      // 1. Request certificate from Let's Encrypt or similar
      // 2. Create DNS validation records based on the challenge
      // 3. Monitor certificate issuance
      
      // For this example, we'll create a placeholder TXT record for demonstration
      const acmeRecord = {
        type: 'TXT',
        name: `_acme-challenge.${domain}`,
        content: `validation-token-${Date.now()}`,
        ttl: 120,
        proxied: false
      };
      
      await axios.post(`/api/cloudflare/zones/${selectedZone}/dns-records`, acmeRecord);
      
      toast.success('Certificate validation record created. In a production environment, this would trigger certificate issuance.');
      setShowCertificateModal(false);
      fetchDnsRecords(selectedZone);
    } catch (error) {
      console.error('Error creating certificate:', error);
      toast.error(`Failed to create certificate: ${error.response?.data?.message || error.message}`);
    } finally {
      setCreatingCertificate(false);
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

  // Render DNS record type-specific fields
  const renderRecordTypeFields = () => {
    switch(newRecord.type) {
      case 'MX':
        return (
          <div className="mb-4">
            <label className="block mb-1 font-medium">Priority</label>
            <Input
              type="number"
              name="priority"
              value={newRecord.priority}
              onChange={handleRecordChange}
              min="0"
              max="65535"
            />
          </div>
        );
      case 'SRV':
        return (
          <>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Service</label>
              <Input
                type="text"
                name="service"
                value={newRecord.service}
                onChange={handleRecordChange}
                placeholder="_service"
              />
            </div>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Protocol</label>
              <select
                name="protocol"
                value={newRecord.protocol}
                onChange={handleRecordChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="_tcp">TCP</option>
                <option value="_udp">UDP</option>
                <option value="_tls">TLS</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="mb-4">
                <label className="block mb-1 font-medium">Priority</label>
                <Input
                  type="number"
                  name="priority"
                  value={newRecord.priority}
                  onChange={handleRecordChange}
                  min="0"
                  max="65535"
                />
              </div>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Port</label>
                <Input
                  type="number"
                  name="port"
                  value={newRecord.port}
                  onChange={handleRecordChange}
                  min="1"
                  max="65535"
                />
              </div>
            </div>
          </>
        );
      default:
        return null;
    }
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
                  className="mr-2"
                >
                  Refresh Zones
                </Button>
                
                {selectedZone && (
                  <>
                    <Button
                      variant="primary"
                      onClick={() => setShowCertificateModal(true)}
                      className="mr-2"
                    >
                      Manage Certificates
                    </Button>
                    <Button
                      variant="success"
                      onClick={() => {
                        setEditingRecord(null);
                        setNewRecord({
                          type: 'A',
                          name: '',
                          content: '',
                          ttl: 1,
                          proxied: false,
                          priority: 10,
                          port: 80,
                          service: '',
                          protocol: '_tcp'
                        });
                        setShowAddRecordModal(true);
                      }}
                    >
                      Add DNS Record
                    </Button>
                  </>
                )}
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
                <table className="min-w-full bg-white border border-gray-200">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 border-b text-left">Type</th>
                      <th className="py-2 px-4 border-b text-left">Name</th>
                      <th className="py-2 px-4 border-b text-left">Content</th>
                      <th className="py-2 px-4 border-b text-left">TTL</th>
                      <th className="py-2 px-4 border-b text-left">Proxied</th>
                      <th className="py-2 px-4 border-b text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dnsRecords.map((record) => (
                      <tr key={record.id}>
                        <td className="py-2 px-4 border-b">{record.type}</td>
                        <td className="py-2 px-4 border-b">{record.name}</td>
                        <td className="py-2 px-4 border-b">{record.content}</td>
                        <td className="py-2 px-4 border-b">
                          {record.ttl === 1 ? 'Auto' : record.ttl}
                        </td>
                        <td className="py-2 px-4 border-b">
                          {record.proxied ? 'Yes' : 'No'}
                        </td>
                        <td className="py-2 px-4 border-b">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleEditRecord(record)}
                            className="mr-2"
                          >
                            Edit
                          </Button>
                          <Button
                            variant="danger"
                            size="sm"
                            onClick={() => handleDeleteRecord(record.id)}
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
        
        {/* Add/Edit DNS Record Modal */}
        <Modal
          isOpen={showAddRecordModal}
          onClose={() => setShowAddRecordModal(false)}
          title={editingRecord ? 'Edit DNS Record' : 'Add DNS Record'}
        >
          <form onSubmit={handleSubmitRecord}>
            <div className="mb-4">
              <label className="block mb-1 font-medium">Record Type</label>
              <select
                name="type"
                value={newRecord.type}
                onChange={handleRecordChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="A">A (Address)</option>
                <option value="AAAA">AAAA (IPv6 Address)</option>
                <option value="CNAME">CNAME (Canonical Name)</option>
                <option value="TXT">TXT (Text)</option>
                <option value="MX">MX (Mail Exchange)</option>
                <option value="SRV">SRV (Service)</option>
                <option value="NS">NS (Name Server)</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 font-medium">Name</label>
              <Input
                type="text"
                name="name"
                value={newRecord.name}
                onChange={handleRecordChange}
                placeholder="e.g., www or @ for root"
                required
              />
            </div>
            
            <div className="mb-4">
              <label className="block mb-1 font-medium">Content</label>
              <Input
                type="text"
                name="content"
                value={newRecord.content}
                onChange={handleRecordChange}
                placeholder={newRecord.type === 'A' ? '192.168.1.1' : 'Content value'}
                required
              />
            </div>
            
            {renderRecordTypeFields()}
            
            <div className="mb-4">
              <label className="block mb-1 font-medium">TTL</label>
              <select
                name="ttl"
                value={newRecord.ttl}
                onChange={handleRecordChange}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="1">Auto</option>
                <option value="120">2 minutes</option>
                <option value="300">5 minutes</option>
                <option value="600">10 minutes</option>
                <option value="1800">30 minutes</option>
                <option value="3600">1 hour</option>
                <option value="7200">2 hours</option>
                <option value="18000">5 hours</option>
                <option value="43200">12 hours</option>
                <option value="86400">1 day</option>
              </select>
            </div>
            
            <div className="mb-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="proxied"
                  checked={newRecord.proxied}
                  onChange={handleRecordChange}
                  className="mr-2"
                />
                <span>Proxy through Cloudflare</span>
              </label>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="secondary"
                type="button"
                onClick={() => setShowAddRecordModal(false)}
                className="mr-2"
              >
                Cancel
              </Button>
              <Button variant="primary" type="submit">
                {editingRecord ? 'Update Record' : 'Add Record'}
              </Button>
            </div>
          </form>
        </Modal>
        
        {/* Certificate Management Modal */}
        <Modal
          isOpen={showCertificateModal}
          onClose={() => setShowCertificateModal(false)}
          title="Certificate Management"
        >
          <div className="mb-6">
            <h4 className="text-lg font-medium mb-2">Request New Certificate</h4>
            <p className="text-sm text-gray-600 mb-4">
              This will create the necessary DNS records for certificate validation.
            </p>
            
            <form onSubmit={handleCreateCertificate}>
              <div className="mb-4">
                <label className="block mb-1 font-medium">Domain</label>
                <Input
                  type="text"
                  name="domain"
                  value={certificateData.domain}
                  onChange={handleCertificateChange}
                  placeholder={zones.find(z => z.id === selectedZone)?.name || "example.com"}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Leave blank to use the zone's root domain
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block mb-1 font-medium">Subdomains (Optional)</label>
                <Input
                  type="text"
                  name="subdomains"
                  value={certificateData.subdomains}
                  onChange={handleCertificateChange}
                  placeholder="www, api, app"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Comma-separated list of subdomains to include in the certificate
                </p>
              </div>
              
              <div className="mb-4">
                <label className="block mb-1 font-medium">Validation Method</label>
                <select
                  name="validationMethod"
                  value={certificateData.validationMethod}
                  onChange={handleCertificateChange}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="dns">DNS Validation</option>
                </select>
              </div>
              
              <div className="flex justify-end">
                <Button
                  variant="secondary"
                  type="button"
                  onClick={() => setShowCertificateModal(false)}
                  className="mr-2"
                >
                  Cancel
                </Button>
                <Button 
                  variant="primary" 
                  type="submit"
                  disabled={creatingCertificate}
                >
                  {creatingCertificate ? 'Creating...' : 'Create Certificate'}
                </Button>
              </div>
            </form>
          </div>
          
          <div className="border-t border-gray-200 pt-4">
            <h4 className="text-lg font-medium mb-2">Port Forwarding Setup</h4>
            <p className="text-sm text-gray-600 mb-2">
              To set up port forwarding with Cloudflare:
            </p>
            <ol className="list-decimal ml-5 text-sm">
              <li className="mb-1">Create an A or AAAA record pointing to your server's IP</li>
              <li className="mb-1">Disable Cloudflare proxying (set to DNS only)</li>
              <li className="mb-1">Configure your server's firewall to allow the desired ports</li>
              <li>For advanced setups, consider using Cloudflare Spectrum for TCP/UDP traffic</li>
            </ol>
          </div>
        </Modal>
      </div>
    </Card>
  );
};

export default CloudflareIntegration; 