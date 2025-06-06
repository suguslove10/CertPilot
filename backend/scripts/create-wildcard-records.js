// Script to create wildcard DNS entries for Route53
const AWS = require('aws-sdk');
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

const AwsCredentials = require('../models/AwsCredentials');
const Subdomain = require('../models/Subdomain');

async function createWildcardRecords() {
  try {
    // Use the first AWS credentials found
    const awsCredentials = await AwsCredentials.findOne();
    if (!awsCredentials) {
      console.error('No AWS credentials found');
      process.exit(1);
    }

    // Configure Route53
    const route53 = new AWS.Route53({
      accessKeyId: awsCredentials.accessKeyId,
      secretAccessKey: awsCredentials.getDecryptedSecretKey(),
      region: awsCredentials.region || 'us-east-1'
    });

    // Get all subdomains
    const subdomains = await Subdomain.find();
    if (subdomains.length === 0) {
      console.log('No subdomains found');
      process.exit(0);
    }

    // Map of parent domains to subdomains
    const parentDomains = {};

    // Group subdomains by parent domain
    subdomains.forEach(subdomain => {
      const parentDomain = subdomain.parentDomain;
      if (!parentDomains[parentDomain]) {
        parentDomains[parentDomain] = [];
      }
      parentDomains[parentDomain].push(subdomain.name);
    });

    // Process each parent domain
    for (const [parentDomain, subdomainNames] of Object.entries(parentDomains)) {
      console.log(`Processing parent domain: ${parentDomain}`);

      // Get hosted zone ID
      const { HostedZones } = await route53.listHostedZones().promise();
      const hostedZone = HostedZones.find(zone => 
        zone.Name === `${parentDomain}.` || zone.Name === parentDomain
      );

      if (!hostedZone) {
        console.error(`No hosted zone found for domain: ${parentDomain}`);
        continue;
      }

      const hostedZoneId = hostedZone.Id.split('/').pop();
      console.log(`Using hosted zone: ${hostedZoneId}`);

      // Create wildcard DNS record for ACME challenge
      console.log('Creating wildcard TXT record for ACME challenge');
      const acmeRecordChanges = [];

      for (const subdomainName of subdomainNames) {
        const fullDomainName = `${subdomainName}.${parentDomain}`;
        acmeRecordChanges.push({
          Action: 'UPSERT',
          ResourceRecordSet: {
            Name: `_acme-challenge.${fullDomainName}.`,
            Type: 'TXT',
            TTL: 60,
            ResourceRecords: [
              { Value: '"*"' } // Wildcard value for testing
            ]
          }
        });
      }

      if (acmeRecordChanges.length > 0) {
        // Split into batches of 100 records to avoid AWS limit
        for (let i = 0; i < acmeRecordChanges.length; i += 100) {
          const batch = acmeRecordChanges.slice(i, i + 100);
          console.log(`Processing batch ${i / 100 + 1} with ${batch.length} records`);
          
          const dnsParams = {
            HostedZoneId: hostedZoneId,
            ChangeBatch: {
              Changes: batch
            }
          };
          
          const result = await route53.changeResourceRecordSets(dnsParams).promise();
          console.log('Change batch submitted with ID:', result.ChangeInfo.Id);
        }
      }
    }

    console.log('Successfully updated DNS records');
    process.exit(0);
  } catch (error) {
    console.error('Error creating wildcard records:', error);
    process.exit(1);
  }
}

createWildcardRecords(); 