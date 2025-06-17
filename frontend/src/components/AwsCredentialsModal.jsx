import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import axios from 'axios';

const AwsCredentialsModal = ({ show, onClose, onSuccess, region }) => {
  const [credentials, setCredentials] = useState({
    accessKeyId: '',
    secretAccessKey: '',
    region: region || 'ap-south-1',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const handleChange = (e) => {
    setCredentials({
      ...credentials,
      [e.target.name]: e.target.value
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post('/api/subdomains/verify-credentials', credentials);
      if (response.data.success) {
        onSuccess();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to verify AWS credentials');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Modal show={show} onHide={onClose} backdrop="static">
      <Modal.Header closeButton>
        <Modal.Title>Verify AWS Credentials</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {error && <Alert variant="danger">{error}</Alert>}
        <p>
          Your stored AWS credentials need verification to proceed. Please enter
          your AWS credentials again.
        </p>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>AWS Access Key ID</Form.Label>
            <Form.Control
              type="text"
              name="accessKeyId"
              value={credentials.accessKeyId}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>AWS Secret Access Key</Form.Label>
            <Form.Control
              type="password"
              name="secretAccessKey"
              value={credentials.secretAccessKey}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>AWS Region</Form.Label>
            <Form.Control
              type="text"
              name="region"
              value={credentials.region}
              onChange={handleChange}
              required
            />
          </Form.Group>
          
          <div className="d-grid gap-2">
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? 'Verifying...' : 'Verify Credentials'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default AwsCredentialsModal; 