module.exports = {
  apps: [
    {
      name: 'personal-hub',
      script: './server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000
      },
      max_memory_restart: '300M',
      autorestart: true,
      watch: false,
      time: true
    }
  ]
};
