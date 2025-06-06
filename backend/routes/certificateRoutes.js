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
const AwsCredentials = require('../models/AwsCredentials');
const AWS = require('aws-sdk');
const crypto = require('crypto');

// Directory for storing certificates
const CERT_DIR = process.env.CERT_DIR || path.join(process.cwd(), 'certificates');

// Ensure certificate directory exists
const ensureCertDir = async () => {
  try {
    await fs.mkdir(CERT_DIR, { recursive: true });
    console.log(`Certificate directory created at ${CERT_DIR}`);
    return true;
  } catch (error) {
    console.error(`Error creating certificate directory: ${error.message}`);
    return false;
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

// Check if DNS TXT record has propagated
const checkDnsTxtPropagation = async (recordName, expectedValue, maxAttempts = 10, delayBetweenAttempts = 10000) => {
  const dns = require('dns').promises;
  console.log(`Checking DNS TXT record propagation for ${recordName}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`DNS TXT check attempt ${attempt}/${maxAttempts}`);
    
    try {
      const records = await dns.resolveTxt(recordName);
      console.log(`DNS TXT records found: ${JSON.stringify(records)}`);
      
      // Check if any of the records match our expected value
      const flatRecords = records.flat();
      if (flatRecords.some(record => record === expectedValue)) {
        console.log('✓ DNS TXT record has propagated successfully!');
        return true;
      }
      
      console.log(`DNS TXT record found but doesn't match expected value.`);
      console.log(`Expected: ${expectedValue}`);
      console.log(`Found: ${JSON.stringify(flatRecords)}`);
    } catch (error) {
      console.log(`DNS TXT record not found yet: ${error.message}`);
    }
    
    if (attempt < maxAttempts) {
      console.log(`Waiting ${delayBetweenAttempts/1000} seconds before next check...`);
      await new Promise(resolve => setTimeout(resolve, delayBetweenAttempts));
    }
  }
  
  console.log(`DNS TXT record propagation check failed after ${maxAttempts} attempts.`);
  return false;
};

// Function to issue certificate using ACME client (Let's Encrypt)
const issueCertificate = async (domain, email, userId) => {
  try {
    console.log(`Starting certificate issuance for ${domain}`);
    
    // Create domain directory
    const domainDir = path.join(CERT_DIR, domain);
    await fs.mkdir(domainDir, { recursive: true });
    
    // Get user's AWS credentials for Route53 DNS challenge
    const awsCredentials = await AwsCredentials.findOne({ userId });
    if (!awsCredentials) {
      throw new Error('AWS credentials not found for DNS challenge');
    }
    
    // Configure Route53
    const route53 = new AWS.Route53({
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.getDecryptedSecretKey(),
      region: awsCredentials.region
    });
    
    // Extract parent domain to get the hosted zone
    const parentDomain = domain.split('.').slice(1).join('.');
    console.log(`Finding hosted zone for parent domain: ${parentDomain}`);
    
    // Get hosted zone ID
    const { HostedZones } = await route53.listHostedZones().promise();
    const hostedZone = HostedZones.find(
      zone => parentDomain.endsWith(zone.Name.slice(0, -1)) // Remove trailing dot
    );
    
    if (!hostedZone) {
      throw new Error(`No hosted zone found for domain: ${domain}`);
    }
    
    const hostedZoneId = hostedZone.Id.split('/').pop();
    console.log(`Using hosted zone: ${hostedZoneId}`);
    
    // Create account key and domain key pair
    const accountKeyPair = await acme.forge.createPrivateKey();
    const domainKeyPair = await acme.forge.createPrivateKey();
    
    // Create ACME client
    const client = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.staging, // Use staging for testing
      accountKey: accountKeyPair
    });
    
    // Create account
    console.log(`Creating ACME account for ${email}`);
    await client.createAccount({
      termsOfServiceAgreed: true,
      contact: [`mailto:${email}`]
    });
    
    // Create order
    console.log(`Creating certificate order for ${domain}`);
    const order = await client.createOrder({
      identifiers: [{ type: 'dns', value: domain }]
    });
    
    // Get authorizations from order
    const authorizations = await client.getAuthorizations(order);
    
    // Get DNS challenge
    const authz = authorizations[0];
    const challenge = authz.challenges.find(c => c.type === 'dns-01');
    
    if (!challenge) {
      throw new Error('DNS challenge not available');
    }
    
    // Prepare DNS challenge
    const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
    
    // For DNS-01 challenge, we need to create a TXT record with specific name and value
    // The record name is always _acme-challenge.{domain}
    // The value is a digest of the key authorization
    const dnsRecordName = `_acme-challenge.${domain}`;
    
    // Calculate the correct DNS TXT record value
    // This is SHA-256 digest of the key authorization, base64url-encoded
    const keyAuthDigest = crypto.createHash('sha256').update(keyAuthorization).digest('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');
    
    console.log(`DNS challenge record: ${dnsRecordName}`);
    console.log(`DNS challenge value: ${keyAuthDigest}`);
    
    // Create TXT record in Route53
    const dnsParams = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: `${dnsRecordName}.`,
              Type: 'TXT',
              TTL: 60,
              ResourceRecords: [
                {
                  Value: `"${keyAuthDigest}"`
                }
              ]
            }
          }
        ]
      }
    };
    
    // Create DNS record
    console.log('Creating DNS TXT record for ACME challenge');
    await route53.changeResourceRecordSets(dnsParams).promise();
    
    // Wait for initial DNS propagation (1 minute)
    console.log('Waiting 1 minute for initial DNS propagation...');
    await new Promise(resolve => setTimeout(resolve, 60000));
    
    // Actively check for DNS propagation with retries
    const propagated = await checkDnsTxtPropagation(
      dnsRecordName,
      keyAuthDigest,
      10,  // 10 attempts
      15000 // 15 seconds between attempts
    );
    
    if (!propagated) {
      console.log('WARNING: DNS propagation check failed, but continuing with the process anyway...');
    }
    
    // Verify challenge
    console.log('Verifying challenge with Let\'s Encrypt...');
    await client.verifyChallenge(authz, challenge);
    
    // Notify ACME provider that challenge is ready
    console.log('Notifying ACME provider that challenge is ready...');
    await client.completeChallenge(challenge);
    
    // Wait for validation (may take some time)
    console.log('Waiting for ACME validation...');
    await client.waitForValidStatus(challenge);
    
    // Complete order
    console.log('Creating CSR...');
    const [csr] = await acme.forge.createCsr({
      commonName: domain,
      altNames: [`www.${domain}`]
    }, domainKeyPair);
    
    console.log('Finalizing order...');
    await client.finalizeOrder(order, csr);
    
    console.log('Getting certificate...');
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
    
    console.log('Certificate issued successfully');
    
    // Clean up DNS record (in background to avoid delay)
    if (propagated) {
      setTimeout(async () => {
        try {
          const cleanupParams = {
            HostedZoneId: hostedZoneId,
            ChangeBatch: {
              Changes: [
                {
                  Action: 'DELETE',
                  ResourceRecordSet: {
                    Name: `${dnsRecordName}.`,
                    Type: 'TXT',
                    TTL: 60,
                    ResourceRecords: [
                      {
                        Value: `"${keyAuthDigest}"`
                      }
                    ]
                  }
                }
              ]
            }
          };
          
          await route53.changeResourceRecordSets(cleanupParams).promise();
          console.log('Cleaned up DNS challenge TXT record');
        } catch (error) {
          console.error('Error cleaning up DNS challenge record:', error);
        }
      }, 5000);
    } else {
      console.log('Skipping DNS record cleanup since propagation was not confirmed');
    }
    
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
    const certResult = await issueCertificate(domain, req.user.email, req.user._id);
    
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