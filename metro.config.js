const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// Drizzle emits migrations as .sql files that are imported at runtime.
config.resolver.sourceExts.push('sql');

// The prebuilt food database is bundled as an asset and copied out on first launch.
config.resolver.assetExts.push('db');

module.exports = withNativeWind(config, { input: './src/global.css' });
