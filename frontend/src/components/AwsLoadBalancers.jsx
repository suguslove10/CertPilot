import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertBanner, Button, Card, Spinner, StatusBadge, Modal } from './';

const AwsLoadBalancers = () => {
  const [loadBalancers, setLoadBalancers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedLoadBalancer, setSelectedLoadBalancer] = useState(null);
  const [loadBalancerDetails, setLoadBalancerDetails] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);
  const [certificates, setCertificates] = useState([]);
  const [loadingCertificates, setLoadingCertificates] = useState(false);
  const [showCertificateModal, setShowCertificateModal] = useState(false);
  const [selectedListener, setSelectedListener] = useState(null);
  const [selectedCertificate, setSelectedCertificate] = useState(null);

  // Fetch all load balancers
  const fetchLoadBalancers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/aws-integration/load-balancers');
      setLoadBalancers(response.data);
    } catch (err) {
      console.error('Error fetching load balancers:', err);
      setError(err.response?.data?.message || 'Failed to fetch load balancers');
    } finally {
      setLoading(false);
    }
  };

  // Fetch load balancer details
  const fetchLoadBalancerDetails = async (region, type, name) => {
    try {
      setActionInProgress(true);
      const response = await axios.get(`/api/aws-integration/load-balancers/${region}/${type}/${name}`);
      setLoadBalancerDetails(response.data);
    } catch (err) {
      console.error('Error fetching load balancer details:', err);
      setError(err.response?.data?.message || 'Failed to fetch load balancer details');
    } finally {
      setActionInProgress(false);
    }
  };

  // Fetch certificates for load balancers
  const fetchCertificates = async () => {
    try {
      setLoadingCertificates(true);
      const response = await axios.get('/api/aws-integration/acm/certificates');
      setCertificates(response.data);
    } catch (err) {
      console.error('Error fetching certificates:', err);
      setError(err.response?.data?.message || 'Failed to fetch certificates');
    } finally {
      setLoadingCertificates(false);
    }
  };

  // Update certificate on load balancer listener
  const updateCertificate = async () => {
    if (!selectedListener || !selectedCertificate) return;
    
    try {
      setActionInProgress(true);
      
      const params = {
        region: selectedLoadBalancer.region,
        certificateArn: selectedCertificate
      };
      
      // Different parameters based on load balancer type
      if (selectedLoadBalancer.type === 'classic') {
        params.loadBalancerName = selectedLoadBalancer.name;
        params.loadBalancerPort = selectedListener.loadBalancerPort;
      } else {
        params.listenerArn = selectedListener.listenerArn;
      }
      
      await axios.post('/api/aws-integration/load-balancers/update-certificate', params);
      
      // Refetch the load balancer details to show updated certificate
      await fetchLoadBalancerDetails(selectedLoadBalancer.region, selectedLoadBalancer.type, selectedLoadBalancer.name);
      
      setShowCertificateModal(false);
    } catch (err) {
      console.error('Error updating certificate:', err);
      setError(err.response?.data?.message || 'Failed to update certificate');
    } finally {
      setActionInProgress(false);
    }
  };

  // Set selected load balancer and fetch its details
  const selectLoadBalancer = (loadBalancer) => {
    setSelectedLoadBalancer(loadBalancer);
    fetchLoadBalancerDetails(loadBalancer.region, loadBalancer.type, loadBalancer.name);
  };

  // Open certificate selection modal for a listener
  const openCertificateModal = (listener) => {
    setSelectedListener(listener);
    if (!certificates.length) {
      fetchCertificates();
    }
    setShowCertificateModal(true);
  };

  // Load load balancers on component mount
  useEffect(() => {
    fetchLoadBalancers();
  }, []);

  // Get load balancer type label
  const getLoadBalancerTypeLabel = (type) => {
    switch (type) {
      case 'application':
        return 'Application Load Balancer';
      case 'network':
        return 'Network Load Balancer';
      case 'classic':
        return 'Classic Load Balancer';
      default:
        return type;
    }
  };

  // Group load balancers by region
  const loadBalancersByRegion = loadBalancers.reduce((acc, lb) => {
    if (!acc[lb.region]) {
      acc[lb.region] = [];
    }
    acc[lb.region].push(lb);
    return acc;
  }, {});

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Load Balancer Management</h2>
        <Button 
          variant="primary" 
          onClick={fetchLoadBalancers} 
          disabled={loading || actionInProgress}
        >
          {loading ? <Spinner size="sm" /> : 'Refresh Load Balancers'}
        </Button>
      </div>

      {error && <AlertBanner message={error} variant="danger" />}

      <div className="row">
        <div className="col-md-5">
          <Card title="Load Balancers">
            {loading ? (
              <div className="text-center p-4">
                <Spinner />
                <p className="mt-2">Loading load balancers...</p>
              </div>
            ) : loadBalancers.length === 0 ? (
              <p className="text-center p-3">No load balancers found</p>
            ) : (
              <div className="load-balancer-list">
                {Object.entries(loadBalancersByRegion).map(([region, regionLoadBalancers]) => (
                  <div key={region} className="mb-3">
                    <h5 className="region-name">{region}</h5>
                    <div className="list-group">
                      {regionLoadBalancers.map(lb => (
                        <button 
                          key={`${lb.region}-${lb.name}`}
                          className={`list-group-item list-group-item-action ${selectedLoadBalancer?.name === lb.name && selectedLoadBalancer?.region === lb.region ? 'active' : ''}`}
                          onClick={() => selectLoadBalancer(lb)}
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">
                              {lb.name}
                            </h6>
                            <small className="text-muted">{getLoadBalancerTypeLabel(lb.type)}</small>
                          </div>
                          <small>{lb.dnsName}</small>
                          {lb.state && (
                            <div>
                              <StatusBadge 
                                status={lb.state} 
                                color={lb.state.toLowerCase() === 'active' ? 'success' : 'warning'} 
                              />
                            </div>
                          )}
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
          <Card title="Load Balancer Details">
            {!selectedLoadBalancer ? (
              <p className="text-center p-4">Select a load balancer to view details</p>
            ) : actionInProgress ? (
              <div className="text-center p-4">
                <Spinner />
                <p className="mt-2">Loading load balancer details...</p>
              </div>
            ) : loadBalancerDetails ? (
              <div className="load-balancer-details">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>{loadBalancerDetails.name}</h4>
                  {loadBalancerDetails.state && (
                    <StatusBadge 
                      status={loadBalancerDetails.state} 
                      color={loadBalancerDetails.state.toLowerCase() === 'active' ? 'success' : 'warning'} 
                    />
                  )}
                </div>
                
                <table className="table mb-4">
                  <tbody>
                    <tr>
                      <th>DNS Name</th>
                      <td>{loadBalancerDetails.dnsName}</td>
                    </tr>
                    <tr>
                      <th>Type</th>
                      <td>{getLoadBalancerTypeLabel(loadBalancerDetails.type)}</td>
                    </tr>
                    <tr>
                      <th>Region</th>
                      <td>{loadBalancerDetails.region}</td>
                    </tr>
                    <tr>
                      <th>Scheme</th>
                      <td>{loadBalancerDetails.scheme}</td>
                    </tr>
                    <tr>
                      <th>VPC</th>
                      <td>{loadBalancerDetails.vpcId}</td>
                    </tr>
                    <tr>
                      <th>Created</th>
                      <td>{new Date(loadBalancerDetails.createdTime).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Availability Zones</th>
                      <td>
                        {loadBalancerDetails.availabilityZones?.map(az => (
                          <div key={az.zoneName || az}>
                            {az.zoneName || az}
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
                
                <h5>Listeners</h5>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Protocol</th>
                      <th>Port</th>
                      <th>Certificate</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loadBalancerDetails.type === 'classic' ? (
                      loadBalancerDetails.listeners?.map((listener, index) => (
                        <tr key={index}>
                          <td>{listener.protocol}</td>
                          <td>{listener.loadBalancerPort}</td>
                          <td>
                            {listener.sslCertificateId ? (
                              <div className="certificate-info">
                                <small className="text-break">{listener.sslCertificateId.split('/').pop()}</small>
                              </div>
                            ) : (
                              <span className="text-muted">No certificate</span>
                            )}
                          </td>
                          <td>
                            {listener.protocol.toLowerCase() === 'https' && (
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => openCertificateModal(listener)}
                              >
                                Change Certificate
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      loadBalancerDetails.listeners?.map(listener => (
                        <tr key={listener.listenerArn}>
                          <td>{listener.protocol}</td>
                          <td>{listener.port}</td>
                          <td>
                            {listener.sslCertificates?.length > 0 ? (
                              <div className="certificate-info">
                                {listener.sslCertificates.map(certArn => (
                                  <div key={certArn} className="mb-1">
                                    <small className="text-break">{certArn.split('/').pop()}</small>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <span className="text-muted">No certificate</span>
                            )}
                          </td>
                          <td>
                            {listener.protocol.toLowerCase() === 'https' || listener.protocol.toLowerCase() === 'tls' ? (
                              <Button 
                                variant="outline-primary" 
                                size="sm"
                                onClick={() => openCertificateModal(listener)}
                              >
                                Change Certificate
                              </Button>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
                
                {loadBalancerDetails.targetGroups && loadBalancerDetails.targetGroups.length > 0 && (
                  <>
                    <h5 className="mt-4">Target Groups</h5>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th>Name</th>
                            <th>Protocol</th>
                            <th>Port</th>
                            <th>Health Check</th>
                            <th>Targets</th>
                          </tr>
                        </thead>
                        <tbody>
                          {loadBalancerDetails.targetGroups.map(tg => (
                            <tr key={tg.targetGroupArn}>
                              <td>{tg.targetGroupName}</td>
                              <td>{tg.protocol}</td>
                              <td>{tg.port}</td>
                              <td>
                                {tg.healthCheckProtocol}:{tg.healthCheckPort}{tg.healthCheckPath}
                                <div>
                                  <small>
                                    Interval: {tg.healthCheckIntervalSeconds}s, 
                                    Timeout: {tg.healthCheckTimeoutSeconds}s
                                  </small>
                                </div>
                              </td>
                              <td>
                                {tg.targets?.length > 0 ? (
                                  <div>
                                    {tg.targets.map((target, i) => (
                                      <div key={i} className="mb-1">
                                        <StatusBadge 
                                          status={target.state} 
                                          color={target.state === 'healthy' ? 'success' : 'danger'} 
                                        />
                                        <span className="ms-1">{target.id}:{target.port}</span>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <span className="text-muted">No targets</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="text-center p-4">
                <p>No load balancer details available</p>
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Certificate Selection Modal */}
      <Modal
        show={showCertificateModal}
        onClose={() => setShowCertificateModal(false)}
        title="Select Certificate"
      >
        {loadingCertificates ? (
          <div className="text-center p-4">
            <Spinner />
            <p className="mt-2">Loading certificates...</p>
          </div>
        ) : certificates.length === 0 ? (
          <p className="text-center">No certificates found. Please create or import certificates first.</p>
        ) : (
          <>
            <div className="mb-3">
              <p>
                Select a certificate to attach to the listener on port{' '}
                {selectedLoadBalancer?.type === 'classic' 
                  ? selectedListener?.loadBalancerPort 
                  : selectedListener?.port}
              </p>
              
              <div className="list-group mb-3">
                {certificates
                  .filter(cert => cert.status === 'ISSUED')
                  .sort((a, b) => a.domainName.localeCompare(b.domainName))
                  .map(cert => (
                    <button
                      key={cert.arn}
                      className={`list-group-item list-group-item-action ${selectedCertificate === cert.arn ? 'active' : ''}`}
                      onClick={() => setSelectedCertificate(cert.arn)}
                    >
                      <div className="d-flex w-100 justify-content-between">
                        <h6 className="mb-1">{cert.domainName}</h6>
                        <small>{cert.region}</small>
                      </div>
                      <small>
                        Expires: {new Date(cert.notAfter).toLocaleDateString()}
                      </small>
                      <div>
                        <small className="text-muted text-break">{cert.arn}</small>
                      </div>
                    </button>
                  ))}
              </div>
            </div>
            
            <div className="d-flex justify-content-end">
              <Button
                variant="secondary"
                onClick={() => setShowCertificateModal(false)}
                className="me-2"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={updateCertificate}
                disabled={!selectedCertificate || actionInProgress}
              >
                {actionInProgress ? <Spinner size="sm" /> : 'Update Certificate'}
              </Button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
};

export default AwsLoadBalancers;
