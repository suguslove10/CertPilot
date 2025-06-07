import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';

const TraefikCertificateManagement = () => {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [certificates, setCertificates] = useState([]);
  const [subdomains, setSubdomains] = useState([]);

  // Selected subdomain for certificate issuance
  const [selectedSubdomain, setSelectedSubdomain] = useState('');
  
  // Application port for the service
  const [applicationPort, setApplicationPort] = useState(80);
  
  // Certificate issuance processing state
  const [issuingCertificate, setIssuingCertificate] = useState(false);
  
  // Certificate deletion state
  const [deletingCertificateId, setDeletingCertificateId] = useState(null);
  
  // Certificate details modal state
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  
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
        
        // Fetch certificates and subdomains in parallel
        const [certResponse, subdomainResponse] = await Promise.all([
          axios.get('/api/traefik-certificates'),
          axios.get('/api/subdomains')
        ]);
        
        setCertificates(certResponse.data);
        setSubdomains(subdomainResponse.data);
      } catch (error) {
        console.error('Error fetching certificate data:', error);
        toast.error('Failed to load certificate data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleIssueCertificate = async () => {
    if (!selectedSubdomain) {
      toast.error('Please select a subdomain');
      return;
    }

    try {
      setIssuingCertificate(true);
      
      // First update the subdomain with the application port
      await axios.put(`/api/subdomains/${selectedSubdomain}`, {
        applicationPort
      });
      
      // Then request certificate through Traefik - pass applicationPort directly
      const response = await axios.post('/api/traefik-certificates', {
        subdomainId: selectedSubdomain,
        applicationPort // Pass the port directly to the certificate endpoint
      });
      
      toast.success('Certificate configuration initiated');
      
      // Refresh certificates list
      const updatedCerts = await axios.get('/api/traefik-certificates');
      setCertificates(updatedCerts.data);
      
      // Reset selections
      setSelectedSubdomain('');
    } catch (error) {
      console.error('Error configuring certificate:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to configure certificate');
      }
    } finally {
      setIssuingCertificate(false);
    }
  };
  
  const handleDeleteCertificate = async (certId) => {
    if (!window.confirm("Are you sure you want to delete this certificate? This will remove the SSL configuration.")) {
      return;
    }
    
    try {
      setDeletingCertificateId(certId);
      
      // Delete the certificate
      await axios.delete(`/api/traefik-certificates/${certId}`);
      
      toast.success('Certificate deleted successfully');
      
      // Refresh certificates list
      const updatedCerts = await axios.get('/api/traefik-certificates');
      setCertificates(updatedCerts.data);
    } catch (error) {
      console.error('Error deleting certificate:', error);
      
      if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error('Failed to delete certificate');
      }
    } finally {
      setDeletingCertificateId(null);
    }
  };
  
  const handleViewDetails = async (certId) => {
    try {
      // Get certificate details
      const response = await axios.get(`/api/traefik-certificates/${certId}`);
      setSelectedCertificate(response.data);
      setShowDetailsModal(true);
    } catch (error) {
      console.error('Error fetching certificate details:', error);
      toast.error('Failed to load certificate details');
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
  
  // Certificate Details Modal
  const CertificateDetailsModal = () => {
    if (!selectedCertificate) return null;
    
    return (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold">Certificate Details</h3>
            <button
              className="text-gray-500 hover:text-gray-700"
              onClick={() => {
                setShowDetailsModal(false);
                setSelectedCertificate(null);
              }}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </button>
          </div>
          
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-500">Domain</h4>
              <p className="text-base">{selectedCertificate.domain}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Status</h4>
              <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(selectedCertificate.status)}`}>
                {selectedCertificate.status}
              </span>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Issue Date</h4>
              <p className="text-base">{formatDate(selectedCertificate.issueDate)}</p>
            </div>
            
            <div>
              <h4 className="text-sm font-medium text-gray-500">Expiry Date</h4>
              <p className="text-base">{formatDate(selectedCertificate.expiryDate)}</p>
            </div>
            
            {selectedCertificate.subdomainId && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Application Port</h4>
                <p className="text-base">{selectedCertificate.subdomainId.applicationPort || 'Not set'}</p>
              </div>
            )}
            
            {selectedCertificate.errorMessage && (
              <div>
                <h4 className="text-sm font-medium text-gray-500 text-red-500">Error</h4>
                <p className="text-base text-red-500">{selectedCertificate.errorMessage}</p>
              </div>
            )}
            
            <div className="pt-4 flex justify-end">
              <button
                className="bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-md"
                onClick={() => {
                  setShowDetailsModal(false);
                  handleDeleteCertificate(selectedCertificate._id);
                }}
              >
                Delete Certificate
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="container mx-auto p-4">
        <h2 className="text-2xl font-bold mb-4">Traefik Certificate Management</h2>
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Traefik Certificate Management</h2>
      
      {/* Issue new certificate section */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <h3 className="text-xl font-semibold mb-4">Issue New SSL Certificate with Traefik</h3>
        
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
        
        {/* Application Port */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Application Port
          </label>
          <input
            type="number"
            className="form-input rounded-md border-gray-300 w-full p-2"
            value={applicationPort}
            onChange={(e) => setApplicationPort(parseInt(e.target.value) || 80)}
            min="1"
            max="65535"
          />
          <p className="text-xs text-gray-500 mt-1">
            <strong>Required:</strong> The internal port your application listens on. For the frontend, use port 8081. For backend services, this is typically 5000 or another specific port. Traefik will route external HTTPS traffic to this internal port.
          </p>
        </div>
        
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md disabled:bg-gray-400"
          onClick={handleIssueCertificate}
          disabled={issuingCertificate || !selectedSubdomain}
        >
          {issuingCertificate ? 'Configuring Certificate...' : 'Issue Certificate with Traefik'}
        </button>
      </div>
      
      {/* Existing certificates */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Existing Certificates</h3>
        
        {certificates.length === 0 ? (
          <p className="text-gray-500">No certificates found</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issue Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Expiry Date
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {certificates.map((cert) => (
                  <tr key={cert._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {cert.domain}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeClass(cert.status)}`}>
                        {cert.status}
                      </span>
                      {cert.errorMessage && (
                        <div className="text-xs text-red-600 mt-1">
                          Error: {cert.errorMessage}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cert.issueDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(cert.expiryDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        className="text-indigo-600 hover:text-indigo-900 mr-3"
                        onClick={() => handleViewDetails(cert._id)}
                      >
                        Details
                      </button>
                      <button
                        className="text-red-600 hover:text-red-900"
                        onClick={() => handleDeleteCertificate(cert._id)}
                        disabled={deletingCertificateId === cert._id}
                      >
                        {deletingCertificateId === cert._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      
      {/* Certificate Details Modal */}
      {showDetailsModal && <CertificateDetailsModal />}
    </div>
  );
};

export default TraefikCertificateManagement; 