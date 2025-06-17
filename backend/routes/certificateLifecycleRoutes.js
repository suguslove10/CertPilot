const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const certificateMonitor = require('../services/certificateMonitor');

/**
 * Get all certificates with expiration information
 * GET /api/certificate-lifecycle/expiring
 */
router.get('/expiring', async (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const now = new Date();
    const expiryDate = new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
    
    const certificates = await Certificate.find({
      status: { $in: ['issued', 'installed'] },
      expiryDate: { $lt: expiryDate, $gt: now }
    }).populate('subdomainId userId');
    
    const result = certificates.map(cert => {
      const daysLeft = Math.floor((cert.expiryDate - now) / (1000 * 60 * 60 * 24));
      
      return {
        id: cert._id,
        domain: cert.domain,
        expiryDate: cert.expiryDate,
        daysLeft,
        status: cert.status,
        subdomain: cert.subdomainId ? cert.subdomainId.name : null,
        parentDomain: cert.subdomainId ? cert.subdomainId.parentDomain : null,
        owner: cert.owner || 'Unassigned',
        tags: cert.tags || []
      };
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error fetching expiring certificates:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get certificate inventory
 * GET /api/certificate-lifecycle/inventory
 */
router.get('/inventory', async (req, res) => {
  try {
    const result = await certificateMonitor.generateCertificateReport();
    res.json(result);
  } catch (error) {
    console.error('Error fetching certificate inventory:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get alert settings for a certificate
 * GET /api/certificate-lifecycle/:id/alert-settings
 */
router.get('/:id/alert-settings', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate.alertSettings || {
      enabled: true,
      thresholds: [30, 14, 7, 3, 1],
      channels: []
    });
  } catch (error) {
    console.error('Error fetching alert settings:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update alert settings for a certificate
 * PUT /api/certificate-lifecycle/:id/alert-settings
 */
router.put('/:id/alert-settings', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Validate thresholds array
    if (req.body.thresholds && !Array.isArray(req.body.thresholds)) {
      return res.status(400).json({ message: 'Thresholds must be an array of numbers' });
    }
    
    // Validate channels array
    if (req.body.channels) {
      if (!Array.isArray(req.body.channels)) {
        return res.status(400).json({ message: 'Channels must be an array' });
      }
      
      for (const channel of req.body.channels) {
        if (!channel.type || !['email', 'webhook', 'in-app'].includes(channel.type)) {
          return res.status(400).json({ message: 'Invalid channel type' });
        }
        
        if ((channel.type === 'email' || channel.type === 'webhook') && !channel.destination) {
          return res.status(400).json({ message: `Destination required for ${channel.type} channel` });
        }
      }
    }
    
    // Update alert settings
    certificate.alertSettings = {
      enabled: req.body.enabled !== undefined ? req.body.enabled : certificate.alertSettings?.enabled || true,
      thresholds: req.body.thresholds || certificate.alertSettings?.thresholds || [30, 14, 7, 3, 1],
      channels: req.body.channels || certificate.alertSettings?.channels || []
    };
    
    await certificate.save();
    
    res.json(certificate.alertSettings);
  } catch (error) {
    console.error('Error updating alert settings:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get renewal history for a certificate
 * GET /api/certificate-lifecycle/:id/renewal-history
 */
router.get('/:id/renewal-history', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate.renewalHistory || []);
  } catch (error) {
    console.error('Error fetching renewal history:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get alert history for a certificate
 * GET /api/certificate-lifecycle/:id/alert-history
 */
router.get('/:id/alert-history', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate.alertHistory || []);
  } catch (error) {
    console.error('Error fetching alert history:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Force certificate renewal
 * POST /api/certificate-lifecycle/:id/force-renewal
 */
router.post('/:id/force-renewal', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Record renewal attempt in history
    certificate.renewalHistory = certificate.renewalHistory || [];
    certificate.renewalHistory.push({
      date: new Date(),
      status: 'pending',
      provider: req.body.provider || 'letsencrypt'
    });
    
    await certificate.save();
    
    // For now, just return success - in a real implementation, this would 
    // trigger the actual renewal process (which is outside the scope of this example)
    res.json({ 
      message: 'Certificate renewal requested',
      certificate: certificate._id,
      renewalAttempt: certificate.renewalHistory[certificate.renewalHistory.length - 1]
    });
  } catch (error) {
    console.error('Error requesting certificate renewal:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update certificate metadata (tags, category, owner, notes)
 * PUT /api/certificate-lifecycle/:id/metadata
 */
router.put('/:id/metadata', async (req, res) => {
  try {
    const certificate = await Certificate.findById(req.params.id);
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Update metadata fields
    if (req.body.tags) certificate.tags = req.body.tags;
    if (req.body.category) certificate.category = req.body.category;
    if (req.body.owner) certificate.owner = req.body.owner;
    if (req.body.notes) certificate.notes = req.body.notes;
    
    // Update custom fields if provided
    if (req.body.customFields) {
      certificate.customFields = req.body.customFields;
    }
    
    await certificate.save();
    
    res.json({
      id: certificate._id,
      tags: certificate.tags,
      category: certificate.category,
      owner: certificate.owner,
      notes: certificate.notes,
      customFields: certificate.customFields
    });
  } catch (error) {
    console.error('Error updating certificate metadata:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get certificate report data for dashboard
 * GET /api/certificate-lifecycle/report
 */
router.get('/report', async (req, res) => {
  try {
    console.log('Certificate report endpoint called');
    const result = await certificateMonitor.generateCertificateReport();
    console.log('Certificate report generated, items:', result.length);
    // Return empty array instead of null or undefined if no data
    res.json(result || []);
  } catch (error) {
    console.error('Error generating certificate report:', error);
    // Return empty array instead of error to prevent frontend from breaking
    res.json([]);
  }
});

/**
 * Debug route to verify API is working
 * GET /api/certificate-lifecycle/debug
 */
router.get('/debug', (req, res) => {
  console.log('Debug endpoint called');
  res.json({ 
    status: 'ok', 
    message: 'Certificate lifecycle API is working', 
    time: new Date().toISOString() 
  });
});

/**
 * Run a certificate expiration check manually
 * POST /api/certificate-lifecycle/check-expiration
 */
router.post('/check-expiration', async (req, res) => {
  try {
    const results = await certificateMonitor.checkCertificateExpiration();
    res.json(results);
  } catch (error) {
    console.error('Error checking certificate expiration:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update certificate metadata from certificate files
 * POST /api/certificate-lifecycle/update-metadata
 */
router.post('/update-metadata', async (req, res) => {
  try {
    const results = await certificateMonitor.updateCertificateMetadata();
    res.json(results);
  } catch (error) {
    console.error('Error updating certificate metadata:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router; 