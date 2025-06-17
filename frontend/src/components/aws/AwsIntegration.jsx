import React, { useState } from 'react';
import { Card, Button, Alert, Badge } from '../ui';
import './AwsIntegration.css';

const AwsIntegration = () => {
  const [activeTab, setActiveTab] = useState('instances');
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };
  
  return (
    <div className="aws-integration">
      <header className="aws-header">
        <h1>AWS Integration</h1>
        <p className="text-secondary">Manage your AWS resources and integrate with SSL certificates</p>
      </header>
      
      <Alert 
        variant="info" 
        title="AWS Integration"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="16" x2="12" y2="12"></line>
            <line x1="12" y1="8" x2="12.01" y2="8"></line>
          </svg>
        }
      >
        Connect your AWS account to discover and manage EC2 instances, load balancers, and certificates.
      </Alert>
      
      <div className="aws-tabs">
        <Button 
          variant={activeTab === 'instances' ? 'primary' : 'ghost'} 
          onClick={() => handleTabChange('instances')}
          className="aws-tab-button"
        >
          EC2 Instances
        </Button>
        <Button 
          variant={activeTab === 'loadbalancers' ? 'primary' : 'ghost'} 
          onClick={() => handleTabChange('loadbalancers')}
          className="aws-tab-button"
        >
          Load Balancers
        </Button>
        <Button 
          variant={activeTab === 'certificates' ? 'primary' : 'ghost'} 
          onClick={() => handleTabChange('certificates')}
          className="aws-tab-button"
        >
          ACM Certificates
        </Button>
      </div>
      
      <div className="aws-content">
        {activeTab === 'instances' && (
          <div className="aws-tab-content">
            <div className="grid grid-cols-3 gap-md">
              <Card 
                title="Web Server" 
                subtitle="i-1234567890abcdef0"
                elevation="md"
                footer={
                  <div className="card-actions">
                    <Button size="small" variant="secondary" outlined>Stop</Button>
                    <Button size="small" variant="primary">Manage</Button>
                  </div>
                }
              >
                <div className="instance-details">
                  <div className="instance-detail">
                    <span className="detail-label">Status:</span>
                    <Badge variant="success" pill>Running</Badge>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Type:</span>
                    <span>t2.micro</span>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Zone:</span>
                    <span>us-east-1a</span>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Public IP:</span>
                    <span>54.123.45.67</span>
                  </div>
                </div>
              </Card>
              
              <Card 
                title="Application Server" 
                subtitle="i-0987654321fedcba0"
                elevation="md"
                footer={
                  <div className="card-actions">
                    <Button size="small" variant="secondary" outlined>Stop</Button>
                    <Button size="small" variant="primary">Manage</Button>
                  </div>
                }
              >
                <div className="instance-details">
                  <div className="instance-detail">
                    <span className="detail-label">Status:</span>
                    <Badge variant="success" pill>Running</Badge>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Type:</span>
                    <span>t2.medium</span>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Zone:</span>
                    <span>us-east-1b</span>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Public IP:</span>
                    <span>54.123.45.68</span>
                  </div>
                </div>
              </Card>
              
              <Card 
                title="Database Server" 
                subtitle="i-abcdef1234567890"
                elevation="md"
                footer={
                  <div className="card-actions">
                    <Button size="small" variant="secondary" outlined>Stop</Button>
                    <Button size="small" variant="primary">Manage</Button>
                  </div>
                }
              >
                <div className="instance-details">
                  <div className="instance-detail">
                    <span className="detail-label">Status:</span>
                    <Badge variant="warning" pill>Stopping</Badge>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Type:</span>
                    <span>m5.large</span>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Zone:</span>
                    <span>us-east-1c</span>
                  </div>
                  <div className="instance-detail">
                    <span className="detail-label">Public IP:</span>
                    <span>54.123.45.69</span>
                  </div>
                </div>
              </Card>
            </div>
            
            <div className="aws-actions mt-lg">
              <Button variant="primary" icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="12" y1="8" x2="12" y2="16"></line>
                  <line x1="8" y1="12" x2="16" y2="12"></line>
                </svg>
              }>
                Launch New Instance
              </Button>
              <Button variant="secondary" outlined icon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="1 4 1 10 7 10"></polyline>
                  <polyline points="23 20 23 14 17 14"></polyline>
                  <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"></path>
                </svg>
              }>
                Refresh
              </Button>
            </div>
          </div>
        )}
        
        {activeTab === 'loadbalancers' && (
          <div className="aws-tab-content">
            <Card title="Load Balancers" elevation="md">
              <p>Your load balancers will appear here.</p>
              <div className="aws-empty-state">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                  <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                  <line x1="6" y1="6" x2="6.01" y2="6"></line>
                  <line x1="6" y1="18" x2="6.01" y2="18"></line>
                </svg>
                <p>No load balancers found</p>
                <Button variant="primary">Create Load Balancer</Button>
              </div>
            </Card>
          </div>
        )}
        
        {activeTab === 'certificates' && (
          <div className="aws-tab-content">
            <Card title="ACM Certificates" elevation="md">
              <table className="aws-certificates-table">
                <thead>
                  <tr>
                    <th>Domain Name</th>
                    <th>Status</th>
                    <th>Type</th>
                    <th>Expiration</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>*.example.com</td>
                    <td><Badge variant="success" pill>Issued</Badge></td>
                    <td>AWS Certificate Manager</td>
                    <td>2024-12-31</td>
                    <td>
                      <div className="flex gap-xs">
                        <Button size="small" variant="primary">Renew</Button>
                        <Button size="small" variant="secondary" outlined>Details</Button>
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>api.example.com</td>
                    <td><Badge variant="warning" pill>Pending Validation</Badge></td>
                    <td>AWS Certificate Manager</td>
                    <td>-</td>
                    <td>
                      <div className="flex gap-xs">
                        <Button size="small" variant="primary">Validate</Button>
                        <Button size="small" variant="secondary" outlined>Details</Button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
              <div className="aws-actions mt-md">
                <Button variant="primary" icon={
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="12" y1="8" x2="12" y2="16"></line>
                    <line x1="8" y1="12" x2="16" y2="12"></line>
                  </svg>
                }>
                  Request New Certificate
                </Button>
                <Button variant="secondary" outlined>Import Certificate</Button>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default AwsIntegration; 