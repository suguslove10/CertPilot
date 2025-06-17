const AWS = require('aws-sdk');
const AwsCredentials = require('../models/AwsCredentials');

// Get AWS credentials for a user and configure AWS SDK
const getAwsConfigForUser = async (userId) => {
  try {
    const credentials = await AwsCredentials.findOne({ userId });
    
    if (!credentials) {
      throw new Error('AWS credentials not found for this user');
    }
    
    // We need to decrypt the secret key before using it
    const secretAccessKey = credentials.secretAccessKey;
    // In a production environment, you would decrypt the secret key here
    
    return {
      accessKeyId: credentials.accessKeyId,
      secretAccessKey, // This would be the decrypted secret in production
      region: credentials.region
    };
  } catch (error) {
    throw error;
  }
};

// Create Route53 instance for user
const getRoute53ForUser = async (userId) => {
  try {
    const config = await getAwsConfigForUser(userId);
    return new AWS.Route53(config);
  } catch (error) {
    throw error;
  }
};

// List hosted zones
const listHostedZones = async (userId) => {
  try {
    const route53 = await getRoute53ForUser(userId);
    
    return new Promise((resolve, reject) => {
      route53.listHostedZones({}, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data.HostedZones);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

// Create DNS record
const createDnsRecord = async (userId, hostedZoneId, recordName, recordType, recordValue, ttl = 300) => {
  try {
    const route53 = await getRoute53ForUser(userId);
    
    const params = {
      ChangeBatch: {
        Changes: [
          {
            Action: 'UPSERT',
            ResourceRecordSet: {
              Name: recordName,
              ResourceRecords: [
                {
                  Value: recordValue
                }
              ],
              TTL: ttl,
              Type: recordType
            }
          }
        ],
        Comment: `Created by CertPilot`
      },
      HostedZoneId: hostedZoneId
    };
    
    return new Promise((resolve, reject) => {
      route53.changeResourceRecordSets(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
  } catch (error) {
    throw error;
  }
};

module.exports = {
  getAwsConfigForUser,
  getRoute53ForUser,
  listHostedZones,
  createDnsRecord
}; 