const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// 👇 exclude otp-mock-api folder from being bundled
config.watchFolders = [path.resolve(__dirname)];
config.resolver.blockList = [
  /otp-mock-api\/.*/,
];

module.exports = config;