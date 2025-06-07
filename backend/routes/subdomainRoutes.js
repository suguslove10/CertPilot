const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const axios = require('axios');
const Subdomain = require('../models/Subdomain');
const AwsCredentials = require('../models/AwsCredentials');
const { protect } = require('../middleware/authMiddleware');
const bcrypt = require('bcrypt');

// Helper function to get public IP address
const getPublicIpAddress = async () => {
  try {
    const response = await axios.get('https://api.ipify.org?format=json');
    return response.data.ip;
  } catch (error) {
    console.error('Error getting public IP:', error);
    throw new Error('Failed to detect public IP address');
  }
};

// Get AWS credentials for a user
const getUserAwsCredentials = async (userId) => {
  const credentials = await AwsCredentials.findOne({ userId });
  if (!credentials) {
    throw new Error('AWS credentials not found');
  }
  return credentials;
};

// Configure AWS Route53 with user credentials
const configureRoute53 = async (credentials, rawSecretKey) => {
  // First try to use environment variables
  if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
    console.log('Using AWS credentials from environment variables');
    return new AWS.Route53({
      credentials: new AWS.Credentials({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      }),
      region: process.env.AWS_REGION || credentials.region || 'us-east-1'
    });
  }
  
  // Fall back to user credentials if environment variables not available
  // Use the raw secret key (if provided) or the stored encrypted one
  const secretKey = rawSecretKey || credentials.getDecryptedSecretKey();
  return new AWS.Route53({
    accessKeyId: credentials.accessKeyId,
    secretAccessKey: secretKey,
    region: credentials.region
  });
};

// Get hosted zones for a domain
const getHostedZoneId = async (route53, domain) => {
  try {
    const zones = await route53.listHostedZones().promise();
    const matchingZone = zones.HostedZones.find(
      zone => domain.endsWith(zone.Name.slice(0, -1)) // Remove trailing dot
    );
    
    if (!matchingZone) {
      throw new Error(`No hosted zone found for domain: ${domain}`);
    }
    
    return matchingZone.Id.split('/').pop(); // Extract ID from path
  } catch (error) {
    console.error('Error getting hosted zone:', error);
    throw error;
  }
};

// Create/update DNS record in Route53
const createOrUpdateDnsRecord = async (route53, params) => {
  try {
    const response = await route53.changeResourceRecordSets(params).promise();
    return response.ChangeInfo;
  } catch (error) {
    console.error('Error creating/updating DNS record:', error);
    throw error;
  }
};

// @route   POST /api/subdomains
// @desc    Create a new subdomain
// @access  Private
router.post('/', protect, async (req, res) => {
  const { name, parentDomain, recordType = 'A', ttl = 300 } = req.body;
  
  try {
    // Validate required fields
    if (!name || !parentDomain) {
      return res.status(400).json({ message: 'Please provide subdomain name and parent domain' });
    }
    
    // Get session credentials if available
    const sessionCredentials = req.session?.awsCredentials;
    
    // Get user's AWS credentials from database
    const dbCredentials = await getUserAwsCredentials(req.user._id);
    
    // Configure AWS Route53 with the raw secret key if available from session
    const route53 = await configureRoute53(dbCredentials, sessionCredentials?.secretAccessKey);
    
    try {
      // Get hosted zone ID for the parent domain
      const hostedZoneId = await getHostedZoneId(route53, parentDomain);
      
      // Get public IP address
      const publicIp = await getPublicIpAddress();
      
      // Full domain name (subdomain.parentdomain.com)
      const fullDomainName = `${name}.${parentDomain}`;
      
      // Check if subdomain already exists
      const existingSubdomain = await Subdomain.findOne({ 
        userId: req.user._id,
        name,
        parentDomain
      });
      
      // Parameters for the DNS record change
      const params = {
        HostedZoneId: hostedZoneId,
        ChangeBatch: {
          Changes: [
            {
              Action: existingSubdomain ? 'UPSERT' : 'CREATE',
              ResourceRecordSet: {
                Name: fullDomainName,
                Type: recordType,
                TTL: ttl,
                ResourceRecords: [
                  {
                    Value: publicIp
                  }
                ]
              }
            }
          ],
          Comment: `CertPilot - ${existingSubdomain ? 'Updated' : 'Created'} subdomain`
        }
      };
      
      // Make the change in Route53
      const changeInfo = await createOrUpdateDnsRecord(route53, params);
      
      let subdomain;
      
      if (existingSubdomain) {
        // Update existing subdomain
        existingSubdomain.targetIp = publicIp;
        existingSubdomain.recordType = recordType;
        existingSubdomain.ttl = ttl;
        subdomain = await existingSubdomain.save();
        
        return res.json({
          message: 'Subdomain updated successfully',
          subdomain,
          changeInfo
        });
      } else {
        // Create new subdomain
        subdomain = await Subdomain.create({
          userId: req.user._id,
          name,
          parentDomain,
          hostedZoneId,
          targetIp: publicIp,
          recordType,
          ttl
        });
        
        return res.status(201).json({
          message: 'Subdomain created successfully',
          subdomain,
          changeInfo
        });
      }
    } catch (awsError) {
      console.error('Error getting hosted zone:', awsError);
      
      // If we get a signature error and don't have session credentials,
      // respond with a special error that tells the frontend to prompt for credentials
      if (awsError.code === 'SignatureDoesNotMatch' && !sessionCredentials) {
        // Skip credential prompt if environment variables are available
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          return res.status(500).json({
            message: 'AWS API error',
            error: awsError.message
          });
        }
        
        return res.status(403).json({
          message: 'AWS credential verification required',
          needCredentials: true,
          error: awsError.message,
          region: dbCredentials.region
        });
      }
      
      throw awsError;
    }
    
  } catch (error) {
    console.error('Error creating subdomain:', error);
    res.status(500).json({ 
      message: 'Failed to create subdomain', 
      error: error.message 
    });
  }
});

// @route   GET /api/subdomains
// @desc    Get all subdomains for a user
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const subdomains = await Subdomain.find({ userId: req.user._id });
    res.json(subdomains);
  } catch (error) {
    console.error('Error getting subdomains:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/subdomains/:id
// @desc    Get a specific subdomain
// @access  Private
router.get('/:id', protect, async (req, res) => {
  try {
    const subdomain = await Subdomain.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!subdomain) {
      return res.status(404).json({ message: 'Subdomain not found' });
    }
    
    res.json(subdomain);
  } catch (error) {
    console.error('Error getting subdomain:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/subdomains/:id
// @desc    Update a subdomain
// @access  Private
router.put('/:id', protect, async (req, res) => {
  const { recordType, ttl } = req.body;
  
  try {
    let subdomain = await Subdomain.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!subdomain) {
      return res.status(404).json({ message: 'Subdomain not found' });
    }
    
    // Get user's AWS credentials
    const credentials = await getUserAwsCredentials(req.user._id);
    
    // Configure AWS Route53
    const route53 = await configureRoute53(credentials);
    
    // Get the public IP address
    const publicIp = await getPublicIpAddress();
    
    // Full domain name
    const fullDomainName = `${subdomain.name}.${subdomain.parentDomain}`;
    
    // Parameters for the DNS record change
    const params = {
      HostedZoneId: subdomain.hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: fullDomainName,
              Type: recordType || subdomain.recordType,
              TTL: ttl || subdomain.ttl,
              ResourceRecords: [
                {
                  Value: publicIp
                }
              ]
            }
          }
        ],
        Comment: 'CertPilot - Updated subdomain'
      }
    };
    
    // Make the change in Route53
    const changeInfo = await createOrUpdateDnsRecord(route53, params);
    
    // Update subdomain in database
    if (recordType) subdomain.recordType = recordType;
    if (ttl) subdomain.ttl = ttl;
    subdomain.targetIp = publicIp;
    
    subdomain = await subdomain.save();
    
    res.json({
      message: 'Subdomain updated successfully',
      subdomain,
      changeInfo
    });
    
  } catch (error) {
    console.error('Error updating subdomain:', error);
    res.status(500).json({ 
      message: 'Failed to update subdomain', 
      error: error.message 
    });
  }
});

// @route   DELETE /api/subdomains/:id
// @desc    Delete a subdomain
// @access  Private
router.delete('/:id', protect, async (req, res) => {
  try {
    const subdomain = await Subdomain.findOne({
      _id: req.params.id,
      userId: req.user._id
    });
    
    if (!subdomain) {
      return res.status(404).json({ message: 'Subdomain not found' });
    }
    
    // Get user's AWS credentials
    const credentials = await getUserAwsCredentials(req.user._id);
    
    // Configure AWS Route53
    const route53 = await configureRoute53(credentials);
    
    // Full domain name
    const fullDomainName = `${subdomain.name}.${subdomain.parentDomain}`;
    
    // Parameters for the DNS record deletion
    const params = {
      HostedZoneId: subdomain.hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'DELETE',
            ResourceRecordSet: {
              Name: fullDomainName,
              Type: subdomain.recordType,
              TTL: subdomain.ttl,
              ResourceRecords: [
                {
                  Value: subdomain.targetIp
                }
              ]
            }
          }
        ],
        Comment: 'CertPilot - Deleted subdomain'
      }
    };
    
    // Make the change in Route53
    await createOrUpdateDnsRecord(route53, params);
    
    // Delete from database
    await subdomain.remove();
    
    res.json({ 
      message: 'Subdomain deleted successfully'
    });
    
  } catch (error) {
    console.error('Error deleting subdomain:', error);
    res.status(500).json({ 
      message: 'Failed to delete subdomain', 
      error: error.message 
    });
  }
});

// @route   GET /api/subdomains/zones/list
// @desc    Get available hosted zones
// @access  Private
router.get('/zones/list', protect, async (req, res) => {
  try {
    // Check if we have credentials in session (temporary for this request)
    const sessionCredentials = req.session?.awsCredentials;
    
    // Get user's AWS credentials from database
    const dbCredentials = await getUserAwsCredentials(req.user._id);
    
    // Configure AWS Route53 with the raw secret key if available
    const route53 = await configureRoute53(dbCredentials, sessionCredentials?.secretAccessKey);
    
    try {
      // Get hosted zones
      const zones = await route53.listHostedZones().promise();
      
      // Format for frontend
      const formattedZones = zones.HostedZones.map(zone => ({
        id: zone.Id.split('/').pop(),
        name: zone.Name.slice(0, -1), // Remove trailing dot
        recordCount: zone.ResourceRecordSetCount
      }));
      
      res.json(formattedZones);
    } catch (awsError) {
      console.error('Error getting hosted zones:', awsError);
      
      // If we get a signature error and don't have session credentials,
      // respond with a special error that tells the frontend to prompt for credentials
      if (awsError.code === 'SignatureDoesNotMatch' && !sessionCredentials) {
        // Skip credential prompt if environment variables are available
        if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
          return res.status(500).json({
            message: 'AWS API error',
            error: awsError.message
          });
        }
        
        return res.status(403).json({
          message: 'AWS credential verification required',
          needCredentials: true,
          error: awsError.message
        });
      }
      
      res.status(500).json({ 
        message: 'Failed to get hosted zones', 
        error: awsError.message 
      });
    }
    
  } catch (error) {
    console.error('Error getting hosted zones:', error);
    res.status(500).json({ 
      message: 'Failed to get hosted zones', 
      error: error.message 
    });
  }
});

// @route   POST /api/subdomains/verify-credentials
// @desc    Verify AWS credentials and store them temporarily in session
// @access  Private
router.post('/verify-credentials', protect, async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  try {
    // Ensure we have all required credentials
    if (!accessKeyId || !secretAccessKey) {
      return res.status(400).json({
        success: false,
        message: 'Access key ID and secret access key are required'
      });
    }

    // Verify the credentials with AWS
    const route53 = new AWS.Route53({
      accessKeyId,
      secretAccessKey,
      region: region || 'us-east-1'
    });

    // Test the credentials by listing hosted zones
    await route53.listHostedZones().promise();

    // Store the credentials in database (encrypted)
    let awsCredentials = await AwsCredentials.findOne({ userId: req.user._id });
    
    if (awsCredentials) {
      // Update existing credentials
      awsCredentials.accessKeyId = accessKeyId;
      awsCredentials.secretAccessKey = secretAccessKey; // Will be encrypted in pre-save hook
      awsCredentials.region = region || 'us-east-1';
    } else {
      // Create new credentials
      awsCredentials = new AwsCredentials({
        userId: req.user._id,
        accessKeyId,
        secretAccessKey, // Will be encrypted in pre-save hook
        region: region || 'us-east-1'
      });
    }
    
    await awsCredentials.save();

    // Store the credentials temporarily in session (only for this request)
    req.session.awsCredentials = {
      accessKeyId,
      secretAccessKey,
      region: region || 'us-east-1'
    };
    
    // Save the session
    await new Promise((resolve, reject) => {
      req.session.save(err => {
        if (err) reject(err);
        else resolve();
      });
    });

    res.json({ 
      success: true, 
      message: 'AWS credentials verified and saved successfully' 
    });
  } catch (err) {
    console.error('Error verifying AWS credentials:', err);
    res.status(400).json({ 
      success: false, 
      message: 'Invalid AWS credentials',
      error: err.message
    });
  }
});

module.exports = router; 