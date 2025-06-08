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
    
    // Set direct access URL (this is what should work based on logs)
    const baseUrl = `http://${serverIp}:8080`;
    setDirectUrl(baseUrl);
    
    // Try the actual URL where Traefik serves its dashboard (based on logs)
    setDashboardUrl(`${baseUrl}/dashboard/`);
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
    if (dashboardUrl.includes(':8080/dashboard/')) {
      // Try the dashboard on port 9000
      setDashboardUrl(dashboardUrl.replace(':8080/dashboard/', ':8090/dashboard/'));
    } else if (dashboardUrl.includes(':8090/dashboard/')) {
      // Try API path
      setDashboardUrl(dashboardUrl.replace(':8090/dashboard/', ':8080/api/'));
    } else if (dashboardUrl.includes(':8080/api/')) {
      // Try root path with port 8080
      setDashboardUrl(dashboardUrl.replace(':8080/api/', ':8080/'));
    } else if (dashboardUrl.includes(':8080/')) {
      // Try root path with port 9000
      setDashboardUrl(dashboardUrl.replace(':8080/', ':9000/'));
    } else {
      // If we've tried all formats, go back to the first one
      const serverIp = dashboardUrl.split(':')[0].replace('http://', '');
      setDashboardUrl(`http://${serverIp}:8080/dashboard/`);
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
              The dashboard cannot be loaded. Based on Traefik logs, try accessing directly:
            </p>
            <ul className="list-disc pl-5 mt-2 mb-2">
              <li>The dashboard might be served on port 8080 (Traefik internal port)</li>
              <li>The correct path might be <code>/api/</code> or <code>/</code> instead of <code>/dashboard/</code></li>
            </ul>
            <div className="mt-3 d-flex gap-2">
              <Button 
                variant="primary" 
                href={`${directUrl}/dashboard/`} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                Try Dashboard at Port 8080
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
        <h3 className="text-xl font-semibold mb-4">Traefik Entrypoints</h3>
        <p className="mb-3">
          Based on the logs, Traefik has the following configured entrypoints:
        </p>
        <ul className="list-disc pl-5 mb-4 space-y-2">
          <li><strong>web</strong>: Port 80 (HTTP)</li>
          <li><strong>websecure</strong>: Port 443 (HTTPS)</li>
          <li><strong>dashboard</strong>: Port 9000 (mapped to 8090)</li>
          <li><strong>traefik</strong>: Port 8080 (internal, used for API/dashboard)</li>
        </ul>
        <p className="mb-3">
          The dashboard is likely being served on the <code>traefik</code> entrypoint (port 8080) rather than the <code>dashboard</code> entrypoint (port 9000).
        </p>
        <p>
          Try accessing the dashboard at:
        </p>
        <ul className="list-disc pl-5 mt-2">
          <li><a href={`${directUrl.replace(':8080', ':8090')}/dashboard/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{directUrl.replace(':8080', ':8090')}/dashboard/</a> (mapped port 9000→8090)</li>
          <li><a href={`${directUrl}/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{directUrl}/</a> (internal port 8080)</li>
          <li><a href={`${directUrl}/api/`} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{directUrl}/api/</a> (API endpoint)</li>
        </ul>
      </div>
    </div>
  );
};

export default TraefikDashboard; 