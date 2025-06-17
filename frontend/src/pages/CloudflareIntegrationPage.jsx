import React from 'react';
import CloudflareIntegration from '../components/CloudflareIntegration';

const CloudflareIntegrationPage = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Cloudflare Integration</h1>
      <p className="mb-4 text-gray-700">
        Manage your Cloudflare DNS records and certificates from CertPilot. Cloudflare integration 
        allows you to create, update, and delete DNS records, as well as verify domains for certificate issuance.
      </p>
      
      <CloudflareIntegration />
    </div>
  );
};

export default CloudflareIntegrationPage; 