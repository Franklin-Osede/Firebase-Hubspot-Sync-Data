module.exports = {
  testEnvironment: 'node',
  testTimeout: 10000,
  verbose: true,
  setupFilesAfterEnv: ['./jest.setup.js'],
  // Añadir cualquier otra configuración que tengas en tu jest.config.js actual
  testMatch: ['**/src/**/*.test.js'],
  clearMocks: true,
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageProvider: 'v8'
};