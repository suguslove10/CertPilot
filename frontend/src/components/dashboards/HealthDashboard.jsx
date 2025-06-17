import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  AlertTitle,
  List,
  ListItem,
  ListItemText,
  Divider,
  IconButton,
  Tooltip,
  Chip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const HealthDashboard = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(60000); // 1 minute

  useEffect(() => {
    // Initial fetch
    fetchHealthData();

    // Set up refresh interval
    const intervalId = setInterval(fetchHealthData, refreshInterval);

    // Cleanup interval on unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/health/detailed');
      setHealthData(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching health data:', err);
      setError('Failed to load health monitoring data');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatTimestamp = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  // Get status icon based on health status
  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
        return <CheckCircleIcon fontSize="small" color="success" />;
      case 'warning':
        return <WarningIcon fontSize="small" color="warning" />;
      case 'unhealthy':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'error':
        return <ErrorIcon fontSize="small" color="error" />;
      case 'critical':
        return <ErrorIcon fontSize="small" color="error" />;
      default:
        return <InfoIcon fontSize="small" color="info" />;
    }
  };

  // Get status color for styling
  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'unhealthy':
        return 'error.main';
      case 'error':
        return 'error.main';
      case 'critical':
        return 'error.dark';
      default:
        return 'info.main';
    }
  };

  if (loading && !healthData) {
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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">
          Health Monitoring Dashboard
        </Typography>
        <Tooltip title="Refresh data">
          <IconButton onClick={fetchHealthData} disabled={loading}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Overall System Health */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            {getStatusIcon(healthData?.overallStatus)}
            <Typography variant="h5" sx={{ ml: 1 }}>
              System Status: {healthData?.overallStatus?.toUpperCase()}
            </Typography>
          </Box>
          <Alert 
            severity={
              healthData?.overallStatus === 'healthy' ? 'success' :
              healthData?.overallStatus === 'warning' ? 'warning' : 'error'
            }
          >
            <AlertTitle>
              {healthData?.overallStatus === 'healthy' ? 'All systems operational' :
               healthData?.overallStatus === 'warning' ? 'System operating with warnings' :
               'System issues detected'}
            </AlertTitle>
            Last checked: {formatTimestamp(healthData?.timestamp)}
          </Alert>
        </CardContent>
      </Card>

      {/* Service Status Cards */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Service Status
      </Typography>
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {healthData && Object.entries(healthData.services).map(([serviceName, serviceStatus]) => (
          <Grid item xs={12} sm={6} md={3} key={serviceName}>
            <Card>
              <CardContent>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  height: '100%',
                  alignItems: 'center', 
                  textAlign: 'center',
                  p: 2
                }}>
                  {getStatusIcon(serviceStatus.status)}
                  <Typography variant="h6" sx={{ mt: 1, textTransform: 'capitalize' }}>
                    {serviceName}
                  </Typography>
                  <Chip
                    label={serviceStatus.status.toUpperCase()}
                    sx={{
                      mt: 1,
                      color: 'white',
                      bgcolor: getStatusColor(serviceStatus.status)
                    }}
                    size="small"
                  />
                  {serviceStatus.status !== 'healthy' && serviceStatus.details.error && (
                    <Typography variant="body2" color="error.main" sx={{ mt: 1 }}>
                      {serviceStatus.details.error}
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Health History Chart */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Health History
      </Typography>
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box sx={{ height: 300 }}>
            {healthData?.history?.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={healthData.history.map((entry, index) => ({
                    index,
                    timestamp: entry.timestamp,
                    status: entry.overallStatus === 'healthy' ? 3 :
                            entry.overallStatus === 'warning' ? 2 :
                            entry.overallStatus === 'unhealthy' ? 1 : 0
                  }))}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(val) => formatTimestamp(val).split(', ')[1]} 
                    minTickGap={50}
                  />
                  <YAxis 
                    domain={[0, 3]} 
                    ticks={[0, 1, 2, 3]} 
                    tickFormatter={(val) => (
                      val === 3 ? 'Healthy' : 
                      val === 2 ? 'Warning' : 
                      val === 1 ? 'Unhealthy' : 
                      'Critical'
                    )}
                  />
                  <RechartsTooltip 
                    formatter={(value, name) => [
                      value === 3 ? 'Healthy' : 
                      value === 2 ? 'Warning' : 
                      value === 1 ? 'Unhealthy' : 
                      'Critical',
                      'Status'
                    ]}
                    labelFormatter={(val) => formatTimestamp(val)}
                  />
                  <Line 
                    type="stepAfter" 
                    dataKey="status" 
                    stroke="#8884d8" 
                    activeDot={{ r: 8 }} 
                    name="System Status"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                <Typography variant="body1" color="text.secondary">
                  No history data available yet
                </Typography>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>

      {/* Service Details */}
      <Typography variant="h6" sx={{ mb: 2 }}>
        Service Details
      </Typography>
      <Grid container spacing={3}>
        {healthData && Object.entries(healthData.services).map(([serviceName, serviceStatus]) => (
          <Grid item xs={12} md={6} key={`${serviceName}-details`}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, textTransform: 'capitalize' }}>
                  {serviceName} Details
                </Typography>
                <List dense>
                  {Object.entries(serviceStatus.details).map(([key, value]) => (
                    <React.Fragment key={key}>
                      <ListItem>
                        <ListItemText
                          primary={<Typography sx={{ textTransform: 'capitalize' }}>{key}</Typography>}
                          secondary={
                            typeof value === 'object' 
                              ? JSON.stringify(value) 
                              : String(value)
                          }
                        />
                      </ListItem>
                      <Divider component="li" />
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {healthData ? formatTimestamp(healthData.timestamp) : 'Never'}
          {loading && <CircularProgress size={10} sx={{ ml: 1 }} />}
        </Typography>
      </Box>
    </Box>
  );
};

export default HealthDashboard; 