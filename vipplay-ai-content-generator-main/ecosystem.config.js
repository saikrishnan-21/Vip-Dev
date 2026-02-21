/**
 * PM2 Ecosystem Configuration for VIPContentAI
 * 
 * This file configures PM2 to run multiple instances of services.
 * 
 * Usage:
 *   pm2 start ecosystem.config.js                    # Start all services
 *   pm2 start ecosystem.config.js --only sqs-worker  # Start only SQS workers
 *   pm2 start ecosystem.config.js --only sqs-worker --instances 4  # Start 4 SQS workers
 *   pm2 stop all                                     # Stop all services
 *   pm2 restart all                                  # Restart all services
 *   pm2 delete all                                   # Delete all from PM2
 *   pm2 logs sqs-worker                              # View logs
 *   pm2 monit                                        # Monitor all processes
 */

module.exports = {
  apps: [
    /**
     * General SQS Workers - Process all queue types (articles, images, videos)
     * Each worker polls all configured queues in parallel
     * Recommended: 2-6 instances depending on EC2 instance size
     */
    {
      name: 'sqs-worker',
      script: 'npm',
      args: 'run worker:sqs',
      instances: 4, // Number of worker instances
      // Recommended instances by EC2 type:
      // t3.small (2GB RAM): 2 instances
      // t3.medium (4GB RAM): 3-4 instances
      // t3.large (8GB RAM): 4-6 instances
      // t3.xlarge (16GB RAM): 6-8 instances
      exec_mode: 'fork', // Use fork mode - each worker polls SQS independently
      autorestart: true,
      watch: false,
      max_memory_restart: '1G', // Restart if memory exceeds 1GB per worker
      env: {
        NODE_ENV: 'production',
        // Environment variables will be loaded from .env file
      },
      error_file: './logs/pm2-sqs-worker-error.log',
      out_file: './logs/pm2-sqs-worker-out.log',
      log_file: './logs/pm2-sqs-worker.log',
      time: true, // Prepend timestamp to logs
      merge_logs: true, // Merge logs from all instances
      kill_timeout: 5000, // Time to wait before force kill
      wait_ready: false,
      listen_timeout: 10000,
      // Restart delay in milliseconds
      exp_backoff_restart_delay: 100,
      // Max number of restarts in the time window
      max_restarts: 10,
      // Time window for max_restarts
      min_uptime: '10s',
    },
    
    /**
     * OPTIONAL: Specialized Workers (Uncomment if you want dedicated workers per queue type)
     * This allows you to scale each queue type independently
     */
    // {
    //   name: 'sqs-worker-articles',
    //   script: 'npm',
    //   args: 'run worker:sqs',
    //   instances: 3, // Dedicated workers for articles queue
    //   exec_mode: 'fork',
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '1G',
    //   env: {
    //     NODE_ENV: 'production',
    //     // You can add queue-specific environment variables here if needed
    //   },
    //   error_file: './logs/pm2-sqs-worker-articles-error.log',
    //   out_file: './logs/pm2-sqs-worker-articles-out.log',
    //   log_file: './logs/pm2-sqs-worker-articles.log',
    //   time: true,
    //   merge_logs: true,
    // },
    // {
    //   name: 'sqs-worker-images',
    //   script: 'npm',
    //   args: 'run worker:sqs',
    //   instances: 2, // Dedicated workers for images queue
    //   exec_mode: 'fork',
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '800M', // Images might use less memory
    //   env: {
    //     NODE_ENV: 'production',
    //   },
    //   error_file: './logs/pm2-sqs-worker-images-error.log',
    //   out_file: './logs/pm2-sqs-worker-images-out.log',
    //   log_file: './logs/pm2-sqs-worker-images.log',
    //   time: true,
    //   merge_logs: true,
    // },
    // {
    //   name: 'sqs-worker-videos',
    //   script: 'npm',
    //   args: 'run worker:sqs',
    //   instances: 1, // Dedicated workers for videos queue (usually less frequent)
    //   exec_mode: 'fork',
    //   autorestart: true,
    //   watch: false,
    //   max_memory_restart: '1.5G', // Videos might use more memory
    //   env: {
    //     NODE_ENV: 'production',
    //   },
    //   error_file: './logs/pm2-sqs-worker-videos-error.log',
    //   out_file: './logs/pm2-sqs-worker-videos-out.log',
    //   log_file: './logs/pm2-sqs-worker-videos.log',
    //   time: true,
    //   merge_logs: true,
    // },
  ],
};

