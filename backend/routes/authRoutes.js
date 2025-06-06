const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/authMiddleware');
const AWS = require('aws-sdk');
const AwsCredentials = require('../models/AwsCredentials');
const crypto = require('crypto');

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d',
  });
};

// Test route for DNS
router.get('/test-dns', protect, async (req, res) => {
  try {
    // Get user's AWS credentials
    const awsCredentials = await AwsCredentials.findOne({ userId: req.user._id });
    if (!awsCredentials) {
      return res.status(404).json({ message: 'AWS credentials not found' });
    }

    // Configure Route53
    const route53 = new AWS.Route53({
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.getDecryptedSecretKey(),
      region: awsCredentials.region
    });

    // Get hosted zones
    const { HostedZones } = await route53.listHostedZones().promise();
    
    // Find zone for thesugu.com
    const hostedZone = HostedZones.find(
      zone => zone.Name.includes('thesugu.com')
    );
    
    if (!hostedZone) {
      return res.status(404).json({ message: 'Hosted zone not found' });
    }
    
    const hostedZoneId = hostedZone.Id.split('/').pop();
    
    // Create a test TXT record
    const testValue = `test-${Date.now()}`;
    const dnsParams = {
      HostedZoneId: hostedZoneId,
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: `_acme-test.thesugu.com.`,
              Type: 'TXT',
              TTL: 60,
              ResourceRecords: [
                {
                  Value: `"${testValue}"`
                }
              ]
            }
          }
        ]
      }
    };
    
    const result = await route53.changeResourceRecordSets(dnsParams).promise();
    
    return res.json({ 
      success: true, 
      message: 'Test DNS record created', 
      testValue,
      recordName: '_acme-test.thesugu.com',
      changeInfo: result.ChangeInfo 
    });
  } catch (error) {
    console.error('DNS test error:', error);
    return res.status(500).json({ message: error.message });
  }
});

// @route   POST /api/auth/register
// @desc    Register a new user
// @access  Public
router.post('/register', async (req, res) => {
  console.log('Registration request received:', req.body);
  
  const { name, email, password } = req.body;
  
  // Validate request body
  if (!name || !email || !password) {
    console.log('Validation failed - missing required fields');
    return res.status(400).json({ message: 'Please provide all required fields' });
  }

  try {
    console.log('Checking if user exists with email:', email);
    // Check if user already exists
    const userExists = await User.findOne({ email });

    if (userExists) {
      console.log('User already exists with this email');
      return res.status(400).json({ message: 'User already exists' });
    }

    console.log('Creating new user');
    // Create new user
    const user = await User.create({
      name,
      email,
      password,
    });

    if (user) {
      console.log('User created successfully:', user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      console.log('Failed to create user with provided data');
      res.status(400).json({ message: 'Invalid user data' });
    }
  } catch (error) {
    console.error('Error in user registration:', error);
    res.status(500).json({ message: 'Server error', error: error.toString() });
  }
});

// @route   POST /api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post('/login', async (req, res) => {
  console.log('Login request received:', { email: req.body.email });
  
  const { email, password } = req.body;

  try {
    // Check for user email
    const user = await User.findOne({ email });

    if (user && (await user.matchPassword(password))) {
      console.log('Login successful for user:', user._id);
      res.json({
        _id: user._id,
        name: user.name,
        email: user.email,
        token: generateToken(user._id),
      });
    } else {
      console.log('Invalid email or password');
      res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    console.error('Error in login:', error);
    res.status(500).json({ message: 'Server error', error: error.toString() });
  }
});

// @route   GET /api/auth/me
// @desc    Get user profile
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 