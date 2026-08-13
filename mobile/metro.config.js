const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);
config.watchFolders = [path.resolve(projectRoot, "vendor")];
config.resolver.nodeModulesPaths = [path.resolve(projectRoot, "node_modules")];
config.resolver.extraNodeModules = {
  "@sportsphere/api-client": path.resolve(projectRoot, "vendor/api-client"),
  "@sportsphere/types": path.resolve(projectRoot, "vendor/types"),
  "@sportsphere/design-system": path.resolve(projectRoot, "vendor/design-system"),
  "lucide-react-native": path.resolve(projectRoot, "components/lucide-shim.js"),
};
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "lucide-react-native") {
    return {
      filePath: path.resolve(projectRoot, "components/lucide-shim.js"),
      type: "sourceFile",
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};
module.exports = config;
