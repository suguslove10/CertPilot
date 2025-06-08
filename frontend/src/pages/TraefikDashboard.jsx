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
    
    // Set direct access URL with hash-based routing
    const baseUrl = `http://${serverIp}:8090`;
    setDirectUrl(baseUrl);
    
    // Use the correct hash-based URL format that works
    setDashboardUrl(`${baseUrl}/dashboard/#/`);
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
    if (dashboardUrl.includes('/dashboard/#/')) {
      // Try without hash
      setDashboardUrl(dashboardUrl.replace('/dashboard/#/', '/dashboard/'));
    } else if (dashboardUrl.includes('/dashboard/')) {
      // Try API path
      setDashboardUrl(dashboardUrl.replace('/dashboard/', '/api/'));
    } else if (dashboardUrl.includes('/api/')) {
      // Try root path
      setDashboardUrl(dashboardUrl.replace('/api/', '/'));
    } else {
      // Go back to the first one (hash-based) which we know works
      const serverIp = dashboardUrl.split(':')[0].replace('http://', '');
      setDashboardUrl(`http://${serverIp}:8090/dashboard/#/`);
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
              The dashboard cannot be loaded. Try accessing directly:
            </p>
            <ul className="list-disc pl-5 mt-2 mb-2">
              <li>The correct URL format uses hash-based routing: <code>/dashboard/#/</code></li>
              <li>Direct link: <a href={`${directUrl}/dashboard/#/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{directUrl}/dashboard/#/</a></li>
            </ul>
            <div className="mt-3 d-flex gap-2">
              <Button 
                variant="primary" 
                href={`${directUrl}/dashboard/#/`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Open Dashboard in New Tab
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
        <h3 className="text-xl font-semibold mb-4">Traefik Dashboard Notes</h3>
        <p className="mb-3">
          Important information about the Traefik dashboard:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li>The dashboard uses hash-based routing (URLs with <code>#</code> in them)</li>
          <li>The correct URL format is: <code>http://your-server-ip:8090/dashboard/#/</code></li>
          <li>If the dashboard doesn't load in the iframe above, try opening it directly in a new tab</li>
          <li>Dashboard credentials are not required since we're using insecure mode for development</li>
        </ul>
        <p>
          The Traefik dashboard provides valuable insights into your routing configuration, services, and SSL certificates.
        </p>
      </div>
    </div>
  );
};

export default TraefikDashboard; 