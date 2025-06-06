const express = require('express');
const router = express.Router();
const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execAsync = util.promisify(exec);
const acme = require('acme-client');
const Certificate = require('../models/Certificate');
const Subdomain = require('../models/Subdomain');
const { protect } = require('../middleware/authMiddleware');

// Directory for storing certificates
const CERT_DIR = process.env.CERT_DIR || '/etc/certpilot/certificates';

// Ensure certificate directory exists
const ensureCertDir = async () => {
  try {
    await fs.mkdir(CERT_DIR, { recursive: true });
    console.log(`Certificate directory created: ${CERT_DIR}`);
  } catch (error) {
    console.error(`Error creating certificate directory: ${error.message}`);
    throw error;
  }
};

// Initialize - ensure cert directory exists when server starts
ensureCertDir().catch(console.error);

// Function to check if domain has DNS propagated
const checkDnsPropagation = async (domain, expectedIp) => {
  try {
    // Use dig to check DNS resolution
    const { stdout } = await execAsync(`dig +short ${domain} A`);
    const resolvedIp = stdout.trim();
    
    if (!resolvedIp) {
      return { propagated: false, message: 'Domain does not resolve to any IP address yet' };
    }
    
    if (resolvedIp === expectedIp) {
      return { propagated: true, message: 'DNS has propagated successfully' };
    } else {
      return { 
        propagated: false, 
        message: `Domain resolves to ${resolvedIp}, but expected ${expectedIp}` 
      };
    }
  } catch (error) {
    console.error(`Error checking DNS propagation: ${error.message}`);
    return { propagated: false, message: `Error checking DNS: ${error.message}` };
  }
};

// Function to issue certificate using ACME client (Let's Encrypt)
const issueCertificate = async (domain, email) => {
  try {
    // Create domain directory
    const domainDir = path.join(CERT_DIR, domain);
    await fs.mkdir(domainDir, { recursive: true });
    
    // Create account key and CSR
    const accountKeyPair = await acme.forge.createPrivateKey();
    const domainKeyPair = await acme.forge.createPrivateKey();
    
    // Create ACME client
    const client = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production,
      accountKey: accountKeyPair
    });
    
    // Create account
    await client.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${email}`]
    });
    
    // Start HTTP challenge for domain verification
    const [order, authz] = await Promise.all([
      client.createOrder({ identifiers: [{ type: 'dns', value: domain }] }),
      client.getAuthorizations()
    ]);
    
    // Get HTTP challenge
    const challenge = authz[0].challenges.find(c => c.type === 'http-01');
    if (!challenge) {
      throw new Error('HTTP challenge not available');
    }
    
    // Create challenge response file
    const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
    
    // Create challenge directory
    const wellKnownDir = path.join(process.cwd(), '.well-known', 'acme-challenge');
    await fs.mkdir(wellKnownDir, { recursive: true });
    
    // Write challenge file
    const challengeFile = path.join(wellKnownDir, challenge.token);
    await fs.writeFile(challengeFile, keyAuthorization);
    
    // Verify challenge
    await client.verifyChallenge(authz[0], challenge);
    await client.completeChallenge(challenge);
    await client.waitForValidStatus(challenge);
    
    // Complete order
    const [csr] = await acme.forge.createCsr({
      commonName: domain,
      altNames: [`www.${domain}`]
    }, domainKeyPair);
    
    await client.finalizeOrder(order, csr);
    const cert = await client.getCertificate(order);
    
    // Save files
    const certPath = path.join(domainDir, 'cert.pem');
    const keyPath = path.join(domainDir, 'privkey.pem');
    const chainPath = path.join(domainDir, 'chain.pem');
    
    await Promise.all([
      fs.writeFile(certPath, cert),
      fs.writeFile(keyPath, acme.forge.getPemPrivateKey(domainKeyPair)),
      fs.writeFile(chainPath, cert) // For simplicity, using cert as chain
    ]);
    
    // Clean up challenge files
    await fs.unlink(challengeFile).catch(() => {});
    
    return {
      success: true,
      certPath,
      keyPath,
      chainPath
    };
  } catch (error) {
    console.error(`Error issuing certificate: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to install certificate to a Docker container
const installCertToContainer = async (containerId, certPath, keyPath, chainPath) => {
  try {
    // Create temp directory in container
    await execAsync(`docker exec ${containerId} mkdir -p /tmp/certs`);
    
    // Copy certificate files to container
    await execAsync(`docker cp ${certPath} ${containerId}:/tmp/certs/cert.pem`);
    await execAsync(`docker cp ${keyPath} ${containerId}:/tmp/certs/key.pem`);
    await execAsync(`docker cp ${chainPath} ${containerId}:/tmp/certs/chain.pem`);
    
    // For NGINX containers, update config and reload
    const { stdout: psOutput } = await execAsync(`docker ps -a --format "{{.ID}}:{{.Image}}" --filter "id=${containerId}"`);
    const containerInfo = psOutput.trim();
    
    if (containerInfo.toLowerCase().includes('nginx')) {
      // Create nginx config file
      const nginxConfig = `
server {
    listen 443 ssl;
    server_name _;
    
    ssl_certificate /tmp/certs/cert.pem;
    ssl_certificate_key /tmp/certs/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    location / {
        proxy_pass http://localhost:80;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}`;
      
      // Create config file and reload nginx
      await execAsync(`docker exec ${containerId} bash -c 'echo "${nginxConfig}" > /etc/nginx/conf.d/ssl.conf'`);
      await execAsync(`docker exec ${containerId} nginx -s reload`);
    }
    
    return {
      success: true,
      message: 'Certificate installed successfully'
    };
  } catch (error) {
    console.error(`Error installing certificate to container: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
};

// @route   POST /api/certificates
// @desc    Issue a new SSL certificate for a subdomain
// @access  Private
router.post('/', protect, async (req, res) => {
  const { subdomainId, containerIds } = req.body;
  
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
    
    // Check DNS propagation
    const dnsPropagation = await checkDnsPropagation(domain, subdomain.targetIp);
    if (!dnsPropagation.propagated) {
      return res.status(400).json({ 
        message: 'DNS has not propagated yet. Please try again later.',
        details: dnsPropagation.message
      });
    }
    
    // Create new certificate record
    const certificate = await Certificate.create({
      userId: req.user._id,
      subdomainId,
      domain,
      status: 'pending'
    });
    
    // Issue certificate (this can be moved to a background process)
    const certResult = await issueCertificate(domain, req.user.email);
    
    if (!certResult.success) {
      certificate.status = 'error';
      certificate.errorMessage = certResult.error;
      await certificate.save();
      
      return res.status(500).json({
        message: 'Failed to issue certificate',
        error: certResult.error,
        certificateId: certificate._id
      });
    }
    
    // Update certificate with paths
    certificate.certPath = certResult.certPath;
    certificate.keyPath = certResult.keyPath;
    certificate.chainPath = certResult.chainPath;
    certificate.status = 'issued';
    certificate.issueDate = new Date();
    // Set expiry to 90 days from now (Let's Encrypt certificates are valid for 90 days)
    certificate.expiryDate = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
    await certificate.save();
    
    // If container IDs provided, install certificates
    if (containerIds && containerIds.length > 0) {
      const installResults = [];
      
      for (const containerId of containerIds) {
        const installResult = await installCertToContainer(
          containerId, 
          certResult.certPath, 
          certResult.keyPath, 
          certResult.chainPath
        );
        
        installResults.push({
          containerId,
          ...installResult
        });
      }
      
      // If all installations successful, update certificate status
      const allSuccessful = installResults.every(result => result.success);
      if (allSuccessful) {
        certificate.status = 'installed';
        await certificate.save();
      }
      
      return res.status(201).json({
        message: 'Certificate issued and installed',
        certificateId: certificate._id,
        installResults
      });
    }
    
    return res.status(201).json({
      message: 'Certificate issued successfully',
      certificateId: certificate._id
    });
    
  } catch (error) {
    console.error('Error issuing certificate:', error);
    res.status(500).json({ 
      message: 'Failed to issue certificate', 
      error: error.message 
    });
  }
});

// @route   GET /api/certificates
// @desc    Get all certificates for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const certificates = await Certificate.find({ userId: req.user._id })
      .populate('subdomainId', 'name parentDomain');
    
    res.json(certificates);
  } catch (error) {
    console.error('Error getting certificates:', error);
    res.status(500).json({ 
      message: 'Failed to get certificates', 
      error: error.message 
    });
  }
});

// @route   GET /api/certificates/:id
// @desc    Get a certificate by ID
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const certificate = await Certificate.findOne({ 
      _id: req.params.id,
      userId: req.user._id
    }).populate('subdomainId', 'name parentDomain');
    
    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' });
    }
    
    res.json(certificate);
  } catch (error) {
    console.error('Error getting certificate:', error);
    res.status(500).json({ 
      message: 'Failed to get certificate', 
      error: error.message 
    });
  }
});

module.exports = router; 