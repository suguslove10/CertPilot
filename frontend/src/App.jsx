import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import AwsCredentials from './pages/AwsCredentials';
import SubdomainManagement from './pages/SubdomainManagement';
import CertificateManagement from './pages/CertificateManagement';
import TraefikCertificateManagement from './pages/TraefikCertificateManagement';
import TraefikDashboard from './pages/TraefikDashboard';
import CertificateLifecycle from './pages/CertificateLifecycle';
import AwsIntegrationPage from './pages/AwsIntegrationPage';
import CloudflareIntegrationPage from './pages/CloudflareIntegrationPage';
import ObservabilityPage from './pages/ObservabilityPage';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <div className="app bg-gray-50 dark:bg-gray-900 min-h-screen transition-colors duration-200">
          <Navbar />
          <main className="container">
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/dashboard"
                element={
                  <PrivateRoute>
                    <Dashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/aws-credentials"
                element={
                  <PrivateRoute>
                    <AwsCredentials />
                  </PrivateRoute>
                }
              />
              <Route
                path="/aws-integration"
                element={
                  <PrivateRoute>
                    <AwsIntegrationPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/cloudflare-integration"
                element={
                  <PrivateRoute>
                    <CloudflareIntegrationPage />
                  </PrivateRoute>
                }
              />
              <Route
                path="/subdomains"
                element={
                  <PrivateRoute>
                    <SubdomainManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/certificates"
                element={
                  <PrivateRoute>
                    <CertificateManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/traefik-certificates"
                element={
                  <PrivateRoute>
                    <TraefikCertificateManagement />
                  </PrivateRoute>
                }
              />
              <Route
                path="/traefik-dashboard"
                element={
                  <PrivateRoute>
                    <TraefikDashboard />
                  </PrivateRoute>
                }
              />
              <Route
                path="/certificate-lifecycle"
                element={
                  <PrivateRoute>
                    <CertificateLifecycle />
                  </PrivateRoute>
                }
              />
              <Route
                path="/observability"
                element={
                  <PrivateRoute>
                    <ObservabilityPage />
                  </PrivateRoute>
                }
              />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App; 