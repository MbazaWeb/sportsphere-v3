module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4: jsxImportSource='nativewind' is all that's needed.
      // (The old 'nativewind/babel' plugin is v2-only and breaks v4.)
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    ],
    plugins: [
      'react-native-reanimated/plugin',  // must be last
    ],
  };
};
