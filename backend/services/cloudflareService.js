const axios = require('axios');
const CloudflareCredentials = require('../models/CloudflareCredentials');

// Base URL for Cloudflare API
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Get client for Cloudflare API
 * @param {string} apiToken - Cloudflare API token
 * @returns {Object} - Axios client configured for Cloudflare
 */
const getCloudflareClient = (apiToken) => {
  return axios.create({
    baseURL: CLOUDFLARE_API_BASE,
    headers: {
      'Authorization': `Bearer ${apiToken}`,
      'Content-Type': 'application/json'
    }
  });
};

/**
 * Verify Cloudflare credentials
 * @param {string} apiToken - Cloudflare API token
 * @returns {Promise<Object>} - Verification result
 */
const verifyCredentials = async (apiToken) => {
  try {
    const client = getCloudflareClient(apiToken);
    const response = await client.get('/user/tokens/verify');
    
    if (response.data.success) {
      return {
        valid: true,
        message: 'Cloudflare credentials verified successfully',
        user: response.data.result
      };
    } else {
      return {
        valid: false,
        message: 'Failed to verify Cloudflare credentials',
        errors: response.data.errors
      };
    }
  } catch (error) {
    console.error('Error verifying Cloudflare credentials:', error.response?.data || error.message);
    return {
      valid: false,
      message: 'Error verifying Cloudflare credentials',
      error: error.response?.data?.errors || error.message
    };
  }
};

/**
 * List Cloudflare zones (domains)
 * @param {Object} credentials - Cloudflare credentials with API token
 * @returns {Promise<Array>} - List of zones
 */
const listZones = async (apiToken) => {
  try {
    const client = getCloudflareClient(apiToken);
    const response = await client.get('/zones');
    
    if (response.data.success) {
      return {
        success: true,
        zones: response.data.result.map(zone => ({
          id: zone.id,
          name: zone.name,
          status: zone.status,
          type: zone.type,
          nameServers: zone.name_servers,
          originalRegistrar: zone.original_registrar,
          originalDnshost: zone.original_dnshost,
          createdOn: zone.created_on,
          modifiedOn: zone.modified_on
        }))
      };
    } else {
      return {
        success: false,
        message: 'Failed to list Cloudflare zones',
        errors: response.data.errors
      };
    }
  } catch (error) {
    console.error('Error listing Cloudflare zones:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error listing Cloudflare zones',
      error: error.response?.data?.errors || error.message
    };
  }
};

/**
 * Get DNS records for a zone
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Zone ID
 * @returns {Promise<Array>} - List of DNS records
 */
const listDnsRecords = async (apiToken, zoneId) => {
  try {
    const client = getCloudflareClient(apiToken);
    const response = await client.get(`/zones/${zoneId}/dns_records`);
    
    if (response.data.success) {
      return {
        success: true,
        records: response.data.result.map(record => ({
          id: record.id,
          type: record.type,
          name: record.name,
          content: record.content,
          ttl: record.ttl,
          proxied: record.proxied,
          createdOn: record.created_on,
          modifiedOn: record.modified_on
        }))
      };
    } else {
      return {
        success: false,
        message: 'Failed to list DNS records',
        errors: response.data.errors
      };
    }
  } catch (error) {
    console.error('Error listing DNS records:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error listing DNS records',
      error: error.response?.data?.errors || error.message
    };
  }
};

/**
 * Create a DNS record
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Zone ID
 * @param {Object} recordData - DNS record data
 * @returns {Promise<Object>} - Created DNS record
 */
const createDnsRecord = async (apiToken, zoneId, recordData) => {
  try {
    const client = getCloudflareClient(apiToken);
    const response = await client.post(`/zones/${zoneId}/dns_records`, recordData);
    
    if (response.data.success) {
      return {
        success: true,
        record: {
          id: response.data.result.id,
          type: response.data.result.type,
          name: response.data.result.name,
          content: response.data.result.content,
          ttl: response.data.result.ttl,
          proxied: response.data.result.proxied,
          createdOn: response.data.result.created_on,
          modifiedOn: response.data.result.modified_on
        }
      };
    } else {
      return {
        success: false,
        message: 'Failed to create DNS record',
        errors: response.data.errors
      };
    }
  } catch (error) {
    console.error('Error creating DNS record:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error creating DNS record',
      error: error.response?.data?.errors || error.message
    };
  }
};

/**
 * Create a TXT record for ACME challenge
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Zone ID
 * @param {string} recordName - Record name
 * @param {string} recordValue - Record value
 * @returns {Promise<Object>} - Created DNS record
 */
const createAcmeChallengeTxtRecord = async (apiToken, zoneId, recordName, recordValue) => {
  const recordData = {
    type: 'TXT',
    name: recordName,
    content: recordValue,
    ttl: 120, // 2 minutes for quick propagation
    proxied: false
  };
  
  return createDnsRecord(apiToken, zoneId, recordData);
};

/**
 * Update a DNS record
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Zone ID
 * @param {string} recordId - Record ID
 * @param {Object} recordData - DNS record data
 * @returns {Promise<Object>} - Updated DNS record
 */
const updateDnsRecord = async (apiToken, zoneId, recordId, recordData) => {
  try {
    const client = getCloudflareClient(apiToken);
    const response = await client.put(`/zones/${zoneId}/dns_records/${recordId}`, recordData);
    
    if (response.data.success) {
      return {
        success: true,
        record: {
          id: response.data.result.id,
          type: response.data.result.type,
          name: response.data.result.name,
          content: response.data.result.content,
          ttl: response.data.result.ttl,
          proxied: response.data.result.proxied,
          createdOn: response.data.result.created_on,
          modifiedOn: response.data.result.modified_on
        }
      };
    } else {
      return {
        success: false,
        message: 'Failed to update DNS record',
        errors: response.data.errors
      };
    }
  } catch (error) {
    console.error('Error updating DNS record:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error updating DNS record',
      error: error.response?.data?.errors || error.message
    };
  }
};

/**
 * Delete a DNS record
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Zone ID
 * @param {string} recordId - Record ID
 * @returns {Promise<Object>} - Deletion result
 */
const deleteDnsRecord = async (apiToken, zoneId, recordId) => {
  try {
    const client = getCloudflareClient(apiToken);
    const response = await client.delete(`/zones/${zoneId}/dns_records/${recordId}`);
    
    if (response.data.success) {
      return {
        success: true,
        message: 'DNS record deleted successfully'
      };
    } else {
      return {
        success: false,
        message: 'Failed to delete DNS record',
        errors: response.data.errors
      };
    }
  } catch (error) {
    console.error('Error deleting DNS record:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error deleting DNS record',
      error: error.response?.data?.errors || error.message
    };
  }
};

/**
 * Purge cache for a zone
 * @param {string} apiToken - Cloudflare API token
 * @param {string} zoneId - Zone ID
 * @returns {Promise<Object>} - Purge result
 */
const purgeCache = async (apiToken, zoneId) => {
  try {
    const client = getCloudflareClient(apiToken);
    const response = await client.post(`/zones/${zoneId}/purge_cache`, {
      purge_everything: true
    });
    
    if (response.data.success) {
      return {
        success: true,
        message: 'Cache purged successfully'
      };
    } else {
      return {
        success: false,
        message: 'Failed to purge cache',
        errors: response.data.errors
      };
    }
  } catch (error) {
    console.error('Error purging cache:', error.response?.data || error.message);
    return {
      success: false,
      message: 'Error purging cache',
      error: error.response?.data?.errors || error.message
    };
  }
};

module.exports = {
  verifyCredentials,
  listZones,
  listDnsRecords,
  createDnsRecord,
  createAcmeChallengeTxtRecord,
  updateDnsRecord,
  deleteDnsRecord,
  purgeCache
}; 