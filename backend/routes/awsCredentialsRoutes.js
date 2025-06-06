const express = require('express');
const router = express.Router();
const AWS = require('aws-sdk');
const AwsCredentials = require('../models/AwsCredentials');
const { protect } = require('../middleware/authMiddleware');

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

  // Validate required fields
  if (!accessKeyId || !secretAccessKey) {
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    // Verify the credentials with AWS
    try {
      await verifyAwsCredentials(accessKeyId, secretAccessKey, region || 'us-east-1');
    } catch (awsError) {
      return res.status(400).json({ 
        message: 'Invalid AWS credentials', 
        error: awsError.message 
      });
    }

    // Check if credentials already exist for this user
    const existingCredentials = await AwsCredentials.findOne({ userId: req.user._id });

    if (existingCredentials) {
      try {
        // For existing credentials, first delete the old one to avoid encryption issues
        await AwsCredentials.deleteOne({ userId: req.user._id });
        
        // Create a new credential entry
        await AwsCredentials.create({
          userId: req.user._id,
          accessKeyId,
          secretAccessKey,
          region: region || 'us-east-1'
        });

        return res.json({ 
          message: 'AWS credentials updated successfully',
          region: region || 'us-east-1'
        });
      } catch (updateError) {
        console.error('Error updating credentials:', updateError);
        return res.status(500).json({ message: 'Failed to update credentials' });
      }
    } else {
      // Create new credentials
      const credentials = await AwsCredentials.create({
        userId: req.user._id,
        accessKeyId,
        secretAccessKey,
        region: region || 'us-east-1'
      });

      return res.status(201).json({ 
        message: 'AWS credentials added successfully',
        region: credentials.region
      });
    }
  } catch (error) {
    console.error('Error managing AWS credentials:', error);
    res.status(500).json({ message: 'Server error' });
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

module.exports = router; 