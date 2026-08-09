/**
 * PM2 ecosystem config — SportSphere v3
 *
 * Usage:
 *   pm2 start ecosystem.config.js
 *   pm2 reload ecosystem.config.js   # zero-downtime reload
 *   pm2 save                         # persist across reboots
 *   pm2 startup                      # register pm2 with systemd
 */
module.exports = {
  apps: [
    {
      name: 'sportsphere',
      script: '.next/standalone/server.js',
      interpreter: 'node',
      cwd: '/var/www/sportsphere-nextjs',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOSTNAME: '127.0.0.1',
      },
      // Logging
      out_file: '/var/log/pm2/sportsphere-out.log',
      error_file: '/var/log/pm2/sportsphere-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      // Restart policy
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      // Watch (disable in production — use deployments instead)
      watch: false,
    },
  ],
};
