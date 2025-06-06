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
  // Get the JWK (JSON Web Key) representation
  const jwk = await acme.crypto.getJwk(accountKey);
  
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
    
    // Create account key and domain key pair
    const accountKeyPair = await acme.forge.createPrivateKey();
    const domainKeyPair = await acme.forge.createPrivateKey();
    
    // Create ACME client
    const client = new acme.Client({
      directoryUrl: acme.directory.letsencrypt.production, // Use production for real certificates
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
    
    // Log detailed challenge information
    console.log('ACME Challenge details:');
    console.log(JSON.stringify(challenge, null, 2));
    
    // Prepare DNS challenge
    const keyAuthorization = await client.getChallengeKeyAuthorization(challenge);
    console.log(`Raw key authorization: ${keyAuthorization}`);
    
    // Calculate the challenge value both ways to verify
    const directChallengeValue = await calculateDns01ChallengeValue(challenge.token, accountKeyPair);
    console.log(`Direct challenge calculation: ${directChallengeValue}`);
    
    // For DNS-01 challenge, we need to create a TXT record with specific name and value
    // The record name is always _acme-challenge.{domain}
    const dnsRecordName = `_acme-challenge.${domain}`;
    
    // Use the directly calculated value to ensure accuracy
    const keyAuthDigest = directChallengeValue;
    
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
    
    // Wait for initial DNS propagation (2 minutes)
    console.log('Waiting 2 minutes for initial DNS propagation...');
    await new Promise(resolve => setTimeout(resolve, 120000)); // Increased to 2 minutes
    
    // Actively check for DNS propagation with retries
    const propagated = await checkDnsTxtPropagation(
      dnsRecordName,
      keyAuthDigest,
      10,  // 10 attempts
      15000 // 15 seconds between attempts
    );
    
    if (!propagated) {
      console.log('WARNING: DNS propagation check failed, but continuing with the process anyway...');
      // Additional delay before attempting verification
      console.log('Adding extra 30 seconds delay before challenge verification...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    // Verify with manual verification before proceeding
    console.log('Verifying DNS TXT record with ACME verification method...');
    const acmeVerified = await verifyDnsTxtWithAcme(domain, challenge, accountKeyPair);
    
    if (!acmeVerified) {
      console.log('WARNING: DNS record does not match ACME expected format. Challenge may fail.');
      // Additional delay to allow for DNS propagation
      console.log('Adding extra 30 seconds delay...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    // Log the data that will be submitted to Let's Encrypt
    console.log('Challenge data to be submitted:');
    console.log(`- URL: ${challenge.url}`);
    console.log(`- Token: ${challenge.token}`);
    console.log(`- Status: ${challenge.status}`);
    
    try {
      // Try DNS query using different DNS resolvers to ensure record is visible
      const publicDns = ['8.8.8.8', '1.1.1.1', '9.9.9.9'];
      for (const dnsServer of publicDns) {
        try {
          console.log(`Testing DNS resolution from ${dnsServer}...`);
          const { stdout } = await execAsync(`dig @${dnsServer} TXT ${dnsRecordName}`);
          console.log(`DNS resolution from ${dnsServer}:\n${stdout}`);
        } catch (error) {
          console.error(`Failed to resolve using ${dnsServer}: ${error.message}`);
        }
      }
    } catch (error) {
      console.error('Failed additional DNS verification:', error.message);
    }
    
    // Skip local verification as it's causing issues
    // Instead, directly notify the ACME provider that challenge is ready
    console.log('Notifying ACME provider that challenge is ready...');
    try {
      await client.completeChallenge(challenge);
      console.log('Challenge completion notified successfully');
    } catch (completeError) {
      console.error('Failed to complete challenge:', completeError);
      throw new Error(`Failed to complete challenge: ${completeError.message}`);
    }
    
    // Wait for validation with longer timeout
    console.log('Waiting for ACME validation (up to 2 minutes)...');
    try {
      // Increase timeout for validation
      const validationTimeout = 120000; // 2 minutes
      await Promise.race([
        client.waitForValidStatus(challenge),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Validation timed out after 2 minutes')), validationTimeout)
        )
      ]);
      console.log('Challenge validation successful');
    } catch (validationError) {
      console.error('Challenge validation failed:', validationError);
      throw new Error(`Challenge validation failed: ${validationError.message}`);
    }
    
    // Complete order
    console.log('Creating CSR...');
    let csr;
    try {
      // Use a more reliable way to create the CSR
      const [csrKey, csrData] = await acme.forge.createCsr({
        commonName: domain,
        altNames: [`www.${domain}`]
      });
      
      csr = csrData;
      
      // Save the CSR key - we'll need it later
      const csrKeyPath = path.join(domainDir, 'csrkey.pem');
      await fs.writeFile(csrKeyPath, acme.forge.getPemPrivateKey(csrKey));
      
      console.log('CSR created successfully');
    } catch (csrError) {
      console.error('Error creating CSR:', csrError);
      throw new Error(`Failed to create CSR: ${csrError.message}`);
    }
    
    console.log('Finalizing order...');
    try {
      await client.finalizeOrder(order, csr);
      console.log('Order finalized successfully');
    } catch (finalizeError) {
      console.error('Error finalizing order:', finalizeError);
      throw new Error(`Failed to finalize order: ${finalizeError.message}`);
    }
    
    console.log('Getting certificate...');
    let cert;
    try {
      cert = await client.getCertificate(order);
      console.log('Certificate obtained successfully');
    } catch (certError) {
      console.error('Error getting certificate:', certError);
      throw new Error(`Failed to get certificate: ${certError.message}`);
    }
    
    // Save files
    const certPath = path.join(domainDir, 'cert.pem');
    const keyPath = path.join(domainDir, 'privkey.pem');
    const chainPath = path.join(domainDir, 'chain.pem');
    const csrKeyPath = path.join(domainDir, 'csrkey.pem');
    
    await Promise.all([
      fs.writeFile(certPath, cert),
      // Use the existing CSR key if available, otherwise fall back to domain key
      fs.access(csrKeyPath).then(
        () => console.log('Using existing CSR key'),
        async () => {
          console.log('CSR key not found, falling back to domain key');
          await fs.writeFile(keyPath, acme.forge.getPemPrivateKey(domainKeyPair));
        }
      ),
      fs.writeFile(chainPath, cert) // For simplicity, using cert as chain
    ]);
    
    console.log('Certificate issued successfully');
    
    // Cleanup DNS records regardless of outcome
    console.log('Cleaning up DNS records...');
    if (propagated) {
      try {
        const deleteParams = {
          HostedZoneId: hostedZoneId,
          ChangeBatch: {
            Changes: [
              {
                Action: 'DELETE',
                ResourceRecordSet: {
                  Name: `${dnsRecordName}.`,
                  Type: 'TXT',
                  TTL: 60,
                  ResourceRecords: [{ Value: `"${keyAuthDigest}"` }]
                }
              }
            ]
          }
        };
        await route53.changeResourceRecordSets(deleteParams).promise();
        console.log('DNS cleanup completed successfully');
      } catch (cleanupError) {
        console.error('Failed to clean up DNS records:', cleanupError);
        // Don't throw here, we still want to continue and save the certificate if possible
      }
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