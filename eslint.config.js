const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

/**
 * Gates from the house clean-code standard. Thresholds start at the loose end of the
 * documented ramp (function length 50 → 30 → 20) and tighten as the baseline allows.
 */
module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'src/db/migrations/*', '.expo/*'],
  },
  {
    files: ['src/**/*.{ts,tsx}'],
    rules: {
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      'max-lines': ['warn', { max: 300, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 10],
      'max-depth': ['warn', 3],
      'max-params': ['warn', 3],
      'no-magic-numbers': [
        'warn',
        { ignore: [0, 1, -1], ignoreArrayIndexes: true, enforceConst: true },
      ],
      eqeqeq: ['error', 'smart'],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
    },
  },
  {
    // Tests name their own fixtures; literals there are the point.
    files: ['src/**/*.test.ts'],
    rules: { 'no-magic-numbers': 'off', 'max-lines-per-function': 'off' },
  },
  {
    // Build scripts run on a developer machine, not in the app.
    files: ['scripts/**/*.mts'],
    languageOptions: { parser: require('typescript-eslint').parser },
    rules: {
      'max-lines-per-function': ['warn', { max: 50, skipBlankLines: true, skipComments: true }],
      complexity: ['warn', 10],
      'max-depth': ['warn', 3],
      'max-params': ['warn', 3],
      eqeqeq: ['error', 'smart'],
      // Recipe quantities and nutrient factors are the data; naming each would obscure it.
      'no-magic-numbers': 'off',
      'no-console': 'off',
    },
  },
]);
