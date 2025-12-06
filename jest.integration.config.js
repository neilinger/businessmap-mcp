import dotenv from 'dotenv';

// Load .env file for integration tests
dotenv.config();

export default {
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: './jest-environment-node-no-localstorage.cjs',
  extensionsToTreatAsEsm: ['.ts'],
  moduleNameMapper: {
    '^(\\.\\.?/.*)\\.js$': '$1',
  },
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: {
          module: 'es2020',
          noImplicitAny: false,
          strict: false,
        },
        diagnostics: false,
      },
    ],
  },
  transformIgnorePatterns: [
    'node_modules/(?!(p-limit|yocto-queue))',
  ],
  testMatch: ['**/test/integration/**/*.test.ts'],
  setupFilesAfterEnv: ['<rootDir>/test/integration/infrastructure/setup.ts'],
  collectCoverageFrom: ['src/**/*.ts'],
  coveragePathIgnorePatterns: ['/node_modules/', '/dist/'],

  // Issue #44: Run integration tests sequentially to reduce API rate limit pressure
  // BusinessMap API has a 30 req/minute limit - parallel tests exhaust this quickly
  maxWorkers: 1,

  // Extend default timeout to 90s to allow for rate-limit retries
  // axios-retry uses retry-after header which can be up to 60 seconds
  testTimeout: 90000,
};
