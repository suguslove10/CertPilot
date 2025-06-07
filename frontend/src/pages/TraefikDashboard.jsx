import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Alert, Button, Card } from 'react-bootstrap';

const TraefikDashboard = () => {
  const { user } = useAuth();
  const [dashboardUrl, setDashboardUrl] = useState('http://localhost:8090/dashboard/');
  const [iframeError, setIframeError] = useState(false);
  
  // Update the dashboard URL based on the current hostname
  useEffect(() => {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      setDashboardUrl(`http://${hostname}:8090/dashboard/`);
    }
  }, []);

  // Handle iframe load error
  const handleIframeError = () => {
    setIframeError(true);
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
            The Traefik dashboard allows you to monitor routing, services, and certificates
          </p>
        </div>
        
        {iframeError && (
          <Alert variant="warning" className="mb-4">
            <Alert.Heading>Cannot access dashboard</Alert.Heading>
            <p>
              The dashboard cannot be embedded due to browser security restrictions or connection issues.
              You can try accessing it directly:
            </p>
            <div className="mt-2">
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