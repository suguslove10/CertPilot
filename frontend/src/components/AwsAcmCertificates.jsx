import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertBanner, Button, Card, Spinner, StatusBadge, Modal, Input } from './';

const AwsAcmCertificates = () => {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [certificateDetails, setCertificateDetails] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  
  // State for requesting a new certificate
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [requestForm, setRequestForm] = useState({
    domainName: '',
    subjectAlternativeNames: '',
    validationMethod: 'DNS',
    region: 'us-east-1'
  });
  
  // State for importing a certificate
  const [showImportModal, setShowImportModal] = useState(false);
  const [importForm, setImportForm] = useState({
    certificate: '',
    privateKey: '',
    certificateChain: '',
    region: 'us-east-1'
  });
  
  // State for DNS validation
  const [showDnsValidationModal, setShowDnsValidationModal] = useState(false);
  const [dnsValidationRecords, setDnsValidationRecords] = useState([]);
  
  // AWS Regions list
  const regions = [
    'us-east-1', 'us-east-2', 'us-west-1', 'us-west-2',
    'ca-central-1', 'eu-west-1', 'eu-west-2', 'eu-west-3',
    'eu-central-1', 'eu-north-1', 'ap-northeast-1',
    'ap-northeast-2', 'ap-southeast-1', 'ap-southeast-2',
    'ap-south-1', 'sa-east-1'
  ];

  // Fetch all ACM certificates
  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/aws-integration/acm/certificates');
      setCertificates(response.data);
    } catch (err) {
      console.error('Error fetching ACM certificates:', err);
      setError(err.response?.data?.message || 'Failed to fetch ACM certificates');
    } finally {
      setLoading(false);
    }
  };

  // Fetch certificate details
  const fetchCertificateDetails = async (region, certificateArn) => {
    try {
      setActionInProgress(true);
      const response = await axios.get(`/api/aws-integration/acm/certificates/${region}/${encodeURIComponent(certificateArn)}`);
      setCertificateDetails(response.data);
    } catch (err) {
      console.error('Error fetching certificate details:', err);
      setError(err.response?.data?.message || 'Failed to fetch certificate details');
    } finally {
      setActionInProgress(false);
    }
  };

  // Request a new certificate
  const requestCertificate = async () => {
    try {
      setActionInProgress(true);
      
      const formData = {
        ...requestForm,
        subjectAlternativeNames: requestForm.subjectAlternativeNames
          .split(',')
          .map(domain => domain.trim())
          .filter(domain => domain)
      };
      
      const response = await axios.post('/api/aws-integration/acm/certificates/request', formData);
      
      // Refetch certificates after request
      await fetchCertificates();
      
      // Select the new certificate
      const newCert = {
        arn: response.data.certificateArn,
        region: formData.region
      };
      
      setSelectedCertificate(newCert);
      fetchCertificateDetails(newCert.region, newCert.arn);
      
      // Reset form and close modal
      setRequestForm({
        domainName: '',
        subjectAlternativeNames: '',
        validationMethod: 'DNS',
        region: 'us-east-1'
      });
      setShowRequestModal(false);
      
    } catch (err) {
      console.error('Error requesting certificate:', err);
      setError(err.response?.data?.message || 'Failed to request certificate');
    } finally {
      setActionInProgress(false);
    }
  };

  // Import a certificate
  const importCertificate = async () => {
    try {
      setActionInProgress(true);
      
      const response = await axios.post('/api/aws-integration/acm/certificates/import', importForm);
      
      // Refetch certificates after import
      await fetchCertificates();
      
      // Select the new certificate
      const newCert = {
        arn: response.data.certificateArn,
        region: importForm.region
      };
      
      setSelectedCertificate(newCert);
      fetchCertificateDetails(newCert.region, newCert.arn);
      
      // Reset form and close modal
      setImportForm({
        certificate: '',
        privateKey: '',
        certificateChain: '',
        region: 'us-east-1'
      });
      setShowImportModal(false);
      
    } catch (err) {
      console.error('Error importing certificate:', err);
      setError(err.response?.data?.message || 'Failed to import certificate');
    } finally {
      setActionInProgress(false);
    }
  };

  // Delete a certificate
  const deleteCertificate = async () => {
    if (!selectedCertificate) return;
    
    if (!window.confirm('Are you sure you want to delete this certificate?')) {
      return;
    }
    
    try {
      setActionInProgress(true);
      
      await axios.delete(`/api/aws-integration/acm/certificates/${selectedCertificate.region}/${encodeURIComponent(selectedCertificate.arn)}`);
      
      // Refetch certificates and reset selection
      await fetchCertificates();
      setSelectedCertificate(null);
      setCertificateDetails(null);
      
    } catch (err) {
      console.error('Error deleting certificate:', err);
      setError(err.response?.data?.message || 'Failed to delete certificate');
    } finally {
      setActionInProgress(false);
    }
  };

  // Create DNS validation records
  const createDnsValidationRecords = async () => {
    if (!selectedCertificate) return;
    
    try {
      setActionInProgress(true);
      
      const response = await axios.post(
        `/api/aws-integration/acm/certificates/${selectedCertificate.region}/${encodeURIComponent(selectedCertificate.arn)}/dns-validation`
      );
      
      setDnsValidationRecords(response.data);
      setShowDnsValidationModal(true);
      
      // Refetch certificate details to get updated validation status
      setTimeout(() => {
        fetchCertificateDetails(selectedCertificate.region, selectedCertificate.arn);
      }, 2000);
      
    } catch (err) {
      console.error('Error creating DNS validation records:', err);
      setError(err.response?.data?.message || 'Failed to create DNS validation records');
    } finally {
      setActionInProgress(false);
    }
  };

  // Renew a certificate
  const renewCertificate = async () => {
    if (!selectedCertificate) return;
    
    try {
      setActionInProgress(true);
      
      await axios.post(
        `/api/aws-integration/acm/certificates/${selectedCertificate.region}/${encodeURIComponent(selectedCertificate.arn)}/renew`
      );
      
      // Refetch certificate details to get updated status
      fetchCertificateDetails(selectedCertificate.region, selectedCertificate.arn);
      
    } catch (err) {
      console.error('Error renewing certificate:', err);
      setError(err.response?.data?.message || 'Failed to renew certificate');
    } finally {
      setActionInProgress(false);
    }
  };

  // Set selected certificate and fetch its details
  const selectCertificate = (certificate) => {
    setSelectedCertificate(certificate);
    fetchCertificateDetails(certificate.region, certificate.arn);
  };

  // Handle request form changes
  const handleRequestFormChange = (e) => {
    const { name, value } = e.target;
    setRequestForm(prev => ({ ...prev, [name]: value }));
  };

  // Handle import form changes
  const handleImportFormChange = (e) => {
    const { name, value } = e.target;
    setImportForm(prev => ({ ...prev, [name]: value }));
  };

  // Load certificates on component mount
  useEffect(() => {
    fetchCertificates();
  }, []);

  // Get status color based on certificate status
  const getStatusColor = (status) => {
    switch (status?.toUpperCase()) {
      case 'ISSUED':
        return 'success';
      case 'PENDING_VALIDATION':
        return 'warning';
      case 'FAILED':
        return 'danger';
      case 'EXPIRED':
        return 'danger';
      case 'REVOKED':
        return 'danger';
      case 'INACTIVE':
        return 'secondary';
      case 'VALIDATION_TIMED_OUT':
        return 'danger';
      default:
        return 'info';
    }
  };

  // Group certificates by region
  const certificatesByRegion = certificates.reduce((acc, cert) => {
    if (!acc[cert.region]) {
      acc[cert.region] = [];
    }
    acc[cert.region].push(cert);
    return acc;
  }, {});

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">ACM Certificate Management</h2>
        <div>
          <Button 
            variant="success" 
            onClick={() => setShowRequestModal(true)} 
            className="me-2"
          >
            Request Certificate
          </Button>
          <Button 
            variant="info" 
            onClick={() => setShowImportModal(true)} 
            className="me-2"
          >
            Import Certificate
          </Button>
          <Button 
            variant="primary" 
            onClick={fetchCertificates} 
            disabled={loading || actionInProgress}
          >
            {loading ? <Spinner size="sm" /> : 'Refresh Certificates'}
          </Button>
        </div>
      </div>

      {error && <AlertBanner message={error} variant="danger" />}

      <div className="row">
        <div className="col-md-5">
          <Card title="ACM Certificates">
            {loading ? (
              <div className="text-center p-4">
                <Spinner />
                <p className="mt-2">Loading certificates...</p>
              </div>
            ) : certificates.length === 0 ? (
              <p className="text-center p-3">No ACM certificates found</p>
            ) : (
              <div className="certificate-list">
                {Object.entries(certificatesByRegion).map(([region, regionCerts]) => (
                  <div key={region} className="mb-3">
                    <h5 className="region-name">{region}</h5>
                    <div className="list-group">
                      {regionCerts.map(cert => (
                        <button 
                          key={cert.arn}
                          className={`list-group-item list-group-item-action ${selectedCertificate?.arn === cert.arn ? 'active' : ''}`}
                          onClick={() => selectCertificate(cert)}
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">
                              {cert.domainName}
                            </h6>
                            <StatusBadge 
                              status={cert.status} 
                              color={getStatusColor(cert.status)} 
                            />
                          </div>
                          <small>
                            {cert.notAfter && (
                              <span className="me-3">
                                Expires: {new Date(cert.notAfter).toLocaleDateString()}
                              </span>
                            )}
                            <span className="me-3">Type: {cert.type}</span>
                          </small>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="col-md-7">
          <Card title="Certificate Details">
            {!selectedCertificate ? (
              <p className="text-center p-4">Select a certificate to view details</p>
            ) : actionInProgress ? (
              <div className="text-center p-4">
                <Spinner />
                <p className="mt-2">Loading certificate details...</p>
              </div>
            ) : certificateDetails ? (
              <div className="certificate-details">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>{certificateDetails.domainName}</h4>
                  <StatusBadge 
                    status={certificateDetails.status} 
                    color={getStatusColor(certificateDetails.status)} 
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-12 mb-3">
                    <div className="action-buttons">
                      {/* DNS Validation button */}
                      {certificateDetails.status === 'PENDING_VALIDATION' && (
                        <Button 
                          variant="primary" 
                          onClick={createDnsValidationRecords}
                          disabled={actionInProgress}
                          className="me-2"
                        >
                          Create DNS Validation Records
                        </Button>
                      )}
                      
                      {/* Renew button */}
                      {certificateDetails.renewalEligibility === 'ELIGIBLE' && (
                        <Button 
                          variant="success" 
                          onClick={renewCertificate}
                          disabled={actionInProgress}
                          className="me-2"
                        >
                          Renew Certificate
                        </Button>
                      )}
                      
                      {/* Delete button */}
                      <Button 
                        variant="danger" 
                        onClick={deleteCertificate}
                        disabled={actionInProgress}
                      >
                        Delete Certificate
                      </Button>
                    </div>
                  </div>
                </div>
                
                <h5>General Information</h5>
                <table className="table mb-4">
                  <tbody>
                    <tr>
                      <th>Domain Name</th>
                      <td>{certificateDetails.domainName}</td>
                    </tr>
                    <tr>
                      <th>Status</th>
                      <td>{certificateDetails.status}</td>
                    </tr>
                    <tr>
                      <th>Type</th>
                      <td>{certificateDetails.type}</td>
                    </tr>
                    <tr>
                      <th>Region</th>
                      <td>{certificateDetails.region}</td>
                    </tr>
                    {certificateDetails.issuer && (
                      <tr>
                        <th>Issuer</th>
                        <td>{certificateDetails.issuer}</td>
                      </tr>
                    )}
                    <tr>
                      <th>Not Before</th>
                      <td>{certificateDetails.notBefore ? new Date(certificateDetails.notBefore).toLocaleString() : 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Not After</th>
                      <td>{certificateDetails.notAfter ? new Date(certificateDetails.notAfter).toLocaleString() : 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>Created</th>
                      <td>{certificateDetails.createdAt ? new Date(certificateDetails.createdAt).toLocaleString() : 'N/A'}</td>
                    </tr>
                    <tr>
                      <th>In Use</th>
                      <td>{certificateDetails.inUse ? 'Yes' : 'No'}</td>
                    </tr>
                    <tr>
                      <th>Renewal Eligibility</th>
                      <td>{certificateDetails.renewalEligibility || 'N/A'}</td>
                    </tr>
                    {certificateDetails.failureReason && (
                      <tr>
                        <th>Failure Reason</th>
                        <td>{certificateDetails.failureReason}</td>
                      </tr>
                    )}
                  </tbody>
                </table>
                
                {/* Subject Alternative Names */}
                {certificateDetails.subjectAlternativeNames && certificateDetails.subjectAlternativeNames.length > 0 && (
                  <>
                    <h5>Subject Alternative Names</h5>
                    <ul className="list-group mb-4">
                      {certificateDetails.subjectAlternativeNames.map((san, idx) => (
                        <li key={idx} className="list-group-item">{san}</li>
                      ))}
                    </ul>
                  </>
                )}
                
                {/* Domain Validation */}
                {certificateDetails.domainValidationOptions && certificateDetails.domainValidationOptions.length > 0 && (
                  <>
                    <h5>Domain Validation</h5>
                    <div className="table-responsive">
                      <table className="table mb-4">
                        <thead>
                          <tr>
                            <th>Domain</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Record</th>
                          </tr>
                        </thead>
                        <tbody>
                          {certificateDetails.domainValidationOptions.map((validation, idx) => (
                            <tr key={idx}>
                              <td>{validation.domainName}</td>
                              <td>{validation.validationMethod || 'N/A'}</td>
                              <td>
                                <StatusBadge 
                                  status={validation.validationStatus || 'PENDING'} 
                                  color={getStatusColor(validation.validationStatus)} 
                                />
                              </td>
                              <td>
                                {validation.resourceRecord ? (
                                  <div className="validation-record">
                                    <small className="d-block">
                                      <strong>Name:</strong> {validation.resourceRecord.Name}
                                    </small>
                                    <small className="d-block">
                                      <strong>Type:</strong> {validation.resourceRecord.Type}
                                    </small>
                                    <small className="d-block text-break">
                                      <strong>Value:</strong> {validation.resourceRecord.Value}
                                    </small>
                                  </div>
                                ) : (
                                  'No record available'
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
                
                {/* Tags */}
                {certificateDetails.tags && certificateDetails.tags.length > 0 && (
                  <>
                    <h5>Tags</h5>
                    <div className="mb-4">
                      {certificateDetails.tags.map((tag, idx) => (
                        <span key={idx} className="badge bg-light text-dark me-1 mb-1">
                          {tag.Key}: {tag.Value}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center p-4">
                <p>No certificate details available</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Request Certificate Modal */}
      <Modal
        show={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        title="Request New Certificate"
      >
        <div className="mb-3">
          <Input
            label="Domain Name"
            name="domainName"
            value={requestForm.domainName}
            onChange={handleRequestFormChange}
            placeholder="example.com"
            required
          />
        </div>
        
        <div className="mb-3">
          <Input
            label="Subject Alternative Names (comma separated)"
            name="subjectAlternativeNames"
            value={requestForm.subjectAlternativeNames}
            onChange={handleRequestFormChange}
            placeholder="www.example.com, api.example.com"
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Validation Method</label>
          <select
            className="form-select"
            name="validationMethod"
            value={requestForm.validationMethod}
            onChange={handleRequestFormChange}
          >
            <option value="DNS">DNS Validation</option>
            <option value="EMAIL">Email Validation</option>
          </select>
          <div className="form-text">
            DNS validation is recommended as it allows automatic renewal
          </div>
        </div>
        
        <div className="mb-3">
          <label className="form-label">Region</label>
          <select
            className="form-select"
            name="region"
            value={requestForm.region}
            onChange={handleRequestFormChange}
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        
        <div className="d-flex justify-content-end">
          <Button
            variant="secondary"
            onClick={() => setShowRequestModal(false)}
            className="me-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={requestCertificate}
            disabled={!requestForm.domainName || actionInProgress}
          >
            {actionInProgress ? <Spinner size="sm" /> : 'Request Certificate'}
          </Button>
        </div>
      </Modal>

      {/* Import Certificate Modal */}
      <Modal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        title="Import Certificate"
      >
        <div className="mb-3">
          <Input
            label="PEM-encoded Certificate"
            type="textarea"
            name="certificate"
            value={importForm.certificate}
            onChange={handleImportFormChange}
            placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
            required
            rows={4}
          />
        </div>
        
        <div className="mb-3">
          <Input
            label="PEM-encoded Private Key"
            type="textarea"
            name="privateKey"
            value={importForm.privateKey}
            onChange={handleImportFormChange}
            placeholder="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
            required
            rows={4}
          />
          <div className="form-text">
            Your private key is only used for import and is not stored
          </div>
        </div>
        
        <div className="mb-3">
          <Input
            label="PEM-encoded Certificate Chain (optional)"
            type="textarea"
            name="certificateChain"
            value={importForm.certificateChain}
            onChange={handleImportFormChange}
            placeholder="-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----"
            rows={4}
          />
        </div>
        
        <div className="mb-3">
          <label className="form-label">Region</label>
          <select
            className="form-select"
            name="region"
            value={importForm.region}
            onChange={handleImportFormChange}
          >
            {regions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
        </div>
        
        <div className="d-flex justify-content-end">
          <Button
            variant="secondary"
            onClick={() => setShowImportModal(false)}
            className="me-2"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={importCertificate}
            disabled={!importForm.certificate || !importForm.privateKey || actionInProgress}
          >
            {actionInProgress ? <Spinner size="sm" /> : 'Import Certificate'}
          </Button>
        </div>
      </Modal>

      {/* DNS Validation Records Modal */}
      <Modal
        show={showDnsValidationModal}
        onClose={() => setShowDnsValidationModal(false)}
        title="DNS Validation Records"
      >
        <div className="mb-3">
          <p>
            Add these DNS records to your domain to validate your certificate ownership.
            The validation process may take up to 30 minutes after the records are created.
          </p>
        </div>
        
        {dnsValidationRecords.length === 0 ? (
          <p className="text-center">No DNS validation records available</p>
        ) : (
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Record Details</th>
                </tr>
              </thead>
              <tbody>
                {dnsValidationRecords.map((record, idx) => (
                  <tr key={idx}>
                    <td>{record.domain}</td>
                    <td>
                      <StatusBadge 
                        status={record.status} 
                        color={record.status === 'created' ? 'success' : 'danger'} 
                      />
                    </td>
                    <td>
                      {record.status === 'created' ? (
                        <div className="validation-record">
                          <small className="d-block">
                            <strong>Name:</strong> {record.recordName}
                          </small>
                          <small className="d-block">
                            <strong>Type:</strong> {record.recordType}
                          </small>
                          <small className="d-block text-break">
                            <strong>Value:</strong> {record.recordValue}
                          </small>
                        </div>
                      ) : (
                        <span className="text-danger">{record.reason}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="d-flex justify-content-end mt-3">
          <Button
            variant="primary"
            onClick={() => setShowDnsValidationModal(false)}
          >
            Close
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default AwsAcmCertificates;
