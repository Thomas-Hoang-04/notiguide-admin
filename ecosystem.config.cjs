const path = require("node:path");

module.exports = {
  apps: [
    {
      name: "notiguide-admin",
      cwd: path.join(__dirname, ".next/standalone"),
      script: "server.js",
      instances: 2,
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 2312,
      },
    },
  ],
};
