import React, { useState } from 'react';
import { Box, Tabs, Tab, Paper } from '@mui/material';
import MetricsDashboard from './MetricsDashboard';
import HealthDashboard from './HealthDashboard';
import CertificateVisualizations from './CertificateVisualizations';

const ObservabilityDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  return (
    <Box sx={{ width: '100%' }}>
      <Paper sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="observability dashboard tabs"
          variant="fullWidth"
          textColor="primary"
          indicatorColor="primary"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label="System Metrics" />
          <Tab label="Health Monitoring" />
          <Tab label="Certificate Status" />
        </Tabs>
      </Paper>

      <Box sx={{ p: 2 }}>
        {activeTab === 0 && <MetricsDashboard />}
        {activeTab === 1 && <HealthDashboard />}
        {activeTab === 2 && <CertificateVisualizations />}
      </Box>
    </Box>
  );
};

export default ObservabilityDashboard; 