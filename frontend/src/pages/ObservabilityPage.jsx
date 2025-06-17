import React from 'react';
import { Box, Typography, Container } from '@mui/material';
import ObservabilityDashboard from '../components/dashboards/ObservabilityDashboard';

const ObservabilityPage = () => {
  return (
    <Container maxWidth="xl">
      <Box sx={{ my: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Observability Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Monitor system performance, service health, and certificate status
        </Typography>
      </Box>

      <ObservabilityDashboard />
    </Container>
  );
};

export default ObservabilityPage; 