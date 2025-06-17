const AWS = require('aws-sdk');
const User = require('../models/User');

/**
 * Verify if AWS credentials are configured correctly
 * @returns {Promise<boolean>} True if credentials are valid, false otherwise
 */
const verifyAwsCredentials = async () => {
  try {
    // Check if environment variables are set
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      // Test credentials by making a simple API call
      const sts = new AWS.STS();
      await sts.getCallerIdentity().promise();
      return true;
    } else {
      // Look for any user with AWS credentials
      const user = await User.findOne({ 'awsCredentials.accessKeyId': { $exists: true } });
      if (user && user.awsCredentials && user.awsCredentials.accessKeyId && user.awsCredentials.secretAccessKey) {
        // Test the user's credentials
        const sts = new AWS.STS({
          accessKeyId: user.awsCredentials.accessKeyId,
          secretAccessKey: user.awsCredentials.secretAccessKey
        });
        await sts.getCallerIdentity().promise();
        return true;
      }
      
      return false;
    }
  } catch (error) {
    console.error('AWS credentials verification error:', error);
    return false;
  }
};

/**
 * Middleware to verify if AWS credentials are configured
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Express next function
 */
const requireAwsCredentials = async (req, res, next) => {
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
};

/**
 * Get AWS credentials (from environment or database)
 * @returns {Promise<Object|null>} AWS credentials or null if not found
 */
const getAwsCredentials = async () => {
  try {
    // Check if environment variables are set
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      return {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      };
    } else {
      // Look for any user with AWS credentials
      const user = await User.findOne({ 'awsCredentials.accessKeyId': { $exists: true } });
      if (user && user.awsCredentials && user.awsCredentials.accessKeyId && user.awsCredentials.secretAccessKey) {
        return {
          accessKeyId: user.awsCredentials.accessKeyId,
          secretAccessKey: user.awsCredentials.secretAccessKey,
          region: user.awsCredentials.region || 'us-east-1'
        };
      }
      
      return null;
    }
  } catch (error) {
    console.error('Error getting AWS credentials:', error);
    return null;
  }
};

module.exports = {
  verifyAwsCredentials,
  requireAwsCredentials,
  getAwsCredentials
}; 