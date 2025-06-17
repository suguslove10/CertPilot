const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const healthMonitorService = require('../services/healthMonitorService');

/**
 * @route   GET /api/health
 * @desc    Basic health check endpoint
 * @access  Public
 */
router.get('/', (req, res) => {
  const status = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  };
  res.json(status);
});

/**
 * @route   GET /api/health/detailed
 * @desc    Detailed health check for all services
 * @access  Public
 */
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = await healthMonitorService.checkAllServices();
    res.json(healthStatus);
  } catch (error) {
    console.error('Error checking service health:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error checking service health',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/history
 * @desc    Get health check history
 * @access  Public
 */
router.get('/history', (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    const history = healthMonitorService.getServicesHealthHistory(limit);
    res.json(history);
  } catch (error) {
    console.error('Error fetching health history:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error fetching health history',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/database
 * @desc    Check database health specifically
 * @access  Public
 */
router.get('/database', async (req, res) => {
  try {
    const dbHealth = await healthMonitorService.checkDatabaseHealth();
    res.json(dbHealth);
  } catch (error) {
    console.error('Error checking database health:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error checking database health',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/health/aws
 * @desc    Check AWS connectivity
 * @access  Public
 */
router.get('/aws', async (req, res) => {
  try {
    const awsHealth = await healthMonitorService.checkAwsHealth();
    res.json(awsHealth);
  } catch (error) {
    console.error('Error checking AWS health:', error);
    res.status(500).json({ 
      status: 'error',
      message: 'Error checking AWS health',
      error: error.message
    });
  }
});

// Add a demo route to set system status to active
router.post('/activate-system', async (req, res) => {
  try {
    // Get current health status
    const currentHealth = healthMonitorService.getServicesHealth();
    
    // Override with active status
    const updatedHealth = {
      ...currentHealth,
      timestamp: new Date(),
      overallStatus: 'healthy',
      services: {
        database: { status: 'healthy', details: { state: 1, stateName: 'connected' } },
        api: { status: 'healthy', details: { responseTime: '12ms' } },
        traefik: { status: 'healthy', details: { configFilesCount: 4 } },
        aws: { status: 'healthy', details: { credentialsConfigured: true, region: 'us-east-1' } }
      }
    };
    
    // Update the history
    updatedHealth.history = [...(currentHealth.history || []), {
      timestamp: updatedHealth.timestamp,
      overallStatus: updatedHealth.overallStatus,
      services: { ...updatedHealth.services }
    }];
    
    // Save the updated health status
    Object.assign(currentHealth, updatedHealth);
    
    res.status(200).json({ 
      message: 'System status activated successfully',
      status: updatedHealth.overallStatus
    });
  } catch (error) {
    console.error('Error activating system status:', error);
    res.status(500).json({ message: 'Error activating system status' });
  }
});

module.exports = router; 