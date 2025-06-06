const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const AwsCredentials = require('../models/AwsCredentials');
const { protect } = require('../middleware/authMiddleware');
const mongoose = require('mongoose');

// Helper function to verify AWS credentials
const verifyAwsCredentials = async (accessKeyId, secretAccessKey, region) => {
  return new Promise((resolve, reject) => {
    const route53 = new AWS.Route53({
      accessKeyId,
      secretAccessKey,
      region,
    });

    route53.listHostedZones({}, (err, data) => {
      if (err) {
        reject(err);
      } else {
        resolve(true);
      }
    });
  });
};

// @route   POST /api/aws-credentials
// @desc    Add or update AWS credentials
// @access  Private
router.post('/', protect, async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;
  console.log('Received request to save AWS credentials');

  // Validate required fields
  if (!accessKeyId || !secretAccessKey) {
    console.log('Missing required fields');
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Verify the credentials with AWS
    console.log('Verifying AWS credentials...');
    try {
      await verifyAwsCredentials(accessKeyId, secretAccessKey, region || 'us-east-1');
      console.log('AWS credentials verified successfully');
    } catch (awsError) {
      console.error('AWS verification error:', awsError);
      return res.status(400).json({ 
        message: 'Invalid AWS credentials', 
        error: awsError.message 
      });
    }

    // Check if credentials already exist for this user
    console.log('Checking for existing credentials...');
    const existingCredentials = await AwsCredentials.findOne({ userId: req.user._id });

    if (existingCredentials) {
      console.log('Existing credentials found, updating...');
      try {
        // For existing credentials, first delete the old one to avoid encryption issues
        console.log('Deleting old credentials');
        const deleteResult = await AwsCredentials.deleteOne({ userId: req.user._id });
        console.log('Delete result:', deleteResult);
        
        // Create a new credential entry
        console.log('Creating new credentials');
        const newCredentials = await AwsCredentials.create({
          userId: req.user._id,
          accessKeyId,
          secretAccessKey,
          region: region || 'us-east-1'
        });
        console.log('Credentials created successfully:', newCredentials._id);

        return res.json({ 
          message: 'AWS credentials updated successfully',
          region: region || 'us-east-1'
        });
      } catch (updateError) {
        console.error('Error updating credentials - full error:', updateError);
        console.error('Error message:', updateError.message);
        console.error('Error stack:', updateError.stack);
        return res.status(500).json({ 
          message: 'Failed to update credentials',
          error: updateError.message
        });
      }
    } else {
      // Create new credentials
      console.log('No existing credentials, creating new one');
      try {
        const credentials = await AwsCredentials.create({
          userId: req.user._id,
          accessKeyId,
          secretAccessKey,
          region: region || 'us-east-1'
        });
        console.log('New credentials created successfully:', credentials._id);

        return res.status(201).json({ 
          message: 'AWS credentials added successfully',
          region: credentials.region
        });
      } catch (createError) {
        console.error('Error creating new credentials:', createError);
        console.error('Error stack:', createError.stack);
        return res.status(500).json({ 
          message: 'Failed to create credentials',
          error: createError.message
        });
      }
    }
  } catch (error) {
    console.error('General error in AWS credentials route:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/aws-credentials
// @desc    Get user's AWS credentials
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const credentials = await AwsCredentials.findOne({ userId: req.user._id });

    if (!credentials) {
      return res.status(404).json({ message: 'AWS credentials not found' });
    }

    // Don't return the actual secret key, just a masked version
    res.json({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: '••••••••••••••••••••••', // Masked for security
      region: credentials.region,
      updatedAt: credentials.updatedAt
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/aws-credentials
// @desc    Delete user's AWS credentials
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    const result = await AwsCredentials.deleteOne({ userId: req.user._id });

    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'AWS credentials not found' });
    }

    res.json({ message: 'AWS credentials removed successfully' });
  } catch (error) {
    console.error('Error deleting AWS credentials:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/aws-credentials/verify
// @desc    Verify AWS credentials without saving
// @access  Private
router.post('/verify', protect, async (req, res) => {
  const { accessKeyId, secretAccessKey, region } = req.body;

  // Validate required fields
  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Verify the credentials with AWS
    try {
      await verifyAwsCredentials(accessKeyId, secretAccessKey, region || 'us-east-1');
      res.json({ valid: true, message: 'AWS credentials are valid' });
    } catch (awsError) {
      res.status(400).json({ 
        valid: false, 
        message: 'Invalid AWS credentials', 
        error: awsError.message 
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/aws-credentials/debug
// @desc    Debug AWS credentials encryption
// @access  Private
router.get('/debug', protect, async (req, res) => {
  try {
    // Safely display environment variables without revealing actual values
    const envVars = {
      ENCRYPTION_KEY_SET: process.env.ENCRYPTION_KEY ? 'Yes' : 'No',
      ENCRYPTION_KEY_LENGTH: process.env.ENCRYPTION_KEY ? process.env.ENCRYPTION_KEY.length : 'N/A',
      NODE_ENV: process.env.NODE_ENV
    };
    
    // Test the encryption/decryption process
    const testValue = 'TEST_SECRET_KEY_' + Date.now();
    
    let encryptionWorking = true;
    let diagnosticInfo = {};
    
    try {
      const crypto = require('crypto');
      const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'certpilot-secure-encryption-key-32-chars';
      const IV_LENGTH = 16;
      
      // Test encryption
      const iv = crypto.randomBytes(IV_LENGTH);
      const cipher = crypto.createCipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
        iv
      );
      
      let encrypted = cipher.update(testValue);
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const encryptedString = iv.toString('hex') + ':' + encrypted.toString('hex');
      
      // Test decryption
      const textParts = encryptedString.split(':');
      const decIv = Buffer.from(textParts.shift(), 'hex');
      const encryptedText = Buffer.from(textParts.join(':'), 'hex');
      const decipher = crypto.createDecipheriv(
        'aes-256-cbc',
        Buffer.from(ENCRYPTION_KEY.slice(0, 32)),
        decIv
      );
      
      let decrypted = decipher.update(encryptedText);
      decrypted = Buffer.concat([decrypted, decipher.final()]);
      const decryptedString = decrypted.toString();
      
      diagnosticInfo = {
        originalValue: testValue,
        encryptedValue: encryptedString,
        decryptedValue: decryptedString,
        encryptionSuccessful: testValue === decryptedString
      };
      
    } catch (cryptoError) {
      encryptionWorking = false;
      diagnosticInfo = {
        error: cryptoError.message,
        stack: cryptoError.stack
      };
    }
    
    // Check MongoDB connection
    let mongoStatus = 'Unknown';
    try {
      mongoStatus = mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected';
    } catch (mongoError) {
      mongoStatus = `Error: ${mongoError.message}`;
    }
    
    res.json({
      environmentVariables: envVars,
      encryptionTest: {
        working: encryptionWorking,
        details: diagnosticInfo
      },
      mongoConnection: mongoStatus,
      serverTime: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ message: 'Error running diagnostics', error: error.message });
  }
});

module.exports = router; 