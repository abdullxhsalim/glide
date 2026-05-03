module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.js'],
  collectCoverageFrom: [
    'utils/**/*.js',
    'models/**/*.js',
    'controllers/**/*.js',
    'services/**/*.js',
    '!node_modules/**'
  ],
  coveragePathIgnorePatterns: [
    '/node_modules/'
  ],
  testPathIgnorePatterns: [
    '/node_modules/'
  ]
};
