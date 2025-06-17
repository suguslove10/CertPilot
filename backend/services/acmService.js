const AWS = require('aws-sdk');

/**
 * Get all ACM certificates across regions
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Array>} - List of ACM certificates
 */
const getAllCertificates = async (credentials = null) => {
  try {
    // Use provided credentials or use global AWS config
    const ec2 = credentials 
      ? new AWS.EC2({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region: credentials.region || 'us-east-1'
        })
      : new AWS.EC2();
    
    // Get list of all AWS regions
    const regions = await ec2.describeRegions().promise();
    
    // Fetch certificates from all regions
    const certPromises = regions.Regions.map(async (region) => {
      try {
        const acm = credentials
          ? new AWS.ACM({
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              region: region.RegionName
            })
          : new AWS.ACM({ region: region.RegionName });
        
        const certificates = await acm.listCertificates().promise();
        
        // For each certificate summary, get full details
        const detailedCerts = await Promise.all(certificates.CertificateSummaryList.map(async (cert) => {
          try {
            const details = await acm.describeCertificate({
              CertificateArn: cert.CertificateArn
            }).promise();
            
            // Get tags for this certificate
            const tagsResult = await acm.listTagsForCertificate({
              CertificateArn: cert.CertificateArn
            }).promise();
            
            return {
              arn: cert.CertificateArn,
              domainName: cert.DomainName,
              status: cert.Status,
              type: cert.Type,
              region: region.RegionName,
              inUse: cert.InUse,
              subjectAlternativeNames: details.Certificate.SubjectAlternativeNames,
              domainValidationOptions: details.Certificate.DomainValidationOptions,
              issuer: details.Certificate.Issuer,
              keyAlgorithm: details.Certificate.KeyAlgorithm,
              notBefore: details.Certificate.NotBefore,
              notAfter: details.Certificate.NotAfter,
              serial: details.Certificate.Serial,
              signatureAlgorithm: details.Certificate.SignatureAlgorithm,
              subject: details.Certificate.Subject,
              createdAt: details.Certificate.CreatedAt,
              issuedAt: details.Certificate.IssuedAt,
              importedAt: details.Certificate.ImportedAt,
              renewalEligibility: details.Certificate.RenewalEligibility,
              keyUsages: details.Certificate.KeyUsages,
              extendedKeyUsages: details.Certificate.ExtendedKeyUsages,
              renewalSummary: details.Certificate.RenewalSummary,
              tags: tagsResult.Tags,
              failureReason: details.Certificate.FailureReason
            };
          } catch (error) {
            console.error(`Error fetching details for certificate ${cert.CertificateArn}:`, error);
            return {
              arn: cert.CertificateArn,
              domainName: cert.DomainName,
              status: cert.Status,
              type: cert.Type,
              region: region.RegionName,
              inUse: cert.InUse,
              error: error.message
            };
          }
        }));
        
        return detailedCerts;
      } catch (error) {
        console.error(`Error fetching certificates for region ${region.RegionName}:`, error);
        return [];
      }
    });
    
    // Wait for all regions to complete
    const certificatesByRegion = await Promise.all(certPromises);
    
    // Flatten the array
    return certificatesByRegion.flat();
  } catch (error) {
    console.error('Error fetching ACM certificates:', error);
    throw error;
  }
};

/**
 * Request a new certificate from ACM
 * @param {Object} params - Parameters
 * @param {string} params.domainName - Primary domain name
 * @param {Array<string>} params.subjectAlternativeNames - Additional domain names
 * @param {string} params.validationMethod - Validation method (DNS or EMAIL)
 * @param {string} params.region - AWS region
 * @param {Array<Object>} params.tags - Certificate tags
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Request result with certificate ARN
 */
const requestCertificate = async (params, credentials = null) => {
  try {
    const { domainName, subjectAlternativeNames, validationMethod, region, tags } = params;
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    const requestParams = {
      DomainName: domainName,
      ValidationMethod: validationMethod || 'DNS',
      IdempotencyToken: Date.now().toString(),
      Tags: tags || []
    };
    
    if (subjectAlternativeNames && subjectAlternativeNames.length > 0) {
      requestParams.SubjectAlternativeNames = subjectAlternativeNames;
    }
    
    const result = await acm.requestCertificate(requestParams).promise();
    
    // Get certificate details
    const details = await acm.describeCertificate({
      CertificateArn: result.CertificateArn
    }).promise();
    
    return {
      certificateArn: result.CertificateArn,
      status: details.Certificate.Status,
      domainName,
      subjectAlternativeNames,
      validationMethod,
      region,
      domainValidationOptions: details.Certificate.DomainValidationOptions
    };
  } catch (error) {
    console.error('Error requesting ACM certificate:', error);
    throw error;
  }
};

/**
 * Delete a certificate from ACM
 * @param {Object} params - Parameters
 * @param {string} params.certificateArn - Certificate ARN
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Delete result
 */
const deleteCertificate = async (params, credentials = null) => {
  try {
    const { certificateArn, region } = params;
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    await acm.deleteCertificate({
      CertificateArn: certificateArn
    }).promise();
    
    return {
      certificateArn,
      status: 'deleted',
      region
    };
  } catch (error) {
    console.error(`Error deleting certificate ${params.certificateArn}:`, error);
    throw error;
  }
};

/**
 * Get detailed information about a specific certificate
 * @param {Object} params - Parameters
 * @param {string} params.certificateArn - Certificate ARN
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Certificate details
 */
const getCertificateDetails = async (params, credentials = null) => {
  try {
    const { certificateArn, region } = params;
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    // Get certificate details
    const details = await acm.describeCertificate({
      CertificateArn: certificateArn
    }).promise();
    
    // Get tags for this certificate
    const tagsResult = await acm.listTagsForCertificate({
      CertificateArn: certificateArn
    }).promise();
    
    // Export certificate if possible
    let exportData = null;
    if (details.Certificate.Status === 'ISSUED' && details.Certificate.Type === 'IMPORTED') {
      try {
        const exportResult = await acm.exportCertificate({
          CertificateArn: certificateArn
        }).promise();
        
        exportData = {
          certificate: exportResult.Certificate,
          certificateChain: exportResult.CertificateChain,
          privateKey: '[REDACTED]' // Private key is available in the actual result
        };
      } catch (e) {
        console.log(`Certificate export not available for ${certificateArn}: ${e.message}`);
      }
    }
    
    // Get resource records for DNS validation
    const validationOptions = details.Certificate.DomainValidationOptions.map(option => {
      return {
        domainName: option.DomainName,
        validationDomain: option.ValidationDomain,
        validationStatus: option.ValidationStatus,
        validationMethod: option.ValidationMethod,
        validationEmails: option.ValidationEmails,
        resourceRecord: option.ResourceRecord,
        validationStatus: option.ValidationStatus
      };
    });
    
    return {
      arn: certificateArn,
      domainName: details.Certificate.DomainName,
      status: details.Certificate.Status,
      type: details.Certificate.Type,
      region: region,
      subjectAlternativeNames: details.Certificate.SubjectAlternativeNames,
      domainValidationOptions: validationOptions,
      issuer: details.Certificate.Issuer,
      keyAlgorithm: details.Certificate.KeyAlgorithm,
      notBefore: details.Certificate.NotBefore,
      notAfter: details.Certificate.NotAfter,
      serial: details.Certificate.Serial,
      signatureAlgorithm: details.Certificate.SignatureAlgorithm,
      subject: details.Certificate.Subject,
      createdAt: details.Certificate.CreatedAt,
      issuedAt: details.Certificate.IssuedAt,
      importedAt: details.Certificate.ImportedAt,
      renewalEligibility: details.Certificate.RenewalEligibility,
      keyUsages: details.Certificate.KeyUsages,
      extendedKeyUsages: details.Certificate.ExtendedKeyUsages,
      renewalSummary: details.Certificate.RenewalSummary,
      tags: tagsResult.Tags,
      failureReason: details.Certificate.FailureReason,
      exportData
    };
  } catch (error) {
    console.error(`Error fetching details for certificate ${params.certificateArn}:`, error);
    throw error;
  }
};

/**
 * Import a certificate into ACM
 * @param {Object} params - Parameters
 * @param {string} params.certificate - PEM-encoded certificate
 * @param {string} params.privateKey - PEM-encoded private key
 * @param {string} params.certificateChain - PEM-encoded certificate chain (optional)
 * @param {Array<Object>} params.tags - Certificate tags (optional)
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Import result with certificate ARN
 */
const importCertificate = async (params, credentials = null) => {
  try {
    const { certificate, privateKey, certificateChain, tags, region } = params;
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    const importParams = {
      Certificate: certificate,
      PrivateKey: privateKey,
      Tags: tags || []
    };
    
    if (certificateChain) {
      importParams.CertificateChain = certificateChain;
    }
    
    const result = await acm.importCertificate(importParams).promise();
    
    // Get certificate details
    const details = await acm.describeCertificate({
      CertificateArn: result.CertificateArn
    }).promise();
    
    return {
      certificateArn: result.CertificateArn,
      status: details.Certificate.Status,
      domainName: details.Certificate.DomainName,
      region
    };
  } catch (error) {
    console.error('Error importing certificate into ACM:', error);
    throw error;
  }
};

/**
 * Add tags to a certificate
 * @param {Object} params - Parameters
 * @param {string} params.certificateArn - Certificate ARN
 * @param {Array<Object>} params.tags - Tags to add
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
const addTagsToCertificate = async (params, credentials = null) => {
  try {
    const { certificateArn, tags, region } = params;
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    await acm.addTagsToCertificate({
      CertificateArn: certificateArn,
      Tags: tags
    }).promise();
    
    return {
      certificateArn,
      tags,
      status: 'tags_added'
    };
  } catch (error) {
    console.error(`Error adding tags to certificate ${params.certificateArn}:`, error);
    throw error;
  }
};

/**
 * Remove tags from a certificate
 * @param {Object} params - Parameters
 * @param {string} params.certificateArn - Certificate ARN
 * @param {Array<Object>} params.tags - Tags to remove
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
const removeTagsFromCertificate = async (params, credentials = null) => {
  try {
    const { certificateArn, tags, region } = params;
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    await acm.removeTagsFromCertificate({
      CertificateArn: certificateArn,
      Tags: tags
    }).promise();
    
    return {
      certificateArn,
      tags,
      status: 'tags_removed'
    };
  } catch (error) {
    console.error(`Error removing tags from certificate ${params.certificateArn}:`, error);
    throw error;
  }
};

/**
 * Resend validation email for a certificate
 * @param {Object} params - Parameters
 * @param {string} params.certificateArn - Certificate ARN
 * @param {string} params.domain - Domain for which to resend validation
 * @param {string} params.validationDomain - Domain where validation email will be sent
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Result of the operation
 */
const resendValidationEmail = async (params, credentials = null) => {
  try {
    const { certificateArn, domain, validationDomain, region } = params;
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    await acm.resendValidationEmail({
      CertificateArn: certificateArn,
      Domain: domain,
      ValidationDomain: validationDomain
    }).promise();
    
    return {
      certificateArn,
      domain,
      validationDomain,
      status: 'validation_email_resent'
    };
  } catch (error) {
    console.error(`Error resending validation email for certificate ${params.certificateArn}:`, error);
    throw error;
  }
};

/**
 * Create Route53 records for DNS validation
 * @param {Object} params - Parameters
 * @param {string} params.certificateArn - Certificate ARN
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Array>} - Array of created records
 */
const createDnsValidationRecords = async (params, credentials = null) => {
  try {
    const { certificateArn, region } = params;
    
    // Get certificate details
    const certDetails = await getCertificateDetails({ certificateArn, region }, credentials);
    
    if (!certDetails.domainValidationOptions) {
      throw new Error('No domain validation options found');
    }
    
    // Create Route53 client
    const route53 = credentials
      ? new AWS.Route53({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey
        })
      : new AWS.Route53();
    
    // Get hosted zones
    const hostedZonesResult = await route53.listHostedZones().promise();
    
    const results = [];
    
    // For each domain validation option with a resource record
    for (const validationOption of certDetails.domainValidationOptions) {
      if (!validationOption.resourceRecord) {
        results.push({
          domain: validationOption.domainName,
          status: 'skipped',
          reason: 'No resource record available'
        });
        continue;
      }
      
      // Find the best matching hosted zone
      const domain = validationOption.domainName;
      const hostedZones = hostedZonesResult.HostedZones.filter(zone => 
        domain.endsWith(zone.Name.slice(0, -1)) // Remove trailing dot
      ).sort((a, b) => b.Name.length - a.Name.length); // Longest match first
      
      if (hostedZones.length === 0) {
        results.push({
          domain,
          status: 'error',
          reason: 'No matching hosted zone found'
        });
        continue;
      }
      
      const hostedZone = hostedZones[0];
      
      // Create the DNS record
      try {
        const record = validationOption.resourceRecord;
        
        await route53.changeResourceRecordSets({
          HostedZoneId: hostedZone.Id,
          ChangeBatch: {
            Changes: [
              {
                Action: 'UPSERT',
                ResourceRecordSet: {
                  Name: record.Name,
                  Type: record.Type,
                  TTL: 300,
                  ResourceRecords: [
                    { Value: record.Value }
                  ]
                }
              }
            ]
          }
        }).promise();
        
        results.push({
          domain,
          hostedZoneId: hostedZone.Id,
          hostedZoneName: hostedZone.Name,
          recordName: record.Name,
          recordType: record.Type,
          recordValue: record.Value,
          status: 'created'
        });
      } catch (error) {
        console.error(`Error creating DNS record for ${domain}:`, error);
        results.push({
          domain,
          hostedZoneId: hostedZone.Id,
          hostedZoneName: hostedZone.Name,
          status: 'error',
          reason: error.message
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error(`Error creating DNS validation records for certificate ${params.certificateArn}:`, error);
    throw error;
  }
};

/**
 * Renew an ACM certificate (if eligible)
 * @param {Object} params - Parameters
 * @param {string} params.certificateArn - Certificate ARN
 * @param {string} params.region - AWS region
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Renewal result
 */
const renewCertificate = async (params, credentials = null) => {
  try {
    const { certificateArn, region } = params;
    
    // First check if the certificate is eligible for renewal
    const certDetails = await getCertificateDetails({ certificateArn, region }, credentials);
    
    if (certDetails.renewalEligibility !== 'ELIGIBLE') {
      return {
        certificateArn,
        status: 'not_eligible',
        reason: `Certificate renewal eligibility is ${certDetails.renewalEligibility}`
      };
    }
    
    const acm = credentials
      ? new AWS.ACM({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.ACM({ region });
    
    // Renew the certificate
    await acm.renewCertificate({
      CertificateArn: certificateArn
    }).promise();
    
    return {
      certificateArn,
      status: 'renewal_requested',
      region
    };
  } catch (error) {
    console.error(`Error renewing certificate ${params.certificateArn}:`, error);
    throw error;
  }
};

module.exports = {
  getAllCertificates,
  requestCertificate,
  deleteCertificate,
  getCertificateDetails,
  importCertificate,
  addTagsToCertificate,
  removeTagsFromCertificate,
  resendValidationEmail,
  createDnsValidationRecords,
  renewCertificate
};
