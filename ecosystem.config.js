const path = require('path');

const ROOT = __dirname;
const logs = (name) => path.join(ROOT, 'logs', name);

module.exports = {
  apps: [
    {
      name: 'hiddenglow-api',
      cwd: path.join(ROOT, 'backend'),
      script: 'dist/main.js',
      env: {
        NODE_ENV: 'production',
        PORT: 4001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: logs('api-error.log'),
      out_file: logs('api-out.log'),
      merge_logs: true,
    },
    {
      name: 'hiddenglow-web',
      cwd: path.join(ROOT, 'frontend'),
      script: 'node_modules/.bin/next',
      args: 'start -p 3001',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      instances: 1,
      autorestart: true,
      max_memory_restart: '512M',
      error_file: logs('web-error.log'),
      out_file: logs('web-out.log'),
      merge_logs: true,
    },
    {
      name: 'hiddenglow-ml',
      cwd: path.join(ROOT, 'ml-service'),
      interpreter: path.join(ROOT, 'ml-service', 'venv', 'bin', 'python3'),
      script: 'main.py',
      env: {
        API_PORT: 4002,
      },
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      max_memory_restart: '512M',
      error_file: logs('ml-error.log'),
      out_file: logs('ml-out.log'),
      merge_logs: true,
    },
  ],
};
