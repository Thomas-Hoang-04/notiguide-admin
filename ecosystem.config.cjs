module.exports = {
  apps: [
    {
      name: "notiguide-admin",
      script: "node_modules/.bin/next",
      args: "start -p 3000",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
};
