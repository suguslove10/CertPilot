const express = require('express');
const router = express.Router();
const { exec } = require('child_process');
const util = require('util');
const fs = require('fs');
const { protect } = require('../middleware/authMiddleware');

const execAsync = util.promisify(exec);

// Helper function to check if Docker CLI is available
const isDockerAvailable = async () => {
  try {
    // Check if docker command exists and if socket is available
    await execAsync('which docker');
    
    // Check if docker socket is accessible
    const socketExists = fs.existsSync('/var/run/docker.sock');
    
    if (!socketExists) {
      return false;
    }
    
    // Try a simple docker command to verify access
    await execAsync('docker info');
    return true;
  } catch (error) {
    console.log('Docker is not available or accessible:', error.message);
    return false;
  }
};

// Helper function to detect Docker containers running web servers
const detectDockerWebServers = async () => {
  try {
    // First check if Docker is available
    const dockerAvailable = await isDockerAvailable();
    if (!dockerAvailable) {
      console.log('Docker detection skipped: Docker not available or socket not mounted');
      return { servers: [], skipped: true, reason: 'Docker not available or socket not mounted' };
    }
    
    // Get list of running containers with format
    const { stdout: dockerPs } = await execAsync('docker ps --format "{{.ID}}|{{.Image}}|{{.Ports}}|{{.Names}}"');
    
    if (!dockerPs.trim()) {
      return { servers: [], skipped: false, reason: null };
    }
    
    const containers = dockerPs.trim().split('\n');
    const webServers = [];
    
    for (const container of containers) {
      const [id, image, ports, name] = container.split('|');
      const isWebServer = checkIfWebServer(image, ports);
      
      if (isWebServer) {
        // Get more container details
        const { stdout: inspectOutput } = await execAsync(`docker inspect ${id}`);
        const containerInfo = JSON.parse(inspectOutput)[0];
        
        webServers.push({
          type: determineServerType(image, ports),
          name: name,
          image: image,
          ports: formatPorts(ports),
          location: 'Docker Container',
          containerId: id,
          runningFor: containerInfo.State?.StartedAt || 'Unknown',
        });
      }
    }
    
    return { servers: webServers, skipped: false, reason: null };
  } catch (error) {
    console.error('Error detecting Docker web servers:', error);
    return { servers: [], skipped: true, reason: `Error: ${error.message}` };
  }
};

// Helper function to detect host-level web servers
const detectHostWebServers = async () => {
  try {
    // Different commands for different platforms
    let command;
    
    // Check platform
    const { stdout: platform } = await execAsync('uname');
    
    if (platform.trim().toLowerCase() === 'darwin') {
      // macOS
      command = 'lsof -i -P -n | grep LISTEN | grep -E ":80|:443|:8080|:8443|:3000|:5000"';
    } else {
      // Linux
      command = 'netstat -tulpn | grep -E ":80|:443|:8080|:8443|:3000|:5000"';
    }
    
    const { stdout } = await execAsync(command);
    
    if (!stdout.trim()) {
      return [];
    }
    
    const lines = stdout.trim().split('\n');
    const webServers = [];
    const processedPids = new Set();
    
    for (const line of lines) {
      // Extract process info
      const processInfo = extractProcessInfo(line, platform.trim().toLowerCase());
      
      if (processInfo && !processedPids.has(processInfo.pid)) {
        processedPids.add(processInfo.pid);
        
        // Get more details about the process
        const { stdout: processDetails } = await execAsync(`ps -p ${processInfo.pid} -o comm=`);
        
        webServers.push({
          type: determineProcessServerType(processDetails.trim(), processInfo.port),
          name: processDetails.trim(),
          ports: [processInfo.port],
          location: 'Host Server',
          pid: processInfo.pid,
        });
      }
    }
    
    return webServers;
  } catch (error) {
    console.error('Error detecting host web servers:', error);
    return [];
  }
};

// Helper functions
const checkIfWebServer = (image, ports) => {
  // Check if ports include common web server ports
  const webPorts = ['80', '443', '8080', '8443', '3000', '5000'];
  if (ports) {
    return webPorts.some(port => ports.includes(port));
  }
  
  // Check image name for common web server images
  const webServerImages = ['nginx', 'apache', 'httpd', 'node', 'express', 'traefik', 'caddy'];
  return webServerImages.some(server => image.toLowerCase().includes(server));
};

const determineServerType = (image, ports) => {
  const imageLower = image.toLowerCase();
  if (imageLower.includes('nginx')) return 'Nginx';
  if (imageLower.includes('apache') || imageLower.includes('httpd')) return 'Apache';
  if (imageLower.includes('traefik')) return 'Traefik';
  if (imageLower.includes('caddy')) return 'Caddy';
  if (imageLower.includes('node') || imageLower.includes('express')) return 'Node.js';
  if (imageLower.includes('tomcat')) return 'Tomcat';
  
  // If can't determine by image, try to determine by port
  if (ports.includes('80') || ports.includes('443')) return 'Web Server (Unknown Type)';
  
  return 'Unknown Web Service';
};

const determineProcessServerType = (processName, port) => {
  const processLower = processName.toLowerCase();
  if (processLower.includes('nginx')) return 'Nginx';
  if (processLower.includes('apache') || processLower.includes('httpd')) return 'Apache';
  if (processLower.includes('node')) return 'Node.js';
  if (processLower.includes('tomcat')) return 'Tomcat';
  
  // Common port-based detection
  if (port === '80' || port === '443') return 'Web Server (Unknown Type)';
  
  return 'Unknown Web Service';
};

const formatPorts = (portsString) => {
  if (!portsString) return [];
  
  // Parse Docker port format
  const portMatches = portsString.match(/\d+\/\w+/g) || [];
  return portMatches.map(match => {
    const [port, protocol] = match.split('/');
    return port;
  });
};

const extractProcessInfo = (line, platform) => {
  try {
    if (platform === 'darwin') {
      // macOS lsof format
      const parts = line.trim().split(/\s+/);
      const pid = parts[1];
      const addressPart = parts[8] || '';
      const portMatch = addressPart.match(/:(\d+)$/);
      const port = portMatch ? portMatch[1] : null;
      
      if (pid && port) {
        return { pid, port };
      }
    } else {
      // Linux netstat format
      const parts = line.trim().split(/\s+/);
      const addressPart = parts[3] || '';
      const portMatch = addressPart.match(/:(\d+)$/);
      const port = portMatch ? portMatch[1] : null;
      const pidProgPart = parts[6] || '';
      const pidMatch = pidProgPart.match(/^(\d+)/);
      const pid = pidMatch ? pidMatch[1] : null;
      
      if (pid && port) {
        return { pid, port };
      }
    }
  } catch (error) {
    console.error('Error extracting process info:', error);
  }
  
  return null;
};

// @route   GET /api/server-detection
// @desc    Detect web servers running in Docker and on the host
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    // Execute both detection methods in parallel
    const [dockerResult, hostWebServers] = await Promise.all([
      detectDockerWebServers(),
      detectHostWebServers()
    ]);
    
    // Extract Docker results
    const { servers: dockerWebServers, skipped: dockerSkipped, reason: dockerSkipReason } = dockerResult;
    
    res.json({
      docker: dockerWebServers,
      host: hostWebServers,
      totalServers: dockerWebServers.length + hostWebServers.length,
      dockerDetectionSkipped: dockerSkipped,
      dockerSkipReason: dockerSkipReason
    });
  } catch (error) {
    console.error('Error detecting web servers:', error);
    res.status(500).json({ 
      message: 'Failed to detect web servers', 
      error: error.message 
    });
  }
});

module.exports = router; 