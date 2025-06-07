const AWS = require('aws-sdk');

/**
 * Middleware to verify AWS credentials and ensure they are properly configured
 */
const verifyAwsCredentials = async () => {
  try {
    // Check if AWS credentials are set in environment variables
    if (process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY) {
      console.log('Verifying AWS credentials from environment variables...');
      
      // Configure AWS with environment variables
      const route53 = new AWS.Route53({
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
        region: process.env.AWS_REGION || 'us-east-1'
      });
      
      // Test the credentials by making a simple API call
      await route53.listHostedZones().promise();
      
      console.log('✅ AWS credentials verified successfully!');
      return true;
    } else {
      console.log('⚠️ AWS credentials not found in environment variables.');
      console.log('Users will be prompted to enter credentials via UI.');
      return false;
    }
  } catch (error) {
    console.error('❌ AWS credential verification failed:', error.message);
    console.log('Users will be prompted to enter credentials via UI.');
    return false;
  }
};

module.exports = { verifyAwsCredentials }; 