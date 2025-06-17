const os = require('os');
const mongoose = require('mongoose');
const Certificate = require('../models/Certificate');

// In-memory storage for performance metrics
let metricsHistory = {
  system: [],
  database: [],
  certificates: []
};

// Maximum history items to keep
const MAX_HISTORY_ITEMS = 100;

/**
 * Collect system metrics
 */
const collectSystemMetrics = () => {
  const metrics = {
    timestamp: new Date(),
    cpu: {
      load: os.loadavg(),
      utilization: process.cpuUsage(),
    },
    memory: {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem(),
      processUsage: process.memoryUsage(),
    },
    uptime: {
      system: os.uptime(),
      process: process.uptime(),
    },
    network: {
      interfaces: os.networkInterfaces(),
    }
  };

  // Add to history, maintaining max size
  metricsHistory.system.push(metrics);
  if (metricsHistory.system.length > MAX_HISTORY_ITEMS) {
    metricsHistory.system.shift();
  }

  return metrics;
};

/**
 * Collect database metrics
 */
const collectDatabaseMetrics = async () => {
  try {
    // Basic MongoDB connection status
    const dbStatus = {
      timestamp: new Date(),
      connection: {
        state: mongoose.connection.readyState,
        status: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      }
    };

    // Collection counts (add more as needed)
    const certificateCount = await Certificate.countDocuments();
    
    const metrics = {
      ...dbStatus,
      collections: {
        certificates: certificateCount,
      },
    };

    // Add to history, maintaining max size
    metricsHistory.database.push(metrics);
    if (metricsHistory.database.length > MAX_HISTORY_ITEMS) {
      metricsHistory.database.shift();
    }

    return metrics;
  } catch (error) {
    console.error('Error collecting database metrics:', error);
    return {
      timestamp: new Date(),
      error: error.message,
    };
  }
};

/**
 * Collect certificate metrics
 */
const collectCertificateMetrics = async () => {
  try {
    const now = new Date();
    
    // Count certificates by status
    const statusCounts = await Certificate.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    // Create a status map for easier access
    const statusMap = statusCounts.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    // Count certificates by expiration timeframe
    const expiringIn30Days = await Certificate.countDocuments({
      expiryDate: { $lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) }
    });
    
    const expiringIn7Days = await Certificate.countDocuments({
      expiryDate: { $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) }
    });
    
    const expired = await Certificate.countDocuments({
      expiryDate: { $lt: now }
    });
    
    // Get certificate renewal stats
    const renewalStats = await Certificate.aggregate([
      { $match: { 'renewalHistory.0': { $exists: true } } },
      { $project: {
          lastRenewal: { $arrayElemAt: ['$renewalHistory', -1] }
      }},
      { $group: {
          _id: '$lastRenewal.status',
          count: { $sum: 1 }
      }}
    ]);
    
    const renewalMap = renewalStats.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {});
    
    const metrics = {
      timestamp: now,
      counts: {
        total: await Certificate.countDocuments(),
        byStatus: statusMap
      },
      expiration: {
        expiringIn30Days,
        expiringIn7Days,
        expired
      },
      renewals: renewalMap
    };
    
    // Add to history, maintaining max size
    metricsHistory.certificates.push(metrics);
    if (metricsHistory.certificates.length > MAX_HISTORY_ITEMS) {
      metricsHistory.certificates.shift();
    }
    
    return metrics;
  } catch (error) {
    console.error('Error collecting certificate metrics:', error);
    return {
      timestamp: new Date(),
      error: error.message
    };
  }
};

/**
 * Get all metrics (current and historical)
 */
const getAllMetrics = async () => {
  try {
    // Collect current metrics
    const systemMetrics = collectSystemMetrics();
    const databaseMetrics = await collectDatabaseMetrics();
    const certificateMetrics = await collectCertificateMetrics();
    
    return {
      current: {
        system: systemMetrics,
        database: databaseMetrics,
        certificates: certificateMetrics,
      },
      history: metricsHistory
    };
  } catch (error) {
    console.error('Error getting all metrics:', error);
    throw error;
  }
};

/**
 * Get current metrics snapshot
 */
const getCurrentMetrics = async () => {
  try {
    const systemMetrics = collectSystemMetrics();
    const databaseMetrics = await collectDatabaseMetrics();
    const certificateMetrics = await collectCertificateMetrics();
    
    return {
      system: systemMetrics,
      database: databaseMetrics,
      certificates: certificateMetrics,
    };
  } catch (error) {
    console.error('Error getting current metrics:', error);
    throw error;
  }
};

/**
 * Get historical metrics data
 */
const getMetricsHistory = (type = null, limit = MAX_HISTORY_ITEMS) => {
  if (type && metricsHistory[type]) {
    return metricsHistory[type].slice(-limit);
  }
  
  return metricsHistory;
};

// Generate demo metrics data for development
const generateDemoMetrics = () => {
  const now = new Date();
  
  // Create a time series of data points for the last 24 hours
  const timePoints = [];
  for (let i = 0; i < 24; i++) {
    timePoints.push(new Date(now - (23 - i) * 60 * 60 * 1000));
  }
  
  // System metrics
  const cpuUsage = timePoints.map(time => ({
    timestamp: time,
    value: 10 + Math.random() * 30, // Random between 10-40%
    type: 'cpu'
  }));
  
  const memoryUsage = timePoints.map(time => ({
    timestamp: time,
    value: 20 + Math.random() * 30, // Random between 20-50%
    type: 'memory'
  }));
  
  // Certificate metrics
  const validCerts = timePoints.map(time => ({
    timestamp: time,
    value: 3 + Math.floor(Math.random() * 2), // 3-4 valid certs
    type: 'valid'
  }));
  
  const expiringCerts = timePoints.map(time => ({
    timestamp: time,
    value: Math.floor(Math.random() * 2), // 0-1 expiring certs
    type: 'expiring'
  }));
  
  const expiredCerts = timePoints.map(time => ({
    timestamp: time,
    value: 0, // No expired certs
    type: 'expired'
  }));
  
  return {
    system: [...cpuUsage, ...memoryUsage],
    certificates: [...validCerts, ...expiringCerts, ...expiredCerts]
  };
};

/**
 * Get system metrics
 */
const getSystemMetrics = async (period = '24h') => {
  // For development, use demo data
  if (process.env.NODE_ENV !== 'production') {
    return generateDemoMetrics().system;
  }
  
  // ...original implementation...
};

/**
 * Get certificate metrics
 */
const getCertificateMetrics = async (period = '24h') => {
  // For development, use demo data
  if (process.env.NODE_ENV !== 'production') {
    return generateDemoMetrics().certificates;
  }
  
  // ...original implementation...
};

module.exports = {
  collectSystemMetrics,
  collectDatabaseMetrics,
  collectCertificateMetrics,
  getAllMetrics,
  getCurrentMetrics,
  getMetricsHistory,
  getSystemMetrics,
  getCertificateMetrics
}; 