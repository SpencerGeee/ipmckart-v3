module.exports = {
  testDir: './__tests__',
  testMatch: ['**/*.test.js'],
  setupFiles: ['./tests/setup.js'],
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    '**/*.js',
    '!**/node_modules/**',
    '!**/__tests__/**',
    '!**/coverage/**',
    '!**/testsprite_tests/**',
    '!**/testsprite.config.js',
  ],
  // Add any additional configuration options here
};
