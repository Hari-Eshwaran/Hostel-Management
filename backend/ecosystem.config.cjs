module.exports = {
  apps: [
    {
      name: "hostel-backend",
      script: "server.js",
      node_args: "--experimental-modules",
      instances: "max",
      exec_mode: "cluster",
      env: {
        NODE_ENV: "production",
        PORT: 5000,
      },
      max_memory_restart: "500M",
      log_date_format: "YYYY-MM-DD HH:mm:ss Z",
      error_file: "/var/log/hostel-backend/error.log",
      out_file: "/var/log/hostel-backend/out.log",
      merge_logs: true,
    },
  ],
};
