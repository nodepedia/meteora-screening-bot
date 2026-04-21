module.exports = {
  apps: [
    {
      name: "meteora-screening-bot",
      script: "./src/index.js",
      cwd: __dirname,
      interpreter: "node",
      env: {
        NODE_ENV: "production",
        APP_RUN_ONCE: "false",
      },
      watch: false,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      time: true,
    },
  ],
};
