const Certificate = require('../models/Certificate');
const nodemailer = require('nodemailer');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { X509Certificate } = require('@peculiar/x509');

// Email configuration - in production, use proper email settings
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.example.com',
  port: process.env.SMTP_PORT || 587,
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || ''
  }
});

/**
 * Check all certificates for expiration and send alerts
 */
const checkCertificateExpiration = async () => {
  try {
    console.log('Starting certificate expiration check');
    const now = new Date();
    const certificates = await Certificate.find({
      status: { $in: ['issued', 'installed'] },
      expiryDate: { $ne: null }
    }).populate('userId');

    console.log(`Found ${certificates.length} certificates to check`);
    
    const alertPromises = certificates.map(async (cert) => {
      if (!cert.alertSettings.enabled) {
        return { certificate: cert.domain, status: 'alerts disabled' };
      }

      // Calculate days until expiration
      const daysUntilExpiry = Math.floor((cert.expiryDate - now) / (1000 * 60 * 60 * 24));
      
      // Check if we need to alert for any thresholds
      const thresholdsToAlert = cert.alertSettings.thresholds.filter(threshold => 
        daysUntilExpiry <= threshold && 
        daysUntilExpiry > 0 && 
        !cert.alertHistory.some(alert => 
          alert.threshold === threshold && 
          (new Date(alert.date) > new Date(now - 24 * 60 * 60 * 1000))
        )
      );

      if (thresholdsToAlert.length === 0) {
        return { certificate: cert.domain, status: 'no alerts needed' };
      }

      // Send alerts for each threshold
      const alertResults = await Promise.all(thresholdsToAlert.map(async (threshold) => {
        try {
          const alertPromises = cert.alertSettings.channels.map(async (channel) => {
            try {
              await sendAlert(cert, channel, threshold, daysUntilExpiry);
              
              // Record successful alert
              cert.alertHistory.push({
                date: new Date(),
                threshold,
                channel: channel.type,
                status: 'sent',
                message: `Alert sent for certificate expiring in ${daysUntilExpiry} days`
              });

              return { channel: channel.type, status: 'sent' };
            } catch (error) {
              console.error(`Error sending ${channel.type} alert:`, error);
              
              // Record failed alert
              cert.alertHistory.push({
                date: new Date(),
                threshold,
                channel: channel.type,
                status: 'failed',
                message: error.message
              });

              return { channel: channel.type, status: 'failed', error: error.message };
            }
          });

          return Promise.all(alertPromises);
        } catch (error) {
          console.error(`Error processing alert for threshold ${threshold}:`, error);
          return { threshold, status: 'error', error: error.message };
        }
      }));

      // Update the certificate
      cert.lastCheckDate = now;
      await cert.save();

      return { certificate: cert.domain, alerts: alertResults };
    });

    return Promise.all(alertPromises);
  } catch (error) {
    console.error('Error checking certificate expiration:', error);
    throw error;
  }
};

/**
 * Send an alert through the specified channel
 */
const sendAlert = async (certificate, channel, threshold, daysLeft) => {
  const alertMessage = `Certificate for ${certificate.domain} will expire in ${daysLeft} days`;
  
  switch (channel.type) {
    case 'email':
      return sendEmailAlert(channel.destination, certificate, daysLeft);
    
    case 'webhook':
      return sendWebhookAlert(channel.destination, certificate, daysLeft);
    
    case 'in-app':
      // This would be handled by the frontend
      return { status: 'sent', message: 'In-app notification registered' };
    
    default:
      throw new Error(`Unsupported alert channel: ${channel.type}`);
  }
};

/**
 * Send an email alert
 */
const sendEmailAlert = async (email, certificate, daysLeft) => {
  const emailContent = {
    from: process.env.SMTP_FROM || 'certpilot@example.com',
    to: email,
    subject: `Certificate Expiration Alert: ${certificate.domain} (${daysLeft} days)`,
    html: `
      <h2>Certificate Expiration Alert</h2>
      <p>Your certificate for <strong>${certificate.domain}</strong> will expire in <strong>${daysLeft} days</strong>.</p>
      <p>Details:</p>
      <ul>
        <li>Domain: ${certificate.domain}</li>
        <li>Issue Date: ${certificate.issueDate ? new Date(certificate.issueDate).toLocaleString() : 'N/A'}</li>
        <li>Expiry Date: ${certificate.expiryDate ? new Date(certificate.expiryDate).toLocaleString() : 'N/A'}</li>
        <li>Status: ${certificate.status}</li>
      </ul>
      <p>Please log in to CertPilot to renew this certificate.</p>
    `
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('Email alert would be sent:', emailContent);
    return { status: 'sent', message: 'Email alert simulated in non-production environment' };
  }

  return emailTransporter.sendMail(emailContent);
};

/**
 * Send a webhook alert
 */
const sendWebhookAlert = async (webhookUrl, certificate, daysLeft) => {
  const payload = {
    event: 'certificate_expiring',
    domain: certificate.domain,
    daysLeft,
    expiryDate: certificate.expiryDate,
    issueDate: certificate.issueDate,
    status: certificate.status
  };

  if (process.env.NODE_ENV !== 'production') {
    console.log('Webhook alert would be sent:', { webhookUrl, payload });
    return { status: 'sent', message: 'Webhook alert simulated in non-production environment' };
  }

  const response = await axios.post(webhookUrl, payload);
  return { status: response.status === 200 ? 'sent' : 'failed', message: response.statusText };
};

/**
 * Check actual certificate files to update expiration dates
 */
const updateCertificateMetadata = async () => {
  try {
    const certificates = await Certificate.find({
      status: { $in: ['issued', 'installed'] },
      certPath: { $ne: null }
    });

    console.log(`Updating metadata for ${certificates.length} certificates`);

    const results = await Promise.all(certificates.map(async (cert) => {
      try {
        if (!cert.certPath) {
          return { domain: cert.domain, status: 'skipped', reason: 'no cert path' };
        }

        // Read the certificate file
        const certContent = await fs.readFile(cert.certPath, 'utf8');
        const x509Cert = new X509Certificate(certContent);
        
        // Update expiration date if different
        const notAfter = x509Cert.notAfter;
        if (notAfter && (!cert.expiryDate || new Date(notAfter).getTime() !== new Date(cert.expiryDate).getTime())) {
          cert.expiryDate = new Date(notAfter);
          await cert.save();
          return { domain: cert.domain, status: 'updated', expiryDate: cert.expiryDate };
        }
        
        return { domain: cert.domain, status: 'no change needed' };
      } catch (error) {
        console.error(`Error updating metadata for ${cert.domain}:`, error);
        return { domain: cert.domain, status: 'error', error: error.message };
      }
    }));

    return results;
  } catch (error) {
    console.error('Error updating certificate metadata:', error);
    throw error;
  }
};

/**
 * Generate a report of all certificates and their renewal status
 */
const generateCertificateReport = async () => {
  try {
    const certificates = await Certificate.find()
      .populate('subdomainId')
      .lean();
    
    // Return empty array if no certificates found
    if (!certificates || certificates.length === 0) {
      console.log('No certificates found for report');
      return [];
    }
    
    const now = new Date();
    
    return certificates.map(cert => {
      // Calculate days until expiry
      let daysUntilExpiry = null;
      try {
        if (cert.expiryDate) {
          daysUntilExpiry = Math.floor((new Date(cert.expiryDate) - now) / (1000 * 60 * 60 * 24));
        }
      } catch (error) {
        console.error(`Error calculating days until expiry for certificate ${cert._id}:`, error);
      }
      
      // Determine status category
      let statusCategory;
      if (!cert.expiryDate) {
        statusCategory = 'unknown';
      } else if (daysUntilExpiry < 0) {
        statusCategory = 'expired';
      } else if (daysUntilExpiry <= 7) {
        statusCategory = 'critical';
      } else if (daysUntilExpiry <= 30) {
        statusCategory = 'warning';
      } else {
        statusCategory = 'healthy';
      }
      
      // Create safe certificate object with fallbacks for missing data
      return {
        id: cert._id ? cert._id.toString() : 'unknown',
        domain: cert.domain || 'unknown',
        status: cert.status || 'unknown',
        issueDate: cert.issueDate || null,
        expiryDate: cert.expiryDate || null,
        daysUntilExpiry: daysUntilExpiry,
        statusCategory: statusCategory,
        subdomain: cert.subdomainId ? cert.subdomainId.name : null,
        parentDomain: cert.subdomainId ? cert.subdomainId.parentDomain : null,
        isTraefikManaged: !!cert.traefikRouter,
        provider: cert.provider || 'letsencrypt',
        lastRenewal: cert.renewalHistory && cert.renewalHistory.length > 0 
          ? cert.renewalHistory[cert.renewalHistory.length - 1].date 
          : null
      };
    });
  } catch (error) {
    console.error('Error generating certificate report:', error);
    // Return empty array rather than throwing to avoid breaking frontend
    return [];
  }
};

module.exports = {
  checkCertificateExpiration,
  updateCertificateMetadata,
  generateCertificateReport
};
