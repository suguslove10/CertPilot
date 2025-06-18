import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  Card, 
  CardContent, 
  Typography, 
  Grid, 
  Box, 
  CircularProgress,
  Tabs,
  Tab,
  Alert,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  BarChart,
  Bar 
} from 'recharts';

const MetricsDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(10000); // 10 seconds (reduced from 30)

  useEffect(() => {
    console.log('MetricsDashboard component mounted');
    fetchMetrics();

    // Set up refresh interval
    const intervalId = setInterval(fetchMetrics, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      console.log('Fetching metrics data from API...');
      
      // Add timestamp to prevent caching
      const timestamp = new Date().getTime();
      const apiUrl = `/metrics?_t=${timestamp}`;
      
      console.log('API URL:', apiUrl);
      
      const response = await api.get(apiUrl);
      console.log('Metrics data received:', response.data);
      setMetrics(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching metrics:', err);
      console.error('Error details:', err.response ? err.response.data : 'No response data');
      console.error('Error status:', err.response ? err.response.status : 'No status');
      setError(`Failed to load metrics data: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  // Format memory for display (bytes to MB)
  const formatMemory = (bytes) => {
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Format timestamp for charts
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  };

  if (loading && !metrics) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }}>
        {error}
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Performance Metrics Dashboard
      </Typography>
      
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs value={activeTab} onChange={handleTabChange} aria-label="metrics tabs">
          <Tab label="System Performance" />
          <Tab label="Database" />
          <Tab label="Certificates" />
        </Tabs>
      </Box>

      {/* System Performance Tab */}
      {activeTab === 0 && metrics && (
        <Grid container spacing={3}>
          {/* CPU Usage Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  CPU Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    Current Load Average (1m, 5m, 15m):
                  </Typography>
                  <Typography>
                    {metrics.current?.system?.cpu?.load?.join(', ')}
                  </Typography>
                </Box>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart
                    data={metrics.history?.system?.map(m => ({
                      timestamp: m.timestamp,
                      load1m: m.cpu?.load?.[0],
                      load5m: m.cpu?.load?.[1],
                      load15m: m.cpu?.load?.[2]
                    }))}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={formatTimestamp} />
                    <YAxis />
                    <Tooltip labelFormatter={val => formatTimestamp(val)} />
                    <Legend />
                    <Line type="monotone" dataKey="load1m" stroke="#8884d8" name="1m Load" />
                    <Line type="monotone" dataKey="load5m" stroke="#82ca9d" name="5m Load" />
                    <Line type="monotone" dataKey="load15m" stroke="#ffc658" name="15m Load" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </Grid>

          {/* Memory Usage Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Memory Usage
                </Typography>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    System Memory:
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Box sx={{ width: '100%', mr: 1 }}>
                      <LinearProgress 
                        variant="determinate" 
                        value={(metrics.current?.system?.memory?.used / metrics.current?.system?.memory?.total) * 100} 
                        sx={{ height: 10, borderRadius: 5 }}
                      />
                    </Box>
                    <Box sx={{ minWidth: 35 }}>
                      <Typography variant="body2" color="text.secondary">
                        {((metrics.current?.system?.memory?.used / metrics.current?.system?.memory?.total) * 100).toFixed(0)}%
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="body2">
                    Used: {formatMemory(metrics.current?.system?.memory?.used)} / 
                    Total: {formatMemory(metrics.current?.system?.memory?.total)}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                  Process Memory Usage:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={`RSS: ${formatMemory(metrics.current?.system?.memory?.processUsage?.rss)}`}
                      secondary="Resident Set Size - Memory allocated for the process"
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={`Heap Used: ${formatMemory(metrics.current?.system?.memory?.processUsage?.heapUsed)}`}
                      secondary={`Heap Total: ${formatMemory(metrics.current?.system?.memory?.processUsage?.heapTotal)}`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>

          {/* Uptime Card */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Uptime
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={`System: ${(metrics.current?.system?.uptime?.system / 3600).toFixed(2)} hours`}
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemText 
                      primary={`Process: ${(metrics.current?.system?.uptime?.process / 3600).toFixed(2)} hours`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Database Tab */}
      {activeTab === 1 && metrics && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Database Status
                </Typography>
                <Alert 
                  severity={
                    metrics.current?.database?.connection?.status === 'connected' 
                      ? 'success' 
                      : 'error'
                  }
                  sx={{ mb: 2 }}
                >
                  MongoDB is {metrics.current?.database?.connection?.status}
                </Alert>
                <Typography variant="body2" color="text.secondary">
                  Collection Stats:
                </Typography>
                <List dense>
                  <ListItem>
                    <ListItemText 
                      primary={`Certificates: ${metrics.current?.database?.collections?.certificates || 0}`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {/* Certificates Tab */}
      {activeTab === 2 && metrics && (
        <Grid container spacing={3}>
          {/* Certificate Status Chart */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Certificate Status
                </Typography>
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(metrics.current?.certificates?.counts?.byStatus || {}).map(([status, count]) => ({
                        status,
                        count
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="count" fill="#8884d8" name="Certificates" />
                    </BarChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Certificate Expiration */}
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Certificate Expiration
                </Typography>
                <List>
                  <ListItem>
                    <ListItemText 
                      primary={`Expiring in 7 days: ${metrics.current?.certificates?.expiration?.expiringIn7Days || 0}`} 
                      primaryTypographyProps={{ color: 'error' }}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary={`Expiring in 30 days: ${metrics.current?.certificates?.expiration?.expiringIn30Days || 0}`}
                      primaryTypographyProps={{ color: 'warning.main' }}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary={`Expired: ${metrics.current?.certificates?.expiration?.expired || 0}`}
                      primaryTypographyProps={{ color: 'error', fontWeight: 'bold' }}
                    />
                  </ListItem>
                  <Divider component="li" />
                  <ListItem>
                    <ListItemText 
                      primary={`Total Certificates: ${metrics.current?.certificates?.counts?.total || 0}`}
                    />
                  </ListItem>
                </List>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {metrics ? new Date(metrics.current?.system?.timestamp).toLocaleString() : 'Never'}
          {loading && <CircularProgress size={10} sx={{ ml: 1 }} />}
        </Typography>
      </Box>
    </Box>
  );
};

export default MetricsDashboard; 