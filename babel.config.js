module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    // Drizzle ships migrations as .sql files that are imported as strings at runtime.
    plugins: [['inline-import', { extensions: ['.sql'] }]],
  };
};
