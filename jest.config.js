/**
 * Jest Configuration
 * Testing configuration for the Posture Monitor Extension
 */

module.exports = {
  // Test environment
  testEnvironment: 'jsdom',

  // Setup files
  setupFilesAfterEnv: ['<rootDir>/tests/helpers/testSetup.js'],

  // Module paths
  roots: ['<rootDir>/src', '<rootDir>/tests'],

  // Test match patterns
  testMatch: [
    '**/tests/**/*.test.js',
    '**/__tests__/**/*.js',
  ],

  // Coverage collection
  collectCoverageFrom: [
    'src/**/*.js',
    '!src/**/detectionWorker.js', // Exclude worker (requires different environment)
    '!src/popup/popup.js', // Exclude UI-specific files
    '!src/options/options.js',
    '!src/background/background.js',
  ],

  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  // Coverage reporters
  coverageReporters: ['text', 'lcov', 'html', 'json-summary'],

  // Coverage directory
  coverageDirectory: '<rootDir>/coverage',

  // Transform files with babel
  transform: {
    '^.+\\.js$': 'babel-jest',
  },

  // Module name mapper (for absolute imports)
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },

  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/coverage/',
  ],

  // Module file extensions
  moduleFileExtensions: ['js', 'json'],

  // Verbose output
  verbose: true,

  // Clear mocks between tests
  clearMocks: true,

  // Restore mocks after tests
  restoreMocks: true,

  // Reset mocks after each test
  resetMocks: true,

  // Test timeout (10 seconds)
  testTimeout: 10000,

  // Max workers (for parallel execution)
  maxWorkers: '50%',

  // Bail after first test failure (disabled for CI)
  bail: false,

  // Show individual test results
  verbose: true,

  // Error on deprecated usage
  errorOnDeprecated: true,
};
