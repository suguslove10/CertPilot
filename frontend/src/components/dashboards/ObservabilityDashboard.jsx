import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import MetricsDashboard from './MetricsDashboard';
import HealthDashboard from './HealthDashboard';
import CertificateVisualizations from './CertificateVisualizations';

const ObservabilityDashboard = () => {
  useEffect(() => {
    console.log('ObservabilityDashboard mounted');
  }, []);

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          System Metrics
        </Typography>
        <MetricsDashboard />
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Health Monitoring
        </Typography>
        <HealthDashboard />
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h5" component="h2" gutterBottom>
          Certificate Status
        </Typography>
        <CertificateVisualizations />
      </Paper>
    </Box>
  );
};

export default ObservabilityDashboard; 