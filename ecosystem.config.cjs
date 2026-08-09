/**
 * PM2 ecosystem config — SportSphere v3
 *
 * Usage on VPS:
 *   git pull origin main
 *   npm run build
 *   pm2 start ecosystem.config.cjs --update-env
 *   pm2 save
 *   pm2 startup   # run once to register with systemd
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
        // 0.0.0.0 — bind on all interfaces so Nginx can reach the app.
        // Nginx proxies 127.0.0.1:3002 → this process.
        HOSTNAME: '0.0.0.0',
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
      watch: false,
    },
  ],
};
