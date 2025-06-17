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
  try {
    // Check if system-level credentials are already set
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return res.status(400).json({ 
        message: 'System-level AWS credentials are already configured. To modify them, edit the backend.env file directly.' 
      });
    }

    const { accessKeyId, secretAccessKey, region } = req.body;
    
    if (!accessKeyId || !secretAccessKey || !region) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Verify credentials before saving
    const tempAWS = new AWS.Config({
      accessKeyId,
      secretAccessKey,
      region
    });
    
    const route53 = new AWS.Route53({ credentials: tempAWS.credentials, region });
    
    try {
      await route53.listHostedZones().promise();
      // If we get here, it means the credentials are valid
    } catch (err) {
      console.error('AWS credential verification failed:', err);
      return res.status(400).json({ error: 'Invalid AWS credentials. Please check and try again.' });
    }
    
    // Look for existing credentials for this user
    let credentials = await AwsCredentials.findOne({ userId: req.user._id });
    
    if (credentials) {
      // Update existing credentials
      credentials.accessKeyId = accessKeyId;
      credentials.secretAccessKey = secretAccessKey;
      credentials.region = region;
      await credentials.save();
      
      // Update AWS SDK configuration
      AWS.config.update({
        accessKeyId,
        secretAccessKey,
        region
      });
      
      res.json({ message: 'AWS credentials updated successfully' });
    } else {
      // Create new credentials
      credentials = new AwsCredentials({
        userId: req.user._id,
        accessKeyId,
        secretAccessKey,
        region
      });
      await credentials.save();
      
      // Update AWS SDK configuration
      AWS.config.update({
        accessKeyId,
        secretAccessKey,
        region
      });
      
      res.status(201).json({ message: 'AWS credentials saved successfully' });
    }
  } catch (error) {
    console.error('Error saving AWS credentials:', error);
    res.status(500).json({ message: 'Error saving AWS credentials' });
  }
});

// @route   GET /api/aws-credentials
// @desc    Get user's AWS credentials
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // First check if environment variables are set
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('Returning system-level AWS credentials from environment variables');
      return res.json({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: "••••••••••••••••••••••", // Masked for security
        region: process.env.AWS_REGION || 'us-east-1',
        updatedAt: new Date(),
        isSystemLevel: true
      });
    }

    // If no environment variables, check the database
    const credentials = await AwsCredentials.findOne({ userId: req.user._id });
    
    if (!credentials) {
      return res.status(404).json({ message: 'AWS credentials not found' });
    }
    
    res.json({
      accessKeyId: credentials.accessKeyId,
      secretAccessKey: "••••••••••••••••••••••", // Masked for security
      region: credentials.region,
      updatedAt: credentials.updatedAt,
      isSystemLevel: false
    });
  } catch (error) {
    console.error('Error fetching AWS credentials:', error);
    res.status(500).json({ message: 'Error retrieving AWS credentials' });
  }
});

// @route   DELETE /api/aws-credentials
// @desc    Delete user's AWS credentials
// @access  Private
router.delete('/', protect, async (req, res) => {
  try {
    // Check if system-level credentials are set
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return res.status(400).json({ 
        message: 'Cannot delete system-level AWS credentials. To modify them, edit the backend.env file directly.' 
      });
    }

    const result = await AwsCredentials.deleteOne({ userId: req.user._id });
    
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'AWS credentials not found' });
    }
    
    res.json({ message: 'AWS credentials deleted successfully' });
  } catch (error) {
    console.error('Error deleting AWS credentials:', error);
    res.status(500).json({ message: 'Error deleting AWS credentials' });
  }
});

// @route   POST /api/aws-credentials/verify
// @desc    Verify AWS credentials without saving
// @access  Private
router.post('/verify', protect, async (req, res) => {
  try {
    const { accessKeyId, secretAccessKey, region } = req.body;
    
    if (!accessKeyId || !secretAccessKey || !region) {
      return res.status(400).json({ message: 'All fields are required' });
    }
    
    // Set up temporary AWS config
    const tempAWS = new AWS.Config({
      accessKeyId,
      secretAccessKey,
      region
    });
    
    const route53 = new AWS.Route53({ credentials: tempAWS.credentials, region });
    
    try {
      await route53.listHostedZones().promise();
      res.json({ message: 'AWS credentials successfully verified', valid: true });
    } catch (err) {
      console.error('Verification failed:', err);
      res.status(400).json({ 
        message: 'AWS credentials verification failed', 
        valid: false,
        error: err.code || err.message 
      });
    }
  } catch (error) {
    console.error('Error verifying credentials:', error);
    res.status(500).json({ message: 'Error verifying AWS credentials' });
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