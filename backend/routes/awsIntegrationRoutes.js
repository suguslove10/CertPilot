const express = require('express');
const router = express.Router();
const awsInstanceService = require('../services/awsInstanceService');
const loadBalancerService = require('../services/loadBalancerService');
const acmService = require('../services/acmService');
const { verifyAwsCredentials } = require('../middleware/awsCredentialsMiddleware');

// Middleware to check AWS credentials
router.use(async (req, res, next) => {
  try {
    const verified = await verifyAwsCredentials();
    if (verified) {
      next();
    } else {
      res.status(401).json({ message: 'AWS credentials not configured. Please set them up first.' });
    }
  } catch (error) {
    console.error('Error verifying AWS credentials:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========== EC2 Instance Routes ==========

/**
 * Get all EC2 instances
 * GET /api/aws-integration/ec2/instances
 */
router.get('/ec2/instances', async (req, res) => {
  try {
    const instances = await awsInstanceService.getAllInstances();
    res.json(instances);
  } catch (error) {
    console.error('Error fetching EC2 instances:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get instance details
 * GET /api/aws-integration/ec2/instances/:region/:instanceId
 */
router.get('/ec2/instances/:region/:instanceId', async (req, res) => {
  try {
    const { region, instanceId } = req.params;
    const instanceDetails = await awsInstanceService.getInstanceDetails({ region, instanceId });
    res.json(instanceDetails);
  } catch (error) {
    console.error('Error fetching instance details:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Start instance
 * POST /api/aws-integration/ec2/instances/:region/:instanceId/start
 */
router.post('/ec2/instances/:region/:instanceId/start', async (req, res) => {
  try {
    const { region, instanceId } = req.params;
    const result = await awsInstanceService.startInstance({ region, instanceId });
    res.json(result);
  } catch (error) {
    console.error('Error starting instance:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Stop instance
 * POST /api/aws-integration/ec2/instances/:region/:instanceId/stop
 */
router.post('/ec2/instances/:region/:instanceId/stop', async (req, res) => {
  try {
    const { region, instanceId } = req.params;
    const result = await awsInstanceService.stopInstance({ region, instanceId });
    res.json(result);
  } catch (error) {
    console.error('Error stopping instance:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Reboot instance
 * POST /api/aws-integration/ec2/instances/:region/:instanceId/reboot
 */
router.post('/ec2/instances/:region/:instanceId/reboot', async (req, res) => {
  try {
    const { region, instanceId } = req.params;
    const result = await awsInstanceService.rebootInstance({ region, instanceId });
    res.json(result);
  } catch (error) {
    console.error('Error rebooting instance:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========== Load Balancer Routes ==========

/**
 * Get all load balancers
 * GET /api/aws-integration/load-balancers
 */
router.get('/load-balancers', async (req, res) => {
  try {
    const loadBalancers = await loadBalancerService.getAllLoadBalancers();
    res.json(loadBalancers);
  } catch (error) {
    console.error('Error fetching load balancers:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get load balancer certificates
 * GET /api/aws-integration/load-balancers/certificates
 */
router.get('/load-balancers/certificates', async (req, res) => {
  try {
    const certificates = await loadBalancerService.getLoadBalancerCertificates();
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching load balancer certificates:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get load balancer details
 * GET /api/aws-integration/load-balancers/:region/:type/:name
 */
router.get('/load-balancers/:region/:type/:name', async (req, res) => {
  try {
    const { region, type, name } = req.params;
    const loadBalancerDetails = await loadBalancerService.getLoadBalancerDetails({ 
      region, 
      name, 
      type 
    });
    res.json(loadBalancerDetails);
  } catch (error) {
    console.error('Error fetching load balancer details:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Update certificate on load balancer
 * POST /api/aws-integration/load-balancers/update-certificate
 */
router.post('/load-balancers/update-certificate', async (req, res) => {
  try {
    const { region, listenerArn, certificateArn, loadBalancerName, loadBalancerPort } = req.body;
    
    if (!region || (!listenerArn && (!loadBalancerName || !loadBalancerPort)) || !certificateArn) {
      return res.status(400).json({ 
        message: 'Missing required parameters. Please provide region, certificateArn, and either listenerArn or both loadBalancerName and loadBalancerPort.' 
      });
    }
    
    const result = await loadBalancerService.updateCertificate({
      region,
      listenerArn,
      certificateArn,
      loadBalancerName,
      loadBalancerPort
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error updating load balancer certificate:', error);
    res.status(500).json({ message: error.message });
  }
});

// ========== ACM Certificate Routes ==========

/**
 * Get all ACM certificates
 * GET /api/aws-integration/acm/certificates
 */
router.get('/acm/certificates', async (req, res) => {
  try {
    const certificates = await acmService.getAllCertificates();
    res.json(certificates);
  } catch (error) {
    console.error('Error fetching ACM certificates:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Request a new certificate
 * POST /api/aws-integration/acm/certificates/request
 */
router.post('/acm/certificates/request', async (req, res) => {
  try {
    const { domainName, subjectAlternativeNames, validationMethod, region, tags } = req.body;
    
    if (!domainName || !region) {
      return res.status(400).json({ message: 'Domain name and region are required' });
    }
    
    const result = await acmService.requestCertificate({
      domainName,
      subjectAlternativeNames,
      validationMethod,
      region,
      tags
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error requesting certificate:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Get certificate details
 * GET /api/aws-integration/acm/certificates/:region/:certificateArn
 */
router.get('/acm/certificates/:region/:certificateArn', async (req, res) => {
  try {
    const { region, certificateArn } = req.params;
    const certificateDetails = await acmService.getCertificateDetails({ 
      region, 
      certificateArn 
    });
    res.json(certificateDetails);
  } catch (error) {
    console.error('Error fetching certificate details:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Import a certificate
 * POST /api/aws-integration/acm/certificates/import
 */
router.post('/acm/certificates/import', async (req, res) => {
  try {
    const { certificate, privateKey, certificateChain, tags, region } = req.body;
    
    if (!certificate || !privateKey || !region) {
      return res.status(400).json({ message: 'Certificate, private key, and region are required' });
    }
    
    const result = await acmService.importCertificate({
      certificate,
      privateKey,
      certificateChain,
      tags,
      region
    });
    
    res.json(result);
  } catch (error) {
    console.error('Error importing certificate:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Delete a certificate
 * DELETE /api/aws-integration/acm/certificates/:region/:certificateArn
 */
router.delete('/acm/certificates/:region/:certificateArn', async (req, res) => {
  try {
    const { region, certificateArn } = req.params;
    const result = await acmService.deleteCertificate({ region, certificateArn });
    res.json(result);
  } catch (error) {
    console.error('Error deleting certificate:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Create DNS validation records for a certificate
 * POST /api/aws-integration/acm/certificates/:region/:certificateArn/dns-validation
 */
router.post('/acm/certificates/:region/:certificateArn/dns-validation', async (req, res) => {
  try {
    const { region, certificateArn } = req.params;
    const result = await acmService.createDnsValidationRecords({ region, certificateArn });
    res.json(result);
  } catch (error) {
    console.error('Error creating DNS validation records:', error);
    res.status(500).json({ message: error.message });
  }
});

/**
 * Renew a certificate
 * POST /api/aws-integration/acm/certificates/:region/:certificateArn/renew
 */
router.post('/acm/certificates/:region/:certificateArn/renew', async (req, res) => {
  try {
    const { region, certificateArn } = req.params;
    const result = await acmService.renewCertificate({ region, certificateArn });
    res.json(result);
  } catch (error) {
    console.error('Error renewing certificate:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
