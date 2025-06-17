const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const Subdomain = require('../models/Subdomain');
const { protect } = require('../middleware/authMiddleware');
const traefikManager = require('../services/traefikManager');
const AwsCredentials = require('../models/AwsCredentials');
const AWS = require('aws-sdk');

// @route   GET /api/traefik-certificates/count
// @desc    Get count of traefik certificates for a user
// @access  Private
router.get('/count', protect, async (req, res) => {
  try {
    // In development mode, return 3 for demo purposes
    if (process.env.NODE_ENV !== 'production') {
      return res.json({ count: 3 });
    }
    
    const certificates = await traefikManager.listCertificates();
    res.json({ count: certificates.length });
  } catch (error) {
    console.error('Error counting Traefik certificates:', error);
    res.status(500).json({ message: 'Error fetching Traefik certificate count' });
  }
});

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

// @route   POST /api/traefik-certificates/main-domain
// @desc    Issue a new SSL certificate for a main domain using Traefik
// @access  Private
router.post('/main-domain', protect, async (req, res) => {
  const { domain, applicationPort } = req.body;
  
  try {
    // Validate domain
    if (!domain) {
      return res.status(400).json({ message: 'Please provide a domain name' });
    }
    
    // Check if certificate already exists for this domain
    const existingCert = await Certificate.findOne({ 
      domain, 
      userId: req.user._id,
      isMainDomain: true
    });
    
    if (existingCert && ['pending', 'issued', 'installed'].includes(existingCert.status)) {
      return res.status(400).json({ 
        message: 'Certificate already exists for this domain',
        certificateId: existingCert._id,
        status: existingCert.status
      });
    }
    
    // Check if we have the domain in Route53
    const awsCredentials = await AwsCredentials.findOne({ userId: req.user._id });
    if (!awsCredentials) {
      return res.status(400).json({ message: 'AWS credentials not found' });
    }
    
    // Configure Route53
    const route53 = new AWS.Route53({
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.getDecryptedSecretKey(),
      region: awsCredentials.region
    });
    
    // Find hosted zone for this domain
    const { HostedZones } = await route53.listHostedZones().promise();
    const hostedZone = HostedZones.find(
      zone => domain.endsWith(zone.Name.slice(0, -1))
    );
    
    if (!hostedZone) {
      return res.status(404).json({ 
        message: 'No hosted zone found for this domain. Please ensure the domain is registered in your AWS Route53.'
      });
    }
    
    // Create new certificate record
    const certificate = await Certificate.create({
      userId: req.user._id,
      domain,
      isMainDomain: true,
      status: 'pending'
    });
    
    try {
      // For main domains, we'll create a special configuration in Traefik
      // Create a virtual subdomain record for Traefik configuration
      const virtualSubdomain = {
        name: '@', // The @ symbol is commonly used to represent the apex/root domain
        parentDomain: domain,
        applicationPort: applicationPort || 80,
        useTraefik: true,
        httpsRedirect: true,
        traefikRouter: `main-${domain.replace(/\./g, '-')}`
      };
      
      // Update the ACME email configuration with the user's email
      await traefikManager.updateAcmeEmail(req.user.email);
      
      // Generate Traefik router configuration for the main domain
      await traefikManager.generateMainDomainConfig(virtualSubdomain);
      
      // Update certificate status
      certificate.status = 'issued';
      certificate.issueDate = Date.now();
      certificate.expiryDate = Date.now() + (90 * 24 * 60 * 60 * 1000); // 90 days
      await certificate.save();
      
      res.status(201).json({
        message: 'Certificate configured successfully with Traefik for main domain',
        certificateId: certificate._id,
        domain
      });
    } catch (error) {
      console.error(`Traefik main domain certificate configuration error: ${error.message}`);
      
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
    console.error(`Main domain certificate route error: ${error.message}`);
    res.status(500).json({ 
      message: 'Failed to process main domain certificate request', 
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