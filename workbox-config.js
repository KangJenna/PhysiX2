module.exports = {
  globDirectory: './',
  globPatterns: [
    '**/*.{html,js,png,jpg,glb}'
  ],
  globIgnores: [
    'node_modules/**/*',
    'workbox-config.js',
    'package*.json'
  ],
  swDest: 'sw.js',
  clientsClaim: true,
  skipWaiting: true
};