import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import ObservabilityDashboard from '../components/dashboards/ObservabilityDashboard';

const ObservabilityPage = () => {
  return (
    <Container fluid>
      <Row className="mb-4">
        <Col>
          <h1>Observability Dashboard</h1>
          <p className="text-muted">
            Monitor system performance, service health, and certificate status
          </p>
        </Col>
      </Row>

      <Row>
        <Col>
          <ObservabilityDashboard />
        </Col>
      </Row>
    </Container>
  );
};

export default ObservabilityPage; 