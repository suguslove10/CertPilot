import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const CertificateLifecycle = () => {
  const [activeTab, setActiveTab] = useState('expiring');
  const [expiringCertificates, setExpiringCertificates] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedCertificate, setSelectedCertificate] = useState(null);
  const [alertSettings, setAlertSettings] = useState({
    enabled: true,
    thresholds: [30, 14, 7, 3, 1],
    channels: []
  });
  const [renewalHistory, setRenewalHistory] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState('');
  const [channel, setChannel] = useState({ type: 'email', destination: '' });
  const [filterDays, setFilterDays] = useState(30);
  const [metadata, setMetadata] = useState({
    tags: [],
    category: '',
    owner: '',
    notes: ''
  });
  const [newTag, setNewTag] = useState('');
  
  useEffect(() => {
    if (activeTab === 'expiring') {
      fetchExpiringCertificates();
    } else if (activeTab === 'inventory') {
      fetchInventory();
    }
  }, [activeTab, filterDays]);
  
  useEffect(() => {
    if (selectedCertificate) {
      fetchAlertSettings();
      fetchRenewalHistory();
      fetchAlertHistory();
    }
  }, [selectedCertificate]);
  
  const fetchExpiringCertificates = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`/api/certificate-lifecycle/expiring?days=${filterDays}`);
      setExpiringCertificates(response.data);
    } catch (error) {
      console.error('Error fetching expiring certificates:', error);
      toast.error('Failed to fetch expiring certificates');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/certificate-lifecycle/inventory');
      setInventory(response.data);
    } catch (error) {
      console.error('Error fetching certificate inventory:', error);
      toast.error('Failed to fetch certificate inventory');
    } finally {
      setLoading(false);
    }
  };
  
  const fetchAlertSettings = async () => {
    try {
      const response = await axios.get(`/api/certificate-lifecycle/${selectedCertificate.id}/alert-settings`);
      setAlertSettings(response.data);
    } catch (error) {
      console.error('Error fetching alert settings:', error);
      toast.error('Failed to fetch alert settings');
    }
  };
  
  const fetchRenewalHistory = async () => {
    try {
      const response = await axios.get(`/api/certificate-lifecycle/${selectedCertificate.id}/renewal-history`);
      setRenewalHistory(response.data);
    } catch (error) {
      console.error('Error fetching renewal history:', error);
      toast.error('Failed to fetch renewal history');
    }
  };
  
  const fetchAlertHistory = async () => {
    try {
      const response = await axios.get(`/api/certificate-lifecycle/${selectedCertificate.id}/alert-history`);
      setAlertHistory(response.data);
    } catch (error) {
      console.error('Error fetching alert history:', error);
      toast.error('Failed to fetch alert history');
    }
  };
  
  const handleCertificateSelect = (certificate) => {
    setSelectedCertificate(certificate);
    setMetadata({
      tags: certificate.tags || [],
      category: certificate.category || '',
      owner: certificate.owner || '',
      notes: certificate.notes || ''
    });
  };
  
  const handleSaveAlertSettings = async () => {
    try {
      await axios.put(`/api/certificate-lifecycle/${selectedCertificate.id}/alert-settings`, alertSettings);
      toast.success('Alert settings saved successfully');
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving alert settings:', error);
      toast.error('Failed to save alert settings');
    }
  };
  
  const handleAddChannel = () => {
    if (!channel.type || (channel.type !== 'in-app' && !channel.destination)) {
      toast.error('Please fill all fields');
      return;
    }
    
    setAlertSettings({
      ...alertSettings,
      channels: [...alertSettings.channels, { ...channel }]
    });
    
    setChannel({ type: 'email', destination: '' });
  };
  
  const handleRemoveChannel = (index) => {
    const updatedChannels = [...alertSettings.channels];
    updatedChannels.splice(index, 1);
    setAlertSettings({
      ...alertSettings,
      channels: updatedChannels
    });
  };
  
  const handleForceRenewal = async () => {
    try {
      await axios.post(`/api/certificate-lifecycle/${selectedCertificate.id}/force-renewal`);
      toast.success('Certificate renewal requested');
      fetchRenewalHistory();
    } catch (error) {
      console.error('Error requesting certificate renewal:', error);
      toast.error('Failed to request certificate renewal');
    }
  };
  
  const handleAddTag = () => {
    if (!newTag.trim()) return;
    
    if (!metadata.tags.includes(newTag)) {
      setMetadata({
        ...metadata,
        tags: [...metadata.tags, newTag]
      });
    }
    
    setNewTag('');
  };
  
  const handleRemoveTag = (tag) => {
    setMetadata({
      ...metadata,
      tags: metadata.tags.filter(t => t !== tag)
    });
  };
  
  const handleSaveMetadata = async () => {
    try {
      await axios.put(`/api/certificate-lifecycle/${selectedCertificate.id}/metadata`, metadata);
      toast.success('Certificate metadata saved');
      fetchInventory();
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error saving certificate metadata:', error);
      toast.error('Failed to save certificate metadata');
    }
  };
  
  const handleRunExpirationCheck = async () => {
    setLoading(true);
    try {
      await axios.post('/api/certificate-lifecycle/check-expiration');
      toast.success('Certificate expiration check completed');
      fetchExpiringCertificates();
    } catch (error) {
      console.error('Error running certificate expiration check:', error);
      toast.error('Failed to run certificate expiration check');
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateMetadata = async () => {
    setLoading(true);
    try {
      await axios.post('/api/certificate-lifecycle/update-metadata');
      toast.success('Certificate metadata updated');
      fetchInventory();
    } catch (error) {
      console.error('Error updating certificate metadata:', error);
      toast.error('Failed to update certificate metadata');
    } finally {
      setLoading(false);
    }
  };
  
  const openModal = (type) => {
    setModalType(type);
    setIsModalOpen(true);
  };
  
  const getStatusClass = (certificate) => {
    if (!certificate.expiryDate) return 'bg-gray-200';
    
    const daysLeft = certificate.daysLeft || certificate.daysUntilExpiry;
    
    if (daysLeft < 0) return 'bg-red-100 text-red-800';
    if (daysLeft <= 7) return 'bg-orange-100 text-orange-800';
    if (daysLeft <= 30) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
  };
  
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Certificate Lifecycle Management</h1>
      
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex" aria-label="Tabs">
            <button
              onClick={() => setActiveTab('expiring')}
              className={`${
                activeTab === 'expiring'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
            >
              Expiration Monitoring
            </button>
            <button
              onClick={() => setActiveTab('renewal')}
              className={`${
                activeTab === 'renewal'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm mr-8`}
            >
              Renewal Tracking
            </button>
            <button
              onClick={() => setActiveTab('inventory')}
              className={`${
                activeTab === 'inventory'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}
            >
              Certificate Inventory
            </button>
          </nav>
        </div>
      </div>
      
      {activeTab === 'expiring' && (
        <div>
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <label htmlFor="filterDays" className="mr-2">Show certificates expiring within:</label>
              <select
                id="filterDays"
                value={filterDays}
                onChange={(e) => setFilterDays(Number(e.target.value))}
                className="border rounded px-2 py-1"
              >
                <option value={7}>7 days</option>
                <option value={30}>30 days</option>
                <option value={60}>60 days</option>
                <option value={90}>90 days</option>
              </select>
            </div>
            <button
              onClick={handleRunExpirationCheck}
              disabled={loading}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading ? 'Running...' : 'Run Expiration Check'}
            </button>
          </div>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Days Left</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {expiringCertificates.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? 'Loading...' : 'No expiring certificates found'}
                    </td>
                  </tr>
                ) : (
                  expiringCertificates.map((cert) => (
                    <tr key={cert.id} className={getStatusClass(cert)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cert.domain}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cert.expiryDate ? format(new Date(cert.expiryDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cert.daysLeft}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cert.status}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            handleCertificateSelect(cert);
                            openModal('alerts');
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Configure Alerts
                        </button>
                        <button
                          onClick={() => {
                            handleCertificateSelect(cert);
                            handleForceRenewal();
                          }}
                          className="text-green-600 hover:text-green-900"
                        >
                          Renew
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {activeTab === 'renewal' && selectedCertificate ? (
        <div>
          <div className="mb-4">
            <h2 className="text-lg font-semibold mb-2">Certificate: {selectedCertificate.domain}</h2>
            <div className="flex justify-between mb-4">
              <div>
                <p><span className="font-medium">Status:</span> {selectedCertificate.status}</p>
                <p><span className="font-medium">Expiry Date:</span> {selectedCertificate.expiryDate ? format(new Date(selectedCertificate.expiryDate), 'MMM dd, yyyy') : 'N/A'}</p>
              </div>
              <button
                onClick={handleForceRenewal}
                className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Force Renewal
              </button>
            </div>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Renewal History</h3>
          <div className="bg-white shadow-md rounded-lg overflow-hidden mb-6">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Next Renewal</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {renewalHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No renewal history found
                    </td>
                  </tr>
                ) : (
                  renewalHistory.map((renewal, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(renewal.date), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          renewal.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {renewal.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renewal.provider}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {renewal.nextRenewalDate ? format(new Date(renewal.nextRenewalDate), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          <h3 className="text-lg font-semibold mb-2">Alert History</h3>
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Channel</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {alertHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                      No alert history found
                    </td>
                  </tr>
                ) : (
                  alertHistory.map((alert, index) => (
                    <tr key={index}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(new Date(alert.date), 'MMM dd, yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alert.threshold} days
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {alert.channel}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          alert.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {alert.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : activeTab === 'renewal' && (
        <div className="text-center py-12">
          <p className="text-gray-500">Select a certificate from the Expiration Monitoring or Inventory tab to view renewal information</p>
        </div>
      )}
      
      {activeTab === 'inventory' && (
        <div>
          <div className="flex justify-between mb-4">
            <div className="flex items-center">
              <input
                type="text"
                placeholder="Search certificates..."
                className="border rounded px-3 py-2 w-64"
                // Implement search functionality here
              />
            </div>
            <div>
              <button
                onClick={handleUpdateMetadata}
                disabled={loading}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50 mr-2"
              >
                {loading ? 'Updating...' : 'Update Metadata'}
              </button>
            </div>
          </div>
          
          <div className="bg-white shadow-md rounded-lg overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Domain</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expiry</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Owner</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventory.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 text-center text-sm text-gray-500">
                      {loading ? 'Loading...' : 'No certificates found'}
                    </td>
                  </tr>
                ) : (
                  inventory.map((cert) => (
                    <tr key={cert.id} className={getStatusClass(cert)}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{cert.domain}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          cert.statusCategory === 'healthy' ? 'bg-green-100 text-green-800' :
                          cert.statusCategory === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          cert.statusCategory === 'critical' ? 'bg-orange-100 text-orange-800' :
                          cert.statusCategory === 'expired' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {cert.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cert.expiryDate ? (
                          <>
                            {format(new Date(cert.expiryDate), 'MMM dd, yyyy')}
                            <span className="ml-1 text-xs">
                              ({cert.daysUntilExpiry >= 0 ? `${cert.daysUntilExpiry} days left` : 'Expired'})
                            </span>
                          </>
                        ) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cert.owner || 'Unassigned'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {cert.category || 'Uncategorized'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => {
                            handleCertificateSelect(cert);
                            openModal('metadata');
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => {
                            handleCertificateSelect(cert);
                            setActiveTab('renewal');
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Details
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-lg">
            {modalType === 'alerts' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Configure Alert Settings for {selectedCertificate?.domain}</h3>
                
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={alertSettings.enabled}
                      onChange={(e) => setAlertSettings({ ...alertSettings, enabled: e.target.checked })}
                      className="mr-2"
                    />
                    <span>Enable expiration alerts</span>
                  </label>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Alert Thresholds (days before expiry)</label>
                  <div className="flex flex-wrap gap-2">
                    {[30, 14, 7, 3, 1].map((days) => (
                      <label key={days} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={alertSettings.thresholds.includes(days)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAlertSettings({
                                ...alertSettings,
                                thresholds: [...alertSettings.thresholds, days].sort((a, b) => b - a)
                              });
                            } else {
                              setAlertSettings({
                                ...alertSettings,
                                thresholds: alertSettings.thresholds.filter(t => t !== days)
                              });
                            }
                          }}
                          className="mr-1"
                        />
                        <span className="mr-3">{days} days</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Alert Channels</h4>
                  
                  {alertSettings.channels.length > 0 ? (
                    <ul className="mb-4 border rounded divide-y">
                      {alertSettings.channels.map((ch, index) => (
                        <li key={index} className="p-2 flex justify-between items-center">
                          <div>
                            <span className="font-medium">{ch.type}</span>
                            {ch.destination && <span className="ml-2 text-sm text-gray-500">{ch.destination}</span>}
                          </div>
                          <button
                            onClick={() => handleRemoveChannel(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-gray-500 mb-4">No alert channels configured</p>
                  )}
                  
                  <div className="flex space-x-2">
                    <select
                      value={channel.type}
                      onChange={(e) => setChannel({ ...channel, type: e.target.value })}
                      className="border rounded px-2 py-1"
                    >
                      <option value="email">Email</option>
                      <option value="webhook">Webhook</option>
                      <option value="in-app">In-app</option>
                    </select>
                    
                    {channel.type !== 'in-app' && (
                      <input
                        type="text"
                        value={channel.destination}
                        onChange={(e) => setChannel({ ...channel, destination: e.target.value })}
                        placeholder={channel.type === 'email' ? 'Email address' : 'Webhook URL'}
                        className="border rounded px-2 py-1 flex-1"
                      />
                    )}
                    
                    <button
                      onClick={handleAddChannel}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveAlertSettings}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
            
            {modalType === 'metadata' && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Edit Certificate Metadata for {selectedCertificate?.domain}</h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select
                    value={metadata.category}
                    onChange={(e) => setMetadata({ ...metadata, category: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                  >
                    <option value="">-- Select Category --</option>
                    <option value="Production">Production</option>
                    <option value="Staging">Staging</option>
                    <option value="Development">Development</option>
                    <option value="Internal">Internal</option>
                    <option value="External">External</option>
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                  <input
                    type="text"
                    value={metadata.owner}
                    onChange={(e) => setMetadata({ ...metadata, owner: e.target.value })}
                    className="border rounded px-2 py-1 w-full"
                    placeholder="Certificate owner or responsible person"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {metadata.tags.map((tag) => (
                      <span
                        key={tag}
                        className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm flex items-center"
                      >
                        {tag}
                        <button
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-1 text-blue-800 hover:text-blue-900"
                        >
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                      className="border rounded px-2 py-1 flex-1"
                      placeholder="Add a tag"
                    />
                    <button
                      onClick={handleAddTag}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                    >
                      Add
                    </button>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                  <textarea
                    value={metadata.notes}
                    onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
                    className="border rounded px-2 py-1 w-full h-24"
                    placeholder="Additional notes about this certificate"
                  />
                </div>
                
                <div className="flex justify-end space-x-2 mt-6">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveMetadata}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CertificateLifecycle;
