import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card } from 'react-bootstrap';
import axios from 'axios';

const TraefikDashboard = () => {
  const { user } = useAuth();
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Update the dashboard URL based on the current environment
  useEffect(() => {
    // First check if we can determine the correct URL from the browser's location
    const currentHost = window.location.host;
    const serverIp = currentHost.split(':')[0]; // Remove port if present
    
    // Default dashboard URL
    let url = `http://${serverIp}:8090/dashboard/`;
    
    // If we're accessing via a domain or IP, use that
    if (serverIp !== 'localhost' && serverIp !== '127.0.0.1') {
      setDashboardUrl(url);
      setIsLoading(false);
    } else {
      // For local development, use the default
      setDashboardUrl('http://localhost:8090/dashboard/');
      setIsLoading(false);
    }
    
    // If the iframe fails to load, we'll detect that with onError handler
  }, []);

  // Handle iframe load error
  const handleIframeError = () => {
    setIframeError(true);
  };
  
  // Handle iframe load success
  const handleIframeLoad = () => {
    setIframeError(false);
  };
  
  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-6">Traefik Dashboard</h2>
      
      <div className="bg-white p-6 rounded-lg shadow-md mb-8">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Traefik Dashboard URL
          </label>
          <div className="flex items-center">
            <input
              type="text"
              className="form-input rounded-md border-gray-300 flex-grow p-2"
              value={dashboardUrl}
              onChange={(e) => setDashboardUrl(e.target.value)}
              placeholder={isLoading ? "Detecting dashboard URL..." : ""}
            />
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md ml-2"
              onClick={() => {
                setIframeError(false);
                const iframe = document.getElementById('dashboard-frame');
                if (iframe) {
                  iframe.src = dashboardUrl;
                }
              }}
            >
              Refresh
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            The Traefik dashboard shows your routing configuration and certificates
          </p>
        </div>
        
        {iframeError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Cannot access dashboard</Alert.Heading>
            <p>
              The dashboard cannot be embedded due to browser security restrictions or connection issues.
              Please check:
            </p>
            <ul className="list-disc pl-5 mt-2 mb-2">
              <li>The Traefik container is running properly</li>
              <li>Port 8090 is accessible on your server</li>
              <li>No firewalls are blocking access to the dashboard</li>
            </ul>
            <div className="mt-3">
              <Button 
                variant="primary" 
                href={dashboardUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open Dashboard in New Tab
              </Button>
            </div>
          </Alert>
        )}
        
        <div className="border rounded-lg overflow-hidden bg-gray-100">
          <iframe
            id="dashboard-frame"
            src={dashboardUrl}
            className="w-full h-[700px]"
            title="Traefik Dashboard"
            onError={handleIframeError}
            onLoad={handleIframeLoad}
          ></iframe>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">About Traefik</h3>
        <p className="mb-4">
          Traefik is an open-source Edge Router that makes publishing your services a fun and easy experience. 
          It receives requests on behalf of your system and finds out which components are responsible for handling them.
        </p>
        <p className="mb-4">
          CertPilot uses Traefik to:
        </p>
        <ul className="list-disc pl-8 mb-4">
          <li>Automatically route traffic to your services based on domain names</li>
          <li>Manage SSL certificates through Let's Encrypt</li>
          <li>Handle HTTPS redirection</li>
          <li>Provide a central point for monitoring and management</li>
        </ul>
        <p>
          The dashboard above provides a visual interface to monitor Traefik's routes, services, and middlewares.
        </p>
      </div>
    </div>
  );
};

export default TraefikDashboard; 