module.exports = {
  apps: [
    {
      name: 'sportsphere',
      script: 'server.js',
      interpreter: 'node',
      cwd: '/var/www/sportsphere-nextjs/.next/standalone',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        HOSTNAME: '0.0.0.0',
      },
      out_file: '/var/log/pm2/sportsphere-out.log',
      error_file: '/var/log/pm2/sportsphere-err.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false,
    },
  ],
};
