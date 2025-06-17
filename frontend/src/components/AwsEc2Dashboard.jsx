import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertBanner, Button, Card, Spinner, StatusBadge } from './';

const AwsEc2Dashboard = () => {
  const [instances, setInstances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedInstance, setSelectedInstance] = useState(null);
  const [instanceDetails, setInstanceDetails] = useState(null);
  const [actionInProgress, setActionInProgress] = useState(false);

  // Fetch all EC2 instances
  const fetchInstances = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get('/api/aws-integration/ec2/instances');
      setInstances(response.data);
    } catch (err) {
      console.error('Error fetching EC2 instances:', err);
      setError(err.response?.data?.message || 'Failed to fetch EC2 instances');
    } finally {
      setLoading(false);
    }
  };

  // Fetch instance details
  const fetchInstanceDetails = async (region, instanceId) => {
    try {
      setActionInProgress(true);
      const response = await axios.get(`/api/aws-integration/ec2/instances/${region}/${instanceId}`);
      setInstanceDetails(response.data);
    } catch (err) {
      console.error('Error fetching instance details:', err);
      setError(err.response?.data?.message || 'Failed to fetch instance details');
    } finally {
      setActionInProgress(false);
    }
  };

  // Handle instance action (start, stop, reboot)
  const handleInstanceAction = async (action, region, instanceId) => {
    try {
      setActionInProgress(true);
      setError(null);
      
      const response = await axios.post(`/api/aws-integration/ec2/instances/${region}/${instanceId}/${action}`);
      
      // Update the instance status in the list
      const updatedInstances = instances.map(instance => {
        if (instance.instanceId === instanceId && instance.region === region) {
          return {
            ...instance,
            state: response.data.state || 'pending'
          };
        }
        return instance;
      });
      
      setInstances(updatedInstances);
      
      // If we have instance details, update those too
      if (instanceDetails && instanceDetails.instanceId === instanceId) {
        setInstanceDetails({
          ...instanceDetails,
          state: response.data.state || 'pending'
        });
      }
      
      // Refetch the instance details after a delay to get the updated state
      setTimeout(() => {
        if (selectedInstance && selectedInstance.instanceId === instanceId) {
          fetchInstanceDetails(region, instanceId);
        }
      }, 2000);
    } catch (err) {
      console.error(`Error ${action} instance:`, err);
      setError(err.response?.data?.message || `Failed to ${action} instance`);
    } finally {
      setActionInProgress(false);
    }
  };

  // Set selected instance and fetch its details
  const selectInstance = (instance) => {
    setSelectedInstance(instance);
    fetchInstanceDetails(instance.region, instance.instanceId);
  };

  // Load instances on component mount
  useEffect(() => {
    fetchInstances();
  }, []);

  // Get status color based on instance state
  const getStatusColor = (state) => {
    switch (state?.toLowerCase()) {
      case 'running':
        return 'success';
      case 'stopped':
        return 'danger';
      case 'stopping':
      case 'pending':
      case 'shutting-down':
        return 'warning';
      case 'terminated':
        return 'dark';
      default:
        return 'info';
    }
  };

  // Group instances by region
  const instancesByRegion = instances.reduce((acc, instance) => {
    if (!acc[instance.region]) {
      acc[instance.region] = [];
    }
    acc[instance.region].push(instance);
    return acc;
  }, {});

  return (
    <div className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">EC2 Instance Management</h2>
        <Button 
          variant="primary" 
          onClick={fetchInstances} 
          disabled={loading || actionInProgress}
        >
          {loading ? <Spinner size="sm" /> : 'Refresh Instances'}
        </Button>
      </div>

      {error && <AlertBanner message={error} variant="danger" />}

      <div className="row">
        <div className="col-md-5">
          <Card title="EC2 Instances">
            {loading ? (
              <div className="text-center p-4">
                <Spinner />
                <p className="mt-2">Loading instances...</p>
              </div>
            ) : instances.length === 0 ? (
              <p className="text-center p-3">No EC2 instances found</p>
            ) : (
              <div className="instance-list">
                {Object.entries(instancesByRegion).map(([region, regionInstances]) => (
                  <div key={region} className="mb-3">
                    <h5 className="region-name">{region}</h5>
                    <div className="list-group">
                      {regionInstances.map(instance => (
                        <button 
                          key={instance.instanceId}
                          className={`list-group-item list-group-item-action ${selectedInstance?.instanceId === instance.instanceId ? 'active' : ''}`}
                          onClick={() => selectInstance(instance)}
                        >
                          <div className="d-flex w-100 justify-content-between">
                            <h6 className="mb-1">
                              {instance.name || instance.instanceId}
                            </h6>
                            <StatusBadge 
                              status={instance.state} 
                              color={getStatusColor(instance.state)} 
                            />
                          </div>
                          <small>{instance.instanceType}</small>
                          <div>
                            <small>
                              {instance.publicIpAddress ? (
                                <span className="me-2">Public IP: {instance.publicIpAddress}</span>
                              ) : (
                                <span className="me-2 text-muted">No public IP</span>
                              )}
                            </small>
                          </div>
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
          <Card title="Instance Details">
            {!selectedInstance ? (
              <p className="text-center p-4">Select an instance to view details</p>
            ) : actionInProgress ? (
              <div className="text-center p-4">
                <Spinner />
                <p className="mt-2">Loading instance details...</p>
              </div>
            ) : instanceDetails ? (
              <div className="instance-details">
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h4>{instanceDetails.name || 'Unnamed Instance'}</h4>
                  <StatusBadge 
                    status={instanceDetails.state} 
                    color={getStatusColor(instanceDetails.state)} 
                  />
                </div>
                
                <div className="row mb-3">
                  <div className="col-md-12 mb-3">
                    <div className="action-buttons">
                      {['stopped', 'stopping'].includes(instanceDetails.state?.toLowerCase()) && (
                        <Button 
                          variant="success" 
                          onClick={() => handleInstanceAction('start', instanceDetails.region, instanceDetails.instanceId)}
                          disabled={actionInProgress}
                          className="me-2"
                        >
                          Start Instance
                        </Button>
                      )}
                      
                      {['running', 'pending'].includes(instanceDetails.state?.toLowerCase()) && (
                        <Button 
                          variant="warning" 
                          onClick={() => handleInstanceAction('stop', instanceDetails.region, instanceDetails.instanceId)}
                          disabled={actionInProgress}
                          className="me-2"
                        >
                          Stop Instance
                        </Button>
                      )}
                      
                      {['running'].includes(instanceDetails.state?.toLowerCase()) && (
                        <Button 
                          variant="secondary" 
                          onClick={() => handleInstanceAction('reboot', instanceDetails.region, instanceDetails.instanceId)}
                          disabled={actionInProgress}
                        >
                          Reboot Instance
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
                
                <table className="table">
                  <tbody>
                    <tr>
                      <th>Instance ID</th>
                      <td>{instanceDetails.instanceId}</td>
                    </tr>
                    <tr>
                      <th>Region</th>
                      <td>{instanceDetails.region}</td>
                    </tr>
                    <tr>
                      <th>Instance Type</th>
                      <td>{instanceDetails.instanceType}</td>
                    </tr>
                    <tr>
                      <th>Launch Time</th>
                      <td>{new Date(instanceDetails.launchTime).toLocaleString()}</td>
                    </tr>
                    <tr>
                      <th>Public IP</th>
                      <td>{instanceDetails.publicIpAddress || 'None'}</td>
                    </tr>
                    <tr>
                      <th>Private IP</th>
                      <td>{instanceDetails.privateIpAddress}</td>
                    </tr>
                    <tr>
                      <th>VPC</th>
                      <td>{instanceDetails.vpcId}</td>
                    </tr>
                    <tr>
                      <th>Subnet</th>
                      <td>{instanceDetails.subnetId}</td>
                    </tr>
                    <tr>
                      <th>Security Groups</th>
                      <td>
                        {instanceDetails.securityGroups?.map(sg => (
                          <div key={sg.groupId}>{sg.groupName} ({sg.groupId})</div>
                        ))}
                      </td>
                    </tr>
                    <tr>
                      <th>Tags</th>
                      <td>
                        {instanceDetails.tags?.map(tag => (
                          <div key={tag.key} className="badge bg-light text-dark me-1 mb-1">
                            {tag.key}: {tag.value}
                          </div>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center p-4">
                <p>No instance details available</p>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

export default AwsEc2Dashboard;
