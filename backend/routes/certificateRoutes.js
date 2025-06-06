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

// Function to check DNS TXT record with retries
const checkDnsTxtPropagation = async (recordName, expectedValue, maxAttempts = 10, delayBetweenAttempts = 10000) => {
  const dns = require('dns').promises;
  console.log(`Checking DNS TXT record propagation for ${recordName}...`);
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    console.log(`DNS TXT check attempt ${attempt}/${maxAttempts}`);
    
    try {
      const records = await dns.resolveTxt(recordName);
      console.log(`DNS TXT records found: ${JSON.stringify(records)}`);
      
      // DNS resolveTxt returns nested arrays of strings
      // We need to check each record (which might be an array of strings)
      const matchFound = records.some(record => {
        // Each record is an array of strings (often just one string)
        const joined = record.join('');
        return joined === expectedValue;
      });
      
      if (matchFound) {
        console.log('✓ DNS TXT record has propagated successfully!');
        return true;
      }
      
      console.log(`DNS TXT record found but doesn't match expected value.`);
      console.log(`Expected: ${expectedValue}`);
      console.log(`Found: ${JSON.stringify(records)}`);
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

// Function to check DNS TXT record with manual verification
const verifyDnsTxtWithAcme = async (domain, challenge, accountKeyPair) => {
  const dns = require('dns').promises;
  const recordName = `_acme-challenge.${domain}`;
  
  // Calculate the expected digest using the more accurate method
  const expectedDigest = await calculateDns01ChallengeValue(challenge.token, accountKeyPair);
  
  console.log(`Performing manual verification for ${recordName}`);
  console.log(`Expected digest (direct calculation): ${expectedDigest}`);
  
  try {
    const txtRecords = await dns.resolveTxt(recordName);
    console.log(`Found TXT records: ${JSON.stringify(txtRecords)}`);
    
    // Flatten and check for exact match
    const flatRecords = [].concat(...txtRecords);
    console.log(`Flattened records: ${JSON.stringify(flatRecords)}`);
    
    if (flatRecords.includes(expectedDigest)) {
      console.log('✓ TXT record matches expected digest!');
      return true;
    } else {
      console.log('✗ TXT record does not match expected digest');
      return false;
    }
  } catch (error) {
    console.error(`Error resolving TXT record: ${error.message}`);
    return false;
  }
};

// Calculate the ACME thumbprint for an account key
const calculateThumbprint = async (accountKey) => {
  try {
    // Get the JWK (JSON Web Key) representation
    // Extract JWK from the account key
    const jwk = accountKey.toJSON();
    
    // Create the canonical JSON string as required by RFC7638
    const canonical = JSON.stringify({
      e: jwk.e,
      kty: jwk.kty,
      n: jwk.n
    });
    
    // Calculate the thumbprint as per RFC7638
    const thumbprint = crypto.createHash('sha256')
      .update(canonical)
      .digest('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=/g, '');
    
    return thumbprint;
  } catch (error) {
    console.error('Error calculating thumbprint:', error);
    throw error;
  }
};

// Calculate the DNS-01 challenge value directly as per RFC 8555
const calculateDns01ChallengeValue = async (token, accountKey) => {
  // Calculate account key thumbprint
  const thumbprint = await calculateThumbprint(accountKey);
  
  // Construct the key authorization string
  const keyAuthorization = `${token}.${thumbprint}`;
  
  // For DNS-01, the value is the base64url-encoded SHA-256 digest of the key authorization
  const value = crypto.createHash('sha256')
    .update(keyAuthorization)
    .digest('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
  
  return value;
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
    
    // Instead of using the acme-client library directly, use certbot with Route53 plugin
    console.log('Using certbot for certificate issuance');
    
    // Configure AWS credentials for certbot
    const awsCredsDir = path.join(CERT_DIR, 'aws-credentials');
    await fs.mkdir(awsCredsDir, { recursive: true });
    
    const awsConfigPath = path.join(awsCredsDir, 'config');
    const awsCredsPath = path.join(awsCredsDir, 'credentials');
    
    await fs.writeFile(awsConfigPath, `[default]\nregion = ${awsCredentials.region}\n`);
    await fs.writeFile(awsCredsPath, 
      `[default]\naws_access_key_id = ${awsCredentials.accessKeyId}\naws_secret_access_key = ${awsCredentials.getDecryptedSecretKey()}\n`
    );
    
    // Set chmod for AWS credentials
    await fs.chmod(awsConfigPath, 0o600);
    await fs.chmod(awsCredsPath, 0o600);
    
    // Set environment variables for certbot
    process.env.AWS_CONFIG_FILE = awsConfigPath;
    process.env.AWS_SHARED_CREDENTIALS_FILE = awsCredsPath;
    
    console.log('Running certbot command');
    const certbotCmd = `certbot certonly --dns-route53 --non-interactive --agree-tos --email ${email} -d ${domain} -d www.${domain} --cert-name ${domain.replace(/\./g, '-')}`;
    
    try {
      const { stdout, stderr } = await execAsync(certbotCmd);
      console.log('Certbot output:');
      console.log(stdout);
      
      if (stderr) {
        console.error('Certbot stderr:');
        console.error(stderr);
      }
    } catch (certbotError) {
      console.error('Certbot error:', certbotError);
      throw new Error(`Certbot failed: ${certbotError.message}`);
    }
    
    // Copy certificates to our certificate directory
    const letsEncryptDir = path.join('/etc/letsencrypt/live', domain.replace(/\./g, '-'));
    const certPath = path.join(domainDir, 'cert.pem');
    const keyPath = path.join(domainDir, 'privkey.pem');
    const chainPath = path.join(domainDir, 'chain.pem');
    
    try {
      await fs.copyFile(path.join(letsEncryptDir, 'fullchain.pem'), certPath);
      await fs.copyFile(path.join(letsEncryptDir, 'privkey.pem'), keyPath);
      await fs.copyFile(path.join(letsEncryptDir, 'chain.pem'), chainPath);
      console.log('Certificate files copied successfully');
    } catch (copyError) {
      console.error('Error copying certificate files:', copyError);
      throw new Error(`Failed to copy certificate files: ${copyError.message}`);
    }
    
    console.log('Certificate issued successfully');
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
    
    // Try a different approach - create a simple wildcard DNS TXT record
    try {
      // Get user's AWS credentials
      const awsCredentials = await AwsCredentials.findOne({ userId: req.user._id });
      if (!awsCredentials) {
        throw new Error('AWS credentials not found');
      }
      
      // Configure Route53
      const route53 = new AWS.Route53({
        accessKeyId: awsCredentials.accessKeyId,
        secretAccessKey: awsCredentials.getDecryptedSecretKey(),
        region: awsCredentials.region
      });
      
      // Get hosted zone for the parent domain
      const parentDomain = domain.split('.').slice(1).join('.');
      const { HostedZones } = await route53.listHostedZones().promise();
      const hostedZone = HostedZones.find(
        zone => parentDomain.endsWith(zone.Name.slice(0, -1))
      );
      
      if (!hostedZone) {
        throw new Error(`No hosted zone found for domain: ${domain}`);
      }
      
      const hostedZoneId = hostedZone.Id.split('/').pop();
      
      // Create a wildcard TXT record for all challenges
      // This is for testing purposes only - will handle any ACME challenge
      const dnsParams = {
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: 'UPSERT',
              ResourceRecordSet: {
                Name: `_acme-challenge.${domain}.`,
                Type: 'TXT',
                TTL: 60,
                ResourceRecords: [
                  { Value: '"*"' } // Wildcard value to respond to any challenge
                ]
              }
            }
          ]
        }
      };
      
      await route53.changeResourceRecordSets(dnsParams).promise();
      
      // Return success immediately without waiting for cert issuance
      // We'll start the cert process in the background
      res.status(201).json({ 
        message: 'Certificate request initiated',
        certificateId: certificate._id,
        domain
      });
      
      // Start certificate issuance in the background
      setTimeout(async () => {
        try {
          // Issue certificate
          const certResult = await issueCertificate(domain, req.user.email, req.user._id);
          
          if (!certResult.success) {
            certificate.status = 'error';
            certificate.errorMessage = certResult.error;
            await certificate.save();
            console.error(`Certificate issuance failed: ${certResult.error}`);
            return;
          }
          
          // Update certificate record with paths
          certificate.certPath = certResult.certPath;
          certificate.keyPath = certResult.keyPath;
          certificate.chainPath = certResult.chainPath;
          certificate.status = 'issued';
          certificate.issueDate = Date.now();
          certificate.expiryDate = Date.now() + (90 * 24 * 60 * 60 * 1000); // 90 days
          await certificate.save();
          
          // If container IDs provided, install certificate
          if (containerIds && containerIds.length) {
            for (const containerId of containerIds) {
              try {
                await installCertToContainer(
                  containerId, 
                  certResult.certPath, 
                  certResult.keyPath, 
                  certResult.chainPath
                );
                
                // Update certificate status to installed
                certificate.status = 'installed';
                certificate.installDate = Date.now();
                await certificate.save();
              } catch (installError) {
                console.error(`Error installing certificate to container ${containerId}:`, installError);
              }
            }
          }
          
          console.log(`Certificate for ${domain} issued and installed successfully`);
        } catch (error) {
          console.error(`Background certificate issuance error: ${error.message}`);
          certificate.status = 'error';
          certificate.errorMessage = error.message;
          await certificate.save();
        }
      }, 0);
      
    } catch (error) {
      certificate.status = 'error';
      certificate.errorMessage = error.message;
      await certificate.save();
      
      console.error(`Error starting certificate issuance: ${error.message}`);
      return res.status(500).json({
        message: 'Failed to start certificate issuance',
        error: error.message
      });
    }
  } catch (error) {
    console.error(`Certificate request error: ${error.message}`);
    return res.status(500).json({ message: error.message });
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