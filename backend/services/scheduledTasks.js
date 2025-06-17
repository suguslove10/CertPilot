const cron = require('node-cron');
const certificateMonitor = require('./certificateMonitor');
const metricsService = require('./metricsService');
const healthMonitorService = require('./healthMonitorService');

/**
 * Initialize all scheduled tasks
 */
const initScheduledTasks = () => {
  // Check certificate expiration every 2 minutes for demo
  cron.schedule('*/2 * * * *', async () => {
    console.log('Running scheduled certificate expiration check');
    try {
      const results = await certificateMonitor.checkCertificateExpiration();
      console.log(`Certificate expiration check completed: ${results.length} certificates checked`);
    } catch (error) {
      console.error('Error in scheduled certificate expiration check:', error);
    }
  });

  // Update certificate metadata every 3 minutes for demo
  cron.schedule('*/3 * * * *', async () => {
    console.log('Running scheduled certificate metadata update');
    try {
      const results = await certificateMonitor.updateCertificateMetadata();
      console.log(`Certificate metadata update completed: ${results.length} certificates checked`);
    } catch (error) {
      console.error('Error in scheduled certificate metadata update:', error);
    }
  });

  // Collect system metrics every 1 minute for demo
  cron.schedule('*/1 * * * *', async () => {
    console.log('Collecting system metrics');
    try {
      await metricsService.collectSystemMetrics();
    } catch (error) {
      console.error('Error collecting system metrics:', error);
    }
  });

  // Collect database metrics every 2 minutes for demo
  cron.schedule('*/2 * * * *', async () => {
    console.log('Collecting database metrics');
    try {
      await metricsService.collectDatabaseMetrics();
    } catch (error) {
      console.error('Error collecting database metrics:', error);
    }
  });

  // Collect certificate metrics every 1 minute for demo
  cron.schedule('*/1 * * * *', async () => {
    console.log('Collecting certificate metrics');
    try {
      await metricsService.collectCertificateMetrics();
    } catch (error) {
      console.error('Error collecting certificate metrics:', error);
    }
  });

  // Run health checks every 1 minute for demo
  cron.schedule('*/1 * * * *', async () => {
    console.log('Running health checks');
    try {
      const health = await healthMonitorService.checkAllServices();
      console.log(`Health check completed - System status: ${health.overallStatus}`);
      
      // Log any issues
      Object.entries(health.services).forEach(([service, status]) => {
        if (status.status !== 'healthy') {
          console.warn(`Service ${service} is ${status.status}: ${JSON.stringify(status.details)}`);
        }
      });
    } catch (error) {
      console.error('Error running health checks:', error);
    }
  });

  // Run an initial health check immediately
  setTimeout(async () => {
    console.log('Running initial health check');
    try {
      const health = await healthMonitorService.checkAllServices();
      console.log(`Initial health check completed - System status: ${health.overallStatus}`);
    } catch (error) {
      console.error('Error running initial health check:', error);
    }
  }, 3000);

  console.log('Scheduled tasks initialized with frequent checks for demonstration');
};

module.exports = {
  initScheduledTasks
}; 