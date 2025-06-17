import React, { useState, useEffect } from 'react';
import { Card, Button, Table, Badge, Spinner, Alert, Accordion } from 'react-bootstrap';
import axios from 'axios';

const ServerDetection = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [servers, setServers] = useState({ 
    docker: [], 
    host: [], 
    totalServers: 0,
    dockerDetectionSkipped: false,
    dockerSkipReason: null
  });
  const [lastScanTime, setLastScanTime] = useState(null);

  // Function to run server detection
  const detectServers = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.get('/api/server-detection');
      setServers(response.data);
      setLastScanTime(new Date());
    } catch (err) {
      console.error('Error detecting servers:', err);
      setError(err.response?.data?.message || 'Failed to detect web servers');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Get badge variant based on server type
  const getServerBadgeVariant = (serverType) => {
    const types = {
      'Nginx': 'success',
      'Apache': 'danger',
      'Node.js': 'info',
      'Traefik': 'warning',
      'Caddy': 'primary',
      'Tomcat': 'secondary'
    };
    
    return types[serverType] || 'light';
  };

  return (
    <Card className="mb-4">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <span>Web Server Detection</span>
        <Button 
          variant="primary" 
          size="sm" 
          onClick={detectServers} 
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="mr-1" />
              <span className="ml-2">Scanning...</span>
            </>
          ) : (
            'Scan Now'
          )}
        </Button>
      </Card.Header>
      <Card.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        
        <div className="mb-3 small text-muted">
          Last scan: {formatTimestamp(lastScanTime)}
        </div>
        
        {lastScanTime && (
          <>
            <h5>Detection Results</h5>
            <p>
              Found <strong>{servers.totalServers}</strong> web servers:
              <Badge bg="info" className="ms-2">{servers.docker.length} in Docker</Badge>
              <Badge bg="warning" className="ms-2">{servers.host.length} on Host</Badge>
            </p>
            
            {servers.dockerDetectionSkipped && (
              <Alert variant="warning" className="mb-3">
                <b>Docker detection was skipped:</b> {servers.dockerSkipReason}
                <hr />
                <small>
                  To enable Docker detection, please refer to the INSTALLATION.md file for configuration instructions.
                  This requires mounting the Docker socket into the container.
                </small>
              </Alert>
            )}
            
            <Accordion defaultActiveKey="0" className="mb-3">
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  Docker Web Servers ({servers.docker.length})
                  {servers.dockerDetectionSkipped && <Badge bg="warning" className="ms-2">Limited</Badge>}
                </Accordion.Header>
                <Accordion.Body>
                  {servers.dockerDetectionSkipped ? (
                    <Alert variant="warning">
                      Docker container detection is disabled. To enable, please mount the Docker socket into the container.
                      <div className="mt-2">
                        <small>See INSTALLATION.md for configuration instructions.</small>
                      </div>
                    </Alert>
                  ) : servers.docker.length === 0 ? (
                    <Alert variant="info">No web servers detected in Docker containers</Alert>
                  ) : (
                    <Table striped bordered hover responsive size="sm">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Container Name</th>
                          <th>Image</th>
                          <th>Ports</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servers.docker.map((server, index) => (
                          <tr key={`docker-${index}`}>
                            <td>
                              <Badge bg={getServerBadgeVariant(server.type)}>
                                {server.type}
                              </Badge>
                            </td>
                            <td>{server.name}</td>
                            <td>{server.image}</td>
                            <td>{server.ports.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Accordion.Body>
              </Accordion.Item>
              
              <Accordion.Item eventKey="1">
                <Accordion.Header>Host Web Servers ({servers.host.length})</Accordion.Header>
                <Accordion.Body>
                  {servers.host.length === 0 ? (
                    <Alert variant="info">No web servers detected on the host system</Alert>
                  ) : (
                    <Table striped bordered hover responsive size="sm">
                      <thead>
                        <tr>
                          <th>Type</th>
                          <th>Process Name</th>
                          <th>PID</th>
                          <th>Ports</th>
                        </tr>
                      </thead>
                      <tbody>
                        {servers.host.map((server, index) => (
                          <tr key={`host-${index}`}>
                            <td>
                              <Badge bg={getServerBadgeVariant(server.type)}>
                                {server.type}
                              </Badge>
                            </td>
                            <td>{server.name}</td>
                            <td>{server.pid}</td>
                            <td>{server.ports.join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
            
            <Alert variant="secondary">
              <small>
                <strong>Note:</strong> This scan checks for common web servers running on standard ports (80, 443, 8080, 8443, 3000, 5000).
                Both Docker containers and host-level processes are examined.
              </small>
            </Alert>
          </>
        )}
        
        {!lastScanTime && !loading && (
          <Alert variant="info">
            Click "Scan Now" to detect web servers running on this machine
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default ServerDetection; 