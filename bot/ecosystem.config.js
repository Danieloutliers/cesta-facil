module.exports = {
  apps: [{
    name: 'cesta-facil-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // Restart delay
    restart_delay: 4000,
    // Exponential backoff restart delay
    exp_backoff_restart_delay: 100,
    // Max number of restart retries
    max_restarts: 10,
    // Min uptime to consider it stable
    min_uptime: '10s'
  }]
};
