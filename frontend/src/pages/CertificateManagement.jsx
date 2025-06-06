import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

const CertificateManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [subdomains, setSubdomains] = useState([]);
  const [serverInfo, setServerInfo] = useState({
    docker: [],
    host: [],
    totalServers: 0
  });

  // Selected subdomain for certificate issuance
  const [selectedSubdomain, setSelectedSubdomain] = useState('');
  // Selected servers for certificate installation
  const [selectedContainers, setSelectedContainers] = useState([]);
  
  // Certificate issuance processing state
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  
  // Parse query parameter for subdomainId if present
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const subdomainId = params.get('subdomainId');
    
    if (subdomainId) {
      setSelectedSubdomain(subdomainId);
    }
  }, [location.search]);
  
  // Get certificates and subdomains on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch certificates, subdomains and server info in parallel
        const [certResponse, subdomainResponse, serverResponse] = await Promise.all([
          axios.get('/api/certificates'),
          axios.get('/api/subdomains'),
          axios.get('/api/server-detection')
        ]);
        
        setCertificates(certResponse.data);
        setSubdomains(subdomainResponse.data);
        setServerInfo(serverResponse.data);
      } catch (error) {
        console.error('Error fetching certificate data:', error);
        toast.error('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleContainerSelect = (containerId) => {
    setSelectedContainers(prev => {
      if (prev.includes(containerId)) {
        return prev.filter(id => id !== containerId);
      } else {
        return [...prev, containerId];
      }
    });
  };
  
  const handleIssueCertificate = async () => {
    if (!selectedSubdomain) {
      toast.error('Please select a subdomain');
      return;
    }

    try {
      setIssuingCertificate(true);
      
      const response = await axios.post('/api/certificates', {
        subdomainId: selectedSubdomain,
        containerIds: selectedContainers.length ? selectedContainers : undefined
      });
      
      toast.success('Certificate issuance initiated');
      
      // Refresh certificates list
      const updatedCerts = await axios.get('/api/certificates');
      setCertificates(updatedCerts.data);
      
      // Reset selections
      setSelectedSubdomain('');
      setSelectedContainers([]);
    } catch (error) {
      console.error('Error issuing certificate:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to issue certificate');
      }
    } finally {
      setIssuingCertificate(false);
    }
  };
  
  const getStatusBadgeClass = (status) => {
    switch(status) {
      case 'pending':
        return 'bg-yellow-200 text-yellow-800';
      case 'issued':
        return 'bg-blue-200 text-blue-800';
      case 'installed':
        return 'bg-green-200 text-green-800';
      case 'error':
        return 'bg-red-200 text-red-800';
      case 'expired':
        return 'bg-gray-200 text-gray-800';
      default:
        return 'bg-gray-200 text-gray-800';
    }
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };
  
  // Function to check if a subdomain already has a certificate
  const hasValidCertificate = (subdomainId) => {
    return certificates.some(cert => 
      cert.subdomainId?._id === subdomainId && 
      ['pending', 'issued', 'installed'].includes(cert.status)
    );
  };
  
  // Function to find a subdomain by ID
  const getSubdomainById = (id) => {
    return subdomains.find(subdomain => subdomain._id === id);
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Certificate Management</h2>
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Certificate Management</h2>
      
      {/* Issue new certificate section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Issue New SSL Certificate</h3>
        
        {/* Subdomain selection */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Subdomain
          </label>
          <select
            className="form-select rounded-md border-gray-300 w-full p-2"
            value={selectedSubdomain}
            onChange={(e) => setSelectedSubdomain(e.target.value)}
          >
            <option value="">-- Select Subdomain --</option>
            {subdomains.map(subdomain => (
              <option 
                key={subdomain._id}
                value={subdomain._id}
                disabled={hasValidCertificate(subdomain._id)}
              >
                {subdomain.name}.{subdomain.parentDomain} 
                {hasValidCertificate(subdomain._id) ? ' (Certificate Already Exists)' : ''}
              </option>
            ))}
          </select>
        </div>
        
        {/* Container selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Target Web Servers (Optional)
          </label>
          
          {serverInfo.totalServers === 0 ? (
            <div className="text-gray-500">No web servers detected</div>
          ) : (
            <div className="space-y-4">
              {/* Docker containers */}
              {serverInfo.docker.length > 0 && (
                <div className="bg-blue-50 p-3 rounded-md">
                  <h4 className="font-medium text-blue-700 mb-2">Docker Containers</h4>
                  <div className="space-y-2">
                    {serverInfo.docker.map(server => (
                      <div key={server.containerId} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`container-${server.containerId}`}
                          className="mr-2"
                          checked={selectedContainers.includes(server.containerId)}
                          onChange={() => handleContainerSelect(server.containerId)}
                        />
                        <label htmlFor={`container-${server.containerId}`}>
                          {server.name} ({server.type}) - Ports: {server.ports.join(', ')}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Host servers */}
              {serverInfo.host.length > 0 && (
                <div className="bg-green-50 p-3 rounded-md">
                  <h4 className="font-medium text-green-700 mb-2">Host Services</h4>
                  <div className="space-y-2">
                    {serverInfo.host.map(server => (
                      <div key={server.pid} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`host-${server.pid}`}
                          className="mr-2"
                          disabled={true} // Currently only supporting Docker containers
                        />
                        <label htmlFor={`host-${server.pid}`}>
                          {server.name} ({server.type}) - Ports: {server.ports.join(', ')}
                          <span className="text-gray-500 text-sm ml-2">(Host installation coming soon)</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:bg-gray-400"
          onClick={handleIssueCertificate}
          disabled={issuingCertificate || !selectedSubdomain}
        >
          {issuingCertificate ? 'Issuing Certificate...' : 'Issue Certificate'}
        </button>
      </div>
      
      {/* Existing certificates */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Existing Certificates</h3>
        
        {certificates.length === 0 ? (
          <div className="text-gray-500">No certificates found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map(cert => (
                  <tr key={cert._id}>
                    <td className="px-6 py-4 whitespace-nowrap">{cert.domain}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadgeClass(cert.status)}`}>
                        {cert.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(cert.issueDate)}</td>
                    <td className="px-6 py-4 whitespace-nowrap">{formatDate(cert.expiryDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificateManagement; 