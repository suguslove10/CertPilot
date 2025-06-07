import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card } from 'react-bootstrap';
import axios from 'axios';

const TraefikDashboard = () => {
  const { user } = useAuth();
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [directUrl, setDirectUrl] = useState('');
  const [iframeError, setIframeError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Update the dashboard URL based on the current environment
  useEffect(() => {
    // First check if we can determine the correct URL from the browser's location
    const currentHost = window.location.host;
    const serverIp = currentHost.split(':')[0]; // Remove port if present
    
    // Try these possible dashboard URL formats - Traefik has changed its path format in different versions
    let baseUrl = `http://${serverIp}:8090`;
    let possibleUrls = [
      `${baseUrl}/dashboard/`,      // Most common format
      `${baseUrl}/`,                // Root path
      `${baseUrl}/dashboard`,       // Without trailing slash
      `${baseUrl}/#/`               // Hash-based routing (v2.x)
    ];
    
    // Set the default URL to try first
    setDashboardUrl(possibleUrls[0]);
    // Store the direct access URL for the "Open in New Tab" button
    setDirectUrl(baseUrl);
    setIsLoading(false);
  }, []);

  // Handle iframe load error
  const handleIframeError = () => {
    setIframeError(true);
  };
  
  // Handle iframe load success
  const handleIframeLoad = () => {
    setIframeError(false);
  };
  
  // Try a different URL format
  const tryAlternateUrl = () => {
    // Cycle through different possible URL formats
    if (dashboardUrl.endsWith('/dashboard/')) {
      setDashboardUrl(dashboardUrl.replace('/dashboard/', '/'));
    } else if (dashboardUrl.endsWith('/')) {
      setDashboardUrl(dashboardUrl.replace('/', '/dashboard'));
    } else if (dashboardUrl.endsWith('/dashboard')) {
      setDashboardUrl(dashboardUrl.replace('/dashboard', '/#/'));
    } else {
      // If we've tried all formats, go back to the first one
      const baseUrl = dashboardUrl.split('/#/')[0];
      setDashboardUrl(`${baseUrl}/dashboard/`);
    }
    
    // Reset error state to try loading with new URL
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
              The dashboard cannot be loaded. This could be due to:
            </p>
            <ul className="list-disc pl-5 mt-2 mb-2">
              <li>The Traefik container might not be running properly</li>
              <li>Port 8090 might be blocked or not properly mapped</li>
              <li>The dashboard URL format might be different</li>
            </ul>
            <div className="mt-3 d-flex gap-2">
              <Button 
                variant="primary" 
                href={directUrl} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open Direct URL in New Tab
              </Button>
              <Button 
                variant="secondary" 
                onClick={tryAlternateUrl}
              >
                Try Different URL Format
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
        <h3 className="text-xl font-semibold mb-4">Troubleshooting Tips</h3>
        <p className="mb-3">
          If you're having trouble accessing the Traefik dashboard:
        </p>
        <ol className="list-decimal pl-5 mb-4 space-y-2">
          <li>Check if the Traefik container is running with <code>docker ps</code></li>
          <li>Inspect the Traefik logs with <code>docker logs certpilot-traefik</code></li>
          <li>Try accessing the dashboard directly at <a href={directUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{directUrl}</a></li>
          <li>Make sure no other service is using port 9000 on the server</li>
          <li>Restart the Traefik container: <code>docker-compose restart traefik</code></li>
        </ol>
        <p>
          The Traefik dashboard is crucial for monitoring your certificate status and routing configurations.
        </p>
      </div>
    </div>
  );
};

export default TraefikDashboard; 