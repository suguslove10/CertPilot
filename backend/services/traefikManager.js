const fs = require('fs').promises;
const path = require('path');
const yaml = require('js-yaml');

// Default path to Traefik dynamic configuration directory
const TRAEFIK_DYNAMIC_DIR = process.env.TRAEFIK_DYNAMIC_DIR || '/etc/traefik/dynamic';

/**
 * Ensure the Traefik dynamic directory exists
 */
const ensureDynamicDir = async () => {
  try {
    await fs.mkdir(TRAEFIK_DYNAMIC_DIR, { recursive: true });
    console.log(`Traefik dynamic directory created at ${TRAEFIK_DYNAMIC_DIR}`);
    return true;
  } catch (error) {
    console.error(`Error creating Traefik dynamic directory: ${error.message}`);
    return false;
  }
};

/**
 * Generate router configuration for a subdomain
 * @param {Object} subdomain - The subdomain document
 * @returns {Promise<string>} - Path to the generated config file
 */
const generateRouterConfig = async (subdomain) => {
  try {
    await ensureDynamicDir();
    
    const domain = `${subdomain.name}.${subdomain.parentDomain}`;
    const routerName = domain.replace(/\./g, '-');
    
    // Use the user-specified port or default to 80 if not set
    const applicationPort = subdomain.applicationPort || 80;
    
    console.log(`Generating configuration for ${domain} with target ${subdomain.targetIp}:${applicationPort} (subdomain.applicationPort=${subdomain.applicationPort})`);
    
    // Create router configuration
    const config = {
      http: {
        routers: {
          [routerName]: {
            rule: `Host(\`${domain}\`)`,
            service: routerName,
            entryPoints: ["websecure"],
            tls: {
              certResolver: "letsencrypt"
            }
          },
          // Always add HTTP to HTTPS redirect by default
          [`${routerName}-redirect`]: {
            rule: `Host(\`${domain}\`)`,
            entryPoints: ["web"],
            middlewares: [`${routerName}-redirect`],
            service: routerName
          }
        },
        services: {
          [routerName]: {
            loadBalancer: {
              servers: [{ url: `http://${subdomain.targetIp}:${applicationPort}` }]
            }
          }
        },
        middlewares: {
          [`${routerName}-redirect`]: {
            redirectScheme: {
              scheme: "https",
              permanent: true
            }
          }
        }
      }
    };
    
    // Write configuration to file as YAML
    const configPath = path.join(TRAEFIK_DYNAMIC_DIR, `${routerName}.yml`);
    await fs.writeFile(configPath, yaml.dump(config));
    
    console.log(`Generated Traefik configuration for ${domain} at ${configPath}`);
    
    // Update subdomain with router info
    subdomain.traefikRouter = routerName;
    await subdomain.save();
    
    return configPath;
  } catch (error) {
    console.error(`Error generating Traefik configuration: ${error.message}`);
    throw error;
  }
};

/**
 * Remove router configuration for a subdomain
 * @param {Object} subdomain - The subdomain document
 * @returns {Promise<boolean>} - Success status
 */
const removeRouterConfig = async (subdomain) => {
  try {
    if (!subdomain.traefikRouter) return true;
    
    const configPath = path.join(TRAEFIK_DYNAMIC_DIR, `${subdomain.traefikRouter}.yml`);
    try {
      await fs.unlink(configPath);
      console.log(`Removed Traefik configuration at ${configPath}`);
    } catch (error) {
      console.error(`Error removing Traefik config: ${error.message}`);
    }
    
    subdomain.traefikRouter = null;
    await subdomain.save();
    
    return true;
  } catch (error) {
    console.error(`Error removing Traefik configuration: ${error.message}`);
    return false;
  }
};

/**
 * Update ACME email configuration
 * @param {string} email - The email to use for Let's Encrypt
 * @returns {Promise<boolean>} - Success status
 */
const updateAcmeEmail = async (email) => {
  try {
    await ensureDynamicDir();
    
    const acmeConfigPath = path.join(TRAEFIK_DYNAMIC_DIR, 'acme-email.yml');
    const acmeConfig = {
      certificatesResolvers: {
        letsencrypt: {
          acme: {
            email: email
          }
        }
      }
    };
    
    await fs.writeFile(acmeConfigPath, yaml.dump(acmeConfig));
    console.log(`Updated ACME email to ${email}`);
    
    return true;
  } catch (error) {
    console.error(`Error updating ACME email: ${error.message}`);
    return false;
  }
};

module.exports = {
  ensureDynamicDir,
  generateRouterConfig,
  removeRouterConfig,
  updateAcmeEmail
}; 