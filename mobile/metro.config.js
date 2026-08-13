const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');
const path = require('path');

const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

config.watchFolders = [
  path.resolve(projectRoot, 'vendor'),
];
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
];
config.resolver.extraNodeModules = {
  '@sportsphere/api-client': path.resolve(projectRoot, 'vendor/api-client'),
  '@sportsphere/types': path.resolve(projectRoot, 'vendor/types'),
  '@sportsphere/design-system': path.resolve(projectRoot, 'vendor/design-system'),
};

module.exports = withNativeWind(config, { input: './global.css' });
