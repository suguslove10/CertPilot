import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

const TraefikDashboard = () => {
  const { user } = useAuth();
  const [dashboardUrl, setDashboardUrl] = useState('http://localhost:8090/dashboard/');
  
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
              onClick={() => setDashboardUrl(document.getElementById('dashboard-frame').src)}
            >
              Refresh
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            By default, the Traefik dashboard is available at http://localhost:8090/dashboard/
          </p>
        </div>
        
        <div className="border rounded-lg overflow-hidden bg-gray-100">
          <iframe
            id="dashboard-frame"
            src={dashboardUrl}
            className="w-full h-[700px]"
            title="Traefik Dashboard"
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