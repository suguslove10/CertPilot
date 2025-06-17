const AWS = require('aws-sdk');

/**
 * Get all EC2 instances across regions
 * @param {Object} credentials - AWS credentials
 * @returns {Promise<Array>} - List of EC2 instances
 */
const getAllInstances = async (credentials = null) => {
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
    
    // Fetch instances from all regions
    const instancePromises = regions.Regions.map(async (region) => {
      const regionalEc2 = credentials
        ? new AWS.EC2({
            accessKeyId: credentials.accessKeyId,
            secretAccessKey: credentials.secretAccessKey,
            region: region.RegionName
          })
        : new AWS.EC2({ region: region.RegionName });
      
      const instances = await regionalEc2.describeInstances().promise();
      
      // Extract instance information
      const regionalInstances = [];
      instances.Reservations.forEach(reservation => {
        reservation.Instances.forEach(instance => {
          // Get instance name from tags
          const nameTag = instance.Tags && instance.Tags.find(tag => tag.Key === 'Name');
          const name = nameTag ? nameTag.Value : 'Unnamed Instance';
          
          // Get public and private DNS/IP
          const publicDns = instance.PublicDnsName;
          const publicIp = instance.PublicIpAddress;
          const privateDns = instance.PrivateDnsName;
          const privateIp = instance.PrivateIpAddress;
          
          // Extract security groups
          const securityGroups = instance.SecurityGroups 
            ? instance.SecurityGroups.map(sg => ({ id: sg.GroupId, name: sg.GroupName }))
            : [];
          
          regionalInstances.push({
            id: instance.InstanceId,
            name,
            type: instance.InstanceType,
            state: instance.State.Name,
            availabilityZone: instance.Placement.AvailabilityZone,
            region: region.RegionName,
            publicDns,
            publicIp,
            privateDns,
            privateIp,
            vpcId: instance.VpcId,
            subnetId: instance.SubnetId,
            launchTime: instance.LaunchTime,
            securityGroups,
            keyName: instance.KeyName,
            platform: instance.Platform || 'linux',
            architecture: instance.Architecture,
            rootDeviceType: instance.RootDeviceType,
            rootDeviceName: instance.RootDeviceName,
            virtualizationType: instance.VirtualizationType,
            tags: instance.Tags || []
          });
        });
      });
      
      return regionalInstances;
    });
    
    // Wait for all regions to complete
    const instancesByRegion = await Promise.all(instancePromises);
    
    // Flatten the array
    return instancesByRegion.flat();
  } catch (error) {
    console.error('Error fetching EC2 instances:', error);
    throw error;
  }
};

/**
 * Get detailed information about a specific EC2 instance
 * @param {Object} params - Parameters
 * @param {string} params.region - AWS region
 * @param {string} params.instanceId - EC2 instance ID
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Instance details
 */
const getInstanceDetails = async (params, credentials = null) => {
  try {
    const { region, instanceId } = params;
    
    const ec2 = credentials
      ? new AWS.EC2({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.EC2({ region });
    
    const result = await ec2.describeInstances({
      InstanceIds: [instanceId]
    }).promise();
    
    if (!result.Reservations || result.Reservations.length === 0 || 
        !result.Reservations[0].Instances || result.Reservations[0].Instances.length === 0) {
      throw new Error(`Instance ${instanceId} not found in region ${region}`);
    }
    
    const instance = result.Reservations[0].Instances[0];
    
    // Get instance status (more detailed than state)
    const statusResult = await ec2.describeInstanceStatus({
      InstanceIds: [instanceId],
      IncludeAllInstances: true
    }).promise();
    
    const status = statusResult.InstanceStatuses && statusResult.InstanceStatuses.length > 0
      ? statusResult.InstanceStatuses[0]
      : { InstanceStatus: { Status: 'unknown' }, SystemStatus: { Status: 'unknown' } };
    
    // Get console output if available
    let consoleOutput = null;
    try {
      const outputResult = await ec2.getConsoleOutput({
        InstanceId: instanceId
      }).promise();
      
      consoleOutput = outputResult.Output 
        ? Buffer.from(outputResult.Output, 'base64').toString('utf-8')
        : null;
    } catch (e) {
      console.log(`Console output not available for ${instanceId}: ${e.message}`);
    }
    
    // Extract block device mappings
    const blockDevices = instance.BlockDeviceMappings.map(device => ({
      deviceName: device.DeviceName,
      volumeId: device.Ebs?.VolumeId,
      status: device.Ebs?.Status,
      deleteOnTermination: device.Ebs?.DeleteOnTermination
    }));
    
    // Get volume information for each attached volume
    const volumePromises = blockDevices
      .filter(device => device.volumeId)
      .map(async (device) => {
        try {
          const volumeResult = await ec2.describeVolumes({
            VolumeIds: [device.volumeId]
          }).promise();
          
          if (volumeResult.Volumes && volumeResult.Volumes.length > 0) {
            const volume = volumeResult.Volumes[0];
            return {
              ...device,
              size: volume.Size,
              volumeType: volume.VolumeType,
              iops: volume.Iops,
              throughput: volume.Throughput,
              encrypted: volume.Encrypted,
              createTime: volume.CreateTime
            };
          }
          return device;
        } catch (e) {
          console.log(`Error fetching volume ${device.volumeId}: ${e.message}`);
          return device;
        }
      });
    
    const volumes = await Promise.all(volumePromises);
    
    // Extract network interfaces
    const networkInterfaces = instance.NetworkInterfaces.map(ni => ({
      id: ni.NetworkInterfaceId,
      subnetId: ni.SubnetId,
      vpcId: ni.VpcId,
      privateIp: ni.PrivateIpAddress,
      privateDnsName: ni.PrivateDnsName,
      publicIp: ni.Association?.PublicIp,
      publicDnsName: ni.Association?.PublicDnsName,
      status: ni.Status,
      macAddress: ni.MacAddress,
      securityGroups: ni.Groups.map(group => ({
        id: group.GroupId,
        name: group.GroupName
      }))
    }));
    
    // Get name tag
    const nameTag = instance.Tags && instance.Tags.find(tag => tag.Key === 'Name');
    const name = nameTag ? nameTag.Value : 'Unnamed Instance';
    
    return {
      id: instance.InstanceId,
      name,
      type: instance.InstanceType,
      state: instance.State.Name,
      availabilityZone: instance.Placement.AvailabilityZone,
      region,
      publicDns: instance.PublicDnsName,
      publicIp: instance.PublicIpAddress,
      privateDns: instance.PrivateDnsName,
      privateIp: instance.PrivateIpAddress,
      vpcId: instance.VpcId,
      subnetId: instance.SubnetId,
      launchTime: instance.LaunchTime,
      securityGroups: instance.SecurityGroups 
        ? instance.SecurityGroups.map(sg => ({ id: sg.GroupId, name: sg.GroupName }))
        : [],
      keyName: instance.KeyName,
      platform: instance.Platform || 'linux',
      architecture: instance.Architecture,
      rootDeviceType: instance.RootDeviceType,
      rootDeviceName: instance.RootDeviceName,
      virtualizationType: instance.VirtualizationType,
      ebsOptimized: instance.EbsOptimized,
      blockDevices: volumes,
      networkInterfaces,
      tags: instance.Tags || [],
      instanceStatus: status.InstanceStatus?.Status,
      systemStatus: status.SystemStatus?.Status,
      consoleOutput
    };
  } catch (error) {
    console.error(`Error fetching details for instance ${params.instanceId}:`, error);
    throw error;
  }
};

/**
 * Start an EC2 instance
 * @param {Object} params - Parameters
 * @param {string} params.region - AWS region
 * @param {string} params.instanceId - EC2 instance ID
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Start result
 */
const startInstance = async (params, credentials = null) => {
  try {
    const { region, instanceId } = params;
    
    const ec2 = credentials
      ? new AWS.EC2({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.EC2({ region });
    
    const result = await ec2.startInstances({
      InstanceIds: [instanceId]
    }).promise();
    
    return {
      instanceId,
      previousState: result.StartingInstances[0].PreviousState.Name,
      currentState: result.StartingInstances[0].CurrentState.Name
    };
  } catch (error) {
    console.error(`Error starting instance ${params.instanceId}:`, error);
    throw error;
  }
};

/**
 * Stop an EC2 instance
 * @param {Object} params - Parameters
 * @param {string} params.region - AWS region
 * @param {string} params.instanceId - EC2 instance ID
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Stop result
 */
const stopInstance = async (params, credentials = null) => {
  try {
    const { region, instanceId } = params;
    
    const ec2 = credentials
      ? new AWS.EC2({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.EC2({ region });
    
    const result = await ec2.stopInstances({
      InstanceIds: [instanceId]
    }).promise();
    
    return {
      instanceId,
      previousState: result.StoppingInstances[0].PreviousState.Name,
      currentState: result.StoppingInstances[0].CurrentState.Name
    };
  } catch (error) {
    console.error(`Error stopping instance ${params.instanceId}:`, error);
    throw error;
  }
};

/**
 * Reboot an EC2 instance
 * @param {Object} params - Parameters
 * @param {string} params.region - AWS region
 * @param {string} params.instanceId - EC2 instance ID
 * @param {Object} credentials - AWS credentials (optional)
 * @returns {Promise<Object>} - Reboot result
 */
const rebootInstance = async (params, credentials = null) => {
  try {
    const { region, instanceId } = params;
    
    const ec2 = credentials
      ? new AWS.EC2({
          accessKeyId: credentials.accessKeyId,
          secretAccessKey: credentials.secretAccessKey,
          region
        })
      : new AWS.EC2({ region });
    
    await ec2.rebootInstances({
      InstanceIds: [instanceId]
    }).promise();
    
    return {
      instanceId,
      status: 'rebooting'
    };
  } catch (error) {
    console.error(`Error rebooting instance ${params.instanceId}:`, error);
    throw error;
  }
};

module.exports = {
  getAllInstances,
  getInstanceDetails,
  startInstance,
  stopInstance,
  rebootInstance
}; 