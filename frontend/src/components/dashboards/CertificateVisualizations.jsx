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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid
} from 'recharts';

const CertificateVisualizations = () => {
  const [certificateData, setCertificateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Colors for charts
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
  const STATUS_COLORS = {
    'issued': '#4caf50',
    'pending': '#ff9800',
    'expired': '#f44336',
    'revoked': '#9e9e9e',
    'installed': '#2196f3',
    'error': '#d32f2f'
  };
  
  const EXPIRY_COLORS = {
    'expired': '#f44336',
    'critical': '#ff9800',
    'warning': '#ffeb3b',
    'healthy': '#4caf50',
    'unknown': '#9e9e9e'
  };

  useEffect(() => {
    fetchCertificateData();
  }, []);

  const fetchCertificateData = async () => {
    try {
      setLoading(true);
      setError(null); // Clear previous errors
      console.log('Fetching certificate data from API...');
      const response = await axios.get('/api/certificate-lifecycle/report');
      console.log('Certificate data response:', response.data);
      
      // Handle empty arrays or null/undefined values
      if (!response.data || (Array.isArray(response.data) && response.data.length === 0)) {
        console.log('No certificate data returned from API');
        setCertificateData([]);
        setError('No certificates found. Please create certificates first.');
      } else {
        setCertificateData(response.data);
      }
    } catch (err) {
      console.error('Error fetching certificate data:', err);
      setError('Failed to load certificate data');
    } finally {
      setLoading(false);
    }
  };

  // Format timestamp for display
  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  // Group certificates by status
  const getCertificatesByStatus = () => {
    if (!certificateData) return [];
    
    const statusGroups = {};
    certificateData.forEach(cert => {
      if (!statusGroups[cert.status]) {
        statusGroups[cert.status] = 0;
      }
      statusGroups[cert.status]++;
    });
    
    // Filter out zero-value categories
    return Object.entries(statusGroups)
      .filter(([status, count]) => count > 0)
      .map(([status, count]) => ({
        name: status,
        value: count
      }));
  };

  // Group certificates by expiration category
  const getCertificatesByExpiry = () => {
    if (!certificateData) return [];
    
    const expiryGroups = {
      expired: 0,
      critical: 0,
      warning: 0,
      healthy: 0,
      unknown: 0
    };
    
    certificateData.forEach(cert => {
      expiryGroups[cert.statusCategory]++;
    });
    
    // Only include categories with non-zero values
    return Object.entries(expiryGroups)
      .filter(([category, count]) => count > 0)
      .map(([category, count]) => ({
        name: category,
        value: count
      }));
  };

  // Calculate upcoming expirations
  const getUpcomingExpirations = () => {
    if (!certificateData) return [];
    
    return certificateData
      .filter(cert => cert.daysUntilExpiry !== null && cert.daysUntilExpiry > 0 && cert.daysUntilExpiry <= 90)
      .sort((a, b) => a.daysUntilExpiry - b.daysUntilExpiry)
      .slice(0, 10); // Get top 10 upcoming
  };

  // Custom label for pie chart that only shows for non-zero values
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name, value }) => {
    // Don't render label if value is 0
    if (value === 0 || percent === 0) return null;
    
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text 
        x={x} 
        y={y} 
        fill="#000000" 
        textAnchor={x > cx ? 'start' : 'end'} 
        dominantBaseline="central"
      >
        {`${name} (${(percent * 100).toFixed(0)}%)`}
      </text>
    );
  };

  if (loading && !certificateData) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ my: 2 }} action={
        <Button color="inherit" size="small" onClick={fetchCertificateData}>
          Retry
        </Button>
      }>
        {error}
      </Alert>
    );
  }

  // Handle empty data set
  if (!loading && (!certificateData || certificateData.length === 0)) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        No certificate data available. Create certificates to view analytics.
      </Alert>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <Typography variant="h4" gutterBottom>
        Certificate Status Visualizations
      </Typography>

      <Grid container spacing={3}>
        {/* Certificate Status Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom align="center">
                Certificate Status Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCertificatesByStatus().filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCertificatesByStatus().filter(item => item.value > 0).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend formatter={(value) => {
                      // Only show legend items for non-zero values
                      const item = getCertificatesByStatus().find(item => item.name === value);
                      return item && item.value > 0 ? value : '';
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Certificate Health Distribution */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom align="center">
                Certificate Health Distribution
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={getCertificatesByExpiry().filter(item => item.value > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {getCertificatesByExpiry().filter(item => item.value > 0).map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={EXPIRY_COLORS[entry.name] || COLORS[index % COLORS.length]} 
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend formatter={(value) => {
                      // Only show legend items for non-zero values
                      const item = getCertificatesByExpiry().find(item => item.name === value);
                      return item && item.value > 0 ? value : '';
                    }} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Expiration Timeline */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Certificate Expiration Timeline
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Number of certificates expiring in the next 90 days
              </Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { range: '0-7 days', count: certificateData?.filter(c => c.daysUntilExpiry >= 0 && c.daysUntilExpiry <= 7).length || 0, color: '#f44336' },
                      { range: '8-30 days', count: certificateData?.filter(c => c.daysUntilExpiry >= 8 && c.daysUntilExpiry <= 30).length || 0, color: '#ff9800' },
                      { range: '31-60 days', count: certificateData?.filter(c => c.daysUntilExpiry >= 31 && c.daysUntilExpiry <= 60).length || 0, color: '#ffeb3b' },
                      { range: '61-90 days', count: certificateData?.filter(c => c.daysUntilExpiry >= 61 && c.daysUntilExpiry <= 90).length || 0, color: '#4caf50' }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="count" name="Number of Certificates" fill="#8884d8">
                      {[
                        { range: '0-7 days', count: 0, color: '#f44336' },
                        { range: '8-30 days', count: 0, color: '#ff9800' },
                        { range: '31-60 days', count: 0, color: '#ffeb3b' },
                        { range: '61-90 days', count: 0, color: '#4caf50' }
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Upcoming Expirations */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Upcoming Certificate Expirations
              </Typography>
              <TableContainer component={Paper} sx={{ mt: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Domain</TableCell>
                      <TableCell>Days Left</TableCell>
                      <TableCell>Expiry Date</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Health</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {getUpcomingExpirations().map((cert) => (
                      <TableRow key={cert.id}>
                        <TableCell>{cert.domain}</TableCell>
                        <TableCell>{cert.daysUntilExpiry}</TableCell>
                        <TableCell>{formatDate(cert.expiryDate)}</TableCell>
                        <TableCell>
                          <Chip 
                            label={cert.status} 
                            size="small"
                            sx={{ 
                              bgcolor: STATUS_COLORS[cert.status] || '#9e9e9e',
                              color: 'white'
                            }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={cert.statusCategory} 
                            size="small"
                            sx={{ 
                              bgcolor: EXPIRY_COLORS[cert.statusCategory] || '#9e9e9e',
                              color: cert.statusCategory === 'warning' ? 'black' : 'white'
                            }}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                    {getUpcomingExpirations().length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} align="center">
                          No upcoming expirations within the next 90 days
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Typography variant="caption" color="text.secondary">
          Last updated: {new Date().toLocaleString()}
          {loading && <CircularProgress size={10} sx={{ ml: 1 }} />}
        </Typography>
      </Box>
    </Box>
  );
};

export default CertificateVisualizations; 