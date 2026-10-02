const PROXY_CONFIG = [
  {
    context: ['/youtube', '/google-auth', '/notifications', '/users'],
    target: 'http://localhost:3000',
    secure: false,
    changeOrigin: true,
    logLevel: 'debug',
  },
];

module.exports = PROXY_CONFIG;
