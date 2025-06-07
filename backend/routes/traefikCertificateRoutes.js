const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Subdomain = require('../models/Subdomain');
const { protect } = require('../middleware/authMiddleware');
const traefikManager = require('../services/traefikManager');

// @route   GET /api/traefik-certificates
// @desc    Get all certificates for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .populate('subdomainId')
      .sort('-createdAt');
    
    res.json(certificates);
  } catch (error) {
    console.error(`Error fetching certificates: ${error.message}`);
    res.status(500).json({ message: 'Error fetching certificates', error: error.message });
  }
});

// @route   GET /api/traefik-certificates/:id
// @desc    Get a certificate by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('subdomainId');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    console.error(`Error fetching certificate: ${error.message}`);
    res.status(500).json({ message: 'Error fetching certificate', error: error.message });
  }
});

// @route   POST /api/traefik-certificates
// @desc    Issue a new SSL certificate for a subdomain using Traefik
// @access  Private
router.post('/', protect, async (req, res) => {
  const { subdomainId, applicationPort } = req.body;
  
  try {
    // Get subdomain
    const subdomain = await Subdomain.findOne({ 
      _id: subdomainId,
      userId: req.user._id
    });
    
    if (!subdomain) {
      return res.status(404).json({ message: 'Subdomain not found' });
    }
    
    // Check if certificate already exists for this subdomain
    const existingCert = await Certificate.findOne({ subdomainId });
    if (existingCert && ['pending', 'issued', 'installed'].includes(existingCert.status)) {
      return res.status(400).json({ 
        message: 'Certificate already exists for this subdomain',
        certificateId: existingCert._id,
        status: existingCert.status
      });
    }
    
    // Full domain name
    const domain = `${subdomain.name}.${subdomain.parentDomain}`;
    
    // If applicationPort was provided, update the subdomain first
    if (applicationPort) {
      console.log(`Setting application port for ${domain} to ${applicationPort}`);
      subdomain.applicationPort = applicationPort;
      await subdomain.save();
    }
    
    // Create new certificate record
    const certificate = await Certificate.create({
      userId: req.user._id,
      subdomainId,
      domain,
      status: 'pending'
    });
    
    try {
      // Update the ACME email configuration with the user's email
      await traefikManager.updateAcmeEmail(req.user.email);
      
      // Generate Traefik router configuration
      await traefikManager.generateRouterConfig(subdomain);
      
      // Update certificate status
      certificate.status = 'issued';
      certificate.issueDate = Date.now();
      certificate.expiryDate = Date.now() + (90 * 24 * 60 * 60 * 1000); // 90 days
      await certificate.save();
      
      res.status(201).json({
        message: 'Certificate configured successfully with Traefik',
        certificateId: certificate._id,
        domain
      });
    } catch (error) {
      console.error(`Traefik certificate configuration error: ${error.message}`);
      
      // Update certificate status to error
      certificate.status = 'error';
      certificate.errorMessage = error.message;
      await certificate.save();
      
      res.status(500).json({
        message: 'Failed to configure certificate with Traefik',
        error: error.message
      });
    }
  } catch (error) {
    console.error(`Certificate route error: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to process certificate request', 
      error: error.message
    });
  }
});

// @route   DELETE /api/traefik-certificates/:id
// @desc    Delete a certificate and its Traefik configuration
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('subdomainId');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    // Remove the Traefik router configuration if it exists
    if (certificate.subdomainId && certificate.subdomainId.traefikRouter) {
      await traefikManager.removeRouterConfig(certificate.subdomainId);
    }
    
    // Delete the certificate record
    await Certificate.findByIdAndDelete(certificate._id);
    
    res.json({ message: 'Certificate deleted successfully' });
  } catch (error) {
    console.error(`Error deleting certificate: ${error.message}`);
    res.status(500).json({ message: 'Error deleting certificate', error: error.message });
  }
});

module.exports = router; 