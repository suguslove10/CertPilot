const express = require('express');
const router = express.Router();
const metricsService = require('../services/metricsService');

/**
 * @route   GET /api/metrics
 * @desc    Get all metrics (current and historical)
 * @access  Admin
 */
router.get('/', async (req, res) => {
  try {
    const metrics = await metricsService.getAllMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ message: 'Error fetching metrics', error: error.message });
  }
});

/**
 * @route   GET /api/metrics/current
 * @desc    Get current metrics snapshot
 * @access  Admin
 */
router.get('/current', async (req, res) => {
  try {
    const metrics = await metricsService.getCurrentMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching current metrics:', error);
    res.status(500).json({ message: 'Error fetching current metrics', error: error.message });
  }
});

/**
 * @route   GET /api/metrics/history/:type?
 * @desc    Get historical metrics data
 * @param   {string} type - Optional type of metrics (system, database, certificates)
 * @access  Admin
 */
router.get('/history/:type?', async (req, res) => {
  try {
    const type = req.params.type;
    const limit = req.query.limit ? parseInt(req.query.limit) : undefined;
    
    const metricsHistory = metricsService.getMetricsHistory(type, limit);
    res.json(metricsHistory);
  } catch (error) {
    console.error('Error fetching metrics history:', error);
    res.status(500).json({ message: 'Error fetching metrics history', error: error.message });
  }
});

/**
 * @route   GET /api/metrics/system
 * @desc    Get system metrics
 * @access  Admin
 */
router.get('/system', async (req, res) => {
  try {
    const period = req.query.period || '24h';
    const metrics = await metricsService.getSystemMetrics(period);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting system metrics:', error);
    res.status(500).json({ message: 'Error getting system metrics' });
  }
});

/**
 * @route   GET /api/metrics/database
 * @desc    Get database metrics
 * @access  Admin
 */
router.get('/database', async (req, res) => {
  try {
    const metrics = await metricsService.collectDatabaseMetrics();
    res.json(metrics);
  } catch (error) {
    console.error('Error fetching database metrics:', error);
    res.status(500).json({ message: 'Error fetching database metrics', error: error.message });
  }
});

/**
 * @route   GET /api/metrics/certificates
 * @desc    Get certificate metrics
 * @access  Admin
 */
router.get('/certificates', async (req, res) => {
  try {
    const period = req.query.period || '24h';
    const metrics = await metricsService.getCertificateMetrics(period);
    res.json(metrics);
  } catch (error) {
    console.error('Error getting certificate metrics:', error);
    res.status(500).json({ message: 'Error getting certificate metrics' });
  }
});

module.exports = router; 