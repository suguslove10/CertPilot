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
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';

const App = () => {
  return (
    <AuthProvider>
      <div className="app">
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
          </Routes>
        </main>
      </div>
    </AuthProvider>
  );
};

export default App; 