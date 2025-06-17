import React, { useState, useEffect, useContext } from 'react';
import { Card, Button, Form, Alert, Table, Spinner } from 'react-bootstrap';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import AwsCredentialsModal from '../components/AwsCredentialsModal';
import ServerDetection from '../components/ServerDetection';

const SubdomainManagement = () => {
  const { isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [subdomains, setSubdomains] = useState([]);
  const [hostedZones, setHostedZones] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    parentDomain: '',
    recordType: 'A',
    ttl: 300
  });
  const [submitting, setSubmitting] = useState(false);
  const [showCredentialsModal, setShowCredentialsModal] = useState(false);
  const [storedRegion, setStoredRegion] = useState('ap-south-1');
  const [pendingFormSubmission, setPendingFormSubmission] = useState(null);
  const [showServerDetection, setShowServerDetection] = useState(false);
  
  // Redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    }
  }, [isAuthenticated, navigate]);
  
  // Function to fetch hosted zones
  const fetchHostedZones = async () => {
    try {
      const zonesResponse = await axios.get('/api/subdomains/zones/list');
      setHostedZones(zonesResponse.data);
      
      // Set default parent domain if zones exist
      if (zonesResponse.data.length > 0) {
        setFormData(prev => ({
          ...prev,
          parentDomain: zonesResponse.data[0].name
        }));
      }
    } catch (err) {
      console.error('Error fetching hosted zones:', err);
      if (err.response?.data?.needCredentials) {
        // Show credentials modal if needed
        setShowCredentialsModal(true);
        // If region is provided, set it in state
        if (err.response?.data?.region) {
          setStoredRegion(err.response.data.region);
        }
      } else {
        setError('Failed to fetch hosted zones. Please check your AWS credentials.');
      }
    }
  };
  
  // Function to fetch subdomains
  const fetchSubdomains = async () => {
    try {
      const subdomainsResponse = await axios.get('/api/subdomains');
      setSubdomains(subdomainsResponse.data);
    } catch (err) {
      console.error('Error fetching subdomains:', err);
      setError('Failed to fetch subdomains.');
    }
  };
  
  // Fetch hosted zones and subdomains on load
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Check if AWS credentials exist
        const credResponse = await axios.get('/api/aws-credentials');
        if (credResponse.data) {
          await fetchHostedZones();
          await fetchSubdomains();
        }
      } catch (err) {
        console.error('Error checking credentials:', err);
        setError('Please configure your AWS credentials before managing subdomains.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await axios.post('/api/subdomains', formData);
      
      setSuccess(`Subdomain ${formData.name}.${formData.parentDomain} created successfully!`);
      
      // Reset form
      setFormData({
        ...formData,
        name: ''
      });
      
      // Refresh subdomains list
      await fetchSubdomains();
      
      // Show server detection after successful creation
      setShowServerDetection(true);
      
    } catch (err) {
      console.error('Error creating subdomain:', err);
      
      if (err.response?.data?.needCredentials) {
        // Store the current form submission for later
        setPendingFormSubmission({ ...formData });
        
        // Show credentials modal if needed
        setShowCredentialsModal(true);
        
        // If region is provided, set it in state
        if (err.response?.data?.region) {
          setStoredRegion(err.response.data.region);
        }
      } else {
        setError(err.response?.data?.message || 'Failed to create subdomain');
      }
    } finally {
      setSubmitting(false);
    }
  };
  
  const handleDelete = async (id, force = false) => {
    if (!window.confirm(force 
      ? 'Force delete will remove the subdomain from the database but might leave DNS records in AWS. Continue?' 
      : 'Are you sure you want to delete this subdomain?')) {
      return;
    }
    
    try {
      const url = force 
        ? `/api/subdomains/${id}?force=true` 
        : `/api/subdomains/${id}`;
        
      await axios.delete(url);
      setSuccess('Subdomain deleted successfully');
      
      // Refresh subdomains list
      await fetchSubdomains();
      
    } catch (err) {
      console.error('Error deleting subdomain:', err);
      
      if (err.response?.data?.needCredentials) {
        // Show credentials modal if needed
        setShowCredentialsModal(true);
        
        // If region is provided, set it in state
        if (err.response?.data?.region) {
          setStoredRegion(err.response.data.region);
        }
      } else if (err.response?.data?.canForceDelete) {
        // Show error with force delete option
        setError(
          <div>
            <p>{err.response?.data?.message || 'Failed to delete subdomain from AWS Route53'}</p>
            <p>Error: {err.response?.data?.error}</p>
            <p>
              <Button 
                variant="warning" 
                size="sm"
                onClick={() => handleDelete(id, true)}
              >
                Force Delete from Database Only
              </Button>
            </p>
          </div>
        );
      } else {
        setError(err.response?.data?.message || 'Failed to delete subdomain');
      }
    }
  };
  
  // Handle successful credentials verification
  const handleCredentialsVerified = async () => {
    setShowCredentialsModal(false);
    
    // If we have a pending form submission, retry it
    if (pendingFormSubmission) {
      setSubmitting(true);
      try {
        const response = await axios.post('/api/subdomains', pendingFormSubmission);
        
        setSuccess(`Subdomain ${pendingFormSubmission.name}.${pendingFormSubmission.parentDomain} created successfully!`);
        
        // Reset form
        setFormData({
          ...formData,
          name: ''
        });
        
        // Clear pending submission
        setPendingFormSubmission(null);
        
        // Refresh subdomains list
        await fetchSubdomains();
        
        // Show server detection after successful creation
        setShowServerDetection(true);
      } catch (err) {
        console.error('Error creating subdomain after verification:', err);
        setError(err.response?.data?.message || 'Failed to create subdomain');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Just refresh the zones
      fetchHostedZones();
      fetchSubdomains();
    }
  };
  
  const handleIssueCertificate = (subdomainId) => {
    // Navigate to the certificates page with the subdomain ID
    navigate(`/certificates?subdomainId=${subdomainId}`);
  };
  
  if (loading) {
    return (
      <div className="text-center my-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </div>
    );
  }
  
  return (
    <>
      <div className="container my-4">
        <h2>Subdomain Management</h2>
        
        {error && <Alert variant="danger">{error}</Alert>}
        {success && <Alert variant="success">{success}</Alert>}
        
        {showServerDetection && (
          <div className="row mb-4">
            <div className="col-12">
              <ServerDetection />
            </div>
          </div>
        )}
        
        <div className="row">
          <div className="col-md-5">
            <Card className="mb-4">
              <Card.Header>Create New Subdomain</Card.Header>
              <Card.Body>
                <Form onSubmit={handleSubmit}>
                  <Form.Group className="mb-3">
                    <Form.Label>Subdomain Name</Form.Label>
                    <Form.Control
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      placeholder="e.g. app, www, dev"
                      required
                    />
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Parent Domain</Form.Label>
                    <Form.Select
                      name="parentDomain"
                      value={formData.parentDomain}
                      onChange={handleInputChange}
                      required
                    >
                      {hostedZones.length === 0 ? (
                        <option value="">No hosted zones found</option>
                      ) : (
                        hostedZones.map(zone => (
                          <option key={zone.id} value={zone.name}>
                            {zone.name}
                          </option>
                        ))
                      )}
                    </Form.Select>
                    <Form.Text className="text-muted">
                      Parent domain from your AWS Route53 hosted zones
                    </Form.Text>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>Record Type</Form.Label>
                    <Form.Select
                      name="recordType"
                      value={formData.recordType}
                      onChange={handleInputChange}
                    >
                      <option value="A">A (IPv4 Address)</option>
                      <option value="AAAA">AAAA (IPv6 Address)</option>
                      <option value="CNAME">CNAME (Canonical Name)</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Form.Group className="mb-3">
                    <Form.Label>TTL (seconds)</Form.Label>
                    <Form.Control
                      type="number"
                      name="ttl"
                      value={formData.ttl}
                      onChange={handleInputChange}
                      min="60"
                    />
                    <Form.Text className="text-muted">
                      Time to live in seconds (minimum 60)
                    </Form.Text>
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    type="submit" 
                    disabled={submitting || !formData.parentDomain}
                  >
                    {submitting ? 'Creating...' : 'Create Subdomain'}
                  </Button>
                </Form>
              </Card.Body>
            </Card>
            
            <Card>
              <Card.Header>Important Information</Card.Header>
              <Card.Body>
                <p>
                  The subdomain will point to your current public IP address.
                  This is useful for development and testing.
                </p>
                <p className="mb-0">
                  DNS propagation may take some time (usually a few minutes to a few hours)
                  depending on your TTL settings and DNS providers.
                </p>
              </Card.Body>
            </Card>
          </div>
          
          <div className="col-md-7">
            <Card>
              <Card.Header>Your Subdomains</Card.Header>
              <Card.Body>
                {subdomains.length === 0 ? (
                  <p>You haven't created any subdomains yet.</p>
                ) : (
                  <Table striped bordered hover responsive>
                    <thead>
                      <tr>
                        <th>Subdomain</th>
                        <th>IP Address</th>
                        <th>Type</th>
                        <th>TTL</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subdomains.map(subdomain => (
                        <tr key={subdomain._id}>
                          <td>
                            <strong>{subdomain.name}.{subdomain.parentDomain}</strong>
                          </td>
                          <td>{subdomain.targetIp}</td>
                          <td>{subdomain.recordType}</td>
                          <td>{subdomain.ttl}</td>
                          <td>
                            <Button
                              variant="primary"
                              size="sm"
                              className="me-2"
                              onClick={() => handleIssueCertificate(subdomain._id)}
                            >
                              SSL Certificate
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDelete(subdomain._id)}
                            >
                              Delete
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                )}
              </Card.Body>
            </Card>
          </div>
        </div>
      </div>
      
      {/* AWS Credentials Modal */}
      <AwsCredentialsModal 
        show={showCredentialsModal}
        onClose={() => setShowCredentialsModal(false)}
        onSuccess={handleCredentialsVerified}
        region={storedRegion}
      />
    </>
  );
};

export default SubdomainManagement; 