const AWS = require('aws-sdk');

/**
 * Get all load balancers across regions
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Array>} - List of load balancers
 */
const getAllLoadBalancers = async (credentials = null) => {
  try {
    // Use provided credentials or use global AWS config
    const ec2 = credentials 
      ? new AWS.EC2({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region: credentials.region || 'us-east-1'
        })
      : new AWS.EC2();
    
    // Get list of all AWS regions
    const regions = await ec2.describeRegions().promise();
    
    // Fetch both classic and application/network load balancers from all regions
    const loadBalancerPromises = regions.Regions.map(async (region) => {
      try {
        // Classic Load Balancers (ELB)
        const elb = credentials
          ? new AWS.ELB({
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              region: region.RegionName
            })
          : new AWS.ELB({ region: region.RegionName });
        
        // Application and Network Load Balancers (ALB/NLB)
        const elbv2 = credentials
          ? new AWS.ELBv2({
              accessKeyId: credentials.accessKeyId,
              secretAccessKey: credentials.secretAccessKey,
              region: region.RegionName
            })
          : new AWS.ELBv2({ region: region.RegionName });
        
        // Get classic load balancers
        const classicLBs = await elb.describeLoadBalancers().promise();
        
        // Get application and network load balancers
        const albNlbs = await elbv2.describeLoadBalancers().promise();
        
        // Process classic load balancers
        const classicLoadBalancers = classicLBs.LoadBalancerDescriptions.map(lb => ({
          name: lb.LoadBalancerName,
          dnsName: lb.DNSName,
          type: 'classic',
          scheme: lb.Scheme,
          region: region.RegionName,
          availabilityZones: lb.AvailabilityZones,
          subnets: lb.Subnets,
          securityGroups: lb.SecurityGroups,
          vpcId: lb.VPCId,
          instances: lb.Instances.map(instance => instance.InstanceId),
          listeners: lb.ListenerDescriptions.map(listener => ({
            protocol: listener.Listener.Protocol,
            loadBalancerPort: listener.Listener.LoadBalancerPort,
            instanceProtocol: listener.Listener.InstanceProtocol,
            instancePort: listener.Listener.InstancePort,
            sslCertificateId: listener.Listener.SSLCertificateId
          })),
          healthCheck: lb.HealthCheck ? {
            target: lb.HealthCheck.Target,
            interval: lb.HealthCheck.Interval,
            timeout: lb.HealthCheck.Timeout,
            unhealthyThreshold: lb.HealthCheck.UnhealthyThreshold,
            healthyThreshold: lb.HealthCheck.HealthyThreshold
          } : null,
          createdTime: lb.CreatedTime
        }));
        
        // Process application and network load balancers
        const albNlbLoadBalancers = await Promise.all(albNlbs.LoadBalancers.map(async (lb) => {
          try {
            // Get listeners for this load balancer
            const listenersResult = await elbv2.describeListeners({
              LoadBalancerArn: lb.LoadBalancerArn
            }).promise();
            
            // Get target groups for this load balancer
            const targetGroupsResult = await elbv2.describeTargetGroups({
              LoadBalancerArn: lb.LoadBalancerArn
            }).promise();
            
            // Process target groups with health information
            const targetGroups = await Promise.all(targetGroupsResult.TargetGroups.map(async (tg) => {
              try {
                // Get targets (instances) for this target group
                const targetsResult = await elbv2.describeTargetHealth({
                  TargetGroupArn: tg.TargetGroupArn
                }).promise();
                
                return {
                  targetGroupArn: tg.TargetGroupArn,
                  targetGroupName: tg.TargetGroupName,
                  protocol: tg.Protocol,
                  port: tg.Port,
                  vpcId: tg.VpcId,
                  healthCheckProtocol: tg.HealthCheckProtocol,
                  healthCheckPort: tg.HealthCheckPort,
                  healthCheckPath: tg.HealthCheckPath,
                  healthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds,
                  healthCheckTimeoutSeconds: tg.HealthCheckTimeoutSeconds,
                  healthyThresholdCount: tg.HealthyThresholdCount,
                  unhealthyThresholdCount: tg.UnhealthyThresholdCount,
                  targets: targetsResult.TargetHealthDescriptions.map(target => ({
                    id: target.Target.Id,
                    port: target.Target.Port,
                    state: target.TargetHealth.State,
                    reason: target.TargetHealth.Reason,
                    description: target.TargetHealth.Description
                  }))
                };
              } catch (error) {
                console.error(`Error fetching target health for ${tg.TargetGroupArn}:`, error);
                return {
                  targetGroupArn: tg.TargetGroupArn,
                  targetGroupName: tg.TargetGroupName,
                  protocol: tg.Protocol,
                  port: tg.Port,
                  vpcId: tg.VpcId,
                  error: error.message
                };
              }
            }));
            
            // Get SSL certificates from listeners
            const certificates = listenersResult.Listeners
              .filter(listener => listener.Certificates && listener.Certificates.length > 0)
              .flatMap(listener => listener.Certificates.map(cert => cert.CertificateArn));
            
            return {
              name: lb.LoadBalancerName,
              arn: lb.LoadBalancerArn,
              dnsName: lb.DNSName,
              type: lb.Type.toLowerCase(),
              scheme: lb.Scheme,
              region: region.RegionName,
              vpcId: lb.VpcId,
              availabilityZones: lb.AvailabilityZones.map(az => ({
                zoneName: az.ZoneName,
                subnetId: az.SubnetId
              })),
              securityGroups: lb.SecurityGroups,
              state: lb.State.Code,
              ipAddressType: lb.IpAddressType,
              createdTime: lb.CreatedTime,
              listeners: listenersResult.Listeners.map(listener => ({
                listenerArn: listener.ListenerArn,
                protocol: listener.Protocol,
                port: listener.Port,
                sslCertificates: listener.Certificates 
                  ? listener.Certificates.map(cert => cert.CertificateArn)
                  : [],
                defaultActions: listener.DefaultActions.map(action => ({
                  type: action.Type,
                  targetGroupArn: action.TargetGroupArn,
                  order: action.Order
                }))
              })),
              targetGroups,
              certificates
            };
          } catch (error) {
            console.error(`Error fetching details for load balancer ${lb.LoadBalancerArn}:`, error);
            return {
              name: lb.LoadBalancerName,
              arn: lb.LoadBalancerArn,
              dnsName: lb.DNSName,
              type: lb.Type.toLowerCase(),
              region: region.RegionName,
              error: error.message
            };
          }
        }));
        
        return [...classicLoadBalancers, ...albNlbLoadBalancers];
      } catch (error) {
        console.error(`Error fetching load balancers for region ${region.RegionName}:`, error);
        return [];
      }
    });
    
    // Wait for all regions to complete
    const loadBalancersByRegion = await Promise.all(loadBalancerPromises);
    
    // Flatten the array
    return loadBalancersByRegion.flat();
  } catch (error) {
    console.error('Error fetching load balancers:', error);
    throw error;
  }
};

/**
 * Get certificates attached to load balancers
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Array>} - List of certificates with attached load balancers
 */
const getLoadBalancerCertificates = async (credentials = null) => {
  try {
    // Get all load balancers
    const loadBalancers = await getAllLoadBalancers(credentials);
    
    // Extract certificates from all load balancers
    const certificateMap = new Map();
    
    // Process classic load balancers
    loadBalancers
      .filter(lb => lb.type === 'classic')
      .forEach(lb => {
        lb.listeners.forEach(listener => {
          if (listener.sslCertificateId) {
            if (!certificateMap.has(listener.sslCertificateId)) {
              certificateMap.set(listener.sslCertificateId, {
                arn: listener.sslCertificateId,
                loadBalancers: []
              });
            }
            
            certificateMap.get(listener.sslCertificateId).loadBalancers.push({
              name: lb.name,
              type: lb.type,
              dnsName: lb.dnsName,
              region: lb.region,
              port: listener.loadBalancerPort,
              protocol: listener.protocol
            });
          }
        });
      });
    
    // Process ALB/NLB load balancers
    loadBalancers
      .filter(lb => lb.type === 'application' || lb.type === 'network')
      .forEach(lb => {
        if (lb.listeners) {
          lb.listeners.forEach(listener => {
            if (listener.sslCertificates && listener.sslCertificates.length > 0) {
              listener.sslCertificates.forEach(certArn => {
                if (!certificateMap.has(certArn)) {
                  certificateMap.set(certArn, {
                    arn: certArn,
                    loadBalancers: []
                  });
                }
                
                certificateMap.get(certArn).loadBalancers.push({
                  name: lb.name,
                  type: lb.type,
                  dnsName: lb.dnsName,
                  region: lb.region,
                  port: listener.port,
                  protocol: listener.protocol
                });
              });
            }
          });
        }
      });
    
    return Array.from(certificateMap.values());
  } catch (error) {
    console.error('Error fetching load balancer certificates:', error);
    throw error;
  }
};

/**
 * Get details about a specific load balancer
 * @param {Object} params - Parameters
 * @param {string} params.region - AWS region
 * @param {string} params.name - Load balancer name
 * @param {string} params.type - Load balancer type (classic, application, network)
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Load balancer details
 */
const getLoadBalancerDetails = async (params, credentials = null) => {
  try {
    const { region, name, type, arn } = params;
    
    if (type === 'classic') {
      // Classic Load Balancer
      const elb = credentials
        ? new AWS.ELB({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region
          })
        : new AWS.ELB({ region });
      
      const result = await elb.describeLoadBalancers({
        LoadBalancerNames: [name]
      }).promise();
      
      if (!result.LoadBalancerDescriptions || result.LoadBalancerDescriptions.length === 0) {
        throw new Error(`Classic Load Balancer ${name} not found in region ${region}`);
      }
      
      const lb = result.LoadBalancerDescriptions[0];
      
      // Get attributes
      const attributesResult = await elb.describeLoadBalancerAttributes({
        LoadBalancerName: name
      }).promise();
      
      // Get tags
      const tagsResult = await elb.describeTags({
        LoadBalancerNames: [name]
      }).promise();
      
      // Get policies
      const policiesResult = await elb.describeLoadBalancerPolicies({
        LoadBalancerName: name
      }).promise();
      
      const tags = tagsResult.TagDescriptions && tagsResult.TagDescriptions.length > 0
        ? tagsResult.TagDescriptions[0].Tags
        : [];
      
      return {
        name: lb.LoadBalancerName,
        dnsName: lb.DNSName,
        type: 'classic',
        scheme: lb.Scheme,
        region,
        availabilityZones: lb.AvailabilityZones,
        subnets: lb.Subnets,
        securityGroups: lb.SecurityGroups,
        vpcId: lb.VPCId,
        instances: lb.Instances.map(instance => instance.InstanceId),
        listeners: lb.ListenerDescriptions.map(listener => ({
          protocol: listener.Listener.Protocol,
          loadBalancerPort: listener.Listener.LoadBalancerPort,
          instanceProtocol: listener.Listener.InstanceProtocol,
          instancePort: listener.Listener.InstancePort,
          sslCertificateId: listener.Listener.SSLCertificateId,
          policyNames: listener.PolicyNames
        })),
        healthCheck: lb.HealthCheck ? {
          target: lb.HealthCheck.Target,
          interval: lb.HealthCheck.Interval,
          timeout: lb.HealthCheck.Timeout,
          unhealthyThreshold: lb.HealthCheck.UnhealthyThreshold,
          healthyThreshold: lb.HealthCheck.HealthyThreshold
        } : null,
        attributes: attributesResult.LoadBalancerAttributes,
        policies: policiesResult.PolicyDescriptions,
        tags,
        createdTime: lb.CreatedTime
      };
    } else {
      // Application or Network Load Balancer
      const elbv2 = credentials
        ? new AWS.ELBv2({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region
          })
        : new AWS.ELBv2({ region });
      
      // Use ARN if provided, otherwise look up by name
      let loadBalancerArn = arn;
      if (!loadBalancerArn) {
        const lbResult = await elbv2.describeLoadBalancers({
          Names: [name]
        }).promise();
        
        if (!lbResult.LoadBalancers || lbResult.LoadBalancers.length === 0) {
          throw new Error(`${type} Load Balancer ${name} not found in region ${region}`);
        }
        
        loadBalancerArn = lbResult.LoadBalancers[0].LoadBalancerArn;
      }
      
      // Get load balancer details
      const result = await elbv2.describeLoadBalancers({
        LoadBalancerArns: [loadBalancerArn]
      }).promise();
      
      if (!result.LoadBalancers || result.LoadBalancers.length === 0) {
        throw new Error(`Load Balancer with ARN ${loadBalancerArn} not found in region ${region}`);
      }
      
      const lb = result.LoadBalancers[0];
      
      // Get listeners
      const listenersResult = await elbv2.describeListeners({
        LoadBalancerArn: lb.LoadBalancerArn
      }).promise();
      
      // Get target groups
      const targetGroupsResult = await elbv2.describeTargetGroups({
        LoadBalancerArn: lb.LoadBalancerArn
      }).promise();
      
      // Get attributes
      const attributesResult = await elbv2.describeLoadBalancerAttributes({
        LoadBalancerArn: lb.LoadBalancerArn
      }).promise();
      
      // Get tags
      const tagsResult = await elbv2.describeTags({
        ResourceArns: [lb.LoadBalancerArn]
      }).promise();
      
      // Process target groups with health information
      const targetGroups = await Promise.all(targetGroupsResult.TargetGroups.map(async (tg) => {
        try {
          // Get targets (instances) for this target group
          const targetsResult = await elbv2.describeTargetHealth({
            TargetGroupArn: tg.TargetGroupArn
          }).promise();
          
          // Get target group attributes
          const tgAttributesResult = await elbv2.describeTargetGroupAttributes({
            TargetGroupArn: tg.TargetGroupArn
          }).promise();
          
          return {
            targetGroupArn: tg.TargetGroupArn,
            targetGroupName: tg.TargetGroupName,
            protocol: tg.Protocol,
            port: tg.Port,
            vpcId: tg.VpcId,
            healthCheckProtocol: tg.HealthCheckProtocol,
            healthCheckPort: tg.HealthCheckPort,
            healthCheckPath: tg.HealthCheckPath,
            healthCheckIntervalSeconds: tg.HealthCheckIntervalSeconds,
            healthCheckTimeoutSeconds: tg.HealthCheckTimeoutSeconds,
            healthyThresholdCount: tg.HealthyThresholdCount,
            unhealthyThresholdCount: tg.UnhealthyThresholdCount,
            attributes: tgAttributesResult.Attributes,
            targets: targetsResult.TargetHealthDescriptions.map(target => ({
              id: target.Target.Id,
              port: target.Target.Port,
              state: target.TargetHealth.State,
              reason: target.TargetHealth.Reason,
              description: target.TargetHealth.Description
            }))
          };
        } catch (error) {
          console.error(`Error fetching target health for ${tg.TargetGroupArn}:`, error);
          return {
            targetGroupArn: tg.TargetGroupArn,
            targetGroupName: tg.TargetGroupName,
            protocol: tg.Protocol,
            port: tg.Port,
            vpcId: tg.VpcId,
            error: error.message
          };
        }
      }));
      
      // Process listener rules
      const listeners = await Promise.all(listenersResult.Listeners.map(async (listener) => {
        try {
          // Get rules for this listener
          const rulesResult = await elbv2.describeRules({
            ListenerArn: listener.ListenerArn
          }).promise();
          
          return {
            listenerArn: listener.ListenerArn,
            protocol: listener.Protocol,
            port: listener.Port,
            sslCertificates: listener.Certificates 
              ? listener.Certificates.map(cert => cert.CertificateArn)
              : [],
            defaultActions: listener.DefaultActions.map(action => ({
              type: action.Type,
              targetGroupArn: action.TargetGroupArn,
              order: action.Order,
              redirectConfig: action.RedirectConfig,
              fixedResponseConfig: action.FixedResponseConfig
            })),
            rules: rulesResult.Rules.filter(rule => rule.IsDefault === false).map(rule => ({
              ruleArn: rule.RuleArn,
              priority: rule.Priority,
              conditions: rule.Conditions,
              actions: rule.Actions.map(action => ({
                type: action.Type,
                targetGroupArn: action.TargetGroupArn,
                order: action.Order,
                redirectConfig: action.RedirectConfig,
                fixedResponseConfig: action.FixedResponseConfig
              }))
            }))
          };
        } catch (error) {
          console.error(`Error fetching rules for listener ${listener.ListenerArn}:`, error);
          return {
            listenerArn: listener.ListenerArn,
            protocol: listener.Protocol,
            port: listener.Port,
            sslCertificates: listener.Certificates 
              ? listener.Certificates.map(cert => cert.CertificateArn)
              : [],
            defaultActions: listener.DefaultActions.map(action => ({
              type: action.Type,
              targetGroupArn: action.TargetGroupArn
            })),
            error: error.message
          };
        }
      }));
      
      // Get SSL certificates from listeners
      const certificates = listeners
        .filter(listener => listener.sslCertificates && listener.sslCertificates.length > 0)
        .flatMap(listener => listener.sslCertificates);
      
      const tags = tagsResult.TagDescriptions && tagsResult.TagDescriptions.length > 0
        ? tagsResult.TagDescriptions[0].Tags
        : [];
      
      return {
        name: lb.LoadBalancerName,
        arn: lb.LoadBalancerArn,
        dnsName: lb.DNSName,
        canonicalHostedZoneId: lb.CanonicalHostedZoneId,
        type: lb.Type.toLowerCase(),
        scheme: lb.Scheme,
        region,
        vpcId: lb.VpcId,
        availabilityZones: lb.AvailabilityZones.map(az => ({
          zoneName: az.ZoneName,
          subnetId: az.SubnetId
        })),
        securityGroups: lb.SecurityGroups,
        state: lb.State.Code,
        ipAddressType: lb.IpAddressType,
        createdTime: lb.CreatedTime,
        listeners,
        targetGroups,
        certificates,
        attributes: attributesResult.Attributes,
        tags
      };
    }
  } catch (error) {
    console.error(`Error fetching details for load balancer ${params.name}:`, error);
    throw error;
  }
};

/**
 * Update SSL certificate on a load balancer listener
 * @param {Object} params - Parameters
 * @param {string} params.region - AWS region
 * @param {string} params.listenerArn - Listener ARN (for ALB/NLB)
 * @param {string} params.certificateArn - Certificate ARN
 * @param {string} params.loadBalancerName - Load balancer name (for classic LB)
 * @param {number} params.loadBalancerPort - Load balancer port (for classic LB)
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Update result
 */
const updateCertificate = async (params, credentials = null) => {
  try {
    const { region, listenerArn, certificateArn, loadBalancerName, loadBalancerPort } = params;
    
    if (listenerArn) {
      // Update ALB/NLB listener certificate
      const elbv2 = credentials
        ? new AWS.ELBv2({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region
          })
        : new AWS.ELBv2({ region });
      
      await elbv2.modifyListener({
        ListenerArn: listenerArn,
        Certificates: [{ CertificateArn: certificateArn }]
      }).promise();
      
      return {
        listenerArn,
        certificateArn,
        status: 'updated'
      };
    } else if (loadBalancerName && loadBalancerPort) {
      // Update Classic LB listener certificate
      const elb = credentials
        ? new AWS.ELB({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region
          })
        : new AWS.ELB({ region });
      
      await elb.setLoadBalancerListenerSSLCertificate({
        LoadBalancerName: loadBalancerName,
        LoadBalancerPort: loadBalancerPort,
        SSLCertificateId: certificateArn
      }).promise();
      
      return {
        loadBalancerName,
        loadBalancerPort,
        certificateArn,
        status: 'updated'
      };
    } else {
      throw new Error('Either listenerArn or both loadBalancerName and loadBalancerPort must be provided');
    }
  } catch (error) {
    console.error('Error updating certificate on load balancer:', error);
    throw error;
  }
};

module.exports = {
  getAllLoadBalancers,
  getLoadBalancerCertificates,
  getLoadBalancerDetails,
  updateCertificate
};
